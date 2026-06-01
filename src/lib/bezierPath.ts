import type { ControlPoints } from "@/components/BezierCurveEditor"

export function bezierHandles(cp: ControlPoints) {
  const [p1x, p1y, p2x, p2y] = cp
  return {
    h1x: p1x * 100,
    h1y: (1 - p1y) * 100,
    h2x: p2x * 100,
    h2y: (1 - p2y) * 100,
  }
}

export function bezierPathD(cp: ControlPoints): string {
  const { h1x, h1y, h2x, h2y } = bezierHandles(cp)
  return `M 0 100 C ${h1x} ${h1y}, ${h2x} ${h2y}, 100 0`
}
