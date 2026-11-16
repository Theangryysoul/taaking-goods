import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { ArrowSquareOut, ArrowsClockwise, DownloadSimple, MagnifyingGlass, Plus, SignOut, Trash } from "@phosphor-icons/react";
import Wordmark from "../../components/Wordmark";
import ProductImage from "../../components/ProductImage";
import ProductEditor from "../../components/admin/ProductEditor";
import ConfirmDialog from "../../components/admin/ConfirmDialog";
import OwnerLogin from "../../components/admin/OwnerLogin";
import { useOwnerAuth } from "../../hooks/useOwnerAuth";
import { usePageMeta } from "../../hooks/usePageMeta";
import { useCatalog } from "../../context/CatalogContext";
import { supabaseConfig } from "../../lib/supabase";
import { catalogRepository } from "../../lib/catalogRepository";
import { categoryOptions } from "../../lib/catalog";
import { cleanupImage, sweepUnusedImages } from "../../lib/cloudinary";
import { formatPrice } from "../../lib/format";
import { products as samples } from "../../data/catalog";
import { site } from "../../config";
import "../../styles/admin.css";

function SetupRequired() {
  return <section className="admin-panel admin-setup">
    <p className="eyebrow">One-time setup</p>
    <h1 className="heading-4">Your owner panel is ready to connect.</h1>
    <p className="body-3">{supabaseConfig.mode === "demo" ? "The storefront is using sample products until Supabase is configured." : "The storefront catalogue is unavailable until the public Supabase configuration is corrected."} No changes are saved in this mode.</p>
    {supabaseConfig.error && <p className="admin-status admin-status--error" role="alert">{supabaseConfig.error}</p>}
    <ol>
      <li>Create your Supabase project and apply <code>supabase/migrations/001_catalog.sql</code>.</li>
      <li>Create your owner account in Supabase Auth and add its UUID to the private owner allowlist.</li>
      <li>Copy <code>.env.example</code> to <code>.env.local</code>, fill in the public Supabase URL and key, and restart Vite.</li>
      <li>Set Cloudinary secrets on the Supabase Edge Function and deploy <code>catalog-media</code>.</li>
    </ol>
    <p className="body-3">The full instructions are in <code>docs/catalog-admin-setup.md</code> in your project. Cloudinary secrets and the Supabase service-role key must never be placed in browser variables.</p>
  </section>;
}

export default function AdminApp() {
  const auth = useOwnerAuth();
  const location = useLocation();
  const recoveryPage = location.pathname === "/admin/recovery" || auth.recovery;
  const [headerError, setHeaderError] = useState("");
  const [editing, setEditing] = useState(false);
  usePageMeta({ title: "Owner panel", description: "Private catalogue management.", path: "/admin", noindex: true });

  const signOut = async () => {
    try { await auth.signOut(); setHeaderError(""); }
    catch (error) { setHeaderError(error.message); }
  };

  return <div className="admin-shell">
    <a className="skip-link" href="#admin-main">Skip to owner panel</a>
    <header className="admin-header">
      <div className="admin-header__brand"><Wordmark wordmark={site.wordmark} /><span className="caption-2">Owner panel</span></div>
      <div className="admin-header__actions">
        {/* Full navigation deliberately preserves the editor's beforeunload guard. */}
        <a className="link-arrow" href="/">View storefront <ArrowSquareOut size={16} /></a>
        {auth.session && <button className="link-arrow" type="button" onClick={signOut} disabled={editing || auth.loading}><SignOut size={17} /> Sign out</button>}
      </div>
    </header>
    <main id="admin-main" className="admin-main" tabIndex={-1}>
      {headerError && <p className="admin-status admin-status--error" role="alert">{headerError}</p>}
      {supabaseConfig.mode !== "live" ? <SetupRequired />
        : auth.loading ? <p className="admin-status" role="status">Checking owner access…</p>
        : auth.session && !auth.owner ? <section className="admin-panel admin-setup"><h1 className="heading-4">Owner access required.</h1><p className="body-3" role="alert">{auth.error || "This account is signed in but is not approved to manage the catalogue. Add its Supabase Auth UUID to the private owner allowlist, or sign in with the approved account."}</p><button className="btn btn--line" type="button" onClick={signOut}>Sign out</button></section>
        : recoveryPage ? <OwnerLogin auth={auth} recoveryPage />
        : !auth.session ? <OwnerLogin auth={auth} />
        : <OwnerCatalogue key={auth.session.user.id} onEditing={setEditing} />}
    </main>
    <footer className="admin-footer caption-2">Changes are protected by Supabase owner permissions. Photos are delivered by Cloudinary.</footer>
  </div>;
}

function OwnerCatalogue({ onEditing, repository = catalogRepository }) {
  const { refresh } = useCatalog();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [status, setStatus] = useState(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [editor, setEditor] = useState(null); // null = list, { product: null } = new
  const [deleting, setDeleting] = useState(null);
  const [importing, setImporting] = useState(false);
  const [busy, setBusy] = useState(false);
  const mounted = useRef(true);
  const sequence = useRef(0);
  const categories = useMemo(() => categoryOptions(products), [products]);

  const load = useCallback(async () => {
    const request = ++sequence.current;
    setLoading(true); setLoadError("");
    try {
      const records = await repository.list({ owner: true });
      if (mounted.current && request === sequence.current) setProducts(records);
    } catch (error) {
      if (mounted.current && request === sequence.current) setLoadError(error.message);
    } finally { if (mounted.current && request === sequence.current) setLoading(false); }
  }, [repository]);
  useEffect(() => { mounted.current = true; load(); return () => { mounted.current = false; sequence.current += 1; }; }, [load]);
  useEffect(() => { onEditing(Boolean(editor)); return () => onEditing(false); }, [editor, onEditing]);

  const shown = useMemo(() => products.filter((product) => {
    const text = `${product.name} ${product.category} ${product.slug}`.toLowerCase();
    return text.includes(search.trim().toLowerCase()) && (filter === "all" || (filter === "sold_out" ? product.availability === filter : product.status === filter));
  }), [products, search, filter]);

  const clean = async (ids) => {
    let failed = 0;
    for (const id of [...new Set(ids.filter(Boolean))]) {
      try { await cleanupImage(id); } catch { failed += 1; }
    }
    return failed;
  };

  const save = async (record, existing, queuedIds = []) => {
    const saved = await repository.save(record, existing);
    // Once the DB save succeeded, media/refresh failures are warnings, not a
    // false "save failed" that could create duplicates on the next attempt.
    setProducts((current) => [...current.filter((product) => product.id !== saved.id), saved].sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id)));
    setEditor(null);
    const oldImage = existing?.imagePublicId !== saved.imagePublicId ? existing?.imagePublicId : null;
    const [failed, refreshed] = await Promise.all([clean([...queuedIds, oldImage]), refresh({ force: true }).then(() => true, () => false)]);
    if (mounted.current) setStatus({ error: false, text: `Product saved${saved.status === "published" ? " and published" : ` as ${saved.status}`}.${failed ? " An unused photo could not be removed; retry with Clean unused photos." : ""}${!refreshed ? " Storefront refresh failed; the saved changes will appear on the next successful fetch." : ""}` });
  };

  const deleteProduct = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const { product, extraImage } = deleting;
      await repository.remove(product);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      if (editor?.product?.id === product.id) setEditor(null);
      setDeleting(null);
      const [failed, refreshed] = await Promise.all([clean([product.imagePublicId, extraImage]), refresh({ force: true }).then(() => true, () => false)]);
      setStatus({ error: false, text: `Product deleted.${failed ? " Photo cleanup failed; retry with Clean unused photos." : ""}${!refreshed ? " The storefront will update on its next successful fetch." : ""}` });
    } catch (error) { setStatus({ error: true, text: error.message }); setDeleting(null); }
    finally { setBusy(false); }
  };

  const importSamples = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const records = samples.map((product) => ({ ...product, art_shape: product.art.shape, art_palette: product.art.palette }));
      const count = await repository.importSamples(records);
      setImporting(false);
      setStatus({ error: false, text: `Imported ${count} sample products as private drafts. Replace all placeholder details before publishing.` });
      await load();
    } catch (error) { setStatus({ error: true, text: error.message }); setImporting(false); }
    finally { setBusy(false); }
  };

  const sweep = async () => {
    setBusy(true); setStatus(null);
    try {
      const result = await sweepUnusedImages();
      setStatus({ error: Boolean(result.failed), text: `Cleaned ${result.cleaned} unused photos.${result.failed ? ` ${result.failed} could not be cleaned; retry later.` : ""}${result.more ? " More may remain; run cleanup again." : ""} Only unattached photos older than one hour are considered.` });
    } catch (error) { setStatus({ error: true, text: error.message }); }
    finally { setBusy(false); }
  };

  const exportCatalogue = () => {
    const file = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), products }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a"); link.href = url; link.download = "catalogue-backup.json"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return <>
    {status && <p className={`admin-status${status.error ? " admin-status--error" : ""}`} role={status.error ? "alert" : "status"}>{status.text}</p>}
    {editor ? <ProductEditor key={editor.product?.id || "new"} product={editor.product} products={products} categories={categories} onSave={save} onClose={() => setEditor(null)} onDelete={(product, extraImage) => setDeleting({ product, extraImage })} /> : <>
      <div className="admin-page-heading">
        <div><p className="eyebrow">Your studio shelf</p><h1 className="heading-3">Manage the catalogue.</h1><p className="body-3">Add a piece, change a price, or update what customers can see.</p></div>
        <button className="btn btn--primary" type="button" disabled={loading || Boolean(loadError) || busy} onClick={() => { setStatus(null); setEditor({ product: null }); }}><Plus size={18} /> Add product</button>
      </div>
      <div className="admin-tools">
        <div className="admin-search"><MagnifyingGlass size={18} aria-hidden="true" /><label className="sr-only" htmlFor="admin-search">Search products</label><input id="admin-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or category" /></div>
        <label className="sr-only" htmlFor="admin-filter">Filter visibility</label><select id="admin-filter" value={filter} onChange={(event) => setFilter(event.target.value)}><option value="all">All products</option><option value="published">Published</option><option value="draft">Drafts</option><option value="hidden">Hidden</option><option value="sold_out">Sold out</option></select>
        <button type="button" className="btn btn--line" disabled={loading || busy} onClick={load} aria-label="Refresh product list"><ArrowsClockwise size={18} /></button>
      </div>
      {loadError && <p className="admin-status admin-status--error" role="alert">{loadError} Your existing records have not been changed.</p>}
      {loading ? <p className="admin-status" role="status">Loading products…</p> : !loadError && products.length === 0 ? <div className="admin-panel admin-empty"><h2 className="heading-4">Start with your first piece.</h2><p className="body-3">Nothing is published yet. Add a real product, or import the sample catalogue as private drafts to learn the editor.</p><button type="button" className="btn btn--line" disabled={busy} onClick={() => setImporting(true)}>Import sample drafts</button></div> : <>
        <p className="caption-2 admin-list-count" aria-live="polite">{shown.length} {shown.length === 1 ? "product" : "products"}</p>
        <ul className="admin-products">{shown.map((product) => <li className="admin-product admin-panel" key={product.id}>
          <div className="admin-product__photo"><ProductImage product={product} width={200} /></div>
          <div className="admin-product__info"><h2 className="title-2">{product.name}</h2><p className="caption-2">{product.category} · {formatPrice(product.price)}</p><div className="admin-product__badges"><span className={`admin-badge admin-badge--${product.status}`}>{product.status}</span>{product.availability === "sold_out" && <span className="admin-badge">Sold out</span>}{product.featured && <span className="admin-badge">Featured</span>}</div></div>
          <div className="admin-product__actions"><button type="button" className="btn btn--line" disabled={busy || Boolean(loadError)} onClick={() => { setStatus(null); setEditor({ product }); }}>Edit<span className="sr-only"> {product.name}</span></button><button type="button" className="admin-danger admin-product__delete" aria-label={`Delete ${product.name}`} disabled={busy || Boolean(loadError)} onClick={() => setDeleting({ product })}><Trash size={19} /></button></div>
        </li>)}</ul>
        {products.length > 0 && shown.length === 0 && <p className="admin-status">No products match your search.</p>}
      </>}
      <div className="admin-maintenance"><button className="link-arrow" type="button" onClick={exportCatalogue} disabled={loading || Boolean(loadError) || busy}><DownloadSimple size={17} /> Export catalogue backup</button><button className="link-arrow" type="button" onClick={sweep} disabled={busy || loading}>Clean unused photos</button><p className="caption-2">Exports contain product records, not the original image files. Keep a separate photo archive.</p></div>
    </>}
    {deleting && <ConfirmDialog title={`Delete “${deleting.product.name}”?`} confirmLabel="Delete product" danger busy={busy} onCancel={() => setDeleting(null)} onConfirm={deleteProduct}><p>This removes the product from the website and customers’ bags. Hide it instead if you may want it back.</p></ConfirmDialog>}
    {importing && <ConfirmDialog title="Import sample products as drafts?" confirmLabel="Import private drafts" busy={busy} onCancel={() => setImporting(false)} onConfirm={importSamples}><p>These are placeholder descriptions, not verified product facts. Nothing will be published automatically. This action works only with an empty catalogue.</p></ConfirmDialog>}
  </>;
}
