# Materi Belajar Kedokteran
Web materi kedokteran + kuis, akses berbayar. React + Vite, **Supabase** (auth + database + bukti bayar) & **Backblaze B2** (gambar materi).

## Setup (WAJIB baca dulu)
Ikuti `TUTORIAL-SUPABASE-B2.md` — bikin project Supabase, jalankan `supabase/schema.sql`, buat akun admin, lalu (untuk gambar) setup B2 + deploy edge function.

## Environment
Buat file `.env` (lihat `.env.example`):
```
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_B2_PUBLIC_URL=...        # diisi setelah setup B2 (gambar)
```
Di Vercel: tambahkan 3 variabel yang sama di Settings → Environment Variables.

## Jalankan
```
npm install
npm run dev      # lokal
npm run build    # produksi -> dist/
```

## Struktur
- `src/App.jsx` — UI utama (sudah tersambung Supabase).
- `src/reset.jsx` / `reset.html` — halaman atur ulang password (dari email).
- `src/lib/supabase.js` — koneksi.
- `src/lib/db.js` — auth, materi, anggota, pembayaran.
- `src/lib/storage.js` — kompres + upload gambar (B2) & bukti (Supabase).
- `supabase/schema.sql` — tabel + RLS + bucket bukti.
- `supabase/functions/b2-sign` — penandatangan upload B2.
- `supabase/functions/admin-create-user` — admin tambah akun manual.

## Fitur (tersambung Supabase)
- Login pelajar & admin, daftar + upload bukti bayar, lupa password (email).
- Pelajar aktif setelah admin verifikasi. Belum verifikasi → layar "menunggu".
- Admin: kelola materi/bagian/halaman/kuis (auto-save), verifikasi/hapus/tambah anggota, atur info pembayaran.
- Materi bertingkat + kuis pilihan ganda + pembahasan, dark mode, pencarian, mobile + desktop.

## Catatan
- Deploy edge function butuh Supabase CLI (lihat tutorial).
- Gambar materi butuh B2 dikonfigurasi; sebelum itu, upload gambar akan gagal (fitur lain jalan).
- Admin dibuat manual (tak ada pendaftaran admin). Admin tak bisa lihat/ubah password anggota.
