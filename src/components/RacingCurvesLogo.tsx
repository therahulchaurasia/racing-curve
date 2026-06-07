import type { CSSProperties } from "react"
import { NOTCH_CLIP, notchInnerClip } from "./clipPaths"

// "RACING / CURVES" wordmark: a thick-bordered box with a 2-step notch on the top-right corner.
//
// Two stacked clipped layers (the same trick the start-light panel uses):
//   outer = border color, clipped to the notch silhouette
//   inner = fill color, clipped to the SAME silhouette eroded inward by borderWidth
// The uncovered ring between them is the border — uniform even around the notch steps. The interior
// is a solid `fill` (defaults to the dirt world bg so it reads as hollow; override it to taste).
//
// No SVG, no measurement: the notch is fixed px + % in the clip-path, padding is plain & symmetric.

const PAD = 20 // even gap from the inner edge to the letters
const WORD_GAP = 8 // gap between the two words
const DIRT = "#e8c547" // world background — fill defaults to this so the interior reads as hollow

// non-standard props (Chrome/Safari) — trim the line box to cap-height (top) / baseline (bottom)
const TRIM = {
  textBoxTrim: "trim-both",
  textBoxEdge: "cap alphabetic",
} as unknown as CSSProperties

type Props = {
  fill?: string
  border?: string
  text?: string
  borderWidth?: number
  fontSize?: number
  font?: string // CSS font-family (e.g. a --font-* var)
}

export function RacingCurvesLogo({
  fill = DIRT,
  border = "#1a1a1a",
  text = "#1a1a1a",
  borderWidth = 6,
  fontSize = 52,
  font = "var(--font-vt323)",
}: Props) {
  return (
    <div style={{ display: "inline-block", background: border, clipPath: NOTCH_CLIP }}>
      <div
        style={{
          background: fill,
          clipPath: notchInnerClip(borderWidth),
          padding: PAD,
          display: "flex",
          flexDirection: "column",
          gap: WORD_GAP,
          fontFamily: font,
          color: text,
          fontSize,
          lineHeight: 1,
        }}
      >
        <span style={TRIM}>RACING</span>
        <span style={TRIM}>CURVES</span>
      </div>
    </div>
  )
}
