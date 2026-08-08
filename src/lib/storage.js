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
 *       (secret B2 aman di server) -> PUT langsung ke Backblaze B2 -> kembalikan KEY (bukan URL,
 *       karena bucket privat — pemanggilan URL harus lewat gambarSignedUrl()).
 *
 * @returns {Promise<string>} key objek di bucket B2 (simpan ini di database)
 */
export async function uploadGambar(file, opts = {}) {
  const { prefix = "", compress = true, highDetail = false } = opts;
  const f = compress ? await compressImage(file, { highDetail }) : file;
  const key = `${prefix}${rid()}.jpg`;

  // 1) minta URL bertanda tangan untuk upload (hanya user login yang bisa)
  const { data: signed, error } = await supabase.functions.invoke("b2-sign", {
    body: { key, contentType: "image/jpeg", mode: "write" }
  });
  if (error) throw error;

  // 2) upload langsung ke B2 (tanpa header Content-Type eksplisit —
  //    aturan CORS B2 lewat dashboard UI cuma izinkan origin, tidak ada kontrol allowedHeaders,
  //    jadi header tambahan bikin preflight ditolak 403)
  const put = await fetch(signed.url, {
    method: "PUT",
    body: f
  });
  if (!put.ok) throw new Error("Upload gambar gagal (" + put.status + ")");

  return key;
}

/**
 * Ambil URL sementara (signed, 1 jam) untuk menampilkan gambar dari bucket B2 privat.
 * Dipanggil setiap kali gambar akan ditampilkan (lihat komponen SignedImg di App.jsx).
 * @param {string} key - key objek yang disimpan dari uploadGambar()
 * @returns {Promise<string>} URL sementara yang bisa dipakai langsung di <img src>
 */
export async function gambarSignedUrl(key) {
  if (!key) return "";
  const { data, error } = await supabase.functions.invoke("b2-sign", {
    body: { key, mode: "read" }
  });
  if (error) throw error;
  return data.url;
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
