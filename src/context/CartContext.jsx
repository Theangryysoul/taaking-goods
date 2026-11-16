import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useCatalog } from "./CatalogContext";
import { bagLines, bagSubtotal, isOrderable, orderFingerprint, parseBag, reconcileBag } from "../lib/catalog";

const CartContext = createContext(null);
const STORAGE_KEY = "taaking-bag-v1";

function readBag() {
  try { return parseBag(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]")); }
  catch { return []; }
}

export function CartProvider({ children }) {
  const catalog = useCatalog();
  const [entries, setEntries] = useState(readBag);
  const [isOpen, setIsOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries)); }
    catch { /* Private browsing or blocked storage must not break the bag. */ }
  }, [entries]);

  useEffect(() => {
    if (catalog.mode !== "live" || !catalog.ready || catalog.loading || catalog.error) return;
    const checked = reconcileBag(entriesRef.current, catalog.products);
    if (checked.removed) {
      setEntries(checked.entries);
      setNotice(`${checked.removed} ${checked.removed === 1 ? "piece is" : "pieces are"} no longer available and ${checked.removed === 1 ? "was" : "were"} removed from your bag.`);
    }
  }, [catalog.mode, catalog.revision, catalog.ready, catalog.loading, catalog.error, catalog.products]);

  const add = (product, qty = 1) => {
    if (!catalog.ready || catalog.error || !isOrderable(catalog.getProductById(product.id))) return;
    const amount = Math.min(9, Math.max(1, Math.floor(Number(qty) || 1)));
    setEntries((current) => {
      const found = current.find((entry) => entry.id === product.id);
      return found
        ? current.map((entry) => entry.id === product.id ? { ...entry, qty: Math.min(9, entry.qty + amount) } : entry)
        : [...current, { id: product.id, qty: amount }];
    });
  };

  const setQty = (id, qty) => setEntries((current) => current.map((entry) => entry.id === id
    ? { ...entry, qty: Math.min(9, Math.max(1, Math.floor(Number(qty) || 1))) } : entry));
  const remove = (id) => setEntries((current) => current.filter((entry) => entry.id !== id));
  const lines = useMemo(() => bagLines(entries, catalog.products), [entries, catalog.products]);
  const subtotal = bagSubtotal(lines);

  const verifyOrder = async () => {
    if (catalog.mode !== "live") throw new Error("Live ordering is available after catalogue setup.");
    const before = orderFingerprint(lines);
    const fresh = await catalog.refresh({ force: true });
    const checked = reconcileBag(entriesRef.current, fresh);
    const currentLines = bagLines(checked.entries, fresh);
    const changed = checked.removed > 0 || before !== orderFingerprint(currentLines);
    if (checked.removed) {
      setEntries(checked.entries);
      setNotice("Some pieces are no longer available. Please review your updated bag.");
    }
    return { changed, lines: currentLines, subtotal: bagSubtotal(currentLines) };
  };

  const value = {
    lines, subtotal, count: lines.reduce((total, line) => total + line.qty, 0), isOpen,
    notice, dismissNotice: () => setNotice(""), pending: !catalog.ready && catalog.mode === "live" && catalog.loading,
    demo: catalog.mode === "demo", error: catalog.error, verifyOrder, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false),
    add, setQty, remove, clear: () => setEntries([]),
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider.");
  return context;
}
