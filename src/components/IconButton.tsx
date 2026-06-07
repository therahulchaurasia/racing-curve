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
      className="text-[#cdc9d6] hover:text-white transition-colors active:translate-y-[1px]"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 6,
        cursor: "pointer",
        background: "rgba(14,12,40,0.45)",
        border: "3px solid rgba(205,201,214,0.5)",
      }}
    >
      {children}
    </button>
  )
}
