import type { ControlPoints } from "@/components/BezierCurveEditor"

export type CurvePreset = { name: string; controlPoints: ControlPoints }

// The predefined easings shown in the lane popover. Single source of truth —
// extend this array to add more presets later.
export const CURVE_PRESETS: CurvePreset[] = [
  { name: "linear", controlPoints: [0, 0, 1, 1] },
  { name: "ease", controlPoints: [0.25, 0.1, 0.25, 1] },
  { name: "ease-in", controlPoints: [0.42, 0, 1, 1] },
  { name: "ease-out", controlPoints: [0, 0, 0.58, 1] },
  { name: "ease-in-out", controlPoints: [0.42, 0, 0.58, 1] },
]

const EPS = 1e-3

const LINEAR = CURVE_PRESETS.find((p) => p.name === "linear")!

// Any curve whose BOTH control points sit on the y=x diagonal traces y=x → it's linear, regardless
// of where on the diagonal they sit: 0,0,1,1 / 0,0,0,0 / 0.5,0.5,0.5,0.5 all race identically.
export function isLinear(cp: ControlPoints): boolean {
  return Math.abs(cp[0] - cp[1]) < EPS && Math.abs(cp[2] - cp[3]) < EPS
}

// The preset whose control points match cp, or null if cp is a custom curve.
export function matchPreset(cp: ControlPoints): CurvePreset | null {
  if (isLinear(cp)) return LINEAR // collapse all diagonal control points to linear
  return (
    CURVE_PRESETS.find((p) =>
      p.controlPoints.every((v, i) => Math.abs(v - cp[i]) < EPS),
    ) ?? null
  )
}

// Honest label derived from the curve: the preset name, or "custom".
export function labelForCurve(cp: ControlPoints): string {
  return matchPreset(cp)?.name ?? "custom"
}
