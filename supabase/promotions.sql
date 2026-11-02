-- Run after setup.sql. Promotion content is public only during its published dates.
create table if not exists public.promotions (
 id uuid primary key default gen_random_uuid(),
 title text not null check(length(trim(title)) between 3 and 180),
 body text not null check(length(trim(body)) between 10 and 4000),
 starts_on date not null,
 ends_on date not null check(ends_on>=starts_on),
 status text not null default 'draft' check(status in ('draft','published','hidden')),
 cta_text text not null default '' check(length(cta_text)<=60),
 cta_url text not null default '' check(length(cta_url)<=1000 and (cta_url='' or cta_url ~ '^https://[^[:space:]]+$')),
 updated_at timestamptz not null default now(),
 check((cta_text='' and cta_url='') or (length(trim(cta_text))>0 and length(cta_url)>0))
);
alter table public.promotions enable row level security;
grant select on public.promotions to anon,authenticated;
grant insert,update,delete on public.promotions to authenticated;
drop policy if exists promotions_public_read on public.promotions;
create policy promotions_public_read on public.promotions for select to anon,authenticated using(status='published' and (now() at time zone 'Asia/Ho_Chi_Minh')::date between starts_on and ends_on);
drop policy if exists promotions_admin on public.promotions;
create policy promotions_admin on public.promotions for all to authenticated using(public.is_moc_admin()) with check(public.is_moc_admin());
create or replace function public.moc_promotion_updated() returns trigger language plpgsql set search_path=public as $$begin new.updated_at=now();return new;end$$;
drop trigger if exists promotion_updated on public.promotions;
create trigger promotion_updated before update on public.promotions for each row execute function public.moc_promotion_updated();
