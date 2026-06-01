"use client"

import { useEffect, useState } from "react"

export function PressSpace() {
  const [visible, setVisible] = useState(true)
  useEffect(() => {
    const id = setInterval(() => setVisible((v) => !v), 800)
    return () => clearInterval(id)
  }, [])
  return (
    <div
      className="fixed left-1/2 bottom-6 -translate-x-1/2 pointer-events-none select-none z-50"
      style={{
        fontFamily: "var(--font-silkscreen)",
        fontSize: 20,
        letterSpacing: "0.12em",
        color: "#fff",
        textShadow: "2px 2px 0 #000",
        opacity: visible ? 1 : 0,
        imageRendering: "pixelated",
      }}
    >
      PRESS SPACE TO START
    </div>
  )
}
