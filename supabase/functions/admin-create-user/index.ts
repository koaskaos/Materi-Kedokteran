// Supabase Edge Function: admin-create-user
// Admin membuat akun pelajar manual (langsung terverifikasi).
// Butuh service role (disediakan otomatis oleh Supabase sebagai env).
// Deploy: supabase functions deploy admin-create-user

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";

    // 1) verifikasi pemanggil = admin
    const asUser = createClient(URL, ANON, { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await asUser.auth.getUser();
    if (!user) return json({ error: "unauthorized" }, 401);
    const { data: prof } = await asUser.from("profiles").select("role").eq("id", user.id).single();
    if (prof?.role !== "admin") return json({ error: "forbidden" }, 403);

    // 2) buat user pakai service role
    const { name, email, password, amount } = await req.json();
    if (!email || !password) return json({ error: "email & password wajib" }, 400);

    const admin = createClient(URL, SERVICE);
    const { data: created, error } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { name }
    });
    if (error) return json({ error: error.message }, 400);

    await admin.from("profiles")
      .update({ verified: true, amount: amount || 0, name, email })
      .eq("id", created.user.id);

    return json({ ok: true, id: created.user.id }, 200);
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
