import { idealClient, painSignals } from '@/lib/data';

export default function WhoItsFor() {
  return (
    <section className="section scrim" id="fit">
      <div className="container">
        <p className="section-label mono">{'// IS THIS YOU'}</p>
        <h2 className="section-title reveal">If any of this sounds familiar, we should talk.</h2>
        <div className="fit-grid">
          <div className="fit-col">
            <p className="fit-heading mono">SAID OUT LOUD, USUALLY IN A STANDUP</p>
            <ul className="pain-list">
              {painSignals.map((p) => (
                <li key={p} className="pain-item reveal">
                  <span className="pain-quote" aria-hidden="true">
                    “
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="fit-col">
            <p className="fit-heading mono">WHERE THIS WORKS BEST</p>
            <ul className="fit-list">
              {idealClient.map((c) => (
                <li key={c} className="fit-item reveal">
                  <span className="fit-tick" aria-hidden="true">
                    ✓
                  </span>
                  {c}
                </li>
              ))}
            </ul>
            <p className="fit-note reveal">
              Under a year of dbt in production and there usually isn&apos;t enough debt yet to be
              worth paying me. I&apos;ll tell you that on the free call rather than sell you
              something.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
