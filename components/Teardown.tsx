import { teardownScope, deliverables } from '@/lib/data';

export default function Teardown() {
  return (
    <section className="section scrim" id="scope">
      <div className="container">
        <p className="section-label mono">{'// INSIDE THE TEARDOWN'}</p>
        <h2 className="section-title reveal">
          Six passes over your project<span className="grad-text">, then three things you keep.</span>
        </h2>
        <p className="section-intro reveal">
          A week of me reading your dbt project the way the person who inherits it will have to —
          except I write down what I find.
        </p>

        <div className="scope-grid">
          {teardownScope.map((s, i) => (
            <div key={s.title} className="scope-card reveal">
              <span className="scope-num mono">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="scope-title">{s.title}</h3>
              <p className="scope-desc">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="deliver-block">
          <p className="section-label mono">{'// WHAT LANDS IN YOUR INBOX'}</p>
          <div className="deliver-grid">
            {deliverables.map((d) => (
              <div key={d.title} className="deliver-card reveal">
                <h3 className="deliver-title">{d.title}</h3>
                <p className="deliver-desc">{d.desc}</p>
              </div>
            ))}
          </div>
          <p className="deliver-note reveal">
            Findings come with numbers attached wherever the warehouse will tell me — what a model
            costs to run today, and what it should cost instead.
          </p>
        </div>
      </div>
    </section>
  );
}
