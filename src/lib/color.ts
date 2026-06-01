export function darken(hex: string, amt: number): string {
  const h = hex.replace("#", "")
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  const f = (n: number) => Math.max(0, Math.min(255, Math.round(n * (1 - amt))))
  return `rgb(${f(r)}, ${f(g)}, ${f(b)})`
}
