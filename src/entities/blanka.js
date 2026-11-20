/**
 * Blanka Entity
 * Wild beast of the Brazilian rainforest.
 * Features Electric Thunder and Rolling Attack (Beast Cannonball).
 */

import { Fighter } from './fighter.js';
import { CharacterRenderer } from './character_renderer.js';

export class Blanka extends Fighter {
  constructor(x, id, facing = 1) {
    super(x, id, 'BLANKA', facing);

    this.walkFwdSpeed = 3.3;
    this.walkBackSpeed = 2.5;
    this.pushWidth = 42;
    this.pushHeight = 92;

    this.skinColor = '#22c55e';
    this.skinShade = '#15803d';
    this.hairColor = '#ea580c';
    this.pantsColor = '#1d4ed8';
    this.cuffColor = '#ca8a04';
  }

  renderPose(ctx) {
    CharacterRenderer.render(ctx, this);
  }
}
