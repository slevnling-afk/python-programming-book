/* Run with Node >= 20: node tests/blackbox-flight-runtime.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const docs = path.resolve(__dirname, '../docs');
const labs = path.join(docs, '_static/labs');
const origin = 'https://blackbox-test.invalid';

async function loadModule(file) {
  const source = await fs.readFile(path.join(labs, file));
  return import('data:text/javascript;base64,' + source.toString('base64'));
}

async function startWorker(temp) {
  const messages = [];
  const context = vm.createContext({ URL, Response, TextEncoder, AbortSignal, crypto: webcrypto, console });
  context.self = context;
  context.location = new URL('/_static/labs/file-read-flight/python-worker.js', origin);
  context.postMessage = message => messages.push(structuredClone(message));
  context.fetch = async (input, options) => {
    const url = new URL(input, context.location);
    assert.equal(url.origin, origin, 'Runtime resources must stay on the book site');
    assert.ok(options?.signal, 'Asset fetch must have a timeout');
    return new Response(await fs.readFile(path.join(docs, decodeURIComponent(url.pathname))));
  };
  context.importScripts = source => {
    assert.equal(new URL(source).origin, origin);
    context.loadPyodide = async ({ indexURL }) => {
      await fs.writeFile(path.join(temp, 'package.json'), '{"type":"commonjs"}');
      const assets = ['pyodide.js', 'pyodide-lock.json', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip'];
      for (const asset of assets) {
        const response = await context.fetch(new URL(asset, indexURL));
        await fs.writeFile(path.join(temp, asset), Buffer.from(await response.arrayBuffer()));
      }
      return require(path.join(temp, 'pyodide.js')).loadPyodide({ indexURL: temp });
    };
  };
  vm.runInContext(await fs.readFile(path.join(labs, 'file-read-flight/python-worker.js'), 'utf8'), context);
  await context.onmessage({ data: { kind: 'warm' } });
  const boot = messages.pop();
  assert.equal(boot?.kind, 'ready', boot?.message);

  let id = 0;
  return async (source, watch = [], files = {}, captureFiles = true) => {
    await context.onmessage({ data: { kind: 'run', id: ++id, source, watch, files, captureFiles } });
    const message = messages.pop();
    assert.equal(message?.kind, 'result');
    assert.equal(message.id, id);
    return message.result;
  };
}

const ok = (result, label = '') => assert.equal(result.ok, true, label + ' ' + result.error);
const bytes = raw => ({ bytes: Array.from(raw, value => value), size: raw.length, truncated: false });

async function verify(temp) {
  const run = await startWorker(temp);
  const chinese = '北岸';
  const packet = Uint8Array.of(3, 8, 15, 22);
  const files = { 'logs/source-gbk.txt': Uint8Array.of(0xb1, 0xb1, 0xb0, 0xb6), 'packet.bin': packet };
  let result = await run(String.raw`
with open("logs/source-gbk.txt", "r", encoding="gbk") as f:
    text = f.read()
with open("converted.txt", "w", encoding="utf-8-sig") as f:
    f.write(text)
with open("converted.txt", "r", encoding="utf-8-sig") as f:
    restored = f.read()
with open("packet.bin", "rb") as f:
    first = f.read(1)
    offset = f.tell()
    f.seek(1, 1)
    second = f.read(1)
    f.seek(-1, 2)
    final = f.read()
with open("backup.bin", "wb") as f:
    f.write(first + second)
with open("backup.bin", "ab") as f:
    f.write(final)
with open("backup.bin", "rb") as f:
    replay = list(f.read())`, ['text', 'restored', 'replay', 'offset'], files);
  ok(result);
  assert.deepEqual(result.values, {
    text: { type: 'str', repr: "'" + chinese + "'" },
    restored: { type: 'str', repr: "'" + chinese + "'" },
    replay: { type: 'list', repr: '[3, 15, 22]' },
    offset: { type: 'int', repr: '1' },
  });
  assert.deepEqual(result.fileSnapshots, {
    'logs/source-gbk.txt': bytes(files['logs/source-gbk.txt']),
    'packet.bin': bytes(packet),
    'converted.txt': bytes([0xef, 0xbb, 0xbf, ...new TextEncoder().encode(chinese)]),
    'backup.bin': bytes([3, 15, 22]),
  });
  assert.deepEqual(result.fileEvents.filter(event => ['tell', 'seek'].includes(event.operation))
    .map(({ operation, before, after }) => [operation, before, after]), [['tell', 1, 1], ['seek', 1, 2], ['seek', 3, 3]]);

  result = await run('f = open("backup.bin", "wb")\nf.write(b"x" * 300)\nraise ValueError("stop")');
  assert.deepEqual([result.ok, result.errorType], [false, 'ValueError']);
  assert.deepEqual(result.fileSnapshots['backup.bin'], { bytes: Array(256).fill(120), size: 300, truncated: true });
  assert.deepEqual(result.fileEvents.map(event => event.operation), ['open', 'write', 'cleanup']);

  result = await run(String.raw`
import os
os.symlink("/dev", "outside")
os.symlink("packet.bin", "inside")
assert not os.path.exists("backup.bin")
print(open("packet.bin", "rb").read())`, [], files);
  ok(result);
  assert.deepEqual(Object.keys(result.fileSnapshots).sort(), ['logs/source-gbk.txt', 'packet.bin']);

  result = await run('with open("packet.bin", "rb") as f:\n    position = f.tell()', ['position'], files, false);
  ok(result);
  assert.equal(result.fileSnapshots, undefined);
  assert.deepEqual(result.fileEvents.map(event => event.operation), ['open', 'close']);

  result = await run('print(42)', [], { '../invalid': 'outside' });
  assert.equal(result.errorType, 'ValueError');
  assert.deepEqual(result.fileSnapshots, {});

  await verifyLessons(run);
}

async function verifyLessons(run) {
  const { lessons } = await loadModule('blackbox-flight/lessons.js');
  const { buildFlightPlan } = await loadModule('parameter-flight/drone.js');
  let cases = 0;
  let checkpoints = 0;
  const actions = new Set();
  for (const lesson of lessons) {
    const answers = Object.fromEntries(lesson.blanks.map(blank => [blank.id, blank.answer]));
    for (const { label, files } of lesson.scenarios) {
      const variations = [{}, ...lesson.blanks.filter(blank => blank.numeric)
        .flatMap(blank => blank.numeric.map(value => ({ [blank.id]: String(value) })))];
      for (const variation of variations) {
        const source = lesson.code.replace(/\{\{(\w+)\}\}/g, (_, id) => variation[id] ?? answers[id]);
        const key = [lesson.id, label, JSON.stringify(variation)].join(' / ');
        const result = await run(source, lesson.watch, files);
        ok(result, key);
        assert.doesNotThrow(() => buildFlightPlan(result.commands), key);
        assert.deepEqual(Object.keys(result.values), lesson.watch, key);
        assert.ok(result.fileEvents.length, key + ': no actual file operations');
        assert.ok(Object.keys(result.fileSnapshots).length, key + ': no virtual files captured');
        result.commands.forEach(command => actions.add(command.action));
        cases++;

        if (Object.keys(variation).length) continue;
        const stages = source.split(/^[ \t]*#[ \t]*@stage\b.*$/m).filter(stage => stage.trim());
        for (let end = 1; end < stages.length; end++) {
          const result = await run(stages.slice(0, end).join('\n'), lesson.watch, files);
          ok(result, key + ' stage ' + end);
          assert.doesNotThrow(() => buildFlightPlan(result.commands), key + ' stage ' + end);
          checkpoints++;
        }
      }
    }
  }
  for (const action of ['altitude', 'spin', 'figure8', 'move', 'return']) assert.ok(actions.has(action), action);
  console.log('Embedded CPython passed GBK/BOM, byte positioning, write/append, snapshot and isolation checks, ' +
    cases + ' full lesson cases and ' + checkpoints + ' stage previews.');
}

(async () => {
  const parent = await fs.realpath(os.tmpdir());
  const temp = await fs.mkdtemp(path.join(parent, 'blackbox-flight-'));
  try { await verify(temp); }
  finally {
    const resolved = await fs.realpath(temp);
    if (path.dirname(resolved) === parent && path.basename(resolved).startsWith('blackbox-flight-')) {
      await fs.rm(resolved, { recursive: true, force: true });
    }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
