// Star-field DATA + scatter logic (pure, no JSX). The presentational <Star> / <StarField> live in
// components/Stars.tsx and consume this.

import { mulberry32 } from "./random"

export type StarShape = "dot" | "plus" | "plusDot" | "square"

export type StarItem = {
  x: number // % from left
  y: number // % from top
  shape: StarShape
  size: number
  color: string
  rot: number // deg (sparkles only; 0 otherwise)
  glow: boolean
}

// Bright star tints — pure white plus faint warm/cool casts so the field isn't monotone.
export const STAR_COLORS = ["#ffffff", "#eaf2ff", "#d8e6ff", "#fff3d6", "#e9dcff"]

const SQUARE_MIN = 2 // square stars 2..4px (bigger ones read as glitches; tiny reads as stars)
const DOT_MIN = 4 // dot stars 4..7px (a touch bigger so the round octagon actually reads)
const BIG = 14 // big stars 14..18px

// Fixed count of big plusDot sparkles, regardless of density (so tweaking density doesn't change how
// many sparkles there are). A handful of accents, not part of the field.
const SPARKLE_MIN = 3
const SPARKLE_RANGE = 4 // 3..6

// tint: mostly white, occasional faint cast
const pickColor = (rng: () => number) =>
  rng() < 0.6 ? STAR_COLORS[0] : STAR_COLORS[1 + Math.floor(rng() * (STAR_COLORS.length - 1))]

// Seeded star field, two layers:
//  - the FIELD: a JITTERED GRID of `cols×rows` small stars — squares 2–4px, dots 4–7px (square-heavy).
//    One star per cell at a random offset inside it → even coverage with no bald patches. Grid scales
//    with density.
//  - the SPARKLES: a fixed 3–6 big (14–18px) rotated plusDot accents, from an INDEPENDENT seed stream
//    so changing density never reshuffles them.
// Big sparkles always glow; small stars glow ~half the time. Deterministic per seed.
export function scatterStars({
  cols,
  rows,
  seed,
  jitter = 0.85,
}: {
  cols: number
  rows: number
  seed: number
  jitter?: number
}): StarItem[] {
  const rng = mulberry32(seed)
  const out: StarItem[] = []
  const cw = 100 / cols
  const ch = 100 / rows
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const shape: StarShape = rng() < 0.62 ? "square" : "dot" // square-heavy small field
      // squares stay tiny specks (2..4); dots run a touch bigger (4..7) so the round shape reads
      const size =
        shape === "square" ? SQUARE_MIN + Math.floor(rng() * 3) : DOT_MIN + Math.floor(rng() * 4)
      const color = pickColor(rng)
      const glow = rng() < 0.5 // small stars glow ~half the time
      const x = c * cw + rng() * jitter * cw // jittered inside the cell
      const y = r * ch + rng() * jitter * ch
      out.push({ x, y, shape, size, color, rot: 0, glow })
    }
  }

  // sparkles — separate rng so they stay put as the field's grid changes
  const sRng = mulberry32(seed + 12345)
  const sparkles = SPARKLE_MIN + Math.floor(sRng() * SPARKLE_RANGE)
  for (let i = 0; i < sparkles; i++) {
    const size = BIG + Math.floor(sRng() * 5) // 14..18
    const color = pickColor(sRng)
    const x = sRng() * 100
    const y = Math.pow(sRng(), 1.3) * 100 // top-biased
    out.push({ x, y, shape: "plusDot", size, color, rot: sRng() * 90, glow: true })
  }

  return out
}
