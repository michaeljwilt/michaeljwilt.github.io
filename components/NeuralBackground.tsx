'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { neuralRef } from './neural/store';

gsap.registerPlugin(ScrollTrigger);

// Each section owns a neuron (index into NEURONS). The camera flies to it;
// lookX/lookY frame it off-center so it never fights the content.
// Studio is the exception: pull out and look at the whole brain.
const SECTIONS = [
  { id: '#hero',    neuron: 0, radius: 10.5, azimuth: 0.0, elevation: 0.08,  lookX: 1.5,  lookY: 0.0 },
  { id: '#fit',     neuron: 1, radius: 8.5,  azimuth: 0.9, elevation: 0.28,  lookX: 3.4,  lookY: 0.3 },
  { id: '#work',    neuron: 2, radius: 9.0,  azimuth: 1.8, elevation: 0.55,  lookX: 3.6,  lookY: -0.4 },
  { id: '#scope',   neuron: 3, radius: 9.5,  azimuth: 2.7, elevation: 0.12,  lookX: 3.8,  lookY: -0.3 },
  { id: '#about',   neuron: 4, radius: 8.0,  azimuth: 3.6, elevation: -0.15, lookX: 3.4,  lookY: 0.4 },
  { id: '#chart',   neuron: 5, radius: 7.5,  azimuth: 4.4, elevation: 0.7,   lookX: 3.0,  lookY: -1.4 },
  { id: '#projects',neuron: 6, radius: 8.5,  azimuth: 5.2, elevation: -0.08, lookX: 3.3,  lookY: 0.2 },
  { id: '#studio',  neuron: 7, radius: 36,   azimuth: 6.1, elevation: 0.35,  lookX: 0.0,  lookY: 0.3, overview: true },
  { id: '#contact', neuron: 8, radius: 3.6,  azimuth: 7.0, elevation: 0.02,  lookX: 0.0,  lookY: -2.0 },
] as const;

// Roughly the centroid of the brain — the studio overview orbits this.
const BRAIN_CENTER: [number, number, number] = [0, 0, -13];

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let cleanupScroll: (() => void) | undefined;

    import('./neural/scene').then(({ NeuralScene, NEURONS }) => {
      if (cancelled || !canvasRef.current) return;
      if (!NeuralScene.supported(canvasRef.current)) return;

      const scene = new NeuralScene(canvasRef.current);
      scene.init();
      neuralRef.current = scene;

      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion) return;

      const poseFor = (s: (typeof SECTIONS)[number]) => {
        const target = 'overview' in s && s.overview ? BRAIN_CENTER : NEURONS[s.neuron].pos;
        return {
          tx: target[0], ty: target[1], tz: target[2],
          radius: s.radius, azimuth: s.azimuth, elevation: s.elevation,
          lookX: s.lookX, lookY: s.lookY,
        };
      };

      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const kills: (() => void)[] = [];
        SECTIONS.slice(1).forEach((s) => {
          const tw = gsap.to(scene.camState, {
            ...poseFor(s),
            ease: 'none',
            immediateRender: false,
            scrollTrigger: {
              trigger: s.id,
              start: 'top bottom',
              end: 'top 15%',
              scrub: 1.2,
            },
          });
          kills.push(() => { tw.scrollTrigger?.kill(); tw.kill(); });
        });
        // wake each section's neuron as its flight begins (halfway in),
        // firing the signal train from the previous neuron
        SECTIONS.forEach((s, i) => {
          const st = ScrollTrigger.create({
            trigger: s.id,
            start: 'top 60%',
            end: 'bottom 60%',
            onEnter: () => neuralRef.current?.setActive(s.neuron),
            onEnterBack: () => neuralRef.current?.setActive(s.neuron),
          });
          kills.push(() => st.kill());
          void i;
        });
        return () => kills.forEach((k) => k());
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
