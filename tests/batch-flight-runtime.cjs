/* Run with Node >= 20: node tests/batch-flight-runtime.cjs */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const docs = path.resolve(__dirname, '../docs');
const lab = path.join(docs, '_static/labs/batch-flight');
const localOrigin = 'http://batch-test.invalid';

async function loadModule(file) {
  const source = await fs.readFile(file, 'utf8');
  return import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
}

async function verify(temp) {
  const messages = [];
  const requests = [];
  const context = vm.createContext({ URL, Response, crypto: webcrypto, console });
  context.self = context;
  context.location = new URL('/_static/labs/batch-flight/python-worker.js', localOrigin);
  context.postMessage = message => messages.push(structuredClone(message));
  context.fetch = async input => {
    const url = new URL(input, context.location.href);
    assert.equal(url.origin, localOrigin, 'runtime files must come from the book');
    requests.push(url.pathname);
    const file = path.join(docs, decodeURIComponent(url.pathname));
    return new Response(await fs.readFile(file));
  };
  context.importScripts = source => {
    const url = new URL(source);
    assert.equal(url.origin, localOrigin);
    assert.ok(url.pathname.endsWith('/module-flight/vendor/pyodide/pyodide.js'));
    // Adapt the verified browser datastream to Node's native filesystem loader.
    context.loadPyodide = async ({ indexURL }) => {
      await fs.writeFile(path.join(temp, 'package.json'), '{"type":"commonjs"}');
      for (const name of ['pyodide.js', 'pyodide-lock.json', 'pyodide.asm.js', 'pyodide.asm.wasm', 'python_stdlib.zip']) {
        const response = await context.fetch(new URL(name, indexURL));
        await fs.writeFile(path.join(temp, name), Buffer.from(await response.arrayBuffer()));
      }
      return require(path.join(temp, 'pyodide.js')).loadPyodide({ indexURL: temp });
    };
  };
  vm.runInContext(await fs.readFile(path.join(lab, 'python-worker.js'), 'utf8'), context);
  await context.onmessage({ data: { kind: 'warm' } });
  assert.equal(messages.at(-1).kind, 'ready', JSON.stringify(messages.at(-1)));
  assert.ok(requests.some(url => url.endsWith('pyodide.asm.wasm.000.bin')));

  let nextId = 0;
  const run = async (source, watch = []) => {
    const id = ++nextId;
    await context.onmessage({ data: { kind: 'run', id, source, watch } });
    const message = messages.pop();
    assert.equal(message.kind, 'result');
    assert.equal(message.id, id);
    return message.result;
  };
  const ok = result => assert.equal(result.ok, true, JSON.stringify(result));
  const values = result => result.commands.map(command => command.action);
  let result = await run('commands = []\nz = zip([1, 2], [3])\nm = map(str, [1])\nf = filter(bool, [0, 1])\nr = list(z)\ns = {x for x in [1, 1, 2]}\nd = {x: x * x for x in [1, 2]}\nprint(r)', ['z', 'm', 'f', 'r', 's', 'd']);
  ok(result);
  assert.deepEqual(Object.fromEntries(Object.entries(result.values).map(([key, val]) => [key, val.type])), { z: 'zip', m: 'map', f: 'filter', r: 'list', s: 'set', d: 'dict' });
  assert.equal(result.values.r.repr, '[(1, 3)]');
  assert.equal(result.output, '[(1, 3)]\n');

  result = await run('print("first")\nprint(missing)');
  assert.deepEqual([result.ok, result.errorType, result.line, result.output], [false, 'NameError', 2, 'first\n']);
  result = await run('commands = []\na = (1 +');
  assert.equal(result.errorType, 'SyntaxError');
  assert.equal(result.line, 2);
  result = await run('print(r)');
  assert.equal(result.errorType, 'NameError', 'successive runs have independent globals');
  result = await run('commands = [{"action": "altitude", "height": float("nan")}]');
  assert.equal(result.errorType, 'ValueError', 'nonfinite command data is rejected');
  assert.equal(result.commands.length, 0);
  result = await run('while True:\n    pass');
  assert.equal(result.errorType, 'TimeLimitError');

  const { lessons } = await loadModule(path.join(lab, 'lessons.js'));
  const { buildFlightPlan } = await loadModule(path.join(lab, '../parameter-flight/drone.js'));
  const byLesson = {};
  let checkpoints = 0;
  for (const lesson of lessons) {
    const scenarios = lesson.scenarios || [{ id: 'base', data: lesson.data }];
    const numeric = lesson.blanks.filter(blank => blank.numeric);
    const options = [{}, ...numeric.flatMap(blank => blank.numeric.map(value => ({ [blank.id]: String(value) })))];
    for (const scenario of scenarios) {
      for (const overrides of options) {
        const answers = Object.fromEntries(lesson.blanks.map(blank => [blank.id, blank.answer]));
        Object.assign(answers, overrides);
        const source = `${scenario.data || lesson.data}\n\n${lesson.code.replace(/\{\{(\w+)\}\}/g, (_, id) => answers[id])}`;
        const result = await run(source, lesson.watch);
        assert.ok(result.ok, `${lesson.id}/${scenario.id}/${JSON.stringify(overrides)}: ${result.error}`);
        assert.deepEqual(Object.keys(result.values), lesson.watch);
        assert.doesNotThrow(() => buildFlightPlan(result.commands), `${lesson.id} returned unusable simulator commands`);
        if (!Object.keys(overrides).length) byLesson[`${lesson.id}/${scenario.id}`] = result;
        checkpoints++;
      }
    }
  }
  assert.deepEqual(values(byLesson['iterable-orders/spin-half']), ['spin', 'figure8']);
  assert.equal(byLesson['iterable-orders/spin-half'].commands[1].loops, .5);
  assert.deepEqual(values(byLesson['iterable-orders/full-spin']), ['figure8', 'spin']);
  assert.equal(byLesson['iterable-orders/full-spin'].commands[0].loops, 1);
  assert.equal(byLesson['zip-records/aligned'].commands[1].points.length, 4);
  assert.equal(byLesson['zip-records/short'].commands[1].points.length, 3);
  assert.equal(byLesson['filter-records/clear'].commands.length, 0);
  assert.ok(values(byLesson['batch-show/warning']).includes('return'));
  assert.equal(byLesson['batch-show/warning'].commands.find(command => command.action === 'figure8').loops, .5);
  assert.equal(byLesson['batch-show/quiet'].commands.find(command => command.action === 'figure8').loops, 1);
  console.log(`Real embedded CPython, ${checkpoints} lesson/number cases and flight-plan validation passed.`);
}

(async () => {
  const parent = await fs.realpath(os.tmpdir());
  const temp = await fs.mkdtemp(path.join(parent, 'batch-flight-runtime-'));
  try { await verify(temp); }
  finally {
    const resolved = await fs.realpath(temp);
    if (path.dirname(resolved) === parent && path.basename(resolved).startsWith('batch-flight-runtime-')) {
      await fs.rm(resolved, { recursive: true, force: true });
    }
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
