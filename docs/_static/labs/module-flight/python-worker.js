/* Pinned real CPython, entirely served by this repository. No fabricated libs. */
const ROOT = '/home/pyodide/flight_project';
let messages = 0, outputLength = 0;
const post = data => { if (++messages > 2500) throw new Error('执行记录过多，请缩短循环。'); self.postMessage(data); };
function output(text) {
  if (outputLength > 30000) return;
  const bounded = String(text).slice(0,30000-outputLength); outputLength += bounded.length;
  post({kind:'output',text:bounded});
}
const status = (stage,message) => post({kind:'status',stage,message});
function validPath(path) {
  return typeof path === 'string' && path.length < 180 && !path.startsWith('/') && !path.includes('\\') && path.split('/').every(part => /^[A-Za-z_][\w.-]*$/.test(part) && part !== '..');
}
function instrument(source,path) {
  return source.split('\n').map((line,index) => {
    const marker = /^(\s*)#\s*@event\s+([\w-]+)\s*$/.exec(line);
    return marker ? marker[1]+'__flight_event__('+JSON.stringify(marker[2])+', globals(), locals(), '+JSON.stringify(path)+', '+(index+1)+')' : line;
  }).join('\n');
}

const SETUP = String.raw`
import builtins as _b, json as _json, sys as _sys, time as _time, types as _types, inspect as _inspect, traceback as _tb
_PROJECT = '/home/pyodide/flight_project'
_event_count = 0
_imports = []
_watched = {'math','random','geopy','geographiclib'}
_original_import = _b.__import__
# Remove bootstrap-only standard-module cache entries from the isolated lesson.
# User imports below then perform real import/cache behavior inside this run.
for _std in ('math','random'):
    _sys.modules.pop(_std,None)

def _simple(value, depth=0):
    if depth > 4: return '<深层数据>'
    if value is None or type(value) in (bool,int,float,str):
        return value[:2000] if isinstance(value,str) else value
    if isinstance(value,_types.ModuleType): return {'__kind__':'module','name':value.__name__}
    if callable(value): return {'__kind__':'function','name':getattr(value,'__name__','function'),'module':getattr(value,'__module__','')}
    if type(value) in (tuple,list,set): return [_simple(item,depth+1) for item in list(value)[:50]]
    if type(value) is dict: return {str(k):_simple(v,depth+1) for k,v in list(value.items())[:50]}
    return repr(value)[:200]

def _snapshot(mapping):
    return {k:_simple(v) for k,v in mapping.items() if not k.startswith('_') and k not in ('__builtins__',)}

def _event(kind,g,l,path,line):
    global _event_count
    _event_count += 1
    if _event_count > 350: raise RuntimeError('执行记录超过350条，请缩短循环。')
    f = _sys._getframe(1)
    free = set(f.f_code.co_freevars)
    local = {k:v for k,v in l.items() if k not in free} if l is not g else {}
    enclosing = {k:l[k] for k in free if k in l}
    flat = dict(g); flat.update(l)
    for k in f.f_code.co_varnames:
        if k not in l: flat.pop(k,None)
    visible = _snapshot(flat)
    kinds = {k:('enclosing' if k in free else 'local' if l is not g and k in l else 'global') for k in visible}
    event = {'type':kind,'file':path,'line':line,'functionName':'' if f.f_code.co_name=='<module>' else f.f_code.co_name,
        'scope':visible,'types':{k:type(flat[k]).__name__ for k in visible},'scopeKinds':kinds,
        'scopeValues':{'global':_snapshot(g),'enclosing':_snapshot(enclosing),'local':_snapshot(local)},
        'parameterNames':list(f.f_code.co_varnames[:f.f_code.co_argcount])}
    _flight_emit(_json.dumps(event,ensure_ascii=False))

def _relative(path):
    return path[len(_PROJECT)+1:] if path.startswith(_PROJECT+'/') else path

def _tracked_import(name,globals=None,locals=None,fromlist=(),level=0):
    caller = globals.get('__file__','') if globals else ''
    requested = name.split('.')[0] if name else ''
    tracked = caller.startswith(_PROJECT+'/') and (requested in _watched or requested=='uav_toolkit' or requested in _project_roots)
    if level and caller.startswith(_PROJECT+'/'): tracked=True
    cached = name in _sys.modules
    result = _original_import(name,globals,locals,fromlist,level)
    if tracked:
        f = _sys._getframe(1)
        module = _sys.modules.get(name,result)
        path = getattr(module,'__file__','') or (name+' (标准库)')
        event = {'type':'import','name':name,'file':_relative(path),'caller':_relative(caller),'line':f.f_lineno,'cached':cached,
                 'members':list(fromlist) if fromlist else [],'level':level}
        _imports.append(event);_flight_emit(_json.dumps(event,ensure_ascii=False))
    return result

_b.__flight_event__ = _event
_b.__import__ = _tracked_import
_deadline = 0
_steps = 0
class FlightTimeLimitError(RuntimeError): pass
def _trace(frame,event,arg):
    global _steps
    if frame.f_code.co_filename.startswith(_PROJECT+'/'):
        _steps += 1
        if _steps > 120000 or _time.perf_counter() > _deadline: raise FlightTimeLimitError('运行超过3秒，或步骤过多；请检查循环是否终止。')
    return _trace
`;

self.onmessage = async ({data}) => {
  let pyodide;
  try {
    status('loading','正在加载本页内置 Python 环境；首次约 14 MB，后续可由浏览器缓存。');
    importScripts('./asset-loader.js');
    await installFlightAssetLoader();
    importScripts('./vendor/pyodide/pyodide.js');
    pyodide = await loadPyodide({indexURL:new URL('./vendor/pyodide/',self.location.href).href,stdout:text=>output(text+'\n'),stderr:text=>output(text+'\n')});
    pyodide.registerJsModule('flight_bridge',{emit:json=>post({kind:'event',event:JSON.parse(json)})});
    pyodide.runPython('from flight_bridge import emit as _flight_emit');
    let files = Array.isArray(data.files) ? Object.fromEntries(data.files.map(file=>[file.path,file.code])) : {...(data.files||{})};
    const entry = data.entry || 'main.py';
    if (!validPath(entry) || !entry.endsWith('.py')) throw new Error('主程序路径必须是工程内的 .py 文件。');
    files[entry] = String(data.code||'');
    if (Object.keys(files).length > 24) throw new Error('每次最多运行24个工程文件。');
    pyodide.FS.mkdirTree(ROOT); pyodide.FS.chdir(ROOT);
    for (const [path,source] of Object.entries(files)) {
      if (!validPath(path)) throw new Error('工程文件路径无效：'+path);
      if (String(source).length > 50000) throw new Error('单个文件超过50000字符。');
      const full=ROOT+'/'+path,folder=full.slice(0,full.lastIndexOf('/'));
      pyodide.FS.mkdirTree(folder);pyodide.FS.writeFile(full,path.endsWith('.py')?instrument(String(source),path):String(source),{encoding:'utf8'});
    }
    pyodide.globals.set('_entry',entry);
    pyodide.globals.set('_project_roots',new Set(Object.keys(files).map(path=>path.split('/')[0].replace(/\.py$/,''))));
    if (data.installCommand !== null && data.installCommand !== undefined && String(data.installCommand).trim()) {
      pyodide.globals.set('_install_command',String(data.installCommand));
      try {
        pyodide.runPython(String.raw`
import shlex as _shlex
_parts = _shlex.split(_install_command)
if _parts[:4] == ['python','-m','pip','install']: _specs = _parts[4:]
elif _parts[:2] == ['pip','install']: _specs = _parts[2:]
else: raise ValueError('安装命令应为 python -m pip install geopy 或 pip install geopy。')
if _specs not in (['geopy'],['geopy==2.4.1']): raise ValueError('本页离线环境提供 geopy==2.4.1；请填写 geopy 或 geopy==2.4.1。')
`);
      } catch (error) { post({kind:'done',result:{ok:false,errorType:'CommandError',error:'安装命令未通过解析：'+error.message,modules:[]}});return; }
      status('installing','正在把真实 geopy wheel 安装到本页 Python 环境。');
      post({kind:'event',event:{type:'install',name:'geopy',stage:'start',command:String(data.installCommand),file:'terminal',line:1}});
      await pyodide.loadPackage(['packaging','micropip','ssl']);
      const base=new URL('./vendor/wheels/',self.location.href).href;
      pyodide.globals.set('_wheel_urls',[base+'geographiclib-2.0-py3-none-any.whl',base+'geopy-2.4.1-py3-none-any.whl']);
      await pyodide.runPythonAsync('import micropip\nawait micropip.install(list(_wheel_urls), deps=False)');
      post({kind:'event',event:{type:'install',name:'geopy',version:'2.4.1',stage:'complete',file:'terminal',line:1}});
    }
    pyodide.runPython(SETUP);
    status('running','正在执行当前多文件 Python 工程。');
    const resultText = pyodide.runPython(String.raw`
_sys.path.insert(0,_PROJECT)
_globals = {'__name__':'__main__','__file__':_PROJECT+'/'+_entry}
_deadline = _time.perf_counter()+3.0
_failure = None
try:
    _sys.settrace(_trace)
    with open(_PROJECT+'/'+_entry,encoding='utf-8') as _f: _source = _f.read()
    exec(compile(_source,_PROJECT+'/'+_entry,'exec'),_globals,_globals)
except BaseException as _exc:
    _sys.settrace(None)
    _frames = _tb.extract_tb(_exc.__traceback__)
    _user_frames = [f for f in _frames if f.filename.startswith(_PROJECT+'/')]
    _last = _user_frames[-1] if _user_frames else None
    if isinstance(_exc,SyntaxError):
        _err_file = _relative(_exc.filename or _entry); _err_line = _exc.lineno
    else:
        _err_file = _relative(_last.filename) if _last else _entry; _err_line = _last.lineno if _last else None
    _failure = {'ok':False,'errorType':type(_exc).__name__,'error':type(_exc).__name__+': '+str(_exc),'file':_err_file,'line':_err_line}
finally:
    _sys.settrace(None)
_modules = []
_requested_roots = {item['name'].split('.')[0] for item in _imports if item['name']}
for _name,_mod in list(_sys.modules.items()):
    _path = getattr(_mod,'__file__','') or ''
    if _path.startswith(_PROJECT+'/') or (_name in _watched and _name in _requested_roots):
        _modules.append({'name':_name,'file':_relative(_path),'version':getattr(_mod,'__version__',None)})
_answer = _failure or {'ok':True,'error':None,'errorType':None}
_answer.update(modules=_modules,imports=_imports)
_json.dumps(_answer,ensure_ascii=False)
`);
    post({kind:'done',result:JSON.parse(resultText)});
  } catch (error) {
    post({kind:'done',result:{ok:false,errorType:'RuntimeError',error:'Python 环境错误：'+String(error?.message||error),modules:[]}});
  }
};
