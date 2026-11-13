import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProductById } from "../data/catalog";

const CartContext = createContext(null);
const STORAGE_KEY = "taaking-bag-v1";

function readBag() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((entry) => ({
        id: String(entry.id),
        qty: Math.min(9, Math.max(1, Number(entry.qty) || 1)),
      }))
      .filter((entry) => Boolean(getProductById(entry.id)));
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [entries, setEntries] = useState(readBag);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      /* storage can be unavailable in private windows */
    }
  }, [entries]);

  const add = (product, qty = 1) => {
    setEntries((current) => {
      const found = current.find((entry) => entry.id === product.id);
      if (found) {
        return current.map((entry) =>
          entry.id === product.id
            ? { ...entry, qty: Math.min(9, entry.qty + qty) }
            : entry,
        );
      }
      return [...current, { id: product.id, qty: Math.min(9, Math.max(1, qty)) }];
    });
  };

  const setQty = (id, qty) => {
    const next = Math.min(9, Math.max(1, qty));
    setEntries((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, qty: next } : entry)),
    );
  };

  const remove = (id) => {
    setEntries((current) => current.filter((entry) => entry.id !== id));
  };

  const clear = () => setEntries([]);

  const lines = useMemo(
    () =>
      entries
        .map((entry) => {
          const product = getProductById(entry.id);
          return product ? { product, qty: entry.qty } : null;
        })
        .filter(Boolean),
    [entries],
  );

  const count = lines.reduce((total, line) => total + line.qty, 0);
  const everyPriceKnown = lines.length > 0 && lines.every((line) => typeof line.product.price === "number");
  const subtotal = everyPriceKnown
    ? lines.reduce((total, line) => total + line.product.price * line.qty, 0)
    : null;

  const value = {
    lines,
    count,
    subtotal,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    add,
    setQty,
    remove,
    clear,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
