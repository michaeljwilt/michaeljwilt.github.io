'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { projects } from '@/lib/data';
import { neuralRef } from './neural/store';
import type { RGB } from './neural/scene';

gsap.registerPlugin(ScrollTrigger);

// One tint per project — the network "thinks" in this color
const TINTS: RGB[] = [
  [0.18, 0.83, 0.75], // TokenWatch — teal
  [0.55, 0.3, 0.95],  // JARVIS — violet
  [1.0, 0.71, 0.33],  // Traveller — amber
  [0.0, 0.9, 1.0],    // Podcast KPI — cyan
  [1.0, 0.0, 0.43],   // Neural Net — magenta
  [0.85, 0.9, 1.0],   // Nashville — starlight
];

const tintCss = (t: RGB, a: number) =>
  `rgba(${Math.round(t[0] * 255)}, ${Math.round(t[1] * 255)}, ${Math.round(t[2] * 255)}, ${a})`;

export default function NeuralProjects() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  // Pinned scroll scrub drives the active project (desktop only)
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: () => '+=' + projects.length * 520,
        pin: true,
        scrub: true,
        onUpdate: (self) => {
          const idx = Math.min(
            projects.length - 1,
            Math.floor(self.progress * projects.length)
          );
          if (idx !== activeRef.current) {
            activeRef.current = idx;
            setActive(idx);
            neuralRef.current?.excite(TINTS[idx]);
          }
        },
      });
      return () => st.kill();
    });
    return () => mm.revert();
  }, []);

  const activate = (i: number) => {
    activeRef.current = i;
    setActive(i);
    neuralRef.current?.excite(TINTS[i]);
  };

  return (
    <section className="hsection neural-section" id="projects" ref={sectionRef}>
      <div className="neural-pin">
        <div className="container">
          <p className="section-label mono">{'// PROJECTS — RUNNING ON NEURAL'}</p>
          <h2 className="section-title">
            The network remembers what I&apos;ve built
            <span className="hhint mono"> — keep scrolling ↓</span>
          </h2>
        </div>
        <div className="container neural-grid">
          <div className="neural-list" role="list">
            {projects.map((p, i) => (
              <a
                key={p.href}
                role="listitem"
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`neural-item${i === active ? ' is-active' : ''}`}
                style={i === active ? { borderColor: tintCss(TINTS[i], 0.5) } : undefined}
                onMouseEnter={() => activate(i)}
                onFocus={() => activate(i)}
                data-cursor="VIEW ↗"
              >
                <span className="neural-num mono" style={i === active ? { color: tintCss(TINTS[i], 1) } : undefined}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="neural-copy">
                  <span className="neural-tag mono">{p.tag}</span>
                  <span className="neural-name">{p.title}</span>
                  <span className="neural-desc">{p.desc}</span>
                </span>
                <span className="neural-arrow" aria-hidden="true">↗</span>
              </a>
            ))}
            <p className="neural-more mono">
              more on{' '}
              <a href="https://github.com/michaeljwilt" target="_blank" rel="noopener noreferrer" className="inline-link">
                github
              </a>{' '}
              ·{' '}
              <a href="https://public.tableau.com/app/profile/michaeljwilt" target="_blank" rel="noopener noreferrer" className="inline-link">
                tableau
              </a>
            </p>
          </div>
          {/* the organism itself floats here, behind the page */}
          <div className="neural-space" aria-hidden="true">
            <p className="neural-credit mono">
              neural engine borrowed from{' '}
              <a href="https://brilliantdisruptions.com/projects/jarvis/" target="_blank" rel="noopener noreferrer" className="inline-link">
                JARVIS
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
