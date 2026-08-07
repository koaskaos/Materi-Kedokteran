# Tutorial Produksi — Supabase + Backblaze B2
App **Materi Belajar Kedokteran**. Arsitektur final:
- **Supabase** = login (admin + pelajar) + database (materi/kuis, anggota, pengaturan bayar) + bukti bayar (privat).
- **Backblaze B2** = penyimpanan **gambar materi** (gratis 10GB, tanpa kartu kredit).

Ikuti berurutan: FASE 1 (Supabase) dulu sampai app jalan, lalu FASE 2 (B2) untuk gambar.

> Tampilan dashboard bisa berubah sedikit. Kalau nama tombol beda, cari yang maksudnya sama.

---

# FASE 1 — SUPABASE (login + database)

## 1. Buat project
1. https://supabase.com → **New project**.
2. Nama `materi-kedokteran`, set **Database Password** (simpan!), region **Singapore**.
3. Tunggu ~2 menit.

## 2. Ambil kunci API
1. **Project Settings → API**. Salin **Project URL** dan **anon public key**.
2. Salin `.env.example` → `.env`, isi:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```
   (`.env` tidak di-commit — sudah di `.gitignore`.)

## 3. Jalankan skema database
1. **SQL Editor → New query**.
2. Buka `supabase/schema.sql`, salin **seluruh** isinya, tempel, **Run**.
3. Membuat: tabel `profiles`, `app_content`, `payment_settings`, trigger auto-profile, RLS, dan bucket privat `bukti` (untuk bukti bayar).

## 4. Konfigurasi Auth
1. **Authentication → Providers → Email**: pastikan **Enable**.
2. Untuk uji awal, **matikan "Confirm email"** (pelajar bisa langsung login). Nyalakan lagi sebelum rilis kalau mau.
3. **Authentication → URL Configuration**: set **Site URL** ke domain app + tambahkan URL Vercel di **Redirect URLs** (penting untuk link reset password).

## 5. Buat akun admin (kamu)
1. **Authentication → Users → Add user** → email + password admin → Create.
2. Salin **UUID** user itu.
3. **SQL Editor**, jalankan (ganti UUID):
   ```sql
   update public.profiles set role='admin', verified=true where id='<UUID_AKUN_ADMIN>';
   ```

## 6. Deploy frontend (Vercel)
1. Lokal: `npm install` → `npm run dev` → coba daftar & login.
2. Vercel → **Settings → Environment Variables**: tambah `VITE_SUPABASE_URL` & `VITE_SUPABASE_ANON_KEY`. Redeploy.

Sampai sini: **login asli + database jalan**. Bukti bayar tersimpan di Supabase. Tinggal gambar materi (FASE 2).

---

# FASE 2 — BACKBLAZE B2 (gambar materi)

## 1. Buat akun B2 (tanpa kartu)
1. https://www.backblaze.com/cloud-storage → **Sign up** (cukup email; free tier 10GB tidak minta kartu).
2. Setelah masuk, aktifkan **B2 Cloud Storage** kalau diminta.

## 2. Buat bucket
1. **B2 Cloud Storage → Buckets → Create a Bucket**.
2. Nama unik global, mis. `materi-kedokteran-img` (nama harus unik antar semua user B2; kalau ditolak, tambah angka).
3. **Files in Bucket are: Public** (supaya gambar bisa dibaca lewat URL).
4. Setelah dibuat, klik bucket → catat **Endpoint** (mis. `s3.us-west-004.backblazeb2.com`). Bagian `us-west-004` = **region**-mu.

## 3. Buat Application Key
1. **Account → Application Keys → Add a New Application Key**.
2. Name: `materi-app`. **Allow access to Bucket:** pilih bucket tadi. **Type:** Read and Write.
3. **Create New Key**. Catat **keyID** dan **applicationKey** — *applicationKey hanya ditampilkan sekali!*

## 4. Isi URL publik di frontend
Di `.env` (dan Vercel), isi (ganti region & nama bucket):
```
VITE_B2_PUBLIC_URL=https://s3.us-west-004.backblazeb2.com/materi-kedokteran-img
```

## 5. Deploy Edge Function penandatangan
Butuh Supabase CLI: `npm i -g supabase`, lalu `supabase login` dan `supabase link --project-ref <ref-project>` (ref ada di URL dashboard).
1. File sudah ada: `supabase/functions/b2-sign/index.ts`.
2. Set secrets (ganti nilainya, region & bucket sesuai punyamu):
   ```
   supabase secrets set \
     B2_KEY_ID=xxxxxxxx \
     B2_APP_KEY=xxxxxxxxxxxxxxxx \
     B2_BUCKET=materi-kedokteran-img \
     B2_ENDPOINT=https://s3.us-west-004.backblazeb2.com \
     B2_REGION=us-west-004
   ```
3. Deploy:
   ```
   supabase functions deploy b2-sign
   ```

## 6. Atur CORS bucket (izinkan upload dari web)
B2 CORS diatur lewat CLI B2 (`b2` tool) atau S3 API. Cara termudah pakai tool `b2`:
```
pip install b2
b2 authorize-account <keyID> <applicationKey>
b2 update-bucket --corsRules '[
  {
    "corsRuleName": "webupload",
    "allowedOrigins": ["https://materikedokteran.com","http://localhost:5173"],
    "allowedOperations": ["s3_put","s3_get"],
    "allowedHeaders": ["*"],
    "maxAgeSeconds": 3600
  }
]' materi-kedokteran-img allPublic
```
(Ganti origin & nama bucket. Tambahkan URL Vercel-mu juga.)

Setelah ini, upload gambar dari panel admin akan naik ke B2, dan URL-nya tersimpan di database.

---

# OPSIONAL — Cloudflare di depan B2 (lebih cepat + egress gratis)
Kalau nanti gambar makin sering dibuka dan mau ngebut + hemat bandwidth:
1. Punya domain di Cloudflare (gratis). Buat subdomain, mis. `cdn.materikedokteran.com`.
2. Ikuti panduan resmi **"Backblaze B2 + Cloudflare"** (Bandwidth Alliance) untuk mapping subdomain ke bucket B2. Egress B2→Cloudflare gratis.
3. Ganti `VITE_B2_PUBLIC_URL=https://cdn.materikedokteran.com`. Selesai — tanpa ubah kode lain.

Tidak wajib di awal. B2 langsung sudah jalan.

---

# Alur data (ringkas)
- **Daftar pelajar** → `auth.signUp` → trigger bikin `profiles` (verified=false) → bukti bayar ke Supabase `bukti/<uid>/` → admin verifikasi.
- **Login** → `signInWithPassword`; app baca `profiles.role` & `verified`.
- **Baca materi** → hanya pelajar verified / admin (RLS) → ambil `app_content.tree`.
- **Admin edit materi** → `saveContent(tree)` (JSONB).
- **Upload gambar materi** → `uploadGambar(file)` → kompres → `b2-sign` → PUT ke B2 → simpan URL di pohon.
- **Lupa password** → `resetPasswordForEmail` → email link ke `/reset.html`.

---

# Checklist keamanan
- [ ] RLS aktif semua tabel (schema.sql sudah). Frontend HANYA pakai anon key, jangan service_role.
- [ ] Admin dibuat manual, tak ada daftar admin.
- [ ] Password lewat Supabase Auth (hash) — admin tak pernah lihat/ubah.
- [ ] Bucket `bukti` privat (signed URL sementara untuk admin).
- [ ] KeyID/AppKey B2 hanya di Supabase Secrets, bukan di `.env` frontend.
- [ ] CORS B2 dibatasi ke domainmu.

---

# Biaya (jujur)
- Supabase: gratis (free tier) untuk auth+data skala ini. Project bisa di-pause kalau sepi ~1 minggu (buka dashboard sesekali).
- B2: **10GB gratis**. Di atas itu ~$6/TB/bln ($0.006/GB) — sangat murah. Download 1GB/hari gratis; kalau ramai, pasang Cloudflare (egress gratis).
- Untuk 5–10GB gambar: **kemungkinan besar tetap gratis.**

---

# Langkah berikutnya (menyambung UI)
File backend siap: `supabase.js`, `db.js`, `storage.js`, `schema.sql`, `b2-sign`. **UI (App.jsx) belum disambung** — itu kita kerjakan bertahap sambil dites lawan project aslimu:
1. Auth (login/daftar/logout/role + gate akses)
2. Baca materi + pengaturan bayar dari DB
3. Admin: simpan materi/kuis + kelola/verifikasi anggota
4. Upload gambar (B2) & bukti (Supabase)

Selesaikan FASE 1 (1–6) + FASE 2 (1–6) dulu. Setelah project & bucket jadi, kabari aku — kita mulai sambungkan UI dari **auth**.
