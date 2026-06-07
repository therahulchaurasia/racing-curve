export type LightColor = "red" | "amber" | "green"

// Per-color ramp: `on` is an ordered list of stops from hot center → dark rim, quantized onto the
// pixel grid by radius. `glow` is the halo hue; `off` is the flat dimmed-dark fill.
const RAMPS: Record<LightColor, { glow: string; on: string[]; off: string }> = {
  red: { glow: "#e23b3b", on: ["#ff9a9a", "#ff6a6a", "#e23b3b", "#b41f1f", "#7e1414"], off: "#8a2a2a" },
  amber: { glow: "#f5b50a", on: ["#ffe07a", "#ffd24d", "#f5b50a", "#e07a10", "#9c4a08"], off: "#9a6e16" },
  green: { glow: "#2ecc40", on: ["#9cf08a", "#7be85a", "#2ecc40", "#149a2a", "#0a5e19"], off: "#1f7a34" },
}

// odd grid ⇒ the center sits ON a pixel, so rings rasterize 4-fold symmetric and their notches
// grow monotonically outward (an even grid centers between pixels → lopsided, non-monotonic steps)
const GRID = 15 // pixels across the bulb

const HOUSING_BG = "#0d0d0d" // near-black socket behind each bulb (darker than the billboard panel)
const HOUSING_SHADOW = "inset 0 2px 3px rgba(0,0,0,0.7)" // recessed-slot depth

type Props = {
  color: LightColor
  on?: boolean
  size?: number
  housing?: boolean
}

// A single pixel start-light, drawn as a real grid of square cells: the circle is whichever cells
// fall inside the radius (boxy, stair-stepped edge) and the color is the ramp quantized by distance
// from center (boxy concentric bands). `on` adds a drop-shadow halo in the hue. `housing` sits the
// bulb in a small near-black square socket; the glow still spills past its edges.
export function StartLight({ color, on = false, size = 40, housing = true }: Props) {
  const ramp = RAMPS[color]
  const c = (GRID - 1) / 2
  const radius = GRID / 2
  const glow = Math.round(size * 0.15)

  const cells: React.ReactNode[] = []
  for (let y = 0; y < GRID; y++) {
    for (let x = 0; x < GRID; x++) {
      const dist = Math.hypot(x - c, y - c)
      if (dist > radius) continue // outside the circle → transparent (boxy edge)
      const r = dist / radius // 0 at center → 1 at rim
      const fill = on
        ? ramp.on[Math.min(ramp.on.length - 1, Math.floor(r * ramp.on.length))]
        : ramp.off
      cells.push(<rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={fill} />)
    }
  }

  const bulb = (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${GRID} ${GRID}`}
      preserveAspectRatio="none"
      shapeRendering="crispEdges"
      style={{
        display: "block",
        imageRendering: "pixelated",
        filter: on ? `drop-shadow(0 0 ${glow}px ${ramp.glow})` : undefined,
      }}
    >
      {cells}
    </svg>
  )

  if (!housing) return bulb

  return (
    <div
      style={{
        display: "inline-flex",
        padding: Math.round(size * 0.16),
        background: HOUSING_BG,
        boxShadow: HOUSING_SHADOW,
        imageRendering: "pixelated",
      }}
    >
      {bulb}
    </div>
  )
}
