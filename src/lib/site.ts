// Single source for site-wide content: external links + page metadata. Components (AboutDialog) and
// the root layout pull from here, so there's one place to edit links/titles/descriptions.

// TODO(verify): confirm the handles/URLs (esp. the course link).
export const LINKS = {
  twitter: { label: "@rahul_twtss", url: "https://x.com/rahul_twtss" },
  website: { label: "rahuldoes.dev", url: "https://rahuldoes.dev" },
  github: {
    label: "github",
    url: "https://github.com/therahulchaurasia/racing-curve",
  },
  course: {
    label: "whimsical animation",
    url: "https://whimsy.joshwcomeau.com/",
  },
  // CC0 sprite artists — cars from Kenney, bushes/plants from Shaade (credited in the About modal)
  kenney: { label: "kenney", url: "https://kenney.nl" },
  shaade: { label: "shaade", url: "https://shaade.itch.io/" },
} as const

export const SITE = {
  name: "Racing Curves",
  title: "Racing Curves — easing curves, as a race",
  description:
    "Visualize CSS easing curves by racing color-coded cars down a multi-lane track, with a synced curve graph. Tweak the control points and watch how the timing actually feels.",
} as const
