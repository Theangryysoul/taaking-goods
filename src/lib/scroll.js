let lenis = null;

export function setLenis(instance) {
  lenis = instance;
}

export function stopScroll() {
  lenis?.stop();
  document.documentElement.classList.add("scroll-locked");
}

export function startScroll() {
  lenis?.start();
  document.documentElement.classList.remove("scroll-locked");
}

export function scrollToTop(immediate = true) {
  if (lenis) {
    lenis.scrollTo(0, { immediate });
    return;
  }
  window.scrollTo({ top: 0, behavior: immediate ? "auto" : "smooth" });
}

export function scrollToElement(target, offset = -96) {
  const element = typeof target === "string" ? document.querySelector(target) : target;
  if (!element) return;
  if (lenis) {
    lenis.scrollTo(element, { offset, duration: 1.2 });
    return;
  }
  const top = element.getBoundingClientRect().top + window.scrollY + offset;
  window.scrollTo({ top, behavior: "smooth" });
}
