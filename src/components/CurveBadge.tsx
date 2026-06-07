import { memo } from "react"
import type { ControlPoints } from "./BezierCurveEditor"
import { bezierPathD } from "@/lib/bezierPath"

type Props = {
  controlPoints: ControlPoints
  color: string
  size?: number
}

// memo: the lane re-renders every rAF frame (car moves); the badge curve never changes mid-race
export const CurveBadge = memo(function CurveBadge({ controlPoints, color, size = 36 }: Props) {
  return (
    <svg
      viewBox="-4 -4 108 108"
      width={size}
      height={size}
      style={{ background: "var(--color-ink)", borderRadius: 6 }}
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
})
