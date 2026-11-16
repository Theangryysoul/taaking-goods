import { createClient } from "@supabase/supabase-js";

export function inspectSupabaseConfig(env = {}) {
  const url = (env.VITE_SUPABASE_URL || "").trim();
  const key = (env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY || "").trim();
  if (!url && !key) return { mode: "demo", url: "", key: "", error: "" };
  if (!url || !key) {
    return { mode: "error", error: "Set both VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, then restart the app." };
  }
  try {
    const parsed = new URL(url);
    const local = ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname);
    if ((parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) || parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== "/") {
      throw new Error("Invalid URL");
    }
    if (key.startsWith("sb_secret_")) throw new Error("Secret key");
    // Legacy anon keys are JWTs. Reject a service-role JWT before it can be sent.
    if (key.split(".").length === 3) {
      const payload = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (payload.role !== "anon") throw new Error("Not an anon key");
    } else if (!key.startsWith("sb_publishable_")) {
      throw new Error("Not a public key");
    }
    return { mode: "live", url: parsed.origin, key, error: "" };
  } catch {
    return { mode: "error", error: "Use a valid Supabase project URL and public publishable (or legacy anon) key. Server secrets must never be used here." };
  }
}

export async function timeoutFetch(input, options = {}) {
  const controller = new AbortController();
  const abort = () => controller.abort(options.signal?.reason);
  if (options.signal?.aborted) abort();
  else options.signal?.addEventListener("abort", abort, { once: true });
  const address = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  // Photo/sweep operations include signed Cloudinary requests on the server.
  const timer = setTimeout(() => controller.abort(), address.includes("/functions/v1/catalog-media") ? 150000 : 20000);
  try { return await fetch(input, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timer); options.signal?.removeEventListener("abort", abort); }
}

export const supabaseConfig = inspectSupabaseConfig(import.meta.env);
export const supabase = supabaseConfig.mode === "live"
  ? createClient(supabaseConfig.url, supabaseConfig.key, {
      global: { fetch: timeoutFetch },
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "pkce" },
    })
  : null;
