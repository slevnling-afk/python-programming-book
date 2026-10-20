/* Mathematical checks for the teaching view: actual angles, playback and framing. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const file = path.resolve(__dirname, '../docs/_static/labs/function-flight/drone.js');
const noop = () => {};
const context = {
  window: { devicePixelRatio: 1, matchMedia: () => ({ matches: false }) },
  ResizeObserver: class { observe() {} disconnect() {} },
  requestAnimationFrame: () => 1, cancelAnimationFrame: noop,
};
vm.runInNewContext(fs.readFileSync(file, 'utf8').replace('export class DroneScene', 'class DroneScene') + '\nthis.DroneScene = DroneScene;', context);
function scene(width = 650, height = 460, onUpdate) {
  const canvas = {
    style: {}, getContext: () => new Proxy({}, { get: () => noop }),
    setAttribute: noop, addEventListener: noop, removeEventListener: noop,
    getBoundingClientRect: () => ({ width, height }),
  };
  return new context.DroneScene(canvas, { onUpdate });
}
function close(actual, expected, label) { assert.ok(Math.abs(actual - expected) < .00001, `${label}: ${actual} != ${expected}`); }
const model = scene();
model.posePitch = Math.PI / 6;
let point = model.local({ x: 0, y: 0, z: 100 });
close(point.y - model.height, 50, 'positive pitch raises the nose');
model.posePitch = 0; model.poseRoll = Math.PI / 6;
point = model.local({ x: 100, y: 0, z: 0 });
close(point.y - model.height, -50, 'positive roll lowers right arm');
model.poseRoll = 0; model.poseYaw = Math.PI / 2;
point = model.local({ x: 0, y: 0, z: 100 });
close(point.x, 100, 'positive yaw turns nose right');
close(point.z, 0, 'yaw rotates the whole model');
let latest;
const player = scene(650, 460, value => { latest = value; });
player.setState({ mode: 'flying', pitch: 30, roll: -30, yaw: 120, height: 45 });
player.advance(.65);
close(latest.pitch, 15, 'normal transition shows actual intermediate angle');
player.setPaused(true); player.advance(1);
close(latest.pitch, 15, 'pause retains pose');
player.setPaused(false); player.setPlaybackRate(2); player.advance(.325);
close(latest.pitch, 30, 'playback rate changes elapsed time');
assert.equal(latest.phase, 'complete');
assert.equal(player.replayAttitude(), true);
player.setPlaybackRate(1); player.advance(1.6);
close(latest.pitch, 30, 'replay first demonstrates pitch');
close(latest.roll, 0, 'replay holds roll until its phase');
close(latest.yaw, 0, 'replay holds yaw until its phase');
player.advance(1.6);
close(latest.roll, -30, 'replay then demonstrates roll');
close(latest.yaw, 0, 'replay leaves yaw for the last phase');
player.advance(1.6);
close(latest.yaw, 120, 'replay finishes at the true target heading');
close(latest.height, 45, 'replay retains target altitude');
player.setState({ mode: 'blocked' }); player.advance(.1);
for (const key of ['pitch', 'roll', 'yaw', 'height']) close(latest[key], 0, `blocked ${key}`);
assert.equal(player.replayAttitude(), false);
// A replay started during takeoff must still finish the pending climb.
player.setState({ mode: 'flying', pitch: 28, roll: -28, yaw: 90, height: 35 });
player.replayAttitude(); player.advance(4.8);
close(latest.height, 35, 'replay during takeoff still climbs to target');
// A browser's reduced-motion preference must not silently suppress a lesson
// action when the learner has enabled the visible teaching-animation switch.
player.setState({ mode: 'idle' });
player.motionQuery.matches = true;
player.setMotionEnabled(true);
player.setState({ mode: 'flying', pitch: 30, height: 25 });
player.advance(.65);
close(latest.pitch, 15, 'enabled teaching action animates with reduced-motion browser preference');
player.setMotionEnabled(false); player.advance(.01);
close(latest.pitch, 30, 'motion switch off retains exact static target');
let poses = 0;
let minDefaultSpan = Infinity;
for (const [width, height] of [[650,460],[380,400],[1440,460]]) {
  const view = scene(width, height);
  for (const preset of ['iso', 'front', 'side', 'top']) {
    assert.equal(view.setView(preset), true);
    for (const pitch of [-45,-30,-15,0,15,30,45]) for (const roll of [-45,-30,-15,0,15,30,45]) for (let yaw = -180; yaw <= 180; yaw += 15) {
      view.posePitch = pitch * Math.PI / 180;
      view.poseRoll = roll * Math.PI / 180;
      view.poseYaw = yaw * Math.PI / 180;
      view.height = 51 + (poses % 121);
      view.fitCamera();
      const points = view.framingPoints().map(p => view.project(p));
      for (const p of points) {
        assert.ok(p.x >= 17.9 && p.x <= width - 17.9, `horizontal clipping ${width}/${preset}/${pitch}/${roll}/${yaw}`);
        assert.ok(p.y >= 87.9 && p.y <= height - 67.9, `vertical clipping ${height}/${preset}/${pitch}/${roll}/${yaw}`);
      }
      if (preset === 'iso' && width === 380) {
        const actual = points.slice(0, 140);
        // At an edge-on attitude the real silhouette is narrow; its longest
        // dimension must remain large without artificially widening the aircraft.
        const spanX = Math.max(...actual.map(p => p.x)) - Math.min(...actual.map(p => p.x));
        const spanY = Math.max(...actual.map(p => p.y)) - Math.min(...actual.map(p => p.y));
        minDefaultSpan = Math.min(minDefaultSpan, Math.max(spanX, spanY));
      }
      poses++;
    }
  }
}
assert.ok(minDefaultSpan > 210, `phone aircraft should remain readable, min dimension ${minDefaultSpan.toFixed(1)}`);
// Exercise the complete drawing path with the mock canvas after sizing checks.
player.render(1, .016);
model.destroy(); player.destroy();
console.log(`PASS actual angle signs; pause/rate/replay/ground states; ${poses} framed poses; narrow minimum span ${minDefaultSpan.toFixed(1)} px`);
