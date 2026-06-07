import { ProcessPreviews } from "@/components/ProcessPreviews"
import { PixelGround } from "@/components/PixelGround"

export default function ProcessPage() {
  return (
    <PixelGround>
      <main className="min-h-screen p-8 flex items-center justify-center">
        <ProcessPreviews />
      </main>
    </PixelGround>
  )
}
