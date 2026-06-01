"use client"

import { useEffect, useState } from "react"
import { Lane } from "./Lane"
import { CurveGraph } from "./CurveGraph"
import { PixelButton } from "./PixelButton"
import { PressSpace } from "./PressSpace"
import { cubicBezier } from "@/lib/cubicBezier"
import type { Lane as LaneType } from "@/lib/types"

const DURATION_MS = 3000

const PALETTE = ["#22d3ee", "#f472b6", "#a3e635", "#fbbf24", "#a78bfa", "#fb923c"]

const INITIAL_LANES: LaneType[] = [
  { id: "a", controlPoints: [0, 0, 0.58, 1], label: "ease-out", color: PALETTE[0] },
  { id: "b", controlPoints: [0.42, 0, 1, 1], label: "ease-in", color: PALETTE[1] },
]

type PlayState = {
  startedAt: number
  solvers: Array<(t: number) => number>
}

export function BezierPlayground() {
  const [lanes, setLanes] = useState<LaneType[]>(INITIAL_LANES)
  const [progress, setProgress] = useState<number[]>(() => INITIAL_LANES.map(() => 0))
  const [currentT, setCurrentT] = useState(0)
  const [play, setPlay] = useState<PlayState | null>(null)

  const isPlaying = play !== null

  useEffect(() => {
    if (!play) return
    let frameId = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - play.startedAt) / DURATION_MS)
      setCurrentT(t)
      setProgress(play.solvers.map((s) => s(t)))
      if (t < 1) {
        frameId = requestAnimationFrame(tick)
      } else {
        setPlay(null)
      }
    }
    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [play])

  const onPlay = () => {
    setProgress(lanes.map(() => 0))
    setCurrentT(0)
    setPlay({
      startedAt: performance.now(),
      solvers: lanes.map((l) => cubicBezier(...l.controlPoints)),
    })
  }

  const onReset = () => {
    setPlay(null)
    setProgress(lanes.map(() => 0))
    setCurrentT(0)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return
      e.preventDefault()
      if (!isPlaying) onPlay()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [isPlaying, lanes])

  const updateLane = (next: LaneType) => {
    setLanes((prev) => prev.map((l) => (l.id === next.id ? next : l)))
  }

  const onRemoveLane = (id: string) => {
    if (lanes.length <= 1) return
    const idx = lanes.findIndex((l) => l.id === id)
    if (idx === -1) return
    setLanes((prev) => prev.filter((l) => l.id !== id))
    setProgress((prev) => prev.filter((_, i) => i !== idx))
  }

  const onAddLane = () => {
    const used = new Set(lanes.map((l) => l.color))
    const free = PALETTE.find((c) => !used.has(c))
    const color = free ?? PALETTE[lanes.length % PALETTE.length]
    const next: LaneType = {
      id: crypto.randomUUID(),
      controlPoints: [0, 0, 1, 1],
      label: `lane ${lanes.length + 1}`,
      color,
    }
    setLanes((prev) => [...prev, next])
    setProgress((prev) => [...prev, 0])
  }

  return (
    <div className="flex flex-col gap-6 w-full py-8">
      {/* <CurveGraph lanes={lanes} progress={progress} currentT={currentT} /> */}
      <div className="flex flex-col gap-4">
        {lanes.map((lane, i) => (
          <Lane
            key={lane.id}
            lane={lane}
            progress={progress[i] ?? 0}
            onChange={updateLane}
            onRemove={lanes.length > 1 ? () => onRemoveLane(lane.id) : undefined}
          />
        ))}
      </div>
      <div className="flex flex-col gap-4 px-8">
        <PixelButton onClick={onAddLane} className="self-start">
          + LANE
        </PixelButton>
        {/* TODO(cleanup): PLAY + RESET buttons replaced by "PRESS SPACE TO START" prompt.
            Handlers (onPlay / onReset) kept in case we bring them back. Decide on final cleanup
            once the rest of the game is done. */}
        {/* <div className="flex gap-2 self-start">
          <PixelButton onClick={onPlay} disabled={isPlaying}>
            {isPlaying ? "PLAYING…" : "PLAY"}
          </PixelButton>
          <PixelButton onClick={onReset}>RESET</PixelButton>
        </div> */}
      </div>
      {!isPlaying && <PressSpace />}
    </div>
  )
}
