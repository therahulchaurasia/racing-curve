"use client"

// Star shapes for the night sky. Three pixel forms, matching the reference scatter:
//  - "dot"    → the graph-dot octagon (BULB_CLIP, shared) — stays round at tiny sizes
//  - "plus"   → a 4-point sparkle: a square BOSS in the centre with a thinner plus whose arms
//               protrude past it on all four sides. Drawn as SVG rects on an integer grid with
//               crispEdges so the blocks stay chunky/sharp — clip-path % blurs the arms at this size.
//  - "square" → a plain pixel square
// Stars carry a bright tint + optional glow so they pop against the deep sky. One presentational
// <Star>; scattering a seeded mix of these across the sky comes next.

import { useLayoutEffect, useMemo, useRef, useState } from "react"
import { BULB_CLIP } from "./clipPaths"
import { mulberry32 } from "./foliage"

export type StarShape = "dot" | "plus" | "plusDot" | "square"

// Sparkle grid (units): N×N cell, arm ARM units wide (thin), boss BOSS units square (big), centred.
const N = 9
const ARM = 1
const BOSS = 5
const ARM0 = (N - ARM) / 2 // 4
const BOSS0 = (N - BOSS) / 2 // 2

// Bright star tints — pure white plus faint warm/cool casts so the field isn't monotone.
export const STAR_COLORS = ["#ffffff", "#eaf2ff", "#d8e6ff", "#fff3d6", "#e9dcff"]

export function Star({
  shape,
  size = 6,
  color = "#ffffff",
  glow = true,
}: {
  shape: StarShape
  size?: number
  color?: string
  glow?: boolean
}) {
  // drop-shadow (not box-shadow) follows the actual silhouette → a soft halo, not a square one.
  // Big stars get a real glow; small ones only a minor halo (and many are rendered glow=false).
  const radius = size >= 12 ? size * 0.5 : size * 0.25
  const filter = glow ? `drop-shadow(0 0 ${Math.max(1, radius)}px ${color})` : undefined

  // plus: thin crisp arms + a SQUARE boss (SVG, crispEdges)
  if (shape === "plus") {
    return (
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${N} ${N}`}
        shapeRendering="crispEdges"
        fill={color}
        style={{ display: "block", filter }}
      >
        <rect x={ARM0} y={0} width={ARM} height={N} />
        <rect x={0} y={ARM0} width={N} height={ARM} />
        <rect x={BOSS0} y={BOSS0} width={BOSS} height={BOSS} />
      </svg>
    )
  }

  // plusDot: thin plus arms + our actual dot (BULB_CLIP octagon) as the boss, so the centre matches
  // the `dot` star exactly. Glow on the wrapper so the boss's clip-path doesn't eat the halo.
  if (shape === "plusDot") {
    const arm = Math.max(2, Math.round((size * ARM) / N))
    const boss = Math.round((size * BOSS) / N)
    const px = { background: color, imageRendering: "pixelated" as const }
    return (
      <div style={{ position: "relative", width: size, height: size, filter }}>
        <div style={{ position: "absolute", left: (size - arm) / 2, top: 0, width: arm, height: size, ...px }} />
        <div style={{ position: "absolute", top: (size - arm) / 2, left: 0, width: size, height: arm, ...px }} />
        <div style={{ position: "absolute", left: (size - boss) / 2, top: (size - boss) / 2, width: boss, height: boss, clipPath: BULB_CLIP, ...px }} />
      </div>
    )
  }

  const base = {
    width: size,
    height: size,
    background: color,
    imageRendering: "pixelated" as const,
  }
  // square: no clip, so the glow filter can live on the same element
  if (shape === "square") return <div style={{ ...base, filter }} />
  // dot: clip-path is applied AFTER filter, so a drop-shadow on the same element gets clipped away.
  // Put the glow on an outer wrapper and the clip on the inner div → halo survives.
  return (
    <div style={{ filter, lineHeight: 0 }}>
      <div style={{ ...base, clipPath: BULB_CLIP }} />
    </div>
  )
}

// ---------- SCATTER ----------

export type StarItem = {
  x: number // % from left
  y: number // % from top
  shape: StarShape
  size: number
  color: string
  rot: number // deg (sparkles only; 0 otherwise)
  glow: boolean
}

const SQUARE_MIN = 2 // square stars 2..4px (bigger ones read as glitches; tiny reads as stars)
const DOT_MIN = 4 // dot stars 4..7px (a touch bigger so the round octagon actually reads)
const BIG = 14 // big stars 14..18px

// Fixed count of big plusDot sparkles, regardless of density (so tweaking density doesn't change
// how many sparkles there are). A handful of accents, not part of the field.
const SPARKLE_MIN = 3
const SPARKLE_RANGE = 4 // 3..6

// tint: mostly white, occasional faint cast
const pickColor = (rng: () => number) =>
  rng() < 0.6 ? STAR_COLORS[0] : STAR_COLORS[1 + Math.floor(rng() * (STAR_COLORS.length - 1))]

// Seeded star field, two layers:
//  - the FIELD: a JITTERED GRID of `cols×rows` small stars — squares 2–4px, dots 4–7px (square-heavy).
//    One star per cell at a random offset inside it → even coverage with no bald patches (pure random
//    x/y clusters and leaves gaps). Grid size scales with density.
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

// One star per ~AREA_PER_STAR px² of sky → grid scales with whatever height the backdrop gets, so
// density stays constant. `density` multiplies that baseline (smaller cell = denser). Measured once
// (positions are %, so a later resize just rescales — no relayout/pop), mirroring FoliageLayer.
const AREA_PER_STAR = 4500

// density/seed omitted → randomized per mount (fresh field every refresh, stable within a session).
// Pass them (e.g. the /process lab) to pin the field. Random density spans 0.8..1.4.
export function StarField({ density, seed }: { density?: number; seed?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  // stable per-mount fallbacks; a provided prop overrides them live (so the lab stays controllable)
  const [randomSeed] = useState(() => Math.floor(Math.random() * 1e9))
  const [randomDensity] = useState(() => 0.8 + Math.random() * 0.6)
  const resolvedSeed = seed ?? randomSeed
  const resolvedDensity = density ?? randomDensity

  useLayoutEffect(() => {
    if (!ref.current) return
    const { width, height } = ref.current.getBoundingClientRect()
    setSize({ w: width, h: height })
  }, [])

  const items = useMemo(() => {
    if (size.w === 0 || size.h === 0) return []
    // cell size from density → jittered grid of cols×rows (even coverage, no bald patches)
    const cell = Math.sqrt(AREA_PER_STAR / resolvedDensity)
    const cols = Math.max(1, Math.round(size.w / cell))
    const rows = Math.max(1, Math.round(size.h / cell))
    return scatterStars({ cols, rows, seed: resolvedSeed })
  }, [size.w, size.h, resolvedDensity, resolvedSeed])

  return (
    <div ref={ref} className="absolute inset-0 pointer-events-none">
      {items.map((s, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            transform: s.rot ? `rotate(${s.rot}deg)` : undefined,
          }}
        >
          <Star shape={s.shape} size={s.size} color={s.color} glow={s.glow} />
        </div>
      ))}
    </div>
  )
}
