# Components — file map + design system

This is the implementation map for `src/components/`. Root `CLAUDE.md` covers project intent and workflow; this file covers *where things live* and *the pixel design system*.

## Design tokens

```
Dirt yellow (world bg)      #e8c547   PixelGround — LEGACY day token (world is night now)
Asphalt night (road)        #3a3942   Lane interior (night skin)
Board bg (graph + editor)   #3a3942   graphTheme.BOARD_BG — CurveGraph + BezierCurveEditor surface
Curb red                    #9e3b3b   Lane curbs (night); day was #d44
Curb white                  #cdc9d6   Lane curbs (night) + CurveGraph tick labels; day was #f5f5f5
Board frame                 #26252b   graphTheme.BOARD_FRAME — inset 2px frame on graph + editor
Panel billboard             #1c1c1c   Panel.tsx — near-black board behind start lights + curve graph
Frame near-black            #1a1a1a   Popover wrapper around editor
Text on light buttons       #1a1a1a
Grid line (faint)           rgba(255,255,255,0.06)
Grid midline                rgba(255,255,255,0.12)
Guide line (dashed)         rgba(255,255,255,0.35)
```

## Shape language

All four major shells (button, graph card, editor shell, popover) use the SAME 2-step staircase corner clip-path with 6px outer / 3px inner step. **This is the visual signature of the app — don't change it lightly, and don't duplicate the polygon string when adding new shells (extract).**

```
polygon(
  0 6px, 3px 6px, 3px 3px, 6px 3px, 6px 0,
  calc(100% - 6px) 0, calc(100% - 6px) 3px, calc(100% - 3px) 3px, calc(100% - 3px) 6px, 100% 6px,
  100% calc(100% - 6px), calc(100% - 3px) calc(100% - 6px), calc(100% - 3px) calc(100% - 3px), calc(100% - 6px) calc(100% - 3px), calc(100% - 6px) 100%,
  6px 100%, 6px calc(100% - 3px), 3px calc(100% - 3px), 3px calc(100% - 6px), 0 calc(100% - 6px)
)
```

Knobs and graph dots use a smaller stepped octagon ("jigsaw puzzle piece") — 4px outer / 2px inner step. Same language, scaled down.

## Single-source-of-truth choices

- **`PixelButton`** is THE button. Used by `BezierPlayground` for `+ LANE` and by `Lane` for the vertical DELETE strip. No other button styles.
- **DELETE is rotated, not vertical-text.** `Lane.tsx` wraps a normal horizontal `PixelButton` in a 30×LANE_HEIGHT slot and rotates it 90° via `transform: rotate(90deg) translateY(-100%)` with `transformOrigin: '0 0'`. This preserves the button's gradient + clip-path orientation. Don't use `writing-mode` — it only rotates text, not background gradient or clip-path.
- **Popover positioning** must be a sibling of the lane chassis (which is `overflow-hidden`), not a child, or it gets clipped.
- **Knobs in the bezier editor** are HTML divs absolutely positioned over the SVG (not SVG `<rect>` elements). Pointer move is captured on a wrapping `<div>` so events still flow when the knob is at the edge. Positions use measured `innerSize` from `ResizeObserver`, not CSS percentages.

## Files

### `PixelButton.tsx`
THE button. Single source. Props: `face`, `hi`, `sh` (gradient colors), `textColor`, `fontSize`, plus normal button HTML attrs. Defaults to green. Renders with 2-step staircase clip-path, 3-band uneven gradient (`hi 0-25%`, `face 25-85%`, `sh 85-100%`), 2px inset border, `active:translate-y-[2px]` click depress. Silkscreen font. Horizontal only — vertical use is a rotation responsibility of the caller (see `Lane`).

### `PressSpace.tsx`
"PRESS SPACE TO START" text, fixed bottom-center of viewport, white silkscreen with 2px black text shadow. Blinks 800ms on / 800ms off via `setInterval`. Pointer-events disabled. Used by `BezierPlayground` instead of a PLAY button — appears when not racing, disappears during race.

### `PixelGround.tsx`
Dirt-yellow world background + a subtle speck overlay (radial-gradient dots). Outer `overflow-hidden`; children render on top. Foliage is NOT here — it lives in two zones in `BezierPlayground` (see below) so it can be bounded to the dirt above/below the road and never lands on the curbs.

### `foliage.tsx`
Single source of truth for the plant scatter — shared by the `/process` tuning lab and the page background. Hook-free/presentational. Exports: `PLANTS` (3 sprite paths), `ClumpPart`, `CLUMPS` (the curated combos), `FOLIAGE` (= `CLUMPS`; the placeable set — bare single sprites were dropped), `Clump` (renders a clump's parts bottom-baselined), `mulberry32` (seeded PRNG), and `scatterFoliage({cols,rows,fill,jitter,seed})` → seeded jittered-grid items in % coords (front-sorted by y). Don't duplicate this data/logic elsewhere — import from here.

### `FoliageLayer.tsx`
Static seeded foliage scatter, used as a background layer inside a `relative` parent. Measures its own box ONCE on mount (`useLayoutEffect`) and derives `cols/rows` from a target `cellSize`, so density adapts to the parent's size. Positions are `%`, so a later resize only scales them — no re-measure, no relayout/pop. Seed is random per mount by default (fresh layout each page load, stable within a session); pass a `seed` prop to pin it (e.g. the `/process` lab). `absolute inset-0 z-0 pointer-events-none`; transparent (sits over PixelGround's dirt+specks). `BezierPlayground` renders **two** of these — a top zone (behind lights+graph) and a bottom zone (behind controls), each `flex-1` and flanking the road, with different seeds — so foliage fills the dirt above/below but the road stays clear (no center-mask needed). Defaults match the `/process` look (fill 75%, jitter 0.6).

### `Lane.tsx`
One lane row = chassis (curbs + asphalt + checkers + car sprite + curve badge) + 30px vertical DELETE button + hoisted popover (when open).

Key constants:
```
LANE_HEIGHT = 140        CURB_HEIGHT = 14
CAR_WIDTH = 99           CAR_HEIGHT = 42         (bounding box for sprite contain-fit)
PAD = 20                 BADGE_SIZE = 24         CAR_START = PAD + BADGE_SIZE + PAD = 64
CHECKER_WIDTH = 28       CHECKER_TILE = 14
START_OFFSET = 180       FINISH_OFFSET = 80
DELETE_BTN_WIDTH = 30
```

- Chassis width = `calc(100% - 30px - 2px)` when a delete button is present (2px is the visible dirt gap between chassis and delete button).
- Car sprite picked deterministically per lane via string-hash on `lane.id`.
- Checker strips rendered as inline SVG `<pattern>` with `useId()` for unique IDs and `shapeRendering="crispEdges"` to avoid the diagonal slash artifact that linear-gradient checkers had.
- Popover wrapper is black `#1a1a1a` with 14px padding, staircase clip-path corners — wraps `BezierCurveEditor` directly (no extra dark card).
- Hover-intent close uses a 150ms `setTimeout` so traversing the gap from badge → popover doesn't close it.

### `BezierPlayground.tsx`
Top-level race orchestrator. Owns `lanes`, `progress`, `currentT`, `play` state. Single rAF loop in a `useEffect`. Listens for `Space` key globally (ignored when focus is in input/textarea) — calls `onPlay` if not currently racing; `onPlay` resets progress automatically, so it doubles as restart.

Renders lanes + `+ LANE` button + `PressSpace` (when `!isPlaying`) + the settings cog (top-right). PLAY + RESET buttons are commented out with a TODO note — handlers kept in case we bring them back. `CurveGraph` (wrapped in `Panel`) is placed bottom-right of the sky zone, base on the horizon line, gated by the `showGraph` setting. Takes `initialSettings` (read server-side from the cookie) and seeds the `showGraph` + `lightsStyle` state from it; an effect writes the cookie on change.

`Space` behavior depends on `lightsStyle`: `sequence` runs `lights.start()` (5-col countdown, green launches); `simple` runs `lights.startSimple()` (all greens + launch the same instant). `Escape` opens settings (radix closes); `Space` is ignored while settings are open.

### Settings (`SettingsCog.tsx`, `SettingsDialog.tsx`, `lib/settings.ts`)
- **`lib/settings.ts`** — single source for the `Settings` model (`showGraph`, `showLights`, `lightsStyle: "sequence" | "simple"`), `DEFAULT_SETTINGS`, the cookie name, and `parseSettings` / `writeSettingsCookie`. Persisted as a **cookie** (not localStorage) so the server component `app/page.tsx` reads it (`await cookies()`) and passes `initialSettings` down — first paint already reflects prefs, no graph flash. `parseSettings` falls back to defaults per-field (partial/bad cookie is safe). Also holds the separate **intro** cookie (`INTRO_COOKIE`, `parseIntroSeen`, `writeIntroSeenCookie`) for the first-visit about modal.
- Settings rows: `CURVE GRAPH` (show/hide → gates the graph), `START LIGHTS` (show/hide → gates the gantry; turning it off also forces `lightsStyle` to `simple` and **disables** the `LIGHT STYLE` row), `LIGHT STYLE` (sequence/simple).
- **`Modal.tsx`** — the shared DOOM-style dialog shell (single source). Radix `Dialog` (focus trap, ESC/backdrop close, ARIA — we only skin it): `RacingCurvesLogo` header above the panel (asphalt fill, white text), near-black overlay with a soft circular white vignette, top-anchored (`top: 7vh`, grows downward), two-layer light staircase border, centered `title`, single centered crimson `CLOSE` (no X). Both `SettingsDialog` and `AboutDialog` are thin wrappers over this — don't re-inline the skin.
- **`IconButton.tsx`** — the shared top-right chip (faint fill + thick light border, hover-brighten). Both `SettingsCog` and `HelpButton` wrap their glyph in it so the pair matches.
- **`SettingsCog.tsx`** — pixel gear graphic (two crossed pluses, masked centre hole) in an `IconButton`. Click opens settings (ESC only closes, via radix).
- **`HelpButton.tsx`** — the `?` glyph in an `IconButton`, next to the cog. Opens `AboutDialog`.
- **`SettingsDialog.tsx`** — `Modal` titled `SETTINGS` holding the rows. Exports the shared **`SettingRow`** (label + control) and **`SettingSegmented`** (N-option segmented toggle, active = violet/bright, rest dim, `disabled` prop) — use these for every settings row.
- **`AboutDialog.tsx`** — `Modal` titled `WHAT IS THIS?` with a readable **monospace** body (the ideology blurb — Silkscreen is unreadable in paragraphs). Auto-opens once on first visit (`!introSeen` from the cookie, read server-side); closing sets the cookie; the `?` button reopens it. Copy is currently DUMMY (TODO: final wording).

### `CurveGraph.tsx`
Night-skinned graph board. `W = 260`, `H = 150`. Board bg/frame/grid come from the shared `graphTheme.ts` (`BOARD_BG`/`BOARD_FRAME`/`BOARD_GRID` — same surface as `BezierCurveEditor`); tick labels are graph-only. **No staircase clip of its own** — it's a plain rectangle; the enclosing `Panel` supplies the stepped corners + billboard frame. SVG `viewBox="0 0 100 100"` with `preserveAspectRatio="none"` + `shapeRendering="crispEdges"`. Faint white grid every 10%, brighter midlines at 50%. Curves drawn at `strokeWidth=3`. Dots are 12×12 HTML divs with the jigsaw octagon clip-path, color per lane. Muted-light silkscreen labels (`#cdc9d6`): `0` at the curve start (bottom-left) and `100` at the curve end (top-right); `time` on the x-axis end, `progress` on the y-axis top. **No sweep line** — the dots already track "now". Always render it inside a `Panel`.

### `Panel.tsx`
Single source for the near-black "billboard" frame: dark board (`#1c1c1c`) with the app's staircase corners + a faint top-lit bevel. Used by `RaceLights` (start-light panel) and to enclose `CurveGraph`. `padding` prop (default 14). Anything that should read as "mounted hardware" wraps in this — don't re-inline the bg/bevel/clip.

### `BezierCurveEditor.tsx`
Pixel-themed bezier editor. Square aspect ratio. Same night board surface as `CurveGraph` — bg/frame/grid come from the shared `graphTheme.ts` tokens (don't redefine them here). The selected preset row in `CurvePresets` also reuses `BOARD_BG`.

Architecture (matters for math):
- **Outer wrapper** (`aspect-ratio: 1`, `position: relative`): owns `onPointerMove`; reserves the layout slot.
- **Shell** (`position: absolute; inset: 0`): asphalt bg, staircase clip-path corners, inset 2px frame. Contains the SVG grid pattern.
- **innerRef div** (`position: absolute; inset: PAD`, `PAD = KNOB/2 = 7`): the bezier play-area. SVG curve + guides fill this. Measured via `ResizeObserver` to get `innerSize` in real pixels.
- **Knobs** (HTML divs): siblings of shell at outer level, positioned in pixels via `left: bezier * innerSize`, `top: bezier * innerSize`. Bbox fits exactly inside the shell at extreme bezier values (0 and 1). They're outside the shell's clip-path so they don't get clipped at the corners.

Why HTML knobs instead of SVG `<rect>`: SVG rects in `viewBox 0..100` don't render the stepped clip-path crisply at small sizes, and dragging to the edge with `viewBox` math was a hack. Real measurements via `getBoundingClientRect()` on `innerRef` give exact bezier values.

Grid: the shared `BoardGrid` (same "radar" grid as `CurveGraph`) — faint lines every 10% + brighter midlines at the 50% crosshair, `vectorEffect="non-scaling-stroke"`, drawn in a bg `<svg>` behind the play-area. (Was an even 20×20 `<pattern>`; swapped for `BoardGrid` so the editor matches the graph's command-center feel.)

Curve path: simple `M 0 100 C h1x h1y h2x h2y 100 0`, `strokeWidth=3`, `strokeLinecap="round"`. No tangent extensions (we tried — looked like a stub).

Knob clip-path (jigsaw):
```
4px 0, calc(100% - 4px) 0,
calc(100% - 4px) 2px, calc(100% - 2px) 2px,
calc(100% - 2px) 4px, 100% 4px,
... (mirrored on all 4 corners)
```

### `CurveBadge.tsx`
Small per-lane circular badge that previews the lane's curve. Shown at the left edge of each lane chassis; hovering opens the bezier editor popover.

### `ProcessPreviews.tsx`
Contents of the `/process` route (formerly `/styles`). Sections (in render order): Buttons, Start prompt, Curve graph, Bezier curve editor, Lane popover curb frame, Cars, Pixel (legacy CSS-block car). This is the playground for iterating visuals before porting them to the real components. Most internals are local helpers (`PromptCell`, `CurbFrameCell`, `CarCell`, `PixelLane`).

The lane-popover curb frame preview was used to compare red vs white vs black; black won for the actual implementation. The curb-frame helper here is a *preview-only* helper — the real popover styling lives inline in `Lane.tsx`. If we ever add more shells with the same frame, extract once and reuse.

## Useful libraries this codebase relies on

- `src/lib/cubicBezier.ts` — solver: bezier control points → `f(t) -> p`
- `src/lib/bezierPath.ts` — `bezierPathD(controlPoints)` returns the SVG `d` attr; `bezierHandles(controlPoints)` returns `{ h1x, h1y, h2x, h2y }` in 0..100 viewBox space
- `src/lib/color.ts` — `darken(hex, frac)`; used by legacy CSS-block car only
- `src/lib/types.ts` — `Lane` type

## Things to NOT do

- Don't add a second button shape. Recolor `PixelButton`.
- Don't reintroduce the sweep line on the graph. Dots track "now".
- Don't bring back the curve tangent extension. End at inner edge with rounded cap.
- Don't use `writing-mode` for vertical text on buttons. Rotate the whole element.
- Don't position knobs with CSS percentage offsets — desyncs curve from knob. Use measured pixels.
- Don't position the popover inside the lane's `overflow-hidden` chassis. Sibling.
