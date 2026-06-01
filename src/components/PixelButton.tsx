"use client"

import type { ButtonHTMLAttributes } from "react"

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  face?: string
  hi?: string
  sh?: string
  textColor?: string
  fontSize?: number
}

export function PixelButton({
  face = "#3bb43b",
  hi = "#7fe26b",
  sh = "#1e7a1e",
  textColor = "#fff",
  fontSize = 18,
  className = "",
  style,
  children,
  ...rest
}: Props) {
  const clip = `polygon(
    0 6px, 3px 6px, 3px 3px, 6px 3px, 6px 0,
    calc(100% - 6px) 0, calc(100% - 6px) 3px, calc(100% - 3px) 3px, calc(100% - 3px) 6px, 100% 6px,
    100% calc(100% - 6px), calc(100% - 3px) calc(100% - 6px), calc(100% - 3px) calc(100% - 3px), calc(100% - 6px) calc(100% - 3px), calc(100% - 6px) 100%,
    6px 100%, 6px calc(100% - 3px), 3px calc(100% - 3px), 3px calc(100% - 6px), 0 calc(100% - 6px)
  )`
  return (
    <button
      {...rest}
      className={`relative select-none active:translate-y-[2px] disabled:opacity-50 disabled:active:translate-y-0 px-5 py-2 ${className}`}
      style={{
        fontFamily: "var(--font-silkscreen)",
        fontSize,
        letterSpacing: "0.08em",
        color: textColor,
        background: `linear-gradient(180deg, ${hi} 0% 25%, ${face} 25% 85%, ${sh} 85% 100%)`,
        boxShadow: `inset 0 0 0 2px ${sh}`,
        clipPath: clip,
        textShadow: `1px 1px 0 ${sh}`,
        imageRendering: "pixelated",
        ...style,
      }}
    >
      {children}
    </button>
  )
}
