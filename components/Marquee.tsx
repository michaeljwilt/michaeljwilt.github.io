export default function Marquee({ items, direction }: { items: string; direction: 1 | -1 }) {
  return (
    <div
      className={`marquee${direction < 0 ? ' marquee-reverse' : ''}`}
      data-marquee-speed={direction}
      aria-hidden="true"
    >
      <div className="marquee-track">
        <span>{items}</span>
        <span>{items}</span>
      </div>
    </div>
  );
}
