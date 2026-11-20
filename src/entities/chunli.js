/**
 * Chun-Li Entity
 * Fast acrobatic combatant with Lightning Legs, Kikoken, and Spinning Bird Kick.
 */

import { Fighter } from './fighter.js';
import { CharacterRenderer } from './character_renderer.js';

export class ChunLi extends Fighter {
  constructor(x, id, facing = 1) {
    super(x, id, 'CHUN-LI', facing);
    this.walkFwdSpeed = 3.6; // Fastest ground speed
    this.walkBackSpeed = 2.8;
  }

  renderPose(ctx) {
    CharacterRenderer.render(ctx, this);
  }
}
