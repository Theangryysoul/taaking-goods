import { useEffect, useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";
import Lenis from "lenis";
import { scrollToElement, scrollToTop, setLenis } from "../lib/scroll";

export default function SmoothScroll() {
  const location = useLocation();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    const lenis = new Lenis({
      lerp: 0.09,
      wheelMultiplier: 1,
      touchMultiplier: 1.3,
      smoothWheel: true,
    });

    setLenis(lenis);
    document.documentElement.classList.add("lenis");

    let frame = 0;
    const raf = (time) => {
      lenis.raf(time);
      frame = requestAnimationFrame(raf);
    };
    frame = requestAnimationFrame(raf);

    const onAnchorClick = (event) => {
      const link = event.target.closest('a[href^="#"]');
      if (!link || link.classList.contains("skip-link")) return;
      const hash = link.getAttribute("href");
      if (!hash || hash === "#") return;
      const target = document.querySelector(hash);
      if (!target) return;
      event.preventDefault();
      scrollToElement(target);
      window.history.replaceState(null, "", hash);
    };

    document.addEventListener("click", onAnchorClick);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("click", onAnchorClick);
      lenis.destroy();
      setLenis(null);
      document.documentElement.classList.remove("lenis");
    };
  }, []);

  useLayoutEffect(() => {
    if (location.hash) {
      const id = location.hash;
      const timer = window.setTimeout(() => {
        const target = document.querySelector(id);
        if (target) scrollToElement(target);
      }, 120);
      return () => window.clearTimeout(timer);
    }
    scrollToTop(true);
    return undefined;
  }, [location.pathname, location.hash]);

  return null;
}
