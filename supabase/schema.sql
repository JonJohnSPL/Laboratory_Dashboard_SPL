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
  receiving_analyst_initials text not null default '',
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
alter table public.standards add column if not exists receiving_analyst_initials text not null default '';

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

insert into storage.buckets (id, name, public)
values ('field-assets', 'field-assets', false)
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

drop policy if exists "Authenticated users can read field asset images" on storage.objects;
create policy "Authenticated users can read field asset images"
on storage.objects
for select
to authenticated
using (bucket_id = 'field-assets');

drop policy if exists "Authenticated users can upload field asset images" on storage.objects;
create policy "Authenticated users can upload field asset images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'field-assets');

drop policy if exists "Authenticated users can update field asset images" on storage.objects;
create policy "Authenticated users can update field asset images"
on storage.objects
for update
to authenticated
using (bucket_id = 'field-assets')
with check (bucket_id = 'field-assets');

drop policy if exists "Authenticated users can delete field asset images" on storage.objects;
create policy "Authenticated users can delete field asset images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'field-assets');

create or replace function public.touch_field_ops_row()
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

create table if not exists public.field_clients (
  id uuid primary key default gen_random_uuid(),
  client_name text not null default '',
  client_code text not null default '',
  account_status text not null default 'Active' check (account_status in ('Active', 'Pending', 'On Hold', 'Inactive')),
  sector text not null default 'Upstream',
  service_scope text not null default 'Field' check (service_scope in ('Lab', 'Field', 'Both')),
  primary_contact text not null default '',
  contact_phone text not null default '',
  contact_email text not null default '',
  billing_notes text not null default '',
  operational_notes text not null default '',
  salesforce_account_id text not null default '',
  default_service_area text not null default '',
  logo_path text,
  hq_street text not null default '',
  hq_city text not null default '',
  hq_state text not null default '',
  hq_zip text not null default '',
  hq_latitude numeric,
  hq_longitude numeric,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);

alter table public.field_clients add column if not exists sector text not null default 'Upstream';
alter table public.field_clients add column if not exists client_code text not null default '';
alter table public.field_clients add column if not exists service_scope text not null default 'Field';
alter table public.field_clients add column if not exists hq_street text not null default '';
alter table public.field_clients add column if not exists hq_city text not null default '';
alter table public.field_clients add column if not exists hq_state text not null default '';
alter table public.field_clients add column if not exists hq_zip text not null default '';
alter table public.field_clients add column if not exists hq_latitude numeric;
alter table public.field_clients add column if not exists hq_longitude numeric;
alter table public.field_clients add column if not exists logo_path text;
update public.field_clients
set client_code = upper(btrim(client_code))
where coalesce(client_code, '') <> '';
alter table public.field_clients drop constraint if exists field_clients_account_status_check;
alter table public.field_clients add constraint field_clients_account_status_check check (account_status in ('Active', 'Pending', 'On Hold', 'Inactive'));
alter table public.field_clients drop constraint if exists field_clients_service_scope_check;
alter table public.field_clients add constraint field_clients_service_scope_check check (service_scope in ('Lab', 'Field', 'Both'));

create table if not exists public.field_projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.field_clients(id) on delete cascade,
  project_name text not null default '',
  service_scope text not null default 'Field' check (service_scope in ('Lab', 'Field', 'Both')),
  project_status text not null default 'Active' check (project_status in ('Planning', 'Active', 'On Hold', 'Complete', 'Inactive')),
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);

alter table public.field_projects add column if not exists service_scope text not null default 'Field';
alter table public.field_projects add column if not exists project_status text not null default 'Active';
alter table public.field_projects add column if not exists client_id uuid;
alter table public.field_projects add column if not exists project_name text not null default '';
alter table public.field_projects add column if not exists notes text not null default '';
alter table public.field_projects drop constraint if exists field_projects_client_id_fkey;
alter table public.field_projects add constraint field_projects_client_id_fkey foreign key (client_id) references public.field_clients(id) on delete cascade;
alter table public.field_projects drop constraint if exists field_projects_service_scope_check;
alter table public.field_projects add constraint field_projects_service_scope_check check (service_scope in ('Lab', 'Field', 'Both'));
alter table public.field_projects drop constraint if exists field_projects_project_status_check;
alter table public.field_projects add constraint field_projects_project_status_check check (project_status in ('Planning', 'Active', 'On Hold', 'Complete', 'Inactive'));

create table if not exists public.field_contacts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.field_clients(id) on delete cascade,
  project_id uuid references public.field_projects(id) on delete cascade,
  site_id uuid,
  contact_first_name text not null default '',
  contact_last_name text not null default '',
  contact_name text not null default '',
  contact_role text not null default '',
  phone text not null default '',
  email text not null default '',
  contact_scope text not null default 'Operations' check (contact_scope in ('Billing', 'Operations', 'Site', 'Lab', 'Field')),
  is_primary boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);

alter table public.field_contacts add column if not exists client_id uuid;
alter table public.field_contacts add column if not exists project_id uuid;
alter table public.field_contacts add column if not exists site_id uuid;
alter table public.field_contacts add column if not exists contact_first_name text not null default '';
alter table public.field_contacts add column if not exists contact_last_name text not null default '';
alter table public.field_contacts add column if not exists contact_name text not null default '';
alter table public.field_contacts add column if not exists contact_role text not null default '';
alter table public.field_contacts add column if not exists phone text not null default '';
alter table public.field_contacts add column if not exists email text not null default '';
alter table public.field_contacts add column if not exists contact_scope text not null default 'Operations';
alter table public.field_contacts add column if not exists is_primary boolean not null default false;
alter table public.field_contacts add column if not exists notes text not null default '';
alter table public.field_contacts drop constraint if exists field_contacts_client_id_fkey;
alter table public.field_contacts add constraint field_contacts_client_id_fkey foreign key (client_id) references public.field_clients(id) on delete cascade;

update public.field_contacts
set
  contact_first_name = case
    when coalesce(contact_first_name, '') <> '' then contact_first_name
    when position(',' in contact_name) > 0 then btrim(split_part(contact_name, ',', 2))
    when contact_name !~ '[[:space:]]' then contact_name
    else btrim(regexp_replace(contact_name, '[[:space:]]+[^[:space:]]+$', ''))
  end,
  contact_last_name = case
    when coalesce(contact_last_name, '') <> '' then contact_last_name
    when position(',' in contact_name) > 0 then btrim(split_part(contact_name, ',', 1))
    when contact_name !~ '[[:space:]]' then ''
    else btrim(substring(contact_name from '[^[:space:]]+$'))
  end
where coalesce(contact_name, '') <> ''
  and (coalesce(contact_first_name, '') = '' or coalesce(contact_last_name, '') = '');

update public.field_contacts
set contact_name = btrim(coalesce(nullif(contact_first_name, ''), '') || ' ' || coalesce(nullif(contact_last_name, ''), ''))
where btrim(coalesce(contact_first_name, '') || ' ' || coalesce(contact_last_name, '')) <> ''
  and contact_name <> btrim(coalesce(nullif(contact_first_name, ''), '') || ' ' || coalesce(nullif(contact_last_name, ''), ''));

alter table public.field_contacts drop constraint if exists field_contacts_project_id_fkey;
alter table public.field_contacts add constraint field_contacts_project_id_fkey foreign key (project_id) references public.field_projects(id) on delete set null;
alter table public.field_contacts drop constraint if exists field_contacts_contact_scope_check;
alter table public.field_contacts add constraint field_contacts_contact_scope_check check (contact_scope in ('Billing', 'Operations', 'Site', 'Lab', 'Field'));
alter table public.field_contacts add column if not exists manager_contact_id uuid;
alter table public.field_contacts drop constraint if exists field_contacts_manager_contact_id_fkey;
alter table public.field_contacts add constraint field_contacts_manager_contact_id_fkey foreign key (manager_contact_id) references public.field_contacts(id) on delete set null;

create or replace function public.validate_field_contact_manager()
returns trigger
language plpgsql
as $$
declare
  manager_client_id uuid;
  has_cycle boolean;
begin
  if tg_op = 'UPDATE' then
    if old.client_id is distinct from new.client_id
      and exists (
        select 1
        from public.field_contacts child
        where child.manager_contact_id = new.id
          and child.id <> new.id
          and child.client_id <> new.client_id
      ) then
      raise exception 'Existing report contacts must belong to the same client.';
    end if;
  end if;

  if new.manager_contact_id is null then
    return new;
  end if;

  if new.manager_contact_id = new.id then
    raise exception 'A contact cannot report to themselves.';
  end if;

  select client_id into manager_client_id
  from public.field_contacts
  where id = new.manager_contact_id;

  if manager_client_id is null then
    raise exception 'Manager contact was not found.';
  end if;

  if manager_client_id <> new.client_id then
    raise exception 'Manager contact must belong to the same client.';
  end if;

  with recursive manager_chain(contact_id, manager_id) as (
    select id, manager_contact_id
    from public.field_contacts
    where id = new.manager_contact_id
    union all
    select c.id, c.manager_contact_id
    from public.field_contacts c
    join manager_chain mc on c.id = mc.manager_id
    where mc.manager_id is not null
  )
  select exists(select 1 from manager_chain where contact_id = new.id)
  into has_cycle;

  if has_cycle then
    raise exception 'Contact manager hierarchy cannot contain a cycle.';
  end if;

  return new;
end;
$$;

drop trigger if exists field_contacts_validate_manager on public.field_contacts;
create trigger field_contacts_validate_manager
before insert or update on public.field_contacts
for each row
execute function public.validate_field_contact_manager();

create table if not exists public.field_contact_projects (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.field_contacts(id) on delete cascade,
  project_id uuid not null references public.field_projects(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid,
  unique (contact_id, project_id)
);
alter table public.field_contact_projects add column if not exists contact_id uuid;
alter table public.field_contact_projects add column if not exists project_id uuid;
alter table public.field_contact_projects drop constraint if exists field_contact_projects_contact_id_fkey;
alter table public.field_contact_projects add constraint field_contact_projects_contact_id_fkey foreign key (contact_id) references public.field_contacts(id) on delete cascade;
alter table public.field_contact_projects drop constraint if exists field_contact_projects_project_id_fkey;
alter table public.field_contact_projects add constraint field_contact_projects_project_id_fkey foreign key (project_id) references public.field_projects(id) on delete cascade;
create unique index if not exists field_contact_projects_contact_project_unique_idx on public.field_contact_projects(contact_id, project_id);
create index if not exists field_contact_projects_contact_id_idx on public.field_contact_projects(contact_id);
create index if not exists field_contact_projects_project_id_idx on public.field_contact_projects(project_id);

insert into public.field_contact_projects (contact_id, project_id)
select c.id, c.project_id
from public.field_contacts c
where c.project_id is not null
on conflict (contact_id, project_id) do nothing;

create table if not exists public.field_billing_profiles (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.field_clients(id) on delete cascade,
  project_id uuid references public.field_projects(id) on delete cascade,
  billing_name text not null default '',
  billing_address text not null default '',
  billing_email text not null default '',
  billing_phone text not null default '',
  po_number text not null default '',
  reference_number text not null default '',
  invoice_notes text not null default '',
  field_billing_notes text not null default '',
  lab_billing_notes text not null default '',
  is_default boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);

alter table public.field_billing_profiles add column if not exists client_id uuid;
alter table public.field_billing_profiles add column if not exists project_id uuid;
alter table public.field_billing_profiles add column if not exists billing_name text not null default '';
alter table public.field_billing_profiles add column if not exists billing_address text not null default '';
alter table public.field_billing_profiles add column if not exists billing_email text not null default '';
alter table public.field_billing_profiles add column if not exists billing_phone text not null default '';
alter table public.field_billing_profiles add column if not exists po_number text not null default '';
alter table public.field_billing_profiles add column if not exists reference_number text not null default '';
alter table public.field_billing_profiles add column if not exists invoice_notes text not null default '';
alter table public.field_billing_profiles add column if not exists field_billing_notes text not null default '';
alter table public.field_billing_profiles add column if not exists lab_billing_notes text not null default '';
alter table public.field_billing_profiles add column if not exists is_default boolean not null default false;
alter table public.field_billing_profiles drop constraint if exists field_billing_profiles_client_id_fkey;
alter table public.field_billing_profiles add constraint field_billing_profiles_client_id_fkey foreign key (client_id) references public.field_clients(id) on delete cascade;
alter table public.field_billing_profiles drop constraint if exists field_billing_profiles_project_id_fkey;
alter table public.field_billing_profiles add constraint field_billing_profiles_project_id_fkey foreign key (project_id) references public.field_projects(id) on delete cascade;

create or replace function public.field_ops_catalog_key(raw_value text)
returns text
language sql
immutable
as $$
  select trim(both '_' from regexp_replace(upper(coalesce(raw_value, '')), '[^A-Z0-9]+', '_', 'g'));
$$;

create table if not exists public.field_site_types (
  id uuid primary key default gen_random_uuid(),
  site_type_key text not null default '',
  site_type_name text not null default '',
  is_active boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.field_site_types add column if not exists site_type_key text not null default '';
alter table public.field_site_types add column if not exists site_type_name text not null default '';
alter table public.field_site_types add column if not exists is_active boolean not null default true;
alter table public.field_site_types add column if not exists notes text not null default '';
alter table public.field_site_types drop column if exists sort_order;
create unique index if not exists field_site_types_site_type_key_unique_idx on public.field_site_types(site_type_key);
create unique index if not exists field_site_types_site_type_key_lower_unique_idx on public.field_site_types(lower(site_type_key));
drop index if exists public.field_site_types_sort_order_idx;

insert into public.field_site_types (site_type_key, site_type_name, is_active)
values
  ('WELL_SITE', 'Well Site', true),
  ('METER_STATION', 'Meter Station', true),
  ('FIELD_SITE', 'Field Site', true),
  ('WELL_PAD', 'Well Pad', true),
  ('LACT_UNIT', 'LACT Unit', true),
  ('FACILITY', 'Facility', true),
  ('PIPELINE_LOCATION', 'Pipeline Location', true),
  ('OFFICE_YARD', 'Office / Yard', true),
  ('OTHER', 'Other', true)
on conflict (site_type_key) do update
set site_type_name = excluded.site_type_name,
    is_active = excluded.is_active;

create table if not exists public.field_sites (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.field_clients(id) on delete cascade,
  project_id uuid not null references public.field_projects(id) on delete cascade,
  site_name text not null default '',
  site_type text not null default 'OTHER',
  physical_address text not null default '',
  county_state text not null default '',
  gps_coordinates text not null default '',
  access_instructions text not null default '',
  safety_ppe_notes text not null default '',
  gate_code_entry_requirements text not null default '',
  client_site_contact text not null default '',
  site_status text not null default 'Active' check (site_status in ('Active', 'Restricted', 'Inactive')),
  standard_job_types text not null default '',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);

alter table public.field_sites drop constraint if exists field_sites_site_type_check;
alter table public.field_sites add column if not exists site_type text not null default 'OTHER';
alter table public.field_sites add column if not exists standard_job_types text not null default '';
update public.field_sites
set site_type = coalesce(nullif(public.field_ops_catalog_key(site_type), ''), 'OTHER');
insert into public.field_site_types (site_type_key, site_type_name, is_active)
select distinct s.site_type, initcap(replace(lower(s.site_type), '_', ' ')), true
from public.field_sites s
where coalesce(s.site_type, '') <> ''
  and not exists (
    select 1
    from public.field_site_types st
    where st.site_type_key = s.site_type
  )
on conflict (site_type_key) do nothing;
alter table public.field_sites drop constraint if exists field_sites_site_type_fkey;
alter table public.field_sites add constraint field_sites_site_type_fkey foreign key (site_type) references public.field_site_types(site_type_key) on update cascade;
alter table public.field_sites add column if not exists project_id uuid;
alter table public.field_sites drop constraint if exists field_sites_project_id_fkey;
alter table public.field_sites add constraint field_sites_project_id_fkey foreign key (project_id) references public.field_projects(id) on delete cascade;
alter table public.field_contacts add column if not exists site_id uuid;
alter table public.field_contacts drop constraint if exists field_contacts_site_id_fkey;
alter table public.field_contacts add constraint field_contacts_site_id_fkey foreign key (site_id) references public.field_sites(id) on delete set null;

create table if not exists public.field_contact_sites (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.field_contacts(id) on delete cascade,
  site_id uuid not null references public.field_sites(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid,
  unique (contact_id, site_id)
);
alter table public.field_contact_sites add column if not exists contact_id uuid;
alter table public.field_contact_sites add column if not exists site_id uuid;
alter table public.field_contact_sites drop constraint if exists field_contact_sites_contact_id_fkey;
alter table public.field_contact_sites add constraint field_contact_sites_contact_id_fkey foreign key (contact_id) references public.field_contacts(id) on delete cascade;
alter table public.field_contact_sites drop constraint if exists field_contact_sites_site_id_fkey;
alter table public.field_contact_sites add constraint field_contact_sites_site_id_fkey foreign key (site_id) references public.field_sites(id) on delete cascade;
create unique index if not exists field_contact_sites_contact_site_unique_idx on public.field_contact_sites(contact_id, site_id);
create index if not exists field_contact_sites_contact_id_idx on public.field_contact_sites(contact_id);
create index if not exists field_contact_sites_site_id_idx on public.field_contact_sites(site_id);

insert into public.field_contact_sites (contact_id, site_id)
select c.id, c.site_id
from public.field_contacts c
where c.site_id is not null
on conflict (contact_id, site_id) do nothing;

create table if not exists public.field_site_projects (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references public.field_sites(id) on delete cascade,
  project_id uuid not null references public.field_projects(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid,
  unique (site_id, project_id)
);
alter table public.field_site_projects add column if not exists site_id uuid;
alter table public.field_site_projects add column if not exists project_id uuid;
alter table public.field_site_projects drop constraint if exists field_site_projects_site_id_fkey;
alter table public.field_site_projects add constraint field_site_projects_site_id_fkey foreign key (site_id) references public.field_sites(id) on delete cascade;
alter table public.field_site_projects drop constraint if exists field_site_projects_project_id_fkey;
alter table public.field_site_projects add constraint field_site_projects_project_id_fkey foreign key (project_id) references public.field_projects(id) on delete cascade;

insert into public.field_site_projects (site_id, project_id)
select s.id, s.project_id
from public.field_sites s
where s.project_id is not null
on conflict (site_id, project_id) do nothing;

create table if not exists public.field_jobs (
  id uuid primary key default gen_random_uuid(),
  fieldfx_ticket_id text not null default '',
  client_id uuid not null references public.field_clients(id) on delete cascade,
  project_id uuid not null references public.field_projects(id) on delete cascade,
  site_id uuid not null references public.field_sites(id) on delete cascade,
  job_type text not null default '' check (job_type in ('', 'Allocation Proving', 'LACT Proving', 'Sample Pickup', 'Sample Drop-Off', 'Maintenance', 'Multi-Service')),
  priority text not null default 'Normal' check (priority in ('Low', 'Normal', 'High', 'Urgent')),
  requested_date date,
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  actual_start timestamptz,
  actual_end timestamptz,
  duration_planned_minutes integer,
  duration_actual_minutes integer,
  scope_summary text not null default '',
  work_instructions text not null default '',
  api_standard_reference text not null default '',
  custody_allocation text not null default 'Allocation' check (custody_allocation in ('Allocation', 'Custody', 'Both')),
  samples_required boolean not null default false,
  meter_unit_id text not null default '',
  proving_required boolean not null default false,
  maintenance_required boolean not null default false,
  client_contact_for_job text not null default '',
  dispatch_notes text not null default '',
  completion_notes text not null default '',
  follow_up_required boolean not null default false,
  follow_up_notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.field_jobs add column if not exists project_id uuid;
alter table public.field_jobs drop constraint if exists field_jobs_project_id_fkey;
alter table public.field_jobs add constraint field_jobs_project_id_fkey foreign key (project_id) references public.field_projects(id) on delete cascade;
alter table public.field_jobs drop constraint if exists field_jobs_job_type_check;

create table if not exists public.field_job_assignments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.field_jobs(id) on delete cascade,
  assignment_type text not null check (assignment_type in ('Technician', 'Truck', 'Trailer', 'Equipment')),
  resource_id uuid not null,
  assigned_start timestamptz,
  assigned_end timestamptz,
  assignment_status text not null default 'Assigned' check (assignment_status in ('Assigned', 'Confirmed', 'In Progress', 'Complete')),
  assignment_notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_name text not null default '',
  work_scope text not null default 'Field' check (work_scope in ('Lab', 'Field', 'Both')),
  lab_role text not null default '',
  field_role text not null default '',
  can_sample_transport boolean not null default false,
  phone text not null default '',
  email text not null default '',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);

create table if not exists public.field_job_types (
  id uuid primary key default gen_random_uuid(),
  job_type_key text not null default '',
  job_type_name text not null default '',
  is_active boolean not null default true,
  schedule_mode text not null default 'range' check (schedule_mode in ('range', 'point_in_time')),
  required_assignment_types text[] not null default '{}'::text[],
  detail_groups text[] not null default '{}'::text[],
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.field_job_types add column if not exists job_type_key text not null default '';
alter table public.field_job_types add column if not exists job_type_name text not null default '';
alter table public.field_job_types add column if not exists is_active boolean not null default true;
alter table public.field_job_types add column if not exists schedule_mode text not null default 'range';
alter table public.field_job_types add column if not exists required_assignment_types text[] not null default '{}'::text[];
alter table public.field_job_types add column if not exists detail_groups text[] not null default '{}'::text[];
alter table public.field_job_types drop column if exists sort_order;
alter table public.field_job_types drop constraint if exists field_job_types_schedule_mode_check;
alter table public.field_job_types add constraint field_job_types_schedule_mode_check check (schedule_mode in ('range', 'point_in_time'));
create unique index if not exists field_job_types_job_type_key_unique_idx on public.field_job_types(job_type_key);

insert into public.field_job_types (
  job_type_key,
  job_type_name,
  is_active,
  schedule_mode,
  required_assignment_types,
  detail_groups
)
values
  ('ALLOCATION_PROVING', 'Allocation Proving', true, 'range', array['Technician', 'Truck', 'Equipment'], array['proving', 'execution']),
  ('LACT_PROVING', 'LACT Proving', true, 'range', array['Technician', 'Truck', 'Equipment'], array['proving', 'execution']),
  ('SAMPLE_PICKUP', 'Sample Pickup', true, 'point_in_time', array['Technician', 'Truck'], array['sample_logistics', 'execution']),
  ('SAMPLE_DROP_OFF', 'Sample Drop-Off', true, 'point_in_time', array['Technician', 'Truck'], array['sample_logistics', 'execution']),
  ('MAINTENANCE', 'Maintenance', true, 'range', '{}'::text[], array['maintenance', 'execution']),
  ('MULTI_SERVICE', 'Multi-Service', true, 'range', '{}'::text[], array['proving', 'sample_logistics', 'maintenance', 'execution'])
on conflict (job_type_key) do update
set job_type_name = excluded.job_type_name,
    is_active = excluded.is_active,
    schedule_mode = excluded.schedule_mode,
    required_assignment_types = excluded.required_assignment_types,
    detail_groups = excluded.detail_groups;

alter table public.employees add column if not exists employee_name text not null default '';
alter table public.employees add column if not exists work_scope text not null default 'Field';
alter table public.employees add column if not exists lab_role text not null default '';
alter table public.employees add column if not exists field_role text not null default '';
alter table public.employees add column if not exists can_sample_transport boolean not null default false;
alter table public.employees add column if not exists phone text not null default '';
alter table public.employees add column if not exists email text not null default '';
alter table public.employees add column if not exists notes text not null default '';
alter table public.employees drop constraint if exists employees_work_scope_check;
alter table public.employees add constraint employees_work_scope_check check (work_scope in ('Lab', 'Field', 'Both'));

create table if not exists public.field_technicians (
  id uuid primary key default gen_random_uuid(),
  employee_name text not null default '',
  role text not null default 'Field Tech' check (role in ('Field Tech', 'Senior Field Tech', 'Supervisor', 'Manager')),
  phone text not null default '',
  email text not null default '',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.field_technicians drop column if exists home_base;
alter table public.field_technicians drop column if exists certifications;
alter table public.field_technicians drop column if exists api_safety_training_status;
alter table public.field_technicians drop column if exists availability_status;
alter table public.field_technicians drop column if exists skill_tags;

insert into public.employees (
  employee_name,
  work_scope,
  lab_role,
  field_role,
  can_sample_transport,
  phone,
  email,
  notes,
  created_at,
  updated_at,
  created_by,
  updated_by
)
select
  ft.employee_name,
  'Field',
  '',
  ft.role,
  false,
  ft.phone,
  ft.email,
  ft.notes,
  ft.created_at,
  ft.updated_at,
  ft.created_by,
  ft.updated_by
from public.field_technicians ft
where not exists (
  select 1
  from public.employees e
  where lower(btrim(e.employee_name)) = lower(btrim(ft.employee_name))
);

create table if not exists public.field_trucks (
  id uuid primary key default gen_random_uuid(),
  unit_number text not null default '',
  vehicle_type text not null default 'Pickup' check (vehicle_type in ('Pickup', 'Service Truck', 'Other')),
  service_status text not null default 'Available' check (service_status in ('Available', 'In Use', 'Maintenance', 'Out of Service')),
  current_driver text not null default '',
  assigned_technician_id uuid,
  model text not null default '',
  license_plate_number text not null default '',
  make text not null default '',
  color text not null default '',
  registered_state text not null default '',
  vin text not null default '',
  vehicle_id text not null default '',
  vehicle_year integer,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.field_trucks add column if not exists photo_path text;
alter table public.field_trucks add column if not exists current_driver text not null default '';
alter table public.field_trucks add column if not exists assigned_technician_id uuid;
alter table public.field_trucks add column if not exists model text not null default '';
alter table public.field_trucks add column if not exists license_plate_number text not null default '';
alter table public.field_trucks add column if not exists make text not null default '';
alter table public.field_trucks add column if not exists color text not null default '';
alter table public.field_trucks add column if not exists registered_state text not null default '';
alter table public.field_trucks add column if not exists vin text not null default '';
alter table public.field_trucks add column if not exists vehicle_id text not null default '';
alter table public.field_trucks add column if not exists vehicle_year integer;
alter table public.field_trucks drop column if exists plate_vin;
alter table public.field_trucks drop column if exists assigned_region;
alter table public.field_trucks drop column if exists odometer;
alter table public.field_trucks drop column if exists last_service_date;
alter table public.field_trucks drop column if exists next_service_due;
alter table public.field_trucks drop column if exists workflow;
alter table public.field_trucks drop column if exists gps_id;
alter table public.field_trucks drop column if exists gps_status;
alter table public.field_trucks drop column if exists gvwr;
alter table public.field_trucks drop column if exists business_unit;
alter table public.field_trucks drop column if exists primary_use;
alter table public.field_trucks drop column if exists assigned_to;
alter table public.field_trucks drop column if exists duty;
alter table public.field_trucks drop column if exists vehicle_information;
alter table public.field_trucks drop column if exists lease_company;
alter table public.field_trucks drop column if exists lease_begin_date;
alter table public.field_trucks drop column if exists delivery_date;
alter table public.field_trucks drop column if exists lease_end_date;
alter table public.field_trucks drop column if exists returned_date;
alter table public.field_trucks drop column if exists ownership;
alter table public.field_trucks drop column if exists registration_expiration_date;
alter table public.field_trucks drop column if exists state_insurance_expiration_date;

create table if not exists public.field_trailers (
  id uuid primary key default gen_random_uuid(),
  trailer_number text not null default '',
  trailer_type text not null default '',
  capacity_configuration text not null default '',
  service_status text not null default 'Available' check (service_status in ('Available', 'Assigned', 'In Use', 'Maintenance', 'Out of Service')),
  assigned_truck_id uuid,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.field_trailers add column if not exists photo_path text;
alter table public.field_trailers add column if not exists assigned_truck_id uuid;
alter table public.field_trailers drop column if exists last_inspection_date;
alter table public.field_trailers drop column if exists next_inspection_due;

create table if not exists public.field_equipment (
  id uuid primary key default gen_random_uuid(),
  equipment_name text not null default '',
  equipment_type text not null default 'Small Volume Prover' check (equipment_type in ('Small Volume Prover', 'Master Meter', 'Regulator', 'Hose Set', 'Sampling Equipment', 'Tooling', 'Other')),
  model text not null default '',
  manufacturer text not null default '',
  spl_inventory_barcode text not null default '',
  serial_number text not null default '',
  calibration_status text not null default 'Current' check (calibration_status in ('Current', 'Due Soon', 'Overdue')),
  last_calibration_date date,
  next_calibration_due date,
  maintenance_status text not null default 'Available' check (maintenance_status in ('Available', 'Assigned', 'In Use', 'Needs Repair', 'Out of Service')),
  storage_location text not null default '',
  assigned_trailer_truck text not null default '',
  assigned_truck_id uuid,
  assigned_trailer_id uuid,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.field_equipment add column if not exists photo_path text;
alter table public.field_equipment add column if not exists assigned_truck_id uuid;
alter table public.field_equipment add column if not exists assigned_trailer_id uuid;
alter table public.field_equipment add column if not exists model text not null default '';
alter table public.field_equipment add column if not exists manufacturer text not null default '';
alter table public.field_equipment add column if not exists spl_inventory_barcode text not null default '';

create table if not exists public.field_samples (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.field_jobs(id) on delete cascade,
  client_id uuid not null references public.field_clients(id) on delete cascade,
  site_id uuid not null references public.field_sites(id) on delete cascade,
  sample_type text not null default 'Gas' check (sample_type in ('Gas', 'Liquid', 'Condensate', 'Other')),
  container_type text not null default 'Cylinder' check (container_type in ('Cylinder', 'Bottle', 'Other')),
  collection_date_time timestamptz,
  picked_up_by text not null default '',
  drop_off_location text not null default '',
  chain_of_custody_status text not null default 'Requested' check (chain_of_custody_status in ('Requested', 'Collected', 'In Transit', 'Delivered', 'Logged In', 'Complete', 'Exception')),
  lab_receipt_status text not null default 'Requested' check (lab_receipt_status in ('Requested', 'Delivered', 'Logged In', 'Complete', 'Exception')),
  priority_tat text not null default '',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);

create table if not exists public.field_maintenance_records (
  id uuid primary key default gen_random_uuid(),
  asset_type text not null default 'Equipment' check (asset_type in ('Truck', 'Trailer', 'Equipment')),
  asset_id uuid not null,
  maintenance_type text not null default 'Preventive' check (maintenance_type in ('Preventive', 'Repair', 'Inspection', 'Calibration')),
  open_date date,
  due_date date,
  completed_date date,
  status text not null default 'Open' check (status in ('Open', 'Scheduled', 'In Progress', 'Complete', 'Canceled')),
  issue_description text not null default '',
  resolution text not null default '',
  vendor_internal text not null default 'Internal' check (vendor_internal in ('Vendor', 'Internal')),
  cost numeric(12,2),
  assigned_person text not null default '',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);

create index if not exists field_sites_client_id_idx on public.field_sites(client_id);
create index if not exists field_projects_client_id_idx on public.field_projects(client_id);
create unique index if not exists field_clients_client_code_unique_idx on public.field_clients (lower(client_code)) where btrim(client_code) <> '';
create index if not exists field_contacts_client_id_idx on public.field_contacts(client_id);
create index if not exists field_contacts_project_id_idx on public.field_contacts(project_id);
create index if not exists field_contacts_site_id_idx on public.field_contacts(site_id);
create index if not exists field_contacts_manager_contact_id_idx on public.field_contacts(manager_contact_id);
create index if not exists field_billing_profiles_client_id_idx on public.field_billing_profiles(client_id);
create index if not exists field_billing_profiles_project_id_idx on public.field_billing_profiles(project_id);
create index if not exists field_sites_project_id_idx on public.field_sites(project_id);
create unique index if not exists field_site_projects_site_project_unique_idx on public.field_site_projects(site_id, project_id);
create index if not exists field_site_projects_site_id_idx on public.field_site_projects(site_id);
create index if not exists field_site_projects_project_id_idx on public.field_site_projects(project_id);
create index if not exists field_jobs_client_id_idx on public.field_jobs(client_id);
create index if not exists field_jobs_project_id_idx on public.field_jobs(project_id);
create index if not exists field_jobs_site_id_idx on public.field_jobs(site_id);
create unique index if not exists field_job_assignments_unique_resource_per_job_idx on public.field_job_assignments(job_id, assignment_type, resource_id);
create unique index if not exists field_job_types_job_type_key_lower_unique_idx on public.field_job_types (lower(job_type_key));
drop index if exists public.field_job_types_sort_order_idx;

create table if not exists public.field_site_type_job_types (
  id uuid primary key default gen_random_uuid(),
  site_type_key text not null default '',
  job_type_key text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid,
  unique (site_type_key, job_type_key)
);
alter table public.field_site_type_job_types add column if not exists site_type_key text not null default '';
alter table public.field_site_type_job_types add column if not exists job_type_key text not null default '';
alter table public.field_site_type_job_types drop constraint if exists field_site_type_job_types_site_type_key_fkey;
alter table public.field_site_type_job_types add constraint field_site_type_job_types_site_type_key_fkey foreign key (site_type_key) references public.field_site_types(site_type_key) on update cascade on delete cascade;
alter table public.field_site_type_job_types drop constraint if exists field_site_type_job_types_job_type_key_fkey;
alter table public.field_site_type_job_types add constraint field_site_type_job_types_job_type_key_fkey foreign key (job_type_key) references public.field_job_types(job_type_key) on update cascade on delete cascade;
create unique index if not exists field_site_type_job_types_unique_idx on public.field_site_type_job_types(site_type_key, job_type_key);
create index if not exists field_site_type_job_types_site_type_key_idx on public.field_site_type_job_types(site_type_key);
create index if not exists field_site_type_job_types_job_type_key_idx on public.field_site_type_job_types(job_type_key);

insert into public.field_site_type_job_types (site_type_key, job_type_key)
select distinct
  coalesce(nullif(public.field_ops_catalog_key(s.site_type), ''), 'OTHER') as site_type_key,
  jt.job_type_key
from public.field_sites s
cross join lateral regexp_split_to_table(coalesce(s.standard_job_types, ''), '\s*,\s*') as raw_job_type(job_type_text)
join public.field_job_types jt
  on public.field_ops_catalog_key(raw_job_type.job_type_text) = public.field_ops_catalog_key(jt.job_type_key)
  or public.field_ops_catalog_key(raw_job_type.job_type_text) = public.field_ops_catalog_key(jt.job_type_name)
where btrim(coalesce(raw_job_type.job_type_text, '')) <> ''
on conflict (site_type_key, job_type_key) do nothing;

create index if not exists field_samples_job_id_idx on public.field_samples(job_id);
create index if not exists field_samples_coc_status_idx on public.field_samples(chain_of_custody_status);
create index if not exists field_maintenance_asset_idx on public.field_maintenance_records(asset_type, asset_id);
create index if not exists field_maintenance_status_due_idx on public.field_maintenance_records(status, due_date);

do $$
declare
  tbl text;
  field_tables text[] := array[
    'field_clients',
    'field_projects',
    'field_contacts',
    'field_contact_projects',
    'field_contact_sites',
    'field_billing_profiles',
    'field_site_types',
    'field_sites',
    'field_site_projects',
    'field_jobs',
    'field_job_assignments',
    'field_job_types',
    'field_site_type_job_types',
    'employees',
    'field_technicians',
    'field_trucks',
    'field_trailers',
    'field_equipment',
    'field_samples',
    'field_maintenance_records'
  ];
begin
  foreach tbl in array field_tables loop
    execute format('drop trigger if exists %I on public.%I', tbl || '_touch', tbl);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.touch_field_ops_row()', tbl || '_touch', tbl);
    execute format('alter table public.%I enable row level security', tbl);

    execute format('drop policy if exists %I on public.%I', 'Authenticated users can read ' || tbl, tbl);
    execute format('create policy %I on public.%I for select to authenticated using (true)', 'Authenticated users can read ' || tbl, tbl);

    execute format('drop policy if exists %I on public.%I', 'Authenticated users can insert ' || tbl, tbl);
    execute format('create policy %I on public.%I for insert to authenticated with check (true)', 'Authenticated users can insert ' || tbl, tbl);

    execute format('drop policy if exists %I on public.%I', 'Authenticated users can update ' || tbl, tbl);
    execute format('create policy %I on public.%I for update to authenticated using (true) with check (true)', 'Authenticated users can update ' || tbl, tbl);

    execute format('drop policy if exists %I on public.%I', 'Authenticated users can delete ' || tbl, tbl);
    execute format('create policy %I on public.%I for delete to authenticated using (true)', 'Authenticated users can delete ' || tbl, tbl);
  end loop;
end
$$;

insert into public.field_projects (client_id, project_name, service_scope, project_status, notes)
select c.id, 'General / Legacy', c.service_scope, 'Active', 'Auto-created legacy project for existing client records.'
from public.field_clients c
where not exists (
  select 1
  from public.field_projects p
  where p.client_id = c.id
);

with project_choice as (
  select
    c.id as client_id,
    coalesce(
      (
        select p.id
        from public.field_projects p
        where p.client_id = c.id
          and p.project_name = 'General / Legacy'
        order by p.created_at asc, p.id asc
        limit 1
      ),
      (
        select p.id
        from public.field_projects p
        where p.client_id = c.id
        order by p.created_at asc, p.id asc
        limit 1
      )
    ) as project_id
  from public.field_clients c
)
update public.field_sites s
set project_id = project_choice.project_id
from project_choice
where s.client_id = project_choice.client_id
  and s.project_id is null
  and project_choice.project_id is not null;

with project_choice as (
  select
    c.id as client_id,
    coalesce(
      (
        select p.id
        from public.field_projects p
        where p.client_id = c.id
          and p.project_name = 'General / Legacy'
        order by p.created_at asc, p.id asc
        limit 1
      ),
      (
        select p.id
        from public.field_projects p
        where p.client_id = c.id
        order by p.created_at asc, p.id asc
        limit 1
      )
    ) as project_id
  from public.field_clients c
)
update public.field_jobs j
set project_id = project_choice.project_id
from project_choice
where j.client_id = project_choice.client_id
  and j.project_id is null
  and project_choice.project_id is not null;

alter table public.field_sites alter column project_id set not null;
alter table public.field_jobs alter column project_id set not null;
