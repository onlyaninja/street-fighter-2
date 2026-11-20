/**
 * Dual Player Keyboard Input Manager
 * Handles simultaneous key presses without ghosting, input buffering,
 * frame-by-frame edge detection, fighting game motion inputs (QCF, DP, QCB, Charge),
 * and independent Easy (1-key) vs Classic Arcade (strict motion) toggles for P1 & P2.
 */

export class InputManager {
  constructor() {
    this.keysDown = new Set();
    this.keysPressedThisFrame = new Set();
    this.keysReleasedThisFrame = new Set();

    // Special Move Modes: 'easy' (1-key shortcuts enabled) or 'classic' (motion required)
    this.specialModes = {
      p1: 'easy',
      p2: 'easy'
    };

    // Default Control Bindings for Player 1 and Player 2
    this.bindings = {
      p1: {
        up: 'KeyW',
        down: 'KeyS',
        left: 'KeyA',
        right: 'KeyD',
        lp: 'KeyF',       // Light Punch
        hp: 'KeyG',       // Heavy Punch
        lk: 'KeyV',       // Light Kick
        hk: 'KeyB',       // Heavy Kick
        hadouken: 'KeyT', // Shortcut (Special 1)
        shoryuken: 'KeyY',// Shortcut (Special 2)
        tatsumaki: 'KeyH',// Shortcut (Special 3 - conveniently right next to G/B/Y)
        tatsumaki_alt: 'KeyU' // Also accept KeyU
      },
      p2: {
        up: 'ArrowUp',
        down: 'ArrowDown',
        left: 'ArrowLeft',
        right: 'ArrowRight',
        // Primary (Full keyboard Numpad)
        lp: 'Numpad4',
        hp: 'Numpad5',
        lk: 'Numpad1',
        hk: 'Numpad2',
        hadouken: 'Numpad6',
        shoryuken: 'Numpad3',
        tatsumaki: 'Numpad0',
        // Secondary fallback for compact keyboards (both active simultaneously!)
        lp_alt: 'KeyI',
        hp_alt: 'KeyO',
        lk_alt: 'KeyK',
        hk_alt: 'KeyL',
        hadouken_alt: 'KeyP',
        shoryuken_alt: 'BracketLeft',
        tatsumaki_alt: 'BracketRight'
      }
    };

    // Direction history buffer for motion inputs (stores last 35 frames: [ { down, forward, back, up, timestamp }, ... ])
    this.history = {
      p1: [],
      p2: []
    };

    // Attack press timestamps for rapid-tap inputs (e.g. Chun-Li Lightning Legs, Blanka Electric, E. Honda Slaps)
    this.tapHistory = {
      p1: { kicks: [], punches: [] },
      p2: { kicks: [], punches: [] }
    };

    this.setupListeners();
  }

  toggleSpecialMode(playerKey) {
    this.specialModes[playerKey] = this.specialModes[playerKey] === 'easy' ? 'classic' : 'easy';
    return this.specialModes[playerKey];
  }

  getSpecialMode(playerKey) {
    return this.specialModes[playerKey] || 'easy';
  }

  setSpecialMode(playerKey, mode) {
    this.specialModes[playerKey] = mode;
  }

  // Complete reset to prevent moves from spilling across rounds
  reset() {
    this.keysDown.clear();
    this.keysPressedThisFrame.clear();
    this.keysReleasedThisFrame.clear();
    this.history.p1 = [];
    this.history.p2 = [];
    this.tapHistory.p1.kicks = [];
    this.tapHistory.p1.punches = [];
    this.tapHistory.p2.kicks = [];
    this.tapHistory.p2.punches = [];
  }

  setupListeners() {
    window.addEventListener('keydown', (e) => {
      // Prevent browser scrolling for game keys
      if ([
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Space', 'Tab'
      ].includes(e.code)) {
        e.preventDefault();
      }

      // F1 / F2 quick toggles for Special Move Mode
      if (e.code === 'F1') {
        e.preventDefault();
        this.toggleSpecialMode('p1');
        const event = new CustomEvent('specialModeChanged', { detail: { player: 'p1', mode: this.specialModes.p1 } });
        window.dispatchEvent(event);
      } else if (e.code === 'F2') {
        e.preventDefault();
        this.toggleSpecialMode('p2');
        const event = new CustomEvent('specialModeChanged', { detail: { player: 'p2', mode: this.specialModes.p2 } });
        window.dispatchEvent(event);
      }

      if (!this.keysDown.has(e.code)) {
        this.keysPressedThisFrame.add(e.code);

        // Record kick taps for rapid-tap specials (Chun-Li Lightning Legs)
        if (e.code === this.bindings.p1.lk || e.code === this.bindings.p1.hk) {
          this.tapHistory.p1.kicks.push(Date.now());
        }
        if (e.code === this.bindings.p2.lk || e.code === this.bindings.p2.hk ||
            e.code === this.bindings.p2.lk_alt || e.code === this.bindings.p2.hk_alt) {
          this.tapHistory.p2.kicks.push(Date.now());
        }

        // Record punch taps for rapid-tap specials (Blanka Electric Thunder, E. Honda Hundred Hand Slap)
        if (e.code === this.bindings.p1.lp || e.code === this.bindings.p1.hp) {
          this.tapHistory.p1.punches.push(Date.now());
        }
        if (e.code === this.bindings.p2.lp || e.code === this.bindings.p2.hp ||
            e.code === this.bindings.p2.lp_alt || e.code === this.bindings.p2.hp_alt) {
          this.tapHistory.p2.punches.push(Date.now());
        }
      }
      this.keysDown.add(e.code);
    });

    window.addEventListener('keyup', (e) => {
      this.keysDown.delete(e.code);
      this.keysReleasedThisFrame.add(e.code);
    });

    // Reset keys if window loses focus
    window.addEventListener('blur', () => {
      this.reset();
    });
  }

  // Called once every 60fps frame tick
  update(p1Facing = 1, p2Facing = -1) {
    this.recordDirectionHistory('p1', p1Facing);
    this.recordDirectionHistory('p2', p2Facing);

    // Prune old taps (> 400ms old)
    const now = Date.now();
    this.tapHistory.p1.kicks = this.tapHistory.p1.kicks.filter(t => now - t < 400);
    this.tapHistory.p2.kicks = this.tapHistory.p2.kicks.filter(t => now - t < 400);
    this.tapHistory.p1.punches = this.tapHistory.p1.punches.filter(t => now - t < 400);
    this.tapHistory.p2.punches = this.tapHistory.p2.punches.filter(t => now - t < 400);
  }

  // Clear single-frame press edges at end of frame
  endFrame() {
    this.keysPressedThisFrame.clear();
    this.keysReleasedThisFrame.clear();
  }

  recordDirectionHistory(playerKey, facing) {
    const b = this.bindings[playerKey];
    const up = this.isDownCode(b.up);
    const down = this.isDownCode(b.down);
    const rawLeft = this.isDownCode(b.left);
    const rawRight = this.isDownCode(b.right);

    // Relative to facing direction (1 = facing right, -1 = facing left)
    const forward = facing === 1 ? rawRight : rawLeft;
    const back = facing === 1 ? rawLeft : rawRight;

    const hist = this.history[playerKey];
    hist.push({ up, down, forward, back });
    if (hist.length > 35) {
      hist.shift();
    }
  }

  isDownCode(code) {
    return this.keysDown.has(code);
  }

  isPressedCode(code) {
    return this.keysPressedThisFrame.has(code);
  }

  isDown(playerKey, action) {
    const b = this.bindings[playerKey];
    const primary = b[action];
    const alt = b[action + '_alt'];
    return this.isDownCode(primary) || (alt ? this.isDownCode(alt) : false);
  }

  isPressed(playerKey, action) {
    const b = this.bindings[playerKey];
    const primary = b[action];
    const alt = b[action + '_alt'];
    return this.isPressedCode(primary) || (alt ? this.isPressedCode(alt) : false);
  }

  consumePress(playerKey, action) {
    const b = this.bindings[playerKey];
    const primary = b[action];
    const alt = b[action + '_alt'];
    if (primary) this.keysPressedThisFrame.delete(primary);
    if (alt) this.keysPressedThisFrame.delete(alt);
  }

  // Check rapid tap (e.g. Chun-Li Lightning Legs: 3 kick presses in 350ms)
  checkRapidKicks(playerKey) {
    return this.tapHistory[playerKey].kicks.length >= 3;
  }

  // Check rapid punch tap (e.g. Blanka Electric Thunder, E. Honda Hundred Hand Slap: 3 punch presses in 350ms)
  checkRapidPunches(playerKey) {
    return this.tapHistory[playerKey].punches.length >= 3;
  }

  // Check Charge moves: Back held for >= 30 frames, then Forward + Attack
  checkChargeBackForward(playerKey) {
    const hist = this.history[playerKey];
    if (hist.length < 32) return false;

    // Check if the latest frame is Forward
    const latest = hist[hist.length - 1];
    if (!latest || !latest.forward) return false;

    // Check if Back was held for at least 25 of the earlier frames
    let backCount = 0;
    for (let i = 0; i < hist.length - 3; i++) {
      if (hist[i].back) backCount++;
    }
    return backCount >= 22;
  }

  // Check Charge moves: Down held for >= 30 frames, then Up + Attack
  checkChargeDownUp(playerKey) {
    const hist = this.history[playerKey];
    if (hist.length < 32) return false;

    const latest = hist[hist.length - 1];
    if (!latest || !latest.up) return false;

    let downCount = 0;
    for (let i = 0; i < hist.length - 3; i++) {
      if (hist[i].down) downCount++;
    }
    return downCount >= 22;
  }

  // Check fighting game motion inputs in history buffer
  checkMotion(playerKey, motion) {
    const hist = this.history[playerKey];
    if (hist.length < 4) return false;

    // Hadouken / Fireball / Kikoken: Down -> Down+Forward -> Forward (QCF)
    if (motion === 'qcf') {
      let step = 0;
      for (let i = hist.length - 1; i >= Math.max(0, hist.length - 22); i--) {
        const frame = hist[i];
        if (step === 0 && frame.forward) {
          step = 1;
        } else if (step === 1 && frame.down && !frame.forward) {
          return true;
        }
      }
    }

    // Shoryuken / Dragon Punch: Forward -> Down -> Down+Forward (DP)
    if (motion === 'dp') {
      let step = 0;
      for (let i = hist.length - 1; i >= Math.max(0, hist.length - 24); i--) {
        const frame = hist[i];
        if (step === 0 && frame.forward) {
          step = 1;
        } else if (step === 1 && frame.down && !frame.forward) {
          step = 2;
        } else if (step === 2 && frame.forward && !frame.down) {
          return true;
        }
      }
    }

    // Tatsumaki / Spinning Bird Kick: Down -> Down+Back -> Back (QCB)
    if (motion === 'qcb') {
      let step = 0;
      for (let i = hist.length - 1; i >= Math.max(0, hist.length - 22); i--) {
        const frame = hist[i];
        if (step === 0 && frame.back) {
          step = 1;
        } else if (step === 1 && frame.down && !frame.back) {
          return true;
        }
      }
    }

    return false;
  }
}
