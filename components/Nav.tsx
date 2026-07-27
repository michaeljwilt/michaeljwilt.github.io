'use client';

import { useState } from 'react';

const links = [
  { href: '#about', label: 'About' },
  { href: '#work', label: 'Work With Me' },
  { href: '#projects', label: 'Projects' },
  { href: '#studio', label: 'Studio' },
];

export default function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <nav id="nav">
      <div id="scroll-progress" aria-hidden="true" />
      <div className="nav-container">
        <a href="#hero" className="nav-logo anchor" aria-label="Michael Wilt home" data-magnetic>
          <span className="logo-mark">MW</span>
          <span className="logo-full">Michael Wilt</span>
        </a>
        <div className="nav-links">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="nav-link anchor" data-cursor="">
              {l.label}
            </a>
          ))}
        </div>
        <a href="#contact" className="nav-cta btn btn-ghost btn-sm anchor" data-magnetic>
          Say Hello
        </a>
        <button
          className="nav-hamburger"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
      <div className={`nav-mobile-menu${open ? ' open' : ''}`}>
        {[...links, { href: '#contact', label: 'Say Hello' }].map((l) => (
          <a key={l.href} href={l.href} className="mobile-link anchor" onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
