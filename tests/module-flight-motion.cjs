/* Run: node tests/module-flight-motion.cjs */
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const source = fs.readFileSync(path.join(__dirname, '../docs/_static/labs/module-flight/drone.js'), 'utf8');
  const { buildFlightPlan, sampleFlightPlan, DroneScene } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
  let checks = 0;
  const check = fn => { fn(); checks++; };
  const near = (a, b, tolerance = 1e-7) => assert.ok(Math.abs(a - b) < tolerance, `${a} should equal ${b}`);
  const end = commands => { const plan = buildFlightPlan(commands); return sampleFlightPlan(plan, plan.duration); };

  check(() => { const s = end([{ action: 'move', x: 17, y: -9, speed: 6 }]); near(s.x, 17); near(s.y, -9); near(s.z, 10); assert.equal(s.done, true); });
  check(() => { const s = end([{ action: 'altitude', height: 50, speed: 4 }, { action: 'altitude', height: 7, speed: 4 }]); near(s.z, 7); });
  check(() => { const s = end([{ action: 'spin', turns: 2, direction: 'right', speed: 90 }]); near(s.yaw, 720); });
  check(() => { const s = end([{ action: 'spin', turns: 1.5, direction: 'left', speed: 90 }]); near(s.yaw, -540); });
  check(() => { const p = buildFlightPlan([{ action: 'spin', turns: 2, direction: 'right', speed: 90 }]); const s = sampleFlightPlan(p, p.duration / 2); near(s.yaw, 360); });
  check(() => { const p = buildFlightPlan([{ action: 'figure8', loops: .5, scale: 16, speed: 6 }]); const s = sampleFlightPlan(p, p.duration); near(s.x, 0); near(s.y, 0); assert.ok(Math.min(...p.points.map(p => p.x)) > -1e-7); assert.ok(Math.max(...p.points.map(p => p.x)) > 15); });
  check(() => { const p = buildFlightPlan([{ action: 'figure8', loops: 1, scale: 16, speed: 6 }]); assert.ok(Math.min(...p.points.map(p => p.x)) < -15); assert.ok(Math.max(...p.points.map(p => p.x)) > 15); near(p.finalState.x, 0); near(p.finalState.y, 0); });
  check(() => { const small = buildFlightPlan([{ action: 'figure8', loops: 1, scale: 8, speed: 6 }]); const big = buildFlightPlan([{ action: 'figure8', loops: 1, scale: 24, speed: 6 }]); assert.ok(Math.max(...big.points.map(p => p.x)) > 2.9 * Math.max(...small.points.map(p => p.x))); });
  check(() => { const p = buildFlightPlan([{ action: 'orbit', radius: 12, laps: 1, direction: 'right', speed: 6 }]); near(p.finalState.x, 0); near(p.finalState.y, 0); near(p.finalState.yaw, 360); assert.ok(Math.max(...p.points.map(p => p.x)) > 23); });
  check(() => { const p = buildFlightPlan([{ action: 'orbit', radius: 12, laps: .5, direction: 'left', speed: 6 }]); near(p.finalState.x, -24); near(p.finalState.y, 0); near(p.finalState.yaw, -180); });
  check(() => { const s = end([{ action: 'route', points: [[10, 5], [-8, 12], [7, -3]], speed: 6 }]); near(s.x, 7); near(s.y, -3); });
  check(() => { const p = buildFlightPlan([{ action: 'configure', params: { height: 22, speed: 8, led: false, trail: false } }, { action: 'move', x: 12, y: 8 }]); const s = sampleFlightPlan(p, p.duration); near(s.z, 22); assert.equal(s.led, false); assert.equal(s.trail, false); near(s.cruiseSpeed, 8); });
  check(() => { const s = end([{ action: 'move', x: 10, y: 20 }, { action: 'return', height: 30, speed: 8 }]); near(s.x, 0); near(s.y, 0); near(s.z, 0); });
  check(() => { const p = buildFlightPlan([{ action: 'move', x: 10, y: 20 }, { action: 'altitude', height: 35 }]); const a = p.segments[0].end, b = p.segments[1].sample(0); near(a.x, b.x); near(a.y, b.y); near(a.z, b.z); });
  check(() => { const p = buildFlightPlan([{ action: 'move', x: 20, y: 0, line: 8, functionName: 'send_move' }]); const s = sampleFlightPlan(p, 1); assert.equal(s.command.line, 8); assert.equal(s.command.functionName, 'send_move'); near(s.totalProgress, 1 / p.duration); });
  check(() => {
    const metadata = { file: 'uav_toolkit/flight_utils.py', line: 12, functionName: 'flight_height', moduleName: 'uav_toolkit.flight_utils', importedFrom: 'main.py', importChain: ['main.py', 'uav_toolkit', 'uav_toolkit.flight_utils'] };
    const p = buildFlightPlan([{ action: 'altitude', height: 32, speed: 4, ...metadata }]);
    const s = sampleFlightPlan(p, p.duration / 2);
    for (const key of Object.keys(metadata)) assert.deepEqual(s.command[key], metadata[key]);
    assert.notEqual(s.command, metadata);
    near(p.finalState.z, 32);
  });
  check(() => {
    const p = buildFlightPlan([{ action: 'move', x: 24, y: -8, file: 'main.py' }, { action: 'spin', turns: 3, direction: 'left', speed: 180, file: 'flight_utils.py' }, { action: 'altitude', height: 6, file: 'main.py' }]);
    near(p.segments[0].end.x, 24);near(p.segments[1].end.yaw - p.segments[1].start.yaw, -1080);near(p.finalState.z, 6);
    assert.equal(p.segments[1].command.file, 'flight_utils.py');assert.equal(p.segments[2].command.file, 'main.py');
  });
  check(() => { const slow = buildFlightPlan([{ action: 'move', x: 40, y: 0, speed: 3 }]); const fast = buildFlightPlan([{ action: 'move', x: 40, y: 0, speed: 12 }]); assert.ok(fast.duration < slow.duration); });
  check(() => { const p = buildFlightPlan([{ action: 'move', x: 12, y: 7 }, { action: 'hold', message: '条件不满足', duration: 2 }]); const a = p.segments[0].end, b = p.finalState; near(a.x, b.x); near(a.y, b.y); near(a.z, b.z); assert.equal(p.segments[1].duration, 2); assert.equal(p.segments[1].command.message, '条件不满足'); });
  check(() => { const p = buildFlightPlan([{ action: 'spin', turns: 1, direction: 'right' }]); near(p.duration, 2.6); });
  check(() => { const p = buildFlightPlan([{ action: 'hold', speed: 180, message: 'unused global speed is not a hold parameter' }]); near(p.duration, 1.5); });
  for (const bad of [
    { action: 'move', x: true, y: 3 }, { action: 'move', x: Infinity, y: 3 },
    { action: 'move', x: '10', y: 3 }, { action: 'move', x: 4, y: 2, speed: 0 },
    { action: 'altitude', height: -1 }, { action: 'spin', turns: 1, direction: 'clockwise' },
    { action: 'figure8', loops: 0, scale: 10 }, { action: 'route', points: [[1, 2, 3]] },
    { action: 'route', points: [] }, { action: 'configure', params: { led: 1 } },
    { action: 'configure', params: [] }, { action: 'hold', duration: -1 }, { action: 'unknown' },
  ]) check(() => assert.throws(() => buildFlightPlan([bad])));

  // Real rendering math with a lightweight Canvas API stub: ensure all aircraft
  // extrema stay inside the arena at every sampled position and viewing angle.
  global.window = { matchMedia: () => ({ matches: false }), devicePixelRatio: 1 };
  global.ResizeObserver = class { observe() {} disconnect() {} };
  global.requestAnimationFrame = () => 1;
  global.cancelAnimationFrame = () => {};
  const noop = () => {};
  const ctx = new Proxy({}, { get: (_target, name) => name === 'measureText' ? text => ({ width: text.length * 6 }) : name === 'createLinearGradient' ? () => ({ addColorStop: noop }) : noop, set: () => true });
  const mock = (width, height) => ({ style: {}, getContext: () => ctx, getBoundingClientRect: () => ({ width, height }), setAttribute: noop, addEventListener: noop, removeEventListener: noop });
  const mission = [
    { action: 'move', x: -35, y: 25 }, { action: 'altitude', height: 80 },
    { action: 'spin', turns: 2, direction: 'right', speed: 120 },
    { action: 'figure8', loops: 1, scale: 24, speed: 8 },
    { action: 'route', points: [[35, -20], [0, 0]], speed: 8 },
    { action: 'orbit', radius: 20, laps: 1, direction: 'right', speed: 8 },
    { action: 'return', height: 35, speed: 8 },
  ];
  let poses = 0;
  for (const [width, height] of [[720, 470], [460, 360], [320, 320]]) {
    const scene = new DroneScene(mock(width, height));
    scene.play(mission);
    for (const azimuth of [-2, -.56, 0, 1.5]) for (const elevation of [.25, .62, 1.13, Math.PI / 2]) {
      scene.cameraAzimuth = azimuth; scene.cameraElevation = elevation;
      for (let i = 0; i <= 100; i++) {
        scene.state = { ...scene.state, ...sampleFlightPlan(scene.plan, scene.plan.duration * i / 100) };
        scene.fitCamera();
        scene.posePitch = scene.state.pitch * Math.PI / 180;
        scene.poseRoll = scene.state.roll * Math.PI / 180;
        scene.poseYaw = (180 - scene.state.yaw) * Math.PI / 180;
        const aircraft = [];
        for (const x of [-111, 111]) for (const z of [-91, 91]) for (let n = 0; n < 48; n++) aircraft.push(scene.project(scene.local({ x: x + Math.cos(n / 48 * Math.PI * 2) * 54, y: 29, z: z + Math.sin(n / 48 * Math.PI * 2) * 54 })));
        for (const x of [-46, 46]) for (const y of [-51, 29]) for (const z of [-66, 66]) aircraft.push(scene.project(scene.local({ x, y, z })));
        aircraft.push(scene.project(scene.local({ x: 0, y: 34, z: 190 })));
        for (const p of aircraft) assert.ok(p.x >= 13 && p.x <= width - 13 && p.y >= 77 && p.y <= height - 43, `aircraft clipped: ${width}x${height} at ${i}, ${JSON.stringify(p)}`);
        const spanX = Math.max(...aircraft.map(p => p.x)) - Math.min(...aircraft.map(p => p.x)), spanY = Math.max(...aircraft.map(p => p.y)) - Math.min(...aircraft.map(p => p.y));
        assert.ok(Math.max(spanX, spanY) >= (width >= 600 ? 200 : 150), 'aircraft stays large enough for teaching');
        poses++;
      }
    }
    scene.render(1, .016);
    scene.setPaused(true);
    const frozen = scene.elapsed;
    scene.advance(1);
    near(scene.elapsed, frozen);
    scene.setPaused(false);
    scene.setPlaybackRate(2);
    scene.advance(.1);
    near(scene.elapsed, .2);
    scene.replay(); near(scene.elapsed, 0);
    scene.motionQuery.matches = true; scene.setMotionEnabled(true); scene.advance(.1); assert.equal(scene.state.playing, true); assert.ok(scene.elapsed > 0 && scene.elapsed < scene.plan.duration);
    scene.setMotionEnabled(false); scene.advance(.01); near(scene.elapsed, scene.plan.duration); assert.equal(scene.state.playing, false);
    scene.setMotionEnabled(true); scene.setView('top'); assert.equal(scene.cameraElevation, Math.PI / 2); scene.setView('iso');
    scene.reset(); assert.equal(scene.state.playing, false);
    scene.destroy();
    checks++;
  }
  console.log(`PASS: ${checks} motion, validation and control checks; ${poses} fitted 3D poses.`);
})().catch(error => { console.error(error); process.exitCode = 1; });
