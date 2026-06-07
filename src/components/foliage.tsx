// Foliage — single source of truth for the plant scatter.
// Shared by the /process tuning lab (ProcessPreviews) and the real page background (FoliageLayer).
// Hook-free + presentational, so it works in both server and client components.

export const PLANTS = [
  "/assets/environment/Plant1.png",
  "/assets/environment/Plant2.png",
  "/assets/environment/Plant3.png",
]

export type ClumpPart = { i: number; size: number; dx: number; flip?: boolean }

// Curated composites. Array order is back→front (later parts draw on top). Every part sits on the
// shared bottom baseline (bottom: 0) so the clump reads as planted on one patch of ground.
export const CLUMPS: { name: string; parts: ClumpPart[] }[] = [
  {
    name: "tree + bush",
    parts: [
      { i: 1, size: 84, dx: 0 },
      { i: 2, size: 46, dx: 58 },
    ],
  },
  {
    name: "twin trees",
    parts: [
      { i: 1, size: 74, dx: 0 },
      { i: 1, size: 60, dx: 48, flip: true },
    ],
  },
  {
    name: "grove",
    parts: [
      { i: 0, size: 80, dx: 0 },
      { i: 1, size: 100, dx: 40, flip: false },
    ],
  },
  {
    name: "bush row 1",
    parts: [
      { i: 2, size: 64, dx: 0, flip: true },
      { i: 2, size: 44, dx: 30 },
    ],
  },
  {
    name: "bush row 2",
    parts: [
      { i: 2, size: 64, dx: 0 },
      { i: 2, size: 86, dx: 12, flip: false },
      { i: 2, size: 56, dx: 45 },
    ],
  },
  {
    name: "mixed",
    parts: [
      { i: 1, size: 72, dx: 0, flip: true },
      { i: 0, size: 66, dx: 44 },
      { i: 2, size: 40, dx: 32 },
    ],
  },
  { name: "lone tree", parts: [{ i: 0, size: 92, dx: 0 }] },
  {
    name: "merged 1",
    parts: [
      { i: 0, size: 80, dx: 0 },
      { i: 1, size: 90, dx: 10, flip: true },
    ],
  },
  {
    name: "merged 2",
    parts: [
      { i: 0, size: 80, dx: 0 },
      { i: 0, size: 90, dx: 20, flip: true },
    ],
  },
]

// placeable foliage types = the curated clumps only (bare single sprites dropped — clumps read
// better and never look lonely). "lone tree" still covers the single-tree case as a curated clump.
export const FOLIAGE = CLUMPS

// Bush-only variations (sprite i:2 = the bush). Used for the night roadside scrub — low clumps, no
// trees — rendered as dark silhouettes (see FoliageLayer `filter`).
export const BUSHES: { name: string; parts: ClumpPart[] }[] = [
  // mix of mid + big so the field scatters (smaller ones can sit at varied heights, big ones anchor).
  // capped so the tallest (×scaleMax) fits the bush strip without clipping or overflowing the footer.
  { name: "bush mid", parts: [{ i: 2, size: 70, dx: 0 }] },
  { name: "bush mid pair", parts: [{ i: 2, size: 78, dx: 0 }, { i: 2, size: 60, dx: 46, flip: true }] },
  { name: "bush sm", parts: [{ i: 2, size: 80, dx: 0 }] },
  { name: "bush md", parts: [{ i: 2, size: 96, dx: 0 }] },
  { name: "bush pair", parts: [{ i: 2, size: 92, dx: 0 }, { i: 2, size: 66, dx: 56, flip: true }] },
  { name: "bush trio", parts: [{ i: 2, size: 84, dx: 0, flip: true }, { i: 2, size: 100, dx: 30 }, { i: 2, size: 70, dx: 86 }] },
]

export function Clump({ parts }: { parts: ClumpPart[] }) {
  const W = Math.max(...parts.map((p) => p.dx + p.size))
  const H = Math.max(...parts.map((p) => p.size))
  return (
    <div style={{ position: "relative", width: W, height: H }}>
      {parts.map((p, k) => (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={k}
          src={PLANTS[p.i]}
          alt=""
          style={{
            position: "absolute",
            left: p.dx,
            bottom: 0,
            width: p.size,
            height: p.size,
            imageRendering: "pixelated",
            transform: p.flip ? "scaleX(-1)" : undefined,
          }}
        />
      ))}
    </div>
  )
}

// deterministic PRNG (mulberry32) — same seed ⇒ same layout, so the field never jumps on refresh
export function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export type FoliageItem = { x: number; y: number; parts: ClumpPart[]; scale: number }

// Seeded jittered grid: cols × rows cells, each kept with chance `fill`, one random foliage type
// dropped at a jittered x%/y% inside its cell at a random scale. Sorted by y so lower (front)
// plants draw on top. Pure + deterministic for a given seed — positions are in % of the field.
export function scatterFoliage({
  cols,
  rows,
  fill,
  jitter,
  seed,
  types = FOLIAGE,
  scaleMin = 0.6,
  scaleMax = 1.1,
}: {
  cols: number
  rows: number
  fill: number
  jitter: number
  seed: number
  types?: { name: string; parts: ClumpPart[] }[] // which foliage set to draw from (e.g. BUSHES)
  scaleMin?: number // per-item random scale range — raise the floor to keep small items from getting
  scaleMax?: number // too tiny (size = part.size × scale)
}): FoliageItem[] {
  // seed folds in the grid params so changing them reshuffles deterministically too
  const rng = mulberry32(seed * 1000 + cols * 31 + rows * 7)
  const cw = 100 / cols
  const ch = 100 / rows
  const out: FoliageItem[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rng() > fill) continue // empty cell — organic density variation
      const type = types[Math.floor(rng() * types.length)]
      const scale = scaleMin + rng() * (scaleMax - scaleMin)
      const x = c * cw + rng() * jitter * cw
      const y = r * ch + rng() * jitter * ch
      out.push({ x, y, parts: type.parts, scale })
    }
  }
  out.sort((a, b) => a.y - b.y) // lower (front) drawn last = on top
  return out
}
