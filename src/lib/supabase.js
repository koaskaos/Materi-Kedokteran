import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anon) {
  // Bantu debugging kalau env belum diisi
  console.error("VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY belum diisi. Cek file .env");
}

export const supabase = createClient(url, anon, {
  auth: { persistSession: true, autoRefreshToken: true }
});
