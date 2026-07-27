'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { neuralRef } from './neural/store';
import type { CamState } from './neural/scene';

gsap.registerPlugin(ScrollTrigger);

// Camera poses — one per section. Azimuth climbs so the journey keeps
// orbiting the organism while it zooms; lookX/Y push it off-center so it
// never fights the content.
// lookX/lookY = where the organism sits on screen (view-space): +X right, +Y up
const POSES: { id: string; pose: CamState }[] = [
  { id: '#hero',    pose: { radius: 10.5, azimuth: 0.0,  elevation: 0.08,  lookX: 1.4,  lookY: 0.0 } },
  { id: '#about',   pose: { radius: 6.4,  azimuth: 1.15, elevation: 0.32,  lookX: -1.9, lookY: 0.1 } },
  { id: '#chart',   pose: { radius: 5.2,  azimuth: 2.1,  elevation: 0.9,   lookX: 2.2,  lookY: -0.9 } },
  { id: '#work',    pose: { radius: 4.3,  azimuth: 3.15, elevation: 0.15,  lookX: 2.5,  lookY: -0.7 } },
  { id: '#projects',pose: { radius: 5.8,  azimuth: 4.25, elevation: -0.12, lookX: 2.3,  lookY: 0.0 } },
  { id: '#studio',  pose: { radius: 13.0, azimuth: 5.4,  elevation: 0.22,  lookX: 0.0,  lookY: 0.3 } },
  { id: '#contact', pose: { radius: 3.5,  azimuth: 6.4,  elevation: 0.02,  lookX: 0.0,  lookY: -1.9 } },
];

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanupScroll: (() => void) | undefined;

    import('./neural/scene').then(({ NeuralScene }) => {
      if (cancelled || !canvasRef.current) return;
      if (!NeuralScene.supported(canvasRef.current)) return;

      const scene = new NeuralScene(canvasRef.current);
      scene.init();
      neuralRef.current = scene;

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion) return;

      // Scroll choreography: fly the camera between section poses.
      // Each tween scrubs while its section scrolls into view.
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tweens = POSES.slice(1).map(({ id, pose }) =>
          gsap.to(scene.camState, {
            ...pose,
            ease: 'none',
            immediateRender: false,
            scrollTrigger: {
              trigger: id,
              start: 'top bottom',
              end: 'top 15%',
              scrub: 1.2,
            },
          })
        );
        return () => tweens.forEach((tw) => { tw.scrollTrigger?.kill(); tw.kill(); });
      });
      cleanupScroll = () => mm.revert();
    });

    return () => {
      cancelled = true;
      cleanupScroll?.();
      neuralRef.current?.destroy();
      neuralRef.current = null;
    };
  }, []);

  return (
    <>
      <canvas id="neural-bg" ref={canvasRef} aria-hidden="true" />
      <div id="bg-gradient" aria-hidden="true" />
    </>
  );
}
