import { BOARD_GRID, BOARD_MID } from "./graphTheme"

// The "radar / command-center" grid shared by the CurveGraph and the BezierCurveEditor: faint lines
// every 10% plus brighter midlines at the 50% crosshair (both axes). Renders raw SVG elements —
// drop it inside an <svg viewBox="0 0 100 100" preserveAspectRatio="none">.
export function BoardGrid() {
  return (
    <>
      {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((v) => (
        <g key={v}>
          <line x1={v} y1={0} x2={v} y2={100} stroke={BOARD_GRID} strokeWidth={0.3} vectorEffect="non-scaling-stroke" />
          <line x1={0} y1={v} x2={100} y2={v} stroke={BOARD_GRID} strokeWidth={0.3} vectorEffect="non-scaling-stroke" />
        </g>
      ))}
      <line x1={50} y1={0} x2={50} y2={100} stroke={BOARD_MID} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
      <line x1={0} y1={50} x2={100} y2={50} stroke={BOARD_MID} strokeWidth={0.6} vectorEffect="non-scaling-stroke" />
    </>
  )
}
