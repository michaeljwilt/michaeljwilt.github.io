/* ═══════════════════════════════════════════════════
   Michael Wilt — personal site
   Lenis smooth scroll + GSAP motion + interactive bits
═══════════════════════════════════════════════════ */
(() => {
  'use strict';

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = window.matchMedia('(pointer: fine)').matches;
  const hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const hasLenis = typeof Lenis !== 'undefined';
  const motionOK = hasGsap && !reducedMotion;

  if (!motionOK) document.body.classList.add('no-motion');
  if (!hasGsap) document.body.classList.add('no-gsap');
  if (hasGsap) gsap.registerPlugin(ScrollTrigger);

  // ─── Footer year ───
  document.getElementById('year').textContent = new Date().getFullYear();

  // ─── Mobile nav ───
  const hamburger = document.getElementById('nav-hamburger');
  const mobileMenu = document.getElementById('nav-mobile-menu');
  hamburger.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    hamburger.setAttribute('aria-expanded', open);
  });
  mobileMenu.querySelectorAll('a').forEach((link) =>
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    })
  );

  // ─── Lenis smooth scroll ───
  let lenis = null;
  if (hasLenis && motionOK) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  // Anchor links play nice with Lenis
  document.querySelectorAll('a.anchor').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target, { offset: -72, duration: 1.4 });
      else target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth' });
    });
  });

  // ─── Scroll progress bar ───
  if (hasGsap) {
    ScrollTrigger.create({
      start: 0,
      end: () => ScrollTrigger.maxScroll(window),
      onUpdate: (self) => {
        document.getElementById('scroll-progress').style.transform = `scaleX(${self.progress})`;
      },
    });
  }

  // ─── Constellation background ───
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  const mouse = { x: -9999, y: -9999 };
  let particles = [];

  function initParticles() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = window.innerWidth, h = window.innerHeight;
    const count = w < 640 ? 40 : Math.min(100, Math.floor((w * h) / 16000));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
      r: Math.random() * 1.5 + 0.4,
    }));
  }

  function drawParticles() {
    const w = window.innerWidth, h = window.innerHeight;
    ctx.clearRect(0, 0, w, h);
    const LINK = 110, MOUSE_LINK = 170;
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(242,242,250,0.45)';
      ctx.fill();
      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x, dy = p.y - q.y;
        const d = Math.hypot(dx, dy);
        if (d < LINK) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(139,143,168,${(0.14 * (1 - d / LINK)).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      const md = Math.hypot(p.x - mouse.x, p.y - mouse.y);
      if (md < MOUSE_LINK) {
        ctx.beginPath();
        ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = `rgba(45,212,191,${(0.28 * (1 - md / MOUSE_LINK)).toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
    if (!reducedMotion) requestAnimationFrame(drawParticles);
  }
  initParticles();
  window.addEventListener('resize', initParticles);
  requestAnimationFrame(drawParticles);

  // ─── Mouse-parallax orbs ───
  if (motionOK && finePointer) {
    const orbs = document.querySelectorAll('[data-parallax]');
    window.addEventListener('mousemove', (e) => {
      mouse.x = e.clientX; mouse.y = e.clientY;
      const cx = e.clientX - window.innerWidth / 2;
      const cy = e.clientY - window.innerHeight / 2;
      orbs.forEach((orb) => {
        const f = parseFloat(orb.dataset.parallax);
        gsap.to(orb, { x: cx * f, y: cy * f, duration: 1.2, ease: 'power2.out' });
      });
    });
  } else {
    window.addEventListener('mousemove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; });
  }

  // ─── Custom cursor ───
  if (finePointer && motionOK) {
    document.body.classList.add('has-cursor');
    const dot = document.getElementById('cursor-dot');
    const ring = document.getElementById('cursor-ring');
    const label = document.getElementById('cursor-label');
    const dotX = gsap.quickSetter(dot, 'x', 'px');
    const dotY = gsap.quickSetter(dot, 'y', 'px');
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.4, ease: 'power3.out' });
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.4, ease: 'power3.out' });
    window.addEventListener('mousemove', (e) => {
      dotX(e.clientX); dotY(e.clientY);
      ringX(e.clientX); ringY(e.clientY);
    });
    document.querySelectorAll('a, button, [data-cursor]').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        ring.classList.add('is-active');
        label.textContent = el.dataset.cursor || '';
      });
      el.addEventListener('mouseleave', () => {
        ring.classList.remove('is-active');
        label.textContent = '';
      });
    });
  }

  // ─── Magnetic elements ───
  if (finePointer && motionOK) {
    document.querySelectorAll('[data-magnetic]').forEach((el) => {
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

  // ─── Split text helper ───
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    el.setAttribute('aria-label', text);
    [...text].forEach((ch) => {
      const span = document.createElement('span');
      span.className = 'char';
      span.setAttribute('aria-hidden', 'true');
      span.textContent = ch === ' ' ? ' ' : ch;
      el.appendChild(span);
    });
    return el.querySelectorAll('.char');
  }

  // ─── Hero headline reveal ───
  if (motionOK) {
    const allChars = [];
    document.querySelectorAll('.hero-headline .split-text').forEach((line) => {
      allChars.push(...splitChars(line));
    });
    gsap.from(allChars, {
      yPercent: 115,
      rotate: 4,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.035,
      delay: 0.15,
    });
    // subtle per-char hover repulsion
    if (finePointer) {
      allChars.forEach((ch) => {
        ch.addEventListener('mouseenter', () => {
          gsap.to(ch, { yPercent: -12, duration: 0.25, ease: 'power2.out' })
            .then(() => gsap.to(ch, { yPercent: 0, duration: 0.6, ease: 'elastic.out(1, 0.35)' }));
        });
      });
    }
  }

  // ─── Contact email char split (CSS handles hover lift) ───
  if (motionOK) splitChars(document.getElementById('contact-email'));

  // ─── Scramble-in labels ───
  const SCRAMBLE_CHARS = '#$%&/=?_<>*+';
  function scramble(el) {
    const target = el.dataset.text;
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
  if (motionOK) {
    document.querySelectorAll('.scramble').forEach((el) => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 92%',
        once: true,
        onEnter: () => scramble(el),
      });
    });
  }

  // ─── Generic reveals ───
  if (motionOK) {
    gsap.utils.toArray('.reveal').forEach((el) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        ease: 'expo.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onComplete: () => el.classList.add('visible'),
      });
    });
  } else {
    // IntersectionObserver fallback
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('visible'); io.unobserve(en.target); }
      });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach((el) => io.observe(el));
  }

  // ─── Stats count-up ───
  if (motionOK) {
    document.querySelectorAll('.stat-num[data-count]').forEach((el) => {
      const end = parseInt(el.dataset.count, 10);
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
            onUpdate: () => { el.textContent = Math.round(state.v) + suffix; },
          }),
      });
    });
  } else {
    document.querySelectorAll('.stat-num[data-count]').forEach((el) => {
      el.textContent = el.dataset.count + (el.dataset.suffix || '');
    });
  }

  // ─── Marquees (infinite loop, scroll-velocity reactive) ───
  if (motionOK) {
    document.querySelectorAll('.marquee').forEach((mq) => {
      const track = mq.querySelector('.marquee-track');
      const dir = parseFloat(mq.dataset.marqueeSpeed) >= 0 ? 1 : -1;
      const tween = gsap.to(track, {
        xPercent: -50 * dir,
        duration: 22,
        ease: 'none',
        repeat: -1,
      });
      if (dir < 0) gsap.set(track, { xPercent: -50 });
      if (lenis) {
        lenis.on('scroll', (e) => {
          const boost = 1 + Math.min(Math.abs(e.velocity) / 12, 3);
          gsap.to(tween, { timeScale: boost * (e.velocity < 0 ? -1 : 1) * 1, duration: 0.3, overwrite: true });
        });
      }
    });
  }

  // ─── Horizontal projects gallery (desktop only) ───
  if (motionOK) {
    const mm = gsap.matchMedia();
    mm.add('(min-width: 641px)', () => {
      const track = document.getElementById('htrack');
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
      return () => { tween.scrollTrigger && tween.scrollTrigger.kill(); tween.kill(); };
    });
  }

  // ─── 3D tilt + cursor shine on cards ───
  if (finePointer && motionOK) {
    document.querySelectorAll('.tilt').forEach((card) => {
      const max = parseFloat(card.dataset.tiltMax || 7);
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

  // ─── Photo parallax drift ───
  if (motionOK) {
    gsap.to('#photo-tilt', {
      y: -36,
      ease: 'none',
      scrollTrigger: { trigger: '#about', start: 'top bottom', end: 'bottom top', scrub: 1 },
    });
  }

  // ─── Obsession chart ───
  const chart = {
    svg: document.getElementById('obsession-chart'),
    years: [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
    values: [12, 18, 27, 38, 33, 52, 70, 92],
    notes: ['spreadsheets', 'SQL rabbit hole', 'dashboards', 'data portfolio', 'the dip (life happens)', 'ML curiosity', 'AI tooling', 'building nonstop'],
    W: 800, H: 320, padL: 46, padR: 24, padT: 24, padB: 34,
    pts: [],
  };

  function buildChart() {
    const { W, H, padL, padR, padT, padB, years, values } = chart;
    const innerW = W - padL - padR;
    const innerH = H - padT - padB;
    chart.pts = values.map((v, i) => ({
      x: padL + (i * innerW) / (values.length - 1),
      y: padT + innerH - (v / 100) * innerH,
      v, year: years[i], note: chart.notes[i],
    }));

    // grid + axis labels
    const grid = document.getElementById('chart-grid');
    const labels = document.getElementById('chart-labels');
    const ns = 'http://www.w3.org/2000/svg';
    [0, 25, 50, 75, 100].forEach((tick) => {
      const y = padT + innerH - (tick / 100) * innerH;
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', padL); line.setAttribute('x2', W - padR);
      line.setAttribute('y1', y); line.setAttribute('y2', y);
      grid.appendChild(line);
      const t = document.createElementNS(ns, 'text');
      t.setAttribute('x', padL - 8); t.setAttribute('y', y + 4);
      t.setAttribute('text-anchor', 'end');
      t.textContent = tick;
      labels.appendChild(t);
    });
    chart.pts.forEach((p) => {
      const t = document.createElementNS(ns, 'text');
      t.setAttribute('x', p.x); t.setAttribute('y', H - 10);
      t.setAttribute('text-anchor', 'middle');
      t.textContent = p.year;
      labels.appendChild(t);
    });

    // smooth path (cubic through midpoints)
    const pts = chart.pts;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1], p1 = pts[i];
      const mx = (p0.x + p1.x) / 2;
      d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    document.getElementById('chart-line').setAttribute('d', d);
    document.getElementById('chart-area').setAttribute(
      'd', `${d} L ${pts[pts.length - 1].x} ${padT + innerH} L ${pts[0].x} ${padT + innerH} Z`
    );
  }
  buildChart();

  // draw-on-scroll
  const lineEl = document.getElementById('chart-line');
  const areaEl = document.getElementById('chart-area');
  if (motionOK) {
    const len = lineEl.getTotalLength();
    gsap.set(lineEl, { strokeDasharray: len, strokeDashoffset: len });
    gsap.set(areaEl, { opacity: 0 });
    gsap.timeline({
      scrollTrigger: { trigger: '#chart-card', start: 'top 80%', end: 'top 30%', scrub: 1 },
    })
      .to(lineEl, { strokeDashoffset: 0, ease: 'none' })
      .to(areaEl, { opacity: 1, duration: 0.4 }, '>-0.2');
  }

  // crosshair + tooltip
  const crosshair = document.getElementById('chart-crosshair');
  const chLine = document.getElementById('crosshair-line');
  const chDot = document.getElementById('crosshair-dot');
  const tooltip = document.getElementById('chart-tooltip');
  const chartCard = document.getElementById('chart-card');

  chart.svg.addEventListener('mousemove', (e) => {
    const rect = chart.svg.getBoundingClientRect();
    const xRatio = (e.clientX - rect.left) / rect.width;
    const svgX = xRatio * chart.W;
    let nearest = chart.pts[0];
    for (const p of chart.pts) if (Math.abs(p.x - svgX) < Math.abs(nearest.x - svgX)) nearest = p;
    crosshair.setAttribute('opacity', '1');
    chLine.setAttribute('x1', nearest.x); chLine.setAttribute('x2', nearest.x);
    chDot.setAttribute('cx', nearest.x); chDot.setAttribute('cy', nearest.y);
    const cardRect = chartCard.getBoundingClientRect();
    const px = rect.left - cardRect.left + (nearest.x / chart.W) * rect.width;
    const py = rect.top - cardRect.top + (nearest.y / chart.H) * rect.height;
    tooltip.style.left = px + 'px';
    tooltip.style.top = py + 'px';
    tooltip.innerHTML = `<strong>${nearest.year}</strong> · ${nearest.v}% · ${nearest.note}`;
    tooltip.style.opacity = 1;
  });
  chart.svg.addEventListener('mouseleave', () => {
    crosshair.setAttribute('opacity', '0');
    tooltip.style.opacity = 0;
  });

  // ─── Archer easter egg ───
  const egg = document.getElementById('archer-egg');
  egg.addEventListener('click', () => {
    const arrow = document.createElement('div');
    arrow.className = 'arrow-fly';
    arrow.textContent = '➳';
    document.body.appendChild(arrow);
    const y = egg.getBoundingClientRect().top;
    if (motionOK) {
      gsap.fromTo(arrow,
        { x: -60, y: y, rotate: 8 },
        {
          x: window.innerWidth + 80,
          y: y - 60,
          rotate: -6,
          duration: 0.9,
          ease: 'power1.in',
          onComplete: () => arrow.remove(),
        }
      );
    } else {
      arrow.remove();
    }
  });
})();
