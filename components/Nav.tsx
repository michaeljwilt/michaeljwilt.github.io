'use client';

import { useState } from 'react';
import { BOOK_HREF } from '@/lib/data';

const links = [
  { href: '#fit', label: 'Is this you' },
  { href: '#work', label: 'Pricing' },
  { href: '#scope', label: 'The teardown' },
  { href: '#about', label: 'About' },
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
        <a href={BOOK_HREF} className="nav-cta btn btn-solid btn-sm" data-magnetic>
          Book a free look
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
        {links.map((l) => (
          <a key={l.href} href={l.href} className="mobile-link anchor" onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <a href={BOOK_HREF} className="mobile-link" onClick={() => setOpen(false)}>
          Book a free look
        </a>
      </div>
    </nav>
  );
}
