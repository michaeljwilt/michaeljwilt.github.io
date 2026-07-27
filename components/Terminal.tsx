'use client';

import { useEffect, useRef, useState } from 'react';
import { tiers, teardownScope, idealClient, socials, EMAIL } from '@/lib/data';

type Line = { kind: 'cmd' | 'out' | 'accent'; text: string };

const BANNER: Line[] = [
  { kind: 'accent', text: 'mw-shell v1.0 — analytics engineering, on the side, done properly.' },
  { kind: 'out', text: "Type 'help' to see what I can do. Esc to close." },
];

function runCommand(raw: string): Line[] {
  const cmd = raw.trim().toLowerCase();
  switch (cmd) {
    case 'help':
      return [
        { kind: 'out', text: 'available commands:' },
        { kind: 'out', text: '  whoami      who is doing the work' },
        { kind: 'out', text: '  teardown    what the dbt teardown covers' },
        { kind: 'out', text: '  pricing     the offer ladder' },
        { kind: 'out', text: '  fit         who this works best for' },
        { kind: 'out', text: '  studio      about Brilliant Disruptions' },
        { kind: 'out', text: '  contact     book the free 20-minute look' },
        { kind: 'out', text: '  clear       wipe the screen' },
        { kind: 'out', text: '  exit        close the terminal (or press Esc)' },
      ];
    case 'whoami':
      return [
        { kind: 'accent', text: 'Michael Wilt — analytics engineer' },
        { kind: 'out', text: 'dbt · Dagster · DLT · Python · Streamlit, in production, daily.' },
        { kind: 'out', text: 'One-week teardowns of dbt projects. Two clients at a time.' },
        { kind: 'out', text: 'Husband · Father · Archer.' },
      ];
    case 'teardown':
      return [
        { kind: 'accent', text: 'The dbt Teardown — one week, $2,500 intro' },
        ...teardownScope.map((s) => ({
          kind: 'out' as const,
          text: `  · ${s.title} — ${s.desc}`,
        })),
        { kind: 'out', text: '' },
        { kind: 'out', text: 'You keep: a prioritized fix list, a recorded walkthrough,' },
        { kind: 'out', text: 'and a 30-day remediation roadmap.' },
      ];
    case 'pricing':
      return tiers.map((t) => ({
        kind: 'out' as const,
        text: `  [${t.num}] ${t.name} — ${t.price}`,
      }));
    case 'fit':
      return [
        { kind: 'accent', text: 'This works best for:' },
        ...idealClient.map((c) => ({ kind: 'out' as const, text: `  · ${c}` })),
        { kind: 'out', text: '' },
        { kind: 'out', text: 'Less than a year of dbt in prod? Probably not worth paying me yet.' },
      ];
    case 'studio':
      return [
        { kind: 'accent', text: 'Brilliant Disruptions — AI-First Software Studio' },
        { kind: 'out', text: 'Separate entity, run with two partners. Full builds live there.' },
        { kind: 'out', text: 'https://brilliantdisruptions.com' },
      ];
    case 'contact':
      return [
        { kind: 'out', text: `email: ${EMAIL}` },
        { kind: 'out', text: 'Ask for the free 20-minute look. Replies within 24h.' },
        ...socials.map((s) => ({ kind: 'out' as const, text: `  ${s.label}: ${s.href}` })),
      ];
    case 'sudo':
    case 'sudo su':
      return [{ kind: 'out', text: 'nice try. this incident will be reported (to my kids).' }];
    case 'dbt run':
      return [{ kind: 'out', text: 'Completed successfully. (in 4 minutes. we should talk.)' }];
    case '':
      return [];
    default:
      return [{ kind: 'out', text: `command not found: ${cmd} — try 'help'` }];
  }
}

export default function Terminal() {
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>(BANNER);
  const [value, setValue] = useState('');
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const inField = ['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName);
      if (e.key === '/' && !open && !inField) {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight });
  }, [lines]);

  const submit = () => {
    const cmd = value.trim().toLowerCase();
    if (cmd === 'exit') {
      setOpen(false);
      setValue('');
      return;
    }
    if (cmd === 'clear') {
      setLines([]);
      setValue('');
      return;
    }
    setLines((prev) => [...prev, { kind: 'cmd', text: value }, ...runCommand(value)]);
    setValue('');
  };

  if (!open) return null;

  return (
    <div id="terminal-overlay" onClick={() => setOpen(false)} role="dialog" aria-label="Site terminal">
      <div id="terminal" onClick={(e) => e.stopPropagation()}>
        <div className="term-titlebar">
          <span className="term-dot" style={{ background: '#ff5f57' }} />
          <span className="term-dot" style={{ background: '#febc2e' }} />
          <span className="term-dot" style={{ background: '#28c840' }} />
          <span style={{ marginLeft: 8 }}>guest@michaelwilt — ~</span>
        </div>
        <div className="term-body" ref={bodyRef}>
          {lines.map((l, i) => (
            <div key={i} className={`term-line ${l.kind}`}>
              {l.text}
            </div>
          ))}
        </div>
        <div className="term-input-row">
          <span className="term-prompt">➜ ~</span>
          <input
            id="term-input"
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            autoComplete="off"
            spellCheck={false}
            aria-label="Terminal command input"
          />
          <span className="term-hint">esc to close</span>
        </div>
      </div>
    </div>
  );
}
