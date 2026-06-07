"use client"

// Pixel settings cog graphic built from two plus/cross shapes — one axis-aligned, one rotated 45° —
// so the eight arms read as gear teeth. A center hole is punched out with an SVG mask (truly
// transparent, so whatever's behind shows through the hub). Graphic only (fill = currentColor, so it
// inherits the button's text color). The cog is a self-contained icon button with a simple border
// (nearly the cog's own color) — no heavy stepped button shape.

import { useId } from "react"

const VB = 24 // viewBox units
const C = VB / 2 // centre
const ARM = 5 // arm thickness
const INSET = 2 // gap from the viewBox edge to the arm tip
const HOLE_R = 3.4 // centre hole radius

// one plus = a vertical bar + a horizontal bar crossing at the centre
function Plus() {
  const len = VB - INSET * 2
  return (
    <>
      <rect x={C - ARM / 2} y={INSET} width={ARM} height={len} />
      <rect x={INSET} y={C - ARM / 2} width={len} height={ARM} />
    </>
  )
}

export function SettingsCog({
  size = 26,
  onClick,
}: {
  size?: number
  onClick?: () => void
}) {
  const maskId = useId()
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open settings"
      className="group text-[#cdc9d6] hover:text-white transition-colors active:translate-y-[1px]"
      style={{
        display: "inline-flex",
        padding: 6,
        cursor: "pointer",
        background: "rgba(14,12,40,0.45)",
        border: "3px solid rgba(205,201,214,0.5)",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${VB} ${VB}`}
        fill="currentColor"
        aria-hidden
        style={{ display: "block" }}
      >
        <mask id={maskId}>
          <rect x={0} y={0} width={VB} height={VB} fill="white" />
          <circle cx={C} cy={C} r={HOLE_R} fill="black" />
        </mask>
        <g mask={`url(#${maskId})`}>
          <Plus />
          <g transform={`rotate(45 ${C} ${C})`}>
            <Plus />
          </g>
        </g>
      </svg>
    </button>
  )
}
