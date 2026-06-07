"use client"

import { useEffect, useRef, useState, type PointerEvent } from "react"
import { bezierHandles } from "@/lib/bezierPath"
import { clamp01 } from "@/lib/math"
import { STAIRCASE_CLIP, JIGSAW_CLIP } from "../lib/clipPaths"
import { BOARD_BG, BOARD_FRAME } from "../lib/graphTheme"
import { BoardGrid } from "./BoardGrid"

export type ControlPoints = [number, number, number, number]

type Props = {
  value: ControlPoints
  onChange: (next: ControlPoints) => void
}

// same asphalt board as the CurveGraph (shared graphTheme tokens + BoardGrid)
const BG = BOARD_BG
const FRAME = BOARD_FRAME
const GUIDE = "rgba(255,255,255,0.35)"
const KNOB = 14
const PAD = KNOB / 2

const shellClip = STAIRCASE_CLIP
const knobClip = JIGSAW_CLIP

export function BezierCurveEditor({ value, onChange }: Props) {
  const [p1x, p1y, p2x, p2y] = value
  const innerRef = useRef<HTMLDivElement>(null)
  const [innerSize, setInnerSize] = useState(0)
  const [active, setActive] = useState<1 | 2 | null>(null)

  useEffect(() => {
    if (!innerRef.current) return
    const el = innerRef.current
    const update = () => setInnerSize(el.getBoundingClientRect().width)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { h1x, h1y, h2x, h2y } = bezierHandles(value)
  const pathD = `M 0 100 C ${h1x} ${h1y} ${h2x} ${h2y} 100 0`

  const onPointerDown =
    (handle: 1 | 2) => (e: PointerEvent<HTMLDivElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId)
      setActive(handle)
    }

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!active || !innerRef.current) return
    const rect = innerRef.current.getBoundingClientRect()
    const bx = clamp01((e.clientX - rect.left) / rect.width)
    const by = clamp01(1 - (e.clientY - rect.top) / rect.height)
    if (active === 1) onChange([bx, by, p2x, p2y])
    else onChange([p1x, p1y, bx, by])
  }

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.releasePointerCapture(e.pointerId)
    setActive(null)
  }

  return (
    <div
      onPointerMove={onPointerMove}
      style={{
        width: "100%",
        aspectRatio: "1",
        position: "relative",
        touchAction: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: BG,
          clipPath: shellClip,
          boxShadow: `inset 0 0 0 2px ${FRAME}`,
          imageRendering: "pixelated",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          shapeRendering="crispEdges"
          style={{
            position: "absolute",
            inset: 2,
            width: "calc(100% - 4px)",
            height: "calc(100% - 4px)",
          }}
        >
          <BoardGrid />
        </svg>
      </div>

      <div
        ref={innerRef}
        style={{
          position: "absolute",
          top: PAD,
          left: PAD,
          right: PAD,
          bottom: PAD,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            overflow: "visible",
          }}
        >
          <line
            x1={0}
            y1={100}
            x2={h1x}
            y2={h1y}
            stroke={GUIDE}
            strokeWidth={1}
            strokeDasharray="2 2"
            vectorEffect="non-scaling-stroke"
          />
          <line
            x1={100}
            y1={0}
            x2={h2x}
            y2={h2y}
            stroke={GUIDE}
            strokeWidth={1}
            strokeDasharray="2 2"
            vectorEffect="non-scaling-stroke"
          />

          <path
            d={pathD}
            stroke="#fff"
            strokeWidth={3}
            strokeLinecap="round"
            fill="none"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      {innerSize > 0 && (
        <>
          <Knob
            left={(h1x / 100) * innerSize}
            top={(h1y / 100) * innerSize}
            onPointerDown={onPointerDown(1)}
            onPointerUp={onPointerUp}
          />
          <Knob
            left={(h2x / 100) * innerSize}
            top={(h2y / 100) * innerSize}
            onPointerDown={onPointerDown(2)}
            onPointerUp={onPointerUp}
          />
        </>
      )}
    </div>
  )
}

function Knob({
  left,
  top,
  onPointerDown,
  onPointerUp,
}: {
  left: number
  top: number
  onPointerDown: (e: PointerEvent<HTMLDivElement>) => void
  onPointerUp: (e: PointerEvent<HTMLDivElement>) => void
}) {
  return (
    <div
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className="absolute cursor-grab active:cursor-grabbing"
      style={{
        width: KNOB,
        height: KNOB,
        left,
        top,
        background: "#fff",
        clipPath: knobClip,
        imageRendering: "pixelated",
      }}
    />
  )
}
