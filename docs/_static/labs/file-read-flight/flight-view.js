import { DroneScene } from '../parameter-flight/drone.js';

export class FlightView extends DroneScene {
  fitCamera() {
    super.fitCamera();
    // Leave extra room around planned waypoints for a larger classroom model.
    this.scale *= .9;
    const modelPixels = Math.max(118, Math.min(181, this.width * .33));
    this.modelScale = modelPixels / 330 / this.scale;
    this.height = this.state.z + 51 * this.modelScale;
  }

  topView() {
    this.cameraAzimuth = 0;
    this.cameraElevation = Math.PI / 2;
    this.zoom = 1;
  }

  overlay() {
    super.overlay();
    const { ctx, width, heightPx } = this;
    const nose = this.project(this.local({ x: 0, y: 23, z: 65 }));
    const tip = this.project(this.local({ x: 0, y: 23, z: 129 }));
    const dx = tip.x - nose.x;
    const dy = tip.y - nose.y;
    const length = Math.hypot(dx, dy);
    if (tip.x < 18 || tip.x > width - 18 || tip.y < 16 || tip.y > heightPx - 31 || length < 7) return;
    const ux = dx / length;
    const uy = dy / length;
    ctx.save();
    ctx.strokeStyle = '#ffca76';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(nose.x, nose.y);
    ctx.lineTo(tip.x, tip.y);
    ctx.lineTo(tip.x - 7 * ux - 4 * uy, tip.y - 7 * uy + 4 * ux);
    ctx.moveTo(tip.x, tip.y);
    ctx.lineTo(tip.x - 7 * ux + 4 * uy, tip.y - 7 * uy - 4 * ux);
    ctx.stroke();
    ctx.restore();
  }
}
