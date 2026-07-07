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
using (false);

drop policy if exists "Authenticated users can insert app_state" on public.app_state;
create policy "Authenticated users can insert app_state"
on public.app_state
for insert
to authenticated
with check (false);

drop policy if exists "Authenticated users can update app_state" on public.app_state;
create policy "Authenticated users can update app_state"
on public.app_state
for update
to authenticated
using (false)
with check (false);

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
using (false);

drop policy if exists "Authenticated users can insert standards" on public.standards;
create policy "Authenticated users can insert standards"
on public.standards
for insert
to authenticated
with check (false);

drop policy if exists "Authenticated users can update standards" on public.standards;
create policy "Authenticated users can update standards"
on public.standards
for update
to authenticated
using (false)
with check (false);

drop policy if exists "Authenticated users can delete standards" on public.standards;
create policy "Authenticated users can delete standards"
on public.standards
for delete
to authenticated
using (false);

drop policy if exists "Authenticated users can read standard components" on public.standard_components;
create policy "Authenticated users can read standard components"
on public.standard_components
for select
to authenticated
using (false);

drop policy if exists "Authenticated users can insert standard components" on public.standard_components;
create policy "Authenticated users can insert standard components"
on public.standard_components
for insert
to authenticated
with check (false);

drop policy if exists "Authenticated users can update standard components" on public.standard_components;
create policy "Authenticated users can update standard components"
on public.standard_components
for update
to authenticated
using (false)
with check (false);

drop policy if exists "Authenticated users can delete standard components" on public.standard_components;
create policy "Authenticated users can delete standard components"
on public.standard_components
for delete
to authenticated
using (false);

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
  marker_color text not null default '',
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
alter table public.field_clients add column if not exists marker_color text not null default '';
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
  billing_contact_id uuid references public.field_contacts(id) on delete set null,
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
alter table public.field_billing_profiles add column if not exists billing_contact_id uuid;
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
alter table public.field_billing_profiles drop constraint if exists field_billing_profiles_billing_contact_id_fkey;
alter table public.field_billing_profiles add constraint field_billing_profiles_billing_contact_id_fkey foreign key (billing_contact_id) references public.field_contacts(id) on delete set null;

create or replace function public.validate_field_billing_profile_contact()
returns trigger
language plpgsql
as $$
declare
  contact_client_id uuid;
begin
  new.project_id = null;
  new.is_default = true;

  if new.billing_contact_id is null then
    return new;
  end if;

  select client_id into contact_client_id
  from public.field_contacts
  where id = new.billing_contact_id;

  if contact_client_id is null then
    raise exception 'Billing contact was not found.';
  end if;

  if contact_client_id <> new.client_id then
    raise exception 'Billing contact must belong to the same client.';
  end if;

  return new;
end;
$$;

drop trigger if exists field_billing_profiles_validate_contact on public.field_billing_profiles;
create trigger field_billing_profiles_validate_contact
before insert or update on public.field_billing_profiles
for each row
execute function public.validate_field_billing_profile_contact();

create table if not exists public.billing_price_items (
  id uuid primary key default gen_random_uuid(),
  item_key text not null default '',
  price_section text not null default '',
  category text not null default '',
  method text not null default '',
  description text not null default '',
  unit_name text not null default 'Per Sample',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.billing_price_items add column if not exists item_key text not null default '';
alter table public.billing_price_items add column if not exists price_section text not null default '';
alter table public.billing_price_items add column if not exists category text not null default '';
alter table public.billing_price_items add column if not exists method text not null default '';
alter table public.billing_price_items add column if not exists description text not null default '';
alter table public.billing_price_items add column if not exists unit_name text not null default 'Per Sample';
alter table public.billing_price_items add column if not exists sort_order integer not null default 0;
alter table public.billing_price_items add column if not exists is_active boolean not null default true;
alter table public.billing_price_items add column if not exists notes text not null default '';
update public.billing_price_items
set item_key = trim(both '_' from regexp_replace(upper(coalesce(nullif(item_key, ''), method || ' ' || description)), '[^A-Z0-9]+', '_', 'g'))
where coalesce(item_key, '') = ''
  or item_key <> trim(both '_' from regexp_replace(upper(item_key), '[^A-Z0-9]+', '_', 'g'));
create unique index if not exists billing_price_items_item_key_unique_idx on public.billing_price_items(item_key);
create unique index if not exists billing_price_items_item_key_lower_unique_idx on public.billing_price_items(lower(item_key));
create index if not exists billing_price_items_active_sort_idx on public.billing_price_items(is_active, sort_order, item_key);

create table if not exists public.field_billing_profile_prices (
  id uuid primary key default gen_random_uuid(),
  billing_profile_id uuid not null references public.field_billing_profiles(id) on delete cascade,
  price_item_id uuid not null references public.billing_price_items(id) on delete restrict,
  rate_amount numeric(12,2),
  currency_code text not null default 'USD',
  effective_year integer not null default 2026,
  is_active boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid,
  unique (billing_profile_id, price_item_id, effective_year)
);
alter table public.field_billing_profile_prices add column if not exists billing_profile_id uuid;
alter table public.field_billing_profile_prices add column if not exists price_item_id uuid;
alter table public.field_billing_profile_prices add column if not exists rate_amount numeric(12,2);
alter table public.field_billing_profile_prices add column if not exists currency_code text not null default 'USD';
alter table public.field_billing_profile_prices add column if not exists effective_year integer not null default 2026;
alter table public.field_billing_profile_prices add column if not exists is_active boolean not null default true;
alter table public.field_billing_profile_prices add column if not exists notes text not null default '';
alter table public.field_billing_profile_prices drop constraint if exists field_billing_profile_prices_billing_profile_id_fkey;
alter table public.field_billing_profile_prices add constraint field_billing_profile_prices_billing_profile_id_fkey foreign key (billing_profile_id) references public.field_billing_profiles(id) on delete cascade;
alter table public.field_billing_profile_prices drop constraint if exists field_billing_profile_prices_price_item_id_fkey;
alter table public.field_billing_profile_prices add constraint field_billing_profile_prices_price_item_id_fkey foreign key (price_item_id) references public.billing_price_items(id) on delete restrict;
alter table public.field_billing_profile_prices drop constraint if exists field_billing_profile_prices_effective_year_check;
alter table public.field_billing_profile_prices add constraint field_billing_profile_prices_effective_year_check check (effective_year between 2000 and 2100);
alter table public.field_billing_profile_prices drop constraint if exists field_billing_profile_prices_rate_amount_check;
alter table public.field_billing_profile_prices add constraint field_billing_profile_prices_rate_amount_check check (rate_amount is null or rate_amount >= 0);
create unique index if not exists field_billing_profile_prices_profile_item_year_unique_idx on public.field_billing_profile_prices(billing_profile_id, price_item_id, effective_year);
create index if not exists field_billing_profile_prices_billing_profile_id_idx on public.field_billing_profile_prices(billing_profile_id);
create index if not exists field_billing_profile_prices_price_item_id_idx on public.field_billing_profile_prices(price_item_id);
create index if not exists field_billing_profile_prices_effective_year_idx on public.field_billing_profile_prices(effective_year);

with ranked_profiles as (
  select
    p.id,
    first_value(p.id) over (
      partition by p.client_id
      order by p.is_default desc, (p.project_id is null) desc, p.created_at asc, p.id asc
    ) as keep_id
  from public.field_billing_profiles p
), moved_prices as (
  update public.field_billing_profile_prices price
  set billing_profile_id = ranked.keep_id
  from ranked_profiles ranked
  where price.billing_profile_id = ranked.id
    and ranked.id <> ranked.keep_id
    and not exists (
      select 1
      from public.field_billing_profile_prices existing
      where existing.billing_profile_id = ranked.keep_id
        and existing.price_item_id = price.price_item_id
        and existing.effective_year = price.effective_year
    )
  returning price.id
)
delete from public.field_billing_profiles profile
using ranked_profiles ranked
where profile.id = ranked.id
  and ranked.id <> ranked.keep_id;

update public.field_billing_profiles
set project_id = null,
    is_default = true;

create unique index if not exists field_billing_profiles_client_unique_idx on public.field_billing_profiles(client_id);

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
  access_required boolean not null default false,
  approved_access_label text not null default '',
  approved_access_latitude numeric,
  approved_access_longitude numeric,
  approved_access_notes text not null default '',
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
alter table public.field_sites add column if not exists access_required boolean not null default false;
alter table public.field_sites add column if not exists approved_access_label text not null default '';
alter table public.field_sites add column if not exists approved_access_latitude numeric;
alter table public.field_sites add column if not exists approved_access_longitude numeric;
alter table public.field_sites add column if not exists approved_access_notes text not null default '';
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
  salesforce_case_id text not null default '',
  salesforce_case_number text not null default '',
  salesforce_case_url text not null default '',
  salesforce_synced_at timestamptz,
  salesforce_sync_status text not null default '',
  salesforce_sync_error text not null default '',
  no_ticket_required boolean not null default false,
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
alter table public.field_jobs add column if not exists salesforce_case_id text not null default '';
alter table public.field_jobs add column if not exists salesforce_case_number text not null default '';
alter table public.field_jobs add column if not exists salesforce_case_url text not null default '';
alter table public.field_jobs add column if not exists salesforce_synced_at timestamptz;
alter table public.field_jobs add column if not exists salesforce_sync_status text not null default '';
alter table public.field_jobs add column if not exists salesforce_sync_error text not null default '';
alter table public.field_jobs add column if not exists no_ticket_required boolean not null default false;
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

create table if not exists public.field_job_sites (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.field_jobs(id) on delete cascade,
  site_id uuid not null references public.field_sites(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid,
  unique (job_id, site_id)
);
alter table public.field_job_sites add column if not exists job_id uuid;
alter table public.field_job_sites add column if not exists site_id uuid;
alter table public.field_job_sites add column if not exists sort_order integer not null default 0;
alter table public.field_job_sites drop constraint if exists field_job_sites_job_id_fkey;
alter table public.field_job_sites add constraint field_job_sites_job_id_fkey foreign key (job_id) references public.field_jobs(id) on delete cascade;
alter table public.field_job_sites drop constraint if exists field_job_sites_site_id_fkey;
alter table public.field_job_sites add constraint field_job_sites_site_id_fkey foreign key (site_id) references public.field_sites(id) on delete cascade;
create unique index if not exists field_job_sites_job_site_unique_idx on public.field_job_sites(job_id, site_id);
create index if not exists field_job_sites_job_id_idx on public.field_job_sites(job_id);
create index if not exists field_job_sites_site_id_idx on public.field_job_sites(site_id);
create index if not exists field_job_sites_job_sort_idx on public.field_job_sites(job_id, sort_order);

insert into public.field_job_sites (job_id, site_id, sort_order)
select j.id, j.site_id, 0
from public.field_jobs j
where j.site_id is not null
on conflict (job_id, site_id) do nothing;

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  employee_first_name text not null default '',
  employee_last_name text not null default '',
  employee_name text not null default '',
  home_spl_site text not null default 'Pittsburgh',
  work_scope text not null default 'Field' check (work_scope in ('Lab', 'Field', 'Both')),
  lab_role text not null default '',
  field_role text not null default '',
  can_sample_transport boolean not null default false,
  is_active boolean not null default true,
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
  job_type_color text not null default '#f56584',
  is_active boolean not null default true,
  lab_employee_eligible boolean not null default false,
  allow_multiple_sites boolean not null default false,
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
alter table public.field_job_types add column if not exists job_type_color text not null default '#f56584';
alter table public.field_job_types alter column job_type_color set default '#f56584';
alter table public.field_job_types add column if not exists is_active boolean not null default true;
alter table public.field_job_types add column if not exists lab_employee_eligible boolean not null default false;
alter table public.field_job_types add column if not exists allow_multiple_sites boolean not null default false;
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
  job_type_color,
  is_active,
  lab_employee_eligible,
  allow_multiple_sites,
  schedule_mode,
  required_assignment_types,
  detail_groups
)
values
  ('ALLOCATION_PROVING', 'Allocation Proving', '#f56584', true, false, false, 'range', array['Technician', 'Truck', 'Equipment'], array['proving', 'execution']),
  ('LACT_PROVING', 'LACT Proving', '#ffa29f', true, false, true, 'range', array['Technician', 'Truck', 'Equipment'], array['proving', 'execution']),
  ('SAMPLE_PICKUP', 'Sample Pickup', '#ffff97', true, false, false, 'point_in_time', array['Technician', 'Truck'], array['sample_logistics', 'execution']),
  ('SAMPLE_DROP_OFF', 'Sample Drop-Off', '#cdff82', true, false, false, 'point_in_time', array['Technician', 'Truck'], array['sample_logistics', 'execution']),
  ('MAINTENANCE', 'Maintenance', '#8afcc3', true, false, false, 'range', '{}'::text[], array['maintenance', 'execution']),
  ('MULTI_SERVICE', 'Multi-Service', '#90eeff', true, false, false, 'range', '{}'::text[], array['proving', 'sample_logistics', 'maintenance', 'execution'])
on conflict (job_type_key) do nothing;

alter table public.employees add column if not exists employee_first_name text not null default '';
alter table public.employees add column if not exists employee_last_name text not null default '';
alter table public.employees add column if not exists employee_name text not null default '';
alter table public.employees add column if not exists home_spl_site text not null default 'Pittsburgh';
alter table public.employees add column if not exists work_scope text not null default 'Field';
alter table public.employees add column if not exists lab_role text not null default '';
alter table public.employees add column if not exists field_role text not null default '';
alter table public.employees add column if not exists can_sample_transport boolean not null default false;
alter table public.employees add column if not exists is_active boolean not null default true;
alter table public.employees add column if not exists phone text not null default '';
alter table public.employees add column if not exists email text not null default '';
alter table public.employees add column if not exists notes text not null default '';
alter table public.employees drop constraint if exists employees_work_scope_check;
alter table public.employees add constraint employees_work_scope_check check (work_scope in ('Lab', 'Field', 'Both'));

update public.employees
set
  employee_first_name = case
    when coalesce(employee_first_name, '') <> '' then employee_first_name
    when position(',' in employee_name) > 0 then btrim(split_part(employee_name, ',', 2))
    when employee_name !~ '[[:space:]]' then employee_name
    else btrim(regexp_replace(employee_name, '[[:space:]]+[^[:space:]]+$', ''))
  end,
  employee_last_name = case
    when coalesce(employee_last_name, '') <> '' then employee_last_name
    when position(',' in employee_name) > 0 then btrim(split_part(employee_name, ',', 1))
    when employee_name !~ '[[:space:]]' then ''
    else btrim(substring(employee_name from '[^[:space:]]+$'))
  end
where coalesce(employee_name, '') <> ''
  and (coalesce(employee_first_name, '') = '' or coalesce(employee_last_name, '') = '');

update public.employees
set employee_name = btrim(coalesce(nullif(employee_first_name, ''), '') || ' ' || coalesce(nullif(employee_last_name, ''), ''))
where btrim(coalesce(employee_first_name, '') || ' ' || coalesce(employee_last_name, '')) <> ''
  and employee_name <> btrim(coalesce(nullif(employee_first_name, ''), '') || ' ' || coalesce(nullif(employee_last_name, ''), ''));

create table if not exists public.app_user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  access_role text not null default 'employee' check (access_role in ('admin', 'employee')),
  employee_id uuid references public.employees(id) on delete set null,
  is_active boolean not null default true,
  portal_enabled boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.app_user_profiles add column if not exists access_role text not null default 'employee';
alter table public.app_user_profiles add column if not exists employee_id uuid;
alter table public.app_user_profiles add column if not exists is_active boolean not null default true;
alter table public.app_user_profiles add column if not exists portal_enabled boolean not null default false;
alter table public.app_user_profiles add column if not exists notes text not null default '';
alter table public.app_user_profiles drop constraint if exists app_user_profiles_access_role_check;
alter table public.app_user_profiles add constraint app_user_profiles_access_role_check check (access_role in ('admin', 'employee'));
alter table public.app_user_profiles drop constraint if exists app_user_profiles_employee_id_fkey;
alter table public.app_user_profiles add constraint app_user_profiles_employee_id_fkey foreign key (employee_id) references public.employees(id) on delete set null;
create unique index if not exists app_user_profiles_employee_id_unique_idx on public.app_user_profiles(employee_id) where employee_id is not null;
create index if not exists app_user_profiles_access_role_idx on public.app_user_profiles(access_role);
create index if not exists app_user_profiles_employee_id_idx on public.app_user_profiles(employee_id);

create table if not exists public.app_features (
  feature_key text primary key,
  feature_scope text not null default 'field' check (feature_scope in ('lab', 'field')),
  feature_name text not null default '',
  feature_description text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.app_features add column if not exists feature_scope text not null default 'field';
alter table public.app_features add column if not exists feature_name text not null default '';
alter table public.app_features add column if not exists feature_description text not null default '';
alter table public.app_features add column if not exists sort_order integer not null default 0;
alter table public.app_features add column if not exists is_active boolean not null default true;
alter table public.app_features drop constraint if exists app_features_feature_scope_check;
alter table public.app_features add constraint app_features_feature_scope_check check (feature_scope in ('lab', 'field'));
create index if not exists app_features_scope_active_sort_idx on public.app_features(feature_scope, is_active, sort_order, feature_key);

create table if not exists public.employee_feature_grants (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.employees(id) on delete cascade,
  feature_key text not null references public.app_features(feature_key) on update cascade on delete cascade,
  is_enabled boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid,
  unique (employee_id, feature_key)
);
alter table public.employee_feature_grants add column if not exists employee_id uuid;
alter table public.employee_feature_grants add column if not exists feature_key text not null default '';
alter table public.employee_feature_grants add column if not exists is_enabled boolean not null default true;
alter table public.employee_feature_grants drop constraint if exists employee_feature_grants_employee_id_fkey;
alter table public.employee_feature_grants add constraint employee_feature_grants_employee_id_fkey foreign key (employee_id) references public.employees(id) on delete cascade;
alter table public.employee_feature_grants drop constraint if exists employee_feature_grants_feature_key_fkey;
alter table public.employee_feature_grants add constraint employee_feature_grants_feature_key_fkey foreign key (feature_key) references public.app_features(feature_key) on update cascade on delete cascade;
create unique index if not exists employee_feature_grants_employee_feature_unique_idx on public.employee_feature_grants(employee_id, feature_key);
create index if not exists employee_feature_grants_employee_id_idx on public.employee_feature_grants(employee_id);
create index if not exists employee_feature_grants_feature_key_idx on public.employee_feature_grants(feature_key);

insert into public.app_features (feature_key, feature_scope, feature_name, feature_description, sort_order, is_active)
values
  ('lab.tests.view', 'lab', 'Lab Test Visibility', 'View lab WIP work orders, test visibility, and daily scheduling context.', 10, true),
  ('lab.consumables.view', 'lab', 'Consumables Visibility', 'View lab consumable inventories, counts, orders, and activity.', 20, true),
  ('lab.consumables.change_counts', 'lab', 'Consumable Count Changes', 'Receive, start, empty, return, and adjust consumable counts.', 30, true),
  ('lab.consumables.manage_orders', 'lab', 'Consumable Order Management', 'Create, update, order, and receive consumable orders.', 40, true),
  ('field.jobs.view', 'field', 'Field Job Visibility', 'View field jobs and related client, site, resource, and dispatch details.', 110, true),
  ('field.jobs.update_status', 'field', 'Field Job Status Updates', 'Update field job assignment statuses from the technician portal.', 120, true),
  ('field.routes.view', 'field', 'Route Visibility', 'View field routes, route stops, and route-linked jobs.', 130, true),
  ('field.routes.edit', 'field', 'Route Changes', 'Update route status, route notes, and stop details from the technician portal.', 140, true),
  ('field.samples.view', 'field', 'Sample Logistics Visibility', 'View field sample logistics and lab handoff status.', 150, true),
  ('field.samples.update_status', 'field', 'Sample Status Updates', 'Update sample workflow status from the technician portal.', 160, true)
on conflict (feature_key) do update
set feature_scope = excluded.feature_scope,
    feature_name = excluded.feature_name,
    feature_description = excluded.feature_description,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

insert into public.app_user_profiles (user_id, access_role, is_active, portal_enabled, notes)
select u.id, 'admin', true, false, 'Auto-seeded existing authenticated user as admin during technician portal migration.'
from auth.users u
where not exists (select 1 from public.app_user_profiles)
on conflict (user_id) do nothing;

create or replace function public.is_app_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.is_active and p.access_role = 'admin'
      from public.app_user_profiles p
      where p.user_id = auth.uid()
    ),
    false
  );
$$;

create or replace function public.current_employee_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select (
    select p.employee_id
    from public.app_user_profiles p
    join public.employees e on e.id = p.employee_id
    where p.user_id = auth.uid()
      and p.is_active
      and p.portal_enabled
      and p.access_role = 'employee'
      and p.employee_id is not null
      and e.is_active
    limit 1
  );
$$;

create or replace function public.current_employee_work_scope()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select e.work_scope
      from public.app_user_profiles p
      join public.employees e on e.id = p.employee_id
      where p.user_id = auth.uid()
        and p.is_active
        and p.portal_enabled
        and p.access_role = 'employee'
        and e.is_active
      limit 1
    ),
    ''
  );
$$;

create or replace function public.current_employee_has_scope(scope_value text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.is_app_admin() then true
    when lower(coalesce(scope_value, '')) = 'lab' then public.current_employee_work_scope() in ('Lab', 'Both')
    when lower(coalesce(scope_value, '')) = 'field' then public.current_employee_work_scope() in ('Field', 'Both')
    else false
  end;
$$;

create or replace function public.has_employee_feature(feature_key_value text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_app_admin()
    or exists (
      select 1
      from public.app_user_profiles p
      join public.employees e on e.id = p.employee_id
      join public.employee_feature_grants g on g.employee_id = p.employee_id
      join public.app_features f on f.feature_key = g.feature_key
      where p.user_id = auth.uid()
        and p.is_active
        and p.portal_enabled
        and p.access_role = 'employee'
        and e.is_active
        and g.is_enabled
        and f.is_active
        and f.feature_key = feature_key_value
        and (
          (f.feature_scope = 'lab' and e.work_scope in ('Lab', 'Both'))
          or (f.feature_scope = 'field' and e.work_scope in ('Field', 'Both'))
        )
    );
$$;

create or replace function public.has_any_employee_feature(feature_keys text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_app_admin()
    or exists (
      select 1
      from unnest(coalesce(feature_keys, '{}'::text[])) as key(feature_key)
      where public.has_employee_feature(key.feature_key)
    );
$$;

create or replace function public.can_read_app_state_key(storage_key_value text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_app_admin()
    or (
      public.has_employee_feature('lab.tests.view')
      and storage_key_value in (
        'lab-wip-workorders',
        'lab-wip-daily-schedule',
        'lab-wip-test-definitions',
        'lab-wip-subcontract-labs'
      )
    );
$$;

revoke all on function public.is_app_admin() from public;
revoke all on function public.current_employee_id() from public;
revoke all on function public.current_employee_work_scope() from public;
revoke all on function public.current_employee_has_scope(text) from public;
revoke all on function public.has_employee_feature(text) from public;
revoke all on function public.has_any_employee_feature(text[]) from public;
revoke all on function public.can_read_app_state_key(text) from public;
grant execute on function public.is_app_admin() to authenticated;
grant execute on function public.current_employee_id() to authenticated;
grant execute on function public.current_employee_work_scope() to authenticated;
grant execute on function public.current_employee_has_scope(text) to authenticated;
grant execute on function public.has_employee_feature(text) to authenticated;
grant execute on function public.has_any_employee_feature(text[]) to authenticated;
grant execute on function public.can_read_app_state_key(text) to authenticated;

create table if not exists public.field_spl_sites (
  id uuid primary key default gen_random_uuid(),
  site_name text not null default '',
  site_code text not null default '',
  location_label text not null default '',
  street_address text not null default '',
  city text not null default '',
  state text not null default '',
  zip_code text not null default '',
  is_active boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.field_spl_sites add column if not exists site_name text not null default '';
alter table public.field_spl_sites add column if not exists site_code text not null default '';
alter table public.field_spl_sites add column if not exists location_label text not null default '';
alter table public.field_spl_sites add column if not exists street_address text not null default '';
alter table public.field_spl_sites add column if not exists city text not null default '';
alter table public.field_spl_sites add column if not exists state text not null default '';
alter table public.field_spl_sites add column if not exists zip_code text not null default '';
alter table public.field_spl_sites add column if not exists is_active boolean not null default true;
alter table public.field_spl_sites add column if not exists notes text not null default '';
update public.field_spl_sites
set site_code = upper(btrim(site_code))
where coalesce(site_code, '') <> '';
create unique index if not exists field_spl_sites_site_code_lower_unique_idx on public.field_spl_sites(lower(site_code)) where btrim(site_code) <> '';

insert into public.field_spl_sites (site_name, site_code, location_label, is_active, notes)
values ('SPL Pittsburgh', 'PITTSBURGH', 'SPL Pittsburgh', true, 'Default internal SPL site for Field Ops travel scheduling.')
on conflict do nothing;

create table if not exists public.field_technician_travel (
  id uuid primary key default gen_random_uuid(),
  technician_id uuid not null references public.employees(id) on delete cascade,
  direction text not null default 'Outbound' check (direction in ('Inbound', 'Outbound')),
  travel_status text not null default 'Planned' check (travel_status in ('Planned', 'In Transit', 'On Site', 'Complete', 'Canceled')),
  origin_type text not null default 'spl_site' check (origin_type in ('spl_site', 'client_site', 'other')),
  origin_spl_site_id uuid references public.field_spl_sites(id),
  origin_client_site_id uuid references public.field_sites(id),
  origin_label text not null default '',
  origin_location text not null default '',
  destination_type text not null default 'client_site' check (destination_type in ('spl_site', 'client_site', 'other')),
  destination_spl_site_id uuid references public.field_spl_sites(id),
  destination_client_site_id uuid references public.field_sites(id),
  destination_label text not null default '',
  destination_location text not null default '',
  arrival_at timestamptz not null,
  departure_at timestamptz not null,
  purpose text not null default '',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.field_technician_travel add column if not exists technician_id uuid;
alter table public.field_technician_travel add column if not exists direction text not null default 'Outbound';
alter table public.field_technician_travel add column if not exists travel_status text not null default 'Planned';
alter table public.field_technician_travel add column if not exists origin_type text not null default 'spl_site';
alter table public.field_technician_travel add column if not exists origin_spl_site_id uuid;
alter table public.field_technician_travel add column if not exists origin_client_site_id uuid;
alter table public.field_technician_travel add column if not exists origin_label text not null default '';
alter table public.field_technician_travel add column if not exists origin_location text not null default '';
alter table public.field_technician_travel add column if not exists destination_type text not null default 'client_site';
alter table public.field_technician_travel add column if not exists destination_spl_site_id uuid;
alter table public.field_technician_travel add column if not exists destination_client_site_id uuid;
alter table public.field_technician_travel add column if not exists destination_label text not null default '';
alter table public.field_technician_travel add column if not exists destination_location text not null default '';
alter table public.field_technician_travel add column if not exists arrival_at timestamptz;
alter table public.field_technician_travel add column if not exists departure_at timestamptz;
alter table public.field_technician_travel add column if not exists purpose text not null default '';
alter table public.field_technician_travel add column if not exists notes text not null default '';
alter table public.field_technician_travel drop constraint if exists field_technician_travel_technician_id_fkey;
alter table public.field_technician_travel add constraint field_technician_travel_technician_id_fkey foreign key (technician_id) references public.employees(id) on delete cascade;
alter table public.field_technician_travel drop constraint if exists field_technician_travel_origin_spl_site_id_fkey;
alter table public.field_technician_travel add constraint field_technician_travel_origin_spl_site_id_fkey foreign key (origin_spl_site_id) references public.field_spl_sites(id);
alter table public.field_technician_travel drop constraint if exists field_technician_travel_origin_client_site_id_fkey;
alter table public.field_technician_travel add constraint field_technician_travel_origin_client_site_id_fkey foreign key (origin_client_site_id) references public.field_sites(id);
alter table public.field_technician_travel drop constraint if exists field_technician_travel_destination_spl_site_id_fkey;
alter table public.field_technician_travel add constraint field_technician_travel_destination_spl_site_id_fkey foreign key (destination_spl_site_id) references public.field_spl_sites(id);
alter table public.field_technician_travel drop constraint if exists field_technician_travel_destination_client_site_id_fkey;
alter table public.field_technician_travel add constraint field_technician_travel_destination_client_site_id_fkey foreign key (destination_client_site_id) references public.field_sites(id);
alter table public.field_technician_travel drop constraint if exists field_technician_travel_direction_check;
alter table public.field_technician_travel add constraint field_technician_travel_direction_check check (direction in ('Inbound', 'Outbound'));
alter table public.field_technician_travel drop constraint if exists field_technician_travel_travel_status_check;
alter table public.field_technician_travel add constraint field_technician_travel_travel_status_check check (travel_status in ('Planned', 'In Transit', 'On Site', 'Complete', 'Canceled'));
alter table public.field_technician_travel drop constraint if exists field_technician_travel_origin_type_check;
alter table public.field_technician_travel add constraint field_technician_travel_origin_type_check check (origin_type in ('spl_site', 'client_site', 'other'));
alter table public.field_technician_travel drop constraint if exists field_technician_travel_destination_type_check;
alter table public.field_technician_travel add constraint field_technician_travel_destination_type_check check (destination_type in ('spl_site', 'client_site', 'other'));
alter table public.field_technician_travel drop constraint if exists field_technician_travel_time_order_check;
alter table public.field_technician_travel add constraint field_technician_travel_time_order_check check (departure_at > arrival_at);
alter table public.field_technician_travel drop constraint if exists field_technician_travel_direction_location_check;
alter table public.field_technician_travel add constraint field_technician_travel_direction_location_check check (
  (direction = 'Inbound' and destination_type = 'spl_site')
  or (direction = 'Outbound' and origin_type = 'spl_site')
);
alter table public.field_technician_travel drop constraint if exists field_technician_travel_origin_target_check;
alter table public.field_technician_travel add constraint field_technician_travel_origin_target_check check (
  (origin_type = 'spl_site' and origin_spl_site_id is not null and origin_client_site_id is null)
  or (origin_type = 'client_site' and origin_client_site_id is not null and origin_spl_site_id is null)
  or (origin_type = 'other' and origin_spl_site_id is null and origin_client_site_id is null and btrim(origin_label) <> '')
);
alter table public.field_technician_travel drop constraint if exists field_technician_travel_destination_target_check;
alter table public.field_technician_travel add constraint field_technician_travel_destination_target_check check (
  (destination_type = 'spl_site' and destination_spl_site_id is not null and destination_client_site_id is null)
  or (destination_type = 'client_site' and destination_client_site_id is not null and destination_spl_site_id is null)
  or (destination_type = 'other' and destination_spl_site_id is null and destination_client_site_id is null and btrim(destination_label) <> '')
);

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
  employee_first_name,
  employee_last_name,
  employee_name,
  home_spl_site,
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
  case
    when position(',' in ft.employee_name) > 0 then btrim(split_part(ft.employee_name, ',', 2))
    when ft.employee_name !~ '[[:space:]]' then ft.employee_name
    else btrim(regexp_replace(ft.employee_name, '[[:space:]]+[^[:space:]]+$', ''))
  end,
  case
    when position(',' in ft.employee_name) > 0 then btrim(split_part(ft.employee_name, ',', 1))
    when ft.employee_name !~ '[[:space:]]' then ''
    else btrim(substring(ft.employee_name from '[^[:space:]]+$'))
  end,
  ft.employee_name,
  'Pittsburgh',
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
  fuel_type text not null default '',
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
  next_inspection_due date,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.field_trucks add column if not exists photo_path text;
alter table public.field_trucks add column if not exists fuel_type text not null default '';
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
alter table public.field_trucks add column if not exists next_inspection_due date;
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
  sample_date date,
  sample_time text not null default '',
  is_duplicate boolean not null default false,
  sample_collection_mode text not null default '' check (sample_collection_mode in ('', 'Composite', 'Spot')),
  cylinder_number text not null default '',
  sample_temp_f numeric,
  sample_pressure_psig numeric,
  priority_tat text not null default '',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.field_samples add column if not exists sample_status text not null default 'Needs Pulled';
alter table public.field_samples add column if not exists sample_name text not null default '';
alter table public.field_samples add column if not exists sample_point text not null default '';
alter table public.field_samples add column if not exists sample_date date;
alter table public.field_samples add column if not exists sample_time text not null default '';
alter table public.field_samples add column if not exists is_duplicate boolean not null default false;
alter table public.field_samples add column if not exists sample_collection_mode text not null default '';
alter table public.field_samples add column if not exists cylinder_number text not null default '';
alter table public.field_samples add column if not exists test_codes text[] not null default array[]::text[];
alter table public.field_samples add column if not exists sample_temp_f numeric;
alter table public.field_samples add column if not exists sample_pressure_psig numeric;
alter table public.field_samples add column if not exists linked_work_order_id text not null default '';
alter table public.field_samples add column if not exists linked_work_order_number text not null default '';
alter table public.field_samples add column if not exists lab_received_at timestamptz;
alter table public.field_samples add column if not exists sample_sequence integer;
alter table public.field_samples drop constraint if exists field_samples_sample_collection_mode_check;
alter table public.field_samples add constraint field_samples_sample_collection_mode_check check (sample_collection_mode in ('', 'Composite', 'Spot'));
update public.field_samples
set
  sample_date = coalesce(sample_date, collection_date_time::date),
  sample_time = coalesce(nullif(sample_time, ''), to_char(collection_date_time, 'HH24:MI'))
where collection_date_time is not null
  and (sample_date is null or coalesce(sample_time, '') = '');
alter table public.field_samples drop constraint if exists field_samples_sample_status_check;
alter table public.field_samples add constraint field_samples_sample_status_check check (sample_status in ('Needs Pulled', 'Received by Lab'));
alter table public.field_samples drop constraint if exists field_samples_sample_type_check;
alter table public.field_samples add constraint field_samples_sample_type_check check (sample_type in ('Gas', 'Liquid', 'Condensate', 'Other'));
update public.field_samples
set sample_status = case
  when lab_receipt_status in ('Delivered', 'Logged In', 'Complete') or chain_of_custody_status in ('Delivered', 'Logged In', 'Complete') then 'Received by Lab'
  else 'Needs Pulled'
end
where coalesce(sample_status, '') = '';
update public.field_samples
set sample_status = 'Received by Lab'
where sample_status = 'Needs Pulled'
  and (lab_receipt_status in ('Delivered', 'Logged In', 'Complete') or chain_of_custody_status in ('Delivered', 'Logged In', 'Complete'));

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

create table if not exists public.field_parts (
  id uuid primary key default gen_random_uuid(),
  part_key text not null default '',
  part_number text not null default '',
  part_name text not null default '',
  category text not null default '',
  vendor_name text not null default '',
  vendor_part_number text not null default '',
  unit_cost numeric(12,2),
  unit_name text not null default 'Each',
  storage_location text not null default '',
  on_hand_quantity integer not null default 0 check (on_hand_quantity >= 0),
  reorder_point integer not null default 0 check (reorder_point >= 0),
  is_active boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.field_parts add column if not exists part_key text not null default '';
alter table public.field_parts add column if not exists part_number text not null default '';
alter table public.field_parts add column if not exists part_name text not null default '';
alter table public.field_parts add column if not exists category text not null default '';
alter table public.field_parts add column if not exists vendor_name text not null default '';
alter table public.field_parts add column if not exists vendor_part_number text not null default '';
alter table public.field_parts add column if not exists unit_cost numeric(12,2);
alter table public.field_parts add column if not exists unit_name text not null default 'Each';
alter table public.field_parts add column if not exists storage_location text not null default '';
alter table public.field_parts add column if not exists on_hand_quantity integer not null default 0;
alter table public.field_parts add column if not exists reorder_point integer not null default 0;
alter table public.field_parts add column if not exists is_active boolean not null default true;
alter table public.field_parts add column if not exists notes text not null default '';
update public.field_parts
set part_key = coalesce(nullif(public.field_ops_catalog_key(part_key), ''), public.field_ops_catalog_key(coalesce(nullif(part_number, ''), part_name)))
where coalesce(part_key, '') = '' or part_key <> public.field_ops_catalog_key(part_key);
alter table public.field_parts drop constraint if exists field_parts_on_hand_quantity_check;
alter table public.field_parts add constraint field_parts_on_hand_quantity_check check (on_hand_quantity >= 0);
alter table public.field_parts drop constraint if exists field_parts_reorder_point_check;
alter table public.field_parts add constraint field_parts_reorder_point_check check (reorder_point >= 0);
create unique index if not exists field_parts_part_key_active_unique_idx on public.field_parts(lower(part_key)) where is_active and btrim(part_key) <> '';
create unique index if not exists field_parts_part_number_active_unique_idx on public.field_parts(lower(part_number)) where is_active and btrim(part_number) <> '';
create index if not exists field_parts_is_active_idx on public.field_parts(is_active);
create index if not exists field_parts_low_stock_idx on public.field_parts(is_active, on_hand_quantity, reorder_point);
create index if not exists field_parts_category_idx on public.field_parts(category);

create table if not exists public.field_job_parts (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.field_jobs(id) on delete cascade,
  part_id uuid not null references public.field_parts(id) on delete restrict,
  quantity integer not null default 1 check (quantity > 0),
  part_key_snapshot text not null default '',
  part_number_snapshot text not null default '',
  part_name_snapshot text not null default '',
  unit_cost_snapshot numeric(12,2),
  unit_name_snapshot text not null default 'Each',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid,
  unique (job_id, part_id)
);
alter table public.field_job_parts add column if not exists job_id uuid;
alter table public.field_job_parts add column if not exists part_id uuid;
alter table public.field_job_parts add column if not exists quantity integer not null default 1;
alter table public.field_job_parts add column if not exists part_key_snapshot text not null default '';
alter table public.field_job_parts add column if not exists part_number_snapshot text not null default '';
alter table public.field_job_parts add column if not exists part_name_snapshot text not null default '';
alter table public.field_job_parts add column if not exists unit_cost_snapshot numeric(12,2);
alter table public.field_job_parts add column if not exists unit_name_snapshot text not null default 'Each';
alter table public.field_job_parts add column if not exists notes text not null default '';
alter table public.field_job_parts drop constraint if exists field_job_parts_job_id_fkey;
alter table public.field_job_parts add constraint field_job_parts_job_id_fkey foreign key (job_id) references public.field_jobs(id) on delete cascade;
alter table public.field_job_parts drop constraint if exists field_job_parts_part_id_fkey;
alter table public.field_job_parts add constraint field_job_parts_part_id_fkey foreign key (part_id) references public.field_parts(id) on delete restrict;
alter table public.field_job_parts drop constraint if exists field_job_parts_quantity_check;
alter table public.field_job_parts add constraint field_job_parts_quantity_check check (quantity > 0);
create unique index if not exists field_job_parts_job_part_unique_idx on public.field_job_parts(job_id, part_id);
create index if not exists field_job_parts_job_id_idx on public.field_job_parts(job_id);
create index if not exists field_job_parts_part_id_idx on public.field_job_parts(part_id);

create table if not exists public.field_part_activity (
  id uuid primary key default gen_random_uuid(),
  part_id uuid not null references public.field_parts(id) on delete cascade,
  job_id uuid,
  job_part_id uuid,
  activity_type text not null default '',
  quantity_delta integer not null default 0,
  quantity_before integer not null default 0,
  quantity_after integer not null default 0,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.field_part_activity add column if not exists part_id uuid;
alter table public.field_part_activity add column if not exists job_id uuid;
alter table public.field_part_activity add column if not exists job_part_id uuid;
alter table public.field_part_activity add column if not exists activity_type text not null default '';
alter table public.field_part_activity add column if not exists quantity_delta integer not null default 0;
alter table public.field_part_activity add column if not exists quantity_before integer not null default 0;
alter table public.field_part_activity add column if not exists quantity_after integer not null default 0;
alter table public.field_part_activity add column if not exists notes text not null default '';
alter table public.field_part_activity drop constraint if exists field_part_activity_part_id_fkey;
alter table public.field_part_activity add constraint field_part_activity_part_id_fkey foreign key (part_id) references public.field_parts(id) on delete cascade;
alter table public.field_part_activity drop constraint if exists field_part_activity_job_id_fkey;
alter table public.field_part_activity drop constraint if exists field_part_activity_job_part_id_fkey;
create index if not exists field_part_activity_part_id_idx on public.field_part_activity(part_id);
create index if not exists field_part_activity_job_id_idx on public.field_part_activity(job_id);
create index if not exists field_part_activity_created_at_idx on public.field_part_activity(created_at desc);

create or replace function public.log_field_part_activity(
  part_id_value uuid,
  job_id_value uuid,
  job_part_id_value uuid,
  activity_type_value text,
  quantity_delta_value integer,
  quantity_before_value integer,
  quantity_after_value integer,
  notes_value text
)
returns void
language plpgsql
as $$
begin
  insert into public.field_part_activity (
    part_id,
    job_id,
    job_part_id,
    activity_type,
    quantity_delta,
    quantity_before,
    quantity_after,
    notes
  )
  values (
    part_id_value,
    job_id_value,
    job_part_id_value,
    activity_type_value,
    quantity_delta_value,
    quantity_before_value,
    quantity_after_value,
    coalesce(notes_value, '')
  );
end;
$$;

create or replace function public.apply_field_job_part_stock()
returns trigger
language plpgsql
as $$
declare
  part_record public.field_parts%rowtype;
  old_part_record public.field_parts%rowtype;
  quantity_delta integer;
  quantity_before integer;
  quantity_after integer;
  activity_label text;
begin
  if tg_op = 'INSERT' then
    select * into part_record
    from public.field_parts
    where id = new.part_id
    for update;

    if part_record.id is null then
      raise exception 'Field part was not found.';
    end if;

    quantity_delta = -new.quantity;
    quantity_before = part_record.on_hand_quantity;
    quantity_after = quantity_before + quantity_delta;

    if quantity_after < 0 then
      raise exception 'Insufficient inventory for %. Available: %, requested: %.', coalesce(part_record.part_name, 'field part'), quantity_before, new.quantity;
    end if;

    update public.field_parts
    set on_hand_quantity = quantity_after
    where id = new.part_id;

    new.part_key_snapshot = coalesce(nullif(new.part_key_snapshot, ''), part_record.part_key);
    new.part_number_snapshot = coalesce(nullif(new.part_number_snapshot, ''), part_record.part_number);
    new.part_name_snapshot = coalesce(nullif(new.part_name_snapshot, ''), part_record.part_name);
    new.unit_cost_snapshot = coalesce(new.unit_cost_snapshot, part_record.unit_cost);
    new.unit_name_snapshot = coalesce(nullif(new.unit_name_snapshot, ''), part_record.unit_name, 'Each');

    perform public.log_field_part_activity(new.part_id, new.job_id, null, 'job_part_added', quantity_delta, quantity_before, quantity_after, new.notes);
    return new;
  end if;

  if tg_op = 'UPDATE' then
    if old.part_id is distinct from new.part_id then
      select * into old_part_record
      from public.field_parts
      where id = old.part_id
      for update;

      if old_part_record.id is not null then
        quantity_before = old_part_record.on_hand_quantity;
        quantity_after = quantity_before + old.quantity;
        update public.field_parts
        set on_hand_quantity = quantity_after
        where id = old.part_id;
        perform public.log_field_part_activity(old.part_id, old.job_id, old.id, 'job_part_removed', old.quantity, quantity_before, quantity_after, old.notes);
      end if;

      select * into part_record
      from public.field_parts
      where id = new.part_id
      for update;

      if part_record.id is null then
        raise exception 'Field part was not found.';
      end if;

      quantity_delta = -new.quantity;
      quantity_before = part_record.on_hand_quantity;
      quantity_after = quantity_before + quantity_delta;

      if quantity_after < 0 then
        raise exception 'Insufficient inventory for %. Available: %, requested: %.', coalesce(part_record.part_name, 'field part'), quantity_before, new.quantity;
      end if;

      update public.field_parts
      set on_hand_quantity = quantity_after
      where id = new.part_id;

      new.part_key_snapshot = coalesce(nullif(new.part_key_snapshot, ''), part_record.part_key);
      new.part_number_snapshot = coalesce(nullif(new.part_number_snapshot, ''), part_record.part_number);
      new.part_name_snapshot = coalesce(nullif(new.part_name_snapshot, ''), part_record.part_name);
      new.unit_cost_snapshot = coalesce(new.unit_cost_snapshot, part_record.unit_cost);
      new.unit_name_snapshot = coalesce(nullif(new.unit_name_snapshot, ''), part_record.unit_name, 'Each');

      perform public.log_field_part_activity(new.part_id, new.job_id, new.id, 'job_part_added', quantity_delta, quantity_before, quantity_after, new.notes);
      return new;
    end if;

    select * into part_record
    from public.field_parts
    where id = new.part_id
    for update;

    if part_record.id is null then
      raise exception 'Field part was not found.';
    end if;

    quantity_delta = old.quantity - new.quantity;
    quantity_before = part_record.on_hand_quantity;
    quantity_after = quantity_before + quantity_delta;

    if quantity_after < 0 then
      raise exception 'Insufficient inventory for %. Available: %, additional requested: %.', coalesce(part_record.part_name, 'field part'), quantity_before, abs(quantity_delta);
    end if;

    if quantity_delta <> 0 then
      update public.field_parts
      set on_hand_quantity = quantity_after
      where id = new.part_id;

      activity_label = case
        when quantity_delta < 0 then 'job_part_increased'
        else 'job_part_decreased'
      end;

      perform public.log_field_part_activity(new.part_id, new.job_id, new.id, activity_label, quantity_delta, quantity_before, quantity_after, new.notes);
    end if;

    new.part_key_snapshot = coalesce(nullif(new.part_key_snapshot, ''), part_record.part_key);
    new.part_number_snapshot = coalesce(nullif(new.part_number_snapshot, ''), part_record.part_number);
    new.part_name_snapshot = coalesce(nullif(new.part_name_snapshot, ''), part_record.part_name);
    new.unit_cost_snapshot = coalesce(new.unit_cost_snapshot, part_record.unit_cost);
    new.unit_name_snapshot = coalesce(nullif(new.unit_name_snapshot, ''), part_record.unit_name, 'Each');

    return new;
  end if;

  if tg_op = 'DELETE' then
    select * into part_record
    from public.field_parts
    where id = old.part_id
    for update;

    if part_record.id is not null then
      quantity_before = part_record.on_hand_quantity;
      quantity_after = quantity_before + old.quantity;
      update public.field_parts
      set on_hand_quantity = quantity_after
      where id = old.part_id;
      perform public.log_field_part_activity(old.part_id, old.job_id, old.id, 'job_part_removed', old.quantity, quantity_before, quantity_after, old.notes);
    end if;

    return old;
  end if;

  return null;
end;
$$;

drop trigger if exists field_job_parts_stock_sync on public.field_job_parts;
create trigger field_job_parts_stock_sync
before insert or update or delete on public.field_job_parts
for each row
execute function public.apply_field_job_part_stock();

create or replace function public.save_field_job_parts(target_job_id uuid, part_rows jsonb)
returns integer
language plpgsql
as $$
declare
  saved_count integer;
begin
  if target_job_id is null then
    raise exception 'Job id is required.';
  end if;

  if not exists (select 1 from public.field_jobs where id = target_job_id) then
    raise exception 'Field job was not found.';
  end if;

  if part_rows is null then
    part_rows = '[]'::jsonb;
  end if;

  if jsonb_typeof(part_rows) <> 'array' then
    raise exception 'Part rows must be a JSON array.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(part_rows) as row(part_id uuid, quantity integer, notes text)
    where row.part_id is null or coalesce(row.quantity, 0) <= 0
  ) then
    raise exception 'Each job part requires a part id and a quantity greater than zero.';
  end if;

  if exists (
    select 1
    from (
      select part_id
      from jsonb_to_recordset(part_rows) as row(part_id uuid, quantity integer, notes text)
      group by part_id
      having count(*) > 1
    ) duplicates
  ) then
    raise exception 'A part can only appear once on a job.';
  end if;

  delete from public.field_job_parts existing
  where existing.job_id = target_job_id
    and not exists (
      select 1
      from jsonb_to_recordset(part_rows) as row(part_id uuid, quantity integer, notes text)
      where row.part_id = existing.part_id
    );

  update public.field_job_parts existing
  set quantity = row.quantity,
      notes = coalesce(row.notes, '')
  from jsonb_to_recordset(part_rows) as row(part_id uuid, quantity integer, notes text)
  where existing.job_id = target_job_id
    and existing.part_id = row.part_id;

  insert into public.field_job_parts (job_id, part_id, quantity, notes)
  select target_job_id, row.part_id, row.quantity, coalesce(row.notes, '')
  from jsonb_to_recordset(part_rows) as row(part_id uuid, quantity integer, notes text)
  where not exists (
    select 1
    from public.field_job_parts existing
    where existing.job_id = target_job_id
      and existing.part_id = row.part_id
  );

  select count(*)
  into saved_count
  from public.field_job_parts
  where job_id = target_job_id;

  return saved_count;
end;
$$;

create or replace function public.adjust_field_part_stock(
  target_part_id uuid,
  quantity_delta integer,
  activity_type text,
  notes text
)
returns integer
language plpgsql
as $$
declare
  part_record public.field_parts%rowtype;
  quantity_before integer;
  quantity_after integer;
begin
  if target_part_id is null then
    raise exception 'Part id is required.';
  end if;

  if quantity_delta is null or quantity_delta = 0 then
    raise exception 'Quantity delta must be non-zero.';
  end if;

  select * into part_record
  from public.field_parts
  where id = target_part_id
  for update;

  if part_record.id is null then
    raise exception 'Field part was not found.';
  end if;

  quantity_before = part_record.on_hand_quantity;
  quantity_after = quantity_before + quantity_delta;

  if quantity_after < 0 then
    raise exception 'Inventory cannot be adjusted below zero. Available: %, requested adjustment: %.', quantity_before, quantity_delta;
  end if;

  update public.field_parts
  set on_hand_quantity = quantity_after
  where id = target_part_id;

  perform public.log_field_part_activity(
    target_part_id,
    null,
    null,
    coalesce(nullif(activity_type, ''), case when quantity_delta > 0 then 'stock_received' else 'stock_adjusted' end),
    quantity_delta,
    quantity_before,
    quantity_after,
    notes
  );

  return quantity_after;
end;
$$;

revoke all on function public.save_field_job_parts(uuid, jsonb) from public;
grant execute on function public.save_field_job_parts(uuid, jsonb) to authenticated;
revoke all on function public.adjust_field_part_stock(uuid, integer, text, text) from public;
grant execute on function public.adjust_field_part_stock(uuid, integer, text, text) to authenticated;

create table if not exists public.consumable_items (
  id uuid primary key default gen_random_uuid(),
  item_key text not null default '',
  item_name text not null default '',
  category text not null default 'Gas Supply',
  vendor_name text not null default 'AirGas',
  vendor_part_number text not null default '',
  cylinder_size text not null default '',
  unit_name text not null default 'Cylinder',
  reorder_point integer not null default 2 check (reorder_point >= 0),
  gas_symbol text not null default '',
  gas_formula text not null default '',
  gas_code text not null default '',
  gas_subtitle text not null default '',
  is_active boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.consumable_items add column if not exists item_key text not null default '';
alter table public.consumable_items add column if not exists item_name text not null default '';
alter table public.consumable_items add column if not exists category text not null default 'Gas Supply';
alter table public.consumable_items add column if not exists vendor_name text not null default 'AirGas';
alter table public.consumable_items add column if not exists vendor_part_number text not null default '';
alter table public.consumable_items add column if not exists cylinder_size text not null default '';
alter table public.consumable_items add column if not exists unit_name text not null default 'Cylinder';
alter table public.consumable_items add column if not exists reorder_point integer not null default 2;
alter table public.consumable_items add column if not exists gas_symbol text not null default '';
alter table public.consumable_items add column if not exists gas_formula text not null default '';
alter table public.consumable_items add column if not exists gas_code text not null default '';
alter table public.consumable_items add column if not exists gas_subtitle text not null default '';
alter table public.consumable_items add column if not exists is_active boolean not null default true;
alter table public.consumable_items add column if not exists notes text not null default '';
update public.consumable_items
set category = 'Gas Supply'
where coalesce(btrim(category), '') = '';
alter table public.consumable_items drop constraint if exists consumable_items_reorder_point_check;
alter table public.consumable_items add constraint consumable_items_reorder_point_check check (reorder_point >= 0);
create index if not exists consumable_items_category_idx on public.consumable_items(category);
create unique index if not exists consumable_items_item_key_unique_idx on public.consumable_items(item_key);
create unique index if not exists consumable_items_item_key_lower_unique_idx on public.consumable_items(lower(item_key));

create table if not exists public.consumable_stock_counts (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.consumable_items(id) on delete cascade,
  new_count integer not null default 0 check (new_count >= 0),
  in_use_count integer not null default 0 check (in_use_count >= 0),
  empty_count integer not null default 0 check (empty_count >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid,
  unique (item_id)
);
alter table public.consumable_stock_counts add column if not exists item_id uuid;
alter table public.consumable_stock_counts add column if not exists new_count integer not null default 0;
alter table public.consumable_stock_counts add column if not exists in_use_count integer not null default 0;
alter table public.consumable_stock_counts add column if not exists empty_count integer not null default 0;
alter table public.consumable_stock_counts drop constraint if exists consumable_stock_counts_item_id_fkey;
alter table public.consumable_stock_counts add constraint consumable_stock_counts_item_id_fkey foreign key (item_id) references public.consumable_items(id) on delete cascade;
alter table public.consumable_stock_counts drop constraint if exists consumable_stock_counts_new_count_check;
alter table public.consumable_stock_counts add constraint consumable_stock_counts_new_count_check check (new_count >= 0);
alter table public.consumable_stock_counts drop constraint if exists consumable_stock_counts_in_use_count_check;
alter table public.consumable_stock_counts add constraint consumable_stock_counts_in_use_count_check check (in_use_count >= 0);
alter table public.consumable_stock_counts drop constraint if exists consumable_stock_counts_empty_count_check;
alter table public.consumable_stock_counts add constraint consumable_stock_counts_empty_count_check check (empty_count >= 0);
create unique index if not exists consumable_stock_counts_item_id_unique_idx on public.consumable_stock_counts(item_id);

create table if not exists public.consumable_orders (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.consumable_items(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  order_status text not null default 'Needed' check (order_status in ('Needed', 'Ordered', 'Received', 'Canceled')),
  ordered_on date,
  received_on date,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.consumable_orders add column if not exists item_id uuid;
alter table public.consumable_orders add column if not exists quantity integer not null default 1;
alter table public.consumable_orders add column if not exists order_status text not null default 'Needed';
alter table public.consumable_orders add column if not exists ordered_on date;
alter table public.consumable_orders add column if not exists received_on date;
alter table public.consumable_orders add column if not exists notes text not null default '';
alter table public.consumable_orders drop constraint if exists consumable_orders_item_id_fkey;
alter table public.consumable_orders add constraint consumable_orders_item_id_fkey foreign key (item_id) references public.consumable_items(id) on delete cascade;
alter table public.consumable_orders drop constraint if exists consumable_orders_quantity_check;
alter table public.consumable_orders add constraint consumable_orders_quantity_check check (quantity > 0);
alter table public.consumable_orders drop constraint if exists consumable_orders_order_status_check;
alter table public.consumable_orders add constraint consumable_orders_order_status_check check (order_status in ('Needed', 'Ordered', 'Received', 'Canceled'));
create index if not exists consumable_orders_item_id_idx on public.consumable_orders(item_id);
create index if not exists consumable_orders_status_idx on public.consumable_orders(order_status);

create table if not exists public.consumable_activity (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.consumable_items(id) on delete cascade,
  order_id uuid references public.consumable_orders(id) on delete set null,
  activity_type text not null default '',
  quantity_delta integer not null default 0,
  new_before integer not null default 0,
  new_after integer not null default 0,
  in_use_before integer not null default 0,
  in_use_after integer not null default 0,
  empty_before integer not null default 0,
  empty_after integer not null default 0,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.consumable_activity add column if not exists item_id uuid;
alter table public.consumable_activity add column if not exists order_id uuid;
alter table public.consumable_activity add column if not exists activity_type text not null default '';
alter table public.consumable_activity add column if not exists quantity_delta integer not null default 0;
alter table public.consumable_activity add column if not exists new_before integer not null default 0;
alter table public.consumable_activity add column if not exists new_after integer not null default 0;
alter table public.consumable_activity add column if not exists in_use_before integer not null default 0;
alter table public.consumable_activity add column if not exists in_use_after integer not null default 0;
alter table public.consumable_activity add column if not exists empty_before integer not null default 0;
alter table public.consumable_activity add column if not exists empty_after integer not null default 0;
alter table public.consumable_activity add column if not exists notes text not null default '';
alter table public.consumable_activity drop constraint if exists consumable_activity_item_id_fkey;
alter table public.consumable_activity add constraint consumable_activity_item_id_fkey foreign key (item_id) references public.consumable_items(id) on delete cascade;
alter table public.consumable_activity drop constraint if exists consumable_activity_order_id_fkey;
alter table public.consumable_activity add constraint consumable_activity_order_id_fkey foreign key (order_id) references public.consumable_orders(id) on delete set null;
create index if not exists consumable_activity_item_id_idx on public.consumable_activity(item_id);
create index if not exists consumable_activity_created_at_idx on public.consumable_activity(created_at desc);

insert into public.consumable_items (item_key, item_name, category, vendor_name, unit_name, reorder_point, gas_symbol, gas_formula, gas_code, gas_subtitle, is_active)
values
  ('HELIUM', 'Helium', 'Gas Supply', 'AirGas', 'Cylinder', 2, 'He', 'He', 'HE', 'Helium', true),
  ('ARGON', 'Argon', 'Gas Supply', 'AirGas', 'Cylinder', 2, 'Ar', 'Ar', 'AR', 'Argon', true),
  ('AIR', 'Air', 'Gas Supply', 'AirGas', 'Cylinder', 2, 'Air', 'Air', 'AI', 'Compressed', true),
  ('HYDROGEN', 'Hydrogen', 'Gas Supply', 'AirGas', 'Cylinder', 2, 'H2', 'H<sub>2</sub>', 'HY', 'Hydrogen', true),
  ('NITROGEN', 'Nitrogen', 'Gas Supply', 'AirGas', 'Cylinder', 2, 'N2', 'N<sub>2</sub>', 'NI', 'Nitrogen', true)
on conflict (item_key) do update
set gas_symbol = excluded.gas_symbol,
    gas_formula = excluded.gas_formula,
    gas_code = excluded.gas_code,
    gas_subtitle = excluded.gas_subtitle;

insert into public.consumable_stock_counts (item_id, new_count, in_use_count, empty_count)
select i.id, 0, 0, 0
from public.consumable_items i
where not exists (
  select 1
  from public.consumable_stock_counts c
  where c.item_id = i.id
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
create unique index if not exists field_job_sites_job_site_unique_idx on public.field_job_sites(job_id, site_id);
create index if not exists field_job_sites_job_id_idx on public.field_job_sites(job_id);
create index if not exists field_job_sites_site_id_idx on public.field_job_sites(site_id);
create index if not exists field_job_sites_job_sort_idx on public.field_job_sites(job_id, sort_order);
create index if not exists field_jobs_salesforce_case_id_idx on public.field_jobs(salesforce_case_id) where btrim(salesforce_case_id) <> '';
create unique index if not exists field_job_assignments_unique_resource_per_job_idx on public.field_job_assignments(job_id, assignment_type, resource_id);
create unique index if not exists field_job_types_job_type_key_lower_unique_idx on public.field_job_types (lower(job_type_key));
drop index if exists public.field_job_types_sort_order_idx;

create table if not exists public.field_routes (
  id uuid primary key default gen_random_uuid(),
  route_name text not null default '',
  route_date date not null,
  route_status text not null default 'Draft' check (route_status in ('Draft', 'Planned', 'Assigned', 'Complete', 'Archived')),
  assigned_technician_id uuid references public.employees(id) on delete set null,
  origin_type text not null default 'spl' check (origin_type in ('spl', 'site', 'address', 'gps')),
  origin_site_id uuid references public.field_sites(id) on delete set null,
  origin_label text not null default 'SPL Pittsburgh',
  origin_value text not null default '',
  origin_latitude numeric,
  origin_longitude numeric,
  destination_type text not null default 'spl' check (destination_type in ('spl', 'site', 'address', 'gps')),
  destination_site_id uuid references public.field_sites(id) on delete set null,
  destination_label text not null default 'SPL Pittsburgh',
  destination_value text not null default '',
  destination_latitude numeric,
  destination_longitude numeric,
  distance_meters integer,
  duration_seconds integer,
  return_distance_meters integer,
  return_duration_seconds integer,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.field_routes add column if not exists route_name text not null default '';
alter table public.field_routes add column if not exists route_date date;
alter table public.field_routes add column if not exists route_status text not null default 'Draft';
alter table public.field_routes add column if not exists assigned_technician_id uuid;
alter table public.field_routes add column if not exists origin_type text not null default 'spl';
alter table public.field_routes add column if not exists origin_site_id uuid;
alter table public.field_routes add column if not exists origin_label text not null default 'SPL Pittsburgh';
alter table public.field_routes add column if not exists origin_value text not null default '';
alter table public.field_routes add column if not exists origin_latitude numeric;
alter table public.field_routes add column if not exists origin_longitude numeric;
alter table public.field_routes add column if not exists destination_type text not null default 'spl';
alter table public.field_routes add column if not exists destination_site_id uuid;
alter table public.field_routes add column if not exists destination_label text not null default 'SPL Pittsburgh';
alter table public.field_routes add column if not exists destination_value text not null default '';
alter table public.field_routes add column if not exists destination_latitude numeric;
alter table public.field_routes add column if not exists destination_longitude numeric;
alter table public.field_routes add column if not exists distance_meters integer;
alter table public.field_routes add column if not exists duration_seconds integer;
alter table public.field_routes add column if not exists return_distance_meters integer;
alter table public.field_routes add column if not exists return_duration_seconds integer;
alter table public.field_routes add column if not exists notes text not null default '';
update public.field_routes
set route_date = current_date
where route_date is null;
alter table public.field_routes alter column route_date set not null;
alter table public.field_routes drop constraint if exists field_routes_route_status_check;
alter table public.field_routes add constraint field_routes_route_status_check check (route_status in ('Draft', 'Planned', 'Assigned', 'Complete', 'Archived'));
alter table public.field_routes drop constraint if exists field_routes_origin_type_check;
alter table public.field_routes add constraint field_routes_origin_type_check check (origin_type in ('spl', 'site', 'address', 'gps'));
alter table public.field_routes drop constraint if exists field_routes_destination_type_check;
alter table public.field_routes add constraint field_routes_destination_type_check check (destination_type in ('spl', 'site', 'address', 'gps'));
alter table public.field_routes drop constraint if exists field_routes_assigned_technician_id_fkey;
alter table public.field_routes add constraint field_routes_assigned_technician_id_fkey foreign key (assigned_technician_id) references public.employees(id) on delete set null;
alter table public.field_routes drop constraint if exists field_routes_origin_site_id_fkey;
alter table public.field_routes add constraint field_routes_origin_site_id_fkey foreign key (origin_site_id) references public.field_sites(id) on delete set null;
alter table public.field_routes drop constraint if exists field_routes_destination_site_id_fkey;
alter table public.field_routes add constraint field_routes_destination_site_id_fkey foreign key (destination_site_id) references public.field_sites(id) on delete set null;

create table if not exists public.field_route_place_lists (
  id uuid primary key default gen_random_uuid(),
  list_name text not null default '',
  list_color text not null default '#6fe3ff',
  icon_key text not null default 'pin',
  is_active boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.field_route_place_lists add column if not exists list_name text not null default '';
alter table public.field_route_place_lists add column if not exists list_color text not null default '#6fe3ff';
alter table public.field_route_place_lists add column if not exists icon_key text not null default 'pin';
alter table public.field_route_place_lists add column if not exists is_active boolean not null default true;
alter table public.field_route_place_lists add column if not exists notes text not null default '';
create unique index if not exists field_route_place_lists_list_name_lower_unique_idx on public.field_route_place_lists(lower(list_name)) where btrim(list_name) <> '';

insert into public.field_route_place_lists (list_name, list_color, icon_key, is_active)
values
  ('Auto Repair', '#ff8fa3', 'wrench', true),
  ('Supply Store', '#6fe3ff', 'store', true),
  ('Other Destinations', '#ffd166', 'pin', true)
on conflict do nothing;

create table if not exists public.field_route_places (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.field_route_place_lists(id) on delete restrict,
  place_name text not null default '',
  location_type text not null default 'address' check (location_type in ('address', 'gps')),
  address_value text not null default '',
  latitude numeric,
  longitude numeric,
  phone text not null default '',
  website_url text not null default '',
  is_active boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.field_route_places add column if not exists list_id uuid;
alter table public.field_route_places add column if not exists place_name text not null default '';
alter table public.field_route_places add column if not exists location_type text not null default 'address';
alter table public.field_route_places add column if not exists address_value text not null default '';
alter table public.field_route_places add column if not exists latitude numeric;
alter table public.field_route_places add column if not exists longitude numeric;
alter table public.field_route_places add column if not exists phone text not null default '';
alter table public.field_route_places add column if not exists website_url text not null default '';
alter table public.field_route_places add column if not exists is_active boolean not null default true;
alter table public.field_route_places add column if not exists notes text not null default '';
alter table public.field_route_places drop constraint if exists field_route_places_list_id_fkey;
alter table public.field_route_places add constraint field_route_places_list_id_fkey foreign key (list_id) references public.field_route_place_lists(id) on delete restrict;
alter table public.field_route_places drop constraint if exists field_route_places_location_type_check;
alter table public.field_route_places add constraint field_route_places_location_type_check check (location_type in ('address', 'gps'));
create index if not exists field_route_places_list_id_idx on public.field_route_places(list_id);
create index if not exists field_route_places_is_active_idx on public.field_route_places(is_active);

create table if not exists public.field_restricted_roads (
  id uuid primary key default gen_random_uuid(),
  road_name text not null default '',
  is_active boolean not null default true,
  client_id uuid references public.field_clients(id) on delete set null,
  site_id uuid references public.field_sites(id) on delete set null,
  polyline_points jsonb not null default '[]'::jsonb,
  buffer_meters integer not null default 75 check (buffer_meters > 0),
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.field_restricted_roads add column if not exists road_name text not null default '';
alter table public.field_restricted_roads add column if not exists is_active boolean not null default true;
alter table public.field_restricted_roads add column if not exists client_id uuid;
alter table public.field_restricted_roads add column if not exists site_id uuid;
alter table public.field_restricted_roads add column if not exists polyline_points jsonb not null default '[]'::jsonb;
alter table public.field_restricted_roads add column if not exists buffer_meters integer not null default 75;
alter table public.field_restricted_roads add column if not exists notes text not null default '';
alter table public.field_restricted_roads drop constraint if exists field_restricted_roads_client_id_fkey;
alter table public.field_restricted_roads add constraint field_restricted_roads_client_id_fkey foreign key (client_id) references public.field_clients(id) on delete set null;
alter table public.field_restricted_roads drop constraint if exists field_restricted_roads_site_id_fkey;
alter table public.field_restricted_roads add constraint field_restricted_roads_site_id_fkey foreign key (site_id) references public.field_sites(id) on delete set null;
alter table public.field_restricted_roads drop constraint if exists field_restricted_roads_buffer_meters_check;
alter table public.field_restricted_roads add constraint field_restricted_roads_buffer_meters_check check (buffer_meters > 0);
create index if not exists field_restricted_roads_client_id_idx on public.field_restricted_roads(client_id);
create index if not exists field_restricted_roads_site_id_idx on public.field_restricted_roads(site_id);
create index if not exists field_restricted_roads_is_active_idx on public.field_restricted_roads(is_active);
grant select, insert, update, delete on public.field_restricted_roads to authenticated;

create table if not exists public.field_route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.field_routes(id) on delete cascade,
  site_id uuid not null references public.field_sites(id) on delete cascade,
  stop_order integer not null default 0,
  stop_notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.field_route_stops add column if not exists route_id uuid;
alter table public.field_route_stops add column if not exists site_id uuid;
alter table public.field_route_stops alter column site_id drop not null;
alter table public.field_route_stops add column if not exists stop_type text not null default 'site';
alter table public.field_route_stops add column if not exists place_id uuid;
alter table public.field_route_stops add column if not exists stop_label text not null default '';
alter table public.field_route_stops add column if not exists stop_value text not null default '';
alter table public.field_route_stops add column if not exists stop_latitude numeric;
alter table public.field_route_stops add column if not exists stop_longitude numeric;
alter table public.field_route_stops add column if not exists stop_order integer not null default 0;
alter table public.field_route_stops add column if not exists leg_distance_meters integer;
alter table public.field_route_stops add column if not exists leg_duration_seconds integer;
alter table public.field_route_stops add column if not exists stop_notes text not null default '';
update public.field_route_stops
set stop_type = 'site'
where coalesce(stop_type, '') = '';
alter table public.field_route_stops drop constraint if exists field_route_stops_route_id_fkey;
alter table public.field_route_stops add constraint field_route_stops_route_id_fkey foreign key (route_id) references public.field_routes(id) on delete cascade;
alter table public.field_route_stops drop constraint if exists field_route_stops_site_id_fkey;
alter table public.field_route_stops add constraint field_route_stops_site_id_fkey foreign key (site_id) references public.field_sites(id) on delete cascade;
alter table public.field_route_stops drop constraint if exists field_route_stops_place_id_fkey;
alter table public.field_route_stops add constraint field_route_stops_place_id_fkey foreign key (place_id) references public.field_route_places(id) on delete restrict;
alter table public.field_route_stops drop constraint if exists field_route_stops_stop_type_check;
alter table public.field_route_stops add constraint field_route_stops_stop_type_check check (stop_type in ('site', 'place'));
alter table public.field_route_stops drop constraint if exists field_route_stops_stop_target_check;
alter table public.field_route_stops add constraint field_route_stops_stop_target_check check (
  (stop_type = 'site' and site_id is not null and place_id is null)
  or (stop_type = 'place' and place_id is not null and site_id is null)
);

create table if not exists public.field_route_stop_jobs (
  id uuid primary key default gen_random_uuid(),
  route_stop_id uuid not null references public.field_route_stops(id) on delete cascade,
  job_id uuid not null references public.field_jobs(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.field_route_stop_jobs add column if not exists route_stop_id uuid;
alter table public.field_route_stop_jobs add column if not exists job_id uuid;
alter table public.field_route_stop_jobs drop constraint if exists field_route_stop_jobs_route_stop_id_fkey;
alter table public.field_route_stop_jobs add constraint field_route_stop_jobs_route_stop_id_fkey foreign key (route_stop_id) references public.field_route_stops(id) on delete cascade;
alter table public.field_route_stop_jobs drop constraint if exists field_route_stop_jobs_job_id_fkey;
alter table public.field_route_stop_jobs add constraint field_route_stop_jobs_job_id_fkey foreign key (job_id) references public.field_jobs(id) on delete cascade;
create unique index if not exists field_route_stop_jobs_stop_job_unique_idx on public.field_route_stop_jobs(route_stop_id, job_id);
create index if not exists field_routes_route_date_idx on public.field_routes(route_date);
create index if not exists field_routes_assigned_technician_id_idx on public.field_routes(assigned_technician_id);
create index if not exists field_route_stops_route_id_idx on public.field_route_stops(route_id);
create index if not exists field_route_stops_site_id_idx on public.field_route_stops(site_id);
create index if not exists field_route_stops_place_id_idx on public.field_route_stops(place_id);
create index if not exists field_route_stop_jobs_route_stop_id_idx on public.field_route_stop_jobs(route_stop_id);
create index if not exists field_route_stop_jobs_job_id_idx on public.field_route_stop_jobs(job_id);
create index if not exists field_spl_sites_is_active_idx on public.field_spl_sites(is_active);
create index if not exists field_technician_travel_technician_id_idx on public.field_technician_travel(technician_id);
create index if not exists field_technician_travel_arrival_departure_idx on public.field_technician_travel(arrival_at, departure_at);
create index if not exists field_technician_travel_status_idx on public.field_technician_travel(travel_status);
create index if not exists field_technician_travel_origin_spl_site_id_idx on public.field_technician_travel(origin_spl_site_id);
create index if not exists field_technician_travel_destination_spl_site_id_idx on public.field_technician_travel(destination_spl_site_id);
create index if not exists field_technician_travel_origin_client_site_id_idx on public.field_technician_travel(origin_client_site_id);
create index if not exists field_technician_travel_destination_client_site_id_idx on public.field_technician_travel(destination_client_site_id);

create or replace function public.field_travel_status_blocks(status_value text)
returns boolean
language sql
immutable
as $$
  select coalesce(status_value, 'Planned') not in ('Complete', 'Canceled');
$$;

create or replace function public.field_employee_is_pittsburgh(employee_id uuid)
returns boolean
language sql
stable
as $$
  select coalesce(
    (
      select lower(btrim(e.home_spl_site)) in ('pittsburgh', 'spl pittsburgh')
        or upper(btrim(e.home_spl_site)) = 'PITTSBURGH'
      from public.employees e
      where e.id = employee_id
    ),
    false
  );
$$;

create or replace function public.field_spl_site_is_pittsburgh(site_id uuid)
returns boolean
language sql
stable
as $$
  select coalesce(
    (
      select upper(btrim(s.site_code)) = 'PITTSBURGH'
        or lower(btrim(s.site_name)) = 'pittsburgh'
        or lower(btrim(s.site_name)) = 'spl pittsburgh'
        or lower(btrim(s.location_label)) = 'pittsburgh'
        or lower(btrim(s.location_label)) = 'spl pittsburgh'
      from public.field_spl_sites s
      where s.id = site_id
    ),
    false
  );
$$;

create or replace function public.field_travel_is_pittsburgh_availability(
  direction_value text,
  destination_type_value text,
  destination_spl_site_id_value uuid
)
returns boolean
language sql
stable
as $$
  select direction_value = 'Inbound'
    and destination_type_value = 'spl_site'
    and public.field_spl_site_is_pittsburgh(destination_spl_site_id_value);
$$;

create or replace function public.field_job_overlaps_travel_window(
  job_start timestamptz,
  job_end timestamptz,
  travel_start timestamptz,
  travel_end timestamptz
)
returns boolean
language sql
immutable
as $$
  select case
    when job_start is null or travel_start is null or travel_end is null then false
    when job_end is null or job_end <= job_start then job_start >= travel_start and job_start < travel_end
    else job_start < travel_end and job_end > travel_start
  end;
$$;

create or replace function public.field_job_within_travel_window(
  job_start timestamptz,
  job_end timestamptz,
  travel_start timestamptz,
  travel_end timestamptz
)
returns boolean
language sql
immutable
as $$
  select case
    when job_start is null or travel_start is null or travel_end is null then false
    when job_end is null or job_end <= job_start then job_start >= travel_start and job_start < travel_end
    else job_start >= travel_start and job_end <= travel_end
  end;
$$;

create or replace function public.field_technician_has_pittsburgh_availability(
  technician_id_value uuid,
  job_start timestamptz,
  job_end timestamptz
)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.field_technician_travel t
    where t.technician_id = technician_id_value
      and public.field_travel_is_pittsburgh_availability(t.direction, t.destination_type, t.destination_spl_site_id)
      and public.field_job_within_travel_window(job_start, job_end, t.arrival_at, t.departure_at)
  );
$$;

create or replace function public.validate_field_technician_travel()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.field_technician_travel t
    where t.technician_id = new.technician_id
      and t.id is distinct from new.id
      and new.arrival_at < t.departure_at
      and new.departure_at > t.arrival_at
  ) then
    raise exception 'Technician travel overlaps another travel entry.';
  end if;

  if exists (
    select 1
    from public.field_job_assignments a
    join public.field_jobs j on j.id = a.job_id
    where a.assignment_type = 'Technician'
      and a.resource_id = new.technician_id
      and not public.field_travel_is_pittsburgh_availability(new.direction, new.destination_type, new.destination_spl_site_id)
      and public.field_job_overlaps_travel_window(coalesce(j.scheduled_start, j.requested_date::timestamptz), j.scheduled_end, new.arrival_at, new.departure_at)
  ) then
    raise exception 'Technician travel away from Pittsburgh overlaps an assigned field job.';
  end if;

  if not public.field_employee_is_pittsburgh(new.technician_id)
    and exists (
      select 1
      from public.field_job_assignments a
      join public.field_jobs j on j.id = a.job_id
      where a.assignment_type = 'Technician'
        and a.resource_id = new.technician_id
        and coalesce(j.scheduled_start, j.requested_date::timestamptz) is not null
        and timezone('America/New_York', coalesce(j.scheduled_end, j.scheduled_start, j.requested_date::timestamptz))::date >= timezone('America/New_York', now())::date
        and not (
          exists (
            select 1
            from public.field_technician_travel t
            where t.technician_id = new.technician_id
              and t.id is distinct from new.id
              and public.field_travel_is_pittsburgh_availability(t.direction, t.destination_type, t.destination_spl_site_id)
              and public.field_job_within_travel_window(coalesce(j.scheduled_start, j.requested_date::timestamptz), j.scheduled_end, t.arrival_at, t.departure_at)
          )
          or (
            public.field_travel_is_pittsburgh_availability(new.direction, new.destination_type, new.destination_spl_site_id)
            and public.field_job_within_travel_window(coalesce(j.scheduled_start, j.requested_date::timestamptz), j.scheduled_end, new.arrival_at, new.departure_at)
          )
        )
    ) then
    raise exception 'Visiting technician must have Pittsburgh travel covering assigned field jobs.';
  end if;

  return new;
end;
$$;

drop trigger if exists field_technician_travel_validate_overlap on public.field_technician_travel;
create trigger field_technician_travel_validate_overlap
before insert or update on public.field_technician_travel
for each row
execute function public.validate_field_technician_travel();

create or replace function public.validate_field_job_travel_overlap()
returns trigger
language plpgsql
as $$
begin
  if coalesce(new.scheduled_start, new.requested_date::timestamptz) is null then
    return new;
  end if;

  if exists (
    select 1
    from public.field_job_assignments a
    join public.field_technician_travel t on t.technician_id = a.resource_id
    where a.job_id = new.id
      and a.assignment_type = 'Technician'
      and not public.field_travel_is_pittsburgh_availability(t.direction, t.destination_type, t.destination_spl_site_id)
      and public.field_job_overlaps_travel_window(coalesce(new.scheduled_start, new.requested_date::timestamptz), new.scheduled_end, t.arrival_at, t.departure_at)
  ) then
    raise exception 'Field job schedule overlaps technician travel away from Pittsburgh.';
  end if;

  if exists (
    select 1
    from public.field_job_assignments a
    where a.job_id = new.id
      and a.assignment_type = 'Technician'
      and not public.field_employee_is_pittsburgh(a.resource_id)
      and not public.field_technician_has_pittsburgh_availability(a.resource_id, coalesce(new.scheduled_start, new.requested_date::timestamptz), new.scheduled_end)
  ) then
    raise exception 'Visiting technician must have Pittsburgh travel covering the field job.';
  end if;

  return new;
end;
$$;

drop trigger if exists field_jobs_validate_travel_overlap on public.field_jobs;
create trigger field_jobs_validate_travel_overlap
before insert or update on public.field_jobs
for each row
execute function public.validate_field_job_travel_overlap();

create or replace function public.validate_field_job_assignment_travel_overlap()
returns trigger
language plpgsql
as $$
declare
  job_start timestamptz;
  job_end timestamptz;
begin
  if new.assignment_type <> 'Technician' or new.resource_id is null then
    return new;
  end if;

  select coalesce(scheduled_start, requested_date::timestamptz), scheduled_end
  into job_start, job_end
  from public.field_jobs
  where id = new.job_id;

  if job_start is null then
    return new;
  end if;

  if exists (
    select 1
    from public.field_technician_travel t
    where t.technician_id = new.resource_id
      and not public.field_travel_is_pittsburgh_availability(t.direction, t.destination_type, t.destination_spl_site_id)
      and public.field_job_overlaps_travel_window(job_start, job_end, t.arrival_at, t.departure_at)
  ) then
    raise exception 'Field job assignment overlaps technician travel away from Pittsburgh.';
  end if;

  if not public.field_employee_is_pittsburgh(new.resource_id)
    and not public.field_technician_has_pittsburgh_availability(new.resource_id, job_start, job_end) then
    raise exception 'Visiting technician must have Pittsburgh travel covering the field job assignment.';
  end if;

  return new;
end;
$$;

drop trigger if exists field_job_assignments_validate_travel_overlap on public.field_job_assignments;
create trigger field_job_assignments_validate_travel_overlap
before insert or update on public.field_job_assignments
for each row
execute function public.validate_field_job_assignment_travel_overlap();

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
create index if not exists field_samples_sample_status_idx on public.field_samples(sample_status);
create index if not exists field_samples_linked_work_order_idx on public.field_samples(linked_work_order_id) where btrim(linked_work_order_id) <> '';
create index if not exists field_maintenance_asset_idx on public.field_maintenance_records(asset_type, asset_id);
create index if not exists field_maintenance_status_due_idx on public.field_maintenance_records(status, due_date);

create table if not exists public.field_part_catalogs (
  id uuid primary key default gen_random_uuid(),
  catalog_type text not null default '',
  catalog_value text not null default '',
  sort_order integer not null default 0,
  is_active boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.field_part_catalogs add column if not exists catalog_type text not null default '';
alter table public.field_part_catalogs add column if not exists catalog_value text not null default '';
alter table public.field_part_catalogs add column if not exists sort_order integer not null default 0;
alter table public.field_part_catalogs add column if not exists is_active boolean not null default true;
alter table public.field_part_catalogs add column if not exists notes text not null default '';
update public.field_part_catalogs
set catalog_type = lower(btrim(catalog_type)),
    catalog_value = btrim(catalog_value);
alter table public.field_part_catalogs drop constraint if exists field_part_catalogs_catalog_type_check;
alter table public.field_part_catalogs add constraint field_part_catalogs_catalog_type_check check (catalog_type in ('category', 'vendor', 'unit', 'storage_location'));
alter table public.field_part_catalogs drop constraint if exists field_part_catalogs_catalog_value_check;
alter table public.field_part_catalogs add constraint field_part_catalogs_catalog_value_check check (btrim(catalog_value) <> '');
create unique index if not exists field_part_catalogs_type_value_unique_idx on public.field_part_catalogs(catalog_type, lower(catalog_value));
create index if not exists field_part_catalogs_type_active_sort_idx on public.field_part_catalogs(catalog_type, is_active, sort_order, catalog_value);

insert into public.field_part_catalogs (catalog_type, catalog_value, sort_order, is_active)
values
  ('category', 'Fittings', 10, true),
  ('category', 'Valves', 20, true),
  ('category', 'Gaskets / Seals', 30, true),
  ('category', 'Tubing', 40, true),
  ('category', 'Hoses', 50, true),
  ('category', 'Meters', 60, true),
  ('category', 'Electrical', 70, true),
  ('category', 'Hardware', 80, true),
  ('category', 'Consumables', 90, true),
  ('category', 'Tools', 100, true),
  ('category', 'Safety', 110, true),
  ('category', 'Other', 120, true),
  ('vendor', 'SPL Stock', 10, true),
  ('vendor', 'Airgas', 20, true),
  ('vendor', 'Amazon Business', 30, true),
  ('vendor', 'Grainger', 40, true),
  ('vendor', 'McMaster-Carr', 50, true),
  ('vendor', 'Fastenal', 60, true),
  ('vendor', 'Home Depot', 70, true),
  ('vendor', 'Lowe''s', 80, true),
  ('vendor', 'Other', 90, true),
  ('unit', 'Each', 10, true),
  ('unit', 'Box', 20, true),
  ('unit', 'Pack', 30, true),
  ('unit', 'Set', 40, true),
  ('unit', 'Kit', 50, true),
  ('unit', 'Foot', 60, true),
  ('unit', 'Roll', 70, true),
  ('unit', 'Case', 80, true),
  ('unit', 'Bag', 90, true),
  ('storage_location', 'Field Warehouse', 10, true),
  ('storage_location', 'Pittsburgh Shop', 20, true),
  ('storage_location', 'Service Truck', 30, true),
  ('storage_location', 'Trailer', 40, true),
  ('storage_location', 'Tool Room', 50, true),
  ('storage_location', 'Parts Cabinet', 60, true),
  ('storage_location', 'Client Site', 70, true),
  ('storage_location', 'Other', 80, true)
on conflict do nothing;

grant select, insert, update, delete on public.field_part_catalogs to authenticated;

create or replace function public.portal_update_field_job_assignment_status(
  target_assignment_id uuid,
  next_status text,
  next_notes text default null
)
returns public.field_job_assignments
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.field_job_assignments%rowtype;
begin
  if not public.has_employee_feature('field.jobs.update_status') then
    raise exception 'Field job status update access is required.';
  end if;

  if next_status not in ('Assigned', 'Confirmed', 'In Progress', 'Complete') then
    raise exception 'Invalid assignment status.';
  end if;

  update public.field_job_assignments
  set assignment_status = next_status,
      assignment_notes = coalesce(next_notes, assignment_notes)
  where id = target_assignment_id
  returning * into updated_row;

  if updated_row.id is null then
    raise exception 'Field job assignment was not found.';
  end if;

  return updated_row;
end;
$$;

create or replace function public.portal_update_field_route(
  target_route_id uuid,
  next_status text,
  next_notes text default null
)
returns public.field_routes
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.field_routes%rowtype;
begin
  if not public.has_employee_feature('field.routes.edit') then
    raise exception 'Field route edit access is required.';
  end if;

  if next_status not in ('Draft', 'Planned', 'Assigned', 'Complete', 'Archived') then
    raise exception 'Invalid route status.';
  end if;

  update public.field_routes
  set route_status = next_status,
      notes = coalesce(next_notes, notes)
  where id = target_route_id
  returning * into updated_row;

  if updated_row.id is null then
    raise exception 'Field route was not found.';
  end if;

  return updated_row;
end;
$$;

create or replace function public.portal_update_field_route_stop(
  target_route_stop_id uuid,
  next_stop_order integer,
  next_stop_notes text default null
)
returns public.field_route_stops
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.field_route_stops%rowtype;
begin
  if not public.has_employee_feature('field.routes.edit') then
    raise exception 'Field route stop edit access is required.';
  end if;

  if target_route_stop_id is null then
    raise exception 'Route stop is required.';
  end if;

  if coalesce(next_stop_order, 0) < 0 then
    raise exception 'Route stop order cannot be negative.';
  end if;

  update public.field_route_stops
  set stop_order = coalesce(next_stop_order, stop_order),
      stop_notes = coalesce(next_stop_notes, stop_notes)
  where id = target_route_stop_id
  returning * into updated_row;

  if updated_row.id is null then
    raise exception 'Route stop was not found.';
  end if;

  return updated_row;
end;
$$;

create or replace function public.portal_update_field_sample_status(
  target_sample_id uuid,
  next_status text,
  linked_work_order_id_value text default null,
  linked_work_order_number_value text default null
)
returns public.field_samples
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.field_samples%rowtype;
begin
  if not public.has_employee_feature('field.samples.update_status') then
    raise exception 'Field sample status update access is required.';
  end if;

  if next_status not in ('Needs Pulled', 'Received by Lab') then
    raise exception 'Invalid sample status.';
  end if;

  update public.field_samples
  set sample_status = next_status,
      lab_receipt_status = case when next_status = 'Received by Lab' then 'Delivered' else 'Requested' end,
      chain_of_custody_status = case when next_status = 'Received by Lab' then 'Delivered' else 'Requested' end,
      linked_work_order_id = case when next_status = 'Received by Lab' then coalesce(linked_work_order_id_value, linked_work_order_id, '') else '' end,
      linked_work_order_number = case when next_status = 'Received by Lab' then coalesce(linked_work_order_number_value, linked_work_order_number, '') else '' end,
      lab_received_at = case when next_status = 'Received by Lab' then coalesce(lab_received_at, timezone('utc', now())) else null end
  where id = target_sample_id
  returning * into updated_row;

  if updated_row.id is null then
    raise exception 'Field sample was not found.';
  end if;

  return updated_row;
end;
$$;

create or replace function public.portal_adjust_consumable_counts(
  target_item_id uuid,
  next_new_count integer,
  next_in_use_count integer,
  next_empty_count integer,
  activity_type_value text,
  quantity_delta_value integer,
  notes_value text default ''
)
returns public.consumable_stock_counts
language plpgsql
security definer
set search_path = public
as $$
declare
  current_counts public.consumable_stock_counts%rowtype;
  updated_counts public.consumable_stock_counts%rowtype;
begin
  if not public.has_employee_feature('lab.consumables.change_counts') then
    raise exception 'Consumable count change access is required.';
  end if;

  if target_item_id is null then
    raise exception 'Consumable item is required.';
  end if;

  if not exists (select 1 from public.consumable_items where id = target_item_id and is_active) then
    raise exception 'Consumable item was not found.';
  end if;

  if coalesce(next_new_count, -1) < 0 or coalesce(next_in_use_count, -1) < 0 or coalesce(next_empty_count, -1) < 0 then
    raise exception 'Consumable counts cannot be negative.';
  end if;

  select * into current_counts
  from public.consumable_stock_counts
  where item_id = target_item_id
  for update;

  if current_counts.id is null then
    insert into public.consumable_stock_counts (item_id, new_count, in_use_count, empty_count)
    values (target_item_id, next_new_count, next_in_use_count, next_empty_count)
    returning * into updated_counts;

    insert into public.consumable_activity (
      item_id,
      activity_type,
      quantity_delta,
      new_before,
      new_after,
      in_use_before,
      in_use_after,
      empty_before,
      empty_after,
      notes
    )
    values (
      target_item_id,
      coalesce(nullif(activity_type_value, ''), 'adjust_counts'),
      coalesce(quantity_delta_value, next_new_count + next_in_use_count + next_empty_count),
      0,
      updated_counts.new_count,
      0,
      updated_counts.in_use_count,
      0,
      updated_counts.empty_count,
      coalesce(notes_value, '')
    );

    return updated_counts;
  end if;

  update public.consumable_stock_counts
  set new_count = next_new_count,
      in_use_count = next_in_use_count,
      empty_count = next_empty_count
  where id = current_counts.id
  returning * into updated_counts;

  insert into public.consumable_activity (
    item_id,
    activity_type,
    quantity_delta,
    new_before,
    new_after,
    in_use_before,
    in_use_after,
    empty_before,
    empty_after,
    notes
  )
  values (
    target_item_id,
    coalesce(nullif(activity_type_value, ''), 'adjust_counts'),
    coalesce(quantity_delta_value, (next_new_count - current_counts.new_count) + (next_in_use_count - current_counts.in_use_count) + (next_empty_count - current_counts.empty_count)),
    current_counts.new_count,
    updated_counts.new_count,
    current_counts.in_use_count,
    updated_counts.in_use_count,
    current_counts.empty_count,
    updated_counts.empty_count,
    coalesce(notes_value, '')
  );

  return updated_counts;
end;
$$;

create or replace function public.portal_save_consumable_order(
  target_order_id uuid,
  target_item_id uuid,
  quantity_value integer,
  order_status_value text,
  ordered_on_value date default null,
  received_on_value date default null,
  notes_value text default ''
)
returns public.consumable_orders
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_order public.consumable_orders%rowtype;
  saved_order public.consumable_orders%rowtype;
  current_counts public.consumable_stock_counts%rowtype;
  updated_counts public.consumable_stock_counts%rowtype;
begin
  if not public.has_employee_feature('lab.consumables.manage_orders') then
    raise exception 'Consumable order management access is required.';
  end if;

  if target_item_id is null then
    raise exception 'Consumable item is required.';
  end if;

  if coalesce(quantity_value, 0) <= 0 then
    raise exception 'Order quantity must be greater than zero.';
  end if;

  if order_status_value not in ('Needed', 'Ordered', 'Received', 'Canceled') then
    raise exception 'Invalid order status.';
  end if;

  if not exists (select 1 from public.consumable_items where id = target_item_id) then
    raise exception 'Consumable item was not found.';
  end if;

  if target_order_id is not null then
    select * into existing_order
    from public.consumable_orders
    where id = target_order_id
    for update;

    if existing_order.id is null then
      raise exception 'Consumable order was not found.';
    end if;

    update public.consumable_orders
    set quantity = quantity_value,
        order_status = order_status_value,
        ordered_on = ordered_on_value,
        received_on = received_on_value,
        notes = coalesce(notes_value, '')
    where id = target_order_id
    returning * into saved_order;
  else
    insert into public.consumable_orders (item_id, quantity, order_status, ordered_on, received_on, notes)
    values (target_item_id, quantity_value, order_status_value, ordered_on_value, received_on_value, coalesce(notes_value, ''))
    returning * into saved_order;
  end if;

  insert into public.consumable_activity (
    item_id,
    order_id,
    activity_type,
    quantity_delta,
    notes
  )
  values (
    saved_order.item_id,
    saved_order.id,
    case when target_order_id is null then 'order_created' else 'order_updated' end,
    saved_order.quantity,
    concat(saved_order.order_status, ' order for ', saved_order.quantity, ' item(s). ', coalesce(saved_order.notes, ''))
  );

  if saved_order.order_status = 'Received'
    and coalesce(existing_order.order_status, '') <> 'Received' then
    select * into current_counts
    from public.consumable_stock_counts
    where item_id = saved_order.item_id
    for update;

    if current_counts.id is null then
      insert into public.consumable_stock_counts (item_id, new_count, in_use_count, empty_count)
      values (saved_order.item_id, saved_order.quantity, 0, 0)
      returning * into updated_counts;

      insert into public.consumable_activity (
        item_id,
        order_id,
        activity_type,
        quantity_delta,
        new_before,
        new_after,
        notes
      )
      values (
        saved_order.item_id,
        saved_order.id,
        'order_received',
        saved_order.quantity,
        0,
        updated_counts.new_count,
        concat('Received order for ', saved_order.quantity, ' item(s).')
      );
    else
      update public.consumable_stock_counts
      set new_count = current_counts.new_count + saved_order.quantity
      where id = current_counts.id
      returning * into updated_counts;

      insert into public.consumable_activity (
        item_id,
        order_id,
        activity_type,
        quantity_delta,
        new_before,
        new_after,
        in_use_before,
        in_use_after,
        empty_before,
        empty_after,
        notes
      )
      values (
        saved_order.item_id,
        saved_order.id,
        'order_received',
        saved_order.quantity,
        current_counts.new_count,
        updated_counts.new_count,
        current_counts.in_use_count,
        updated_counts.in_use_count,
        current_counts.empty_count,
        updated_counts.empty_count,
        concat('Received order for ', saved_order.quantity, ' item(s).')
      );
    end if;
  end if;

  return saved_order;
end;
$$;

revoke all on function public.portal_update_field_job_assignment_status(uuid, text, text) from public;
revoke all on function public.portal_update_field_route(uuid, text, text) from public;
revoke all on function public.portal_update_field_route_stop(uuid, integer, text) from public;
revoke all on function public.portal_update_field_sample_status(uuid, text, text, text) from public;
revoke all on function public.portal_adjust_consumable_counts(uuid, integer, integer, integer, text, integer, text) from public;
revoke all on function public.portal_save_consumable_order(uuid, uuid, integer, text, date, date, text) from public;
grant execute on function public.portal_update_field_job_assignment_status(uuid, text, text) to authenticated;
grant execute on function public.portal_update_field_route(uuid, text, text) to authenticated;
grant execute on function public.portal_update_field_route_stop(uuid, integer, text) to authenticated;
grant execute on function public.portal_update_field_sample_status(uuid, text, text, text) to authenticated;
grant execute on function public.portal_adjust_consumable_counts(uuid, integer, integer, integer, text, integer, text) to authenticated;
grant execute on function public.portal_save_consumable_order(uuid, uuid, integer, text, date, date, text) to authenticated;

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
    'billing_price_items',
    'field_billing_profile_prices',
    'field_site_types',
    'field_sites',
    'field_site_projects',
    'field_jobs',
    'field_job_sites',
    'field_job_assignments',
    'field_job_types',
    'field_site_type_job_types',
    'field_routes',
    'field_route_place_lists',
    'field_route_places',
    'field_restricted_roads',
    'field_route_stops',
    'field_route_stop_jobs',
    'employees',
    'field_spl_sites',
    'field_technician_travel',
    'field_technicians',
    'field_trucks',
    'field_trailers',
    'field_equipment',
    'field_samples',
    'field_maintenance_records',
    'field_part_catalogs',
    'field_parts',
    'field_job_parts',
    'field_part_activity',
    'consumable_items',
    'consumable_stock_counts',
    'consumable_orders',
    'consumable_activity'
  ];
begin
  foreach tbl in array field_tables loop
    execute format('drop trigger if exists %I on public.%I', tbl || '_touch', tbl);
    execute format('create trigger %I before insert or update on public.%I for each row execute function public.touch_field_ops_row()', tbl || '_touch', tbl);
    execute format('alter table public.%I enable row level security', tbl);

    execute format('drop policy if exists %I on public.%I', 'Authenticated users can read ' || tbl, tbl);
    execute format('create policy %I on public.%I for select to authenticated using (public.is_app_admin())', 'Authenticated users can read ' || tbl, tbl);

    execute format('drop policy if exists %I on public.%I', 'Authenticated users can insert ' || tbl, tbl);
    execute format('create policy %I on public.%I for insert to authenticated with check (public.is_app_admin())', 'Authenticated users can insert ' || tbl, tbl);

    execute format('drop policy if exists %I on public.%I', 'Authenticated users can update ' || tbl, tbl);
    execute format('create policy %I on public.%I for update to authenticated using (public.is_app_admin()) with check (public.is_app_admin())', 'Authenticated users can update ' || tbl, tbl);

    execute format('drop policy if exists %I on public.%I', 'Authenticated users can delete ' || tbl, tbl);
    execute format('create policy %I on public.%I for delete to authenticated using (public.is_app_admin())', 'Authenticated users can delete ' || tbl, tbl);

    execute format('grant select, insert, update, delete on public.%I to authenticated', tbl);
  end loop;
end
$$;

alter table public.app_user_profiles enable row level security;
alter table public.app_features enable row level security;
alter table public.employee_feature_grants enable row level security;
drop trigger if exists app_user_profiles_touch on public.app_user_profiles;
create trigger app_user_profiles_touch
before insert or update on public.app_user_profiles
for each row
execute function public.touch_field_ops_row();
drop trigger if exists app_features_touch on public.app_features;
create trigger app_features_touch
before insert or update on public.app_features
for each row
execute function public.touch_field_ops_row();
drop trigger if exists employee_feature_grants_touch on public.employee_feature_grants;
create trigger employee_feature_grants_touch
before insert or update on public.employee_feature_grants
for each row
execute function public.touch_field_ops_row();
grant select, insert, update, delete on public.app_user_profiles to authenticated;
grant select, insert, update, delete on public.app_features to authenticated;
grant select, insert, update, delete on public.employee_feature_grants to authenticated;
grant select, insert, update, delete on public.app_state to authenticated;
grant select, insert, update, delete on public.standards to authenticated;
grant select, insert, update, delete on public.standard_components to authenticated;

drop policy if exists "Admin users can manage app_user_profiles" on public.app_user_profiles;
create policy "Admin users can manage app_user_profiles"
on public.app_user_profiles
for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists "Users can read their own app profile" on public.app_user_profiles;
create policy "Users can read their own app profile"
on public.app_user_profiles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Admin users can manage app_features" on public.app_features;
create policy "Admin users can manage app_features"
on public.app_features
for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists "Authenticated users can read app_features" on public.app_features;
create policy "Authenticated users can read app_features"
on public.app_features
for select
to authenticated
using (auth.uid() is not null);

drop policy if exists "Admin users can manage employee_feature_grants" on public.employee_feature_grants;
create policy "Admin users can manage employee_feature_grants"
on public.employee_feature_grants
for all
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists "Employees can read their own feature grants" on public.employee_feature_grants;
create policy "Employees can read their own feature grants"
on public.employee_feature_grants
for select
to authenticated
using (employee_id = public.current_employee_id());

drop policy if exists "Authenticated users can read app_state" on public.app_state;
create policy "Authenticated users can read app_state"
on public.app_state
for select
to authenticated
using (public.can_read_app_state_key(storage_key));

drop policy if exists "Authenticated users can insert app_state" on public.app_state;
create policy "Authenticated users can insert app_state"
on public.app_state
for insert
to authenticated
with check (public.is_app_admin());

drop policy if exists "Authenticated users can update app_state" on public.app_state;
create policy "Authenticated users can update app_state"
on public.app_state
for update
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists "Authenticated users can read standards" on public.standards;
create policy "Authenticated users can read standards"
on public.standards
for select
to authenticated
using (public.is_app_admin());

drop policy if exists "Authenticated users can insert standards" on public.standards;
create policy "Authenticated users can insert standards"
on public.standards
for insert
to authenticated
with check (public.is_app_admin());

drop policy if exists "Authenticated users can update standards" on public.standards;
create policy "Authenticated users can update standards"
on public.standards
for update
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists "Authenticated users can delete standards" on public.standards;
create policy "Authenticated users can delete standards"
on public.standards
for delete
to authenticated
using (public.is_app_admin());

drop policy if exists "Authenticated users can read standard components" on public.standard_components;
create policy "Authenticated users can read standard components"
on public.standard_components
for select
to authenticated
using (public.is_app_admin());

drop policy if exists "Authenticated users can insert standard components" on public.standard_components;
create policy "Authenticated users can insert standard components"
on public.standard_components
for insert
to authenticated
with check (public.is_app_admin());

drop policy if exists "Authenticated users can update standard components" on public.standard_components;
create policy "Authenticated users can update standard components"
on public.standard_components
for update
to authenticated
using (public.is_app_admin())
with check (public.is_app_admin());

drop policy if exists "Authenticated users can delete standard components" on public.standard_components;
create policy "Authenticated users can delete standard components"
on public.standard_components
for delete
to authenticated
using (public.is_app_admin());

do $$
declare
  tbl text;
  field_read_tables text[] := array[
    'field_clients',
    'field_projects',
    'field_contacts',
    'field_contact_projects',
    'field_contact_sites',
    'field_site_types',
    'field_sites',
    'field_site_projects',
    'field_jobs',
    'field_job_sites',
    'field_job_assignments',
    'field_job_types',
    'field_site_type_job_types',
    'field_routes',
    'field_route_place_lists',
    'field_route_places',
    'field_restricted_roads',
    'field_route_stops',
    'field_route_stop_jobs',
    'employees',
    'field_spl_sites',
    'field_technician_travel',
    'field_trucks',
    'field_trailers',
    'field_equipment',
    'field_samples'
  ];
  lab_consumable_tables text[] := array[
    'consumable_items',
    'consumable_stock_counts',
    'consumable_orders',
    'consumable_activity'
  ];
begin
  foreach tbl in array field_read_tables loop
    execute format('drop policy if exists %I on public.%I', 'Technician portal can read ' || tbl, tbl);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.has_any_employee_feature(array[''field.jobs.view'', ''field.routes.view'', ''field.samples.view'', ''field.jobs.update_status'', ''field.routes.edit'', ''field.samples.update_status'']))',
      'Technician portal can read ' || tbl,
      tbl
    );
  end loop;

  foreach tbl in array lab_consumable_tables loop
    execute format('drop policy if exists %I on public.%I', 'Technician portal can read ' || tbl, tbl);
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.has_any_employee_feature(array[''lab.consumables.view'', ''lab.consumables.change_counts'', ''lab.consumables.manage_orders'']))',
      'Technician portal can read ' || tbl,
      tbl
    );
  end loop;
end
$$;

drop policy if exists "Technician portal can read own employee profile" on public.employees;
create policy "Technician portal can read own employee profile"
on public.employees
for select
to authenticated
using (id = public.current_employee_id());

drop policy if exists "Authenticated users can read standard tag images" on storage.objects;
create policy "Authenticated users can read standard tag images"
on storage.objects
for select
to authenticated
using (bucket_id = 'standard-tags' and public.is_app_admin());

drop policy if exists "Authenticated users can upload standard tag images" on storage.objects;
create policy "Authenticated users can upload standard tag images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'standard-tags' and public.is_app_admin());

drop policy if exists "Authenticated users can update standard tag images" on storage.objects;
create policy "Authenticated users can update standard tag images"
on storage.objects
for update
to authenticated
using (bucket_id = 'standard-tags' and public.is_app_admin())
with check (bucket_id = 'standard-tags' and public.is_app_admin());

drop policy if exists "Authenticated users can delete standard tag images" on storage.objects;
create policy "Authenticated users can delete standard tag images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'standard-tags' and public.is_app_admin());

drop policy if exists "Authenticated users can read field asset images" on storage.objects;
create policy "Authenticated users can read field asset images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'field-assets'
  and (
    public.is_app_admin()
    or public.has_any_employee_feature(array['field.jobs.view', 'field.routes.view', 'field.samples.view'])
  )
);

drop policy if exists "Authenticated users can upload field asset images" on storage.objects;
create policy "Authenticated users can upload field asset images"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'field-assets' and public.is_app_admin());

drop policy if exists "Authenticated users can update field asset images" on storage.objects;
create policy "Authenticated users can update field asset images"
on storage.objects
for update
to authenticated
using (bucket_id = 'field-assets' and public.is_app_admin())
with check (bucket_id = 'field-assets' and public.is_app_admin());

drop policy if exists "Authenticated users can delete field asset images" on storage.objects;
create policy "Authenticated users can delete field asset images"
on storage.objects
for delete
to authenticated
using (bucket_id = 'field-assets' and public.is_app_admin());

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
