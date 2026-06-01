import type { ControlPoints } from "@/components/BezierCurveEditor"

export type Lane = {
  id: string
  controlPoints: ControlPoints
  label: string
  color: string
}
