/* Share the book's pinned Pyodide assets with the Module Assembly lab. */
const vendor = new URL('../module-flight/vendor/', self.location.href);
let boot;

async function digest(bytes) {
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('');
}

async function fetchPart(fetchAsset, part) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetchAsset(new URL(part.path, vendor));
      if (!response.ok) throw new Error('无法下载 Python 资源片段。');
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (bytes.length !== part.bytes || await digest(bytes) !== part.sha256) {
        throw new Error('Python 资源校验失败。');
      }
      return bytes;
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
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
  const response = await fetchAsset(new URL('ASSET_PARTS.json', vendor));
  if (!response.ok) throw new Error('无法加载 Python 资源清单。');
  const { assets } = await response.json();
  const restored = new Map();
  for (const asset of assets) {
    const url = new URL(asset.path, vendor).href;
    const bytes = await assembleAsset(fetchAsset, asset);
    restored.set(url, { bytes, mime: asset.mime });
  }
  self.fetch = (input, options) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, self.location.href);
    const asset = restored.get(url.href);
    if (!asset) return fetchAsset(input, options);
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
import reprlib as _reprlib
import sys as _sys
import time as _time
import traceback as _traceback

_FILENAME = 'uav_log_batch.py'
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

def _run(source, names_json):
    namespace = {'__name__': '__main__', '__builtins__': dict(vars(_builtins))}
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

    result = {'ok': False, 'commands': [], 'values': {}, 'error': None, 'errorType': None, 'line': None}
    try:
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
                    values[name] = {'type': type(value).__name__, 'repr': _represent.repr(value)[:3600]}
            result.update(ok=True, commands=commands, values=values)
    except BaseException as error:
        frames = _traceback.extract_tb(error.__traceback__)
        user_frames = [frame for frame in frames if frame.filename == _FILENAME]
        line = error.lineno if isinstance(error, SyntaxError) else user_frames[-1].lineno if user_frames else None
        result.update(errorType=type(error).__name__, error=str(error)[:1600], line=line)
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
    const json = run(String(data.source), JSON.stringify(data.watch));
    result = JSON.parse(json);
  } catch (error) {
    result = {
      ok: false, output: '', commands: [], values: {}, line: null,
      errorType: 'RuntimeError', error: 'Python 运行环境发生错误。' + String(error?.message || error).slice(0, 500),
    };
  }
  self.postMessage({ kind: 'result', id: data.id, result });
};
