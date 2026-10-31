-- Run after setup.sql and product-codes.sql. Enable email confirmation in Supabase Auth.
begin;
create or replace function public.moc_email_verified(input_email text) returns boolean
language sql stable security definer set search_path=public,pg_temp
as $$ select exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null and lower(btrim(email))=lower(btrim(input_email))); $$;
revoke all on function public.moc_email_verified(text) from public;
grant execute on function public.moc_email_verified(text) to authenticated;
drop policy if exists profile_create on public.customer_profiles;
create policy profile_create on public.customer_profiles for insert to authenticated with check(id=auth.uid() and public.moc_email_verified(email));
drop policy if exists profile_edit on public.customer_profiles;
create policy profile_edit on public.customer_profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid() and public.moc_email_verified(email));
-- Keep the atomic redemption implementation private and guard the public entry point.
do $$ begin
 if to_regprocedure('public._moc_redeem_product_code(text)') is null then
  alter function public.redeem_product_code(text) rename to _moc_redeem_product_code;
 end if;
end $$;
revoke all on function public._moc_redeem_product_code(text) from public,anon,authenticated;
create or replace function public.redeem_product_code(input_code text) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if auth.uid() is null then raise insufficient_privilege; end if;
 if not exists(select 1 from public.customer_profiles where id=auth.uid() and public.moc_email_verified(email)) then return jsonb_build_object('status','email_required'); end if;
 return public._moc_redeem_product_code(input_code);
end;$$;
revoke all on function public.redeem_product_code(text) from public;
grant execute on function public.redeem_product_code(text) to authenticated;
commit;
