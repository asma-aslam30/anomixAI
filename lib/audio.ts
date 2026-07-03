export type SoundType =
  | "ambient"
  | "critical"
  | "alert"
  | "click"
  | "upload"
  | "analyse"
  | "complete"
  | "chat"
  | "typing"
  | "heartbeat"
  | "bassdrop"
  | "powerup"
  | "warning"
  | "whisper"
  | "scream"
  | "staticburst";

class SentinelAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientOscillators: OscillatorNode[] = [];
  private ambientLfo: OscillatorNode | null = null;
  private _enabled = true;
  private _threatLevel = 0;
  private speechSynth: SpeechSynthesis | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  get enabled() {
    return this._enabled;
  }

  private getContext(): AudioContext {
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.ctx = new Ctor();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this._enabled ? 0.25 : 0;
      this.masterGain.connect(this.ctx.destination);
    }
    return this.ctx;
  }

  toggle() {
    this._enabled = !this._enabled;
    if (this.masterGain) {
      this.masterGain.gain.value = this._enabled ? 0.25 : 0;
    }
    if (this._enabled) {
      this.startAmbient();
      this.updateHeartbeat();
    } else {
      this.stopAmbient();
      this.stopHeartbeat();
    }
    if (!this._enabled && this.speechSynth) {
      this.speechSynth.cancel();
    }
    return this._enabled;
  }

  setThreatLevel(level: number) {
    this._threatLevel = Math.max(0, Math.min(1, level));
    if (this.ambientOscillators.length > 0) {
      const baseFreq = 55 + this._threatLevel * 40;
      this.ambientOscillators.forEach((osc, i) => {
        try {
          osc.frequency.value = baseFreq + i * 0.5;
        } catch {}
      });
    }
    if (this.ambientGain) {
      this.ambientGain.gain.value = 0.03 + this._threatLevel * 0.07;
    }
    this.updateHeartbeat();
  }

  private updateHeartbeat() {
    this.stopHeartbeat();
    if (this._threatLevel > 0 && this._enabled) {
      const intervalMs = Math.max(600, 3000 - this._threatLevel * 2500);
      this.heartbeatInterval = setInterval(() => {
        this.play("heartbeat");
      }, intervalMs);
    }
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  startAmbient() {
    if (!this._enabled) return;
    try {
      this.stopAmbient();
      const ctx = this.getContext();
      this.ambientGain = ctx.createGain();
      this.ambientGain.gain.value = 0.03;
      this.ambientGain.connect(this.masterGain!);

      for (let i = 0; i < 3; i++) {
        const osc = ctx.createOscillator();
        osc.type = "sawtooth";
        osc.frequency.value = 55 + i * 0.3;
        const og = ctx.createGain();
        og.gain.value = 0.4;
        osc.connect(og);
        og.connect(this.ambientGain);
        osc.start();
        this.ambientOscillators.push(osc);
      }

      this.ambientLfo = ctx.createOscillator();
      this.ambientLfo.type = "sine";
      this.ambientLfo.frequency.value = 0.08;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.015;
      this.ambientLfo.connect(lfoGain);
      lfoGain.connect(this.ambientGain.gain);
      this.ambientLfo.start();
    } catch {}
  }

  stopAmbient() {
    this.ambientOscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch {}
    });
    this.ambientOscillators = [];
    if (this.ambientLfo) {
      try {
        this.ambientLfo.stop();
      } catch {}
      this.ambientLfo = null;
    }
    this.ambientGain = null;
  }

  play(type: SoundType) {
    if (!this._enabled) return;
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      switch (type) {
        case "critical": {
          const gain = ctx.createGain();
          gain.gain.value = 0.25;
          gain.connect(this.masterGain!);

          const osc1 = ctx.createOscillator();
          osc1.type = "sawtooth";
          osc1.frequency.value = 880;
          osc1.connect(gain);

          const osc2 = ctx.createOscillator();
          osc2.type = "square";
          osc2.frequency.value = 660;
          osc2.connect(gain);

          const osc3 = ctx.createOscillator();
          osc3.type = "sawtooth";
          osc3.frequency.value = 440;
          const g3 = ctx.createGain();
          g3.gain.value = 0.12;
          osc3.connect(g3);
          g3.connect(this.masterGain!);

          osc1.start(now);
          osc2.start(now);
          osc3.start(now);
          osc1.frequency.linearRampToValueAtTime(440, now + 0.5);
          osc2.frequency.linearRampToValueAtTime(880, now + 0.5);
          osc3.frequency.linearRampToValueAtTime(220, now + 0.4);

          setTimeout(() => {
            osc1.stop();
            osc2.stop();
            osc3.stop();
          }, 1800);

          this.speak("CRITICAL THREAT DETECTED");
          break;
        }
        case "alert": {
          const gain = ctx.createGain();
          gain.gain.value = 0.15;
          gain.connect(this.masterGain!);

          const osc = ctx.createOscillator();
          osc.type = "square";
          osc.frequency.value = 1200;
          osc.connect(gain);
          osc.start(now);
          osc.frequency.linearRampToValueAtTime(800, now + 0.15);
          setTimeout(() => osc.stop(), 200);

          const osc2 = ctx.createOscillator();
          osc2.type = "square";
          osc2.frequency.value = 1400;
          const g2 = ctx.createGain();
          g2.gain.value = 0.1;
          g2.connect(this.masterGain!);
          osc2.connect(g2);
          osc2.start(now + 0.25);
          setTimeout(() => osc2.stop(), 150);
          break;
        }
        case "click": {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.value = 2000;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.05, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          osc.connect(g);
          g.connect(this.masterGain!);
          osc.start(now);
          osc.stop(now + 0.05);
          break;
        }
        case "upload": {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(200, now);
          osc.frequency.linearRampToValueAtTime(1200, now + 0.3);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.08, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.connect(g);
          g.connect(this.masterGain!);
          osc.start(now);
          osc.stop(now + 0.4);
          break;
        }
        case "analyse": {
          for (let i = 0; i < 4; i++) {
            const osc = ctx.createOscillator();
            osc.type = "square";
            osc.frequency.value = 400 + i * 150;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.03, now + i * 0.08);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.06);
            osc.connect(g);
            g.connect(this.masterGain!);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.08);
          }
          break;
        }
        case "complete": {
          [523, 659, 784, 1047].forEach((freq, i) => {
            const osc = ctx.createOscillator();
            osc.type = "sine";
            osc.frequency.value = freq;
            const g = ctx.createGain();
            g.gain.setValueAtTime(0.06, now + i * 0.08);
            g.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
            osc.connect(g);
            g.connect(this.masterGain!);
            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.35);
          });
          break;
        }
        case "chat": {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.value = 800;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.04, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          osc.connect(g);
          g.connect(this.masterGain!);
          osc.start(now);
          osc.stop(now + 0.12);
          break;
        }
        case "typing": {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.value = 1200 + Math.random() * 400;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.02, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.03);
          osc.connect(g);
          g.connect(this.masterGain!);
          osc.start(now);
          osc.stop(now + 0.04);
          break;
        }
        case "heartbeat": {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.value = 60;
          const env = ctx.createGain();
          env.gain.setValueAtTime(0, now);
          env.gain.linearRampToValueAtTime(0.12 + this._threatLevel * 0.15, now + 0.02);
          env.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc.connect(env);
          env.connect(this.masterGain!);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }
        case "bassdrop": {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.value = 40;
          const env = ctx.createGain();
          env.gain.setValueAtTime(0, now);
          env.gain.linearRampToValueAtTime(0.3, now + 0.01);
          env.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
          osc.connect(env);
          env.connect(this.masterGain!);
          osc.start(now);
          osc.stop(now + 0.6);

          const noise = ctx.createOscillator();
          noise.type = "sawtooth";
          noise.frequency.value = 30;
          const ng = ctx.createGain();
          ng.gain.setValueAtTime(0.08, now);
          ng.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          noise.connect(ng);
          ng.connect(this.masterGain!);
          noise.start(now);
          noise.stop(now + 0.3);
          break;
        }
        case "powerup": {
          const osc = ctx.createOscillator();
          osc.type = "sine";
          osc.frequency.setValueAtTime(100, now);
          osc.frequency.exponentialRampToValueAtTime(2000, now + 0.6);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0.06, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
          osc.connect(g);
          g.connect(this.masterGain!);
          osc.start(now);
          osc.stop(now + 0.8);

          const osc2 = ctx.createOscillator();
          osc2.type = "square";
          osc2.frequency.setValueAtTime(150, now + 0.1);
          osc2.frequency.exponentialRampToValueAtTime(2500, now + 0.5);
          const g2 = ctx.createGain();
          g2.gain.setValueAtTime(0.03, now + 0.1);
          g2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
          osc2.connect(g2);
          g2.connect(this.masterGain!);
          osc2.start(now + 0.1);
          osc2.stop(now + 0.7);
          break;
        }
        case "warning": {
          const osc = ctx.createOscillator();
          osc.type = "square";
          osc.frequency.value = 880;
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(0.08, now + 0.03);
          g.gain.linearRampToValueAtTime(0, now + 0.1);
          g.gain.linearRampToValueAtTime(0.08, now + 0.15);
          g.gain.linearRampToValueAtTime(0, now + 0.22);
          osc.connect(g);
          g.connect(this.masterGain!);
          osc.start(now);
          osc.stop(now + 0.25);
          break;
        }
        case "whisper": {
          const bufSize = ctx.sampleRate * 0.6;
          const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufSize; i++) {
            const t = i / ctx.sampleRate;
            const noise = Math.random() * 2 - 1;
            const tone = Math.sin(2 * Math.PI * 180 * t) * 0.3;
            const envelope = Math.max(0, 1 - t / 0.6);
            data[i] = (noise * 0.3 + tone) * envelope * 0.15;
          }
          const src = ctx.createBufferSource();
          src.buffer = buffer;
          const bp = ctx.createBiquadFilter();
          bp.type = "bandpass";
          bp.frequency.value = 400;
          bp.Q.value = 1.5;
          src.connect(bp);
          bp.connect(this.masterGain!);
          src.start(now);
          break;
        }
        case "scream": {
          const bufSize = ctx.sampleRate * 0.8;
          const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufSize; i++) {
            const t = i / ctx.sampleRate;
            const noise = Math.random() * 2 - 1;
            const freq = 800 + t * 3000;
            const tone = Math.sin(2 * Math.PI * freq * t);
            const envelope = Math.max(0, 1 - t / 0.8);
            data[i] = (noise * 0.4 + tone * 0.5) * envelope * 0.2;
          }
          const src = ctx.createBufferSource();
          src.buffer = buffer;
          const dist = ctx.createWaveShaper();
          const k = 50;
          const samples = new Float32Array(256);
          for (let i = 0; i < 256; i++) {
            const x = (i / 255) * 2 - 1;
            samples[i] = ((1 + k) * x) / (1 + k * Math.abs(x));
          }
          dist.curve = samples;
          src.connect(dist);
          dist.connect(this.masterGain!);
          src.start(now);
          break;
        }
        case "staticburst": {
          const bufSize = ctx.sampleRate * 0.15;
          const buffer = ctx.createBuffer(1, bufSize, ctx.sampleRate);
          const data = buffer.getChannelData(0);
          for (let i = 0; i < bufSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.max(0, 1 - i / bufSize);
          }
          const src = ctx.createBufferSource();
          src.buffer = buffer;
          const hp = ctx.createBiquadFilter();
          hp.type = "highpass";
          hp.frequency.value = 2000;
          src.connect(hp);
          hp.connect(this.masterGain!);
          src.start(now);
          break;
        }
      }
    } catch {}
  }

  speak(text: string) {
    if (!this._enabled) return;
    try {
      if (!this.speechSynth) {
        this.speechSynth = window.speechSynthesis;
      }
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.3;
      utterance.pitch = 0.8;
      utterance.volume = 0.5;
      utterance.lang = "en-US";
      this.speechSynth.speak(utterance);
    } catch {}
  }

  dispose() {
    this.stopAmbient();
    this.stopHeartbeat();
    if (this.speechSynth) {
      this.speechSynth.cancel();
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const audio = new SentinelAudio();
