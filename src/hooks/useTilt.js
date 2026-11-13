import { useEffect, useRef } from "react";

export function useTilt(max = 4.5) {
  const ref = useRef(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduce) return undefined;

    let frame = 0;
    let targetX = 0;
    let targetY = 0;

    const apply = () => {
      frame = 0;
      element.style.setProperty("--tilt-x", `${targetX}deg`);
      element.style.setProperty("--tilt-y", `${targetY}deg`);
    };

    const onMove = (event) => {
      const rect = element.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      targetX = (0.5 - py) * max * 2;
      targetY = (px - 0.5) * max * 2;
      if (!frame) frame = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      targetX = 0;
      targetY = 0;
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(apply);
    };

    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerleave", onLeave);

    return () => {
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerleave", onLeave);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [max]);

  return ref;
}
