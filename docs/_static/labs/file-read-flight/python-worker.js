/* Share the book's pinned Pyodide assets with the Module Assembly lab. */
const vendor = new URL('../module-flight/vendor/', self.location.href);
let boot;

async function digest(bytes) {
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function fetchAssetBody(fetchAsset, path, read) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetchAsset(new URL(path, vendor), {
        signal: AbortSignal.timeout(16000),
        cache: attempt ? 'reload' : 'default',
      });
      if (!response.ok) throw new Error('无法下载 Python 资源。');
      return await read(response);
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
}

function fetchPart(fetchAsset, part) {
  return fetchAssetBody(fetchAsset, part.path, async response => {
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.length !== part.bytes || await digest(bytes) !== part.sha256) {
      throw new Error('Python 资源校验失败。');
    }
    return bytes;
  });
}

async function assembleAsset(fetchAsset, asset) {
  const buffer = new Uint8Array(asset.bytes);
  let size = 0;
  const offsets = asset.parts.map(part => {
    const offset = size;
    size += part.bytes;
    return offset;
  });
  if (size !== buffer.length) throw new Error('Python 资源清单长度不一致。');
  let nextPart = 0;
  const download = async () => {
    while (nextPart < asset.parts.length) {
      const index = nextPart++;
      const bytes = await fetchPart(fetchAsset, asset.parts[index]);
      buffer.set(bytes, offsets[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(4, asset.parts.length) }, download));
  if (await digest(buffer) !== asset.sha256) throw new Error('Python 运行资源校验失败。');
  return buffer;
}

async function loadRuntime() {
  const fetchAsset = self.fetch.bind(self);
  const { assets } = await fetchAssetBody(fetchAsset, 'ASSET_PARTS.json', response => response.json());
  const restored = new Map();
  for (const asset of assets) {
    const url = new URL(asset.path, vendor).href;
    const bytes = await assembleAsset(fetchAsset, asset);
    restored.set(url, { bytes, mime: asset.mime });
  }
  self.fetch = (input, options) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, self.location.href);
    const asset = restored.get(url.href);
    if (!asset) {
      const timeout = AbortSignal.timeout(16000);
      const signal = options?.signal || input?.signal;
      return fetchAsset(input, { ...options, signal: signal ? AbortSignal.any([signal, timeout]) : timeout });
    }
    return Promise.resolve(new Response(asset.bytes, { headers: {
      'Content-Type': asset.mime, 'Content-Length': String(asset.bytes.length),
    } }));
  };
  importScripts(new URL('pyodide/pyodide.js', vendor).href);
  try {
    const python = await self.loadPyodide({ indexURL: new URL('pyodide/', vendor).href });
    return python.runPython(SETUP);
  } finally {
    // Once loaded, the interpreter owns its resources. Drop the extra copies.
    self.fetch = fetchAsset;
  }
}

const SETUP = String.raw`
import builtins as _builtins
from contextlib import redirect_stdout as _redirect_stdout, redirect_stderr as _redirect_stderr
import json as _json
import math as _math
import os as _os
import reprlib as _reprlib
import shutil as _shutil
import sys as _sys
import time as _time
import traceback as _traceback

_FILENAME = 'uav_log_reader.py'
_ROOT = '/flight-lab'
_OPEN = _builtins.open
_represent = _reprlib.Repr(maxlevel=5, maxlist=40, maxtuple=40, maxdict=40,
                            maxset=40, maxfrozenset=40, maxstring=380, maxother=480)

class TimeLimitError(RuntimeError):
    pass

class _Output:
    def __init__(self):
        self.parts = []
        self.remaining = 24000
        self.truncated = False

    def write(self, value):
        if self.remaining:
            text = value[:self.remaining]
            self.parts.append(text)
            self.remaining -= len(text)
        else:
            text = ''
        if len(value) > len(text):
            self.truncated = True
        return len(value)

    def flush(self):
        pass

    def text(self):
        result = ''.join(self.parts)
        return result + '\n… 输出过长，已省略其余内容。' if self.truncated else result

def _command_data(commands):
    if type(commands) is not list or len(commands) > 60:
        raise ValueError('commands 应为最多 60 个动作字典组成的列表。')
    if any(type(item) is not dict or type(item.get('action')) is not str for item in commands):
        raise ValueError('commands 中每项都应为带有 action 字符串的字典。')
    budget = 8000

    def plain(value, depth=0):
        nonlocal budget
        budget -= 1
        if budget < 0 or depth > 7:
            raise ValueError('指令数据过多或嵌套过深。')
        kind = type(value)
        if value is None or kind is bool:
            return value
        if kind is int and abs(value) <= 9007199254740991:
            return value
        if kind is float and _math.isfinite(value):
            return value
        if kind is str and len(value) <= 600:
            return value
        if kind in (list, tuple) and len(value) <= 100:
            return [plain(item, depth + 1) for item in value]
        if kind is dict and len(value) <= 50 and all(type(key) is str and len(key) <= 80 for key in value):
            return {key: plain(item, depth + 1) for key, item in value.items()}
        raise ValueError('指令仅支持有限数值、短文本、布尔值及其列表、元组或字典。')

    return plain(commands)

def _clear_workspace():
    _os.chdir('/')
    if _os.path.islink(_ROOT):
        _os.unlink(_ROOT)
    elif _os.path.isdir(_ROOT):
        _shutil.rmtree(_ROOT)
    elif _os.path.exists(_ROOT):
        _os.unlink(_ROOT)

def _mount_fixtures(fixture_json):
    _clear_workspace()
    _os.makedirs(_ROOT)
    _os.chdir(_ROOT)
    for name, payload, binary in _json.loads(fixture_json):
        if not name or any(part in ('', '.', '..') for part in name.split('/')):
            raise ValueError('练习文件必须使用工作区内的相对路径。')
        parent = _os.path.dirname(name)
        if parent:
            _os.makedirs(parent, exist_ok=True)
        data = bytes(payload) if binary else payload.encode('utf-8')
        with _OPEN(name, 'wb') as handle:
            handle.write(data)

def _caller_line():
    frame = _sys._getframe(1)
    while frame is not None:
        if frame.f_code.co_filename == _FILENAME:
            return frame.f_lineno
        frame = frame.f_back
    return None

class _TrackedFile:
    """Delegate to a real Python file while recording the operations used in the lab."""

    def __init__(self, handle, path, emit):
        self._handle = handle
        self._path = path
        self._mode = handle.mode
        self._emit = emit

    def __getattr__(self, name):
        return getattr(self._handle, name)

    def _position(self):
        try:
            position = self._handle.tell()
            return position if 0 <= position <= 9007199254740991 else None
        except (OSError, ValueError):
            # CPython can disable tell() mid-iteration over a text stream.
            return None

    def _record(self, operation, before=None, after=None, count=None, unit=None, error=None):
        self._emit(operation, self._path, self._mode, before, after, count, unit, error)

    def _do(self, operation, *args, **kwargs):
        before = self._position()
        try:
            result = (next(self._handle) if operation == 'iterate' else
                      getattr(self._handle, operation)(*args, **kwargs))
        except StopIteration:
            self._record(operation, before, self._position(), 0,
                         'bytes' if 'b' in self._mode else 'chars')
            raise
        except Exception as error:
            self._record(operation, before, self._position(), error=type(error).__name__)
            raise
        if operation == 'readlines':
            count, unit = len(result), 'lines'
        elif operation in ('read', 'readline', 'iterate'):
            count, unit = len(result), 'bytes' if isinstance(result, bytes) else 'chars'
        elif operation == 'write':
            count, unit = result, 'bytes' if 'b' in self._mode else 'chars'
        else:
            count, unit = None, None
        self._record(operation, before, self._position(), count, unit)
        return result

    def read(self, *args, **kwargs):
        return self._do('read', *args, **kwargs)

    def readline(self, *args, **kwargs):
        return self._do('readline', *args, **kwargs)

    def readlines(self, *args, **kwargs):
        return self._do('readlines', *args, **kwargs)

    def write(self, *args, **kwargs):
        return self._do('write', *args, **kwargs)

    def writelines(self, *args, **kwargs):
        return self._do('writelines', *args, **kwargs)

    def seek(self, *args, **kwargs):
        return self._do('seek', *args, **kwargs)

    def close(self):
        if not self._handle.closed:
            before = self._position()
            try:
                self._handle.close()
            except Exception as error:
                self._record('close', before, error=type(error).__name__)
                raise
            self._record('close', before)

    def __enter__(self):
        self._handle.__enter__()
        return self

    def __exit__(self, *exc):
        return self.close()

    def __iter__(self):
        return self

    def __next__(self):
        return self._do('iterate')

def _run(source, names_json, fixture_json):
    file_events = []
    handles = []

    def emit(operation, path, mode, before=None, after=None, count=None, unit=None, error=None):
        if len(file_events) < 120:
            event = {'operation': operation, 'path': path, 'mode': mode, 'line': _caller_line(),
                     'before': before, 'after': after, 'count': count, 'unit': unit}
            if error is not None:
                event['error'] = error
            file_events.append(event)

    def tracked_open(file, mode='r', *args, **kwargs):
        name = _os.fsdecode(_os.fspath(file))
        try:
            resolved = _os.path.realpath(name)
            if not resolved.startswith(_ROOT + '/') or kwargs.get('opener') is not None:
                raise PermissionError('请在虚拟飞行工作区 /flight-lab 中打开练习文件。')
            handle = _OPEN(file, mode, *args, **kwargs)
        except Exception as error:
            emit('open', name, str(mode), error=type(error).__name__)
            raise
        tracked = _TrackedFile(handle, name, emit)
        handles.append(tracked)
        emit('open', name, mode, after=tracked._position())
        return tracked

    builtins = dict(vars(_builtins))
    builtins['open'] = tracked_open
    namespace = {'__name__': '__main__', '__builtins__': builtins}
    output = _Output()
    deadline = _time.perf_counter() + 3.0
    steps = 0

    def trace(frame, event, arg):
        nonlocal steps
        if frame.f_code.co_filename != _FILENAME:
            return None
        steps += 1
        if steps > 120000 or _time.perf_counter() > deadline:
            raise TimeLimitError('执行步骤过多或超过 3 秒，请检查循环或数据量。')
        return trace

    result = {'ok': False, 'commands': [], 'values': {}, 'fileEvents': file_events,
              'error': None, 'errorType': None, 'line': None}
    try:
        _mount_fixtures(fixture_json)
        with _redirect_stdout(output), _redirect_stderr(output):
            try:
                _sys.settrace(trace)
                exec(compile(source, _FILENAME, 'exec', dont_inherit=True), namespace, namespace)
            finally:
                _sys.settrace(None)
            commands = _command_data(namespace.get('commands', []))
            values = {}
            for name in _json.loads(names_json):
                if name in namespace:
                    value = namespace[name]
                    if type(value) is _TrackedFile:
                        value = value._handle
                    values[name] = {'type': type(value).__name__, 'repr': _represent.repr(value)[:3600]}
            result.update(ok=True, commands=commands, values=values)
    except BaseException as error:
        frames = _traceback.extract_tb(error.__traceback__)
        user_frames = [frame for frame in frames if frame.filename == _FILENAME]
        line = error.lineno if isinstance(error, SyntaxError) else user_frames[-1].lineno if user_frames else None
        result.update(errorType=type(error).__name__, error=str(error)[:1600], line=line)
    finally:
        for tracked in handles:
            if not tracked.closed:
                # Keep this distinct from a learner's close() or a with block.
                try:
                    tracked._handle.close()
                    emit('cleanup', tracked._path, tracked._mode)
                except OSError:
                    pass
        _clear_workspace()
    result['output'] = output.text()
    return _json.dumps(result, ensure_ascii=False, allow_nan=False)

_run
`;

self.onmessage = async ({ data }) => {
  if (data.kind === 'warm') {
    try {
      boot ??= loadRuntime();
      await boot;
      self.postMessage({ kind: 'ready' });
    } catch (error) {
      self.postMessage({ kind: 'boot-error', message: 'Python 环境启动失败。' + String(error?.message || error) });
    }
    return;
  }
  if (data.kind !== 'run') return;
  let result;
  try {
    const run = await boot;
    let files;
    try {
      files = serializeFiles(data.files || {});
    } catch (error) {
      self.postMessage({
        kind: 'result', id: data.id, result: {
          ok: false, output: '', commands: [], values: {}, fileEvents: [], line: null,
          errorType: 'ValueError', error: error.message,
        },
      });
      return;
    }
    const json = run(String(data.source), JSON.stringify(data.watch), files);
    result = JSON.parse(json);
  } catch (error) {
    result = {
      ok: false, output: '', commands: [], values: {}, fileEvents: [], line: null,
      errorType: 'RuntimeError', error: 'Python 运行环境发生错误。' + String(error?.message || error).slice(0, 500),
    };
  }
  self.postMessage({ kind: 'result', id: data.id, result });
};

function serializeFiles(files) {
  if (typeof files !== 'object' || Array.isArray(files)) throw new TypeError('练习文件应由路径和内容组成。');
  const entries = Object.entries(files);
  if (entries.length > 32) throw new RangeError('单次运行最多可载入 32 个练习文件。');
  let bytes = 0;
  return JSON.stringify(entries.map(([name, contents]) => {
    if (name.length > 160 || /[\\:\0]/.test(name) || name.split('/').some(part => !part || part === '.' || part === '..')) {
      throw new TypeError('练习文件应使用工作区内的相对路径。');
    }
    const binary = ArrayBuffer.isView(contents) && Object.prototype.toString.call(contents) === '[object Uint8Array]';
    if (!binary && typeof contents !== 'string') throw new TypeError('练习文件内容必须为文本或字节数据。');
    bytes += binary ? contents.byteLength : new TextEncoder().encode(contents).byteLength;
    if (bytes > 262144) throw new RangeError('单次运行的练习文件合计不能超过 256 KB。');
    return [name, binary ? Array.from(contents) : contents, binary];
  }));
}
