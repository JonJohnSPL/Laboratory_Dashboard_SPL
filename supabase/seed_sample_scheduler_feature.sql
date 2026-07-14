insert into public.app_features (
  feature_key,
  feature_scope,
  feature_name,
  feature_description,
  sort_order,
  is_active
)
values (
  'lab.toolbox.sample_scheduler',
  'lab',
  'Sample Scheduler',
  'Use the personal browser-based Sample Scheduler in the SPL Toolbox.',
  50,
  true
)
on conflict (feature_key) do update
set feature_scope = excluded.feature_scope,
    feature_name = excluded.feature_name,
    feature_description = excluded.feature_description,
    sort_order = excluded.sort_order,
    is_active = excluded.is_active;
