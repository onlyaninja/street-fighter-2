/**
 * M. Bison Entity (Final Boss)
 * Dictator with Psycho Crusher and Scissor Kick.
 */

import { Fighter } from './fighter.js';
import { CharacterRenderer } from './character_renderer.js';

export class Bison extends Fighter {
  constructor(x, id, facing = 1) {
    super(x, id, 'BISON', facing);
    this.walkFwdSpeed = 3.4;
    this.walkBackSpeed = 2.6;
    this.maxHealth = 110; // Boss health
    this.health = 110;
    this.displayHealth = 110;
  }

  renderPose(ctx) {
    CharacterRenderer.render(ctx, this);
  }
}
