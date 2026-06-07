// Solves a CSS-style cubic-bezier(p1x, p1y, p2x, p2y) easing curve.
// Returns f(t) → p where t ∈ [0,1] is normalized time and p ∈ [0,1] is eased progress.
// Newton-Raphson with binary-search fallback — same approach as Webkit/Blink.

import { clamp01 } from "./math";

const NEWTON_ITERATIONS = 8;
const NEWTON_MIN_SLOPE = 0.001;
const SUBDIVISION_PRECISION = 1e-7;
const SUBDIVISION_MAX_ITERATIONS = 12;

export function cubicBezier(
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number,
): (t: number) => number {
  const ax = 1 - 3 * p2x + 3 * p1x;
  const bx = 3 * p2x - 6 * p1x;
  const cx = 3 * p1x;

  const ay = 1 - 3 * p2y + 3 * p1y;
  const by = 3 * p2y - 6 * p1y;
  const cy = 3 * p1y;

  const sampleX = (s: number) => ((ax * s + bx) * s + cx) * s;
  const sampleY = (s: number) => ((ay * s + by) * s + cy) * s;
  const sampleDerivativeX = (s: number) => (3 * ax * s + 2 * bx) * s + cx;

  const solveForS = (t: number): number => {
    let s = t;
    for (let i = 0; i < NEWTON_ITERATIONS; i++) {
      const slope = sampleDerivativeX(s);
      if (Math.abs(slope) < NEWTON_MIN_SLOPE) break;
      const x = sampleX(s) - t;
      s -= x / slope;
    }
    if (s >= 0 && s <= 1 && Math.abs(sampleX(s) - t) < SUBDIVISION_PRECISION) return s;

    let lo = 0;
    let hi = 1;
    s = t;
    for (let i = 0; i < SUBDIVISION_MAX_ITERATIONS; i++) {
      const x = sampleX(s);
      if (Math.abs(x - t) < SUBDIVISION_PRECISION) return s;
      if (x < t) lo = s;
      else hi = s;
      s = (lo + hi) / 2;
    }
    return s;
  };

  return (t: number) => {
    const tc = clamp01(t);
    if (tc === 0 || tc === 1) return tc;
    return clamp01(sampleY(solveForS(tc)));
  };
}
