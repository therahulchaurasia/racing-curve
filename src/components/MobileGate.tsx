// Mobile gate — the race uses a full-bleed road + measured pixel layout + mouse-driven knobs, so it
// breaks below tablet width (tracks shrink, things overlap). Rather than half-fix it, we hard-cover
// small screens with an on-brand "come back on desktop" panel.
//
// Pure CSS breakpoint (md:hidden), no UA sniffing: visible by default, hidden at >=768px. SSR'd, so
// there's no flash and no JS. Rendered in the root layout → covers every route. z above modals (60).

export function MobileGate() {
  return (
    <div
      className="md:hidden fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 px-8 text-center"
      style={{ background: "var(--color-night)" }}
    >
      {/* the brand S-curve (same ease-in-out as the favicon), violet on the night bg */}
      <svg
        width="64"
        height="64"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M7 25 C14.6 25 17.4 7 25 7"
          stroke="var(--color-violet)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>
      <h1
        style={{
          fontFamily: "var(--font-silkscreen)",
          color: "#fff",
          fontSize: 20,
          letterSpacing: 2,
          lineHeight: 1.4,
        }}
      >
        PIT LANE CLOSED
      </h1>
      <p
        style={{
          fontFamily: "var(--font-geist-mono), monospace",
          color: "var(--color-muted)",
          fontSize: 14,
          lineHeight: 1.7,
          maxWidth: 320,
        }}
      >
        Racing Curves needs a bigger track. It&apos;s built for desktop — pop it
        open on a laptop or larger screen to race the curves.
      </p>
    </div>
  )
}
