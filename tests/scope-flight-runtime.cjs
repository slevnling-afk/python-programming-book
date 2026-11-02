/* Runs the vendored Python interpreter, including every lesson scenario. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const lab = path.resolve(__dirname, '../docs/_static/labs/scope-flight');

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
    verify(result); count++; console.log('PASS', name);
  };
  await check('local shadows module height without changing it', `height = 5
def explore():
    height = 40
    action = 'altitude'
    # @event command
    return height
result = explore()
# @event result`, r => {
    assert.equal(r.ok, true, r.error);
    const local = r.events[0], global = r.events[1];
    assert.equal(local.scope.height, 40);
    assert.equal(local.scopeKinds.height, 'local');
    assert.equal(local.scopeValues.global.height, 5);
    assert.equal(local.scopeValues.local.height, 40);
    assert.equal(global.scope.height, 5);
    assert.equal(global.scope.result, 40);
    assert.equal(global.scopeKinds.height, 'global');
    assert.equal(local.functionName, 'explore');
  });
  await check('global declaration updates actual shared scoreboard', `total_score = 0
def add_to_total(points):
    global total_score
    total_score += points
    # @event scope
add_to_total(10)
add_to_total(24)
add_to_total(-6)
# @event result`, r => {
    assert.equal(r.ok, true, r.error);
    assert.deepEqual(r.events.map(e => e.scope.total_score), [10, 34, 28, 28]);
    assert.ok(r.events.every(e => e.scopeKinds.total_score === 'global'));
    assert.deepEqual(r.events.slice(0,3).map(e => e.scope.points), [10,24,-6]);
    assert.equal('points' in r.events.at(-1).scope, false);
  });
  await check('module variable declared after def captured at actual call time', `def add():
    global alarm_count
    alarm_count += 1
    # @event scope
alarm_count = 7
add()
add()`, r => {
    assert.equal(r.ok, true, r.error);
    assert.deepEqual(r.events.map(e => e.scope.alarm_count), [8,9]);
  });
  await check('global declaration bypasses a shadowed enclosing name', `height = 10
def outer():
    height = 50
    def inner():
        global height
        height += 3
        # @event scope
    inner()
    # @event scope
outer()
# @event result`, r => {
    assert.equal(r.ok, true, r.error);
    assert.equal(r.events[0].scope.height, 13);
    assert.equal(r.events[0].scopeKinds.height, 'global');
    assert.equal(r.events[1].scope.height, 50);
    assert.equal(r.events[1].scopeKinds.height, 'local');
    assert.equal(r.events.at(-1).scope.height, 13);
  });
  await check('unassigned local never falls back to a global with same name', `height = 42
def scope_test():
    # @event scope
    height = 8
    # @event scope
scope_test()`, r => {
    assert.equal(r.ok, true, r.error);
    assert.equal('height' in r.events[0].scope, false);
    assert.equal(r.events[0].scopeValues.global.height, 42);
    assert.equal(r.events[1].scope.height, 8);
  });
  await check('nested function sees actual enclosing weight and local argument', `weight = 99
def score_route(segment_scores):
    weight = 2
    def calc_segment(s):
        result = s * weight
        # @event scope
        return result
    subtotal = 0
    for s in segment_scores:
        subtotal += calc_segment(s)
    # @event return
    return subtotal
result = score_route([8, 9, 7])
# @event result`, r => {
    assert.equal(r.ok, true, r.error);
    assert.deepEqual(r.events.slice(0,3).map(e => e.scope.result), [16,18,14]);
    for (const event of r.events.slice(0,3)) {
      assert.equal(event.scope.weight, 2);
      assert.equal(event.scopeKinds.weight, 'enclosing');
      assert.equal(event.scopeKinds.s, 'local');
      assert.equal(event.scopeValues.global.weight, 99);
      assert.equal(event.scopeValues.enclosing.weight, 2);
      assert.equal(event.functionName, 'calc_segment');
    }
    assert.equal(r.events.at(-1).scope.result, 48);
    assert.equal('subtotal' in r.events.at(-1).scope, false);
  });
  await check('closure values belong to each actual call, never previous call', `def multiplier(k):
    def mul(x):
        result = x * k
        # @event scope
        return result
    return mul(10)
first = multiplier(3)
second = multiplier(5)`, r => {
    assert.equal(r.ok, true, r.error);
    assert.deepEqual(r.events.map(e => [e.scope.k,e.scope.result]), [[3,30],[5,50]]);
    assert.ok(r.events.every(e => e.scopeKinds.k === 'enclosing'));
  });
  await check('nested unassigned local does not expose enclosing binding', `height = 9
def outer():
    height = 20
    def inner():
        # @event scope
        height = 40
        # @event scope
    inner()
outer()`, r => {
    assert.equal(r.ok, true, r.error);
    assert.equal('height' in r.events[0].scope, false);
    assert.equal(r.events[1].scope.height, 40);
    assert.equal(r.events[1].scopeKinds.height, 'local');
  });
  await check('lambda conditional expression computes real battery bonus', `battery_bonus = lambda b: 2 if b >= 80 else 1 if b >= 50 else 0
for battery_percent in [90,72,20]:
    bonus = battery_bonus(battery_percent)
    # @event result`, r => {
    assert.equal(r.ok, true, r.error);
    assert.deepEqual(r.events.map(e => e.scope.bonus), [2,1,0]);
    assert.ok(r.events.every(e => !('battery_bonus' in e.scope)));
  });
  await check('recursive base case and unwinding are actual Python events', `def stair_penalty(n):
    # @event enter
    if n <= 0:
        result = 0
        # @event return
        return result
    result = n + stair_penalty(n - 1)
    # @event return
    return result
pen = stair_penalty(3)
# @event result`, r => {
    assert.equal(r.ok, true, r.error);
    assert.deepEqual(r.events.filter(e => e.type==='enter').map(e => e.scope.n), [3,2,1,0]);
    assert.deepEqual(r.events.filter(e => e.type==='return').map(e => e.scope.result), [0,1,3,6]);
    assert.equal(r.events.at(-1).scope.pen, 6);
    assert.ok(r.events.slice(0,-1).every(e => e.functionName==='stair_penalty'));
    assert.equal('n' in r.events.at(-1).scope, false);
  });
  await check('recursive command parameters change with recursion depth', `def descend(n):
    # @event enter
    if n <= 0:
        return 0
    action = 'altitude'
    height = n * 8
    # @event command
    result = descend(n - 1)
    # @event return
    return result
descend(3)`, r => {
    assert.equal(r.ok, true, r.error);
    assert.deepEqual(r.events.filter(e => e.type==='command').map(e => e.scope.height), [24,16,8]);
  });
  await check('real NameError for external access to local variable', `def cost(minutes):
    rate = 2
    return minutes * rate
result = cost(3)
print(rate)`, r => {assert.equal(r.ok,false);assert.equal(r.errorType,'NameError');});
  await check('missing global declaration triggers actual UnboundLocalError', `total_score = 0
def wrong(points):
    total_score += points
    # @event command
wrong(5)`, r => {assert.equal(r.ok,false);assert.equal(r.errorType,'UnboundLocalError');assert.equal(r.events.length,0);});
  await check('real NameError for inaccessible nested function', `def outer():
    weight = 3
    def inner(x):
        return x * weight
    return inner(10)
result = outer()
print(inner(2))`, r => {assert.equal(r.ok,false);assert.equal(r.errorType,'NameError');});
  await check('marker instrumentation does not create fictitious subscript locals', `def configure(params):
    params['height'] = 30
    params['speed'] = 6
    # @event scope
configure({})`, r => {assert.equal(r.ok,true,r.error);assert.deepEqual(r.events[0].scope.params,{height:30,speed:6});});
  await check('definite branches and source lines do not alter control flow', `def branch(flag):
    if flag:
        temporary = 2
    else:
        # @event scope
        pass
    # @event result
branch(False)`, r => {assert.equal(r.ok,true,r.error);assert.equal(r.events[0].line,5);assert.equal('temporary' in r.events[0].scope,false);});
  await check('preserves bool tuple dict and None types', `def values():
    ok = False
    points = ((1,2), (3,4))
    params = {'led':True}
    result = None
    # @event scope
values()`, r => {assert.equal(r.ok,true,r.error);const e=r.events[0];assert.equal(e.types.ok,'bool');assert.equal(e.types.points,'tuple');assert.equal(e.types.params,'dict');assert.equal(e.types.result,'NoneType');assert.equal(e.scope.ok,false);assert.equal(e.scope.result,null);});
  await check('syntax error keeps original source line', 'height = 3\n# @event scope\nif True\n    pass', r => {assert.equal(r.ok,false);assert.equal(r.errorType,'SyntaxError');assert.match(r.error,/line 3/);});
  await check('nonshrinking recursion fails instead of reporting a successful flight', `def countdown(n):
    if n <= 0:
        return 0
    return countdown(n)
countdown(2)`, r=>{assert.equal(r.ok,false);assert.ok(r.error);assert.equal(r.events.length,0);});
  await check('infinite loop interrupted by interpreter budget', 'while True:\n    pass', r => {assert.equal(r.ok,false);assert.equal(r.errorType,'TimeLimitError');});

  // The browser wrapper is checked separately from interpreter semantics: each
  // attempt owns a new worker, and cancelled/finished workers cannot leak output.
  const wrapper = (Worker, timer=setTimeout) => {
    const source=fs.readFileSync(path.join(lab,'runtime.js'),'utf8').replace(/export /g,'').replace(/import\.meta\.url/g,'__moduleUrl')+'\nthis.__runtime={runPython,runtimeReady};';
    const context=vm.createContext({Worker,URL,setTimeout:timer,clearTimeout,__moduleUrl:'https://example.github.io/book/_static/labs/scope-flight/runtime.js'});
    vm.runInContext(source,context);return context.__runtime;
  };
  const workers=[];
  class CompletedWorker {
    constructor(url){this.url=String(url);this.terminated=false;workers.push(this);}
    terminate(){this.terminated=true;}
    postMessage(data){this.code=data.code;queueMicrotask(()=>{
      this.onmessage({data:{kind:'output',text:'ok\n'}});
      this.onmessage({data:{kind:'event',event:{type:'scope',scope:{total_score:10},scopeKinds:{total_score:'global'}}}});
      this.onmessage({data:{kind:'done',ok:true}});
      this.onmessage({data:{kind:'output',text:'stale'}});
    });}
  }
  const api=wrapper(CompletedWorker);
  const first=await api.runPython('print(1)',{onOutput(){throw new Error('UIobserver');}}),second=await api.runPython('print(2)');
  assert.equal(first.ok,true);assert.equal(first.output,'ok\n');assert.equal(second.output,'ok\n');assert.equal(workers.length,2);assert.ok(workers.every(w=>w.terminated));
  assert.ok(workers[0].url.endsWith('/scope-flight/python-worker.js'));assert.deepEqual(Array.from(first.events,e=>e.type),['output','scope']);
  count++;console.log('PASS relative worker URL, fresh attempts, observers and disposal');
  class HangingWorker extends CompletedWorker{postMessage(){}}
  const timed=await wrapper(HangingWorker,callback=>setTimeout(callback,5)).runPython('while True: pass');
  assert.equal(timed.errorType,'TimeLimitError');assert.ok(workers.at(-1).terminated);count++;console.log('PASS browser watchdog terminates unresponsive worker');
  assert.equal((await wrapper(undefined).runPython('print(1)')).errorType,'BrowserError');count++;console.log('PASS unsupported worker reports useful browser error');

  const lessonFile=path.join(lab,'lessons.js');
  if(fs.existsSync(lessonFile)) {
    const {lessons}=await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(lessonFile,'utf8')).toString('base64'));
    const compose=(lesson,scenario,overrides={})=>{
      const answers={...Object.fromEntries(lesson.blanks.map(b=>[b.id,b.answer])),...overrides};
      return (scenario.prelude||'')+'\n\n'+lesson.code.replace(/\{\{([^}]+)\}\}/g,(_,id)=>answers[id]);
    };
    for(const lesson of lessons) {
      for(const scenario of lesson.scenarios) {
        await check(`lesson ${lesson.id}/${scenario.id}`,compose(lesson,scenario),r=>{
          assert.equal(r.ok,true,r.error);
          const commands=r.events.filter(e=>e.type==='command');
          assert.ok(commands.length, 'lesson produces actual motion commands');
          assert.ok(commands.every(e=>typeof e.scope.action==='string'));
          if(lesson.expectedActions)assert.deepEqual(commands.map(e=>e.scope.action),scenario.expectedActions||lesson.expectedActions);
          assert.ok(r.events.every(e=>e.scopeKinds&&e.scopeValues&&e.line>0));
          if(lesson.id==='01') {
            assert.equal(commands[0].scope.height,15);
            const local=r.events.find(e=>e.functionName==='calc_energy_cost');
            assert.equal(local.scopeKinds.rate,'local');assert.equal(local.scope.rate,3);
            assert.equal('rate' in r.events.at(-1).scope,false);
            assert.match(r.output,/局部 rate 在函数外不可见/);
          }
          if(lesson.id==='02') {
            assert.deepEqual(commands.map(e=>e.scope.height),[12,35]);
            const local=r.events.find(e=>e.functionName==='choose_height');
            assert.equal(local.scopeValues.global.height,35);assert.equal(local.scopeValues.local.height,12);
          }
          if(lesson.id==='03') {
            assert.deepEqual(commands.map(e=>e.scope.height),[12,30]);
            assert.deepEqual(commands.map(e=>e.scopeKinds.total_score),['global','global']);
          }
          if(lesson.id==='04') {
            assert.deepEqual(commands.map(e=>e.scope.alarm_count),[1,2,3]);
            assert.deepEqual(commands.map(e=>e.scope.turns),[.5,1,1.5]);
            assert.ok(commands.every(e=>e.scope.direction===scenario.id));
          }
          if(lesson.id==='05') {
            assert.deepEqual(commands[0].scope.points,scenario.id==='triangle'?[[-16,-10],[16,-10],[0,16]]:[[16,-10],[-16,-10],[0,16]]);
            const local=r.events.find(e=>e.functionName==='scale_point');
            assert.equal(local.scopeKinds.weight,'enclosing');assert.equal(local.scopeKinds.x,'local');
          }
          if(lesson.id==='06') {
            assert.equal(commands[0].scope.scale,20);assert.equal(commands[0].scope.loops,1);
            const local=r.events.find(e=>e.functionName==='mul');
            assert.equal(local.scopeKinds.k,'enclosing');assert.equal(local.scope.k,2);
          }
          if(lesson.id==='07') {
            const bonus={high:2,medium:1,low:0}[scenario.id];assert.equal(commands[0].scope.bonus,bonus);
            if(bonus){assert.equal(commands[0].scope.laps,bonus/2);assert.equal(commands[0].scope.radius,bonus===2?14:10);}
          }
          if(lesson.id==='08') {
            assert.equal(commands[0].scope.safe,scenario.id!=='unsafe');
            if(scenario.id!=='unsafe')assert.equal(commands[0].scope.height,scenario.id==='high'?45:15);
          }
          if(lesson.id==='09') {
            assert.deepEqual(commands.map(e=>e.scope.height),[32,24,16,8]);
            assert.deepEqual(r.events.filter(e=>e.type==='enter').map(e=>e.scope.n),[4,3,2,1,0]);
            assert.deepEqual(r.events.filter(e=>e.type==='return').map(e=>e.scope.result),[0,1,2,3,4]);
            assert.equal(r.events.at(-1).scope.steps,4);
          }
          if(lesson.id==='10') {
            const total={standard:29,excellent:30,short:17}[scenario.id];
            assert.equal(commands[0].scope.height,total);assert.equal(commands[0].scope.total_score,total);
            assert.equal(commands[1].scope.x,scenario.id==='short'?6:12);assert.equal(commands[1].scope.y,-6);
            assert.equal(commands[2].scope.loops,scenario.id==='short'?.5:1);
            assert.equal(commands[2].scope.scale,scenario.id==='excellent'?14:11);
            assert.equal(commands[3].scope.height,20);
            const inner=r.events.find(e=>e.functionName==='calc_segment');assert.equal(inner.scopeKinds.weight,'enclosing');
            const adder=r.events.find(e=>e.functionName==='add_to_total');assert.equal(adder.scopeKinds.total_score,'global');
          }
        });
      }
      for(const blank of lesson.blanks.filter(b=>b.numberRange)) {
        for(const value of new Set(blank.numberRange)) {
          const scenario=lesson.scenarios.find(s=>s.id===lesson.defaultScenario)||lesson.scenarios[0];
          await check(`exploration ${lesson.id}/${blank.id}=${value}`,compose(lesson,scenario,{[blank.id]:String(value)}),r=>{
            assert.equal(r.ok,true,r.error);
            assert.ok(r.events.some(e=>e.type==='command'));
          });
        }
      }
    }
  }
  console.log(`${count} scope, real Python and lesson checks passed.`);
}

main().catch(error=>{console.error(error);process.exitCode=1;});

