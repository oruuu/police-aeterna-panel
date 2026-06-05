-- Jalankan ini di Supabase SQL Editor kalau database sudah pernah dibuat.
-- Update untuk fitur ACC akun baru.
alter table public.members drop constraint if exists members_status_check;
alter table public.members alter column status set default 'PENDING';
alter table public.members add constraint members_status_check check (status in ('PENDING','ACTIVE','OFF_DUTY','SUSPENDED'));

-- Akun lama tetap aktif supaya admin tidak terkunci.
update public.members set status = 'ACTIVE' where status is null;
