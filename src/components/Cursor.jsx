import { useEffect, useRef } from "react";

export default function Cursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const labelRef = useRef(null);

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return undefined;

    const root = document.documentElement;
    const dot = dotRef.current;
    const ring = ringRef.current;
    const label = labelRef.current;
    if (!dot || !ring || !label) return undefined;

    root.classList.add("has-custom-cursor");

    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 2;
    let ringX = targetX;
    let ringY = targetY;
    let frame = 0;

    const loop = () => {
      ringX += (targetX - ringX) * 0.18;
      ringY += (targetY - ringY) * 0.18;
      ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      dot.style.transform = `translate3d(${targetX}px, ${targetY}px, 0) translate(-50%, -50%)`;
      label.style.transform = `translate3d(${targetX + 16}px, ${targetY + 18}px, 0)`;
      frame = requestAnimationFrame(loop);
    };

    const onMove = (event) => {
      targetX = event.clientX;
      targetY = event.clientY;
    };

    const hide = () => {
      ring.classList.add("is-hidden");
      dot.classList.add("is-hidden");
      label.classList.add("is-hidden");
    };

    const show = () => {
      ring.classList.remove("is-hidden");
      dot.classList.remove("is-hidden");
      label.classList.remove("is-hidden");
    };

    const onOver = (event) => {
      const target = event.target.closest(
        "a, button, [data-cursor], summary, input, textarea, select, label",
      );

      if (!target) {
        show();
        ring.classList.remove("is-active", "is-label");
        label.textContent = "";
        return;
      }

      if (target.matches("input, textarea, select")) {
        hide();
        return;
      }

      show();
      ring.classList.add("is-active");
      const copy = target.getAttribute("data-cursor");
      if (copy) {
        label.textContent = copy;
        ring.classList.add("is-label");
        label.classList.remove("is-hidden");
      } else {
        label.textContent = "";
        ring.classList.remove("is-label");
        label.classList.add("is-hidden");
      }
    };

    const onDown = () => ring.classList.add("is-down");
    const onUp = () => ring.classList.remove("is-down");
    const onLeaveWindow = () => hide();

    document.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeaveWindow);
    window.addEventListener("blur", onLeaveWindow);

    frame = requestAnimationFrame(loop);

    return () => {
      root.classList.remove("has-custom-cursor");
      cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeaveWindow);
      window.removeEventListener("blur", onLeaveWindow);
    };
  }, []);

  return (
    <>
      <div className="cursor-ring" ref={ringRef} aria-hidden="true" />
      <div className="cursor-dot" ref={dotRef} aria-hidden="true" />
      <div className="cursor-label" ref={labelRef} aria-hidden="true" />
    </>
  );
}
