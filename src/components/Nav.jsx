import { useEffect, useRef, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import { ShoppingBag, ArrowUpRight, EnvelopeSimple, WhatsappLogo } from "@phosphor-icons/react";
import Wordmark from "./Wordmark";
import { useCart } from "../context/CartContext";
import { hasWhatsApp, site, whatsappUrl } from "../config";
import { startScroll, stopScroll } from "../lib/scroll";

const links = [
  { to: "/shop", label: "Shop" },
  { to: "/about", label: "Studio" },
  { to: "/contact", label: "Contact" },
];

export default function Nav() {
  const { count, openCart } = useCart();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const menuRef = useRef(null);
  const toggleRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 981px)");
    const onChange = () => {
      if (desktop.matches) setOpen(false);
    };
    desktop.addEventListener("change", onChange);
    return () => desktop.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (!open) return undefined;

    previousFocus.current = document.activeElement;
    stopScroll();

    const main = document.querySelector("main");
    const footer = document.querySelector(".site-footer");
    if (main) main.inert = true;
    if (footer) footer.inert = true;

    const focusTimer = window.setTimeout(() => {
      menuRef.current?.querySelector("a")?.focus({ preventScroll: true });
    }, 80);

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", onKeyDown);
      if (main) main.inert = false;
      if (footer) footer.inert = false;
      startScroll();
    };
  }, [open]);

  const closeMenu = () => setOpen(false);

  const openBag = () => {
    setOpen(false);
    window.setTimeout(openCart, 140);
  };

  return (
    <header className="site-nav">
      <div className={`nav-pill${open ? " is-open" : ""}`}>
        <Link to="/" className="nav-brand" onClick={closeMenu} aria-label="Taaking Goods home">
          <Wordmark wordmark={site.wordmark} />
        </Link>

        <nav className="nav-links" aria-label="Primary">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `nav-link${isActive ? " is-active" : ""}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="nav-actions">
          <button
            type="button"
            className="nav-bag"
            onClick={openBag}
            aria-label={`Open bag, ${count ? `${count} items` : "empty"}`}
          >
            <ShoppingBag size={17} weight="regular" aria-hidden="true" />
            <span className="nav-bag__label">Bag</span>
            <span className={`nav-bag__count${count ? " has-items" : ""}`} aria-hidden="true">
              {count}
            </span>
          </button>

          <button
            ref={toggleRef}
            type="button"
            className={`icon-btn menu-toggle${open ? " is-open" : ""}`}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => setOpen((value) => !value)}
          >
            <span className="menu-toggle__lines" aria-hidden="true">
              <span />
              <span />
            </span>
          </button>
        </div>
      </div>

      <div
        id="site-menu"
        ref={menuRef}
        className={`mobile-menu${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!open}
        inert={!open}
      >
        <div className="mobile-menu__inner">
          <p className="eyebrow">Menu</p>

          <nav className="mobile-menu__links" aria-label="Mobile">
            {links.map((link, index) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `mobile-menu__link${isActive ? " is-active" : ""}`
                }
                style={{ "--item": index }}
              >
                <span className="mobile-menu__index">0{index + 1}</span>
                <span className="mobile-menu__label">{link.label}</span>
                <ArrowUpRight size={24} weight="light" aria-hidden="true" />
              </NavLink>
            ))}
          </nav>

          <div className="mobile-menu__foot">
            <p className="body-5">
              Hand poured resin objects, made in small batches in India.
            </p>
            <div className="mobile-menu__contact">
              <a href={`mailto:${site.email}`} className="mobile-menu__contact-link">
                <EnvelopeSimple size={16} aria-hidden="true" />
                {site.email}
              </a>
              {hasWhatsApp() && (
                <a
                  href={whatsappUrl("Hello Taaking Goods, I have a question.")}
                  target="_blank"
                  rel="noreferrer"
                  className="mobile-menu__contact-link"
                >
                  <WhatsappLogo size={16} aria-hidden="true" />
                  WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
