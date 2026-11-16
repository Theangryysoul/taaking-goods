// Platform-neutral handler: the Deno adapter supplies verified Auth/DB access.
export const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_BODY_BYTES = MAX_FILE_BYTES + 65536;
const APP_ID = /^catalog\/[a-f0-9]{32}$/;

class RequestError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export async function signCloudinary(params, secret, cryptoApi = globalThis.crypto) {
  const canonical = Object.keys(params).sort().map((key) => `${key}=${params[key]}`).join("&");
  const digest = await cryptoApi.subtle.digest("SHA-1", new TextEncoder().encode(canonical + secret));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function inspectImage(bytes, mime) {
  let width = 0; let height = 0;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (start, end) => String.fromCharCode(...bytes.slice(start, end));
  if (mime === "image/png" && bytes.length >= 24 && [137,80,78,71,13,10,26,10].every((value, i) => bytes[i] === value) && text(12,16) === "IHDR") {
    width = view.getUint32(16); height = view.getUint32(20);
    let chunk = 8;
    while (chunk + 12 <= bytes.length) {
      const size = view.getUint32(chunk);
      if (text(chunk + 4, chunk + 8) === "acTL") throw new RequestError(400, "Use a still photo, not an animated image.");
      if (size > bytes.length - chunk - 12) break;
      chunk += size + 12;
    }
  } else if (mime === "image/jpeg" && bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216) {
    let offset = 2;
    while (offset + 4 <= bytes.length) {
      if (bytes[offset] !== 255) break;
      while (bytes[offset] === 255) offset += 1;
      const marker = bytes[offset++];
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      if (offset + 2 > bytes.length) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) break;
      if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker) && length >= 8) {
        height = view.getUint16(offset + 3); width = view.getUint16(offset + 5); break;
      }
      offset += length;
    }
  } else if (mime === "image/webp" && bytes.length >= 25 && text(0,4) === "RIFF" && text(8,12) === "WEBP") {
    const kind = text(12,16);
    if (kind === "VP8X" && bytes.length >= 30) {
      if (bytes[20] & 2) throw new RequestError(400, "Use a still photo, not an animated image.");
      width = 1 + bytes[24] + (bytes[25] << 8) + (bytes[26] << 16);
      height = 1 + bytes[27] + (bytes[28] << 8) + (bytes[29] << 16);
    } else if (kind === "VP8L" && bytes[20] === 47) {
      const bits = view.getUint32(21, true);
      width = (bits & 16383) + 1; height = ((bits >>> 14) & 16383) + 1;
    } else if (kind === "VP8 " && bytes.length >= 30 && bytes[23] === 157 && bytes[24] === 1 && bytes[25] === 42) {
      width = view.getUint16(26, true) & 16383; height = view.getUint16(28, true) & 16383;
    }
  }
  if (!width || !height) throw new RequestError(400, "The file is not a valid JPEG, PNG or WebP image.");
  if (width > 1600 || height > 2000) throw new RequestError(400, "Resize the photo to at most 1600 × 2000 pixels before uploading.");
  return { width, height };
}

async function boundedBody(request, limit) {
  const declared = Number(request.headers.get("content-length"));
  if (declared > limit) throw new RequestError(413, "This upload is too large.");
  if (!request.body) throw new RequestError(400, "A request body is required.");
  const reader = request.body.getReader();
  const chunks = []; let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new RequestError(413, "This upload is too large."); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.length; }
  return body;
}

export function createMediaHandler({ config, authorize, register, claim, finish, listUnused, fetcher = fetch, cryptoApi = globalThis.crypto, now = () => Date.now() }) {
  const allowed = new Set((config.allowedOrigins || "").split(",").map((origin) => origin.trim()).filter(Boolean));
  const configured = /^[A-Za-z0-9_-]{1,100}$/.test(config.cloudName || "") && config.apiKey && config.apiSecret && allowed.size;

  async function cloudinary(action, params, file) {
    const timestamp = String(Math.floor(now() / 1000));
    const values = { ...params, timestamp };
    const body = new FormData();
    for (const [key, value] of Object.entries(values)) body.append(key, String(value));
    body.append("api_key", config.apiKey);
    body.append("signature", await signCloudinary(values, config.apiSecret, cryptoApi));
    if (file) body.append("file", file, "product-photo");
    const response = await fetcher(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/${action}`, {
      method: "POST", body, signal: AbortSignal.timeout(25000),
    });
    if (!response.ok) throw new RequestError(502, "Cloudinary could not process this photo. Check your image-service configuration and quota.");
    return response.json();
  }

  async function cleanup(publicId) {
    if (typeof publicId !== "string" || !APP_ID.test(publicId)) throw new RequestError(400, "Invalid catalogue photo reference.");
    const asset = await claim(publicId);
    if (asset.state === "referenced") throw new RequestError(409, "This photo is still used by a product and cannot be deleted.");
    if (asset.state === "busy") throw new RequestError(409, "Photo cleanup is already running. Retry in a few minutes.");
    if (asset.state === "missing") return "missing";
    if (asset.state !== "claimed" || asset.cloudName !== config.cloudName) throw new RequestError(409, "This photo belongs to a different image-service configuration.");
    // Keep the registry row marked deleting after any ambiguous network failure.
    // Retrying after the lease expires is safe; reattachment is blocked meanwhile.
    const result = await cloudinary("destroy", { public_id: publicId, invalidate: "true" });
    if (!["ok", "not found"].includes(result.result)) throw new RequestError(502, "Photo cleanup did not finish. Retry later.");
    if (!await finish(publicId, asset.token)) throw new RequestError(409, "Photo cleanup was taken over by another request. Retry later.");
    return "deleted";
  }

  return async function handle(request) {
    const origin = request.headers.get("origin");
    const headers = { "Content-Type": "application/json", "Cache-Control": "no-store", "Vary": "Origin" };
    if (origin && allowed.has(origin)) {
      headers["Access-Control-Allow-Origin"] = origin;
      headers["Access-Control-Allow-Headers"] = "authorization, apikey, content-type, x-client-info, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";
      headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    }
    const reply = (status, data) => new Response(JSON.stringify(data), { status, headers });
    if (!origin || !allowed.has(origin)) return reply(403, { error: "This browser origin is not allowed to manage photos." });
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers });
    if (request.method !== "POST") return reply(405, { error: "Only POST requests are supported." });
    const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
    if (!bearer) return reply(401, { error: "Sign in as the owner before managing photos." });
    try {
      const owner = await authorize(bearer);
      if (!owner) throw new RequestError(403, "Only an approved owner can manage photos.");
      if (!configured) throw new RequestError(503, "The photo service is not configured. Set the Edge Function secrets and allowed origins.");
      const contentType = request.headers.get("content-type") || "";
      const bytes = await boundedBody(request, contentType.startsWith("application/json") ? 8192 : MAX_BODY_BYTES);
      if (contentType.startsWith("multipart/form-data")) {
        const form = await new Request(request.url, { method: "POST", headers: { "Content-Type": contentType }, body: bytes }).formData();
        const file = form.get("file");
        if (!file || typeof file === "string" || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) throw new RequestError(400, "Choose a JPEG, PNG or WebP photo.");
        if (!file.size || file.size > MAX_FILE_BYTES) throw new RequestError(413, "Choose a photo smaller than 5 MB.");
        inspectImage(new Uint8Array(await file.arrayBuffer()), file.type);
        const publicId = `catalog/${cryptoApi.randomUUID().replace(/-/g, "")}`;
        const uploaded = await cloudinary("upload", { public_id: publicId, overwrite: "false", transformation: "c_limit,w_1600,h_2000/q_85" }, file);
        const asset = {
          publicId, cloudName: config.cloudName, version: Number(uploaded.version), url: uploaded.secure_url,
          width: Number(uploaded.width), height: Number(uploaded.height), bytes: Number(uploaded.bytes),
        };
        const prefix = `https://res.cloudinary.com/${config.cloudName}/image/upload/`;
        if (uploaded.public_id !== publicId || uploaded.resource_type !== "image" || !asset.url?.startsWith(prefix) || !Number.isSafeInteger(asset.version) || asset.version < 1 || !Number.isInteger(asset.width) || asset.width < 1 || asset.width > 1600 || !Number.isInteger(asset.height) || asset.height < 1 || asset.height > 2000 || !Number.isSafeInteger(asset.bytes) || asset.bytes < 1 || asset.bytes > MAX_FILE_BYTES) {
          throw new RequestError(502, "The image service returned an invalid photo. Check the Cloudinary configuration.");
        }
        try { await register(asset, owner); }
        catch {
          // Registration failures can be ambiguous (a DB commit may have
          // happened before a network error). Use the same registry claim as
          // normal cleanup, never destroy an asset that might be attached.
          try { await cleanup(publicId); } catch { /* Audit Cloudinary for unregistered orphaned uploads if registration failed. */ }
          throw new RequestError(500, "The photo could not be registered. The product was not changed. Check the database migration before uploading again.");
        }
        return reply(200, { asset });
      }
      if (!contentType.startsWith("application/json")) throw new RequestError(415, "Use an image upload or JSON cleanup request.");
      let body;
      try { body = JSON.parse(new TextDecoder().decode(bytes)); }
      catch { throw new RequestError(400, "Invalid JSON request."); }
      if (body?.action === "cleanup") return reply(200, { result: await cleanup(body.publicId) });
      if (body?.action === "sweep") {
        const ids = await listUnused();
        let cleaned = 0; let failed = 0;
        for (const id of ids) {
          try { await cleanup(id); cleaned += 1; }
          catch { failed += 1; }
        }
        return reply(200, { cleaned, failed, more: ids.length === 5 });
      }
      throw new RequestError(400, "Unknown photo action.");
    } catch (error) {
      // No token, secret, SQL internals, or raw provider response is exposed.
      return reply(error instanceof RequestError ? error.status : 500, {
        error: error instanceof RequestError ? error.message : "Photo management failed. Retry and check the Edge Function configuration.",
      });
    }
  };
}
