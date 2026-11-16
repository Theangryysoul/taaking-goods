export const DEFAULT_CATEGORIES = ["Tableware", "Decor", "Gifting", "Jewellery"];
export const RESIN_SHAPES = ["coaster", "tray", "keychain", "bookmark", "vase", "dish", "frame", "pendant", "loop"];
export const RESIN_PALETTES = ["amber", "sage", "clay", "smoke", "mist", "honey"];
export const METAL_SHAPES = ["ring", "chain", "hoops", "bracelet", "studs"];
export const METAL_PALETTES = ["gold", "silver"];
export const PUBLICATION_STATUSES = ["draft", "published", "hidden"];

export function defaultArt(category, metal = "Gold") {
  return category === "Jewellery"
    ? { shape: "ring", palette: metal === "Silver" ? "silver" : "gold" }
    : { shape: "coaster", palette: "amber" };
}

export function normalizeProduct(row) {
  const art = defaultArt(row.category, row.metal);
  const number = row.price === null || row.price === undefined ? null : Number(row.price);
  return {
    id: String(row.id), slug: row.slug, name: row.name, category: row.category,
    price: Number.isFinite(number) ? number : null,
    summary: row.summary || "", description: row.description || "",
    details: Array.isArray(row.details) ? row.details : [],
    art: { shape: row.art_shape || row.art?.shape || art.shape, palette: row.art_palette || row.art?.palette || art.palette },
    image: row.image_url || row.image || null,
    imagePublicId: row.image_public_id || null,
    imageCloudName: row.image_cloud_name || null,
    imageVersion: row.image_version || null,
    imageWidth: row.image_width || null, imageHeight: row.image_height || null,
    featured: Boolean(row.featured), metal: row.metal || null, hallmark: Boolean(row.hallmark),
    status: row.status || "published", availability: row.availability || "available",
    sortOrder: row.sort_order || 0, version: row.version || 1, updatedAt: row.updated_at || null,
  };
}

export function categoryOptions(products) {
  const extra = products.map((product) => product.category).filter((name) => name && name !== "All" && !DEFAULT_CATEGORIES.includes(name));
  return ["All", ...DEFAULT_CATEGORIES, ...[...new Set(extra)].sort((a, b) => a.localeCompare(b))];
}

export function relatedProducts(products, product, limit = 3) {
  return products.filter((item) => item.id !== product.id)
    .sort((a, b) => Number(b.category === product.category) - Number(a.category === product.category))
    .slice(0, limit);
}

export function isOrderable(product) {
  return Boolean(product && product.status === "published" && product.availability === "available");
}

export function parseBag(value) {
  if (!Array.isArray(value)) return [];
  const merged = new Map();
  for (const item of value.slice(0, 500)) {
    if (!item || typeof item.id !== "string" || !item.id || item.id.length > 120) continue;
    const qty = Math.min(9, Math.max(1, Math.floor(Number(item.qty) || 1)));
    merged.set(item.id, Math.min(9, (merged.get(item.id) || 0) + qty));
  }
  return [...merged].map(([id, qty]) => ({ id, qty }));
}

export function reconcileBag(entries, products) {
  const byId = new Map(products.map((product) => [product.id, product]));
  const kept = entries.filter((entry) => isOrderable(byId.get(entry.id)));
  return { entries: kept, removed: entries.length - kept.length };
}

export function bagLines(entries, products) {
  const byId = new Map(products.map((product) => [product.id, product]));
  return entries.map((entry) => {
    const product = byId.get(entry.id);
    return isOrderable(product) ? { product, qty: entry.qty } : null;
  }).filter(Boolean);
}

export function bagSubtotal(lines) {
  if (!lines.length || !lines.every(({ product }) => Number.isFinite(product.price))) return null;
  // Currency arithmetic in paise avoids floating point errors.
  return lines.reduce((total, { product, qty }) => total + Math.round(product.price * 100) * qty, 0) / 100;
}

export function orderFingerprint(lines) {
  return JSON.stringify(lines.map(({ product, qty }) => [product.id, product.name, product.slug, product.price, qty]));
}

export function slugify(name) {
  return name.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100).replace(/-+$/g, "");
}

export function uniqueSlug(name, products, excludeId = null) {
  const base = slugify(name) || "product";
  const used = new Set(products.filter((product) => product.id !== excludeId).map((product) => product.slug));
  let slug = base;
  for (let suffix = 2; used.has(slug); suffix += 1) slug = `${base}-${suffix}`;
  return slug;
}

export function productForm(product = null) {
  return {
    name: product?.name || "", slug: product?.slug || "", category: product?.category || "Tableware",
    price: product?.price === null || product?.price === undefined ? "" : String(product.price),
    enquiry: product ? product.price === null : true,
    summary: product?.summary || "", description: product?.description || "", details: product?.details?.join("\n") || "",
    status: product?.status || "draft", availability: product?.availability || "available", featured: product?.featured || false,
    metal: product?.metal || "Gold", hallmark: product?.hallmark || false,
    artShape: product?.art?.shape || "coaster", artPalette: product?.art?.palette || "amber",
    sortOrder: String(product?.sortOrder || 0),
  };
}

export function validateProductForm(form) {
  const errors = {};
  const length = (key, min, max, label) => {
    const value = String(form[key] || "").trim();
    if (value.length < min || value.length > max) errors[key] = `${label} must be ${min}–${max} characters.`;
  };
  length("name", 2, 120, "Product name");
  length("category", 2, 60, "Category");
  if (String(form.category).trim().toLowerCase() === "all") errors.category = '"All" is a filter, not a product category.';
  const slug = String(form.slug).trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) errors.slug = "Use lowercase letters, numbers and single hyphens (up to 120 characters).";
  length("summary", form.status === "published" ? 1 : 0, 240, "Short description");
  length("description", 0, 6000, "Description");
  const details = String(form.details).split("\n").map((line) => line.trim()).filter(Boolean);
  if (details.length > 20 || details.some((line) => line.length > 300)) errors.details = "Use up to 20 lines, at most 300 characters per line.";
  if (!form.enquiry && (!/^\d+(?:\.\d{1,2})?$/.test(String(form.price).trim()) || Number(form.price) > 99999999.99)) errors.price = "Enter a nonnegative rupee price with at most two decimal places.";
  if (!/^\d{1,5}$/.test(String(form.sortOrder))) errors.sortOrder = "Use a whole number from 0 to 99999.";
  if (!PUBLICATION_STATUSES.includes(form.status)) errors.status = "Choose draft, published or hidden.";
  if (!["available", "sold_out"].includes(form.availability)) errors.availability = "Choose an availability.";
  const jewellery = String(form.category).trim() === "Jewellery";
  if (jewellery && !["Gold", "Silver"].includes(form.metal)) errors.metal = "Choose Gold or Silver.";
  if (!(jewellery ? METAL_SHAPES : RESIN_SHAPES).includes(form.artShape)) errors.artShape = "Choose a valid placeholder shape.";
  if (!(jewellery ? METAL_PALETTES : RESIN_PALETTES).includes(form.artPalette)) errors.artPalette = "Choose a valid placeholder colour.";
  return errors;
}

export function productRecord(form, imagePublicId = null) {
  const jewellery = form.category.trim() === "Jewellery";
  return {
    name: form.name.trim(), slug: form.slug.trim(), category: form.category.trim(),
    price: form.enquiry ? null : Number(form.price), summary: form.summary.trim(), description: form.description.trim(),
    details: form.details.split("\n").map((line) => line.trim()).filter(Boolean),
    art_shape: form.artShape, art_palette: form.artPalette, image_public_id: imagePublicId,
    featured: Boolean(form.featured), status: form.status, availability: form.availability,
    metal: jewellery ? form.metal : null, hallmark: jewellery ? Boolean(form.hallmark) : false,
    sort_order: Number(form.sortOrder),
  };
}
