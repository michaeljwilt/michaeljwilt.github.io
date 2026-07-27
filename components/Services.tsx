import { services } from '@/lib/data';

export default function Services() {
  return (
    <section className="section" id="work">
      <div className="container">
        <p className="section-label mono scramble" data-text="// WORK WITH ME">
          {'// WORK WITH ME'}
        </p>
        <h2 className="section-title reveal">Side work I take on</h2>
        <p className="section-intro reveal">
          I help small businesses and busy people get real leverage from technology — without the
          agency price tag or the buzzword soup.
        </p>
        <div className="service-list">
          {services.map((s) => (
            <a key={s.num} href="#contact" className="service-row anchor reveal" data-cursor="LET'S GO">
              <span className="service-num mono">{s.num}</span>
              <span className="service-name">{s.name}</span>
              <span className="service-desc">{s.desc}</span>
              <span className="service-arrow" aria-hidden="true">
                →
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
