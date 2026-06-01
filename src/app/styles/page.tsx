import { StylePreviews } from "@/components/StylePreviews"
import { PixelGround } from "@/components/PixelGround"

export default function StylesPage() {
  return (
    <PixelGround>
      <main className="min-h-screen p-8 flex items-center justify-center">
        <StylePreviews />
      </main>
    </PixelGround>
  )
}
