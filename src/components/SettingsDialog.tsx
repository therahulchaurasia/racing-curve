"use client"

// Settings modal. Radix Dialog gives us the semantics for free (focus trap, ESC-to-close, backdrop
// click-close, ARIA, scroll lock); we only skin it. Content reuses the app's billboard language:
// near-black Panel bg + staircase corners + Silkscreen. Controlled `open` so the parent can also
// drive it (cog click + global ESC-to-open). Children are the setting rows.

import * as Dialog from "@radix-ui/react-dialog"
import type { ReactNode } from "react"
import { STAIRCASE_CLIP, staircaseInnerClip } from "./clipPaths"
import { PANEL_BG } from "./Panel"
import { RacingCurvesLogo } from "./RacingCurvesLogo"
import { BOARD_BG } from "./graphTheme"
import { PixelButton } from "./PixelButton"
import { BUTTON_RED } from "@/lib/palette"

export function SettingsDialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            // fully black, with one circular white vignette: clear/dark centre feathering to a white
            // glow around the edges
            background: `radial-gradient(circle at center, rgba(255,255,255,0) 60%, rgba(255,255,255,0.1) 100%),
              #050505`,
          }}
        />
        <Dialog.Content
          aria-describedby={undefined}
          className="flex flex-col items-center"
          style={{
            position: "fixed",
            top: "7vh", // anchored near the top (margin above the logo); grows downward
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 61,
          }}
        >
          {/* DOOM-style header: the wordmark sits ABOVE the panel (asphalt-gray fill, black border +
              text so it reads on the dim overlay), with a clear gap to the panel below. */}
          <div style={{ marginBottom: 16 }}>
            <RacingCurvesLogo fill={BOARD_BG} border="#ffffff" text="#ffffff" fontSize={40} />
          </div>
          {/* panel box — two clipped layers (like the Panel/logo): a light FRAME layer (full
              staircase silhouette) with the dark panel on top clipped to the SAME silhouette eroded
              inward by FRAME px → the uncovered ring is a crisp stepped border that hugs the notches
              with uniform width (overlay's black, so the frame is light). */}
          <div
            style={{
              background: "#cdc9d6",
              clipPath: STAIRCASE_CLIP,
              imageRendering: "pixelated",
            }}
          >
            <div
              style={{
                minWidth: 440,
                padding: 26,
                paddingTop: 32,
                background: PANEL_BG,
                clipPath: staircaseInnerClip(2),
                imageRendering: "pixelated",
                fontFamily: "var(--font-silkscreen)",
                display: "flex",
                flexDirection: "column",
                gap: 22,
              }}
            >
              <Dialog.Title
                style={{
                  fontFamily: "var(--font-silkscreen)",
                  color: "#fff",
                  fontSize: 18,
                  letterSpacing: 2,
                  textAlign: "center",
                }}
              >
                SETTINGS
              </Dialog.Title>
              <div className="flex flex-col gap-4">{children}</div>
              {/* no X — a single centered CLOSE at the bottom (controlled, so just flip open off) */}
              <PixelButton onClick={() => onOpenChange(false)} className="self-center" {...BUTTON_RED}>
                CLOSE
              </PixelButton>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// One labelled row inside the settings modal: Silkscreen label on the left, control on the right.
export function SettingRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-8">
      <span style={{ fontFamily: "var(--font-silkscreen)", color: "#cdc9d6", fontSize: 13 }}>
        {label}
      </span>
      {children}
    </div>
  )
}

// Segmented two-(or-N)-option control: all options visible in a bordered group, the active one
// bright (violet), the rest dim. Single source — used by every settings row.
export function SettingSegmented<T extends string>({
  value,
  options,
  onChange,
  disabled = false,
}: {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  disabled?: boolean
}) {
  return (
    <div
      style={{
        display: "inline-flex",
        border: "2px solid #54545e",
        background: "#14141a",
        imageRendering: "pixelated",
        opacity: disabled ? 0.4 : 1,
        pointerEvents: disabled ? "none" : undefined,
      }}
    >
      {options.map((opt, i) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            style={{
              fontFamily: "var(--font-silkscreen)",
              fontSize: 12,
              letterSpacing: 1,
              padding: "6px 14px",
              cursor: disabled ? "default" : "pointer",
              border: "none",
              borderLeft: i === 0 ? "none" : "2px solid #54545e",
              background: active ? "#8b6df0" : "transparent",
              color: active ? "#ffffff" : "#7a7787",
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
