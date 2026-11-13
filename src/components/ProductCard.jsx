import { Link } from "react-router-dom";
import { ArrowUpRight } from "@phosphor-icons/react";
import ResinArt from "./ResinArt";
import { useTilt } from "../hooks/useTilt";
import { formatPrice } from "../lib/format";

export default function ProductCard({ product }) {
  const tiltRef = useTilt(3.2);

  return (
    <article className="product-card" ref={tiltRef} data-cursor="View">
      <Link
        className="product-card__link"
        to={`/shop/${product.slug}`}
        aria-label={`${product.name}, ${formatPrice(product.price)}`}
      >
        <div className="product-card__media">
          {product.image ? (
            <img src={product.image} alt={product.name} loading="lazy" decoding="async" />
          ) : (
            <ResinArt shape={product.art.shape} palette={product.art.palette} />
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
