import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight, ShoppingBag } from "@phosphor-icons/react";
import ResinArt from "../components/ResinArt";
import Accordion from "../components/Accordion";
import Quantity from "../components/Quantity";
import Reveal from "../components/Reveal";
import ProductCard from "../components/ProductCard";
import SectionHead from "../components/SectionHead";
import NotFound from "./NotFound";
import { getProduct, getRelated } from "../data/catalog";
import { formatPrice } from "../lib/format";
import { usePageMeta } from "../hooks/usePageMeta";
import { useCart } from "../context/CartContext";
import { hasWhatsApp, whatsappUrl } from "../config";

function ProductView({ product }) {
  const [qty, setQty] = useState(1);
  const { add, openCart } = useCart();
  const related = getRelated(product, 3);

  usePageMeta({
    title: product.name,
    description: product.summary,
    path: `/shop/${product.slug}`,
    image: product.image,
  });

  const addToBag = () => {
    add(product, qty);
    openCart();
  };

  const questionLink = hasWhatsApp()
    ? whatsappUrl(`Hello Taaking Goods, I have a question about the ${product.name}.`)
    : "/contact";

  return (
    <>
      <section className="product-page">
        <div className="container">
          <nav className="breadcrumb" aria-label="Breadcrumb">
            <Link to="/shop">Shop</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{product.name}</span>
          </nav>

          <div className="product-view">
            <div className="product-view__media-wrap">
              <Reveal className="product-view__media">
                {product.image ? (
                  <img src={product.image} alt={product.name} />
                ) : (
                  <ResinArt
                    shape={product.art.shape}
                    palette={product.art.palette}
                    label={`${product.name}, a hand poured resin piece`}
                  />
                )}
              </Reveal>
              <p className="caption-2 product-view__caption">
                Hand poured, so tone and pattern vary from piece to piece.
              </p>
            </div>

            <div className="product-view__info">
              <Reveal delay={60}>
                <p className="eyebrow">{product.category}</p>
                <h1 className="heading-2 product-view__title">{product.name}</h1>
                <div className="product-view__price-row">
                  <p className="title-1">{formatPrice(product.price)}</p>
                  <p className="caption-2">Confirmed on WhatsApp before payment.</p>
                </div>

                <p className="body-2 product-view__summary">{product.summary}</p>
                <p className="body-3 product-view__description">{product.description}</p>
              </Reveal>

              <Reveal delay={120} className="product-view__buy">
                <Quantity
                  value={qty}
                  onChange={setQty}
                  label={`Quantity of ${product.name}`}
                />
                <button type="button" className="btn btn--primary product-add" onClick={addToBag}>
                  <ShoppingBag size={17} weight="regular" aria-hidden="true" />
                  Add to bag
                </button>
              </Reveal>

              <Reveal delay={160} className="product-view__ask">
                <a
                  className="link-arrow"
                  href={questionLink}
                  target={hasWhatsApp() ? "_blank" : undefined}
                  rel={hasWhatsApp() ? "noreferrer" : undefined}
                >
                  Ask about this piece
                  <ArrowUpRight size={15} weight="regular" aria-hidden="true" />
                </a>
              </Reveal>

              <Reveal delay={200} className="product-view__details">
                <div className="product-block">
                  <h2 className="title-3 product-block__title">Details</h2>
                  <ul className="spec-list">
                    {product.details.map((detail) => (
                      <li className="body-5" key={detail}>{detail}</li>
                    ))}
                  </ul>
                </div>

                <Accordion
                  tight
                  name={`product-${product.id}`}
                  items={[
                    {
                      title: "Care",
                      copy: "Wipe with a soft, slightly damp cloth. Keep the piece out of direct sun for long stretches and away from heat. A care card travels with every order.",
                    },
                    {
                      title: "Delivery and returns",
                      copy: "Orders are packed and shipped across India. Shipping is quoted by pincode when we confirm on WhatsApp. If a piece arrives damaged, send a photo within 48 hours and we will make it right.",
                    },
                  ]}
                />
              </Reveal>

              <Reveal delay={220}>
                <Link to="/shop" className="back-link">
                  <ArrowLeft size={15} weight="regular" aria-hidden="true" />
                  Back to the collection
                </Link>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      <section className="section product-related">
        <div className="container">
          <Reveal>
            <SectionHead eyebrow="More from the shelf" title="You may also like." />
          </Reveal>
          <div className="product-grid">
            {related.map((item, index) => (
              <Reveal key={item.id} delay={index * 70}>
                <ProductCard product={item} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

export default function Product() {
  const { slug } = useParams();
  const product = getProduct(slug);

  if (!product) return <NotFound />;
  return <ProductView product={product} />;
}
