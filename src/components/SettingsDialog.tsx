"use client"

// Settings modal — the shared Modal shell (DOOM skin) filled with setting rows. Controlled `open` so
// the parent drives it (cog click + global ESC-to-open). Children are the setting rows.

import type { ReactNode } from "react"
import { Modal } from "./Modal"

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
    <Modal open={open} onOpenChange={onOpenChange} title="SETTINGS">
      <div className="flex flex-col gap-4">{children}</div>
    </Modal>
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
              background: active ? "var(--color-violet)" : "transparent",
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
