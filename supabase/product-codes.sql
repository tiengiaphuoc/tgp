-- Run after setup.sql. Product codes are private; never commit real codes to GitHub.
begin;
alter table public.customer_profiles add column if not exists product_code_input text not null default '' check (char_length(product_code_input)<=64);
create table if not exists public.product_codes (
 code text primary key check(code ~ '^[A-Z0-9-]{8,64}$'),
 gift_days integer not null check(gift_days between 1 and 3650),
 enabled boolean not null default true, expires_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.product_entitlements (
 user_id uuid primary key references auth.users(id) on delete cascade,
 valid_until timestamptz not null
);
create table if not exists public.product_redemptions (
 code text primary key references public.product_codes(code),
 user_id uuid references auth.users(id) on delete set null,
 redeemed_at timestamptz not null default now(), granted_until timestamptz not null
);
create table if not exists public.product_code_attempts (
 user_id uuid primary key references auth.users(id) on delete cascade,
 window_start timestamptz not null, attempts integer not null
);
alter table public.product_codes enable row level security;
alter table public.product_entitlements enable row level security;
alter table public.product_redemptions enable row level security;
alter table public.product_code_attempts enable row level security;
revoke all on public.product_codes,public.product_entitlements,public.product_redemptions,public.product_code_attempts from anon,authenticated;
grant select on public.product_codes,public.product_entitlements,public.product_redemptions to authenticated;
grant update(enabled) on public.product_codes to authenticated;
drop policy if exists codes_admin on public.product_codes;
create policy codes_admin on public.product_codes for select to authenticated using(public.is_moc_admin());
drop policy if exists codes_toggle on public.product_codes;
create policy codes_toggle on public.product_codes for update to authenticated using(public.is_moc_admin()) with check(public.is_moc_admin());
drop policy if exists entitlement_read on public.product_entitlements;
create policy entitlement_read on public.product_entitlements for select to authenticated using(user_id=auth.uid() or public.is_moc_admin());
drop policy if exists redemption_read on public.product_redemptions;
create policy redemption_read on public.product_redemptions for select to authenticated using(user_id=auth.uid() or public.is_moc_admin());
create or replace function public.import_product_codes(codes text[], days integer, expires timestamptz default null) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare c text; added integer:=0; n integer;
begin
 if not public.is_moc_admin() then raise insufficient_privilege; end if;
 if days is null or days<1 or days>3650 or coalesce(array_length(codes,1),0)<1 or array_length(codes,1)>200 or (expires is not null and expires<=now()) then raise exception 'Invalid batch'; end if;
 foreach c in array codes loop
  c:=upper(btrim(c)); if c is null or c !~ '^[A-Z0-9-]{8,64}$' then raise exception 'Invalid code'; end if;
  insert into public.product_codes(code,gift_days,expires_at) values(c,days,expires) on conflict do nothing;
  get diagnostics n=row_count; added:=added+n;
 end loop;
 return jsonb_build_object('created',added,'skipped',array_length(codes,1)-added);
end;$$;
create or replace function public.check_product_code(input_code text) returns jsonb
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare p public.product_codes; r public.product_redemptions;
begin
 if not public.is_moc_admin() then raise insufficient_privilege; end if;
 select * into p from public.product_codes where code=upper(btrim(input_code));
 if not found then return jsonb_build_object('status','not_found'); end if;
 select * into r from public.product_redemptions where code=p.code;
 return jsonb_build_object('status',case when r.code is not null then 'used' when not p.enabled then 'disabled' when p.expires_at<=now() then 'expired' else 'available' end,'gift_days',p.gift_days,'user_id',r.user_id,'granted_until',r.granted_until);
end;$$;
create or replace function public.redeem_product_code(input_code text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid:=auth.uid(); p public.product_codes; r public.product_redemptions; attempts_row public.product_code_attempts; until_date timestamptz;
begin
 if uid is null then raise insufficient_privilege; end if;
 -- One lock per customer plus a row lock per code prevents duplicate or concurrent grants.
 perform pg_advisory_xact_lock(hashtext(uid::text));
 if not exists(select 1 from public.customer_profiles where id=uid) then return jsonb_build_object('status','profile_required'); end if;
 insert into public.product_code_attempts values(uid,now(),0) on conflict do nothing;
 select * into attempts_row from public.product_code_attempts where user_id=uid for update;
 if attempts_row.window_start<=now()-interval '15 minutes' then update public.product_code_attempts set window_start=now(),attempts=0 where user_id=uid; attempts_row.attempts:=0; end if;
 if attempts_row.attempts>=8 then return jsonb_build_object('status','rate_limited'); end if;
 update public.product_code_attempts set attempts=attempts+1 where user_id=uid;
 select * into p from public.product_codes where code=upper(btrim(input_code)) for update;
 if not found then return jsonb_build_object('status','invalid'); end if;
 select * into r from public.product_redemptions where code=p.code;
 if found then
  if r.user_id=uid then select valid_until into until_date from public.product_entitlements where user_id=uid; return jsonb_build_object('status','already_owned','valid_until',until_date); end if;
  return jsonb_build_object('status','used');
 end if;
 if not p.enabled then return jsonb_build_object('status','disabled'); end if;
 if p.expires_at<=now() then return jsonb_build_object('status','expired'); end if;
 select valid_until into until_date from public.product_entitlements where user_id=uid;
 until_date:=greatest(coalesce(until_date,now()),now())+make_interval(days=>p.gift_days);
 insert into public.product_entitlements values(uid,until_date) on conflict(user_id) do update set valid_until=excluded.valid_until;
 insert into public.product_redemptions(code,user_id,granted_until) values(p.code,uid,until_date);
 return jsonb_build_object('status','activated','valid_until',until_date,'gift_days',p.gift_days);
end;$$;
revoke all on function public.import_product_codes(text[],integer,timestamptz),public.check_product_code(text),public.redeem_product_code(text) from public;
grant execute on function public.import_product_codes(text[],integer,timestamptz),public.check_product_code(text),public.redeem_product_code(text) to authenticated;
commit;
