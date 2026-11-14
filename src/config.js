// ---------------------------------------------------------------------------
// Studio settings. Edit this file first when your real details are ready.
//
// WhatsApp number: digits only, including the country code.
// Example: "919876543210". Leave it empty until the studio line is live.
// Instagram and Facebook: full profile URLs, or leave empty to hide the link.
// ---------------------------------------------------------------------------

export const site = {
  name: "Taaking Goods",
  wordmark: "taaking goods",
  tagline: "Hand poured resin objects and hallmarked jewellery",
  description:
    "Hand poured resin objects and hallmarked gold and silver jewellery. A small batch studio in India.",
  email: "taakinggoods@gmail.com",
  whatsapp: "918708358441",
  instagram: "https://www.instagram.com/taaking_goods/",
  facebook: "https://www.facebook.com/taakinggoods",
  domain: "https://taakinggoods.in",
  country: "India",
};

const digits = (value) => String(value || "").replace(/\D/g, "");

export const hasWhatsApp = () => digits(site.whatsapp).length >= 10;

export const whatsappUrl = (message = "") => {
  const number = digits(site.whatsapp);
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${number}${query}`;
};

export const formattedEmail = () => site.email;
