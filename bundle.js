// Street Fighter II - Standalone Dual Keyboard Arcade Bundle
(() => {
"use strict";

// --- src/audio.js ---
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

const sounds = new SoundEngine();


// --- src/input.js ---
/**
 * Dual Player Keyboard Input Manager
 * Handles simultaneous key presses without ghosting, input buffering,
 * frame-by-frame edge detection, fighting game motion inputs (QCF, DP, QCB, Charge),
 * and independent Easy (1-key) vs Classic Arcade (strict motion) toggles for P1 & P2.
 */

class InputManager {
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


// --- src/entities/particle.js ---
/**
 * Visual FX Particle System
 * Produces authentic arcade hitsparks, guard sparks, dust clouds, and fire particles.
 */

class Particle {
  constructor(x, y, vx, vy, color, size, life, type = 'spark') {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.size = size;
    this.maxLife = life;
    this.life = life;
    this.type = type; // 'spark', 'star', 'dust', 'flame', 'ring'
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.4;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotSpeed;

    if (this.type === 'dust') {
      this.vy *= 0.92;
      this.vx *= 0.92;
      this.size += 0.35;
    } else if (this.type === 'spark' || this.type === 'flame') {
      this.vy += 0.15; // gravity
      this.vx *= 0.95;
    } else if (this.type === 'ring') {
      this.size += 2.5;
    }

    this.life--;
  }

  render(ctx) {
    const progress = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, progress));

    if (this.type === 'spark') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(1, this.size * progress), 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'star') {
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.fillStyle = this.color;
      const s = this.size * progress;
      ctx.beginPath();
      ctx.moveTo(0, -s * 2);
      ctx.lineTo(s * 0.6, -s * 0.6);
      ctx.lineTo(s * 2, 0);
      ctx.lineTo(s * 0.6, s * 0.6);
      ctx.lineTo(0, s * 2);
      ctx.lineTo(-s * 0.6, s * 0.6);
      ctx.lineTo(-s * 2, 0);
      ctx.lineTo(-s * 0.6, -s * 0.6);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'dust') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'flame') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(1, this.size * progress), 0, Math.PI * 2);
      ctx.fill();
    } else if (this.type === 'ring') {
      ctx.strokeStyle = this.color;
      ctx.lineWidth = Math.max(1, 4 * progress);
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.restore();
  }
}

class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.update();
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  render(ctx) {
    for (const p of this.particles) {
      p.render(ctx);
    }
  }

  // Hit Spark on opponent connection
  createHitSpark(x, y, heavy = false) {
    const count = heavy ? 18 : 10;
    // Central impact star
    this.particles.push(new Particle(x, y, 0, 0, '#ffffff', heavy ? 16 : 10, 8, 'star'));
    this.particles.push(new Particle(x, y, 0, 0, '#ffea00', heavy ? 14 : 9, 12, 'star'));
    this.particles.push(new Particle(x, y, 0, 0, '#ff3300', heavy ? 8 : 4, 10, 'ring'));

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = (heavy ? 4.5 : 3.0) + Math.random() * 3.5;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = Math.random() > 0.4 ? '#ffdd00' : (Math.random() > 0.5 ? '#ff5500' : '#ffffff');
      this.particles.push(new Particle(x, y, vx, vy, color, heavy ? 4 : 3, 14 + Math.random() * 8, 'spark'));
    }
  }

  // Guard Spark on block
  createBlockSpark(x, y) {
    this.particles.push(new Particle(x, y, 0, 0, '#00e5ff', 12, 10, 'ring'));
    this.particles.push(new Particle(x, y, 0, 0, '#ffffff', 8, 8, 'star'));
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8;
      const speed = 2.5 + Math.random() * 2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      this.particles.push(new Particle(x, y, vx, vy, '#00ffff', 2.5, 12, 'spark'));
    }
  }

  // Dust cloud when jumping or landing
  createDust(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 3;
      const vy = -Math.random() * 1.5;
      const color = 'rgba(210, 200, 190, 0.45)';
      this.particles.push(new Particle(x + (Math.random() - 0.5) * 16, y, vx, vy, color, 4 + Math.random() * 4, 18 + Math.random() * 8, 'dust'));
    }
  }

  // Flame particles for Ken's fiery Shoryuken
  createFlames(x, y, count = 4) {
    for (let i = 0; i < count; i++) {
      const vx = (Math.random() - 0.5) * 2;
      const vy = -Math.random() * 3.5;
      const color = Math.random() > 0.5 ? '#ff3b00' : '#ff9900';
      this.particles.push(new Particle(x + (Math.random() - 0.5) * 14, y + (Math.random() - 0.5) * 14, vx, vy, color, 4 + Math.random() * 4, 12, 'flame'));
    }
  }

  // Hadouken trail particles
  createHadoukenTrail(x, y) {
    const vx = -(Math.random() * 2);
    const vy = (Math.random() - 0.5) * 2;
    const color = Math.random() > 0.5 ? '#00b4d8' : '#caf0f8';
    this.particles.push(new Particle(x, y, vx, vy, color, 3 + Math.random() * 3, 10, 'spark'));
  }

  // Blanka Electric Thunder crackling electricity particles
  createElectricitySparks(x, y, count = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.0 + Math.random() * 4.0;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const color = Math.random() > 0.4 ? '#00ffff' : (Math.random() > 0.5 ? '#ffff00' : '#ffffff');
      this.particles.push(new Particle(x + (Math.random() - 0.5) * 20, y + (Math.random() - 0.5) * 40, vx, vy, color, 3 + Math.random() * 3, 10 + Math.random() * 6, 'star'));
    }
  }
}


// --- src/entities/projectile.js ---
/**
 * Projectile Entity
 * Supports Hadouken (Ryu/Ken), Kikoken (Chun-Li), and Sonic Boom (Guile).
 */

class Projectile {
  constructor(x, y, dir, owner, characterName = 'ryu') {
    this.x = x;
    this.y = y;
    this.dir = dir; // 1 for right, -1 for left
    this.owner = owner; // 'p1' or 'p2'
    this.characterName = characterName.toLowerCase();
    this.speed = this.characterName === 'guile' ? 8.2 : (this.characterName === 'dhalsim' || this.characterName === 'yoga_fire' ? 5.2 : 7.2);
    this.radius = 18;
    this.active = true;
    this.damage = 14;
    this.hitstun = 20;
    this.blockstun = 14;
    this.knockbackX = 6;
    this.animFrame = 0;
  }

  update(stageBounds, particleSystem) {
    if (!this.active) return;
    this.x += this.speed * this.dir;
    this.animFrame++;

    // Trail sparks / flames
    if (this.animFrame % 2 === 0) {
      if (this.characterName === 'dhalsim' || this.characterName === 'yoga_fire') {
        particleSystem.createFlames(this.x - this.dir * 12, this.y, 2);
      } else {
        particleSystem.createHadoukenTrail(this.x - this.dir * 12, this.y);
      }
    }

    // Screen boundary despawn
    if (this.x < stageBounds.minX - 50 || this.x > stageBounds.maxX + 50) {
      this.active = false;
    }
  }

  getHitbox() {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2
    };
  }

  render(ctx) {
    if (!this.active) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    if (this.dir === -1) {
      ctx.scale(-1, 1);
    }

    const t = this.animFrame * 0.25;
    const pulse = Math.sin(t) * 3;

    if (this.characterName === 'guile') {
      // Sonic Boom: Spinning yellow & green crescent razor blade
      ctx.rotate(this.animFrame * 0.4);
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, 18, -Math.PI / 2, Math.PI / 2);
      ctx.quadraticCurveTo(8, 0, 0, -18);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#4ade80';
      ctx.beginPath();
      ctx.arc(0, 0, 14, -Math.PI / 2, Math.PI / 2);
      ctx.quadraticCurveTo(5, 0, 0, -14);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(-3, -12, 6, 24);
    } else if (this.characterName === 'chun-li') {
      // Kikoken: Glowing pink and cyan spirit sphere
      const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, this.radius + 6 + pulse);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.4, '#f472b6');
      grad.addColorStop(0.75, '#38bdf8');
      grad.addColorStop(1, 'rgba(56, 189, 248, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 6 + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(2, 0, 7, 0, Math.PI * 2);
      ctx.fill();
    } else if (this.characterName === 'dhalsim' || this.characterName === 'yoga_fire') {
      // Yoga Fire: Blazing flame sphere with fiery flickering halo
      const grad = ctx.createRadialGradient(0, 0, 3, 0, 0, this.radius + 8 + pulse);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.25, '#facc15');
      grad.addColorStop(0.65, '#ea580c');
      grad.addColorStop(0.9, '#dc2626');
      grad.addColorStop(1, 'rgba(220, 38, 38, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 8 + pulse, 0, Math.PI * 2);
      ctx.fill();

      // Flame core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(3, 0, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Flame tail curls
      ctx.fillStyle = 'rgba(234, 88, 12, 0.8)';
      ctx.beginPath();
      ctx.moveTo(-4, -9);
      ctx.lineTo(-22 - Math.sin(t * 3) * 7, -3);
      ctx.lineTo(-4, 9);
      ctx.closePath();
      ctx.fill();
    } else {
      // Classic Blue Hadouken
      const grad = ctx.createRadialGradient(0, 0, 4, 0, 0, this.radius + 6 + pulse);
      grad.addColorStop(0, '#ffffff');
      grad.addColorStop(0.35, '#00e5ff');
      grad.addColorStop(0.7, '#0055ff');
      grad.addColorStop(1, 'rgba(0, 40, 200, 0)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 6 + pulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(2, 0, 10, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Ki tail
      ctx.fillStyle = 'rgba(0, 220, 255, 0.7)';
      ctx.beginPath();
      ctx.moveTo(-4, -8);
      ctx.lineTo(-24 - Math.sin(t * 2) * 6, -2);
      ctx.lineTo(-4, 8);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }
}


// --- src/stages/suzaku.js ---
/**
 * Suzaku Castle Rooftop Stage (Ryu's Iconic Stage)
 * Features parallax Japanese architecture, tiled rooftops, glowing moon,
 * lanterns, and drifting sakura cherry blossom petals.
 */

class SuzakuStage {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.groundY = 320; // Y coordinate where fighters stand

    // Stage horizontal bounds
    this.minX = -200;
    this.maxX = 1000;

    // Drifting Sakura petals
    this.petals = [];
    for (let i = 0; i < 35; i++) {
      this.petals.push({
        x: Math.random() * (this.maxX - this.minX) + this.minX,
        y: Math.random() * height,
        speedX: 0.8 + Math.random() * 1.4,
        speedY: 0.5 + Math.random() * 0.9,
        size: 3 + Math.random() * 3,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05
      });
    }

    // Clouds
    this.clouds = [
      { x: -100, y: 50, speed: 0.15, scale: 1.2 },
      { x: 300, y: 75, speed: 0.22, scale: 0.9 },
      { x: 700, y: 40, speed: 0.18, scale: 1.5 }
    ];
  }

  update() {
    // Animate petals
    for (const p of this.petals) {
      p.x += p.speedX;
      p.y += p.speedY;
      p.rot += p.rotSpeed;

      if (p.x > this.maxX + 50) p.x = this.minX - 20;
      if (p.y > this.height) p.y = -10;
    }

    // Animate clouds
    for (const c of this.clouds) {
      c.x += c.speed;
      if (c.x > this.maxX + 200) {
        c.x = this.minX - 200;
      }
    }
  }

  render(ctx, camera) {
    const camX = camera.x;
    const viewW = ctx.canvas.width;
    const viewH = ctx.canvas.height;

    // 1. SKY GRADIENT (Deep twilight indigo into burning orange horizon)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, viewH);
    skyGrad.addColorStop(0, '#0c102b');
    skyGrad.addColorStop(0.45, '#1e1b4b');
    skyGrad.addColorStop(0.7, '#7c2d12');
    skyGrad.addColorStop(1, '#ea580c');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, viewW, viewH);

    // 2. GLOWING HARVEST MOON (slowest parallax)
    const moonX = 520 - camX * 0.05;
    const moonY = 95;
    const moonGrad = ctx.createRadialGradient(moonX, moonY, 10, moonX, moonY, 55);
    moonGrad.addColorStop(0, '#fffbeb');
    moonGrad.addColorStop(0.5, '#fef08a');
    moonGrad.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = moonGrad;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 55, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef9c3';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 32, 0, Math.PI * 2);
    ctx.fill();

    // 3. DISTANT MOUNTAINS & CLOUDS (0.15 parallax)
    ctx.fillStyle = '#1e1135';
    ctx.beginPath();
    ctx.moveTo(0, viewH);
    for (let x = -200; x <= viewW + 300; x += 120) {
      const peakX = x - camX * 0.15;
      const peakY = 220 + Math.sin(x * 0.02) * 45;
      ctx.lineTo(peakX, peakY);
    }
    ctx.lineTo(viewW + 300, viewH);
    ctx.closePath();
    ctx.fill();

    // Drifting clouds
    ctx.fillStyle = 'rgba(255, 180, 150, 0.15)';
    for (const c of this.clouds) {
      const cx = c.x - camX * 0.12;
      ctx.beginPath();
      ctx.ellipse(cx, c.y, 70 * c.scale, 20 * c.scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. MIDGROUND PAGODAS & CASTLE SILHOUETTE (0.35 parallax)
    this.renderCastleSilhouette(ctx, camX);

    // 5. FOREGROUND ROOFTOP (1.0 parallax - matches fighter world space)
    this.renderRooftop(ctx, camX);

    // 6. SAKURA PETALS (foreground layer)
    this.renderSakuraPetals(ctx, camX);
  }

  renderCastleSilhouette(ctx, camX) {
    const offsetX = -camX * 0.35;
    ctx.fillStyle = '#0f0a1c';

    // Pagoda Tower 1 (Left)
    const p1X = 140 + offsetX;
    ctx.fillRect(p1X - 25, 140, 50, 150);
    // Pagoda tiered roofs
    for (let tier = 0; tier < 3; tier++) {
      const ty = 140 + tier * 35;
      const tw = 80 - tier * 10;
      ctx.beginPath();
      ctx.moveTo(p1X - tw / 2, ty + 15);
      ctx.quadraticCurveTo(p1X, ty + 5, p1X + tw / 2, ty + 15);
      ctx.lineTo(p1X + tw / 2 - 6, ty + 24);
      ctx.lineTo(p1X - tw / 2 + 6, ty + 24);
      ctx.closePath();
      ctx.fill();
    }

    // Pagoda Tower 2 (Right)
    const p2X = 640 + offsetX;
    ctx.fillRect(p2X - 35, 120, 70, 180);
    for (let tier = 0; tier < 4; tier++) {
      const ty = 120 + tier * 30;
      const tw = 100 - tier * 12;
      ctx.beginPath();
      ctx.moveTo(p2X - tw / 2, ty + 15);
      ctx.quadraticCurveTo(p2X, ty + 5, p2X + tw / 2, ty + 15);
      ctx.lineTo(p2X + tw / 2 - 8, ty + 22);
      ctx.lineTo(p2X - tw / 2 + 8, ty + 22);
      ctx.closePath();
      ctx.fill();
    }

    // Castle Wall Battlements
    ctx.fillRect(-200 + offsetX, 240, 1400, 70);

    // Warm Lanterns in midground
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(p1X, 220, 3, 0, Math.PI * 2);
    ctx.arc(p2X - 15, 205, 3, 0, Math.PI * 2);
    ctx.arc(p2X + 15, 205, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  renderRooftop(ctx, camX) {
    const rx = -camX;
    const gy = this.groundY;

    // Wooden Foundation Beam
    ctx.fillStyle = '#3f1f0e';
    ctx.fillRect(this.minX + rx, gy + 12, (this.maxX - this.minX) + 400, 20);

    // Japanese Dark Ceramic Curved Tile Roof Surface
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(this.minX + rx, gy, (this.maxX - this.minX) + 400, 14);

    // Tile Ridge Segments
    ctx.fillStyle = '#292524';
    for (let tx = this.minX; tx < this.maxX + 300; tx += 28) {
      const tileX = tx + rx;
      ctx.fillRect(tileX, gy - 2, 22, 14);
      // Highlight on top of tile
      ctx.fillStyle = '#44403c';
      ctx.fillRect(tileX, gy - 2, 22, 2);
      ctx.fillStyle = '#292524';
    }

    // Lower Roof Tier
    ctx.fillStyle = '#0c0a09';
    ctx.fillRect(this.minX + rx, gy + 32, (this.maxX - this.minX) + 400, 100);

    // Decorative Dragon/Gargoyle Roof Finials (Onigawara / Shachihoko) on left & right
    this.renderRoofOrnament(ctx, this.minX + rx + 60, gy - 25, false);
    this.renderRoofOrnament(ctx, this.maxX + rx - 60, gy - 25, true);
  }

  renderRoofOrnament(ctx, x, y, flip) {
    ctx.save();
    ctx.translate(x, y);
    if (flip) ctx.scale(-1, 1);
    ctx.fillStyle = '#292524';

    // Stylized Shachihoko curved dorsal tail
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.quadraticCurveTo(-15, 10, -5, -15);
    ctx.quadraticCurveTo(15, -25, 20, -5);
    ctx.quadraticCurveTo(5, 5, 15, 30);
    ctx.closePath();
    ctx.fill();

    // Golden eye
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(5, -5, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  renderSakuraPetals(ctx, camX) {
    ctx.fillStyle = 'rgba(255, 182, 193, 0.85)';
    for (const p of this.petals) {
      const px = p.x - camX * 0.9;
      ctx.save();
      ctx.translate(px, p.y);
      ctx.rotate(p.rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}


// --- src/engine/camera.js ---
/**
 * 2D Dynamic Fighting Game Camera
 * Keeps both fighters centered, enforces visible screen bounds,
 * and handles impact screen shake.
 */

class Camera {
  constructor(viewportWidth, viewportHeight) {
    this.width = viewportWidth;
    this.height = viewportHeight;
    this.x = 0;
    this.y = 0;
    this.shakeIntensity = 0;
    this.shakeDuration = 0;
    this.maxFighterDist = viewportWidth - 64; // Max distance between fighters on screen
  }

  shake(intensity = 5, duration = 6) {
    this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    this.shakeDuration = Math.max(this.shakeDuration, duration);
  }

  update(p1, p2, stageBounds) {
    // 1. Enforce max distance separation between fighters so they never spread off screen
    const leftFighter = p1.x < p2.x ? p1 : p2;
    const rightFighter = p1.x < p2.x ? p2 : p1;
    const dist = rightFighter.x - leftFighter.x;

    if (dist > this.maxFighterDist) {
      const excess = (dist - this.maxFighterDist) / 2;
      leftFighter.x += excess;
      rightFighter.x -= excess;
    }

    // 2. Center camera between both fighters
    const midX = (p1.x + p2.x) / 2;
    const targetX = midX - this.width / 2;

    // Smooth camera damping
    this.x += (targetX - this.x) * 0.18;

    // 3. Clamp camera within stage bounds
    const minCamX = stageBounds.minX + 20;
    const maxCamX = stageBounds.maxX - this.width - 20;
    this.x = Math.max(minCamX, Math.min(maxCamX, this.x));

    // 4. Handle screen shake
    if (this.shakeDuration > 0) {
      this.shakeDuration--;
      if (this.shakeDuration === 0) {
        this.shakeIntensity = 0;
      }
    }
  }

  // Get current visible screen boundaries for clamping fighters
  getViewportBounds() {
    return {
      minX: this.x + 28,
      maxX: this.x + this.width - 28
    };
  }

  getRenderOffset() {
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeDuration > 0) {
      shakeX = (Math.random() - 0.5) * this.shakeIntensity;
      shakeY = (Math.random() - 0.5) * this.shakeIntensity;
    }

    return {
      x: this.x + shakeX,
      y: this.y + shakeY
    };
  }
}


// --- src/engine/physics.js ---
/**
 * 2D Fighting Game Physics & Collision Resolver
 * Manages pushbox mutual exclusion, corner pushing, hitbox-to-hurtbox detection,
 * and projectile clashing.
 */

class PhysicsEngine {
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


// --- src/ui/hud.js ---
/**
 * Authentic Arcade HUD
 * Renders segmented health bars with trailing damage, round victory markers,
 * 99-second match timer, combo counters, announcer banners, special mode badges,
 * character select screen, and tournament stage banners.
 */

class HUD {
  constructor(width, height) {
    this.width = width;
    this.height = height;

    this.timer = 99;
    this.timerTicks = 0;
    this.timerStopped = false;

    this.bannerText = '';
    this.bannerSubtext = '';
    this.bannerTimer = 0;
    this.bannerColor = '#facc15';
    this.bannerScale = 1;
  }

  resetTimer() {
    this.timer = 99;
    this.timerTicks = 0;
    this.timerStopped = false;
  }

  showBanner(text, subtext = '', duration = 90, color = '#facc15') {
    this.bannerText = text;
    this.bannerSubtext = subtext;
    this.bannerTimer = duration;
    this.bannerColor = color;
    this.bannerScale = 1.4;
  }

  update() {
    if (!this.timerStopped && this.timer > 0) {
      this.timerTicks++;
      if (this.timerTicks >= 60) {
        this.timerTicks = 0;
        this.timer--;
      }
    }

    if (this.bannerTimer > 0) {
      this.bannerTimer--;
      if (this.bannerScale > 1.0) {
        this.bannerScale -= 0.05;
      }
    }
  }

  render(ctx, p1, p2, input, gameMode = 'VERSUS_2P', tournamentStage = 1) {
    const w = this.width;

    // 1. HEALTH BARS
    this.renderHealthBar(ctx, p1, 40, 24, 250, 16, false);
    this.renderHealthBar(ctx, p2, w - 290, 24, 250, 16, true);

    // 2. CHARACTER NAMES & SPECIAL MODE BADGES
    ctx.save();
    ctx.font = 'bold 15px "Courier New", monospace';
    ctx.textBaseline = 'top';

    // P1 Name
    ctx.fillStyle = '#000000';
    ctx.fillText(p1.name, 42, 44);
    ctx.fillStyle = '#facc15';
    ctx.fillText(p1.name, 40, 43);

    // P1 Mode Badge (EASY vs CLASSIC)
    const p1Mode = input ? input.getSpecialMode('p1') : 'easy';
    this.renderModeBadge(ctx, p1Mode, 40 + ctx.measureText(p1.name).width + 8, 43);

    // P2 Name
    const p2TextW = ctx.measureText(p2.name).width;
    ctx.fillStyle = '#000000';
    ctx.fillText(p2.name, w - 40 - p2TextW + 2, 44);
    ctx.fillStyle = '#facc15';
    ctx.fillText(p2.name, w - 40 - p2TextW, 43);

    // P2 Mode Badge (EASY vs CLASSIC)
    const p2Mode = input ? input.getSpecialMode('p2') : 'easy';
    this.renderModeBadge(ctx, p2Mode, w - 40 - p2TextW - 74, 43);

    // 3. ROUND VICTORY ICONS (V Medallions)
    this.renderRoundIcons(ctx, p1.roundsWon, 40, 62, false);
    this.renderRoundIcons(ctx, p2.roundsWon, w - 40, 62, true);

    // 4. MATCH TIMER (Center 99s)
    this.renderTimer(ctx, w / 2, 24);

    // Tournament Stage Sub-banner
    if (gameMode === 'TOURNAMENT') {
      ctx.font = 'bold 11px "Impact", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#f59e0b';
      ctx.fillText(`STAGE ${tournamentStage} / 8`, w / 2, 58);
    }

    // 5. COMBO COUNTERS
    this.renderCombos(ctx, p1, 40, 90, false);
    this.renderCombos(ctx, p2, w - 40, 90, true);

    // 6. ANNOUNCER BANNERS ("FIGHT!", "ROUND 1", "K.O.!")
    this.renderBanner(ctx);

    ctx.restore();
  }

  renderModeBadge(ctx, mode, x, y) {
    ctx.save();
    const isEasy = mode === 'easy';
    ctx.font = 'bold 9px "Segoe UI", sans-serif';
    ctx.fillStyle = isEasy ? '#15803d' : '#854d0e';
    ctx.fillRect(x, y - 1, 64, 14);
    ctx.strokeStyle = isEasy ? '#22c55e' : '#eab308';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y - 1, 64, 14);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(isEasy ? '🟢 EASY' : '🟡 CLASSIC', x + 5, y + 1);
    ctx.restore();
  }

  renderHealthBar(ctx, player, x, y, width, height, flip) {
    const hpRatio = Math.max(0, player.health / player.maxHealth);
    const displayRatio = Math.max(0, player.displayHealth / player.maxHealth);

    ctx.fillStyle = '#1c1917';
    ctx.fillRect(x - 3, y - 3, width + 6, height + 6);

    ctx.fillStyle = '#991b1b';
    ctx.fillRect(x, y, width, height);

    ctx.fillStyle = '#f97316';
    if (!flip) {
      ctx.fillRect(x, y, width * displayRatio, height);
    } else {
      const w = width * displayRatio;
      ctx.fillRect(x + width - w, y, w, height);
    }

    ctx.fillStyle = hpRatio < 0.25 ? '#ef4444' : '#facc15';
    if (!flip) {
      ctx.fillRect(x, y, width * hpRatio, height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(x, y, width * hpRatio, 3);
    } else {
      const w = width * hpRatio;
      ctx.fillRect(x + width - w, y, w, height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fillRect(x + width - w, y, w, 3);
    }

    ctx.fillStyle = '#1c1917';
    for (let i = 1; i < 6; i++) {
      ctx.fillRect(x + (width / 6) * i - 1, y, 2, height);
    }

    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.strokeRect(x - 2, y - 2, width + 4, height + 4);
  }

  renderTimer(ctx, centerX, y) {
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(centerX - 24, y - 4, 48, 30);
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - 24, y - 4, 48, 30);

    ctx.font = 'bold 22px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const tStr = this.timer.toString().padStart(2, '0');
    ctx.fillStyle = this.timer <= 10 ? '#ef4444' : '#facc15';
    ctx.fillText(tStr, centerX, y + 11);
    ctx.restore();
  }

  renderRoundIcons(ctx, roundsWon, x, y, flip) {
    ctx.save();
    for (let i = 0; i < 2; i++) {
      const ix = flip ? x - (i * 22) - 16 : x + (i * 22);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(ix + 8, y + 8, 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#eab308';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (i < roundsWon) {
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 12px "Courier New", monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('V', ix + 8, y + 9);
      }
    }
    ctx.restore();
  }

  renderCombos(ctx, player, x, y, flip) {
    if (player.comboCount >= 2) {
      ctx.save();
      ctx.font = 'bold 16px "Impact", "Arial Black", sans-serif';
      ctx.textAlign = flip ? 'right' : 'left';
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`${player.comboCount} HITS!`, flip ? x - 2 : x + 2, y + 2);
      ctx.fillStyle = '#ffea00';
      ctx.fillText(`${player.comboCount} HITS!`, x, y);
      ctx.restore();
    }
  }

  renderBanner(ctx) {
    if (this.bannerTimer <= 0 || !this.bannerText) return;

    ctx.save();
    ctx.translate(this.width / 2, this.height / 2 - 20);
    ctx.scale(this.bannerScale, this.bannerScale);

    ctx.font = '900 48px "Impact", "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.strokeText(this.bannerText, 0, 0);

    ctx.fillStyle = '#991b1b';
    ctx.fillText(this.bannerText, 3, 4);

    ctx.fillStyle = this.bannerColor;
    ctx.fillText(this.bannerText, 0, 0);

    if (this.bannerSubtext) {
      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 4;
      ctx.strokeText(this.bannerSubtext, 0, 42);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(this.bannerSubtext, 0, 42);
    }

    ctx.restore();
  }

  // --- CHARACTER SELECT SCREEN ---
  renderCharacterSelect(ctx, roster, p1Idx, p2Idx, p1Ready, p2Ready, isTournament = false, matchStartCountdown = -1) {
    ctx.save();
    ctx.fillStyle = 'rgba(10, 10, 15, 0.94)';
    ctx.fillRect(0, 0, this.width, this.height);

    // Title
    ctx.font = '900 30px "Impact", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ef4444';
    ctx.fillText('SELECT YOUR FIGHTER', this.width / 2, 40);

    ctx.font = 'bold 12px "Courier New", monospace';
    ctx.fillStyle = '#facc15';
    if (isTournament) {
      ctx.fillText('P1: [W/A/S/D] Select  •  [F / ENTER] Confirm  •  [V] Cancel', this.width / 2, 64);
    } else {
      ctx.fillText('P1: [WASD] & [F] Confirm [V] Cancel  •  P2: [ARROWS] & [Num 4 / I] Confirm [Num 1 / K] Cancel', this.width / 2, 64);
    }

    // 2-Row Grid of Character Cards (Row 0: 5 fighters, Row 1: 4 fighters centered)
    const cardW = 90;
    const cardH = 104;
    const gapX = 14;
    const startX0 = (this.width - (5 * cardW + 4 * gapX)) / 2;
    const startX1 = (this.width - (4 * cardW + 3 * gapX)) / 2;
    const cardY0 = 92;
    const cardY1 = 216;

    roster.forEach((char, idx) => {
      const isTopRow = idx < 5;
      const col = isTopRow ? idx : idx - 5;
      const cx = (isTopRow ? startX0 : startX1) + col * (cardW + gapX);
      const cy = isTopRow ? cardY0 : cardY1;
      const isP1 = p1Idx === idx;
      const isP2 = !isTournament && p2Idx === idx;

      // Card Background
      ctx.fillStyle = '#1c1917';
      ctx.fillRect(cx, cy, cardW, cardH);

      // Selection outlines
      if (isP1 && isP2) {
        ctx.strokeStyle = '#a855f7'; // Mixed purple
        ctx.lineWidth = 4;
      } else if (isP1) {
        ctx.strokeStyle = '#3b82f6'; // P1 Blue
        ctx.lineWidth = 4;
      } else if (isP2) {
        ctx.strokeStyle = '#ef4444'; // P2 Red
        ctx.lineWidth = 4;
      } else {
        ctx.strokeStyle = '#3f3f46';
        ctx.lineWidth = 2;
      }
      ctx.strokeRect(cx, cy, cardW, cardH);

      // Character Color Swatch Banner
      ctx.fillStyle = char.color;
      ctx.fillRect(cx + 6, cy + 6, cardW - 12, 36);

      // Character Name
      ctx.font = '900 13px "Impact", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(char.name, cx + cardW / 2, cy + 58);

      // Country / Style
      ctx.font = 'bold 9px "Segoe UI", sans-serif';
      ctx.fillStyle = '#a1a1aa';
      ctx.fillText(char.country, cx + cardW / 2, cy + 73);
      ctx.fillStyle = '#facc15';
      ctx.fillText(char.style, cx + cardW / 2, cy + 86);

      // Ready Markers
      if (isP1 && p1Ready) {
        ctx.fillStyle = '#3b82f6';
        ctx.font = 'bold 10px "Impact", sans-serif';
        ctx.fillText('P1 READY!', cx + cardW / 2, cy + 98);
      }
      if (isP2 && p2Ready) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 10px "Impact", sans-serif';
        ctx.fillText('P2 READY!', cx + cardW / 2, cy + 98);
      }
    });

    // P1 Cursor badge
    const p1IsTop = p1Idx < 5;
    const p1Col = p1IsTop ? p1Idx : p1Idx - 5;
    const p1CardX = (p1IsTop ? startX0 : startX1) + p1Col * (cardW + gapX);
    const p1CardY = p1IsTop ? cardY0 : cardY1;
    ctx.fillStyle = '#3b82f6';
    ctx.fillRect(p1CardX + 4, p1CardY - 18, 28, 14);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Impact", sans-serif';
    ctx.fillText('P1', p1CardX + 18, p1CardY - 7);

    // P2 Cursor badge
    if (!isTournament) {
      const p2IsTop = p2Idx < 5;
      const p2Col = p2IsTop ? p2Idx : p2Idx - 5;
      const p2CardX = (p2IsTop ? startX0 : startX1) + p2Col * (cardW + gapX);
      const p2CardY = p2IsTop ? cardY0 : cardY1;
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(p2CardX + cardW - 32, p2CardY - 18, 28, 14);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px "Impact", sans-serif';
      ctx.fillText('P2', p2CardX + cardW - 18, p2CardY - 7);
    }

    // Ready Countdown Notification
    if (matchStartCountdown > 0) {
      const pulse = Math.floor(Date.now() / 150) % 2 === 0;
      ctx.fillStyle = pulse ? '#ef4444' : '#facc15';
      ctx.font = '900 16px "Impact", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FIGHT STARTING...', this.width / 2, this.height - 10);
    }

    ctx.restore();
  }

  // --- TOURNAMENT VICTORY SCREEN ---
  renderTournamentWin(ctx, winnerName) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 10, 30, 0.94)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.textAlign = 'center';
    ctx.font = '900 42px "Impact", sans-serif';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 8;
    ctx.strokeText('TOURNAMENT CHAMPION!', this.width / 2, 90);
    ctx.fillStyle = '#facc15';
    ctx.fillText('TOURNAMENT CHAMPION!', this.width / 2, 90);

    ctx.font = 'bold 24px "Impact", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`${winnerName} CONQUERED THE WORLD!`, this.width / 2, 140);

    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('You have defeated all rivals and vanquished M. Bison.', this.width / 2, 190);
    ctx.fillText('You are the supreme Street Fighter World Warrior!', this.width / 2, 215);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 16px "Courier New", monospace';
    ctx.fillText('PRESS [ENTER] OR [SPACE] TO PLAY AGAIN', this.width / 2, 280);

    ctx.restore();
  }
}


// --- src/entities/fighter.js ---
/**
 * Base Fighter Class
 * Implements 60fps physics, state machine, frame data, hitboxes,
 * hurtboxes, pushboxes, blocking mechanics, hitstop, knockdown,
 * screen boundary clamping, and Easy vs Classic special move execution.
 */


const FighterState = {
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

class Fighter {
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


// --- src/entities/character_renderer.js ---
/**
 * Arcade Character Procedural Renderer
 * Renders all 5 Street Fighter II roster characters:
 * - RYU: White Gi, Red Headband
 * - KEN: Crimson Gi, Flowing Blonde Hair
 * - CHUN-LI: Blue Qipao, White Boots, Ox Horn Buns, Spiked Cuffs
 * - GUILE: Green Camo Fatigues, Golden Flat-Top
 * - M. BISON: Red Dictator Uniform, Silver Pauldrons, Officer Cap
 */


class CharacterRenderer {
  static render(ctx, fighter) {
    const name = fighter.name;
    if (name === 'CHUN-LI') {
      this.renderChunLi(ctx, fighter);
    } else if (name === 'GUILE') {
      this.renderGuile(ctx, fighter);
    } else if (name === 'BISON' || name === 'M. BISON' || name === 'M.BISON') {
      this.renderBison(ctx, fighter);
    } else if (name === 'BLANKA') {
      this.renderBlanka(ctx, fighter);
    } else if (name === 'E. HONDA' || name === 'E.HONDA' || name === 'EHONDA') {
      this.renderEhonDa(ctx, fighter);
    } else if (name === 'ZANGIEF') {
      this.renderZangief(ctx, fighter);
    } else if (name === 'DHALSIM') {
      this.renderDhalsim(ctx, fighter);
    } else {
      this.renderShotokan(ctx, fighter);
    }
  }

  // ==========================================
  // RYU & KEN (SHOTOKAN)
  // ==========================================
  static renderShotokan(ctx, fighter) {
    const s = fighter.state;
    const t = fighter.animFrame;
    const st = fighter.stateTimer;
    const bob = Math.sin(t * 0.1) * 2;
    const hy = -80 + bob;

    switch (s) {
      case FighterState.IDLE:
        // Rear Leg with shade
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16, -42 + bob, 14, 42 - bob);
        // Lead Leg
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(4, -40 + bob, 14, 40 - bob);
        // Bare Feet with toes
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-18, -4, 18, 5);
        ctx.fillRect(4, -4, 20, 5);
        // Gi Torso
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-14, -70 + bob, 26, 32);
        // V-Neck Chest Musculature
        ctx.fillStyle = fighter.skinColor;
        ctx.beginPath();
        ctx.moveTo(-4, -70 + bob);
        ctx.lineTo(4, -70 + bob);
        ctx.lineTo(0, -56 + bob);
        ctx.closePath();
        ctx.fill();
        // Tied Black Belt with fluttering ends
        this.drawBelt(ctx, fighter, 0, -40 + bob);
        // Detailed Head with expression
        this.drawShotokanHead(ctx, fighter, 2, hy, 'normal');
        // Four Limbs - Rear Arm (Guard)
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-18, -68 + bob, 10, 16);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-16, -54 + bob, 8, 14);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-15, -44 + bob, 9, 8);
        // Four Limbs - Lead Arm (Forward Guard)
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(6, -66 + bob, 11, 14);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(12, -58 + bob, 9, 14);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(16, -62 + bob, 10, 10);
        break;

      case FighterState.WALK_FWD:
      case FighterState.WALK_BACK:
        const stride = Math.sin(t * 0.22) * 7;
        const armSwing = Math.sin(t * 0.22) * 5;
        // Striding Legs
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16 + stride, -42, 14, 42);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(4 - stride, -40, 14, 40);
        // Bare Feet
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-18 + stride, -4, 18, 5);
        ctx.fillRect(4 - stride, -4, 20, 5);
        // Gi Torso
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-14, -70, 26, 32);
        // Chest
        ctx.fillStyle = fighter.skinColor;
        ctx.beginPath();
        ctx.moveTo(-4, -70);
        ctx.lineTo(4, -70);
        ctx.lineTo(0, -56);
        ctx.closePath();
        ctx.fill();
        this.drawBelt(ctx, fighter, 0, -40);
        this.drawShotokanHead(ctx, fighter, 2, -80, 'normal');
        // Swinging Arms in Combat Guard (4 Limbs!)
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-18 - armSwing, -68, 10, 15);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-16 - armSwing, -55, 8, 13);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-15 - armSwing, -45, 9, 8);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(6 + armSwing, -66, 11, 14);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(12 + armSwing, -56, 9, 13);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(16 + armSwing, -50, 10, 9);
        break;

      case FighterState.CROUCH:
        // Crouching Bent Legs
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-20, -46, 18, 22);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(2, -46, 20, 22);
        // Bare Feet Planted
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-22, -5, 20, 5);
        ctx.fillRect(2, -5, 22, 5);
        // Lowered Torso
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-15, -64, 28, 26);
        this.drawBelt(ctx, fighter, 0, -40);
        this.drawShotokanHead(ctx, fighter, 4, -72, 'normal');
        // Guard Arms in Low Stance (Previously Missing!)
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-18, -62, 9, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-16, -52, 7, 10);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-15, -44, 9, 8);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(8, -60, 10, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(12, -50, 8, 10);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(14, -42, 10, 9);
        break;

      case FighterState.JUMP:
        // Tucked Aerial Legs
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-14, -60, 14, 24);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(2, -64, 15, 22);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-16, -38, 14, 6);
        ctx.fillRect(4, -44, 14, 6);
        // Aerial Torso
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-12, -86, 24, 28);
        this.drawBelt(ctx, fighter, 0, -60);
        this.drawShotokanHead(ctx, fighter, 2, -94, 'normal');
        // Aerial Guard Arms (Previously Missing!)
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16, -84, 8, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-18, -74, 8, 12);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-20, -64, 10, 10);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(6, -82, 9, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(10, -72, 8, 12);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(14, -62, 10, 10);
        break;

      case FighterState.BLOCKSTUN:
        // Braced Legs
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16, -40, 14, 40);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(4, -38, 14, 38);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-18, -4, 18, 5);
        ctx.fillRect(4, -4, 20, 5);
        // Torso
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-12, -70, 26, 32);
        this.drawBelt(ctx, fighter, 0, -40);
        this.drawShotokanHead(ctx, fighter, -2, -80, 'normal');
        // Double Forearm Cross-Block (Classic Shotokan Guard!)
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-8, -68, 10, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(0, -76, 8, 20);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(0, -84, 10, 10);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(4, -64, 10, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(6, -70, 8, 18);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(6, -78, 10, 10);
        break;

      case FighterState.HITSTUN:
        // Reeling Legs
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-20, -38, 14, 38);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(0, -36, 14, 36);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-22, -4, 18, 5);
        ctx.fillRect(0, -4, 18, 5);
        // Torso Recoiling Backwards
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-16, -68, 26, 32);
        this.drawBelt(ctx, fighter, -4, -38);
        // Head Tilted Back with Wincing Hurt Expression
        this.drawShotokanHead(ctx, fighter, -10, -78, 'hurt');
        // Arms Flung Back from Impact
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-24, -66, 10, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-26, -56, 8, 12);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-28, -46, 10, 10);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-4, -62, 10, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-2, -52, 8, 12);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(0, -42, 10, 10);
        break;

      case FighterState.LIGHT_PUNCH:
        // Standing legs
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16, -42, 14, 42);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(4, -40, 14, 40);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-18, -4, 16, 5);
        ctx.fillRect(4, -4, 16, 5);
        // Torso & head
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-12, -70, 26, 32);
        this.drawBelt(ctx, fighter, 0, -40);
        this.drawShotokanHead(ctx, fighter, 2, -80, 'normal');
        // Rear guard fist
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-16, -62, 10, 10);
        // Lead jab
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(6, -66, 14, 10);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(18, -66, 24, 9);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(42, -68, 12, 12);
        break;

      case FighterState.HEAVY_PUNCH:
        // Legs
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16, -40, 14, 40);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(4, -40, 14, 40);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-18, -4, 18, 5);
        ctx.fillRect(4, -4, 18, 5);
        // Torso & head
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-10, -70, 28, 32);
        this.drawBelt(ctx, fighter, 4, -40);
        this.drawShotokanHead(ctx, fighter, 8, -80, 'normal');
        // Rear Arm Cocked at Hip (Hikite Karate Chamber)
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-14, -64, 10, 10);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-16, -56, 8, 8);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-18, -50, 10, 10);
        // Lead Power Punch
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(14, -66, 38, 11);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(52, -69, 14, 15);
        break;

      case FighterState.LIGHT_KICK:
        // Plant leg (single rear leg on ground)
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-14, -40, 14, 40);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-16, -4, 16, 5);
        // Torso & head
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-12, -70, 24, 32);
        this.drawBelt(ctx, fighter, 0, -40);
        this.drawShotokanHead(ctx, fighter, 0, -80, 'normal');
        // Guard arms
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-14, -62, 10, 10);
        ctx.fillRect(4, -62, 10, 10);
        // Snapped kick leg
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(4, -48, 14, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(16, -46, 24, 10);
        ctx.fillRect(38, -48, 10, 12);
        break;

      case FighterState.HEAVY_KICK:
        // Plant leg
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-14, -40, 14, 40);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-16, -4, 16, 5);
        // Leaning Torso & head
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-18, -68, 22, 30);
        this.drawBelt(ctx, fighter, -4, -40);
        this.drawShotokanHead(ctx, fighter, -12, -78, 'normal');
        // Balance Guard Arms (Previously Missing!)
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16, -66, 10, 10);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-14, -58, 9, 9);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(2, -62, 10, 10);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(8, -54, 8, 8);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(12, -48, 9, 9);
        // High Roundhouse Kick Leg
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(10, -70, 20, 14);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(28, -72, 20, 12);
        ctx.fillRect(46, -76, 12, 16);
        break;

      case FighterState.SWEEP:
        // Crouching Plant Leg
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16, -26, 14, 26);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-18, -4, 16, 5);
        // Torso & head
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-16, -38, 26, 24);
        this.drawBelt(ctx, fighter, 0, -22);
        this.drawShotokanHead(ctx, fighter, -2, -48, 'normal');
        // Both Arms Supporting & Guarding (Previously Missing!)
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-18, -32, 8, 10);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-20, -22, 7, 10);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-22, -12, 9, 8); // Hand on floor
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-4, -36, 8, 10);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(2, -30, 9, 8);
        // Low Sweeping Leg
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(4, -18, 18, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(22, -14, 28, 12);
        ctx.fillRect(50, -18, 14, 16);
        break;

      case FighterState.HADOUKEN:
        // Standing braced stance
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16, -38, 14, 38);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(2, -38, 14, 38);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-18, -4, 16, 5);
        ctx.fillRect(2, -4, 18, 5);

        if (st < 10) {
          // Gathering Ki Phase
          ctx.fillStyle = fighter.giColor;
          ctx.fillRect(-14, -68, 26, 32);
          this.drawBelt(ctx, fighter, 0, -38);
          this.drawShotokanHead(ctx, fighter, 4, -78, 'normal');
          // Both hands drawn back holding the ki sphere
          ctx.fillStyle = fighter.gloveColor;
          ctx.fillRect(-22, -54, 14, 14);
          ctx.fillRect(-16, -48, 14, 14);
          const aura = Math.min(14, st * 1.5);
          ctx.fillStyle = '#00e5ff';
          ctx.beginPath();
          ctx.arc(-16, -46, aura, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Thrusting Release Phase - Roaring Battle Cry!
          ctx.fillStyle = fighter.giColor;
          ctx.fillRect(-10, -68, 28, 32);
          this.drawBelt(ctx, fighter, 4, -38);
          this.drawShotokanHead(ctx, fighter, 8, -78, 'kiai');
          // Both arms thrust forward in unison releasing the Hadouken!
          ctx.fillStyle = fighter.giShade;
          ctx.fillRect(2, -60, 12, 10);
          ctx.fillStyle = fighter.skinColor;
          ctx.fillRect(12, -60, 20, 10);
          ctx.fillStyle = fighter.gloveColor;
          ctx.fillRect(32, -64, 12, 16);
          ctx.fillStyle = fighter.giColor;
          ctx.fillRect(6, -54, 12, 10);
          ctx.fillStyle = fighter.skinColor;
          ctx.fillRect(16, -54, 24, 12);
          ctx.fillStyle = fighter.gloveColor;
          ctx.fillRect(38, -58, 14, 18);
        }
        break;

      case FighterState.SHORYUKEN:
        const jy = -70;
        // Torso & Rising Dragon Punch Head with Roaring Battle Cry
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-10, jy - 20, 20, 36);
        this.drawBelt(ctx, fighter, 0, jy + 14);
        this.drawShotokanHead(ctx, fighter, 2, jy - 30, 'kiai');
        // Lead Arm Skyward Thrust
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(2, jy - 46, 10, 28);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(0, jy - 58, 14, 14);
        // Rear Arm Tucked Across Ribs
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-10, jy - 14, 8, 12);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-8, jy - 4, 9, 9);
        // High Knee and Trailing Leg (Full 4 Limbs!)
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(2, jy + 14, 14, 16);
        ctx.fillRect(-12, jy + 14, 12, 26);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(4, jy + 28, 12, 6);
        ctx.fillRect(-12, jy + 38, 12, 6);
        break;

      case FighterState.TATSUMAKI:
        const spin = Math.sin(st * 0.45) > 0 ? 1 : -1;
        ctx.save();
        ctx.scale(spin, 1);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-12, -74, 24, 28);
        this.drawShotokanHead(ctx, fighter, 0, -84, 'normal');
        // Balancing Outstretched Arms (Previously Missing!)
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16, -70, 8, 10);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-26, -70, 12, 8);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(-34, -72, 9, 9);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(10, -70, 8, 10);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(18, -70, 12, 8);
        ctx.fillStyle = fighter.gloveColor;
        ctx.fillRect(28, -72, 9, 9);
        // Horizontal Spinning Kick Leg
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(6, -64, 18, 12);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(24, -64, 20, 12);
        ctx.fillRect(44, -66, 12, 16);
        // Trailing Bent Leg
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-12, -46, 14, 16);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-12, -32, 12, 6);
        ctx.restore();
        break;

      case FighterState.KNOCKDOWN:
      case FighterState.DEFEATED:
        if (fighter.y < 318) {
          ctx.save();
          ctx.rotate(-0.8);
          ctx.fillStyle = fighter.giColor;
          ctx.fillRect(-12, -40, 24, 34);
          this.drawShotokanHead(ctx, fighter, -12, -50, 'hurt');
          ctx.restore();
        } else {
          ctx.fillStyle = fighter.giColor;
          ctx.fillRect(-35, -14, 45, 14);
          ctx.fillStyle = fighter.skinColor;
          ctx.fillRect(10, -12, 25, 12);
          // Recumbent Arm
          ctx.fillStyle = fighter.gloveColor;
          ctx.fillRect(-48, -10, 8, 8);
          this.drawShotokanHead(ctx, fighter, -42, -10, 'hurt');
        }
        break;

      case FighterState.VICTORY:
        // Standing Proud
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(-14, -72, 28, 34);
        this.drawBelt(ctx, fighter, 0, -42);
        this.drawShotokanHead(ctx, fighter, 0, -84, 'victory');
        // Legs in Gi with Bare Feet
        ctx.fillStyle = fighter.giShade;
        ctx.fillRect(-16, -42, 14, 42);
        ctx.fillStyle = fighter.giColor;
        ctx.fillRect(4, -42, 14, 42);
        ctx.fillStyle = fighter.skinColor;
        ctx.fillRect(-18, -4, 18, 5);
        ctx.fillRect(4, -4, 20, 5);

        if (fighter.name === 'RYU') {
          // Ryu's Iconic Folded Arms Victory Pose with fluttering red headband
          ctx.fillStyle = fighter.giShade;
          ctx.fillRect(-18, -70, 10, 14);
          ctx.fillStyle = fighter.skinColor;
          ctx.fillRect(-14, -62, 18, 9);
          ctx.fillStyle = fighter.gloveColor;
          ctx.fillRect(2, -62, 11, 10);
          ctx.fillStyle = fighter.giColor;
          ctx.fillRect(8, -70, 10, 14);
          ctx.fillStyle = fighter.skinColor;
          ctx.fillRect(-6, -58, 18, 9);
          ctx.fillStyle = fighter.gloveColor;
          ctx.fillRect(-12, -58, 11, 10);
        } else {
          // Ken's Iconic V-For-Victory Pose with Charismatic Smirk
          // Left hand on hip
          ctx.fillStyle = fighter.giShade;
          ctx.fillRect(-16, -70, 9, 12);
          ctx.fillStyle = fighter.skinColor;
          ctx.fillRect(-18, -60, 8, 12);
          ctx.fillStyle = fighter.gloveColor;
          ctx.fillRect(-18, -50, 9, 9);
          // Right arm held high with V sign
          ctx.fillStyle = fighter.giColor;
          ctx.fillRect(8, -70, 10, 12);
          ctx.fillStyle = fighter.skinColor;
          ctx.fillRect(10, -84, 9, 16);
          ctx.fillStyle = fighter.gloveColor;
          ctx.fillRect(9, -94, 11, 10);
          ctx.fillStyle = fighter.skinColor;
          ctx.fillRect(9, -100, 7, 7); // V peace fingers
        }
        break;

      default:
        this.renderShotokan(ctx, { ...fighter, state: FighterState.IDLE });
        break;
    }
  }

  static drawShotokanHead(ctx, fighter, hx, hy, expression = 'normal') {
    const isRyu = fighter.name === 'RYU';

    // Sculpted jawline and facial foundation
    ctx.fillStyle = fighter.skinColor;
    ctx.fillRect(hx - 7, hy - 4, 14, 14);
    ctx.fillRect(hx - 5, hy + 8, 10, 3); // Chin
    ctx.fillStyle = fighter.skinShade || '#f59e0b';
    ctx.fillRect(hx - 8, hy - 1, 2, 5); // Ear

    if (isRyu) {
      // --- RYU: Cropped Spiky Black Hair & Red Headband ---
      ctx.fillStyle = fighter.hairColor || '#171717';
      // Spiky crown & sides
      ctx.fillRect(hx - 9, hy - 14, 18, 10);
      ctx.fillRect(hx - 6, hy - 18, 13, 5);
      ctx.fillRect(hx - 3, hy - 21, 6, 4); // Top spike
      ctx.fillRect(hx + 4, hy - 17, 4, 4); // Right spike
      ctx.fillRect(hx - 9, hy - 16, 4, 4); // Left spike

      // Red Headband
      if (fighter.headbandColor) {
        ctx.fillStyle = fighter.headbandColor;
        ctx.fillRect(hx - 9, hy - 6, 18, 5); // Headband wrap
        // Trailing fluttering red sash tails blowing back in the wind!
        const flutter = Math.sin(fighter.animFrame * 0.2) * 4;
        ctx.fillRect(hx - 24, hy - 5 + flutter, 16, 4);
        ctx.fillRect(hx - 20, hy - 1 + flutter * 0.7, 13, 3);
        // Ribbon knot at back of head
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(hx - 10, hy - 5, 3, 5);
      }

      // Facial Features & Expression
      if (expression === 'hurt') {
        // Clenched shut wincing eye
        ctx.fillStyle = '#171717';
        ctx.fillRect(hx, hy - 2, 6, 2);
        // Open grimacing mouth
        ctx.fillStyle = '#171717';
        ctx.fillRect(hx + 1, hy + 4, 6, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx + 2, hy + 4, 4, 2);
      } else if (expression === 'kiai') {
        // Roaring battle cry (Hadouken / Shoryuken)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx, hy - 2, 7, 4); // Wide eye
        ctx.fillStyle = '#171717';
        ctx.fillRect(hx + 3, hy - 2, 3, 3);
        // Furrowed heavy warrior brow
        ctx.fillStyle = '#171717';
        ctx.fillRect(hx - 1, hy - 4, 8, 2);
        // Nose bridge
        ctx.fillStyle = fighter.skinShade || '#f59e0b';
        ctx.fillRect(hx + 5, hy - 1, 2, 4);
        // Wide roaring open mouth
        ctx.fillStyle = '#171717';
        ctx.fillRect(hx + 1, hy + 4, 7, 5);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(hx + 2, hy + 5, 5, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx + 2, hy + 4, 5, 2); // Upper teeth
      } else {
        // Stoic, intense warrior brow
        ctx.fillStyle = '#171717';
        ctx.fillRect(hx - 1, hy - 4, 8, 2);
        // Focused warrior eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx, hy - 2, 7, 3); // White sclera
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(hx + 3, hy - 2, 3, 3); // Dark pupil
        // Nose bridge
        ctx.fillStyle = fighter.skinShade || '#f59e0b';
        ctx.fillRect(hx + 5, hy - 1, 2, 4);
        // Resolute clenched mouth / grit
        ctx.fillStyle = '#171717';
        ctx.fillRect(hx + 1, hy + 5, 6, 2);
        if (expression === 'victory') {
          // Stoic noble expression
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(hx + 2, hy + 5, 4, 1);
        }
      }
    } else {
      // --- KEN: Flowing Golden Blonde Mane & Charismatic Smirk ---
      ctx.fillStyle = fighter.hairColor || '#facc15';
      // Voluminous blonde mane
      ctx.fillRect(hx - 10, hy - 14, 20, 11);
      ctx.fillRect(hx - 7, hy - 18, 15, 6);
      ctx.fillRect(hx - 4, hy - 21, 8, 4); // Crown volume
      // Flowing locks draping over collar & back of neck
      ctx.fillRect(hx - 13, hy - 8, 5, 17);
      ctx.fillRect(hx - 15, hy - 4, 4, 11);
      // Front bangs over forehead
      ctx.fillRect(hx - 5, hy - 5, 6, 3);
      // Golden highlights and shade
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(hx - 6, hy - 19, 10, 2);
      ctx.fillStyle = '#ca8a04';
      ctx.fillRect(hx - 12, hy - 2, 3, 10);

      // Facial Features & Expression
      if (expression === 'hurt') {
        // Wincing eye
        ctx.fillStyle = '#78350f';
        ctx.fillRect(hx, hy - 2, 6, 2);
        // Open grimace mouth
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(hx + 1, hy + 4, 6, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx + 2, hy + 4, 4, 2);
      } else if (expression === 'kiai') {
        // Fierce battle yell
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx, hy - 2, 7, 4);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(hx + 3, hy - 2, 3, 3);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(hx - 1, hy - 4, 8, 2);
        ctx.fillStyle = fighter.skinShade || '#f59e0b';
        ctx.fillRect(hx + 5, hy - 1, 2, 4);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(hx + 1, hy + 4, 7, 5);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(hx + 2, hy + 5, 5, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx + 2, hy + 4, 5, 2);
      } else if (expression === 'victory') {
        // Beaming charismatic victory smile with gleaming teeth!
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(hx, hy - 4, 7, 2); // Playful raised eyebrow
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx, hy - 2, 7, 3);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(hx + 3, hy - 2, 3, 3); // Bright blue iris
        ctx.fillStyle = fighter.skinShade || '#f59e0b';
        ctx.fillRect(hx + 5, hy - 1, 2, 4);
        // Big confident grin with teeth
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(hx + 1, hy + 4, 7, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx + 2, hy + 4, 5, 3);
      } else {
        // Cocky angled brow
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(hx, hy - 4, 7, 2);
        // Striking blue eyes with pupils
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx, hy - 2, 7, 3);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(hx + 3, hy - 2, 3, 3);
        // Straight nose
        ctx.fillStyle = fighter.skinShade || '#f59e0b';
        ctx.fillRect(hx + 5, hy - 1, 2, 4);
        // Signature cocky smirk / half-smile with tooth glint!
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(hx + 2, hy + 4, 6, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx + 4, hy + 4, 3, 2); // White tooth glint
      }
    }
  }

  static drawBelt(ctx, fighter, bx, by) {
    ctx.fillStyle = fighter.beltColor;
    ctx.fillRect(bx - 12, by - 4, 24, 7);
    ctx.fillRect(bx - 2, by + 3, 5, 5);
    const flutter = Math.sin(fighter.animFrame * 0.15) * 2;
    ctx.fillRect(bx - 4, by + 7, 4, 14 + flutter);
    ctx.fillRect(bx + 1, by + 7, 4, 18 - flutter);
  }

  // ==========================================
  // CHUN-LI
  // ==========================================
  static renderChunLi(ctx, fighter) {
    const s = fighter.state;
    const t = fighter.animFrame;
    const st = fighter.stateTimer;
    const bob = Math.sin(t * 0.15) * 3;
    const hy = -82 + bob;

    // Head with double ox-horn hair buns and expressive face
    const drawChunLiHead = (x, y, expression = 'normal') => {
      // Delicate fair skin & refined jaw
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(x - 7, y - 4, 14, 14);
      ctx.fillRect(x - 5, y + 8, 10, 3); // Chin

      // Dark midnight hair & bangs
      ctx.fillStyle = '#1e1b4b';
      ctx.fillRect(x - 8, y - 12, 16, 9);
      ctx.fillRect(x - 4, y - 3, 8, 3); // Forehead bangs

      // Ox Horn Buns (Odango) with white silk ribbons
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(x - 10, y - 10, 6, 0, Math.PI * 2);
      ctx.arc(x + 10, y - 10, 6, 0, Math.PI * 2);
      ctx.fill();
      // Gold bun ties
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(x - 12, y - 7, 4, 3);
      ctx.fillRect(x + 8, y - 7, 4, 3);
      // Navy bun core
      ctx.fillStyle = '#1e1b4b';
      ctx.beginPath();
      ctx.arc(x - 10, y - 10, 3, 0, Math.PI * 2);
      ctx.arc(x + 10, y - 10, 3, 0, Math.PI * 2);
      ctx.fill();

      // Fluttering white silk ribbon tails
      const rFlutter = Math.sin(t * 0.2) * 3;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x - 14, y - 5, 3, 12 + rFlutter);
      ctx.fillRect(x + 11, y - 5, 3, 12 - rFlutter);

      // Facial Features & Expression
      if (expression === 'hurt') {
        // Wincing eyes
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(x + 1, y - 2, 6, 2);
        // Open gasp mouth
        ctx.fillStyle = '#be123c';
        ctx.fillRect(x + 2, y + 4, 4, 3);
      } else if (expression === 'happy') {
        // Joyous sparkling eyes
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(x + 1, y - 3, 6, 2);
        ctx.fillRect(x + 1, y - 1, 2, 2);
        // Big radiant smile with white teeth
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(x + 1, y + 4, 6, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 2, y + 4, 4, 2);
      } else {
        // Almond-shaped anime eyes with dark iris
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y - 2, 7, 4); // White sclera
        ctx.fillStyle = '#1e1b4b';
        ctx.fillRect(x + 2, y - 2, 3, 3); // Dark iris
        ctx.fillRect(x + 1, y - 4, 6, 2); // Delicate curved eyebrow
        // Small nose
        ctx.fillStyle = '#eab308';
        ctx.fillRect(x + 5, y, 2, 2);
        // Determined rose-pink lips
        ctx.fillStyle = '#f43f5e';
        ctx.fillRect(x + 2, y + 5, 4, 2);
      }
    };

    switch (s) {
      case FighterState.IDLE:
        // Brown tights / athletic muscular legs
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-12, -44 + bob, 12, 44 - bob);
        ctx.fillRect(2, -42 + bob, 12, 42 - bob);

        // Iconic White Combat Boots with dark soles
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-14, -20, 14, 20);
        ctx.fillRect(2, -18, 14, 18);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-15, -3, 15, 3);
        ctx.fillRect(1, -3, 15, 3);

        // Blue Qipao dress with golden lining and white sash
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-13, -70 + bob, 26, 32);
        ctx.fillStyle = '#fbbf24'; // Gold trim
        ctx.fillRect(-13, -40 + bob, 26, 3);
        ctx.fillStyle = '#f8fafc'; // White waist sash
        ctx.fillRect(-11, -44 + bob, 22, 4);

        // --- FOUR LIMBS: CHUN-LI'S AUTHENTIC KENPO CRANE GUARD ---
        // Puffy blue shoulder sleeves with gold trim:
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-18, -68 + bob, 9, 10);
        ctx.fillRect(8, -68 + bob, 9, 10);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-18, -59 + bob, 9, 2);
        ctx.fillRect(8, -59 + bob, 9, 2);

        // Bare skin arms:
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-16, -58 + bob, 7, 12); // Rear arm
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(9, -58 + bob, 7, 12);  // Lead arm

        // Heavy Spiked Wristbands with silver spikes:
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-18, -48 + bob, 10, 8);
        ctx.fillRect(8, -48 + bob, 10, 8);
        ctx.fillStyle = '#cbd5e1'; // Silver spikes
        ctx.fillRect(-20, -46 + bob, 2, 4);
        ctx.fillRect(18, -46 + bob, 2, 4);

        // Kung-fu open palm hands:
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-16, -40 + bob, 6, 6);
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(10, -40 + bob, 7, 6);

        drawChunLiHead(2, hy, 'normal');
        break;

      case FighterState.WALK_FWD:
      case FighterState.WALK_BACK:
        const cStep = Math.sin(t * 0.25) * 10;
        const cBob = Math.abs(Math.sin(t * 0.25)) * 3;

        // Striding legs in tights & white boots
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-12 - cStep, -42 + cBob, 12, 42 - cBob);
        ctx.fillRect(2 + cStep, -42 + cBob, 12, 42 - cBob);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-14 - cStep, -18, 14, 18);
        ctx.fillRect(2 + cStep, -18, 14, 18);

        // Qipao torso
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-13, -70 + cBob, 26, 32);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-13, -40 + cBob, 26, 3);

        // Puffy sleeves & moving arms with spiked bracelets and hands
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-18, -68 + cBob, 8, 10);
        ctx.fillRect(8, -68 + cBob, 8, 10);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-16 + cStep * 0.4, -58 + cBob, 7, 12);
        ctx.fillRect(9 - cStep * 0.4, -58 + cBob, 7, 12);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-18 + cStep * 0.4, -48 + cBob, 9, 8);
        ctx.fillRect(8 - cStep * 0.4, -48 + cBob, 9, 8);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-16 + cStep * 0.4, -40 + cBob, 6, 6);
        ctx.fillRect(9 - cStep * 0.4, -40 + cBob, 6, 6);

        drawChunLiHead(2, -82 + cBob, 'normal');
        break;

      case FighterState.CROUCH:
        // Crouching legs in tights & white boots
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-14, -26, 14, 26);
        ctx.fillRect(2, -26, 14, 26);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-16, -16, 16, 16);
        ctx.fillRect(2, -16, 16, 16);
        // Qipao & sash
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-12, -54, 24, 28);
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(-12, -28, 24, 3);
        // Low guarded arms with spiked cuffs
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-8, -42, 16, 8);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(8, -44, 9, 9);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(16, -42, 6, 6);
        drawChunLiHead(2, -64, 'normal');
        break;

      case FighterState.JUMP:
        // Airborne jump with tucked legs in white boots
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-12, -62, 11, 22);
        ctx.fillRect(1, -62, 11, 22);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-14, -44, 14, 20);
        ctx.fillRect(1, -44, 14, 20);
        // Qipao & ribbons
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-12, -86, 24, 26);
        // Guarded arms with spiked cuffs
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-18, -76, 7, 14);
        ctx.fillRect(8, -76, 7, 14);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-19, -64, 8, 8);
        ctx.fillRect(8, -64, 8, 8);
        drawChunLiHead(1, -96, 'normal');
        break;

      case FighterState.BLOCKSTUN:
        // Double spiked cross-block
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-12, -40, 12, 40);
        ctx.fillRect(2, -38, 12, 38);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-14, -18, 14, 18);
        ctx.fillRect(2, -18, 14, 18);
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-12, -70, 24, 32);
        // Forearms crossed with spiked bracelets
        ctx.fillStyle = '#fde047';
        ctx.fillRect(4, -68, 8, 20);
        ctx.fillRect(-4, -64, 8, 20);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(3, -74, 10, 8);
        ctx.fillRect(-5, -70, 10, 8);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(13, -72, 2, 4);
        drawChunLiHead(-2, -80, 'normal');
        break;

      case FighterState.HITSTUN:
        // Flinching back in pain
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-16, -38, 12, 38);
        ctx.fillRect(-2, -36, 12, 36);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-18, -16, 14, 16);
        ctx.fillRect(-2, -16, 14, 16);
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-14, -68, 24, 32);
        // Recoiled arms
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-22, -60, 8, 12);
        ctx.fillRect(10, -56, 8, 12);
        drawChunLiHead(-4, -78, 'hurt');
        break;

      case FighterState.LIGHTNING_LEGS:
        // Rapid kick flurry animation
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-12, -68, 24, 30);
        drawChunLiHead(0, -80);
        // Multi-kick blur effect!
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-10, -38, 12, 38);
        ctx.fillStyle = '#f8fafc';
        for (let i = 0; i < 3; i++) {
          const kickY = -35 - (i * 18) + Math.sin(st * 1.5 + i) * 6;
          ctx.fillRect(12, kickY, 38, 10);
        }
        break;

      case FighterState.SPINNING_BIRD:
        // Upside down spinning helicopter kick
        ctx.save();
        ctx.translate(0, -45);
        ctx.rotate(st * 0.6);
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-12, -15, 24, 30);
        // Both legs extended out horizontally!
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-48, -6, 38, 12);
        ctx.fillRect(10, -6, 38, 12);
        ctx.restore();
        break;

      case FighterState.KIKOKEN:
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-10, -68, 24, 32);
        drawChunLiHead(4, -78);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(14, -56, 26, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(36, -60, 10, 18);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-12, -38, 12, 38);
        ctx.fillRect(2, -38, 12, 38);
        break;

      case FighterState.LIGHT_PUNCH:
      case FighterState.HEAVY_PUNCH:
        // Standing legs
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-14, -40, 12, 40);
        ctx.fillRect(2, -40, 12, 40);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-16, -16, 14, 16);
        ctx.fillRect(2, -16, 14, 16);
        // Qipao & head
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-12, -70, 24, 32);
        drawChunLiHead(2, -80);
        // Rear guard hand with spiked cuff
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-16, -64, 8, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-18, -60, 6, 8);
        // Extended palm strike
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(4, -64, 12, 10);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(14, -62, s === FighterState.HEAVY_PUNCH ? 34 : 22, 9);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(14 + (s === FighterState.HEAVY_PUNCH ? 34 : 22), -64, 6, 12);
        break;

      case FighterState.LIGHT_KICK:
        // Plant leg (single rear leg in white boot)
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-12, -40, 12, 40);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-14, -16, 14, 16);
        // Qipao & head
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-12, -70, 24, 32);
        drawChunLiHead(0, -80);
        // Snapped mid kick
        ctx.fillStyle = '#78350f';
        ctx.fillRect(4, -48, 16, 12);
        ctx.fillRect(18, -46, 22, 10);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(38, -48, 12, 14);
        break;

      case FighterState.HEAVY_KICK:
        // Chun-Li's famous vertical sky kick!
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-14, -68, 22, 30);
        drawChunLiHead(-6, -78);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(4, -76, 36, 12);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(36, -80, 14, 16);
        // Single plant leg
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-12, -40, 12, 40);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-14, -16, 14, 16);
        break;

      case FighterState.SWEEP:
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-14, -36, 24, 22);
        drawChunLiHead(-6, -46, 'normal');
        // Support arm with spiked bracelet
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-18, -28, 8, 14);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-20, -18, 9, 8);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(8, -14, 46, 12);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(48, -18, 14, 16);
        break;

      case FighterState.KNOCKDOWN:
      case FighterState.DEFEATED:
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-35, -14, 45, 14);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(10, -12, 25, 12);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-48, -10, 8, 8);
        drawChunLiHead(-42, -10, 'hurt');
        break;

      case FighterState.VICTORY:
        // Chun-Li's victory jump & peace sign!
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(-12, -74, 24, 32);
        drawChunLiHead(0, -84, 'happy');
        // Both arms raised high celebrating with peace signs
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-18, -74, 8, 22);
        ctx.fillRect(10, -74, 8, 22);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-20, -78, 10, 7);
        ctx.fillRect(9, -78, 10, 7);
        ctx.fillStyle = '#fde047';
        ctx.fillRect(-18, -86, 7, 9); // Peace fingers
        ctx.fillRect(10, -86, 7, 9);
        // Legs in boots
        ctx.fillStyle = '#78350f';
        ctx.fillRect(-12, -42, 12, 42);
        ctx.fillRect(2, -42, 12, 42);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-14, -20, 14, 20);
        ctx.fillRect(2, -20, 14, 20);
        break;

      default:
        this.renderChunLi(ctx, { ...fighter, state: FighterState.IDLE });
        break;
    }
  }

  // ==========================================
  // GUILE
  // ==========================================
  static renderGuile(ctx, fighter) {
    const s = fighter.state;
    const t = fighter.animFrame;
    const st = fighter.stateTimer;
    const bob = Math.sin(t * 0.1) * 2;
    const hy = -80 + bob;

    const drawGuileHead = (x, y, expression = 'stern') => {
      // Chiseled square jaw
      ctx.fillStyle = '#fcd34d';
      ctx.fillRect(x - 7, y - 4, 15, 15);
      ctx.fillRect(x - 5, y + 8, 12, 4); // Square chin
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(x - 8, y - 1, 2, 6); // Ear

      // Tall Sculpted Golden Flat-Top Hair
      ctx.fillStyle = '#eab308';
      ctx.fillRect(x - 10, y - 18, 20, 14);
      ctx.fillRect(x - 12, y - 22, 24, 6);
      ctx.fillStyle = '#ca8a04'; // Hair side shading
      ctx.fillRect(x - 11, y - 12, 3, 10);
      ctx.fillStyle = '#facc15'; // Top highlight
      ctx.fillRect(x - 8, y - 22, 16, 2);

      // Facial Features & Expression
      if (expression === 'hurt') {
        // Wincing eyes
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(x, y - 2, 7, 2);
        // Open grimace mouth
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(x + 1, y + 4, 7, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 2, y + 5, 5, 2);
      } else {
        // Stern military brow
        ctx.fillStyle = '#78350f';
        ctx.fillRect(x - 2, y - 4, 10, 2);
        // Steely blue eyes with pupils
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y - 2, 7, 3);
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(x + 3, y - 2, 3, 3);
        // Straight soldier nose
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(x + 5, y - 1, 3, 4);
        // Clenched military grimace / grit
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(x + 1, y + 5, 7, 3);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 2, y + 5, 5, 2);
      }
    };

    switch (s) {
      case FighterState.IDLE:
        // Camo fatigues with pocket folds
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-16, -42 + bob, 14, 42 - bob);
        ctx.fillStyle = '#166534';
        ctx.fillRect(4, -40 + bob, 14, 40 - bob);
        // Knee pocket details
        ctx.fillStyle = '#14532d';
        ctx.fillRect(-14, -28 + bob, 10, 6);
        ctx.fillRect(6, -26 + bob, 10, 6);

        // Black Combat Boots with tread
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-18, -12, 18, 12);
        ctx.fillRect(4, -12, 18, 12);
        ctx.fillStyle = '#334155';
        ctx.fillRect(-19, -3, 19, 3);
        ctx.fillRect(3, -3, 19, 3);

        // Green tank top torso & dog tags
        ctx.fillStyle = '#365314';
        ctx.fillRect(-14, -70 + bob, 28, 32);
        ctx.fillStyle = '#cbd5e1'; // Silver dog tag chain
        ctx.fillRect(-2, -64 + bob, 4, 6);

        // --- FOUR LIMBS: GUILE'S BOXER GUARD STANCE ---
        // Rear arm:
        ctx.fillStyle = '#f59e0b'; // Shaded upper bicep
        ctx.fillRect(-22, -66 + bob, 10, 14);
        ctx.fillStyle = '#fcd34d'; // Forearm raised in guard
        ctx.fillRect(-20, -56 + bob, 9, 14);
        ctx.fillStyle = '#f8fafc'; // White combat hand wrap
        ctx.fillRect(-21, -64 + bob, 10, 10);

        // Front arm (with tattoo hint and clenched taped fist):
        ctx.fillStyle = '#fcd34d'; // Muscular deltoid
        ctx.fillRect(10, -66 + bob, 12, 14);
        // American Flag tattoo hint on shoulder
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(14, -64 + bob, 5, 3);
        ctx.fillStyle = '#1d4ed8';
        ctx.fillRect(14, -61 + bob, 5, 3);
        // Forearm angled protecting chin
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(16, -58 + bob, 10, 14);
        // Lead clenched fist with white tape
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(18, -68 + bob, 11, 11);

        drawGuileHead(2, hy, 'stern');
        break;

      case FighterState.WALK_FWD:
      case FighterState.WALK_BACK:
        const gStep = Math.sin(t * 0.22) * 11;
        const gBob = Math.abs(Math.sin(t * 0.22)) * 3;

        // Striding camo pants
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-16 - gStep, -40 + gBob, 14, 40 - gBob);
        ctx.fillStyle = '#166534';
        ctx.fillRect(4 + gStep, -40 + gBob, 14, 40 - gBob);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-18 - gStep, -12, 18, 12);
        ctx.fillRect(4 + gStep, -12, 18, 12);

        // Tank top torso
        ctx.fillStyle = '#365314';
        ctx.fillRect(-14, -70 + gBob, 28, 32);

        // Arms in moving boxer guard
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(-22 + gStep * 0.4, -64 + gBob, 9, 14);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-21 + gStep * 0.4, -60 + gBob, 10, 10);

        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(12 - gStep * 0.4, -64 + gBob, 10, 14);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(16 - gStep * 0.4, -66 + gBob, 11, 11);

        drawGuileHead(2, -80 + gBob, 'stern');
        break;

      case FighterState.CROUCH:
        // Crouching camo legs & combat boots
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-18, -26, 16, 26);
        ctx.fillRect(2, -26, 16, 26);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-20, -12, 18, 12);
        ctx.fillRect(2, -12, 18, 12);
        // Tank top & head
        ctx.fillStyle = '#365314';
        ctx.fillRect(-14, -54, 28, 30);
        // Low boxer guard fists
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(-10, -44, 18, 8);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(8, -46, 10, 10);
        ctx.fillRect(-14, -46, 10, 10);
        drawGuileHead(2, -64, 'stern');
        break;

      case FighterState.JUMP:
        // Airborne jump with tucked combat boots
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-14, -60, 13, 20);
        ctx.fillRect(1, -60, 13, 20);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-16, -42, 16, 16);
        ctx.fillRect(1, -42, 16, 16);
        // Tank top & head
        ctx.fillStyle = '#365314';
        ctx.fillRect(-12, -84, 26, 26);
        // Raised fists
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(-18, -74, 8, 14);
        ctx.fillRect(8, -74, 8, 14);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-18, -62, 9, 9);
        ctx.fillRect(8, -62, 9, 9);
        drawGuileHead(1, -94, 'stern');
        break;

      case FighterState.BLOCKSTUN:
        // Double forearm boxer cross-guard
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-16, -40, 14, 40);
        ctx.fillRect(4, -38, 14, 38);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-18, -12, 18, 12);
        ctx.fillRect(4, -12, 18, 12);
        ctx.fillStyle = '#365314';
        ctx.fillRect(-12, -70, 26, 32);
        // Forearms raised blocking
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(4, -70, 10, 20);
        ctx.fillRect(-4, -66, 10, 20);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(4, -78, 11, 10);
        ctx.fillRect(-4, -74, 11, 10);
        drawGuileHead(-2, -80, 'stern');
        break;

      case FighterState.HITSTUN:
        // Recoiling torso, wincing face
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-20, -38, 14, 38);
        ctx.fillRect(0, -36, 14, 36);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-22, -12, 18, 12);
        ctx.fillRect(0, -12, 18, 12);
        ctx.fillStyle = '#365314';
        ctx.fillRect(-16, -68, 26, 32);
        // Recoiling arms
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(-24, -60, 8, 14);
        ctx.fillRect(12, -56, 8, 14);
        drawGuileHead(-6, -78, 'hurt');
        break;

      case FighterState.SONIC_BOOM:
        ctx.fillStyle = '#365314';
        ctx.fillRect(-12, -68, 26, 32);
        drawGuileHead(6, -78);
        // Both hands slashed forward to fire sonic boom
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(12, -62, 28, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(36, -66, 8, 22);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-14, -38, 14, 38);
        ctx.fillRect(2, -38, 14, 38);
        break;

      case FighterState.FLASH_KICK:
        // Somersault backflip kick in the air!
        const flipAngle = st * 0.45;
        ctx.save();
        ctx.translate(0, -60);
        ctx.rotate(-flipAngle);
        ctx.fillStyle = '#365314';
        ctx.fillRect(-12, -15, 24, 30);
        drawGuileHead(0, -26);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-6, 12, 14, 36); // Arcing kick
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-8, 38, 18, 12); // Flash streak
        ctx.restore();
        break;

      case FighterState.LIGHT_PUNCH:
        // Standing legs
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-16, -42, 14, 42);
        ctx.fillRect(4, -40, 14, 40);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-18, -12, 18, 12);
        ctx.fillRect(4, -12, 18, 12);
        // Tank top & head
        ctx.fillStyle = '#365314';
        ctx.fillRect(-14, -70, 28, 32);
        drawGuileHead(2, -80);
        // Rear guard fist
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(-20, -64, 8, 18);
        // Fast straight jab
        ctx.fillRect(8, -66, 24, 11);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(30, -68, 12, 13);
        break;

      case FighterState.HEAVY_PUNCH:
        // Heavy lunging punch
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-14, -40, 14, 40);
        ctx.fillRect(6, -38, 14, 38);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-16, -12, 18, 12);
        ctx.fillRect(6, -12, 18, 12);
        // Leaning torso
        ctx.fillStyle = '#365314';
        ctx.fillRect(-10, -70, 28, 32);
        drawGuileHead(6, -80);
        // Rear arm tucked back
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(-18, -62, 8, 16);
        // Heavy straight punch extended with powerful reach
        ctx.fillRect(12, -66, 38, 12);
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(48, -69, 14, 15);
        break;

      case FighterState.LIGHT_KICK:
        // Plant leg (single rear leg firmly planted on ground)
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-14, -42, 14, 42);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-16, -12, 18, 12);
        // Torso & head
        ctx.fillStyle = '#365314';
        ctx.fillRect(-12, -70, 26, 30);
        drawGuileHead(2, -80);
        // Guard arms
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(-18, -64, 8, 18);
        ctx.fillRect(4, -66, 10, 12);
        // Snapped kick leg (front leg lifted and striking forward)
        ctx.fillStyle = '#15803d';
        ctx.fillRect(4, -50, 16, 12); // Thigh
        ctx.fillRect(18, -48, 22, 11); // Shin
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(38, -50, 14, 13); // Combat boot
        break;

      case FighterState.HEAVY_KICK:
        // GUILE'S STRONG KICK: Iconic High Roundhouse Kick!
        // Plant leg (single rear leg angled for balance)
        ctx.fillStyle = '#14532d';
        ctx.fillRect(-16, -42, 15, 42);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-20, -12, 20, 12);
        // Torso leaning back for leverage and height
        ctx.fillStyle = '#365314';
        ctx.fillRect(-18, -68, 26, 28);
        drawGuileHead(-8, -78);
        // Guard arm across chest
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(-22, -60, 8, 16);
        ctx.fillRect(0, -66, 8, 12);
        // High Roundhouse Leg whipping up to head/chest level (-76 to -82)!
        ctx.fillStyle = '#15803d';
        ctx.fillRect(0, -62, 18, 14); // High thigh
        ctx.fillRect(16, -76, 26, 13); // High shin
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(40, -80, 16, 15); // Combat boot striking high!
        // Impact motion streak
        ctx.fillStyle = '#facc15';
        ctx.fillRect(52, -82, 5, 17);
        break;

      case FighterState.SWEEP:
        ctx.fillStyle = '#365314';
        ctx.fillRect(-14, -36, 26, 22);
        drawGuileHead(-4, -46, 'stern');
        // Ground support arm
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(-18, -30, 8, 16);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-20, -18, 10, 8);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(8, -14, 44, 12);
        break;

      case FighterState.KNOCKDOWN:
      case FighterState.DEFEATED:
        ctx.fillStyle = '#365314';
        ctx.fillRect(-35, -14, 45, 14);
        ctx.fillStyle = '#15803d';
        ctx.fillRect(10, -12, 25, 12);
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(-48, -10, 8, 8);
        drawGuileHead(-42, -10, 'hurt');
        break;

      case FighterState.VICTORY:
        // Guile pulls out his comb and combs his flat-top hair!
        ctx.fillStyle = '#365314';
        ctx.fillRect(-14, -72, 28, 34);
        drawGuileHead(0, -84, 'victory');
        // Left arm on hip
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(-20, -68, 8, 18);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-20, -50, 8, 8);
        // Right arm combing hair with pocket comb
        ctx.fillStyle = '#fcd34d';
        ctx.fillRect(6, -84, 8, 16);
        ctx.fillStyle = '#1e293b'; // Black pocket comb
        ctx.fillRect(8, -94, 6, 12);
        // Standing legs
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-16, -42, 14, 42);
        ctx.fillRect(4, -42, 14, 42);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(-18, -12, 18, 12);
        ctx.fillRect(4, -12, 18, 12);
        break;

      default:
        this.renderGuile(ctx, { ...fighter, state: FighterState.IDLE });
        break;
    }
  }

  // ==========================================
  // M. BISON (DICTATOR / BOSS)
  // ==========================================
  static renderBison(ctx, fighter) {
    const s = fighter.state;
    const t = fighter.animFrame;
    const st = fighter.stateTimer;
    const bob = Math.sin(t * 0.1) * 2;
    const hy = -82 + bob;

    const drawBisonHead = (x, y, expression = 'evil') => {
      // Pale chiseled face & jaw
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(x - 7, y - 4, 15, 14);
      ctx.fillRect(x - 5, y + 8, 11, 4); // Strong jaw/chin
      ctx.fillStyle = '#f87171';
      ctx.fillRect(x - 8, y - 1, 2, 6); // Ear

      // Officer Peaked Cap
      ctx.fillStyle = '#991b1b'; // Red cap crown
      ctx.fillRect(x - 11, y - 16, 22, 12);
      ctx.fillRect(x - 8, y - 19, 16, 4); // Peaked top
      ctx.fillStyle = '#0f172a'; // Black visor brim
      ctx.fillRect(x - 14, y - 7, 28, 4);
      // Golden Skull & Wings Insignia
      ctx.fillStyle = '#facc15';
      ctx.fillRect(x - 5, y - 14, 10, 6);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x - 2, y - 12, 4, 3); // Skull center shadow

      // Sinister Eyes & Heavy Eyebrows
      if (expression === 'hurt') {
        // Clenched shut wincing eyes
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(x - 1, y - 2, 8, 2);
        ctx.fillRect(x - 2, y - 4, 10, 2);
        // Open grimace mouth
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(x, y + 4, 8, 5);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x + 1, y + 5, 6, 2);
      } else {
        // Glowing White Psycho Eyes with sinister purple sockets
        ctx.fillStyle = '#4c0519';
        ctx.fillRect(x - 2, y - 3, 11, 5); // Shadowed eye socket
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x - 1, y - 2, 9, 3); // Pure white eyes
        ctx.fillStyle = '#c084fc';
        ctx.fillRect(x + 3, y - 2, 3, 3); // Purple psycho iris glint
        // Arched evil black brows angled down menacingly
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(x - 2, y - 5, 11, 2);
        ctx.fillRect(x + 5, y - 6, 4, 2);

        // Sharp aquiline nose
        ctx.fillStyle = '#f87171';
        ctx.fillRect(x + 5, y - 1, 3, 4);

        // Maniacal Evil Grin
        ctx.fillStyle = '#450a0a'; // Dark mouth contour
        ctx.fillRect(x, y + 4, 8, 4);
        ctx.fillStyle = '#ffffff'; // White clenched teeth
        ctx.fillRect(x + 1, y + 5, 6, 2);
        ctx.fillStyle = '#7f1d1d'; // Smirk corner crease
        ctx.fillRect(x + 7, y + 3, 2, 2);
      }
    };

    switch (s) {
      case FighterState.IDLE:
        // Dark crimson / black flowing military cape draped behind shoulders
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(-22, -68 + bob, 8, 52);
        ctx.fillRect(-26, -52 + bob, 6, 34);

        // Red military trousers
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-16, -42 + bob, 14, 42 - bob);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(4, -40 + bob, 14, 40 - bob);

        // Heavy Silver Shin Guards / Greaves & Boots
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-18, -24, 16, 24);
        ctx.fillRect(4, -24, 16, 24);
        ctx.fillStyle = '#cbd5e1'; // Greave shine highlight
        ctx.fillRect(-17, -22, 4, 20);
        ctx.fillRect(5, -22, 4, 20);
        ctx.fillStyle = '#0f172a'; // Black boot soles
        ctx.fillRect(-19, -3, 18, 4);
        ctx.fillRect(3, -3, 18, 4);

        // Red tunic torso
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-14, -70 + bob, 28, 32);
        // Gold buttons / trim
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-8, -66 + bob, 3, 20);
        ctx.fillRect(2, -66 + bob, 3, 20);
        // Black belt with gold officer buckle
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-15, -42 + bob, 30, 6);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-4, -43 + bob, 8, 8);

        // Silver Pauldrons (Shoulder Armor)
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-22, -72 + bob, 12, 11);
        ctx.fillRect(10, -72 + bob, 12, 11);
        ctx.fillStyle = '#64748b';
        ctx.fillRect(-22, -63 + bob, 12, 2);
        ctx.fillRect(10, -63 + bob, 12, 2);

        // --- FOUR LIMBS: BISON'S COMMANDING CROSSED ARMS ---
        // Rear arm (folding across chest):
        ctx.fillStyle = '#7f1d1d'; // Upper arm sleeve
        ctx.fillRect(-22, -62 + bob, 10, 16);
        ctx.fillStyle = '#94a3b8'; // Silver forearm bracer
        ctx.fillRect(-18, -50 + bob, 14, 8);
        ctx.fillStyle = '#f8fafc'; // White gloved hand tucked under right bicep
        ctx.fillRect(8, -52 + bob, 8, 7);

        // Front arm (folding across chest):
        ctx.fillStyle = '#b91c1c'; // Front upper arm sleeve
        ctx.fillRect(12, -62 + bob, 10, 16);
        ctx.fillStyle = '#991b1b'; // Forearm sleeve crossing
        ctx.fillRect(-10, -56 + bob, 22, 10);
        ctx.fillStyle = '#94a3b8'; // Silver wrist bracer
        ctx.fillRect(-6, -56 + bob, 14, 10);
        ctx.fillStyle = '#e2e8f0'; // Bracer metallic highlight
        ctx.fillRect(-4, -54 + bob, 10, 3);
        ctx.fillStyle = '#f8fafc'; // White gloved fist tucked across under left arm
        ctx.fillRect(-16, -54 + bob, 9, 8);

        drawBisonHead(2, hy, 'evil');
        break;

      case FighterState.WALK_FWD:
      case FighterState.WALK_BACK:
        const walkDir = s === FighterState.WALK_FWD ? 1 : -1;
        const bStep = Math.sin(t * 0.22) * 12;
        const bBob = Math.abs(Math.sin(t * 0.22)) * 3;

        // Cape billowing behind
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(-24 - walkDir * 4, -68 + bBob, 10, 50);

        // Legs striding with silver greaves
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-16 - bStep, -40 + bBob, 14, 40 - bBob);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(4 + bStep, -40 + bBob, 14, 40 - bBob);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-18 - bStep, -24, 16, 24);
        ctx.fillRect(4 + bStep, -24, 16, 24);

        // Tunic torso & belt
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-14, -70 + bBob, 28, 32);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-15, -42 + bBob, 30, 6);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-4, -43 + bBob, 8, 8);

        // Pauldrons
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-22, -72 + bBob, 12, 10);
        ctx.fillRect(10, -72 + bBob, 12, 10);

        // Arms swinging with white gloves and silver bracers
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-22 + bStep * 0.5, -62 + bBob, 9, 18);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-22 + bStep * 0.5, -46 + bBob, 9, 6);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-22 + bStep * 0.5, -40 + bBob, 9, 8);

        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(12 - bStep * 0.5, -62 + bBob, 9, 18);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(12 - bStep * 0.5, -46 + bBob, 9, 6);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(12 - bStep * 0.5, -40 + bBob, 9, 8);

        drawBisonHead(2, -82 + bBob, 'evil');
        break;

      case FighterState.CROUCH:
        // Crouched legs in silver greaves
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-18, -26, 16, 26);
        ctx.fillRect(2, -26, 16, 26);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-20, -18, 18, 18);
        ctx.fillRect(2, -18, 18, 18);
        // Tunic & belt
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-14, -54, 28, 30);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-22, -56, 12, 10);
        ctx.fillRect(10, -56, 12, 10);
        // Crouching arms guarded with silver bracers and white gloves
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-8, -44, 18, 8);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(10, -44, 8, 8);
        ctx.fillRect(-14, -44, 8, 8);
        drawBisonHead(2, -64, 'evil');
        break;

      case FighterState.JUMP:
        // Airborne pose with cape billowing upward
        ctx.fillStyle = '#450a0a';
        ctx.fillRect(-20, -60, 10, 40);
        // Legs tucked
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-14, -64, 14, 22);
        ctx.fillRect(2, -64, 14, 22);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-16, -44, 16, 20);
        ctx.fillRect(2, -44, 16, 20);
        // Tunic, pauldrons & head
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-12, -86, 26, 26);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-20, -88, 10, 9);
        ctx.fillRect(8, -88, 10, 9);
        // Guarded airborne arms with white fists and silver bracers
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-18, -74, 8, 14);
        ctx.fillRect(8, -74, 8, 14);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-18, -60, 8, 8);
        ctx.fillRect(8, -60, 8, 8);
        drawBisonHead(1, -96, 'evil');
        break;

      case FighterState.BLOCKSTUN:
        // Double silver cross block with sparks
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-16, -40, 14, 40);
        ctx.fillRect(4, -38, 14, 38);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-18, -22, 16, 22);
        ctx.fillRect(4, -22, 16, 22);
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-12, -70, 26, 32);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-20, -72, 10, 10);
        ctx.fillRect(8, -72, 10, 10);
        // Forearms crossed high in silver block
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(4, -72, 12, 22);
        ctx.fillRect(-4, -68, 12, 22);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(6, -78, 9, 8);
        ctx.fillRect(-2, -74, 9, 8);
        drawBisonHead(-2, -80, 'evil');
        break;

      case FighterState.HITSTUN:
        // Torso knocked back, head snapped, wincing expression
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-20, -38, 14, 38);
        ctx.fillRect(0, -36, 14, 36);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-22, -20, 16, 20);
        ctx.fillRect(0, -20, 16, 20);
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-16, -68, 26, 32);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-24, -70, 10, 10);
        ctx.fillRect(6, -70, 10, 10);
        // Arms flailed back
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-28, -62, 8, 8);
        ctx.fillRect(16, -58, 8, 8);
        drawBisonHead(-6, -78, 'hurt');
        break;

      case FighterState.PSYCHO_CRUSHER:
        if (st >= 29) {
          // Landing deceleration recovery pose (skidding on feet, hands trailing)
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(-22, -36, 16, 36);
          ctx.fillStyle = '#991b1b';
          ctx.fillRect(4, -34, 16, 34);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(-24, -20, 18, 20);
          ctx.fillRect(4, -20, 18, 20);
          // Leaning torso
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(-16, -64, 28, 30);
          drawBisonHead(4, -76, 'evil');
          // Trailing arms with silver bracers and white gloves
          ctx.fillStyle = '#cbd5e1';
          ctx.fillRect(-24, -66, 12, 10);
          ctx.fillRect(8, -66, 12, 10);
          ctx.fillStyle = '#7f1d1d';
          ctx.fillRect(-28, -60, 10, 22);
          ctx.fillRect(16, -60, 10, 22);
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(-28, -42, 10, 6);
          ctx.fillRect(16, -42, 10, 6);
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(-28, -36, 10, 8);
          ctx.fillRect(16, -36, 10, 8);
        } else {
          // Horizontal flying torpedo surrounded by blue/purple psycho fire!
          ctx.save();
          ctx.translate(0, -45);
          ctx.fillStyle = '#b91c1c';
          ctx.fillRect(-35, -12, 70, 24);
          drawBisonHead(28, 0, 'evil');
          // Spinning psycho power aura
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 4;
          ctx.strokeRect(-38, -15, 76, 30);
          ctx.restore();
        }
        break;

      case FighterState.SCISSOR_KICK:
        const rot = st * 0.4;
        ctx.save();
        ctx.translate(0, -45);
        ctx.rotate(rot);
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-14, -15, 28, 30);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(8, 0, 36, 12);
        ctx.restore();
        break;

      case FighterState.LIGHT_PUNCH:
      case FighterState.HEAVY_PUNCH:
        // Standing legs with silver shin guards
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-16, -42, 14, 42);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(4, -40, 14, 40);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-18, -24, 16, 24);
        ctx.fillRect(4, -24, 16, 24);
        // Red tunic & head
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-14, -70, 28, 32);
        drawBisonHead(2, -82, 'evil');
        // Pauldrons
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-22, -72, 12, 10);
        ctx.fillRect(10, -72, 12, 10);
        // Rear guard arm with silver bracer
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-20, -64, 8, 16);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-20, -50, 8, 6);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-20, -44, 8, 8);
        // Psycho punch extended arm
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(10, -66, 10, 12);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(20, -66, 10, 12);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(28, -66, s === FighterState.HEAVY_PUNCH ? 24 : 14, 12);
        ctx.fillStyle = '#a855f7';
        ctx.fillRect(28 + (s === FighterState.HEAVY_PUNCH ? 24 : 14), -68, 10, 14);
        break;

      case FighterState.LIGHT_KICK:
        // Plant leg (single rear leg in silver shin guard)
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-14, -42, 14, 42);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-16, -24, 16, 24);
        // Tunic, pauldrons & head
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-12, -70, 26, 32);
        drawBisonHead(0, -82, 'evil');
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-20, -72, 12, 10);
        ctx.fillRect(8, -72, 12, 10);
        // Both guard arms
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-18, -64, 8, 16);
        ctx.fillRect(4, -64, 8, 16);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-18, -48, 8, 8);
        ctx.fillRect(4, -48, 8, 8);
        // Snapped mid kick with silver shin guard
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(4, -50, 16, 12);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(18, -48, 28, 14);
        break;

      case FighterState.HEAVY_KICK:
        // High Side Kick with silver shin guard
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-16, -68, 26, 30);
        drawBisonHead(-8, -80, 'evil');
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-22, -70, 12, 10);
        ctx.fillRect(6, -70, 12, 10);
        // Guard arms
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-20, -60, 8, 14);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-20, -46, 8, 8);
        // Plant leg (single rear leg)
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-16, -42, 14, 42);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-18, -24, 16, 24);
        // High kicking leg
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(0, -60, 18, 14);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(16, -74, 32, 15);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(46, -76, 5, 18);
        break;

      case FighterState.SWEEP:
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-14, -36, 26, 22);
        drawBisonHead(-4, -46, 'evil');
        // Support arm
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-18, -30, 8, 16);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-18, -14, 8, 8);
        // Sweeping leg in silver shin guard
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(8, -14, 46, 14);
        break;

      case FighterState.KNOCKDOWN:
      case FighterState.DEFEATED:
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-35, -14, 45, 14);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(10, -12, 25, 12);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-48, -10, 8, 8);
        drawBisonHead(-42, -10, 'hurt');
        break;

      case FighterState.VICTORY:
        // Arrogant crossed arms, billowing cape, laughing evil expression!
        ctx.fillStyle = '#450a0a';
        const vFlutter = Math.sin(t * 0.2) * 6;
        ctx.fillRect(-24, -70, 10, 54 + vFlutter);
        ctx.fillRect(-30, -56, 8, 38 + vFlutter);

        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-16, -42, 14, 42);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(4, -42, 14, 42);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-18, -24, 16, 24);
        ctx.fillRect(4, -24, 16, 24);

        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(-14, -72, 28, 34);
        ctx.fillStyle = '#cbd5e1';
        ctx.fillRect(-22, -74, 12, 11);
        ctx.fillRect(10, -74, 12, 11);

        // Crossed arms
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(-22, -64, 10, 16);
        ctx.fillStyle = '#b91c1c';
        ctx.fillRect(12, -64, 10, 16);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(-6, -58, 14, 10);
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(8, -54, 8, 7);
        ctx.fillRect(-16, -56, 9, 8);

        drawBisonHead(0, -84, 'evil');
        break;

      default:
        this.renderBison(ctx, { ...fighter, state: FighterState.IDLE });
        break;
    }
  }

  // ==========================================
  // BLANKA (THE BEAST OF BRAZIL)
  // ==========================================
  static renderBlanka(ctx, fighter) {
    const s = fighter.state;
    const t = fighter.animFrame;
    const st = fighter.stateTimer;
    const bob = Math.sin(t * 0.12) * 2;
    const skin = fighter.skinColor || '#22c55e';
    const skinDark = fighter.skinShade || '#15803d';
    const hair = fighter.hairColor || '#ea580c';
    const pants = fighter.pantsColor || '#1d4ed8';
    const cuff = fighter.cuffColor || '#ca8a04';

    const drawBlankaHead = (hx, hy, expression = 'feral') => {
      // Beast head base
      ctx.fillStyle = skin;
      ctx.fillRect(hx - 10, hy - 8, 20, 16);
      ctx.fillRect(hx - 6, hy + 6, 12, 4); // Beast jaw

      // Wild flaming orange hair mane
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.moveTo(hx - 16, hy - 6);
      ctx.lineTo(hx - 24, hy - 18);
      ctx.lineTo(hx - 12, hy - 16);
      ctx.lineTo(hx - 6, hy - 26);
      ctx.lineTo(hx + 4, hy - 16);
      ctx.lineTo(hx + 12, hy - 24);
      ctx.lineTo(hx + 16, hy - 8);
      ctx.lineTo(hx + 8, hy + 4);
      ctx.lineTo(hx - 12, hy + 2);
      ctx.closePath();
      ctx.fill();

      // Facial Features & Expression
      if (expression === 'hurt') {
        // Wincing beast eye
        ctx.fillStyle = '#14532d';
        ctx.fillRect(hx + 2, hy - 3, 6, 2);
        // Screaming open mouth
        ctx.fillStyle = '#7f1d1d';
        ctx.fillRect(hx + 2, hy + 1, 8, 7);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx + 3, hy + 1, 2, 3);
        ctx.fillRect(hx + 7, hy + 1, 2, 3);
      } else {
        // Yellow beast eye with crimson pupil
        ctx.fillStyle = '#fef08a';
        ctx.fillRect(hx + 1, hy - 4, 7, 4);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(hx + 4, hy - 3, 3, 3);
        // Heavy dark brow ridge
        ctx.fillStyle = '#14532d';
        ctx.fillRect(hx, hy - 5, 9, 2);

        // Snarling open jaws with razor white fangs!
        ctx.fillStyle = '#7f1d1d'; // Dark red maw interior
        ctx.fillRect(hx + 2, hy + 1, 8, 6);
        // White canine fangs
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx + 3, hy + 1, 2, 3); // Upper fang 1
        ctx.fillRect(hx + 7, hy + 1, 2, 3); // Upper fang 2
        ctx.fillRect(hx + 5, hy + 4, 2, 3); // Lower tooth
        ctx.fillStyle = '#ef4444'; // Red tongue
        ctx.fillRect(hx + 3, hy + 4, 4, 2);
      }
    };

    switch (s) {
      case FighterState.IDLE:
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18, -32 + bob, 14, 30 - bob);
        ctx.fillStyle = skin;
        ctx.fillRect(4, -30 + bob, 14, 28 - bob);
        ctx.fillStyle = pants;
        ctx.fillRect(-16, -42 + bob, 32, 14);
        ctx.fillStyle = cuff;
        ctx.fillRect(-20, -6, 8, 4);
        ctx.fillRect(10, -6, 8, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(-22, -4, 18, 5);
        ctx.fillRect(6, -4, 18, 5);
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -64 + bob, 28, 26);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-10, -56 + bob, 8, 14);
        drawBlankaHead(6, -68 + bob, 'feral');
        ctx.fillStyle = skinDark;
        ctx.fillRect(-20, -58 + bob, 10, 20);
        ctx.fillStyle = skin;
        ctx.fillRect(12, -58 + bob, 10, 20);
        ctx.fillStyle = cuff;
        ctx.fillRect(-20, -42 + bob, 10, 4);
        ctx.fillRect(12, -42 + bob, 10, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-18, -38 + bob, 6, 6);
        ctx.fillRect(14, -38 + bob, 6, 6);
        break;

      case FighterState.WALK_FWD:
      case FighterState.WALK_BACK:
        const step = Math.sin(t * 0.25) * 8;
        const bkBob = Math.abs(Math.sin(t * 0.25)) * 3;
        ctx.fillStyle = pants;
        ctx.fillRect(-14, -40 + bkBob, 28, 14);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18 + step, -28, 12, 28);
        ctx.fillStyle = skin;
        ctx.fillRect(4 - step, -28, 12, 28);
        ctx.fillStyle = skin;
        ctx.fillRect(-12, -62 + bkBob, 26, 24);

        // Four Limbs: Beast claw arms swinging with motion
        ctx.fillStyle = skinDark;
        ctx.fillRect(-20 + step * 0.5, -56 + bkBob, 9, 18);
        ctx.fillStyle = cuff;
        ctx.fillRect(-20 + step * 0.5, -42 + bkBob, 9, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-18 + step * 0.5, -38 + bkBob, 6, 6);

        ctx.fillStyle = skin;
        ctx.fillRect(12 - step * 0.5, -56 + bkBob, 9, 18);
        ctx.fillStyle = cuff;
        ctx.fillRect(12 - step * 0.5, -42 + bkBob, 9, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(14 - step * 0.5, -38 + bkBob, 6, 6);

        drawBlankaHead(4, -66 + bkBob, 'feral');
        break;

      case FighterState.CROUCH:
        ctx.fillStyle = pants;
        ctx.fillRect(-16, -28, 30, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -46, 28, 20);
        // Low claw arms guarding ground
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18, -36, 10, 16);
        ctx.fillRect(12, -36, 10, 16);
        ctx.fillStyle = cuff;
        ctx.fillRect(-18, -24, 10, 4);
        ctx.fillRect(12, -24, 10, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-16, -20, 6, 6);
        ctx.fillRect(14, -20, 6, 6);
        drawBlankaHead(6, -50, 'feral');
        break;

      case FighterState.JUMP:
        ctx.fillStyle = pants;
        ctx.fillRect(-12, -45, 24, 12);
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -64, 26, 22);
        // Tucked beast legs
        ctx.fillRect(-16, -34, 10, 18);
        ctx.fillRect(6, -34, 10, 18);
        // Pouncing claw arms
        ctx.fillStyle = skinDark;
        ctx.fillRect(-20, -56, 8, 14);
        ctx.fillRect(10, -56, 8, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-20, -44, 7, 7);
        ctx.fillRect(10, -44, 7, 7);
        drawBlankaHead(2, -70, 'feral');
        break;

      case FighterState.BLOCKSTUN:
        // Crossed beast claw block
        ctx.fillStyle = pants;
        ctx.fillRect(-14, -38, 28, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-12, -60, 26, 24);
        ctx.fillRect(-16, -28, 12, 28);
        ctx.fillRect(4, -28, 12, 28);
        // Crossed arms
        ctx.fillStyle = skinDark;
        ctx.fillRect(-4, -60, 10, 20);
        ctx.fillRect(4, -64, 10, 20);
        ctx.fillStyle = cuff;
        ctx.fillRect(-4, -68, 10, 4);
        ctx.fillRect(4, -72, 10, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-2, -74, 7, 6);
        ctx.fillRect(6, -78, 7, 6);
        drawBlankaHead(0, -68, 'feral');
        break;

      case FighterState.HITSTUN:
        ctx.fillStyle = pants;
        ctx.fillRect(-16, -36, 28, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -58, 26, 24);
        ctx.fillRect(-18, -26, 12, 26);
        ctx.fillRect(2, -26, 12, 26);
        // Flailing arms
        ctx.fillStyle = skinDark;
        ctx.fillRect(-24, -54, 8, 14);
        ctx.fillRect(12, -50, 8, 14);
        drawBlankaHead(-4, -68, 'hurt');
        break;

      case FighterState.LIGHT_PUNCH:
      case FighterState.HEAVY_PUNCH:
        // Hunched legs
        ctx.fillStyle = pants;
        ctx.fillRect(-16, -34, 12, 16);
        ctx.fillRect(4, -34, 12, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -20, 12, 20);
        ctx.fillRect(4, -20, 12, 20);
        // Body & head
        ctx.fillRect(-14, -60, 28, 28);
        drawBlankaHead(2, -66);
        // Rear claw
        ctx.fillRect(-18, -54, 8, 16);
        // Claws swiping forward
        ctx.fillRect(12, -58, s === FighterState.HEAVY_PUNCH ? 34 : 22, 10);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(12 + (s === FighterState.HEAVY_PUNCH ? 34 : 22), -60, 6, 14);
        break;

      case FighterState.LIGHT_KICK:
        // Plant leg (single rear claw leg)
        ctx.fillStyle = pants;
        ctx.fillRect(-14, -36, 14, 18);
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -20, 14, 20);
        // Hunched body & head
        ctx.fillRect(-12, -60, 26, 26);
        drawBlankaHead(0, -66);
        // Snapped kick leg
        ctx.fillStyle = skin;
        ctx.fillRect(4, -40, 16, 12);
        ctx.fillRect(18, -38, 20, 11);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(36, -38, 6, 8);
        break;

      case FighterState.HEAVY_KICK:
        // Feral High Claw Kick
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -62, 26, 26);
        drawBlankaHead(-6, -68);
        // Plant leg
        ctx.fillStyle = pants;
        ctx.fillRect(-16, -36, 14, 18);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -20, 14, 20);
        // High beast kick
        ctx.fillRect(2, -54, 18, 13);
        ctx.fillRect(18, -68, 28, 13);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(44, -70, 7, 16);
        break;

      case FighterState.SWEEP:
        ctx.fillStyle = pants;
        ctx.fillRect(-16, -26, 28, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -38, 26, 14);
        drawBlankaHead(2, -42);
        ctx.fillStyle = skin;
        ctx.fillRect(10, -14, 42, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(50, -16, 6, 14);
        break;

      case FighterState.ELECTRIC_THUNDER:
        ctx.fillStyle = pants;
        ctx.fillRect(-18, -32, 36, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -56, 32, 26);
        drawBlankaHead(0, -62);
        ctx.fillStyle = skin;
        ctx.fillRect(-24, -52, 10, 22);
        ctx.fillRect(14, -52, 10, 22);
        ctx.save();
        ctx.strokeStyle = st % 2 === 0 ? '#00ffff' : '#ffff00';
        ctx.lineWidth = 2.5;
        for (let a = 0; a < 6; a++) {
          const angle = (Math.PI * 2 * a) / 6 + (st * 0.4);
          const rad = 28 + Math.sin(st + a) * 8;
          ctx.beginPath();
          ctx.moveTo(Math.cos(angle) * (rad - 12), -40 + Math.sin(angle) * (rad - 12));
          ctx.lineTo(Math.cos(angle) * rad, -40 + Math.sin(angle) * rad);
          ctx.lineTo(Math.cos(angle + 0.3) * (rad + 6), -40 + Math.sin(angle + 0.3) * (rad + 6));
          ctx.stroke();
        }
        ctx.restore();
        break;

      case FighterState.ROLLING_ATTACK:
        ctx.save();
        ctx.translate(0, -35);
        ctx.rotate(st * 0.7);
        ctx.fillStyle = skin;
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = pants;
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.fillStyle = hair;
        for (let i = 0; i < 8; i++) {
          const ang = (Math.PI * 2 * i) / 8;
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * 16, Math.sin(ang) * 16);
          ctx.lineTo(Math.cos(ang + 0.2) * 26, Math.sin(ang + 0.2) * 26);
          ctx.lineTo(Math.cos(ang + 0.4) * 16, Math.sin(ang + 0.4) * 16);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();
        break;

      case FighterState.KNOCKDOWN:
      case FighterState.DEFEATED:
        ctx.fillStyle = pants;
        ctx.fillRect(-35, -14, 38, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(3, -12, 28, 12);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-48, -10, 8, 8);
        drawBlankaHead(-40, -12, 'hurt');
        break;

      case FighterState.VICTORY:
        ctx.fillStyle = pants;
        ctx.fillRect(-16, -38, 32, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -64, 28, 28);
        drawBlankaHead(0, -78, 'feral');
        ctx.fillStyle = skin;
        ctx.fillRect(-22, -88, 10, 28);
        ctx.fillRect(12, -88, 10, 28);
        ctx.fillStyle = cuff;
        ctx.fillRect(-22, -90, 10, 4);
        ctx.fillRect(12, -90, 10, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-22, -96, 10, 6);
        ctx.fillRect(12, -96, 10, 6);
        break;

      default:
        this.renderBlanka(ctx, { ...fighter, state: FighterState.IDLE });
        break;
    }
  }

  // ==========================================
  // E. HONDA (SUMO POWERHOUSE)
  // ==========================================
  static renderEhonDa(ctx, fighter) {
    const s = fighter.state;
    const t = fighter.animFrame;
    const st = fighter.stateTimer;
    const bob = Math.sin(t * 0.1) * 2;
    const skin = fighter.skinColor || '#fcd34d';
    const skinDark = fighter.skinShade || '#f59e0b';
    const mawashi = fighter.mawashiColor || '#1e40af';
    const paint = fighter.facePaint || '#dc2626';

    const drawHondaHead = (hx, hy, expression = 'sumo') => {
      // Broad round sumo face & neck
      ctx.fillStyle = skin;
      ctx.fillRect(hx - 10, hy - 8, 20, 18);
      ctx.fillRect(hx - 8, hy + 8, 16, 5); // Broad chin

      // Chonmage topknot & cord
      ctx.fillStyle = '#18181b';
      ctx.fillRect(hx - 8, hy - 14, 16, 8);
      ctx.fillRect(hx - 3, hy - 19, 6, 6);
      ctx.fillStyle = '#ffffff'; // Topknot paper cord
      ctx.fillRect(hx - 3, hy - 14, 6, 2);

      // Kabuki Kumadori Red Facial Warpaint
      ctx.fillStyle = paint; // '#dc2626'
      ctx.fillRect(hx - 7, hy - 2, 3, 10);
      ctx.fillRect(hx + 4, hy - 2, 3, 10);
      ctx.fillRect(hx - 4, hy - 6, 8, 2); // Brow line paint

      // Eyes & Brow
      if (expression === 'hurt') {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(hx - 6, hy - 4, 12, 2);
        // Open yelling mouth in pain
        ctx.fillStyle = '#18181b';
        ctx.fillRect(hx - 5, hy + 4, 10, 5);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(hx - 3, hy + 6, 6, 2);
      } else {
        // White sclera & dark pupils
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx - 6, hy - 5, 5, 3);
        ctx.fillRect(hx + 1, hy - 5, 5, 3);
        ctx.fillStyle = '#18181b';
        ctx.fillRect(hx - 4, hy - 5, 3, 3);
        ctx.fillRect(hx + 3, hy - 5, 3, 3);
        // Broad sumo nose
        ctx.fillStyle = skinDark;
        ctx.fillRect(hx - 2, hy - 1, 4, 4);
        // Booming sumo kiai mouth ("Dosukoi!")
        ctx.fillStyle = '#18181b';
        ctx.fillRect(hx - 5, hy + 4, 10, 5);
        ctx.fillStyle = '#ffffff'; // White teeth
        ctx.fillRect(hx - 4, hy + 4, 8, 2);
        ctx.fillStyle = '#ef4444'; // Red tongue
        ctx.fillRect(hx - 3, hy + 6, 6, 2);
      }
    };

    switch (s) {
      case FighterState.IDLE:
        // Sumo legs
        ctx.fillStyle = skinDark;
        ctx.fillRect(-22, -38 + bob, 18, 38 - bob);
        ctx.fillStyle = skin;
        ctx.fillRect(4, -38 + bob, 18, 38 - bob);
        ctx.fillStyle = skin;
        ctx.fillRect(-26, -4, 22, 5);
        ctx.fillRect(4, -4, 24, 5);

        // Blue Mawashi belt with white sagari ties
        ctx.fillStyle = mawashi;
        ctx.fillRect(-20, -50 + bob, 40, 16);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-4, -48 + bob, 8, 14);

        // Heavy sumo torso & pectoral shading
        ctx.fillStyle = skin;
        ctx.fillRect(-20, -74 + bob, 40, 26);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-14, -68 + bob, 12, 10);
        ctx.fillRect(2, -68 + bob, 12, 10);

        // --- FOUR LIMBS: HONDA'S SUMO OPEN PALM GUARD ---
        // Thick upper arms:
        ctx.fillStyle = skinDark;
        ctx.fillRect(-26, -70 + bob, 12, 22);
        ctx.fillStyle = skin;
        ctx.fillRect(14, -70 + bob, 12, 22);
        // White taped wrists:
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-26, -52 + bob, 12, 4);
        ctx.fillRect(14, -52 + bob, 12, 4);
        // Massive open slapping palms:
        ctx.fillStyle = skin;
        ctx.fillRect(-28, -48 + bob, 14, 10);
        ctx.fillRect(16, -48 + bob, 14, 10);

        drawHondaHead(0, -82 + bob, 'sumo');
        break;

      case FighterState.WALK_FWD:
      case FighterState.WALK_BACK:
        const step = Math.sin(t * 0.2) * 8;
        const hBob = Math.abs(Math.sin(t * 0.2)) * 3;

        ctx.fillStyle = mawashi;
        ctx.fillRect(-18, -48 + hBob, 36, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-22, -72 + hBob, 38, 26);
        ctx.fillRect(-20 + step, -34, 16, 34);
        ctx.fillRect(4 - step, -34, 16, 34);

        // Four Limbs: Sumo arms moving forward with open slapping palms
        ctx.fillStyle = skinDark;
        ctx.fillRect(-26 + step * 0.4, -68 + hBob, 10, 20);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-26 + step * 0.4, -50 + hBob, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(-28 + step * 0.4, -46 + hBob, 12, 10);

        ctx.fillStyle = skin;
        ctx.fillRect(16 - step * 0.4, -68 + hBob, 10, 20);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(16 - step * 0.4, -50 + hBob, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(16 - step * 0.4, -46 + hBob, 12, 10);

        drawHondaHead(0, -80 + hBob, 'sumo');
        break;

      case FighterState.CROUCH:
        // Deep sumo shiko squat posture
        ctx.fillStyle = mawashi;
        ctx.fillRect(-22, -34, 44, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-20, -56, 40, 24);
        ctx.fillRect(-24, -22, 16, 22);
        ctx.fillRect(8, -22, 16, 22);
        // Low sumo slapping hands on knees
        ctx.fillStyle = skinDark;
        ctx.fillRect(-26, -46, 10, 18);
        ctx.fillStyle = skin;
        ctx.fillRect(16, -46, 10, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-26, -30, 10, 4);
        ctx.fillRect(16, -30, 10, 4);
        drawHondaHead(0, -64, 'sumo');
        break;

      case FighterState.JUMP:
        // Sumo airborne leap
        ctx.fillStyle = mawashi;
        ctx.fillRect(-18, -50, 36, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -72, 36, 24);
        ctx.fillRect(-18, -34, 14, 20);
        ctx.fillRect(4, -34, 14, 20);
        // Airborne sumo arms
        ctx.fillStyle = skinDark;
        ctx.fillRect(-28, -66, 10, 18);
        ctx.fillStyle = skin;
        ctx.fillRect(16, -66, 10, 18);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-28, -50, 10, 4);
        ctx.fillRect(16, -50, 10, 4);
        drawHondaHead(0, -80, 'sumo');
        break;

      case FighterState.BLOCKSTUN:
        // Heavy open-palm sumo block
        ctx.fillStyle = mawashi;
        ctx.fillRect(-20, -42, 40, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -70, 36, 28);
        ctx.fillRect(-18, -30, 14, 30);
        ctx.fillRect(4, -30, 14, 30);
        // Double open-palm guard
        ctx.fillStyle = skin;
        ctx.fillRect(4, -68, 12, 22);
        ctx.fillRect(-8, -64, 12, 22);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(4, -72, 12, 4);
        ctx.fillRect(-8, -68, 12, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(4, -78, 14, 8);
        ctx.fillRect(-8, -74, 14, 8);
        drawHondaHead(-2, -78, 'sumo');
        break;

      case FighterState.HITSTUN:
        // Torso knocked back, wincing expression
        ctx.fillStyle = mawashi;
        ctx.fillRect(-22, -38, 40, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-20, -68, 38, 28);
        ctx.fillRect(-20, -28, 14, 28);
        ctx.fillRect(2, -28, 14, 28);
        // Flailing arms
        ctx.fillStyle = skinDark;
        ctx.fillRect(-28, -62, 10, 18);
        ctx.fillStyle = skin;
        ctx.fillRect(16, -58, 10, 18);
        drawHondaHead(-4, -76, 'hurt');
        break;

      case FighterState.LIGHT_PUNCH:
      case FighterState.HEAVY_PUNCH:
        // Sumo legs
        ctx.fillStyle = mawashi;
        ctx.fillRect(-20, -42, 38, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -30, 14, 30);
        ctx.fillRect(4, -30, 14, 30);
        // Heavy torso & head
        ctx.fillRect(-18, -68, 36, 28);
        drawHondaHead(2, -76);
        // Rear guard
        ctx.fillRect(-22, -60, 8, 18);
        // Sumo open palm thrust
        ctx.fillRect(14, -68, s === FighterState.HEAVY_PUNCH ? 40 : 24, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(14 + (s === FighterState.HEAVY_PUNCH ? 40 : 24), -70, 6, 18);
        break;

      case FighterState.LIGHT_KICK:
        // Plant leg (single massive rear sumo leg)
        ctx.fillStyle = mawashi;
        ctx.fillRect(-18, -42, 28, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -28, 18, 28);
        // Torso & head
        ctx.fillRect(-16, -68, 32, 28);
        drawHondaHead(0, -76);
        // Snapped sumo kick
        ctx.fillRect(6, -44, 18, 14);
        ctx.fillRect(22, -42, 20, 13);
        break;

      case FighterState.HEAVY_KICK:
        // Heavy High Sumo Thrust Kick
        ctx.fillStyle = mawashi;
        ctx.fillRect(-18, -42, 26, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -28, 18, 28);
        // Torso leaning back
        ctx.fillRect(-18, -68, 30, 26);
        drawHondaHead(-6, -76);
        // High sumo kick
        ctx.fillRect(2, -56, 20, 16);
        ctx.fillRect(20, -72, 30, 16);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(48, -74, 6, 20);
        break;

      case FighterState.SWEEP:
        ctx.fillStyle = mawashi;
        ctx.fillRect(-18, -30, 36, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -48, 36, 20);
        drawHondaHead(0, -56);
        ctx.fillStyle = skin;
        ctx.fillRect(10, -16, 44, 14);
        break;

      case FighterState.HUNDRED_SLAP:
        ctx.fillStyle = mawashi;
        ctx.fillRect(-20, -48, 38, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -72, 36, 26);
        drawHondaHead(2, -80);
        ctx.save();
        for (let i = 0; i < 4; i++) {
          const armY = -76 + i * 12 + Math.sin(st * 1.5 + i) * 6;
          ctx.fillStyle = i % 2 === 0 ? skin : skinDark;
          ctx.fillRect(12, armY, 38, 10);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(48, armY - 3, 6, 16);
        }
        ctx.restore();
        break;

      case FighterState.SUMO_HEADBUTT:
        if (st >= 27) {
          // Landing recovery / skidding pose: feet planted, torso leaning forward, arms braced down
          ctx.fillStyle = mawashi;
          ctx.fillRect(-22, -36, 18, 36);
          ctx.fillRect(4, -36, 18, 36);
          ctx.fillStyle = skin;
          ctx.fillRect(-18, -66, 38, 32);
          drawHondaHead(8, -74);
          // Braced arms on knees
          ctx.fillStyle = skinDark;
          ctx.fillRect(-28, -60, 14, 22);
          ctx.fillRect(16, -60, 14, 22);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(-30, -40, 14, 8);
          ctx.fillRect(18, -40, 14, 8);
        } else {
          ctx.save();
          ctx.fillStyle = mawashi;
          ctx.fillRect(-24, -48, 18, 28);
          ctx.fillStyle = skin;
          ctx.fillRect(-10, -50, 44, 30);
          drawHondaHead(42, -38);
          ctx.fillStyle = skin;
          ctx.fillRect(-40, -44, 18, 14);
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(56, -42);
          ctx.lineTo(66, -38);
          ctx.lineTo(56, -34);
          ctx.stroke();
          ctx.restore();
        }
        break;

      case FighterState.KNOCKDOWN:
      case FighterState.DEFEATED:
        ctx.fillStyle = mawashi;
        ctx.fillRect(-25, -16, 32, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(7, -14, 30, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-48, -10, 8, 8);
        drawHondaHead(-38, -12, 'hurt');
        break;

      case FighterState.VICTORY:
        ctx.fillStyle = mawashi;
        ctx.fillRect(-20, -48, 40, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-20, -74, 40, 28);
        drawHondaHead(0, -84, 'sumo');
        ctx.fillStyle = skin;
        ctx.fillRect(-44, -72, 26, 14);
        ctx.fillRect(18, -72, 26, 14);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(-48, -74, 8, 18);
        ctx.fillRect(40, -74, 8, 18);
        break;

      default:
        this.renderEhonDa(ctx, { ...fighter, state: FighterState.IDLE });
        break;
    }
  }

  // ==========================================
  // ZANGIEF (THE RED CYCLONE)
  // ==========================================
  static renderZangief(ctx, fighter) {
    const s = fighter.state;
    const t = fighter.animFrame;
    const st = fighter.stateTimer;
    const bob = Math.sin(t * 0.1) * 2;
    const skin = fighter.skinColor || '#fcd34d';
    const skinDark = fighter.skinShade || '#f59e0b';
    const trunks = fighter.trunksColor || '#dc2626';
    const belt = fighter.beltColor || '#ca8a04';
    const hair = fighter.hairColor || '#451a03';
    const boots = fighter.bootsColor || '#991b1b';

    const drawZangiefHead = (hx, hy, expression = 'rage') => {
      // Rugged face & jaw
      ctx.fillStyle = skin;
      ctx.fillRect(hx - 9, hy - 8, 18, 16);

      // Battle scars across face
      ctx.fillStyle = '#b45309';
      ctx.fillRect(hx - 6, hy - 7, 10, 2);
      ctx.fillRect(hx - 3, hy - 9, 2, 6);

      // Mohawk with shaved stubble sides
      ctx.fillStyle = hair;
      ctx.fillRect(hx - 4, hy - 17, 8, 10);
      ctx.fillRect(hx - 2, hy - 20, 4, 4);
      ctx.fillStyle = '#78350f';
      ctx.fillRect(hx - 8, hy - 13, 4, 6);
      ctx.fillRect(hx + 4, hy - 13, 4, 6);

      // Bristling Russian beard and mustache
      ctx.fillStyle = hair;
      ctx.fillRect(hx - 9, hy + 2, 18, 10);
      ctx.fillRect(hx - 6, hy + 11, 12, 4);

      // Eyes & Brow
      if (expression === 'hurt') {
        ctx.fillStyle = '#18181b';
        ctx.fillRect(hx - 6, hy - 4, 12, 2);
        // Open mouth in pain
        ctx.fillStyle = '#18181b';
        ctx.fillRect(hx - 4, hy + 3, 8, 5);
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(hx - 2, hy + 5, 4, 2);
      } else {
        // Bushy furrowed brow
        ctx.fillStyle = '#18181b';
        ctx.fillRect(hx - 6, hy - 5, 12, 2);
        // Fierce glaring eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx - 5, hy - 4, 4, 3);
        ctx.fillRect(hx + 1, hy - 4, 4, 3);
        ctx.fillStyle = '#18181b';
        ctx.fillRect(hx - 4, hy - 3, 2, 2);
        ctx.fillRect(hx + 2, hy - 3, 2, 2);

        // Broken wrestler nose
        ctx.fillStyle = skinDark;
        ctx.fillRect(hx - 2, hy - 1, 4, 4);

        // Ferocious open scowl with white teeth
        ctx.fillStyle = '#18181b';
        ctx.fillRect(hx - 4, hy + 3, 8, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx - 3, hy + 3, 6, 2);
      }
    };

    switch (s) {
      case FighterState.IDLE:
        // Muscular legs & red wrestling boots
        ctx.fillStyle = skinDark;
        ctx.fillRect(-20, -44 + bob, 16, 26);
        ctx.fillStyle = skin;
        ctx.fillRect(4, -44 + bob, 16, 26);
        ctx.fillStyle = boots;
        ctx.fillRect(-22, -18, 18, 18);
        ctx.fillRect(4, -18, 18, 18);
        ctx.fillStyle = '#18181b'; // Boot soles
        ctx.fillRect(-23, -3, 20, 3);
        ctx.fillRect(3, -3, 20, 3);

        // Red wrestling briefs & gold belt
        ctx.fillStyle = trunks;
        ctx.fillRect(-18, -52 + bob, 36, 14);
        ctx.fillStyle = belt;
        ctx.fillRect(-18, -54 + bob, 36, 4);

        // Muscular barrel chest & Russian chest hair
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -78 + bob, 36, 26);
        ctx.fillStyle = hair;
        ctx.fillRect(-10, -74 + bob, 20, 8);
        ctx.fillRect(-6, -66 + bob, 12, 6);

        // --- FOUR LIMBS: ZANGIEF'S MASSIVE GRAPPLING ARMS ---
        // Rear arm:
        ctx.fillStyle = skinDark;
        ctx.fillRect(-26, -74 + bob, 12, 26);
        ctx.fillStyle = trunks; // Red wrist wrap
        ctx.fillRect(-26, -56 + bob, 12, 6);
        ctx.fillStyle = skin; // Open grappling hand
        ctx.fillRect(-28, -50 + bob, 14, 8);

        // Front arm:
        ctx.fillStyle = skin;
        ctx.fillRect(16, -74 + bob, 12, 26);
        ctx.fillStyle = trunks; // Red wrist wrap
        ctx.fillRect(16, -56 + bob, 12, 6);
        ctx.fillStyle = skin; // Open grappling claw hand
        ctx.fillRect(16, -50 + bob, 14, 8);

        drawZangiefHead(0, -88 + bob, 'rage');
        break;

      case FighterState.WALK_FWD:
      case FighterState.WALK_BACK:
        const step = Math.sin(t * 0.22) * 8;
        const zBob = Math.abs(Math.sin(t * 0.22)) * 3;

        ctx.fillStyle = trunks;
        ctx.fillRect(-16, -50 + zBob, 32, 14);
        ctx.fillStyle = belt;
        ctx.fillRect(-16, -52 + zBob, 32, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -76 + zBob, 36, 28);
        ctx.fillStyle = boots;
        ctx.fillRect(-20 + step, -20, 16, 20);
        ctx.fillRect(4 - step, -20, 16, 20);

        // Four Limbs: Massive swinging wrestler arms in walking bear-hug guard
        ctx.fillStyle = skinDark;
        ctx.fillRect(-26 + step * 0.4, -72 + zBob, 11, 24);
        ctx.fillStyle = trunks;
        ctx.fillRect(-26 + step * 0.4, -54 + zBob, 11, 6);
        ctx.fillStyle = skin;
        ctx.fillRect(-28 + step * 0.4, -48 + zBob, 13, 8);

        ctx.fillStyle = skin;
        ctx.fillRect(16 - step * 0.4, -72 + zBob, 11, 24);
        ctx.fillStyle = trunks;
        ctx.fillRect(16 - step * 0.4, -54 + zBob, 11, 6);
        ctx.fillStyle = skin;
        ctx.fillRect(16 - step * 0.4, -48 + zBob, 13, 8);

        drawZangiefHead(0, -86 + zBob, 'rage');
        break;

      case FighterState.CROUCH:
        ctx.fillStyle = trunks;
        ctx.fillRect(-16, -36, 32, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -58, 34, 24);
        ctx.fillStyle = boots;
        ctx.fillRect(-20, -18, 16, 18);
        ctx.fillRect(4, -18, 16, 18);
        // Low grappling claw arms
        ctx.fillStyle = skinDark;
        ctx.fillRect(-24, -50, 10, 20);
        ctx.fillStyle = skin;
        ctx.fillRect(14, -50, 10, 20);
        ctx.fillStyle = trunks;
        ctx.fillRect(-24, -36, 10, 5);
        ctx.fillRect(14, -36, 10, 5);
        ctx.fillStyle = skin;
        ctx.fillRect(-26, -31, 12, 8);
        ctx.fillRect(14, -31, 12, 8);
        drawZangiefHead(0, -68, 'rage');
        break;

      case FighterState.JUMP:
        ctx.fillStyle = trunks;
        ctx.fillRect(-16, -48, 32, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -74, 34, 28);
        ctx.fillStyle = boots;
        ctx.fillRect(-16, -26, 14, 20);
        ctx.fillRect(4, -26, 14, 20);
        // Airborne open grappling arms
        ctx.fillStyle = skinDark;
        ctx.fillRect(-26, -70, 10, 22);
        ctx.fillStyle = skin;
        ctx.fillRect(16, -70, 10, 22);
        ctx.fillStyle = trunks;
        ctx.fillRect(-26, -54, 10, 5);
        ctx.fillRect(16, -54, 10, 5);
        ctx.fillStyle = skin;
        ctx.fillRect(-28, -49, 12, 8);
        ctx.fillRect(16, -49, 12, 8);
        drawZangiefHead(0, -84, 'rage');
        break;

      case FighterState.BLOCKSTUN:
        // Double massive wrestler arm cross block
        ctx.fillStyle = trunks;
        ctx.fillRect(-16, -42, 32, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -70, 34, 28);
        ctx.fillStyle = boots;
        ctx.fillRect(-18, -20, 16, 20);
        ctx.fillRect(2, -20, 16, 20);
        // Heavy forearms crossed blocking
        ctx.fillStyle = skin;
        ctx.fillRect(4, -70, 12, 22);
        ctx.fillRect(-6, -66, 12, 22);
        ctx.fillStyle = trunks;
        ctx.fillRect(4, -74, 12, 5);
        ctx.fillRect(-6, -70, 12, 5);
        drawZangiefHead(-2, -80, 'rage');
        break;

      case FighterState.HITSTUN:
        ctx.fillStyle = trunks;
        ctx.fillRect(-18, -40, 32, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -68, 34, 28);
        ctx.fillStyle = boots;
        ctx.fillRect(-20, -20, 16, 20);
        ctx.fillRect(0, -20, 16, 20);
        // Recoiled arms
        ctx.fillStyle = skinDark;
        ctx.fillRect(-28, -64, 10, 20);
        ctx.fillStyle = skin;
        ctx.fillRect(16, -60, 10, 20);
        drawZangiefHead(-4, -78, 'hurt');
        break;
        ctx.fillRect(-16, -26, 14, 20);
        ctx.fillRect(4, -26, 14, 20);
        break;

      case FighterState.LIGHT_PUNCH:
      case FighterState.HEAVY_PUNCH:
        // Heavy legs in wrestling boots
        ctx.fillStyle = trunks;
        ctx.fillRect(-18, -42, 36, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -30, 14, 12);
        ctx.fillRect(4, -30, 14, 12);
        ctx.fillStyle = boots;
        ctx.fillRect(-16, -20, 14, 20);
        ctx.fillRect(4, -20, 14, 20);
        // Torso & head
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -72, 36, 32);
        drawZangiefHead(2, -80);
        // Rear guard fist
        ctx.fillRect(-22, -64, 8, 18);
        // Punching arm
        ctx.fillRect(14, -72, s === FighterState.HEAVY_PUNCH ? 42 : 24, 14);
        ctx.fillStyle = trunks;
        ctx.fillRect(26, -72, 8, 14);
        break;

      case FighterState.LIGHT_KICK:
        // Plant leg (single rear leg in wrestling boot)
        ctx.fillStyle = trunks;
        ctx.fillRect(-16, -42, 24, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -30, 16, 12);
        ctx.fillStyle = boots;
        ctx.fillRect(-14, -20, 16, 20);
        // Torso & head
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -72, 30, 32);
        drawZangiefHead(0, -80);
        // Snapped boot kick
        ctx.fillRect(6, -46, 16, 14);
        ctx.fillStyle = boots;
        ctx.fillRect(20, -44, 22, 15);
        break;

      case FighterState.HEAVY_KICK:
        // Zangief's Powerful High Boot Kick!
        ctx.fillStyle = trunks;
        ctx.fillRect(-18, -42, 26, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -30, 16, 12);
        ctx.fillStyle = boots;
        ctx.fillRect(-16, -20, 16, 20);
        // Torso leaning back
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -70, 32, 30);
        drawZangiefHead(-6, -78);
        // High wrestling boot kick
        ctx.fillRect(4, -58, 18, 16);
        ctx.fillStyle = boots;
        ctx.fillRect(20, -74, 30, 17);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(48, -76, 6, 20);
        break;

      case FighterState.SWEEP:
        ctx.fillStyle = trunks;
        ctx.fillRect(-16, -30, 32, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -48, 32, 20);
        drawZangiefHead(0, -58);
        ctx.fillStyle = boots;
        ctx.fillRect(10, -18, 46, 16);
        break;

      case FighterState.DOUBLE_LARIAT:
        ctx.save();
        ctx.fillStyle = trunks;
        ctx.fillRect(-16, -50, 32, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -76, 32, 28);
        drawZangiefHead(0, -86);
        const spinW = 54;
        ctx.fillStyle = skin;
        ctx.fillRect(-spinW, -72, spinW * 2, 14);
        ctx.fillStyle = trunks;
        ctx.fillRect(-spinW + 8, -72, 8, 14);
        ctx.fillRect(spinW - 16, -72, 8, 14);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-spinW - 6, -65);
        ctx.lineTo(spinW + 6, -65);
        ctx.stroke();
        ctx.restore();
        break;

      case FighterState.SPINNING_PILEDRIVER:
        ctx.save();
        ctx.translate(0, -45);
        ctx.rotate(st * 0.8);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -20, 32, 40);
        ctx.fillStyle = trunks;
        ctx.fillRect(-16, -4, 32, 14);
        drawZangiefHead(0, -28);
        ctx.fillStyle = boots;
        ctx.fillRect(-14, 16, 12, 16);
        ctx.fillRect(2, 16, 12, 16);
        ctx.restore();
        break;

      case FighterState.KNOCKDOWN:
      case FighterState.DEFEATED:
        ctx.fillStyle = trunks;
        ctx.fillRect(-26, -16, 32, 16);
        ctx.fillStyle = boots;
        ctx.fillRect(8, -14, 30, 14);
        drawZangiefHead(-38, -12);
        break;

      case FighterState.VICTORY:
        ctx.fillStyle = trunks;
        ctx.fillRect(-18, -52, 36, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-18, -78, 36, 28);
        drawZangiefHead(0, -88);
        ctx.fillStyle = skin;
        ctx.fillRect(-34, -84, 16, 14);
        ctx.fillRect(18, -84, 16, 14);
        ctx.fillRect(-34, -96, 14, 14);
        ctx.fillRect(20, -96, 14, 14);
        break;

      default:
        this.renderZangief(ctx, { ...fighter, state: FighterState.IDLE });
        break;
    }
  }

  // ==========================================
  // DHALSIM (THE MYSTICAL YOGI)
  // ==========================================
  static renderDhalsim(ctx, fighter) {
    const s = fighter.state;
    const t = fighter.animFrame;
    const st = fighter.stateTimer;
    const bob = Math.sin(t * 0.1) * 2;
    const skin = fighter.skinColor || '#d97706';
    const skinDark = fighter.skinShade || '#b45309';
    const trunks = fighter.trunksColor || '#eab308';
    const marks = fighter.headbandColor || '#dc2626';

    const drawDhalsimHead = (hx, hy, expression = 'serene') => {
      // Ascetic Bald Cranium
      ctx.fillStyle = skin;
      ctx.fillRect(hx - 7, hy - 6, 14, 15);
      ctx.fillRect(hx - 5, hy + 9, 10, 4); // Chiseled chin & jaw
      ctx.fillRect(hx - 5, hy - 10, 10, 4); // Cranium curve
      ctx.fillRect(hx - 3, hy - 12, 6, 2); // Top crown
      // Dark shade on back of head & jawline
      ctx.fillStyle = skinDark;
      ctx.fillRect(hx - 7, hy - 2, 2, 8);
      ctx.fillRect(hx - 5, hy + 11, 8, 2);

      // Long Stretched Ascetic Earlobes with Golden Ring Earrings
      ctx.fillStyle = skinDark;
      ctx.fillRect(hx - 8, hy + 2, 3, 7); // Stretched lobe
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(hx - 7, hy + 11, 4, 0, Math.PI * 2); // Golden hoop earring
      ctx.fill();
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(hx - 7, hy + 11, 1.5, 0, Math.PI * 2); // Earring hoop center hole
      ctx.fill();

      // Sacred Red Tilak Stripes on Forehead (Three vertical stripes)
      ctx.fillStyle = marks;
      ctx.fillRect(hx - 4, hy - 9, 2, 8);
      ctx.fillRect(hx - 1, hy - 10, 2, 9);
      ctx.fillRect(hx + 2, hy - 9, 2, 8);

      // Facial Features and Expression
      if (expression === 'hurt') {
        // Clenched shut pained eyes
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(hx - 3, hy - 1, 4, 2);
        ctx.fillRect(hx + 2, hy - 1, 4, 2);
        // Open gasping pained mouth
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(hx, hy + 5, 5, 4);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx + 1, hy + 5, 3, 2); // Teeth
      } else if (expression === 'kiai' || expression === 'flame') {
        // Fierce wide eyes breathing fire / chanting
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx - 2, hy - 2, 6, 4);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(hx + 1, hy - 2, 3, 3);
        ctx.fillStyle = '#991b1b';
        ctx.fillRect(hx - 2, hy - 4, 7, 2); // Tense brow
        // Slender nose
        ctx.fillStyle = skinDark;
        ctx.fillRect(hx + 3, hy, 2, 3);
        // Wide open mouth expelling flames
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(hx - 1, hy + 4, 7, 5);
        ctx.fillStyle = '#f97316';
        ctx.fillRect(hx + 1, hy + 5, 4, 3); // Mystical inner orange heat
      } else {
        // Serene ascetic eyebrows
        ctx.fillStyle = '#78350f';
        ctx.fillRect(hx - 2, hy - 3, 7, 1);
        // Tranquil yogic eyes with white sclera and dark pupils
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(hx - 2, hy - 1, 6, 3);
        ctx.fillStyle = '#1c1917';
        ctx.fillRect(hx + 1, hy - 1, 3, 3);
        // Slender nose
        ctx.fillStyle = skinDark;
        ctx.fillRect(hx + 3, hy, 2, 3);
        // Serene calm mouth
        ctx.fillStyle = '#78350f';
        ctx.fillRect(hx + 1, hy + 5, 5, 2);
        if (expression === 'smile') {
          // Subtle upturn at the edge for enlightened smile
          ctx.fillRect(hx + 5, hy + 4, 2, 2);
        }
      }

      // Holy Skull Necklace around collarbone (3 miniature skulls)
      const drawMiniSkull = (sx, sy) => {
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(sx - 2, sy - 2, 5, 5); // Skull cranium
        ctx.fillRect(sx - 1, sy + 3, 3, 2); // Maxilla / teeth
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(sx - 1, sy - 1, 1, 1); // Left eye socket
        ctx.fillRect(sx + 1, sy - 1, 1, 1); // Right eye socket
      };
      drawMiniSkull(hx - 6, hy + 13);
      drawMiniSkull(hx, hy + 15);
      drawMiniSkull(hx + 6, hy + 13);
    };

    switch (s) {
      case FighterState.IDLE:
        // Legs with Golden Anklets
        ctx.fillStyle = skinDark;
        ctx.fillRect(-14, -40 + bob, 8, 40 - bob);
        ctx.fillStyle = '#facc15'; // Golden Anklet
        ctx.fillRect(-15, -6 + bob, 10, 4);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-16, -2, 12, 3); // Bare foot

        ctx.fillStyle = skin;
        ctx.fillRect(4, -38 + bob, 8, 38 - bob);
        ctx.fillStyle = '#facc15'; // Golden Anklet
        ctx.fillRect(3, -6 + bob, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(4, -2, 14, 3); // Bare foot

        // Trunks & Sash
        ctx.fillStyle = trunks;
        ctx.fillRect(-14, -48 + bob, 28, 14);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(-14, -48 + bob, 28, 3);

        // Slender Yogic Torso
        ctx.fillStyle = skin;
        ctx.fillRect(-11, -72 + bob, 22, 26);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-4, -68 + bob, 8, 2); // Rib definition

        drawDhalsimHead(0, -80 + bob, 'serene');

        // Four Limbs - Rear Arm (Yogic Mudra Guard)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-17, -70 + bob, 6, 14);
        ctx.fillStyle = '#facc15'; // Gold Bicep Band
        ctx.fillRect(-18, -64 + bob, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-19, -58 + bob, 6, 12);
        ctx.fillStyle = '#facc15'; // Gold Wrist Bangle
        ctx.fillRect(-20, -48 + bob, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-21, -45 + bob, 8, 7); // Open yogic palm

        // Four Limbs - Lead Arm (Palm Strike Guard)
        ctx.fillStyle = skin;
        ctx.fillRect(10, -70 + bob, 6, 14);
        ctx.fillStyle = '#facc15'; // Gold Bicep Band
        ctx.fillRect(9, -64 + bob, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(11, -58 + bob, 6, 12);
        ctx.fillStyle = '#facc15'; // Gold Wrist Bangle
        ctx.fillRect(10, -48 + bob, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(11, -45 + bob, 8, 7); // Open yogic palm
        break;

      case FighterState.WALK_FWD:
      case FighterState.WALK_BACK:
        const step = Math.sin(t * 0.22) * 8;
        const armSwing = Math.sin(t * 0.22) * 6;

        // Striding Slender Legs with Golden Anklets
        ctx.fillStyle = skinDark;
        ctx.fillRect(-14 + step, -38, 8, 38);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-15 + step, -6, 10, 4);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-16 + step, -2, 12, 3);

        ctx.fillStyle = skin;
        ctx.fillRect(4 - step, -38, 8, 38);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(3 - step, -6, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(4 - step, -2, 14, 3);

        // Trunks & Torso
        ctx.fillStyle = trunks;
        ctx.fillRect(-13, -48, 26, 14);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(-13, -48, 26, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(-11, -72, 22, 26);
        drawDhalsimHead(0, -80, 'serene');

        // Swaying Yogic Arms with Golden Bangles (Previously Missing!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-16 - armSwing, -70, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-17 - armSwing, -64, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18 - armSwing, -58, 6, 12);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-19 - armSwing, -48, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-20 - armSwing, -45, 8, 7);

        ctx.fillStyle = skin;
        ctx.fillRect(10 + armSwing, -70, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(9 + armSwing, -64, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(12 + armSwing, -58, 6, 12);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(11 + armSwing, -48, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(12 + armSwing, -45, 8, 7);
        break;

      case FighterState.CROUCH:
        // Deep Yogic Squat Legs
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18, -22, 14, 22);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-19, -6, 10, 4);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-20, -4, 18, 5);

        ctx.fillStyle = skin;
        ctx.fillRect(4, -22, 16, 22);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(3, -6, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(4, -4, 18, 5);

        // Trunks & Torso
        ctx.fillStyle = trunks;
        ctx.fillRect(-15, -38, 30, 18);
        ctx.fillStyle = skin;
        ctx.fillRect(-11, -60, 22, 24);
        drawDhalsimHead(0, -68, 'serene');

        // Low Defensive Yogic Arms (Previously Missing!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-16, -56, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-17, -50, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18, -44, 6, 12);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-19, -34, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-20, -31, 8, 7);

        ctx.fillStyle = skin;
        ctx.fillRect(10, -56, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(9, -50, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(12, -44, 6, 12);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(11, -34, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(12, -31, 8, 7);
        break;

      case FighterState.JUMP:
        // Floating Aerial Trailing Legs with Golden Anklets
        ctx.fillStyle = skinDark;
        ctx.fillRect(-12, -40, 8, 22);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-13, -20, 10, 4);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-14, -16, 10, 6);

        ctx.fillStyle = skin;
        ctx.fillRect(4, -44, 8, 24);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(3, -22, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(4, -18, 10, 6);

        // Trunks & Torso
        ctx.fillStyle = trunks;
        ctx.fillRect(-12, -54, 24, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(-10, -78, 20, 26);
        drawDhalsimHead(0, -86, 'serene');

        // Outstretched Levitation Arms (Previously Missing!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18, -74, 8, 16);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-19, -68, 9, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-22, -60, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-23, -48, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-24, -45, 9, 7);

        ctx.fillStyle = skin;
        ctx.fillRect(10, -74, 8, 16);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(10, -68, 9, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(14, -60, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(14, -48, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(15, -45, 9, 7);
        break;

      case FighterState.BLOCKSTUN:
        // Braced Legs
        ctx.fillStyle = skinDark;
        ctx.fillRect(-14, -40, 8, 40);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-15, -6, 10, 4);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-16, -2, 12, 3);

        ctx.fillStyle = skin;
        ctx.fillRect(2, -38, 8, 38);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(1, -6, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(2, -2, 14, 3);

        // Trunks & Torso
        ctx.fillStyle = trunks;
        ctx.fillRect(-14, -48, 28, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-13, -72, 22, 26);
        drawDhalsimHead(-2, -80, 'serene');

        // Crossed-Wrist Yogic Warding Barrier (Golden Bangles Clashing!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-6, -68, 14, 6);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-2, -70, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(4, -72, 6, 16);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(3, -75, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(2, -82, 8, 8);

        ctx.fillStyle = skin;
        ctx.fillRect(-2, -64, 14, 6);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(2, -66, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(8, -68, 6, 16);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(7, -71, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(6, -78, 8, 8);
        break;

      case FighterState.HITSTUN:
        // Reeling Legs
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18, -38, 8, 38);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-19, -6, 10, 4);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-20, -2, 12, 3);

        ctx.fillStyle = skin;
        ctx.fillRect(-2, -36, 8, 36);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-3, -6, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(-2, -2, 14, 3);

        // Torso Recoiling Backwards
        ctx.fillStyle = trunks;
        ctx.fillRect(-16, -46, 26, 14);
        ctx.fillStyle = skin;
        ctx.fillRect(-16, -70, 22, 26);
        drawDhalsimHead(-6, -78, 'hurt');

        // Arms Flung Back from Impact
        ctx.fillStyle = skinDark;
        ctx.fillRect(-24, -68, 8, 18);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-25, -60, 9, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-27, -50, 8, 7);

        ctx.fillStyle = skin;
        ctx.fillRect(4, -62, 8, 18);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(4, -54, 9, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(2, -44, 8, 7);
        break;

      case FighterState.LIGHT_PUNCH:
      case FighterState.HEAVY_PUNCH:
        // Standing slender legs with golden anklets
        ctx.fillStyle = trunks;
        ctx.fillRect(-14, -38, 26, 14);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-12, -26, 8, 26);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-13, -6, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(2, -26, 8, 26);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(1, -6, 10, 4);

        // Torso & head
        ctx.fillStyle = skin;
        ctx.fillRect(-12, -66, 24, 30);
        drawDhalsimHead(2, -74, 'serene');

        // Rear Arm in Chest Guard (Full 4 Limbs!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-16, -66, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-17, -60, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18, -52, 7, 7);

        // Telescoping Stretchy Punching Arm with Gold Wrist Bangle
        const armLen = s === FighterState.HEAVY_PUNCH ? 82 : 54;
        ctx.fillStyle = skin;
        ctx.fillRect(10, -68, 8, 10);
        ctx.fillStyle = '#facc15'; // Bicep Band
        ctx.fillRect(14, -68, 4, 10);
        ctx.fillStyle = skin;
        for (let seg = 18; seg < armLen; seg += 12) {
          ctx.fillRect(10 + seg, -66, 9, 8);
        }
        ctx.fillStyle = '#facc15'; // Wrist Bangle
        ctx.fillRect(10 + armLen - 4, -68, 5, 12);
        ctx.fillStyle = skin;
        ctx.fillRect(10 + armLen, -68, 12, 12); // Fist
        break;

      case FighterState.LIGHT_KICK:
        // Plant leg (single rear leg on ground)
        ctx.fillStyle = trunks;
        ctx.fillRect(-12, -38, 20, 14);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-10, -26, 8, 26);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-11, -6, 10, 4);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-12, -2, 12, 3);

        // Torso & head
        ctx.fillStyle = skin;
        ctx.fillRect(-10, -66, 22, 30);
        drawDhalsimHead(0, -74, 'serene');

        // Both Arms in Balancing Guard (Full 4 Limbs!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-16, -66, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-17, -60, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18, -52, 7, 7);

        ctx.fillStyle = skin;
        ctx.fillRect(8, -66, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(7, -60, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(8, -52, 7, 7);

        // Mid stretchy leg with Golden Anklet
        ctx.fillStyle = skin;
        for (let seg = 0; seg < 56; seg += 12) {
          ctx.fillRect(8 + seg, -44, 9, 9);
        }
        ctx.fillStyle = '#facc15'; // Golden Anklet
        ctx.fillRect(60, -46, 5, 12);
        ctx.fillStyle = skin;
        ctx.fillRect(64, -46, 12, 12); // Foot
        break;

      case FighterState.HEAVY_KICK:
        // Standing Plant Leg
        ctx.fillStyle = trunks;
        ctx.fillRect(-14, -38, 22, 14);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-12, -26, 8, 26);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-13, -6, 10, 4);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-14, -2, 12, 3);

        // Torso leaning back
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -66, 22, 28);
        drawDhalsimHead(-6, -72, 'serene');

        // Both Arms Balancing (Full 4 Limbs!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-20, -64, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-21, -58, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-22, -50, 7, 7);

        ctx.fillStyle = skin;
        ctx.fillRect(6, -60, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(5, -54, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(6, -46, 7, 7);

        // High telescoping leg reaching chest/head level with Golden Anklet
        ctx.fillStyle = skin;
        for (let seg = 0; seg < 90; seg += 12) {
          ctx.fillRect(8 + seg, -72 + Math.floor(seg * 0.08), 9, 9);
        }
        ctx.fillStyle = '#facc15'; // Golden Anklet
        ctx.fillRect(94, -68, 5, 16);
        ctx.fillStyle = skin;
        ctx.fillRect(99, -66, 14, 14); // Foot
        break;

      case FighterState.SWEEP:
        // Low crouching plant leg
        ctx.fillStyle = trunks;
        ctx.fillRect(-14, -28, 28, 12);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-12, -18, 8, 18);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-13, -4, 10, 4);

        // Torso & head
        ctx.fillStyle = skin;
        ctx.fillRect(-12, -44, 24, 18);
        drawDhalsimHead(0, -52, 'serene');

        // Supporting and Guard Arms (Full 4 Limbs!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18, -38, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-19, -30, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-20, -24, 7, 8); // Hand on ground

        ctx.fillStyle = skin;
        ctx.fillRect(4, -42, 6, 14);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(3, -34, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(4, -28, 7, 7);

        // Low Stretchy Sweeping Leg with Golden Anklet
        ctx.fillStyle = skin;
        for (let seg = 0; seg < 70; seg += 12) {
          ctx.fillRect(6 + seg, -14, 9, 8);
        }
        ctx.fillStyle = '#facc15'; // Golden Anklet
        ctx.fillRect(72, -16, 5, 12);
        ctx.fillStyle = skin;
        ctx.fillRect(76, -16, 12, 10);
        break;

      case FighterState.YOGA_FIRE:
        // Braced Legs with Golden Anklets
        ctx.fillStyle = skinDark;
        ctx.fillRect(-14, -38, 8, 38);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-15, -6, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(2, -38, 8, 38);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(1, -6, 10, 4);

        // Trunks & Torso
        ctx.fillStyle = trunks;
        ctx.fillRect(-14, -46, 28, 12);
        ctx.fillStyle = skin;
        ctx.fillRect(-14, -70, 24, 26);
        drawDhalsimHead(-4, -76, 'flame');

        // Both Arms Thrust Forward Guiding Fireball (Full 4 Limbs!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-6, -68, 14, 6);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(6, -69, 4, 8);
        ctx.fillStyle = skinDark;
        ctx.fillRect(10, -71, 7, 10);

        ctx.fillStyle = skin;
        ctx.fillRect(-2, -62, 16, 6);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(12, -63, 4, 8);
        ctx.fillStyle = skin;
        ctx.fillRect(16, -65, 7, 10);

        if (st >= 8 && st <= 14) {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(26, -68, 8, 0, Math.PI * 2);
          ctx.fill();
        }
        break;

      case FighterState.YOGA_FLAME:
        // Braced Legs with Golden Anklets
        ctx.fillStyle = skinDark;
        ctx.fillRect(-14, -38, 8, 38);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-15, -6, 10, 4);
        ctx.fillStyle = skin;
        ctx.fillRect(2, -38, 8, 38);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(1, -6, 10, 4);

        // Trunks & Torso
        ctx.fillStyle = trunks;
        ctx.fillRect(-14, -46, 28, 12);
        ctx.fillStyle = skin;
        ctx.fillRect(-10, -70, 24, 26);
        drawDhalsimHead(4, -76, 'flame');

        // Both Arms Thrust Outward Chanting (Full 4 Limbs!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-2, -68, 14, 6);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(10, -69, 4, 8);
        ctx.fillStyle = skinDark;
        ctx.fillRect(14, -71, 7, 10);

        ctx.fillStyle = skin;
        ctx.fillRect(2, -62, 16, 6);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(16, -63, 4, 8);
        ctx.fillStyle = skin;
        ctx.fillRect(20, -65, 7, 10);

        // Mystical Yoga Flame Stream
        ctx.save();
        const flameW = Math.min(65, st * 4);
        const grad = ctx.createRadialGradient(24, -72, 4, 24 + flameW / 2, -72, flameW);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.3, '#facc15');
        grad.addColorStop(0.7, '#ea580c');
        grad.addColorStop(1, 'rgba(220, 38, 38, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(20, -72);
        ctx.lineTo(20 + flameW, -94);
        ctx.lineTo(24 + flameW * 1.1, -72);
        ctx.lineTo(20 + flameW, -50);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
        break;

      case FighterState.KNOCKDOWN:
      case FighterState.DEFEATED:
        ctx.fillStyle = trunks;
        ctx.fillRect(-22, -14, 28, 12);
        ctx.fillStyle = skin;
        ctx.fillRect(6, -12, 26, 10);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(28, -13, 4, 12); // Golden anklet
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-38, -10, 4, 8); // Golden wrist bangle
        drawDhalsimHead(-32, -10, 'hurt');
        break;

      case FighterState.VICTORY:
        // Floating mid-air in full lotus meditation posture (Padmasana)!
        const floatY = Math.sin(t * 0.12) * 6 - 20;
        ctx.save();
        ctx.translate(0, floatY);

        // Golden Dhoti Trunks
        ctx.fillStyle = trunks;
        ctx.fillRect(-18, -26, 36, 12);
        ctx.fillStyle = '#ca8a04';
        ctx.fillRect(-18, -26, 36, 3);

        // Crossed Legs with Golden Anklets & Soles Facing Upward
        ctx.fillStyle = skinDark;
        ctx.fillRect(-22, -18, 22, 10);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(-24, -17, 4, 8);
        ctx.fillStyle = skin;
        ctx.fillRect(0, -18, 22, 10);
        ctx.fillStyle = '#facc15';
        ctx.fillRect(20, -17, 4, 8);

        // Slender Ascetic Torso & Skull Necklace
        ctx.fillStyle = skin;
        ctx.fillRect(-12, -50, 24, 26);
        drawDhalsimHead(0, -58, 'smile');

        // Both Arms Resting in Sacred Chin Mudra (Index & Thumb touching on knees!)
        ctx.fillStyle = skinDark;
        ctx.fillRect(-18, -48, 6, 18);
        ctx.fillStyle = '#facc15'; // Bicep Band
        ctx.fillRect(-19, -44, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-22, -32, 8, 10);
        ctx.fillStyle = '#facc15'; // Wrist Bangle
        ctx.fillRect(-23, -24, 8, 3);
        ctx.fillStyle = skinDark;
        ctx.fillRect(-24, -21, 8, 6); // Chin Mudra fingers

        ctx.fillStyle = skin;
        ctx.fillRect(12, -48, 6, 18);
        ctx.fillStyle = '#facc15'; // Bicep Band
        ctx.fillRect(11, -44, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(14, -32, 8, 10);
        ctx.fillStyle = '#facc15'; // Wrist Bangle
        ctx.fillRect(15, -24, 8, 3);
        ctx.fillStyle = skin;
        ctx.fillRect(16, -21, 8, 6); // Chin Mudra fingers

        ctx.restore();
        break;

      default:
        this.renderDhalsim(ctx, { ...fighter, state: FighterState.IDLE });
        break;
    }
  }
}


// --- src/entities/ryu.js ---
/**
 * Ryu Entity
 * White Gi, Red Headband, Master of Shotokan Karate.
 */


class Ryu extends Fighter {
  constructor(x, id, facing = 1) {
    super(x, id, 'RYU', facing);

    this.giColor = '#f8fafc';
    this.giShade = '#cbd5e1';
    this.beltColor = '#0f172a';
    this.skinColor = '#fcd34d';
    this.skinShade = '#f59e0b';
    this.hairColor = '#3e2723';
    this.headbandColor = '#ef4444';
    this.gloveColor = '#dc2626';
  }

  renderPose(ctx) {
    CharacterRenderer.render(ctx, this);
  }
}


// --- src/entities/ken.js ---
/**
 * Ken Masters Entity
 * Crimson Red Gi, Blonde Hair, Fiery Shotokan Specialist.
 */


class Ken extends Fighter {
  constructor(x, id, facing = -1) {
    super(x, id, 'KEN', facing);

    this.giColor = '#dc2626';
    this.giShade = '#991b1b';
    this.beltColor = '#0f172a';
    this.skinColor = '#fcd34d';
    this.skinShade = '#f59e0b';
    this.hairColor = '#facc15';
    this.headbandColor = null; // No headband
    this.gloveColor = '#78350f';
  }

  renderPose(ctx) {
    CharacterRenderer.render(ctx, this);
  }
}


// --- src/entities/chunli.js ---
/**
 * Chun-Li Entity
 * Fast acrobatic combatant with Lightning Legs, Kikoken, and Spinning Bird Kick.
 */


class ChunLi extends Fighter {
  constructor(x, id, facing = 1) {
    super(x, id, 'CHUN-LI', facing);
    this.walkFwdSpeed = 3.6; // Fastest ground speed
    this.walkBackSpeed = 2.8;
  }

  renderPose(ctx) {
    CharacterRenderer.render(ctx, this);
  }
}


// --- src/entities/guile.js ---
/**
 * Guile Entity
 * Military zoning master with Sonic Boom and Flash Kick.
 */


class Guile extends Fighter {
  constructor(x, id, facing = 1) {
    super(x, id, 'GUILE', facing);
    this.walkFwdSpeed = 3.0;
    this.walkBackSpeed = 2.4;
  }

  renderPose(ctx) {
    CharacterRenderer.render(ctx, this);
  }
}


// --- src/entities/bison.js ---
/**
 * M. Bison Entity (Final Boss)
 * Dictator with Psycho Crusher and Scissor Kick.
 */


class Bison extends Fighter {
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


// --- src/entities/blanka.js ---
/**
 * Blanka Entity
 * Wild beast of the Brazilian rainforest.
 * Features Electric Thunder and Rolling Attack (Beast Cannonball).
 */


class Blanka extends Fighter {
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


// --- src/entities/ehonda.js ---
/**
 * E. Honda Entity
 * Sumo wrestling grand champion of Japan.
 * Features Hundred Hand Slap (Hyakuretsu Harite) and Super Sumo Headbutt.
 */


class EHonDa extends Fighter {
  constructor(x, id, facing = 1) {
    super(x, id, 'E. HONDA', facing);

    this.walkFwdSpeed = 2.9;
    this.walkBackSpeed = 2.2;
    this.pushWidth = 48;
    this.pushHeight = 98;
    this.maxHealth = 105;
    this.health = 105;
    this.displayHealth = 105;

    this.skinColor = '#fcd34d';
    this.skinShade = '#f59e0b';
    this.hairColor = '#18181b';
    this.facePaint = '#dc2626';
    this.mawashiColor = '#1e40af';
    this.mawashiStripe = '#ffffff';
  }

  renderPose(ctx) {
    CharacterRenderer.render(ctx, this);
  }
}


// --- src/entities/zangief.js ---
/**
 * Zangief Entity
 * The Red Cyclone of Russia.
 * Features Double Lariat and the devastating Spinning Piledriver (SPD).
 */


class Zangief extends Fighter {
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


// --- src/entities/dhalsim.js ---
/**
 * Dhalsim Entity
 * Mystical ascetic yogi from India.
 * Features Yoga Fire, Yoga Flame, and telescoping stretchy limbs.
 */


class Dhalsim extends Fighter {
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


// --- src/main.js ---
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


const GameMode = {
  VERSUS_2P: 'VERSUS_2P',
  TOURNAMENT: 'TOURNAMENT',
  CPU_PRACTICE: 'CPU_PRACTICE'
};

const MatchState = {
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

const ROSTER = [
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

function createFighter(name, x, id, facing) {
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



})();
