import { formatPrice } from "./format";

export function buildOrderMessage(lines, fields, subtotal) {
  const itemLines = lines.map(
    (line) => `• ${line.product.name}, qty ${line.qty}, ${formatPrice(line.product.price)}`,
  );

  const total =
    subtotal === null ? "To be confirmed on WhatsApp" : formatPrice(subtotal);

  return [
    "Hello Taaking Goods, I would like to place an order.",
    "",
    ...itemLines,
    "",
    `Subtotal: ${total}`,
    "",
    `Name: ${fields.name}`,
    `City: ${fields.city}`,
    `Pincode: ${fields.pincode}`,
    fields.note ? `Note: ${fields.note}` : "",
    "",
    "Payment: 75% advance confirms the order; the balance is agreed before dispatch.",
    "Returns: not offered by default; selected return-eligible pieces only, with a 30% deduction.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildContactMessage(fields) {
  return [
    "Hello Taaking Goods,",
    "",
    fields.message,
    "",
    `Name: ${fields.name}`,
    `Email: ${fields.email}`,
  ].join("\n");
}
