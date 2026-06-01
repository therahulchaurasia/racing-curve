"use client"

import type { Lane } from "@/lib/types"
import { bezierPathD } from "@/lib/bezierPath"

type Props = {
  lanes: Lane[]
  progress: number[]
  currentT: number
}

const W = 250
const H = 250
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
const FRAME = "#2a2a2a"
const GRID = "rgba(255,255,255,0.06)"
const MID = "rgba(255,255,255,0.12)"
const BG = "#5e5e5e"
const TICK = "#1a1a1a"

const clip = `polygon(
  0 6px, 3px 6px, 3px 3px, 6px 3px, 6px 0,
  calc(100% - 6px) 0, calc(100% - 6px) 3px, calc(100% - 3px) 3px, calc(100% - 3px) 6px, 100% 6px,
  100% calc(100% - 6px), calc(100% - 3px) calc(100% - 6px), calc(100% - 3px) calc(100% - 3px), calc(100% - 6px) calc(100% - 3px), calc(100% - 6px) 100%,
  6px 100%, 6px calc(100% - 3px), 3px calc(100% - 3px), 3px calc(100% - 6px), 0 calc(100% - 6px)
)`

export function CurveGraph({ lanes, progress, currentT }: Props) {
  return (
    <div
      className="relative"
      style={{
        width: W,
        height: H,
        background: BG,
        clipPath: clip,
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
        {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((v) => (
          <g key={v}>
            <line x1={v} y1={0} x2={v} y2={100} stroke={GRID} strokeWidth={0.3} vectorEffect="non-scaling-stroke" />
            <line x1={0} y1={v} x2={100} y2={v} stroke={GRID} strokeWidth={0.3} vectorEffect="non-scaling-stroke" />
          </g>
        ))}

        <line x1={50} y1={0} x2={50} y2={100} stroke={MID} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
        <line x1={0} y1={50} x2={100} y2={50} stroke={MID} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />

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
      <TickLabel x={W} y={H} anchor="end" baseline="bottom">t=1</TickLabel>
      <TickLabel x={0} y={0} anchor="start" baseline="top">p=1</TickLabel>

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
