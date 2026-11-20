/**
 * Visual FX Particle System
 * Produces authentic arcade hitsparks, guard sparks, dust clouds, and fire particles.
 */

export class Particle {
  constructor(x, y, vx, vy, color, size, life, type = 'spark') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.type = type; // 'spark', 'star', 'dust', 'flame', 'ring'
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.4;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotSpeed;

    if (this.type === 'dust') {
      this.vy *= 0.92;
      this.vx *= 0.92;
      this.size += 0.35;
    } else if (this.type === 'spark' || this.type === 'flame') {
      this.vy += 0.15; // gravity
      this.vx *= 0.95;
    } else if (this.type === 'ring') {
      this.size += 2.5;
    }

    this.life--;
  }

  render(ctx) {
    const progress = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, progress));

    if (this.type === 'spark') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(1, this.size * progress), 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'star') {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = this.color;
      const s = this.size * progress;
      ctx.beginPath();
      ctx.moveTo(0, -s * 2);
      ctx.lineTo(s * 0.6, -s * 0.6);
      ctx.lineTo(s * 2, 0);
      ctx.lineTo(s * 0.6, s * 0.6);
      ctx.lineTo(0, s * 2);
      ctx.lineTo(-s * 0.6, s * 0.6);
      ctx.lineTo(-s * 2, 0);
      ctx.lineTo(-s * 0.6, -s * 0.6);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'dust') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'flame') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(1, this.size * progress), 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'ring') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = Math.max(1, 4 * progress);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

export class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    for (const p of this.particles) {
      p.render(ctx);
    }
  }

  // Hit Spark on opponent connection
  createHitSpark(x, y, heavy = false) {
    const count = heavy ? 18 : 10;
    // Central impact star
    this.particles.push(new Particle(x, y, 0, 0, '#ffffff', heavy ? 16 : 10, 8, 'star'));
    this.particles.push(new Particle(x, y, 0, 0, '#ffea00', heavy ? 14 : 9, 12, 'star'));
    this.particles.push(new Particle(x, y, 0, 0, '#ff3300', heavy ? 8 : 4, 10, 'ring'));

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = (heavy ? 4.5 : 3.0) + Math.random() * 3.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = Math.random() > 0.4 ? '#ffdd00' : (Math.random() > 0.5 ? '#ff5500' : '#ffffff');
      this.particles.push(new Particle(x, y, vx, vy, color, heavy ? 4 : 3, 14 + Math.random() * 8, 'spark'));
    }
  }

  // Guard Spark on block
  createBlockSpark(x, y) {
    this.particles.push(new Particle(x, y, 0, 0, '#00e5ff', 12, 10, 'ring'));
    this.particles.push(new Particle(x, y, 0, 0, '#ffffff', 8, 8, 'star'));
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 2.5 + Math.random() * 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.particles.push(new Particle(x, y, vx, vy, '#00ffff', 2.5, 12, 'spark'));
    }
  }

  // Dust cloud when jumping or landing
  createDust(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 3;
      const vy = -Math.random() * 1.5;
      const color = 'rgba(210, 200, 190, 0.45)';
      this.particles.push(new Particle(x + (Math.random() - 0.5) * 16, y, vx, vy, color, 4 + Math.random() * 4, 18 + Math.random() * 8, 'dust'));
    }
  }

  // Flame particles for Ken's fiery Shoryuken
  createFlames(x, y, count = 4) {
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 2;
      const vy = -Math.random() * 3.5;
      const color = Math.random() > 0.5 ? '#ff3b00' : '#ff9900';
      this.particles.push(new Particle(x + (Math.random() - 0.5) * 14, y + (Math.random() - 0.5) * 14, vx, vy, color, 4 + Math.random() * 4, 12, 'flame'));
    }
  }

  // Hadouken trail particles
  createHadoukenTrail(x, y) {
    const vx = -(Math.random() * 2);
    const vy = (Math.random() - 0.5) * 2;
    const color = Math.random() > 0.5 ? '#00b4d8' : '#caf0f8';
    this.particles.push(new Particle(x, y, vx, vy, color, 3 + Math.random() * 3, 10, 'spark'));
  }

  // Blanka Electric Thunder crackling electricity particles
  createElectricitySparks(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 4.0;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = Math.random() > 0.4 ? '#00ffff' : (Math.random() > 0.5 ? '#ffff00' : '#ffffff');
      this.particles.push(new Particle(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 40, vx, vy, color, 3 + Math.random() * 3, 10 + Math.random() * 6, 'star'));
    }
  }
}
