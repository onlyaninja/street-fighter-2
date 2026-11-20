/**
 * E. Honda Entity
 * Sumo wrestling grand champion of Japan.
 * Features Hundred Hand Slap (Hyakuretsu Harite) and Super Sumo Headbutt.
 */

import { Fighter } from './fighter.js';
import { CharacterRenderer } from './character_renderer.js';

export class EHonDa extends Fighter {
  constructor(x, id, facing = 1) {
    super(x, id, 'E. HONDA', facing);

    this.walkFwdSpeed = 2.9;
    this.walkBackSpeed = 2.2;
    this.pushWidth = 48;
    this.pushHeight = 98;
    this.maxHealth = 105;
    this.health = 105;
    this.displayHealth = 105;

    this.skinColor = '#fcd34d';
    this.skinShade = '#f59e0b';
    this.hairColor = '#18181b';
    this.facePaint = '#dc2626';
    this.mawashiColor = '#1e40af';
    this.mawashiStripe = '#ffffff';
  }

  renderPose(ctx) {
    CharacterRenderer.render(ctx, this);
  }
}
