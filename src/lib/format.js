export const formatPrice = (price) => {
  if (typeof price !== "number" || !Number.isFinite(price)) return "Price on enquiry";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: Number.isInteger(price) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(price);
};

export const rupeeTotal = (value) => formatPrice(value);
