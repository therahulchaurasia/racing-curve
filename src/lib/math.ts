// Small shared math helpers. Single source — don't redeclare these locally.

// Clamp a number into the [0, 1] range.
export const clamp01 = (n: number) => Math.max(0, Math.min(1, n))
