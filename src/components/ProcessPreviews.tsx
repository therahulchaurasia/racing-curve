"use client"

import { useEffect, useId, useMemo, useState } from "react"
import { cubicBezier } from "@/lib/cubicBezier"
import { bezierPathD, bezierHandles } from "@/lib/bezierPath"
import { darken } from "@/lib/color"
import { PixelButton } from "./PixelButton"
import { CurveGraph } from "./CurveGraph"
import { Panel } from "./Panel"
import { BezierCurveEditor } from "./BezierCurveEditor"
import { StartLight } from "./StartLight"
import { StartGantry, useStartLightSequence } from "./RaceLights"
import { RacingCurvesLogo } from "./RacingCurvesLogo"
import { SettingsCog } from "./SettingsCog"
import { SettingsDialog, SettingRow, SettingSegmented } from "./SettingsDialog"
import { HelpButton } from "./HelpButton"
import { AboutDialog } from "./AboutDialog"
import type { LightsStyle } from "@/lib/settings"
import { Mountains } from "./Mountains"
import { FRONT_RIDGE, BACK_RIDGE } from "@/lib/mountains"
import { NightSky } from "./NightSky"
import { Star, StarField } from "./Stars"
import { STAR_COLORS, type StarShape } from "@/lib/stars"
import { Clump } from "./Clump"
import { CLUMPS, scatterFoliage } from "@/lib/foliage"
import type { Lane as LaneType } from "@/lib/types"
import type { ControlPoints } from "./BezierCurveEditor"

// graph-only preview lanes — CurveGraph plots the curve + dot and never reads carSprite, so it's "".
const GRAPH_LANES: LaneType[] = [
  {
    id: "g1",
    controlPoints: [0, 0, 0.58, 1],
    label: "ease-out",
    color: "#22d3ee",
    carSprite: "",
  },
  {
    id: "g2",
    controlPoints: [0.42, 0, 1, 1],
    label: "ease-in",
    color: "#f472b6",
    carSprite: "",
  },
  {
    id: "g3",
    controlPoints: [0.42, 0, 0.58, 1],
    label: "ease-in-out",
    color: "#a3e635",
    carSprite: "",
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

// red "exit/destructive" candidates (DELETE + CLOSE) — compared in the Buttons section
const RED_BTN = [
  { name: "curb night", hi: "#c45a5a", face: "#9e3b3b", sh: "#6e2626", text: "#ffffff" },
  { name: "curb day", hi: "#ec6a6a", face: "#dd4444", sh: "#a02e2e", text: "#ffffff" },
  { name: "crimson", hi: "#e05c4d", face: "#c0392b", sh: "#7e2218", text: "#ffffff" },
]

// night-theme primary-button candidates (vibrant, with glow) — compared in the Buttons section
const NIGHT_BTN = [
  { name: "cyan", hi: "#5fe0f5", face: "#22b8d6", sh: "#137a92", text: "#06303a", glow: "#22d3ee" },
  { name: "violet", hi: "#b9a3ff", face: "#8b6df0", sh: "#5a3fbf", text: "#ffffff", glow: "#a78bfa" },
  { name: "pink", hi: "#f9a8d4", face: "#ec5fa8", sh: "#a83a7a", text: "#ffffff", glow: "#f472b6" },
  { name: "amber", hi: "#fcd34d", face: "#f0a818", sh: "#a86f10", text: "#3a2606", glow: "#fbbf24" },
]

export function ProcessPreviews() {
  const p1 = useLoopProgress(easeOut, 0)
  const p2 = useLoopProgress(easeInOut, 600)
  const graphSolvers = GRAPH_LANES.map((l) => cubicBezier(...l.controlPoints))
  const loopT = useLoopProgress((t) => t, 0)
  const graphProgress = graphSolvers.map((s) => s(loopT))
  const [editorCp, setEditorCp] = useState<ControlPoints>([0.42, 0, 0.58, 1])
  const [roadN, setRoadN] = useState(6)
  const [roadPlaying, setRoadPlaying] = useState(true)
  const [laydownN, setLaydownN] = useState(4)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [demoShowGraph, setDemoShowGraph] = useState(true)
  const [demoShowLights, setDemoShowLights] = useState(true)
  const [demoLightsStyle, setDemoLightsStyle] = useState<LightsStyle>("sequence")
  const [demoAboutOpen, setDemoAboutOpen] = useState(false)
  const lights = useStartLightSequence()
  const roadItems = Array.from(
    { length: roadN },
    (_, i) => CAR_SPRITES[i % CAR_SPRITES.length],
  )
  // all lanes linear for now — cars move uniformly so every one stays visible.
  // stop freezes them mid-track (0.45) so the shadow is easy to inspect.
  const roadProgress = Array.from({ length: roadN }, () => (roadPlaying ? loopT : 0.45))

  return (
    <div className="flex flex-col gap-12 w-full max-w-[1100px]">
      <GroupHeading>Environment</GroupHeading>

      <Section title="Night backdrop — two mountain ridges">
        <MountainLab />
      </Section>

      <Section title="Stars — shapes">
        <div className="flex flex-col gap-6 p-6" style={{ background: "#181445" }}>
          <div className="flex gap-10">
            {(["dot", "plus", "plusDot", "square"] as StarShape[]).map((shape) => (
              <div key={shape} className="flex flex-col gap-3">
                <div className="text-xs text-[#cdb8ff] font-mono">{shape}</div>
                <div className="flex items-end gap-5">
                  {[4, 6, 8, 12].map((s) => (
                    <div key={s} className="flex flex-col items-center gap-2">
                      <Star shape={shape} size={s} />
                      <span className="text-[10px] text-[#7a6fb0] font-mono">{s}px</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <div className="text-xs text-[#cdb8ff] font-mono">tints (glow on) · plus vs plusDot at 14px</div>
            <div className="flex items-center gap-5">
              {STAR_COLORS.map((c) => (
                <Star key={c} shape="plus" size={14} color={c} />
              ))}
              <span className="text-[#564a93]">·</span>
              {STAR_COLORS.map((c) => (
                <Star key={`d${c}`} shape="plusDot" size={14} color={c} />
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Foliage — variations from 3 sprites">
        <FoliageLab />
      </Section>

      <Section title="Foliage — spread (jittered grid)">
        <FoliageField />
      </Section>

      <GroupHeading>Cars &amp; Lanes</GroupHeading>

      <Section title="Cars — native + scaled">
        <div className="grid grid-cols-2 gap-3">
          {CAR_SPRITES.map((c) => (
            <CarCell key={c.src} sprite={c} />
          ))}
        </div>
      </Section>

      <Section title="Pixel">
        <PixelLane color="#ff5a3c" progress={p1} />
        <PixelLane color="#3b82f6" progress={p2} />
      </Section>

      <Section title="Flat lane — tires planted (2D)">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="text-xs text-[#888] font-mono">planted on a ground line — no shadow</div>
            <PlantedLane progress={p1} sprite={CAR_SPRITES[5]} />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-xs text-[#888] font-mono">planted + soft contact shadow</div>
            <PlantedLane progress={p1} sprite={CAR_SPRITES[2]} softShadow />
          </div>
        </div>
      </Section>

      <Section title="Lay-down — stacked lanes">
        <div className="flex gap-2 items-center">
          <span className="text-xs text-[#888] font-mono">lanes:</span>
          {[2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => setLaydownN(n)}
              className={`text-xs px-2 py-1 font-mono ${laydownN === n ? "bg-[#a3e635] text-black" : "bg-[#333] text-[#ccc]"}`}
            >
              {n}
            </button>
          ))}
        </div>
        <LaydownRoad
          progresses={Array.from({ length: laydownN }, () => loopT)}
          sprites={Array.from({ length: laydownN }, (_, i) => CAR_SPRITES[i % CAR_SPRITES.length])}
        />
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
      </Section>

      <Section title="Ground feel — skew (current) vs lay-down">
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <div className="text-xs text-[#888] font-mono">
              A — skewX(-7°), car centered (the &quot;sliding sideways&quot; feel)
            </div>
            <SkewLane progress={p1} sprite={CAR_SPRITES[5]} />
          </div>
          <div className="flex flex-col gap-1">
            <div className="text-xs text-[#888] font-mono">
              B — rotateX lay-down + tires planted on the surface
            </div>
            <LaydownLane progress={p1} sprite={CAR_SPRITES[5]} />
          </div>
        </div>
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
      </Section>

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
          <button
            onClick={() => setRoadPlaying((p) => !p)}
            className="text-xs px-3 py-1 font-mono bg-[#fbbf24] text-black ml-2"
          >
            {roadPlaying ? "⏸ stop" : "▶ start"}
          </button>
        </div>
        {/* full-bleed: break out of the centered max-w column so we can judge edge-to-edge */}
        <div style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}>
          <MergedRoad
            items={roadItems}
            progress={roadProgress}
            finishP={0.92}
          />
        </div>
      </Section>

      <GroupHeading>Misc</GroupHeading>

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
              face="#8e8e98"
              hi="#aaaab4"
              sh="#54545e"
              textColor="#14141a"
            >
              DELETE
            </PixelButton>
            <span className="text-xs text-[#666]">
              gray (used as vertical lane delete in app)
            </span>
          </div>
          {/* red exit/destructive candidates — DELETE + CLOSE on a dark swatch */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[#888] font-mono">red candidates (DELETE / CLOSE)</span>
            <div className="flex gap-8 items-end p-5" style={{ background: "#161232" }}>
              {RED_BTN.map((b) => (
                <div key={b.name} className="flex flex-col items-center gap-2">
                  <div className="flex gap-2">
                    <PixelButton face={b.face} hi={b.hi} sh={b.sh} textColor={b.text}>
                      DELETE
                    </PixelButton>
                    <PixelButton face={b.face} hi={b.hi} sh={b.sh} textColor={b.text}>
                      CLOSE
                    </PixelButton>
                  </div>
                  <span className="text-[10px] text-[#7a6fb0] font-mono">{b.name}</span>
                </div>
              ))}
            </div>
          </div>
          {/* night-theme primary candidates on a dark swatch so the glow reads */}
          <div className="flex flex-col gap-2">
            <span className="text-xs text-[#888] font-mono">night candidates (+ LANE, glow on)</span>
            <div className="flex gap-6 items-end p-5" style={{ background: "#161232" }}>
              {NIGHT_BTN.map((b) => (
                <div key={b.name} className="flex flex-col items-center gap-2">
                  <PixelButton
                    face={b.face}
                    hi={b.hi}
                    sh={b.sh}
                    textColor={b.text}
                    style={{ filter: `drop-shadow(0 0 6px ${b.glow})` }}
                  >
                    + LANE
                  </PixelButton>
                  <span className="text-[10px] text-[#7a6fb0] font-mono">{b.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Curve graph">
        <BeforeAfter
          before={<OldGraphSnapshot />}
          after={
            <Panel>
              <CurveGraph lanes={GRAPH_LANES} progress={graphProgress} currentT={loopT} />
            </Panel>
          }
        />
      </Section>

      <Section title="Bezier curve editor">
        <BeforeAfter
          before={<OldEditorSnapshot />}
          after={
            <div style={{ width: SNAP }}>
              <BezierCurveEditor value={editorCp} onChange={setEditorCp} />
            </div>
          }
        />
      </Section>

      <Section title="Settings — cog + modal">
        <div className="flex items-center gap-8 p-6" style={{ background: "#181445" }}>
          <div className="flex flex-col items-center gap-2">
            <div className="flex gap-2">
              <HelpButton onClick={() => setDemoAboutOpen(true)} />
              <SettingsCog onClick={() => setSettingsOpen(true)} />
            </div>
            <span className="text-[10px] text-[#7a6fb0] font-mono">? = about · cog = settings</span>
          </div>
          <PixelButton onClick={() => setSettingsOpen(true)}>OPEN SETTINGS</PixelButton>
          <PixelButton onClick={() => setDemoAboutOpen(true)}>OPEN ABOUT</PixelButton>
        </div>
        <AboutDialog open={demoAboutOpen} onOpenChange={setDemoAboutOpen} />
        <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <SettingRow label="CURVE GRAPH">
            <SettingSegmented
              value={demoShowGraph ? "show" : "hide"}
              options={[
                { value: "show", label: "SHOW" },
                { value: "hide", label: "HIDE" },
              ]}
              onChange={(v) => setDemoShowGraph(v === "show")}
            />
          </SettingRow>
          <SettingRow label="START LIGHTS">
            <SettingSegmented
              value={demoShowLights ? "show" : "hide"}
              options={[
                { value: "show", label: "SHOW" },
                { value: "hide", label: "HIDE" },
              ]}
              onChange={(v) => {
                const show = v === "show"
                setDemoShowLights(show)
                if (!show) setDemoLightsStyle("simple")
              }}
            />
          </SettingRow>
          <SettingRow label="LIGHT STYLE">
            <SettingSegmented
              value={demoLightsStyle}
              options={[
                { value: "sequence", label: "SEQUENCE" },
                { value: "simple", label: "SIMPLE" },
              ]}
              onChange={setDemoLightsStyle}
              disabled={!demoShowLights}
            />
          </SettingRow>
        </SettingsDialog>
      </Section>

      <Section title="Logo — racing curves">
        <div className="flex">
          <RacingCurvesLogo />
        </div>
      </Section>

      <Section title="Start prompt">
        <div className="grid grid-cols-2 gap-3">
          <PromptCell label="blink (800/800)" blink />
          <PromptCell label="steady" />
        </div>
      </Section>

      <GroupHeading>Unsorted — to arrange</GroupHeading>

      <Section title="Start lights — colors (banded glow)">
        <div className="flex gap-6">
          {(["red", "amber", "green"] as const).map((color) => (
            <div key={color} className="flex flex-col items-center gap-3 p-4">
              <div className="text-xs text-[#1a1a1a] font-mono">{color}</div>
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-1">
                  <StartLight color={color} on size={40} />
                  <span className="text-[10px] text-[#444] font-mono">on</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <StartLight color={color} size={40} />
                  <span className="text-[10px] text-[#444] font-mono">off</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Start lights — gantry over the start line">
        <div className="flex gap-2">
          <button
            onClick={lights.start}
            className="text-xs px-2 py-1 font-mono bg-[#a3e635] text-black"
          >
            {lights.running ? "playing…" : "play sequence"}
          </button>
          <button
            onClick={lights.reset}
            className="text-xs px-2 py-1 font-mono bg-[#333] text-[#ccc]"
          >
            reset
          </button>
        </div>
        {/* gantry standing on the road's top curb at the start line, over a night sky + road strip */}
        <div style={{ width: "100%", maxWidth: 520 }}>
          <div style={{ background: "linear-gradient(180deg, #1d1850, #3a2f72)", paddingTop: 18 }}>
            <div className="flex justify-center">
              <StartGantry redColumns={lights.redColumns} greenOn={lights.greenOn} />
            </div>
          </div>
          {/* the road the rods plant on: night curb + asphalt */}
          <div style={{ height: 14, background: "repeating-linear-gradient(90deg, #9e3b3b 0 18px, #cdc9d6 18px 36px)" }} />
          <div style={{ height: 40, background: "#3a3942" }} />
        </div>
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

// Top-level group label — bigger/brighter than a Section h2, with a rule + extra top space, to split
// the page into themed groups (Environment / Cars & Lanes / Misc / …).
function GroupHeading({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-xl tracking-wider uppercase text-white font-mono border-b border-[#2a2a2a] pb-2 mt-6">
      {children}
    </h1>
  )
}

// ---- before/after exhibit (curve graph + bezier editor) ----------------------------------------
// The graph + editor were reskinned in place (day → night). To show the evolution on the process
// page, these are FROZEN static snapshots of the OLD day-styled look (recreated from git history) —
// non-interactive, purely visual. The "after" side renders the real, current components.

const DAY_BG = "#5e5e5e"
const DAY_FRAME = "#2a2a2a"
const DAY_GRID = "rgba(255,255,255,0.06)"
const DAY_MID = "rgba(255,255,255,0.12)"
const DAY_GUIDE = "rgba(255,255,255,0.35)"
const SNAP = 230 // snapshot box size

const snapClip = `polygon(
  0 6px, 3px 6px, 3px 3px, 6px 3px, 6px 0,
  calc(100% - 6px) 0, calc(100% - 6px) 3px, calc(100% - 3px) 3px, calc(100% - 3px) 6px, 100% 6px,
  100% calc(100% - 6px), calc(100% - 3px) calc(100% - 6px), calc(100% - 3px) calc(100% - 3px), calc(100% - 6px) calc(100% - 3px), calc(100% - 6px) 100%,
  6px 100%, 6px calc(100% - 3px), 3px calc(100% - 3px), 3px calc(100% - 6px), 0 calc(100% - 6px)
)`
const snapKnobClip = `polygon(
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

// big gray arrow between the before + after
function Arrow() {
  return <div className="text-3xl text-[#666] font-mono px-1 shrink-0 self-center">→</div>
}

// labelled wrapper so before/after read as a pair
function BeforeAfter({ before, after }: { before: React.ReactNode; after: React.ReactNode }) {
  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-[#7a6fb0] font-mono">before (day)</span>
        {before}
      </div>
      <Arrow />
      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-[#7a6fb0] font-mono">after (night)</span>
        {after}
      </div>
    </div>
  )
}

// frozen day-styled CurveGraph: square board, faint grid + brighter midlines, the same curves, and
// the OLD axis labels (0 / t=1 / p=1, dark) — since renamed to time/progress.
function OldGraphSnapshot() {
  return (
    <div
      className="relative"
      style={{
        width: SNAP,
        height: SNAP,
        background: DAY_BG,
        clipPath: snapClip,
        boxShadow: `inset 0 0 0 2px ${DAY_FRAME}`,
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
            <line x1={v} y1={0} x2={v} y2={100} stroke={DAY_GRID} strokeWidth={0.3} vectorEffect="non-scaling-stroke" />
            <line x1={0} y1={v} x2={100} y2={v} stroke={DAY_GRID} strokeWidth={0.3} vectorEffect="non-scaling-stroke" />
          </g>
        ))}
        <line x1={50} y1={0} x2={50} y2={100} stroke={DAY_MID} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
        <line x1={0} y1={50} x2={100} y2={50} stroke={DAY_MID} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
        {GRAPH_LANES.map((lane) => (
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
      <SnapLabel pos="bl">0</SnapLabel>
      <SnapLabel pos="br">t=1</SnapLabel>
      <SnapLabel pos="tl">p=1</SnapLabel>
    </div>
  )
}

function SnapLabel({ pos, children }: { pos: "bl" | "br" | "tl"; children: React.ReactNode }) {
  const map = {
    bl: { left: 6, bottom: 6 },
    br: { right: 6, bottom: 6 },
    tl: { left: 6, top: 6 },
  } as const
  return (
    <div
      className="absolute pointer-events-none select-none"
      style={{
        ...map[pos],
        fontFamily: "var(--font-silkscreen)",
        fontSize: 11,
        color: "#1a1a1a",
        letterSpacing: "0.08em",
      }}
    >
      {children}
    </div>
  )
}

// frozen day-styled BezierCurveEditor: day asphalt, even 20×20 grid pattern, dashed guides, white
// curve + two white jigsaw knobs. Static (non-interactive) at a fixed curve.
function OldEditorSnapshot() {
  const patId = useId()
  const cp: [number, number, number, number] = [0.42, 0, 0.58, 1]
  const { h1x, h1y, h2x, h2y } = bezierHandles(cp)
  const pathD = `M 0 100 C ${h1x} ${h1y} ${h2x} ${h2y} 100 0`
  const KNOB = 14
  const PAD = KNOB / 2
  const inner = SNAP - PAD * 2
  return (
    <div style={{ width: SNAP, height: SNAP, position: "relative" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: DAY_BG,
          clipPath: snapClip,
          boxShadow: `inset 0 0 0 2px ${DAY_FRAME}`,
          imageRendering: "pixelated",
        }}
      >
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          shapeRendering="crispEdges"
          style={{ position: "absolute", inset: 2, width: "calc(100% - 4px)", height: "calc(100% - 4px)" }}
        >
          <defs>
            <pattern id={patId} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <line x1="20" y1="0" x2="20" y2="20" stroke={DAY_GRID} strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
              <line x1="0" y1="20" x2="20" y2="20" stroke={DAY_GRID} strokeWidth="0.4" vectorEffect="non-scaling-stroke" />
            </pattern>
          </defs>
          <rect x="0" y="0" width="100" height="100" fill={`url(#${patId})`} />
        </svg>
      </div>
      <div style={{ position: "absolute", top: PAD, left: PAD, right: PAD, bottom: PAD }}>
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ width: "100%", height: "100%", display: "block", overflow: "visible" }}
        >
          <line x1={0} y1={100} x2={h1x} y2={h1y} stroke={DAY_GUIDE} strokeWidth={1} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
          <line x1={100} y1={0} x2={h2x} y2={h2y} stroke={DAY_GUIDE} strokeWidth={1} strokeDasharray="2 2" vectorEffect="non-scaling-stroke" />
          <path d={pathD} stroke="#fff" strokeWidth={3} strokeLinecap="round" fill="none" vectorEffect="non-scaling-stroke" />
        </svg>
      </div>
      {[
        { left: (h1x / 100) * inner, top: (h1y / 100) * inner },
        { left: (h2x / 100) * inner, top: (h2y / 100) * inner },
      ].map((k, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            width: KNOB,
            height: KNOB,
            left: k.left,
            top: k.top,
            background: "#fff",
            clipPath: snapKnobClip,
            imageRendering: "pixelated",
          }}
        />
      ))}
    </div>
  )
}

// ---------- FOLIAGE (preview helpers — data/Clump/scatter live in ./foliage) ----------

// a cell on the real dirt bg, contents bottom-aligned so plants sit on the ground line
function DirtCell({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <div
        className="relative flex items-end justify-center p-3"
        style={{ background: DIRT, minHeight: 120 }}
      >
        {children}
      </div>
      <span className="text-[10px] text-[#666] font-mono text-center">
        {label}
      </span>
    </div>
  )
}

function FoliageLab() {
  return (
    <div className="flex flex-col gap-6">
      {/* combined clumps */}
      <div className="flex flex-col gap-2">
        <div className="text-xs text-[#888] font-mono">
          combined clumps ({CLUMPS.length} types)
        </div>
        <div className="grid grid-cols-3 gap-3">
          {CLUMPS.map((c) => (
            <DirtCell key={c.name} label={c.name}>
              <Clump parts={c.parts} />
            </DirtCell>
          ))}
        </div>
      </div>
    </div>
  )
}

// one button-group control row
function Param({
  label,
  value,
  set,
  opts,
  fmt,
}: {
  label: string
  value: number
  set: (v: number) => void
  opts: number[]
  fmt?: (v: number) => string
}) {
  return (
    <div className="flex gap-1 items-center">
      <span className="text-xs text-[#888] font-mono">{label}:</span>
      {opts.map((o) => (
        <button
          key={o}
          onClick={() => set(o)}
          className={`text-xs px-2 py-1 font-mono ${value === o ? "bg-[#a3e635] text-black" : "bg-[#333] text-[#ccc]"}`}
        >
          {fmt ? fmt(o) : o}
        </button>
      ))}
    </div>
  )
}

function MountainLab() {
  const [peaks, setPeaks] = useState(FRONT_RIDGE.peaks)
  const [amp, setAmp] = useState(FRONT_RIDGE.amp)
  const [seed, setSeed] = useState(FRONT_RIDGE.seed)
  const [backPeaks, setBackPeaks] = useState(BACK_RIDGE.peaks)
  const [backAmp, setBackAmp] = useState(BACK_RIDGE.amp)
  const [backSeed, setBackSeed] = useState(BACK_RIDGE.seed)
  const [starDensity, setStarDensity] = useState(1)
  const [starSeed, setStarSeed] = useState(1)
  const front = { ...FRONT_RIDGE, peaks, amp, seed }
  const back = { ...BACK_RIDGE, peaks: backPeaks, amp: backAmp, seed: backSeed }
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-4 items-center">
        <Param label="back peaks" value={backPeaks} set={setBackPeaks} opts={[3, 4, 5, 6, 7]} />
        <Param label="back amp" value={backAmp} set={setBackAmp} opts={[0.5, 0.58, 0.65, 0.72, 0.8]} fmt={(v) => v.toFixed(2)} />
        <button
          onClick={() => setBackSeed((s) => s + 1)}
          className="text-xs px-2 py-1 font-mono bg-[#7dd3fc] text-black"
        >
          regen back ↻ (seed {backSeed})
        </button>
      </div>
      <div className="flex flex-wrap gap-4 items-center">
        <Param label="front peaks" value={peaks} set={setPeaks} opts={[5, 6, 7, 8, 9, 10]} />
        <Param label="front amp" value={amp} set={setAmp} opts={[0.3, 0.38, 0.45, 0.5, 0.58]} fmt={(v) => v.toFixed(2)} />
        <button
          onClick={() => setSeed((s) => s + 1)}
          className="text-xs px-2 py-1 font-mono bg-[#a3e635] text-black"
        >
          regen front ↻ (seed {seed})
        </button>
      </div>
      <div className="flex flex-wrap gap-4 items-center">
        <Param label="star density" value={starDensity} set={setStarDensity} opts={[0.6, 1, 1.4, 1.8]} fmt={(v) => v.toFixed(1)} />
        <button
          onClick={() => setStarSeed((s) => s + 1)}
          className="text-xs px-2 py-1 font-mono bg-[#fde68a] text-black"
        >
          regen stars ↻ (seed {starSeed})
        </button>
      </div>
      {/* full-bleed so the ridges can be judged edge-to-edge */}
      <div style={{ width: "100vw", marginLeft: "calc(50% - 50vw)" }}>
        <div className="relative w-full overflow-hidden" style={{ height: 360 }}>
          <NightSky />
          <StarField density={starDensity} seed={starSeed} />
          <div className="absolute left-0 bottom-0 w-full">
            <Mountains front={front} back={back} height={300} />
          </div>
        </div>
      </div>
    </div>
  )
}

function FoliageField() {
  const [cols, setCols] = useState(6)
  const [rows, setRows] = useState(6)
  const [fill, setFill] = useState(0.75)
  const [jitter, setJitter] = useState(0.6)
  const [seed, setSeed] = useState(1)
  const H = 540

  const items = useMemo(
    () => scatterFoliage({ cols, rows, fill, jitter, seed }),
    [cols, rows, fill, jitter, seed],
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-4 items-center">
        <Param label="cols" value={cols} set={setCols} opts={[4, 5, 6, 7, 8]} />
        <Param label="rows" value={rows} set={setRows} opts={[3, 4, 5, 6]} />
        <Param label="fill" value={fill} set={setFill} opts={[0.55, 0.7, 0.75, 0.85]} fmt={(v) => `${Math.round(v * 100)}%`} />
        <Param label="jitter" value={jitter} set={setJitter} opts={[0, 0.3, 0.6, 0.9]} />
        <button
          onClick={() => setSeed((s) => s + 1)}
          className="text-xs px-2 py-1 font-mono bg-[#a3e635] text-black"
        >
          regen ↻ (seed {seed})
        </button>
      </div>
      <div
        className="relative w-full overflow-hidden"
        style={{
          height: H,
          backgroundColor: DIRT,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.22) 1px, transparent 1.5px), radial-gradient(circle, rgba(0,0,0,0.10) 1px, transparent 1.5px)",
          backgroundSize: "28px 28px, 36px 36px",
          backgroundPosition: "0 0, 14px 18px",
        }}
      >
        {items.map((it, k) => (
          <div
            key={k}
            className="absolute"
            style={{
              left: `${it.x}%`,
              top: `${it.y}%`,
              transform: `scale(${it.scale})`,
              transformOrigin: "top left",
            }}
          >
            <Clump parts={it.parts} />
          </div>
        ))}
      </div>
    </div>
  )
}

// Multi-lane lay-down: ONE tilted asphalt floor with the lanes stacked into its depth. Cars are
// billboarded upright (counter-rotate cancels the floor tilt) and planted on their lane line, so
// the shared perspective auto-scales them by distance — front lane near/large, back lane far/small.
function LaydownRoad({
  progresses,
  sprites,
}: {
  progresses: number[]
  sprites: { src: string; w: number; h: number }[]
}) {
  const n = sprites.length
  const H = 240
  const FLOOR_H = 320 // local (pre-tilt) height — foreshortens to much less on screen
  const TILT = 60
  const carScale = 3
  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: H, background: DIRT, perspective: 340 }}
    >
      <div
        className="absolute left-0 w-full"
        style={{
          bottom: 0,
          height: FLOOR_H,
          background: ASPHALT,
          transform: `rotateX(${TILT}deg)`,
          transformOrigin: "bottom center",
          transformStyle: "preserve-3d",
        }}
      >
        {/* far + near curbs */}
        <div className="absolute left-0 w-full" style={{ top: 0, height: 12, background: CURB_BG }} />
        <div className="absolute left-0 w-full" style={{ bottom: 0, height: 12, background: CURB_BG }} />
        {/* lane dividers at band boundaries */}
        {Array.from({ length: n - 1 }).map((_, k) => (
          <div
            key={k}
            className="absolute left-0 w-full"
            style={{
              top: (FLOOR_H * (k + 1)) / n,
              height: 3,
              transform: "translateY(-50%)",
              background: DASH_BG,
            }}
          />
        ))}
        {/* cars — i=0 nearest (bottom); billboard upright; perspective handles the depth scaling */}
        {sprites.map((sp, i) => {
          const carW = sp.w * carScale
          const carH = sp.h * carScale
          const laneCenterY = (FLOOR_H * (n - i - 0.5)) / n // i=0 → near bottom, i=n-1 → far top
          const left = `calc(${progresses[i] ?? 0} * (100% - ${carW}px))`
          return (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              key={i}
              src={sp.src}
              alt=""
              className="absolute"
              style={{
                left,
                top: laneCenterY,
                width: carW,
                height: carH,
                transform: `translateY(-100%) rotateX(-${TILT}deg)`,
                transformOrigin: "center bottom",
                imageRendering: "pixelated",
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

// ---------- GROUND FEEL: skew vs lay-down ----------

// A — the current approach: a sideways-sheared asphalt band with the car floating in its center.
// Demonstrates the "sliding sideways" problem.
function SkewLane({
  progress,
  sprite,
}: {
  progress: number
  sprite: { src: string; w: number; h: number }
}) {
  const H = 140
  const carScale = 3
  const carW = sprite.w * carScale
  const carH = sprite.h * carScale
  const left = `calc(${progress} * (100% - ${carW}px))`
  return (
    <div className="relative w-full overflow-hidden" style={{ height: H, background: DIRT }}>
      {/* asphalt plane, sheared sideways */}
      <div
        className="absolute left-0 w-full"
        style={{
          top: 22,
          bottom: 22,
          background: ASPHALT,
          transform: "skewX(-7deg)",
          transformOrigin: "center",
        }}
      >
        <div
          className="absolute left-0 w-full"
          style={{ top: "50%", transform: "translateY(-50%)", height: 4, background: DASH_BG }}
        />
      </div>
      {/* car floats in the band center */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sprite.src}
        alt=""
        className="absolute"
        style={{
          left,
          top: "50%",
          width: carW,
          height: carH,
          transform: "translateY(-50%)",
          imageRendering: "pixelated",
        }}
      />
    </div>
  )
}

// B — lay the asphalt down as a ground plane (perspective + rotateX) and plant the car's wheels on
// its near (front) edge. The receding centerline reinforces the surface. Car stays an upright
// billboard. This sells "tires on the asphalt" instead of "sliding sideways".
function LaydownLane({
  progress,
  sprite,
}: {
  progress: number
  sprite: { src: string; w: number; h: number }
}) {
  const H = 170
  const carScale = 3
  const carW = sprite.w * carScale
  const carH = sprite.h * carScale
  const left = `calc(${progress} * (100% - ${carW}px))`
  return (
    <div className="relative w-full overflow-hidden" style={{ height: H, background: DIRT }}>
      {/* asphalt ground plane — bottom edge = near, tilts back so the surface recedes */}
      <div
        className="absolute left-0 w-full overflow-hidden"
        style={{
          bottom: 0,
          height: 130,
          background: ASPHALT,
          transform: "perspective(320px) rotateX(60deg)",
          transformOrigin: "bottom center",
        }}
      >
        {/* centerline running into the distance — foreshortens with the plane */}
        <div
          className="absolute top-0 bottom-0"
          style={{
            left: "50%",
            width: 10,
            transform: "translateX(-50%)",
            background:
              "repeating-linear-gradient(0deg, #e5e5e5 0 22px, transparent 22px 52px)",
          }}
        />
      </div>
      {/* car planted on the near edge of the ground, upright */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sprite.src}
        alt=""
        className="absolute"
        style={{
          left,
          bottom: 10,
          width: carW,
          height: carH,
          imageRendering: "pixelated",
        }}
      />
    </div>
  )
}

// Flat 2D lane where the car is PLANTED on a ground line instead of floating in the band: a darker
// road body + lit contact edge below the wheels, dashes on the road, car bottom-aligned to the
// line. Optional soft (feathered) contact shadow. No transforms — equal lanes, easy to style.
function PlantedLane({
  progress,
  sprite,
  softShadow = false,
}: {
  progress: number
  sprite: { src: string; w: number; h: number }
  softShadow?: boolean
}) {
  const H = 110
  const CURB = 14
  const groundY = 74 // box-relative line the wheels rest on
  const carScale = 3
  const carW = sprite.w * carScale
  const carH = sprite.h * carScale
  const left = `calc(${progress} * (100% - ${carW}px))`
  return (
    <div className="relative w-full overflow-hidden" style={{ height: H, background: DIRT }}>
      {/* asphalt band */}
      <div className="absolute left-0 w-full" style={{ top: CURB, bottom: CURB, background: ASPHALT }} />
      {/* darker road body below the contact line (surface the tyres press into) */}
      <div className="absolute left-0 w-full" style={{ top: groundY, bottom: CURB, background: "#525252" }} />
      {/* lit contact edge */}
      <div className="absolute left-0 w-full" style={{ top: groundY - 1, height: 2, background: "#6f6f6f" }} />
      {/* dashed road marking on the body */}
      <div className="absolute left-0 w-full" style={{ top: groundY + 8, height: 3, background: DASH_BG }} />
      {/* soft feathered contact shadow (optional) */}
      {softShadow && (
        <div
          className="absolute"
          style={{
            left,
            top: groundY - 4,
            width: carW,
            height: 9,
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0) 72%)",
            transform: "scaleX(0.85)",
          }}
        />
      )}
      {/* car — wheels planted on the ground line */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sprite.src}
        alt=""
        className="absolute"
        style={{
          left,
          top: groundY,
          width: carW,
          height: carH,
          transform: "translateY(-100%)",
          imageRendering: "pixelated",
        }}
      />
    </div>
  )
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
  // ends clip off-screen — full-width road, no ugly slanted asphalt edges. center pivot
  // ⇒ max lean each side is tan(angle)*(H/2).
  const overhang = Math.ceil(Math.tan((angle * Math.PI) / 180) * (H / 2)) + 20
  // Two layers: the SKEWED plane holds only the road surface (asphalt, curbs, dashes) so
  // the floor tilts; an UPRIGHT overlay (container coords, no skew) holds the start/finish
  // gates + cars so they stand straight and never wander as lanes are added. Track x is mapped
  // to the container width, so the gates are pinned regardless of N. L/R are margins from edges.
  const TRACK_L = 90
  const TRACK_R = 110
  const trackRange = `(100% - ${TRACK_L + TRACK_R}px)`

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{ height: H, background: ASPHALT }}
    >
      {/* skewed road floor — surface only, so the slant is continuous and POV is kept */}
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
      </div>

      {/* upright overlay — vertical gates + cars stand straight on the tilted floor.
          gates clip to the interior (top:CURB→bottom:CURB); the ~3px lean of the curb
          edge across the 28px gate is negligible. */}
      <TiltChecker curb={CURB} leftCalc={`${TRACK_L}px`} />
      <TiltChecker
        curb={CURB}
        leftCalc={`calc(${TRACK_L}px + ${finishP} * ${trackRange})`}
      />

      {items.map((it, i) => {
        const carW = it.w * carScale
        const carH = it.h * carScale
        const left = `calc(${TRACK_L - carW / 2}px + ${progress[i] ?? 0} * ${trackRange})`
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
              transform: "translateY(-50%)",
              imageRendering: "pixelated",
            }}
          />
        )
      })}
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
