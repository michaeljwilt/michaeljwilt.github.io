# michaeljwilt.github.io

Personal website for Michael Wilt — builder, data guy, dad.

Live at [michaeljwilt.github.io](https://michaeljwilt.github.io).

## Stack

Hand-crafted static site (same approach as [Brilliant Disruptions](https://brilliantdisruptions.com)):

- Plain HTML / CSS / vanilla JS — no build step
- [GSAP + ScrollTrigger](https://gsap.com/) for scroll reveals (CDN)
- Space Grotesk / Inter / JetBrains Mono via Google Fonts
- Hosted on GitHub Pages (`.nojekyll` — no Jekyll processing)

## Structure

```
index.html      single-page site (hero, about, work, projects, studio, contact)
css/main.css    design system + all styles
js/main.js      starfield background, nav, scroll reveals
assets/         images
```

## Editing

It's just files — edit and push. To preview locally:

```
python3 -m http.server 8000
```

then open http://localhost:8000.
