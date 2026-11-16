import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { createMediaHandler } from "./handler.js";

const url = Deno.env.get("SUPABASE_URL") || "";
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const service = url && serviceKey ? createClient(url, serviceKey, {
  global: { fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, signal: AbortSignal.timeout(15000) }) },
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
}) : null;

async function rpc(name: string, params: Record<string, unknown> = {}) {
  if (!service) throw new Error("Server configuration is missing.");
  const { data, error } = await service.rpc(name, params);
  if (error) throw new Error("Database operation failed.");
  return data;
}

const handler = createMediaHandler({
  config: {
    cloudName: Deno.env.get("CLOUDINARY_CLOUD_NAME"),
    apiKey: Deno.env.get("CLOUDINARY_API_KEY"),
    apiSecret: Deno.env.get("CLOUDINARY_API_SECRET"),
    allowedOrigins: Deno.env.get("CATALOG_ALLOWED_ORIGINS"),
  },
  authorize: async (token: string) => {
    if (!service) throw new Error("Server configuration is missing.");
    // getUser validates the JWT with the Auth server. Client metadata is NOT a role.
    const { data: { user }, error } = await service.auth.getUser(token);
    if (error || !user) return null;
    const owner = await rpc("catalog_owner_for_user", { p_user_id: user.id });
    return owner ? user.id : null;
  },
  register: (asset: Record<string, unknown>, owner: string) => rpc("register_catalog_media", { p_asset: asset, p_owner: owner }),
  claim: (id: string) => rpc("claim_catalog_media_cleanup", { p_public_id: id }),
  finish: (id: string, token: string) => rpc("finish_catalog_media_cleanup", { p_public_id: id, p_token: token }),
  listUnused: () => rpc("list_catalog_unused_media"),
});

Deno.serve(handler);
