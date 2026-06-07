// Display formatting helpers.

// Trim a number to ≤2 decimals for display: 0.42 → "0.42", 1 → "1", 0 → "0".
export const fmt = (n: number) => Number(n.toFixed(2)).toString()
