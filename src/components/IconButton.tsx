"use client"

// Shared bordered icon-button chip (single source) — the top-right control style: faint night-tinted
// fill, a thick light border, brightens on hover, slight press depress. The settings cog and the
// help "?" both wrap their glyph in this so they stay visually identical.

import type { ReactNode } from "react"

export function IconButton({
  onClick,
  ariaLabel,
  children,
}: {
  onClick?: () => void
  ariaLabel: string
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="text-curb-white hover:text-white transition-colors active:translate-y-[1px] bg-night/45 border-[3px] border-curb-white/50"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 6,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  )
}
