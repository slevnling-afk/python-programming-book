/* Classroom flight simulator. x/y are ground coordinates in metres; z is
 * altitude. The trajectories below are sampled from real Python command events.
 * The aircraft is drawn at a readable diagram scale, independently of metres. */
const TAU = Math.PI * 2;
const RAD = Math.PI / 180;
const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
const mix = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);
const finite = (v, label, low = -200, high = 200) => {
  if (typeof v !== 'number' || !Number.isFinite(v) || v < low || v > high) {
    throw new Error(`${label} 应为 ${low} 到 ${high} 之间的数值。`);
  }
  return v;
};
const distance = (a, b) => Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
const shortest = (a, b) => a + Math.atan2(Math.sin((b - a) * RAD), Math.cos((b - a) * RAD)) / RAD;
const initialState = () => ({ x: 0, y: 0, z: 10, yaw: 0, pitch: 0, roll: 0, led: true, trail: true, cruiseSpeed: 6 });
const duration = (length, speed, low = 1.4, high = 14) => clamp(length / speed * .48, low, high);

function pathSampler(points, start, { heading = true } = {}) {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) lengths.push(lengths[i - 1] + distance(points[i - 1], points[i]));
  const length = lengths.at(-1);
  return {
    length,
    sample(t) {
      if (!length) return { ...start, ...points.at(-1), pitch: 0, roll: 0 };
      const travelled = clamp(t, 0, 1) * length;
      let i = 1;
      while (i < lengths.length - 1 && travelled > lengths[i]) i++;
      const a = points[i - 1], b = points[i];
      const u = (travelled - lengths[i - 1]) / (lengths[i] - lengths[i - 1] || 1);
      const horizontal = Math.hypot(b.x - a.x, b.y - a.y);
      const targetYaw = horizontal > .00001 && heading ? Math.atan2(b.x - a.x, b.y - a.y) / RAD : start.yaw;
      return { ...start, x: mix(a.x, b.x, u), y: mix(a.y, b.y, u), z: mix(a.z, b.z, u),
        yaw: mix(start.yaw, shortest(start.yaw, targetYaw), ease(clamp(t * 6, 0, 1))),
        pitch: horizontal > .01 ? Math.sin(Math.PI * t) * 9 : 0, roll: 0 };
    },
  };
}

/** Pure trajectory builder, also used by the deterministic runtime tests. */
export function buildFlightPlan(commands = []) {
  if (!Array.isArray(commands)) throw new Error('飞行指令必须组成列表。');
  if (commands.length > 60) throw new Error('每次最多演示 60 条指令，请缩短航线。');
  const segments = [], points = [{ x: 0, y: 0, z: 0 }, initialState()];
  let state = initialState(), elapsed = 0;
  commands.forEach((original, index) => {
    const command = { ...original };
    const action = command.action;
    const start = { ...state };
    const speed = finite(command.speed ?? start.cruiseSpeed, 'speed', .2, action === 'spin' ? 720 : 40);
    let sample, seconds;
    if (action === 'move' || action === 'altitude') {
      const end = action === 'move'
        ? { x: finite(command.x, 'x'), y: finite(command.y, 'y'), z: start.z }
        : { x: start.x, y: start.y, z: finite(command.height, 'height', 0, 120) };
      const path = pathSampler([start, end], start);
      sample = t => path.sample(ease(t));
      seconds = duration(path.length, speed);
    } else if (action === 'spin') {
      const turns = finite(command.turns, 'turns', .25, 6);
      if (!['left', 'right'].includes(command.direction)) throw new Error('direction 请填写 "left" 或 "right"。');
      const sign = command.direction === 'left' ? -1 : 1;
      // Deliberately unwrapped: 720 degrees must visibly make two complete turns.
      sample = t => ({ ...start, yaw: start.yaw + sign * turns * 360 * ease(t), pitch: 0, roll: 0 });
      seconds = clamp(turns * 360 / speed * .65, 2, 16);
    } else if (action === 'figure8') {
      const loops = finite(command.loops, 'loops', .25, 3);
      const scale = finite(command.scale, 'scale', 2, 45);
      sample = t => {
        const theta = TAU * loops * t;
        const heading = Math.atan2(Math.cos(theta), 1.2 * Math.cos(2 * theta)) / RAD;
        return { ...start, x: start.x + scale * Math.sin(theta), y: start.y + scale * .6 * Math.sin(2 * theta),
          yaw: mix(start.yaw, shortest(start.yaw, heading), ease(clamp(t * 12, 0, 1))),
          pitch: Math.sin(Math.PI * t) * 6, roll: Math.sin(theta) * Math.sin(Math.PI * t) * 17 };
      };
      let length = 0, last = sample(0);
      for (let n = 1; n <= 200; n++) { const next = sample(n / 200); length += distance(last, next); last = next; }
      seconds = duration(length, speed, 3.2, 18);
    } else if (action === 'orbit') {
      const radius = finite(command.radius, 'radius', 2, 45);
      const laps = finite(command.laps, 'laps', .25, 3);
      if (!['left', 'right'].includes(command.direction)) throw new Error('direction 请填写 "left" 或 "right"。');
      const sign = command.direction === 'left' ? -1 : 1;
      const heading = start.yaw * RAD;
      sample = t => {
        const theta = TAU * laps * t;
        const right = sign * radius * (1 - Math.cos(theta)), forward = radius * Math.sin(theta);
        return { ...start, x: start.x + right * Math.cos(heading) + forward * Math.sin(heading),
          y: start.y - right * Math.sin(heading) + forward * Math.cos(heading),
          yaw: start.yaw + sign * theta / RAD, pitch: Math.sin(Math.PI * t) * 5, roll: sign * Math.sin(Math.PI * t) * 15 };
      };
      seconds = duration(TAU * radius * laps, speed, 2.8, 18);
    } else if (action === 'route') {
      if (!Array.isArray(command.points) || !command.points.length || command.points.length > 24) throw new Error('points 请提供 1 到 24 个 (x, y) 航点。');
      const waypoints = command.points.map((p, i) => {
        if (!Array.isArray(p) || p.length !== 2) throw new Error(`第 ${i + 1} 个航点应为 (x, y)。`);
        return { x: finite(p[0], '航点 x'), y: finite(p[1], '航点 y'), z: start.z };
      });
      const path = pathSampler([start, ...waypoints], start);
      sample = t => path.sample(ease(t));
      seconds = duration(path.length, speed, 2, 20);
    } else if (action === 'configure') {
      const params = command.params;
      if (!params || Array.isArray(params) || typeof params !== 'object') throw new Error('params 应为关键字参数字典。');
      const end = { ...start };
      if (params.speed !== undefined) end.cruiseSpeed = finite(params.speed, 'speed', .2, 40);
      if (params.height !== undefined) end.z = finite(params.height, 'height', 0, 120);
      for (const key of ['led', 'trail']) {
        if (params[key] !== undefined) {
          if (typeof params[key] !== 'boolean') throw new Error(`${key} 请填写 True 或 False。`);
          end[key] = params[key];
        }
      }
      sample = t => ({ ...end, z: mix(start.z, end.z, ease(t)), pitch: 0, roll: 0 });
      seconds = duration(Math.abs(end.z - start.z), end.cruiseSpeed, 1.2, 8);
    } else if (action === 'return') {
      const height = finite(command.height, 'height', 2, 120);
      const path = pathSampler([start, { ...start, z: height }, { x: 0, y: 0, z: height }, { x: 0, y: 0, z: 0 }], start);
      sample = t => path.sample(ease(t));
      seconds = duration(path.length, speed, 3, 18);
    } else {
      throw new Error(`暂不支持飞行动作：${String(action)}。`);
    }
    const end = sample(1);
    // Exact endpoints avoid floating-point remnants in displayed coordinates.
    for (const key of ['x', 'y', 'z']) if (Math.abs(end[key]) < 1e-10) end[key] = 0;
    segments.push({ action, command, index, start, end, sample, duration: seconds, startTime: elapsed, endTime: elapsed + seconds });
    for (let n = 0; n <= 80; n++) points.push(sample(n / 80));
    state = end;
    elapsed += seconds;
  });
  return { segments, commands: commands.map(c => ({ ...c })), duration: elapsed, points, finalState: state };
}

/** Time is in compressed demonstration seconds; coordinates remain exact. */
export function sampleFlightPlan(plan, time) {
  if (!plan.segments.length) return { ...initialState(), action: 'idle', index: -1, total: 0, progress: 0, totalProgress: 0, done: true, command: null };
  const at = clamp(time, 0, plan.duration);
  const segment = plan.segments.find(s => at < s.endTime) || plan.segments.at(-1);
  const progress = clamp((at - segment.startTime) / segment.duration, 0, 1);
  return { ...(progress === 1 ? segment.end : segment.sample(progress)), action: segment.action,
    index: segment.index, total: plan.segments.length, progress, totalProgress: plan.duration ? at / plan.duration : 0,
    done: at >= plan.duration, command: segment.command };
}

const COLORS = { white: '#eff7f8', edge: '#b5cdd1', navy: '#203e4a', dark: '#102c39', mint: '#ffbd62', mintDark: '#c78632', blue: '#557e91', lens: '#287d9b' };
function shade(hex, brightness) {
  const raw = parseInt(hex.slice(1), 16);
  return `rgb(${Math.round(clamp(((raw >> 16) & 255) * brightness, 0, 255))},${Math.round(clamp(((raw >> 8) & 255) * brightness, 0, 255))},${Math.round(clamp((raw & 255) * brightness, 0, 255))})`;
}
function normal(points) {
  const [a, b, c] = points;
  const u = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z }, v = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
  const n = { x: u.y * v.z - u.z * v.y, y: u.z * v.x - u.x * v.z, z: u.x * v.y - u.y * v.x };
  const length = Math.hypot(n.x, n.y, n.z) || 1;
  return { x: n.x / length, y: n.y / length, z: n.z / length };
}

export class DroneScene {
  constructor(canvas, { onUpdate = () => {}, onFinish = () => {} } = {}) {
    if (!canvas || typeof canvas.getContext !== 'function') throw new TypeError('DroneScene requires a canvas.');
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onUpdate = onUpdate;
    this.onFinish = onFinish;
    this.state = { ...initialState(), action: 'idle', index: -1, total: 0, progress: 0, totalProgress: 0, playing: false, paused: false, done: false, battery: 100, mode: 'flying' };
    this.cameraAzimuth = -.56;
    this.cameraElevation = .62;
    this.zoom = 1;
    this.playbackRate = 1;
    this.plan = buildFlightPlan([]);
    this.trailPoints = [];
    this.elapsed = 0;
    this.rotor = 0;
    this.lastTime = 0;
    this.updateClock = 0;
    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.canvas.style.touchAction = 'none';
    this.canvas.style.cursor = 'grab';
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', '三维无人机动作演示。拖动旋转视角，滚轮缩放。');
    this.drag = null;
    this.onDown = event => {
      if (event.button !== 0) return;
      this.drag = { x: event.clientX, y: event.clientY };
      this.canvas.style.cursor = 'grabbing';
      this.canvas.setPointerCapture?.(event.pointerId);
    };
    this.onMove = event => {
      if (!this.drag) return;
      this.cameraAzimuth += (event.clientX - this.drag.x) * .007;
      this.cameraElevation = clamp(this.cameraElevation + (event.clientY - this.drag.y) * .005, .25, 1.13);
      this.drag = { x: event.clientX, y: event.clientY };
    };
    this.onUp = () => { this.drag = null; this.canvas.style.cursor = 'grab'; };
    this.onWheel = event => { event.preventDefault(); this.zoom = clamp(this.zoom * Math.exp(-event.deltaY * .001), .7, 1.8); };
    canvas.addEventListener('pointerdown', this.onDown);
    canvas.addEventListener('pointermove', this.onMove);
    canvas.addEventListener('pointerup', this.onUp);
    canvas.addEventListener('pointercancel', this.onUp);
    canvas.addEventListener('lostpointercapture', this.onUp);
    canvas.addEventListener('wheel', this.onWheel, { passive: false });
    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(canvas);
    this.resize();
    this.tick = time => {
      if (this.destroyed) return;
      const dt = this.lastTime ? Math.min((time - this.lastTime) / 1000, .1) : .016;
      this.lastTime = time;
      this.advance(dt);
      this.render(time / 1000, dt);
      this.frame = requestAnimationFrame(this.tick);
    };
    this.frame = requestAnimationFrame(this.tick);
    this.notify();
  }

  play(commands) {
    const plan = buildFlightPlan(commands);
    this.plan = plan;
    this.elapsed = 0;
    this.trailPoints = [];
    this.lastTrail = null;
    this.state = { ...this.state, ...sampleFlightPlan(plan, 0), playing: !!plan.segments.length, paused: false, mode: 'flying' };
    this.notify();
    return plan;
  }

  reset() {
    this.plan = buildFlightPlan([]);
    this.elapsed = 0;
    this.trailPoints = [];
    this.lastTrail = null;
    this.state = { ...this.state, ...sampleFlightPlan(this.plan, 0), playing: false, paused: false, done: false, mode: 'flying' };
    this.notify();
  }
  replay() { return this.play(this.plan.commands); }
  setPaused(paused) { this.state.paused = !!paused; this.notify(); }
  setPlaybackRate(rate) { this.playbackRate = finite(rate, '演示倍速', .25, 4); }
  resetCamera() { this.cameraAzimuth = -.56; this.cameraElevation = .62; this.zoom = 1; }

  notify() {
    const state = { ...this.state };
    this.canvas.setAttribute('aria-label', `无人机当前位置 x ${state.x.toFixed(1)} 米，y ${state.y.toFixed(1)} 米，高度 ${state.z.toFixed(1)} 米，偏航 ${state.yaw.toFixed(0)} 度。拖动旋转视角，滚轮缩放。`);
    this.onUpdate(state);
  }

  advance(dt) {
    if (!this.state.playing || this.state.paused) return;
    this.elapsed = Math.min(this.plan.duration, this.elapsed + dt * this.playbackRate);
    const sample = sampleFlightPlan(this.plan, this.elapsed);
    this.state = { ...this.state, ...sample, playing: !sample.done };
    if (!this.lastTrail || distance(this.state, this.lastTrail) > .13) {
      const point = { x: this.state.x, y: this.state.y, z: this.state.z, visible: this.state.trail };
      this.trailPoints.push(point);
      if (this.trailPoints.length > 1600) this.trailPoints.shift();
      this.lastTrail = point;
    }
    this.updateClock += dt;
    if (this.updateClock > .065 || sample.done) { this.updateClock = 0; this.notify(); }
    if (sample.done) this.onFinish({ ...this.state });
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.heightPx = rect.height;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round(rect.width * this.dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * this.dpr));
  }
  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    for (const [type, listener] of [['pointerdown', this.onDown], ['pointermove', this.onMove], ['pointerup', this.onUp], ['pointercancel', this.onUp], ['lostpointercapture', this.onUp], ['wheel', this.onWheel]]) this.canvas.removeEventListener(type, listener);
  }

  // Orthographic arena keeps every planned metre and the aircraft in frame.
  rotate(point) {
    const ca = Math.cos(this.cameraAzimuth), sa = Math.sin(this.cameraAzimuth);
    const ce = Math.cos(this.cameraElevation), se = Math.sin(this.cameraElevation);
    const x = point.x * ca - point.z * sa, z = point.x * sa + point.z * ca;
    return { x, y: point.y * ce - z * se, depth: -(point.y * se + z * ce) };
  }
  world(point) { return { x: point.x, y: point.z, z: -point.y }; }
  fitCamera() {
    const points = this.plan.points.length > 2 ? this.plan.points : [{ x: -18, y: -16, z: 0 }, { x: 18, y: 16, z: 15 }];
    const projected = points.map(p => this.rotate(this.world(p)));
    // Ground under the flight, home and exact altitude are all part of the fit.
    for (const p of points) projected.push(this.rotate(this.world({ ...p, z: 0 })));
    let left = Math.min(...projected.map(p => p.x)), right = Math.max(...projected.map(p => p.x));
    let bottom = Math.min(...projected.map(p => p.y)), top = Math.max(...projected.map(p => p.y));
    const spanX = Math.max(35, right - left), spanY = Math.max(28, top - bottom);
    this.viewX = (left + right) / 2;
    this.viewY = (top + bottom) / 2;
    const padX = this.width < 480 ? 58 : 74;
    const padY = this.heightPx < 360 ? 65 : 80;
    this.scale = Math.max(.2, Math.min((this.width - padX * 2) / spanX, (this.heightPx - padY * 2) / spanY)) * this.zoom;
    // Constant diagram size: the plane remains readable on large mission routes.
    this.modelScale = clamp(this.width * .25, 92, 134) / 330 / this.scale;
    this.height = this.state.z + 51 * this.modelScale;
  }
  project(point) {
    const p = this.rotate(point);
    return { x: this.width * .5 + (p.x - this.viewX) * this.scale,
      y: this.heightPx * .52 - (p.y - this.viewY) * this.scale, depth: p.depth, scale: this.scale };
  }
  local(point) {
    const cr = Math.cos(this.poseRoll), sr = Math.sin(this.poseRoll);
    const cp = Math.cos(this.posePitch), sp = Math.sin(this.posePitch);
    const cy = Math.cos(this.poseYaw), sy = Math.sin(this.poseYaw);
    const xr = point.x * cr + point.y * sr, yr = -point.x * sr + point.y * cr;
    const yp = yr * cp + point.z * sp, zp = -yr * sp + point.z * cp;
    return { x: (xr * cy + zp * sy) * this.modelScale + this.state.x,
      y: yp * this.modelScale + this.height, z: (-xr * sy + zp * cy) * this.modelScale - this.state.y };
  }
  face(points, color, options = {}) {
    const world = options.world ? points : points.map(point => this.local(point));
    const projected = world.map(point => this.project(point));
    const n = normal(world);
    const light = options.unlit ? 1 : .74 + Math.max(0, n.y * .7 + n.x * -.22 + n.z * .34) * .26;
    this.faces.push({ points: projected, color: shade(color, light), alpha: options.alpha ?? 1, stroke: options.stroke, lineWidth: options.lineWidth || .6,
      depth: projected.reduce((sum, point) => sum + point.depth, 0) / projected.length + (options.depthBias || 0) * this.modelScale });
  }
  line(points, color, width = 1, options = {}) {
    const world = options.world ? points : points.map(point => this.local(point));
    const projected = world.map(point => this.project(point));
    this.faces.push({ points: projected, line: color, lineWidth: width, alpha: options.alpha ?? 1, dash: options.dash,
      depth: projected.reduce((sum, point) => sum + point.depth, 0) / projected.length + (options.depthBias || 0) * this.modelScale });
  }
  ring(x, y, z, radius, color, width = 1, options = {}) {
    this.line(Array.from({ length: 49 }, (_, i) => ({ x: x + Math.cos(i / 48 * TAU) * radius, y, z: z + Math.sin(i / 48 * TAU) * radius })), color, width, options);
  }
  disk(x, y, z, radius, color, options = {}) {
    this.face(Array.from({ length: 36 }, (_, i) => ({ x: x + Math.cos(-i / 36 * TAU) * radius, y, z: z + Math.sin(-i / 36 * TAU) * radius })), color, options);
  }
  cylinder(x, y, z, radius, height, color, topColor = color, segments = 20) {
    const top = [];
    for (let i = 0; i < segments; i++) {
      const a = i / segments * TAU, b = (i + 1) / segments * TAU;
      const p1 = { x: x + Math.cos(a) * radius, y, z: z + Math.sin(a) * radius };
      const p2 = { x: x + Math.cos(b) * radius, y, z: z + Math.sin(b) * radius };
      this.face([p1, p2, { ...p2, y: y + height }, { ...p1, y: y + height }], color);
      top.unshift({ ...p1, y: y + height });
    }
    this.face(top, topColor);
  }

  box(cx, cy, cz, sx, sy, sz, color, topColor = color) {
    const v = [
      { x: cx-sx/2, y: cy-sy/2, z: cz-sz/2 }, { x: cx+sx/2, y: cy-sy/2, z: cz-sz/2 },
      { x: cx+sx/2, y: cy-sy/2, z: cz+sz/2 }, { x: cx-sx/2, y: cy-sy/2, z: cz+sz/2 },
      { x: cx-sx/2, y: cy+sy/2, z: cz-sz/2 }, { x: cx+sx/2, y: cy+sy/2, z: cz-sz/2 },
      { x: cx+sx/2, y: cy+sy/2, z: cz+sz/2 }, { x: cx-sx/2, y: cy+sy/2, z: cz+sz/2 },
    ];
    [[0,3,2,1],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]].forEach(indices => this.face(indices.map(i => v[i]), color));
    this.face([v[4],v[5],v[6],v[7]].reverse(), topColor);
  }

  beam(x1, z1, x2, z2, y, width, height, color, topColor = color) {
    const length = Math.hypot(x2-x1, z2-z1);
    const nx = -(z2-z1) / length * width / 2, nz = (x2-x1) / length * width / 2;
    const ring = [
      { x: x1+nx, y:y-height/2, z:z1+nz }, { x:x2+nx,y:y-height/2,z:z2+nz },
      { x:x2-nx,y:y-height/2,z:z2-nz }, { x:x1-nx,y:y-height/2,z:z1-nz },
    ];
    for (let i=0;i<4;i++) {
      const a=ring[i],b=ring[(i+1)%4];
      this.face([a,b,{...b,y:y+height/2},{...a,y:y+height/2}],color);
    }
    this.face(ring.map(p=>({...p,y:y+height/2})).reverse(),topColor);
  }

  body() {
    const outline = [[-27,-64],[27,-64],[46,-41],[46,37],[27,66],[-27,66],[-46,37],[-46,-41]];
    const bottom=outline.map(([x,z])=>({x:x*.88,y:-17,z:z*.94}));
    const belt=outline.map(([x,z])=>({x,y:5,z}));
    const roof=outline.map(([x,z])=>({x:x*.84,y:25,z:z*.89}));
    for(let i=0;i<8;i++) {
      const j=(i+1)%8;
      this.face([bottom[i],bottom[j],belt[j],belt[i]],COLORS.navy);
      this.face([belt[i],belt[j],roof[j],roof[i]],COLORS.white,{stroke:'#dce9eb',lineWidth:.35});
    }
    this.face([...roof].reverse(),'#f7fcfc',{stroke:'#d1e1e4',lineWidth:.8});
    // The removable battery cover, its seam, and four battery indicators.
    this.face([[-25,-41],[25,-41],[31,-29],[31,29],[22,43],[-22,43],[-31,29],[-31,-29]].map(([x,z])=>({x,y:25.7,z})).reverse(),'#d8e8eb',{stroke:'#b3ccd1',lineWidth:.75,depthBias:-35});
    this.face([[-17,-33],[17,-33],[17,10],[-17,10]].map(([x,z])=>({x,y:26.2,z})).reverse(),'#294b59',{depthBias:-48});
    for(let i=0;i<4;i++) {
      const x=-10+i*6.8;
      this.face([{x:x-2.05,y:27.1,z:18.5},{x:x+2.05,y:27.1,z:18.5},{x:x+2.05,y:27.1,z:27.5},{x:x-2.05,y:27.1,z:27.5}].reverse(),i<this.state.battery/25?this.accent:'#a8bdc3',{unlit:true,depthBias:-75});
    }
    this.box(0,27,-47,15,2,3,'#aac4ca');
    // Ribs on each side make the shell read as a manufactured object.
    [-1,1].forEach(side=>{
      for(let i=0;i<5;i++) this.line([{x:side*45.5,y:6,z:-19+i*7},{x:side*43.4,y:14,z:-19+i*7}],'#95b5bd',1.2);
      this.line([{x:side*37,y:-2,z:43},{x:side*29,y:-2,z:54}],this.accent,2.2);
    });
    // Bright nose marker keeps the yaw direction readable through a full turn.
    this.face([{x:-10,y:26.9,z:36},{x:10,y:26.9,z:36},{x:0,y:26.9,z:49}], this.accent, {unlit:true,depthBias:-42});
    // Suspended camera gimbal with a glass lens on the front (+z).
    this.box(0,-20,42,12,10,10,COLORS.navy);
    this.box(0,-30,48,29,22,24,'#294651','#3c5f6e');
    const lensRing = (z,r,color) => {
      const vertices=Array.from({length:24},(_,i)=>({x:Math.cos(i/24*TAU)*r,y:-30+Math.sin(i/24*TAU)*r,z}));
      this.face(vertices,color,{unlit:true});
    };
    lensRing(60.1,9.4,'#91bac6'); lensRing(60.5,7.5,'#0b2533'); lensRing(61,5.3,'#1f6c89');
    lensRing(61.2,2.9,'#3b9eb0');
    this.face([{x:-3,y:-25,z:61.5},{x:0,y:-25,z:61.5},{x:1,y:-27,z:61.5},{x:-2,y:-27,z:61.5}],'#d9f7fa',{alpha:.75,unlit:true});
    // Carbon-fibre skids and slightly angled landing struts.
    [-1,1].forEach(side=>{
      [-36,35].forEach(z=>{
        const x=side*31;
        this.face([{x:x-3,y:-8,z:z-3},{x:x+3,y:-8,z:z-3},{x:x+side*9+3,y:-47,z:z+2},{x:x+side*9-3,y:-47,z:z+2}], '#557582');
        this.face([{x:x+3,y:-8,z:z-3},{x:x+3,y:-8,z:z+3},{x:x+side*9+3,y:-47,z:z+6},{x:x+side*9+3,y:-47,z:z+2}], '#2a4857');
      });
      this.beam(side*40,-55,side*40,57,-47,9,7,COLORS.navy,'#587887');
      this.box(side*40,-47,51,10,8,8,'#89a7b0');
      this.box(side*40,-47,-49,10,8,8,'#89a7b0');
    });
  }

  arm(x,z,index,time) {
    const sideX=Math.sign(x),sideZ=Math.sign(z);
    this.beam(sideX*28,sideZ*26,x,z,-2,18,12,'#254958','#547480');
    this.beam(sideX*35,sideZ*31,x*.95,z*.95,5,14,6,'#bed5db','#edf6f7');
    this.cylinder(x,-9,z,18,24,'#254453','#233f4e',24);
    this.cylinder(x,9,z,19,4,'#c8dde1','#dff0f0',24);
    this.cylinder(x,13,z,14,5,COLORS.navy,'#3a5c6b',20);
    this.ring(x,13.4,z,17,this.accent,2.5,{depthBias:-22});
    this.cylinder(x,18,z,7,9,'#354f5d','#7c9aa6',16);
    // Directional navigation lights: white rear pair, amber front pair.
    this.disk(x,7.8,z+sideZ*14,3.3,sideZ>0?this.accent:'#e2f7fa',{unlit:true});
    const phase=this.rotor*(index%2?-1:1)+index*.83;
    const spinning=this.state.mode==='flying'||this.state.mode==='called';
    if(spinning&&!this.motionQuery.matches) {
      this.disk(x,24,z,53,'#8aacb5',{alpha:.10,unlit:true});
      this.ring(x,24.1,z,52,'#8fbdc1',.7,{alpha:.29});
      this.ring(x,24.1,z,43,'#b2d3d6',.6,{alpha:.20});
    }
    for(let blade=0;blade<2;blade++) {
      const angle=phase+blade*Math.PI;
      const shape=[[3,-3],[17,-5],[49,-1],[52,3],[33,5],[10,3]];
      this.face(shape.map(([r,w])=>({x:x+Math.cos(angle)*r-Math.sin(angle)*w,y:25.5,z:z+Math.sin(angle)*r+Math.cos(angle)*w})), '#284854', {alpha:spinning?.47:.94,unlit:true});
    }
    this.cylinder(x,24,z,5.2,4,'#839fa9','#e5f2f5',14);
  }


  ground() {
    const world = { world: true, unlit: true };
    const coordinates = this.plan.points;
    const extent = clamp(Math.max(24, ...coordinates.map(p => Math.max(Math.abs(p.x), Math.abs(p.y)))) + 12, 36, 240);
    const grid = extent > 100 ? 20 : 10;
    for (let n = -extent; n <= extent; n += grid) {
      this.line([{ x: n, y: -.1, z: -extent }, { x: n, y: -.1, z: extent }], '#477087', .65, { ...world, alpha: .2 });
      this.line([{ x: -extent, y: -.1, z: n }, { x: extent, y: -.1, z: n }], '#477087', .65, { ...world, alpha: .2 });
    }
    this.line([{ x: -extent, y: .01, z: 0 }, { x: extent, y: .01, z: 0 }], '#c18f62', 1, { ...world, alpha: .35 });
    this.line([{ x: 0, y: .01, z: -extent }, { x: 0, y: .01, z: extent }], '#579aaf', 1, { ...world, alpha: .4 });
    this.disk(0, 0, 0, 4, '#183b4c', { ...world, stroke: '#4ab0bf', lineWidth: 1.3 });
    this.ring(0, .03, 0, 3.3, '#56cbd0', 1, { ...world, alpha: .8 });
    this.line([{ x: -1.3, y: .05, z: -1.4 }, { x: -1.3, y: .05, z: 1.4 }], '#c4e5e8', 1.6, world);
    this.line([{ x: 1.3, y: .05, z: -1.4 }, { x: 1.3, y: .05, z: 1.4 }], '#c4e5e8', 1.6, world);
    this.line([{ x: -1.3, y: .05, z: 0 }, { x: 1.3, y: .05, z: 0 }], '#c4e5e8', 1.6, world);
    // The floor shadow follows horizontal coordinates, not the camera.
    const shadow = Array.from({ length: 40 }, (_, i) => ({ x: this.state.x + Math.cos(i / 40 * TAU) * 115 * this.modelScale,
      y: .06, z: -this.state.y + Math.sin(i / 40 * TAU) * 78 * this.modelScale }));
    this.face(shadow, '#010810', { ...world, alpha: .22 });
    this.line([this.world({ ...this.state, z: 0 }), this.world(this.state)], '#80b4c3', .9, { ...world, alpha: .45, dash: [3, 5] });
    // Faint planned route; colored trail follows only already flown positions.
    for (const segment of this.plan.segments) {
      if (['spin', 'configure'].includes(segment.action)) continue;
      const route = Array.from({ length: 81 }, (_, n) => this.world(segment.sample(n / 80)));
      this.line(route, '#65cad8', 1.15, { ...world, alpha: .32, dash: [3, 5] });
      const end = segment.end;
      this.ring(end.x, .08, -end.y, 1.25, '#7fd4da', 1, { ...world, alpha: .55 });
    }
    let run = [];
    for (const point of this.trailPoints) {
      if (!point.visible) { if (run.length > 1) this.line(run, '#ffbc66', 2, { ...world, alpha: .88 }); run = []; }
      else run.push(this.world(point));
    }
    if (run.length > 1) this.line(run, '#ffbc66', 2, { ...world, alpha: .88 });
  }

  overlay() {
    const { ctx, width: w, heightPx: h } = this;
    ctx.save();
    ctx.font = '11px ui-monospace, Consolas, monospace';
    ctx.fillStyle = '#7b9daa';
    ctx.fillText('X / Y · 地面坐标   Z · 高度', 17, h - 17);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#647f90';
    ctx.fillText('拖动看模型 · 滚轮缩放', w - 17, h - 17);
    // Permanent home and aircraft labels connect the 3D scene to parameter values.
    const home = this.project({ x: 0, y: 0, z: 0 });
    ctx.textAlign = 'center';
    ctx.fillStyle = '#8ebfca';
    if (home.x > 20 && home.x < w - 20 && home.y < h - 42) ctx.fillText('HOME', home.x, home.y + 21);
    const p = this.project({ x: this.state.x, y: this.height, z: -this.state.y });
    const label = `(${this.state.x.toFixed(1)}, ${this.state.y.toFixed(1)})  ↑ ${this.state.z.toFixed(1)}m`;
    const textWidth = ctx.measureText(label).width + 18;
    const lx = clamp(p.x, textWidth / 2 + 10, w - textWidth / 2 - 10);
    const ly = clamp(p.y - 55, 20, h - 65);
    ctx.fillStyle = 'rgba(9,28,40,.82)';
    ctx.beginPath(); ctx.roundRect(lx - textWidth / 2, ly - 12, textWidth, 22, 5); ctx.fill();
    ctx.fillStyle = '#d8e7ea'; ctx.fillText(label, lx, ly + 3);
    ctx.restore();
  }

  render(time, dt) {
    const { ctx, width: w, heightPx: h } = this;
    if (!w || !h) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    const background = ctx.createLinearGradient(0, 0, w, h);
    background.addColorStop(0, '#102b3b'); background.addColorStop(1, '#071824');
    ctx.fillStyle = background; ctx.fillRect(0, 0, w, h);
    this.fitCamera();
    this.posePitch = this.state.pitch * RAD;
    this.poseRoll = this.state.roll * RAD;
    this.poseYaw = (180 - this.state.yaw) * RAD;
    this.state.mode = this.state.z > .1 ? 'flying' : 'landed';
    this.rotor += this.motionQuery.matches || this.state.paused ? 0 : dt * (this.state.z > .1 ? 38 : 0);
    this.accent = this.state.led ? COLORS.mint : '#6c8c98';
    this.faces = [];
    this.ground();
    [[-111, -91], [111, -91], [-111, 91], [111, 91]].forEach(([x, z], i) => this.arm(x, z, i, time));
    this.body();
    this.faces.sort((a, b) => b.depth - a.depth);
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    for (const face of this.faces) {
      if (face.points.length < 2) continue;
      ctx.globalAlpha = face.alpha;
      ctx.beginPath();
      face.points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      if (face.line) {
        ctx.strokeStyle = face.line; ctx.lineWidth = face.lineWidth; ctx.setLineDash(face.dash || []); ctx.stroke(); ctx.setLineDash([]);
      } else {
        ctx.closePath(); ctx.fillStyle = face.color; ctx.fill();
        if (face.stroke) { ctx.strokeStyle = face.stroke; ctx.lineWidth = face.lineWidth; ctx.stroke(); }
      }
    }
    ctx.globalAlpha = 1;
    this.overlay();
  }
}
