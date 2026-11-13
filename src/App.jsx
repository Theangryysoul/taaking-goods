import { Route, Routes, useLocation } from "react-router-dom";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import Cursor from "./components/Cursor";
import SmoothScroll from "./components/SmoothScroll";
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
