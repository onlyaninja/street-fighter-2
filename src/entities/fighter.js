/**
 * Base Fighter Class
 * Implements 60fps physics, state machine, frame data, hitboxes,
 * hurtboxes, pushboxes, blocking mechanics, hitstop, knockdown,
 * screen boundary clamping, and Easy vs Classic special move execution.
 */

import { sounds } from '../audio.js';

export const FighterState = {
  IDLE: 'IDLE',
  WALK_FWD: 'WALK_FWD',
  WALK_BACK: 'WALK_BACK',
  CROUCH: 'CROUCH',
  JUMP: 'JUMP',
  LIGHT_PUNCH: 'LIGHT_PUNCH',
  HEAVY_PUNCH: 'HEAVY_PUNCH',
  LIGHT_KICK: 'LIGHT_KICK',
  HEAVY_KICK: 'HEAVY_KICK',
  SWEEP: 'SWEEP',
  // Specials
  HADOUKEN: 'HADOUKEN',
  SHORYUKEN: 'SHORYUKEN',
  TATSUMAKI: 'TATSUMAKI',
  LIGHTNING_LEGS: 'LIGHTNING_LEGS', // Chun-Li
  KIKOKEN: 'KIKOKEN',               // Chun-Li
  SPINNING_BIRD: 'SPINNING_BIRD',   // Chun-Li
  SONIC_BOOM: 'SONIC_BOOM',         // Guile
  FLASH_KICK: 'FLASH_KICK',         // Guile
  PSYCHO_CRUSHER: 'PSYCHO_CRUSHER', // M. Bison
  SCISSOR_KICK: 'SCISSOR_KICK',     // M. Bison
  ELECTRIC_THUNDER: 'ELECTRIC_THUNDER', // Blanka
  ROLLING_ATTACK: 'ROLLING_ATTACK',     // Blanka
  HUNDRED_SLAP: 'HUNDRED_SLAP',         // E. Honda
  SUMO_HEADBUTT: 'SUMO_HEADBUTT',       // E. Honda
  DOUBLE_LARIAT: 'DOUBLE_LARIAT',       // Zangief
  SPINNING_PILEDRIVER: 'SPINNING_PILEDRIVER', // Zangief
  YOGA_FIRE: 'YOGA_FIRE',               // Dhalsim
  YOGA_FLAME: 'YOGA_FLAME',             // Dhalsim
  // Combat reactions
  HITSTUN: 'HITSTUN',
  BLOCKSTUN: 'BLOCKSTUN',
  KNOCKDOWN: 'KNOCKDOWN',
  WAKEUP: 'WAKEUP',
  VICTORY: 'VICTORY',
  DEFEATED: 'DEFEATED'
};

export class Fighter {
  constructor(x, id, name, facing = 1) {
    this.id = id; // 'p1' or 'p2'
    this.name = name; // 'RYU', 'KEN', 'CHUN-LI', 'GUILE', 'BISON'
    this.x = x;
    this.y = 320; // Ground Y
    this.vx = 0;
    this.vy = 0;
    this.facing = facing; // 1 = facing right, -1 = facing left

    this.maxHealth = 100;
    this.health = 100;
    this.displayHealth = 100;
    this.roundsWon = 0;

    this.state = FighterState.IDLE;
    this.animFrame = 0;
    this.stateTimer = 0;

    // Movement speeds
    this.walkFwdSpeed = 3.2;
    this.walkBackSpeed = 2.4;
    this.jumpForce = -13.5;
    this.gravity = 0.65;
    this.isGrounded = true;

    // Hitstop / freeze frames on impact
    this.hitstop = 0;

    // Collision dimensions
    this.pushWidth = 40;
    this.pushHeight = 96;

    // Combat tracking
    this.hasHitOpponent = false;
    this.hasSpawnedProjectile = false;
    this.hitStunTimer = 0;
    this.blockStunTimer = 0;
    this.isInvulnerable = false;
    this.comboCount = 0;
    this.comboResetTimer = 0;
    this.specialCooldown = 0;
    this.inputBack = false;

    // Spawned projectile callback (passed in by game loop)
    this.onSpawnProjectile = null;

    // Visual attributes
    this.giColor = '#f3f4f6';
    this.giShade = '#d1d5db';
    this.beltColor = '#1f2937';
    this.skinColor = '#f5cba7';
    this.skinShade = '#e59866';
    this.hairColor = '#4a2810';
    this.headbandColor = '#dc2626';
    this.gloveColor = '#dc2626';
  }

  // Clean round reset: wipes all states, timers, and velocities
  resetRound(x, facing) {
    this.x = x;
    this.y = 320;
    this.vx = 0;
    this.vy = 0;
    this.facing = facing;
    this.health = this.maxHealth;
    this.displayHealth = this.maxHealth;
    this.state = FighterState.IDLE;
    this.animFrame = 0;
    this.stateTimer = 0;
    this.hitstop = 0;
    this.isGrounded = true;
    this.hasHitOpponent = false;
    this.hasSpawnedProjectile = false;
    this.isInvulnerable = false;
    this.comboCount = 0;
    this.comboResetTimer = 0;
    this.specialCooldown = 0;
    this.hitStunTimer = 0;
    this.blockStunTimer = 0;
    this.inputBack = false;
  }

  // Check if currently blocking incoming attack
  isBlocking(isLowAttack) {
    const isDefending = this.state === FighterState.WALK_BACK || 
      (this.state === FighterState.CROUCH && this.inputBack);
    if (!isDefending) return false;

    if (isLowAttack) {
      return this.state === FighterState.CROUCH;
    }
    return true;
  }

  // Take damage or guard
  takeHit(damage, hitstun, blockstun, knockdown, isLow, knockbackX = 6, attacker) {
    if (this.isInvulnerable || this.state === FighterState.DEFEATED || this.state === FighterState.KNOCKDOWN) {
      return { blocked: false, hit: false };
    }

    const blocked = this.isBlocking(isLow);

    if (blocked) {
      const chipDamage = Math.max(1, Math.floor(damage * 0.15));
      this.health = Math.max(0, this.health - chipDamage);
      this.state = FighterState.BLOCKSTUN;
      this.stateTimer = 0;
      this.blockStunTimer = blockstun;
      this.hitstop = 6;
      this.vx = -this.facing * (knockbackX * 0.7);

      sounds.playHit(false, true);
      return { blocked: true, hit: true, damage: chipDamage };
    } else {
      this.health = Math.max(0, this.health - damage);
      if (attacker) {
        attacker.comboCount++;
        attacker.comboResetTimer = 50;
      }

      if (this.health <= 0) {
        this.state = FighterState.DEFEATED;
        this.stateTimer = 0;
        this.vx = -this.facing * 7;
        this.vy = -7;
        this.isGrounded = false;
        this.hitstop = 14;
        sounds.playAnnounce('ko');
        sounds.playHit(true, false);
        return { blocked: false, hit: true, damage, ko: true };
      }

      if (knockdown || this.state === FighterState.JUMP || this.state === FighterState.PSYCHO_CRUSHER || this.state === FighterState.ROLLING_ATTACK || this.state === FighterState.SUMO_HEADBUTT) {
        this.state = FighterState.KNOCKDOWN;
        this.stateTimer = 0;
        this.vx = -this.facing * (knockbackX + 2);
        this.vy = -6.5;
        this.isGrounded = false;
        this.hitstop = 10;
        sounds.playHit(true, false);
        return { blocked: false, hit: true, damage, knockdown: true };
      } else {
        this.state = FighterState.HITSTUN;
        this.stateTimer = 0;
        this.hitStunTimer = hitstun;
        this.vx = -this.facing * knockbackX;
        this.hitstop = damage > 12 ? 10 : 6;
        sounds.playHit(damage > 12, false);
        return { blocked: false, hit: true, damage };
      }
    }
  }

  // Update loop called every frame
  update(input, opponent, screenBounds, particleSystem) {
    // Smooth trailing health animation
    if (this.displayHealth > this.health) {
      this.displayHealth = Math.max(this.health, this.displayHealth - 0.5);
    }

    // Combo timer
    if (this.comboResetTimer > 0) {
      this.comboResetTimer--;
      if (this.comboResetTimer === 0) {
        this.comboCount = 0;
      }
    }

    // Special moves cooldown timer
    if (this.specialCooldown > 0) {
      this.specialCooldown--;
    }

    // Handle hitstop freeze
    if (this.hitstop > 0) {
      this.hitstop--;
      return;
    }

    this.stateTimer++;
    this.animFrame++;

    this.updateFacing(opponent);
    this.updatePhysics(screenBounds, particleSystem);
    this.updateStateMachine(input, opponent, particleSystem);
  }

  updateFacing(opponent) {
    const lockStates = [
      FighterState.ATTACK, FighterState.HADOUKEN, FighterState.SHORYUKEN,
      FighterState.TATSUMAKI, FighterState.LIGHTNING_LEGS, FighterState.KIKOKEN,
      FighterState.SPINNING_BIRD, FighterState.SONIC_BOOM, FighterState.FLASH_KICK,
      FighterState.PSYCHO_CRUSHER, FighterState.SCISSOR_KICK,
      FighterState.SUMO_HEADBUTT, FighterState.HUNDRED_SLAP, FighterState.ROLLING_ATTACK,
      FighterState.DOUBLE_LARIAT, FighterState.SPINNING_PILEDRIVER, FighterState.YOGA_FLAME,
      FighterState.KNOCKDOWN, FighterState.WAKEUP, FighterState.DEFEATED
    ];

    if (this.isGrounded && !lockStates.includes(this.state)) {
      this.facing = this.x < opponent.x ? 1 : -1;
    }
  }

  updatePhysics(screenBounds, particleSystem) {
    this.x += this.vx;

    // Ground drag
    if (this.isGrounded) {
      this.vx *= 0.82;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }

    // Gravity
    if (!this.isGrounded) {
      this.vy += this.gravity;
      this.y += this.vy;

      // Landing check
      if (this.y >= 320) {
        this.y = 320;
        this.vy = 0;
        this.isGrounded = true;
        particleSystem.createDust(this.x, this.y, 4);

        if ([FighterState.JUMP, FighterState.SHORYUKEN, FighterState.TATSUMAKI,
             FighterState.SPINNING_BIRD, FighterState.FLASH_KICK].includes(this.state)) {
          this.state = FighterState.IDLE;
          this.stateTimer = 0;
        } else if (this.state === FighterState.KNOCKDOWN) {
          sounds.playKnockdown();
          particleSystem.createDust(this.x, this.y, 8);
        }
      }
    }

    // Strict Screen Clamping: Neither fighter can walk or be thrown off the visible screen!
    const halfPush = this.pushWidth / 2;
    if (this.x - halfPush < screenBounds.minX) {
      this.x = screenBounds.minX + halfPush;
      this.vx = 0;
    } else if (this.x + halfPush > screenBounds.maxX) {
      this.x = screenBounds.maxX - halfPush;
      this.vx = 0;
    }
  }

  updateStateMachine(input, opponent, particleSystem) {
    const rawLeft = input.isDown(this.id, 'left');
    const rawRight = input.isDown(this.id, 'right');
    const rawUp = input.isDown(this.id, 'up');
    const rawDown = input.isDown(this.id, 'down');

    const fwd = this.facing === 1 ? rawRight : rawLeft;
    const back = this.facing === 1 ? rawLeft : rawRight;
    this.inputBack = back;

    switch (this.state) {
      case FighterState.IDLE:
      case FighterState.WALK_FWD:
      case FighterState.WALK_BACK:
      case FighterState.CROUCH:
        this.handleNeutralInputs(input, fwd, back, rawUp, rawDown, particleSystem);
        break;

      case FighterState.JUMP:
        this.handleAirborneAttacks(input, rawUp);
        break;

      case FighterState.LIGHT_PUNCH:
        // Preserves the flight mechanic (when holding Up and pressing LP/LK)
        if (this.stateTimer > 14) {
          this.state = FighterState.IDLE;
        }
        break;

      case FighterState.HEAVY_PUNCH:
        if (this.stateTimer > 24) {
          this.state = FighterState.IDLE;
        }
        break;

      case FighterState.LIGHT_KICK:
        // Preserves the flight mechanic (when holding Up and pressing LP/LK)
        if (this.stateTimer > 14) {
          this.state = FighterState.IDLE;
        }
        break;

      case FighterState.HEAVY_KICK:
      case FighterState.SWEEP:
        if (this.stateTimer > 28) {
          this.state = FighterState.IDLE;
        }
        break;

      // Special Moves
      case FighterState.HADOUKEN:
      case FighterState.KIKOKEN:
      case FighterState.SONIC_BOOM:
        if (this.stateTimer === 10 && !this.hasSpawnedProjectile) {
          this.hasSpawnedProjectile = true;
          sounds.playHadouken();
          if (this.onSpawnProjectile) {
            this.onSpawnProjectile(this.x + this.facing * 35, this.y - 48, this.facing, this.id, this.name.toLowerCase());
          }
        }
        if (this.stateTimer > 30) {
          this.state = FighterState.IDLE;
        }
        break;

      case FighterState.SHORYUKEN:
      case FighterState.FLASH_KICK:
        this.isInvulnerable = this.stateTimer < 12;
        if (this.name === 'KEN') {
          particleSystem.createFlames(this.x + this.facing * 10, this.y - 50, 2);
        }
        if (this.stateTimer > 36 && this.isGrounded) {
          this.state = FighterState.IDLE;
          this.isInvulnerable = false;
        }
        break;

      case FighterState.TATSUMAKI:
      case FighterState.SPINNING_BIRD:
        this.x += this.facing * 3.0;
        if (this.stateTimer > 38 && this.isGrounded) {
          this.state = FighterState.IDLE;
        }
        break;

      case FighterState.LIGHTNING_LEGS:
        // Rapid kick flurry
        if (this.stateTimer % 4 === 0) {
          sounds.playSwing(false);
          this.hasHitOpponent = false; // Reset to allow multiple hits!
        }
        if (this.stateTimer > 36) {
          this.state = FighterState.IDLE;
        }
        break;

      case FighterState.PSYCHO_CRUSHER:
        // Torpedo charge across the screen (0-28 active flight, 29-44 landing recovery deceleration)
        this.isInvulnerable = false;
        if (this.stateTimer < 29) {
          this.x += this.facing * 7.2;
          particleSystem.createFlames(this.x - this.facing * 16, this.y - 40, 3);
        } else {
          // Landing recovery deceleration - vulnerable to counter-attacks & punishes
          this.x += this.facing * 1.5;
          this.hasHitOpponent = true; // Active hit window has expired
        }
        if (this.stateTimer > 44) {
          this.state = FighterState.IDLE;
        }
        break;

      case FighterState.SCISSOR_KICK:
        this.x += this.facing * 4.5;
        if (this.stateTimer > 28) {
          this.state = FighterState.IDLE;
        }
        break;

      case FighterState.ELECTRIC_THUNDER:
        if (this.stateTimer % 4 === 0) {
          sounds.playElectricity();
          this.hasHitOpponent = false;
          if (particleSystem.createElectricitySparks) {
            particleSystem.createElectricitySparks(this.x, this.y - 45, 4);
          }
        }
        if (this.stateTimer > 38) {
          this.state = FighterState.IDLE;
        }
        break;

      case FighterState.ROLLING_ATTACK:
        this.x += this.facing * 7.5;
        particleSystem.createDust(this.x, this.y, 1);
        if (this.hasHitOpponent) {
          this.state = FighterState.IDLE;
          this.vx = -this.facing * 3.5;
          this.vy = -5.0;
          this.isGrounded = false;
        } else if (this.stateTimer > 32) {
          this.state = FighterState.IDLE;
        }
        break;

      case FighterState.HUNDRED_SLAP:
        if (this.stateTimer % 4 === 0) {
          sounds.playSlapFlurry();
          this.hasHitOpponent = false;
        }
        if (this.stateTimer > 36) {
          this.state = FighterState.IDLE;
        }
        break;

      case FighterState.SUMO_HEADBUTT:
        // Super Sumo Headbutt across the screen (0-26 active flight, 27-42 landing recovery deceleration)
        this.isInvulnerable = false;
        if (this.stateTimer < 27) {
          this.x += this.facing * 6.8;
          particleSystem.createDust(this.x, this.y, 1);
        } else {
          // Landing recovery deceleration - vulnerable to retaliations & punishes
          this.x += this.facing * 1.2;
          this.hasHitOpponent = true; // Active hit window has expired
        }
        if (this.stateTimer > 42) {
          this.state = FighterState.IDLE;
        }
        break;

      case FighterState.DOUBLE_LARIAT:
        const moveDir = fwd ? this.facing : (back ? -this.facing : 0);
        this.x += moveDir * 1.5;
        this.isInvulnerable = this.stateTimer < 16;
        if (this.stateTimer % 6 === 0) {
          sounds.playLariat();
          this.hasHitOpponent = false;
        }
        if (this.stateTimer > 40) {
          this.state = FighterState.IDLE;
          this.isInvulnerable = false;
        }
        break;

      case FighterState.SPINNING_PILEDRIVER:
        if (this.stateTimer === 1) {
          const dist = Math.abs(this.x - opponent.x);
          if (dist < 65 && opponent.isGrounded && opponent.state !== FighterState.KNOCKDOWN && opponent.state !== FighterState.WAKEUP) {
            this.grabbedOpponent = opponent;
            opponent.state = FighterState.HITSTUN;
            this.vy = -13.0;
            this.isGrounded = false;
          } else {
            this.grabbedOpponent = null;
          }
        }
        if (this.grabbedOpponent) {
          this.grabbedOpponent.x = this.x;
          this.grabbedOpponent.y = this.y - 25;
          this.grabbedOpponent.vx = 0;
          this.grabbedOpponent.vy = 0;
          if (this.stateTimer > 15 && this.isGrounded) {
            sounds.playPiledriver();
            this.grabbedOpponent.takeHit(28, 40, 0, true, false, 8, this);
            particleSystem.createHitSpark(this.x, this.y - 20, true);
            particleSystem.createDust(this.x, this.y, 10);
            this.grabbedOpponent = null;
            this.state = FighterState.IDLE;
          }
        } else {
          if (this.stateTimer > 20) {
            this.state = FighterState.IDLE;
          }
        }
        break;

      case FighterState.YOGA_FIRE:
        if (this.stateTimer === 10 && !this.hasSpawnedProjectile) {
          this.hasSpawnedProjectile = true;
          sounds.playYogaFire();
          if (this.onSpawnProjectile) {
            this.onSpawnProjectile(this.x + this.facing * 35, this.y - 48, this.facing, this.id, 'yoga_fire');
          }
        }
        if (this.stateTimer > 30) {
          this.state = FighterState.IDLE;
        }
        break;

      case FighterState.YOGA_FLAME:
        particleSystem.createFlames(this.x + this.facing * 38, this.y - 48, 3);
        if (this.stateTimer % 5 === 0) {
          this.hasHitOpponent = false;
        }
        if (this.stateTimer > 35) {
          this.state = FighterState.IDLE;
        }
        break;

      case FighterState.HITSTUN:
        if (this.stateTimer > this.hitStunTimer) {
          this.state = FighterState.IDLE;
        }
        break;

      case FighterState.BLOCKSTUN:
        if (this.stateTimer > this.blockStunTimer) {
          this.state = FighterState.IDLE;
        }
        break;

      case FighterState.KNOCKDOWN:
        this.isInvulnerable = true;
        if (this.isGrounded && this.stateTimer > 35) {
          this.state = FighterState.WAKEUP;
          this.stateTimer = 0;
        }
        break;

      case FighterState.WAKEUP:
        this.isInvulnerable = true;
        if (this.stateTimer > 18) {
          this.isInvulnerable = false;
          this.state = FighterState.IDLE;
        }
        break;
    }
  }

  handleNeutralInputs(input, fwd, back, rawUp, rawDown, particleSystem) {
    const mode = input.getSpecialMode(this.id); // 'easy' or 'classic'
    const charName = this.name;

    // 1. Check Special Moves based on character and specialMode
    let specialTriggered = false;

    if (charName === 'RYU' || charName === 'KEN') {
      // Shoryuken
      const shoryu = (mode === 'easy' && input.isPressed(this.id, 'shoryuken')) ||
        ((input.isPressed(this.id, 'lp') || input.isPressed(this.id, 'hp')) && input.checkMotion(this.id, 'dp'));
      if (shoryu) {
        this.state = FighterState.SHORYUKEN;
        this.stateTimer = 0;
        this.hasHitOpponent = false;
        this.vy = -14.5;
        this.vx = this.facing * 3.8;
        this.isGrounded = false;
        sounds.playShoryuken();
        return;
      }

      // Hadouken
      const hadouken = (mode === 'easy' && input.isPressed(this.id, 'hadouken')) ||
        ((input.isPressed(this.id, 'lp') || input.isPressed(this.id, 'hp')) && input.checkMotion(this.id, 'qcf'));
      if (hadouken) {
        this.state = FighterState.HADOUKEN;
        this.stateTimer = 0;
        this.hasSpawnedProjectile = false;
        this.vx = 0;
        return;
      }

      // Tatsumaki
      const tatsu = (mode === 'easy' && input.isPressed(this.id, 'tatsumaki')) ||
        ((input.isPressed(this.id, 'lk') || input.isPressed(this.id, 'hk')) && input.checkMotion(this.id, 'qcb'));
      if (tatsu) {
        this.state = FighterState.TATSUMAKI;
        this.stateTimer = 0;
        this.hasHitOpponent = false;
        this.vy = -5.0;
        this.vx = this.facing * 3.2;
        this.isGrounded = false;
        sounds.playTatsumaki();
        return;
      }
    } else if (charName === 'CHUN-LI') {
      // Lightning Legs (Hyakuretsu Kyaku)
      const legs = (mode === 'easy' && input.isPressed(this.id, 'hadouken')) || input.checkRapidKicks(this.id);
      if (legs) {
        this.state = FighterState.LIGHTNING_LEGS;
        this.stateTimer = 0;
        this.hasHitOpponent = false;
        sounds.playSwing(true);
        return;
      }

      // Kikoken (Fireball)
      const kiko = (mode === 'easy' && input.isPressed(this.id, 'shoryuken')) ||
        ((input.isPressed(this.id, 'lp') || input.isPressed(this.id, 'hp')) && input.checkMotion(this.id, 'qcf'));
      if (kiko) {
        this.state = FighterState.KIKOKEN;
        this.stateTimer = 0;
        this.hasSpawnedProjectile = false;
        this.vx = 0;
        return;
      }

      // Spinning Bird Kick
      const bird = (mode === 'easy' && input.isPressed(this.id, 'tatsumaki')) ||
        ((input.isPressed(this.id, 'lk') || input.isPressed(this.id, 'hk')) && input.checkMotion(this.id, 'qcb'));
      if (bird) {
        this.state = FighterState.SPINNING_BIRD;
        this.stateTimer = 0;
        this.hasHitOpponent = false;
        this.vy = -5.5;
        this.vx = this.facing * 3.6;
        this.isGrounded = false;
        sounds.playTatsumaki();
        return;
      }
    } else if (charName === 'GUILE') {
      // Sonic Boom
      const sonic = (mode === 'easy' && input.isPressed(this.id, 'hadouken')) ||
        ((input.isPressed(this.id, 'lp') || input.isPressed(this.id, 'hp')) && (input.checkChargeBackForward(this.id) || input.checkMotion(this.id, 'qcf')));
      if (sonic) {
        this.state = FighterState.SONIC_BOOM;
        this.stateTimer = 0;
        this.hasSpawnedProjectile = false;
        this.vx = 0;
        return;
      }

      // Flash Kick (Somersault Kick)
      const flash = (mode === 'easy' && input.isPressed(this.id, 'shoryuken')) ||
        ((input.isPressed(this.id, 'lk') || input.isPressed(this.id, 'hk')) && (input.checkChargeDownUp(this.id) || input.checkMotion(this.id, 'dp')));
      if (flash) {
        this.state = FighterState.FLASH_KICK;
        this.stateTimer = 0;
        this.hasHitOpponent = false;
        this.vy = -14.0;
        this.vx = this.facing * 2.8;
        this.isGrounded = false;
        sounds.playShoryuken();
        return;
      }
    } else if (charName === 'BISON') {
      // Psycho Crusher (requires cooldown to prevent rapid spamming)
      const psycho = (mode === 'easy' && this.specialCooldown <= 0 && input.isPressed(this.id, 'hadouken')) ||
        (this.specialCooldown <= 0 && (input.isPressed(this.id, 'lp') || input.isPressed(this.id, 'hp')) && (input.checkChargeBackForward(this.id) || input.checkMotion(this.id, 'qcf')));
      if (psycho) {
        this.state = FighterState.PSYCHO_CRUSHER;
        this.stateTimer = 0;
        this.hasHitOpponent = false;
        this.specialCooldown = 120; // 2.0s cooldown gap
        sounds.playShoryuken();
        return;
      }

      // Scissor Kick (Double Knee Press)
      const scissor = (mode === 'easy' && input.isPressed(this.id, 'shoryuken')) ||
        ((input.isPressed(this.id, 'lk') || input.isPressed(this.id, 'hk')) && (input.checkChargeBackForward(this.id) || input.checkMotion(this.id, 'qcb')));
      if (scissor) {
        this.state = FighterState.SCISSOR_KICK;
        this.stateTimer = 0;
        this.hasHitOpponent = false;
        this.vy = -4.5;
        this.isGrounded = false;
        sounds.playSwing(true);
        return;
      }
    } else if (charName === 'BLANKA') {
      // Electric Thunder
      const thunder = (mode === 'easy' && input.isPressed(this.id, 'hadouken')) || input.checkRapidPunches(this.id);
      if (thunder) {
        this.state = FighterState.ELECTRIC_THUNDER;
        this.stateTimer = 0;
        this.hasHitOpponent = false;
        sounds.playElectricity();
        return;
      }

      // Rolling Attack (Beast Cannonball)
      const roll = (mode === 'easy' && input.isPressed(this.id, 'shoryuken')) ||
        ((input.isPressed(this.id, 'lp') || input.isPressed(this.id, 'hp')) && (input.checkChargeBackForward(this.id) || input.checkMotion(this.id, 'qcf')));
      if (roll) {
        this.state = FighterState.ROLLING_ATTACK;
        this.stateTimer = 0;
        this.hasHitOpponent = false;
        this.vy = -2.0;
        this.isGrounded = false;
        sounds.playRolling();
        return;
      }
    } else if (charName === 'E. HONDA' || charName === 'E.HONDA' || charName === 'EHONDA') {
      // Hundred Hand Slap
      const slap = (mode === 'easy' && input.isPressed(this.id, 'hadouken')) || input.checkRapidPunches(this.id);
      if (slap) {
        this.state = FighterState.HUNDRED_SLAP;
        this.stateTimer = 0;
        this.hasHitOpponent = false;
        sounds.playSlapFlurry();
        return;
      }

      // Sumo Headbutt (requires cooldown to prevent rapid spamming)
      const headbutt = (mode === 'easy' && this.specialCooldown <= 0 && input.isPressed(this.id, 'shoryuken')) ||
        (this.specialCooldown <= 0 && (input.isPressed(this.id, 'lp') || input.isPressed(this.id, 'hp')) && (input.checkChargeBackForward(this.id) || input.checkMotion(this.id, 'qcf')));
      if (headbutt) {
        this.state = FighterState.SUMO_HEADBUTT;
        this.stateTimer = 0;
        this.hasHitOpponent = false;
        this.specialCooldown = 90; // 1.5s cooldown gap
        this.vy = -1.0;
        this.isGrounded = false;
        sounds.playHeadbutt();
        return;
      }
    } else if (charName === 'ZANGIEF') {
      // Double Lariat
      const lariat = (mode === 'easy' && input.isPressed(this.id, 'hadouken')) ||
        ((input.isPressed(this.id, 'lp') || input.isPressed(this.id, 'hp')) && input.checkMotion(this.id, 'qcf'));
      if (lariat) {
        this.state = FighterState.DOUBLE_LARIAT;
        this.stateTimer = 0;
        this.hasHitOpponent = false;
        sounds.playLariat();
        return;
      }

      // Spinning Piledriver
      const spd = (mode === 'easy' && input.isPressed(this.id, 'shoryuken')) ||
        ((input.isPressed(this.id, 'lp') || input.isPressed(this.id, 'hp')) && (input.checkMotion(this.id, 'dp') || input.checkMotion(this.id, 'qcf')));
      if (spd) {
        this.state = FighterState.SPINNING_PILEDRIVER;
        this.stateTimer = 0;
        this.hasHitOpponent = false;
        sounds.playSwing(true);
        return;
      }
    } else if (charName === 'DHALSIM') {
      // Yoga Fire
      const yFire = (mode === 'easy' && input.isPressed(this.id, 'hadouken')) ||
        ((input.isPressed(this.id, 'lp') || input.isPressed(this.id, 'hp')) && input.checkMotion(this.id, 'qcf'));
      if (yFire) {
        this.state = FighterState.YOGA_FIRE;
        this.stateTimer = 0;
        this.hasSpawnedProjectile = false;
        this.vx = 0;
        return;
      }

      // Yoga Flame
      const yFlame = (mode === 'easy' && input.isPressed(this.id, 'shoryuken')) ||
        ((input.isPressed(this.id, 'lp') || input.isPressed(this.id, 'hp')) && input.checkMotion(this.id, 'qcb'));
      if (yFlame) {
        this.state = FighterState.YOGA_FLAME;
        this.stateTimer = 0;
        this.hasHitOpponent = false;
        this.vx = 0;
        sounds.playYogaFlame();
        return;
      }
    }

    // 2. Normal Attacks
    if (input.isPressed(this.id, 'lp')) {
      input.consumePress(this.id, 'lp');
      this.state = FighterState.LIGHT_PUNCH;
      this.stateTimer = 0;
      this.hasHitOpponent = false;
      sounds.playSwing(false);
      return;
    }

    if (input.isPressed(this.id, 'hp')) {
      input.consumePress(this.id, 'hp');
      this.state = FighterState.HEAVY_PUNCH;
      this.stateTimer = 0;
      this.hasHitOpponent = false;
      sounds.playSwing(true);
      return;
    }

    if (input.isPressed(this.id, 'lk')) {
      input.consumePress(this.id, 'lk');
      this.state = FighterState.LIGHT_KICK;
      this.stateTimer = 0;
      this.hasHitOpponent = false;
      sounds.playSwing(false);
      return;
    }

    if (input.isPressed(this.id, 'hk')) {
      input.consumePress(this.id, 'hk');
      this.state = rawDown ? FighterState.SWEEP : FighterState.HEAVY_KICK;
      this.stateTimer = 0;
      this.hasHitOpponent = false;
      sounds.playSwing(true);
      return;
    }

    // 3. Jumping
    if (rawUp) {
      this.state = FighterState.JUMP;
      this.stateTimer = 0;
      this.vy = this.jumpForce;
      this.isGrounded = false;
      this.vx = fwd ? this.facing * this.walkFwdSpeed : (back ? -this.facing * this.walkBackSpeed : 0);
      sounds.playJump();
      particleSystem.createDust(this.x, this.y, 4);
      return;
    }

    // 4. Crouching & Walking
    if (rawDown) {
      this.state = FighterState.CROUCH;
      this.vx = 0;
    } else if (fwd) {
      this.state = FighterState.WALK_FWD;
      this.vx = this.facing * this.walkFwdSpeed;
    } else if (back) {
      this.state = FighterState.WALK_BACK;
      this.vx = -this.facing * this.walkBackSpeed;
    } else {
      this.state = FighterState.IDLE;
      this.vx = 0;
    }
  }

  handleAirborneAttacks(input, rawUp) {
    // Flying mechanic explicitly preserved as requested by user!
    if (rawUp) {
      if (input.isPressed(this.id, 'lp') || input.isPressed(this.id, 'lk')) {
        this.vy = this.jumpForce * 0.9; // Extra upward lift boost when tapping light attack while holding Up!
      }
    }

    if (input.isPressed(this.id, 'lp') || input.isPressed(this.id, 'hp')) {
      this.state = input.isPressed(this.id, 'hp') ? FighterState.HEAVY_PUNCH : FighterState.LIGHT_PUNCH;
      this.stateTimer = 0;
      this.hasHitOpponent = false;
      sounds.playSwing(this.state === FighterState.HEAVY_PUNCH);
    } else if (input.isPressed(this.id, 'lk') || input.isPressed(this.id, 'hk')) {
      this.state = input.isPressed(this.id, 'hk') ? FighterState.HEAVY_KICK : FighterState.LIGHT_KICK;
      this.stateTimer = 0;
      this.hasHitOpponent = false;
      sounds.playSwing(this.state === FighterState.HEAVY_KICK);
    }
  }

  // --- HITBOX & HURTBOX CALCULATION ---
  getPushbox() {
    return {
      x: this.x - this.pushWidth / 2,
      y: this.y - this.pushHeight,
      width: this.pushWidth,
      height: this.pushHeight
    };
  }

  getHurtboxes() {
    const isCrouched = this.state === FighterState.CROUCH || this.state === FighterState.SWEEP;
    const isJumping = !this.isGrounded;

    if (this.state === FighterState.KNOCKDOWN || this.state === FighterState.WAKEUP) {
      return [{
        x: this.x - 30,
        y: this.y - 20,
        width: 60,
        height: 20
      }];
    }

    if (this.state === FighterState.PSYCHO_CRUSHER) {
      if (this.stateTimer < 29) {
        return [{
          x: this.x - 30,
          y: this.y - 62,
          width: 60,
          height: 36
        }];
      } else {
        return [{
          x: this.x - 22,
          y: this.y - 78,
          width: 44,
          height: 78
        }];
      }
    }

    if (this.state === FighterState.SUMO_HEADBUTT) {
      if (this.stateTimer < 27) {
        return [{
          x: this.x - 30,
          y: this.y - 64,
          width: 60,
          height: 40
        }];
      } else {
        return [{
          x: this.x - 24,
          y: this.y - 78,
          width: 48,
          height: 78
        }];
      }
    }

    const boxes = [];
    if (isCrouched) {
      boxes.push({
        x: this.x - 24,
        y: this.y - 60,
        width: 48,
        height: 60
      });
    } else if (isJumping) {
      boxes.push({
        x: this.x - 22,
        y: this.y - 75,
        width: 44,
        height: 70
      });
    } else {
      boxes.push({
        x: this.x - 22,
        y: this.y - 94,
        width: 44,
        height: 94
      });
    }

    return boxes;
  }

  getHitbox() {
    if (this.hasHitOpponent) return null;
    const dir = this.facing;

    switch (this.state) {
      case FighterState.LIGHT_PUNCH:
        if (this.stateTimer >= 3 && this.stateTimer <= 7) {
          const isDhalsim = this.name === 'DHALSIM';
          const reach = isDhalsim ? 56 : 32;
          return {
            x: this.x + (dir === 1 ? 15 : -15 - reach),
            y: this.y - 75,
            width: reach,
            height: 18,
            damage: 6,
            hitstun: 12,
            blockstun: 8,
            knockdown: false,
            isLow: false,
            knockbackX: 4
          };
        }
        break;

      case FighterState.HEAVY_PUNCH:
        if (this.stateTimer >= 6 && this.stateTimer <= 13) {
          const isDhalsim = this.name === 'DHALSIM';
          const reach = isDhalsim ? 85 : 40;
          return {
            x: this.x + (dir === 1 ? 18 : -18 - reach),
            y: this.y - 74,
            width: reach,
            height: 22,
            damage: 15,
            hitstun: 22,
            blockstun: 14,
            knockdown: false,
            isLow: false,
            knockbackX: 7
          };
        }
        break;

      case FighterState.LIGHT_KICK:
        if (this.stateTimer >= 3 && this.stateTimer <= 8) {
          const isDhalsim = this.name === 'DHALSIM';
          const reach = isDhalsim ? 58 : 34;
          return {
            x: this.x + (dir === 1 ? 16 : -16 - reach),
            y: this.y - 45,
            width: reach,
            height: 20,
            damage: 7,
            hitstun: 13,
            blockstun: 8,
            knockdown: false,
            isLow: false,
            knockbackX: 4
          };
        }
        break;

      case FighterState.HEAVY_KICK:
        if (this.stateTimer >= 6 && this.stateTimer <= 14) {
          const isDhalsim = this.name === 'DHALSIM';
          const reach = isDhalsim ? 92 : 44;
          return {
            x: this.x + (dir === 1 ? 20 : -20 - reach),
            y: this.y - 82,
            width: reach,
            height: 28,
            damage: 16,
            hitstun: 24,
            blockstun: 15,
            knockdown: false,
            isLow: false,
            knockbackX: 8
          };
        }
        break;

      case FighterState.SWEEP:
        if (this.stateTimer >= 6 && this.stateTimer <= 16) {
          return {
            x: this.x + (dir === 1 ? 15 : -65),
            y: this.y - 22,
            width: 52,
            height: 22,
            damage: 14,
            hitstun: 24,
            blockstun: 14,
            knockdown: true,
            isLow: true,
            knockbackX: 6
          };
        }
        break;

      case FighterState.SHORYUKEN:
      case FighterState.FLASH_KICK:
        if (this.stateTimer >= 2 && this.stateTimer <= 18) {
          return {
            x: this.x + (dir === 1 ? 8 : -38),
            y: this.y - 96,
            width: 36,
            height: 70,
            damage: this.name === 'KEN' || this.name === 'GUILE' ? 22 : 20,
            hitstun: 30,
            blockstun: 16,
            knockdown: true,
            isLow: false,
            knockbackX: 8
          };
        }
        break;

      case FighterState.TATSUMAKI:
      case FighterState.SPINNING_BIRD:
        if (this.stateTimer >= 4 && this.stateTimer <= 30) {
          return {
            x: this.x - 32,
            y: this.y - 72,
            width: 64,
            height: 36,
            damage: 6,
            hitstun: 15,
            blockstun: 10,
            knockdown: this.stateTimer > 24,
            isLow: false,
            knockbackX: 5
          };
        }
        break;

      case FighterState.LIGHTNING_LEGS:
        if (this.stateTimer % 4 < 2) {
          return {
            x: this.x + (dir === 1 ? 16 : -56),
            y: this.y - 70,
            width: 42,
            height: 36,
            damage: 5,
            hitstun: 12,
            blockstun: 8,
            knockdown: this.stateTimer > 30,
            isLow: false,
            knockbackX: 3
          };
        }
        break;

      case FighterState.PSYCHO_CRUSHER:
        if (this.stateTimer >= 4 && this.stateTimer <= 28) {
          return {
            x: this.x + (dir === 1 ? -12 : -48),
            y: this.y - 62,
            width: 60,
            height: 36,
            damage: 18,
            hitstun: 30,
            blockstun: 16,
            knockdown: true,
            isLow: false,
            knockbackX: 8
          };
        }
        break;

      case FighterState.SCISSOR_KICK:
        if (this.stateTimer >= 6 && this.stateTimer <= 22) {
          return {
            x: this.x + (dir === 1 ? 12 : -52),
            y: this.y - 65,
            width: 46,
            height: 32,
            damage: 16,
            hitstun: 20,
            blockstun: 12,
            knockdown: true,
            isLow: false,
            knockbackX: 6
          };
        }
        break;

      case FighterState.ELECTRIC_THUNDER:
        if (this.stateTimer % 4 < 2) {
          return {
            x: this.x - 34,
            y: this.y - 72,
            width: 68,
            height: 68,
            damage: 6,
            hitstun: 14,
            blockstun: 9,
            knockdown: this.stateTimer > 28,
            isLow: false,
            knockbackX: 5
          };
        }
        break;

      case FighterState.ROLLING_ATTACK:
        if (this.stateTimer >= 3 && this.stateTimer <= 30) {
          return {
            x: this.x - 22,
            y: this.y - 52,
            width: 44,
            height: 44,
            damage: 18,
            hitstun: 26,
            blockstun: 14,
            knockdown: true,
            isLow: false,
            knockbackX: 8
          };
        }
        break;

      case FighterState.HUNDRED_SLAP:
        if (this.stateTimer % 4 < 2) {
          return {
            x: this.x + (dir === 1 ? 16 : -64),
            y: this.y - 75,
            width: 48,
            height: 38,
            damage: 6,
            hitstun: 14,
            blockstun: 10,
            knockdown: this.stateTimer > 28,
            isLow: false,
            knockbackX: 4
          };
        }
        break;

      case FighterState.SUMO_HEADBUTT:
        if (this.stateTimer >= 3 && this.stateTimer <= 26) {
          return {
            x: this.x + (dir === 1 ? 16 : -66),
            y: this.y - 68,
            width: 50,
            height: 36,
            damage: 18,
            hitstun: 24,
            blockstun: 14,
            knockdown: true,
            isLow: false,
            knockbackX: 8
          };
        }
        break;

      case FighterState.DOUBLE_LARIAT:
        if (this.stateTimer >= 4 && this.stateTimer <= 36) {
          return {
            x: this.x - 42,
            y: this.y - 80,
            width: 84,
            height: 36,
            damage: 10,
            hitstun: 20,
            blockstun: 12,
            knockdown: this.stateTimer > 24,
            isLow: false,
            knockbackX: 6
          };
        }
        break;

      case FighterState.YOGA_FLAME:
        if (this.stateTimer >= 6 && this.stateTimer <= 32) {
          return {
            x: this.x + (dir === 1 ? 10 : -78),
            y: this.y - 75,
            width: 68,
            height: 50,
            damage: 12,
            hitstun: 24,
            blockstun: 15,
            knockdown: true,
            isLow: false,
            knockbackX: 7
          };
        }
        break;
    }

    return null;
  }

  // --- RENDERING ---
  render(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.facing === -1) {
      ctx.scale(-1, 1);
    }

    // Shadow on the ground
    const shadowScale = Math.max(0.4, 1 - (320 - this.y) / 250);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.beginPath();
    ctx.ellipse(0, 320 - this.y, 28 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    this.renderPose(ctx);

    ctx.restore();
  }

  renderPose(ctx) {
    // Overridden by fighter subclasses
  }
}
