// Scanpath generative engine — mirrors prototype.py exactly.

const AOIS = [
  // name,      x,     y,     category,      base_weight, sigma
  ["L_eye",     0.38,  0.42,  "eyes",        3.0,  0.06],
  ["R_eye",     0.62,  0.42,  "eyes",        3.0,  0.06],
  ["nose",      0.50,  0.55,  "core_other",  1.4,  0.05],
  ["mouth",     0.50,  0.72,  "core_other",  1.6,  0.06],
  ["forehead",  0.50,  0.20,  "contour",     0.5,  0.08],
  ["chin",      0.50,  0.90,  "contour",     0.5,  0.06],
  ["L_cheek",   0.24,  0.62,  "contour",     0.55, 0.07],
  ["R_cheek",   0.76,  0.62,  "contour",     0.55, 0.07],
  ["L_ear",     0.07,  0.50,  "periphery",   0.3,  0.06],
  ["R_ear",     0.93,  0.50,  "periphery",   0.3,  0.06],
  ["bg_L",      -0.08, 0.35,  "periphery",   0.22, 0.09],
  ["bg_R",      1.08,  0.35,  "periphery",   0.22, 0.09],
];
const CORE_TRIANGLE = new Set(["eyes", "core_other"]);
const N_FIX_MEAN = 15;
const IOR_DECAY_STEPS = 2;
const IOR_SUPPRESSION = 0.15;

function computeWeights(gazeAxis, localAxis) {
  return AOIS.map(([name, x, y, cat, base, sigma]) => {
    let w = base;
    if (cat === "eyes") w *= (0.15 + 0.85 * gazeAxis);
    else if (cat === "contour") w *= (1.0 + 2.5 * localAxis);
    else if (cat === "periphery") w *= (1.0 + 4.0 * localAxis);
    return w;
  });
}

// Simple seeded RNG (mulberry32) + gamma sampler (Marsaglia-Tsang) for reproducibility in-browser.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function randn(rng) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}
function gammaSample(rng, shape, scale) {
  // Marsaglia-Tsang for shape >= 1
  const d = shape - 1 / 3;
  const c = 1 / Math.sqrt(9 * d);
  while (true) {
    let x, v;
    do {
      x = randn(rng);
      v = 1 + c * x;
    } while (v <= 0);
    v = v * v * v;
    const u = rng();
    if (u < 1 - 0.0331 * x * x * x * x) return d * v * scale;
    if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) return d * v * scale;
  }
}
function weightedChoice(rng, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rng() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return weights.length - 1;
}
function poisson(rng, lambda) {
  const L = Math.exp(-lambda);
  let k = 0, p = 1;
  do { k++; p *= rng(); } while (p > L);
  return k - 1;
}

function runScanpath(gazeAxis, localAxis, rng, nFix = null) {
  if (nFix === null) {
    nFix = Math.max(6, poisson(rng, N_FIX_MEAN));
  }
  const staticW = computeWeights(gazeAxis, localAxis);
  const ior = new Array(AOIS.length).fill(1.0);
  const iorTimer = new Array(AOIS.length).fill(0);
  const stickiness = 3.0 * (1.0 - localAxis);

  const sequence = [];
  let prevCat = null;
  for (let step = 0; step < nFix; step++) {
    const w = staticW.map((val, i) => val * ior[i]);
    if (prevCat && CORE_TRIANGLE.has(prevCat)) {
      for (let i = 0; i < AOIS.length; i++) {
        if (CORE_TRIANGLE.has(AOIS[i][3])) w[i] *= (1.0 + stickiness);
      }
    }
    for (let i = 0; i < w.length; i++) w[i] = Math.max(w[i], 1e-6);
    const idx = weightedChoice(rng, w);
    const durMs = gammaSample(rng, 4.0, 70.0);
    sequence.push({ name: AOIS[idx][0], cat: AOIS[idx][3], x: AOIS[idx][1], y: AOIS[idx][2], dur: durMs });

    ior[idx] *= IOR_SUPPRESSION;
    iorTimer[idx] = IOR_DECAY_STEPS;
    for (let i = 0; i < AOIS.length; i++) {
      if (i !== idx && iorTimer[i] > 0) {
        iorTimer[i]--;
        if (iorTimer[i] === 0) ior[i] = 1.0;
      }
    }
    prevCat = AOIS[idx][3];
  }
  return sequence;
}

function dwellFractions(sequence) {
  const totals = { eyes: 0, core_other: 0, contour: 0, periphery: 0 };
  let grand = 0;
  for (const f of sequence) { totals[f.cat] += f.dur; grand += f.dur; }
  const out = {};
  for (const k in totals) out[k] = totals[k] / grand;
  return out;
}

if (typeof module !== "undefined") {
  module.exports = { AOIS, computeWeights, runScanpath, dwellFractions, mulberry32 };
}
