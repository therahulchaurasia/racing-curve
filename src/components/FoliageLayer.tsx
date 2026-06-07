"use client"

import { memo, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Clump } from "./Clump"
import { scatterFoliage, type ClumpPart } from "@/lib/foliage"

// Static seeded foliage scatter for the page background. Measures its own box ONCE on mount and
// derives the grid from a target cell size, so density stays consistent across screen sizes and
// page heights. Positions are in %, so a later window resize just scales them — no re-measure, no
// relayout/pop. Sits at absolute inset-0 behind content (pointer-events: none).
//
// Defaults match the look locked in via the /process tuning lab (6×6 feel, fill 75%, jitter 0.6).

type Props = {
  seed?: number
  cellSize?: number // ~px per plant; smaller = denser
  fill?: number
  jitter?: number
  types?: { name: string; parts: ClumpPart[] }[] // foliage set to draw from (default = all clumps)
  filter?: string // CSS filter applied to the whole layer, e.g. a dark silhouette for night scrub
  scaleMin?: number // per-item scale range (raise the floor to stop small items getting tiny)
  scaleMax?: number
}

// memo: static scatter — without this it reconciles every clump/img on every rAF frame of a race
export const FoliageLayer = memo(function FoliageLayer({ seed, cellSize = 150, fill = 0.75, jitter = 0.6, types, filter, scaleMin, scaleMax }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  // fresh layout every page load (per mount); stable within a session. Pass `seed` to pin it.
  const [resolvedSeed] = useState(() => seed ?? Math.floor(Math.random() * 1e9))

  // measure once — fixes the grid; resize afterwards only scales the % positions (no pop)
  useLayoutEffect(() => {
    if (!ref.current) return
    const { width, height } = ref.current.getBoundingClientRect()
    setSize({ w: width, h: height })
  }, [])

  const items = useMemo(() => {
    if (size.w === 0 || size.h === 0) return []
    const cols = Math.max(1, Math.round(size.w / cellSize))
    const rows = Math.max(1, Math.round(size.h / cellSize))
    return scatterFoliage({ cols, rows, fill, jitter, seed: resolvedSeed, types, scaleMin, scaleMax })
  }, [size.w, size.h, cellSize, fill, jitter, resolvedSeed, types, scaleMin, scaleMax])

  const EDGE = 8 // px breathing room kept clear at the zone's top/bottom

  return (
    <div
      ref={ref}
      className="absolute inset-0 z-0 overflow-hidden pointer-events-none"
      style={{ filter }}
    >
      {items.map((it, k) => {
        // clamp vertically so the plant's full (scaled) height fits inside the zone — otherwise
        // overflow-hidden flat-cuts plants that poke past the road/top edge. Horizontal is left
        // free: the zone is full-width, so side overflow clips harmlessly at the screen edge.
        const h = Math.max(...it.parts.map((p) => p.size)) * it.scale
        const maxTop = Math.max(0, size.h - h - EDGE)
        const top = Math.min((it.y / 100) * size.h, maxTop)
        return (
          <div
            key={k}
            className="absolute"
            style={{
              left: `${it.x}%`,
              top,
              transform: `scale(${it.scale})`,
              transformOrigin: "top left",
            }}
          >
            <Clump parts={it.parts} />
          </div>
        )
      })}
    </div>
  )
})
