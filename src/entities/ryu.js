/**
 * Ryu Entity
 * White Gi, Red Headband, Master of Shotokan Karate.
 */

import { Fighter } from './fighter.js';
import { CharacterRenderer } from './character_renderer.js';

export class Ryu extends Fighter {
  constructor(x, id, facing = 1) {
    super(x, id, 'RYU', facing);

    this.giColor = '#f8fafc';
    this.giShade = '#cbd5e1';
    this.beltColor = '#0f172a';
    this.skinColor = '#fcd34d';
    this.skinShade = '#f59e0b';
    this.hairColor = '#3e2723';
    this.headbandColor = '#ef4444';
    this.gloveColor = '#dc2626';
  }

  renderPose(ctx) {
    CharacterRenderer.render(ctx, this);
  }
}
