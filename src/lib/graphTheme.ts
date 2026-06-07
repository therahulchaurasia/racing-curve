// Shared night-skin tokens for the asphalt "board" surfaces — the CurveGraph and the
// BezierCurveEditor are the same surface type (dark asphalt board with a faint white grid), so they
// pull their bg/frame/grid from here. Single source: change the board look in one place.
// bg/frame point at the shared CSS tokens (globals.css @theme) so the color lives in one place; these
// are used in CSS contexts (inline background / box-shadow) where var() resolves.
export const BOARD_BG = "var(--color-asphalt)" // night asphalt (matches the road)
export const BOARD_FRAME = "var(--color-board-frame)" // inset 2px frame rim
// grid/mid stay literal rgba — they're applied as SVG `stroke` ATTRIBUTES (BoardGrid), where var()
// doesn't resolve, and they're already single-source here.
export const BOARD_GRID = "rgba(255,255,255,0.06)" // faint grid lines
export const BOARD_MID = "rgba(255,255,255,0.12)" // brighter midlines (50%)
