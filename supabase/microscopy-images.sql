-- Run after microscopy.sql. Supabase Storage must be enabled.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('microscopy-results','microscopy-results',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create table if not exists public.microscopy_images(
 id uuid primary key default gen_random_uuid(),
 request_id uuid not null references public.microscopy_requests(id) on delete cascade,
 path text not null unique,
 title text not null check(length(trim(title)) between 1 and 100),
 magnification text not null default '' check(length(magnification)<=60),
 caption text not null default '' check(length(caption)<=1000),
 created_at timestamptz not null default now(),
 check(path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'),
 check(split_part(path,'/',1)=request_id::text)
);
alter table public.microscopy_images enable row level security;
grant select,insert,delete on public.microscopy_images to authenticated;
create or replace function public.moc_limit_microscopy_images() returns trigger language plpgsql security definer set search_path=public as $$
begin
 perform 1 from microscopy_requests where id=new.request_id for update;
 if not exists(select 1 from microscopy_requests where id=new.request_id and status in ('analysing','completed')) then raise exception 'Request must be analysing or completed'; end if;
 if (select count(*) from microscopy_images where request_id=new.request_id)>=6 then raise exception 'Maximum six images'; end if;
 if not exists(select 1 from storage.objects where bucket_id='microscopy-results' and name=new.path) then raise exception 'Upload image first'; end if;
 return new;
end $$;
drop trigger if exists limit_microscopy_images on public.microscopy_images;
create trigger limit_microscopy_images before insert on public.microscopy_images for each row execute function public.moc_limit_microscopy_images();
drop policy if exists micro_images_read on public.microscopy_images;
create policy micro_images_read on public.microscopy_images for select to authenticated using(public.is_moc_admin() or exists(select 1 from public.microscopy_requests r where r.id=request_id and r.user_id=auth.uid() and r.status='completed'));
drop policy if exists micro_images_insert on public.microscopy_images;
create policy micro_images_insert on public.microscopy_images for insert to authenticated with check(public.is_moc_admin());
drop policy if exists micro_images_delete on public.microscopy_images;
create policy micro_images_delete on public.microscopy_images for delete to authenticated using(public.is_moc_admin());
drop policy if exists micro_files_read on storage.objects;
create policy micro_files_read on storage.objects for select to authenticated using(bucket_id='microscopy-results' and (public.is_moc_admin() or exists(select 1 from public.microscopy_images i join public.microscopy_requests r on r.id=i.request_id where i.path=storage.objects.name and r.user_id=auth.uid() and r.status='completed')));
drop policy if exists micro_files_insert on storage.objects;
create policy micro_files_insert on storage.objects for insert to authenticated with check(bucket_id='microscopy-results' and public.is_moc_admin() and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$' and exists(select 1 from public.microscopy_requests r where r.id::text=split_part(storage.objects.name,'/',1) and r.status in ('analysing','completed')));
drop policy if exists micro_files_delete on storage.objects;
create policy micro_files_delete on storage.objects for delete to authenticated using(bucket_id='microscopy-results' and public.is_moc_admin());
