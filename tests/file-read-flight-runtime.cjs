/* Run with Node >= 20: node tests/file-read-flight-runtime.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const docs = path.resolve(__dirname, '../docs');
const lab = path.join(docs, '_static/labs/file-read-flight');
const origin = 'https://files-test.invalid';

async function loadModule(file) {
  const source = await fs.readFile(file);
  return import('data:text/javascript;base64,' + source.toString('base64'));
}

async function verify(temp) {
  const messages = [];
  const context = vm.createContext({ URL, Response, TextEncoder, AbortSignal, crypto: webcrypto, console });
  context.self = context;
  context.location = new URL('/_static/labs/file-read-flight/python-worker.js', origin);
  context.postMessage = message => messages.push(structuredClone(message));
  let retried = false;
  context.fetch = async (input, options) => {
    const url = new URL(input, context.location);
    assert.equal(url.origin, origin, 'runtime resources must stay on the book site');
    assert.ok(options?.signal, 'asset fetch is bounded');
    if (!retried && url.pathname.endsWith('.wasm.001.bin')) {
      assert.equal(options.cache, 'default');
      retried = true;
      throw new Error('simulated cold-load fetch failure');
    }
    if (url.pathname.endsWith('.wasm.001.bin')) assert.equal(options.cache, 'reload');
    return new Response(await fs.readFile(path.join(docs, decodeURIComponent(url.pathname))));
  };
  context.importScripts = source => {
    const url = new URL(source);
    assert.equal(url.origin, origin);
    assert.ok(url.pathname.endsWith('/module-flight/vendor/pyodide/pyodide.js'));
    // Use the staged browser download from the worker with Node's Pyodide loader.
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
  vm.runInContext(await fs.readFile(path.join(lab, 'python-worker.js'), 'utf8'), context);
  await context.onmessage({ data: { kind: 'warm' } });
  assert.equal(messages.pop()?.kind, 'ready');
  assert.ok(retried, 'failed shared file is retried before boot');

  let nextId = 0;
  const run = async (source, watch = [], files = {}) => {
    const id = ++nextId;
    await context.onmessage({ data: { kind: 'run', id, source, watch, files } });
    const message = messages.pop();
    assert.equal(message?.kind, 'result');
    assert.equal(message.id, id);
    return message.result;
  };
  const ok = (result, label = '') => assert.equal(result.ok, true, label + ' ' + result.error);
  const fixture = { 'logs/flight.txt': '甲\n乙丙\n', 'probe.bin': new Uint8Array([0, 255, 8]) };
  let result = await run([
    'from pathlib import Path',
    'from os import getcwd',
    'f = open("logs/flight.txt", "r", encoding="utf-8")',
    'head = f.read(1)',
    'position = f.tell()',
    'rest = f.readline()',
    'lines = f.readlines()',
    'f.close()',
    'manual = f.closed',
    'with open(Path("/flight-lab/probe.bin"), "rb") as binary:',
    '    payload = binary.read()',
    'auto = binary.closed',
    'cwd = getcwd()',
    'print(head)',
  ].join('\n'), ['head', 'position', 'rest', 'lines', 'manual', 'payload', 'auto', 'cwd'], fixture);
  ok(result);
  assert.equal(result.output, '甲\n');
  assert.deepEqual(result.values, {
    head: { type: 'str', repr: "'甲'" },
    position: { type: 'int', repr: '3' },
    rest: { type: 'str', repr: "'\\n'" },
    lines: { type: 'list', repr: "['乙丙\\n']" },
    manual: { type: 'bool', repr: 'True' },
    payload: { type: 'bytes', repr: "b'\\x00\\xff\\x08'" },
    auto: { type: 'bool', repr: 'True' },
    cwd: { type: 'str', repr: "'/flight-lab'" },
  });
  assert.deepEqual(result.fileEvents.map(({ operation, count, unit, line }) => [operation, count, unit, line]), [
    ['open', null, null, 3], ['read', 1, 'chars', 4], ['readline', 1, 'chars', 6],
    ['readlines', 1, 'lines', 7], ['close', null, null, 8],
    ['open', null, null, 10], ['read', 3, 'bytes', 11], ['close', null, null, 10],
  ]);
  assert.deepEqual(result.fileEvents.slice(1, 4).map(({ before, after }) => [before, after]), [[0, 3], [3, 4], [4, 11]]);
  assert.equal(result.fileEvents[5].path, '/flight-lab/probe.bin');

  result = await run('with open("logs/flight.txt", encoding="utf-8") as f:\n    lines = list(f)', ['lines'], fixture);
  ok(result);
  assert.equal(result.values.lines.repr, "['甲\\n', '乙丙\\n']");
  assert.deepEqual(result.fileEvents.filter(event => event.operation === 'iterate').map(event => event.count), [2, 3, 0]);
  assert.equal(result.fileEvents.at(-1).operation, 'close');

  result = await run([
    'with open("logs/flight.txt", "a", encoding="utf-8") as f:',
    '    f.writelines(["复检\\n", "返航\\n"])',
    'with open("logs/flight.txt", "r", encoding="utf-8") as f:',
    '    final = f.readlines()',
  ].join('\n'), ['final'], fixture);
  ok(result);
  assert.equal(result.values.final.repr, "['甲\\n', '乙丙\\n', '复检\\n', '返航\\n']");
  assert.deepEqual(result.fileEvents.map(event => [event.operation, event.mode]), [
    ['open', 'a'], ['writelines', 'a'], ['close', 'a'],
    ['open', 'r'], ['readlines', 'r'], ['close', 'r'],
  ]);

  result = await run('f = open("logs/flight.txt", "w")\nf.write("changed")\nraise ValueError("oops")', [], fixture);
  assert.deepEqual([result.ok, result.errorType, result.line], [false, 'ValueError', 3]);
  assert.deepEqual(result.fileEvents.map(event => event.operation), ['open', 'write', 'cleanup']);
  result = await run('with open("logs/flight.txt", encoding="utf-8") as f:\n    print(f.read(), end="")', [], fixture);
  ok(result, 'Fixtures must survive a previous script overwriting them and failing.');
  assert.equal(result.output, fixture['logs/flight.txt']);
  result = await run('with open("logs/flight.txt", encoding="utf-8") as f:\n    print(f.read())');
  assert.deepEqual([result.ok, result.errorType, result.line], [false, 'FileNotFoundError', 1]);
  assert.equal(result.fileEvents[0].error, 'FileNotFoundError');
  result = await run('print(1)', [], { '../escape.txt': 'invalid' });
  assert.equal(result.errorType, 'ValueError');

  const { lessons } = await loadModule(path.join(lab, 'lessons.js'));
  const { buildFlightPlan } = await loadModule(path.join(lab, '../parameter-flight/drone.js'));
  let cases = 0;
  let previews = 0;
  const actions = new Set();
  for (const lesson of lessons) {
    for (const scenario of lesson.scenarios) {
      const answers = Object.fromEntries(lesson.blanks.map(blank => [blank.id, blank.answer]));
      const options = [{}, ...lesson.blanks.filter(blank => blank.numeric).flatMap(blank =>
        blank.numeric.map(value => ({ [blank.id]: String(value) })))];
      for (const override of options) {
        const source = lesson.code.replace(/\{\{(\w+)\}\}/g, (_, id) => override[id] ?? answers[id]);
        result = await run(source, lesson.watch, scenario.files);
        ok(result, [lesson.id, scenario.label, JSON.stringify(override)].join(' / '));
        assert.doesNotThrow(() => buildFlightPlan(result.commands));
        assert.deepEqual(Object.keys(result.values), lesson.watch);
        assert.ok(result.fileEvents.length > 0, lesson.id + ' must use a real file operation.');
        result.commands.forEach(command => actions.add(command.action));
        cases++;
        if (!Object.keys(override).length) {
          const chunks = source.split(/^[ \t]*#[ \t]*@stage\b.*$/m).filter(chunk => chunk.trim());
          for (let end = 1; end < chunks.length; end++) {
            const checkpoint = await run(chunks.slice(0, end).join('\n'), lesson.watch, scenario.files);
            ok(checkpoint, lesson.id + ' partial stage ' + end);
            assert.doesNotThrow(() => buildFlightPlan(checkpoint.commands));
            previews++;
          }
        }
      }
    }
  }
  for (const action of ['altitude', 'spin', 'figure8', 'move', 'return']) assert.ok(actions.has(action), action);
  console.log('Real embedded CPython passed file isolation, tracing, ' + cases + ' lesson cases and ' + previews + ' checkpoints.');
}

(async () => {
  const parent = await fs.realpath(os.tmpdir());
  const temp = await fs.mkdtemp(path.join(parent, 'file-read-flight-'));
  try { await verify(temp); }
  finally {
    const resolved = await fs.realpath(temp);
    if (path.dirname(resolved) === parent && path.basename(resolved).startsWith('file-read-flight-')) {
      await fs.rm(resolved, { recursive: true, force: true });
    }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
