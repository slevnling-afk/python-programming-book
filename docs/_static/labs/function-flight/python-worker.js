/* Real Python 3 (Skulpt), isolated in a new worker for each execution. */
let bootError = null;
try {
  importScripts('./vendor/skulpt.min.js', './vendor/skulpt-stdlib.js');
} catch (error) {
  bootError = error;
}

const GLOBAL_FIELDS = [
  'mission_id', 'uav_id', 'pilot', 'battery_percent', 'gps_satellites', 'is_armed',
  'log', 'logs', 'ok', 'result', 'x', 'ret', 'cost', 'pitch', 'roll', 'yaw', 'height',
  'brief', 'text', 'p', 'd', 'a', 'prefix', 'date_part', 'area', 'battery_start', 'battery_end',
];
const LOCAL_NAMES = '__flight_local_names__';
const IDENTIFIER = /^[A-Za-z_]\w*$/;

// Skulpt's locals() is unimplemented. For these editable lesson statements,
// collect lexically bound parameters and assignments instead. A marker becomes
// one Python expression, preserving both line numbers and normal control flow.
// Bindings inside a sibling/finished conditional are deliberately excluded.
function instrument(source) {
  const lines = source.split('\n');
  const moduleScope = { localNames: new Set(), isModule: true };
  const frames = [{ indent: 0, owner: moduleScope, bindings: new Set() }];
  const markers = [];
  let pending = null;
  let depth = 0;
  let string = null;
  const maskStrings = (line) => {
    let masked = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (string) {
        if (char === '\\') { masked += '  '; i++; continue; }
        if (line.slice(i, i + string.length) === string) {
          masked += ' '.repeat(string.length); i += string.length - 1; string = null;
        } else masked += ' ';
      } else if (char === '#') {
        masked += ' '.repeat(line.length - i); break;
      } else if (char === '"' || char === "'") {
        string = line.slice(i, i + 3) === char.repeat(3) ? char.repeat(3) : char;
        masked += ' '.repeat(string.length); i += string.length - 1;
      } else masked += char;
    }
    // A single-line string cannot continue without a trailing backslash.
    if (string?.length === 1 && !line.endsWith('\\')) string = null;
    return masked;
  };
  const names = (text) => {
    // Parameter defaults and annotations do not create local names.
    const found = [];
    let nesting = 0;
    let part = '';
    const consume = () => {
      const name = part.trim().replace(/^\*{1,2}/, '').split(/[:=]/, 1)[0].trim();
      if (IDENTIFIER.test(name)) found.push(name);
      part = '';
    };
    for (const char of text) {
      if ('([{'.includes(char)) nesting++;
      if (')]}'.includes(char)) nesting--;
      if (char === ',' && nesting === 0) consume();
      else part += char;
    }
    consume();
    return found;
  };
  const assignmentNames = (text) => {
    // Top-level assignment operators only; comparisons/defaults are excluded.
    let nesting = 0;
    let start = 0;
    const bound = [];
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if ('([{'.includes(char)) nesting++;
      if (')]}'.includes(char)) nesting--;
      if (char === '=' && nesting === 0 && !'=<>!:'.includes(text[i - 1] || ' ') && text[i + 1] !== '=') {
        const left = text.slice(start, i).trim().replace(/[+\-*/%&|^]+$/, '').trim();
        if (/^[A-Za-z_\w, ()\[\]:]*$/.test(left)) {
          const flat = left.replace(/[()[\]]/g, '');
          bound.push(...names(flat));
        }
        start = i + 1;
      }
    }
    return bound;
  };
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const marker = /^([\t ]*)#\s*@event\s+([\w-]+)\s*$/.exec(line);
    const wasContinuation = depth > 0 || string !== null;
    const masked = maskStrings(line);
    for (const char of masked) {
      if ('([{'.includes(char)) depth++;
      if (')]}'.includes(char)) depth--;
    }
    if (wasContinuation) continue;
    if (!masked.trim() && !marker) continue;
    const indent = (line.match(/^[\t ]*/)[0] || '').replace(/\t/g, '        ').length;
    while (frames.length > 1 && frames.at(-1).indent > indent) frames.pop();
    if (indent > frames.at(-1).indent) {
      const owner = pending?.functionScope || frames.at(-1).owner;
      frames.push({ indent, owner, bindings: new Set(pending?.bindings || []) });
    }
    const frame = frames.at(-1);
    pending = null;
    if (marker) {
      const bindings = new Map();
      for (const active of frames) {
        for (const name of active.bindings) bindings.set(name, active.owner);
      }
      markers.push({ index, indent: marker[1], type: marker[2], owner: frame.owner, bindings });
      continue;
    }
    const statement = masked.trim();
    const definition = /^def\s+([A-Za-z_]\w*)\s*\((.*)\)\s*(?:->[^:]+)?\s*:/.exec(statement);
    if (definition) {
      frame.bindings.add(definition[1]);
      frame.owner.localNames.add(definition[1]);
      const params = names(definition[2]);
      const functionScope = { localNames: new Set(params), isModule: false };
      pending = { functionScope, bindings: params };
      continue;
    }
    const loop = /^for\s+(.+?)\s+in\s+/.exec(statement);
    if (loop) {
      const bindings = names(loop[1]);
      for (const name of bindings) frame.owner.localNames.add(name);
      pending = { bindings };
      continue;
    }
    const deletion = /^del\s+([A-Za-z_]\w*)\s*$/.exec(statement);
    if (deletion) {
      for (const active of frames) active.bindings.delete(deletion[1]);
      continue;
    }
    for (const name of assignmentNames(statement)) {
      frame.bindings.add(name);
      frame.owner.localNames.add(name);
    }
  }
  for (const marker of markers) {
    const entries = [];
    for (const [name, bindingOwner] of marker.bindings) {
      // A local assigned later shadows an outer/global name from function entry.
      if (!marker.owner.isModule && marker.owner.localNames.has(name) && bindingOwner !== marker.owner) continue;
      entries.push(JSON.stringify(name) + ': ' + name);
    }
    if (!marker.owner.isModule) {
      const locals = [...marker.owner.localNames].map((name) => JSON.stringify(name)).join(', ');
      entries.push(JSON.stringify(LOCAL_NAMES) + ': [' + locals + ']');
    }
    lines[marker.index] = marker.indent + '__flight_event__(' + JSON.stringify(marker.type)
      + ', {' + entries.join(', ') + '}, ' + (marker.index + 1) + ')';
  }
  return lines.join('\n');
}

// Convert only bounded plain lesson data, never functions, modules or instances.
// Direct type handling preserves Python True/False separately from None.
function simpleValue(value, depth = 0, ancestors = new Set()) {
  if (value === undefined || depth > 5) return undefined;
  if (value === Sk.builtin.none.none$) return null;
  const type = value?.tp$name;
  if (type === 'bool') return Boolean(value.v);
  if (type === 'str') return value.v.length <= 10000 ? value.v : value.v.slice(0, 10000) + '…';
  if (type === 'int' || type === 'float') {
    const number = Number(value.v);
    return Number.isFinite(number) ? number : undefined;
  }
  if (ancestors.has(value)) return undefined;
  const next = new Set(ancestors).add(value);
  if (type === 'tuple' || type === 'list') {
    if (value.v.length > 100) return undefined;
    const result = [];
    for (const child of value.v) {
      const mapped = simpleValue(child, depth + 1, next);
      if (mapped === undefined) return undefined;
      result.push(mapped);
    }
    return result;
  }
  if (type === 'dict') {
    const items = value.$items();
    if (items.length > 100) return undefined;
    const result = {};
    for (const [key, child] of items) {
      if (key.tp$name !== 'str') return undefined;
      if (['__proto__', 'prototype', 'constructor'].includes(key.v)) continue;
      const mapped = simpleValue(child, depth + 1, next);
      if (mapped === undefined) return undefined;
      result[key.v] = mapped;
    }
    return result;
  }
  return undefined;
}

function telemetry(name, localDict, line) {
  const scope = {};
  const types = {};
  const locals = localDict?.tp$name === 'dict' ? localDict.$items() : [];
  const blocked = new Set();
  const present = new Set();
  for (const [key, value] of locals) {
    if (key.v === LOCAL_NAMES) {
      for (const local of value.v || []) blocked.add(local.v);
    } else present.add(key.v);
  }
  const add = (key, value) => {
    if (!IDENTIFIER.test(key) || key.startsWith('__')) return;
    const mapped = simpleValue(value);
    if (mapped !== undefined) {
      scope[key] = mapped;
      types[key] = value.tp$name;
    }
  };
  for (const key of GLOBAL_FIELDS) {
    if (!blocked.has(key) && !present.has(key)) add(key, Sk.globals?.[key]);
  }
  for (const [key, value] of locals) add(key.v, value);
  return { type: name.v, scope, types, line: Number(line?.v) || null };
}

self.onmessage = async ({ data }) => {
  if (bootError) {
    self.postMessage({ kind: 'done', ok: false, error: 'Python 运行库加载失败：' + bootError.message, errorType: 'RuntimeLoadError' });
    return;
  }
  let outputLength = 0;
  let eventCount = 0;
  Sk.configure({
    __future__: Sk.python3,
    execLimit: 3000,
    yieldLimit: 50,
    killableWhile: true,
    killableFor: true,
    output(text) {
      outputLength += text.length;
      if (outputLength > 100000) throw new Sk.builtin.RuntimeError('输出过多，已停止本次执行。请检查循环。');
      self.postMessage({ kind: 'output', text });
    },
    read(path) {
      if (Sk.builtinFiles?.files[path] !== undefined) return Sk.builtinFiles.files[path];
      throw new Error('无法读取 Python 模块：' + path);
    },
    inputfun() { throw new Sk.builtin.RuntimeError('请直接填写左侧代码空格，本实验不使用 input()。'); },
    inputfunTakesPrompt: true,
  });
  Sk.builtins.__flight_event__ = new Sk.builtin.func(function (name, locals, line) {
    if (++eventCount > 2000) throw new Sk.builtin.RuntimeError('演示事件过多，请检查循环。');
    self.postMessage({ kind: 'event', event: telemetry(name, locals, line) });
    return Sk.builtin.none.none$;
  });
  try {
    await Sk.misceval.asyncToPromise(() => Sk.importMainWithBody('<stdin>', false, instrument(String(data.code)), true));
    self.postMessage({ kind: 'done', ok: true, error: null, errorType: null });
  } catch (error) {
    let description;
    try { description = error.toString(); } catch { description = String(error); }
    let errorType = error.tp$name || error.name || 'RuntimeError';
    if (/^(TimeLimitError|TimeoutError)/.test(description)) errorType = 'TimeLimitError';
    self.postMessage({ kind: 'done', ok: false, error: description, errorType });
  }
};
