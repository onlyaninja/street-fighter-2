/**
 * Suzaku Castle Rooftop Stage (Ryu's Iconic Stage)
 * Features parallax Japanese architecture, tiled rooftops, glowing moon,
 * lanterns, and drifting sakura cherry blossom petals.
 */

export class SuzakuStage {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.groundY = 320; // Y coordinate where fighters stand

    // Stage horizontal bounds
    this.minX = -200;
    this.maxX = 1000;

    // Drifting Sakura petals
    this.petals = [];
    for (let i = 0; i < 35; i++) {
      this.petals.push({
        x: Math.random() * (this.maxX - this.minX) + this.minX,
        y: Math.random() * height,
        speedX: 0.8 + Math.random() * 1.4,
        speedY: 0.5 + Math.random() * 0.9,
        size: 3 + Math.random() * 3,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05
      });
    }

    // Clouds
    this.clouds = [
      { x: -100, y: 50, speed: 0.15, scale: 1.2 },
      { x: 300, y: 75, speed: 0.22, scale: 0.9 },
      { x: 700, y: 40, speed: 0.18, scale: 1.5 }
    ];
  }

  update() {
    // Animate petals
    for (const p of this.petals) {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rot += p.rotSpeed;

      if (p.x > this.maxX + 50) p.x = this.minX - 20;
      if (p.y > this.height) p.y = -10;
    }

    // Animate clouds
    for (const c of this.clouds) {
      c.x += c.speed;
      if (c.x > this.maxX + 200) {
        c.x = this.minX - 200;
      }
    }
  }

  render(ctx, camera) {
    const camX = camera.x;
    const viewW = ctx.canvas.width;
    const viewH = ctx.canvas.height;

    // 1. SKY GRADIENT (Deep twilight indigo into burning orange horizon)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, viewH);
    skyGrad.addColorStop(0, '#0c102b');
    skyGrad.addColorStop(0.45, '#1e1b4b');
    skyGrad.addColorStop(0.7, '#7c2d12');
    skyGrad.addColorStop(1, '#ea580c');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, viewW, viewH);

    // 2. GLOWING HARVEST MOON (slowest parallax)
    const moonX = 520 - camX * 0.05;
    const moonY = 95;
    const moonGrad = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 55);
    moonGrad.addColorStop(0, '#fffbeb');
    moonGrad.addColorStop(0.5, '#fef08a');
    moonGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 32, 0, Math.PI * 2);
    ctx.fill();

    // 3. DISTANT MOUNTAINS & CLOUDS (0.15 parallax)
    ctx.fillStyle = '#1e1135';
    ctx.beginPath();
    ctx.moveTo(0, viewH);
    for (let x = -200; x <= viewW + 300; x += 120) {
      const peakX = x - camX * 0.15;
      const peakY = 220 + Math.sin(x * 0.02) * 45;
      ctx.lineTo(peakX, peakY);
    }
    ctx.lineTo(viewW + 300, viewH);
    ctx.closePath();
    ctx.fill();

    // Drifting clouds
    ctx.fillStyle = 'rgba(255, 180, 150, 0.15)';
    for (const c of this.clouds) {
      const cx = c.x - camX * 0.12;
      ctx.beginPath();
      ctx.ellipse(cx, c.y, 70 * c.scale, 20 * c.scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. MIDGROUND PAGODAS & CASTLE SILHOUETTE (0.35 parallax)
    this.renderCastleSilhouette(ctx, camX);

    // 5. FOREGROUND ROOFTOP (1.0 parallax - matches fighter world space)
    this.renderRooftop(ctx, camX);

    // 6. SAKURA PETALS (foreground layer)
    this.renderSakuraPetals(ctx, camX);
  }

  renderCastleSilhouette(ctx, camX) {
    const offsetX = -camX * 0.35;
    ctx.fillStyle = '#0f0a1c';

    // Pagoda Tower 1 (Left)
    const p1X = 140 + offsetX;
    ctx.fillRect(p1X - 25, 140, 50, 150);
    // Pagoda tiered roofs
    for (let tier = 0; tier < 3; tier++) {
      const ty = 140 + tier * 35;
      const tw = 80 - tier * 10;
      ctx.beginPath();
      ctx.moveTo(p1X - tw / 2, ty + 15);
      ctx.quadraticCurveTo(p1X, ty + 5, p1X + tw / 2, ty + 15);
      ctx.lineTo(p1X + tw / 2 - 6, ty + 24);
      ctx.lineTo(p1X - tw / 2 + 6, ty + 24);
      ctx.closePath();
      ctx.fill();
    }

    // Pagoda Tower 2 (Right)
    const p2X = 640 + offsetX;
    ctx.fillRect(p2X - 35, 120, 70, 180);
    for (let tier = 0; tier < 4; tier++) {
      const ty = 120 + tier * 30;
      const tw = 100 - tier * 12;
      ctx.beginPath();
      ctx.moveTo(p2X - tw / 2, ty + 15);
      ctx.quadraticCurveTo(p2X, ty + 5, p2X + tw / 2, ty + 15);
      ctx.lineTo(p2X + tw / 2 - 8, ty + 22);
      ctx.lineTo(p2X - tw / 2 + 8, ty + 22);
      ctx.closePath();
      ctx.fill();
    }

    // Castle Wall Battlements
    ctx.fillRect(-200 + offsetX, 240, 1400, 70);

    // Warm Lanterns in midground
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(p1X, 220, 3, 0, Math.PI * 2);
    ctx.arc(p2X - 15, 205, 3, 0, Math.PI * 2);
    ctx.arc(p2X + 15, 205, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  renderRooftop(ctx, camX) {
    const rx = -camX;
    const gy = this.groundY;

    // Wooden Foundation Beam
    ctx.fillStyle = '#3f1f0e';
    ctx.fillRect(this.minX + rx, gy + 12, (this.maxX - this.minX) + 400, 20);

    // Japanese Dark Ceramic Curved Tile Roof Surface
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(this.minX + rx, gy, (this.maxX - this.minX) + 400, 14);

    // Tile Ridge Segments
    ctx.fillStyle = '#292524';
    for (let tx = this.minX; tx < this.maxX + 300; tx += 28) {
      const tileX = tx + rx;
      ctx.fillRect(tileX, gy - 2, 22, 14);
      // Highlight on top of tile
      ctx.fillStyle = '#44403c';
      ctx.fillRect(tileX, gy - 2, 22, 2);
      ctx.fillStyle = '#292524';
    }

    // Lower Roof Tier
    ctx.fillStyle = '#0c0a09';
    ctx.fillRect(this.minX + rx, gy + 32, (this.maxX - this.minX) + 400, 100);

    // Decorative Dragon/Gargoyle Roof Finials (Onigawara / Shachihoko) on left & right
    this.renderRoofOrnament(ctx, this.minX + rx + 60, gy - 25, false);
    this.renderRoofOrnament(ctx, this.maxX + rx - 60, gy - 25, true);
  }

  renderRoofOrnament(ctx, x, y, flip) {
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    ctx.fillStyle = '#292524';

    // Stylized Shachihoko curved dorsal tail
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.quadraticCurveTo(-15, 10, -5, -15);
    ctx.quadraticCurveTo(15, -25, 20, -5);
    ctx.quadraticCurveTo(5, 5, 15, 30);
    ctx.closePath();
    ctx.fill();

    // Golden eye
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(5, -5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderSakuraPetals(ctx, camX) {
    ctx.fillStyle = 'rgba(255, 182, 193, 0.85)';
    for (const p of this.petals) {
      const px = p.x - camX * 0.9;
      ctx.save();
      ctx.translate(px, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
