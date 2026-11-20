/**
 * Zangief Entity
 * The Red Cyclone of Russia.
 * Features Double Lariat and the devastating Spinning Piledriver (SPD).
 */

import { Fighter } from './fighter.js';
import { CharacterRenderer } from './character_renderer.js';

export class Zangief extends Fighter {
  constructor(x, id, facing = 1) {
    super(x, id, 'ZANGIEF', facing);

    this.walkFwdSpeed = 2.7;
    this.walkBackSpeed = 2.1;
    this.pushWidth = 48;
    this.pushHeight = 100;
    this.maxHealth = 110;
    this.health = 110;
    this.displayHealth = 110;

    this.skinColor = '#fcd34d';
    this.skinShade = '#f59e0b';
    this.hairColor = '#451a03';
    this.trunksColor = '#dc2626';
    this.beltColor = '#ca8a04';
    this.bootsColor = '#991b1b';
  }

  renderPose(ctx) {
    CharacterRenderer.render(ctx, this);
  }
}
