-- =====================================================================
-- Materi Belajar Kedokteran — Skema database Supabase
-- Jalankan seluruh file ini di: Supabase Dashboard > SQL Editor > New query > Run
-- Aman dijalankan berkali-kali (pakai IF NOT EXISTS / ON CONFLICT).
-- =====================================================================

-- Izinkan fungsi mereferensi tabel yang dibuat di bawahnya (hindari error urutan)
set check_function_bodies = off;

-- ---------- Helper: cek apakah user sekarang admin ----------
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- =====================================================================
-- 1) PROFILES  (admin + pelajar). 1 baris per akun auth.
-- =====================================================================
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text not null default 'pelajar' check (role in ('admin','pelajar')),
  name       text,
  email      text,
  verified   boolean not null default false,   -- pelajar aktif setelah admin verifikasi
  amount     integer default 0,                -- nominal yang dibayar
  proof_url  text,                             -- path bukti bayar (bucket privat 'bukti')
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;

-- Buat profile otomatis saat user daftar
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, name, email)
  values (new.id, new.raw_user_meta_data->>'name', new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Policies profiles
drop policy if exists "profiles read"   on public.profiles;
drop policy if exists "profiles insert" on public.profiles;
drop policy if exists "profiles update self"  on public.profiles;
drop policy if exists "profiles admin update" on public.profiles;
drop policy if exists "profiles admin delete" on public.profiles;

create policy "profiles read" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles insert" on public.profiles
  for insert with check (id = auth.uid());
create policy "profiles update self" on public.profiles
  for update using (id = auth.uid());
create policy "profiles admin update" on public.profiles
  for update using (public.is_admin());
create policy "profiles admin delete" on public.profiles
  for delete using (public.is_admin());

-- =====================================================================
-- 2) APP_CONTENT  (pohon materi + kuis disimpan sebagai JSONB, 1 baris)
--    Pendekatan pragmatis: struktur persis seperti `data` di app.
-- =====================================================================
create table if not exists public.app_content (
  id         int primary key default 1,
  tree       jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now(),
  constraint app_content_single check (id = 1)
);
alter table public.app_content enable row level security;

drop policy if exists "content read"  on public.app_content;
drop policy if exists "content write" on public.app_content;

-- Baca: admin, atau pelajar yang sudah terverifikasi
create policy "content read" on public.app_content
  for select using (
    public.is_admin()
    or exists (select 1 from public.profiles where id = auth.uid() and verified)
  );
-- Tulis: admin saja
create policy "content write" on public.app_content
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.app_content (id, tree) values (1, '{}'::jsonb)
  on conflict (id) do nothing;

-- =====================================================================
-- 3) PAYMENT_SETTINGS  (info rekening, 1 baris)
--    Read publik karena ditampilkan di halaman pendaftaran (sebelum login).
-- =====================================================================
create table if not exists public.payment_settings (
  id     int primary key default 1,
  bank   text,
  rek    text,
  nama   text,
  jumlah integer default 0,
  constraint payment_single check (id = 1)
);
alter table public.payment_settings enable row level security;

drop policy if exists "payment read"  on public.payment_settings;
drop policy if exists "payment write" on public.payment_settings;

create policy "payment read"  on public.payment_settings for select using (true);
create policy "payment write" on public.payment_settings
  for all using (public.is_admin()) with check (public.is_admin());

insert into public.payment_settings (id, bank, rek, nama, jumlah)
values (1, 'Bank Syariah Indonesia (BSI)', '7211 8899 00', 'a.n. Pengelola Materi Kedokteran', 50000)
  on conflict (id) do nothing;

-- =====================================================================
-- 4) STORAGE BUCKET (hanya BUKTI BAYAR, privat & kecil).
--    Gambar MATERI TIDAK di sini -> disimpan di Backblaze B2 (lihat tutorial).
-- =====================================================================
insert into storage.buckets (id, name, public)
  values ('bukti', 'bukti', false)   on conflict (id) do nothing;   -- bukti bayar: privat

drop policy if exists "bukti insert"  on storage.objects;
drop policy if exists "bukti read"    on storage.objects;

-- Pelajar boleh upload ke foldernya sendiri; admin boleh baca semua
create policy "bukti insert" on storage.objects
  for insert with check (
    bucket_id = 'bukti' and (storage.foldername(name))[1] = auth.uid()::text
  );
create policy "bukti read" on storage.objects
  for select using (
    bucket_id = 'bukti' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );

-- =====================================================================
-- SELESAI.
-- Langkah manual terakhir (lihat tutorial): jadikan 1 akun sebagai admin:
--   update public.profiles set role='admin', verified=true where id='<UUID_AKUN_ADMIN>';
-- =====================================================================
