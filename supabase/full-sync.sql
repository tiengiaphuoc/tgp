-- Run after setup.sql and email-verification.sql. Private customer backup + company article publication.
create table if not exists public.customer_backups(
 user_id uuid primary key references public.customer_profiles(id) on delete cascade,
 data jsonb not null check(jsonb_typeof(data)='object' and octet_length(data::text)<=1048576),
 revision bigint not null default 1 check(revision>0),
 consented_at timestamptz not null,updated_at timestamptz not null default now()
);
alter table public.customer_backups enable row level security;
revoke all on public.customer_backups from anon,authenticated;
grant select,delete on public.customer_backups to authenticated;
drop policy if exists backup_read on public.customer_backups;
create policy backup_read on public.customer_backups for select to authenticated using(user_id=auth.uid() or public.is_moc_admin());
drop policy if exists backup_delete on public.customer_backups;
create policy backup_delete on public.customer_backups for delete to authenticated using(user_id=auth.uid());
create table if not exists public.customer_sync_consents(
 user_id uuid primary key references auth.users(id) on delete cascade,
 epoch uuid not null default gen_random_uuid(),active boolean not null default true,updated_at timestamptz not null default now()
);
alter table public.customer_sync_consents enable row level security;
revoke all on public.customer_sync_consents from anon,authenticated;
grant select on public.customer_sync_consents to authenticated;
drop policy if exists own_sync_consent on public.customer_sync_consents;
create policy own_sync_consent on public.customer_sync_consents for select to authenticated using(user_id=auth.uid());
create or replace function public.set_full_sync_consent(grant_consent boolean) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid:=auth.uid();token uuid:=gen_random_uuid();
begin
 if uid is null then raise exception 'Auth required' using errcode='42501';end if;
 if grant_consent and not exists(select 1 from customer_profiles p where p.id=uid and public.moc_email_verified(p.email)) then raise exception 'Verified customer required' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 insert into customer_sync_consents(user_id,epoch,active)values(uid,token,grant_consent)on conflict(user_id)do update set epoch=excluded.epoch,active=excluded.active,updated_at=now();
 if not grant_consent then delete from customer_backups where user_id=uid;end if;
 return token;
end $$;
revoke all on function public.set_full_sync_consent(boolean) from public,anon;
grant execute on function public.set_full_sync_consent(boolean) to authenticated;
revoke delete on public.customer_backups from authenticated;
create or replace function public.save_customer_backup(payload jsonb,expected_revision bigint,consent boolean,consent_token uuid) returns bigint
language plpgsql security definer set search_path=public,pg_temp as $$
declare uid uuid:=auth.uid();current_revision bigint;photo jsonb;next_revision bigint;
begin
 if uid is null or not exists(select 1 from customer_profiles p where p.id=uid and public.moc_email_verified(p.email)) then raise exception 'Verified customer required' using errcode='42501'; end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,0));
 if not exists(select 1 from customer_profiles p where p.id=uid and lower(p.email)=lower(payload->'profile'->>'email')) then raise exception 'Backup email mismatch'; end if;
 if consent_token is null or not exists(select 1 from customer_sync_consents c where c.user_id=uid and c.active and c.epoch=consent_token)then raise exception 'Full consent revoked or replaced' using errcode='42501';end if;
 if consent is distinct from true then raise exception 'Explicit full data consent required' using errcode='42501'; end if;
 if payload->>'schemaVersion' is distinct from '1' or jsonb_typeof(payload->'photos') is distinct from 'array' or jsonb_array_length(payload->'photos')>100 or payload ?|array['access_token','refresh_token','microscopyDraft'] then raise exception 'Invalid backup'; end if;
 for photo in select * from jsonb_array_elements(payload->'photos') loop
  if photo ? 'src' or split_part(photo->>'path','/',1) is distinct from uid::text or (photo->>'path') !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$' or not exists(select 1 from storage.objects o where o.bucket_id='customer-hair' and o.name=photo->>'path') then raise exception 'Invalid photo reference'; end if;
 end loop;

 select revision into current_revision from customer_backups where user_id=uid for update;
 if coalesce(current_revision,0) is distinct from expected_revision then raise exception 'BACKUP_CONFLICT' using errcode='40001'; end if;
 next_revision:=coalesce(current_revision,0)+1;
 insert into customer_backups(user_id,data,revision,consented_at) values(uid,payload,next_revision,now()) on conflict(user_id) do update set data=excluded.data,revision=excluded.revision,consented_at=customer_backups.consented_at,updated_at=now();
 return next_revision;
end $$;
revoke all on function public.save_customer_backup(jsonb,bigint,boolean,uuid) from public,anon;
grant execute on function public.save_customer_backup(jsonb,bigint,boolean,uuid) to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)values('customer-hair','customer-hair',false,5242880,array['image/jpeg']) on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists customer_hair_read on storage.objects;
create policy customer_hair_read on storage.objects for select to authenticated using(bucket_id='customer-hair' and (split_part(name,'/',1)=auth.uid()::text or exists(select 1 from public.customer_backups b cross join lateral jsonb_array_elements(b.data->'photos') p where p->>'path'=storage.objects.name and (b.user_id=auth.uid() or public.is_moc_admin()))));
drop policy if exists customer_hair_insert on storage.objects;
create policy customer_hair_insert on storage.objects for insert to authenticated with check(bucket_id='customer-hair' and split_part(name,'/',1)=auth.uid()::text and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$' and exists(select 1 from public.customer_profiles p where p.id=auth.uid() and public.moc_email_verified(p.email)) and exists(select 1 from public.customer_sync_consents c where c.user_id=auth.uid() and c.active));
drop policy if exists customer_hair_delete on storage.objects;
create policy customer_hair_delete on storage.objects for delete to authenticated using(bucket_id='customer-hair' and split_part(name,'/',1)=auth.uid()::text and not exists(select 1 from public.customer_backups b cross join lateral jsonb_array_elements(b.data->'photos') p where p->>'path'=storage.objects.name));
create table if not exists public.article_publications(
 id integer primary key check(id=1),posts jsonb not null check(jsonb_typeof(posts)='array' and jsonb_array_length(posts)<=100 and octet_length(posts::text)<=20000000),
 revision bigint not null default 1,updated_at timestamptz not null default now()
);
alter table public.article_publications enable row level security;
grant select on public.article_publications to anon,authenticated;
revoke insert,update,delete on public.article_publications from anon,authenticated;
drop policy if exists article_public_read on public.article_publications;
create policy article_public_read on public.article_publications for select to anon,authenticated using(true);
create or replace function public.publish_articles(article_posts jsonb,expected_revision bigint) returns bigint
language plpgsql security definer set search_path=public,pg_temp as $$
declare current_revision bigint;next_revision bigint;
begin
 if not public.is_moc_admin() then raise exception 'Admin required' using errcode='42501'; end if;
 if jsonb_typeof(article_posts) is distinct from 'array' or jsonb_array_length(article_posts)>100 then raise exception 'Invalid publication'; end if;
 perform pg_advisory_xact_lock(81818181);
 select revision into current_revision from article_publications where id=1 for update;
 if coalesce(current_revision,0) is distinct from expected_revision then raise exception 'ARTICLE_CONFLICT' using errcode='40001'; end if;
 next_revision:=coalesce(current_revision,0)+1;
 insert into article_publications(id,posts,revision) values(1,article_posts,next_revision) on conflict(id) do update set posts=excluded.posts,revision=excluded.revision,updated_at=now();
 return next_revision;
end $$;
revoke all on function public.publish_articles(jsonb,bigint) from public,anon;
grant execute on function public.publish_articles(jsonb,bigint) to authenticated;
