import { useEffect } from "react";
import { site } from "../config";

function setMeta(attribute, key, value) {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", value);
}

export function usePageMeta({ title, description, path = "", noindex = false, image = null }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${site.name}` : `${site.name} | ${site.tagline}`;
    const metaDescription = description || site.description;
    const url = `${site.domain}${path}`;
    const shareImage = image
      ? image.startsWith("http")
        ? image
        : `${site.domain}${image}`
      : `${site.domain}/og.png`;

    document.title = fullTitle;
    setMeta("name", "description", metaDescription);
    setMeta("name", "robots", noindex ? "noindex, follow" : "index, follow");
    setMeta("property", "og:title", fullTitle);
    setMeta("property", "og:description", metaDescription);
    setMeta("property", "og:url", url);
    setMeta("property", "og:image", shareImage);
    setMeta("name", "twitter:title", fullTitle);
    setMeta("name", "twitter:description", metaDescription);
    setMeta("name", "twitter:image", shareImage);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
  }, [title, description, path, noindex, image]);
}
