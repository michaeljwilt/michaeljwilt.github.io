export const CHART = {
  W: 800,
  H: 320,
  padL: 46,
  padR: 24,
  padT: 24,
  padB: 34,
  years: [2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
  values: [12, 18, 27, 38, 33, 52, 70, 92],
  notes: [
    'spreadsheets',
    'SQL rabbit hole',
    'dashboards',
    'data portfolio',
    'the dip (life happens)',
    'ML curiosity',
    'AI tooling',
    'building nonstop',
  ],
};

export type ChartPoint = {
  x: number;
  y: number;
  v: number;
  year: number;
  note: string;
};

const innerW = CHART.W - CHART.padL - CHART.padR;
const innerH = CHART.H - CHART.padT - CHART.padB;

export const points: ChartPoint[] = CHART.values.map((v, i) => ({
  x: CHART.padL + (i * innerW) / (CHART.values.length - 1),
  y: CHART.padT + innerH - (v / 100) * innerH,
  v,
  year: CHART.years[i],
  note: CHART.notes[i],
}));

export const ticks = [0, 25, 50, 75, 100].map((tick) => ({
  tick,
  y: CHART.padT + innerH - (tick / 100) * innerH,
}));

// smooth path (cubic through midpoints)
export const linePath = points.reduce((d, p, i) => {
  if (i === 0) return `M ${p.x} ${p.y}`;
  const p0 = points[i - 1];
  const mx = (p0.x + p.x) / 2;
  return `${d} C ${mx} ${p0.y}, ${mx} ${p.y}, ${p.x} ${p.y}`;
}, '');

export const areaPath = `${linePath} L ${points[points.length - 1].x} ${CHART.padT + innerH} L ${points[0].x} ${CHART.padT + innerH} Z`;

export const baselineY = CHART.padT + innerH;
