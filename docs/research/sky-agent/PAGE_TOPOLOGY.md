# SkyAgent landing page topology

Reference: [agent-magicui.vercel.app](https://agent-magicui.vercel.app/)

## Layout shell

- Root: `max-w-7xl mx-auto border-x relative` with vertical border guides at `left-6` / `right-6`
- Main: `flex flex-col … divide-y divide-border min-h-screen w-full`

## Section order

| Order | ID | Component | Notes |
|------:|----|-----------|-------|
| — | — | `SiteHeader` | Sticky top nav (outside main) |
| 1 | `hero` | Hero | Badge, headline, CTAs, video play mock |
| 2 | `company` | Company | 4×2 logo grid, hover “Learn More” |
| 3 | `bento` | Bento | 2×2 cards: chat, orbit, chart, automation |
| 4 | `quote` | Quote | Testimonial block on `bg-accent` |
| 5 | `features` | Features | Desktop accordion + preview; mobile horizontal cards |
| 6 | `growth` | Growth | Two security/scaling cards |
| 7 | `pricing` | Pricing | Monthly/yearly toggle + 3 plans |
| 8 | `testimonials` | Testimonials | Masonry columns + vertical marquees |
| 9 | `faq` | FAQ | Radix accordion list |
| 10 | `cta` | CTA | Full-bleed image card + trial CTA |
| 11 | `footer` | Footer | Brand blurb + link columns |

## Shared patterns

- Section headers: `border-b` band with `p-10 md:p-14`, centered `max-w-xl` title + subtitle
- Typography: `tracking-tighter`, `text-balance`, `font-medium` headings
- Dividers: parent `divide-y divide-border` between major sections
