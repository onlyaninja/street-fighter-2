/**
 * Ken Masters Entity
 * Crimson Red Gi, Blonde Hair, Fiery Shotokan Specialist.
 */

import { Fighter } from './fighter.js';
import { CharacterRenderer } from './character_renderer.js';

export class Ken extends Fighter {
  constructor(x, id, facing = -1) {
    super(x, id, 'KEN', facing);

    this.giColor = '#dc2626';
    this.giShade = '#991b1b';
    this.beltColor = '#0f172a';
    this.skinColor = '#fcd34d';
    this.skinShade = '#f59e0b';
    this.hairColor = '#facc15';
    this.headbandColor = null; // No headband
    this.gloveColor = '#78350f';
  }

  renderPose(ctx) {
    CharacterRenderer.render(ctx, this);
  }
}
