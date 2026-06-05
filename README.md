# Aeterna Police Management System

Versi ini sudah ditambah:

- Login akun memakai Discord OAuth via Supabase Auth
- Database anggota kepolisian
- Dashboard Kapolri
- Role Permission: `SUPER_ADMIN`, `KAPOLRI`, `WAKAPOLRI`, `COMMAND`, `PROVOST`, `OFFICER`, `CADET`
- Audit Log untuk edit/hapus data
- Admin pasal dan sandi angka
- UI modern dengan logo Aeterna Police Department

## 1. Setup Supabase

1. Buat project Supabase.
2. Buka **SQL Editor**.
3. Jalankan file:

```bash
supabase/schema.sql
```

4. Buka **Authentication > Providers > Discord**.
5. Aktifkan Discord provider.
6. Isi Client ID dan Client Secret dari Discord Developer Portal.
7. Tambahkan redirect URL di Discord OAuth:

```text
http://localhost:3000
https://domain-vercel-kamu.vercel.app
```

Di Supabase, tambahkan Site URL:

```text
http://localhost:3000
```

Untuk production ganti ke domain Vercel.

## 2. Setup Env

Copy `.env.example` menjadi `.env.local` lalu isi:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 3. Jalankan lokal

```bash
npm install
npm run dev
```

## 4. Deploy Vercel

1. Push project ke GitHub.
2. Import repo di Vercel.
3. Tambahkan Environment Variables dari `.env.local`.
4. Deploy.
5. Update Supabase Site URL dan Discord Redirect URL ke domain Vercel.

## Catatan penting

Tidak ada developer yang bisa menjamin project 100% tanpa bug. Versi ini dibuat rapi sebagai fondasi. Untuk produksi serius, policy Supabase RLS sebaiknya diperketat lagi memakai function role server-side, bukan hanya pembatasan UI.
