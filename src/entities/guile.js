/**
 * Guile Entity
 * Military zoning master with Sonic Boom and Flash Kick.
 */

import { Fighter } from './fighter.js';
import { CharacterRenderer } from './character_renderer.js';

export class Guile extends Fighter {
  constructor(x, id, facing = 1) {
    super(x, id, 'GUILE', facing);
    this.walkFwdSpeed = 3.0;
    this.walkBackSpeed = 2.4;
  }

  renderPose(ctx) {
    CharacterRenderer.render(ctx, this);
  }
}
