"use client"

// About / ideology modal — the shared Modal shell with a readable MONOSPACE body (Silkscreen is
// unreadable in paragraphs). Auto-shown once on first visit (cookie-gated by the parent) and
// reopenable anytime via the help "?" button. Copy here is DUMMY — final wording dropped in later.

import Link from "next/link"
import { Modal } from "./Modal"
import { LINKS } from "@/lib/site"

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
          Then I started Josh Comeau&apos;s{" "}
          <AltLink href={LINKS.course.url}>{LINKS.course.label}</AltLink> and
          hit the part about easing curves. I loved it. But I wanted to
          interpret them in my own way. And what&apos;s better than racing cars?
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
          <AltLink href={LINKS.twitter.url}>{LINKS.twitter.label}</AltLink>
          {" · "}
          <AltLink href={LINKS.website.url}>{LINKS.website.label}</AltLink>
          {" · "}
          <AltLink href={LINKS.github.url}>{LINKS.github.label}</AltLink>
        </p>
        {/* sprite attribution — CC0 but credited anyway: cars from Kenney, plants from Shaade */}
        <p>
          cars by <AltLink href={LINKS.kenney.url}>{LINKS.kenney.label}</AltLink>
          {" · "}
          plants by{" "}
          <AltLink href={LINKS.shaade.url}>{LINKS.shaade.label}</AltLink>
        </p>
        <p>
          you can check out the <AltLink href="/process">process</AltLink> here.
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

// styled link — violet underline, in one place so the markup/style isn't repeated per link. Internal
// hrefs ("/...") use next/link; everything else opens in a new tab.
function AltLink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const style = {
    color: "var(--color-violet)",
    textDecoration: "underline",
  } as const
  return href.startsWith("/") ? (
    <Link href={href} style={style}>
      {children}
    </Link>
  ) : (
    <a href={href} target="_blank" rel="noreferrer" style={style}>
      {children}
    </a>
  )
}
