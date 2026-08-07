import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { supabase } from "./lib/supabase";

const FONT = "'Plus Jakarta Sans', sans-serif";
const btn = { width: "100%", padding: "13px", borderRadius: 14, border: "none", background: "#118EEA", color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: FONT, marginTop: 6 };
const inp = { width: "100%", padding: "12px 14px", fontSize: 14, borderRadius: 12, border: "1px solid #E4EDF5", outline: "none", boxSizing: "border-box", background: "#F3F8FD", fontFamily: FONT, marginBottom: 10 };

function Reset() {
  const [ready, setReady] = useState(false);   // token recovery terdeteksi
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Supabase memicu event PASSWORD_RECOVERY saat halaman dibuka dari link email
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // fallback: kalau hash mengandung type=recovery
    if (window.location.hash.includes("type=recovery")) setReady(true);
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async () => {
    if (pw.length < 6) { setErr("Password minimal 6 karakter."); return; }
    if (pw !== pw2) { setErr("Konfirmasi password tidak sama."); return; }
    setBusy(true); setErr("");
    try { const { error } = await supabase.auth.updateUser({ password: pw }); if (error) throw error; setDone(true); }
    catch (e) { setErr(e?.message || "Gagal mengubah password."); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ minHeight: "100dvh", background: "linear-gradient(160deg,#118EEA,#0A5EA3)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: FONT }}>
      <div style={{ width: "100%", maxWidth: 400, background: "#fff", borderRadius: 22, padding: "26px 24px", boxShadow: "0 16px 50px rgba(0,0,0,0.22)" }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: "#0C6FC0", marginBottom: 6 }}>Atur ulang password</div>
        {done ? (
          <div>
            <div style={{ fontSize: 13.5, color: "#66708A", lineHeight: 1.6, margin: "10px 0 18px" }}>Password berhasil diubah. Silakan masuk dengan password baru.</div>
            <a href="/" style={{ ...btn, display: "block", textAlign: "center", textDecoration: "none" }}>Ke halaman masuk</a>
          </div>
        ) : !ready ? (
          <div style={{ fontSize: 13.5, color: "#66708A", lineHeight: 1.6, marginTop: 10 }}>Membuka tautan reset… Jika halaman ini tidak berubah, buka lagi tautan dari emailmu.</div>
        ) : (
          <div>
            <div style={{ fontSize: 12.5, color: "#66708A", margin: "6px 0 16px" }}>Masukkan password baru untuk akunmu.</div>
            {err && <div style={{ background: "#FCEBEA", border: "1px solid #F0A9A3", color: "#B23A31", fontSize: 12.5, borderRadius: 10, padding: "9px 12px", marginBottom: 12 }}>{err}</div>}
            <input type="password" placeholder="Password baru" value={pw} onChange={(e) => setPw(e.target.value)} style={inp} />
            <input type="password" placeholder="Ulangi password baru" value={pw2} onChange={(e) => setPw2(e.target.value)} style={inp} />
            <button onClick={submit} disabled={busy} style={btn}>{busy ? "Menyimpan…" : "Simpan password"}</button>
          </div>
        )}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<React.StrictMode><Reset /></React.StrictMode>);
