/**
 * Arcade Character Procedural Renderer
 * Renders all 5 Street Fighter II roster characters:
 * - RYU: White Gi, Red Headband
 * - KEN: Crimson Gi, Flowing Blonde Hair
 * - CHUN-LI: Blue Qipao, White Boots, Ox Horn Buns, Spiked Cuffs
 * - GUILE: Green Camo Fatigues, Golden Flat-Top
 * - M. BISON: Red Dictator Uniform, Silver Pauldrons, Officer Cap
 */

import { FighterState } from './fighter.js';

export class CharacterRenderer {
  static render(ctx, fighter) {
    const name = fighter.name;
    if (name === 'CHUN-LI') {
      this.renderChunLi(ctx, fighter);
    } else if (name === 'GUILE') {
      this.renderGuile(ctx, fighter);
    } else if (name === 'BISON' || name === 'M. BISON' || name === 'M.BISON') {
      this.renderBison(ctx, fighter);
    } else if (name === 'BLANKA') {
      this.renderBlanka(ctx, fighter);
    } else if (name === 'E. HONDA' || name === 'E.HONDA' || name === 'EHONDA') {
      this.renderEhonDa(ctx, fighter);
    } else if (name === 'ZANGIEF') {
      this.renderZangief(ctx, fighter);
    } else if (name === 'DHALSIM') {
      this.renderDhalsim(ctx, fighter);
    } else {
      this.renderShotokan(ctx, fighter);
    }
  }

  // ==========================================
  // RYU & KEN (SHOTOKAN)
  // ==========================================
  static renderShotokan(ctx, fighter) {
    const s = fighter.state;
    const t = fighter.animFrame;
    const st = fighter.stateTimer;
    const bob = Math.sin(t * 0.1) * 2;
    const hy = -80 + bob;

    switch (s) {
      case FighterState.IDLE:
        // Rear Leg with shade
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16, -42 + bob, 14, 42 - bob);
        // Lead Leg
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(4, -40 + bob, 14, 40 - bob);
        // Bare Feet with toes
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-18, -4, 18, 5);
        ctx.fillRect(4, -4, 20, 5);
        // Gi Torso
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-14, -70 + bob, 26, 32);
        // V-Neck Chest Musculature
        ctx.fillStyle = fighter.skinColor;
        ctx.beginPath();
        ctx.moveTo(-4, -70 + bob);
        ctx.lineTo(4, -70 + bob);
        ctx.lineTo(0, -56 + bob);
        ctx.closePath();
        ctx.fill();
        // Tied Black Belt with fluttering ends
        this.drawBelt(ctx, fighter, 0, -40 + bob);
        // Detailed Head with expression
        this.drawShotokanHead(ctx, fighter, 2, hy, 'normal');
        // Four Limbs - Rear Arm (Guard)
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-18, -68 + bob, 10, 16);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-16, -54 + bob, 8, 14);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-15, -44 + bob, 9, 8);
        // Four Limbs - Lead Arm (Forward Guard)
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(6, -66 + bob, 11, 14);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(12, -58 + bob, 9, 14);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(16, -62 + bob, 10, 10);
        break;

      case FighterState.WALK_FWD:
      case FighterState.WALK_BACK:
        const stride = Math.sin(t * 0.22) * 7;
        const armSwing = Math.sin(t * 0.22) * 5;
        // Striding Legs
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16 + stride, -42, 14, 42);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(4 - stride, -40, 14, 40);
        // Bare Feet
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-18 + stride, -4, 18, 5);
        ctx.fillRect(4 - stride, -4, 20, 5);
        // Gi Torso
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-14, -70, 26, 32);
        // Chest
        ctx.fillStyle = fighter.skinColor;
        ctx.beginPath();
        ctx.moveTo(-4, -70);
        ctx.lineTo(4, -70);
        ctx.lineTo(0, -56);
        ctx.closePath();
        ctx.fill();
        this.drawBelt(ctx, fighter, 0, -40);
        this.drawShotokanHead(ctx, fighter, 2, -80, 'normal');
        // Swinging Arms in Combat Guard (4 Limbs!)
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-18 - armSwing, -68, 10, 15);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-16 - armSwing, -55, 8, 13);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-15 - armSwing, -45, 9, 8);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(6 + armSwing, -66, 11, 14);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(12 + armSwing, -56, 9, 13);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(16 + armSwing, -50, 10, 9);
        break;

      case FighterState.CROUCH:
        // Crouching Bent Legs
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-20, -46, 18, 22);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(2, -46, 20, 22);
        // Bare Feet Planted
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-22, -5, 20, 5);
        ctx.fillRect(2, -5, 22, 5);
        // Lowered Torso
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-15, -64, 28, 26);
        this.drawBelt(ctx, fighter, 0, -40);
        this.drawShotokanHead(ctx, fighter, 4, -72, 'normal');
        // Guard Arms in Low Stance (Previously Missing!)
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-18, -62, 9, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-16, -52, 7, 10);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-15, -44, 9, 8);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(8, -60, 10, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(12, -50, 8, 10);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(14, -42, 10, 9);
        break;

      case FighterState.JUMP:
        // Tucked Aerial Legs
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-14, -60, 14, 24);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(2, -64, 15, 22);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-16, -38, 14, 6);
        ctx.fillRect(4, -44, 14, 6);
        // Aerial Torso
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-12, -86, 24, 28);
        this.drawBelt(ctx, fighter, 0, -60);
        this.drawShotokanHead(ctx, fighter, 2, -94, 'normal');
        // Aerial Guard Arms (Previously Missing!)
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16, -84, 8, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-18, -74, 8, 12);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-20, -64, 10, 10);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(6, -82, 9, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(10, -72, 8, 12);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(14, -62, 10, 10);
        break;

      case FighterState.BLOCKSTUN:
        // Braced Legs
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16, -40, 14, 40);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(4, -38, 14, 38);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-18, -4, 18, 5);
        ctx.fillRect(4, -4, 20, 5);
        // Torso
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-12, -70, 26, 32);
        this.drawBelt(ctx, fighter, 0, -40);
        this.drawShotokanHead(ctx, fighter, -2, -80, 'normal');
        // Double Forearm Cross-Block (Classic Shotokan Guard!)
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-8, -68, 10, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(0, -76, 8, 20);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(0, -84, 10, 10);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(4, -64, 10, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(6, -70, 8, 18);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(6, -78, 10, 10);
        break;

      case FighterState.HITSTUN:
        // Reeling Legs
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-20, -38, 14, 38);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(0, -36, 14, 36);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-22, -4, 18, 5);
        ctx.fillRect(0, -4, 18, 5);
        // Torso Recoiling Backwards
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-16, -68, 26, 32);
        this.drawBelt(ctx, fighter, -4, -38);
        // Head Tilted Back with Wincing Hurt Expression
        this.drawShotokanHead(ctx, fighter, -10, -78, 'hurt');
        // Arms Flung Back from Impact
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-24, -66, 10, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-26, -56, 8, 12);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-28, -46, 10, 10);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-4, -62, 10, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-2, -52, 8, 12);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(0, -42, 10, 10);
        break;

      case FighterState.LIGHT_PUNCH:
        // Standing legs
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16, -42, 14, 42);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(4, -40, 14, 40);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-18, -4, 16, 5);
        ctx.fillRect(4, -4, 16, 5);
        // Torso & head
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-12, -70, 26, 32);
        this.drawBelt(ctx, fighter, 0, -40);
        this.drawShotokanHead(ctx, fighter, 2, -80, 'normal');
        // Rear guard fist
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-16, -62, 10, 10);
        // Lead jab
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(6, -66, 14, 10);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(18, -66, 24, 9);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(42, -68, 12, 12);
        break;

      case FighterState.HEAVY_PUNCH:
        // Legs
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16, -40, 14, 40);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(4, -40, 14, 40);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-18, -4, 18, 5);
        ctx.fillRect(4, -4, 18, 5);
        // Torso & head
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-10, -70, 28, 32);
        this.drawBelt(ctx, fighter, 4, -40);
        this.drawShotokanHead(ctx, fighter, 8, -80, 'normal');
        // Rear Arm Cocked at Hip (Hikite Karate Chamber)
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-14, -64, 10, 10);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-16, -56, 8, 8);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-18, -50, 10, 10);
        // Lead Power Punch
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(14, -66, 38, 11);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(52, -69, 14, 15);
        break;

      case FighterState.LIGHT_KICK:
        // Plant leg (single rear leg on ground)
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-14, -40, 14, 40);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-16, -4, 16, 5);
        // Torso & head
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-12, -70, 24, 32);
        this.drawBelt(ctx, fighter, 0, -40);
        this.drawShotokanHead(ctx, fighter, 0, -80, 'normal');
        // Guard arms
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-14, -62, 10, 10);
        ctx.fillRect(4, -62, 10, 10);
        // Snapped kick leg
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(4, -48, 14, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(16, -46, 24, 10);
        ctx.fillRect(38, -48, 10, 12);
        break;

      case FighterState.HEAVY_KICK:
        // Plant leg
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-14, -40, 14, 40);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-16, -4, 16, 5);
        // Leaning Torso & head
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-18, -68, 22, 30);
        this.drawBelt(ctx, fighter, -4, -40);
        this.drawShotokanHead(ctx, fighter, -12, -78, 'normal');
        // Balance Guard Arms (Previously Missing!)
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16, -66, 10, 10);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-14, -58, 9, 9);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(2, -62, 10, 10);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(8, -54, 8, 8);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(12, -48, 9, 9);
        // High Roundhouse Kick Leg
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(10, -70, 20, 14);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(28, -72, 20, 12);
        ctx.fillRect(46, -76, 12, 16);
        break;

      case FighterState.SWEEP:
        // Crouching Plant Leg
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16, -26, 14, 26);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-18, -4, 16, 5);
        // Torso & head
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-16, -38, 26, 24);
        this.drawBelt(ctx, fighter, 0, -22);
        this.drawShotokanHead(ctx, fighter, -2, -48, 'normal');
        // Both Arms Supporting & Guarding (Previously Missing!)
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-18, -32, 8, 10);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-20, -22, 7, 10);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-22, -12, 9, 8); // Hand on floor
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-4, -36, 8, 10);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(2, -30, 9, 8);
        // Low Sweeping Leg
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(4, -18, 18, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(22, -14, 28, 12);
        ctx.fillRect(50, -18, 14, 16);
        break;

      case FighterState.HADOUKEN:
        // Standing braced stance
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16, -38, 14, 38);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(2, -38, 14, 38);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-18, -4, 16, 5);
        ctx.fillRect(2, -4, 18, 5);

        if (st < 10) {
          // Gathering Ki Phase
          ctx.fillStyle = fighter.giColor;
          ctx.fillRect(-14, -68, 26, 32);
          this.drawBelt(ctx, fighter, 0, -38);
          this.drawShotokanHead(ctx, fighter, 4, -78, 'normal');
          // Both hands drawn back holding the ki sphere
          ctx.fillStyle = fighter.gloveColor;
          ctx.fillRect(-22, -54, 14, 14);
          ctx.fillRect(-16, -48, 14, 14);
          const aura = Math.min(14, st * 1.5);
          ctx.fillStyle = '#00e5ff';
          ctx.beginPath();
          ctx.arc(-16, -46, aura, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Thrusting Release Phase - Roaring Battle Cry!
          ctx.fillStyle = fighter.giColor;
          ctx.fillRect(-10, -68, 28, 32);
          this.drawBelt(ctx, fighter, 4, -38);
          this.drawShotokanHead(ctx, fighter, 8, -78, 'kiai');
          // Both arms thrust forward in unison releasing the Hadouken!
          ctx.fillStyle = fighter.giShade;
          ctx.fillRect(2, -60, 12, 10);
          ctx.fillStyle = fighter.skinColor;
          ctx.fillRect(12, -60, 20, 10);
          ctx.fillStyle = fighter.gloveColor;
          ctx.fillRect(32, -64, 12, 16);
          ctx.fillStyle = fighter.giColor;
          ctx.fillRect(6, -54, 12, 10);
          ctx.fillStyle = fighter.skinColor;
          ctx.fillRect(16, -54, 24, 12);
          ctx.fillStyle = fighter.gloveColor;
          ctx.fillRect(38, -58, 14, 18);
        }
        break;

      case FighterState.SHORYUKEN:
        const jy = -70;
        // Torso & Rising Dragon Punch Head with Roaring Battle Cry
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-10, jy - 20, 20, 36);
        this.drawBelt(ctx, fighter, 0, jy + 14);
        this.drawShotokanHead(ctx, fighter, 2, jy - 30, 'kiai');
        // Lead Arm Skyward Thrust
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(2, jy - 46, 10, 28);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(0, jy - 58, 14, 14);
        // Rear Arm Tucked Across Ribs
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-10, jy - 14, 8, 12);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-8, jy - 4, 9, 9);
        // High Knee and Trailing Leg (Full 4 Limbs!)
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(2, jy + 14, 14, 16);
        ctx.fillRect(-12, jy + 14, 12, 26);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(4, jy + 28, 12, 6);
        ctx.fillRect(-12, jy + 38, 12, 6);
        break;

      case FighterState.TATSUMAKI:
        const spin = Math.sin(st * 0.45) > 0 ? 1 : -1;
        ctx.save();
        ctx.scale(spin, 1);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-12, -74, 24, 28);
        this.drawShotokanHead(ctx, fighter, 0, -84, 'normal');
        // Balancing Outstretched Arms (Previously Missing!)
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16, -70, 8, 10);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-26, -70, 12, 8);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-34, -72, 9, 9);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(10, -70, 8, 10);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(18, -70, 12, 8);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(28, -72, 9, 9);
        // Horizontal Spinning Kick Leg
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(6, -64, 18, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(24, -64, 20, 12);
        ctx.fillRect(44, -66, 12, 16);
        // Trailing Bent Leg
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-12, -46, 14, 16);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-12, -32, 12, 6);
        ctx.restore();
        break;

      case FighterState.KNOCKDOWN:
      case FighterState.DEFEATED:
        if (fighter.y < 318) {
          ctx.save();
          ctx.rotate(-0.8);
          ctx.fillStyle = fighter.giColor;
          ctx.fillRect(-12, -40, 24, 34);
          this.drawShotokanHead(ctx, fighter, -12, -50, 'hurt');
          ctx.restore();
        } else {
          ctx.fillStyle = fighter.giColor;
          ctx.fillRect(-35, -14, 45, 14);
          ctx.fillStyle = fighter.skinColor;
          ctx.fillRect(10, -12, 25, 12);
          // Recumbent Arm
          ctx.fillStyle = fighter.gloveColor;
          ctx.fillRect(-48, -10, 8, 8);
          this.drawShotokanHead(ctx, fighter, -42, -10, 'hurt');
        }
        break;

      case FighterState.VICTORY:
        // Standing Proud
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-14, -72, 28, 34);
        this.drawBelt(ctx, fighter, 0, -42);
        this.drawShotokanHead(ctx, fighter, 0, -84, 'victory');
        // Legs in Gi with Bare Feet
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16, -42, 14, 42);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(4, -42, 14, 42);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-18, -4, 18, 5);
        ctx.fillRect(4, -4, 20, 5);

        if (fighter.name === 'RYU') {
          // Ryu's Iconic Folded Arms Victory Pose with fluttering red headband
          ctx.fillStyle = fighter.giShade;
          ctx.fillRect(-18, -70, 10, 14);
          ctx.fillStyle = fighter.skinColor;
          ctx.fillRect(-14, -62, 18, 9);
          ctx.fillStyle = fighter.gloveColor;
          ctx.fillRect(2, -62, 11, 10);
          ctx.fillStyle = fighter.giColor;
          ctx.fillRect(8, -70, 10, 14);
          ctx.fillStyle = fighter.skinColor;
          ctx.fillRect(-6, -58, 18, 9);
          ctx.fillStyle = fighter.gloveColor;
          ctx.fillRect(-12, -58, 11, 10);
        } else {
          // Ken's Iconic V-For-Victory Pose with Charismatic Smirk
          // Left hand on hip
          ctx.fillStyle = fighter.giShade;
          ctx.fillRect(-16, -70, 9, 12);
          ctx.fillStyle = fighter.skinColor;
          ctx.fillRect(-18, -60, 8, 12);
          ctx.fillStyle = fighter.gloveColor;
          ctx.fillRect(-18, -50, 9, 9);
          // Right arm held high with V sign
          ctx.fillStyle = fighter.giColor;
          ctx.fillRect(8, -70, 10, 12);
          ctx.fillStyle = fighter.skinColor;
          ctx.fillRect(10, -84, 9, 16);
          ctx.fillStyle = fighter.gloveColor;
          ctx.fillRect(9, -94, 11, 10);
          ctx.fillStyle = fighter.skinColor;
          ctx.fillRect(9, -100, 7, 7); // V peace fingers
        }
        break;

      default:
        this.renderShotokan(ctx, { ...fighter, state: FighterState.IDLE });
        break;
    }
  }

  static drawShotokanHead(ctx, fighter, hx, hy, expression = 'normal') {
    const isRyu = fighter.name === 'RYU';

    // Sculpted jawline and facial foundation
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(hx - 7, hy - 4, 14, 14);
    ctx.fillRect(hx - 5, hy + 8, 10, 3); // Chin
    ctx.fillStyle = fighter.skinShade || '#f59e0b';
    ctx.fillRect(hx - 8, hy - 1, 2, 5); // Ear

    if (isRyu) {
      // --- RYU: Cropped Spiky Black Hair & Red Headband ---
      ctx.fillStyle = fighter.hairColor || '#171717';
      // Spiky crown & sides
      ctx.fillRect(hx - 9, hy - 14, 18, 10);
      ctx.fillRect(hx - 6, hy - 18, 13, 5);
      ctx.fillRect(hx - 3, hy - 21, 6, 4); // Top spike
      ctx.fillRect(hx + 4, hy - 17, 4, 4); // Right spike
      ctx.fillRect(hx - 9, hy - 16, 4, 4); // Left spike

      // Red Headband
      if (fighter.headbandColor) {
        ctx.fillStyle = fighter.headbandColor;
        ctx.fillRect(hx - 9, hy - 6, 18, 5); // Headband wrap
        // Trailing fluttering red sash tails blowing back in the wind!
        const flutter = Math.sin(fighter.animFrame * 0.2) * 4;
        ctx.fillRect(hx - 24, hy - 5 + flutter, 16, 4);
        ctx.fillRect(hx - 20, hy - 1 + flutter * 0.7, 13, 3);
        // Ribbon knot at back of head
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(hx - 10, hy - 5, 3, 5);
      }

      // Facial Features & Expression
      if (expression === 'hurt') {
        // Clenched shut wincing eye
        ctx.fillStyle = '#171717';
        ctx.fillRect(hx, hy - 2, 6, 2);
        // Open grimacing mouth
        ctx.fillStyle = '#171717';
        ctx.fillRect(hx + 1, hy + 4, 6, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx + 2, hy + 4, 4, 2);
      } else if (expression === 'kiai') {
        // Roaring battle cry (Hadouken / Shoryuken)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx, hy - 2, 7, 4); // Wide eye
        ctx.fillStyle = '#171717';
        ctx.fillRect(hx + 3, hy - 2, 3, 3);
        // Furrowed heavy warrior brow
        ctx.fillStyle = '#171717';
        ctx.fillRect(hx - 1, hy - 4, 8, 2);
        // Nose bridge
        ctx.fillStyle = fighter.skinShade || '#f59e0b';
        ctx.fillRect(hx + 5, hy - 1, 2, 4);
        // Wide roaring open mouth
        ctx.fillStyle = '#171717';
        ctx.fillRect(hx + 1, hy + 4, 7, 5);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(hx + 2, hy + 5, 5, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx + 2, hy + 4, 5, 2); // Upper teeth
      } else {
        // Stoic, intense warrior brow
        ctx.fillStyle = '#171717';
        ctx.fillRect(hx - 1, hy - 4, 8, 2);
        // Focused warrior eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx, hy - 2, 7, 3); // White sclera
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(hx + 3, hy - 2, 3, 3); // Dark pupil
        // Nose bridge
        ctx.fillStyle = fighter.skinShade || '#f59e0b';
        ctx.fillRect(hx + 5, hy - 1, 2, 4);
        // Resolute clenched mouth / grit
        ctx.fillStyle = '#171717';
        ctx.fillRect(hx + 1, hy + 5, 6, 2);
        if (expression === 'victory') {
          // Stoic noble expression
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(hx + 2, hy + 5, 4, 1);
        }
      }
    } else {
      // --- KEN: Flowing Golden Blonde Mane & Charismatic Smirk ---
      ctx.fillStyle = fighter.hairColor || '#facc15';
      // Voluminous blonde mane
      ctx.fillRect(hx - 10, hy - 14, 20, 11);
      ctx.fillRect(hx - 7, hy - 18, 15, 6);
      ctx.fillRect(hx - 4, hy - 21, 8, 4); // Crown volume
      // Flowing locks draping over collar & back of neck
      ctx.fillRect(hx - 13, hy - 8, 5, 17);
      ctx.fillRect(hx - 15, hy - 4, 4, 11);
      // Front bangs over forehead
      ctx.fillRect(hx - 5, hy - 5, 6, 3);
      // Golden highlights and shade
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(hx - 6, hy - 19, 10, 2);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(hx - 12, hy - 2, 3, 10);

      // Facial Features & Expression
      if (expression === 'hurt') {
        // Wincing eye
        ctx.fillStyle = '#78350f';
        ctx.fillRect(hx, hy - 2, 6, 2);
        // Open grimace mouth
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(hx + 1, hy + 4, 6, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx + 2, hy + 4, 4, 2);
      } else if (expression === 'kiai') {
        // Fierce battle yell
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx, hy - 2, 7, 4);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(hx + 3, hy - 2, 3, 3);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(hx - 1, hy - 4, 8, 2);
        ctx.fillStyle = fighter.skinShade || '#f59e0b';
        ctx.fillRect(hx + 5, hy - 1, 2, 4);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(hx + 1, hy + 4, 7, 5);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(hx + 2, hy + 5, 5, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx + 2, hy + 4, 5, 2);
      } else if (expression === 'victory') {
        // Beaming charismatic victory smile with gleaming teeth!
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(hx, hy - 4, 7, 2); // Playful raised eyebrow
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx, hy - 2, 7, 3);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(hx + 3, hy - 2, 3, 3); // Bright blue iris
        ctx.fillStyle = fighter.skinShade || '#f59e0b';
        ctx.fillRect(hx + 5, hy - 1, 2, 4);
        // Big confident grin with teeth
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(hx + 1, hy + 4, 7, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx + 2, hy + 4, 5, 3);
      } else {
        // Cocky angled brow
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(hx, hy - 4, 7, 2);
        // Striking blue eyes with pupils
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx, hy - 2, 7, 3);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(hx + 3, hy - 2, 3, 3);
        // Straight nose
        ctx.fillStyle = fighter.skinShade || '#f59e0b';
        ctx.fillRect(hx + 5, hy - 1, 2, 4);
        // Signature cocky smirk / half-smile with tooth glint!
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(hx + 2, hy + 4, 6, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx + 4, hy + 4, 3, 2); // White tooth glint
      }
    }
  }

  static drawBelt(ctx, fighter, bx, by) {
    ctx.fillStyle = fighter.beltColor;
    ctx.fillRect(bx - 12, by - 4, 24, 7);
    ctx.fillRect(bx - 2, by + 3, 5, 5);
    const flutter = Math.sin(fighter.animFrame * 0.15) * 2;
    ctx.fillRect(bx - 4, by + 7, 4, 14 + flutter);
    ctx.fillRect(bx + 1, by + 7, 4, 18 - flutter);
  }

  // ==========================================
  // CHUN-LI
  // ==========================================
  static renderChunLi(ctx, fighter) {
    const s = fighter.state;
    const t = fighter.animFrame;
    const st = fighter.stateTimer;
    const bob = Math.sin(t * 0.15) * 3;
    const hy = -82 + bob;

    // Head with double ox-horn hair buns and expressive face
    const drawChunLiHead = (x, y, expression = 'normal') => {
      // Delicate fair skin & refined jaw
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x - 7, y - 4, 14, 14);
      ctx.fillRect(x - 5, y + 8, 10, 3); // Chin

      // Dark midnight hair & bangs
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(x - 8, y - 12, 16, 9);
      ctx.fillRect(x - 4, y - 3, 8, 3); // Forehead bangs

      // Ox Horn Buns (Odango) with white silk ribbons
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x - 10, y - 10, 6, 0, Math.PI * 2);
      ctx.arc(x + 10, y - 10, 6, 0, Math.PI * 2);
      ctx.fill();
      // Gold bun ties
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x - 12, y - 7, 4, 3);
      ctx.fillRect(x + 8, y - 7, 4, 3);
      // Navy bun core
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(x - 10, y - 10, 3, 0, Math.PI * 2);
      ctx.arc(x + 10, y - 10, 3, 0, Math.PI * 2);
      ctx.fill();

      // Fluttering white silk ribbon tails
      const rFlutter = Math.sin(t * 0.2) * 3;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 14, y - 5, 3, 12 + rFlutter);
      ctx.fillRect(x + 11, y - 5, 3, 12 - rFlutter);

      // Facial Features & Expression
      if (expression === 'hurt') {
        // Wincing eyes
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(x + 1, y - 2, 6, 2);
        // Open gasp mouth
        ctx.fillStyle = '#be123c';
        ctx.fillRect(x + 2, y + 4, 4, 3);
      } else if (expression === 'happy') {
        // Joyous sparkling eyes
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(x + 1, y - 3, 6, 2);
        ctx.fillRect(x + 1, y - 1, 2, 2);
        // Big radiant smile with white teeth
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(x + 1, y + 4, 6, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 2, y + 4, 4, 2);
      } else {
        // Almond-shaped anime eyes with dark iris
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y - 2, 7, 4); // White sclera
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(x + 2, y - 2, 3, 3); // Dark iris
        ctx.fillRect(x + 1, y - 4, 6, 2); // Delicate curved eyebrow
        // Small nose
        ctx.fillStyle = '#eab308';
        ctx.fillRect(x + 5, y, 2, 2);
        // Determined rose-pink lips
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(x + 2, y + 5, 4, 2);
      }
    };

    switch (s) {
      case FighterState.IDLE:
        // Brown tights / athletic muscular legs
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-12, -44 + bob, 12, 44 - bob);
        ctx.fillRect(2, -42 + bob, 12, 42 - bob);

        // Iconic White Combat Boots with dark soles
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-14, -20, 14, 20);
        ctx.fillRect(2, -18, 14, 18);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-15, -3, 15, 3);
        ctx.fillRect(1, -3, 15, 3);

        // Blue Qipao dress with golden lining and white sash
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-13, -70 + bob, 26, 32);
        ctx.fillStyle = '#fbbf24'; // Gold trim
        ctx.fillRect(-13, -40 + bob, 26, 3);
        ctx.fillStyle = '#f8fafc'; // White waist sash
        ctx.fillRect(-11, -44 + bob, 22, 4);

        // --- FOUR LIMBS: CHUN-LI'S AUTHENTIC KENPO CRANE GUARD ---
        // Puffy blue shoulder sleeves with gold trim:
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-18, -68 + bob, 9, 10);
        ctx.fillRect(8, -68 + bob, 9, 10);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-18, -59 + bob, 9, 2);
        ctx.fillRect(8, -59 + bob, 9, 2);

        // Bare skin arms:
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-16, -58 + bob, 7, 12); // Rear arm
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(9, -58 + bob, 7, 12);  // Lead arm

        // Heavy Spiked Wristbands with silver spikes:
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-18, -48 + bob, 10, 8);
        ctx.fillRect(8, -48 + bob, 10, 8);
        ctx.fillStyle = '#cbd5e1'; // Silver spikes
        ctx.fillRect(-20, -46 + bob, 2, 4);
        ctx.fillRect(18, -46 + bob, 2, 4);

        // Kung-fu open palm hands:
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-16, -40 + bob, 6, 6);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(10, -40 + bob, 7, 6);

        drawChunLiHead(2, hy, 'normal');
        break;

      case FighterState.WALK_FWD:
      case FighterState.WALK_BACK:
        const cStep = Math.sin(t * 0.25) * 10;
        const cBob = Math.abs(Math.sin(t * 0.25)) * 3;

        // Striding legs in tights & white boots
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-12 - cStep, -42 + cBob, 12, 42 - cBob);
        ctx.fillRect(2 + cStep, -42 + cBob, 12, 42 - cBob);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-14 - cStep, -18, 14, 18);
        ctx.fillRect(2 + cStep, -18, 14, 18);

        // Qipao torso
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-13, -70 + cBob, 26, 32);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-13, -40 + cBob, 26, 3);

        // Puffy sleeves & moving arms with spiked bracelets and hands
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-18, -68 + cBob, 8, 10);
        ctx.fillRect(8, -68 + cBob, 8, 10);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-16 + cStep * 0.4, -58 + cBob, 7, 12);
        ctx.fillRect(9 - cStep * 0.4, -58 + cBob, 7, 12);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-18 + cStep * 0.4, -48 + cBob, 9, 8);
        ctx.fillRect(8 - cStep * 0.4, -48 + cBob, 9, 8);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-16 + cStep * 0.4, -40 + cBob, 6, 6);
        ctx.fillRect(9 - cStep * 0.4, -40 + cBob, 6, 6);

        drawChunLiHead(2, -82 + cBob, 'normal');
        break;

      case FighterState.CROUCH:
        // Crouching legs in tights & white boots
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-14, -26, 14, 26);
        ctx.fillRect(2, -26, 14, 26);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-16, -16, 16, 16);
        ctx.fillRect(2, -16, 16, 16);
        // Qipao & sash
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-12, -54, 24, 28);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-12, -28, 24, 3);
        // Low guarded arms with spiked cuffs
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-8, -42, 16, 8);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(8, -44, 9, 9);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(16, -42, 6, 6);
        drawChunLiHead(2, -64, 'normal');
        break;

      case FighterState.JUMP:
        // Airborne jump with tucked legs in white boots
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-12, -62, 11, 22);
        ctx.fillRect(1, -62, 11, 22);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-14, -44, 14, 20);
        ctx.fillRect(1, -44, 14, 20);
        // Qipao & ribbons
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-12, -86, 24, 26);
        // Guarded arms with spiked cuffs
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-18, -76, 7, 14);
        ctx.fillRect(8, -76, 7, 14);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-19, -64, 8, 8);
        ctx.fillRect(8, -64, 8, 8);
        drawChunLiHead(1, -96, 'normal');
        break;

      case FighterState.BLOCKSTUN:
        // Double spiked cross-block
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-12, -40, 12, 40);
        ctx.fillRect(2, -38, 12, 38);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-14, -18, 14, 18);
        ctx.fillRect(2, -18, 14, 18);
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-12, -70, 24, 32);
        // Forearms crossed with spiked bracelets
        ctx.fillStyle = '#fde047';
        ctx.fillRect(4, -68, 8, 20);
        ctx.fillRect(-4, -64, 8, 20);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(3, -74, 10, 8);
        ctx.fillRect(-5, -70, 10, 8);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(13, -72, 2, 4);
        drawChunLiHead(-2, -80, 'normal');
        break;

      case FighterState.HITSTUN:
        // Flinching back in pain
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-16, -38, 12, 38);
        ctx.fillRect(-2, -36, 12, 36);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-18, -16, 14, 16);
        ctx.fillRect(-2, -16, 14, 16);
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-14, -68, 24, 32);
        // Recoiled arms
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-22, -60, 8, 12);
        ctx.fillRect(10, -56, 8, 12);
        drawChunLiHead(-4, -78, 'hurt');
        break;

      case FighterState.LIGHTNING_LEGS:
        // Rapid kick flurry animation
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-12, -68, 24, 30);
        drawChunLiHead(0, -80);
        // Multi-kick blur effect!
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-10, -38, 12, 38);
        ctx.fillStyle = '#f8fafc';
        for (let i = 0; i < 3; i++) {
          const kickY = -35 - (i * 18) + Math.sin(st * 1.5 + i) * 6;
          ctx.fillRect(12, kickY, 38, 10);
        }
        break;

      case FighterState.SPINNING_BIRD:
        // Upside down spinning helicopter kick
        ctx.save();
        ctx.translate(0, -45);
        ctx.rotate(st * 0.6);
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-12, -15, 24, 30);
        // Both legs extended out horizontally!
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-48, -6, 38, 12);
        ctx.fillRect(10, -6, 38, 12);
        ctx.restore();
        break;

      case FighterState.KIKOKEN:
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-10, -68, 24, 32);
        drawChunLiHead(4, -78);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(14, -56, 26, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(36, -60, 10, 18);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-12, -38, 12, 38);
        ctx.fillRect(2, -38, 12, 38);
        break;

      case FighterState.LIGHT_PUNCH:
      case FighterState.HEAVY_PUNCH:
        // Standing legs
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-14, -40, 12, 40);
        ctx.fillRect(2, -40, 12, 40);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-16, -16, 14, 16);
        ctx.fillRect(2, -16, 14, 16);
        // Qipao & head
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-12, -70, 24, 32);
        drawChunLiHead(2, -80);
        // Rear guard hand with spiked cuff
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-16, -64, 8, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-18, -60, 6, 8);
        // Extended palm strike
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(4, -64, 12, 10);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(14, -62, s === FighterState.HEAVY_PUNCH ? 34 : 22, 9);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(14 + (s === FighterState.HEAVY_PUNCH ? 34 : 22), -64, 6, 12);
        break;

      case FighterState.LIGHT_KICK:
        // Plant leg (single rear leg in white boot)
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-12, -40, 12, 40);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-14, -16, 14, 16);
        // Qipao & head
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-12, -70, 24, 32);
        drawChunLiHead(0, -80);
        // Snapped mid kick
        ctx.fillStyle = '#78350f';
        ctx.fillRect(4, -48, 16, 12);
        ctx.fillRect(18, -46, 22, 10);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(38, -48, 12, 14);
        break;

      case FighterState.HEAVY_KICK:
        // Chun-Li's famous vertical sky kick!
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-14, -68, 22, 30);
        drawChunLiHead(-6, -78);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(4, -76, 36, 12);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(36, -80, 14, 16);
        // Single plant leg
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-12, -40, 12, 40);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-14, -16, 14, 16);
        break;

      case FighterState.SWEEP:
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-14, -36, 24, 22);
        drawChunLiHead(-6, -46, 'normal');
        // Support arm with spiked bracelet
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-18, -28, 8, 14);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-20, -18, 9, 8);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(8, -14, 46, 12);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(48, -18, 14, 16);
        break;

      case FighterState.KNOCKDOWN:
      case FighterState.DEFEATED:
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-35, -14, 45, 14);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(10, -12, 25, 12);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-48, -10, 8, 8);
        drawChunLiHead(-42, -10, 'hurt');
        break;

      case FighterState.VICTORY:
        // Chun-Li's victory jump & peace sign!
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-12, -74, 24, 32);
        drawChunLiHead(0, -84, 'happy');
        // Both arms raised high celebrating with peace signs
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-18, -74, 8, 22);
        ctx.fillRect(10, -74, 8, 22);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-20, -78, 10, 7);
        ctx.fillRect(9, -78, 10, 7);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-18, -86, 7, 9); // Peace fingers
        ctx.fillRect(10, -86, 7, 9);
        // Legs in boots
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-12, -42, 12, 42);
        ctx.fillRect(2, -42, 12, 42);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-14, -20, 14, 20);
        ctx.fillRect(2, -20, 14, 20);
        break;

      default:
        this.renderChunLi(ctx, { ...fighter, state: FighterState.IDLE });
        break;
    }
  }

  // ==========================================
  // GUILE
  // ==========================================
  static renderGuile(ctx, fighter) {
    const s = fighter.state;
    const t = fighter.animFrame;
    const st = fighter.stateTimer;
    const bob = Math.sin(t * 0.1) * 2;
    const hy = -80 + bob;

    const drawGuileHead = (x, y, expression = 'stern') => {
      // Chiseled square jaw
      ctx.fillStyle = '#fcd34d';
      ctx.fillRect(x - 7, y - 4, 15, 15);
      ctx.fillRect(x - 5, y + 8, 12, 4); // Square chin
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x - 8, y - 1, 2, 6); // Ear

      // Tall Sculpted Golden Flat-Top Hair
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x - 10, y - 18, 20, 14);
      ctx.fillRect(x - 12, y - 22, 24, 6);
      ctx.fillStyle = '#ca8a04'; // Hair side shading
      ctx.fillRect(x - 11, y - 12, 3, 10);
      ctx.fillStyle = '#facc15'; // Top highlight
      ctx.fillRect(x - 8, y - 22, 16, 2);

      // Facial Features & Expression
      if (expression === 'hurt') {
        // Wincing eyes
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(x, y - 2, 7, 2);
        // Open grimace mouth
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(x + 1, y + 4, 7, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 2, y + 5, 5, 2);
      } else {
        // Stern military brow
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x - 2, y - 4, 10, 2);
        // Steely blue eyes with pupils
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y - 2, 7, 3);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(x + 3, y - 2, 3, 3);
        // Straight soldier nose
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(x + 5, y - 1, 3, 4);
        // Clenched military grimace / grit
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(x + 1, y + 5, 7, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 2, y + 5, 5, 2);
      }
    };

    switch (s) {
      case FighterState.IDLE:
        // Camo fatigues with pocket folds
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-16, -42 + bob, 14, 42 - bob);
        ctx.fillStyle = '#166534';
        ctx.fillRect(4, -40 + bob, 14, 40 - bob);
        // Knee pocket details
        ctx.fillStyle = '#14532d';
        ctx.fillRect(-14, -28 + bob, 10, 6);
        ctx.fillRect(6, -26 + bob, 10, 6);

        // Black Combat Boots with tread
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-18, -12, 18, 12);
        ctx.fillRect(4, -12, 18, 12);
        ctx.fillStyle = '#334155';
        ctx.fillRect(-19, -3, 19, 3);
        ctx.fillRect(3, -3, 19, 3);

        // Green tank top torso & dog tags
        ctx.fillStyle = '#365314';
        ctx.fillRect(-14, -70 + bob, 28, 32);
        ctx.fillStyle = '#cbd5e1'; // Silver dog tag chain
        ctx.fillRect(-2, -64 + bob, 4, 6);

        // --- FOUR LIMBS: GUILE'S BOXER GUARD STANCE ---
        // Rear arm:
        ctx.fillStyle = '#f59e0b'; // Shaded upper bicep
        ctx.fillRect(-22, -66 + bob, 10, 14);
        ctx.fillStyle = '#fcd34d'; // Forearm raised in guard
        ctx.fillRect(-20, -56 + bob, 9, 14);
        ctx.fillStyle = '#f8fafc'; // White combat hand wrap
        ctx.fillRect(-21, -64 + bob, 10, 10);

        // Front arm (with tattoo hint and clenched taped fist):
        ctx.fillStyle = '#fcd34d'; // Muscular deltoid
        ctx.fillRect(10, -66 + bob, 12, 14);
        // American Flag tattoo hint on shoulder
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(14, -64 + bob, 5, 3);
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(14, -61 + bob, 5, 3);
        // Forearm angled protecting chin
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(16, -58 + bob, 10, 14);
        // Lead clenched fist with white tape
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(18, -68 + bob, 11, 11);

        drawGuileHead(2, hy, 'stern');
        break;

      case FighterState.WALK_FWD:
      case FighterState.WALK_BACK:
        const gStep = Math.sin(t * 0.22) * 11;
        const gBob = Math.abs(Math.sin(t * 0.22)) * 3;

        // Striding camo pants
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-16 - gStep, -40 + gBob, 14, 40 - gBob);
        ctx.fillStyle = '#166534';
        ctx.fillRect(4 + gStep, -40 + gBob, 14, 40 - gBob);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-18 - gStep, -12, 18, 12);
        ctx.fillRect(4 + gStep, -12, 18, 12);

        // Tank top torso
        ctx.fillStyle = '#365314';
        ctx.fillRect(-14, -70 + gBob, 28, 32);

        // Arms in moving boxer guard
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-22 + gStep * 0.4, -64 + gBob, 9, 14);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-21 + gStep * 0.4, -60 + gBob, 10, 10);

        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(12 - gStep * 0.4, -64 + gBob, 10, 14);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(16 - gStep * 0.4, -66 + gBob, 11, 11);

        drawGuileHead(2, -80 + gBob, 'stern');
        break;

      case FighterState.CROUCH:
        // Crouching camo legs & combat boots
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-18, -26, 16, 26);
        ctx.fillRect(2, -26, 16, 26);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-20, -12, 18, 12);
        ctx.fillRect(2, -12, 18, 12);
        // Tank top & head
        ctx.fillStyle = '#365314';
        ctx.fillRect(-14, -54, 28, 30);
        // Low boxer guard fists
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(-10, -44, 18, 8);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(8, -46, 10, 10);
        ctx.fillRect(-14, -46, 10, 10);
        drawGuileHead(2, -64, 'stern');
        break;

      case FighterState.JUMP:
        // Airborne jump with tucked combat boots
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-14, -60, 13, 20);
        ctx.fillRect(1, -60, 13, 20);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-16, -42, 16, 16);
        ctx.fillRect(1, -42, 16, 16);
        // Tank top & head
        ctx.fillStyle = '#365314';
        ctx.fillRect(-12, -84, 26, 26);
        // Raised fists
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(-18, -74, 8, 14);
        ctx.fillRect(8, -74, 8, 14);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-18, -62, 9, 9);
        ctx.fillRect(8, -62, 9, 9);
        drawGuileHead(1, -94, 'stern');
        break;

      case FighterState.BLOCKSTUN:
        // Double forearm boxer cross-guard
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-16, -40, 14, 40);
        ctx.fillRect(4, -38, 14, 38);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-18, -12, 18, 12);
        ctx.fillRect(4, -12, 18, 12);
        ctx.fillStyle = '#365314';
        ctx.fillRect(-12, -70, 26, 32);
        // Forearms raised blocking
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(4, -70, 10, 20);
        ctx.fillRect(-4, -66, 10, 20);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(4, -78, 11, 10);
        ctx.fillRect(-4, -74, 11, 10);
        drawGuileHead(-2, -80, 'stern');
        break;

      case FighterState.HITSTUN:
        // Recoiling torso, wincing face
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-20, -38, 14, 38);
        ctx.fillRect(0, -36, 14, 36);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-22, -12, 18, 12);
        ctx.fillRect(0, -12, 18, 12);
        ctx.fillStyle = '#365314';
        ctx.fillRect(-16, -68, 26, 32);
        // Recoiling arms
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(-24, -60, 8, 14);
        ctx.fillRect(12, -56, 8, 14);
        drawGuileHead(-6, -78, 'hurt');
        break;

      case FighterState.SONIC_BOOM:
        ctx.fillStyle = '#365314';
        ctx.fillRect(-12, -68, 26, 32);
        drawGuileHead(6, -78);
        // Both hands slashed forward to fire sonic boom
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(12, -62, 28, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(36, -66, 8, 22);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-14, -38, 14, 38);
        ctx.fillRect(2, -38, 14, 38);
        break;

      case FighterState.FLASH_KICK:
        // Somersault backflip kick in the air!
        const flipAngle = st * 0.45;
        ctx.save();
        ctx.translate(0, -60);
        ctx.rotate(-flipAngle);
        ctx.fillStyle = '#365314';
        ctx.fillRect(-12, -15, 24, 30);
        drawGuileHead(0, -26);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-6, 12, 14, 36); // Arcing kick
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-8, 38, 18, 12); // Flash streak
        ctx.restore();
        break;

      case FighterState.LIGHT_PUNCH:
        // Standing legs
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-16, -42, 14, 42);
        ctx.fillRect(4, -40, 14, 40);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-18, -12, 18, 12);
        ctx.fillRect(4, -12, 18, 12);
        // Tank top & head
        ctx.fillStyle = '#365314';
        ctx.fillRect(-14, -70, 28, 32);
        drawGuileHead(2, -80);
        // Rear guard fist
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(-20, -64, 8, 18);
        // Fast straight jab
        ctx.fillRect(8, -66, 24, 11);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(30, -68, 12, 13);
        break;

      case FighterState.HEAVY_PUNCH:
        // Heavy lunging punch
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-14, -40, 14, 40);
        ctx.fillRect(6, -38, 14, 38);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-16, -12, 18, 12);
        ctx.fillRect(6, -12, 18, 12);
        // Leaning torso
        ctx.fillStyle = '#365314';
        ctx.fillRect(-10, -70, 28, 32);
        drawGuileHead(6, -80);
        // Rear arm tucked back
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(-18, -62, 8, 16);
        // Heavy straight punch extended with powerful reach
        ctx.fillRect(12, -66, 38, 12);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(48, -69, 14, 15);
        break;

      case FighterState.LIGHT_KICK:
        // Plant leg (single rear leg firmly planted on ground)
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-14, -42, 14, 42);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-16, -12, 18, 12);
        // Torso & head
        ctx.fillStyle = '#365314';
        ctx.fillRect(-12, -70, 26, 30);
        drawGuileHead(2, -80);
        // Guard arms
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(-18, -64, 8, 18);
        ctx.fillRect(4, -66, 10, 12);
        // Snapped kick leg (front leg lifted and striking forward)
        ctx.fillStyle = '#15803d';
        ctx.fillRect(4, -50, 16, 12); // Thigh
        ctx.fillRect(18, -48, 22, 11); // Shin
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(38, -50, 14, 13); // Combat boot
        break;

      case FighterState.HEAVY_KICK:
        // GUILE'S STRONG KICK: Iconic High Roundhouse Kick!
        // Plant leg (single rear leg angled for balance)
        ctx.fillStyle = '#14532d';
        ctx.fillRect(-16, -42, 15, 42);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-20, -12, 20, 12);
        // Torso leaning back for leverage and height
        ctx.fillStyle = '#365314';
        ctx.fillRect(-18, -68, 26, 28);
        drawGuileHead(-8, -78);
        // Guard arm across chest
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(-22, -60, 8, 16);
        ctx.fillRect(0, -66, 8, 12);
        // High Roundhouse Leg whipping up to head/chest level (-76 to -82)!
        ctx.fillStyle = '#15803d';
        ctx.fillRect(0, -62, 18, 14); // High thigh
        ctx.fillRect(16, -76, 26, 13); // High shin
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(40, -80, 16, 15); // Combat boot striking high!
        // Impact motion streak
        ctx.fillStyle = '#facc15';
        ctx.fillRect(52, -82, 5, 17);
        break;

      case FighterState.SWEEP:
        ctx.fillStyle = '#365314';
        ctx.fillRect(-14, -36, 26, 22);
        drawGuileHead(-4, -46, 'stern');
        // Ground support arm
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(-18, -30, 8, 16);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-20, -18, 10, 8);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(8, -14, 44, 12);
        break;

      case FighterState.KNOCKDOWN:
      case FighterState.DEFEATED:
        ctx.fillStyle = '#365314';
        ctx.fillRect(-35, -14, 45, 14);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(10, -12, 25, 12);
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(-48, -10, 8, 8);
        drawGuileHead(-42, -10, 'hurt');
        break;

      case FighterState.VICTORY:
        // Guile pulls out his comb and combs his flat-top hair!
        ctx.fillStyle = '#365314';
        ctx.fillRect(-14, -72, 28, 34);
        drawGuileHead(0, -84, 'victory');
        // Left arm on hip
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(-20, -68, 8, 18);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-20, -50, 8, 8);
        // Right arm combing hair with pocket comb
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(6, -84, 8, 16);
        ctx.fillStyle = '#1e293b'; // Black pocket comb
        ctx.fillRect(8, -94, 6, 12);
        // Standing legs
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-16, -42, 14, 42);
        ctx.fillRect(4, -42, 14, 42);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-18, -12, 18, 12);
        ctx.fillRect(4, -12, 18, 12);
        break;

      default:
        this.renderGuile(ctx, { ...fighter, state: FighterState.IDLE });
        break;
    }
  }

  // ==========================================
  // M. BISON (DICTATOR / BOSS)
  // ==========================================
  static renderBison(ctx, fighter) {
    const s = fighter.state;
    const t = fighter.animFrame;
    const st = fighter.stateTimer;
    const bob = Math.sin(t * 0.1) * 2;
    const hy = -82 + bob;

    const drawBisonHead = (x, y, expression = 'evil') => {
      // Pale chiseled face & jaw
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(x - 7, y - 4, 15, 14);
      ctx.fillRect(x - 5, y + 8, 11, 4); // Strong jaw/chin
      ctx.fillStyle = '#f87171';
      ctx.fillRect(x - 8, y - 1, 2, 6); // Ear

      // Officer Peaked Cap
      ctx.fillStyle = '#991b1b'; // Red cap crown
      ctx.fillRect(x - 11, y - 16, 22, 12);
      ctx.fillRect(x - 8, y - 19, 16, 4); // Peaked top
      ctx.fillStyle = '#0f172a'; // Black visor brim
      ctx.fillRect(x - 14, y - 7, 28, 4);
      // Golden Skull & Wings Insignia
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x - 5, y - 14, 10, 6);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x - 2, y - 12, 4, 3); // Skull center shadow

      // Sinister Eyes & Heavy Eyebrows
      if (expression === 'hurt') {
        // Clenched shut wincing eyes
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(x - 1, y - 2, 8, 2);
        ctx.fillRect(x - 2, y - 4, 10, 2);
        // Open grimace mouth
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(x, y + 4, 8, 5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 1, y + 5, 6, 2);
      } else {
        // Glowing White Psycho Eyes with sinister purple sockets
        ctx.fillStyle = '#4c0519';
        ctx.fillRect(x - 2, y - 3, 11, 5); // Shadowed eye socket
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 1, y - 2, 9, 3); // Pure white eyes
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(x + 3, y - 2, 3, 3); // Purple psycho iris glint
        // Arched evil black brows angled down menacingly
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x - 2, y - 5, 11, 2);
        ctx.fillRect(x + 5, y - 6, 4, 2);

        // Sharp aquiline nose
        ctx.fillStyle = '#f87171';
        ctx.fillRect(x + 5, y - 1, 3, 4);

        // Maniacal Evil Grin
        ctx.fillStyle = '#450a0a'; // Dark mouth contour
        ctx.fillRect(x, y + 4, 8, 4);
        ctx.fillStyle = '#ffffff'; // White clenched teeth
        ctx.fillRect(x + 1, y + 5, 6, 2);
        ctx.fillStyle = '#7f1d1d'; // Smirk corner crease
        ctx.fillRect(x + 7, y + 3, 2, 2);
      }
    };

    switch (s) {
      case FighterState.IDLE:
        // Dark crimson / black flowing military cape draped behind shoulders
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(-22, -68 + bob, 8, 52);
        ctx.fillRect(-26, -52 + bob, 6, 34);

        // Red military trousers
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-16, -42 + bob, 14, 42 - bob);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(4, -40 + bob, 14, 40 - bob);

        // Heavy Silver Shin Guards / Greaves & Boots
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-18, -24, 16, 24);
        ctx.fillRect(4, -24, 16, 24);
        ctx.fillStyle = '#cbd5e1'; // Greave shine highlight
        ctx.fillRect(-17, -22, 4, 20);
        ctx.fillRect(5, -22, 4, 20);
        ctx.fillStyle = '#0f172a'; // Black boot soles
        ctx.fillRect(-19, -3, 18, 4);
        ctx.fillRect(3, -3, 18, 4);

        // Red tunic torso
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-14, -70 + bob, 28, 32);
        // Gold buttons / trim
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-8, -66 + bob, 3, 20);
        ctx.fillRect(2, -66 + bob, 3, 20);
        // Black belt with gold officer buckle
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-15, -42 + bob, 30, 6);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-4, -43 + bob, 8, 8);

        // Silver Pauldrons (Shoulder Armor)
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-22, -72 + bob, 12, 11);
        ctx.fillRect(10, -72 + bob, 12, 11);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-22, -63 + bob, 12, 2);
        ctx.fillRect(10, -63 + bob, 12, 2);

        // --- FOUR LIMBS: BISON'S COMMANDING CROSSED ARMS ---
        // Rear arm (folding across chest):
        ctx.fillStyle = '#7f1d1d'; // Upper arm sleeve
        ctx.fillRect(-22, -62 + bob, 10, 16);
        ctx.fillStyle = '#94a3b8'; // Silver forearm bracer
        ctx.fillRect(-18, -50 + bob, 14, 8);
        ctx.fillStyle = '#f8fafc'; // White gloved hand tucked under right bicep
        ctx.fillRect(8, -52 + bob, 8, 7);

        // Front arm (folding across chest):
        ctx.fillStyle = '#b91c1c'; // Front upper arm sleeve
        ctx.fillRect(12, -62 + bob, 10, 16);
        ctx.fillStyle = '#991b1b'; // Forearm sleeve crossing
        ctx.fillRect(-10, -56 + bob, 22, 10);
        ctx.fillStyle = '#94a3b8'; // Silver wrist bracer
        ctx.fillRect(-6, -56 + bob, 14, 10);
        ctx.fillStyle = '#e2e8f0'; // Bracer metallic highlight
        ctx.fillRect(-4, -54 + bob, 10, 3);
        ctx.fillStyle = '#f8fafc'; // White gloved fist tucked across under left arm
        ctx.fillRect(-16, -54 + bob, 9, 8);

        drawBisonHead(2, hy, 'evil');
        break;

      case FighterState.WALK_FWD:
      case FighterState.WALK_BACK:
        const walkDir = s === FighterState.WALK_FWD ? 1 : -1;
        const bStep = Math.sin(t * 0.22) * 12;
        const bBob = Math.abs(Math.sin(t * 0.22)) * 3;

        // Cape billowing behind
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(-24 - walkDir * 4, -68 + bBob, 10, 50);

        // Legs striding with silver greaves
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-16 - bStep, -40 + bBob, 14, 40 - bBob);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(4 + bStep, -40 + bBob, 14, 40 - bBob);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-18 - bStep, -24, 16, 24);
        ctx.fillRect(4 + bStep, -24, 16, 24);

        // Tunic torso & belt
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-14, -70 + bBob, 28, 32);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-15, -42 + bBob, 30, 6);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-4, -43 + bBob, 8, 8);

        // Pauldrons
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-22, -72 + bBob, 12, 10);
        ctx.fillRect(10, -72 + bBob, 12, 10);

        // Arms swinging with white gloves and silver bracers
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-22 + bStep * 0.5, -62 + bBob, 9, 18);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-22 + bStep * 0.5, -46 + bBob, 9, 6);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-22 + bStep * 0.5, -40 + bBob, 9, 8);

        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(12 - bStep * 0.5, -62 + bBob, 9, 18);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(12 - bStep * 0.5, -46 + bBob, 9, 6);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(12 - bStep * 0.5, -40 + bBob, 9, 8);

        drawBisonHead(2, -82 + bBob, 'evil');
        break;

      case FighterState.CROUCH:
        // Crouched legs in silver greaves
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-18, -26, 16, 26);
        ctx.fillRect(2, -26, 16, 26);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-20, -18, 18, 18);
        ctx.fillRect(2, -18, 18, 18);
        // Tunic & belt
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-14, -54, 28, 30);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-22, -56, 12, 10);
        ctx.fillRect(10, -56, 12, 10);
        // Crouching arms guarded with silver bracers and white gloves
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-8, -44, 18, 8);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(10, -44, 8, 8);
        ctx.fillRect(-14, -44, 8, 8);
        drawBisonHead(2, -64, 'evil');
        break;

      case FighterState.JUMP:
        // Airborne pose with cape billowing upward
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(-20, -60, 10, 40);
        // Legs tucked
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-14, -64, 14, 22);
        ctx.fillRect(2, -64, 14, 22);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-16, -44, 16, 20);
        ctx.fillRect(2, -44, 16, 20);
        // Tunic, pauldrons & head
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-12, -86, 26, 26);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-20, -88, 10, 9);
        ctx.fillRect(8, -88, 10, 9);
        // Guarded airborne arms with white fists and silver bracers
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-18, -74, 8, 14);
        ctx.fillRect(8, -74, 8, 14);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-18, -60, 8, 8);
        ctx.fillRect(8, -60, 8, 8);
        drawBisonHead(1, -96, 'evil');
        break;

      case FighterState.BLOCKSTUN:
        // Double silver cross block with sparks
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-16, -40, 14, 40);
        ctx.fillRect(4, -38, 14, 38);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-18, -22, 16, 22);
        ctx.fillRect(4, -22, 16, 22);
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-12, -70, 26, 32);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-20, -72, 10, 10);
        ctx.fillRect(8, -72, 10, 10);
        // Forearms crossed high in silver block
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(4, -72, 12, 22);
        ctx.fillRect(-4, -68, 12, 22);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(6, -78, 9, 8);
        ctx.fillRect(-2, -74, 9, 8);
        drawBisonHead(-2, -80, 'evil');
        break;

      case FighterState.HITSTUN:
        // Torso knocked back, head snapped, wincing expression
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-20, -38, 14, 38);
        ctx.fillRect(0, -36, 14, 36);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-22, -20, 16, 20);
        ctx.fillRect(0, -20, 16, 20);
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-16, -68, 26, 32);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-24, -70, 10, 10);
        ctx.fillRect(6, -70, 10, 10);
        // Arms flailed back
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-28, -62, 8, 8);
        ctx.fillRect(16, -58, 8, 8);
        drawBisonHead(-6, -78, 'hurt');
        break;

      case FighterState.PSYCHO_CRUSHER:
        if (st >= 29) {
          // Landing deceleration recovery pose (skidding on feet, hands trailing)
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(-22, -36, 16, 36);
          ctx.fillStyle = '#991b1b';
          ctx.fillRect(4, -34, 16, 34);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(-24, -20, 18, 20);
          ctx.fillRect(4, -20, 18, 20);
          // Leaning torso
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(-16, -64, 28, 30);
          drawBisonHead(4, -76, 'evil');
          // Trailing arms with silver bracers and white gloves
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(-24, -66, 12, 10);
          ctx.fillRect(8, -66, 12, 10);
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(-28, -60, 10, 22);
          ctx.fillRect(16, -60, 10, 22);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(-28, -42, 10, 6);
          ctx.fillRect(16, -42, 10, 6);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(-28, -36, 10, 8);
          ctx.fillRect(16, -36, 10, 8);
        } else {
          // Horizontal flying torpedo surrounded by blue/purple psycho fire!
          ctx.save();
          ctx.translate(0, -45);
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(-35, -12, 70, 24);
          drawBisonHead(28, 0, 'evil');
          // Spinning psycho power aura
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 4;
          ctx.strokeRect(-38, -15, 76, 30);
          ctx.restore();
        }
        break;

      case FighterState.SCISSOR_KICK:
        const rot = st * 0.4;
        ctx.save();
        ctx.translate(0, -45);
        ctx.rotate(rot);
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-14, -15, 28, 30);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(8, 0, 36, 12);
        ctx.restore();
        break;

      case FighterState.LIGHT_PUNCH:
      case FighterState.HEAVY_PUNCH:
        // Standing legs with silver shin guards
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-16, -42, 14, 42);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(4, -40, 14, 40);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-18, -24, 16, 24);
        ctx.fillRect(4, -24, 16, 24);
        // Red tunic & head
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-14, -70, 28, 32);
        drawBisonHead(2, -82, 'evil');
        // Pauldrons
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-22, -72, 12, 10);
        ctx.fillRect(10, -72, 12, 10);
        // Rear guard arm with silver bracer
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-20, -64, 8, 16);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-20, -50, 8, 6);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-20, -44, 8, 8);
        // Psycho punch extended arm
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(10, -66, 10, 12);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(20, -66, 10, 12);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(28, -66, s === FighterState.HEAVY_PUNCH ? 24 : 14, 12);
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(28 + (s === FighterState.HEAVY_PUNCH ? 24 : 14), -68, 10, 14);
        break;

      case FighterState.LIGHT_KICK:
        // Plant leg (single rear leg in silver shin guard)
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-14, -42, 14, 42);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-16, -24, 16, 24);
        // Tunic, pauldrons & head
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-12, -70, 26, 32);
        drawBisonHead(0, -82, 'evil');
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-20, -72, 12, 10);
        ctx.fillRect(8, -72, 12, 10);
        // Both guard arms
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-18, -64, 8, 16);
        ctx.fillRect(4, -64, 8, 16);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-18, -48, 8, 8);
        ctx.fillRect(4, -48, 8, 8);
        // Snapped mid kick with silver shin guard
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(4, -50, 16, 12);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(18, -48, 28, 14);
        break;

      case FighterState.HEAVY_KICK:
        // High Side Kick with silver shin guard
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-16, -68, 26, 30);
        drawBisonHead(-8, -80, 'evil');
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-22, -70, 12, 10);
        ctx.fillRect(6, -70, 12, 10);
        // Guard arms
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-20, -60, 8, 14);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-20, -46, 8, 8);
        // Plant leg (single rear leg)
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-16, -42, 14, 42);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-18, -24, 16, 24);
        // High kicking leg
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(0, -60, 18, 14);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(16, -74, 32, 15);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(46, -76, 5, 18);
        break;

      case FighterState.SWEEP:
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-14, -36, 26, 22);
        drawBisonHead(-4, -46, 'evil');
        // Support arm
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-18, -30, 8, 16);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-18, -14, 8, 8);
        // Sweeping leg in silver shin guard
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(8, -14, 46, 14);
        break;

      case FighterState.KNOCKDOWN:
      case FighterState.DEFEATED:
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-35, -14, 45, 14);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(10, -12, 25, 12);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-48, -10, 8, 8);
        drawBisonHead(-42, -10, 'hurt');
        break;

      case FighterState.VICTORY:
        // Arrogant crossed arms, billowing cape, laughing evil expression!
        ctx.fillStyle = '#450a0a';
        const vFlutter = Math.sin(t * 0.2) * 6;
        ctx.fillRect(-24, -70, 10, 54 + vFlutter);
        ctx.fillRect(-30, -56, 8, 38 + vFlutter);

        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-16, -42, 14, 42);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(4, -42, 14, 42);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-18, -24, 16, 24);
        ctx.fillRect(4, -24, 16, 24);

        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-14, -72, 28, 34);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-22, -74, 12, 11);
        ctx.fillRect(10, -74, 12, 11);

        // Crossed arms
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-22, -64, 10, 16);
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(12, -64, 10, 16);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-6, -58, 14, 10);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(8, -54, 8, 7);
        ctx.fillRect(-16, -56, 9, 8);

        drawBisonHead(0, -84, 'evil');
        break;

      default:
        this.renderBison(ctx, { ...fighter, state: FighterState.IDLE });
        break;
    }
  }

  // ==========================================
  // BLANKA (THE BEAST OF BRAZIL)
  // ==========================================
  static renderBlanka(ctx, fighter) {
    const s = fighter.state;
    const t = fighter.animFrame;
    const st = fighter.stateTimer;
    const bob = Math.sin(t * 0.12) * 2;
    const skin = fighter.skinColor || '#22c55e';
    const skinDark = fighter.skinShade || '#15803d';
    const hair = fighter.hairColor || '#ea580c';
    const pants = fighter.pantsColor || '#1d4ed8';
    const cuff = fighter.cuffColor || '#ca8a04';

    const drawBlankaHead = (hx, hy, expression = 'feral') => {
      // Beast head base
      ctx.fillStyle = skin;
      ctx.fillRect(hx - 10, hy - 8, 20, 16);
      ctx.fillRect(hx - 6, hy + 6, 12, 4); // Beast jaw

      // Wild flaming orange hair mane
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.moveTo(hx - 16, hy - 6);
      ctx.lineTo(hx - 24, hy - 18);
      ctx.lineTo(hx - 12, hy - 16);
      ctx.lineTo(hx - 6, hy - 26);
      ctx.lineTo(hx + 4, hy - 16);
      ctx.lineTo(hx + 12, hy - 24);
      ctx.lineTo(hx + 16, hy - 8);
      ctx.lineTo(hx + 8, hy + 4);
      ctx.lineTo(hx - 12, hy + 2);
      ctx.closePath();
      ctx.fill();

      // Facial Features & Expression
      if (expression === 'hurt') {
        // Wincing beast eye
        ctx.fillStyle = '#14532d';
        ctx.fillRect(hx + 2, hy - 3, 6, 2);
        // Screaming open mouth
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(hx + 2, hy + 1, 8, 7);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx + 3, hy + 1, 2, 3);
        ctx.fillRect(hx + 7, hy + 1, 2, 3);
      } else {
        // Yellow beast eye with crimson pupil
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(hx + 1, hy - 4, 7, 4);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(hx + 4, hy - 3, 3, 3);
        // Heavy dark brow ridge
        ctx.fillStyle = '#14532d';
        ctx.fillRect(hx, hy - 5, 9, 2);

        // Snarling open jaws with razor white fangs!
        ctx.fillStyle = '#7f1d1d'; // Dark red maw interior
        ctx.fillRect(hx + 2, hy + 1, 8, 6);
        // White canine fangs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx + 3, hy + 1, 2, 3); // Upper fang 1
        ctx.fillRect(hx + 7, hy + 1, 2, 3); // Upper fang 2
        ctx.fillRect(hx + 5, hy + 4, 2, 3); // Lower tooth
        ctx.fillStyle = '#ef4444'; // Red tongue
        ctx.fillRect(hx + 3, hy + 4, 4, 2);
      }
    };

    switch (s) {
      case FighterState.IDLE:
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18, -32 + bob, 14, 30 - bob);
        ctx.fillStyle = skin;
        ctx.fillRect(4, -30 + bob, 14, 28 - bob);
        ctx.fillStyle = pants;
        ctx.fillRect(-16, -42 + bob, 32, 14);
        ctx.fillStyle = cuff;
        ctx.fillRect(-20, -6, 8, 4);
        ctx.fillRect(10, -6, 8, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(-22, -4, 18, 5);
        ctx.fillRect(6, -4, 18, 5);
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -64 + bob, 28, 26);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-10, -56 + bob, 8, 14);
        drawBlankaHead(6, -68 + bob, 'feral');
        ctx.fillStyle = skinDark;
        ctx.fillRect(-20, -58 + bob, 10, 20);
        ctx.fillStyle = skin;
        ctx.fillRect(12, -58 + bob, 10, 20);
        ctx.fillStyle = cuff;
        ctx.fillRect(-20, -42 + bob, 10, 4);
        ctx.fillRect(12, -42 + bob, 10, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-18, -38 + bob, 6, 6);
        ctx.fillRect(14, -38 + bob, 6, 6);
        break;

      case FighterState.WALK_FWD:
      case FighterState.WALK_BACK:
        const step = Math.sin(t * 0.25) * 8;
        const bkBob = Math.abs(Math.sin(t * 0.25)) * 3;
        ctx.fillStyle = pants;
        ctx.fillRect(-14, -40 + bkBob, 28, 14);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18 + step, -28, 12, 28);
        ctx.fillStyle = skin;
        ctx.fillRect(4 - step, -28, 12, 28);
        ctx.fillStyle = skin;
        ctx.fillRect(-12, -62 + bkBob, 26, 24);

        // Four Limbs: Beast claw arms swinging with motion
        ctx.fillStyle = skinDark;
        ctx.fillRect(-20 + step * 0.5, -56 + bkBob, 9, 18);
        ctx.fillStyle = cuff;
        ctx.fillRect(-20 + step * 0.5, -42 + bkBob, 9, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-18 + step * 0.5, -38 + bkBob, 6, 6);

        ctx.fillStyle = skin;
        ctx.fillRect(12 - step * 0.5, -56 + bkBob, 9, 18);
        ctx.fillStyle = cuff;
        ctx.fillRect(12 - step * 0.5, -42 + bkBob, 9, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(14 - step * 0.5, -38 + bkBob, 6, 6);

        drawBlankaHead(4, -66 + bkBob, 'feral');
        break;

      case FighterState.CROUCH:
        ctx.fillStyle = pants;
        ctx.fillRect(-16, -28, 30, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -46, 28, 20);
        // Low claw arms guarding ground
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18, -36, 10, 16);
        ctx.fillRect(12, -36, 10, 16);
        ctx.fillStyle = cuff;
        ctx.fillRect(-18, -24, 10, 4);
        ctx.fillRect(12, -24, 10, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-16, -20, 6, 6);
        ctx.fillRect(14, -20, 6, 6);
        drawBlankaHead(6, -50, 'feral');
        break;

      case FighterState.JUMP:
        ctx.fillStyle = pants;
        ctx.fillRect(-12, -45, 24, 12);
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -64, 26, 22);
        // Tucked beast legs
        ctx.fillRect(-16, -34, 10, 18);
        ctx.fillRect(6, -34, 10, 18);
        // Pouncing claw arms
        ctx.fillStyle = skinDark;
        ctx.fillRect(-20, -56, 8, 14);
        ctx.fillRect(10, -56, 8, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-20, -44, 7, 7);
        ctx.fillRect(10, -44, 7, 7);
        drawBlankaHead(2, -70, 'feral');
        break;

      case FighterState.BLOCKSTUN:
        // Crossed beast claw block
        ctx.fillStyle = pants;
        ctx.fillRect(-14, -38, 28, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-12, -60, 26, 24);
        ctx.fillRect(-16, -28, 12, 28);
        ctx.fillRect(4, -28, 12, 28);
        // Crossed arms
        ctx.fillStyle = skinDark;
        ctx.fillRect(-4, -60, 10, 20);
        ctx.fillRect(4, -64, 10, 20);
        ctx.fillStyle = cuff;
        ctx.fillRect(-4, -68, 10, 4);
        ctx.fillRect(4, -72, 10, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -74, 7, 6);
        ctx.fillRect(6, -78, 7, 6);
        drawBlankaHead(0, -68, 'feral');
        break;

      case FighterState.HITSTUN:
        ctx.fillStyle = pants;
        ctx.fillRect(-16, -36, 28, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -58, 26, 24);
        ctx.fillRect(-18, -26, 12, 26);
        ctx.fillRect(2, -26, 12, 26);
        // Flailing arms
        ctx.fillStyle = skinDark;
        ctx.fillRect(-24, -54, 8, 14);
        ctx.fillRect(12, -50, 8, 14);
        drawBlankaHead(-4, -68, 'hurt');
        break;

      case FighterState.LIGHT_PUNCH:
      case FighterState.HEAVY_PUNCH:
        // Hunched legs
        ctx.fillStyle = pants;
        ctx.fillRect(-16, -34, 12, 16);
        ctx.fillRect(4, -34, 12, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -20, 12, 20);
        ctx.fillRect(4, -20, 12, 20);
        // Body & head
        ctx.fillRect(-14, -60, 28, 28);
        drawBlankaHead(2, -66);
        // Rear claw
        ctx.fillRect(-18, -54, 8, 16);
        // Claws swiping forward
        ctx.fillRect(12, -58, s === FighterState.HEAVY_PUNCH ? 34 : 22, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(12 + (s === FighterState.HEAVY_PUNCH ? 34 : 22), -60, 6, 14);
        break;

      case FighterState.LIGHT_KICK:
        // Plant leg (single rear claw leg)
        ctx.fillStyle = pants;
        ctx.fillRect(-14, -36, 14, 18);
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -20, 14, 20);
        // Hunched body & head
        ctx.fillRect(-12, -60, 26, 26);
        drawBlankaHead(0, -66);
        // Snapped kick leg
        ctx.fillStyle = skin;
        ctx.fillRect(4, -40, 16, 12);
        ctx.fillRect(18, -38, 20, 11);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(36, -38, 6, 8);
        break;

      case FighterState.HEAVY_KICK:
        // Feral High Claw Kick
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -62, 26, 26);
        drawBlankaHead(-6, -68);
        // Plant leg
        ctx.fillStyle = pants;
        ctx.fillRect(-16, -36, 14, 18);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -20, 14, 20);
        // High beast kick
        ctx.fillRect(2, -54, 18, 13);
        ctx.fillRect(18, -68, 28, 13);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(44, -70, 7, 16);
        break;

      case FighterState.SWEEP:
        ctx.fillStyle = pants;
        ctx.fillRect(-16, -26, 28, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -38, 26, 14);
        drawBlankaHead(2, -42);
        ctx.fillStyle = skin;
        ctx.fillRect(10, -14, 42, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(50, -16, 6, 14);
        break;

      case FighterState.ELECTRIC_THUNDER:
        ctx.fillStyle = pants;
        ctx.fillRect(-18, -32, 36, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -56, 32, 26);
        drawBlankaHead(0, -62);
        ctx.fillStyle = skin;
        ctx.fillRect(-24, -52, 10, 22);
        ctx.fillRect(14, -52, 10, 22);
        ctx.save();
        ctx.strokeStyle = st % 2 === 0 ? '#00ffff' : '#ffff00';
        ctx.lineWidth = 2.5;
        for (let a = 0; a < 6; a++) {
          const angle = (Math.PI * 2 * a) / 6 + (st * 0.4);
          const rad = 28 + Math.sin(st + a) * 8;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * (rad - 12), -40 + Math.sin(angle) * (rad - 12));
          ctx.lineTo(Math.cos(angle) * rad, -40 + Math.sin(angle) * rad);
          ctx.lineTo(Math.cos(angle + 0.3) * (rad + 6), -40 + Math.sin(angle + 0.3) * (rad + 6));
          ctx.stroke();
        }
        ctx.restore();
        break;

      case FighterState.ROLLING_ATTACK:
        ctx.save();
        ctx.translate(0, -35);
        ctx.rotate(st * 0.7);
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = pants;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.fillStyle = hair;
        for (let i = 0; i < 8; i++) {
          const ang = (Math.PI * 2 * i) / 8;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * 16, Math.sin(ang) * 16);
          ctx.lineTo(Math.cos(ang + 0.2) * 26, Math.sin(ang + 0.2) * 26);
          ctx.lineTo(Math.cos(ang + 0.4) * 16, Math.sin(ang + 0.4) * 16);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        break;

      case FighterState.KNOCKDOWN:
      case FighterState.DEFEATED:
        ctx.fillStyle = pants;
        ctx.fillRect(-35, -14, 38, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(3, -12, 28, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-48, -10, 8, 8);
        drawBlankaHead(-40, -12, 'hurt');
        break;

      case FighterState.VICTORY:
        ctx.fillStyle = pants;
        ctx.fillRect(-16, -38, 32, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -64, 28, 28);
        drawBlankaHead(0, -78, 'feral');
        ctx.fillStyle = skin;
        ctx.fillRect(-22, -88, 10, 28);
        ctx.fillRect(12, -88, 10, 28);
        ctx.fillStyle = cuff;
        ctx.fillRect(-22, -90, 10, 4);
        ctx.fillRect(12, -90, 10, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-22, -96, 10, 6);
        ctx.fillRect(12, -96, 10, 6);
        break;

      default:
        this.renderBlanka(ctx, { ...fighter, state: FighterState.IDLE });
        break;
    }
  }

  // ==========================================
  // E. HONDA (SUMO POWERHOUSE)
  // ==========================================
  static renderEhonDa(ctx, fighter) {
    const s = fighter.state;
    const t = fighter.animFrame;
    const st = fighter.stateTimer;
    const bob = Math.sin(t * 0.1) * 2;
    const skin = fighter.skinColor || '#fcd34d';
    const skinDark = fighter.skinShade || '#f59e0b';
    const mawashi = fighter.mawashiColor || '#1e40af';
    const paint = fighter.facePaint || '#dc2626';

    const drawHondaHead = (hx, hy, expression = 'sumo') => {
      // Broad round sumo face & neck
      ctx.fillStyle = skin;
      ctx.fillRect(hx - 10, hy - 8, 20, 18);
      ctx.fillRect(hx - 8, hy + 8, 16, 5); // Broad chin

      // Chonmage topknot & cord
      ctx.fillStyle = '#18181b';
      ctx.fillRect(hx - 8, hy - 14, 16, 8);
      ctx.fillRect(hx - 3, hy - 19, 6, 6);
      ctx.fillStyle = '#ffffff'; // Topknot paper cord
      ctx.fillRect(hx - 3, hy - 14, 6, 2);

      // Kabuki Kumadori Red Facial Warpaint
      ctx.fillStyle = paint; // '#dc2626'
      ctx.fillRect(hx - 7, hy - 2, 3, 10);
      ctx.fillRect(hx + 4, hy - 2, 3, 10);
      ctx.fillRect(hx - 4, hy - 6, 8, 2); // Brow line paint

      // Eyes & Brow
      if (expression === 'hurt') {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(hx - 6, hy - 4, 12, 2);
        // Open yelling mouth in pain
        ctx.fillStyle = '#18181b';
        ctx.fillRect(hx - 5, hy + 4, 10, 5);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(hx - 3, hy + 6, 6, 2);
      } else {
        // White sclera & dark pupils
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx - 6, hy - 5, 5, 3);
        ctx.fillRect(hx + 1, hy - 5, 5, 3);
        ctx.fillStyle = '#18181b';
        ctx.fillRect(hx - 4, hy - 5, 3, 3);
        ctx.fillRect(hx + 3, hy - 5, 3, 3);
        // Broad sumo nose
        ctx.fillStyle = skinDark;
        ctx.fillRect(hx - 2, hy - 1, 4, 4);
        // Booming sumo kiai mouth ("Dosukoi!")
        ctx.fillStyle = '#18181b';
        ctx.fillRect(hx - 5, hy + 4, 10, 5);
        ctx.fillStyle = '#ffffff'; // White teeth
        ctx.fillRect(hx - 4, hy + 4, 8, 2);
        ctx.fillStyle = '#ef4444'; // Red tongue
        ctx.fillRect(hx - 3, hy + 6, 6, 2);
      }
    };

    switch (s) {
      case FighterState.IDLE:
        // Sumo legs
        ctx.fillStyle = skinDark;
        ctx.fillRect(-22, -38 + bob, 18, 38 - bob);
        ctx.fillStyle = skin;
        ctx.fillRect(4, -38 + bob, 18, 38 - bob);
        ctx.fillStyle = skin;
        ctx.fillRect(-26, -4, 22, 5);
        ctx.fillRect(4, -4, 24, 5);

        // Blue Mawashi belt with white sagari ties
        ctx.fillStyle = mawashi;
        ctx.fillRect(-20, -50 + bob, 40, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-4, -48 + bob, 8, 14);

        // Heavy sumo torso & pectoral shading
        ctx.fillStyle = skin;
        ctx.fillRect(-20, -74 + bob, 40, 26);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-14, -68 + bob, 12, 10);
        ctx.fillRect(2, -68 + bob, 12, 10);

        // --- FOUR LIMBS: HONDA'S SUMO OPEN PALM GUARD ---
        // Thick upper arms:
        ctx.fillStyle = skinDark;
        ctx.fillRect(-26, -70 + bob, 12, 22);
        ctx.fillStyle = skin;
        ctx.fillRect(14, -70 + bob, 12, 22);
        // White taped wrists:
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-26, -52 + bob, 12, 4);
        ctx.fillRect(14, -52 + bob, 12, 4);
        // Massive open slapping palms:
        ctx.fillStyle = skin;
        ctx.fillRect(-28, -48 + bob, 14, 10);
        ctx.fillRect(16, -48 + bob, 14, 10);

        drawHondaHead(0, -82 + bob, 'sumo');
        break;

      case FighterState.WALK_FWD:
      case FighterState.WALK_BACK:
        const step = Math.sin(t * 0.2) * 8;
        const hBob = Math.abs(Math.sin(t * 0.2)) * 3;

        ctx.fillStyle = mawashi;
        ctx.fillRect(-18, -48 + hBob, 36, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-22, -72 + hBob, 38, 26);
        ctx.fillRect(-20 + step, -34, 16, 34);
        ctx.fillRect(4 - step, -34, 16, 34);

        // Four Limbs: Sumo arms moving forward with open slapping palms
        ctx.fillStyle = skinDark;
        ctx.fillRect(-26 + step * 0.4, -68 + hBob, 10, 20);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-26 + step * 0.4, -50 + hBob, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(-28 + step * 0.4, -46 + hBob, 12, 10);

        ctx.fillStyle = skin;
        ctx.fillRect(16 - step * 0.4, -68 + hBob, 10, 20);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(16 - step * 0.4, -50 + hBob, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(16 - step * 0.4, -46 + hBob, 12, 10);

        drawHondaHead(0, -80 + hBob, 'sumo');
        break;

      case FighterState.CROUCH:
        // Deep sumo shiko squat posture
        ctx.fillStyle = mawashi;
        ctx.fillRect(-22, -34, 44, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-20, -56, 40, 24);
        ctx.fillRect(-24, -22, 16, 22);
        ctx.fillRect(8, -22, 16, 22);
        // Low sumo slapping hands on knees
        ctx.fillStyle = skinDark;
        ctx.fillRect(-26, -46, 10, 18);
        ctx.fillStyle = skin;
        ctx.fillRect(16, -46, 10, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-26, -30, 10, 4);
        ctx.fillRect(16, -30, 10, 4);
        drawHondaHead(0, -64, 'sumo');
        break;

      case FighterState.JUMP:
        // Sumo airborne leap
        ctx.fillStyle = mawashi;
        ctx.fillRect(-18, -50, 36, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -72, 36, 24);
        ctx.fillRect(-18, -34, 14, 20);
        ctx.fillRect(4, -34, 14, 20);
        // Airborne sumo arms
        ctx.fillStyle = skinDark;
        ctx.fillRect(-28, -66, 10, 18);
        ctx.fillStyle = skin;
        ctx.fillRect(16, -66, 10, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-28, -50, 10, 4);
        ctx.fillRect(16, -50, 10, 4);
        drawHondaHead(0, -80, 'sumo');
        break;

      case FighterState.BLOCKSTUN:
        // Heavy open-palm sumo block
        ctx.fillStyle = mawashi;
        ctx.fillRect(-20, -42, 40, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -70, 36, 28);
        ctx.fillRect(-18, -30, 14, 30);
        ctx.fillRect(4, -30, 14, 30);
        // Double open-palm guard
        ctx.fillStyle = skin;
        ctx.fillRect(4, -68, 12, 22);
        ctx.fillRect(-8, -64, 12, 22);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4, -72, 12, 4);
        ctx.fillRect(-8, -68, 12, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(4, -78, 14, 8);
        ctx.fillRect(-8, -74, 14, 8);
        drawHondaHead(-2, -78, 'sumo');
        break;

      case FighterState.HITSTUN:
        // Torso knocked back, wincing expression
        ctx.fillStyle = mawashi;
        ctx.fillRect(-22, -38, 40, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-20, -68, 38, 28);
        ctx.fillRect(-20, -28, 14, 28);
        ctx.fillRect(2, -28, 14, 28);
        // Flailing arms
        ctx.fillStyle = skinDark;
        ctx.fillRect(-28, -62, 10, 18);
        ctx.fillStyle = skin;
        ctx.fillRect(16, -58, 10, 18);
        drawHondaHead(-4, -76, 'hurt');
        break;

      case FighterState.LIGHT_PUNCH:
      case FighterState.HEAVY_PUNCH:
        // Sumo legs
        ctx.fillStyle = mawashi;
        ctx.fillRect(-20, -42, 38, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -30, 14, 30);
        ctx.fillRect(4, -30, 14, 30);
        // Heavy torso & head
        ctx.fillRect(-18, -68, 36, 28);
        drawHondaHead(2, -76);
        // Rear guard
        ctx.fillRect(-22, -60, 8, 18);
        // Sumo open palm thrust
        ctx.fillRect(14, -68, s === FighterState.HEAVY_PUNCH ? 40 : 24, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(14 + (s === FighterState.HEAVY_PUNCH ? 40 : 24), -70, 6, 18);
        break;

      case FighterState.LIGHT_KICK:
        // Plant leg (single massive rear sumo leg)
        ctx.fillStyle = mawashi;
        ctx.fillRect(-18, -42, 28, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -28, 18, 28);
        // Torso & head
        ctx.fillRect(-16, -68, 32, 28);
        drawHondaHead(0, -76);
        // Snapped sumo kick
        ctx.fillRect(6, -44, 18, 14);
        ctx.fillRect(22, -42, 20, 13);
        break;

      case FighterState.HEAVY_KICK:
        // Heavy High Sumo Thrust Kick
        ctx.fillStyle = mawashi;
        ctx.fillRect(-18, -42, 26, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -28, 18, 28);
        // Torso leaning back
        ctx.fillRect(-18, -68, 30, 26);
        drawHondaHead(-6, -76);
        // High sumo kick
        ctx.fillRect(2, -56, 20, 16);
        ctx.fillRect(20, -72, 30, 16);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(48, -74, 6, 20);
        break;

      case FighterState.SWEEP:
        ctx.fillStyle = mawashi;
        ctx.fillRect(-18, -30, 36, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -48, 36, 20);
        drawHondaHead(0, -56);
        ctx.fillStyle = skin;
        ctx.fillRect(10, -16, 44, 14);
        break;

      case FighterState.HUNDRED_SLAP:
        ctx.fillStyle = mawashi;
        ctx.fillRect(-20, -48, 38, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -72, 36, 26);
        drawHondaHead(2, -80);
        ctx.save();
        for (let i = 0; i < 4; i++) {
          const armY = -76 + i * 12 + Math.sin(st * 1.5 + i) * 6;
          ctx.fillStyle = i % 2 === 0 ? skin : skinDark;
          ctx.fillRect(12, armY, 38, 10);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(48, armY - 3, 6, 16);
        }
        ctx.restore();
        break;

      case FighterState.SUMO_HEADBUTT:
        if (st >= 27) {
          // Landing recovery / skidding pose: feet planted, torso leaning forward, arms braced down
          ctx.fillStyle = mawashi;
          ctx.fillRect(-22, -36, 18, 36);
          ctx.fillRect(4, -36, 18, 36);
          ctx.fillStyle = skin;
          ctx.fillRect(-18, -66, 38, 32);
          drawHondaHead(8, -74);
          // Braced arms on knees
          ctx.fillStyle = skinDark;
          ctx.fillRect(-28, -60, 14, 22);
          ctx.fillRect(16, -60, 14, 22);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-30, -40, 14, 8);
          ctx.fillRect(18, -40, 14, 8);
        } else {
          ctx.save();
          ctx.fillStyle = mawashi;
          ctx.fillRect(-24, -48, 18, 28);
          ctx.fillStyle = skin;
          ctx.fillRect(-10, -50, 44, 30);
          drawHondaHead(42, -38);
          ctx.fillStyle = skin;
          ctx.fillRect(-40, -44, 18, 14);
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(56, -42);
          ctx.lineTo(66, -38);
          ctx.lineTo(56, -34);
          ctx.stroke();
          ctx.restore();
        }
        break;

      case FighterState.KNOCKDOWN:
      case FighterState.DEFEATED:
        ctx.fillStyle = mawashi;
        ctx.fillRect(-25, -16, 32, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(7, -14, 30, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-48, -10, 8, 8);
        drawHondaHead(-38, -12, 'hurt');
        break;

      case FighterState.VICTORY:
        ctx.fillStyle = mawashi;
        ctx.fillRect(-20, -48, 40, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-20, -74, 40, 28);
        drawHondaHead(0, -84, 'sumo');
        ctx.fillStyle = skin;
        ctx.fillRect(-44, -72, 26, 14);
        ctx.fillRect(18, -72, 26, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-48, -74, 8, 18);
        ctx.fillRect(40, -74, 8, 18);
        break;

      default:
        this.renderEhonDa(ctx, { ...fighter, state: FighterState.IDLE });
        break;
    }
  }

  // ==========================================
  // ZANGIEF (THE RED CYCLONE)
  // ==========================================
  static renderZangief(ctx, fighter) {
    const s = fighter.state;
    const t = fighter.animFrame;
    const st = fighter.stateTimer;
    const bob = Math.sin(t * 0.1) * 2;
    const skin = fighter.skinColor || '#fcd34d';
    const skinDark = fighter.skinShade || '#f59e0b';
    const trunks = fighter.trunksColor || '#dc2626';
    const belt = fighter.beltColor || '#ca8a04';
    const hair = fighter.hairColor || '#451a03';
    const boots = fighter.bootsColor || '#991b1b';

    const drawZangiefHead = (hx, hy, expression = 'rage') => {
      // Rugged face & jaw
      ctx.fillStyle = skin;
      ctx.fillRect(hx - 9, hy - 8, 18, 16);

      // Battle scars across face
      ctx.fillStyle = '#b45309';
      ctx.fillRect(hx - 6, hy - 7, 10, 2);
      ctx.fillRect(hx - 3, hy - 9, 2, 6);

      // Mohawk with shaved stubble sides
      ctx.fillStyle = hair;
      ctx.fillRect(hx - 4, hy - 17, 8, 10);
      ctx.fillRect(hx - 2, hy - 20, 4, 4);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(hx - 8, hy - 13, 4, 6);
      ctx.fillRect(hx + 4, hy - 13, 4, 6);

      // Bristling Russian beard and mustache
      ctx.fillStyle = hair;
      ctx.fillRect(hx - 9, hy + 2, 18, 10);
      ctx.fillRect(hx - 6, hy + 11, 12, 4);

      // Eyes & Brow
      if (expression === 'hurt') {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(hx - 6, hy - 4, 12, 2);
        // Open mouth in pain
        ctx.fillStyle = '#18181b';
        ctx.fillRect(hx - 4, hy + 3, 8, 5);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(hx - 2, hy + 5, 4, 2);
      } else {
        // Bushy furrowed brow
        ctx.fillStyle = '#18181b';
        ctx.fillRect(hx - 6, hy - 5, 12, 2);
        // Fierce glaring eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx - 5, hy - 4, 4, 3);
        ctx.fillRect(hx + 1, hy - 4, 4, 3);
        ctx.fillStyle = '#18181b';
        ctx.fillRect(hx - 4, hy - 3, 2, 2);
        ctx.fillRect(hx + 2, hy - 3, 2, 2);

        // Broken wrestler nose
        ctx.fillStyle = skinDark;
        ctx.fillRect(hx - 2, hy - 1, 4, 4);

        // Ferocious open scowl with white teeth
        ctx.fillStyle = '#18181b';
        ctx.fillRect(hx - 4, hy + 3, 8, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx - 3, hy + 3, 6, 2);
      }
    };

    switch (s) {
      case FighterState.IDLE:
        // Muscular legs & red wrestling boots
        ctx.fillStyle = skinDark;
        ctx.fillRect(-20, -44 + bob, 16, 26);
        ctx.fillStyle = skin;
        ctx.fillRect(4, -44 + bob, 16, 26);
        ctx.fillStyle = boots;
        ctx.fillRect(-22, -18, 18, 18);
        ctx.fillRect(4, -18, 18, 18);
        ctx.fillStyle = '#18181b'; // Boot soles
        ctx.fillRect(-23, -3, 20, 3);
        ctx.fillRect(3, -3, 20, 3);

        // Red wrestling briefs & gold belt
        ctx.fillStyle = trunks;
        ctx.fillRect(-18, -52 + bob, 36, 14);
        ctx.fillStyle = belt;
        ctx.fillRect(-18, -54 + bob, 36, 4);

        // Muscular barrel chest & Russian chest hair
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -78 + bob, 36, 26);
        ctx.fillStyle = hair;
        ctx.fillRect(-10, -74 + bob, 20, 8);
        ctx.fillRect(-6, -66 + bob, 12, 6);

        // --- FOUR LIMBS: ZANGIEF'S MASSIVE GRAPPLING ARMS ---
        // Rear arm:
        ctx.fillStyle = skinDark;
        ctx.fillRect(-26, -74 + bob, 12, 26);
        ctx.fillStyle = trunks; // Red wrist wrap
        ctx.fillRect(-26, -56 + bob, 12, 6);
        ctx.fillStyle = skin; // Open grappling hand
        ctx.fillRect(-28, -50 + bob, 14, 8);

        // Front arm:
        ctx.fillStyle = skin;
        ctx.fillRect(16, -74 + bob, 12, 26);
        ctx.fillStyle = trunks; // Red wrist wrap
        ctx.fillRect(16, -56 + bob, 12, 6);
        ctx.fillStyle = skin; // Open grappling claw hand
        ctx.fillRect(16, -50 + bob, 14, 8);

        drawZangiefHead(0, -88 + bob, 'rage');
        break;

      case FighterState.WALK_FWD:
      case FighterState.WALK_BACK:
        const step = Math.sin(t * 0.22) * 8;
        const zBob = Math.abs(Math.sin(t * 0.22)) * 3;

        ctx.fillStyle = trunks;
        ctx.fillRect(-16, -50 + zBob, 32, 14);
        ctx.fillStyle = belt;
        ctx.fillRect(-16, -52 + zBob, 32, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -76 + zBob, 36, 28);
        ctx.fillStyle = boots;
        ctx.fillRect(-20 + step, -20, 16, 20);
        ctx.fillRect(4 - step, -20, 16, 20);

        // Four Limbs: Massive swinging wrestler arms in walking bear-hug guard
        ctx.fillStyle = skinDark;
        ctx.fillRect(-26 + step * 0.4, -72 + zBob, 11, 24);
        ctx.fillStyle = trunks;
        ctx.fillRect(-26 + step * 0.4, -54 + zBob, 11, 6);
        ctx.fillStyle = skin;
        ctx.fillRect(-28 + step * 0.4, -48 + zBob, 13, 8);

        ctx.fillStyle = skin;
        ctx.fillRect(16 - step * 0.4, -72 + zBob, 11, 24);
        ctx.fillStyle = trunks;
        ctx.fillRect(16 - step * 0.4, -54 + zBob, 11, 6);
        ctx.fillStyle = skin;
        ctx.fillRect(16 - step * 0.4, -48 + zBob, 13, 8);

        drawZangiefHead(0, -86 + zBob, 'rage');
        break;

      case FighterState.CROUCH:
        ctx.fillStyle = trunks;
        ctx.fillRect(-16, -36, 32, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -58, 34, 24);
        ctx.fillStyle = boots;
        ctx.fillRect(-20, -18, 16, 18);
        ctx.fillRect(4, -18, 16, 18);
        // Low grappling claw arms
        ctx.fillStyle = skinDark;
        ctx.fillRect(-24, -50, 10, 20);
        ctx.fillStyle = skin;
        ctx.fillRect(14, -50, 10, 20);
        ctx.fillStyle = trunks;
        ctx.fillRect(-24, -36, 10, 5);
        ctx.fillRect(14, -36, 10, 5);
        ctx.fillStyle = skin;
        ctx.fillRect(-26, -31, 12, 8);
        ctx.fillRect(14, -31, 12, 8);
        drawZangiefHead(0, -68, 'rage');
        break;

      case FighterState.JUMP:
        ctx.fillStyle = trunks;
        ctx.fillRect(-16, -48, 32, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -74, 34, 28);
        ctx.fillStyle = boots;
        ctx.fillRect(-16, -26, 14, 20);
        ctx.fillRect(4, -26, 14, 20);
        // Airborne open grappling arms
        ctx.fillStyle = skinDark;
        ctx.fillRect(-26, -70, 10, 22);
        ctx.fillStyle = skin;
        ctx.fillRect(16, -70, 10, 22);
        ctx.fillStyle = trunks;
        ctx.fillRect(-26, -54, 10, 5);
        ctx.fillRect(16, -54, 10, 5);
        ctx.fillStyle = skin;
        ctx.fillRect(-28, -49, 12, 8);
        ctx.fillRect(16, -49, 12, 8);
        drawZangiefHead(0, -84, 'rage');
        break;

      case FighterState.BLOCKSTUN:
        // Double massive wrestler arm cross block
        ctx.fillStyle = trunks;
        ctx.fillRect(-16, -42, 32, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -70, 34, 28);
        ctx.fillStyle = boots;
        ctx.fillRect(-18, -20, 16, 20);
        ctx.fillRect(2, -20, 16, 20);
        // Heavy forearms crossed blocking
        ctx.fillStyle = skin;
        ctx.fillRect(4, -70, 12, 22);
        ctx.fillRect(-6, -66, 12, 22);
        ctx.fillStyle = trunks;
        ctx.fillRect(4, -74, 12, 5);
        ctx.fillRect(-6, -70, 12, 5);
        drawZangiefHead(-2, -80, 'rage');
        break;

      case FighterState.HITSTUN:
        ctx.fillStyle = trunks;
        ctx.fillRect(-18, -40, 32, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -68, 34, 28);
        ctx.fillStyle = boots;
        ctx.fillRect(-20, -20, 16, 20);
        ctx.fillRect(0, -20, 16, 20);
        // Recoiled arms
        ctx.fillStyle = skinDark;
        ctx.fillRect(-28, -64, 10, 20);
        ctx.fillStyle = skin;
        ctx.fillRect(16, -60, 10, 20);
        drawZangiefHead(-4, -78, 'hurt');
        break;
        ctx.fillRect(-16, -26, 14, 20);
        ctx.fillRect(4, -26, 14, 20);
        break;

      case FighterState.LIGHT_PUNCH:
      case FighterState.HEAVY_PUNCH:
        // Heavy legs in wrestling boots
        ctx.fillStyle = trunks;
        ctx.fillRect(-18, -42, 36, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -30, 14, 12);
        ctx.fillRect(4, -30, 14, 12);
        ctx.fillStyle = boots;
        ctx.fillRect(-16, -20, 14, 20);
        ctx.fillRect(4, -20, 14, 20);
        // Torso & head
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -72, 36, 32);
        drawZangiefHead(2, -80);
        // Rear guard fist
        ctx.fillRect(-22, -64, 8, 18);
        // Punching arm
        ctx.fillRect(14, -72, s === FighterState.HEAVY_PUNCH ? 42 : 24, 14);
        ctx.fillStyle = trunks;
        ctx.fillRect(26, -72, 8, 14);
        break;

      case FighterState.LIGHT_KICK:
        // Plant leg (single rear leg in wrestling boot)
        ctx.fillStyle = trunks;
        ctx.fillRect(-16, -42, 24, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -30, 16, 12);
        ctx.fillStyle = boots;
        ctx.fillRect(-14, -20, 16, 20);
        // Torso & head
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -72, 30, 32);
        drawZangiefHead(0, -80);
        // Snapped boot kick
        ctx.fillRect(6, -46, 16, 14);
        ctx.fillStyle = boots;
        ctx.fillRect(20, -44, 22, 15);
        break;

      case FighterState.HEAVY_KICK:
        // Zangief's Powerful High Boot Kick!
        ctx.fillStyle = trunks;
        ctx.fillRect(-18, -42, 26, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -30, 16, 12);
        ctx.fillStyle = boots;
        ctx.fillRect(-16, -20, 16, 20);
        // Torso leaning back
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -70, 32, 30);
        drawZangiefHead(-6, -78);
        // High wrestling boot kick
        ctx.fillRect(4, -58, 18, 16);
        ctx.fillStyle = boots;
        ctx.fillRect(20, -74, 30, 17);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(48, -76, 6, 20);
        break;

      case FighterState.SWEEP:
        ctx.fillStyle = trunks;
        ctx.fillRect(-16, -30, 32, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -48, 32, 20);
        drawZangiefHead(0, -58);
        ctx.fillStyle = boots;
        ctx.fillRect(10, -18, 46, 16);
        break;

      case FighterState.DOUBLE_LARIAT:
        ctx.save();
        ctx.fillStyle = trunks;
        ctx.fillRect(-16, -50, 32, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -76, 32, 28);
        drawZangiefHead(0, -86);
        const spinW = 54;
        ctx.fillStyle = skin;
        ctx.fillRect(-spinW, -72, spinW * 2, 14);
        ctx.fillStyle = trunks;
        ctx.fillRect(-spinW + 8, -72, 8, 14);
        ctx.fillRect(spinW - 16, -72, 8, 14);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-spinW - 6, -65);
        ctx.lineTo(spinW + 6, -65);
        ctx.stroke();
        ctx.restore();
        break;

      case FighterState.SPINNING_PILEDRIVER:
        ctx.save();
        ctx.translate(0, -45);
        ctx.rotate(st * 0.8);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -20, 32, 40);
        ctx.fillStyle = trunks;
        ctx.fillRect(-16, -4, 32, 14);
        drawZangiefHead(0, -28);
        ctx.fillStyle = boots;
        ctx.fillRect(-14, 16, 12, 16);
        ctx.fillRect(2, 16, 12, 16);
        ctx.restore();
        break;

      case FighterState.KNOCKDOWN:
      case FighterState.DEFEATED:
        ctx.fillStyle = trunks;
        ctx.fillRect(-26, -16, 32, 16);
        ctx.fillStyle = boots;
        ctx.fillRect(8, -14, 30, 14);
        drawZangiefHead(-38, -12);
        break;

      case FighterState.VICTORY:
        ctx.fillStyle = trunks;
        ctx.fillRect(-18, -52, 36, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -78, 36, 28);
        drawZangiefHead(0, -88);
        ctx.fillStyle = skin;
        ctx.fillRect(-34, -84, 16, 14);
        ctx.fillRect(18, -84, 16, 14);
        ctx.fillRect(-34, -96, 14, 14);
        ctx.fillRect(20, -96, 14, 14);
        break;

      default:
        this.renderZangief(ctx, { ...fighter, state: FighterState.IDLE });
        break;
    }
  }

  // ==========================================
  // DHALSIM (THE MYSTICAL YOGI)
  // ==========================================
  static renderDhalsim(ctx, fighter) {
    const s = fighter.state;
    const t = fighter.animFrame;
    const st = fighter.stateTimer;
    const bob = Math.sin(t * 0.1) * 2;
    const skin = fighter.skinColor || '#d97706';
    const skinDark = fighter.skinShade || '#b45309';
    const trunks = fighter.trunksColor || '#eab308';
    const marks = fighter.headbandColor || '#dc2626';

    const drawDhalsimHead = (hx, hy, expression = 'serene') => {
      // Ascetic Bald Cranium
      ctx.fillStyle = skin;
      ctx.fillRect(hx - 7, hy - 6, 14, 15);
      ctx.fillRect(hx - 5, hy + 9, 10, 4); // Chiseled chin & jaw
      ctx.fillRect(hx - 5, hy - 10, 10, 4); // Cranium curve
      ctx.fillRect(hx - 3, hy - 12, 6, 2); // Top crown
      // Dark shade on back of head & jawline
      ctx.fillStyle = skinDark;
      ctx.fillRect(hx - 7, hy - 2, 2, 8);
      ctx.fillRect(hx - 5, hy + 11, 8, 2);

      // Long Stretched Ascetic Earlobes with Golden Ring Earrings
      ctx.fillStyle = skinDark;
      ctx.fillRect(hx - 8, hy + 2, 3, 7); // Stretched lobe
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(hx - 7, hy + 11, 4, 0, Math.PI * 2); // Golden hoop earring
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(hx - 7, hy + 11, 1.5, 0, Math.PI * 2); // Earring hoop center hole
      ctx.fill();

      // Sacred Red Tilak Stripes on Forehead (Three vertical stripes)
      ctx.fillStyle = marks;
      ctx.fillRect(hx - 4, hy - 9, 2, 8);
      ctx.fillRect(hx - 1, hy - 10, 2, 9);
      ctx.fillRect(hx + 2, hy - 9, 2, 8);

      // Facial Features and Expression
      if (expression === 'hurt') {
        // Clenched shut pained eyes
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(hx - 3, hy - 1, 4, 2);
        ctx.fillRect(hx + 2, hy - 1, 4, 2);
        // Open gasping pained mouth
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(hx, hy + 5, 5, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx + 1, hy + 5, 3, 2); // Teeth
      } else if (expression === 'kiai' || expression === 'flame') {
        // Fierce wide eyes breathing fire / chanting
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx - 2, hy - 2, 6, 4);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(hx + 1, hy - 2, 3, 3);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(hx - 2, hy - 4, 7, 2); // Tense brow
        // Slender nose
        ctx.fillStyle = skinDark;
        ctx.fillRect(hx + 3, hy, 2, 3);
        // Wide open mouth expelling flames
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(hx - 1, hy + 4, 7, 5);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(hx + 1, hy + 5, 4, 3); // Mystical inner orange heat
      } else {
        // Serene ascetic eyebrows
        ctx.fillStyle = '#78350f';
        ctx.fillRect(hx - 2, hy - 3, 7, 1);
        // Tranquil yogic eyes with white sclera and dark pupils
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx - 2, hy - 1, 6, 3);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(hx + 1, hy - 1, 3, 3);
        // Slender nose
        ctx.fillStyle = skinDark;
        ctx.fillRect(hx + 3, hy, 2, 3);
        // Serene calm mouth
        ctx.fillStyle = '#78350f';
        ctx.fillRect(hx + 1, hy + 5, 5, 2);
        if (expression === 'smile') {
          // Subtle upturn at the edge for enlightened smile
          ctx.fillRect(hx + 5, hy + 4, 2, 2);
        }
      }

      // Holy Skull Necklace around collarbone (3 miniature skulls)
      const drawMiniSkull = (sx, sy) => {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(sx - 2, sy - 2, 5, 5); // Skull cranium
        ctx.fillRect(sx - 1, sy + 3, 3, 2); // Maxilla / teeth
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(sx - 1, sy - 1, 1, 1); // Left eye socket
        ctx.fillRect(sx + 1, sy - 1, 1, 1); // Right eye socket
      };
      drawMiniSkull(hx - 6, hy + 13);
      drawMiniSkull(hx, hy + 15);
      drawMiniSkull(hx + 6, hy + 13);
    };

    switch (s) {
      case FighterState.IDLE:
        // Legs with Golden Anklets
        ctx.fillStyle = skinDark;
        ctx.fillRect(-14, -40 + bob, 8, 40 - bob);
        ctx.fillStyle = '#facc15'; // Golden Anklet
        ctx.fillRect(-15, -6 + bob, 10, 4);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-16, -2, 12, 3); // Bare foot

        ctx.fillStyle = skin;
        ctx.fillRect(4, -38 + bob, 8, 38 - bob);
        ctx.fillStyle = '#facc15'; // Golden Anklet
        ctx.fillRect(3, -6 + bob, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(4, -2, 14, 3); // Bare foot

        // Trunks & Sash
        ctx.fillStyle = trunks;
        ctx.fillRect(-14, -48 + bob, 28, 14);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(-14, -48 + bob, 28, 3);

        // Slender Yogic Torso
        ctx.fillStyle = skin;
        ctx.fillRect(-11, -72 + bob, 22, 26);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-4, -68 + bob, 8, 2); // Rib definition

        drawDhalsimHead(0, -80 + bob, 'serene');

        // Four Limbs - Rear Arm (Yogic Mudra Guard)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-17, -70 + bob, 6, 14);
        ctx.fillStyle = '#facc15'; // Gold Bicep Band
        ctx.fillRect(-18, -64 + bob, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-19, -58 + bob, 6, 12);
        ctx.fillStyle = '#facc15'; // Gold Wrist Bangle
        ctx.fillRect(-20, -48 + bob, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-21, -45 + bob, 8, 7); // Open yogic palm

        // Four Limbs - Lead Arm (Palm Strike Guard)
        ctx.fillStyle = skin;
        ctx.fillRect(10, -70 + bob, 6, 14);
        ctx.fillStyle = '#facc15'; // Gold Bicep Band
        ctx.fillRect(9, -64 + bob, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(11, -58 + bob, 6, 12);
        ctx.fillStyle = '#facc15'; // Gold Wrist Bangle
        ctx.fillRect(10, -48 + bob, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(11, -45 + bob, 8, 7); // Open yogic palm
        break;

      case FighterState.WALK_FWD:
      case FighterState.WALK_BACK:
        const step = Math.sin(t * 0.22) * 8;
        const armSwing = Math.sin(t * 0.22) * 6;

        // Striding Slender Legs with Golden Anklets
        ctx.fillStyle = skinDark;
        ctx.fillRect(-14 + step, -38, 8, 38);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-15 + step, -6, 10, 4);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-16 + step, -2, 12, 3);

        ctx.fillStyle = skin;
        ctx.fillRect(4 - step, -38, 8, 38);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(3 - step, -6, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(4 - step, -2, 14, 3);

        // Trunks & Torso
        ctx.fillStyle = trunks;
        ctx.fillRect(-13, -48, 26, 14);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(-13, -48, 26, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(-11, -72, 22, 26);
        drawDhalsimHead(0, -80, 'serene');

        // Swaying Yogic Arms with Golden Bangles (Previously Missing!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-16 - armSwing, -70, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-17 - armSwing, -64, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18 - armSwing, -58, 6, 12);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-19 - armSwing, -48, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-20 - armSwing, -45, 8, 7);

        ctx.fillStyle = skin;
        ctx.fillRect(10 + armSwing, -70, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(9 + armSwing, -64, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(12 + armSwing, -58, 6, 12);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(11 + armSwing, -48, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(12 + armSwing, -45, 8, 7);
        break;

      case FighterState.CROUCH:
        // Deep Yogic Squat Legs
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18, -22, 14, 22);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-19, -6, 10, 4);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-20, -4, 18, 5);

        ctx.fillStyle = skin;
        ctx.fillRect(4, -22, 16, 22);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(3, -6, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(4, -4, 18, 5);

        // Trunks & Torso
        ctx.fillStyle = trunks;
        ctx.fillRect(-15, -38, 30, 18);
        ctx.fillStyle = skin;
        ctx.fillRect(-11, -60, 22, 24);
        drawDhalsimHead(0, -68, 'serene');

        // Low Defensive Yogic Arms (Previously Missing!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-16, -56, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-17, -50, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18, -44, 6, 12);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-19, -34, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-20, -31, 8, 7);

        ctx.fillStyle = skin;
        ctx.fillRect(10, -56, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(9, -50, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(12, -44, 6, 12);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(11, -34, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(12, -31, 8, 7);
        break;

      case FighterState.JUMP:
        // Floating Aerial Trailing Legs with Golden Anklets
        ctx.fillStyle = skinDark;
        ctx.fillRect(-12, -40, 8, 22);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-13, -20, 10, 4);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-14, -16, 10, 6);

        ctx.fillStyle = skin;
        ctx.fillRect(4, -44, 8, 24);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(3, -22, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(4, -18, 10, 6);

        // Trunks & Torso
        ctx.fillStyle = trunks;
        ctx.fillRect(-12, -54, 24, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-10, -78, 20, 26);
        drawDhalsimHead(0, -86, 'serene');

        // Outstretched Levitation Arms (Previously Missing!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18, -74, 8, 16);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-19, -68, 9, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-22, -60, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-23, -48, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-24, -45, 9, 7);

        ctx.fillStyle = skin;
        ctx.fillRect(10, -74, 8, 16);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(10, -68, 9, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(14, -60, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(14, -48, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(15, -45, 9, 7);
        break;

      case FighterState.BLOCKSTUN:
        // Braced Legs
        ctx.fillStyle = skinDark;
        ctx.fillRect(-14, -40, 8, 40);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-15, -6, 10, 4);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-16, -2, 12, 3);

        ctx.fillStyle = skin;
        ctx.fillRect(2, -38, 8, 38);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(1, -6, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(2, -2, 14, 3);

        // Trunks & Torso
        ctx.fillStyle = trunks;
        ctx.fillRect(-14, -48, 28, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-13, -72, 22, 26);
        drawDhalsimHead(-2, -80, 'serene');

        // Crossed-Wrist Yogic Warding Barrier (Golden Bangles Clashing!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-6, -68, 14, 6);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-2, -70, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(4, -72, 6, 16);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(3, -75, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(2, -82, 8, 8);

        ctx.fillStyle = skin;
        ctx.fillRect(-2, -64, 14, 6);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(2, -66, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(8, -68, 6, 16);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(7, -71, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(6, -78, 8, 8);
        break;

      case FighterState.HITSTUN:
        // Reeling Legs
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18, -38, 8, 38);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-19, -6, 10, 4);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-20, -2, 12, 3);

        ctx.fillStyle = skin;
        ctx.fillRect(-2, -36, 8, 36);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-3, -6, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(-2, -2, 14, 3);

        // Torso Recoiling Backwards
        ctx.fillStyle = trunks;
        ctx.fillRect(-16, -46, 26, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -70, 22, 26);
        drawDhalsimHead(-6, -78, 'hurt');

        // Arms Flung Back from Impact
        ctx.fillStyle = skinDark;
        ctx.fillRect(-24, -68, 8, 18);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-25, -60, 9, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-27, -50, 8, 7);

        ctx.fillStyle = skin;
        ctx.fillRect(4, -62, 8, 18);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(4, -54, 9, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(2, -44, 8, 7);
        break;

      case FighterState.LIGHT_PUNCH:
      case FighterState.HEAVY_PUNCH:
        // Standing slender legs with golden anklets
        ctx.fillStyle = trunks;
        ctx.fillRect(-14, -38, 26, 14);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-12, -26, 8, 26);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-13, -6, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(2, -26, 8, 26);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(1, -6, 10, 4);

        // Torso & head
        ctx.fillStyle = skin;
        ctx.fillRect(-12, -66, 24, 30);
        drawDhalsimHead(2, -74, 'serene');

        // Rear Arm in Chest Guard (Full 4 Limbs!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-16, -66, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-17, -60, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18, -52, 7, 7);

        // Telescoping Stretchy Punching Arm with Gold Wrist Bangle
        const armLen = s === FighterState.HEAVY_PUNCH ? 82 : 54;
        ctx.fillStyle = skin;
        ctx.fillRect(10, -68, 8, 10);
        ctx.fillStyle = '#facc15'; // Bicep Band
        ctx.fillRect(14, -68, 4, 10);
        ctx.fillStyle = skin;
        for (let seg = 18; seg < armLen; seg += 12) {
          ctx.fillRect(10 + seg, -66, 9, 8);
        }
        ctx.fillStyle = '#facc15'; // Wrist Bangle
        ctx.fillRect(10 + armLen - 4, -68, 5, 12);
        ctx.fillStyle = skin;
        ctx.fillRect(10 + armLen, -68, 12, 12); // Fist
        break;

      case FighterState.LIGHT_KICK:
        // Plant leg (single rear leg on ground)
        ctx.fillStyle = trunks;
        ctx.fillRect(-12, -38, 20, 14);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-10, -26, 8, 26);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-11, -6, 10, 4);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-12, -2, 12, 3);

        // Torso & head
        ctx.fillStyle = skin;
        ctx.fillRect(-10, -66, 22, 30);
        drawDhalsimHead(0, -74, 'serene');

        // Both Arms in Balancing Guard (Full 4 Limbs!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-16, -66, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-17, -60, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18, -52, 7, 7);

        ctx.fillStyle = skin;
        ctx.fillRect(8, -66, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(7, -60, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(8, -52, 7, 7);

        // Mid stretchy leg with Golden Anklet
        ctx.fillStyle = skin;
        for (let seg = 0; seg < 56; seg += 12) {
          ctx.fillRect(8 + seg, -44, 9, 9);
        }
        ctx.fillStyle = '#facc15'; // Golden Anklet
        ctx.fillRect(60, -46, 5, 12);
        ctx.fillStyle = skin;
        ctx.fillRect(64, -46, 12, 12); // Foot
        break;

      case FighterState.HEAVY_KICK:
        // Standing Plant Leg
        ctx.fillStyle = trunks;
        ctx.fillRect(-14, -38, 22, 14);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-12, -26, 8, 26);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-13, -6, 10, 4);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-14, -2, 12, 3);

        // Torso leaning back
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -66, 22, 28);
        drawDhalsimHead(-6, -72, 'serene');

        // Both Arms Balancing (Full 4 Limbs!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-20, -64, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-21, -58, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-22, -50, 7, 7);

        ctx.fillStyle = skin;
        ctx.fillRect(6, -60, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(5, -54, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(6, -46, 7, 7);

        // High telescoping leg reaching chest/head level with Golden Anklet
        ctx.fillStyle = skin;
        for (let seg = 0; seg < 90; seg += 12) {
          ctx.fillRect(8 + seg, -72 + Math.floor(seg * 0.08), 9, 9);
        }
        ctx.fillStyle = '#facc15'; // Golden Anklet
        ctx.fillRect(94, -68, 5, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(99, -66, 14, 14); // Foot
        break;

      case FighterState.SWEEP:
        // Low crouching plant leg
        ctx.fillStyle = trunks;
        ctx.fillRect(-14, -28, 28, 12);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-12, -18, 8, 18);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-13, -4, 10, 4);

        // Torso & head
        ctx.fillStyle = skin;
        ctx.fillRect(-12, -44, 24, 18);
        drawDhalsimHead(0, -52, 'serene');

        // Supporting and Guard Arms (Full 4 Limbs!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18, -38, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-19, -30, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-20, -24, 7, 8); // Hand on ground

        ctx.fillStyle = skin;
        ctx.fillRect(4, -42, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(3, -34, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(4, -28, 7, 7);

        // Low Stretchy Sweeping Leg with Golden Anklet
        ctx.fillStyle = skin;
        for (let seg = 0; seg < 70; seg += 12) {
          ctx.fillRect(6 + seg, -14, 9, 8);
        }
        ctx.fillStyle = '#facc15'; // Golden Anklet
        ctx.fillRect(72, -16, 5, 12);
        ctx.fillStyle = skin;
        ctx.fillRect(76, -16, 12, 10);
        break;

      case FighterState.YOGA_FIRE:
        // Braced Legs with Golden Anklets
        ctx.fillStyle = skinDark;
        ctx.fillRect(-14, -38, 8, 38);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-15, -6, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(2, -38, 8, 38);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(1, -6, 10, 4);

        // Trunks & Torso
        ctx.fillStyle = trunks;
        ctx.fillRect(-14, -46, 28, 12);
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -70, 24, 26);
        drawDhalsimHead(-4, -76, 'flame');

        // Both Arms Thrust Forward Guiding Fireball (Full 4 Limbs!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-6, -68, 14, 6);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(6, -69, 4, 8);
        ctx.fillStyle = skinDark;
        ctx.fillRect(10, -71, 7, 10);

        ctx.fillStyle = skin;
        ctx.fillRect(-2, -62, 16, 6);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(12, -63, 4, 8);
        ctx.fillStyle = skin;
        ctx.fillRect(16, -65, 7, 10);

        if (st >= 8 && st <= 14) {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(26, -68, 8, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case FighterState.YOGA_FLAME:
        // Braced Legs with Golden Anklets
        ctx.fillStyle = skinDark;
        ctx.fillRect(-14, -38, 8, 38);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-15, -6, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(2, -38, 8, 38);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(1, -6, 10, 4);

        // Trunks & Torso
        ctx.fillStyle = trunks;
        ctx.fillRect(-14, -46, 28, 12);
        ctx.fillStyle = skin;
        ctx.fillRect(-10, -70, 24, 26);
        drawDhalsimHead(4, -76, 'flame');

        // Both Arms Thrust Outward Chanting (Full 4 Limbs!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-2, -68, 14, 6);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(10, -69, 4, 8);
        ctx.fillStyle = skinDark;
        ctx.fillRect(14, -71, 7, 10);

        ctx.fillStyle = skin;
        ctx.fillRect(2, -62, 16, 6);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(16, -63, 4, 8);
        ctx.fillStyle = skin;
        ctx.fillRect(20, -65, 7, 10);

        // Mystical Yoga Flame Stream
        ctx.save();
        const flameW = Math.min(65, st * 4);
        const grad = ctx.createRadialGradient(24, -72, 4, 24 + flameW / 2, -72, flameW);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#facc15');
        grad.addColorStop(0.7, '#ea580c');
        grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(20, -72);
        ctx.lineTo(20 + flameW, -94);
        ctx.lineTo(24 + flameW * 1.1, -72);
        ctx.lineTo(20 + flameW, -50);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        break;

      case FighterState.KNOCKDOWN:
      case FighterState.DEFEATED:
        ctx.fillStyle = trunks;
        ctx.fillRect(-22, -14, 28, 12);
        ctx.fillStyle = skin;
        ctx.fillRect(6, -12, 26, 10);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(28, -13, 4, 12); // Golden anklet
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-38, -10, 4, 8); // Golden wrist bangle
        drawDhalsimHead(-32, -10, 'hurt');
        break;

      case FighterState.VICTORY:
        // Floating mid-air in full lotus meditation posture (Padmasana)!
        const floatY = Math.sin(t * 0.12) * 6 - 20;
        ctx.save();
        ctx.translate(0, floatY);

        // Golden Dhoti Trunks
        ctx.fillStyle = trunks;
        ctx.fillRect(-18, -26, 36, 12);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(-18, -26, 36, 3);

        // Crossed Legs with Golden Anklets & Soles Facing Upward
        ctx.fillStyle = skinDark;
        ctx.fillRect(-22, -18, 22, 10);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-24, -17, 4, 8);
        ctx.fillStyle = skin;
        ctx.fillRect(0, -18, 22, 10);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(20, -17, 4, 8);

        // Slender Ascetic Torso & Skull Necklace
        ctx.fillStyle = skin;
        ctx.fillRect(-12, -50, 24, 26);
        drawDhalsimHead(0, -58, 'smile');

        // Both Arms Resting in Sacred Chin Mudra (Index & Thumb touching on knees!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18, -48, 6, 18);
        ctx.fillStyle = '#facc15'; // Bicep Band
        ctx.fillRect(-19, -44, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-22, -32, 8, 10);
        ctx.fillStyle = '#facc15'; // Wrist Bangle
        ctx.fillRect(-23, -24, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-24, -21, 8, 6); // Chin Mudra fingers

        ctx.fillStyle = skin;
        ctx.fillRect(12, -48, 6, 18);
        ctx.fillStyle = '#facc15'; // Bicep Band
        ctx.fillRect(11, -44, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(14, -32, 8, 10);
        ctx.fillStyle = '#facc15'; // Wrist Bangle
        ctx.fillRect(15, -24, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(16, -21, 8, 6); // Chin Mudra fingers

        ctx.restore();
        break;

      default:
        this.renderDhalsim(ctx, { ...fighter, state: FighterState.IDLE });
        break;
    }
  }
}
