import { socials, EMAIL } from '@/lib/data';
import SplitChars from './SplitChars';

export default function Contact() {
  return (
    <section className="section" id="contact">
      <div className="container contact-inner">
        <p className="section-label mono">
          {'// CONTACT'}
        </p>
        <h2 className="section-title reveal">Let&apos;s build something.</h2>
        <p className="section-intro reveal">
          Have a project in mind, a question, or just want to talk data, AI, or archery? My inbox
          is open.
        </p>
        <a href={`mailto:${EMAIL}`} className="contact-email reveal" aria-label={EMAIL} data-cursor="SEND ✉">
          <SplitChars text={EMAIL} />
        </a>
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
