-- Run once in Supabase SQL Editor. This is for a new Mộcceutics project.
begin;
create table if not exists public.moc_admins (
 user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.moc_admins enable row level security;
revoke all on public.moc_admins from anon, authenticated;
create or replace function public.is_moc_admin() returns boolean
 language sql stable security definer set search_path = public, pg_temp
 as $$ select exists(select 1 from public.moc_admins where user_id = auth.uid()); $$;
revoke all on function public.is_moc_admin() from public;
grant execute on function public.is_moc_admin() to authenticated;
create table if not exists public.customer_profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null check (char_length(btrim(name)) between 1 and 40),
 phone text not null default '' check (char_length(phone)<=24),
 email text not null default '' check (char_length(email)<=120),
 goal text not null default '' check (char_length(goal)<=120),
 consented_at timestamptz not null,
 care_summary jsonb not null default '{}' check (jsonb_typeof(care_summary)='object' and octet_length(care_summary::text)<4096),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.customer_notes (
 customer_id uuid primary key references public.customer_profiles(id) on delete cascade,
 note text not null default '' check (char_length(note)<=4000),
 updated_at timestamptz not null default now()
);
create or replace function public.moc_touch_updated_at() returns trigger
 language plpgsql set search_path = public, pg_temp as $$
 begin
  new.updated_at = now();
  if tg_table_name = 'customer_profiles' then
   if tg_op = 'INSERT' then new.created_at = now(); else new.created_at = old.created_at; end if;
  end if;
  return new;
 end; $$;
drop trigger if exists moc_profiles_updated on public.customer_profiles;
create trigger moc_profiles_updated before insert or update on public.customer_profiles for each row execute function public.moc_touch_updated_at();
drop trigger if exists moc_notes_updated on public.customer_notes;
create trigger moc_notes_updated before insert or update on public.customer_notes for each row execute function public.moc_touch_updated_at();
alter table public.customer_profiles enable row level security;
alter table public.customer_notes enable row level security;
revoke all on public.customer_profiles, public.customer_notes from anon, authenticated;
grant select, insert, update, delete on public.customer_profiles to authenticated;
grant select, insert, update, delete on public.customer_notes to authenticated;
drop policy if exists profile_read on public.customer_profiles;
create policy profile_read on public.customer_profiles for select to authenticated using (id = auth.uid() or public.is_moc_admin());
drop policy if exists profile_create on public.customer_profiles;
create policy profile_create on public.customer_profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists profile_edit on public.customer_profiles;
create policy profile_edit on public.customer_profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists profile_remove on public.customer_profiles;
create policy profile_remove on public.customer_profiles for delete to authenticated using (id = auth.uid());
drop policy if exists notes_admin on public.customer_notes;
create policy notes_admin on public.customer_notes for all to authenticated using (public.is_moc_admin()) with check (public.is_moc_admin());
commit;
-- AFTER creating an admin user via Authentication > Users > Add user:
-- insert into public.moc_admins (user_id) values ('UUID-OF-ADMIN-USER') on conflict do nothing;
