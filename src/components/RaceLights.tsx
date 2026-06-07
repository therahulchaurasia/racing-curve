"use client"

import { useEffect, useRef, useState } from "react"
import { StartLight, type LightColor } from "./StartLight"
import { Panel } from "./Panel"

// top → bottom: 5 green, 5 red, 5 red (amber intentionally unused in the final tree)
const ROW_COLORS: LightColor[] = ["green", "red", "red"]
const COLS = 5

type Props = {
  size?: number
  gap?: number
  panel?: boolean
  redColumns?: number // how many red columns are lit (0..COLS)
  greenOn?: boolean // whether the top green row is lit
  // fill reds right→left instead of left→right. Pair with a 180° rotation (gantry mount) so the
  // panel still READS left→right on screen after the flip mirrors the columns.
  reverse?: boolean
}

// The 5×3 start-light tree mounted on a billboard. Presentational — lit state comes from
// `redColumns` (reds light left→right, or right→left when `reverse`) and `greenOn`. Drive it with
// useStartLightSequence.
export function RaceLights({
  size = 40,
  gap = 0,
  panel = true,
  redColumns = COLS,
  greenOn = true,
  reverse = false,
}: Props) {
  const grid = (
    <div style={{ display: "inline-flex", flexDirection: "column", gap }}>
      {ROW_COLORS.map((color, r) => (
        <div key={r} style={{ display: "flex", gap }}>
          {Array.from({ length: COLS }).map((_, c) => {
            const lit = reverse ? c >= COLS - redColumns : c < redColumns
            const on = color === "green" ? greenOn : lit
            return <StartLight key={c} color={color} on={on} size={size} />
          })}
        </div>
      ))}
    </div>
  )

  if (!panel) return grid

  return <Panel>{grid}</Panel>
}

const GANTRY_ROD_H = 24
const GANTRY_ROD_W = 6
const GANTRY_ROD_INSET = 24 // rods in from each side of the panel
const GANTRY_ROD = "linear-gradient(90deg, #6b6b73, #44444b)" // metallic pole

// Start-light GANTRY: the RaceLights panel flipped 180° with two rods, mounted on the road's top
// curb at the start line. Panel + rods only (no curb) — it plants on whatever curb it's placed over.
// `reverse` pairs with the 180° flip so the countdown still reads left→right on screen.
export function StartGantry({
  redColumns,
  greenOn,
  size = 30,
}: {
  redColumns: number
  greenOn: boolean
  size?: number
}) {
  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "stretch" }}>
      <div style={{ alignSelf: "center", transform: "rotate(180deg)" }}>
        <RaceLights redColumns={redColumns} greenOn={greenOn} size={size} reverse />
      </div>
      <div style={{ position: "relative", height: GANTRY_ROD_H }}>
        <div style={{ position: "absolute", top: 0, bottom: 0, left: GANTRY_ROD_INSET, width: GANTRY_ROD_W, background: GANTRY_ROD }} />
        <div style={{ position: "absolute", top: 0, bottom: 0, right: GANTRY_ROD_INSET, width: GANTRY_ROD_W, background: GANTRY_ROD }} />
      </div>
    </div>
  )
}

type SequenceOpts = {
  stepMs?: number // gap between each red column lighting
  goDelayMs?: number // delay after the last red before greens light; omit ⇒ random 200–300ms/run
  onGo?: () => void // fired when greens light (the GO moment)
}

// Drives the start choreography: reds light left→right one column per `stepMs`, then the greens
// come on (reds stay lit). The green delay is randomized 200–300ms each run unless `goDelayMs` is
// given — you can't pre-time the launch. Returns lit state + controls.
export function useStartLightSequence({ stepMs = 1000, goDelayMs, onGo }: SequenceOpts = {}) {
  const [redColumns, setRedColumns] = useState(0)
  const [greenOn, setGreenOn] = useState(false)
  const [running, setRunning] = useState(false)
  const timers = useRef<number[]>([])
  // true from start() until reset() — covers both the countdown and the race that follows, so a
  // run can't be relaunched (rapid/held Space, stale guards) until it fully completes and resets
  const active = useRef(false)

  const clear = () => {
    timers.current.forEach((t) => clearTimeout(t))
    timers.current = []
  }

  const reset = () => {
    clear()
    active.current = false
    setRedColumns(0)
    setGreenOn(false)
    setRunning(false)
  }

  // returns true if a fresh countdown began, false if one was already active
  const start = (): boolean => {
    if (active.current) return false // already counting down or racing — ignore
    active.current = true
    clear()
    setRedColumns(0)
    setGreenOn(false)
    setRunning(true)
    // column c lights at (c-1)*stepMs: first pair immediately, then one per step
    for (let c = 1; c <= COLS; c++) {
      timers.current.push(window.setTimeout(() => setRedColumns(c), (c - 1) * stepMs))
    }
    // random launch delay 200–300ms after the last red, unless an explicit goDelayMs was given
    const greenDelay = goDelayMs ?? Math.round(200 + Math.random() * 100)
    const greenAt = (COLS - 1) * stepMs + greenDelay
    timers.current.push(
      window.setTimeout(() => {
        setGreenOn(true)
        setRunning(false)
        onGo?.()
      }, greenAt),
    )
    return true
  }

  useEffect(() => clear, [])

  return { redColumns, greenOn, running, start, reset }
}
