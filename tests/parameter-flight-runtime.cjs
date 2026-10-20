/* Runs the vendored Python interpreter, including every lesson scenario. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const lab = path.resolve(__dirname, '../docs/_static/labs/parameter-flight');

async function run(code) {
  const messages = [];
  let resolveDone;
  const done = new Promise((resolve) => { resolveDone = resolve; });
  const scope = {
    console, setTimeout, clearTimeout,
    performance: { now: () => Date.now() },
    postMessage(message) {
      messages.push(message);
      if (message.kind === 'done') resolveDone(message);
    },
  };
  scope.self = scope;
  const context = vm.createContext(scope);
  scope.importScripts = (...files) => {
    for (const file of files) vm.runInContext(fs.readFileSync(path.join(lab, file), 'utf8'), context, { filename: file, timeout: 5500 });
  };
  vm.runInContext(fs.readFileSync(path.join(lab, 'python-worker.js'), 'utf8'), context, { filename: 'python-worker.js', timeout: 5500 });
  context.__testCode = code;
  vm.runInContext('self.onmessage({ data: { code: __testCode } })', context, { timeout: 5500 });
  const result = await done;
  // Reproduce the structured clone applied by an actual browser worker.
  return JSON.parse(JSON.stringify({
    ...result,
    output: messages.filter((message) => message.kind === 'output').map((message) => message.text).join(''),
    events: messages.filter((message) => message.kind === 'event').map((message) => message.event),
    messages,
  }));
}

async function main() {
  let count = 0;
  const check = async (name, code, verify) => {
    const result = await run(code);
    verify(result);
    count++;
    console.log('PASS', name);
  };
  // Exercise the browser orchestration without substituting Python semantics.
  // A controlled Worker transport checks disposal, ordering and the watchdog.
  const wrapper = (Worker, timer = setTimeout) => {
    const source = fs.readFileSync(path.join(lab, 'runtime.js'), 'utf8')
      .replace(/export /g, '').replace(/import\.meta\.url/g, '__moduleUrl')
      + '\nglobalThis.__runtime = { runPython, runtimeReady };';
    const context = vm.createContext({ Worker, URL, setTimeout: timer, clearTimeout,
      __moduleUrl: 'https://example.github.io/python-programming-book/_static/labs/parameter-flight/runtime.js' });
    vm.runInContext(source, context);
    return context.__runtime;
  };
  const workers = [];
  class CompletedWorker {
    constructor(url) { this.url = String(url); this.terminated = false; workers.push(this); }
    terminate() { this.terminated = true; }
    postMessage(data) {
      this.code = data.code;
      queueMicrotask(() => {
        this.onmessage({ data: { kind: 'output', text: 'hello\n' } });
        this.onmessage({ data: { kind: 'event', event: { type: 'result', scope: { ok: false }, types: { ok: 'bool' }, line: 4 } } });
        this.onmessage({ data: { kind: 'done', ok: true } });
        this.onmessage({ data: { kind: 'output', text: 'late message' } });
      });
    }
  }
  const browserRuntime = wrapper(CompletedWorker);
  const first = await browserRuntime.runPython('print(1)', { onOutput() { throw new Error('UI failed'); } });
  const second = await browserRuntime.runPython('print(2)');
  assert.equal(first.ok, true);
  assert.equal(first.output, 'hello\n');
  assert.deepEqual(Array.from(first.events, (event) => event.type), ['output', 'result']);
  assert.equal(second.output, 'hello\n');
  assert.equal(workers.length, 2);
  assert.ok(workers.every((worker) => worker.terminated));
  assert.ok(workers[0].url.endsWith('/python-programming-book/_static/labs/parameter-flight/python-worker.js'));
  count++; console.log('PASS browser wrapper fresh workers, ordered output, observers and relative Pages URL');
  class HangingWorker extends CompletedWorker { postMessage() {} }
  const timed = await wrapper(HangingWorker, (fn) => setTimeout(fn, 5)).runPython('while True: pass');
  assert.equal(timed.ok, false);
  assert.equal(timed.errorType, 'TimeLimitError');
  assert.equal(workers.at(-1).terminated, true);
  count++; console.log('PASS browser wrapper terminates nonresponsive worker');
  const unsupported = await wrapper(undefined).runPython('print(1)');
  assert.equal(unsupported.ok, false);
  assert.equal(unsupported.errorType, 'BrowserError');
  count++; console.log('PASS browser wrapper reports missing Worker support');
  await check('define creates function without executing body', `
def notice(uav_id):
    # @event enter
    print(uav_id)
# @event define
`, (r) => {
    assert.equal(r.ok, true, r.error);
    assert.equal(r.output, '');
    assert.deepEqual(r.events.map((event) => event.type), ['define']);
    assert.equal('notice' in r.events[0].scope, false, 'function objects are omitted');
  });
  await check('real parameters per call replace stale globals and prior locals', `
uav_id = 'STALE'
battery_percent = 99
def status(uav_id, battery_percent):
    # @event enter
    print(uav_id, battery_percent)
status('UAV-01', 90)
status('UAV-02', 25)
# @event finish
`, (r) => {
    assert.equal(r.ok, true, r.error);
    assert.deepEqual(r.events.slice(0, 2).map((event) => [event.scope.uav_id, event.scope.battery_percent]), [['UAV-01', 90], ['UAV-02', 25]]);
    assert.equal(r.events.at(-1).scope.uav_id, 'STALE');
    assert.match(r.output, /UAV-01 90\nUAV-02 25/);
  });
  await check('bool, None, strings and tuple retain Python types', `
def kinds(is_armed):
    brief = 'hello'
    ret = (False, None, 3.5, ['x', True])
    # @event return
    return ret
result = kinds(True)
x = None
ok = False
# @event result
`, (r) => {
    assert.equal(r.ok, true, r.error);
    const enter = r.events[0];
    assert.equal(enter.scope.is_armed, true);
    assert.equal(enter.types.is_armed, 'bool');
    assert.equal(enter.scope.brief, 'hello');
    assert.equal(enter.types.ret, 'tuple');
    assert.deepEqual(enter.scope.ret, [false, null, 3.5, ['x', true]]);
    const result = r.events[1];
    assert.equal(result.scope.x, null);
    assert.equal(result.types.x, 'NoneType');
    assert.equal(result.scope.ok, false);
    assert.equal(result.types.ok, 'bool');
    assert.equal(result.types.result, 'tuple');
    assert.equal('brief' in result.scope, false, 'previous function locals never leak');
  });
  await check('early return skips later body and preserves original marker line', `def gate(battery_percent):
    # @event enter
    if battery_percent < 30:
        # @event blocked
        return False
    # @event allowed
    return True
result = gate(25)
# @event result`, (r) => {
    assert.equal(r.ok, true, r.error);
    assert.deepEqual(r.events.map((event) => event.type), ['enter', 'blocked', 'result']);
    assert.deepEqual(r.events.map((event) => event.line), [2, 4, 9]);
    assert.equal(r.events.at(-1).scope.result, false);
  });
  await check('unassigned local does not fall back to a shadowed global', `pitch = 99
def f():
    # @event enter
    pitch = 8
    # @event ready
f()`, (r) => {
    assert.equal(r.ok, true, r.error);
    assert.equal('pitch' in r.events[0].scope, false);
    assert.equal(r.events[1].scope.pitch, 8);
  });
  await check('sibling branch assignment cannot break a marker', `def f(ok):
    if ok:
        brief = 'yes'
    else:
        # @event blocked
        return None
    # @event finish
    return brief
x = f(False)
# @event result`, (r) => {
    assert.equal(r.ok, true, r.error);
    assert.equal(r.events[0].type, 'blocked');
    assert.equal('brief' in r.events[0].scope, false);
    assert.equal(r.events.at(-1).scope.x, null);
  });
  await check('nested finite data accepted and unsafe values excluded', `
def f(log):
    bad = float('nan')
    circular = []
    circular.append(circular)
    # @event enter
f({'uav_id':'UAV-07','nested':[True, None, (1, 2)],'battery_percent':86})`, (r) => {
    assert.equal(r.ok, true, r.error);
    assert.deepEqual(r.events[0].scope.log.nested, [true, null, [1, 2]]);
    assert.equal('bad' in r.events[0].scope, false);
    assert.equal('circular' in r.events[0].scope, false);
  });
  await check('real numeric input drives tuple and later attitude', `
def make_attitude(pitch, roll, yaw, height):
    # @event enter
    return pitch, roll, yaw, height
pitch, roll, yaw, height = make_attitude(-22, 14, 90, 40)
# @event attitude
print(pitch, roll, yaw, height)`, (r) => {
    assert.equal(r.ok, true, r.error);
    assert.deepEqual(['pitch', 'roll', 'yaw', 'height'].map((key) => r.events.at(-1).scope[key]), [-22, 14, 90, 40]);
    assert.equal(r.output, '-22 14 90 40\n');
  });
  await check('output and events are emitted in execution order', `
# @event define
print('A')
# @event result
print('B')`, (r) => {
    assert.equal(r.ok, true, r.error);
    assert.deepEqual(r.messages.map((message) => message.kind === 'event' ? message.event.type : message.kind), ['define', 'output', 'result', 'output', 'done']);
  });
  await check('instrumentation preserves syntax error line', 'x = 1\n# @event ready\nif True\n    pass', (r) => {
    assert.equal(r.ok, false);
    assert.equal(r.errorType, 'SyntaxError');
    assert.match(r.error, /line 3/);
  });
  await check('wrong user expression reports actual Python exception', 'result = 1 / 0\n# @event result', (r) => {
    assert.equal(r.ok, false);
    assert.equal(r.errorType, 'ZeroDivisionError');
    assert.equal(r.events.length, 0);
  });
  await check('infinite Python loop is interrupted', 'while True:\n    pass', (r) => {
    assert.equal(r.ok, false);
    assert.equal(r.errorType, 'TimeLimitError');
  });

  await check('defaults and keyword order bind to actual declared parameters', `
speed = 99
height = 999
def climb(uav_id, height=30, speed=8):
    action = 'altitude'
    # @event command
climb('UAV-07')
climb('UAV-07', speed=6, height=50)
climb('UAV-07', height=50, speed=6)
# @event finish`, (r) => {
    assert.equal(r.ok, true, r.error);
    const commands = r.events.filter((e) => e.type === 'command');
    assert.deepEqual(commands.map((e) => [e.scope.height, e.scope.speed]), [[30, 8], [50, 6], [50, 6]]);
    assert.ok(commands.every((e) => e.functionName === 'climb'));
    assert.deepEqual(commands[0].parameterNames, ['uav_id', 'height', 'speed']);
    assert.equal(r.events.at(-1).functionName, null);
    assert.equal(r.events.at(-1).scope.speed, 99);
    assert.equal(r.events.at(-1).scope.height, 999);
    assert.equal('action' in r.events.at(-1).scope, false);
  });

  await check('star args and kwargs retain Python tuple/dict and fresh values', `
def route(uav_id, *points, **params):
    action = 'route'
    # @event command
    print(type(points), type(params), len(points))
route('UAV-07', (0, 0), (20, -10), speed=6, led=True)
route('UAV-08', (9, 8), mode='AUTO')`, (r) => {
    assert.equal(r.ok, true, r.error);
    assert.equal(r.events.length, 2);
    assert.deepEqual(r.events[0].scope.points, [[0, 0], [20, -10]]);
    assert.deepEqual(r.events[0].scope.params, { speed: 6, led: true });
    assert.equal(r.events[0].types.points, 'tuple');
    assert.equal(r.events[0].types.params, 'dict');
    assert.deepEqual(r.events[0].parameterNames, ['uav_id', 'points', 'params']);
    assert.deepEqual(r.events[1].scope.points, [[9, 8]]);
    assert.deepEqual(r.events[1].scope.params, { mode: 'AUTO' });
    assert.match(r.output, /<class 'tuple'> <class 'dict'> 2/);
  });

  await check('empty variable arguments remain real empty containers', `
def commands(*points, **params):
    action = 'route'
    # @event command
commands()`, (r) => {
    assert.equal(r.ok, true, r.error);
    assert.deepEqual(r.events[0].scope.points, []);
    assert.deepEqual(r.events[0].scope.params, {});
    assert.equal(r.events[0].types.points, 'tuple');
    assert.equal(r.events[0].types.params, 'dict');
  });

  await check('kwargs mutation does not invent unbound lexical names', `
def configure(**params):
    key = 'speed'
    params[key] = 12
    action = 'configure'
    # @event command
configure(speed=6)`, (r) => {
    assert.equal(r.ok, true, r.error);
    assert.deepEqual(r.events[0].scope.params, { speed: 12 });
    assert.equal('paramskey' in r.events[0].scope, false);
  });

  await check('positional argument swaps change target coordinates', `
def send_move(uav_id, x, y):
    action = 'move'
    # @event command
send_move('UAV-07', 10, 20)
send_move('UAV-07', 20, 10)`, (r) => {
    assert.equal(r.ok, true, r.error);
    assert.deepEqual(r.events.map((e) => [e.scope.x, e.scope.y]), [[10, 20], [20, 10]]);
  });

  for (const [name, invocation] of [
    ['missing ordinary parameter', "send_move('UAV-07', 10)"],
    ['unexpected keyword', "send_move('UAV-07', x=10, altitude=20)"],
    ['duplicate positional and keyword value', "send_move('UAV-07', 10, x=20, y=30)"],
    ['too many positional arguments', "send_move('UAV-07', 10, 20, 30)"],
  ]) {
    await check(name + ' produces real TypeError and no movement', `
def send_move(uav_id, x, y):
    action = 'move'
    # @event command
${invocation}`, (r) => {
      assert.equal(r.ok, false);
      assert.equal(r.errorType, 'TypeError');
      assert.equal(r.events.length, 0);
    });
  }

  await check('multiline calls preserve marker source line and actual args', `
def move(uav_id, x, y, speed=8):
    action = 'move'
    # @event command
move(
    'UAV-07',
    y=-12,
    x=23,
)`, (r) => {
    assert.equal(r.ok, true, r.error);
    assert.equal(r.events[0].line, 4);
    assert.deepEqual(['x', 'y', 'speed'].map((k) => r.events[0].scope[k]), [23, -12, 8]);
  });

  const lessonSource = fs.readFileSync(path.join(lab, 'lessons.js'), 'utf8');
  const { lessons } = await import('data:text/javascript;base64,' + Buffer.from(lessonSource).toString('base64'));
  const body = (lesson, overrides = {}) => {
    const answers = Object.fromEntries(lesson.blanks.map((blank) => [blank.id, blank.answer]));
    Object.assign(answers, overrides);
    return lesson.code.replace(/\{\{([^}]+)\}\}/g, (_, id) => answers[id]);
  };
  const commandActions = new Set();
  for (const lesson of lessons) {
    for (const scenario of lesson.scenarios) {
      await check(`lesson ${lesson.id}/${scenario.id}`, (scenario.prelude || '') + '\n' + body(lesson), (r) => {
        assert.equal(r.ok, true, r.error);
        const commands = r.events.filter((e) => e.type === 'command');
        assert.ok(commands.length > 0, 'each lesson has a real executable flight command');
        for (const event of commands) {
          assert.ok(event.line > 0);
          assert.ok(event.functionName, 'command must originate in a real function call');
          assert.ok(event.scope.action, 'command action is captured from Python');
          assert.ok(event.parameterNames.every((name) => Object.hasOwn(event.scope, name)), 'all bound parameters captured');
          commandActions.add(event.scope.action);
          if (event.scope.points) assert.equal(event.types.points, 'tuple');
          if (event.scope.params) assert.equal(event.types.params, 'dict');
        }
        const expected = scenario.expectedActions || lesson.expectedActions;
        if (expected) assert.deepEqual(commands.map((e) => e.scope.action), expected);
      });
    }
    // Exercise the learner's numeric freedom: both legal ends of each range
    // must reach the interpreter as typed, instead of silently using an answer.
    for (const blank of lesson.blanks.filter((blank) => blank.numberRange)) {
      const [min, max] = blank.numberRange;
      for (const value of new Set([min, max])) {
        const scenario = lesson.scenarios[0];
        await check(`explore ${lesson.id}/${blank.id}=${value}`, (scenario.prelude || '') + '\n' + body(lesson, { [blank.id]: String(value) }), (r) => {
          assert.equal(r.ok, true, r.error);
          assert.ok(r.events.some((event) => event.type === 'command'));
          const contains = (item) => {
            if (typeof item === 'number') return item === value;
            return item && typeof item === 'object' && Object.values(item).some(contains);
          };
          assert.ok(r.events.some((event) => event.type === 'command' && contains(event.scope)),
            'typed numeric value must reach actual command scope');
        });
      }
    }
  }
  for (const action of ['move', 'altitude', 'spin', 'figure8', 'route', 'configure', 'orbit', 'return']) {
    assert.ok(commandActions.has(action), `${action} must be generated by lesson Python`);
  }
  console.log(`${count} real Python runtime checks passed.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });

