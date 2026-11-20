/**
 * Projectile Entity
 * Supports Hadouken (Ryu/Ken), Kikoken (Chun-Li), and Sonic Boom (Guile).
 */

export class Projectile {
  constructor(x, y, dir, owner, characterName = 'ryu') {
    this.x = x;
    this.y = y;
    this.dir = dir; // 1 for right, -1 for left
    this.owner = owner; // 'p1' or 'p2'
    this.characterName = characterName.toLowerCase();
    this.speed = this.characterName === 'guile' ? 8.2 : (this.characterName === 'dhalsim' || this.characterName === 'yoga_fire' ? 5.2 : 7.2);
    this.radius = 18;
    this.active = true;
    this.damage = 14;
    this.hitstun = 20;
    this.blockstun = 14;
    this.knockbackX = 6;
    this.animFrame = 0;
  }

  update(stageBounds, particleSystem) {
    if (!this.active) return;
    this.x += this.speed * this.dir;
    this.animFrame++;

    // Trail sparks / flames
    if (this.animFrame % 2 === 0) {
      if (this.characterName === 'dhalsim' || this.characterName === 'yoga_fire') {
        particleSystem.createFlames(this.x - this.dir * 12, this.y, 2);
      } else {
        particleSystem.createHadoukenTrail(this.x - this.dir * 12, this.y);
      }
    }

    // Screen boundary despawn
    if (this.x < stageBounds.minX - 50 || this.x > stageBounds.maxX + 50) {
      this.active = false;
    }
  }

  getHitbox() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2
    };
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.dir === -1) {
      ctx.scale(-1, 1);
    }

    const t = this.animFrame * 0.25;
    const pulse = Math.sin(t) * 3;

    if (this.characterName === 'guile') {
      // Sonic Boom: Spinning yellow & green crescent razor blade
      ctx.rotate(this.animFrame * 0.4);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, 18, -Math.PI / 2, Math.PI / 2);
      ctx.quadraticCurveTo(8, 0, 0, -18);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(0, 0, 14, -Math.PI / 2, Math.PI / 2);
      ctx.quadraticCurveTo(5, 0, 0, -14);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, -12, 6, 24);
    } else if (this.characterName === 'chun-li') {
      // Kikoken: Glowing pink and cyan spirit sphere
      const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, this.radius + 6 + pulse);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#f472b6');
      grad.addColorStop(0.75, '#38bdf8');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 6 + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(2, 0, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.characterName === 'dhalsim' || this.characterName === 'yoga_fire') {
      // Yoga Fire: Blazing flame sphere with fiery flickering halo
      const grad = ctx.createRadialGradient(0, 0, 3, 0, 0, this.radius + 8 + pulse);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.25, '#facc15');
      grad.addColorStop(0.65, '#ea580c');
      grad.addColorStop(0.9, '#dc2626');
      grad.addColorStop(1, 'rgba(220, 38, 38, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 8 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Flame core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(3, 0, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flame tail curls
      ctx.fillStyle = 'rgba(234, 88, 12, 0.8)';
      ctx.beginPath();
      ctx.moveTo(-4, -9);
      ctx.lineTo(-22 - Math.sin(t * 3) * 7, -3);
      ctx.lineTo(-4, 9);
      ctx.closePath();
      ctx.fill();
    } else {
      // Classic Blue Hadouken
      const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, this.radius + 6 + pulse);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, '#00e5ff');
      grad.addColorStop(0.7, '#0055ff');
      grad.addColorStop(1, 'rgba(0, 40, 200, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 6 + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(2, 0, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ki tail
      ctx.fillStyle = 'rgba(0, 220, 255, 0.7)';
      ctx.beginPath();
      ctx.moveTo(-4, -8);
      ctx.lineTo(-24 - Math.sin(t * 2) * 6, -2);
      ctx.lineTo(-4, 8);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}
