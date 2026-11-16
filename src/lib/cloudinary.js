import { supabase } from "./supabase";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function cloudinaryImageUrl(product, width = 800) {
  if (!product.imagePublicId || !product.imageCloudName || !product.imageVersion) return product.image || null;
  const id = product.imagePublicId.split("/").map(encodeURIComponent).join("/");
  return `https://res.cloudinary.com/${encodeURIComponent(product.imageCloudName)}/image/upload/f_auto,q_auto,c_limit,w_${width}/v${product.imageVersion}/${id}`;
}

export function validateImage(file) {
  if (!file || !IMAGE_TYPES.includes(file.type)) throw new Error("Choose a JPEG, PNG or WebP photo. Convert HEIC photos first.");
  if (file.size < 1 || file.size > MAX_IMAGE_BYTES) throw new Error("Choose a photo smaller than 5 MB.");
}

export async function prepareImage(file) {
  validateImage(file);
  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("This photo could not be read. Choose another image."));
      element.src = url;
    });
    if (!image.naturalWidth || !image.naturalHeight || image.naturalWidth * image.naturalHeight > 50000000) throw new Error("This image is too large to process. Resize it before uploading.");
    const scale = Math.min(1, 1600 / image.naturalWidth, 2000 / image.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.floor(image.naturalHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare the image. Try another browser.");
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.84));
    if (!blob) throw new Error("Your browser could not compress this image.");
    const result = new File([blob], "product-photo.webp", { type: blob.type });
    validateImage(result);
    return result;
  } finally { URL.revokeObjectURL(url); }
}

export async function mediaRequest(body) {
  if (!supabase) throw new Error("Configure Supabase before uploading photos.");
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) throw new Error("Your session expired. Sign in again before uploading.");
  const { data, error } = await supabase.functions.invoke("catalog-media", {
    body, headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (error) {
    let message = "Photo service unavailable. Check the Edge Function, secrets and allowed origins in the setup guide.";
    try { message = (await error.context?.json())?.error || message; } catch { /* Never expose server internals. */ }
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}

export async function uploadImage(file) {
  const prepared = await prepareImage(file);
  const body = new FormData();
  body.append("file", prepared);
  return (await mediaRequest(body)).asset;
}

export async function cleanupImage(publicId) {
  if (!publicId) return;
  return mediaRequest({ action: "cleanup", publicId });
}

export async function sweepUnusedImages() {
  return mediaRequest({ action: "sweep" });
}
