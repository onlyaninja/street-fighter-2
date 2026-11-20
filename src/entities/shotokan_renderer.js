/**
 * Modular Shotokan Karateka Procedural Renderer
 * Renders authentic arcade pixel-art style character anatomy and poses
 * for Ryu and Ken with dynamic frame animation and visual details.
 */

import { FighterState } from './fighter.js';

export class ShotokanRenderer {
  static render(ctx, fighter) {
    const s = fighter.state;
    const t = fighter.animFrame;
    const st = fighter.stateTimer;

    switch (s) {
      case FighterState.IDLE:
        this.renderIdle(ctx, fighter, t);
        break;
      case FighterState.WALK_FWD:
        this.renderWalk(ctx, fighter, t, 1);
        break;
      case FighterState.WALK_BACK:
        this.renderWalk(ctx, fighter, t, -1);
        break;
      case FighterState.CROUCH:
        this.renderCrouch(ctx, fighter, t);
        break;
      case FighterState.JUMP:
        this.renderJump(ctx, fighter, t);
        break;
      case FighterState.LIGHT_PUNCH:
        this.renderLightPunch(ctx, fighter, st);
        break;
      case FighterState.HEAVY_PUNCH:
        this.renderHeavyPunch(ctx, fighter, st);
        break;
      case FighterState.LIGHT_KICK:
        this.renderLightKick(ctx, fighter, st);
        break;
      case FighterState.HEAVY_KICK:
        this.renderHeavyKick(ctx, fighter, st);
        break;
      case FighterState.SWEEP:
        this.renderSweep(ctx, fighter, st);
        break;
      case FighterState.HADOUKEN:
        this.renderHadouken(ctx, fighter, st);
        break;
      case FighterState.SHORYUKEN:
        this.renderShoryuken(ctx, fighter, st);
        break;
      case FighterState.TATSUMAKI:
        this.renderTatsumaki(ctx, fighter, st);
        break;
      case FighterState.HITSTUN:
        this.renderHurt(ctx, fighter, st);
        break;
      case FighterState.BLOCKSTUN:
        this.renderBlock(ctx, fighter, st);
        break;
      case FighterState.KNOCKDOWN:
        this.renderKnockdown(ctx, fighter, st);
        break;
      case FighterState.WAKEUP:
        this.renderWakeup(ctx, fighter, st);
        break;
      case FighterState.VICTORY:
        this.renderVictory(ctx, fighter, t);
        break;
      case FighterState.DEFEATED:
        this.renderDefeated(ctx, fighter, st);
        break;
      default:
        this.renderIdle(ctx, fighter, t);
        break;
    }
  }

  // --- ANATOMICAL PARTS ---

  static drawHead(ctx, fighter, hx, hy, facingDir = 1, expression = 'normal') {
    // Face & Neck
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(hx - 8, hy - 4, 16, 14);

    // Chin jawline
    ctx.beginPath();
    ctx.moveTo(hx - 8, hy + 6);
    ctx.lineTo(hx, hy + 12);
    ctx.lineTo(hx + 8, hy + 6);
    ctx.closePath();
    ctx.fill();

    // Hair
    ctx.fillStyle = fighter.hairColor;
    if (fighter.name === 'RYU') {
      // Spiky dark cropped hair
      ctx.fillRect(hx - 10, hy - 14, 20, 10);
      ctx.fillRect(hx - 6, hy - 18, 14, 5);
      ctx.fillRect(hx - 12, hy - 8, 4, 8);
    } else {
      // Ken's long flowing blonde mane
      ctx.fillRect(hx - 11, hy - 14, 22, 12);
      ctx.fillRect(hx - 7, hy - 18, 16, 6);
      ctx.fillRect(hx - 14, hy - 8, 6, 18);
      ctx.fillRect(hx - 12, hy + 6, 5, 12); // Hair draping on neck
    }

    // Headband (Ryu's red headband or Ken's brow)
    if (fighter.headbandColor) {
      ctx.fillStyle = fighter.headbandColor;
      ctx.fillRect(hx - 10, hy - 6, 20, 5);

      // Trailing fluttering headband tails (Ryu only)
      if (fighter.name === 'RYU') {
        const flutter = Math.sin(fighter.animFrame * 0.2) * 4;
        ctx.beginPath();
        ctx.moveTo(hx - 10, hy - 5);
        ctx.quadraticCurveTo(hx - 22, hy - 2 + flutter, hx - 30, hy + 4 + flutter);
        ctx.lineTo(hx - 28, hy + 8 + flutter);
        ctx.quadraticCurveTo(hx - 20, hy + 1 + flutter, hx - 10, hy - 1);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Eyes & Brow
    ctx.fillStyle = '#111827';
    ctx.fillRect(hx + 1, hy - 1, 5, 2); // Eye
    ctx.fillRect(hx - 1, hy - 3, 7, 2); // Intense brow
  }

  static drawBelt(ctx, fighter, bx, by) {
    ctx.fillStyle = fighter.beltColor;
    ctx.fillRect(bx - 12, by - 4, 24, 7);
    // Belt Knot & Hanging Tails
    ctx.fillRect(bx - 2, by + 3, 5, 5);
    const flutter = Math.sin(fighter.animFrame * 0.15) * 2;
    ctx.fillRect(bx - 4, by + 7, 4, 14 + flutter);
    ctx.fillRect(bx + 1, by + 7, 4, 18 - flutter);
  }

  // --- POSES ---

  static renderIdle(ctx, fighter, t) {
    const bob = Math.sin(t * 0.1) * 2;
    const hy = -80 + bob;

    // Legs
    ctx.fillStyle = fighter.giShade;
    ctx.fillRect(-16, -42 + bob, 14, 42 - bob); // Back leg
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(4, -40 + bob, 14, 40 - bob);  // Front leg

    // Feet (Bare feet)
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(-18, -4, 18, 5);
    ctx.fillRect(4, -4, 20, 5);

    // Torso / Gi
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(-14, -70 + bob, 26, 32);

    // Muscular V-neck chest
    ctx.fillStyle = fighter.skinColor;
    ctx.beginPath();
    ctx.moveTo(-4, -70 + bob);
    ctx.lineTo(4, -70 + bob);
    ctx.lineTo(0, -56 + bob);
    ctx.closePath();
    ctx.fill();

    // Belt
    this.drawBelt(ctx, fighter, 0, -40 + bob);

    // Head
    this.drawHead(ctx, fighter, 2, hy);

    // Back Arm Guarding
    ctx.fillStyle = fighter.giShade;
    ctx.fillRect(-18, -68 + bob, 10, 16);
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(-16, -54 + bob, 8, 14);
    ctx.fillStyle = fighter.gloveColor;
    ctx.fillRect(-15, -44 + bob, 9, 8); // Rear fist

    // Front Arm Raised
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(6, -66 + bob, 11, 14);
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(12, -58 + bob, 9, 14);
    ctx.fillStyle = fighter.gloveColor;
    ctx.fillRect(16, -62 + bob, 10, 10); // Lead fist
  }

  static renderWalk(ctx, fighter, t, dir) {
    const walkCycle = Math.sin(t * 0.22);
    const legSpread = walkCycle * 14;
    const bob = Math.abs(walkCycle) * 3;
    const hy = -80 + bob;

    // Legs
    ctx.fillStyle = fighter.giShade;
    ctx.fillRect(-12 - legSpread, -40 + bob, 13, 40 - bob);
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(2 + legSpread, -40 + bob, 13, 40 - bob);

    // Feet
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(-14 - legSpread, -4, 16, 5);
    ctx.fillRect(2 + legSpread, -4, 18, 5);

    // Torso
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(-14 + (dir * 2), -70 + bob, 26, 32);

    // Chest
    ctx.fillStyle = fighter.skinColor;
    ctx.beginPath();
    ctx.moveTo(-4, -70 + bob);
    ctx.lineTo(4, -70 + bob);
    ctx.lineTo(0, -56 + bob);
    ctx.closePath();
    ctx.fill();

    this.drawBelt(ctx, fighter, 0, -40 + bob);
    this.drawHead(ctx, fighter, 2 + (dir * 3), hy);

    // Swinging arms
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(8 + walkCycle * 6, -64 + bob, 10, 16);
    ctx.fillStyle = fighter.gloveColor;
    ctx.fillRect(14 + walkCycle * 8, -52 + bob, 9, 9);
  }

  static renderCrouch(ctx, fighter, t) {
    const cy = -26;
    // Lowered legs
    ctx.fillStyle = fighter.giShade;
    ctx.fillRect(-20, cy - 20, 18, 20);
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(2, cy - 20, 20, 20);

    // Feet
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(-22, -5, 20, 5);
    ctx.fillRect(2, -5, 22, 5);

    // Torso (lowered)
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(-15, cy - 38, 28, 26);
    this.drawBelt(ctx, fighter, 0, cy - 14);

    // Head (tucked)
    this.drawHead(ctx, fighter, 4, cy - 46);

    // Low guard fists
    ctx.fillStyle = fighter.gloveColor;
    ctx.fillRect(14, cy - 32, 11, 11);
    ctx.fillRect(-2, cy - 28, 10, 10);
  }

  static renderJump(ctx, fighter, t) {
    const jy = -50;
    // Tucked legs
    ctx.fillStyle = fighter.giShade;
    ctx.fillRect(-14, jy - 10, 14, 24);
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(2, jy - 14, 15, 22);

    // Feet
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(-12, jy + 12, 12, 6);
    ctx.fillRect(4, jy + 6, 12, 6);

    // Torso
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(-12, jy - 36, 24, 28);
    this.drawBelt(ctx, fighter, 0, jy - 10);

    // Head
    this.drawHead(ctx, fighter, 2, jy - 44);

    // Poised fists
    ctx.fillStyle = fighter.gloveColor;
    ctx.fillRect(12, jy - 38, 10, 10);
    ctx.fillRect(-16, jy - 30, 10, 10);
  }

  static renderLightPunch(ctx, fighter, st) {
    const ext = st < 7 ? 24 : 10;
    // Base stance
    this.renderIdle(ctx, fighter, 0);

    // Punching arm extended
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(6, -66, 14, 10);
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(18, -66, ext, 9);
    // Red fist glove
    ctx.fillStyle = fighter.gloveColor;
    ctx.fillRect(18 + ext, -68, 12, 12);
  }

  static renderHeavyPunch(ctx, fighter, st) {
    const ext = st < 13 ? 38 : 15;
    const lunge = st < 13 ? 8 : 2;

    // Body lunging forward
    ctx.fillStyle = fighter.giShade;
    ctx.fillRect(-18 + lunge, -40, 14, 40);
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(4 + lunge, -40, 14, 40);

    // Torso leaning forward
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(-12 + lunge, -70, 28, 32);
    this.drawBelt(ctx, fighter, lunge, -40);
    this.drawHead(ctx, fighter, 6 + lunge, -80);

    // Power straight punch extended forward
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(12 + lunge, -66, ext, 11);
    ctx.fillStyle = fighter.gloveColor;
    ctx.fillRect(12 + lunge + ext, -69, 14, 15);
  }

  static renderLightKick(ctx, fighter, st) {
    const ext = st < 8 ? 26 : 10;
    // Plant leg
    ctx.fillStyle = fighter.giShade;
    ctx.fillRect(-12, -40, 14, 40);
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(-14, -4, 16, 5);

    // Torso
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(-12, -70, 24, 32);
    this.drawBelt(ctx, fighter, 0, -40);
    this.drawHead(ctx, fighter, 0, -80);

    // Kicking leg snapped forward
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(4, -48, 14, 14);
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(14, -46, ext, 10);
    ctx.fillRect(14 + ext, -48, 10, 12); // Foot
  }

  static renderHeavyKick(ctx, fighter, st) {
    // High roundhouse kick
    ctx.fillStyle = fighter.giShade;
    ctx.fillRect(-14, -40, 14, 40);
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(-16, -4, 16, 5);

    // Torso tilted back
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(-18, -68, 22, 30);
    this.drawBelt(ctx, fighter, -4, -40);
    this.drawHead(ctx, fighter, -12, -78);

    // High extended leg
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(2, -62, 16, 14);
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(16, -72, 28, 12);
    ctx.fillRect(42, -76, 12, 16); // High foot
  }

  static renderSweep(ctx, fighter, st) {
    const cy = -16;
    // Low spinning crouch
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(-16, cy - 24, 26, 24);
    this.drawBelt(ctx, fighter, 0, cy - 8);
    this.drawHead(ctx, fighter, -2, cy - 34);

    // Hands supporting on ground
    ctx.fillStyle = fighter.gloveColor;
    ctx.fillRect(-18, -10, 10, 10);

    // Sweeping leg skimming across the floor
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(8, -14, 44, 12);
    ctx.fillRect(48, -18, 14, 16); // Sweeping foot
  }

  static renderHadouken(ctx, fighter, st) {
    if (st < 10) {
      // Windup: Hands drawn back to hip, collecting blue energy
      ctx.fillStyle = fighter.giShade;
      ctx.fillRect(-18, -38, 14, 38);
      ctx.fillStyle = fighter.giColor;
      ctx.fillRect(2, -38, 14, 38);

      ctx.fillStyle = fighter.giColor;
      ctx.fillRect(-14, -68, 26, 32);
      this.drawBelt(ctx, fighter, 0, -38);
      this.drawHead(ctx, fighter, 4, -78);

      // Hands cupped at hip
      ctx.fillStyle = fighter.gloveColor;
      ctx.fillRect(-22, -54, 14, 14);

      // Growing glowing blue ki sphere between hands!
      const aura = Math.min(14, st * 1.5);
      const grad = ctx.createRadialGradient(-16, -46, 2, -16, -46, aura);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.5, '#00e5ff');
      grad.addColorStop(1, 'rgba(0, 120, 255, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(-16, -46, aura, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Thrust: Palms launched forward firing the Hadouken!
      ctx.fillStyle = fighter.giShade;
      ctx.fillRect(-20, -38, 15, 38);
      ctx.fillStyle = fighter.giColor;
      ctx.fillRect(4, -38, 16, 38);

      ctx.fillStyle = fighter.giColor;
      ctx.fillRect(-10, -68, 28, 32);
      this.drawBelt(ctx, fighter, 4, -38);
      this.drawHead(ctx, fighter, 8, -78);

      // Both arms thrust forward
      ctx.fillStyle = fighter.skinColor;
      ctx.fillRect(16, -56, 24, 14);
      ctx.fillStyle = fighter.gloveColor;
      ctx.fillRect(36, -60, 12, 20); // Both open palms pushing forward
    }
  }

  static renderShoryuken(ctx, fighter, st) {
    const jy = -70;
    // Rising dragon uppercut
    // Torso vertically extended
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(-10, jy - 20, 20, 36);
    this.drawBelt(ctx, fighter, 0, jy + 14);
    this.drawHead(ctx, fighter, 2, jy - 30);

    // Soaring skyward fist
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(2, jy - 46, 10, 28);
    ctx.fillStyle = fighter.gloveColor;
    ctx.fillRect(0, jy - 58, 14, 14); // Thrusting fist pointing straight up!

    // Trailing raised knee
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(2, jy + 14, 14, 16);
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(8, jy + 28, 12, 10);

    // Other leg hanging straight down
    ctx.fillStyle = fighter.giShade;
    ctx.fillRect(-12, jy + 14, 12, 26);
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(-12, jy + 38, 12, 6);
  }

  static renderTatsumaki(ctx, fighter, st) {
    const jy = -50;
    const spinAngle = st * 0.45;
    const flip = Math.sin(spinAngle) > 0 ? 1 : -1;

    ctx.save();
    ctx.scale(flip, 1);

    // Spinning torso
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(-12, jy - 24, 24, 28);
    this.drawHead(ctx, fighter, 0, jy - 34);

    // Horizontal extended kicking leg
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(8, jy - 14, 36, 12);
    ctx.fillRect(40, jy - 16, 12, 16);

    // Bent tucked other leg
    ctx.fillStyle = fighter.giShade;
    ctx.fillRect(-12, jy + 4, 14, 16);

    ctx.restore();
  }

  static renderHurt(ctx, fighter, st) {
    // Reeling backward in pain
    ctx.fillStyle = fighter.giShade;
    ctx.fillRect(-18, -38, 14, 38);
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(-2, -38, 14, 38);

    // Torso arched back
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(-18, -68, 24, 32);
    this.drawBelt(ctx, fighter, -6, -38);

    // Head jerked backward
    this.drawHead(ctx, fighter, -12, -76);

    // Fists thrown back
    ctx.fillStyle = fighter.gloveColor;
    ctx.fillRect(-24, -60, 10, 10);
  }

  static renderBlock(ctx, fighter, st) {
    const isCrouch = fighter.state === FighterState.CROUCH || fighter.stateTimer < 5;
    const by = isCrouch ? -20 : -40;

    // Defensive braced posture
    ctx.fillStyle = fighter.giShade;
    ctx.fillRect(-16, by, 14, Math.abs(by));
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(2, by, 14, Math.abs(by));

    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(-12, by - 30, 24, 30);
    this.drawBelt(ctx, fighter, 0, by);
    this.drawHead(ctx, fighter, -2, by - 38);

    // Crossed forearms guarding face & chest
    ctx.fillStyle = fighter.gloveColor;
    ctx.fillRect(10, by - 26, 12, 18);
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(4, by - 24, 12, 14);
  }

  static renderKnockdown(ctx, fighter, st) {
    // Falling or lying flat on ground
    if (fighter.y < 318) {
      // Spinning horizontally in air
      ctx.save();
      ctx.rotate(-0.8);
      ctx.fillStyle = fighter.giColor;
      ctx.fillRect(-12, -40, 24, 34);
      this.drawHead(ctx, fighter, -12, -50);
      ctx.restore();
    } else {
      // Flat on back on floor
      ctx.fillStyle = fighter.giColor;
      ctx.fillRect(-35, -14, 45, 14);
      ctx.fillStyle = fighter.skinColor;
      ctx.fillRect(10, -12, 25, 12); // Legs flat
      this.drawHead(ctx, fighter, -42, -10);
    }
  }

  static renderWakeup(ctx, fighter, st) {
    // Pushing self back up off floor
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(-22, -26, 32, 22);
    this.drawHead(ctx, fighter, -18, -36);
    ctx.fillStyle = fighter.gloveColor;
    ctx.fillRect(-26, -10, 10, 10);
    ctx.fillRect(10, -10, 10, 10);
  }

  static renderVictory(ctx, fighter, t) {
    // Triumphant crossed-arms stance
    ctx.fillStyle = fighter.giShade;
    ctx.fillRect(-16, -42, 14, 42);
    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(4, -42, 14, 42);

    ctx.fillStyle = fighter.giColor;
    ctx.fillRect(-14, -72, 28, 34);
    this.drawBelt(ctx, fighter, 0, -42);
    this.drawHead(ctx, fighter, 0, -84);

    // Crossed arms across chest
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(-10, -64, 20, 12);
    ctx.fillStyle = fighter.gloveColor;
    ctx.fillRect(-12, -62, 10, 10);
    ctx.fillRect(4, -62, 10, 10);
  }

  static renderDefeated(ctx, fighter, st) {
    // Lying flat, defeated
    this.renderKnockdown(ctx, fighter, 50);
  }
}
