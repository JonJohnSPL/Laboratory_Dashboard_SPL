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
  account_status text not null default 'Active' check (account_status in ('Active', 'On Hold', 'Inactive')),
  primary_contact text not null default '',
  contact_phone text not null default '',
  contact_email text not null default '',
  billing_notes text not null default '',
  operational_notes text not null default '',
  salesforce_account_id text not null default '',
  default_service_area text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);

create table if not exists public.field_sites (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.field_clients(id) on delete cascade,
  site_name text not null default '',
  site_type text not null default 'Other' check (site_type in ('Well Pad', 'LACT Unit', 'Facility', 'Pipeline Location', 'Office / Yard', 'Other')),
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

create table if not exists public.field_jobs (
  id uuid primary key default gen_random_uuid(),
  fieldfx_ticket_id text not null default '',
  client_id uuid not null references public.field_clients(id) on delete cascade,
  site_id uuid not null references public.field_sites(id) on delete cascade,
  job_type text not null default '' check (job_type in ('', 'Allocation Proving', 'LACT Proving', 'Sample Pickup', 'Sample Drop-Off', 'Maintenance', 'Multi-Service')),
  job_status text not null default 'New' check (job_status in ('New', 'Scheduled', 'Dispatched', 'In Progress', 'Waiting', 'Complete', 'Closed', 'Canceled')),
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

create table if not exists public.field_technicians (
  id uuid primary key default gen_random_uuid(),
  employee_name text not null default '',
  role text not null default 'Field Tech' check (role in ('Field Tech', 'Senior Field Tech', 'Supervisor', 'Manager')),
  phone text not null default '',
  email text not null default '',
  home_base text not null default '',
  certifications text not null default '',
  api_safety_training_status text not null default '',
  availability_status text not null default 'Available' check (availability_status in ('Available', 'Assigned', 'PTO', 'Unavailable')),
  skill_tags text not null default '',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);

create table if not exists public.field_trucks (
  id uuid primary key default gen_random_uuid(),
  unit_number text not null default '',
  vehicle_type text not null default 'Pickup' check (vehicle_type in ('Pickup', 'Service Truck', 'Other')),
  plate_vin text not null default '',
  assigned_region text not null default '',
  odometer integer,
  service_status text not null default 'Available' check (service_status in ('Available', 'In Use', 'Maintenance', 'Out of Service')),
  last_service_date date,
  next_service_due date,
  workflow text not null default '',
  gps_id text not null default '',
  gps_status text not null default '',
  gvwr integer,
  business_unit text not null default '',
  primary_use text not null default '',
  assigned_to text not null default '',
  current_driver text not null default '',
  assigned_technician_id uuid,
  duty text not null default '',
  lease_company text not null default '',
  model text not null default '',
  vehicle_information text not null default '',
  lease_begin_date date,
  delivery_date date,
  lease_end_date date,
  returned_date date,
  license_plate_number text not null default '',
  make text not null default '',
  color text not null default '',
  ownership text not null default '',
  registered_state text not null default '',
  registration_expiration_date date,
  state_insurance_expiration_date date,
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
alter table public.field_trucks add column if not exists workflow text not null default '';
alter table public.field_trucks add column if not exists gps_id text not null default '';
alter table public.field_trucks add column if not exists gps_status text not null default '';
alter table public.field_trucks add column if not exists gvwr integer;
alter table public.field_trucks add column if not exists business_unit text not null default '';
alter table public.field_trucks add column if not exists primary_use text not null default '';
alter table public.field_trucks add column if not exists assigned_to text not null default '';
alter table public.field_trucks add column if not exists current_driver text not null default '';
alter table public.field_trucks add column if not exists assigned_technician_id uuid;
alter table public.field_trucks add column if not exists duty text not null default '';
alter table public.field_trucks add column if not exists lease_company text not null default '';
alter table public.field_trucks add column if not exists model text not null default '';
alter table public.field_trucks add column if not exists vehicle_information text not null default '';
alter table public.field_trucks add column if not exists lease_begin_date date;
alter table public.field_trucks add column if not exists delivery_date date;
alter table public.field_trucks add column if not exists lease_end_date date;
alter table public.field_trucks add column if not exists returned_date date;
alter table public.field_trucks add column if not exists license_plate_number text not null default '';
alter table public.field_trucks add column if not exists make text not null default '';
alter table public.field_trucks add column if not exists color text not null default '';
alter table public.field_trucks add column if not exists ownership text not null default '';
alter table public.field_trucks add column if not exists registered_state text not null default '';
alter table public.field_trucks add column if not exists registration_expiration_date date;
alter table public.field_trucks add column if not exists state_insurance_expiration_date date;
alter table public.field_trucks add column if not exists vin text not null default '';
alter table public.field_trucks add column if not exists vehicle_id text not null default '';
alter table public.field_trucks add column if not exists vehicle_year integer;

create table if not exists public.field_trailers (
  id uuid primary key default gen_random_uuid(),
  trailer_number text not null default '',
  trailer_type text not null default '',
  capacity_configuration text not null default '',
  service_status text not null default 'Available' check (service_status in ('Available', 'Assigned', 'In Use', 'Maintenance', 'Out of Service')),
  assigned_truck_id uuid,
  last_inspection_date date,
  next_inspection_due date,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid,
  updated_by uuid
);
alter table public.field_trailers add column if not exists photo_path text;
alter table public.field_trailers add column if not exists assigned_truck_id uuid;

create table if not exists public.field_equipment (
  id uuid primary key default gen_random_uuid(),
  equipment_name text not null default '',
  equipment_type text not null default 'Small Volume Prover' check (equipment_type in ('Small Volume Prover', 'Master Meter', 'Regulator', 'Hose Set', 'Sampling Equipment', 'Tooling', 'Other')),
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
create index if not exists field_jobs_client_id_idx on public.field_jobs(client_id);
create index if not exists field_jobs_site_id_idx on public.field_jobs(site_id);
create index if not exists field_jobs_status_schedule_idx on public.field_jobs(job_status, scheduled_start);
create unique index if not exists field_job_assignments_unique_resource_per_job_idx on public.field_job_assignments(job_id, assignment_type, resource_id);
create index if not exists field_samples_job_id_idx on public.field_samples(job_id);
create index if not exists field_samples_coc_status_idx on public.field_samples(chain_of_custody_status);
create index if not exists field_maintenance_asset_idx on public.field_maintenance_records(asset_type, asset_id);
create index if not exists field_maintenance_status_due_idx on public.field_maintenance_records(status, due_date);

do $$
declare
  tbl text;
  field_tables text[] := array[
    'field_clients',
    'field_sites',
    'field_jobs',
    'field_job_assignments',
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
