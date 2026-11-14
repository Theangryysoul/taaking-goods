import { Link } from "react-router-dom";
import { ArrowUpRight } from "@phosphor-icons/react";
import ProductArt from "./ProductArt";
import { useTilt } from "../hooks/useTilt";
import { formatPrice } from "../lib/format";

export default function ProductCard({ product }) {
  const tiltRef = useTilt(3.2);

  return (
    <article className="product-card" ref={tiltRef} data-cursor="View" data-category={product.category}>
      <Link
        className="product-card__link"
        to={`/shop/${product.slug}`}
        aria-label={`${product.name}, ${formatPrice(product.price)}`}
      >
        <div className="product-card__media">
          {product.image ? (
            <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
          ) : (
            <ProductArt product={product} />
          )}
          {product.hallmark && (
            <span className="product-card__badge">
              Hallmarked {product.metal ? product.metal.toLowerCase() : "metal"}
            </span>
          )}
          <span className="product-card__cue" aria-hidden="true">
            <ArrowUpRight size={16} weight="regular" />
          </span>
        </div>

        <div className="product-card__info">
          <div className="product-card__text">
            <p className="caption-4 product-card__category">{product.category}</p>
            <h3 className="title-2 product-card__name">{product.name}</h3>
          </div>
          <p className="body-5 product-card__price">{formatPrice(product.price)}</p>
        </div>
      </Link>
    </article>
  );
}
