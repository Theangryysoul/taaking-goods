import { useEffect, useRef, useState } from "react";

export default function Reveal({
  children,
  delay = 0,
  className = "",
  as: Tag = "div",
  ...rest
}) {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    if (!("IntersectionObserver" in window)) {
      setSeen(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal${seen ? " is-visible" : ""}${className ? ` ${className}` : ""}`}
      style={{ "--reveal-delay": `${delay}ms` }}
      {...rest}
    >
      {children}
    </Tag>
  );
}
