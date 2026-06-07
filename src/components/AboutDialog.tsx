"use client"

// About / ideology modal — the shared Modal shell with a readable MONOSPACE body (Silkscreen is
// unreadable in paragraphs). Auto-shown once on first visit (cookie-gated by the parent) and
// reopenable anytime via the help "?" button. Copy here is DUMMY — final wording dropped in later.

import Link from "next/link"
import { Modal } from "./Modal"

// TODO(copy): final ideology text + the real handle/URL
const TWITTER_HANDLE = "@rahul_twtss"
const TWITTER_URL = "https://x.com/rahul_twtss"
// TODO(copy): real website URL/label
const WEBSITE_LABEL = "rahuldoes.dev"
const WEBSITE_URL = "https://rahuldoes.dev"
const GITHUB_LABEL = "github"
const GITHUB_URL = "https://github.com/therahulchaurasia/racing-curve"

// shared muted gray for the de-emphasized bits (struck-through "easing" + the p.s. footnote) so they
// read as one "lighter" voice — the shared token (globals.css @theme)
const MUTED = "var(--color-muted)"

// heading wordplay: "easing" struck through (dashed) → it's not easing curves, it's RACING curves
const AboutHeading = (
  <span style={{ textTransform: "none", fontSize: 24 }}>
    <span
      style={{
        textDecoration: "line-through",
        textDecorationStyle: "dashed",
        color: MUTED,
      }}
    >
      easing
    </span>{" "}
    racing curves
  </span>
)

export function AboutDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={AboutHeading}
      logo={false}
    >
      <div
        style={{
          fontFamily: "var(--font-geist-mono), monospace",
          color: "#d8d6e0",
          fontSize: 14,
          lineHeight: 1.6,
          maxWidth: 460,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <p>
          I have worked with easing curves before, but honestly, I was always a
          little scared of them. I&apos;d pick a random value and move on
          without really getting it.
        </p>
        <p>
          Then I started Josh Comeau&apos;s whimsical animation course and hit
          the part about easing curves. I loved it. But I wanted to interpret
          them in my own way. And I thought, what&apos;s better than racing
          cars?
        </p>
        <p>So I built this.</p>
        <p>
          If you already know easing curves, tweak the control points, race them
          head to head, and tell me how it feels.
        </p>
        <p>If you don&apos;t, no worries. Just hit space, watch them race.</p>
        {/* dashed divider — splits the idea (above) from the meta/credits (below); echoes the dashed
            strikethrough motif. MUTED keeps it in the same lighter voice. */}
        <div
          style={{
            borderTop: `1px dashed ${MUTED}`,
            opacity: 0.6,
            marginTop: 6,
          }}
        />
        <p style={{ marginTop: 4 }}>
          built by{" "}
          <a
            href={TWITTER_URL}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--color-violet)", textDecoration: "underline" }}
          >
            {TWITTER_HANDLE}
          </a>{" "}
          {" · "}
          <a
            href={WEBSITE_URL}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--color-violet)", textDecoration: "underline" }}
          >
            {WEBSITE_LABEL}
          </a>
          {" · "}
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--color-violet)", textDecoration: "underline" }}
          >
            {GITHUB_LABEL}
          </a>
        </p>
        <p>
          you can check out the{" "}
          <Link
            href="/process"
            style={{ color: "var(--color-violet)", textDecoration: "underline" }}
          >
            process
          </Link>{" "}
          here.
        </p>
        {/* easter-egg breadcrumb: "wrong turn" echoes the BSOD 404 copy — pays off once they find it */}
        <p style={{ marginTop: 4, color: MUTED }}>
          p.s. you haven&apos;t found everything yet. there&apos;s something
          nostalgic too, if you take a wrong turn.
        </p>
      </div>
    </Modal>
  )
}
