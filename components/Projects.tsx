import { projects } from '@/lib/data';

export default function Projects() {
  return (
    <section className="hsection" id="projects">
      <div className="hpin">
        <div className="container hheader">
          <p className="section-label mono">
            {'// PROJECTS'}
          </p>
          <h2 className="section-title">
            Things I&apos;ve built &amp; explored{' '}
            <span className="hhint mono">— keep scrolling →</span>
          </h2>
        </div>
        <div className="htrack" id="htrack">
          {projects.map((p, i) => (
            <a
              key={p.href}
              className="project tilt"
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              data-cursor="VIEW ↗"
            >
              <div className="project-shine" aria-hidden="true" />
              <div className="project-top mono">
                <span>{p.tag}</span>
                <span className="project-index">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
            </a>
          ))}
          <div className="project project-more-card">
            <p className="mono">MORE ON</p>
            <div className="more-links">
              <a
                href="https://github.com/michaeljwilt"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-link"
                data-cursor="GO ↗"
              >
                GitHub
              </a>
              <a
                href="https://public.tableau.com/app/profile/michaeljwilt"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-link"
                data-cursor="GO ↗"
              >
                Tableau
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
