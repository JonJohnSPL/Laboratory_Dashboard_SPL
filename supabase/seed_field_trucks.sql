do $$
begin
  if exists (select 1 from public.field_trucks where unit_number = 'AM2663') then
    update public.field_trucks
    set vehicle_type = 'Pickup',
        service_status = 'In Use',
        current_driver = 'Dakota Moore',
        model = '1500',
        license_plate_number = 'KDM492',
        make = 'Chevrolet',
        registered_state = 'OK',
        vin = '2GCVKNEC6K1229385',
        vehicle_id = '29385',
        vehicle_year = 2019,
        notes = 'Seeded from truck asset source files on 2026-03-23'
    where unit_number = 'AM2663';
  else
    insert into public.field_trucks (
      unit_number, vehicle_type, service_status, current_driver, model,
      license_plate_number, make, registered_state, vin, vehicle_id, vehicle_year, notes
    ) values (
      'AM2663', 'Pickup', 'In Use', 'Dakota Moore', '1500',
      'KDM492', 'Chevrolet', 'OK', '2GCVKNEC6K1229385', '29385', 2019, 'Seeded from truck asset source files on 2026-03-23'
    );
  end if;

  if exists (select 1 from public.field_trucks where unit_number = 'AM2697') then
    update public.field_trucks
    set vehicle_type = 'Pickup',
        service_status = 'Available',
        current_driver = '',
        model = '1500',
        license_plate_number = 'ZYE3956',
        make = 'Chevrolet',
        registered_state = 'PA',
        vin = '1GCUYDED0MZ440377',
        vehicle_id = '40377',
        vehicle_year = 2021,
        notes = 'Seeded from truck asset source files on 2026-03-23'
    where unit_number = 'AM2697';
  else
    insert into public.field_trucks (
      unit_number, vehicle_type, service_status, current_driver, model,
      license_plate_number, make, registered_state, vin, vehicle_id, vehicle_year, notes
    ) values (
      'AM2697', 'Pickup', 'Available', '', '1500',
      'ZYE3956', 'Chevrolet', 'PA', '1GCUYDED0MZ440377', '40377', 2021, 'Seeded from truck asset source files on 2026-03-23'
    );
  end if;

  if exists (select 1 from public.field_trucks where unit_number = 'AM2713') then
    update public.field_trucks
    set vehicle_type = 'Pickup',
        service_status = 'Available',
        current_driver = '',
        model = 'F-150',
        license_plate_number = '685DSG',
        make = 'Ford',
        registered_state = 'ND',
        vin = '1FTEW1EB5MFD11172',
        vehicle_id = '11172',
        vehicle_year = 2021,
        notes = 'Seeded from truck asset source files on 2026-03-23'
    where unit_number = 'AM2713';
  else
    insert into public.field_trucks (
      unit_number, vehicle_type, service_status, current_driver, model,
      license_plate_number, make, registered_state, vin, vehicle_id, vehicle_year, notes
    ) values (
      'AM2713', 'Pickup', 'Available', '', 'F-150',
      '685DSG', 'Ford', 'ND', '1FTEW1EB5MFD11172', '11172', 2021, 'Seeded from truck asset source files on 2026-03-23'
    );
  end if;

  if exists (select 1 from public.field_trucks where unit_number = 'AM2889') then
    update public.field_trucks
    set vehicle_type = 'Service Truck',
        service_status = 'Available',
        current_driver = '',
        model = 'MD64',
        license_plate_number = 'A17077',
        make = 'Mack',
        registered_state = 'WY',
        vin = '1M2MDBAA5PS004872',
        vehicle_id = '04872',
        vehicle_year = 2023,
        notes = 'Seeded from truck asset source files on 2026-03-23'
    where unit_number = 'AM2889';
  else
    insert into public.field_trucks (
      unit_number, vehicle_type, service_status, current_driver, model,
      license_plate_number, make, registered_state, vin, vehicle_id, vehicle_year, notes
    ) values (
      'AM2889', 'Service Truck', 'Available', '', 'MD64',
      'A17077', 'Mack', 'WY', '1M2MDBAA5PS004872', '04872', 2023, 'Seeded from truck asset source files on 2026-03-23'
    );
  end if;

  if exists (select 1 from public.field_trucks where unit_number = 'AM3948') then
    update public.field_trucks
    set vehicle_type = 'Pickup',
        service_status = 'Available',
        current_driver = '',
        model = 'Tundra',
        license_plate_number = 'ZYD6922',
        make = 'Toyota',
        registered_state = 'PA',
        vin = '5TFLA5ECXRX032601',
        vehicle_id = '32601',
        vehicle_year = 2024,
        notes = 'Seeded from truck asset source files on 2026-03-23'
    where unit_number = 'AM3948';
  else
    insert into public.field_trucks (
      unit_number, vehicle_type, service_status, current_driver, model,
      license_plate_number, make, registered_state, vin, vehicle_id, vehicle_year, notes
    ) values (
      'AM3948', 'Pickup', 'Available', '', 'Tundra',
      'ZYD6922', 'Toyota', 'PA', '5TFLA5ECXRX032601', '32601', 2024, 'Seeded from truck asset source files on 2026-03-23'
    );
  end if;

  if exists (select 1 from public.field_trucks where unit_number = 'AM5461') then
    update public.field_trucks
    set vehicle_type = 'Service Truck',
        service_status = 'Available',
        current_driver = '',
        model = 'F-350',
        license_plate_number = 'WVR5246',
        make = 'Ford',
        registered_state = 'TX',
        vin = '1FDRF3HT8SED23235',
        vehicle_id = '23235',
        vehicle_year = 2025,
        notes = 'Seeded from truck asset source files on 2026-03-23'
    where unit_number = 'AM5461';
  else
    insert into public.field_trucks (
      unit_number, vehicle_type, service_status, current_driver, model,
      license_plate_number, make, registered_state, vin, vehicle_id, vehicle_year, notes
    ) values (
      'AM5461', 'Service Truck', 'Available', '', 'F-350',
      'WVR5246', 'Ford', 'TX', '1FDRF3HT8SED23235', '23235', 2025, 'Seeded from truck asset source files on 2026-03-23'
    );
  end if;
end
$$;
