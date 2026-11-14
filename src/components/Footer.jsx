import { Link } from "react-router-dom";
import { ArrowUp, FacebookLogo, InstagramLogo } from "@phosphor-icons/react";
import Wordmark from "./Wordmark";
import { site } from "../config";
import { scrollToTop } from "../lib/scroll";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-top">
          <div className="footer-brand">
            <Link to="/" className="footer-brand__link" aria-label="Taaking Goods home">
              <Wordmark wordmark={site.wordmark} />
            </Link>
            <p className="body-3 footer-brand__copy">
              Hand poured resin objects and hallmarked gold and silver jewellery, made in small
              batches in India.
            </p>
            <div className="footer-contact">
              <a href={`mailto:${site.email}`}>{site.email}</a>
            </div>
          </div>

          <nav className="footer-col" aria-label="Shop">
            <h2 className="caption-3">Shop</h2>
            <ul>
              <li><Link to="/shop">All pieces</Link></li>
              <li><Link to="/shop?category=Tableware">Tableware</Link></li>
              <li><Link to="/shop?category=Decor">Decor</Link></li>
              <li><Link to="/shop?category=Gifting">Gifting</Link></li>
              <li><Link to="/shop?category=Jewellery">Jewellery</Link></li>
            </ul>
          </nav>

          <nav className="footer-col" aria-label="Studio">
            <h2 className="caption-3">Studio</h2>
            <ul>
              <li><Link to="/about">About</Link></li>
              <li><Link to="/about#care">Care guide</Link></li>
              <li><Link to="/contact">Contact</Link></li>
              <li><Link to="/shop">The collection</Link></li>
            </ul>
          </nav>

          <nav className="footer-col" aria-label="Help">
            <h2 className="caption-3">Help</h2>
            <ul>
              <li><Link to="/shipping">Shipping and returns</Link></li>
              <li><Link to="/privacy">Privacy</Link></li>
              <li><Link to="/terms">Terms</Link></li>
              <li><Link to="/contact">Custom orders</Link></li>
            </ul>
          </nav>
        </div>

        <p className="footer-wordmark" aria-hidden="true">{site.wordmark}</p>

        <div className="footer-bottom">
          <p className="caption-2">© 2026 {site.name}. All rights reserved.</p>

          <div className="footer-social">
            {site.instagram && (
              <a
                href={site.instagram}
                target="_blank"
                rel="noreferrer"
                aria-label="Taaking Goods on Instagram"
                className="footer-social__link"
              >
                <InstagramLogo size={18} weight="light" aria-hidden="true" />
                <span className="footer-social__label">Instagram</span>
              </a>
            )}
            {site.facebook && (
              <a
                href={site.facebook}
                target="_blank"
                rel="noreferrer"
                aria-label="Taaking Goods on Facebook"
                className="footer-social__link"
              >
                <FacebookLogo size={18} weight="light" aria-hidden="true" />
                <span className="footer-social__label">Facebook</span>
              </a>
            )}
          </div>

          <p className="caption-2">Made in {site.country}.</p>
          <button
            type="button"
            className="footer-top-link"
            onClick={() => scrollToTop(false)}
          >
            Back to top
            <ArrowUp size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </footer>
  );
}
