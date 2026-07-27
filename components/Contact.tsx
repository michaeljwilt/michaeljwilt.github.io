import { socials, EMAIL, BOOK_HREF } from '@/lib/data';

export default function Contact() {
  return (
    <section className="section scrim" id="contact">
      <div className="container contact-inner">
        <p className="section-label mono">{'// START HERE'}</p>
        <h2 className="section-title reveal">
          Twenty minutes. I&apos;ll tell you what I see.
        </h2>
        <p className="section-intro reveal">
          No deck, no pitch, no obligation. Bring your dbt project or your warehouse bill and
          I&apos;ll name the first two or three real problems out loud. If there&apos;s nothing
          worth paying me for, I&apos;ll say that too.
        </p>
        <a href={BOOK_HREF} className="btn btn-solid btn-lg reveal" data-magnetic>
          Book the free 20-minute look
        </a>
        <p className="contact-alt reveal mono">
          or just email me —{' '}
          <a href={`mailto:${EMAIL}`} className="inline-link">
            {EMAIL}
          </a>
          <br />
          replies within 24 hours, usually faster
        </p>
        <div className="social-row reveal">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="social-link mono"
              data-magnetic
            >
              {s.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
