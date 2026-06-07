import type { ControlPoints } from "./BezierCurveEditor"
import { CurveBadge } from "./CurveBadge"
import { BOARD_BG } from "../lib/graphTheme"
import { CURVE_PRESETS, matchPreset } from "@/lib/presets"
import { LANE_PALETTE } from "@/lib/palette"

type Props = {
  value: ControlPoints
  onPick: (cp: ControlPoints) => void
}

// custom sits after the predefined presets in the palette, so it reads as its own hue
const CUSTOM_COLOR = LANE_PALETTE[CURVE_PRESETS.length % LANE_PALETTE.length]

const BADGE = 28
// selected row = the same asphalt board color as the graph/editor surface
const ACTIVE_BG = BOARD_BG
// ~5 rows tall (row ≈ 40px + gap 4px); more presets scroll instead of growing the column
const LIST_MAX_H = 216

const rowBase: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  width: "100%",
  padding: "6px 8px",
  fontFamily: "var(--font-silkscreen)",
  fontSize: 11,
  color: "#f5f5f5",
  textAlign: "left",
}

// Left column of the lane popover: the predefined easings plus a single
// "custom" marker that lights up when the curve matches no preset.
export function CurvePresets({ value, onPick }: Props) {
  const active = matchPreset(value)
  const isCustom = active === null

  return (
    <div className="flex flex-col gap-1 shrink-0" style={{ width: 150 }}>
      {/* predefined easings — scroll within a fixed height once they overflow */}
      <div
        className="flex flex-col gap-1 overflow-y-auto"
        style={{ maxHeight: LIST_MAX_H }}
      >
        {CURVE_PRESETS.map((p, i) => {
          const selected = active?.name === p.name
          return (
            <button
              key={p.name}
              onClick={() => onPick(p.controlPoints)}
              className="transition-colors hover:bg-[#3a3a3a]"
              style={{
                ...rowBase,
                cursor: "pointer",
                // inline bg only when selected, so the hover class can show otherwise
                background: selected ? ACTIVE_BG : undefined,
              }}
            >
              <CurveBadge
                controlPoints={p.controlPoints}
                color={LANE_PALETTE[i % LANE_PALETTE.length]}
                size={BADGE}
              />
              {p.name}
            </button>
          )
        })}
      </div>

      {/* custom marker — pinned, display only; you make a custom curve by dragging the editor */}
      <div
        style={{
          ...rowBase,
          background: isCustom ? ACTIVE_BG : "transparent",
          opacity: isCustom ? 1 : 0.4,
        }}
      >
        <CurveBadge controlPoints={value} color={CUSTOM_COLOR} size={BADGE} />
        custom
      </div>
    </div>
  )
}
