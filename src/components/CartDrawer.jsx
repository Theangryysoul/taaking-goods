import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Check,
  Copy,
  Minus,
  Plus,
  Trash,
  WhatsappLogo,
  X,
} from "@phosphor-icons/react";
import { useCart } from "../context/CartContext";
import { hasWhatsApp, whatsappUrl } from "../config";
import { formatPrice } from "../lib/format";
import { buildOrderMessage } from "../lib/order";
import { copyText } from "../lib/clipboard";
import { startScroll, stopScroll } from "../lib/scroll";
import ResinArt from "./ResinArt";
import ProductImage from "./ProductImage";

const emptyFields = { name: "", city: "", pincode: "", note: "" };

export default function CartDrawer() {
  const { lines, count, subtotal, isOpen, closeCart, setQty, remove, notice, pending, demo, error: catalogError, verifyOrder } = useCart();
  const [checking, setChecking] = useState(false);
  const [preparedOrder, setPreparedOrder] = useState(null);
  const [fields, setFields] = useState(emptyFields);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ kind: "", message: "" });
  const [closing, setClosing] = useState(false);
  const dialogRef = useRef(null);
  const closeRef = useRef(null);
  const triggerRef = useRef(null);
  const closeTimer = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen) return undefined;

    triggerRef.current = document.activeElement;
    setClosing(false);
    setErrors({});
    setStatus({ kind: "", message: "" });
    setPreparedOrder(null);

    if (!dialog.open) dialog.showModal();
    stopScroll();

    const focusTimer = window.setTimeout(() => {
      closeRef.current?.focus({ preventScroll: true });
    }, 60);

    const onClose = () => {
      closeCart();
      setClosing(false);
    };

    dialog.addEventListener("close", onClose);

    return () => {
      window.clearTimeout(focusTimer);
      window.clearTimeout(closeTimer.current);
      dialog.removeEventListener("close", onClose);
      startScroll();
      triggerRef.current?.focus?.({ preventScroll: true });
    };
  }, [isOpen]);

  const requestClose = () => {
    const dialog = dialogRef.current;
    if (!dialog?.open || closing) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(() => {
      if (dialog.open) dialog.close();
    }, 300);
  };

  const updateField = (key, value) => {
    setFields((current) => ({ ...current, [key]: value }));
    if (errors[key]) {
      setErrors((current) => ({ ...current, [key]: undefined }));
    }
  };

  const validate = () => {
    const next = {};
    if (fields.name.trim().length < 2) next.name = "Please add your name.";
    if (fields.city.trim().length < 2) next.city = "Please add your city.";
    if (!/^\d{6}$/.test(fields.pincode.trim())) next.pincode = "Add a 6 digit pincode.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const orderSnapshot = JSON.stringify({ lines: lines.map(({ product, qty }) => [product.id, product.name, product.slug, product.price, qty]), fields });
  const orderReady = preparedOrder?.snapshot === orderSnapshot && Date.now() < preparedOrder.expiresAt && !catalogError;
  const validatingRef = useRef(false);
  useEffect(() => {
    if (preparedOrder && preparedOrder.snapshot !== orderSnapshot) {
      setPreparedOrder(null);
      setStatus({ kind: "info", message: "Your order details changed. Check current prices and availability again before sending." });
    }
  }, [orderSnapshot, preparedOrder]);
  useEffect(() => {
    if (!preparedOrder) return undefined;
    const expiry = window.setTimeout(() => {
      setPreparedOrder(null);
      setStatus({ kind: "info", message: "Please check current prices and availability again before sending." });
    }, 60000);
    return () => window.clearTimeout(expiry);
  }, [preparedOrder]);

  // Verify first, then use a second direct click for WhatsApp/clipboard. A
  // network await can consume the browser's popup/clipboard user gesture.
  const prepareOrder = async () => {
    if (validatingRef.current) return;
    setStatus({ kind: "", message: "" });
    setPreparedOrder(null);
    if (!validate()) {
      setStatus({ kind: "error", message: "Check the highlighted details and try again." });
      return;
    }
    validatingRef.current = true;
    setChecking(true);
    try {
      const checked = await verifyOrder();
      if (!checked.lines.length) throw new Error("There are no available pieces in your bag.");
      if (checked.changed) {
        setStatus({ kind: "info", message: "Prices or availability changed. Review the updated bag, then check your order again." });
        return;
      }
      setPreparedOrder({ snapshot: orderSnapshot, message: buildOrderMessage(checked.lines, fields, checked.subtotal), expiresAt: Date.now() + 60000 });
      setStatus({ kind: "ok", message: "Prices and availability checked. Your order is ready to send or copy below." });
    } catch {
      setStatus({ kind: "error", message: "We could not verify current prices and availability. Try checking your order again." });
    } finally {
      validatingRef.current = false;
      setChecking(false);
    }
  };

  const onSubmit = (event) => {
    event.preventDefault();
    prepareOrder();
  };

  const onCopy = async () => {
    if (!orderReady || Date.now() >= preparedOrder.expiresAt) { prepareOrder(); return; }
    try {
      await copyText(preparedOrder.message);
      setStatus({ kind: "ok", message: "Order copied. Send it to the studio whenever you are ready." });
    } catch {
      setStatus({ kind: "error", message: "Copy failed. Your browser blocked clipboard access." });
    }
  };

  const handleBrowse = () => {
    requestClose();
    window.setTimeout(() => navigate("/shop"), 160);
  };

  const empty = lines.length === 0;

  return (
    <dialog
      ref={dialogRef}
      className={`cart-dialog${closing ? " is-closing" : ""}`}
      aria-labelledby="cart-title"
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) requestClose();
      }}
    >
      <div className="cart-dialog__inner">
        <header className="cart-head">
          <div>
            <p className="eyebrow">Your bag</p>
            <h2 className="heading-5 cart-head__title" id="cart-title">
              {empty ? "Waiting for a piece" : `${count} ${count === 1 ? "piece" : "pieces"}`}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="icon-btn cart-close"
            onClick={requestClose}
            aria-label="Close bag"
          >
            <X size={18} weight="regular" aria-hidden="true" />
          </button>
        </header>

        <div className="cart-body" data-lenis-prevent>
          {demo && <p className="catalog-notice" role="status">Sample bag · Live ordering will be enabled after catalogue setup.</p>}
          {notice && <p className="catalog-notice" role="status">{notice}</p>}
          {catalogError && <p className="catalog-notice catalog-notice--error" role="alert">The catalogue is unavailable. Your saved bag is retained; retry when the connection returns.</p>}
          {pending || (catalogError && empty) ? <p className="catalog-notice" role="status">{pending ? "Loading your saved bag…" : "Your bag will be shown when the catalogue is available again."}</p> : empty ? (
            <div className="cart-empty">
              <div className="cart-empty__art">
                <ResinArt shape="dish" palette="sage" label="A resin dish in muted green" />
              </div>
              <h3 className="heading-4">Your bag is quiet.</h3>
              <p className="body-3">
                Pieces you add here will wait for you, even if you wander off to look at the rest of the studio.
              </p>
              <button type="button" className="btn btn--primary" onClick={handleBrowse}>
                Browse the collection
                <ArrowRight size={16} weight="regular" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <>
              <ul className="cart-lines">
                {lines.map(({ product, qty }) => (
                  <li className="cart-line" key={product.id}>
                    <div className="cart-line__art">
                      <ProductImage product={product} width={200} />
                    </div>

                    <div className="cart-line__body">
                      <Link
                        to={`/shop/${product.slug}`}
                        className="title-3 cart-line__name"
                        onClick={requestClose}
                      >
                        {product.name}
                      </Link>
                      <p className="caption-2 cart-line__category">{product.category}</p>

                      <div className="cart-line__row">
                        <div className="qty qty--sm" role="group" aria-label={`Quantity for ${product.name}`}>
                          <button
                            type="button"
                            onClick={() => setQty(product.id, qty - 1)}
                            disabled={qty <= 1}
                            aria-label="Decrease quantity"
                          >
                            <Minus size={12} weight="bold" aria-hidden="true" />
                          </button>
                          <span className="qty__value" aria-live="polite">{qty}</span>
                          <button
                            type="button"
                            onClick={() => setQty(product.id, qty + 1)}
                            disabled={qty >= 9}
                            aria-label="Increase quantity"
                          >
                            <Plus size={12} weight="bold" aria-hidden="true" />
                          </button>
                        </div>
                        <p className="body-5 cart-line__price">{formatPrice(product.price)}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="cart-line__remove"
                      onClick={() => remove(product.id)}
                      aria-label={`Remove ${product.name}`}
                    >
                      <Trash size={15} weight="regular" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>

              <form className="cart-form" id="bag-order-form" onSubmit={onSubmit} noValidate>
                <div className="cart-form__head">
                  <p className="eyebrow">Delivery details</p>
                  <p className="caption-2">
                    We confirm stock, shipping, and the final price before you pay. A 75% advance
                    confirms the order.
                  </p>
                </div>

                <div className={`field${errors.name ? " field--error" : ""}`}>
                  <label htmlFor="bag-name">Name</label>
                  <input
                    id="bag-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={fields.name}
                    onChange={(event) => updateField("name", event.target.value)}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? "bag-name-error" : undefined}
                    placeholder="Your full name"
                  />
                  {errors.name && <p className="field-error" id="bag-name-error">{errors.name}</p>}
                </div>

                <div className="field-row">
                  <div className={`field${errors.city ? " field--error" : ""}`}>
                    <label htmlFor="bag-city">City</label>
                    <input
                      id="bag-city"
                      name="city"
                      type="text"
                      autoComplete="address-level2"
                      value={fields.city}
                      onChange={(event) => updateField("city", event.target.value)}
                      aria-invalid={Boolean(errors.city)}
                      aria-describedby={errors.city ? "bag-city-error" : undefined}
                      placeholder="Where it is going"
                    />
                    {errors.city && <p className="field-error" id="bag-city-error">{errors.city}</p>}
                  </div>

                  <div className={`field${errors.pincode ? " field--error" : ""}`}>
                    <label htmlFor="bag-pincode">Pincode</label>
                    <input
                      id="bag-pincode"
                      name="pincode"
                      type="text"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={6}
                      value={fields.pincode}
                      onChange={(event) =>
                        updateField("pincode", event.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      aria-invalid={Boolean(errors.pincode)}
                      aria-describedby={errors.pincode ? "bag-pincode-error" : undefined}
                      placeholder="6 digits"
                    />
                    {errors.pincode && (
                      <p className="field-error" id="bag-pincode-error">{errors.pincode}</p>
                    )}
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="bag-note">
                    Note <span className="field__optional">(optional)</span>
                  </label>
                  <textarea
                    id="bag-note"
                    name="note"
                    rows={2}
                    value={fields.note}
                    onChange={(event) => updateField("note", event.target.value)}
                    placeholder="Gift note, colour preference, timeline"
                  />
                </div>
              </form>
            </>
          )}
        </div>

        {!empty && (
          <footer className="cart-foot">
            <div className="cart-total">
              <span className="body-5">Subtotal</span>
              <span className="title-2">
                {subtotal === null ? "To be confirmed" : formatPrice(subtotal)}
              </span>
            </div>

            {orderReady ? (
              <>
                {hasWhatsApp() && (
                  <a className="btn btn--primary cart-submit" href={whatsappUrl(preparedOrder.message)} target="_blank" rel="noopener noreferrer" onClick={(event) => {
                    if (Date.now() >= preparedOrder.expiresAt) {
                      event.preventDefault();
                      setPreparedOrder(null);
                      setStatus({ kind: "info", message: "Please check current prices and availability again before sending." });
                    }
                  }}>
                    <WhatsappLogo size={18} weight="regular" aria-hidden="true" />
                    Send order on WhatsApp
                  </a>
                )}
                <button type="button" className="cart-copy" onClick={onCopy}>
                  <Copy size={14} weight="regular" aria-hidden="true" />
                  Copy order details
                </button>
              </>
            ) : (
              <button type="submit" form="bag-order-form" className="btn btn--primary cart-submit" disabled={checking || pending || demo}>
                <Check size={17} weight="regular" aria-hidden="true" />
                {checking ? "Checking prices…" : "Check order & continue"}
              </button>
            )}

            <p className="caption-2 cart-foot__note">
              {hasWhatsApp()
                ? "No payment is taken here. A 75% advance confirms your order; the balance and shipping are agreed on WhatsApp before dispatch."
                : "WhatsApp ordering is not connected yet. Copy your order and send it to the studio."}
            </p>

            <p className="caption-2 cart-foot__note">
              Returns are not offered by default. Only pieces marked return-eligible may be
              returned, with a 30% deduction.
            </p>

            {status.message && (
              <p
                className={`cart-status cart-status--${status.kind}`}
                role={status.kind === "error" ? "alert" : "status"}
              >
                {status.kind === "ok" && <Check size={14} weight="bold" aria-hidden="true" />}
                {status.message}
              </p>
            )}
          </footer>
        )}
      </div>
    </dialog>
  );
}
