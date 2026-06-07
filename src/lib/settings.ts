// User preferences, persisted in a cookie so they survive reloads/sessions. A cookie (not
// localStorage) is used so the server component (`app/page.tsx`) can read it and seed the initial
// render — no hydration flash (e.g. the curve graph never flickers on/off at load).

export type LightsStyle = "sequence" | "simple"

export type Settings = {
  showGraph: boolean
  showLights: boolean
  lightsStyle: LightsStyle
}

export const DEFAULT_SETTINGS: Settings = {
  showGraph: true,
  showLights: true,
  lightsStyle: "sequence",
}

export const SETTINGS_COOKIE = "racing-curve-settings"

// Parse a cookie value into Settings, falling back to the default PER FIELD so a malformed or
// partial cookie never throws or wipes the other field.
export function parseSettings(raw?: string): Settings {
  if (!raw) return { ...DEFAULT_SETTINGS }
  try {
    // value is written url-encoded; decoding plain JSON (no %) is a no-op, so this is safe either way
    const parsed = JSON.parse(decodeURIComponent(raw)) as Partial<Settings>
    return {
      showGraph:
        typeof parsed.showGraph === "boolean" ? parsed.showGraph : DEFAULT_SETTINGS.showGraph,
      showLights:
        typeof parsed.showLights === "boolean" ? parsed.showLights : DEFAULT_SETTINGS.showLights,
      lightsStyle:
        parsed.lightsStyle === "sequence" || parsed.lightsStyle === "simple"
          ? parsed.lightsStyle
          : DEFAULT_SETTINGS.lightsStyle,
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function serializeSettings(s: Settings): string {
  return JSON.stringify(s)
}

// Client-only: write the cookie (1-year expiry, site-wide, lax).
export function writeSettingsCookie(s: Settings): void {
  if (typeof document === "undefined") return
  const value = encodeURIComponent(serializeSettings(s))
  document.cookie = `${SETTINGS_COOKIE}=${value}; path=/; max-age=31536000; SameSite=Lax`
}
