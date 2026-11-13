import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowUpRight } from "@phosphor-icons/react";
import Reveal from "../components/Reveal";
import ProductCard from "../components/ProductCard";
import ResinArt from "../components/ResinArt";
import { categories, products } from "../data/catalog";
import { usePageMeta } from "../hooks/usePageMeta";

export default function Shop() {
  usePageMeta({
    title: "Shop",
    description:
      "Browse hand poured resin coasters, trays, vases, jewellery, and gifts from the Taaking Goods studio in India. Every order is confirmed on WhatsApp.",
    path: "/shop",
  });

  const [params, setParams] = useSearchParams();
  const requested = params.get("category");
  const category = categories.includes(requested) ? requested : "All";

  const shown = useMemo(
    () =>
      category === "All"
        ? products
        : products.filter((product) => product.category === category),
    [category],
  );

  const chooseCategory = (next) => {
    const nextParams = new URLSearchParams(params);
    if (next === "All") nextParams.delete("category");
    else nextParams.set("category", next);
    setParams(nextParams, { replace: true });
  };

  return (
    <>
      <section className="page-head shop-head">
        <div className="container">
          <p className="eyebrow">Shop</p>
          <div className="shop-head__row">
            <h1 className="heading-1 page-title">The studio shelf.</h1>
            <p className="body-2 shop-head__intro">
              Ready pieces and small batch pours. Every order is confirmed on WhatsApp before
              payment, so you know the price and the timeline first.
            </p>
          </div>

          <div className="shop-tools">
            <div className="filters" role="group" aria-label="Filter pieces by category">
              {categories.map((item) => (
                <button
                  key={item}
                  type="button"
                  className={`filter${category === item ? " is-active" : ""}`}
                  aria-pressed={category === item}
                  onClick={() => chooseCategory(item)}
                >
                  {item}
                </button>
              ))}
            </div>
            <p className="caption-2 shop-count" aria-live="polite">
              {shown.length} {shown.length === 1 ? "piece" : "pieces"}
            </p>
          </div>
        </div>
      </section>

      <section className="section shop-list">
        <div className="container">
          {shown.length > 0 ? (
            <div className="product-grid" key={category}>
              {shown.map((product, index) => (
                <Reveal key={product.id} delay={(index % 3) * 70}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state__art">
                <ResinArt shape="loop" palette="sage" withBackground={false} />
              </div>
              <h2 className="heading-4">Nothing in this pour yet.</h2>
              <p className="body-3">
                This shelf is between batches. Show every piece, or ask us what is curing in the
                studio.
              </p>
              <button type="button" className="btn btn--primary" onClick={() => chooseCategory("All")}>
                Show all pieces
                <ArrowRight size={16} weight="regular" aria-hidden="true" />
              </button>
            </div>
          )}

          <div className="shop-note">
            <p className="body-5">
              Prices are confirmed on WhatsApp before payment. Shipping is quoted by pincode.
            </p>
            <Link className="link-arrow" to="/contact">
              Ask about a custom pour
              <ArrowUpRight size={15} weight="regular" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
