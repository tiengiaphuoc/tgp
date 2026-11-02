-- Run after setup.sql, product-codes.sql and email-verification.sql.
begin;
alter table public.product_codes add column if not exists purchase_value bigint not null default 0 check(purchase_value between 0 and 100000000);
alter table public.product_redemptions add column if not exists purchase_value bigint not null default 0 check(purchase_value between 0 and 100000000);
alter table public.product_redemptions add column if not exists reward_eligible boolean not null default true;
create or replace function public.moc_snapshot_code_value() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$begin
 select purchase_value into new.purchase_value from public.product_codes where code=new.code;new.reward_eligible:=true;return new;end;$$;
drop trigger if exists moc_code_purchase_value on public.product_redemptions;
create trigger moc_code_purchase_value before insert on public.product_redemptions for each row execute function public.moc_snapshot_code_value();
create table if not exists public.microscopy_policy(id integer primary key check(id=1),enabled boolean not null default false,period text not null default 'calendar' check(period='calendar'),threshold bigint not null default 1000000 check(threshold=1000000));
insert into public.microscopy_policy(id)values(1)on conflict do nothing;
alter table public.microscopy_policy enable row level security;
revoke all on public.microscopy_policy from anon,authenticated;grant select,update(enabled,period)on public.microscopy_policy to authenticated;
drop policy if exists microscopy_policy_read on public.microscopy_policy;create policy microscopy_policy_read on public.microscopy_policy for select to authenticated using(true);
drop policy if exists microscopy_policy_edit on public.microscopy_policy;create policy microscopy_policy_edit on public.microscopy_policy for update to authenticated using(public.is_moc_admin())with check(public.is_moc_admin());
create table if not exists public.microscopy_requests(
 id uuid primary key default gen_random_uuid(),user_id uuid not null references auth.users(id)on delete cascade,
 name text not null check(char_length(btrim(name))between 1 and 80),phone text not null check(char_length(btrim(phone))between 8 and 24 and char_length(regexp_replace(phone,'[^0-9]','','g'))between 8 and 15),email text not null check(char_length(email)between 3 and 120),
 hair_treatment text not null default '' check(char_length(hair_treatment)<=200),question text not null default '' check(char_length(question)<=1500),
 consented_at timestamptz not null default now(),created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 status text not null default 'submitted' check(status in ('submitted','approved','sample_received','analysing','completed','rejected','cancelled')),
 period_start timestamptz not null,eligible_value bigint not null,staff_message text not null default '' check(char_length(staff_message)<=3000),result_note text not null default '' check(char_length(result_note)<=5000)
);
create unique index if not exists microscopy_one_open on public.microscopy_requests(user_id)where status in ('submitted','approved','sample_received','analysing');
alter table public.microscopy_requests enable row level security;revoke all on public.microscopy_requests from anon,authenticated;grant select on public.microscopy_requests to authenticated;
drop policy if exists microscopy_read on public.microscopy_requests;create policy microscopy_read on public.microscopy_requests for select to authenticated using(user_id=auth.uid()or public.is_moc_admin());
create table if not exists public.microscopy_credit_audit(id bigint generated always as identity primary key,code text not null,old_value bigint,new_value bigint,eligible boolean,admin_id uuid,created_at timestamptz not null default now());
alter table public.microscopy_credit_audit enable row level security;revoke all on public.microscopy_credit_audit from anon,authenticated;grant select on public.microscopy_credit_audit to authenticated;
drop policy if exists microscopy_audit_read on public.microscopy_credit_audit;create policy microscopy_audit_read on public.microscopy_credit_audit for select to authenticated using(public.is_moc_admin());
create or replace function public.import_product_codes_value(codes text[],days integer,expires timestamptz,purchase_value bigint)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare c text;added integer:=0;n integer;begin
 if not public.is_moc_admin()then raise insufficient_privilege;end if;
 if purchase_value is null or purchase_value<0 or purchase_value>100000000 or days is null or days<1 or days>3650 or coalesce(array_length(codes,1),0)<1 or array_length(codes,1)>200 or(expires is not null and expires<=now())then raise exception 'Invalid batch';end if;
 foreach c in array codes loop c:=upper(btrim(c));if c is null or c!~'^[A-Z0-9-]{8,64}$'then raise exception 'Invalid code';end if;
 insert into public.product_codes(code,gift_days,expires_at,purchase_value)values(c,days,expires,purchase_value)on conflict do nothing;get diagnostics n=row_count;added:=added+n;end loop;
 return jsonb_build_object('created',added,'skipped',array_length(codes,1)-added);end;$$;
create or replace function public.adjust_reward_credit(input_code text,new_value bigint,eligible boolean)returns void language plpgsql security definer set search_path=public,pg_temp as $$declare old_value bigint;begin
 if not public.is_moc_admin()then raise insufficient_privilege;end if;if new_value is null or new_value<0 or new_value>100000000 or eligible is null then raise exception 'Invalid value';end if;
 select purchase_value into old_value from public.product_redemptions where code=upper(btrim(input_code))for update;if not found then raise exception 'Code not redeemed';end if;
 update public.product_redemptions set purchase_value=new_value,reward_eligible=eligible where code=upper(btrim(input_code));
 insert into public.microscopy_credit_audit(code,old_value,new_value,eligible,admin_id)values(upper(btrim(input_code)),old_value,new_value,eligible,auth.uid());end;$$;
create or replace function public.microscopy_eligibility()returns jsonb language plpgsql stable security definer set search_path=public,pg_temp as $$declare p public.microscopy_policy;start_date timestamptz;amount bigint;used integer;unvalued integer;active uuid;begin
 if auth.uid()is null then raise insufficient_privilege;end if;select *into p from public.microscopy_policy where id=1;
 start_date:=case when p.period='calendar'then date_trunc('year',now()at time zone'Asia/Ho_Chi_Minh')at time zone'Asia/Ho_Chi_Minh'else now()-interval'1 year'end;
 select coalesce(sum(purchase_value),0)into amount from public.product_redemptions where user_id=auth.uid()and reward_eligible and redeemed_at>=start_date and redeemed_at<=now();
 select count(*)into unvalued from public.product_redemptions where user_id=auth.uid()and reward_eligible and purchase_value=0 and redeemed_at>=start_date and redeemed_at<=now();
 select count(*)into used from public.microscopy_requests where user_id=auth.uid()and created_at>=start_date and status not in('rejected','cancelled');
 select id into active from public.microscopy_requests where user_id=auth.uid()and status in('submitted','approved','sample_received','analysing')limit 1;
 return jsonb_build_object('enabled',p.enabled,'period',p.period,'period_start',start_date,'threshold',p.threshold,'amount',amount,'unvalued_codes',unvalued,'used',used,'remaining',greatest(0,floor(amount::numeric/p.threshold)::integer-used),'active_request',active,'eligible',p.enabled and floor(amount::numeric/p.threshold)>used and active is null);end;$$;
create or replace function public.submit_microscopy_request(request_id uuid,customer_name text,customer_phone text,customer_email text,treatment text,question_text text,consent boolean)returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$declare e jsonb;previous public.microscopy_requests;begin
 if auth.uid()is null then raise insufficient_privilege;end if;perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 select *into previous from public.microscopy_requests where id=request_id;
 if found then if previous.user_id<>auth.uid()then raise insufficient_privilege;end if;return jsonb_build_object('id',previous.id,'status',previous.status);end if;
 if consent is distinct from true or not public.moc_email_verified(customer_email)then raise exception 'Consent and verified email required';end if;
 e:=public.microscopy_eligibility();if not(e->>'eligible')::boolean then raise exception 'Not eligible';end if;
 insert into public.microscopy_requests(id,user_id,name,phone,email,hair_treatment,question,period_start,eligible_value)values(request_id,auth.uid(),btrim(customer_name),btrim(customer_phone),btrim(customer_email),coalesce(treatment,''),coalesce(question_text,''),(e->>'period_start')::timestamptz,(e->>'amount')::bigint);
 return jsonb_build_object('id',request_id,'status','submitted');end;$$;
create or replace function public.update_microscopy_request(request_id uuid,next_status text,message text,result_text text)returns void language plpgsql security definer set search_path=public,pg_temp as $$declare previous public.microscopy_requests;year_start timestamptz;credits bigint;reserved integer;begin
 if not public.is_moc_admin()then raise insufficient_privilege;end if;select *into previous from public.microscopy_requests where id=request_id for update;if not found then raise exception 'Request not found';end if;
 if next_status<>previous.status and not((previous.status='submitted'and next_status in('approved','rejected'))or(previous.status='approved'and next_status in('sample_received','rejected'))or(previous.status='sample_received'and next_status='analysing')or(previous.status='analysing'and next_status='completed'))then raise exception 'Invalid transition';end if;
 if next_status='approved' then
 year_start:=date_trunc('year',previous.created_at at time zone'Asia/Ho_Chi_Minh')at time zone'Asia/Ho_Chi_Minh';
 select coalesce(sum(purchase_value),0)into credits from public.product_redemptions where user_id=previous.user_id and reward_eligible and redeemed_at>=year_start and redeemed_at<year_start+interval'1 year';
 select count(*)into reserved from public.microscopy_requests where user_id=previous.user_id and created_at>=year_start and created_at<year_start+interval'1 year'and status not in('rejected','cancelled');
 if floor(credits::numeric/1000000)<reserved then raise exception 'Eligibility changed; reconcile credits';end if;
 end if;
 if next_status='approved'and char_length(btrim(coalesce(message,'')))<20 then raise exception 'Shipping instructions required';end if;
 if next_status='completed'and char_length(btrim(coalesce(result_text,'')))<10 then raise exception 'Result required';end if;
 update public.microscopy_requests set status=next_status,staff_message=coalesce(message,''),result_note=coalesce(result_text,''),updated_at=now()where id=request_id;end;$$;
create or replace function public.cancel_microscopy_request(request_id uuid)returns void language plpgsql security definer set search_path=public,pg_temp as $$begin
 if auth.uid()is null then raise insufficient_privilege;end if;perform pg_advisory_xact_lock(hashtext(auth.uid()::text));
 update public.microscopy_requests set status='cancelled',updated_at=now()where id=request_id and user_id=auth.uid()and status='submitted';if not found then raise exception 'Cannot cancel';end if;end;$$;
revoke all on function public.import_product_codes_value(text[],integer,timestamptz,bigint),public.adjust_reward_credit(text,bigint,boolean),public.microscopy_eligibility(),public.submit_microscopy_request(uuid,text,text,text,text,text,boolean),public.update_microscopy_request(uuid,text,text,text),public.cancel_microscopy_request(uuid)from public;
grant execute on function public.import_product_codes_value(text[],integer,timestamptz,bigint),public.adjust_reward_credit(text,bigint,boolean),public.microscopy_eligibility(),public.submit_microscopy_request(uuid,text,text,text,text,text,boolean),public.update_microscopy_request(uuid,text,text,text),public.cancel_microscopy_request(uuid)to authenticated;
commit;
