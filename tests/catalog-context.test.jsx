import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { CatalogProvider, useCatalog } from "../src/context/CatalogContext";
import { CartProvider, useCart } from "../src/context/CartContext";
import { normalizeProduct } from "../src/lib/catalog";
import Product from "../src/pages/Product";
import { Route, Routes } from "react-router-dom";

const live = { mode: "live", error: "" };
const product = normalizeProduct({ id: "p1", slug: "blue-tray", name: "Blue tray", category: "Decor", price: 100, summary: "A tray", status: "published" });
const deferred = () => { let resolve; let reject; const promise = new Promise((ok, fail) => { resolve = ok; reject = fail; }); return { promise, resolve, reject }; };

function Probe() {
  const catalog = useCatalog();
  const cart = useCart();
  return <>
    <p data-testid="state">{catalog.mode}:{catalog.ready ? "ready" : "waiting"}:{catalog.error ? "error" : "ok"}</p>
    <p data-testid="count">{cart.count}</p><p data-testid="subtotal">{String(cart.subtotal)}</p>
    <p data-testid="notice">{cart.notice}</p>
    <button onClick={() => catalog.refresh().catch(() => {})}>Refresh</button>
    <button onClick={() => cart.verifyOrder().then((result) => { window.__order = result; }, (error) => { window.__orderError = error.message; })}>Verify</button>
  </>;
}
function mount(repository, config = live) {
  return render(<MemoryRouter><CatalogProvider config={config} repository={repository}><CartProvider><Probe /></CartProvider></CatalogProvider></MemoryRouter>);
}

describe("async catalogue and saved bag", () => {
  it("retains saved IDs during loading and restores lines when published records arrive", async () => {
    localStorage.setItem("taaking-bag-v1", JSON.stringify([{ id: "p1", qty: 2 }]));
    const fetch = deferred();
    mount({ list: vi.fn(() => fetch.promise) });
    expect(screen.getByTestId("state")).toHaveTextContent("waiting");
    expect(JSON.parse(localStorage.getItem("taaking-bag-v1"))).toEqual([{ id: "p1", qty: 2 }]);
    await act(async () => fetch.resolve([product]));
    expect(screen.getByTestId("count")).toHaveTextContent("2");
    expect(screen.getByTestId("subtotal")).toHaveTextContent("200");
  });
  it("does not purge saved items on an initial failure or substitute sample products", async () => {
    localStorage.setItem("taaking-bag-v1", JSON.stringify([{ id: "p1", qty: 2 }]));
    mount({ list: vi.fn().mockRejectedValue(new Error("offline")) });
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("live:waiting:error"));
    expect(JSON.parse(localStorage.getItem("taaking-bag-v1"))).toEqual([{ id: "p1", qty: 2 }]);
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });
  it("reconciles only after a successful retry and excludes draft records even in an owner session", async () => {
    localStorage.setItem("taaking-bag-v1", JSON.stringify([{ id: "p1", qty: 1 }, { id: "draft", qty: 1 }]));
    const repository = { list: vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue([product, { ...product, id: "draft", status: "draft" }]) };
    mount(repository);
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("error"));
    fireEvent.click(screen.getByText("Refresh"));
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("1"));
    // Reconciliation runs in an effect, so the notice and the re-persisted bag
    // both arrive asynchronously after the catalogue retry resolves.
    await waitFor(() => expect(screen.getByTestId("notice")).toHaveTextContent("no longer available"));
    await waitFor(() => expect(JSON.parse(localStorage.getItem("taaking-bag-v1"))).toEqual([{ id: "p1", qty: 1 }]));
  });
  it("shows the latest prices and asks for review when order verification detects a change", async () => {
    localStorage.setItem("taaking-bag-v1", JSON.stringify([{ id: "p1", qty: 1 }]));
    const repository = { list: vi.fn().mockResolvedValueOnce([product]).mockResolvedValue([{ ...product, price: 125 }]) };
    mount(repository);
    await waitFor(() => expect(screen.getByTestId("subtotal")).toHaveTextContent("100"));
    fireEvent.click(screen.getByText("Verify"));
    await waitFor(() => expect(window.__order?.changed).toBe(true));
    expect(screen.getByTestId("subtotal")).toHaveTextContent("125");
    delete window.__order;
  });
  it("preserves a populated bag on a refresh failure and rejects unverified ordering", async () => {
    localStorage.setItem("taaking-bag-v1", JSON.stringify([{ id: "p1", qty: 1 }]));
    const repository = { list: vi.fn().mockResolvedValueOnce([product]).mockRejectedValue(new Error("offline")) };
    mount(repository);
    await waitFor(() => expect(screen.getByTestId("count")).toHaveTextContent("1"));
    fireEvent.click(screen.getByText("Verify"));
    await waitFor(() => expect(window.__orderError).toBe("offline"));
    expect(screen.getByTestId("count")).toHaveTextContent("1");
    expect(JSON.parse(localStorage.getItem("taaking-bag-v1"))).toHaveLength(1);
    delete window.__orderError;
  });
  it("never replaces an empty live catalogue with samples", async () => {
    mount({ list: vi.fn().mockResolvedValue([]) });
    await waitFor(() => expect(screen.getByTestId("state")).toHaveTextContent("live:ready:ok"));
    expect(screen.getByTestId("count")).toHaveTextContent("0");
  });
  it("does not erase live saved IDs while the site is in sample mode", () => {
    localStorage.setItem("taaking-bag-v1", JSON.stringify([{ id: "real-live-id", qty: 2 }]));
    mount({ list: vi.fn() }, { mode: "demo", error: "" });
    expect(JSON.parse(localStorage.getItem("taaking-bag-v1"))).toEqual([{ id: "real-live-id", qty: 2 }]);
  });
  it("keeps incomplete configuration distinct from sample mode", () => {
    const repository = { list: vi.fn() };
    mount(repository, { mode: "error", error: "Incomplete configuration" });
    expect(screen.getByTestId("state")).toHaveTextContent("error:waiting:error");
    expect(repository.list).not.toHaveBeenCalled();
  });
  it("shows loading rather than not-found before a product query finishes", async () => {
    const query = deferred();
    render(<MemoryRouter initialEntries={["/shop/blue-tray"]}><CatalogProvider config={live} repository={{ list: () => query.promise }}><CartProvider><Routes><Route path="/shop/:slug" element={<Product />} /></Routes></CartProvider></CatalogProvider></MemoryRouter>);
    expect(screen.getByText("Loading the collection…")).toBeInTheDocument();
    expect(screen.queryByText("Blue tray")).not.toBeInTheDocument();
    await act(async () => query.resolve([product]));
    expect(screen.getByRole("heading", { name: "Blue tray" })).toBeInTheDocument();
  });
});
