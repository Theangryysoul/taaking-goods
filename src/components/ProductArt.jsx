import ResinArt from "./ResinArt";
import JewelleryArt from "./JewelleryArt";

// Picks the right generated artwork for a product. Jewellery uses its own
// metal palette and shapes; everything else uses the resin artwork.
export default function ProductArt({ product, ...props }) {
  if (product.category === "Jewellery") {
    return (
      <JewelleryArt
        shape={product.art.shape}
        palette={product.art.palette}
        {...props}
      />
    );
  }

  return (
    <ResinArt
      shape={product.art.shape}
      palette={product.art.palette}
      {...props}
    />
  );
}
