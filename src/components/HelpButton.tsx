"use client"

// Help / about "?" button — sits next to the settings cog, same IconButton chip + size so the pair
// reads as a matched set. Opens the About (ideology) modal.

import { IconButton } from "./IconButton"

export function HelpButton({ onClick }: { onClick?: () => void }) {
  return (
    <IconButton onClick={onClick} ariaLabel="About Racing Curves">
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 26,
          height: 26,
          fontFamily: "var(--font-silkscreen)",
          fontSize: 20,
          lineHeight: 1,
        }}
      >
        ?
      </span>
    </IconButton>
  )
}
