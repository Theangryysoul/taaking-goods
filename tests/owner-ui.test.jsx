import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ProductEditor from "../src/components/admin/ProductEditor";
import OwnerLogin from "../src/components/admin/OwnerLogin";
import ProductImage from "../src/components/ProductImage";
import { normalizeProduct } from "../src/lib/catalog";

vi.mock("../src/lib/cloudinary", async (importOriginal) => ({ ...(await importOriginal()), uploadImage: vi.fn(), cleanupImage: vi.fn().mockResolvedValue({}) }));
import { uploadImage } from "../src/lib/cloudinary";

const product = normalizeProduct({ id: "p1", slug: "original-tray", name: "Original tray", category: "Decor", price: null, summary: "A tray", status: "draft" });
const props = () => ({ products: [product], categories: ["All", "Tableware", "Decor", "Gifting", "Jewellery"], onSave: vi.fn().mockResolvedValue({}), onClose: vi.fn(), onDelete: vi.fn() });

describe("owner product editor", () => {
  it("preserves an existing product URL when renamed and saves enquiry prices as null", async () => {
    const callbacks = props();
    render(<ProductEditor {...callbacks} product={product} />);
    fireEvent.change(screen.getByLabelText("Product name"), { target: { value: "Renamed tray" } });
    expect(screen.getByLabelText("Product URL")).toHaveValue("original-tray");
    fireEvent.click(screen.getByRole("button", { name: "Save product" }));
    await waitFor(() => expect(callbacks.onSave).toHaveBeenCalled());
    expect(callbacks.onSave.mock.calls[0][0]).toMatchObject({ name: "Renamed tray", slug: "original-tray", price: null, status: "draft" });
  });
  it("generates a URL for a new product and validates before publishing", async () => {
    const callbacks = props();
    render(<ProductEditor {...callbacks} product={null} />);
    fireEvent.change(screen.getByLabelText("Product name"), { target: { value: "New piece" } });
    expect(screen.getByLabelText("Product URL")).toHaveValue("new-piece");
    fireEvent.change(screen.getByLabelText("Visibility"), { target: { value: "published" } });
    fireEvent.click(screen.getByRole("button", { name: "Save & publish" }));
    expect(callbacks.onSave).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent("highlighted");
    expect(screen.getByLabelText("Short description")).toHaveAttribute("aria-invalid", "true");
  });
  it("confirms unsaved cancellation instead of discarding a form silently", () => {
    const callbacks = props();
    render(<ProductEditor {...callbacks} product={product} />);
    fireEvent.change(screen.getByLabelText("Product name"), { target: { value: "Changed" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByText("Discard unsaved changes?")).toBeInTheDocument();
    expect(callbacks.onClose).not.toHaveBeenCalled();
  });
  it("keeps the old photo if replacement upload fails", async () => {
    uploadImage.mockRejectedValueOnce(new Error("Upload failed"));
    const photo = { ...product, image: "https://res.cloudinary.com/images/image/upload/v1/catalog/old.png", imagePublicId: "catalog/old", imageCloudName: "images", imageVersion: 1 };
    render(<ProductEditor {...props()} product={photo} />);
    const src = screen.getByRole("img", { name: "Original tray" }).getAttribute("src");
    fireEvent.change(screen.getByLabelText("Upload product photo"), { target: { files: [new File(["image"], "new.png", { type: "image/png" })] } });
    expect(await screen.findByRole("alert")).toHaveTextContent("Upload failed");
    expect(screen.getByRole("img", { name: "Original tray" })).toHaveAttribute("src", src);
  });
  it("retains the editor on a save conflict and displays the actual error", async () => {
    const callbacks = props(); callbacks.onSave.mockRejectedValueOnce(new Error("This product changed in another session."));
    render(<ProductEditor {...callbacks} product={product} />);
    fireEvent.click(screen.getByRole("button", { name: "Save product" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("changed in another session");
    expect(callbacks.onClose).not.toHaveBeenCalled();
  });
  it("falls back to generated artwork when image delivery fails", () => {
    render(<ProductImage product={{ ...product, image: "https://images.example/photo.jpg" }} />);
    fireEvent.error(screen.getByRole("img", { name: "Original tray" }));
    expect(screen.getByRole("img", { name: "Original tray" }).tagName.toLowerCase()).toBe("svg");
  });
});

describe("owner login and password recovery", () => {
  const auth = () => ({ session: null, owner: false, signIn: vi.fn().mockResolvedValue({}), requestReset: vi.fn().mockResolvedValue({}), resetPassword: vi.fn().mockResolvedValue({}) });
  it("signs in without providing signup or role assignment", async () => {
    const client = auth(); render(<OwnerLogin auth={client} />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "owner@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "long-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
    await waitFor(() => expect(client.signIn).toHaveBeenCalledWith("owner@example.com", "long-password"));
    expect(screen.queryByRole("button", { name: /sign up/i })).not.toBeInTheDocument();
  });
  it("requests a reset email with generic account-discovery wording", async () => {
    const client = auth(); render(<OwnerLogin auth={client} />);
    fireEvent.click(screen.getByText("Forgot password?"));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "owner@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByRole("status")).toHaveTextContent("If this email belongs to an account");
    expect(client.requestReset).toHaveBeenCalledWith("owner@example.com");
  });
  it("requires matching strong passwords in a verified owner recovery session", async () => {
    const client = { ...auth(), session: { user: { id: "owner" } }, owner: true };
    render(<OwnerLogin auth={client} recoveryPage />);
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "new-long-password" } });
    fireEvent.change(screen.getByLabelText("Repeat new password"), { target: { value: "new-long-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Update password" }));
    await waitFor(() => expect(client.resetPassword).toHaveBeenCalledWith("new-long-password"));
  });
});
