"use client"

import type { ButtonHTMLAttributes } from "react"

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  face?: string
  hi?: string
  sh?: string
  textColor?: string
  fontSize?: number
  glow?: boolean // soft halo (drop-shadow follows the clip silhouette; box-shadow would be clipped)
}

export function PixelButton({
  // night-theme violet primary (shared tokens, globals.css @theme) — vibrant + glow so it pops against
  // the purple night, in-theme with the sky/mountains. Used in the inline gradient where var() resolves.
  face = "var(--color-violet)",
  hi = "var(--color-violet-hi)",
  sh = "var(--color-violet-sh)",
  textColor = "#ffffff",
  fontSize = 18,
  glow = false,
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
        filter: glow ? `drop-shadow(0 0 6px ${hi})` : undefined,
        ...style,
      }}
    >
      {children}
    </button>
  )
}
