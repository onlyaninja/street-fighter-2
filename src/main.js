/**
 * Street Fighter II - Main Entry & Game Coordinator
 * Features:
 * - 2-Player Versus, Tournament Ladder Mode, and CPU Practice
 * - Full 5-Character Roster (Ryu, Ken, Chun-Li, Guile, M. Bison)
 * - Interactive Character Select Screen
 * - Slow-Motion K.O. Finish with natural move completion before victory pose
 * - Viewport Screen Clamping (fighters never go off-screen)
 * - P1 & P2 Independent Easy (1-Key) vs Classic Arcade (Motion) Special Move Toggles
 * - Clean Round-to-Round State Resets (no move carry-over)
 */

import { sounds } from './audio.js';
import { InputManager } from './input.js';
import { Ryu } from './entities/ryu.js';
import { Ken } from './entities/ken.js';
import { ChunLi } from './entities/chunli.js';
import { Guile } from './entities/guile.js';
import { Bison } from './entities/bison.js';
import { Blanka } from './entities/blanka.js';
import { EHonDa } from './entities/ehonda.js';
import { Zangief } from './entities/zangief.js';
import { Dhalsim } from './entities/dhalsim.js';
import { FighterState } from './entities/fighter.js';
import { Projectile } from './entities/projectile.js';
import { ParticleSystem } from './entities/particle.js';
import { PhysicsEngine } from './engine/physics.js';
import { Camera } from './engine/camera.js';
import { SuzakuStage } from './stages/suzaku.js';
import { HUD } from './ui/hud.js';

export const GameMode = {
  VERSUS_2P: 'VERSUS_2P',
  TOURNAMENT: 'TOURNAMENT',
  CPU_PRACTICE: 'CPU_PRACTICE'
};

export const MatchState = {
  CHAR_SELECT: 'CHAR_SELECT',
  ROUND_INTRO: 'ROUND_INTRO',
  FIGHTING: 'FIGHTING',
  SLOW_MO_KO: 'SLOW_MO_KO',
  ROUND_OUTRO: 'ROUND_OUTRO',
  STAGE_CLEAR: 'STAGE_CLEAR',
  TOURNAMENT_WIN: 'TOURNAMENT_WIN',
  GAME_OVER: 'GAME_OVER',
  PAUSED: 'PAUSED'
};

export const ROSTER = [
  { id: 'ryu', name: 'RYU', country: 'JAPAN', style: 'SHOTOKAN', color: '#38bdf8' },
  { id: 'ehonda', name: 'E. HONDA', country: 'JAPAN', style: 'SUMO', color: '#3b82f6' },
  { id: 'blanka', name: 'BLANKA', country: 'BRAZIL', style: 'BEAST', color: '#22c55e' },
  { id: 'guile', name: 'GUILE', country: 'USA', style: 'MILITARY', color: '#84cc16' },
  { id: 'ken', name: 'KEN', country: 'USA', style: 'FIRE KARATE', color: '#ef4444' },
  { id: 'chun-li', name: 'CHUN-LI', country: 'CHINA', style: 'KUNG FU', color: '#06b6d4' },
  { id: 'zangief', name: 'ZANGIEF', country: 'USSR', style: 'WRESTLING', color: '#b91c1c' },
  { id: 'dhalsim', name: 'DHALSIM', country: 'INDIA', style: 'YOGA', color: '#f59e0b' },
  { id: 'bison', name: 'M. BISON', country: 'SHADALOO', style: 'PSYCHO POWER', color: '#7f1d1d' }
];

export function createFighter(name, x, id, facing) {
  const norm = (name || '').toUpperCase().trim();
  switch (norm) {
    case 'RYU': return new Ryu(x, id, facing);
    case 'KEN': return new Ken(x, id, facing);
    case 'CHUN-LI': return new ChunLi(x, id, facing);
    case 'GUILE': return new Guile(x, id, facing);
    case 'BLANKA': return new Blanka(x, id, facing);
    case 'E. HONDA':
    case 'E.HONDA':
    case 'EHONDA': return new EHonDa(x, id, facing);
    case 'ZANGIEF': return new Zangief(x, id, facing);
    case 'DHALSIM': return new Dhalsim(x, id, facing);
    case 'BISON':
    case 'M. BISON':
    case 'M.BISON': return new Bison(x, id, facing);
    default: return new Ryu(x, id, facing);
  }
}

class Game {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;

    this.width = 640;
    this.height = 360;
    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.input = new InputManager();
    this.particleSystem = new ParticleSystem();
    this.stage = new SuzakuStage(this.width, this.height);
    this.camera = new Camera(this.width, this.height);
    this.hud = new HUD(this.width, this.height);

    this.mode = GameMode.VERSUS_2P;
    this.state = MatchState.FIGHTING;
    this.stateTimer = 0;
    this.roundNum = 1;

    // Tournament ladder setup (Escalating gauntlet through all World Warriors ending with M. Bison)
    this.tournamentStage = 1;
    this.tournamentLadder = ['E. HONDA', 'BLANKA', 'GUILE', 'CHUN-LI', 'ZANGIEF', 'DHALSIM', 'KEN', 'M. BISON'];

    // Character Selection
    this.p1CharIdx = 0; // Ryu
    this.p2CharIdx = 1; // Ken
    this.p1Confirmed = false;
    this.p2Confirmed = false;
    this.charSelectCooldown = 0;
    this.enterReleased = true;
    this.matchStartCountdown = -1;

    // Fighters
    this.p1 = createFighter(ROSTER[this.p1CharIdx].name, 220, 'p1', 1);
    this.p2 = createFighter(ROSTER[this.p2CharIdx].name, 420, 'p2', -1);
    this.setupFighterProjectiles();

    // Slow-Mo K.O. tracking
    this.slowMoTick = 0;
    this.roundWinner = null;
    this.roundLoser = null;

    // CPU AI behavior state
    this.cpuTimer = 0;
    this.cpuAction = 'none';
    this.cpuSpecialCooldown = 60;

    // FPS loop accumulator
    this.lastTime = 0;
    this.accumTime = 0;
    this.fixedStep = 1000 / 60;

    this.setupUI();
    this.startRound();
    this.startLoop();
  }

  setupFighterProjectiles() {
    this.projectiles = [];
    this.p1.onSpawnProjectile = (x, y, dir, id, charName) => {
      this.projectiles.push(new Projectile(x, y, dir, id, charName));
    };
    this.p2.onSpawnProjectile = (x, y, dir, id, charName) => {
      this.projectiles.push(new Projectile(x, y, dir, id, charName));
    };
  }

  setupUI() {
    const btn2P = document.getElementById('btn-mode-2p');
    const btnTourney = document.getElementById('btn-mode-tourney');
    const btnCPU = document.getElementById('btn-mode-cpu');
    const btnSound = document.getElementById('btn-toggle-sound');
    const btnBGM = document.getElementById('btn-toggle-bgm');
    const btnCRT = document.getElementById('btn-toggle-crt');
    const btnControls = document.getElementById('btn-controls-modal');
    const modal = document.getElementById('controls-modal');
    const modalClose = document.getElementById('modal-close');
    const btnP1Mode = document.getElementById('btn-p1-mode');
    const btnP2Mode = document.getElementById('btn-p2-mode');

    // Unlock Web Audio on first gesture
    const unlockAudio = () => {
      sounds.init();
      sounds.resume();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
    window.addEventListener('pointerdown', unlockAudio, { passive: true });
    window.addEventListener('keydown', unlockAudio, { passive: true });

    const updateModeButtons = (activeBtn) => {
      [btn2P, btnTourney, btnCPU].forEach(b => { if (b) b.classList.remove('active'); });
      if (activeBtn) activeBtn.classList.add('active');
    };

    if (btn2P) {
      btn2P.addEventListener('click', () => {
        sounds.init();
        updateModeButtons(btn2P);
        this.openCharSelect(GameMode.VERSUS_2P);
      });
    }

    if (btnTourney) {
      btnTourney.addEventListener('click', () => {
        sounds.init();
        updateModeButtons(btnTourney);
        this.openCharSelect(GameMode.TOURNAMENT);
      });
    }

    if (btnCPU) {
      btnCPU.addEventListener('click', () => {
        sounds.init();
        updateModeButtons(btnCPU);
        this.openCharSelect(GameMode.CPU_PRACTICE);
      });
    }

    // Special Mode Toggles
    const updateSpecialBadges = () => {
      if (btnP1Mode) {
        const m = this.input.getSpecialMode('p1');
        btnP1Mode.textContent = m === 'easy' ? 'P1: 🟢 EASY (1-Key)' : 'P1: 🟡 CLASSIC (Motion)';
        btnP1Mode.className = `arcade-btn ${m === 'easy' ? 'mode-easy' : 'mode-classic'}`;
      }
      if (btnP2Mode) {
        const m = this.input.getSpecialMode('p2');
        btnP2Mode.textContent = m === 'easy' ? 'P2: 🟢 EASY (1-Key)' : 'P2: 🟡 CLASSIC (Motion)';
        btnP2Mode.className = `arcade-btn ${m === 'easy' ? 'mode-easy' : 'mode-classic'}`;
      }
      this.updateDockSpecialLabels();
    };

    if (btnP1Mode) {
      btnP1Mode.addEventListener('click', () => {
        this.input.toggleSpecialMode('p1');
        updateSpecialBadges();
      });
    }

    if (btnP2Mode) {
      btnP2Mode.addEventListener('click', () => {
        this.input.toggleSpecialMode('p2');
        updateSpecialBadges();
      });
    }

    window.addEventListener('specialModeChanged', () => {
      updateSpecialBadges();
    });

    if (btnSound) {
      btnSound.addEventListener('click', () => {
        const on = sounds.toggleSFX();
        btnSound.textContent = on ? '🔊 SFX: ON' : '🔇 SFX: OFF';
      });
    }

    if (btnBGM) {
      btnBGM.addEventListener('click', () => {
        const on = sounds.toggleBGM();
        btnBGM.textContent = on ? '🎵 BGM: ON' : '🔇 BGM: OFF';
      });
    }

    if (btnCRT) {
      btnCRT.addEventListener('click', () => {
        const screen = document.getElementById('game-screen');
        screen.classList.toggle('crt-effect');
        btnCRT.classList.toggle('active');
      });
    }

    if (btnControls && modal && modalClose) {
      btnControls.addEventListener('click', () => modal.classList.toggle('hidden'));
      modalClose.addEventListener('click', () => modal.classList.add('hidden'));
    }

    // Auto-blur all arcade buttons and return focus to window so keys aren't captured
    document.querySelectorAll('.arcade-btn').forEach(btn => {
      btn.addEventListener('focus', () => btn.blur());
      btn.addEventListener('click', () => {
        btn.blur();
        window.focus();
      });
    });

    const screenElem = document.getElementById('game-screen');
    if (screenElem) {
      screenElem.addEventListener('pointerdown', () => window.focus());
      screenElem.addEventListener('click', () => window.focus());
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Enter' || e.code === 'Space') {
        if (this.state === MatchState.GAME_OVER || this.state === MatchState.TOURNAMENT_WIN) {
          if (this.stateTimer >= 20) {
            sounds.init();
            this.openCharSelect(this.mode);
          }
        }
      } else if (e.code === 'KeyM') {
        const on = sounds.toggleBGM();
        if (btnBGM) btnBGM.textContent = on ? '🎵 BGM: ON' : '🔇 BGM: OFF';
      } else if (e.code === 'Escape') {
        if (this.state === MatchState.FIGHTING) {
          this.state = MatchState.PAUSED;
        } else if (this.state === MatchState.PAUSED) {
          this.state = MatchState.FIGHTING;
        }
      }
    });

    updateSpecialBadges();
  }

  updateDockSpecialLabels() {
    const p1Label = document.getElementById('p1-dock-special-label');
    const p2Label = document.getElementById('p2-dock-special-label');
    const p1Mode = this.input.getSpecialMode('p1');
    const p2Mode = this.input.getSpecialMode('p2');

    const p1Char = (this.p1 && this.p1.name) || (ROSTER[this.p1CharIdx] && ROSTER[this.p1CharIdx].name) || 'RYU';
    const p2Char = (this.p2 && this.p2.name) || (ROSTER[this.p2CharIdx] && ROSTER[this.p2CharIdx].name) || 'KEN';

    if (p1Label) {
      if (p1Mode === 'easy') {
        p1Label.innerHTML = '<kbd class="btn-special">T</kbd> Special 1 &nbsp; <kbd class="btn-special">Y</kbd> Special 2 &nbsp; <kbd class="btn-special">H</kbd> Special 3 (or <kbd>U</kbd>)';
      } else {
        let moves = '';
        if (p1Char === 'GUILE') {
          moves = '<kbd>A</kbd> (Hold 0.5s) → <kbd>D</kbd> + <kbd>F</kbd> (Boom) &nbsp; <kbd>S</kbd> (Hold 0.5s) → <kbd>W</kbd> + <kbd>V</kbd> (Flash Kick)';
        } else if (p1Char === 'CHUN-LI') {
          moves = '<kbd>V</kbd> (Rapid Tap) &nbsp; <kbd>S</kbd>, <kbd>D</kbd> + <kbd>F</kbd> (Kiko) &nbsp; <kbd>S</kbd>, <kbd>A</kbd> + <kbd>V</kbd> (Bird)';
        } else if (p1Char === 'BLANKA') {
          moves = '<kbd>F</kbd> (Rapid Tap Thunder) &nbsp; <kbd>A</kbd> (Hold 0.5s) → <kbd>D</kbd> + <kbd>F</kbd> (Ball)';
        } else if (p1Char === 'E. HONDA' || p1Char === 'E.HONDA' || p1Char === 'EHONDA') {
          moves = '<kbd>F</kbd> (Rapid Tap Slaps) &nbsp; <kbd>A</kbd> (Hold 0.5s) → <kbd>D</kbd> + <kbd>F</kbd> (Headbutt)';
        } else if (p1Char === 'ZANGIEF') {
          moves = '<kbd>S</kbd>, <kbd>D</kbd> + <kbd>F</kbd> (Lariat) &nbsp; Close: <kbd>D</kbd>, <kbd>S</kbd>, <kbd>D</kbd> + <kbd>F</kbd> (Piledriver)';
        } else if (p1Char === 'DHALSIM') {
          moves = '<kbd>S</kbd>, <kbd>D</kbd> + <kbd>F</kbd> (Yoga Fire) &nbsp; <kbd>S</kbd>, <kbd>A</kbd> + <kbd>F</kbd> (Yoga Flame)';
        } else if (p1Char === 'BISON' || p1Char === 'M. BISON' || p1Char === 'M.BISON') {
          moves = '<kbd>A</kbd> (Hold 0.5s) → <kbd>D</kbd> + <kbd>F</kbd> (Psycho) &nbsp; <kbd>A</kbd> (Hold 0.5s) → <kbd>D</kbd> + <kbd>V</kbd> (Scissor)';
        } else {
          moves = '<kbd>S</kbd>, <kbd>D</kbd> + <kbd>F</kbd> (Fireball) &nbsp; <kbd>D</kbd>, <kbd>S</kbd>, <kbd>D</kbd> + <kbd>F</kbd> (Dragon) &nbsp; <kbd>S</kbd>, <kbd>A</kbd> + <kbd>V</kbd> (Kick)';
        }
        p1Label.innerHTML = `<em>P1 Classic Keys:</em> ${moves} <small>(1-Key Disabled)</small>`;
      }
    }

    if (p2Label) {
      if (p2Mode === 'easy') {
        p2Label.innerHTML = '<kbd class="btn-special">Num 6</kbd> Special 1 &nbsp; <kbd class="btn-special">Num 3</kbd> Special 2 &nbsp; <kbd class="btn-special">Num 0</kbd> Special 3';
      } else {
        let moves = '';
        if (p2Char === 'GUILE') {
          moves = '<kbd>→</kbd> (Hold 0.5s) → <kbd>←</kbd> + <kbd>Num 4</kbd> (Boom) &nbsp; <kbd>↓</kbd> (Hold 0.5s) → <kbd>↑</kbd> + <kbd>Num 1</kbd> (Flash Kick)';
        } else if (p2Char === 'CHUN-LI') {
          moves = '<kbd>Num 1</kbd> (Rapid Tap) &nbsp; <kbd>↓</kbd>, <kbd>←</kbd> + <kbd>Num 4</kbd> (Kiko) &nbsp; <kbd>↓</kbd>, <kbd>→</kbd> + <kbd>Num 1</kbd> (Bird)';
        } else if (p2Char === 'BLANKA') {
          moves = '<kbd>Num 4</kbd> (Rapid Tap Thunder) &nbsp; <kbd>→</kbd> (Hold 0.5s) → <kbd>←</kbd> + <kbd>Num 4</kbd> (Ball)';
        } else if (p2Char === 'E. HONDA' || p2Char === 'E.HONDA' || p2Char === 'EHONDA') {
          moves = '<kbd>Num 4</kbd> (Rapid Tap Slaps) &nbsp; <kbd>→</kbd> (Hold 0.5s) → <kbd>←</kbd> + <kbd>Num 4</kbd> (Headbutt)';
        } else if (p2Char === 'ZANGIEF') {
          moves = '<kbd>↓</kbd>, <kbd>←</kbd> + <kbd>Num 4</kbd> (Lariat) &nbsp; Close: <kbd>←</kbd>, <kbd>↓</kbd>, <kbd>←</kbd> + <kbd>Num 4</kbd> (Piledriver)';
        } else if (p2Char === 'DHALSIM') {
          moves = '<kbd>↓</kbd>, <kbd>←</kbd> + <kbd>Num 4</kbd> (Yoga Fire) &nbsp; <kbd>↓</kbd>, <kbd>→</kbd> + <kbd>Num 4</kbd> (Yoga Flame)';
        } else if (p2Char === 'BISON' || p2Char === 'M. BISON' || p2Char === 'M.BISON') {
          moves = '<kbd>→</kbd> (Hold 0.5s) → <kbd>←</kbd> + <kbd>Num 4</kbd> (Psycho) &nbsp; <kbd>→</kbd> (Hold 0.5s) → <kbd>←</kbd> + <kbd>Num 1</kbd> (Scissor)';
        } else {
          moves = '<kbd>↓</kbd>, <kbd>←</kbd> + <kbd>Num 4</kbd> (Fireball) &nbsp; <kbd>←</kbd>, <kbd>↓</kbd>, <kbd>←</kbd> + <kbd>Num 4</kbd> (Dragon) &nbsp; <kbd>↓</kbd>, <kbd>→</kbd> + <kbd>Num 1</kbd> (Kick)';
        }
        p2Label.innerHTML = `<em>P2 Classic Keys:</em> ${moves} <small>(1-Key Disabled)</small>`;
      }
    }
  }

  openCharSelect(mode) {
    this.mode = mode;
    this.state = MatchState.CHAR_SELECT;
    this.stateTimer = 0;
    this.charSelectCooldown = 18; // 18 frames (~300ms) buffer to prevent transition keys from confirming
    this.enterReleased = false;   // Enter must be released and pressed anew before it can confirm P1
    this.p1Confirmed = false;
    this.p2Confirmed = (mode !== GameMode.VERSUS_2P);
    this.matchStartCountdown = -1;
    this.tournamentStage = 1;
    this.input.reset();           // Complete input reset: clears keysDown & keysPressedThisFrame!
    this.updateDockSpecialLabels();
    sounds.stopBGM();
  }

  startMatch() {
    this.roundNum = 1;
    this.p1 = createFighter(ROSTER[this.p1CharIdx].name, 220, 'p1', 1);

    if (this.mode === GameMode.TOURNAMENT) {
      let oppName = this.tournamentLadder[this.tournamentStage - 1] || 'M. BISON';
      if (oppName === ROSTER[this.p1CharIdx].name) {
        oppName = ROSTER[this.p1CharIdx].name === 'RYU' ? 'KEN' : 'RYU';
      }
      this.p2 = createFighter(oppName, 420, 'p2', -1);
    } else {
      this.p2 = createFighter(ROSTER[this.p2CharIdx].name, 420, 'p2', -1);
    }

    this.setupFighterProjectiles();
    this.p1.roundsWon = 0;
    this.p2.roundsWon = 0;
    this.updateDockSpecialLabels();
    this.startRound();
  }

  startRound() {
    this.state = MatchState.ROUND_INTRO;
    this.stateTimer = 0;
    this.projectiles = [];
    this.camera.x = 0;

    // Comprehensive round wipe: No attacks or inputs can carry over!
    this.input.reset();
    this.p1.resetRound(220, 1);
    this.p2.resetRound(420, -1);
    this.cpuTimer = 0;
    this.cpuAction = 'none';
    this.cpuSpecialCooldown = 60;
    this.hud.resetTimer();
    this.updateDockSpecialLabels();

    const roundType = this.roundNum === 1 ? 'round1' : (this.roundNum === 2 ? 'round2' : 'roundFinal');
    const roundTitle = this.roundNum <= 2 ? `ROUND ${this.roundNum}` : 'FINAL ROUND';

    sounds.playAnnounce(roundType);
    this.hud.showBanner(roundTitle, '', 80);
    sounds.startBGM();
  }

  // --- CHARACTER SELECT LOGIC ---
  updateCharSelect() {
    if (this.charSelectCooldown > 0) {
      this.charSelectCooldown--;
    }

    if (!this.input.isDownCode('Enter')) {
      this.enterReleased = true;
    }

    // P1 Selection (A/D to move left/right, W/S to move up/down rows, F/G or Enter to confirm)
    if (!this.p1Confirmed) {
      if (this.input.isPressed('p1', 'left')) {
        this.p1CharIdx = (this.p1CharIdx - 1 + ROSTER.length) % ROSTER.length;
        sounds.playSwing(false);
        this.updateDockSpecialLabels();
      } else if (this.input.isPressed('p1', 'right')) {
        this.p1CharIdx = (this.p1CharIdx + 1) % ROSTER.length;
        sounds.playSwing(false);
        this.updateDockSpecialLabels();
      } else if (this.input.isPressed('p1', 'down')) {
        if (this.p1CharIdx < 5) {
          this.p1CharIdx = Math.min(ROSTER.length - 1, this.p1CharIdx + 5);
          sounds.playSwing(false);
          this.updateDockSpecialLabels();
        }
      } else if (this.input.isPressed('p1', 'up')) {
        if (this.p1CharIdx >= 5) {
          this.p1CharIdx = this.p1CharIdx - 5;
          sounds.playSwing(false);
          this.updateDockSpecialLabels();
        }
      }

      // Confirmation only after cooldown, and Enter requires prior release
      if (this.charSelectCooldown === 0) {
        const enterPressed = this.enterReleased && this.input.isPressedCode('Enter');
        if (this.input.isPressed('p1', 'lp') || this.input.isPressed('p1', 'hp') || enterPressed) {
          this.p1Confirmed = true;
          this.input.consumePress('p1', 'lp');
          this.input.consumePress('p1', 'hp');
          this.input.keysPressedThisFrame.delete('Enter');
          sounds.playHit(true, false);
        }
      }
    } else {
      // P1 Cancel / Unconfirm
      if (
        this.input.isPressed('p1', 'lk') || 
        this.input.isPressed('p1', 'hk') || 
        this.input.isPressedCode('Backspace') ||
        this.input.isPressedCode('Escape')
      ) {
        this.p1Confirmed = false;
        this.matchStartCountdown = -1;
        sounds.playSwing(false);
      }
    }

    // P2 Selection (Arrows to move, Num4/5 or I/O to confirm) - only in 2P Versus
    if (this.mode === GameMode.VERSUS_2P) {
      if (!this.p2Confirmed) {
        if (this.input.isPressed('p2', 'left')) {
          this.p2CharIdx = (this.p2CharIdx - 1 + ROSTER.length) % ROSTER.length;
          sounds.playSwing(false);
          this.updateDockSpecialLabels();
        } else if (this.input.isPressed('p2', 'right')) {
          this.p2CharIdx = (this.p2CharIdx + 1) % ROSTER.length;
          sounds.playSwing(false);
          this.updateDockSpecialLabels();
        } else if (this.input.isPressed('p2', 'down')) {
          if (this.p2CharIdx < 5) {
            this.p2CharIdx = Math.min(ROSTER.length - 1, this.p2CharIdx + 5);
            sounds.playSwing(false);
            this.updateDockSpecialLabels();
          }
        } else if (this.input.isPressed('p2', 'up')) {
          if (this.p2CharIdx >= 5) {
            this.p2CharIdx = this.p2CharIdx - 5;
            sounds.playSwing(false);
            this.updateDockSpecialLabels();
          }
        }

        // P2 Confirmation (only after cooldown)
        if (this.charSelectCooldown === 0) {
          if (this.input.isPressed('p2', 'lp') || this.input.isPressed('p2', 'hp')) {
            this.p2Confirmed = true;
            this.input.consumePress('p2', 'lp');
            this.input.consumePress('p2', 'hp');
            sounds.playHit(true, false);
          }
        }
      } else {
        // P2 Cancel / Unconfirm (in 2P mode)
        if (
          this.input.isPressed('p2', 'lk') || 
          this.input.isPressed('p2', 'hk') || 
          this.input.isPressedCode('Delete') ||
          this.input.isPressedCode('NumpadDecimal')
        ) {
          this.p2Confirmed = false;
          this.matchStartCountdown = -1;
          sounds.playSwing(false);
        }
      }
    } else {
      this.p2Confirmed = true;
    }

    // Both players confirmed -> start fight with smooth countdown
    const bothReady = this.p1Confirmed && (this.mode !== GameMode.VERSUS_2P || this.p2Confirmed);
    if (bothReady) {
      if (this.matchStartCountdown === -1) {
        this.matchStartCountdown = 30; // 0.5s pause to show selection
      } else if (this.matchStartCountdown > 0) {
        this.matchStartCountdown--;
        if (this.matchStartCountdown === 0) {
          this.startMatch();
        }
      }
    } else {
      this.matchStartCountdown = -1;
    }
  }

  // --- ESCALATING AI (TOURNAMENT & PRACTICE) ---
  updateCPUInput() {
    if (this.mode === GameMode.VERSUS_2P) return;

    this.cpuTimer++;
    const dist = Math.abs(this.p1.x - this.p2.x);
    const p1Attacking = ['LIGHT_PUNCH', 'HEAVY_PUNCH', 'LIGHT_KICK', 'HEAVY_KICK', 'SWEEP', 'SHORYUKEN', 'FLASH_KICK', 'PSYCHO_CRUSHER', 'SUMO_HEADBUTT', 'ROLLING_ATTACK'].includes(this.p1.state);
    const p1InAir = !this.p1.isGrounded;

    // AI Difficulty based on mode and tournament stage
    // Stage 1 (Ken): 35% reaction | Stage 2 (Chun-Li): 55% | Stage 3 (Guile): 75% | Stage 4 (Bison): 90%
    const aiLevel = this.mode === GameMode.TOURNAMENT ? this.tournamentStage : 2;
    const blockChance = 0.25 + aiLevel * 0.18;
    const antiAirChance = 0.3 + aiLevel * 0.18;

    const clearCpu = () => {
      this.input.keysDown.delete('ArrowLeft');
      this.input.keysDown.delete('ArrowRight');
      this.input.keysDown.delete('ArrowDown');
      this.input.keysDown.delete('ArrowUp');
      this.input.keysPressedThisFrame.delete('Numpad4');
      this.input.keysPressedThisFrame.delete('Numpad5');
      this.input.keysPressedThisFrame.delete('Numpad1');
      this.input.keysPressedThisFrame.delete('Numpad2');
      this.input.keysPressedThisFrame.delete('Numpad6');
      this.input.keysPressedThisFrame.delete('Numpad3');
      this.input.keysPressedThisFrame.delete('Numpad0');
    };
    clearCpu();

    if (this.cpuSpecialCooldown > 0) {
      this.cpuSpecialCooldown--;
    }

    // 1. Anti-Air Counter when P1 jumps in
    if (p1InAir && dist < 130 && Math.random() < antiAirChance && this.cpuSpecialCooldown <= 0) {
      this.input.keysPressedThisFrame.add('Numpad3'); // Shoryuken / Flash Kick / Scissor Kick / Sumo Headbutt
      const isHondaAntiAir = this.p2 && this.p2.character && (this.p2.character.name === 'E. HONDA' || this.p2.character.name === 'E.HONDA' || this.p2.character.name === 'EHONDA');
      this.cpuSpecialCooldown = isHondaAntiAir ? 120 : 60;
      return;
    }

    // 2. Reactive Guard when P1 attacks
    if (p1Attacking && dist < 105 && Math.random() < blockChance) {
      if (this.p1.state === 'SWEEP') {
        this.input.keysDown.add('ArrowDown');
        this.input.keysDown.add('ArrowRight');
      } else {
        this.input.keysDown.add('ArrowRight');
      }
      return;
    }

    // 3. Spacing Decision every 20-30 frames
    const decisionRate = Math.max(14, 30 - aiLevel * 4);
    if (this.cpuTimer % decisionRate === 0) {
      const roll = Math.random();
      if (dist > 180) {
        const isHonda = this.p2 && this.p2.character && (this.p2.character.name === 'E. HONDA' || this.p2.character.name === 'E.HONDA' || this.p2.character.name === 'EHONDA');
        if (roll < 0.35 && this.cpuSpecialCooldown <= 0) this.cpuAction = isHonda ? 'special2' : 'special1'; // Fireball / Sonic Boom / Psycho Crusher / Sumo Headbutt
        else if (roll < 0.8) this.cpuAction = 'advance';
        else this.cpuAction = 'jump_in';
      } else if (dist < 85) {
        if (roll < 0.3) this.cpuAction = 'sweep';
        else if (roll < 0.6) this.cpuAction = 'heavy_punch';
        else if (roll < 0.85 && this.cpuSpecialCooldown <= 0) this.cpuAction = 'special2'; // Shoryuken / Flash Kick / Scissor Kick / Sumo Headbutt
        else this.cpuAction = 'back_off';
      } else {
        this.cpuAction = roll < 0.5 ? 'jab' : 'advance';
      }
    }

    switch (this.cpuAction) {
      case 'advance':
        this.input.keysDown.add('ArrowLeft');
        break;
      case 'back_off':
        this.input.keysDown.add('ArrowRight');
        break;
      case 'jump_in':
        this.input.keysDown.add('ArrowUp');
        this.input.keysDown.add('ArrowLeft');
        break;
      case 'special1':
        this.input.keysPressedThisFrame.add('Numpad6');
        this.cpuAction = 'none';
        const isBisonSpecial1 = this.p2 && this.p2.character && this.p2.character.name === 'BISON';
        this.cpuSpecialCooldown = isBisonSpecial1 ? 180 : 90; // 3.0s cooldown gap for Bison torpedo, 1.5s for others
        break;
      case 'special2':
        this.input.keysPressedThisFrame.add('Numpad3');
        this.cpuAction = 'none';
        const isHondaSpecial2 = this.p2 && this.p2.character && (this.p2.character.name === 'E. HONDA' || this.p2.character.name === 'E.HONDA' || this.p2.character.name === 'EHONDA');
        this.cpuSpecialCooldown = isHondaSpecial2 ? 150 : 90;
        break;
      case 'jab':
        this.input.keysPressedThisFrame.add('Numpad4');
        this.cpuAction = 'none';
        break;
      case 'heavy_punch':
        this.input.keysPressedThisFrame.add('Numpad5');
        this.cpuAction = 'none';
        break;
      case 'sweep':
        this.input.keysDown.add('ArrowDown');
        this.input.keysPressedThisFrame.add('Numpad2');
        this.cpuAction = 'none';
        break;
    }
  }

  // --- 60 FPS FIXED UPDATE STEP ---
  update() {
    this.stateTimer++;

    // Stage parallax & petals
    this.stage.update();

    // Particles
    this.particleSystem.update();

    // Camera following fighters and screen borders
    this.camera.update(this.p1, this.p2, { minX: this.stage.minX, maxX: this.stage.maxX });

    // HUD Update
    this.hud.update();

    switch (this.state) {
      case MatchState.CHAR_SELECT:
        this.updateCharSelect();
        break;

      case MatchState.ROUND_INTRO:
        if (this.stateTimer === 85) {
          sounds.playAnnounce('fight');
          this.hud.showBanner('FIGHT!', '', 45, '#ef4444');
          this.state = MatchState.FIGHTING;
          this.stateTimer = 0;
        }
        break;

      case MatchState.FIGHTING:
        this.updateFight();
        break;

      case MatchState.SLOW_MO_KO:
        this.updateSlowMoKO();
        break;

      case MatchState.ROUND_OUTRO:
        this.updateRoundOutro();
        break;

      case MatchState.STAGE_CLEAR:
        if (this.stateTimer > 90) {
          this.tournamentStage++;
          this.startMatch();
        }
        break;

      case MatchState.GAME_OVER:
      case MatchState.TOURNAMENT_WIN:
        this.updateGameOver();
        break;
    }

    // Clear single-frame key presses at end of every tick across ALL states
    this.input.endFrame();
  }

  updateGameOver() {
    if (this.stateTimer < 20) return;

    if (
      this.input.isPressedCode('Enter') ||
      this.input.isPressedCode('Space') ||
      this.input.isPressed('p1', 'lp') ||
      this.input.isPressed('p1', 'hp') ||
      this.input.isPressed('p2', 'lp') ||
      this.input.isPressed('p2', 'hp')
    ) {
      sounds.init();
      this.openCharSelect(this.mode);
    }
  }

  updateFight() {
    // 1. Process CPU inputs if in tournament or practice
    this.updateCPUInput();

    // 2. Input buffer update
    this.input.update(this.p1.facing, this.p2.facing);

    // 3. Update Fighters with screen boundary clamping
    const screenBounds = this.camera.getViewportBounds();
    this.p1.update(this.input, this.p2, screenBounds, this.particleSystem);
    this.p2.update(this.input, this.p1, screenBounds, this.particleSystem);

    // 4. Resolve Pushbox overlapping bodies
    PhysicsEngine.resolvePushboxes(this.p1, this.p2, screenBounds);

    // 5. Check Fighter attacks vs opponent
    PhysicsEngine.checkCombatHit(this.p1, this.p2, this.particleSystem, (i, d) => this.camera.shake(i, d));
    PhysicsEngine.checkCombatHit(this.p2, this.p1, this.particleSystem, (i, d) => this.camera.shake(i, d));

    // 6. Update Projectiles
    PhysicsEngine.updateProjectiles(this.projectiles, this.p1, this.p2, screenBounds, this.particleSystem, (i, d) => this.camera.shake(i, d));

    // 7. Check Round End -> Enter Slow-Motion K.O.
    if (this.p1.health <= 0 || this.p2.health <= 0 || this.hud.timer <= 0) {
      this.hud.timerStopped = true;
      this.state = MatchState.SLOW_MO_KO;
      this.stateTimer = 0;
      this.slowMoTick = 0;

      this.roundWinner = this.p1.health > this.p2.health ? this.p1 : (this.p2.health > this.p1.health ? this.p2 : null);
      this.roundLoser = this.p1.health <= 0 ? this.p1 : this.p2;

      this.hud.showBanner('K.O.!', '', 90, '#ef4444');
    }
  }

  // --- SLOW-MOTION K.O. & MOVE COMPLETION ---
  updateSlowMoKO() {
    this.slowMoTick++;
    // Physics updates at 1/3 speed for dramatic slow-mo impact
    if (this.slowMoTick % 3 === 0) {
      const screenBounds = this.camera.getViewportBounds();
      // Dummy input so ongoing moves finish without triggering new actions
      const dummyInput = new InputManager();
      this.p1.update(dummyInput, this.p2, screenBounds, this.particleSystem);
      this.p2.update(dummyInput, this.p1, screenBounds, this.particleSystem);
      PhysicsEngine.resolvePushboxes(this.p1, this.p2, screenBounds);
    }

    // Wait until winner has landed on ground and finished attack recovery, and loser has settled
    const winnerLanded = !this.roundWinner || (this.roundWinner.isGrounded && 
      (this.roundWinner.state === FighterState.IDLE || this.roundWinner.stateTimer > 25));
    const loserLanded = !this.roundLoser || (this.roundLoser.isGrounded && this.roundLoser.stateTimer > 20);

    if (this.stateTimer > 40 && winnerLanded && loserLanded) {
      if (this.roundWinner) {
        this.roundWinner.roundsWon++;
        this.roundWinner.state = FighterState.VICTORY;
        sounds.playAnnounce('win');
        this.hud.showBanner('K.O.!', `${this.roundWinner.name} WINS`, 100, '#ef4444');
      } else {
        this.hud.showBanner('DOUBLE K.O.!', 'DRAW GAME', 100, '#ef4444');
      }

      this.state = MatchState.ROUND_OUTRO;
      this.stateTimer = 0;
    }
  }

  updateRoundOutro() {
    if (this.stateTimer > 110) {
      // Check Best of 3
      if (this.p1.roundsWon >= 2 || this.p2.roundsWon >= 2) {
        sounds.stopBGM();
        if (this.mode === GameMode.TOURNAMENT) {
          if (this.p1.roundsWon >= 2) {
            // Player Won Tournament Stage!
            if (this.tournamentStage >= this.tournamentLadder.length) {
              // Beaten the entire tournament!
              this.state = MatchState.TOURNAMENT_WIN;
              sounds.playAnnounce('win');
            } else {
              // Next Tournament Stage
              this.state = MatchState.STAGE_CLEAR;
              this.stateTimer = 0;
              this.hud.showBanner('STAGE CLEAR!', `NEXT OPPONENT: ${this.tournamentLadder[this.tournamentStage]}`, 90, '#facc15');
            }
          } else {
            // Player Lost in Tournament -> Game Over
            this.state = MatchState.GAME_OVER;
            this.stateTimer = 0;
            this.hud.showBanner('GAME OVER', 'PRESS [ENTER] OR [SPACE] TO RETRY', 999, '#ef4444');
          }
        } else {
          // Versus Mode Match Over
          this.state = MatchState.GAME_OVER;
          this.stateTimer = 0;
          const winner = this.p1.roundsWon >= 2 ? this.p1.name : this.p2.name;
          this.hud.showBanner('YOU WIN!', `${winner} WINS • PRESS [ENTER] OR [SPACE] TO REMATCH`, 999, '#facc15');
        }
      } else {
        // Next round in bout
        this.roundNum++;
        this.startRound();
      }
    }
  }

  // --- RENDERING ---
  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    const camOffset = this.camera.getRenderOffset();

    // 1. Stage Parallax
    this.stage.render(this.ctx, camOffset);

    // 2. World Space Objects
    this.ctx.save();
    this.ctx.translate(-camOffset.x, -camOffset.y);

    if (this.state !== MatchState.CHAR_SELECT) {
      if (this.p1.y > this.p2.y) {
        this.p2.render(this.ctx);
        this.p1.render(this.ctx);
      } else {
        this.p1.render(this.ctx);
        this.p2.render(this.ctx);
      }

      for (const proj of this.projectiles) {
        proj.render(this.ctx);
      }

      this.particleSystem.render(this.ctx);
    }

    this.ctx.restore();

    // 3. Screen Space HUD
    if (this.state !== MatchState.CHAR_SELECT) {
      this.hud.render(this.ctx, this.p1, this.p2, this.input, this.mode, this.tournamentStage);
    }

    // 4. Character Select Screen
    if (this.state === MatchState.CHAR_SELECT) {
      this.hud.renderCharacterSelect(
        this.ctx, ROSTER, this.p1CharIdx, this.p2CharIdx,
        this.p1Confirmed, this.p2Confirmed, this.mode === GameMode.TOURNAMENT,
        this.matchStartCountdown
      );
    }

    // 5. Tournament Championship Screen
    if (this.state === MatchState.TOURNAMENT_WIN) {
      this.hud.renderTournamentWin(this.ctx, this.p1.name);
    }

    // 6. Pause Screen
    if (this.state === MatchState.PAUSED) {
      this.renderPauseScreen();
    }
  }

  renderPauseScreen() {
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.font = '900 36px "Impact", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#facc15';
    this.ctx.fillText('PAUSED', this.width / 2, this.height / 2);
    this.ctx.font = '14px "Courier New", monospace';
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillText('Press [ESC] to Resume', this.width / 2, this.height / 2 + 35);
    this.ctx.restore();
  }

  // --- GAME LOOP ---
  startLoop() {
    const loop = (timestamp) => {
      if (!this.lastTime) this.lastTime = timestamp;
      const elapsed = timestamp - this.lastTime;
      this.lastTime = timestamp;

      this.accumTime += Math.min(elapsed, 100);

      while (this.accumTime >= this.fixedStep) {
        if (this.state !== MatchState.PAUSED) {
          this.update();
        }
        this.accumTime -= this.fixedStep;
      }

      this.render();
      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
  }
}

function bootGame() {
  if (typeof window === 'undefined' || window.__sf2_booted) return;
  window.__sf2_booted = true;
  try {
    window.gameInstance = new Game();
  } catch (err) {
    console.error("Error launching Street Fighter II:", err);
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootGame);
  } else {
    bootGame();
  }
  window.addEventListener('load', bootGame);
}
