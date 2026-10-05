/**
 * Web Audio API Sound Synthesizer for Monarch Hunter System
 * Provides procedural soundscapes and game SFX without external asset dependencies.
 */

class SoundManager {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientSources: AudioNode[] = [];
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Play short sound effect
  playSfx(type: 'click' | 'attack' | 'critical' | 'victory' | 'levelup' | 'arise' | 'damage') {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.linearRampToValueAtTime(0.001, now + 0.06);
        osc.start(now);
        osc.stop(now + 0.06);
      } else if (type === 'attack') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.18);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'critical') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.35);
        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
      } else if (type === 'damage') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);
        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      } else if (type === 'levelup') {
        // Multi-frequency victory fanfare chord
        const freqs = [330, 415, 493, 659];
        freqs.forEach((f, idx) => {
          if (!this.ctx) return;
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(f, now + idx * 0.07);
          g.gain.setValueAtTime(0.12, now + idx * 0.07);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
          o.connect(g);
          g.connect(this.ctx.destination);
          o.start(now + idx * 0.07);
          o.stop(now + 0.65);
        });
      } else if (type === 'arise') {
        // Deep resonant Monarch 'ARISE' awakening hum
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(55, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.8);
        osc.frequency.exponentialRampToValueAtTime(440, now + 1.4);
        gain.gain.setValueAtTime(0.01, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.6);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);
        osc.start(now);
        osc.stop(now + 1.8);
      } else if (type === 'victory') {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
          if (!this.ctx) return;
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(f, now + idx * 0.09);
          g.gain.setValueAtTime(0.15, now + idx * 0.09);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
          o.connect(g);
          g.connect(this.ctx.destination);
          o.start(now + idx * 0.09);
          o.stop(now + 0.85);
        });
      }
    } catch {
      // Audio not supported or blocked by browser policy until interaction
    }
  }

  // Start procedural ambient soundscape for the Focus Room
  startAmbient(preset: 'rain' | 'void' | 'binaural', volume = 0.3) {
    this.stopAmbient();
    if (this.isMuted) return;

    try {
      this.initCtx();
      if (!this.ctx) return;

      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(volume, this.ctx.currentTime);
      masterGain.connect(this.ctx.destination);
      this.ambientGain = masterGain;

      if (preset === 'binaural') {
        // 40Hz Gamma wave focus tone: 200Hz left, 240Hz right
        const oscL = this.ctx.createOscillator();
        const oscR = this.ctx.createOscillator();
        const panL = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
        const panR = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

        oscL.type = 'sine';
        oscL.frequency.value = 216;
        oscR.type = 'sine';
        oscR.frequency.value = 256;

        if (panL && panR) {
          panL.pan.value = -0.8;
          panR.pan.value = 0.8;
          oscL.connect(panL);
          oscR.connect(panR);
          panL.connect(masterGain);
          panR.connect(masterGain);
        } else {
          oscL.connect(masterGain);
          oscR.connect(masterGain);
        }

        oscL.start();
        oscR.start();
        this.ambientSources = [oscL, oscR];
      } else if (preset === 'void') {
        // Deep atmospheric resonance drone
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const filter = this.ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.value = 55;
        osc2.type = 'triangle';
        osc2.frequency.value = 82.5;

        filter.type = 'lowpass';
        filter.frequency.value = 240;

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(masterGain);

        osc1.start();
        osc2.start();
        this.ambientSources = [osc1, osc2];
      } else if (preset === 'rain') {
        // Procedural soft pink-noise rain simulation
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
          b6 = white * 0.115926;
        }

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        noise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 800;

        noise.connect(filter);
        filter.connect(masterGain);
        noise.start();
        this.ambientSources = [noise];
      }
    } catch {
      // Audio not permitted
    }
  }

  stopAmbient() {
    this.ambientSources.forEach(s => {
      try {
        if ('stop' in s && typeof (s as AudioScheduledSourceNode).stop === 'function') {
          (s as AudioScheduledSourceNode).stop();
        }
      } catch {
        // Ignore
      }
    });
    this.ambientSources = [];
  }

  setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) this.stopAmbient();
  }

  getMuted() {
    return this.isMuted;
  }
}

export const soundManager = new SoundManager();
