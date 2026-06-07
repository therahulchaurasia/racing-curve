"use client"

// Two smooth mountain ridges for the night backdrop — renders the polygon points produced by the
// silhouette engine in @/lib/mountains. BACK = darker + TALLER (dominant far range); FRONT = lighter
// + shorter, drawn on top. preserveAspectRatio="none" stretches the fixed bump count to the
// container, so the same peaks get wider/taller on bigger screens. Draft in /process; lock, then port.

import { memo } from "react"
import {
  VB_W,
  VB_H,
  type Ridge,
  layoutBumps,
  envPoints,
  BACK_RIDGE,
  FRONT_RIDGE,
} from "@/lib/mountains"

// memo: static backdrop — without this it re-runs the bump/envelope math every rAF frame of a race
export const Mountains = memo(function Mountains({
  front = FRONT_RIDGE,
  back = BACK_RIDGE,
  height = 300,
}: {
  front?: Ridge
  back?: Ridge
  height?: number
}) {
  const backBumps = layoutBumps(back.seed, back.peaks)
  const frontBumps = layoutBumps(front.seed, front.peaks)
  return (
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      preserveAspectRatio="none"
      style={{ display: "block" }}
    >
      {/* back first (taller dark range), then the lighter, shorter front range on top */}
      <polygon points={envPoints(backBumps, back.base, back.amp, back.seed + 900)} fill={back.color} />
      <polygon points={envPoints(frontBumps, front.base, front.amp, front.seed + 555)} fill={front.color} />
    </svg>
  )
})
