import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { products as samples } from "../data/catalog";
import { categoryOptions, normalizeProduct, relatedProducts } from "../lib/catalog";
import { catalogRepository } from "../lib/catalogRepository";
import { supabaseConfig } from "../lib/supabase";

const CatalogContext = createContext(null);
const demoProducts = samples.map(normalizeProduct);

export function CatalogProvider({ children, config = supabaseConfig, repository = catalogRepository }) {
  const demo = config.mode === "demo";
  const [state, setState] = useState({
    products: demo ? demoProducts : [],
    loading: config.mode === "live", error: config.error || "", revision: demo ? 1 : 0,
  });
  const pending = useRef(null);
  const mounted = useRef(true);
  const location = useLocation();

  const refresh = useCallback((options = {}) => {
    if (demo) return Promise.resolve(demoProducts);
    if (config.mode !== "live") return Promise.reject(new Error(config.error || "Catalogue configuration is incomplete."));
    if (pending.current) {
      // A post-mutation refresh must not reuse an older in-flight snapshot.
      if (options.force) return pending.current.catch(() => {}).then(() => refresh());
      return pending.current;
    }
    setState((current) => ({ ...current, loading: true }));
    const request = repository.list().then((products) => {
      // Defense in depth: never share an owner's draft list with the storefront.
      const published = products.filter((product) => product.status === "published");
      if (mounted.current) setState((current) => ({ products: published, error: "", loading: false, revision: current.revision + 1 }));
      return published;
    }).catch((error) => {
      if (mounted.current) setState((current) => ({ ...current, error: error.message, loading: false }));
      throw error;
    }).finally(() => { pending.current = null; });
    pending.current = request;
    return request;
  }, [demo, config.mode, config.error, repository]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (config.mode !== "live") return undefined;
    refresh().catch(() => {});
    const onFocus = () => { if (document.visibilityState === "visible") refresh().catch(() => {}); };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [config.mode, refresh]);

  useEffect(() => {
    if (config.mode === "live") refresh().catch(() => {});
  }, [location.pathname, location.search, config.mode, refresh]);

  const value = useMemo(() => ({
    ...state, mode: config.mode, ready: state.revision > 0,
    categories: categoryOptions(state.products), featuredProducts: state.products.filter((product) => product.featured),
    getProduct: (slug) => state.products.find((product) => product.slug === slug),
    getProductById: (id) => state.products.find((product) => product.id === id),
    getRelated: (product, limit) => relatedProducts(state.products, product, limit), refresh,
  }), [state, config.mode, refresh]);

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalog must be used inside CatalogProvider.");
  return context;
}
