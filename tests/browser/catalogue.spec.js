import { expect, test } from "@playwright/test";

const testUserId = "00000000-0000-0000-0000-000000000001";
const expiry = Math.floor(Date.now() / 1000) + 3600;
// A syntactically valid fixture token; Auth requests are intercepted locally.
// This signature is NOT valid and cannot authenticate against a real service.
const token = `${Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url")}.${Buffer.from(JSON.stringify({ sub: testUserId, aud: "authenticated", role: "authenticated", exp: expiry })).toString("base64url")}.fixture-signature`;
const session = {
  access_token: token, token_type: "bearer", refresh_token: "test-refresh-token", expires_in: 3600,
  expires_at: expiry,
  user: { id: testUserId, aud: "authenticated", role: "authenticated", email: "owner@example.com", app_metadata: { provider: "email" }, user_metadata: {}, created_at: "2026-01-01T00:00:00Z" },
};
const record = {
  id: "piece-1", slug: "blue-tray", name: "Blue tray", category: "Decor", price: 1200, summary: "A handmade blue tray", description: "Made in small batches.", details: ["22 cm wide"], art_shape: "tray", art_palette: "mist", image_public_id: null,
  featured: true, status: "published", availability: "available", metal: null, hallmark: false, sort_order: 0, version: 1,
};

async function mockServices(page, { owner = true } = {}) {
  let products = [{ ...record }];
  let serial = 1;
  await page.route("https://catalog-test.supabase.co/**", async (route) => {
    const request = route.request(); const url = new URL(request.url());
    const reply = (body, status = 200) => route.fulfill({ status, contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "*", "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS" }, body: JSON.stringify(body) });
    if (request.method() === "OPTIONS") return reply({});
    if (url.pathname === "/auth/v1/token") return reply(session);
    if (url.pathname === "/auth/v1/user") return reply(session.user);
    if (url.pathname === "/auth/v1/logout") return reply({});
    if (url.pathname === "/rest/v1/rpc/is_catalog_admin") return reply(owner);
    if (url.pathname === "/functions/v1/catalog-media") {
      if (request.headers()["content-type"]?.startsWith("multipart/")) return reply({ asset: { publicId: `catalog/${"b".repeat(32)}`, cloudName: "test_images", version: 12, width: 1, height: 1, bytes: 200, url: `https://res.cloudinary.com/test_images/image/upload/v12/catalog/${"b".repeat(32)}.webp` } });
      return reply({ result: "deleted", cleaned: 0, failed: 0, more: false });
    }
    if (url.pathname === "/rest/v1/products") {
      const id = url.searchParams.get("id")?.replace("eq.", "");
      const version = Number(url.searchParams.get("version")?.replace("eq.", ""));
      if (request.method() === "GET") return reply(url.searchParams.get("status") === "eq.published" ? products.filter((product) => product.status === "published") : products);
      if (!owner) return reply({ code: "42501", message: "permission denied" }, 403);
      if (request.method() === "POST") {
        const created = { ...record, ...request.postDataJSON(), id: `new-${serial++}`, version: 1 };
        products.push(created); return reply(created, 201);
      }
      if (request.method() === "PATCH") {
        const index = products.findIndex((product) => product.id === id && product.version === version);
        if (index < 0) return reply(null);
        products[index] = { ...products[index], ...request.postDataJSON(), version: version + 1 };
        return reply(products[index]);
      }
      if (request.method() === "DELETE") {
        const removed = products.filter((product) => product.id === id && product.version === version);
        products = products.filter((product) => !removed.includes(product));
        return reply(removed.map(({ id }) => ({ id })));
      }
    }
    return reply({ message: "Unexpected test request" }, 404);
  });
  await page.route("https://res.cloudinary.com/test_images/**", (route) => route.fulfill({ contentType: "image/png", body: Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==", "base64") }));
  return { products: () => products };
}

async function login(page) {
  await page.goto("/admin");
  await page.getByLabel("Email", { exact: true }).fill("owner@example.com");
  await page.getByLabel("Password", { exact: true }).fill("test-owner-password");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
}

test("owner can change a price, add a draft/photo, publish, hide and delete", async ({ page }, testInfo) => {
  const state = await mockServices(page);
  const errors = []; page.on("pageerror", (error) => errors.push(error.message));
  await login(page);
  await expect(page.getByRole("heading", { name: "Manage the catalogue." })).toBeVisible();
  await page.getByRole("button", { name: "Edit Blue tray" }).click();
  await page.getByLabel("Price (₹ INR)").fill("1499.50");
  await page.getByRole("button", { name: "Save & publish" }).click();
  await expect(page.getByRole("status")).toContainText("Product saved");
  expect(state.products()[0].price).toBe(1499.5);
  await page.getByRole("button", { name: "Add product" }).click();
  await page.getByLabel("Product name", { exact: true }).fill("New coaster");
  await page.getByLabel("Short description").fill("A real product description");
  const photo = await page.evaluate(() => {
    const canvas = document.createElement("canvas"); canvas.width = 20; canvas.height = 20;
    const context = canvas.getContext("2d"); context.fillStyle = "#20c4c7"; context.fillRect(0, 0, 20, 20);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.getByLabel("Upload product photo").setInputFiles({ name: "photo.png", mimeType: "image/png", buffer: Buffer.from(photo, "base64") });
  await expect(page.getByRole("button", { name: "Replace photo" })).toBeEnabled();
  await page.getByRole("button", { name: "Save product", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("as draft");
  await page.getByRole("button", { name: "Edit New coaster" }).click();
  await page.getByLabel("Visibility").selectOption("published");
  await page.getByRole("button", { name: "Save & publish" }).click();
  await page.getByRole("button", { name: "Edit New coaster" }).click();
  await page.getByLabel("Visibility").selectOption("hidden");
  await page.getByRole("button", { name: "Save product", exact: true }).click();
  await page.getByRole("button", { name: "Delete New coaster" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Delete product", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Product deleted");
  expect(state.products()).toHaveLength(1);
  await page.screenshot({ path: testInfo.outputPath("owner-catalogue.png"), fullPage: true });
  expect(errors).toEqual([]);
});

test("non-owner account cannot reach catalogue controls", async ({ page }) => {
  await mockServices(page, { owner: false }); await login(page);
  await expect(page.getByRole("heading", { name: "Owner access required." })).toBeVisible();
  await expect(page.getByRole("button", { name: "Add product" })).toHaveCount(0);
});

test("mobile editor fits the viewport and keyboard cancellation preserves unsaved changes", async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 }); await mockServices(page); await login(page);
  await page.getByRole("button", { name: "Add product" }).click();
  await page.getByLabel("Product name", { exact: true }).fill("Unsaved piece");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByLabel("Product name", { exact: true })).toHaveValue("Unsaved piece");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("owner-mobile-editor.png"), fullPage: true });
});

test("published product and saved bag render with a verified WhatsApp order", async ({ page }) => {
  await mockServices(page);
  await page.goto("/shop/blue-tray");
  await expect(page.getByRole("heading", { name: "Blue tray", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add to bag", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "1 piece" })).toBeVisible();
  await page.getByLabel("Name", { exact: true }).fill("Customer");
  await page.getByLabel("City", { exact: true }).fill("Test city");
  await page.getByLabel("Pincode").fill("123456");
  await page.getByRole("button", { name: "Check order & continue" }).click();
  await expect(page.getByRole("link", { name: "Send order on WhatsApp" })).toHaveAttribute("href", /wa\.me/);
});
