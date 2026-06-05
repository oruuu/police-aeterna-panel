-- AETERNA POLICE MANAGEMENT SYSTEM
-- Jalankan di Supabase SQL Editor.
-- Setelah itu aktifkan Auth Provider Discord di Supabase Dashboard.

create extension if not exists pgcrypto;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  discord_id text unique,
  discord_name text,
  nama_rp text not null,
  callsign text not null,
  pangkat text default 'Cadet',
  divisi text default 'Patrol',
  role text not null default 'CADET' check (role in ('SUPER_ADMIN','KAPOLRI','WAKAPOLRI','COMMAND','PROVOST','OFFICER','CADET')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE','OFF_DUTY','SUSPENDED')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.pasal (
  id uuid primary key default gen_random_uuid(),
  kode text unique not null,
  tentang text not null,
  denda integer not null default 0,
  bulan integer not null default 0,
  kategori text not null default 'Ringan' check (kategori in ('Ringan','Sedang','Berat','Persidangan')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.ten_codes (
  id uuid primary key default gen_random_uuid(),
  kode text unique not null,
  arti text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_name text not null default 'System',
  action text not null,
  target text not null,
  detail text,
  created_at timestamptz default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  suspect_name text,
  officer_name text,
  content text,
  created_at timestamptz default now()
);

alter table public.members enable row level security;
alter table public.pasal enable row level security;
alter table public.ten_codes enable row level security;
alter table public.audit_logs enable row level security;
alter table public.reports enable row level security;

drop policy if exists "read members" on public.members;
drop policy if exists "read pasal" on public.pasal;
drop policy if exists "read ten_codes" on public.ten_codes;
drop policy if exists "read audit_logs" on public.audit_logs;
drop policy if exists "read reports" on public.reports;
drop policy if exists "write members" on public.members;
drop policy if exists "write pasal" on public.pasal;
drop policy if exists "write ten_codes" on public.ten_codes;
drop policy if exists "write audit_logs" on public.audit_logs;
drop policy if exists "write reports" on public.reports;

-- Starter policy: semua user login Discord bisa baca data.
create policy "read members" on public.members for select to authenticated using (true);
create policy "read pasal" on public.pasal for select to authenticated using (true);
create policy "read ten_codes" on public.ten_codes for select to authenticated using (true);
create policy "read audit_logs" on public.audit_logs for select to authenticated using (true);
create policy "read reports" on public.reports for select to authenticated using (true);

-- Starter policy admin: sementara semua user login bisa write.
-- Permission tetap dibatasi dari UI berdasarkan kolom role.
-- Untuk produksi serius, pindahkan permission ini ke RLS function/server API agar tidak bisa dibypass dari browser.
create policy "write members" on public.members for all to authenticated using (true) with check (true);
create policy "write pasal" on public.pasal for all to authenticated using (true) with check (true);
create policy "write ten_codes" on public.ten_codes for all to authenticated using (true) with check (true);
create policy "write audit_logs" on public.audit_logs for insert to authenticated with check (true);
create policy "write reports" on public.reports for all to authenticated using (true) with check (true);

create index if not exists members_discord_id_idx on public.members(discord_id);
create index if not exists members_role_idx on public.members(role);
create index if not exists pasal_kode_idx on public.pasal(kode);
create index if not exists ten_codes_kode_idx on public.ten_codes(kode);
create index if not exists audit_logs_created_at_idx on public.audit_logs(created_at desc);
