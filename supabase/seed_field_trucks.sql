do $$
begin
  if exists (select 1 from public.field_trucks where unit_number = 'AM2663') then
    update public.field_trucks
    set vehicle_type = 'Pickup',
        plate_vin = 'KDM492 / 2GCVKNEC6K1229385',
        assigned_region = 'Pittsburgh',
        odometer = 123505,
        service_status = 'In Use',
        last_service_date = date '2025-08-01',
        workflow = 'On Duty',
        gps_id = 'G9YV05468J0Z',
        gps_status = 'Active',
        gvwr = 7200,
        business_unit = 'Measurement',
        primary_use = 'Lab Sample Technician',
        assigned_to = 'Dakota Moore',
        current_driver = 'Dakota Moore',
        duty = '1/2 Ton Pickup',
        model = '1500',
        vehicle_information = 'AMI',
        lease_company = 'Enterprise',
        lease_begin_date = date '2020-01-06',
        delivery_date = date '2020-01-06',
        lease_end_date = date '2022-02-06',
        returned_date = null,
        license_plate_number = 'KDM492',
        make = 'Chevrolet',
        ownership = 'Leased',
        registered_state = 'OK',
        registration_expiration_date = date '2026-12-31',
        state_insurance_expiration_date = date '2026-10-01',
        vin = '2GCVKNEC6K1229385',
        vehicle_id = '29385',
        vehicle_year = 2019,
        notes = 'Seeded from truck asset source files on 2026-03-23'
    where unit_number = 'AM2663';
  else
    insert into public.field_trucks (
      unit_number, vehicle_type, plate_vin, assigned_region, odometer, service_status, last_service_date,
      workflow, gps_id, gps_status, gvwr, business_unit, primary_use, assigned_to, current_driver, duty,
      model, vehicle_information, lease_company, lease_begin_date, delivery_date, lease_end_date, returned_date,
      license_plate_number, make, ownership, registered_state, registration_expiration_date, state_insurance_expiration_date,
      vin, vehicle_id, vehicle_year, notes
    ) values (
      'AM2663', 'Pickup', 'KDM492 / 2GCVKNEC6K1229385', 'Pittsburgh', 123505, 'In Use', date '2025-08-01',
      'On Duty', 'G9YV05468J0Z', 'Active', 7200, 'Measurement', 'Lab Sample Technician', 'Dakota Moore', 'Dakota Moore', '1/2 Ton Pickup',
      '1500', 'AMI', 'Enterprise', date '2020-01-06', date '2020-01-06', date '2022-02-06', null,
      'KDM492', 'Chevrolet', 'Leased', 'OK', date '2026-12-31', date '2026-10-01',
      '2GCVKNEC6K1229385', '29385', 2019, 'Seeded from truck asset source files on 2026-03-23'
    );
  end if;

  if exists (select 1 from public.field_trucks where unit_number = 'AM2697') then
    update public.field_trucks
    set vehicle_type = 'Pickup',
        plate_vin = 'ZYE3956 / 1GCUYDED0MZ440377',
        assigned_region = 'Pittsburgh',
        odometer = 79318,
        service_status = 'Available',
        last_service_date = date '2025-10-24',
        workflow = 'Pool',
        gps_id = 'G9S65K2EJ0NA',
        gps_status = 'Active',
        gvwr = 7100,
        business_unit = 'Energy Lab',
        primary_use = 'Lab Sample Technician',
        assigned_to = 'Lab Sample Technician/Pool',
        current_driver = '',
        duty = '1/2 Ton Pickup',
        model = '1500',
        vehicle_information = 'SPL',
        lease_company = 'Enterprise',
        lease_begin_date = date '2022-06-27',
        delivery_date = date '2022-06-27',
        lease_end_date = date '2024-07-27',
        returned_date = null,
        license_plate_number = 'ZYE3956',
        make = 'Chevrolet',
        ownership = 'Leased',
        registered_state = 'PA',
        registration_expiration_date = date '2026-07-31',
        state_insurance_expiration_date = date '2026-10-01',
        vin = '1GCUYDED0MZ440377',
        vehicle_id = '40377',
        vehicle_year = 2021,
        notes = 'Seeded from truck asset source files on 2026-03-23'
    where unit_number = 'AM2697';
  else
    insert into public.field_trucks (
      unit_number, vehicle_type, plate_vin, assigned_region, odometer, service_status, last_service_date,
      workflow, gps_id, gps_status, gvwr, business_unit, primary_use, assigned_to, current_driver, duty,
      model, vehicle_information, lease_company, lease_begin_date, delivery_date, lease_end_date, returned_date,
      license_plate_number, make, ownership, registered_state, registration_expiration_date, state_insurance_expiration_date,
      vin, vehicle_id, vehicle_year, notes
    ) values (
      'AM2697', 'Pickup', 'ZYE3956 / 1GCUYDED0MZ440377', 'Pittsburgh', 79318, 'Available', date '2025-10-24',
      'Pool', 'G9S65K2EJ0NA', 'Active', 7100, 'Energy Lab', 'Lab Sample Technician', 'Lab Sample Technician/Pool', '', '1/2 Ton Pickup',
      '1500', 'SPL', 'Enterprise', date '2022-06-27', date '2022-06-27', date '2024-07-27', null,
      'ZYE3956', 'Chevrolet', 'Leased', 'PA', date '2026-07-31', date '2026-10-01',
      '1GCUYDED0MZ440377', '40377', 2021, 'Seeded from truck asset source files on 2026-03-23'
    );
  end if;

  if exists (select 1 from public.field_trucks where unit_number = 'AM2713') then
    update public.field_trucks
    set vehicle_type = 'Pickup',
        plate_vin = '685DSG / 1FTEW1EB5MFD11172',
        assigned_region = 'Pittsburgh',
        odometer = 155844,
        service_status = 'Available',
        last_service_date = date '2025-11-25',
        workflow = 'Pool',
        gps_id = 'G9HY78F7FH9R',
        gps_status = 'Inactive',
        gvwr = 7050,
        business_unit = 'Measurement',
        primary_use = 'Lab Sample Technician',
        assigned_to = 'Lab GC/Pool',
        current_driver = '',
        duty = '1/2 Ton Pickup',
        model = 'F-150',
        vehicle_information = 'AMI',
        lease_company = 'Enterprise',
        lease_begin_date = date '2022-03-23',
        delivery_date = date '2022-03-23',
        lease_end_date = date '2024-04-23',
        returned_date = null,
        license_plate_number = '685DSG',
        make = 'Ford',
        ownership = 'Leased',
        registered_state = 'ND',
        registration_expiration_date = date '2026-11-30',
        state_insurance_expiration_date = date '2026-10-01',
        vin = '1FTEW1EB5MFD11172',
        vehicle_id = '11172',
        vehicle_year = 2021,
        notes = 'Seeded from truck asset source files on 2026-03-23'
    where unit_number = 'AM2713';
  else
    insert into public.field_trucks (
      unit_number, vehicle_type, plate_vin, assigned_region, odometer, service_status, last_service_date,
      workflow, gps_id, gps_status, gvwr, business_unit, primary_use, assigned_to, current_driver, duty,
      model, vehicle_information, lease_company, lease_begin_date, delivery_date, lease_end_date, returned_date,
      license_plate_number, make, ownership, registered_state, registration_expiration_date, state_insurance_expiration_date,
      vin, vehicle_id, vehicle_year, notes
    ) values (
      'AM2713', 'Pickup', '685DSG / 1FTEW1EB5MFD11172', 'Pittsburgh', 155844, 'Available', date '2025-11-25',
      'Pool', 'G9HY78F7FH9R', 'Inactive', 7050, 'Measurement', 'Lab Sample Technician', 'Lab GC/Pool', '', '1/2 Ton Pickup',
      'F-150', 'AMI', 'Enterprise', date '2022-03-23', date '2022-03-23', date '2024-04-23', null,
      '685DSG', 'Ford', 'Leased', 'ND', date '2026-11-30', date '2026-10-01',
      '1FTEW1EB5MFD11172', '11172', 2021, 'Seeded from truck asset source files on 2026-03-23'
    );
  end if;

  if exists (select 1 from public.field_trucks where unit_number = 'AM2889') then
    update public.field_trucks
    set vehicle_type = 'Service Truck',
        plate_vin = 'A17077 / 1M2MDBAA5PS004872',
        assigned_region = 'Pittsburgh',
        odometer = 61044,
        service_status = 'Available',
        last_service_date = date '2025-10-23',
        workflow = 'Pool',
        gps_id = 'G9896P0CB3N9',
        gps_status = 'Active',
        gvwr = 25995,
        business_unit = 'Measurement',
        primary_use = 'Liquids Piston Prover',
        assigned_to = 'Liquids Piston Prover/Pool',
        current_driver = '',
        duty = 'Heavy Duty Truck',
        model = 'MD64',
        vehicle_information = 'Volumetrics',
        lease_company = '',
        lease_begin_date = null,
        delivery_date = null,
        lease_end_date = null,
        returned_date = null,
        license_plate_number = 'A17077',
        make = 'Mack',
        ownership = 'Owned',
        registered_state = 'WY',
        registration_expiration_date = date '2026-06-30',
        state_insurance_expiration_date = date '2026-10-01',
        vin = '1M2MDBAA5PS004872',
        vehicle_id = '04872',
        vehicle_year = 2023,
        notes = 'Seeded from truck asset source files on 2026-03-23'
    where unit_number = 'AM2889';
  else
    insert into public.field_trucks (
      unit_number, vehicle_type, plate_vin, assigned_region, odometer, service_status, last_service_date,
      workflow, gps_id, gps_status, gvwr, business_unit, primary_use, assigned_to, current_driver, duty,
      model, vehicle_information, lease_company, lease_begin_date, delivery_date, lease_end_date, returned_date,
      license_plate_number, make, ownership, registered_state, registration_expiration_date, state_insurance_expiration_date,
      vin, vehicle_id, vehicle_year, notes
    ) values (
      'AM2889', 'Service Truck', 'A17077 / 1M2MDBAA5PS004872', 'Pittsburgh', 61044, 'Available', date '2025-10-23',
      'Pool', 'G9896P0CB3N9', 'Active', 25995, 'Measurement', 'Liquids Piston Prover', 'Liquids Piston Prover/Pool', '', 'Heavy Duty Truck',
      'MD64', 'Volumetrics', '', null, null, null, null,
      'A17077', 'Mack', 'Owned', 'WY', date '2026-06-30', date '2026-10-01',
      '1M2MDBAA5PS004872', '04872', 2023, 'Seeded from truck asset source files on 2026-03-23'
    );
  end if;

  if exists (select 1 from public.field_trucks where unit_number = 'AM3948') then
    update public.field_trucks
    set vehicle_type = 'Pickup',
        plate_vin = 'ZYD6922 / 5TFLA5ECXRX032601',
        assigned_region = 'Pittsburgh',
        odometer = 27986,
        service_status = 'Available',
        last_service_date = date '2025-10-24',
        workflow = 'Pool',
        gps_id = 'G9ZZ1A08TW5S',
        gps_status = 'Active',
        gvwr = 7340,
        business_unit = 'Environmental Lab',
        primary_use = 'Environmental Measurement',
        assigned_to = 'Environmental Measurement/Pool',
        current_driver = '',
        duty = '1/2 Ton Pickup',
        model = 'Tundra',
        vehicle_information = 'SPL',
        lease_company = 'Enterprise',
        lease_begin_date = date '2024-08-05',
        delivery_date = date '2024-08-05',
        lease_end_date = date '2027-09-05',
        returned_date = null,
        license_plate_number = 'ZYD6922',
        make = 'Toyota',
        ownership = 'Leased',
        registered_state = 'PA',
        registration_expiration_date = date '2026-07-31',
        state_insurance_expiration_date = date '2026-10-01',
        vin = '5TFLA5ECXRX032601',
        vehicle_id = '32601',
        vehicle_year = 2024,
        notes = 'Seeded from truck asset source files on 2026-03-23'
    where unit_number = 'AM3948';
  else
    insert into public.field_trucks (
      unit_number, vehicle_type, plate_vin, assigned_region, odometer, service_status, last_service_date,
      workflow, gps_id, gps_status, gvwr, business_unit, primary_use, assigned_to, current_driver, duty,
      model, vehicle_information, lease_company, lease_begin_date, delivery_date, lease_end_date, returned_date,
      license_plate_number, make, ownership, registered_state, registration_expiration_date, state_insurance_expiration_date,
      vin, vehicle_id, vehicle_year, notes
    ) values (
      'AM3948', 'Pickup', 'ZYD6922 / 5TFLA5ECXRX032601', 'Pittsburgh', 27986, 'Available', date '2025-10-24',
      'Pool', 'G9ZZ1A08TW5S', 'Active', 7340, 'Environmental Lab', 'Environmental Measurement', 'Environmental Measurement/Pool', '', '1/2 Ton Pickup',
      'Tundra', 'SPL', 'Enterprise', date '2024-08-05', date '2024-08-05', date '2027-09-05', null,
      'ZYD6922', 'Toyota', 'Leased', 'PA', date '2026-07-31', date '2026-10-01',
      '5TFLA5ECXRX032601', '32601', 2024, 'Seeded from truck asset source files on 2026-03-23'
    );
  end if;

  if exists (select 1 from public.field_trucks where unit_number = 'AM5461') then
    update public.field_trucks
    set vehicle_type = 'Service Truck',
        plate_vin = 'WVR5246 / 1FDRF3HT8SED23235',
        assigned_region = 'Pittsburgh',
        odometer = 85967,
        service_status = 'Available',
        last_service_date = date '2025-11-19',
        workflow = 'Pool',
        gps_id = 'G91R14RUJ9A9',
        gps_status = 'Active',
        gvwr = 14000,
        business_unit = 'Measurement',
        primary_use = 'Liquids Prover',
        assigned_to = 'Liquids Prover/Pool',
        current_driver = '',
        duty = '1 Ton Pickup',
        model = 'F-350',
        vehicle_information = 'SPL',
        lease_company = 'Enterprise',
        lease_begin_date = date '2025-06-27',
        delivery_date = date '2025-06-27',
        lease_end_date = date '2027-12-27',
        returned_date = null,
        license_plate_number = 'WVR5246',
        make = 'Ford',
        ownership = 'Leased',
        registered_state = 'TX',
        registration_expiration_date = date '2026-06-30',
        state_insurance_expiration_date = date '2026-10-01',
        vin = '1FDRF3HT8SED23235',
        vehicle_id = '23235',
        vehicle_year = 2025,
        notes = 'Seeded from truck asset source files on 2026-03-23'
    where unit_number = 'AM5461';
  else
    insert into public.field_trucks (
      unit_number, vehicle_type, plate_vin, assigned_region, odometer, service_status, last_service_date,
      workflow, gps_id, gps_status, gvwr, business_unit, primary_use, assigned_to, current_driver, duty,
      model, vehicle_information, lease_company, lease_begin_date, delivery_date, lease_end_date, returned_date,
      license_plate_number, make, ownership, registered_state, registration_expiration_date, state_insurance_expiration_date,
      vin, vehicle_id, vehicle_year, notes
    ) values (
      'AM5461', 'Service Truck', 'WVR5246 / 1FDRF3HT8SED23235', 'Pittsburgh', 85967, 'Available', date '2025-11-19',
      'Pool', 'G91R14RUJ9A9', 'Active', 14000, 'Measurement', 'Liquids Prover', 'Liquids Prover/Pool', '', '1 Ton Pickup',
      'F-350', 'SPL', 'Enterprise', date '2025-06-27', date '2025-06-27', date '2027-12-27', null,
      'WVR5246', 'Ford', 'Leased', 'TX', date '2026-06-30', date '2026-10-01',
      '1FDRF3HT8SED23235', '23235', 2025, 'Seeded from truck asset source files on 2026-03-23'
    );
  end if;
end
$$;
