// Shared pixel clip-paths — the app's corner language, in one place.
// STAIRCASE: 2-step 6px/3px corner used by every major shell (buttons, cards, popover, editor).
// JIGSAW:    smaller 4px/2px stepped octagon used by knobs, dots, and round-ish elements.
// Don't duplicate these polygon strings elsewhere — import from here.

export const STAIRCASE_CLIP = `polygon(
  0 6px, 3px 6px, 3px 3px, 6px 3px, 6px 0,
  calc(100% - 6px) 0, calc(100% - 6px) 3px, calc(100% - 3px) 3px, calc(100% - 3px) 6px, 100% 6px,
  100% calc(100% - 6px), calc(100% - 3px) calc(100% - 6px), calc(100% - 3px) calc(100% - 3px), calc(100% - 6px) calc(100% - 3px), calc(100% - 6px) 100%,
  6px 100%, 6px calc(100% - 3px), 3px calc(100% - 3px), 3px calc(100% - 6px), 0 calc(100% - 6px)
)`

// STAIRCASE eroded inward by `b` px on every edge. Layer over STAIRCASE_CLIP (SAME box size) and the
// uncovered `b`-px ring reads as a border that traces the steps — uniform thickness (every step edge
// is axis-aligned, so erosion is a flat ±b per coord). Same trick as notchInnerClip, full staircase.
export const staircaseInnerClip = (b: number) => `polygon(
  ${b}px ${6 + b}px, ${3 + b}px ${6 + b}px, ${3 + b}px ${3 + b}px, ${6 + b}px ${3 + b}px, ${6 + b}px ${b}px,
  calc(100% - ${6 + b}px) ${b}px, calc(100% - ${6 + b}px) ${3 + b}px, calc(100% - ${3 + b}px) ${3 + b}px, calc(100% - ${3 + b}px) ${6 + b}px, calc(100% - ${b}px) ${6 + b}px,
  calc(100% - ${b}px) calc(100% - ${6 + b}px), calc(100% - ${3 + b}px) calc(100% - ${6 + b}px), calc(100% - ${3 + b}px) calc(100% - ${3 + b}px), calc(100% - ${6 + b}px) calc(100% - ${3 + b}px), calc(100% - ${6 + b}px) calc(100% - ${b}px),
  ${6 + b}px calc(100% - ${b}px), ${6 + b}px calc(100% - ${3 + b}px), ${3 + b}px calc(100% - ${3 + b}px), ${3 + b}px calc(100% - ${6 + b}px), ${b}px calc(100% - ${6 + b}px)
)`

export const JIGSAW_CLIP = `polygon(
  4px 0, calc(100% - 4px) 0,
  calc(100% - 4px) 2px, calc(100% - 2px) 2px,
  calc(100% - 2px) 4px, 100% 4px,
  100% calc(100% - 4px), calc(100% - 2px) calc(100% - 4px),
  calc(100% - 2px) calc(100% - 2px), calc(100% - 4px) calc(100% - 2px),
  calc(100% - 4px) 100%, 4px 100%,
  4px calc(100% - 2px), 2px calc(100% - 2px),
  2px calc(100% - 4px), 0 calc(100% - 4px),
  0 4px, 2px 4px, 2px 2px, 4px 2px
)`

// NOTCH (logo wordmark frame): a 2-step staircase cut on the TOP-RIGHT corner only; the other
// three corners stay square. REACH = how far in from the corner the cut reaches; STEP = each step.
// Built from the same step language as STAIRCASE, but one corner and bigger.
const NOTCH_REACH = 20
const NOTCH_STEP = 10

export const NOTCH_CLIP = `polygon(
  0 0,
  calc(100% - ${NOTCH_REACH}px) 0,
  calc(100% - ${NOTCH_REACH}px) ${NOTCH_STEP}px,
  calc(100% - ${NOTCH_STEP}px) ${NOTCH_STEP}px,
  calc(100% - ${NOTCH_STEP}px) ${NOTCH_REACH}px,
  100% ${NOTCH_REACH}px,
  100% 100%,
  0 100%
)`

// The same silhouette eroded inward by `b` px on every edge. Layer this over NOTCH_CLIP (same box
// size) and the uncovered `b`-px ring between them reads as a border that traces the notch steps —
// uniform thickness because every notch edge is axis-aligned, so erosion is a flat ±b per coord.
export const notchInnerClip = (b: number) => `polygon(
  ${b}px ${b}px,
  calc(100% - ${NOTCH_REACH + b}px) ${b}px,
  calc(100% - ${NOTCH_REACH + b}px) ${NOTCH_STEP + b}px,
  calc(100% - ${NOTCH_STEP + b}px) ${NOTCH_STEP + b}px,
  calc(100% - ${NOTCH_STEP + b}px) ${NOTCH_REACH + b}px,
  calc(100% - ${b}px) ${NOTCH_REACH + b}px,
  calc(100% - ${b}px) calc(100% - ${b}px),
  ${b}px calc(100% - ${b}px)
)`

// Same octagon as JIGSAW_CLIP but in PERCENTAGES (the 4px/2px steps of the 14px knob expressed
// as 28.57%/14.29%). Stays round at any size — use this when the knob silhouette must scale up
// (e.g. start lights) instead of going blocky like the fixed-px version does at larger sizes.
export const BULB_CLIP = `polygon(
  28.57% 0, 71.43% 0,
  71.43% 14.29%, 85.71% 14.29%,
  85.71% 28.57%, 100% 28.57%,
  100% 71.43%, 85.71% 71.43%,
  85.71% 85.71%, 71.43% 85.71%,
  71.43% 100%, 28.57% 100%,
  28.57% 85.71%, 14.29% 85.71%,
  14.29% 71.43%, 0 71.43%,
  0 28.57%, 14.29% 28.57%, 14.29% 14.29%, 28.57% 14.29%
)`
