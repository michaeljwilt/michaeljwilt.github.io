import { tiers, BOOK_HREF } from '@/lib/data';

export default function Offer() {
  return (
    <section className="section scrim" id="work">
      <div className="container">
        <p className="section-label mono">{'// THE OFFER'}</p>
        <h2 className="section-title reveal">Start small. Scale only if it&apos;s working.</h2>
        <p className="section-intro reveal">
          Four steps, each one optional. Nothing is open-ended, everything is fixed price, and you
          never have to guess what the next stage costs.
        </p>
        <div className="tier-list">
          {tiers.map((t) => (
            <div key={t.num} className={`tier-row reveal${t.featured ? ' is-featured' : ''}`}>
              <span className="tier-num mono">{t.num}</span>
              <div className="tier-copy">
                <div className="tier-head">
                  <h3 className="tier-name">{t.name}</h3>
                  {t.featured && <span className="tier-flag mono">START HERE</span>}
                </div>
                <p className="tier-desc">{t.desc}</p>
              </div>
              <span className="tier-price mono">{t.price}</span>
            </div>
          ))}
        </div>
        <div className="offer-cta reveal">
          <a href={BOOK_HREF} className="btn btn-solid" data-magnetic>
            Book the free look
          </a>
          <p className="offer-note mono">
            Fixed price, never hourly · 50% up front · scope in writing before anything starts
          </p>
        </div>
      </div>
    </section>
  );
}
