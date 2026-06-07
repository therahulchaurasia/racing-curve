"use client"

import { useEffect, useRef, useState } from "react"
import { Lane, START_OFFSET, CHECKER_WIDTH } from "./Lane"
import { CurveGraph } from "./CurveGraph"
import { PixelButton } from "./PixelButton"
import { PressSpace } from "./PressSpace"
import { StartGantry, useStartLightSequence } from "./RaceLights"
import { Panel } from "./Panel"
import { SettingsCog } from "./SettingsCog"
import { SettingsDialog, SettingRow, SettingSegmented } from "./SettingsDialog"
import { HelpButton } from "./HelpButton"
import { AboutDialog } from "./AboutDialog"
import { StarField } from "./Stars"
import { Mountains } from "./Mountains"
import { NightSky } from "./NightSky"
import { FoliageLayer } from "./FoliageLayer"
import { BUSHES } from "@/lib/foliage"
import { cubicBezier } from "@/lib/cubicBezier"
import { labelForCurve } from "@/lib/presets"
import { LANE_PALETTE as PALETTE } from "@/lib/palette"
import type { Lane as LaneType } from "@/lib/types"
import {
  type Settings,
  writeSettingsCookie,
  writeIntroSeenCookie,
} from "@/lib/settings"

const DURATION_MS = 3000
const MAX_LANES = 6 // capped so the side-view stays scenic (no endless stacking)

const INITIAL_LANES: LaneType[] = [
  {
    id: "a",
    controlPoints: [0, 0, 0.58, 1],
    label: "ease-out",
    color: PALETTE[0],
  },
  {
    id: "b",
    controlPoints: [0.42, 0, 1, 1],
    label: "ease-in",
    color: PALETTE[1],
  },
]

type PlayState = {
  startedAt: number
  solvers: Array<(t: number) => number>
}

export function BezierPlayground({
  initialSettings,
  introSeen,
}: {
  initialSettings: Settings
  introSeen: boolean
}) {
  const [lanes, setLanes] = useState<LaneType[]>(INITIAL_LANES)
  const [progress, setProgress] = useState<number[]>(() =>
    INITIAL_LANES.map(() => 0),
  )
  const [currentT, setCurrentT] = useState(0)
  const [play, setPlay] = useState<PlayState | null>(null)
  // user prefs (seeded from the cookie read server-side; persisted on change below)
  const [showGraph, setShowGraph] = useState(initialSettings.showGraph)
  const [showLights, setShowLights] = useState(initialSettings.showLights)
  const [lightsStyle, setLightsStyle] = useState(initialSettings.lightsStyle)
  const [settingsOpen, setSettingsOpen] = useState(false)
  // about/ideology modal — auto-opens once on first visit (cookie not yet set), reopen via "?"
  const [aboutOpen, setAboutOpen] = useState(!introSeen)

  useEffect(() => {
    writeSettingsCookie({ showGraph, showLights, lightsStyle })
  }, [showGraph, showLights, lightsStyle])

  // closing the about modal marks the intro as seen so it won't auto-open again
  const onAboutOpenChange = (open: boolean) => {
    setAboutOpen(open)
    if (!open) writeIntroSeenCookie()
  }

  const isPlaying = play !== null

  const onPlay = () => {
    setProgress(lanes.map(() => 0))
    setCurrentT(0)
    setPlay({
      startedAt: performance.now(),
      solvers: lanes.map((l) => cubicBezier(...l.controlPoints)),
    })
  }

  // start lights drive the countdown; green (onGo) launches the cars
  const lights = useStartLightSequence({ onGo: onPlay })

  // latest values the effects/handlers need, read through a ref so they don't have to re-subscribe
  // or re-run per render (the rAF loop must depend on `play` ONLY — adding `lights` would cancel +
  // restart it every render). Updated after commit (not during render) so concurrent/StrictMode
  // re-renders can't leave it stale.
  const latest = useRef({ lanes, lightsStyle, settingsOpen, aboutOpen, lights })
  useEffect(() => {
    latest.current = { lanes, lightsStyle, settingsOpen, aboutOpen, lights }
  })

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
        latest.current.lights.reset() // race over → lights off (via ref so deps stay [play])
      }
    }
    frameId = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameId)
  }, [play])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return
      const { lanes, lightsStyle, settingsOpen, aboutOpen, lights } = latest.current
      if (settingsOpen || aboutOpen) return // a modal is open — don't start a race behind it
      const target = e.target as HTMLElement | null
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      )
        return
      if (e.repeat) return // ignore held-key auto-repeat
      e.preventDefault()
      if (lightsStyle === "sequence") {
        // Space starts the light countdown (not the race); green launches the cars via onGo.
        // start() is a no-op until a run fully resets; only park the cars at the line when a fresh
        // countdown actually begins, so they're at the start throughout the countdown.
        if (lights.start()) {
          setPlay(null)
          setProgress(lanes.map(() => 0))
          setCurrentT(0)
        }
      } else {
        // simple — all greens light and the cars launch the same instant (no countdown). onGo
        // (= onPlay) parks + resets progress; startSimple's active ref guards re-entry while racing.
        lights.startSimple()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

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
    if (lanes.length >= MAX_LANES) return
    const used = new Set(lanes.map((l) => l.color))
    const free = PALETTE.find((c) => !used.has(c))
    const color = free ?? PALETTE[lanes.length % PALETTE.length]
    const controlPoints: LaneType["controlPoints"] = [0, 0, 1, 1]
    const next: LaneType = {
      id: crypto.randomUUID(),
      controlPoints,
      label: labelForCurve(controlPoints),
      color,
    }
    setLanes((prev) => [...prev, next])
    setProgress((prev) => [...prev, 0])
  }

  return (
    <div className="flex flex-col gap-6 w-full flex-1">
      {/* TOP zone — night sky scene above the road. Stars fill the box; mountains sit at the
          horizon (bottom), meeting the road. Fixed height (not flex-1) so adding lanes scrolls the
          page instead of squashing the sky; full-bleed to the viewport edges so it reads infinite. */}
      <div
        className="relative shrink-0 overflow-hidden"
        style={{
          height: "45vh",
          minHeight: 320,
          width: "100vw",
          marginLeft: "calc(50% - 50vw)",
        }}
      >
        {/* sky gradient lives only here, behind the stars + mountains; ground shows below this zone */}
        <NightSky />
        <StarField />
        <div className="absolute left-0 bottom-0 w-full">
          <Mountains height={240} />
        </div>
        {/* horizon seam — dark contact line where the mountain bases meet the dirt, so the range
            reads as planted on the ground rather than color-butting against it */}
        <div
          className="absolute bottom-0 left-0 w-full"
          style={{ height: 3, background: "#12101e" }}
        />
        {/* curve graph — enclosed in the same billboard Panel as the start lights; parked on the
            right with its base resting on the horizon (mountain/ground line) */}
        {showGraph && (
          <div className="absolute z-10" style={{ right: 40, bottom: -6 }}>
            <Panel>
              <CurveGraph
                lanes={lanes}
                progress={progress}
                currentT={currentT}
              />
            </Panel>
          </div>
        )}
      </div>

      {/* ROAD — deliberately no foliage layer, so nothing can land on the curbs.
          Full-bleed to the left screen edge so the asphalt runs off-screen (reads as infinite). */}
      <div
        className="relative flex flex-col gap-0"
        style={{ marginLeft: "calc(50% - 50vw)", width: "calc(50vw + 50%)" }}
      >
        {/* start-light gantry over the start line, rod ends just touching lane 0's top curb. Centred
            on the start checker (START_OFFSET + half its width); translateY(-100%) sets the rod ends
            at the road's top edge (curb) — raise the lights via the rod length, not by lifting here. */}
        <div
          className="absolute z-20"
          style={{
            // centred on the start checker, nudged right a touch to sit just inside the start line
            left: START_OFFSET + CHECKER_WIDTH / 2 + 40,
            top: 0,
            transform: "translate(-50%, -100%)",
          }}
        >
          {/* gantry reflects the sequence: sequence lights reds→green over the countdown; simple
              lights all greens at once on launch. Hidden entirely when showLights is off. */}
          {showLights && (
            <StartGantry
              redColumns={lights.redColumns}
              greenOn={lights.greenOn}
            />
          )}
        </div>
        {lanes.map((lane, i) => (
          <Lane
            key={lane.id}
            lane={lane}
            progress={progress[i] ?? 0}
            onChange={updateLane}
            onRemove={
              lanes.length > 1 ? () => onRemoveLane(lane.id) : undefined
            }
            isRacing={isPlaying}
            locked={isPlaying || lights.running}
            showTopCurb={i === 0}
            showBottomCurb={i === lanes.length - 1}
          />
        ))}
      </div>

      {/* BOTTOM zone — controls over the night ground, with a sparse row of night bush silhouettes
          behind them. minHeight gives the bushes room; auto otherwise so the sky zone keeps the slack. */}
      <div className="relative" style={{ minHeight: 90 }}>
        {/* roadside bush silhouettes — a denser scatter pinned just under the road (pulled up over
            the gap-6) so the scrub hugs the track edge. Size variety lets smaller ones sit at varied
            heights for a scattered (not single-row) read. */}
        <div
          className="absolute left-0 w-full"
          style={{ top: -40, height: 130 }}
        >
          <FoliageLayer
            types={BUSHES}
            cellSize={100}
            fill={0.85}
            scaleMin={0.9}
            scaleMax={1.15}
            filter="brightness(0.4) saturate(0.6)"
          />
        </div>
        <div className="relative z-10 flex flex-col gap-4 px-8 pt-5">
          <PixelButton
            onClick={onAddLane}
            disabled={lanes.length >= MAX_LANES || isPlaying || lights.running}
            glow
            className="self-start"
          >
            {lanes.length >= MAX_LANES ? "MAX LANES" : "+ LANE"}
          </PixelButton>
        </div>
      </div>

      {!isPlaying && !lights.running && <PressSpace />}

      {/* top-right controls: "?" about + settings cog. Click to open; ESC closes whichever is open. */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <HelpButton onClick={() => setAboutOpen(true)} />
        <SettingsCog onClick={() => setSettingsOpen(true)} />
      </div>
      <AboutDialog open={aboutOpen} onOpenChange={onAboutOpenChange} />
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <SettingRow label="CURVE GRAPH">
          <SettingSegmented
            value={showGraph ? "show" : "hide"}
            options={[
              { value: "show", label: "SHOW" },
              { value: "hide", label: "HIDE" },
            ]}
            onChange={(v) => setShowGraph(v === "show")}
          />
        </SettingRow>
        <SettingRow label="START LIGHTS">
          <SettingSegmented
            value={showLights ? "show" : "hide"}
            options={[
              { value: "show", label: "SHOW" },
              { value: "hide", label: "HIDE" },
            ]}
            onChange={(v) => {
              const show = v === "show"
              setShowLights(show)
              if (!show) setLightsStyle("simple") // hidden lights ⇒ instant launch
            }}
          />
        </SettingRow>
        <SettingRow label="LIGHT STYLE">
          <SettingSegmented
            value={lightsStyle}
            options={[
              { value: "sequence", label: "SEQUENCE" },
              { value: "simple", label: "SIMPLE" },
            ]}
            onChange={setLightsStyle}
            disabled={!showLights}
          />
        </SettingRow>
      </SettingsDialog>
    </div>
  )
}
