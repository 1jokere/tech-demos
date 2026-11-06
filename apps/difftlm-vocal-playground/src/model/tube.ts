// Modèle direct d'un tube acoustique : sections cylindriques concaténées,
// matrices chaînées (ligne de transmission) dans le domaine fréquentiel.
// Recréation pédagogique de l'idée de tube derrière diffTLM — pas une copie
// du simulateur différentiable des auteurs.

export const SECTION_COUNT = 8;

const RHO = 1.204; // densité de l'air, kg/m³
const C = 343; // célérité du son, m/s

export interface TubeParams {
  /** Aires des sections en cm², de la glotte vers les lèvres. */
  areas: number[];
  /** Longueur totale du conduit en cm. */
  lengthCm: number;
}

interface Complex {
  re: number;
  im: number;
}

/**
 * |H(f)| en dB pour chaque fréquence demandée, où H = U_lèvres / U_glotte.
 * Matrice chaînée [A B; C D] par section, charge de rayonnement aux lèvres,
 * source de débit idéale à la glotte : H = 1 / (C·Z_L + D).
 */
export function tubeResponseDb(params: TubeParams, freqs: Float32Array | number[]): Float32Array {
  const n = params.areas.length;
  const secLen = (params.lengthCm / 100) / n; // m
  const areasM2 = params.areas.map((a) => Math.max(a, 0.05) * 1e-4); // m²

  const out = new Float32Array(freqs.length);
  for (let fi = 0; fi < freqs.length; fi++) {
    const f = freqs[fi];
    const omega = 2 * Math.PI * f;
    // Nombre d'onde complexe : pertes légères (parois, viscosité) pour des
    // bandes passantes de formants réalistes au lieu de pics infinis.
    const kRe = omega / C;
    const kIm = -(0.006 * kRe + 0.4);

    // Produit des matrices chaînées, de la glotte vers les lèvres.
    let A: Complex = { re: 1, im: 0 };
    let B: Complex = { re: 0, im: 0 };
    let Cm: Complex = { re: 0, im: 0 };
    let D: Complex = { re: 1, im: 0 };

    for (let s = 0; s < n; s++) {
      const z0 = (RHO * C) / areasM2[s]; // impédance caractéristique
      // cos(kL) et sin(kL) pour k complexe, L = secLen.
      const x = kRe * secLen;
      const y = kIm * secLen;
      // cos(x+iy) = cos x cosh y - i sin x sinh y
      const cosRe = Math.cos(x) * Math.cosh(y);
      const cosIm = -Math.sin(x) * Math.sinh(y);
      // sin(x+iy) = sin x cosh y + i cos x sinh y
      const sinRe = Math.sin(x) * Math.cosh(y);
      const sinIm = Math.cos(x) * Math.sinh(y);

      // Matrice de la section : [cos, j z0 sin; j sin / z0, cos]
      const m00: Complex = { re: cosRe, im: cosIm };
      const m01: Complex = { re: -z0 * sinIm, im: z0 * sinRe };
      const m10: Complex = { re: -sinIm / z0, im: sinRe / z0 };
      const m11: Complex = { re: cosRe, im: cosIm };

      // [A B; C D] = [A B; C D] × M
      const nA = cAdd(cMul(A, m00), cMul(B, m10));
      const nB = cAdd(cMul(A, m01), cMul(B, m11));
      const nC = cAdd(cMul(Cm, m00), cMul(D, m10));
      const nD = cAdd(cMul(Cm, m01), cMul(D, m11));
      A = nA; B = nB; Cm = nC; D = nD;
    }

    // Impédance de rayonnement aux lèvres (piston dans un écran).
    const aLip = Math.sqrt(areasM2[n - 1] / Math.PI);
    const ka = (omega / C) * aLip;
    const zBase = (RHO * C) / areasM2[n - 1];
    const ZL: Complex = { re: zBase * 0.25 * ka * ka, im: zBase * 0.613 * ka };

    // H = 1 / (C·Z_L + D)
    const denom = cAdd(cMul(Cm, ZL), D);
    const mag = Math.hypot(denom.re, denom.im);
    out[fi] = -20 * Math.log10(Math.max(mag, 1e-12));
  }
  return out;
}

function cMul(a: Complex, b: Complex): Complex {
  return { re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re };
}
function cAdd(a: Complex, b: Complex): Complex {
  return { re: a.re + b.re, im: a.im + b.im };
}

export interface Formant {
  freq: number;
  levelDb: number;
}

/** Grille de fréquences standard pour le tracé et la détection de formants. */
export function responseGrid(fMin = 80, fMax = 5000, step = 10): Float32Array {
  const n = Math.floor((fMax - fMin) / step) + 1;
  const freqs = new Float32Array(n);
  for (let i = 0; i < n; i++) freqs[i] = fMin + i * step;
  return freqs;
}

/** Maxima locaux de la réponse = formants (F1, F2, …), affinés par parabole. */
export function findFormants(freqs: Float32Array, db: Float32Array, maxCount = 4): Formant[] {
  const peaks: Formant[] = [];
  for (let i = 1; i < db.length - 1 && peaks.length < maxCount; i++) {
    if (db[i] > db[i - 1] && db[i] >= db[i + 1]) {
      // Interpolation parabolique pour une fréquence de pic plus précise.
      const d0 = db[i - 1], d1 = db[i], d2 = db[i + 1];
      const denom = d0 - 2 * d1 + d2;
      const delta = denom !== 0 ? (0.5 * (d0 - d2)) / denom : 0;
      const step = freqs[1] - freqs[0];
      peaks.push({ freq: freqs[i] + delta * step, levelDb: d1 });
    }
  }
  return peaks;
}
