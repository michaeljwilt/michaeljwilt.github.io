'use client';

import { useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { CHART, points, ticks, linePath, areaPath, baselineY, type ChartPoint } from '@/lib/chart';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export default function ObsessionChart() {
  const cardRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const areaRef = useRef<SVGPathElement>(null);
  const [hover, setHover] = useState<{ p: ChartPoint; px: number; py: number } | null>(null);

  useGSAP(
    () => {
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reducedMotion) return;
      const line = lineRef.current!;
      const len = line.getTotalLength();
      gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
      gsap.set(areaRef.current, { opacity: 0 });
      gsap
        .timeline({
          scrollTrigger: { trigger: cardRef.current, start: 'top 80%', end: 'top 30%', scrub: 1 },
        })
        .to(line, { strokeDashoffset: 0, ease: 'none' })
        .to(areaRef.current, { opacity: 1, duration: 0.4 }, '>-0.2');
    },
    { scope: cardRef }
  );

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current!;
    const card = cardRef.current!;
    const rect = svg.getBoundingClientRect();
    const svgX = ((e.clientX - rect.left) / rect.width) * CHART.W;
    let nearest = points[0];
    for (const p of points) {
      if (Math.abs(p.x - svgX) < Math.abs(nearest.x - svgX)) nearest = p;
    }
    const cardRect = card.getBoundingClientRect();
    setHover({
      p: nearest,
      px: rect.left - cardRect.left + (nearest.x / CHART.W) * rect.width,
      py: rect.top - cardRect.top + (nearest.y / CHART.H) * rect.height,
    });
  };

  return (
    <section className="section chart-section" id="chart">
      <div className="container">
        <p className="section-label mono">
          {'// DATA NEVER LIES'}
        </p>
        <h2 className="section-title reveal">
          Obsession with building things<span className="grad-text">, over time.</span>
        </h2>
        <div className="chart-card reveal" ref={cardRef}>
          <svg
            id="obsession-chart"
            ref={svgRef}
            viewBox={`0 0 ${CHART.W} ${CHART.H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="A rising line chart of obsession with building things from 2019 to 2026"
            onMouseMove={onMove}
            onMouseLeave={() => setHover(null)}
          >
            <defs>
              <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="chart-stroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#2dd4bf" />
                <stop offset="100%" stopColor="#ffb454" />
              </linearGradient>
            </defs>
            <g id="chart-grid">
              {ticks.map(({ tick, y }) => (
                <line key={tick} x1={CHART.padL} x2={CHART.W - CHART.padR} y1={y} y2={y} />
              ))}
            </g>
            <path ref={areaRef} fill="url(#chart-fill)" d={areaPath} />
            <path
              ref={lineRef}
              fill="none"
              stroke="url(#chart-stroke)"
              strokeWidth={3}
              strokeLinecap="round"
              d={linePath}
            />
            {hover && (
              <g>
                <line
                  x1={hover.p.x}
                  x2={hover.p.x}
                  y1={CHART.padT - 4}
                  y2={baselineY}
                  stroke="rgba(255,255,255,0.25)"
                  strokeDasharray="4 4"
                />
                <circle cx={hover.p.x} cy={hover.p.y} r={6} fill="#ffb454" stroke="#06070c" strokeWidth={3} />
              </g>
            )}
            <g id="chart-labels">
              {ticks.map(({ tick, y }) => (
                <text key={tick} x={CHART.padL - 8} y={y + 4} textAnchor="end">
                  {tick}
                </text>
              ))}
              {points.map((p) => (
                <text key={p.year} x={p.x} y={CHART.H - 10} textAnchor="middle">
                  {p.year}
                </text>
              ))}
            </g>
          </svg>
          <div
            id="chart-tooltip"
            className="mono"
            aria-hidden="true"
            style={
              hover
                ? { left: hover.px, top: hover.py, opacity: 1 }
                : { opacity: 0 }
            }
          >
            {hover && (
              <>
                <strong>{hover.p.year}</strong> · {hover.p.v}% · {hover.p.note}
              </>
            )}
          </div>
        </div>
        <p className="chart-caption mono reveal">fig. 01 — highly scientific. hover it.</p>
      </div>
    </section>
  );
}
