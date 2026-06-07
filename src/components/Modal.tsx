"use client"

// Shared modal shell — the app's DOOM-style dialog skin in one place (single source). Radix Dialog
// gives the semantics for free (focus trap, ESC/backdrop close, ARIA, scroll lock); we only skin it:
// near-black overlay with a circular white vignette, the RacingCurvesLogo as a header above the
// panel, a two-layer light staircase border, a centered title, and a single crimson CLOSE (no X).
// Used by SettingsDialog and AboutDialog — pass a `title` + the body as children.

import * as Dialog from "@radix-ui/react-dialog"
import type { ReactNode } from "react"
import { STAIRCASE_CLIP, staircaseInnerClip } from "./clipPaths"
import { PANEL_BG } from "./Panel"
import { RacingCurvesLogo } from "./RacingCurvesLogo"
import { BOARD_BG } from "./graphTheme"
import { PixelButton } from "./PixelButton"
import { BUTTON_RED } from "@/lib/palette"

export function Modal({
  open,
  onOpenChange,
  title,
  children,
  logo = true,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: ReactNode
  children: ReactNode
  logo?: boolean // wordmark header above the panel; off when the title itself is the headline
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        {/* the Overlay IS the scroll container (radix's scrollable-dialog pattern): Content nests
            inside it, so when the modal is taller than the viewport the OVERLAY scrolls — the bar sits
            at the viewport edge (reads as the page scrollbar), no inner dialog scrollbar. The vignette
            uses background-attachment:fixed so it stays anchored to the viewport while scrolling. */}
        <Dialog.Overlay
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: "7vh", // anchored near the top; grows downward, scrolls when it overflows
            paddingBottom: "7vh",
            background: `radial-gradient(circle at center, rgba(255,255,255,0) 60%, rgba(255,255,255,0.1) 100%),
              #050505`,
            backgroundAttachment: "fixed",
          }}
        >
        <Dialog.Content
          aria-describedby={undefined}
          className="flex flex-col items-center"
          style={{ position: "relative", zIndex: 61 }}
        >
          {/* DOOM-style header: the wordmark sits ABOVE the panel (asphalt fill, white border + text
              so it reads on the dark overlay), with a clear gap to the panel below. Omitted when the
              title itself is the headline (e.g. the About modal's wordplay). */}
          {logo && (
            <div style={{ marginBottom: 16 }}>
              <RacingCurvesLogo fill={BOARD_BG} border="#ffffff" text="#ffffff" fontSize={40} />
            </div>
          )}
          {/* panel box — two clipped layers: a light FRAME layer (full staircase silhouette) with the
              dark panel on top clipped to the SAME silhouette eroded inward by 2px → the uncovered
              ring is a crisp stepped border hugging the notches (overlay's black, so the frame is light). */}
          <div style={{ background: "#cdc9d6", clipPath: STAIRCASE_CLIP, imageRendering: "pixelated" }}>
            <div
              style={{
                minWidth: 440,
                maxWidth: "min(90vw, 560px)",
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
                {title}
              </Dialog.Title>
              {children}
              {/* no X — a single centered CLOSE at the bottom (controlled, so just flip open off) */}
              <PixelButton onClick={() => onOpenChange(false)} className="self-center" {...BUTTON_RED}>
                CLOSE
              </PixelButton>
            </div>
          </div>
        </Dialog.Content>
        </Dialog.Overlay>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
