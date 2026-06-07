"use client"

import type { Lane } from "@/lib/types"
import { bezierPathD } from "@/lib/bezierPath"
import { BOARD_BG, BOARD_FRAME } from "./graphTheme"
import { BoardGrid } from "./BoardGrid"

type Props = {
  lanes: Lane[]
  progress: number[]
  currentT: number
}

const W = 260 // with H=150 the corner-to-corner linear line sits at ~30° (atan(150/260))
const H = 150
const DOT = 12

const dotClip = `polygon(
  4px 0, calc(100% - 4px) 0,
  calc(100% - 4px) 2px, calc(100% - 2px) 2px,
  calc(100% - 2px) 4px, 100% 4px,
  100% calc(100% - 4px), calc(100% - 2px) calc(100% - 4px),
  calc(100% - 2px) calc(100% - 2px), calc(100% - 4px) calc(100% - 2px),
  calc(100% - 4px) 100%, 4px 100%,
  4px calc(100% - 2px), 2px calc(100% - 2px),
  2px calc(100% - 4px), 0 calc(100% - 4px),
  0 4px, 2px 4px, 2px 2px, 4px 2px
)`
// night skin — board bg/frame come from the shared graphTheme (same surface as the editor); the grid
// is the shared BoardGrid; tick labels are graph-only (muted light so they're legible on the board)
const FRAME = BOARD_FRAME
const BG = BOARD_BG
const TICK = "#cdc9d6"

export function CurveGraph({ lanes, progress, currentT }: Props) {
  // plain rectangle now — the enclosing Panel supplies the stepped corners + billboard frame, so the
  // graph itself is a clean asphalt board (no staircase clip of its own)
  return (
    <div
      className="relative"
      style={{
        width: W,
        height: H,
        background: BG,
        boxShadow: `inset 0 0 0 2px ${FRAME}`,
        imageRendering: "pixelated",
      }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        shapeRendering="crispEdges"
        style={{ width: "100%", height: "100%", display: "block" }}
      >
        <BoardGrid />

        {lanes.map((lane) => (
          <path
            key={lane.id}
            d={bezierPathD(lane.controlPoints)}
            stroke={lane.color}
            strokeWidth={3}
            strokeLinecap="square"
            fill="none"
            vectorEffect="non-scaling-stroke"
            shapeRendering="geometricPrecision"
          />
        ))}

      </svg>

      <TickLabel x={0} y={H} anchor="start" baseline="bottom">0</TickLabel>
      <TickLabel x={W} y={0} anchor="end" baseline="top">100</TickLabel>
      <TickLabel x={W} y={H} anchor="end" baseline="bottom">time</TickLabel>
      <TickLabel x={0} y={0} anchor="start" baseline="top">progress</TickLabel>

      {lanes.map((lane, i) => (
        <div
          key={lane.id}
          className="absolute"
          style={{
            width: DOT,
            height: DOT,
            left: `calc(${currentT * 100}% - ${DOT / 2}px)`,
            top: `calc(${(1 - (progress[i] ?? 0)) * 100}% - ${DOT / 2}px)`,
            background: lane.color,
            clipPath: dotClip,
            imageRendering: "pixelated",
          }}
        />
      ))}
    </div>
  )
}

function TickLabel({
  x,
  y,
  anchor,
  baseline,
  children,
}: {
  x: number
  y: number
  anchor: "start" | "end"
  baseline: "top" | "bottom"
  children: React.ReactNode
}) {
  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        left: anchor === "start" ? x + 6 : undefined,
        right: anchor === "end" ? W - x + 6 : undefined,
        top: baseline === "top" ? y + 6 : undefined,
        bottom: baseline === "bottom" ? H - y + 6 : undefined,
        fontFamily: "var(--font-silkscreen)",
        fontSize: 11,
        color: TICK,
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </div>
  )
}
