# SkyAgent template

Pixel-aligned landing page clone of the [Magic UI SkyAgent template](https://agent-magicui.vercel.app/), built with Next.js 15, React 19, Tailwind CSS v4, and Motion.

## Setup

```bash
cd templates/sky-agent
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Production build

```bash
npm run build
npm start
```

## Structure

- `src/app/` — App Router layout, global styles, page composition
- `src/components/` — Section components matching live site IDs
- `src/lib/site-config.ts` — Nav, pricing, FAQ, testimonials copy
- `public/agent-cta-background.png` — CTA background asset

Research notes live under `docs/research/sky-agent/`.
