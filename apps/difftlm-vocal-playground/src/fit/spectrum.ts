// Enveloppe spectrale d'un clip : moyenne de Welch (FFT + Hann), lissage,
// puis échantillonnage en dB sur la grille de fréquences de l'ajustement.

const FFT_SIZE = 2048;

export function spectralEnvelopeDb(
  samples: Float32Array,
  sampleRate: number,
  gridHz: Float32Array,
): Float32Array {
  const hop = FFT_SIZE / 2;
  const window = new Float32Array(FFT_SIZE);
  for (let i = 0; i < FFT_SIZE; i++) {
    window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (FFT_SIZE - 1));
  }

  const power = new Float32Array(FFT_SIZE / 2);
  const re = new Float32Array(FFT_SIZE);
  const im = new Float32Array(FFT_SIZE);
  let frames = 0;
  for (let start = 0; start + FFT_SIZE <= samples.length; start += hop) {
    for (let i = 0; i < FFT_SIZE; i++) {
      re[i] = samples[start + i] * window[i];
      im[i] = 0;
    }
    fftInPlace(re, im);
    for (let i = 0; i < FFT_SIZE / 2; i++) {
      power[i] += re[i] * re[i] + im[i] * im[i];
    }
    frames++;
  }
  if (frames === 0) throw new Error("Clip trop court pour l'analyse.");
  for (let i = 0; i < power.length; i++) power[i] /= frames;

  // Lissage (~±100 Hz) pour gommer les harmoniques et garder l'enveloppe.
  const binHz = sampleRate / FFT_SIZE;
  const radius = Math.max(1, Math.round(100 / binHz));
  const smooth = new Float32Array(power.length);
  for (let i = 0; i < power.length; i++) {
    let sum = 0;
    let count = 0;
    for (let j = Math.max(0, i - radius); j <= Math.min(power.length - 1, i + radius); j++) {
      sum += power[j];
      count++;
    }
    smooth[i] = sum / count;
  }

  const out = new Float32Array(gridHz.length);
  for (let g = 0; g < gridHz.length; g++) {
    const pos = gridHz[g] / binHz;
    const i0 = Math.min(smooth.length - 2, Math.max(0, Math.floor(pos)));
    const t = Math.min(1, Math.max(0, pos - i0));
    const p = smooth[i0] * (1 - t) + smooth[i0 + 1] * t;
    out[g] = 10 * Math.log10(Math.max(p, 1e-14));
  }
  return out;
}

/** FFT radix-2 itérative, en place. */
function fftInPlace(re: Float32Array, im: Float32Array): void {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wRe = Math.cos(ang);
    const wIm = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let curRe = 1;
      let curIm = 0;
      for (let j = 0; j < len / 2; j++) {
        const aRe = re[i + j];
        const aIm = im[i + j];
        const bRe = re[i + j + len / 2] * curRe - im[i + j + len / 2] * curIm;
        const bIm = re[i + j + len / 2] * curIm + im[i + j + len / 2] * curRe;
        re[i + j] = aRe + bRe;
        im[i + j] = aIm + bIm;
        re[i + j + len / 2] = aRe - bRe;
        im[i + j + len / 2] = aIm - bIm;
        const nextRe = curRe * wRe - curIm * wIm;
        curIm = curRe * wIm + curIm * wRe;
        curRe = nextRe;
      }
    }
  }
}
