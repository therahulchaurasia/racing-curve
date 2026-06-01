"use client"

import { useEffect, useId, useState } from "react"
import { cubicBezier } from "@/lib/cubicBezier"
import { darken } from "@/lib/color"
import { PixelButton } from "./PixelButton"
import { CurveGraph } from "./CurveGraph"
import { BezierCurveEditor } from "./BezierCurveEditor"
import type { Lane as LaneType } from "@/lib/types"
import type { ControlPoints } from "./BezierCurveEditor"

const GRAPH_LANES: LaneType[] = [
  {
    id: "g1",
    controlPoints: [0, 0, 0.58, 1],
    label: "ease-out",
    color: "#22d3ee",
  },
  {
    id: "g2",
    controlPoints: [0.42, 0, 1, 1],
    label: "ease-in",
    color: "#f472b6",
  },
  {
    id: "g3",
    controlPoints: [0.42, 0, 0.58, 1],
    label: "ease-in-out",
    color: "#a3e635",
  },
]

const LOOP_MS = 2400
const PAUSE_MS = 400

const easeInOut = cubicBezier(0.42, 0, 0.58, 1)
const easeOut = cubicBezier(0, 0, 0.58, 1)

function useLoopProgress(solver: (t: number) => number, offset = 0): number {
  const [p, setP] = useState(0)
  useEffect(() => {
    let frame = 0
    const start = performance.now() - offset
    const tick = (now: number) => {
      const total = LOOP_MS + PAUSE_MS
      const phase = ((now - start) % total) / total
      const t = phase < LOOP_MS / total ? (phase * total) / LOOP_MS : 1
      setP(solver(t))
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [solver, offset])
  return p
}

const CAR_SPRITES: { src: string; w: number; h: number }[] = [
  { src: "/assets/cars/buggy.png", w: 23, h: 14 },
  { src: "/assets/cars/formula.png", w: 33, h: 9 },
  { src: "/assets/cars/police.png", w: 33, h: 14 },
  { src: "/assets/cars/sedan_vintage.png", w: 36, h: 13 },
  { src: "/assets/cars/sports_race.png", w: 34, h: 12 },
  { src: "/assets/cars/sports_red.png", w: 33, h: 12 },
  { src: "/assets/cars/sports_yellow.png", w: 33, h: 11 },
  { src: "/assets/cars/vintage.png", w: 36, h: 12 },
]

const PIXEL_SCALE = 4
const ASPHALT = "#5e5e5e"
const DIRT = "#e8c547"
const ROAD_INSET = 30
const CURB_BG =
  "repeating-linear-gradient(90deg, #d44 0 18px, #f5f5f5 18px 36px)"
const DASH_BG =
  "repeating-linear-gradient(90deg, #e5e5e5 0 28px, transparent 28px 56px)"

// curves cycled to drive however many lanes the preview is set to
const ROAD_CURVES: [number, number, number, number][] = [
  [0, 0, 0.58, 1], // ease-out
  [0.42, 0, 1, 1], // ease-in
  [0.42, 0, 0.58, 1], // ease-in-out
  [0, 0, 1, 1], // linear
  [0.68, -0.55, 0.27, 1.55], // back
  [0.25, 0.46, 0.45, 0.94], // gentle
]

export function StylePreviews() {
  const p1 = useLoopProgress(easeOut, 0)
  const p2 = useLoopProgress(easeInOut, 600)
  const graphSolvers = GRAPH_LANES.map((l) => cubicBezier(...l.controlPoints))
  const loopT = useLoopProgress((t) => t, 0)
  const graphProgress = graphSolvers.map((s) => s(loopT))
  const [editorCp, setEditorCp] = useState<ControlPoints>([0.42, 0, 0.58, 1])
  const [roadN, setRoadN] = useState(4)
  const roadItems = Array.from({ length: roadN }, (_, i) => CAR_SPRITES[i % CAR_SPRITES.length])
  const roadProgress = Array.from({ length: roadN }, (_, i) =>
    cubicBezier(...ROAD_CURVES[i % ROAD_CURVES.length])(loopT),
  )

  return (
    <div className="flex flex-col gap-12 w-full max-w-[1100px]">
      <Section title="Merged road (continuous)">
        <div className="flex gap-2 items-center">
          <span className="text-xs text-[#888] font-mono">lanes:</span>
          {[2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => setRoadN(n)}
              className={`text-xs px-2 py-1 font-mono ${roadN === n ? "bg-[#a3e635] text-black" : "bg-[#333] text-[#ccc]"}`}
            >
              {n}
            </button>
          ))}
        </div>
        {/* full-bleed: break out of the centered max-w column so we can judge edge-to-edge */}
        <div style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}>
          <MergedRoad items={roadItems} progress={roadProgress} finishP={0.92} />
        </div>
        <Note>
          One skewed road. Curbs only on the outer top/bottom; dashed lines
          divide the lanes between cars; start/finish checkers run as unbroken
          diagonals across the whole stack. Cars ride upright in their bands
          (counter-skewed so the road shears but the car doesn&apos;t). No seam
          jog — add/remove a car grows/shrinks the road by one band.
        </Note>
      </Section>

      <Section title="Lane skew — angle ladder">
        <div className="flex flex-col gap-8">
          {[0, 3, 5, 7, 9].map((deg) => (
            <div key={deg} className="flex flex-col gap-2">
              <div className="text-xs text-[#888] font-mono">
                {deg === 0 ? "0° (flat — reference)" : `skewX -${deg}°`}
              </div>
              <TiltLane angle={deg} progress={p1} sprite={CAR_SPRITES[5]} />
            </div>
          ))}
        </div>
        <Note>
          Committed to skewX (no perspective). Reference is nearly flat, so
          these are small. Car stays flat &amp; upright on top; only the road
          plane skews. Tell me the degree that feels right.
        </Note>
      </Section>

      <Section title="Finish line position">
        <div className="flex flex-col gap-10">
          {[0.78, 0.85, 0.92].map((fp) => (
            <div key={fp} className="flex flex-col gap-2">
              <div className="text-xs text-[#888] font-mono">
                finish line at p={fp}
              </div>
              <div className="flex flex-col gap-[3px]">
                {GRAPH_LANES.map((l, i) => (
                  <TiltLane
                    key={l.id}
                    angle={7}
                    sprite={CAR_SPRITES[FINISH_SPRITES[i]]}
                    progress={graphProgress[i]}
                    finishP={fp}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <Note>
          Same 7° lane, repeated. Curve is the only driver: cars stop at p=1 (no
          marker there), checker is the finish/timing line at the given p.
          ease-out crosses first, ease-in last, all rest together past the line.
        </Note>
      </Section>

      <Section title="Buttons">
        <div className="flex flex-col gap-6">
          <div className="flex gap-3 items-center">
            <PixelButton>PLAY</PixelButton>
            <PixelButton>RESET</PixelButton>
            <PixelButton>+ LANE</PixelButton>
            <PixelButton disabled>PLAYING…</PixelButton>
          </div>
          <div className="flex gap-3 items-center">
            <PixelButton
              face="#d4d4d4"
              hi="#f0f0f0"
              sh="#888"
              textColor="#1a1a1a"
            >
              DELETE
            </PixelButton>
            <span className="text-xs text-[#666]">
              gray (used as vertical lane delete in app)
            </span>
          </div>
        </div>
        <Note>
          Green = primary actions (play/reset/+lane). Gray vertical =
          destructive lane control. Click any to preview the 2px depress.
        </Note>
      </Section>

      <Section title="Start prompt">
        <div className="grid grid-cols-2 gap-3">
          <PromptCell label="blink (800/800)" blink />
          <PromptCell label="steady" />
        </div>
        <Note>
          Replaces PLAY button. Lives fixed bottom-center of viewport on main
          page. Space starts the race; reappears when race ends.
        </Note>
      </Section>

      <Section title="Curve graph">
        <div className="flex justify-center">
          <CurveGraph
            lanes={GRAPH_LANES}
            progress={graphProgress}
            currentT={loopT}
          />
        </div>
        <Note>
          Current style: dark card on rounded border. Needs pixel-themed reskin
          — pixel grid background, crisp 2px borders, square corners, sweeping
          "now" line, color-matched dots already wired.
        </Note>
      </Section>

      <Section title="Bezier curve editor">
        <div className="flex justify-center">
          <div style={{ width: 260 }}>
            <BezierCurveEditor value={editorCp} onChange={setEditorCp} />
          </div>
        </div>
        <Note>
          Lives inside the lane popover. Same reskin pass needed — pixel grid,
          square handles, crisp 2px frame.
        </Note>
      </Section>

      <Section title="Lane popover — curb frame">
        <div className="grid grid-cols-2 gap-4">
          <CurbFrameCell label="all white" color="#f5f5f5">
            <BezierCurveEditor value={editorCp} onChange={setEditorCp} />
          </CurbFrameCell>
          <CurbFrameCell label="all red" color="#d44">
            <BezierCurveEditor value={editorCp} onChange={setEditorCp} />
          </CurbFrameCell>
        </div>
        <Note>
          Single-color 14px frame around the editor. Compare both, pick the one
          that reads right.
        </Note>
      </Section>

      <Section title="Cars — native + scaled">
        <div className="grid grid-cols-2 gap-3">
          {CAR_SPRITES.map((c) => (
            <CarCell key={c.src} sprite={c} />
          ))}
        </div>
        <Note>
          Each car shown on a {PIXEL_SCALE}px pixel grid. Numbers = native pixel
          dimensions. Same logical box ({36 * PIXEL_SCALE}×{14 * PIXEL_SCALE}px)
          for comparison — bounding to the widest+tallest sprite.
        </Note>
      </Section>

      <Section title="Pixel">
        <PixelLane color="#ff5a3c" progress={p1} />
        <PixelLane color="#3b82f6" progress={p2} />
        <Note>
          Cars are pure CSS blocks. Real personality wants sprite assets — code
          blocks max out at &quot;8-bit hatchback&quot;.
        </Note>
      </Section>
    </div>
  )
}

function PromptCell({
  label,
  blink = false,
}: {
  label: string
  blink?: boolean
}) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    if (!blink) return
    const id = setInterval(() => setVisible((v) => !v), 800)
    return () => clearInterval(id)
  }, [blink])
  return (
    <div className="flex flex-col gap-2 p-3 bg-[#111] rounded border border-[#2a2a2a]">
      <div className="text-xs text-[#ccc] font-mono">{label}</div>
      <div
        className="flex items-center justify-center"
        style={{
          height: 80,
          backgroundColor: "#e8c547",
          backgroundImage:
            "radial-gradient(rgba(0,0,0,0.12) 1px, transparent 1px)",
          backgroundSize: "4px 4px",
        }}
      >
        <span
          style={{
            fontFamily: "var(--font-silkscreen)",
            fontSize: 20,
            letterSpacing: "0.12em",
            color: "#fff",
            textShadow: "2px 2px 0 #000",
            opacity: visible ? 1 : 0,
            transition: blink ? undefined : "opacity 120ms",
            imageRendering: "pixelated",
          }}
        >
          PRESS SPACE TO START
        </span>
      </div>
    </div>
  )
}

const popoverClip = `polygon(
  0 6px, 3px 6px, 3px 3px, 6px 3px, 6px 0,
  calc(100% - 6px) 0, calc(100% - 6px) 3px, calc(100% - 3px) 3px, calc(100% - 3px) 6px, 100% 6px,
  100% calc(100% - 6px), calc(100% - 3px) calc(100% - 6px), calc(100% - 3px) calc(100% - 3px), calc(100% - 6px) calc(100% - 3px), calc(100% - 6px) 100%,
  6px 100%, 6px calc(100% - 3px), 3px calc(100% - 3px), 3px calc(100% - 6px), 0 calc(100% - 6px)
)`

function CurbFrameCell({
  label,
  color,
  children,
}: {
  label: string
  color: string
  children: React.ReactNode
}) {
  const CURB = 14
  return (
    <div className="flex flex-col gap-2 p-3 bg-[#111] rounded border border-[#2a2a2a]">
      <div className="text-xs text-[#ccc] font-mono">{label}</div>
      <div
        style={{
          position: "relative",
          padding: CURB,
          background: color,
          clipPath: popoverClip,
          imageRendering: "pixelated",
        }}
      >
        <div style={{ position: "relative" }}>{children}</div>
      </div>
    </div>
  )
}

function CarCell({
  sprite,
}: {
  sprite: { src: string; w: number; h: number }
}) {
  const boxW = 36 * PIXEL_SCALE
  const boxH = 14 * PIXEL_SCALE
  const gridBg = `
    repeating-linear-gradient(0deg, transparent 0 ${PIXEL_SCALE - 1}px, rgba(255,255,255,0.08) ${PIXEL_SCALE - 1}px ${PIXEL_SCALE}px),
    repeating-linear-gradient(90deg, transparent 0 ${PIXEL_SCALE - 1}px, rgba(255,255,255,0.08) ${PIXEL_SCALE - 1}px ${PIXEL_SCALE}px)
  `
  const name = sprite.src.split("/").pop()?.replace(".png", "")
  return (
    <div className="flex flex-col gap-2 p-3 bg-[#111] rounded border border-[#2a2a2a]">
      <div className="flex justify-between text-xs">
        <span className="text-[#ccc] font-mono">{name}</span>
        <span className="text-[#666] font-mono">
          {sprite.w}×{sprite.h}
        </span>
      </div>
      <div
        className="relative"
        style={{
          width: boxW,
          height: boxH,
          backgroundColor: "#1a1a1a",
          backgroundImage: gridBg,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={sprite.src}
          alt=""
          className="absolute"
          style={{
            left: (boxW - sprite.w * PIXEL_SCALE) / 2,
            top: (boxH - sprite.h * PIXEL_SCALE) / 2,
            width: sprite.w * PIXEL_SCALE,
            height: sprite.h * PIXEL_SCALE,
            imageRendering: "pixelated",
          }}
        />
      </div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-sm tracking-widest uppercase text-[#999]">{title}</h2>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  )
}

function Note({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-[#666] italic">{children}</p>
}

// ---------- TILT / FOV ----------

function TiltLane({
  angle,
  progress,
  sprite,
  finishP,
}: {
  angle: number
  progress: number
  sprite: { src: string; w: number; h: number }
  finishP?: number
}) {
  const H = 150
  const CURB = 14
  const carScale = 3
  const carW = sprite.w * carScale
  const carH = sprite.h * carScale
  // car travels the inset road region so its x shares the plane's basis
  const carLeft = `calc(${ROAD_INSET}px + ${progress} * (100% - ${2 * ROAD_INSET + carW}px))`
  const carBottom = H / 2 - carH / 2
  // finish line centered on the car's center at the crossing moment (progress === finishP)
  const lineLeft = `calc(${carW / 2}px + ${finishP ?? 0} * (100% - ${carW}px))`

  const curb =
    "repeating-linear-gradient(90deg, #d44 0 18px, #f5f5f5 18px 36px)"
  const center =
    "repeating-linear-gradient(90deg, #e5e5e5 0 28px, transparent 28px 56px)"

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: H, background: DIRT }}
    >
      {/* road plane (takes the skew) — inset left/right so the whole skewed
          parallelogram sits inside the frame: both ends slant symmetrically */}
      <div
        className="absolute"
        style={{
          top: 0,
          bottom: 0,
          left: ROAD_INSET,
          right: ROAD_INSET,
          background: ASPHALT,
          transform: `skewX(-${angle}deg)`,
          transformOrigin: "center bottom",
        }}
      >
        <div
          className="absolute top-0 left-0 w-full"
          style={{ height: CURB, background: curb }}
        />
        <div
          className="absolute bottom-0 left-0 w-full"
          style={{ height: CURB, background: curb }}
        />
        <div
          className="absolute left-0 w-full"
          style={{
            top: "50%",
            transform: "translateY(-50%)",
            height: 4,
            background: center,
          }}
        />
        {finishP == null ? (
          <>
            <TiltChecker side="left" offset={120} curb={CURB} />
            <TiltChecker side="right" offset={60} curb={CURB} />
          </>
        ) : (
          <TiltChecker curb={CURB} leftCalc={lineLeft} />
        )}
      </div>

      {/* car — flat, upright, billboard on top */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sprite.src}
        alt=""
        className="absolute"
        style={{
          left: carLeft,
          bottom: carBottom,
          width: carW,
          height: carH,
          imageRendering: "pixelated",
        }}
      />
    </div>
  )
}

function TiltChecker({
  side,
  offset,
  curb,
  leftCalc,
}: {
  side?: "left" | "right"
  offset?: number
  curb: number
  leftCalc?: string
}) {
  const TILE = 14
  const half = TILE / 2
  const patId = useId()
  const pos = leftCalc
    ? { left: leftCalc, transform: "translateX(-50%)" }
    : { [side!]: offset }
  return (
    <div
      className="absolute"
      style={{ top: curb, bottom: curb, width: 28, ...pos }}
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
            width={TILE}
            height={TILE}
            patternUnits="userSpaceOnUse"
          >
            <rect x={0} y={0} width={TILE} height={TILE} fill={ASPHALT} />
            <rect x={0} y={0} width={half} height={half} fill="#ffffff" />
            <rect x={half} y={half} width={half} height={half} fill="#ffffff" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patId})`} />
      </svg>
    </div>
  )
}

// indices into CAR_SPRITES, one per GRAPH_LANES curve (ease-out / ease-in / ease-in-out)
const FINISH_SPRITES = [5, 1, 2]

function MergedRoad({
  items,
  progress,
  finishP,
  angle = 7,
}: {
  items: { src: string; w: number; h: number }[]
  progress: number[]
  finishP: number
  angle?: number
}) {
  const N = items.length
  const CURB = 14
  const BAND = 56 // lane height hugs the car (tallest sprite ≈ 42px at scale 3 + margin)
  const H = CURB * 2 + BAND * N
  const carScale = 3
  // road runs edge-to-edge: the plane OVERHANGS the container so its slanted left/right
  // ends clip off-screen — full-width road, no ugly slanted asphalt edges, POV kept via the
  // diagonal checkers. center pivot ⇒ max lean each side is tan(angle)*(H/2).
  const overhang = Math.ceil(Math.tan((angle * Math.PI) / 180) * (H / 2)) + 20
  // child positions (checkers, cars) are mapped to the VISIBLE road width
  // cars + finish line share one center-track, so the line lands on every car's
  // center at p=finishP regardless of sprite width. L/R are margins from the road edges.
  const TRACK_L = 90
  const TRACK_R = 110
  const trackRange = `(100% - ${2 * overhang + TRACK_L + TRACK_R}px)`

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: H, background: ASPHALT }}
    >
      {/* single skewed road plane — everything road-surface lives here so the slant is continuous */}
      <div
        className="absolute"
        style={{
          top: 0,
          bottom: 0,
          left: -overhang,
          right: -overhang,
          background: ASPHALT,
          transform: `skewX(-${angle}deg)`,
          transformOrigin: "center",
        }}
      >
        {/* outer curbs only */}
        <div
          className="absolute top-0 left-0 w-full"
          style={{ height: CURB, background: CURB_BG }}
        />
        <div
          className="absolute bottom-0 left-0 w-full"
          style={{ height: CURB, background: CURB_BG }}
        />

        {/* dashed lane dividers between bands */}
        {Array.from({ length: N - 1 }).map((_, k) => (
          <div
            key={k}
            className="absolute left-0 w-full"
            style={{
              top: CURB + BAND * (k + 1),
              height: 3,
              transform: "translateY(-50%)",
              background: DASH_BG,
            }}
          />
        ))}

        {/* continuous start + finish checkers (full interior height), placed by visible width */}
        <TiltChecker side="left" offset={overhang + TRACK_L} curb={CURB} />
        <TiltChecker curb={CURB} leftCalc={`calc(${overhang + TRACK_L}px + ${finishP} * ${trackRange})`} />

        {/* cars — counter-skewed so the road shears but the car stays upright, one per band */}
        {items.map((it, i) => {
          const carW = it.w * carScale
          const carH = it.h * carScale
          const left = `calc(${overhang + TRACK_L - carW / 2}px + ${progress[i] ?? 0} * ${trackRange})`
          const top = CURB + BAND * i + BAND / 2
          return (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={i}
              src={it.src}
              alt=""
              className="absolute"
              style={{
                left,
                top,
                width: carW,
                height: carH,
                transform: `translateY(-50%) skewX(${angle}deg)`,
                transformOrigin: "center",
                imageRendering: "pixelated",
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

// ---------- PIXEL ----------

function PixelLane({ color, progress }: { color: string; progress: number }) {
  const carWidth = 88
  const carHeight = 40
  const left = `calc(${progress} * (100% - ${carWidth}px))`
  const dark = darken(color, 0.35)
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: 140, background: "#5e5e5e" }}
    >
      <div
        className="absolute top-0 left-0 w-full"
        style={{
          height: 14,
          background:
            "repeating-linear-gradient(90deg, #d44 0 18px, #f5f5f5 18px 36px)",
        }}
      />
      <div
        className="absolute bottom-0 left-0 w-full"
        style={{
          height: 14,
          background:
            "repeating-linear-gradient(90deg, #d44 0 18px, #f5f5f5 18px 36px)",
        }}
      />
      <div
        className="absolute left-0 w-full"
        style={{
          top: "50%",
          transform: "translateY(-50%)",
          height: 4,
          background:
            "repeating-linear-gradient(90deg, #e5e5e5 0 28px, transparent 28px 56px)",
        }}
      />

      <div
        className="absolute"
        style={{
          left,
          top: "50%",
          width: carWidth,
          height: carHeight,
          transform: "translateY(-50%)",
        }}
      >
        <div
          className="absolute"
          style={{ left: 4, right: 4, top: 18, bottom: 10, background: color }}
        />
        <div
          className="absolute"
          style={{ left: 4, right: 4, bottom: 10, height: 4, background: dark }}
        />
        <div
          className="absolute"
          style={{ left: 0, top: 22, width: 8, height: 8, background: color }}
        />
        <div
          className="absolute"
          style={{ right: 0, top: 22, width: 8, height: 8, background: color }}
        />
        <div
          className="absolute"
          style={{ left: 28, right: 24, top: 6, height: 12, background: color }}
        />
        <div
          className="absolute"
          style={{ left: 20, top: 10, width: 8, height: 8, background: color }}
        />
        <div
          className="absolute"
          style={{ right: 16, top: 10, width: 8, height: 8, background: color }}
        />
        <div
          className="absolute"
          style={{
            left: 28,
            top: 10,
            width: 14,
            height: 8,
            background: "#bde4ff",
          }}
        />
        <div
          className="absolute"
          style={{
            right: 24,
            top: 10,
            width: 14,
            height: 8,
            background: "#bde4ff",
          }}
        />
        <div
          className="absolute"
          style={{
            left: 2,
            top: 20,
            width: 4,
            height: 4,
            background: "#fff5a8",
          }}
        />
        <div
          className="absolute"
          style={{
            right: 2,
            top: 20,
            width: 4,
            height: 4,
            background: "#ff3838",
          }}
        />
        <div
          className="absolute"
          style={{
            left: 10,
            bottom: 4,
            width: 16,
            height: 8,
            background: "#1a1a1a",
          }}
        />
        <div
          className="absolute"
          style={{
            right: 10,
            bottom: 4,
            width: 16,
            height: 8,
            background: "#1a1a1a",
          }}
        />
        <div
          className="absolute"
          style={{
            left: 12,
            bottom: 0,
            width: 12,
            height: 10,
            background: "#111",
          }}
        />
        <div
          className="absolute"
          style={{
            right: 12,
            bottom: 0,
            width: 12,
            height: 10,
            background: "#111",
          }}
        />
        <div
          className="absolute"
          style={{
            left: 16,
            bottom: 3,
            width: 4,
            height: 4,
            background: "#888",
          }}
        />
        <div
          className="absolute"
          style={{
            right: 16,
            bottom: 3,
            width: 4,
            height: 4,
            background: "#888",
          }}
        />
      </div>
    </div>
  )
}
