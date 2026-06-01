"use client"

import { useEffect, useState } from "react"

const DIRT = "#e8c547"
const PLANT_MIN = 40
const PLANT_MAX = 96
const PLANT_COUNT = 22

const PLANT_SPRITES = [
  "/assets/environment/Plant1.png",
  "/assets/environment/Plant2.png",
  "/assets/environment/Plant3.png",
]

type BushSpec = { left: number; top: number; size: number; sprite: string }

function generateBushes(): BushSpec[] {
  return Array.from({ length: PLANT_COUNT }, () => ({
    left: Math.random() * 96,
    top: Math.random() * 96,
    size: PLANT_MIN + Math.random() * (PLANT_MAX - PLANT_MIN),
    sprite: PLANT_SPRITES[Math.floor(Math.random() * PLANT_SPRITES.length)],
  }))
}

export function PixelGround({ children }: { children: React.ReactNode }) {
  const [bushes, setBushes] = useState<BushSpec[]>([])

  useEffect(() => {
    setBushes(generateBushes())
  }, [])

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        backgroundColor: DIRT,
        backgroundImage: `
          radial-gradient(circle at 12% 18%, #fff8d0 1.5px, transparent 2px),
          radial-gradient(circle at 78% 32%, #fff8d0 1.5px, transparent 2px),
          radial-gradient(circle at 45% 64%, #fff8d0 1.5px, transparent 2px),
          radial-gradient(circle at 88% 82%, #fff8d0 1.5px, transparent 2px),
          radial-gradient(circle at 22% 88%, #fff8d0 1.5px, transparent 2px),
          radial-gradient(circle at 60% 12%, #d4a82a 1.5px, transparent 2px),
          radial-gradient(circle at 30% 48%, #d4a82a 1.5px, transparent 2px),
          radial-gradient(circle at 70% 70%, #d4a82a 1.5px, transparent 2px)
        `,
        backgroundSize: "120px 120px, 140px 140px, 100px 100px, 160px 160px, 110px 110px, 130px 130px, 150px 150px, 120px 120px",
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        {bushes.map((b, i) => (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            key={i}
            src={b.sprite}
            alt=""
            className="absolute"
            style={{
              left: `${b.left}%`,
              top: `${b.top}%`,
              height: b.size,
              width: "auto",
              imageRendering: "pixelated",
            }}
          />
        ))}
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}
