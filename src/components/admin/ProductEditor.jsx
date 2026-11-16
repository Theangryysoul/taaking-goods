import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowSquareOut, Image, UploadSimple, X } from "@phosphor-icons/react";
import { defaultArt, METAL_PALETTES, METAL_SHAPES, productForm, productRecord, RESIN_PALETTES, RESIN_SHAPES, uniqueSlug, validateProductForm } from "../../lib/catalog";
import { cleanupImage, uploadImage } from "../../lib/cloudinary";
import ProductImage from "../ProductImage";
import ConfirmDialog from "./ConfirmDialog";

function Field({ label, name, value, onChange, error, hint, as = "input", ...props }) {
  const Control = as;
  const id = `product-${name}`;
  return <div className={`field${error ? " field--error" : ""}`}>
    <label htmlFor={id}>{label}</label>
    <Control id={id} name={name} value={value} onChange={(event) => onChange(name, event.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined} {...props} />
    {hint && <p className="caption-2" id={`${id}-hint`}>{hint}</p>}
    {error && <p className="field-error" id={`${id}-error`}>{error}</p>}
  </div>;
}

export default function ProductEditor({ product, products, categories, onSave, onClose, onDelete }) {
  const [form, setForm] = useState(() => productForm(product));
  const [newId] = useState(() => product?.id || crypto.randomUUID());
  const [errors, setErrors] = useState({});
  const [image, setImage] = useState(product?.imagePublicId ? {
    publicId: product.imagePublicId, url: product.image, cloudName: product.imageCloudName, version: product.imageVersion,
  } : null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [discard, setDiscard] = useState(false);
  const [customSlug, setCustomSlug] = useState(Boolean(product));
  const [cleanupQueue, setCleanupQueue] = useState([]);
  const fileRef = useRef(null);
  const formRef = useRef(null);
  const mounted = useRef(true);
  const inFlight = useRef(false);
  const initial = useMemo(() => JSON.stringify({ form: productForm(product), image: product?.imagePublicId || null }), [product]);
  const dirty = JSON.stringify({ form, image: image?.publicId || null }) !== initial;
  const jewellery = form.category.trim() === "Jewellery";
  const disabled = busy || uploading;

  useEffect(() => {
    mounted.current = true;
    formRef.current?.querySelector("input")?.focus();
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    const onUnload = (event) => { if (dirty || disabled) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [dirty, disabled]);

  const update = (name, value) => {
    if (name === "slug") setCustomSlug(true);
    setForm((current) => {
      const next = { ...current, [name]: value };
      if (name === "name" && !customSlug) next.slug = uniqueSlug(value, products, product?.id);
      if (name === "metal" && next.category.trim() === "Jewellery") next.artPalette = value === "Silver" ? "silver" : "gold";
      if (name === "category" && (value.trim() === "Jewellery") !== (current.category.trim() === "Jewellery")) {
        const art = defaultArt(value.trim(), current.metal);
        next.artShape = art.shape; next.artPalette = art.palette;
        if (value.trim() !== "Jewellery") next.hallmark = false;
      }
      return next;
    });
    setErrors((current) => ({ ...current, [name]: undefined }));
    setMessage("");
  };

  const abandonUploadedPhoto = async (asset) => {
    if (!asset?.publicId || asset.publicId === product?.imagePublicId) return;
    try { await cleanupImage(asset.publicId); }
    catch { setCleanupQueue((current) => [...new Set([...current, asset.publicId])]); }
  };

  const upload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || inFlight.current) return;
    inFlight.current = true;
    setUploading(true); setMessage("");
    try {
      const asset = await uploadImage(file);
      if (!mounted.current) { cleanupImage(asset.publicId).catch(() => {}); return; }
      const previous = image;
      setImage(asset);
      await abandonUploadedPhoto(previous);
    } catch (error) { if (mounted.current) setMessage(error.message); }
    finally { inFlight.current = false; if (mounted.current) setUploading(false); }
  };

  const removePhoto = async () => {
    const previous = image;
    setImage(null);
    await abandonUploadedPhoto(previous);
  };

  const close = () => {
    if (dirty) setDiscard(true);
    else onClose();
  };
  const discardChanges = async () => {
    setBusy(true);
    await abandonUploadedPhoto(image);
    // Failed cleanup remains safe and retryable through "Clean unused photos".
    onClose();
  };

  const save = async (event) => {
    event.preventDefault();
    if (inFlight.current) return;
    const nextErrors = validateProductForm(form);
    if (products.some((other) => other.id !== product?.id && other.slug === form.slug.trim())) nextErrors.slug = "That product URL is already in use.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setMessage("Check the highlighted fields before saving.");
      setTimeout(() => formRef.current?.querySelector('[aria-invalid="true"]')?.focus(), 0);
      return;
    }
    inFlight.current = true;
    setBusy(true); setMessage("");
    try {
      const record = productRecord(form, image?.publicId || null);
      if (!product) record.id = newId;
      await onSave(record, product, cleanupQueue);
    } catch (error) { if (mounted.current) setMessage(error.message); }
    finally { inFlight.current = false; if (mounted.current) setBusy(false); }
  };

  const preview = {
    name: form.name || "Product photo", category: form.category, metal: form.metal,
    art: { shape: form.artShape, palette: form.artPalette },
    image: image?.url || null, imagePublicId: image?.publicId, imageCloudName: image?.cloudName, imageVersion: image?.version,
  };

  return <section className="admin-editor" aria-labelledby="editor-heading">
    <div className="admin-editor__heading">
      <button type="button" className="link-arrow" onClick={close} disabled={disabled}><ArrowLeft size={16} /> Back to products</button>
      <h2 className="heading-4" id="editor-heading">{product ? "Edit product" : "Add a product"}</h2>
      <p className="body-3">Save as a draft to prepare a piece privately. Publish when it is ready for customers.</p>
    </div>
    <form ref={formRef} onSubmit={save} noValidate>
      <fieldset disabled={disabled} className="admin-editor__fields">
        <div className="admin-editor__main">
          <div className="admin-panel admin-form-section">
            <h3 className="title-1">Product details</h3>
            <Field label="Product name" name="name" value={form.name} onChange={update} error={errors.name} maxLength={120} required />
            <Field label="Product URL" name="slug" value={form.slug} onChange={update} error={errors.slug} maxLength={120} hint="Lowercase letters, numbers and hyphens. Keep this unchanged to preserve shared links." />
            {product?.status === "published" && <a className="link-arrow" href={`/shop/${product.slug}`} target="_blank" rel="noopener noreferrer">View current product <ArrowSquareOut size={15} /></a>}
            <Field label="Category" name="category" value={form.category} onChange={update} error={errors.category} maxLength={60} list="product-categories" hint='Choose an existing category or type a new one. Use “Jewellery” for the jewellery collection.' />
            <datalist id="product-categories">{categories.filter((category) => category !== "All").map((category) => <option key={category} value={category} />)}</datalist>
            <Field label="Short description" name="summary" value={form.summary} onChange={update} error={errors.summary} as="textarea" rows={2} maxLength={240} hint="Shown on the product page; required before publishing." />
            <Field label="Full description" name="description" value={form.description} onChange={update} error={errors.description} as="textarea" rows={5} maxLength={6000} />
            <Field label="Product details" name="details" value={form.details} onChange={update} error={errors.details} as="textarea" rows={5} hint="One detail per line, such as size, material or care instructions." />
          </div>
          {jewellery && <div className="admin-panel admin-form-section" data-category="Jewellery">
            <h3 className="title-1">Jewellery</h3>
            <Field label="Metal" name="metal" value={form.metal} onChange={update} error={errors.metal} as="select"><option>Gold</option><option>Silver</option></Field>
            <label className="admin-check"><input type="checkbox" checked={form.hallmark} onChange={(event) => update("hallmark", event.target.checked)} /> This piece is hallmarked</label>
            <p className="caption-2">Only state a hallmark when it is accurate. Purity, weight and making charges are confirmed on WhatsApp.</p>
          </div>}
        </div>
        <aside className="admin-editor__aside">
          <div className="admin-panel admin-form-section">
            <h3 className="title-1">Photo</h3>
            <div className="admin-photo"><ProductImage product={preview} width={600} eager /></div>
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={upload} className="admin-file" aria-label="Upload product photo" />
            <button type="button" className="btn btn--line" onClick={() => fileRef.current?.click()}><UploadSimple size={17} /> {uploading ? "Uploading…" : image ? "Replace photo" : "Upload photo"}</button>
            {image && <button type="button" className="link-arrow" onClick={removePhoto}><X size={15} /> Remove photo</button>}
            <p className="caption-2">JPEG, PNG or WebP, up to 5 MB. Large photos are automatically resized. One primary photo per product.</p>
            <details className="admin-art-options">
              <summary><Image size={16} /> Placeholder artwork</summary>
              <Field label="Shape" name="artShape" value={form.artShape} onChange={update} error={errors.artShape} as="select">{(jewellery ? METAL_SHAPES : RESIN_SHAPES).map((shape) => <option key={shape}>{shape}</option>)}</Field>
              <Field label="Colour" name="artPalette" value={form.artPalette} onChange={update} error={errors.artPalette} as="select">{(jewellery ? METAL_PALETTES : RESIN_PALETTES).map((palette) => <option key={palette}>{palette}</option>)}</Field>
            </details>
          </div>
          <div className="admin-panel admin-form-section">
            <h3 className="title-1">Price & publishing</h3>
            <label className="admin-check"><input type="checkbox" checked={form.enquiry} onChange={(event) => update("enquiry", event.target.checked)} /> Price on enquiry</label>
            {!form.enquiry && <Field label="Price (₹ INR)" name="price" value={form.price} onChange={update} error={errors.price} type="text" inputMode="decimal" placeholder="1499.00" />}
            <Field label="Visibility" name="status" value={form.status} onChange={update} error={errors.status} as="select"><option value="draft">Draft — private</option><option value="published">Published — visible to customers</option><option value="hidden">Hidden — removed from storefront</option></Field>
            <Field label="Availability" name="availability" value={form.availability} onChange={update} error={errors.availability} as="select"><option value="available">Available to order</option><option value="sold_out">Sold out — visible, not orderable</option></Field>
            <label className="admin-check"><input type="checkbox" checked={form.featured} onChange={(event) => update("featured", event.target.checked)} /> Feature on the homepage</label>
            <Field label="Display order" name="sortOrder" value={form.sortOrder} onChange={update} error={errors.sortOrder} inputMode="numeric" hint="Lower numbers appear first. Use 0 for the default." />
          </div>
        </aside>
      </fieldset>
      {message && <p className="admin-status admin-status--error" role="alert">{message}</p>}
      {cleanupQueue.length > 0 && <p className="admin-status" role="status">An unused photo could not be cleaned up. Your product can still be saved; use “Clean unused photos” later.</p>}
      <div className="admin-editor__actions">
        <button type="submit" className="btn btn--primary" disabled={disabled}>{busy ? "Saving…" : uploading ? "Uploading photo…" : form.status === "published" ? "Save & publish" : "Save product"}</button>
        <button type="button" className="btn btn--line" onClick={close} disabled={disabled}>Cancel</button>
        {product && <button type="button" className="admin-danger" onClick={() => onDelete(product, image?.publicId !== product.imagePublicId ? image?.publicId : null)} disabled={disabled}>Delete product</button>}
      </div>
    </form>
    {discard && <ConfirmDialog title="Discard unsaved changes?" confirmLabel="Discard changes" busy={busy} onCancel={() => setDiscard(false)} onConfirm={discardChanges}><p>The saved product will not change. Any unattached photo will be cleaned up when possible.</p></ConfirmDialog>}
  </section>;
}
