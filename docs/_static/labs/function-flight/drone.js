/* Dependency-free projected 3D quadcopter for the functions classroom.
 * Coordinates: +X right, +Y up, +Z nose. Positive pitch raises the nose;
 * positive roll lowers the right arm; positive yaw turns the nose right.
 * The model attitude is composed locally before the independent orbit camera.
 */
const TAU = Math.PI * 2;
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const mix = (a, b, t) => a + (b - a) * t;
const COLORS = {
  white: '#eff7f8', edge: '#b5cdd1', navy: '#203e4a', dark: '#102c39',
  mint: '#ffbd62', mintDark: '#c78632', blue: '#557e91', lens: '#287d9b',
};

function shade(hex, brightness) {
  const raw = parseInt(hex.slice(1), 16);
  const r = (raw >> 16) & 255, g = (raw >> 8) & 255, b = raw & 255;
  return `rgb(${Math.round(clamp(r * brightness, 0, 255))},${Math.round(clamp(g * brightness, 0, 255))},${Math.round(clamp(b * brightness, 0, 255))})`;
}

function normal(points) {
  const a = points[0], b = points[1], c = points[2];
  const u = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const v = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
  const n = { x: u.y * v.z - u.z * v.y, y: u.z * v.x - u.x * v.z, z: u.x * v.y - u.y * v.x };
  const length = Math.hypot(n.x, n.y, n.z) || 1;
  return { x: n.x / length, y: n.y / length, z: n.z / length };
}

export class DroneScene {
  constructor(canvas) {
    if (!canvas || typeof canvas.getContext !== 'function') throw new TypeError('DroneScene requires a canvas.');
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.state = { mode: 'idle', pitch: 0, roll: 0, yaw: 0, height: 0, battery: 100 };
    this.cameraAzimuth = -.64;
    this.cameraElevation = Math.PI / 4;
    this.distance = 610;
    this.height = 51;
    this.posePitch = 0;
    this.poseRoll = 0;
    this.poseYaw = 0;
    this.rotor = 0;
    this.lastTime = 0;
    this.destroyed = false;
    this.drag = null;
    this.width = 0;
    this.canvas.style.touchAction = 'none';
    this.canvas.style.cursor = 'grab';
    this.canvas.setAttribute('aria-label', '可拖动旋转的三维四旋翼无人机，滚轮缩放');
    this.canvas.setAttribute('role', 'img');
    this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    this.onDown = event => {
      if (event.button !== 0) return;
      this.drag = { x: event.clientX, y: event.clientY };
      this.canvas.style.cursor = 'grabbing';
      this.canvas.setPointerCapture?.(event.pointerId);
    };
    this.onMove = event => {
      if (!this.drag) return;
      this.cameraAzimuth += (event.clientX - this.drag.x) * .007;
      this.cameraElevation = clamp(this.cameraElevation + (event.clientY - this.drag.y) * .005, .22, 1.1);
      this.drag = { x: event.clientX, y: event.clientY };
    };
    this.onUp = () => { this.drag = null; this.canvas.style.cursor = 'grab'; };
    this.onWheel = event => {
      event.preventDefault();
      this.distance = clamp(this.distance + event.deltaY * .30, 475, 860);
    };
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
      const dt = this.lastTime ? Math.min((time - this.lastTime) / 1000, .05) : .016;
      this.lastTime = time;
      this.render(time / 1000, dt);
      this.frame = requestAnimationFrame(this.tick);
    };
    this.frame = requestAnimationFrame(this.tick);
  }

  setState(next = {}) {
    const modes = ['idle', 'defined', 'called', 'flying', 'blocked', 'landed', 'error'];
    this.state = { ...this.state, ...next };
    if (!modes.includes(this.state.mode)) this.state.mode = 'idle';
    for (const key of ['pitch', 'roll', 'yaw', 'height', 'battery']) {
      const number = Number(this.state[key]);
      this.state[key] = Number.isFinite(number) ? number : (key === 'battery' ? 100 : 0);
    }
    this.state.pitch = clamp(this.state.pitch, -45, 45);
    this.state.roll = clamp(this.state.roll, -45, 45);
    // Keep the signed classroom angle in labels; trigonometry and shortest-path
    // interpolation already handle equivalent orientations such as -90 / 270.
    this.state.height = clamp(this.state.height, 0, 120);
    this.state.battery = clamp(this.state.battery, 0, 100);
    const status = { idle: '待命', defined: '函数已定义', called: '调用函数，旋翼启动', flying: '飞行', blocked: '条件未满足，留在起飞坪', landed: '已降落', error: '代码有误，留在起飞坪' }[this.state.mode];
    this.canvas.setAttribute('aria-label', status + '；俯仰 ' + this.state.pitch + ' 度，横滚 ' + this.state.roll + ' 度，偏航 ' + this.state.yaw + ' 度；可拖动旋转视角、滚轮缩放');
  }

  resetCamera() { this.cameraAzimuth = -.64; this.cameraElevation = Math.PI / 4; this.distance = 610; }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.heightPx = rect.height;
    this.dpr = dpr;
    this.canvas.width = Math.max(1, Math.round(rect.width * dpr));
    this.canvas.height = Math.max(1, Math.round(rect.height * dpr));
  }

  destroy() {
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    const canvas = this.canvas;
    canvas.removeEventListener('pointerdown', this.onDown);
    canvas.removeEventListener('pointermove', this.onMove);
    canvas.removeEventListener('pointerup', this.onUp);
    canvas.removeEventListener('pointercancel', this.onUp);
    canvas.removeEventListener('lostpointercapture', this.onUp);
    canvas.removeEventListener('wheel', this.onWheel);
  }

  project(point) {
    const ca = Math.cos(this.cameraAzimuth), sa = Math.sin(this.cameraAzimuth);
    const cp = Math.cos(this.cameraElevation), sp = Math.sin(this.cameraElevation);
    const x = point.x * ca - point.z * sa;
    const z = point.x * sa + point.z * ca;
    const dy = point.y - this.lookY;
    const y = dy * cp - z * sp;
    const depth = this.distance - (dy * sp + z * cp);
    const scale = this.focal / Math.max(100, depth);
    return { x: this.width * .5 + x * scale, y: this.heightPx * .46 - y * scale, depth, scale };
  }

  local(point) {
    // Intrinsic roll -> pitch -> yaw. Rotate every component around the body origin.
    const cr = Math.cos(this.poseRoll), sr = Math.sin(this.poseRoll);
    const cp = Math.cos(this.posePitch), sp = Math.sin(this.posePitch);
    const cy = Math.cos(this.poseYaw), sy = Math.sin(this.poseYaw);
    const xr = point.x * cr + point.y * sr;
    const yr = -point.x * sr + point.y * cr;
    const yp = yr * cp + point.z * sp;
    const zp = -yr * sp + point.z * cp;
    return { x: xr * cy + zp * sy, y: yp + this.height, z: -xr * sy + zp * cy };
  }

  face(points, color, options = {}) {
    const world = options.world ? points : points.map(point => this.local(point));
    const projected = world.map(point => this.project(point));
    const n = normal(world);
    const light = options.unlit ? 1 : .74 + Math.max(0, n.y * .7 + n.x * -.22 + n.z * .34) * .26;
    this.faces.push({ points: projected, color: shade(color, light), alpha: options.alpha ?? 1, stroke: options.stroke, lineWidth: options.lineWidth || .6,
      depth: projected.reduce((sum, point) => sum + point.depth, 0) / projected.length + (options.depthBias || 0) });
  }

  line(points, color, width = 1, options = {}) {
    const world = options.world ? points : points.map(point => this.local(point));
    const projected = world.map(point => this.project(point));
    this.faces.push({ points: projected, line: color, lineWidth: width, alpha: options.alpha ?? 1, dash: options.dash,
      depth: projected.reduce((sum, point) => sum + point.depth, 0) / projected.length + (options.depthBias || 0) });
  }

  ring(x, y, z, radius, color, width = 1, options = {}) {
    const points = Array.from({ length: 65 }, (_, i) => ({ x: x + Math.cos(i / 64 * TAU) * radius, y, z: z + Math.sin(i / 64 * TAU) * radius }));
    this.line(points, color, width, options);
  }

  disk(x, y, z, radius, color, options = {}) {
    const points = Array.from({ length: 48 }, (_, i) => ({ x: x + Math.cos(-i / 48 * TAU) * radius, y, z: z + Math.sin(-i / 48 * TAU) * radius }));
    this.face(points, color, options);
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

  ground(time) {
    const options = { world:true, unlit:true };
    for (let n=-6;n<=6;n++) {
      const p=n*52;
      this.line([{x:p,y:-2,z:-312},{x:p,y:-2,z:312}],'#466c92',.7,{world:true,alpha:.25});
      this.line([{x:-312,y:-2,z:p},{x:312,y:-2,z:p}],'#466c92',.7,{world:true,alpha:.25});
    }
    this.disk(0,-1.8,0,180,'#0d2037',options);
    this.disk(0,0,0,176,'#142e47',{...options,stroke:'#2e6480',lineWidth:1.1});
    this.ring(0,.15,0,163,'#31bdd6',1.4,{...options,alpha:.8});
    this.ring(0,.2,0,151,'#2b6482',.75,options);
    this.ring(0,.25,0,128,'#3ce1f2',1.1,{...options,alpha:.35});
    const h=70,w=10;
    this.face([{x:-29,y:.35,z:-h/2},{x:-19,y:.35,z:-h/2},{x:-19,y:.35,z:-w/2},{x:19,y:.35,z:-w/2},{x:19,y:.35,z:-h/2},{x:29,y:.35,z:-h/2},{x:29,y:.35,z:h/2},{x:19,y:.35,z:h/2},{x:19,y:.35,z:w/2},{x:-19,y:.35,z:w/2},{x:-19,y:.35,z:h/2},{x:-29,y:.35,z:h/2}], '#30627b',options);
    const spread=78+(this.height-51)*.17;
    for (let i=6;i>=0;i--) {
      const size=spread+i*5;
      const points=Array.from({length:48},(_,n)=>({x:Math.cos(n/48*TAU)*size,y:.7+i*.004,z:Math.sin(n/48*TAU)*size*.69}));
      this.face(points,'#030b19',{...options,alpha:.02+Math.max(.01,.16-(this.height-51)*.0005)/7});
    }
    for (let i=0;i<12;i++) {
      const angle=i/12*TAU;
      this.line([{x:Math.cos(angle)*163,y:.4,z:Math.sin(angle)*163},{x:Math.cos(angle)*173,y:.4,z:Math.sin(angle)*173}],i%3?'#39768e':'#50dbea',i%3?1.4:2.7,{world:true,alpha:.8});
    }
    // Three short world axes and marker dots remain fixed while the aircraft turns.
    const origin={x:205,y:1,z:-105};
    this.line([origin,{x:244,y:1,z:-105}],'#e99b67',1.8,{world:true,alpha:.8});
    this.line([origin,{x:205,y:39,z:-105}],'#71c9e4',1.8,{world:true,alpha:.8});
    this.line([origin,{x:205,y:1,z:-66}],'#8f9ee1',1.8,{world:true,alpha:.8});
    this.disk(205,1.5,-105,3,'#b8e9ef',options);
    // A nose-direction vector rotates with the complete model.
    if (this.state.mode==='flying') {
      this.line([{x:0,y:-3,z:72},{x:0,y:-3,z:107}],this.accent,1.6,{alpha:.65});
      this.face([{x:0,y:-3,z:117},{x:-4,y:-3,z:105},{x:4,y:-3,z:105}],this.accent,{alpha:.7,unlit:true});
      this.line([{x:0,y:4,z:0},{x:0,y:this.height-49,z:0}],'#50cadc',1.1,{world:true,alpha:.45,dash:[3,6]});
      [28,53,78,103,128,153].filter(y=>y<this.height-30).forEach(y=>this.ring(0,y,0,4,'#50cadc',.8,{world:true,alpha:.4}));
      const pulse=this.motionQuery.matches?.3:(time*.35)%1;
      this.ring(0,1,0,88+pulse*42,'#50cadc',1.3,{world:true,alpha:.3*(1-pulse)});
      const route=[];
      for (let n=0;n<=36;n++) {const t=n/36;route.push({x:-203+180*t,y:2+Math.sin(t*Math.PI/2)*(this.height-52),z:-105+82*t});}
      this.line(route,'#59c8df',1.1,{world:true,alpha:.35,dash:[3,6]});
      for (let i=0;i<4;i++) {
        const p=route[i*9];
        this.ring(p.x,p.y,p.z,2.5,'#6addf2',1.1,{world:true,alpha:.6});
      }
    }
  }

  render(time,dt) {
    const {ctx}=this;
    const w=this.width,h=this.heightPx;
    if(!w||!h)return;
    ctx.setTransform(this.dpr,0,0,this.dpr,0,0);
    ctx.clearRect(0,0,w,h);
    const {mode}=this.state;
    const reduced=this.motionQuery.matches;
    const active=mode==='flying';
    const spinning=active||mode==='called';
    const blend=reduced?1:1-Math.exp(-dt*6);
    // Classroom metres become a bounded vertical lift, preserving the pad in view.
    const lift=active ? 35 + 106 * (1-Math.exp(-this.state.height/23)) : 0;
    const targetHeight=51+lift;
    this.height=mix(this.height,targetHeight,reduced?1:1-Math.exp(-dt*3.5));
    const targetPitch=(active?this.state.pitch:0)*Math.PI/180;
    const targetRoll=(active?this.state.roll:0)*Math.PI/180;
    const targetYaw=this.state.yaw*Math.PI/180;
    this.posePitch=mix(this.posePitch,targetPitch,blend);
    this.poseRoll=mix(this.poseRoll,targetRoll,blend);
    const yawDifference=Math.atan2(Math.sin(targetYaw-this.poseYaw),Math.cos(targetYaw-this.poseYaw));
    this.poseYaw+=yawDifference*blend;
    this.rotor+=reduced?0:dt*(active?43:spinning?21:0);
    this.accent=mode==='error'?'#ff7979':mode==='blocked'?'#ffc05e':mode==='landed'?'#91b9c7':COLORS.mint;
    this.lookY=78;
    this.focal=Math.min(w*.95,h*1.2)/(2*Math.tan(22.5*Math.PI/180));
    this.faces=[];
    this.ground(time);
    [[-111,-91],[111,-91],[-111,91],[111,91]].forEach(([x,z],i)=>this.arm(x,z,i,time));
    this.body();
    this.faces.sort((a,b)=>b.depth-a.depth);
    ctx.lineJoin='round';
    ctx.lineCap='round';
    for(const face of this.faces) {
      if(face.points.length<2)continue;
      ctx.globalAlpha=face.alpha;
      ctx.beginPath();
      face.points.forEach((point,i)=>i?ctx.lineTo(point.x,point.y):ctx.moveTo(point.x,point.y));
      if(face.line) {
        ctx.strokeStyle=face.line;ctx.lineWidth=face.lineWidth;ctx.setLineDash(face.dash||[]);ctx.stroke();ctx.setLineDash([]);
      } else {
        ctx.closePath();ctx.fillStyle=face.color;ctx.fill();
        if(face.stroke){ctx.strokeStyle=face.stroke;ctx.lineWidth=face.lineWidth;ctx.stroke();}
      }
    }
    ctx.globalAlpha=1;
  }
}
