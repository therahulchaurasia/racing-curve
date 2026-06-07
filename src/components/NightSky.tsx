"use client"

// Night sky backdrop: a single smooth vertical gradient — deep indigo at the top easing down to a
// lighter purple toward the horizon. (The reference's horizontal lines were only there to mask the
// seams between its 3 flat color bands; with a real gradient we don't need them.) Sits behind the
// mountains (absolute inset-0); stars go on top later. Gradient is a prop so the palette tunes.

export const NIGHT_SKY_GRADIENT =
  "linear-gradient(180deg, #0e0c30 0%, #181445 28%, #28215f 55%, #3f3680 78%, #564a95 100%)"

export function NightSky({ gradient = NIGHT_SKY_GRADIENT }: { gradient?: string }) {
  return <div style={{ position: "absolute", inset: 0, background: gradient }} />
}
