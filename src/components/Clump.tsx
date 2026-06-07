// Renders a foliage "clump" — its parts stacked on a shared bottom baseline (back→front by array
// order), each part a pixel-art sprite. Presentational; data + scatter logic live in @/lib/foliage.

import { PLANTS, type ClumpPart } from "@/lib/foliage"

export function Clump({ parts }: { parts: ClumpPart[] }) {
  const W = Math.max(...parts.map((p) => p.dx + p.size))
  const H = Math.max(...parts.map((p) => p.size))
  return (
    <div style={{ position: "relative", width: W, height: H }}>
      {parts.map((p, k) => (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          key={k}
          src={PLANTS[p.i]}
          alt=""
          style={{
            position: "absolute",
            left: p.dx,
            bottom: 0,
            width: p.size,
            height: p.size,
            imageRendering: "pixelated",
            transform: p.flip ? "scaleX(-1)" : undefined,
          }}
        />
      ))}
    </div>
  )
}
