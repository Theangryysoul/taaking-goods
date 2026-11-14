import { Link, Route, Routes, useLocation } from "react-router-dom";
import { ArrowUpRight } from "@phosphor-icons/react";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import Cursor from "./components/Cursor";
import SmoothScroll from "./components/SmoothScroll";
import Wordmark from "./components/Wordmark";
import { site } from "./config";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Product from "./pages/Product";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Shipping from "./pages/Shipping";
import NotFound from "./pages/NotFound";

export default function App() {
  const location = useLocation();

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <SmoothScroll />
      <Cursor />
      <Nav />

      <main id="main" className="site-main" tabIndex={-1}>
        <div className="page" key={location.pathname}>
          <div className="site-brand">
            <Link
              to="/"
              className="site-logo"
              aria-label={`${site.name} home`}
            >
              <Wordmark wordmark={site.wordmark} />
            </Link>

            <Link to="/shop" className="site-tagline">
              <span className="caption-5 site-tagline__text">
                Hallmarked gold and silver, hand poured resin.
              </span>
              <span className="caption-3 site-tagline__cta">
                Tap to view the catalogue
                <ArrowUpRight size={13} weight="regular" aria-hidden="true" />
              </span>
            </Link>
          </div>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop />} />
            <Route path="/shop/:slug" element={<Product />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
      </main>

      <Footer />
      <CartDrawer />
    </>
  );
}
