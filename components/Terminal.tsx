'use client';

import { useEffect, useRef, useState } from 'react';
import { projects, services, socials, EMAIL } from '@/lib/data';

type Line = { kind: 'cmd' | 'out' | 'accent'; text: string };

const BANNER: Line[] = [
  { kind: 'accent', text: 'mw-shell v1.0 — the AI builder’s site is itself an AI artifact.' },
  { kind: 'out', text: "Type 'help' to see what I can do. Esc to close." },
];

function runCommand(raw: string): Line[] {
  const cmd = raw.trim().toLowerCase();
  switch (cmd) {
    case 'help':
      return [
        { kind: 'out', text: 'available commands:' },
        { kind: 'out', text: '  whoami      who is this guy' },
        { kind: 'out', text: '  projects    things I have built' },
        { kind: 'out', text: '  work        side work I take on' },
        { kind: 'out', text: '  socials     where to find me' },
        { kind: 'out', text: '  studio      about Brilliant Disruptions' },
        { kind: 'out', text: '  contact     get in touch' },
        { kind: 'out', text: '  clear       wipe the screen' },
        { kind: 'out', text: '  exit        close the terminal (or press Esc)' },
      ];
    case 'whoami':
      return [
        { kind: 'accent', text: 'Michael Wilt' },
        { kind: 'out', text: 'Data analyst turned AI-first builder.' },
        { kind: 'out', text: 'Husband · Father · Archer · Data Enthusiast' },
        { kind: 'out', text: 'I build useful things with data, code, and AI.' },
      ];
    case 'projects':
      return projects.map((p) => ({
        kind: 'out' as const,
        text: `  ${p.title}  —  ${p.href}`,
      }));
    case 'work':
      return services.map((s) => ({
        kind: 'out' as const,
        text: `  [${s.num}] ${s.name} — ${s.desc}`,
      }));
    case 'socials':
      return socials.map((s) => ({ kind: 'out' as const, text: `  ${s.label}: ${s.href}` }));
    case 'studio':
      return [
        { kind: 'accent', text: 'Brilliant Disruptions — AI-First Software Studio' },
        { kind: 'out', text: 'Building the software the world doesn’t know it needs yet.' },
        { kind: 'out', text: 'https://brilliantdisruptions.com' },
      ];
    case 'contact':
      return [
        { kind: 'out', text: `email: ${EMAIL}` },
        { kind: 'out', text: 'Replies within 24h. Usually faster.' },
      ];
    case 'sudo':
    case 'sudo su':
      return [{ kind: 'out', text: 'nice try. this incident will be reported (to my kids).' }];
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
