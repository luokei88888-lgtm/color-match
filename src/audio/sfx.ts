export { generateGemTextures, specialTextureKey } from '../art/textures';

interface ToneOpts {
  freq: number;
  /** Target frequency to slide to over the duration. */
  to?: number;
  dur: number;
  type?: OscillatorType;
  /** Peak gain relative to the master bus (0..1). */
  peak?: number;
  delay?: number;
  attack?: number;
}

interface NoiseOpts {
  dur: number;
  /** Filter center/cutoff frequency. */
  freq: number;
  to?: number;
  filter?: BiquadFilterType;
  q?: number;
  peak?: number;
  delay?: number;
}

/**
 * Procedural sound effects on Web Audio — layered oscillators plus filtered
 * noise, no asset files needed (works offline in the desktop build).
 */
export class Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;

  constructor(private volume: number) {}

  setVolume(v: number): void {
    this.volume = v;
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
    }
  }

  getVolume(): number {
    return this.volume;
  }

  private ensure(): AudioContext | null {
    const AC =
      typeof AudioContext !== 'undefined'
        ? AudioContext
        : (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    if (!this.ctx) {
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    void this.ctx.resume();
    return this.ctx;
  }

  private tone(o: ToneOpts): void {
    if (this.volume <= 0.01) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    const t0 = ctx.currentTime + (o.delay ?? 0);
    const peak = o.peak ?? 0.2;
    const attack = o.attack ?? 0.008;

    const osc = ctx.createOscillator();
    osc.type = o.type ?? 'sine';
    osc.frequency.setValueAtTime(o.freq, t0);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(o.to, t0 + o.dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);

    osc.connect(gain);
    gain.connect(this.master);
    osc.start(t0);
    osc.stop(t0 + o.dur + 0.05);
  }

  private noise(o: NoiseOpts): void {
    if (this.volume <= 0.01) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    if (!this.noiseBuffer) {
      const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i += 1) data[i] = Math.random() * 2 - 1;
      this.noiseBuffer = buf;
    }
    const t0 = ctx.currentTime + (o.delay ?? 0);
    const peak = o.peak ?? 0.12;

    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = o.filter ?? 'bandpass';
    filter.frequency.setValueAtTime(o.freq, t0);
    if (o.to) filter.frequency.exponentialRampToValueAtTime(o.to, t0 + o.dur);
    filter.Q.value = o.q ?? 1.2;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + o.dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.master);
    src.start(t0);
    src.stop(t0 + o.dur + 0.05);
  }

  /** Selecting a gem — soft bubble tap. */
  tap(): void {
    this.tone({ freq: 520, to: 700, dur: 0.07, type: 'triangle', peak: 0.16 });
    this.noise({ dur: 0.03, freq: 2400, peak: 0.05 });
  }

  /** Two gems swapping — quick whoosh. */
  swap(): void {
    this.noise({ dur: 0.13, freq: 500, to: 1600, peak: 0.16, q: 2 });
    this.tone({ freq: 320, to: 480, dur: 0.1, type: 'sine', peak: 0.1 });
  }

  /** First match of a move; `step` raises pitch on deeper cascades. */
  match(step = 0): void {
    const base = 440 * Math.pow(1.122, Math.min(step, 10));
    this.tone({ freq: base, to: base * 1.06, dur: 0.14, type: 'triangle', peak: 0.24 });
    this.tone({ freq: base * 1.5, dur: 0.12, type: 'sine', peak: 0.14, delay: 0.02 });
    this.noise({ dur: 0.06, freq: 1800 + step * 200, peak: 0.1 });
  }

  /** Cascade pop — brighter than the first match, pitch climbs per step. */
  cascade(step = 1): void {
    const base = 560 * Math.pow(1.122, Math.min(step, 10));
    this.tone({ freq: base, to: base * 1.1, dur: 0.12, type: 'triangle', peak: 0.22 });
    this.tone({ freq: base * 2, dur: 0.09, type: 'sine', peak: 0.1, delay: 0.02 });
    this.noise({ dur: 0.05, freq: 2600, filter: 'highpass', peak: 0.08 });
  }

  /** Level cleared — little fanfare. */
  win(): void {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      const d = i * 0.13;
      const last = i === notes.length - 1;
      this.tone({ freq: f, dur: last ? 0.5 : 0.16, type: 'triangle', peak: 0.22, delay: d });
      this.tone({ freq: f / 2, dur: last ? 0.5 : 0.16, type: 'square', peak: 0.05, delay: d });
    });
    this.noise({ dur: 0.5, freq: 3000, filter: 'highpass', peak: 0.05, delay: 0.4 });
  }

  /** Out of moves — sad slide down. */
  lose(): void {
    this.tone({ freq: 320, to: 150, dur: 0.55, type: 'sawtooth', peak: 0.12 });
    this.tone({ freq: 240, to: 112, dur: 0.55, type: 'sine', peak: 0.14, delay: 0.04 });
  }

  /** Countdown warning — urgent short click. */
  tick(): void {
    this.tone({ freq: 1100, dur: 0.05, type: 'square', peak: 0.1 });
    this.tone({ freq: 550, dur: 0.06, type: 'sine', peak: 0.08 });
  }

  /** Booster used — heavy thunk with debris. */
  booster(): void {
    this.tone({ freq: 200, to: 80, dur: 0.2, type: 'sine', peak: 0.32 });
    this.noise({ dur: 0.14, freq: 350, filter: 'lowpass', peak: 0.2 });
    this.noise({ dur: 0.05, freq: 2000, peak: 0.08 });
  }
}
