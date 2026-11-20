/**
 * Dhalsim Entity
 * Mystical ascetic yogi from India.
 * Features Yoga Fire, Yoga Flame, and telescoping stretchy limbs.
 */

import { Fighter } from './fighter.js';
import { CharacterRenderer } from './character_renderer.js';

export class Dhalsim extends Fighter {
  constructor(x, id, facing = 1) {
    super(x, id, 'DHALSIM', facing);

    this.walkFwdSpeed = 2.5;
    this.walkBackSpeed = 2.0;
    this.gravity = 0.52;
    this.jumpForce = -11.5;
    this.pushWidth = 36;
    this.pushHeight = 92;

    this.skinColor = '#d97706';
    this.skinShade = '#b45309';
    this.trunksColor = '#eab308';
    this.headbandColor = '#dc2626';
    this.necklaceColor = '#f8fafc';
  }

  renderPose(ctx) {
    CharacterRenderer.render(ctx, this);
  }
}
