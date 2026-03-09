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
