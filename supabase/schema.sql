create extension if not exists pgcrypto;

create table if not exists public.app_state (
  storage_key text primary key,
  storage_value text not null default '',
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid
);

create or replace function public.touch_app_state()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists app_state_touch on public.app_state;
create trigger app_state_touch
before insert or update on public.app_state
for each row
execute function public.touch_app_state();

alter table public.app_state enable row level security;

drop policy if exists "Authenticated users can read app_state" on public.app_state;
create policy "Authenticated users can read app_state"
on public.app_state
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert app_state" on public.app_state;
create policy "Authenticated users can insert app_state"
on public.app_state
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update app_state" on public.app_state;
create policy "Authenticated users can update app_state"
on public.app_state
for update
to authenticated
using (true)
with check (true);

create table if not exists public.standards (
  id uuid primary key default gen_random_uuid(),
  standard_identifier text not null default '',
  standard_name text not null default '',
  vendor_name text not null default '',
  qc_number text not null default '',
  cylinder_number text not null,
  received_on date not null,
  certified_on date,
  expires_on date,
  pressure_psia numeric,
  is_active boolean not null default true,
  notes text not null default '',
  tag_image_path text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);

alter table public.standards add column if not exists standard_identifier text not null default '';
alter table public.standards add column if not exists standard_name text not null default '';

update public.standards
set standard_identifier = coalesce(nullif(standard_identifier, ''), cylinder_number)
where coalesce(standard_identifier, '') = '';

update public.standards
set standard_name = coalesce(nullif(standard_name, ''), vendor_name, 'Unnamed Standard')
where coalesce(standard_name, '') = '';

create table if not exists public.standard_components (
  id uuid primary key default gen_random_uuid(),
  standard_id uuid not null references public.standards(id) on delete cascade,
  component_name text not null,
  concentration_value numeric(14, 6) not null,
  concentration_unit text not null default '%',
  sort_order integer not null default 0
);

create or replace function public.touch_standards()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at = coalesce(new.created_at, timezone('utc', now()));
    new.created_by = coalesce(new.created_by, auth.uid());
  end if;
  new.updated_at = timezone('utc', now());
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists standards_touch on public.standards;
create trigger standards_touch
before insert or update on public.standards
for each row
execute function public.touch_standards();

alter table public.standards enable row level security;
alter table public.standard_components enable row level security;

drop policy if exists "Authenticated users can read standards" on public.standards;
create policy "Authenticated users can read standards"
on public.standards
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert standards" on public.standards;
create policy "Authenticated users can insert standards"
on public.standards
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update standards" on public.standards;
create policy "Authenticated users can update standards"
on public.standards
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete standards" on public.standards;
create policy "Authenticated users can delete standards"
on public.standards
for delete
to authenticated
using (true);

drop policy if exists "Authenticated users can read standard components" on public.standard_components;
create policy "Authenticated users can read standard components"
on public.standard_components
for select
to authenticated
using (true);

drop policy if exists "Authenticated users can insert standard components" on public.standard_components;
create policy "Authenticated users can insert standard components"
on public.standard_components
for insert
to authenticated
with check (true);

drop policy if exists "Authenticated users can update standard components" on public.standard_components;
create policy "Authenticated users can update standard components"
on public.standard_components
for update
to authenticated
using (true)
with check (true);

drop policy if exists "Authenticated users can delete standard components" on public.standard_components;
create policy "Authenticated users can delete standard components"
on public.standard_components
for delete
to authenticated
using (true);

insert into storage.buckets (id, name, public)
values ('standard-tags', 'standard-tags', false)
on conflict (id) do update
set name = excluded.name,
    public = excluded.public;

drop policy if exists "Authenticated users can read standard tag images" on storage.objects;
create policy "Authenticated users can read standard tag images"
on storage.objects
for select
to authenticated
using (bucket_id = 'standard-tags');

drop policy if exists "Authenticated users can upload standard tag images" on storage.objects;
create policy "Authenticated users can upload standard tag images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'standard-tags');

drop policy if exists "Authenticated users can update standard tag images" on storage.objects;
create policy "Authenticated users can update standard tag images"
on storage.objects
for update
to authenticated
using (bucket_id = 'standard-tags')
with check (bucket_id = 'standard-tags');

drop policy if exists "Authenticated users can delete standard tag images" on storage.objects;
create policy "Authenticated users can delete standard tag images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'standard-tags');
