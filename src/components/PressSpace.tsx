"use client"

import { useEffect, useState } from "react"

// Start prompt, fixed bottom-center. Blinks 800ms on/off. Also a TAP TARGET so touch devices (no
// spacebar) can start the race — `onStart` runs the same path as the Space key. Copy swaps to
// "TAP TO START" on coarse pointers via CSS (.start-hint-* in globals.css), no JS/UA sniffing.
export function PressSpace({ onStart }: { onStart: () => void }) {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const id = setInterval(() => setVisible((v) => !v), 800)
    return () => clearInterval(id)
  }, [])
  return (
    <button
      type="button"
      onClick={onStart}
      aria-label="Start race"
      className="fixed left-1/2 bottom-6 -translate-x-1/2 select-none z-50 px-4 py-2"
      style={{
        fontFamily: "var(--font-silkscreen)",
        fontSize: 20,
        letterSpacing: "0.12em",
        color: "#fff",
        textShadow: "2px 2px 0 #000",
        opacity: visible ? 1 : 0,
        imageRendering: "pixelated",
        background: "transparent",
        border: "none",
        cursor: "pointer",
      }}
    >
      <span className="start-hint-fine">PRESS SPACE TO START</span>
      <span className="start-hint-touch">TAP TO START</span>
    </button>
  )
}
