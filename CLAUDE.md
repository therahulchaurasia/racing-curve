# Easing Race

A web app that visualizes easing curves by racing color-coded cars down a multi-lane road, with a synced curve graph above.

## Stack
- Next.js 16 App Router, React 19, TypeScript, Tailwind v4
- SVG for graph + bezier paths; pixel-art HTML/CSS for road, cars, UI
- Sprites: Kenney.nl CC0 pixel cars at `public/assets/cars/`, plants at `public/assets/environment/`
- Fonts: Silkscreen for UI text (pixel arcade vibe). VT323 + Pixelify_Sans wired but unused — see `src/app/layout.tsx`
- No canvas. One `requestAnimationFrame` clock drives all lanes

## Core model
- Every curve = 4 cubic-bezier control points `[p1x, p1y, p2x, p2y]`
- Solver in `src/lib/cubicBezier.ts` turns those into `f(t) -> p` (Newton + binary search fallback)
- Lane = `{ id, controlPoints, label, color }` — everything downstream reads from this
- See `src/components/CLAUDE.md` for the file map + pixel design system

## Routes
- `/` — main app (`BezierPlayground`)
- `/process` — design playground; iterate visuals here, port to real components once locked. Kept public so visitors can see the process + play with the star generator etc.

## Workflow rules (Rahul)
These are load-bearing — see `~/.claude/projects/.../memory/` for the full memory entries.

1. **Discuss before code.** Any UI tweak gets talked through in plain words first. Don't bundle changes. One thing at a time, confirm, then implement.
2. **Single source of truth.** Extract shared logic even when the duplication is small. A clip-path repeated across 3 files is 3 files too many. `PixelButton` is THE button; same shape language repeats via shared clip-path constants.
3. **No hacks, real measurements.** When positioning needs to track real layout (e.g., bezier knobs hugging editor edges), use `ResizeObserver` + measured pixels, not proportional CSS offsets that desync curve geometry from knob position.

## Aesthetic system (high level)
- **Pixel arcade**: `image-rendering: pixelated`, integer scales, `shape-rendering: crispEdges` on SVG grids/patterns
- **Shared corner language**: 2-step staircase clip-path corners on buttons, graph card, editor shell, popover frame. Knobs/dots use a smaller stepped octagon ("jigsaw puzzle piece") version of the same clip.
- **Color through-line**: lane color = car tint = graph dot hue (color tint on car not yet wired — sprites are currently per-lane random)
- **Background palette**: dirt yellow `#e8c547` world bg with scattered plant sprites; asphalt gray `#5e5e5e` for road and graph/editor interiors; black `#1a1a1a` for popover frame
- **Race curbs**: red `#d44` + white `#f5f5f5`, 18px chunks via `repeating-linear-gradient(90deg, ...)`; only top/bottom of lanes (no side curbs on lanes)
- See `src/components/CLAUDE.md` for exact tokens and clip-path constants

---

## Step 1 — Functionality (done unless noted)
- `cubicBezier(p1x,p1y,p2x,p2y)` -> `f(t)->p` solver ✓
- Single rAF clock driving all lanes ✓
- Lane model + position mapping ✓
- Same-duration race logic ✓
- SVG graph: plot each curve, synced dot per car ✓
- Add / remove lanes ✓
- Per-lane curve picker (popover with `BezierCurveEditor`) ✓
- Space-to-start (replaces PLAY button; RESET commented but handler kept — see `BezierPlayground.tsx` TODO)
- **Pending**: presets library, save custom curve as preset, pause, scrub bar

## Step 2 — Cosmetics (in progress)
- Flat car silhouettes via Kenney sprites ✓ (color tinting per-lane not wired)
- Side-view road, stacked lanes, curbs ✓
- Pixel background (dirt + plants) ✓
- Buttons (`PixelButton`) with stepped corners + click depress ✓
- Pixel-themed `CurveGraph` (asphalt bg, stepped corners, square dots, no sweep line) ✓
- Pixel-themed `BezierCurveEditor` (asphalt bg, stepped corners, jigsaw knobs, SVG-pattern grid) ✓
- Lane popover with black curb-style frame ✓
- **Pending**: finish line cosmetics, speed cues (wheel spin / motion blur / speed lines), graceful shrink at >4 lanes, slow-mo toggle, color through-line for sprites, layout/type polish
