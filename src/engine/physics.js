/**
 * 2D Fighting Game Physics & Collision Resolver
 * Manages pushbox mutual exclusion, corner pushing, hitbox-to-hurtbox detection,
 * and projectile clashing.
 */

export class PhysicsEngine {
  static checkAABB(rectA, rectB) {
    return (
      rectA.x < rectB.x + rectB.width &&
      rectA.x + rectA.width > rectB.x &&
      rectA.y < rectB.y + rectB.height &&
      rectA.y + rectA.height > rectB.y
    );
  }

  // Resolve pushbox body overlap between both fighters
  static resolvePushboxes(p1, p2, stageBounds) {
    const box1 = p1.getPushbox();
    const box2 = p2.getPushbox();

    if (this.checkAABB(box1, box2)) {
      // Overlap detected
      const overlapX = (box1.x < box2.x) 
        ? (box1.x + box1.width) - box2.x 
        : (box2.x + box2.width) - box1.x;

      if (overlapX > 0) {
        const halfOverlap = overlapX / 2;
        const leftPlayer = p1.x < p2.x ? p1 : p2;
        const rightPlayer = p1.x < p2.x ? p2 : p1;

        // Check corner pushback
        const leftAtWall = leftPlayer.x - leftPlayer.pushWidth / 2 <= stageBounds.minX;
        const rightAtWall = rightPlayer.x + rightPlayer.pushWidth / 2 >= stageBounds.maxX;

        if (leftAtWall && !rightAtWall) {
          // Left pinned to wall, push right player out
          rightPlayer.x += overlapX;
        } else if (rightAtWall && !leftAtWall) {
          // Right pinned to wall, push left player out
          leftPlayer.x -= overlapX;
        } else {
          // Push both equally
          leftPlayer.x -= halfOverlap;
          rightPlayer.x += halfOverlap;
        }
      }
    }
  }

  // Check fighter attacks against opponent
  static checkCombatHit(attacker, defender, particleSystem, onScreenShake) {
    const hitbox = attacker.getHitbox();
    if (!hitbox) return;

    const hurtboxes = defender.getHurtboxes();
    for (const hurt of hurtboxes) {
      if (this.checkAABB(hitbox, hurt)) {
        // Hit connected!
        attacker.hasHitOpponent = true;
        const impactX = (hitbox.x + hitbox.width / 2 + hurt.x + hurt.width / 2) / 2;
        const impactY = (hitbox.y + hitbox.height / 2 + hurt.y + hurt.height / 2) / 2;

        const result = defender.takeHit(
          hitbox.damage,
          hitbox.hitstun,
          hitbox.blockstun,
          hitbox.knockdown,
          hitbox.isLow,
          hitbox.knockbackX,
          attacker
        );

        if (result.hit) {
          // Match attacker's hitstop to defender's hitstop
          attacker.hitstop = defender.hitstop;

          if (result.blocked) {
            particleSystem.createBlockSpark(impactX, impactY);
            if (onScreenShake) onScreenShake(2, 4);
          } else {
            particleSystem.createHitSpark(impactX, impactY, hitbox.damage > 12);
            if (onScreenShake) onScreenShake(hitbox.damage > 12 ? 6 : 3, hitbox.damage > 12 ? 8 : 4);
          }
        }
        break; // Single hit per frame
      }
    }
  }

  // Check projectile clashes and impacts
  static updateProjectiles(projectiles, p1, p2, stageBounds, particleSystem, onScreenShake) {
    // 1. Check fireball clashes between opposing projectiles
    for (let i = 0; i < projectiles.length; i++) {
      for (let j = i + 1; j < projectiles.length; j++) {
        const a = projectiles[i];
        const b = projectiles[j];
        if (a.active && b.active && a.owner !== b.owner) {
          if (this.checkAABB(a.getHitbox(), b.getHitbox())) {
            // Both fireballs cancel each other out!
            a.active = false;
            b.active = false;
            const clashX = (a.x + b.x) / 2;
            const clashY = (a.y + b.y) / 2;
            particleSystem.createHitSpark(clashX, clashY, true);
            if (onScreenShake) onScreenShake(4, 6);
          }
        }
      }
    }

    // 2. Update projectile movement and check impacts on fighters
    for (let i = projectiles.length - 1; i >= 0; i--) {
      const proj = projectiles[i];
      proj.update(stageBounds, particleSystem);

      if (!proj.active) {
        projectiles.splice(i, 1);
        continue;
      }

      const target = proj.owner === 'p1' ? p2 : p1;
      const attacker = proj.owner === 'p1' ? p1 : p2;
      const pHitbox = proj.getHitbox();
      const hurtboxes = target.getHurtboxes();

      for (const hurt of hurtboxes) {
        if (this.checkAABB(pHitbox, hurt)) {
          proj.active = false;
          const result = target.takeHit(
            proj.damage,
            proj.hitstun,
            proj.blockstun,
            false, // Fireball is mid
            false,
            proj.knockbackX,
            attacker
          );

          if (result.hit) {
            if (result.blocked) {
              particleSystem.createBlockSpark(proj.x, proj.y);
              if (onScreenShake) onScreenShake(3, 4);
            } else {
              particleSystem.createHitSpark(proj.x, proj.y, true);
              if (onScreenShake) onScreenShake(5, 6);
            }
          }

          projectiles.splice(i, 1);
          break;
        }
      }
    }
  }
}
