# Components — file map + design system

This is the implementation map for `src/components/`. Root `CLAUDE.md` covers project intent and workflow; this file covers *where things live* and *the pixel design system*.

## Design tokens

```
Dirt yellow (world bg)      #e8c547   PixelGround
Asphalt gray (road, cards)  #5e5e5e   Lane interior, CurveGraph, BezierCurveEditor bg
Curb red                    #d44      Lane curbs (top/bottom); also a popover-frame option
Curb white                  #f5f5f5   Lane curbs (top/bottom)
Frame dark                  #2a2a2a   Inset 2px boxShadow on CurveGraph + BezierCurveEditor shells
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
Dirt-yellow world background. Outer `overflow-hidden` to prevent plant overflow + black-strip-at-bottom artifact. Contains randomly placed plant sprites (Plant1/2/3) and a subtle speck overlay. Children render on top.

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

Renders lanes + `+ LANE` button + `PressSpace` (when `!isPlaying`). PLAY + RESET buttons are commented out with a TODO note — handlers kept in case we bring them back. `CurveGraph` import exists but is commented out in render (graph not yet placed in main layout — pending design decision).

### `CurveGraph.tsx`
Pixel-themed graph card. `W = 600`, `H = 160`, asphalt `#5e5e5e` bg, staircase clip-path corners, inset 2px frame. SVG `viewBox="0 0 100 100"` with `preserveAspectRatio="none"` + `shapeRendering="crispEdges"`. Faint grid every 10%, brighter midlines at 50%. Curves drawn at `strokeWidth=3`. Dots are 12×12 HTML divs with the jigsaw octagon clip-path, color per lane. Silkscreen tick labels (`0`, `t=1`, `p=1`). **No sweep line** — the dots already track "now".

### `BezierCurveEditor.tsx`
Pixel-themed bezier editor. Square aspect ratio.

Architecture (matters for math):
- **Outer wrapper** (`aspect-ratio: 1`, `position: relative`): owns `onPointerMove`; reserves the layout slot.
- **Shell** (`position: absolute; inset: 0`): asphalt bg, staircase clip-path corners, inset 2px frame. Contains the SVG grid pattern.
- **innerRef div** (`position: absolute; inset: PAD`, `PAD = KNOB/2 = 7`): the bezier play-area. SVG curve + guides fill this. Measured via `ResizeObserver` to get `innerSize` in real pixels.
- **Knobs** (HTML divs): siblings of shell at outer level, positioned in pixels via `left: bezier * innerSize`, `top: bezier * innerSize`. Bbox fits exactly inside the shell at extreme bezier values (0 and 1). They're outside the shell's clip-path so they don't get clipped at the corners.

Why HTML knobs instead of SVG `<rect>`: SVG rects in `viewBox 0..100` don't render the stepped clip-path crisply at small sizes, and dragging to the edge with `viewBox` math was a hack. Real measurements via `getBoundingClientRect()` on `innerRef` give exact bezier values.

Grid: SVG `<pattern>` with `patternUnits="userSpaceOnUse"`, 20×20 viewBox units, `vectorEffect="non-scaling-stroke"`, `shapeRendering="crispEdges"`. Pattern handles sub-pixel distribution uniformly across cells — fixes the "one cell wider than others" rounding bug we hit when using HTML divs with pixel math.

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

### `StylePreviews.tsx`
Contents of `/styles` route. Sections (in render order): Buttons, Start prompt, Curve graph, Bezier curve editor, Lane popover curb frame, Cars, Pixel (legacy CSS-block car). This is the playground for iterating visuals before porting them to the real components. Most internals are local helpers (`PromptCell`, `CurbFrameCell`, `CarCell`, `PixelLane`).

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
