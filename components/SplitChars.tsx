// Server-renderable character splitter: no CLS, no hydration cost.
// GSAP animates the resulting .char spans from MotionRoot.
export default function SplitChars({ text }: { text: string }) {
  return (
    <>
      <span className="sr-only-label" aria-label={text} />
      {[...text].map((ch, i) => (
        <span key={i} className="char" aria-hidden="true">
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </>
  );
}
