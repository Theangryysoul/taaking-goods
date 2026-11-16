import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useOwnerAuth } from "../src/hooks/useOwnerAuth";
import { createCatalogRepository } from "../src/lib/catalogRepository";

function authClient(owner = false) {
  const session = { user: { id: "user", user_metadata: { role: "owner" } }, access_token: "token" };
  let callback;
  return {
    session,
    get callback() { return callback; },
    rpc: vi.fn().mockResolvedValue({ data: owner, error: null }),
    auth: {
      onAuthStateChange: vi.fn((fn) => { callback = fn; return { data: { subscription: { unsubscribe: vi.fn() } } }; }),
      getSession: vi.fn().mockResolvedValue({ data: { session }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { session }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  };
}

describe("database-verified owner access", () => {
  it("does not grant ownership from editable Auth metadata", async () => {
    const client = authClient(false);
    const { result } = renderHook(() => useOwnerAuth(client));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.owner).toBe(false);
    expect(client.rpc).toHaveBeenCalledWith("is_catalog_admin");
  });
  it("keeps a verified editor mounted during token refresh and clears access on sign-out", async () => {
    const client = authClient(true);
    const { result } = renderHook(() => useOwnerAuth(client));
    await waitFor(() => expect(result.current.owner).toBe(true));
    await act(async () => { client.callback("TOKEN_REFRESHED", client.session); });
    await waitFor(() => expect(client.rpc).toHaveBeenCalledTimes(2));
    expect(result.current.loading).toBe(false);
    expect(result.current.owner).toBe(true);
    await act(async () => { client.callback("SIGNED_OUT", null); });
    await waitFor(() => expect(result.current.session).toBeNull());
    expect(result.current.owner).toBe(false);
  });
  it("fails closed when owner verification fails", async () => {
    const client = authClient(true); client.rpc.mockResolvedValue({ error: { message: "offline" }, data: null });
    const { result } = renderHook(() => useOwnerAuth(client));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.owner).toBe(false);
    expect(result.current.error).toContain("could not be verified");
  });
});

describe("catalogue mutation concurrency", () => {
  it("matches product ID and version before updating and reports an empty result as a conflict", async () => {
    const query = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
    const repository = createCatalogRepository({ from: vi.fn(() => query) });
    await expect(repository.save({ name: "Changed" }, { id: "p1", version: 4 })).rejects.toThrow("changed or was removed");
    expect(query.eq).toHaveBeenCalledWith("id", "p1");
    expect(query.eq).toHaveBeenCalledWith("version", 4);
  });
  it("does not report a stale delete as success", async () => {
    const query = { delete: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), select: vi.fn().mockResolvedValue({ data: [], error: null }) };
    const repository = createCatalogRepository({ from: vi.fn(() => query) });
    await expect(repository.remove({ id: "p1", version: 4 })).rejects.toThrow("changed or was removed");
  });
  it("always filters public reads to published products and paginates larger catalogues", async () => {
    const row = { id: "p", slug: "piece", name: "Piece", category: "Decor", price: null, status: "published" };
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), range: vi.fn().mockResolvedValueOnce({ data: Array.from({ length: 500 }, (_, i) => ({ ...row, id: `p${i}` })), error: null }).mockResolvedValueOnce({ data: [{ ...row, id: "p500" }], error: null }) };
    const repository = createCatalogRepository({ from: vi.fn(() => query) });
    const products = await repository.list();
    expect(products).toHaveLength(501);
    expect(query.eq).toHaveBeenCalledWith("status", "published");
    expect(query.range).toHaveBeenCalledWith(500, 999);
  });
});
