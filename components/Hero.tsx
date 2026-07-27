'use client';

import gsap from 'gsap';
import SplitChars from './SplitChars';
import { BOOK_HREF } from '@/lib/data';

export default function Hero() {
  const looseArrow = (e: React.MouseEvent<HTMLButtonElement>) => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) return;
    const arrow = document.createElement('div');
    arrow.className = 'arrow-fly';
    arrow.textContent = '➳';
    document.body.appendChild(arrow);
    const y = (e.target as HTMLElement).getBoundingClientRect().top;
    gsap.fromTo(
      arrow,
      { x: -60, y, rotate: 8 },
      {
        x: window.innerWidth + 80,
        y: y - 60,
        rotate: -6,
        duration: 0.9,
        ease: 'power1.in',
        onComplete: () => arrow.remove(),
      }
    );
  };

  return (
    <header className="section hero" id="hero">
      <div className="container hero-inner">
        <div className="avail-badge reveal">
          <span className="avail-dot" aria-hidden="true" />
          Two client slots open · intro pricing
        </div>
        <p className="section-label mono scramble" data-text="// ANALYTICS ENGINEERING">
          {'// ANALYTICS ENGINEERING'}
        </p>
        <h1 className="hero-headline" aria-label="Michael Wilt">
          <span className="split-line">
            <span className="split-text">
              <SplitChars text="MICHAEL" />
            </span>
          </span>
          <span className="split-line">
            <span className="split-text grad-text">
              <SplitChars text="WILT" />
            </span>
          </span>
        </h1>
        <p className="hero-sub reveal">
          I help teams fix <strong>slow, expensive, and fragile dbt projects</strong> — and get
          their data AI-ready.
        </p>
        <p className="hero-kicker reveal">
          One-week teardowns. Most teams find out their warehouse bill is several times what it
          needs to be, and that half their models aren&apos;t tested.
        </p>
        <p className="hero-tags mono reveal">
          Husband · Father ·{' '}
          <button className="tag-egg" title="Click me" onClick={looseArrow}>
            Archer
          </button>{' '}
          · dbt · Dagster · DLT · Python
        </p>
        <div className="hero-actions reveal">
          <a href={BOOK_HREF} className="btn btn-solid" data-magnetic>
            Book the free 20-minute look
          </a>
          <a href="#work" className="btn btn-ghost anchor" data-magnetic>
            See what it costs
          </a>
        </div>
      </div>
      <a href="#about" className="scroll-hint mono anchor" aria-label="Scroll to about">
        scroll ↓
      </a>
    </header>
  );
}
