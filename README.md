# michaelwilt — personal site

Personal site for Michael Wilt — analytics engineer. Sells **The dbt Teardown**:
a one-week, fixed-price review of a team's dbt project.

Solo venture under his own name — deliberately separate from Brilliant Disruptions
(which gets its own clearly-labelled section) and from the day job.

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
components/     one per section + Cursor, NeuralBackground, MotionRoot, Terminal
components/neural/  the Three.js brain (scene.ts) and its shared handle (store.ts)
lib/            all site copy (tiers, scope, deliverables, fit) and chart geometry
public/assets/  images
```

`components/MotionRoot.tsx` is the motion engine: Lenis + ScrollTrigger wiring,
reveals, marquee, magnetic elements, tilt cards, scroll-progress.

`components/neural/scene.ts` is the brain — neurons, axons, and signal pulses,
ported from the JARVIS visual. `NeuralBackground.tsx` maps each page section to
a neuron and flies the camera between them on scroll; its `SECTIONS` array must
stay in sync with the section IDs rendered in `app/page.tsx`.

**Almost all copy lives in `lib/data.ts`** — prices, scope, deliverables, fit
criteria. Change it there, not in the components.
