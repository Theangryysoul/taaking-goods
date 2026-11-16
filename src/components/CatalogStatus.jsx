import { useCatalog } from "../context/CatalogContext";

export default function CatalogStatus({ empty = false, showLoading = false }) {
  const { mode, loading, ready, error, refresh } = useCatalog();
  if (mode === "demo") {
    return <p className="catalog-notice" role="status">Sample catalogue · Product management will be available after Supabase setup.</p>;
  }
  if (error) {
    return (
      <div className="catalog-notice catalog-notice--error" role="alert">
        <p>{ready ? "The catalogue could not be refreshed. Displayed prices may have changed." : "The catalogue is temporarily unavailable."}</p>
        <button className="link-arrow" type="button" disabled={loading || mode !== "live"} onClick={() => refresh().catch(() => {})}>
          {loading ? "Retrying…" : "Try again"}
        </button>
      </div>
    );
  }
  if (loading && (!ready || showLoading)) return <p className="catalog-notice" role="status">Loading the collection…</p>;
  if (empty && !loading) return <p className="catalog-notice" role="status">No pieces have been published yet. Please check back soon.</p>;
  return null;
}
