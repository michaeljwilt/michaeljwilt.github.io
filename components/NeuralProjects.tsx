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
  [0.55, 0.3, 0.95], // JARVIS — violet
];

const tintCss = (t: RGB, a: number) =>
  `rgba(${Math.round(t[0] * 255)}, ${Math.round(t[1] * 255)}, ${Math.round(t[2] * 255)}, ${a})`;

export default function NeuralProjects() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 70%',
        end: 'bottom 40%',
        onUpdate: (self) => {
          const idx = Math.min(projects.length - 1, Math.floor(self.progress * projects.length));
          if (idx !== activeRef.current) {
            activeRef.current = idx;
            setActive(idx);
            neuralRef.current?.excite(TINTS[idx] ?? TINTS[0]);
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
    neuralRef.current?.excite(TINTS[i] ?? TINTS[0]);
  };

  return (
    <section className="section scrim" id="projects" ref={sectionRef}>
      <div className="container">
        <p className="section-label mono">{'// WHEN THE SCOPE IS BIGGER'}</p>
        <h2 className="section-title reveal">Products I&apos;ve shipped with the studio</h2>
        <p className="section-intro reveal">
          The teardown is mine, solo, under my own name. When something needs a full build, it goes
          through Brilliant Disruptions — the AI-first studio I run with two partners. These are
          ours.
        </p>
        <div className="neural-list" role="list">
          {projects.map((p, i) => (
            <a
              key={p.href}
              role="listitem"
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`neural-item${i === active ? ' is-active' : ''}`}
              style={i === active ? { borderColor: tintCss(TINTS[i] ?? TINTS[0], 0.5) } : undefined}
              onMouseEnter={() => activate(i)}
              onFocus={() => activate(i)}
              data-cursor="VIEW ↗"
            >
              <span
                className="neural-num mono"
                style={i === active ? { color: tintCss(TINTS[i] ?? TINTS[0], 1) } : undefined}
              >
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="neural-copy">
                <span className="neural-tag mono">{p.tag}</span>
                <span className="neural-name">{p.title}</span>
                <span className="neural-desc">{p.desc}</span>
              </span>
              <span className="neural-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          ))}
        </div>
        <p className="neural-more mono">
          neural engine on this page borrowed from{' '}
          <a
            href="https://brilliantdisruptions.com/projects/jarvis/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-link"
          >
            JARVIS
          </a>
        </p>
      </div>
    </section>
  );
}
