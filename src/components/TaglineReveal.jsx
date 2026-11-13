import { useEffect, useRef } from "react";

export default function TaglineReveal({ text, label }) {
  const ref = useRef(null);
  const words = text.split(" ");

  useEffect(() => {
    const root = ref.current;
    if (!root) return undefined;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const spans = Array.from(root.querySelectorAll(".tag-line__word"));

    if (reduce) {
      spans.forEach((span) => span.classList.add("is-lit"));
      return undefined;
    }

    let frame = 0;

    const paint = () => {
      frame = 0;
      const trigger = window.innerHeight * 0.78;
      spans.forEach((span) => {
        const rect = span.getBoundingClientRect();
        if (rect.top < trigger) span.classList.add("is-lit");
      });
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };

    paint();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="tagline" ref={ref}>
      {label && <p className="eyebrow tagline__label">{label}</p>}
      <p className="tagline__text heading-3">
        {words.map((word, index) => (
          <span className="tag-line__word" key={`${word}-${index}`}>
            {word}
            {index < words.length - 1 ? " " : ""}
          </span>
        ))}
      </p>
    </div>
  );
}
