export default function About() {
  return (
    <section className="section scrim" id="about">
      <div className="container">
        <p className="section-label mono">{'// WHO IS DOING THE WORK'}</p>
        <div className="about-grid">
          <div className="about-photo-wrap reveal" id="photo-tilt">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/michael.jpg"
              alt="Michael Wilt"
              className="about-photo"
              width={280}
              height={280}
              loading="lazy"
            />
            <div className="photo-ring" aria-hidden="true" />
          </div>
          <div className="about-copy">
            <h2 className="section-title reveal">
              I do this work <span className="grad-text">every day</span>, at volume.
            </h2>
            <p className="reveal">
              I&apos;m an analytics engineer. dbt, Dagster, DLT, Python, Streamlit — the modern
              stack, in production, against real data volume. Not a course I took. The job I do.
            </p>
            <p className="reveal">
              Most dbt consultants are dbt-only and wave their hands at orchestration and
              ingestion. I cover the whole pipeline, and I can speak to what it takes to get a
              warehouse genuinely ready for AI work on top of it — which is mostly the unglamorous
              part: structure, tests, and lineage you can trust.
            </p>
            <p className="reveal">
              You get me. Not an account manager, not a junior doing the actual reading. One
              person, one invoice, two engagements at a time — so the work stays sharp.
            </p>
            <div className="stats-row">
              <div className="stat reveal">
                <span className="stat-num mono">1</span>
                <span className="stat-label">week per teardown</span>
              </div>
              <div className="stat reveal">
                <span className="stat-num mono">2</span>
                <span className="stat-label">clients at a time</span>
              </div>
              <div className="stat reveal">
                <span className="stat-num mono">0</span>
                <span className="stat-label">hourly billing</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
