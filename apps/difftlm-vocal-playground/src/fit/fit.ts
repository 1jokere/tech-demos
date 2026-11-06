// Ajustement spectral simplifié : recherche aléatoire d'une forme de tube
// dont l'enveloppe (réponse + pente de source) ressemble à celle du clip
// enregistré, puis raffinement local. Le lot de candidats est évalué sur
// WebGPU quand c'est possible, sinon sur CPU.

import { SECTION_COUNT, tubeResponseDb, type TubeParams } from "../model/tube";
import { PRESETS } from "../model/presets";
import { evaluateBatchGpu, webGpuSupported } from "./gpu";
import { spectralEnvelopeDb } from "./spectrum";
import type { Recording } from "./record";

export type FitBackend = "webgpu" | "cpu";

export interface FitResult {
  params: TubeParams;
  backend: FitBackend;
  /** Enveloppe cible (dB, moyenne retirée) sur la grille, pour affichage. */
  targetDb: Float32Array;
  gridHz: Float32Array;
}

const N_CANDIDATES = 2048;
const REFINE_STEPS = 300;
const AREA_MIN = 0.3;
const AREA_MAX = 8;
const LEN_MIN = 14;
const LEN_MAX = 19;

export function fitGrid(): Float32Array {
  const n = Math.floor((3800 - 250) / 50) + 1;
  const g = new Float32Array(n);
  for (let i = 0; i < n; i++) g[i] = 250 + i * 50;
  return g;
}

export async function fitRecording(rec: Recording): Promise<FitResult> {
  const gridHz = fitGrid();
  const raw = spectralEnvelopeDb(rec.samples, rec.sampleRate, gridHz);
  const targetDb = meanRemove(raw);

  const candidates = buildCandidates();
  let costs: Float32Array;
  let backend: FitBackend;
  if (webGpuSupported()) {
    try {
      costs = await evaluateBatchGpu(candidates, gridHz, targetDb);
      backend = "webgpu";
    } catch {
      costs = evaluateBatchCpu(candidates, gridHz, targetDb);
      backend = "cpu";
    }
  } else {
    costs = evaluateBatchCpu(candidates, gridHz, targetDb);
    backend = "cpu";
  }

  let bestIdx = 0;
  for (let i = 1; i < costs.length; i++) {
    if (costs[i] < costs[bestIdx]) bestIdx = i;
  }
  const stride = SECTION_COUNT + 1;
  let best: TubeParams = {
    areas: Array.from(candidates.subarray(bestIdx * stride, bestIdx * stride + SECTION_COUNT)),
    lengthCm: candidates[bestIdx * stride + SECTION_COUNT],
  };
  let bestCost = candidateCost(best, gridHz, targetDb);

  // Raffinement local (toujours CPU : peu de candidats, surcoût GPU inutile).
  for (let step = 0; step < REFINE_STEPS; step++) {
    const scale = 0.25 * (1 - step / REFINE_STEPS) + 0.03;
    const trial: TubeParams = {
      areas: best.areas.map((a) =>
        clamp(a * Math.exp(gauss() * scale), AREA_MIN, AREA_MAX),
      ),
      lengthCm: clamp(best.lengthCm + gauss() * scale * 2, LEN_MIN, LEN_MAX),
    };
    const c = candidateCost(trial, gridHz, targetDb);
    if (c < bestCost) {
      best = trial;
      bestCost = c;
    }
  }

  return { params: best, backend, targetDb, gridHz };
}

function buildCandidates(): Float32Array {
  const stride = SECTION_COUNT + 1;
  const out = new Float32Array(N_CANDIDATES * stride);
  let idx = 0;
  // Graines : les préréglages et leurs interpolations deux à deux.
  for (const p of PRESETS) {
    if (idx >= N_CANDIDATES) break;
    writeCandidate(out, idx++, p.areas, p.lengthCm);
  }
  for (let i = 0; i < PRESETS.length; i++) {
    for (let j = i + 1; j < PRESETS.length; j++) {
      if (idx >= N_CANDIDATES) break;
      const a = PRESETS[i];
      const b = PRESETS[j];
      writeCandidate(
        out,
        idx++,
        a.areas.map((v, k) => (v + b.areas[k]) / 2),
        (a.lengthCm + b.lengthCm) / 2,
      );
    }
  }
  // Le reste : formes aléatoires lisses (log-uniformes, lissage voisin).
  while (idx < N_CANDIDATES) {
    const areas: number[] = [];
    for (let s = 0; s < SECTION_COUNT; s++) {
      areas.push(Math.exp(Math.log(AREA_MIN) + Math.random() * Math.log(AREA_MAX / AREA_MIN)));
    }
    for (let s = 1; s < SECTION_COUNT; s++) {
      areas[s] = Math.sqrt(areas[s] * areas[s - 1]);
    }
    writeCandidate(out, idx++, areas, LEN_MIN + Math.random() * (LEN_MAX - LEN_MIN));
  }
  return out;
}

function writeCandidate(out: Float32Array, idx: number, areas: number[], lengthCm: number): void {
  const stride = SECTION_COUNT + 1;
  for (let s = 0; s < SECTION_COUNT; s++) out[idx * stride + s] = areas[s];
  out[idx * stride + SECTION_COUNT] = lengthCm;
}

function evaluateBatchCpu(
  candidates: Float32Array,
  gridHz: Float32Array,
  targetDb: Float32Array,
): Float32Array {
  const stride = SECTION_COUNT + 1;
  const n = candidates.length / stride;
  const costs = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const params: TubeParams = {
      areas: Array.from(candidates.subarray(i * stride, i * stride + SECTION_COUNT)),
      lengthCm: candidates[i * stride + SECTION_COUNT],
    };
    costs[i] = candidateCost(params, gridHz, targetDb);
  }
  return costs;
}

function candidateCost(params: TubeParams, gridHz: Float32Array, targetDb: Float32Array): number {
  const db = tubeResponseDb(params, gridHz);
  const env = new Float32Array(db.length);
  for (let i = 0; i < db.length; i++) {
    env[i] = db[i] - 19.93 * Math.log10(gridHz[i] / 1000);
  }
  const centered = meanRemove(env);
  let cost = 0;
  for (let i = 0; i < centered.length; i++) {
    const d = centered[i] - targetDb[i];
    cost += d * d;
  }
  return cost;
}

function meanRemove(v: Float32Array): Float32Array {
  let mean = 0;
  for (const x of v) mean += x;
  mean /= v.length;
  const out = new Float32Array(v.length);
  for (let i = 0; i < v.length; i++) out[i] = v[i] - mean;
  return out;
}

function clamp(x: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, x));
}

function gauss(): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
