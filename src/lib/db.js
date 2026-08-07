import { supabase } from "./supabase";
import { uploadBukti } from "./storage";

/* =================== AUTH =================== */

// Daftar pelajar: buat akun + upload bukti + set nominal. Status verified=false.
export async function daftarPelajar({ name, email, password, buktiFile, amount }) {
  const { data, error } = await supabase.auth.signUp({
    email, password, options: { data: { name } }
  });
  if (error) throw error;
  const uid = data.user?.id;
  // Trigger DB sudah bikin baris profiles. Lengkapi nominal + bukti.
  let proof_url = null;
  if (uid && buktiFile) proof_url = await uploadBukti(buktiFile, uid);
  if (uid) {
    await supabase.from("profiles").update({ amount: amount ?? 0, proof_url }).eq("id", uid);
  }
  return data.user;
}

export async function login(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function logout() {
  await supabase.auth.signOut();
}

export async function lupaPassword(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset.html`
  });
  if (error) throw error;
}

// Profil user sekarang (termasuk role & verified). null kalau belum login / tanpa profil.
export async function currentProfile() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  if (error) throw error;
  if (!data) return { id: user.id, email: user.email, role: "pelajar", verified: false, orphan: true };
  return { ...data, email: data.email || user.email };
}

// Pantau perubahan sesi (login/logout) — dipakai di App useEffect.
export function onAuthChange(cb) {
  return supabase.auth.onAuthStateChange((_e, session) => cb(session));
}

/* =================== CONTENT (pohon materi/kuis) =================== */

export async function loadContent() {
  const { data, error } = await supabase.from("app_content").select("tree").eq("id", 1).single();
  if (error) throw error;
  return data.tree || {};
}

// Admin: simpan seluruh pohon (debounce di UI supaya tidak tiap ketikan).
export async function saveContent(tree) {
  const { error } = await supabase.from("app_content")
    .update({ tree, updated_at: new Date().toISOString() }).eq("id", 1);
  if (error) throw error;
}

/* =================== MEMBERS (admin) =================== */

export async function listMembers() {
  const { data, error } = await supabase.from("profiles")
    .select("*").eq("role", "pelajar").order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function verifyMember(id) {
  const { error } = await supabase.from("profiles").update({ verified: true }).eq("id", id);
  if (error) throw error;
}

export async function deleteMember(id) {
  // Hapus baris profil. (Menghapus akun auth butuh service key via Edge Function —
  // opsional; menghapus profil sudah cukup untuk mencabut akses karena RLS.)
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw error;
}

// Admin tambah akun manual (langsung terverifikasi) via Edge Function.
export async function adminCreateMember({ name, email, password, amount }) {
  const { data, error } = await supabase.functions.invoke("admin-create-user", {
    body: { name, email, password, amount }
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

/* =================== PAYMENT SETTINGS =================== */

export async function loadPayment() {
  const { data, error } = await supabase.from("payment_settings").select("*").eq("id", 1).single();
  if (error) throw error;
  return data;
}

export async function savePayment(p) {
  const { error } = await supabase.from("payment_settings")
    .update({ bank: p.bank, rek: p.rek, nama: p.nama, jumlah: p.jumlah }).eq("id", 1);
  if (error) throw error;
}
