// Synthèse de voyelle : somme d'harmoniques de la source glottique,
// pondérées par la réponse du tube |H(k·f0)|, rendue dans un AudioBuffer
// bouclé. Un léger vibrato rend le timbre moins mécanique.

import { tubeResponseDb, type TubeParams } from "../model/tube";

export interface SynthParams extends TubeParams {
  /** Fréquence fondamentale (hauteur de la source), Hz. */
  f0: number;
}

const MAX_HARMONIC_HZ = 4500;
const FADE_S = 0.06;

export class VowelSynth {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private gain: GainNode | null = null;
  private lfo: OscillatorNode | null = null;
  private lfoGain: GainNode | null = null;
  private current: SynthParams | null = null;

  get playing(): boolean {
    return this.source !== null;
  }

  start(params: SynthParams): void {
    this.ctx ??= new AudioContext();
    void this.ctx.resume();
    this.swapSource(params);
  }

  /** Met à jour la géométrie/hauteur ; ne fait rien si la lecture est arrêtée. */
  update(params: SynthParams): void {
    if (!this.ctx || !this.source) return;
    const c = this.current;
    if (
      c &&
      c.f0 === params.f0 &&
      c.lengthCm === params.lengthCm &&
      c.areas.length === params.areas.length &&
      c.areas.every((a, i) => a === params.areas[i])
    ) {
      return;
    }
    this.swapSource(params);
  }

  stop(): void {
    if (!this.ctx) return;
    this.teardown(this.ctx.currentTime);
  }

  private teardown(now: number): void {
    if (this.gain) {
      this.gain.gain.cancelScheduledValues(now);
      this.gain.gain.setValueAtTime(this.gain.gain.value, now);
      this.gain.gain.linearRampToValueAtTime(0, now + FADE_S);
    }
    const oldSource = this.source;
    const oldLfo = this.lfo;
    const oldLfoGain = this.lfoGain;
    const oldGain = this.gain;
    if (oldSource) {
      setTimeout(() => {
        try {
          oldSource.stop();
        } catch {
          // déjà arrêtée
        }
        oldSource.disconnect();
        oldLfo?.stop();
        oldLfo?.disconnect();
        oldLfoGain?.disconnect();
        oldGain?.disconnect();
      }, FADE_S * 1000 + 30);
    }
    this.source = null;
    this.gain = null;
    this.lfo = null;
    this.lfoGain = null;
    this.current = null;
  }

  private swapSource(params: SynthParams): void {
    const ctx = this.ctx!;
    const now = ctx.currentTime;
    this.teardown(now);

    const buffer = renderVowelBuffer(ctx, params);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Vibrato : ±0,3 % à 5 Hz sur la vitesse de lecture.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.003;
    lfo.connect(lfoGain);
    lfoGain.connect(source.playbackRate);
    lfo.start();

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.5, now + FADE_S);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();

    this.source = source;
    this.gain = gain;
    this.lfo = lfo;
    this.lfoGain = lfoGain;
    this.current = { ...params, areas: [...params.areas] };
  }
}

/** AudioBuffer d'un nombre entier de périodes (~0,5 s), bouclable sans clic. */
function renderVowelBuffer(ctx: AudioContext, params: SynthParams): AudioBuffer {
  const sr = ctx.sampleRate;
  const periods = Math.max(1, Math.round(0.5 * params.f0));
  const length = Math.round((periods / params.f0) * sr);
  const buffer = ctx.createBuffer(1, length, sr);
  const data = buffer.getChannelData(0);

  const nHarm = Math.max(1, Math.floor(MAX_HARMONIC_HZ / params.f0));
  const freqs = new Float32Array(nHarm);
  for (let k = 0; k < nHarm; k++) freqs[k] = (k + 1) * params.f0;
  const db = tubeResponseDb(params, freqs);

  // Amplitude = pente source+rayonnement (≈ −6 dB/oct → 1/k) × |H|.
  const amps = new Float32Array(nHarm);
  let maxAmp = 0;
  for (let k = 0; k < nHarm; k++) {
    amps[k] = (1 / (k + 1)) * Math.pow(10, db[k] / 20);
    maxAmp = Math.max(maxAmp, amps[k]);
  }

  // f0 réelle de la boucle, pour que la période tombe exactement sur la longueur.
  const f0Loop = (periods * sr) / length;
  for (let k = 0; k < nHarm; k++) {
    const amp = amps[k] / (maxAmp || 1);
    if (amp < 1e-4) continue;
    const omega = (2 * Math.PI * (k + 1) * f0Loop) / sr;
    // Phase pseudo-aléatoire stable pour limiter le facteur de crête.
    const phase = Math.sin((k + 1) * 12.9898) * 43758.5453;
    for (let i = 0; i < length; i++) {
      data[i] += amp * Math.sin(omega * i + phase);
    }
  }

  // Normalisation du pic.
  let peak = 0;
  for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(data[i]));
  if (peak > 0) {
    const g = 0.9 / peak;
    for (let i = 0; i < length; i++) data[i] *= g;
  }
  return buffer;
}
