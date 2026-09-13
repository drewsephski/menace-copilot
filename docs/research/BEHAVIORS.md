# SkyAgent interaction models

See also: [sky-agent/PAGE_TOPOLOGY.md](./sky-agent/PAGE_TOPOLOGY.md)

## Theme

- **Control:** Header icon button (sun/moon)
- **Library:** `next-themes` with `attribute="class"`, `defaultTheme="system"`, `enableSystem`
- **Hydration:** `suppressHydrationWarning` on `<html>`

## Mobile navigation

- **Trigger:** Hamburger in header (`md:hidden`)
- **Behavior:** Toggles fixed dropdown with anchor links + “Try for free”
- **Close:** Link click sets menu closed

## Pricing toggle

- **UI:** Pill switch (Monthly / Yearly with `-20%` badge)
- **State:** Local `yearly` boolean
- **Effect:** Plan prices read from `monthlyPrice` / `yearlyPrice` in `site-config`

## FAQ

- **Pattern:** Single-open Radix accordion
- **Motion:** `animate-accordion-up` / `animate-accordion-down`

## Features (`#features`)

- **Desktop:** Vertical accordion tabs (click) with **auto-advance** every ~6s
- **Progress:** Bottom secondary bar animates width over the active step duration
- **Preview:** Right panel updates with active step id
- **Mobile:** Horizontal snap scroll cards; tap sets active step (not scroll-spy)

## Testimonials

- **Layout:** CSS columns (`md:columns-2`, `xl:columns-3`)
- **Motion:** `animate-marquee-vertical` with per-column `--duration` (30s–70s)
- **Hover:** Column group pauses marquee animation

## Bento chat card

- **Motion:** `motion/react` cycles through scripted messages on an interval
- **Content:** User bubbles (secondary) + agent bubbles (bordered)

## Hero video mock

- **Hover:** Outer container `scale-[0.9]` → `scale-100`; inner play control up to `scale-[1.2]`

## Company logos

- **Hover:** Logo translates up; “Learn More →” fades in from below
