"use client"

import { useId, useRef, useState } from "react"
import type { Lane as LaneType } from "@/lib/types"
import { BezierCurveEditor } from "./BezierCurveEditor"
import { CurveBadge } from "./CurveBadge"
import { PixelButton } from "./PixelButton"

type Props = {
  lane: LaneType
  progress: number
  onChange: (next: LaneType) => void
  onRemove?: () => void
}

const CAR_WIDTH = 99
const CAR_HEIGHT = 42

const CAR_SPRITES = [
  "/assets/cars/buggy.png",
  "/assets/cars/formula.png",
  "/assets/cars/police.png",
  "/assets/cars/sedan_vintage.png",
  "/assets/cars/sports_race.png",
  "/assets/cars/sports_red.png",
  "/assets/cars/sports_yellow.png",
  "/assets/cars/vintage.png",
]

function pickCarSprite(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return CAR_SPRITES[Math.abs(h) % CAR_SPRITES.length]
}
const PAD = 20
const BADGE_SIZE = 24
const CAR_START = PAD + BADGE_SIZE + PAD
const ASPHALT = "#5e5e5e"
const LANE_HEIGHT = 140
const CURB_HEIGHT = 14
const CHECKER_WIDTH = 28
const CHECKER_TILE = 14
const START_OFFSET = 180
const FINISH_OFFSET = 80
const DELETE_BTN_WIDTH = 30

function CheckerStrip({ offset, side }: { offset: number; side: "left" | "right" }) {
  const patId = useId()
  const half = CHECKER_TILE / 2
  return (
    <div
      className="absolute"
      style={{
        top: CURB_HEIGHT,
        bottom: CURB_HEIGHT,
        width: CHECKER_WIDTH,
        [side]: offset,
      }}
    >
      <svg width="100%" height="100%" shapeRendering="crispEdges" preserveAspectRatio="none">
        <defs>
          <pattern id={patId} x="0" y="0" width={CHECKER_TILE} height={CHECKER_TILE} patternUnits="userSpaceOnUse">
            <rect x={0} y={0} width={CHECKER_TILE} height={CHECKER_TILE} fill={ASPHALT} />
            <rect x={0} y={0} width={half} height={half} fill="#ffffff" />
            <rect x={half} y={half} width={half} height={half} fill="#ffffff" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patId})`} />
      </svg>
    </div>
  )
}

export function Lane({ lane, progress, onChange, onRemove }: Props) {
  const [open, setOpen] = useState(false)
  const closeTimerRef = useRef<number | null>(null)

  const openNow = () => {
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setOpen(true)
  }

  const scheduleClose = () => {
    closeTimerRef.current = window.setTimeout(() => {
      setOpen(false)
      closeTimerRef.current = null
    }, 150)
  }

  const carLeft = `calc(${CAR_START}px + ${progress} * (100% - ${CAR_START + CAR_WIDTH + PAD}px))`
  const carSprite = pickCarSprite(lane.id)
  const chassisWidth = onRemove ? `calc(100% - ${DELETE_BTN_WIDTH}px - 2px)` : "100%"

  return (
    <div
      className="relative flex w-full gap-[2px]"
      style={{ height: LANE_HEIGHT, zIndex: open ? 50 : undefined }}
    >
      <div
        className="relative overflow-hidden shrink-0"
        style={{ width: chassisWidth, height: "100%", background: ASPHALT }}
      >
      <div
        className="absolute top-0 left-0 w-full"
        style={{
          height: CURB_HEIGHT,
          background: "repeating-linear-gradient(90deg, #d44 0 18px, #f5f5f5 18px 36px)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-full"
        style={{
          height: CURB_HEIGHT,
          background: "repeating-linear-gradient(90deg, #d44 0 18px, #f5f5f5 18px 36px)",
        }}
      />
      <div
        className="absolute"
        style={{
          top: "50%",
          left: START_OFFSET + CHECKER_WIDTH,
          right: FINISH_OFFSET + CHECKER_WIDTH,
          transform: "translateY(-50%)",
          height: 4,
          background: "repeating-linear-gradient(90deg, #e5e5e5 0 28px, transparent 28px 56px)",
        }}
      />
<CheckerStrip side="left" offset={START_OFFSET} />
      <CheckerStrip side="right" offset={FINISH_OFFSET} />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={carSprite}
        alt=""
        className="absolute"
        style={{
          left: carLeft,
          top: "50%",
          width: CAR_WIDTH,
          height: CAR_HEIGHT,
          objectFit: "contain",
          transform: "translateY(-50%)",
          imageRendering: "pixelated",
        }}
      />

      <div
        className="absolute top-1/2 -translate-y-1/2 cursor-pointer"
        style={{ left: PAD }}
        onMouseEnter={openNow}
        onMouseLeave={scheduleClose}
      >
        <CurveBadge controlPoints={lane.controlPoints} color={lane.color} size={BADGE_SIZE} />
      </div>
      </div>

      {onRemove && (
        <div
          className="shrink-0 relative z-10"
          style={{ width: DELETE_BTN_WIDTH, height: LANE_HEIGHT }}
        >
          <PixelButton
            onClick={onRemove}
            aria-label="Remove lane"
            face="#d4d4d4"
            hi="#f0f0f0"
            sh="#888"
            textColor="#1a1a1a"
            fontSize={14}
            className="absolute top-0 left-0 flex items-center justify-center"
            style={{
              width: LANE_HEIGHT,
              height: DELETE_BTN_WIDTH,
              padding: 0,
              transformOrigin: "0 0",
              transform: "rotate(90deg) translateY(-100%)",
            }}
          >
            DELETE
          </PixelButton>
        </div>
      )}

      {open && (
        <div
          className="absolute z-50 w-[300px]"
          style={{
            top: (LANE_HEIGHT - BADGE_SIZE) / 2,
            left: PAD + BADGE_SIZE + 8,
            padding: 14,
            background: "#1a1a1a",
            clipPath: `polygon(
              0 6px, 3px 6px, 3px 3px, 6px 3px, 6px 0,
              calc(100% - 6px) 0, calc(100% - 6px) 3px, calc(100% - 3px) 3px, calc(100% - 3px) 6px, 100% 6px,
              100% calc(100% - 6px), calc(100% - 3px) calc(100% - 6px), calc(100% - 3px) calc(100% - 3px), calc(100% - 6px) calc(100% - 3px), calc(100% - 6px) 100%,
              6px 100%, 6px calc(100% - 3px), 3px calc(100% - 3px), 3px calc(100% - 6px), 0 calc(100% - 6px)
            )`,
            imageRendering: "pixelated",
          }}
          onMouseEnter={openNow}
          onMouseLeave={scheduleClose}
        >
          <BezierCurveEditor
            value={lane.controlPoints}
            onChange={(cp) => onChange({ ...lane, controlPoints: cp })}
          />
        </div>
      )}
    </div>
  )
}
