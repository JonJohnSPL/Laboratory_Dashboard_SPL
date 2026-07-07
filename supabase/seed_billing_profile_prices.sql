-- Seed reusable billing price items and editable 2026 client rate schedules.
-- Run after supabase/schema.sql has created billing_price_items and field_billing_profile_prices.

insert into public.billing_price_items (
  item_key,
  price_section,
  category,
  method,
  description,
  unit_name,
  sort_order,
  is_active
)
values
  ('LIQUID_ASTMD156_SAYBOLT_COLOR', 'Liquid Samples', 'Liquid', 'ASTM D156', 'Saybolt Color', 'Per Sample', 10, true),
  ('LIQUID_ASTMD1838_COPPER_STRIP_CORROSION', 'Liquid Samples', 'Liquid', 'ASTM D1838', 'Copper Strip Corrosion (LPG, 1 hr @ 100F)', 'Per Sample', 20, true),
  ('LIQUID_ASTMD5453_SULPHUR_LIGHT_HYDROCARBON_LIQUIDS', 'Liquid Samples', 'Liquid', 'ASTM D5453', 'Sulphur - Light Hydrocarbon Liquids (UVF)', 'Per Sample', 30, true),
  ('LIQUID_ASTMD6378_VAPOR_PRESSURE', 'Liquid Samples', 'Liquid', 'ASTM D6378', 'Vapor Pressure (VP4, V/L @ 37.8C)', 'Per Sample', 40, true),
  ('LIQUID_ASTMD86_DISTILLATION', 'Liquid Samples', 'Liquid', 'ASTM D86', 'Distillation of Petroleum Products', 'Per Sample', 50, true),
  ('LIQUID_ASTMD6667_SULFUR_LPG', 'Liquid Samples', 'Liquid', 'ASTM D6667', 'Sulfur in LPG (UVF)', 'Per Sample', 60, true),
  ('LIQUID_GPA2186_C10_PLUS', 'Liquid Samples', 'Liquid', 'GPA 2186', 'C10+', 'Per Sample', 70, true),
  ('LIQUID_GPA2177_C6_PLUS', 'Liquid Samples', 'Liquid', 'GPA 2177', 'C6+ Liquid', 'Per Sample', 80, true),
  ('LIQUID_ASTMD2163_C1_C5_LPG', 'Liquid Samples', 'Liquid', 'ASTM D2163', 'C1-C5 LPG (Propane/Propene)', 'Per Sample', 90, true),
  ('LIQUID_ASTMD6377_CRUDE_OIL_VAPOR_PRESSURE', 'Liquid Samples', 'Liquid', 'ASTM D6377', 'Crude Oil Vapor Pressure', 'Per Sample', 100, true),
  ('LIQUID_ASTMD6377_CRUDE_OIL_VAPOR_PRESSURE_PRESSURIZED', 'Liquid Samples', 'Liquid', 'ASTM D6377', 'Crude Oil Vapor Pressure (Pressurized)', 'Per Sample', 110, true),
  ('LIQUID_ASTMD7423_ORGANIC_OXYGENATES', 'Liquid Samples', 'Liquid', 'ASTM D7423', 'Organic Oxygenates (C2-C5)', 'Per Sample', 120, true),
  ('LIQUID_ASTMD7423_METHANOL_ONLY', 'Liquid Samples', 'Liquid', 'ASTM D7423', 'Methanol Only', 'Per Sample', 130, true),
  ('LIQUID_SPL_SAMPLE_DISPOSAL_RECYCLING', 'Liquid Samples', 'Liquid', 'SPL', 'Sample Disposal & Recycling', 'Per Sample', 140, true),
  ('GAS_ASTMD5504_H2S_CHEMILUMINESCENCE', 'Natural Gas Samples', 'Gas', 'ASTM D5504', 'H2S by Chemiluminescence', 'Per Sample', 150, true),
  ('GAS_ASTMD6667_SULFUR_LPG_NATURAL_GAS', 'Natural Gas Samples', 'Gas', 'ASTM D6667', 'Sulfur in LPG & Natural Gas (UVF)', 'Per Sample', 160, true),
  ('GAS_GPA2286M_EXTENDED_ANALYSIS', 'Natural Gas Samples', 'Gas', 'GPA 2286M', 'Extended Analysis (C1-C14+, BTU, RD, O2)', 'Per Sample', 170, true),
  ('GAS_GPA2261_ANALYSIS', 'Natural Gas Samples', 'Gas', 'GPA 2261', 'Gas Analysis (C1-C6+, BTU, RD)', 'Per Sample', 180, true),
  ('GAS_GPA2261_ANALYSIS_O2', 'Natural Gas Samples', 'Gas', 'GPA 2261', 'Gas Analysis (C1-C6+, BTU, RD, O2)', 'Per Sample', 190, true),
  ('GAS_ASTMD4810_H2S_STAINED_TUBE_FIELD', 'Natural Gas Samples', 'Gas', 'ASTM D4810', 'H2S - Stained Tube (Field)', 'Per Sample', 200, true),
  ('GAS_GPA2199_CAPILLARY_GC_SULFUR_CLD', 'Natural Gas Samples', 'Gas', 'GPA 2199', 'Capillary GC + Sulfur CLD', 'Per Sample', 210, true),
  ('GAS_ASTMD1946_REFORMED_GAS_COMPOSITION', 'Natural Gas Samples', 'Gas', 'ASTM D1946', 'Reformed Gas Composition', 'Per Sample', 220, true),
  ('FIELD_VEHICLE_MILEAGE', 'Field & Labor', 'Field', '', 'Vehicle Mileage', 'Per Mile', 230, true),
  ('FIELD_SAMPLING_TECHNICIAN', 'Field & Labor', 'Field', '', 'Sampling Technician', 'Per Hour', 240, true),
  ('FIELD_SAMPLING_TECHNICIAN_OVERTIME', 'Field & Labor', 'Field', '', 'Sampling Technician - Overtime', 'Per Hour', 250, true)
on conflict (item_key) do update
set price_section = excluded.price_section,
    category = excluded.category,
    method = excluded.method,
    description = excluded.description,
    unit_name = excluded.unit_name,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;

with client_aliases(workbook_client_name, alias_name) as (
  values
    ('Energy Transfer', 'Energy Transfer'),
    ('Energy Transfer', 'Energy Transfer Partners'),
    ('Antero Resources', 'Antero Resources'),
    ('Clean Air', 'Clean Air'),
    ('EOG Resources', 'EOG Resources'),
    ('Grenadier Energy Partners', 'Grenadier Energy Partners'),
    ('Gulfport', 'Gulfport'),
    ('Marathon Petroleum Corporation (MPC)', 'Marathon Petroleum Corporation (MPC)'),
    ('Marathon Petroleum Corporation (MPC)', 'Marathon Petroleum Corporation'),
    ('Marathon Petroleum Corporation (MPC)', 'MPC'),
    ('MPLX', 'MPLX'),
    ('Williams', 'Williams')
),
matched_clients as (
  select distinct
    c.id as client_id,
    a.workbook_client_name
  from client_aliases a
  join public.field_clients c
    on public.field_ops_catalog_key(c.client_name) = public.field_ops_catalog_key(a.alias_name)
    or public.field_ops_catalog_key(c.client_code) = public.field_ops_catalog_key(a.alias_name)
)
insert into public.field_billing_profiles (
  client_id,
  project_id,
  billing_name,
  lab_billing_notes,
  is_default
)
select
  mc.client_id,
  null,
  '2026 Rate Schedule',
  'Seeded from Master SPL Pitt Pricesheet - CONFIDENTIAL.xlsx.',
  true
from matched_clients mc
where not exists (
  select 1
  from public.field_billing_profiles existing
  where existing.client_id = mc.client_id
);

with client_aliases(workbook_client_name, alias_name) as (
  values
    ('Energy Transfer', 'Energy Transfer'),
    ('Energy Transfer', 'Energy Transfer Partners'),
    ('Antero Resources', 'Antero Resources'),
    ('Clean Air', 'Clean Air'),
    ('EOG Resources', 'EOG Resources'),
    ('Grenadier Energy Partners', 'Grenadier Energy Partners'),
    ('Gulfport', 'Gulfport'),
    ('Marathon Petroleum Corporation (MPC)', 'Marathon Petroleum Corporation (MPC)'),
    ('Marathon Petroleum Corporation (MPC)', 'Marathon Petroleum Corporation'),
    ('Marathon Petroleum Corporation (MPC)', 'MPC'),
    ('MPLX', 'MPLX'),
    ('Williams', 'Williams')
),
matched_clients as (
  select distinct
    c.id as client_id,
    a.workbook_client_name
  from client_aliases a
  join public.field_clients c
    on public.field_ops_catalog_key(c.client_name) = public.field_ops_catalog_key(a.alias_name)
    or public.field_ops_catalog_key(c.client_code) = public.field_ops_catalog_key(a.alias_name)
),
profile_choice as (
  select distinct on (mc.client_id)
    mc.client_id,
    mc.workbook_client_name,
    p.id as billing_profile_id
  from matched_clients mc
  join public.field_billing_profiles p
    on p.client_id = mc.client_id
  order by mc.client_id, p.is_default desc, (p.project_id is null) desc, p.created_at asc, p.id asc
),
price_seed(item_key, rate_amount) as (
  values
    ('LIQUID_ASTMD156_SAYBOLT_COLOR', 46),
    ('LIQUID_ASTMD1838_COPPER_STRIP_CORROSION', 90),
    ('LIQUID_ASTMD5453_SULPHUR_LIGHT_HYDROCARBON_LIQUIDS', 102),
    ('LIQUID_ASTMD6378_VAPOR_PRESSURE', 210),
    ('LIQUID_ASTMD86_DISTILLATION', 102),
    ('LIQUID_ASTMD6667_SULFUR_LPG', 90),
    ('LIQUID_GPA2186_C10_PLUS', 312),
    ('LIQUID_GPA2177_C6_PLUS', 108),
    ('LIQUID_ASTMD2163_C1_C5_LPG', 478),
    ('LIQUID_ASTMD6377_CRUDE_OIL_VAPOR_PRESSURE', 210),
    ('LIQUID_ASTMD6377_CRUDE_OIL_VAPOR_PRESSURE_PRESSURIZED', 210),
    ('LIQUID_ASTMD7423_ORGANIC_OXYGENATES', 767),
    ('LIQUID_ASTMD7423_METHANOL_ONLY', 344),
    ('LIQUID_SPL_SAMPLE_DISPOSAL_RECYCLING', 12),
    ('GAS_ASTMD5504_H2S_CHEMILUMINESCENCE', 279),
    ('GAS_ASTMD6667_SULFUR_LPG_NATURAL_GAS', 87),
    ('GAS_GPA2286M_EXTENDED_ANALYSIS', 190),
    ('GAS_GPA2261_ANALYSIS', 29),
    ('GAS_GPA2261_ANALYSIS_O2', 29),
    ('GAS_ASTMD4810_H2S_STAINED_TUBE_FIELD', 44),
    ('GAS_GPA2199_CAPILLARY_GC_SULFUR_CLD', 239),
    ('GAS_ASTMD1946_REFORMED_GAS_COMPOSITION', 498),
    ('FIELD_VEHICLE_MILEAGE', 1.75),
    ('FIELD_SAMPLING_TECHNICIAN', 87),
    ('FIELD_SAMPLING_TECHNICIAN_OVERTIME', 130)
)
insert into public.field_billing_profile_prices (
  billing_profile_id,
  price_item_id,
  rate_amount,
  currency_code,
  effective_year,
  is_active,
  notes
)
select
  pc.billing_profile_id,
  item.id,
  ps.rate_amount,
  'USD',
  2026,
  true,
  'Seeded from Master SPL Pitt Pricesheet - CONFIDENTIAL.xlsx for ' || pc.workbook_client_name || '.'
from profile_choice pc
cross join price_seed ps
join public.billing_price_items item on item.item_key = ps.item_key
on conflict (billing_profile_id, price_item_id, effective_year) do update
set rate_amount = excluded.rate_amount,
    currency_code = excluded.currency_code,
    is_active = excluded.is_active,
    notes = excluded.notes;
