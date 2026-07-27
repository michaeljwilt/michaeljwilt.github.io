# michaelwilt — personal site

Personal website for Michael Wilt — builder, data guy, dad.

## Stack

- **Next.js 16** (App Router) + React 19 + TypeScript
- **GSAP 3.15** + ScrollTrigger for motion, **Lenis** for smooth scrolling
- Fonts self-hosted via `next/font` (Space Grotesk / Inter / JetBrains Mono)
- Deploys to **Vercel** (any static host works for now; API routes planned for the
  "ask my site" terminal)

## Develop

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Structure

```
app/            layout (fonts, metadata), page, globals.css, icon
components/     one component per section + Cursor, Background, MotionRoot
lib/            content data (projects, services, socials) and chart geometry
public/assets/  images
```

`components/MotionRoot.tsx` is the motion engine: Lenis + ScrollTrigger wiring,
reveals, marquees, magnetic elements, tilt cards, the pinned horizontal gallery,
and scroll-progress. Content edits usually live in `lib/data.ts`.
