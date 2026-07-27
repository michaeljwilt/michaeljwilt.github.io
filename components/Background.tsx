'use client';

import { useEffect, useRef } from 'react';

type Particle = { x: number; y: number; vx: number; vy: number; r: number };

// Shared mouse position, also read by MotionRoot for orb parallax
export const mouse = { x: -9999, y: -9999 };

export default function Background() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let particles: Particle[] = [];
    let raf = 0;
    // occasional shooting star
    let meteor: { x: number; y: number; vx: number; vy: number; life: number } | null = null;
    let nextMeteorAt = performance.now() + 4000 + Math.random() * 6000;

    function init() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = window.innerWidth;
      const h = window.innerHeight;
      const count = w < 640 ? 40 : Math.min(100, Math.floor((w * h) / 16000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.5 + 0.4,
      }));
    }

    function draw() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      const LINK = 110;
      const MOUSE_LINK = 170;
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(242,242,250,0.45)';
        ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const d = Math.hypot(p.x - q.x, p.y - q.y);
          if (d < LINK) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(139,143,168,${(0.14 * (1 - d / LINK)).toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        const md = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (md < MOUSE_LINK) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(45,212,191,${(0.28 * (1 - md / MOUSE_LINK)).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      // shooting star: spawn every ~4–10s, streak with fading tail
      const now = performance.now();
      if (!meteor && now > nextMeteorAt) {
        meteor = {
          x: Math.random() * w * 0.7,
          y: Math.random() * h * 0.35,
          vx: 7 + Math.random() * 5,
          vy: 3 + Math.random() * 2,
          life: 1,
        };
        nextMeteorAt = now + 4000 + Math.random() * 6000;
      }
      if (meteor) {
        meteor.x += meteor.vx;
        meteor.y += meteor.vy;
        meteor.life -= 0.018;
        const tail = 10;
        const grad = ctx.createLinearGradient(
          meteor.x, meteor.y,
          meteor.x - meteor.vx * tail, meteor.y - meteor.vy * tail
        );
        grad.addColorStop(0, `rgba(255,255,255,${(0.85 * meteor.life).toFixed(3)})`);
        grad.addColorStop(1, 'rgba(45,212,191,0)');
        ctx.beginPath();
        ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(meteor.x - meteor.vx * tail, meteor.y - meteor.vy * tail);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.stroke();
        if (meteor.life <= 0 || meteor.x > w + 50 || meteor.y > h + 50) meteor = null;
      }
      if (!reducedMotion) raf = requestAnimationFrame(draw);
    }

    const onMouse = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    init();
    draw();
    window.addEventListener('resize', init);
    window.addEventListener('mousemove', onMouse);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', init);
      window.removeEventListener('mousemove', onMouse);
    };
  }, []);

  return (
    <>
      <canvas id="bg-canvas" ref={canvasRef} aria-hidden="true" />
      <div id="bg-gradient" aria-hidden="true">
        <div className="grad-orb grad-orb-1" data-parallax="0.06" />
        <div className="grad-orb grad-orb-2" data-parallax="-0.045" />
        <div className="grad-orb grad-orb-3" data-parallax="0.03" />
      </div>
    </>
  );
}
