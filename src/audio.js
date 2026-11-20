/**
 * Retro Arcade Web Audio API Synthesizer
 * Generates all SFX (hits, blocks, swings, fireballs, dragon punches, voice formants)
 * and retro 90s arcade BGM with zero external dependencies.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.bgmPlaying = false;
    this.bgmTimer = null;
    this.bgmStep = 0;
    this.bgmSessionId = 0;
    this.bgmTrackGain = null;
    this.sfxEnabled = true;
    this.bgmEnabled = true;
    this.masterGain = null;
    this.sfxGain = null;
    this.bgmGain = null;
    this.bpm = 138;
    this.stepTime = (60 / this.bpm) / 4; // 16th notes
    this.nextStepTime = 0;
    this.scheduleAheadTime = 0.12; // 120ms lookahead
  }

  init() {
    if (this.ctx) {
      this.resume();
      return;
    }
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.bgmGain.connect(this.masterGain);

      this.resume();
    } catch (e) {
      console.warn("Web Audio not supported or blocked", e);
    }
  }

  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        if (this.bgmPlaying && this.bgmEnabled) {
          this.startBGM(true);
        }
      }).catch(() => {});
    }
  }

  // --- SFX SYNTHESIS ---

  // Light Punch / Kick Swing (Whoosh)
  playSwing(heavy = false) {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const dur = heavy ? 0.22 : 0.12;
    const bufferSize = this.ctx.sampleRate * dur;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(heavy ? 600 : 900, t);
    filter.frequency.exponentialRampToValueAtTime(heavy ? 220 : 350, t + dur);
    filter.Q.setValueAtTime(3.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(heavy ? 0.45 : 0.3, t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  // Impact Hit (Punch / Kick connected)
  playHit(heavy = false, blocked = false) {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    if (blocked) {
      // Metallic block chime & deflect
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(1400, t);
      osc1.frequency.exponentialRampToValueAtTime(700, t + 0.15);
      osc2.frequency.setValueAtTime(2200, t);
      osc2.frequency.exponentialRampToValueAtTime(1100, t + 0.12);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.sfxGain);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.16);
      osc2.stop(t + 0.16);
      return;
    }

    // Heavy or Light Impact
    const dur = heavy ? 0.28 : 0.16;
    
    // Sub punch boom
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'triangle';
    sub.frequency.setValueAtTime(heavy ? 180 : 260, t);
    sub.frequency.exponentialRampToValueAtTime(35, t + dur);

    subGain.gain.setValueAtTime(heavy ? 0.7 : 0.4, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    sub.connect(subGain);
    subGain.connect(this.sfxGain);
    sub.start(t);
    sub.stop(t + dur);

    // Crack noise
    const noiseBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.08), this.ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i++) {
      nd[i] = (Math.random() * 2 - 1) * (1 - i / nd.length);
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuf;

    const nFilter = this.ctx.createBiquadFilter();
    nFilter.type = 'lowpass';
    nFilter.frequency.setValueAtTime(heavy ? 1400 : 2200, t);

    const nGain = this.ctx.createGain();
    nGain.gain.setValueAtTime(heavy ? 0.6 : 0.35, t);
    nGain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    noise.connect(nFilter);
    nFilter.connect(nGain);
    nGain.connect(this.sfxGain);
    noise.start(t);
  }

  // Hadouken Cast & Travel
  playHadouken() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    
    // Vocal-like energy surge (formant surge)
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.linearRampToValueAtTime(520, t + 0.1);
    osc.frequency.linearRampToValueAtTime(340, t + 0.28);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(1500, t + 0.15);
    filter.Q.setValueAtTime(4.5, t);

    oscGain.gain.setValueAtTime(0.0, t);
    oscGain.gain.linearRampToValueAtTime(0.5, t + 0.08);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.32);

    // Sonic burst blast
    this.playSwing(true);
  }

  // Shoryuken (Dragon Punch) Rising Uppercut
  playShoryuken() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.35);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(3600, t + 0.35);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  // Tatsumaki Senpukyaku (Spinning Hurricane Kick)
  playTatsumaki() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playSwing(false);
      }, i * 90);
    }
  }

  // Blanka Electric Thunder (Crackling 10,000V electric surge)
  playElectricity() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.linearRampToValueAtTime(480, t + 0.04);
    osc.frequency.linearRampToValueAtTime(120, t + 0.08);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(850, t);
    filter.Q.setValueAtTime(5.0, t);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Blanka Rolling Attack (Beast Cannonball spin)
  playRolling() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(420, t + 0.25);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.28);
    this.playSwing(true);
  }

  // E. Honda Hundred Hand Slap (Rapid open-palm flurry)
  playSlapFlurry() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.07);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  // E. Honda Sumo Headbutt (Torpedo rocket launch)
  playHeadbutt() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(360, t + 0.25);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.3);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.3);
    this.playSwing(true);
  }

  // Zangief Double Lariat (Spinning arm cyclone)
  playLariat() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.16);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  // Zangief Spinning Piledriver (Seismic throw & mat slam)
  playPiledriver() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    this.playKnockdown();
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(20, t + 0.5);

    gain.gain.setValueAtTime(0.9, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.55);
  }

  // Dhalsim Yoga Fire (Fiery breath projectile)
  playYogaFire() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.3);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(700, t);
    filter.Q.setValueAtTime(3.0, t);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.32);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.32);
    this.playSwing(true);
  }

  // Dhalsim Yoga Flame (Billowing fire stream)
  playYogaFlame() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.45;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, t);
    filter.frequency.linearRampToValueAtTime(450, t + 0.45);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.55, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  // Knockdown Ground Slam
  playKnockdown() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 0.4);

    gain.gain.setValueAtTime(0.8, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.45);
  }

  // Jump sound
  playJump() {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(380, t + 0.12);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  // Announcer Voice Synthesizer / Chimes
  playAnnounce(type) {
    if (!this.sfxEnabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    if (type === 'round1' || type === 'round2' || type === 'roundFinal') {
      // Regal arcade fanfare chord
      const notes = type === 'roundFinal' ? [330, 415, 493, 660] : [261.6, 329.6, 392, 523.2];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, t + idx * 0.05);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1500, t);

        g.gain.setValueAtTime(0.18, t + idx * 0.05);
        g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.05 + 0.45);

        osc.connect(filter);
        filter.connect(g);
        g.connect(this.sfxGain);

        osc.start(t + idx * 0.05);
        osc.stop(t + idx * 0.05 + 0.45);
      });
    } else if (type === 'fight') {
      // Dramatic FIGHT! sound impact & gong
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(110, t + 0.6);

      g.gain.setValueAtTime(0.7, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

      osc.connect(g);
      g.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.65);

      this.playHit(true, false);
    } else if (type === 'ko') {
      // Big dramatic K.O. gong reverberation
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const g = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 1.2);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(260, t);
      osc2.frequency.exponentialRampToValueAtTime(90, t + 1.0);

      g.gain.setValueAtTime(0.8, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

      osc.connect(g);
      osc2.connect(g);
      g.connect(this.sfxGain);

      osc.start(t);
      osc2.start(t);
      osc.stop(t + 1.2);
      osc2.stop(t + 1.2);
    } else if (type === 'win') {
      // Victory triumph arpeggio
      const notes = [392, 523.25, 659.25, 783.99, 1046.5];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, t + idx * 0.1);

        g.gain.setValueAtTime(0.2, t + idx * 0.1);
        g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.1 + 0.35);

        osc.connect(g);
        g.connect(this.sfxGain);
        osc.start(t + idx * 0.1);
        osc.stop(t + idx * 0.1 + 0.35);
      });
    }
  }

  // --- RETRO 90S CHIPTUNE / ARCADE BGM ENGINE ---
  // Inspiring driving battle music in D minor (classic Capcom CPS-1 rhythm)
  startBGM(force = false) {
    if (!this.bgmEnabled) return;
    if (this.bgmPlaying && !force) return;

    this.init();
    if (!this.ctx) return;

    // 1. Unconditionally terminate any previous session and timers
    this.stopBGM(false);

    // 2. Mark playing and increment session ID (invalidates any delayed callbacks)
    this.bgmPlaying = true;
    const currentSession = ++this.bgmSessionId;

    // 3. If AudioContext is still suspended (waiting for user gesture):
    // DO NOT schedule into suspended time 0! Scheduler will resume as soon as user interacts.
    if (this.ctx.state === 'suspended') {
      return;
    }

    // 4. Create fresh dedicated track gain connected to bgmGain
    // Allows instantaneous muting/disconnection of all active oscillators when stopping
    this.bgmTrackGain = this.ctx.createGain();
    this.bgmTrackGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.bgmTrackGain.connect(this.bgmGain);

    this.bgmStep = 0;
    this.stepTime = (60 / this.bpm) / 4;
    this.nextStepTime = this.ctx.currentTime + 0.05;

    const bassLine = [
      146.83, 0, 146.83, 146.83,  130.81, 0, 130.81, 130.81,
      116.54, 0, 116.54, 116.54,  130.81, 146.83, 164.81, 146.83,
      146.83, 0, 146.83, 146.83,  130.81, 0, 130.81, 130.81,
      110.00, 0, 110.00, 110.00,  116.54, 130.81, 146.83, 164.81
    ];

    const melodyLine = [
      293.66, 0, 349.23, 0,  440.00, 0, 392.00, 349.23,
      293.66, 0, 261.63, 0,  293.66, 0, 0, 0,
      349.23, 0, 392.00, 0,  440.00, 0, 523.25, 0,
      440.00, 392.00, 349.23, 329.63, 293.66, 0, 0, 0
    ];

    const scheduleStep = (step, time) => {
      if (!this.bgmTrackGain) return;

      // 1. Kick & Snare
      if (step % 8 === 0) {
        // Kick
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(110, time);
        osc.frequency.exponentialRampToValueAtTime(30, time + 0.1);
        g.gain.setValueAtTime(0.5, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.12);
        osc.connect(g);
        g.connect(this.bgmTrackGain);
        osc.start(time);
        osc.stop(time + 0.12);
      } else if (step % 8 === 4) {
        // Snare
        const noiseBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.1), this.ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(800, time);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.28, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        noise.connect(filter);
        filter.connect(g);
        g.connect(this.bgmTrackGain);
        noise.start(time);
        noise.stop(time + 0.1);
      }

      // Hi-hat on every 2nd 16th
      if (step % 2 === 0) {
        const noiseBuf = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * 0.03), this.ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource();
        noise.buffer = noiseBuf;
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(7000, time);
        const g = this.ctx.createGain();
        g.gain.setValueAtTime(0.12, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + 0.03);
        noise.connect(filter);
        filter.connect(g);
        g.connect(this.bgmTrackGain);
        noise.start(time);
        noise.stop(time + 0.03);
      }

      // 2. Bass synth
      const bassFreq = bassLine[step];
      if (bassFreq > 0) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(bassFreq, time);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(650, time);
        filter.frequency.exponentialRampToValueAtTime(200, time + this.stepTime * 0.88);

        g.gain.setValueAtTime(0.3, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + this.stepTime * 0.88);

        osc.connect(filter);
        filter.connect(g);
        g.connect(this.bgmTrackGain);
        osc.start(time);
        osc.stop(time + this.stepTime * 0.88);
      }

      // 3. Lead melody (with clean staccato on runs to prevent discordant polyphonic clashing)
      const melFreq = melodyLine[step];
      if (melFreq > 0) {
        const nextStep = (step + 1) % 32;
        const isHeld = melodyLine[nextStep] === 0;
        const noteDur = isHeld ? this.stepTime * 1.5 : this.stepTime * 0.85;

        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(melFreq, time);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(2200, time);

        g.gain.setValueAtTime(0.2, time);
        g.gain.exponentialRampToValueAtTime(0.001, time + noteDur);

        osc.connect(filter);
        filter.connect(g);
        g.connect(this.bgmTrackGain);
        osc.start(time);
        osc.stop(time + noteDur);
      }
    };

    const scheduler = () => {
      // STRICT SESSION CHECK: If session changed or BGM stopped, terminate this loop forever
      if (!this.bgmPlaying || this.bgmSessionId !== currentSession) {
        return;
      }

      if (this.ctx.state === 'suspended') {
        this.bgmTimer = setTimeout(scheduler, 50);
        return;
      }

      // If we fell behind by more than 0.5s (e.g. tab switched away), resync nextStepTime
      if (this.nextStepTime < this.ctx.currentTime) {
        this.nextStepTime = this.ctx.currentTime + 0.02;
      }

      // Lookahead window: schedule notes up to scheduleAheadTime into the future
      while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadTime) {
        scheduleStep(this.bgmStep, this.nextStepTime);
        this.nextStepTime += this.stepTime;
        this.bgmStep = (this.bgmStep + 1) % 32;
      }

      this.bgmTimer = setTimeout(scheduler, 25);
    };

    scheduler();
  }

  stopBGM(updatePlayingFlag = true) {
    if (updatePlayingFlag) {
      this.bgmPlaying = false;
    }
    // Invalidate all running scheduler callbacks
    this.bgmSessionId++;

    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }

    // Instantly silence all active notes and disconnect previous track gain
    if (this.bgmTrackGain && this.ctx) {
      try {
        this.bgmTrackGain.gain.setValueAtTime(0, this.ctx.currentTime);
        this.bgmTrackGain.disconnect();
      } catch (e) {}
      this.bgmTrackGain = null;
    }
  }

  toggleBGM() {
    this.bgmEnabled = !this.bgmEnabled;
    if (this.bgmEnabled) {
      this.startBGM(true);
    } else {
      this.stopBGM(true);
    }
    return this.bgmEnabled;
  }

  toggleSFX() {
    this.sfxEnabled = !this.sfxEnabled;
    return this.sfxEnabled;
  }
}

export const sounds = new SoundEngine();
