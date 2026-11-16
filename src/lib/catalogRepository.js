import { normalizeProduct } from "./catalog";
import { supabase } from "./supabase";

export const PRODUCT_COLUMNS = "id,slug,name,category,price,summary,description,details,art_shape,art_palette,image_public_id,image_cloud_name,image_version,image_url,image_width,image_height,featured,status,availability,metal,hallmark,sort_order,version,updated_at";

export function catalogError(error) {
  if (error?.code === "23505") return "That product URL is already in use, or a previous save already succeeded. Reload the catalogue before trying again.";
  if (error?.code === "42501" || error?.status === 401 || error?.status === 403) return "Owner access is required. Sign in again and check the owner allowlist.";
  if (error?.code === "42P01" || error?.code === "PGRST205") return "The catalogue table is missing. Apply the database migration in the setup guide.";
  return error?.message || "The catalogue could not be reached. Please try again.";
}

export function createCatalogRepository(client) {
  const required = () => {
    if (!client) throw new Error("Supabase is not configured. Follow the catalogue setup guide.");
  };
  return {
    async list({ owner = false } = {}) {
      required();
      const products = [];
      const pageSize = 500;
      for (let from = 0; ; from += pageSize) {
        let query = client.from("products").select(PRODUCT_COLUMNS);
        if (!owner) query = query.eq("status", "published");
        const { data, error } = await query.order("sort_order").order("id").range(from, from + pageSize - 1);
        if (error) throw new Error(catalogError(error));
        products.push(...data.map(normalizeProduct));
        if (data.length < pageSize) return products;
      }
    },
    async save(record, existing = null) {
      required();
      let query = existing
        ? client.from("products").update(record).eq("id", existing.id).eq("version", existing.version)
        : client.from("products").insert(record);
      const { data, error } = await query.select(PRODUCT_COLUMNS).maybeSingle();
      if (error) throw new Error(catalogError(error));
      if (!data) throw new Error("This product changed or was removed in another session. Reload the list before editing it again.");
      return normalizeProduct(data);
    },
    async remove(product) {
      required();
      const { data, error } = await client.from("products").delete().eq("id", product.id).eq("version", product.version).select("id");
      if (error) throw new Error(catalogError(error));
      if (!data?.length) throw new Error("This product changed or was removed in another session. Reload before deleting it.");
    },
    async importSamples(records) {
      required();
      const { data, error } = await client.rpc("import_catalog_drafts", { p_products: records });
      if (error) throw new Error(catalogError(error));
      return data;
    },
  };
}

export const catalogRepository = createCatalogRepository(supabase);
