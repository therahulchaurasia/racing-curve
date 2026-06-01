import type { ControlPoints } from "./BezierCurveEditor"
import { bezierPathD } from "@/lib/bezierPath"

type Props = {
  controlPoints: ControlPoints
  color: string
  size?: number
}

export function CurveBadge({ controlPoints, color, size = 36 }: Props) {
  return (
    <svg
      viewBox="-4 -4 108 108"
      width={size}
      height={size}
      style={{ background: "#1a1a1a", borderRadius: 6 }}
    >
      <path
        d={bezierPathD(controlPoints)}
        stroke={color}
        strokeWidth={6}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
