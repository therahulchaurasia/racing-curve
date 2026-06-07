// Night-dirt world ground. The original day dirt (#e8c547) toned way down into a dark, desaturated
// ochre so it reads as dirt under the night sky — keeping the warm-ground / cool-sky through-line.
// Speck texture (moonlit highlights + darker pits) stops it being a flat slab. The sky gradient
// lives in BezierPlayground's top zone; this shows below the horizon (around + under the road).
// overflow-x-hidden clips the 100vw full-bleed while leaving vertical scroll free.
const DIRT = "#33301d"
const SPECK_HI = "#45412a"
const SPECK_LO = "#241f10"

export function PixelGround({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="relative min-h-screen w-full overflow-x-hidden"
      style={{
        backgroundColor: DIRT,
        backgroundImage: `
          radial-gradient(circle at 12% 18%, ${SPECK_HI} 1.5px, transparent 2px),
          radial-gradient(circle at 78% 32%, ${SPECK_HI} 1.5px, transparent 2px),
          radial-gradient(circle at 45% 64%, ${SPECK_HI} 1.5px, transparent 2px),
          radial-gradient(circle at 88% 82%, ${SPECK_HI} 1.5px, transparent 2px),
          radial-gradient(circle at 22% 88%, ${SPECK_HI} 1.5px, transparent 2px),
          radial-gradient(circle at 60% 12%, ${SPECK_LO} 1.5px, transparent 2px),
          radial-gradient(circle at 30% 48%, ${SPECK_LO} 1.5px, transparent 2px),
          radial-gradient(circle at 70% 70%, ${SPECK_LO} 1.5px, transparent 2px),
          linear-gradient(180deg, #3a3622 0%, #2b2816 100%)
        `,
        backgroundSize: "120px 120px, 140px 140px, 100px 100px, 160px 160px, 110px 110px, 130px 130px, 150px 150px, 120px 120px, 100% 100%",
      }}
    >
      {children}
    </div>
  )
}
