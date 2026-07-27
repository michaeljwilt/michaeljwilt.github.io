export default function About() {
  return (
    <section className="section" id="about">
      <div className="container">
        <p className="section-label mono scramble" data-text="// ABOUT">
          {'// ABOUT'}
        </p>
        <div className="about-grid">
          <div className="about-photo-wrap reveal" id="photo-tilt">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/michael.png"
              alt="Michael Wilt smiling in a ball cap"
              className="about-photo"
              width={280}
              height={280}
              loading="lazy"
            />
            <div className="photo-ring" aria-hidden="true" />
          </div>
          <div className="about-copy">
            <h2 className="section-title reveal">
              Data analyst turned <span className="grad-text">AI-first builder</span>.
            </h2>
            <p className="reveal">
              I started my career in data — cleaning it, questioning it, and turning it into
              answers people could actually use. These days I take that same curiosity and build
              with it: web apps, automations, and AI-powered tools.
            </p>
            <p className="reveal">
              When I&apos;m not building, I&apos;m with my family or behind a bow. I believe the
              best tools are the ones that quietly disappear into your day and just <em>work</em>.
            </p>
            <div className="stats-row">
              <div className="stat reveal">
                <span className="stat-num mono" data-count="25" data-suffix="+">
                  0
                </span>
                <span className="stat-label">public repos</span>
              </div>
              <div className="stat reveal">
                <span className="stat-num mono" data-count="100" data-suffix="%">
                  0
                </span>
                <span className="stat-label">hand-built</span>
              </div>
              <div className="stat reveal">
                <span className="stat-num mono">∞</span>
                <span className="stat-label">curiosity</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
