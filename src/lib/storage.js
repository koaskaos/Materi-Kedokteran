import { supabase } from "./supabase";

/**
 * Kompres gambar di browser sebelum upload.
 * - maxDim: sisi terpanjang (px). Default 1400 (cukup tajam di layar).
 * - quality: 0..1 kualitas JPEG.
 * Untuk diagram/scan berteks kecil, panggil dengan { highDetail: true }.
 * File non-gambar dikembalikan apa adanya.
 */
export async function compressImage(file, opts = {}) {
  const { maxDim = 1400, quality = 0.75, highDetail = false } = opts;
  if (!file || !file.type?.startsWith("image/")) return file;
  const dim = highDetail ? 2000 : maxDim;
  const q = highDetail ? 0.85 : quality;

  const bitmap = await createImageBitmap(file);
  let { width, height } = bitmap;
  const scale = Math.min(1, dim / Math.max(width, height));
  width = Math.round(width * scale);
  height = Math.round(height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, width, height);

  const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", q));
  const base = (file.name || "img").replace(/\.[^.]+$/, "");
  return new File([blob], `${base}.jpg`, { type: "image/jpeg" });
}

const rid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/**
 * SATU-SATUNYA jalur upload gambar materi. Semua fitur pakai ini.
 * Alur: kompres -> minta presigned PUT URL ke Edge Function `b2-sign`
 *       (secret B2 aman di server) -> PUT langsung ke Backblaze B2 -> kembalikan URL publik.
 *
 * @returns {Promise<string>} URL publik gambar
 */
export async function uploadGambar(file, opts = {}) {
  const { prefix = "", compress = true, highDetail = false } = opts;
  const f = compress ? await compressImage(file, { highDetail }) : file;
  const key = `${prefix}${rid()}.jpg`;

  // 1) minta URL bertanda tangan (hanya user login yang bisa)
  const { data: signed, error } = await supabase.functions.invoke("b2-sign", {
    body: { key, contentType: "image/jpeg" }
  });
  if (error) throw error;

  // 2) upload langsung ke B2
  const put = await fetch(signed.url, {
    method: "PUT",
    headers: { "Content-Type": "image/jpeg" },
    body: f
  });
  if (!put.ok) throw new Error("Upload gambar gagal (" + put.status + ")");

  // 3) URL publik (bucket B2 publik / lewat domain Cloudflare)
  return `${import.meta.env.VITE_B2_PUBLIC_URL}/${key}`;
}

/* ---------- BUKTI BAYAR: tetap di Supabase Storage (privat, kecil) ---------- */

/** Upload bukti bayar milik user (privat, folder = uid). */
export async function uploadBukti(file, userId) {
  const f = await compressImage(file, { maxDim: 1400, quality: 0.7 });
  const path = `${userId}/${rid()}.jpg`;
  const { error } = await supabase.storage.from("bukti").upload(path, f, { contentType: f.type });
  if (error) throw error;
  return path; // simpan path; URL bertanda-tangan dibuat saat admin mau lihat
}

/** Admin: URL sementara untuk melihat bukti bayar privat. */
export async function buktiSignedUrl(path, expiresSec = 300) {
  const { data, error } = await supabase.storage.from("bukti").createSignedUrl(path, expiresSec);
  if (error) throw error;
  return data.signedUrl;
}
