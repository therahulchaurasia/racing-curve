// Mountain silhouette generation (pure, no JSX). Each ridge is the UPPER ENVELOPE (smooth-max) of
// rounded cosine "bumps" placed at varied x/heights/widths — overlapping bumps merge into a connected
// range with distinct peaks; the gaps read as valleys. (Additive noise gave dunes; a sine gave clone
// hills. Envelope-of-bumps reads as actual mountains.) The `Mountains` component (components/) just
// renders the polygon points this produces.

import { mulberry32 } from "./random"

// viewBox basis. W:H roughly matches the wide backdrop so the none-stretch stays mild. SAMPLE = x
// sampling step (small = smoother curve).
export const VB_W = 1500
export const VB_H = 280
const SAMPLE = 3

export type Ridge = {
  color: string
  base: number // valley-floor Y as a fraction of height (0 = top, 1 = bottom)
  amp: number // tallest-peak rise above the floor, fraction of height
  peaks: number // number of bumps placed across the width
  seed: number
}

type Bump = { cx: number; h: number; wl: number; wr: number } // asymmetric: left/right flank widths

const OVERSCAN = 0.16 // fraction of width to place bumps beyond EACH edge, then let the viewBox chop
const VALLEY_CHANCE = 0.65 // share of gaps that drop to a real valley (rest connect as a saddle)
const SMOOTH = 0.16 // saddle-join rounding (env units); bigger = rounder where two bumps meet
const SMOOTH_RAMP = 0.3 // join must be this high (env units) for FULL rounding; lower fades it out

// 1D value noise: random heights at `cells`+1 lattice points, smoothstep-interpolated. Used for the
// slow ground roll under the peaks (so valleys don't all sit on one flat line).
function valueNoise(seed: number, cells: number): (u: number) => number {
  const rng = mulberry32(seed)
  const v: number[] = []
  for (let i = 0; i <= cells; i++) v.push(rng())
  return (u) => {
    const fx = u * cells
    const i = Math.floor(fx)
    const t = fx - i
    const a = v[i] ?? 0
    const b = v[i + 1] ?? a
    return a + (b - a) * (t * t * (3 - 2 * t))
  }
}

// Lay out a ridge's bumps across the width PLUS an overscan margin each side (so the visible edges
// cut through a mountain, not start flat). Centres are evenly spaced but jittered; heights vary. Each
// GAP is a "valley" (narrow flanks → envelope falls to the floor) or a "saddle" (wide flanks → dip
// stays high). Each ridge is generated independently from its own seed + peak count.
export function layoutBumps(seed: number, peaks: number): Bump[] {
  const rng = mulberry32(seed)
  const slot = VB_W / peaks
  const pad = Math.ceil((VB_W * OVERSCAN) / slot) // extra slots beyond each edge
  const cx: number[] = []
  const h: number[] = []
  for (let i = -pad; i < peaks + pad; i++) {
    cx.push((i + 0.5) * slot + (rng() - 0.5) * slot * 0.85) // jittered, stays ordered
    h.push(0.45 + rng() * 0.55) // 0.45..1 → varied heights
  }
  const n = cx.length
  const wl = new Array(n).fill(slot * 0.6)
  const wr = new Array(n).fill(slot * 0.6)
  for (let j = 0; j < n - 1; j++) {
    const dist = cx[j + 1] - cx[j]
    // valley f in 0.5..0.78 → smaller = deeper dip; bigger = shallower. saddle 0.95 = barely dips.
    const f = rng() < VALLEY_CHANCE ? 0.5 + rng() * 0.28 : 0.95
    wr[j] = dist * f
    wl[j + 1] = dist * f
  }
  return cx.map((c, i) => ({ cx: c, h: h[i], wl: wl[i], wr: wr[i] }))
}

// Rounded finite hump with independent left/right flank widths: 1 at the centre, smoothly to 0 at
// distance w on that side, nothing beyond. Cosine = soft peak + concave skirt that reads as a flank.
function bump(dx: number, wl: number, wr: number): number {
  const w = dx < 0 ? wl : wr
  const d = Math.abs(dx)
  if (d >= w) return 0
  return 0.5 * (1 + Math.cos((Math.PI * d) / w))
}

// Smooth maximum (quadratic). Where a and b are far apart it's just max(a,b); near the crossover it
// rounds the join instead of leaving the sharp corner a hard max() makes at a saddle.
function smoothMax(a: number, b: number, k: number): number {
  const h = Math.max(0, Math.min(1, 0.5 + (0.5 * (a - b)) / k))
  return a * h + b * (1 - h) + k * h * (1 - h)
}

// A set of bumps + a base/amp/ground → SVG polygon points. y(x) follows the bump envelope plus a
// slow ground roll (so valleys vary in height); then it closes down the right edge and the bottom.
export function envPoints(bumps: Bump[], base: number, amp: number, groundSeed: number): string {
  const floorY = base * VB_H
  const ampY = amp * VB_H
  const ground = valueNoise(groundSeed, 4)
  const groundY = amp * VB_H * 0.3
  const pts: string[] = []
  for (let x = 0; x <= VB_W; x += SAMPLE) {
    // smooth-max only over bumps that actually reach x (c > 0). The first sets env directly; further
    // overlaps round the saddle. Skipping zero contributions keeps the floor from drifting upward.
    let env = -1
    for (const b of bumps) {
      const c = b.h * bump(x - b.cx, b.wl, b.wr)
      if (c <= 0) continue
      if (env < 0) {
        env = c
        continue
      }
      // fade the rounding out as the join nears the floor → high saddles round, deep valleys stay a
      // clean cosine U (no stray micro-peak where two flanks meet near zero). k→0 ⇒ plain hard max.
      const k = SMOOTH * Math.min(1, Math.min(env, c) / SMOOTH_RAMP)
      env = smoothMax(env, c, k)
    }
    if (env < 0) env = 0
    const y = floorY - ampY * env - groundY * ground(x / VB_W)
    pts.push(`${x},${y.toFixed(1)}`)
  }
  pts.push(`${VB_W},${VB_H}`, `0,${VB_H}`)
  return pts.join(" ")
}

// Back ridge — the dominant far range: darkest navy, TALLER (peaks rise above the front), broad.
export const BACK_RIDGE: Ridge = {
  color: "#160f33",
  base: 0.9,
  amp: 0.65,
  peaks: 5,
  seed: 24,
}

// Front ridge — lighter purple, shorter, more/smaller hills. Drawn on top, sits in front of the back.
export const FRONT_RIDGE: Ridge = {
  color: "#2b1f56",
  base: 0.98,
  amp: 0.45,
  peaks: 8,
  seed: 25,
}
