import { describe, expect, it } from "vitest";
import { bagLines, bagSubtotal, categoryOptions, defaultArt, isOrderable, normalizeProduct, orderFingerprint, parseBag, productForm, productRecord, reconcileBag, relatedProducts, slugify, uniqueSlug, validateProductForm } from "../src/lib/catalog";
import { inspectSupabaseConfig } from "../src/lib/supabase";
import { formatPrice } from "../src/lib/format";
import { buildOrderMessage } from "../src/lib/order";
import { cloudinaryImageUrl, validateImage } from "../src/lib/cloudinary";

const sample = normalizeProduct({ id: "p1", slug: "blue-tray", name: "Blue tray", category: "Decor", price: "1200.25", summary: "A tray", status: "published", availability: "available" });

describe("catalogue records and owner forms", () => {
  it("normalizes numeric database prices, missing arrays and safe artwork defaults", () => {
    expect(sample.price).toBe(1200.25);
    expect(sample.details).toEqual([]);
    expect(sample.art).toEqual(defaultArt("Decor"));
    expect(normalizeProduct({ ...sample, price: null }).price).toBeNull();
    expect(normalizeProduct({ ...sample, price: "not-a-price" }).price).toBeNull();
  });
  it("keeps enquiry and fractional rupee prices distinct", () => {
    expect(formatPrice(null)).toBe("Price on enquiry");
    expect(formatPrice(12.25)).toContain("12.25");
    const form = productForm(sample);
    expect(validateProductForm(form)).toEqual({});
    expect(productRecord(form).price).toBe(1200.25);
    expect(productRecord({ ...form, enquiry: true, price: "" }).price).toBeNull();
    for (const price of ["", "-1", "Infinity", "1e5", "3.333", "100000000"]) expect(validateProductForm({ ...form, enquiry: false, price }).price).toBeTruthy();
  });
  it("validates publication, category and jewellery-specific shape/metal", () => {
    const form = productForm(sample);
    expect(validateProductForm({ ...form, category: "All" }).category).toBeTruthy();
    expect(validateProductForm({ ...form, status: "published", summary: "" }).summary).toBeTruthy();
    expect(validateProductForm({ ...form, status: "draft", summary: "" }).summary).toBeUndefined();
    expect(validateProductForm({ ...form, category: "Jewellery" }).artShape).toBeTruthy();
    expect(validateProductForm({ ...form, category: "Jewellery", artShape: "ring", artPalette: "gold", metal: "Gold" })).toEqual({});
  });
  it("supports new categories and prioritizes related pieces without mutating records", () => {
    const products = [sample, { ...sample, id: "p2", category: "Custom" }, { ...sample, id: "p3", category: "Decor" }];
    expect(categoryOptions(products)).toEqual(["All", "Tableware", "Decor", "Gifting", "Jewellery", "Custom"]);
    expect(relatedProducts(products, sample, 1)[0].id).toBe("p3");
    expect(products[1].id).toBe("p2");
  });
  it("generates unique slugs while permitting an existing product's stable URL", () => {
    expect(slugify(" Café — Tray! ")).toBe("cafe-tray");
    expect(uniqueSlug("Blue tray", [sample])).toBe("blue-tray-2");
    expect(uniqueSlug("Blue tray", [sample], sample.id)).toBe("blue-tray");
    expect(productForm({ ...sample, name: "Renamed" }).slug).toBe("blue-tray");
  });
});

describe("persisted bag and current pricing", () => {
  it("retains well-formed unknown IDs until the catalogue has loaded", () => {
    expect(parseBag([{ id: "unloaded", qty: 2 }, null, { id: {}, qty: 1 }, { id: "p1", qty: 99 }, { id: "p1", qty: 0 }, { id: "negative", qty: -4 }])).toEqual([
      { id: "unloaded", qty: 2 }, { id: "p1", qty: 9 }, { id: "negative", qty: 1 },
    ]);
    expect(parseBag({ id: "invalid" })).toEqual([]);
  });
  it("removes only missing or unorderable records on successful reconciliation", () => {
    const products = [sample, { ...sample, id: "hidden", status: "hidden" }, { ...sample, id: "sold", availability: "sold_out" }];
    const checked = reconcileBag([{ id: "p1", qty: 1 }, { id: "missing", qty: 1 }, { id: "hidden", qty: 1 }, { id: "sold", qty: 1 }], products);
    expect(checked.removed).toBe(3);
    expect(checked.entries).toEqual([{ id: "p1", qty: 1 }]);
    expect(isOrderable(products[2])).toBe(false);
  });
  it("uses paise arithmetic and identifies price changes even when the total is unchanged", () => {
    const lines = bagLines([{ id: "p1", qty: 3 }], [{ ...sample, price: 0.1 }]);
    expect(bagSubtotal(lines)).toBe(0.3);
    expect(bagSubtotal([{ product: { ...sample, price: null }, qty: 1 }])).toBeNull();
    expect(orderFingerprint(lines)).not.toBe(orderFingerprint([{ product: { ...sample, price: 0.15 }, qty: 2 }]));
    expect(buildOrderMessage(lines, { name: "Customer", city: "City", pincode: "123456" }, 0.3)).toContain("₹0.30");
  });
});

describe("public configuration and photos", () => {
  it("uses samples only when both public settings are absent", () => {
    expect(inspectSupabaseConfig({}).mode).toBe("demo");
    expect(inspectSupabaseConfig({ VITE_SUPABASE_URL: "https://example.supabase.co" }).mode).toBe("error");
    expect(inspectSupabaseConfig({ VITE_SUPABASE_URL: "https://example.supabase.co", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example" }).mode).toBe("live");
  });
  it("rejects server secrets, unsafe URLs and service-role JWTs", () => {
    const env = { VITE_SUPABASE_URL: "https://example.supabase.co" };
    expect(inspectSupabaseConfig({ ...env, VITE_SUPABASE_PUBLISHABLE_KEY: "sb_secret_private" }).mode).toBe("error");
    const key = `header.${btoa(JSON.stringify({ role: "service_role" }))}.signature`;
    expect(inspectSupabaseConfig({ ...env, VITE_SUPABASE_ANON_KEY: key }).mode).toBe("error");
    expect(inspectSupabaseConfig({ ...env, VITE_SUPABASE_URL: "http://untrusted.example", VITE_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_example" }).mode).toBe("error");
  });
  it("builds versioned optimized delivery URLs without API credentials", () => {
    const url = cloudinaryImageUrl({ imagePublicId: "catalog/abc", imageCloudName: "images", imageVersion: 12 }, 400);
    expect(url).toBe("https://res.cloudinary.com/images/image/upload/f_auto,q_auto,c_limit,w_400/v12/catalog/abc");
    expect(cloudinaryImageUrl({ image: "/images/local.jpg" })).toBe("/images/local.jpg");
    expect(() => validateImage(new File(["svg"], "x.svg", { type: "image/svg+xml" }))).toThrow("JPEG");
  });
});
