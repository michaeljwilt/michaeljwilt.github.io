// ─── The offer ladder ────────────────────────────────────────────────────
export const tiers = [
  {
    num: '00',
    name: 'The Look',
    price: 'Free · 20 min',
    desc: 'A live 20-minute look at your dbt project or warehouse. I name two or three real problems out loud. No deck, no deliverable, no pitch.',
  },
  {
    num: '01',
    name: 'The dbt Teardown',
    price: '$2,500 intro · one week',
    desc: 'Model by model, end to end. You get a prioritized fix list, a recorded walkthrough, and a 30-day remediation roadmap your team could start on tomorrow.',
    featured: true,
  },
  {
    num: '02',
    name: 'The Fix Sprint',
    price: '$3,000–$6,000 · two weeks',
    desc: 'I implement the top findings from the teardown. Fixed scope, named items, a defined end date — not an open-ended retainer.',
  },
  {
    num: '03',
    name: 'Ongoing',
    price: '$2,000–$4,000 / month',
    desc: 'A fixed block of hours each month for model work, reviews, and architecture questions. Offered after a Fix Sprint, to teams I enjoy working with.',
  },
];

// ─── What the teardown covers ────────────────────────────────────────────
export const teardownScope = [
  {
    title: 'Structure & layering',
    desc: 'Staging / intermediate / marts discipline, DAG shape, fan-out and fan-in problems.',
  },
  {
    title: 'Performance & cost',
    desc: 'Your most expensive models, materialization strategy, and incremental logic that quietly reprocesses everything.',
  },
  {
    title: 'Testing & data quality',
    desc: 'Where coverage stops, and where trust breaks before anyone notices.',
  },
  {
    title: 'CI/CD & deployment',
    desc: 'How changes actually ship, and what is going out unguarded.',
  },
  {
    title: 'Docs & lineage',
    desc: 'What is undocumented, and what nobody left on the team can trace.',
  },
  {
    title: 'Naming & maintainability',
    desc: 'Conventions, drift, and the parts your next hire will quietly hate.',
  },
];

export const deliverables = [
  {
    title: 'A prioritized fix list',
    desc: 'Every finding ranked by impact against effort, with the specific model or file named. Not a list of principles — a list of files.',
  },
  {
    title: 'A recorded walkthrough',
    desc: '20–30 minutes of me going through the findings out loud, so the reasoning survives after the document gets filed.',
  },
  {
    title: 'A 30-day roadmap',
    desc: 'A sequenced plan your team can start on Monday without me in the room.',
  },
];

// ─── Who it's for ────────────────────────────────────────────────────────
export const idealClient = [
  '15–200 employees',
  'dbt in production for 12+ months',
  'A 1–4 person data team with no dedicated analytics engineer',
  'Someone already complaining about warehouse costs or dashboard trust',
];

export const painSignals = [
  'The warehouse bill went up and nobody can say why.',
  'Models take too long to run, and everyone has stopped mentioning it.',
  'Stakeholders quietly do not trust the numbers.',
  'The person who built all of this left.',
];

// ─── Studio work (Brilliant Disruptions) ─────────────────────────────────
export const projects = [
  {
    tag: 'BRILLIANT DISRUPTIONS',
    title: 'TokenWatch',
    desc: "See your team's Claude usage live — real-time AI token monitoring for teams who live in Claude. No conversation access. Ever.",
    href: 'https://brilliantdisruptions.com/projects/tokenwatch/',
  },
  {
    tag: 'BRILLIANT DISRUPTIONS',
    title: 'JARVIS',
    desc: 'Autonomous command & control center. 12 AI agents, 9 integrations, approval gates — the human approves, the machine operates.',
    href: 'https://brilliantdisruptions.com/projects/jarvis/',
  },
];

export const socials = [
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/michaeljwilt/' },
  { label: 'GitHub', href: 'https://github.com/michaeljwilt' },
  { label: 'Tableau', href: 'https://public.tableau.com/app/profile/michaeljwilt' },
];

export const EMAIL = 'michaeljwilt@outlook.com';

// Pre-filled so the first email already has a subject line
export const BOOK_HREF = `mailto:${EMAIL}?subject=${encodeURIComponent(
  'Free 20-minute dbt look'
)}&body=${encodeURIComponent(
  "Hi Michael — I'd like the free 20-minute look at our dbt project.\n\nCompany:\nWarehouse (Snowflake / BigQuery / other):\nHow long dbt has been in production:\nWhat's hurting right now:\n"
)}`;
