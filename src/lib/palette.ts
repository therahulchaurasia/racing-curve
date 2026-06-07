// Shared "exit / destructive" button color (crimson) — DELETE + CLOSE. Spread into PixelButton.
// Single source so the red stays identical everywhere it means "remove / get out".
// points at the shared CSS tokens (globals.css @theme); these feed PixelButton's inline gradient,
// where var() resolves
export const BUTTON_RED = {
  face: "var(--color-crimson)",
  hi: "var(--color-crimson-hi)",
  sh: "var(--color-crimson-sh)",
  textColor: "#ffffff",
}

// Shared lane/curve hue palette — the color through-line for cars, graph dots,
// and preset thumbnails. Single source of truth.
export const LANE_PALETTE = [
  "#22d3ee",
  "#f472b6",
  "#a3e635",
  "#fbbf24",
  "#a78bfa",
  "#fb923c",
]
