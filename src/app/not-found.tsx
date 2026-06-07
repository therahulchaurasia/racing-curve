"use client"

// Custom 404 — a Windows XP/7-era Blue Screen of Death. Classic DOS-blue wall of monospace text,
// racing-themed STOP error. Exits two ways: SPACE (mirrors the app's space-to-start race mechanic)
// or the visible link below (a11y / for anyone who doesn't read the prompt).

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

// blinking DOS caret — reused on whichever line is currently the last printed
function Caret() {
  return (
    <span
      className="ml-1 inline-block"
      style={{ animation: "bsod-blink 1s step-end infinite" }}
    >
      _
    </span>
  )
}

// Classic NT blue-screen background. The iconic "heavy blue" — same index XP/7 rendered in text mode.
const BSOD_BLUE = "#0000aa"

export default function NotFound() {
  const router = useRouter()

  // staged reveal: caret sits on "Collecting telemetry ..." for ~5.5s, then the dump-complete line
  // prints, then ~1s later the contact line. `stage` = how many of the closing lines are visible.
  const [stage, setStage] = useState(0)
  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 5500)
    const t2 = setTimeout(() => setStage(2), 6500)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  // SPACE → back to the track (the home race). Matches space-to-start; feels native to the app.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.key === " ") {
        e.preventDefault()
        router.push("/")
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [router])

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-auto"
      style={{
        background: BSOD_BLUE,
        color: "#ffffff",
        fontFamily: "var(--font-geist-mono), 'Lucida Console', monospace",
      }}
    >
      <div className="w-full max-w-3xl px-6 py-16 leading-relaxed text-[15px]">
        {/* the famous opening line, racing-ified */}
        <p>
          A problem has been detected and this page has been halted to prevent
          damage to your sense of direction.
        </p>

        <p className="mt-6">PAGE_NOT_FOUND_ON_TRACK</p>

        <p className="mt-6">
          If this is the first time you&apos;ve seen this screen, you took a
          wrong turn at the last corner. Check that the URL is spelled correctly
          and that the lane you&apos;re looking for hasn&apos;t spun off the
          course.
        </p>

        <p className="mt-6">Technical information:</p>

        <p className="mt-2 break-all">
          *** STOP: 0x00000194 (0xDEAD0404, 0xBADC0DE, 0x0FF7RACK, 0xCURVE)
        </p>

        <p className="mt-2">*** easing.sys - Address 0x0404 base at 0x0000, lap 1</p>

        {/* closing beat — mirrors the XP "dumping memory / dump complete / contact admin" trio,
            revealed in stages. Caret rides whichever line is currently the last one printed. */}
        <p className="mt-6">
          Collecting telemetry from spun-out lane ...
          {stage === 0 && <Caret />}
        </p>
        {stage >= 1 && (
          <p className="mt-2">
            Telemetry dump complete.
            {stage === 1 && <Caret />}
          </p>
        )}
        {stage >= 2 && (
          <p className="mt-2">
            Contact your race engineer or pit crew for further assistance.
            <Caret />
          </p>
        )}

        {/* both exits: SPACE prompt (primary, app-native) + a plain link fallback */}
        <p className="mt-10">
          Press{" "}
          <span style={{ background: "#fff", color: BSOD_BLUE }} className="px-1">
            SPACE
          </span>{" "}
          to return to the track.
        </p>

        <p className="mt-2 underline">
          <Link href="/">or click here to go back to the start line</Link>
        </p>
      </div>
    </div>
  )
}
