import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Geist_Mono, VT323, Silkscreen } from "next/font/google"
import { PixelGround } from "@/components/PixelGround"
import { MobileGate } from "@/components/MobileGate"
import { SITE } from "@/lib/site"
import "./globals.css"

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

const vt323 = VT323({
  variable: "--font-vt323",
  subsets: ["latin"],
  weight: "400",
})

const silkscreen = Silkscreen({
  variable: "--font-silkscreen",
  subsets: ["latin"],
  weight: ["400", "700"],
})

export const metadata: Metadata = {
  title: SITE.title,
  description: SITE.description,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      className={`${geistMono.variable} ${vt323.variable} ${silkscreen.variable} h-full antialiased`}
    >
      {/* inline night bg in the SSR'd HTML → first paint is dark even before the CSS chunk loads
          (kills the dirt-yellow reload flash; CSS in globals.css is the backup) */}
      <body
        className="min-h-full flex flex-col"
        style={{ background: "#0e0c30" }}
      >
        {/* PixelGround = night-dirt world ground; wraps every route so each page doesn't repeat it.
            The 404 (BSOD) is a fixed opaque overlay, so it simply covers this — unaffected. */}
        <PixelGround>{children}</PixelGround>
        {/* hard-covers small screens (md:hidden) — the race layout breaks below tablet width */}
        <MobileGate />
        <Analytics />
      </body>
    </html>
  )
}
