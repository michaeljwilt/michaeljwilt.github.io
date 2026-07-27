'use client';

import { useEffect } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const SCRAMBLE_CHARS = '#$%&/=?_<>*+';

function scramble(el: HTMLElement) {
  const target = el.dataset.text || el.textContent || '';
  let frame = 0;
  const total = Math.max(14, target.length * 2);
  const tick = () => {
    frame++;
    const progress = frame / total;
    el.textContent = [...target]
      .map((ch, i) => {
        if (ch === ' ') return ' ';
        return i / target.length < progress
          ? ch
          : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      })
      .join('');
    if (frame < total) requestAnimationFrame(tick);
    else el.textContent = target;
  };
  tick();
}

export default function MotionRoot() {
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const finePointer = window.matchMedia('(pointer: fine)').matches;

    if (reducedMotion) {
      document.body.classList.add('no-motion');
      document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
      document.querySelectorAll<HTMLElement>('.stat-num[data-count]').forEach((el) => {
        el.textContent = el.dataset.count! + (el.dataset.suffix || '');
      });
      return;
    }

    const ctx = gsap.context(() => {
      // ─── Lenis smooth scroll ───
      const lenis = new Lenis({ lerp: 0.1, autoRaf: false });
      lenis.on('scroll', ScrollTrigger.update);
      const raf = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(raf);
      gsap.ticker.lagSmoothing(0);

      // Anchor links play nice with Lenis
      const onAnchorClick = (e: Event) => {
        const a = (e.target as HTMLElement).closest('a.anchor');
        if (!a) return;
        const target = document.querySelector(a.getAttribute('href') || '');
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target as HTMLElement, { offset: -72, duration: 1.4 });
      };
      document.addEventListener('click', onAnchorClick);

      // ─── Scroll progress bar ───
      const progressEl = document.getElementById('scroll-progress');
      ScrollTrigger.create({
        start: 0,
        end: () => ScrollTrigger.maxScroll(window),
        onUpdate: (self) => {
          if (progressEl) progressEl.style.transform = `scaleX(${self.progress})`;
        },
      });

      // ─── Hero headline reveal ───
      const heroChars = gsap.utils.toArray<HTMLElement>('.hero-headline .char');
      gsap.from(heroChars, {
        yPercent: 115,
        rotate: 4,
        duration: 1.1,
        ease: 'expo.out',
        stagger: 0.035,
        delay: 0.15,
      });
      if (finePointer) {
        heroChars.forEach((ch) => {
          ch.addEventListener('mouseenter', () => {
            // kinetic type: variable-weight dip + spring back up
            gsap.to(ch, { fontVariationSettings: '"wght" 340', duration: 0.2, ease: 'power2.out' });
            gsap
              .to(ch, { yPercent: -12, duration: 0.25, ease: 'power2.out' })
              .then(() => {
                gsap.to(ch, { yPercent: 0, duration: 0.6, ease: 'elastic.out(1, 0.35)' });
                gsap.to(ch, { fontVariationSettings: '"wght" 700', duration: 0.7, ease: 'power2.out' });
              });
          });
        });
      }

      // ─── Scramble-in labels ───
      document.querySelectorAll<HTMLElement>('.scramble').forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: 'top 92%',
          once: true,
          onEnter: () => scramble(el),
        });
      });

      // ─── Generic reveals ───
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: 'expo.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
          onComplete: () => el.classList.add('visible'),
        });
      });

      // ─── Stats count-up ───
      document.querySelectorAll<HTMLElement>('.stat-num[data-count]').forEach((el) => {
        const end = parseInt(el.dataset.count!, 10);
        const suffix = el.dataset.suffix || '';
        const state = { v: 0 };
        ScrollTrigger.create({
          trigger: el,
          start: 'top 90%',
          once: true,
          onEnter: () =>
            gsap.to(state, {
              v: end,
              duration: 1.6,
              ease: 'power3.out',
              onUpdate: () => {
                el.textContent = Math.round(state.v) + suffix;
              },
            }),
        });
      });

      // ─── Marquees (velocity reactive) ───
      document.querySelectorAll<HTMLElement>('.marquee').forEach((mq) => {
        const track = mq.querySelector('.marquee-track')!;
        const dir = parseFloat(mq.dataset.marqueeSpeed || '1') >= 0 ? 1 : -1;
        const tween = gsap.to(track, {
          xPercent: -50 * dir,
          duration: 22,
          ease: 'none',
          repeat: -1,
        });
        if (dir < 0) gsap.set(track, { xPercent: -50 });
        // pausable on hover (accessibility: motion the visitor can stop)
        mq.addEventListener('mouseenter', () => gsap.to(tween, { timeScale: 0.15, duration: 0.4 }));
        mq.addEventListener('mouseleave', () => gsap.to(tween, { timeScale: 1, duration: 0.4 }));
        lenis.on('scroll', (e: { velocity: number }) => {
          const boost = 1 + Math.min(Math.abs(e.velocity) / 12, 3);
          gsap.to(tween, {
            timeScale: boost * (e.velocity < 0 ? -1 : 1),
            duration: 0.3,
            overwrite: true,
          });
        });
      });

      // ─── Horizontal projects gallery (desktop only) ───
      const mm = gsap.matchMedia();
      mm.add('(min-width: 641px)', () => {
        const track = document.getElementById('htrack');
        if (!track) return;
        const getScroll = () => track.scrollWidth - window.innerWidth + 80;
        const tween = gsap.to(track, {
          x: () => -getScroll(),
          ease: 'none',
          scrollTrigger: {
            trigger: '#projects',
            start: 'top top',
            end: () => '+=' + getScroll(),
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
        return () => {
          tween.scrollTrigger?.kill();
          tween.kill();
        };
      });

      // ─── Magnetic elements ───
      if (finePointer) {
        document.querySelectorAll<HTMLElement>('[data-magnetic]').forEach((el) => {
          el.addEventListener('mousemove', (e) => {
            const r = el.getBoundingClientRect();
            gsap.to(el, {
              x: (e.clientX - r.left - r.width / 2) * 0.35,
              y: (e.clientY - r.top - r.height / 2) * 0.35,
              duration: 0.4,
              ease: 'power3.out',
            });
          });
          el.addEventListener('mouseleave', () => {
            gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
          });
        });
      }

      // ─── 3D tilt + cursor shine ───
      if (finePointer) {
        document.querySelectorAll<HTMLElement>('.tilt').forEach((card) => {
          const max = parseFloat(card.dataset.tiltMax || '7');
          card.addEventListener('mousemove', (e) => {
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width;
            const py = (e.clientY - r.top) / r.height;
            card.style.setProperty('--mx', `${px * 100}%`);
            card.style.setProperty('--my', `${py * 100}%`);
            gsap.to(card, {
              rotateY: (px - 0.5) * max * 2,
              rotateX: (0.5 - py) * max * 2,
              transformPerspective: 800,
              duration: 0.5,
              ease: 'power2.out',
            });
          });
          card.addEventListener('mouseleave', () => {
            gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
          });
        });
      }

      // ─── Orb mouse parallax ───
      if (finePointer) {
        const orbs = document.querySelectorAll<HTMLElement>('[data-parallax]');
        window.addEventListener('mousemove', (e) => {
          const cx = e.clientX - window.innerWidth / 2;
          const cy = e.clientY - window.innerHeight / 2;
          orbs.forEach((orb) => {
            const f = parseFloat(orb.dataset.parallax!);
            gsap.to(orb, { x: cx * f, y: cy * f, duration: 1.2, ease: 'power2.out' });
          });
        });
      }

      // ─── Photo parallax drift ───
      gsap.to('#photo-tilt', {
        y: -36,
        ease: 'none',
        scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: 1 },
      });

      return () => {
        document.removeEventListener('click', onAnchorClick);
        gsap.ticker.remove(raf);
        lenis.destroy();
      };
    });

    return () => ctx.revert();
  }, []);

  return null;
}
