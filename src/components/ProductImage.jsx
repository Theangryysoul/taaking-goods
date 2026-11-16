import { useState } from "react";
import ProductArt from "./ProductArt";
import { cloudinaryImageUrl } from "../lib/cloudinary";

function ImageWithFallback({ product, width, eager, label }) {
  const [failed, setFailed] = useState(false);
  const src = cloudinaryImageUrl(product, width);
  if (!src || failed) return <ProductArt product={product} label={label || product.name} />;
  return <img src={src} alt={label || product.name} loading={eager ? "eager" : "lazy"} decoding="async" onError={() => setFailed(true)} />;
}

export default function ProductImage({ product, width = 800, eager = false, label }) {
  return <ImageWithFallback key={`${product.imagePublicId || product.image || "art"}:${product.imageVersion || ""}`} product={product} width={width} eager={eager} label={label} />;
}
