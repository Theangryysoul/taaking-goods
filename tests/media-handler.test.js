// @vitest-environment node
import { createHash, webcrypto } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { createMediaHandler, inspectImage, signCloudinary } from "../supabase/functions/catalog-media/handler.js";

const origin = "http://localhost:5173";
const id = `catalog/${"a".repeat(32)}`;
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==", "base64");

function setup(overrides = {}) {
  const deps = {
    config: { cloudName: "test_images", apiKey: "test_api_key", apiSecret: "test_secret", allowedOrigins: origin },
    authorize: vi.fn(async (token) => token === "owner-token" ? "approved-user" : null),
    register: vi.fn(async () => {}), claim: vi.fn(async () => ({ state: "claimed", token: "cleanup-token", cloudName: "test_images" })),
    finish: vi.fn(async () => true), listUnused: vi.fn(async () => []), cryptoApi: webcrypto, now: () => 1700000000000,
    fetcher: vi.fn(async (url, options) => {
      if (url.endsWith("/destroy")) return Response.json({ result: "ok" });
      const publicId = options.body.get("public_id");
      return Response.json({ public_id: publicId, resource_type: "image", version: 12, width: 1, height: 1, bytes: png.length, secure_url: `https://res.cloudinary.com/test_images/image/upload/v12/${publicId}.png` });
    }),
    ...overrides,
  };
  return { deps, handle: createMediaHandler(deps) };
}
function request(body, { token = "owner-token", requestOrigin = origin, method = "POST" } = {}) {
  const headers = { Origin: requestOrigin, ...(token ? { Authorization: `Bearer ${token}` } : {}) };
  if (!(body instanceof FormData)) headers["Content-Type"] = "application/json";
  return new Request("https://project.example/functions/v1/catalog-media", { method, headers, ...(method === "POST" ? { body: body instanceof FormData ? body : JSON.stringify(body) } : {}) });
}
function upload(file = new File([png], "photo.png", { type: "image/png" })) {
  const body = new FormData(); body.append("file", file); return request(body);
}

describe("authenticated photo endpoint", () => {
  it("rejects anonymous callers and non-owners before touching Cloudinary or media records", async () => {
    const { handle, deps } = setup();
    expect((await handle(request({ action: "cleanup", publicId: id }, { token: null }))).status).toBe(401);
    expect((await handle(request({ action: "cleanup", publicId: id }, { token: "visitor-token" }))).status).toBe(403);
    expect(deps.fetcher).not.toHaveBeenCalled();
    expect(deps.claim).not.toHaveBeenCalled();
  });
  it("rejects unexpected origins and permits a bounded preflight", async () => {
    const { handle, deps } = setup();
    const rejected = await handle(request({}, { requestOrigin: "https://other.example" }));
    expect(rejected.status).toBe(403);
    expect(rejected.headers.get("Access-Control-Allow-Origin")).toBeNull();
    expect(deps.authorize).not.toHaveBeenCalled();
    const preflight = await handle(request(null, { method: "OPTIONS", token: null }));
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("Access-Control-Allow-Origin")).toBe(origin);
  });
  it("uploads only verified images with server-generated IDs and registers their reference", async () => {
    const { handle, deps } = setup();
    const response = await handle(upload());
    expect(response.status).toBe(200);
    const { asset } = await response.json();
    expect(asset.publicId).toMatch(/^catalog\/[a-f0-9]{32}$/);
    expect(deps.register).toHaveBeenCalledWith(asset, "approved-user");
    const form = deps.fetcher.mock.calls[0][1].body;
    expect(form.get("overwrite")).toBe("false");
    expect(form.get("signature")).toMatch(/^[a-f0-9]{40}$/);
    expect(JSON.stringify(asset)).not.toContain("test_secret");
    expect(JSON.stringify(asset)).not.toContain("test_api_key");
  });
  it("rejects image MIME spoofing, oversized bodies, and invalid dimensions before upload", async () => {
    const { handle, deps } = setup();
    expect((await handle(upload(new File(["not a PNG"], "fake.png", { type: "image/png" })))).status).toBe(400);
    expect((await handle(new Request("https://project.example", { method: "POST", headers: { Origin: origin, Authorization: "Bearer owner-token", "Content-Type": "application/json", "Content-Length": "9000000" }, body: "{}" }))).status).toBe(413);
    const huge = new Uint8Array(png); new DataView(huge.buffer).setUint32(16, 99999);
    expect((await handle(upload(new File([huge], "large.png", { type: "image/png" })))).status).toBe(400);
    expect(deps.fetcher).not.toHaveBeenCalled();
  });
  it("never deletes arbitrary or currently referenced assets", async () => {
    const { handle, deps } = setup({ claim: vi.fn(async () => ({ state: "referenced" })) });
    expect((await handle(request({ action: "cleanup", publicId: "another-folder/photo" }))).status).toBe(400);
    expect((await handle(request({ action: "cleanup", publicId: id }))).status).toBe(409);
    expect(deps.fetcher).not.toHaveBeenCalled();
    expect(deps.finish).not.toHaveBeenCalled();
  });
  it("completes deletion only after the registry claim and successful Cloudinary response", async () => {
    const { handle, deps } = setup();
    expect((await handle(request({ action: "cleanup", publicId: id }))).status).toBe(200);
    expect(deps.claim).toHaveBeenCalledWith(id);
    expect(deps.fetcher.mock.calls[0][1].body.get("invalidate")).toBe("true");
    expect(deps.finish).toHaveBeenCalledWith(id, "cleanup-token");
  });
  it("retains the deleting lease when the provider fails instead of allowing reattachment", async () => {
    const { handle, deps } = setup({ fetcher: vi.fn(async () => new Response("failed", { status: 503 })) });
    expect((await handle(request({ action: "cleanup", publicId: id }))).status).toBe(502);
    expect(deps.finish).not.toHaveBeenCalled();
  });
  it("claims cleanup through the registry if registration fails, rather than deleting an arbitrary asset", async () => {
    const { handle, deps } = setup({ register: vi.fn(async () => { throw new Error("db failure"); }) });
    const response = await handle(upload());
    expect(response.status).toBe(500);
    expect(deps.fetcher).toHaveBeenCalledTimes(2);
    expect(deps.fetcher.mock.calls[1][0]).toContain("/destroy");
    expect((await response.json()).error).not.toContain("db failure");
  });
  it("never destroys an image after an ambiguous registration error if the registry says it is referenced", async () => {
    const { handle, deps } = setup({ register: vi.fn(async () => { throw new Error("network timeout after commit"); }), claim: vi.fn(async () => ({ state: "referenced" })) });
    expect((await handle(upload())).status).toBe(500);
    expect(deps.fetcher).toHaveBeenCalledTimes(1);
    expect(deps.finish).not.toHaveBeenCalled();
  });
  it("limits cleanup sweep batches and reports partial failures", async () => {
    const { handle } = setup({ listUnused: vi.fn(async () => [id]), claim: vi.fn(async () => ({ state: "referenced" })) });
    const result = await (await handle(request({ action: "sweep" }))).json();
    expect(result).toEqual({ cleaned: 0, failed: 1, more: false });
  });
});

describe("image and signature validation", () => {
  it("parses PNG dimensions and rejects invalid image bytes", () => {
    expect(inspectImage(new Uint8Array(png), "image/png")).toEqual({ width: 1, height: 1 });
    expect(() => inspectImage(new Uint8Array([1, 2, 3]), "image/png")).toThrow("valid JPEG");
  });
  it("matches Cloudinary's sorted parameter SHA-1 signing convention", async () => {
    const params = { timestamp: "1700000000", public_id: id, overwrite: "false" };
    const expected = createHash("sha1").update(`overwrite=false&public_id=${id}&timestamp=1700000000test_secret`).digest("hex");
    expect(await signCloudinary(params, "test_secret", webcrypto)).toBe(expected);
  });
});
