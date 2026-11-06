// Évaluation WebGPU d'un lot de tubes candidats : un thread par candidat
// calcule la réponse |H| (matrices chaînées en WGSL) et le coût L2 face à
// l'enveloppe cible. Même mathématique que src/model/tube.ts.

import { SECTION_COUNT } from "../model/tube";

const MAX_FREQS = 96;

// Les drapeaux WebGPU sont des nombres ; cette version de lib.dom ne publie
// pas les objets GPUBufferUsage / GPUMapMode.
const BUF = {
  MAP_READ: 0x0001,
  COPY_SRC: 0x0004,
  COPY_DST: 0x0008,
  UNIFORM: 0x0040,
  STORAGE: 0x0080,
} as const;

const SHADER = /* wgsl */ `
const RHO: f32 = 1.204;
const CSOUND: f32 = 343.0;
const NSEC: u32 = ${SECTION_COUNT}u;
const MAX_FREQS: u32 = ${MAX_FREQS}u;

struct Meta {
  nCand: u32,
  nFreq: u32,
}

@group(0) @binding(0) var<storage, read> candidates: array<f32>; // nCand × (NSEC+1)
@group(0) @binding(1) var<storage, read> freqs: array<f32>;
@group(0) @binding(2) var<storage, read> target: array<f32>; // dB, moyenne retirée
@group(0) @binding(3) var<storage, read_write> costs: array<f32>;
@group(0) @binding(4) var<uniform> meta: Meta;

fn cmul(a: vec2f, b: vec2f) -> vec2f {
  return vec2f(a.x * b.x - a.y * b.y, a.x * b.y + a.y * b.x);
}

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) gid: vec3u) {
  let c = gid.x;
  if (c >= meta.nCand) { return; }
  let base = c * (NSEC + 1u);
  let lengthM = candidates[base + NSEC] / 100.0;
  let secLen = lengthM / f32(NSEC);

  var modelDb: array<f32, MAX_FREQS>;
  var mean: f32 = 0.0;

  for (var fi: u32 = 0u; fi < meta.nFreq; fi++) {
    let f = freqs[fi];
    let omega = 6.2831853 * f;
    let kRe = omega / CSOUND;
    let kIm = -(0.006 * kRe + 0.4);

    var A = vec2f(1.0, 0.0);
    var B = vec2f(0.0, 0.0);
    var Cc = vec2f(0.0, 0.0);
    var D = vec2f(1.0, 0.0);

    for (var s: u32 = 0u; s < NSEC; s++) {
      let areaM2 = max(candidates[base + s], 0.05) * 1e-4;
      let z0 = RHO * CSOUND / areaM2;
      let x = kRe * secLen;
      let y = kIm * secLen;
      let co = vec2f(cos(x) * cosh(y), -sin(x) * sinh(y));
      let si = vec2f(sin(x) * cosh(y), cos(x) * sinh(y));
      let m01 = vec2f(-z0 * si.y, z0 * si.x);
      let m10 = vec2f(-si.y / z0, si.x / z0);

      let nA = cmul(A, co) + cmul(B, m10);
      let nB = cmul(A, m01) + cmul(B, co);
      let nC = cmul(Cc, co) + cmul(D, m10);
      let nD = cmul(Cc, m01) + cmul(D, co);
      A = nA; B = nB; Cc = nC; D = nD;
    }

    let areaLip = max(candidates[base + NSEC - 1u], 0.05) * 1e-4;
    let aLip = sqrt(areaLip / 3.14159265);
    let ka = (omega / CSOUND) * aLip;
    let zBase = RHO * CSOUND / areaLip;
    let ZL = vec2f(zBase * 0.25 * ka * ka, zBase * 0.613 * ka);

    let denom = cmul(Cc, ZL) + D;
    let mag = max(length(denom), 1e-12);
    // Réponse du tube + pente de source (−6 dB/oct autour de 1 kHz).
    let db = -20.0 * log(mag) / log(10.0) - 19.93 * log(f / 1000.0) / log(10.0);
    modelDb[fi] = db;
    mean += db;
  }
  mean /= f32(meta.nFreq);

  var cost: f32 = 0.0;
  for (var fi: u32 = 0u; fi < meta.nFreq; fi++) {
    let d = (modelDb[fi] - mean) - target[fi];
    cost += d * d;
  }
  costs[c] = cost;
}
`;

let devicePromise: Promise<GPUDevice> | null = null;

async function getDevice(): Promise<GPUDevice> {
  devicePromise ??= (async () => {
    const gpu = (navigator as Navigator & { gpu?: GPU }).gpu;
    if (!gpu) throw new Error("WebGPU indisponible");
    const adapter = await gpu.requestAdapter();
    if (!adapter) throw new Error("Aucun adaptateur WebGPU");
    return adapter.requestDevice();
  })();
  return devicePromise;
}

export function webGpuSupported(): boolean {
  return Boolean((navigator as Navigator & { gpu?: GPU }).gpu);
}

/** Coût L2 de chaque candidat face à l'enveloppe cible (moyenne retirée). */
export async function evaluateBatchGpu(
  candidates: Float32Array,
  freqs: Float32Array,
  targetDb: Float32Array,
): Promise<Float32Array> {
  if (freqs.length > MAX_FREQS) throw new Error("Grille de fréquences trop grande");
  const device = await getDevice();
  const nCand = candidates.length / (SECTION_COUNT + 1);

  const module = device.createShaderModule({ code: SHADER });
  const pipeline = device.createComputePipeline({
    layout: "auto",
    compute: { module, entryPoint: "main" },
  });

  const makeStorage = (data: Float32Array, usage: number) => {
    const buf = device.createBuffer({ size: Math.max(16, data.byteLength), usage });
    device.queue.writeBuffer(buf, 0, data.buffer as ArrayBuffer, data.byteOffset, data.byteLength);
    return buf;
  };

  const candBuf = makeStorage(candidates, BUF.STORAGE | BUF.COPY_DST);
  const freqBuf = makeStorage(freqs, BUF.STORAGE | BUF.COPY_DST);
  const targetBuf = makeStorage(targetDb, BUF.STORAGE | BUF.COPY_DST);
  const costBuf = device.createBuffer({
    size: Math.max(16, nCand * 4),
    usage: BUF.STORAGE | BUF.COPY_SRC,
  });
  const metaBuf = device.createBuffer({
    size: 16,
    usage: BUF.UNIFORM | BUF.COPY_DST,
  });
  device.queue.writeBuffer(metaBuf, 0, new Uint32Array([nCand, freqs.length, 0, 0]));
  const readBuf = device.createBuffer({
    size: Math.max(16, nCand * 4),
    usage: BUF.COPY_DST | BUF.MAP_READ,
  });

  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: candBuf } },
      { binding: 1, resource: { buffer: freqBuf } },
      { binding: 2, resource: { buffer: targetBuf } },
      { binding: 3, resource: { buffer: costBuf } },
      { binding: 4, resource: { buffer: metaBuf } },
    ],
  });

  const encoder = device.createCommandEncoder();
  const pass = encoder.beginComputePass();
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  pass.dispatchWorkgroups(Math.ceil(nCand / 64));
  pass.end();
  encoder.copyBufferToBuffer(costBuf, 0, readBuf, 0, nCand * 4);
  device.queue.submit([encoder.finish()]);

  await readBuf.mapAsync(BUF.MAP_READ);
  const result = new Float32Array(readBuf.getMappedRange().slice(0));
  readBuf.unmap();
  for (const b of [candBuf, freqBuf, targetBuf, costBuf, metaBuf, readBuf]) b.destroy();
  return result.subarray(0, nCand).slice();
}
