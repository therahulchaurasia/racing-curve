"use client"

import { useEffect, useId, useRef, useState } from "react"
import * as Popover from "@radix-ui/react-popover"
import type { Lane as LaneType } from "@/lib/types"
import type { ControlPoints } from "./BezierCurveEditor"
import { BezierCurveEditor } from "./BezierCurveEditor"
import { CurveBadge } from "./CurveBadge"
import { CurvePresets } from "./CurvePresets"
import { PixelButton } from "./PixelButton"
import { STAIRCASE_CLIP } from "./clipPaths"
import { labelForCurve } from "@/lib/presets"
import { BUTTON_RED } from "@/lib/palette"

type Props = {
  lane: LaneType
  progress: number
  onChange: (next: LaneType) => void
  onRemove?: () => void
  isRacing?: boolean // race underway — fades the cluster so the sweeping car stays clean
  locked?: boolean // countdown OR race — curve picker disabled (curve is fixed once the lights start)
  showTopCurb?: boolean
  showBottomCurb?: boolean
}

// Night-toned road palette — the day-bright tokens (#d44/#f5f5f5 curbs, #5e5e5e asphalt, #e5e5e5
// dashes, #fff checkers) over-popped against the dark night, so everything is muted/darkened to sit
// in the scene as "lit at night" rather than daytime.
const CURB_RED = "#9e3b3b"
const CURB_WHITE = "#cdc9d6"
const CURB_BG = `repeating-linear-gradient(90deg, ${CURB_RED} 0 18px, ${CURB_WHITE} 18px 36px)`
// inner lane divider: a dashed line that SEPARATES adjacent lanes (cars drive in their own lane,
// not over it). Same dash rhythm the road uses elsewhere.
const INNER_DIVIDER_HEIGHT = 4
const INNER_DIVIDER_BG =
  "repeating-linear-gradient(90deg, #a9a7b5 0 28px, transparent 28px 56px)"

// trim curve numbers for display: 0.42 → "0.42", 1 → "1", 0 → "0"
const fmt = (n: number) => Number(n.toFixed(2)).toString()

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
// badge moved to the lane center, so the car starts one PAD off the curb (was PAD+BADGE+PAD)
const CAR_START = PAD
const ASPHALT = "#3a3942"
// LANE_HEIGHT and CURB_HEIGHT are multiples of CHECKER_TILE (14) so every lane's start/finish
// checker starts on a tile boundary and the columns tile CONTINUOUSLY across stacked lanes (no seam)
const LANE_HEIGHT = 112
const CURB_HEIGHT = 14
export const CHECKER_WIDTH = 28
const CHECKER_TILE = 14
export const START_OFFSET = 100
const FINISH_OFFSET = 100
const DELETE_BTN_WIDTH = 30

function CheckerStrip({
  offset,
  side,
  top,
  bottom,
}: {
  offset: number
  side: "left" | "right"
  top: number
  bottom: number
}) {
  const patId = useId()
  const half = CHECKER_TILE / 2
  return (
    <div
      className="absolute"
      style={{
        top,
        bottom,
        width: CHECKER_WIDTH,
        [side]: offset,
      }}
    >
      <svg
        width="100%"
        height="100%"
        shapeRendering="crispEdges"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id={patId}
            x="0"
            y="0"
            width={CHECKER_TILE}
            height={CHECKER_TILE}
            patternUnits="userSpaceOnUse"
          >
            <rect
              x={0}
              y={0}
              width={CHECKER_TILE}
              height={CHECKER_TILE}
              fill={ASPHALT}
            />
            <rect x={0} y={0} width={half} height={half} fill={CURB_WHITE} />
            <rect x={half} y={half} width={half} height={half} fill={CURB_WHITE} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patId})`} />
      </svg>
    </div>
  )
}

export function Lane({
  lane,
  progress,
  onChange,
  onRemove,
  isRacing,
  locked,
  showTopCurb = true,
  showBottomCurb = true,
}: Props) {
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

  // lock the curve picker from the moment the lights start (countdown) through the race: close it
  // and cancel any pending hover-close timer. The cluster also goes pointer-events:none below so it
  // can't reopen. This fixes editing during the red-light countdown changing the launched curve
  // (the solver is snapshotted at green, so whatever was set during the countdown would win).
  useEffect(() => {
    if (!locked) return
    if (closeTimerRef.current !== null) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setOpen(false)
  }, [locked])

  // one place that keeps the lane's label honest for both preset clicks and knob drags
  const applyCurve = (cp: ControlPoints) =>
    onChange({ ...lane, controlPoints: cp, label: labelForCurve(cp) })

  const carLeft = `calc(${CAR_START}px + ${progress} * (100% - ${CAR_START + CAR_WIDTH + PAD}px))`
  const carSprite = pickCarSprite(lane.id)
  const chassisWidth = onRemove
    ? `calc(100% - ${DELETE_BTN_WIDTH}px - 2px)`
    : "100%"
  const [p1x, p1y, p2x, p2y] = lane.controlPoints
  // checkers run to the lane edge wherever there's no curb, so stacked lanes' start/finish
  // strips join into one continuous vertical line
  const topInset = showTopCurb ? CURB_HEIGHT : 0
  const bottomInset = showBottomCurb ? CURB_HEIGHT : 0
  // optical nudge: middle lanes (no curbs) read slightly low — lift the block a few px. Lanes WITH a
  // curb already get their asphalt-band correction below, so only the curb-less middle gets this.
  const opticalNudge = !showTopCurb && !showBottomCurb ? 3 : 0

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <div
        className="relative flex w-full gap-[2px]"
        style={{ height: LANE_HEIGHT, zIndex: open ? 50 : undefined }}
      >
        <div
          className="relative overflow-hidden shrink-0"
          style={{ width: chassisWidth, height: "100%", background: ASPHALT }}
        >
          {showTopCurb && (
            <div
              className="absolute top-0 left-0 w-full"
              style={{ height: CURB_HEIGHT, background: CURB_BG }}
            />
          )}
          {showBottomCurb && (
            <div
              className="absolute bottom-0 left-0 w-full"
              style={{ height: CURB_HEIGHT, background: CURB_BG }}
            />
          )}
          {/* dashed lane separator at each inner boundary — full width, but rendered BEFORE the
              checkers so the checker columns paint over it (no fighting where they cross) */}
          {!showBottomCurb && (
            <div
              className="absolute bottom-0 left-0 w-full"
              style={{ height: INNER_DIVIDER_HEIGHT, background: INNER_DIVIDER_BG }}
            />
          )}
          <CheckerStrip side="left" offset={START_OFFSET} top={topInset} bottom={bottomInset} />
          <CheckerStrip side="right" offset={FINISH_OFFSET} top={topInset} bottom={bottomInset} />

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
              // dim + slightly desaturate the day-bright sprites so they read as lit at night
              filter: "brightness(0.82) saturate(0.9)",
            }}
          />

          {/* centered curve cluster: badge (opens picker) + label/values (copyable). Dims during a
          race so the car sweeping through the middle stays clean but the curve stays readable. */}
          <div
            className="absolute top-1/2 left-1/2 flex items-center gap-2"
            style={{
              // center in the visible ASPHALT band, not the full chassis: curbs eat top/bottom
              // unevenly (lane 0 has only a top curb, last lane only a bottom one), so shift by half
              // the curb-inset difference to keep the block optically centered in every lane.
              transform: `translate(-50%, calc(-50% + ${(topInset - bottomInset) / 2 - opticalNudge}px))`,
              // two-stage: dim during the countdown (signals "locked, can't change now"), then fade
              // fully away once the race is on so the sweeping car stays clean
              opacity: isRacing ? 0 : locked ? 0.4 : 1,
              // non-interactive once locked (countdown + race) so the badge can't reopen the picker
              pointerEvents: locked ? "none" : "auto",
              transition: "opacity 250ms",
              // asphalt backdrop masks the dashed centerline behind the picker; fades with the cluster
              // so the line reappears during a race
              background: ASPHALT,
              padding: "0 10px",
            }}
          >
            {/* the picker is a Trigger: hover opens (timers), click toggles (Radix). Radix excludes
            the trigger from outside-dismiss, so clicking it never feels broken. */}
            <Popover.Trigger asChild>
              <div
                className="cursor-pointer"
                onMouseEnter={openNow}
                onMouseLeave={scheduleClose}
              >
                <CurveBadge
                  controlPoints={lane.controlPoints}
                  color={lane.color}
                  size={BADGE_SIZE}
                />
              </div>
            </Popover.Trigger>
            {/* name above the centerline, value below — the dashed road line falls in the gap and
            reads as the divider between them. gap sized to clear the 4px line + breathing room. */}
            {/* name over value, divided by the centerline. Two equal-height halves meet at the
            cluster center (= the line); name pinned to the bottom of the top half, value to the
            top of the bottom half, each 3px off — symmetric regardless of font metrics. */}
            <div
              className="flex flex-col select-text"
              style={{ fontFamily: "var(--font-silkscreen)", cursor: "text" }}
            >
              <div
                className="flex items-end justify-center"
                style={{ height: 20, paddingBottom: 5 }}
              >
                <span style={{ fontSize: 14, lineHeight: 1, color: "#f5f5f5" }}>
                  {lane.label.toUpperCase()}
                </span>
              </div>
              <div
                className="flex items-start justify-center"
                style={{ height: 20, paddingTop: 5 }}
              >
                {/* Width-stable label: an invisible max-width placeholder pins the box width, and the
                real (trimmed) text is absolutely positioned on top — out of flow, so its per-digit
                pixel wiggle can't reflow the cluster. Keeps the centered badge (and the popover
                anchored to it) from shifting while dragging. */}
                <span
                  style={{
                    position: "relative",
                    display: "inline-block",
                    fontSize: 12,
                    lineHeight: 1,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span aria-hidden style={{ visibility: "hidden" }}>
                    cubic-bezier(0.00, 0.00, 0.00, 0.00)
                  </span>
                  <span
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      top: 0,
                      textAlign: "center",
                      color: "#bdbdbd",
                    }}
                  >
                    cubic-bezier({fmt(p1x)}, {fmt(p1y)}, {fmt(p2x)}, {fmt(p2y)})
                  </span>
                </span>
              </div>
            </div>
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
              {...BUTTON_RED}
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

        <Popover.Portal>
          <Popover.Content
            side="left"
            align="center"
            sideOffset={8}
            avoidCollisions
            collisionPadding={8}
            // open state is owned by the hover-intent timers — don't let Radix steal focus
            onOpenAutoFocus={(e) => e.preventDefault()}
            className="z-50 w-[460px]"
            style={{
              padding: 14,
              background: "#1a1a1a",
              clipPath: STAIRCASE_CLIP,
              imageRendering: "pixelated",
            }}
            onMouseEnter={openNow}
            onMouseLeave={scheduleClose}
          >
            <div className="flex gap-3">
              <CurvePresets value={lane.controlPoints} onPick={applyCurve} />
              <div className="flex-1">
                <BezierCurveEditor
                  value={lane.controlPoints}
                  onChange={applyCurve}
                />
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </div>
    </Popover.Root>
  )
}
