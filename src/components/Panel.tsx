import type { CSSProperties, ReactNode } from "react"
import { STAIRCASE_CLIP } from "../lib/clipPaths"

// The near-black "billboard" frame: a dark board with the app's staircase corners and a faint
// top-lit bevel. Single source — used by the start-light panel (RaceLights) and the curve-graph
// enclosure. Anything that should read as "mounted hardware" gets wrapped in this.
export const PANEL_BG = "var(--color-panel)" // shared token (globals.css @theme)
export const PANEL_BEVEL = "inset 0 0 0 2px #000, inset 0 1px 0 #333" // one-off shadow — stays literal

export function Panel({
  children,
  padding = 14,
  style,
}: {
  children: ReactNode
  padding?: number
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        display: "inline-block",
        width: "fit-content",
        padding,
        background: PANEL_BG,
        boxShadow: PANEL_BEVEL,
        clipPath: STAIRCASE_CLIP,
        imageRendering: "pixelated",
        ...style,
      }}
    >
      {children}
    </div>
  )
}
