const STORAGE_KEY = 'field-ops-dashboard-data';
const AUTO_REFRESH_MS = 15000;
const ENTITY_ORDER = ['clients', 'projects', 'contacts', 'contactProjects', 'contactSites', 'billingProfiles', 'priceItems', 'billingProfilePrices', 'siteTypes', 'sites', 'siteProjects', 'jobTypes', 'siteTypeJobTypes', 'jobs', 'jobSites', 'jobAssignments', 'partCatalogs', 'parts', 'jobParts', 'partActivity', 'fieldRoutes', 'routePlaceLists', 'routePlaces', 'restrictedRoads', 'fieldRouteStops', 'fieldRouteStopJobs', 'employees', 'splSites', 'technicianTravel', 'trucks', 'trailers', 'equipment', 'samples', 'maintenanceRecords'];
const FIELD_ASSET_BUCKET = 'field-assets';
const ASSET_PHOTO_ENTITY_KEYS = ['clients', 'trucks', 'trailers', 'equipment'];
const DEFAULT_ASSET_ICON_PATHS = {
  truckPickup:'assets/truck-icon-pickup.png',
  truckService:'assets/truck-icon-service.png',
  trailer:'assets/trailer-icon-box.png'
};
const FIELD_OPS_STANDALONE_MODE = String(window.FIELD_OPS_STANDALONE_MODE || '').toLowerCase();
const IS_CLIENTS_STANDALONE = FIELD_OPS_STANDALONE_MODE === 'clients';
const LOCAL_SPL_SITE = 'Pittsburgh';
const LOCAL_SPL_SITE_CODE = 'PITTSBURGH';

const ACCOUNT_STATUS_OPTIONS = ['Active', 'Pending', 'On Hold', 'Inactive'];
const CLIENT_SECTOR_OPTIONS = ['Upstream', 'Midstream', 'Downstream', 'Other'];
const SERVICE_SCOPE_OPTIONS = ['Field', 'Lab', 'Both'];
const PROJECT_STATUS_OPTIONS = ['Planning', 'Active', 'On Hold', 'Complete', 'Inactive'];
const CONTACT_SCOPE_OPTIONS = ['Operations', 'Billing', 'Site', 'Field', 'Lab'];
const SITE_STATUS_OPTIONS = ['Active', 'Restricted', 'Inactive'];
const JOB_STATUS_OPTIONS = ['New', 'Scheduled', 'Dispatched', 'In Progress', 'Waiting', 'Complete', 'Closed', 'Canceled'];
const PRIORITY_OPTIONS = ['Low', 'Normal', 'High', 'Urgent'];
const CUSTODY_OPTIONS = ['Allocation', 'Custody', 'Both'];
const ASSIGNMENT_TYPE_OPTIONS = ['Technician', 'Truck', 'Trailer', 'Equipment'];
const WORK_SCOPE_OPTIONS = ['Lab', 'Field', 'Both'];
const LAB_ROLE_OPTIONS = ['Lab Tech', 'Senior Lab Tech', 'Lab Lead', 'Lab Supervisor'];
const FIELD_ROLE_OPTIONS = ['Field Tech', 'Senior Field Tech', 'Supervisor', 'Manager'];
const TRUCK_TYPE_OPTIONS = ['Pickup', 'Service Truck', 'Other'];
const FUEL_TYPE_OPTIONS = ['Gasoline', 'Diesel', 'Hybrid', 'Electric', 'Other'];
const VEHICLE_STATUS_OPTIONS = ['Available', 'In Use', 'Maintenance', 'Out of Service'];
const TRUCK_INSPECTION_WARNING_DAYS = 30;
const TRAILER_STATUS_OPTIONS = ['Available', 'Assigned', 'In Use', 'Maintenance', 'Out of Service'];
const EQUIPMENT_TYPE_OPTIONS = ['Small Volume Prover', 'Master Meter', 'Regulator', 'Hose Set', 'Sampling Equipment', 'Tooling', 'Other'];
const CALIBRATION_STATUS_OPTIONS = ['Current', 'Due Soon', 'Overdue'];
const EQUIPMENT_STATUS_OPTIONS = ['Available', 'Assigned', 'In Use', 'Needs Repair', 'Out of Service'];
const SAMPLE_TYPE_OPTIONS = ['Gas', 'Liquid', 'Condensate', 'Other'];
const CONTAINER_TYPE_OPTIONS = ['Cylinder', 'Bottle', 'Other'];
const SAMPLE_STATUS_OPTIONS = ['Requested', 'Collected', 'In Transit', 'Delivered', 'Logged In', 'Complete', 'Exception'];
const LAB_RECEIPT_STATUS_OPTIONS = ['Requested', 'Delivered', 'Logged In', 'Complete', 'Exception'];
const SAMPLE_WORKFLOW_STATUS_OPTIONS = ['Needs Pulled', 'Received by Lab'];
const MAINTENANCE_TYPE_OPTIONS = ['Preventive', 'Repair', 'Inspection', 'Calibration'];
const MAINTENANCE_STATUS_OPTIONS = ['Open', 'Scheduled', 'In Progress', 'Complete', 'Canceled'];
const ASSET_TYPE_OPTIONS = ['Truck', 'Trailer', 'Equipment'];
const VENDOR_INTERNAL_OPTIONS = ['Vendor', 'Internal'];
const FIELD_PART_CATEGORY_OPTIONS = ['Fittings', 'Valves', 'Gaskets / Seals', 'Tubing', 'Hoses', 'Meters', 'Electrical', 'Hardware', 'Consumables', 'Tools', 'Safety', 'Other'];
const FIELD_PART_VENDOR_OPTIONS = ['SPL Stock', 'Airgas', 'Amazon Business', 'Grainger', 'McMaster-Carr', 'Fastenal', 'Home Depot', 'Lowe\'s', 'Other'];
const FIELD_PART_UNIT_OPTIONS = ['Each', 'Box', 'Pack', 'Set', 'Kit', 'Foot', 'Roll', 'Case', 'Bag'];
const FIELD_PART_STORAGE_LOCATION_OPTIONS = ['Field Warehouse', 'Pittsburgh Shop', 'Service Truck', 'Trailer', 'Tool Room', 'Parts Cabinet', 'Client Site', 'Other'];
const FIELD_PART_CATALOG_TYPES = [
  { value:'category', label:'Category', plural:'Categories', fieldKey:'category', defaults:FIELD_PART_CATEGORY_OPTIONS },
  { value:'vendor', label:'Vendor', plural:'Vendors', fieldKey:'vendorName', defaults:FIELD_PART_VENDOR_OPTIONS },
  { value:'unit', label:'Unit', plural:'Units', fieldKey:'unitName', defaults:FIELD_PART_UNIT_OPTIONS },
  { value:'storage_location', label:'Storage Location', plural:'Storage Locations', fieldKey:'storageLocation', defaults:FIELD_PART_STORAGE_LOCATION_OPTIONS }
];
const TRAVEL_DIRECTION_OPTIONS = ['Inbound', 'Outbound'];
const TRAVEL_STATUS_OPTIONS = ['Planned', 'In Transit', 'On Site', 'Complete', 'Canceled'];
const TRAVEL_LOCATION_TYPE_OPTIONS = [
  { value:'spl_site', label:'SPL Site' },
  { value:'client_site', label:'Client Site' },
  { value:'other', label:'Other' }
];
const JOB_TYPE_SCHEDULE_MODE_OPTIONS = ['range', 'point_in_time'];
const JOB_PARTS_DETAIL_GROUP = 'job_parts';
const JOB_PARTS_DISABLED_DETAIL_GROUP = 'job_parts_disabled';
const JOB_TYPE_DETAIL_GROUP_OPTIONS = [
  { value:'proving', label:'Proving' },
  { value:'sample_logistics', label:'Sample Logistics' },
  { value:'maintenance', label:'Maintenance' },
  { value:'execution', label:'Execution' },
  { value:JOB_PARTS_DETAIL_GROUP, label:'Tools / Job Parts' }
];
const SITE_TYPE_STATUS_OPTIONS = [
  { value:'active', label:'Active' },
  { value:'inactive', label:'Inactive' }
];
const JOB_TYPE_STATUS_OPTIONS = [
  { value:'active', label:'Active' },
  { value:'inactive', label:'Inactive' }
];
const DEFAULT_SITE_TYPE_DEFS = [
  { siteTypeKey:'WELL_SITE', siteTypeName:'Well Site', isActive:true },
  { siteTypeKey:'METER_STATION', siteTypeName:'Meter Station', isActive:true },
  { siteTypeKey:'FIELD_SITE', siteTypeName:'Field Site', isActive:true },
  { siteTypeKey:'WELL_PAD', siteTypeName:'Well Pad', isActive:true },
  { siteTypeKey:'LACT_UNIT', siteTypeName:'LACT Unit', isActive:true },
  { siteTypeKey:'FACILITY', siteTypeName:'Facility', isActive:true },
  { siteTypeKey:'PIPELINE_LOCATION', siteTypeName:'Pipeline Location', isActive:true },
  { siteTypeKey:'OFFICE_YARD', siteTypeName:'Office / Yard', isActive:true },
  { siteTypeKey:'OTHER', siteTypeName:'Other', isActive:true }
];
const STANDARD_JOB_TYPE_COLORS = ['#f56584', '#ffa29f', '#ffff97', '#cdff82', '#8afcc3', '#90eeff', '#d683fc', '#ff8af3'];
const DEFAULT_JOB_TYPE_COLOR = STANDARD_JOB_TYPE_COLORS[0];
const JOB_TYPE_COLOR_OPTIONS = STANDARD_JOB_TYPE_COLORS.map((color) => ({ value:color, label:color }));
const DEFAULT_JOB_TYPE_DEFS = [
  { jobTypeKey:'ALLOCATION_PROVING', jobTypeName:'Allocation Proving', jobTypeColor:STANDARD_JOB_TYPE_COLORS[0], isActive:true, allowMultipleSites:false, scheduleMode:'range', requiredAssignmentTypes:['Technician', 'Truck', 'Equipment'], detailGroups:['proving', 'execution', JOB_PARTS_DETAIL_GROUP] },
  { jobTypeKey:'LACT_PROVING', jobTypeName:'LACT Proving', jobTypeColor:STANDARD_JOB_TYPE_COLORS[1], isActive:true, allowMultipleSites:true, scheduleMode:'range', requiredAssignmentTypes:['Technician', 'Truck', 'Equipment'], detailGroups:['proving', 'execution', JOB_PARTS_DETAIL_GROUP] },
  { jobTypeKey:'SAMPLE_PICKUP', jobTypeName:'Sample Pickup', jobTypeColor:STANDARD_JOB_TYPE_COLORS[2], isActive:true, allowMultipleSites:false, scheduleMode:'point_in_time', requiredAssignmentTypes:['Technician', 'Truck'], detailGroups:['sample_logistics', 'execution', JOB_PARTS_DETAIL_GROUP] },
  { jobTypeKey:'SAMPLE_DROP_OFF', jobTypeName:'Sample Drop-Off', jobTypeColor:STANDARD_JOB_TYPE_COLORS[3], isActive:true, allowMultipleSites:false, scheduleMode:'point_in_time', requiredAssignmentTypes:['Technician', 'Truck'], detailGroups:['sample_logistics', 'execution', JOB_PARTS_DETAIL_GROUP] },
  { jobTypeKey:'MAINTENANCE', jobTypeName:'Maintenance', jobTypeColor:STANDARD_JOB_TYPE_COLORS[4], isActive:true, allowMultipleSites:false, scheduleMode:'range', requiredAssignmentTypes:[], detailGroups:['maintenance', 'execution', JOB_PARTS_DETAIL_GROUP] },
  { jobTypeKey:'MULTI_SERVICE', jobTypeName:'Multi-Service', jobTypeColor:STANDARD_JOB_TYPE_COLORS[5], isActive:true, allowMultipleSites:false, scheduleMode:'range', requiredAssignmentTypes:[], detailGroups:['proving', 'sample_logistics', 'maintenance', 'execution', JOB_PARTS_DETAIL_GROUP] }
];
const LAB_WIP_WORK_ORDER_STORAGE_KEY = 'lab-wip-workorders';
const TEST_DEFINITION_STORAGE_KEY = 'lab-wip-test-definitions';
const DEFAULT_LAB_TEST_DEFS = [
  { key:'AS-BFV_DENSITY', label:'AS-BFV_DENSITY', shortLabel:'DENS', matrixType:'Liquid' },
  { key:'AS-BFV_MW', label:'AS-BFV_MW', shortLabel:'MW', matrixType:'Liquid' },
  { key:'C6GAS', label:'C6GAS', shortLabel:'C6GAS', matrixType:'Gas' },
  { key:'GC-BFVC6MZ', label:'GC-BFVC6MZ', shortLabel:'BFVC6', matrixType:'Liquid' },
  { key:'GC-BFVC7MZ', label:'GC-BFVC7MZ', shortLabel:'BFVC7', matrixType:'Liquid' },
  { key:'GC-BFVC10MZ', label:'GC-BFVC10MZ', shortLabel:'BFVC10', matrixType:'Liquid' },
  { key:'GC-2103-C10MZ', label:'GC-2103-C10MZ', shortLabel:'GC2103', matrixType:'Gas' },
  { key:'C6LIQ', label:'C6LIQ', shortLabel:'C6LIQ', matrixType:'Liquid' },
  { key:'C10LIQ', label:'C10LIQ', shortLabel:'C10LIQ', matrixType:'Liquid' }
];
const BILLING_RATE_EFFECTIVE_YEAR = 2026;
const DEFAULT_BILLING_PRICE_ITEMS = [
  { itemKey:'LIQUID_ASTMD156_SAYBOLT_COLOR', priceSection:'Liquid Samples', category:'Liquid', method:'ASTM D156', description:'Saybolt Color', unitName:'Per Sample', sortOrder:10 },
  { itemKey:'LIQUID_ASTMD1838_COPPER_STRIP_CORROSION', priceSection:'Liquid Samples', category:'Liquid', method:'ASTM D1838', description:'Copper Strip Corrosion (LPG, 1 hr @ 100F)', unitName:'Per Sample', sortOrder:20 },
  { itemKey:'LIQUID_ASTMD5453_SULPHUR_LIGHT_HYDROCARBON_LIQUIDS', priceSection:'Liquid Samples', category:'Liquid', method:'ASTM D5453', description:'Sulphur - Light Hydrocarbon Liquids (UVF)', unitName:'Per Sample', sortOrder:30 },
  { itemKey:'LIQUID_ASTMD6378_VAPOR_PRESSURE', priceSection:'Liquid Samples', category:'Liquid', method:'ASTM D6378', description:'Vapor Pressure (VP4, V/L @ 37.8C)', unitName:'Per Sample', sortOrder:40 },
  { itemKey:'LIQUID_ASTMD86_DISTILLATION', priceSection:'Liquid Samples', category:'Liquid', method:'ASTM D86', description:'Distillation of Petroleum Products', unitName:'Per Sample', sortOrder:50 },
  { itemKey:'LIQUID_ASTMD6667_SULFUR_LPG', priceSection:'Liquid Samples', category:'Liquid', method:'ASTM D6667', description:'Sulfur in LPG (UVF)', unitName:'Per Sample', sortOrder:60 },
  { itemKey:'LIQUID_GPA2186_C10_PLUS', priceSection:'Liquid Samples', category:'Liquid', method:'GPA 2186', description:'C10+', unitName:'Per Sample', sortOrder:70 },
  { itemKey:'LIQUID_GPA2177_C6_PLUS', priceSection:'Liquid Samples', category:'Liquid', method:'GPA 2177', description:'C6+ Liquid', unitName:'Per Sample', sortOrder:80 },
  { itemKey:'LIQUID_ASTMD2163_C1_C5_LPG', priceSection:'Liquid Samples', category:'Liquid', method:'ASTM D2163', description:'C1-C5 LPG (Propane/Propene)', unitName:'Per Sample', sortOrder:90 },
  { itemKey:'LIQUID_ASTMD6377_CRUDE_OIL_VAPOR_PRESSURE', priceSection:'Liquid Samples', category:'Liquid', method:'ASTM D6377', description:'Crude Oil Vapor Pressure', unitName:'Per Sample', sortOrder:100 },
  { itemKey:'LIQUID_ASTMD6377_CRUDE_OIL_VAPOR_PRESSURE_PRESSURIZED', priceSection:'Liquid Samples', category:'Liquid', method:'ASTM D6377', description:'Crude Oil Vapor Pressure (Pressurized)', unitName:'Per Sample', sortOrder:110 },
  { itemKey:'LIQUID_ASTMD7423_ORGANIC_OXYGENATES', priceSection:'Liquid Samples', category:'Liquid', method:'ASTM D7423', description:'Organic Oxygenates (C2-C5)', unitName:'Per Sample', sortOrder:120 },
  { itemKey:'LIQUID_ASTMD7423_METHANOL_ONLY', priceSection:'Liquid Samples', category:'Liquid', method:'ASTM D7423', description:'Methanol Only', unitName:'Per Sample', sortOrder:130 },
  { itemKey:'LIQUID_SPL_SAMPLE_DISPOSAL_RECYCLING', priceSection:'Liquid Samples', category:'Liquid', method:'SPL', description:'Sample Disposal & Recycling', unitName:'Per Sample', sortOrder:140 },
  { itemKey:'GAS_ASTMD5504_H2S_CHEMILUMINESCENCE', priceSection:'Natural Gas Samples', category:'Gas', method:'ASTM D5504', description:'H2S by Chemiluminescence', unitName:'Per Sample', sortOrder:150 },
  { itemKey:'GAS_ASTMD6667_SULFUR_LPG_NATURAL_GAS', priceSection:'Natural Gas Samples', category:'Gas', method:'ASTM D6667', description:'Sulfur in LPG & Natural Gas (UVF)', unitName:'Per Sample', sortOrder:160 },
  { itemKey:'GAS_GPA2286M_EXTENDED_ANALYSIS', priceSection:'Natural Gas Samples', category:'Gas', method:'GPA 2286M', description:'Extended Analysis (C1-C14+, BTU, RD, O2)', unitName:'Per Sample', sortOrder:170 },
  { itemKey:'GAS_GPA2261_ANALYSIS', priceSection:'Natural Gas Samples', category:'Gas', method:'GPA 2261', description:'Gas Analysis (C1-C6+, BTU, RD)', unitName:'Per Sample', sortOrder:180 },
  { itemKey:'GAS_GPA2261_ANALYSIS_O2', priceSection:'Natural Gas Samples', category:'Gas', method:'GPA 2261', description:'Gas Analysis (C1-C6+, BTU, RD, O2)', unitName:'Per Sample', sortOrder:190 },
  { itemKey:'GAS_ASTMD4810_H2S_STAINED_TUBE_FIELD', priceSection:'Natural Gas Samples', category:'Gas', method:'ASTM D4810', description:'H2S - Stained Tube (Field)', unitName:'Per Sample', sortOrder:200 },
  { itemKey:'GAS_GPA2199_CAPILLARY_GC_SULFUR_CLD', priceSection:'Natural Gas Samples', category:'Gas', method:'GPA 2199', description:'Capillary GC + Sulfur CLD', unitName:'Per Sample', sortOrder:210 },
  { itemKey:'GAS_ASTMD1946_REFORMED_GAS_COMPOSITION', priceSection:'Natural Gas Samples', category:'Gas', method:'ASTM D1946', description:'Reformed Gas Composition', unitName:'Per Sample', sortOrder:220 },
  { itemKey:'FIELD_VEHICLE_MILEAGE', priceSection:'Field & Labor', category:'Field', method:'', description:'Vehicle Mileage', unitName:'Per Mile', sortOrder:230 },
  { itemKey:'FIELD_SAMPLING_TECHNICIAN', priceSection:'Field & Labor', category:'Field', method:'', description:'Sampling Technician', unitName:'Per Hour', sortOrder:240 },
  { itemKey:'FIELD_SAMPLING_TECHNICIAN_OVERTIME', priceSection:'Field & Labor', category:'Field', method:'', description:'Sampling Technician - Overtime', unitName:'Per Hour', sortOrder:250 }
];

const PRIORITY_RANK = { Urgent:0, High:1, Normal:2, Low:3 };
const RESOURCE_ENTITY_BY_TYPE = { Technician:'employees', Truck:'trucks', Trailer:'trailers', Equipment:'equipment' };

const ENTITY_CONFIG = {
  clients:{ table:'field_clients', label:'Client', idPrefix:'client', defaults:{ clientName:'', clientCode:'', accountStatus:'Active', sector:'Upstream', serviceScope:'Field', primaryContact:'', contactPhone:'', contactEmail:'', billingNotes:'', operationalNotes:'', salesforceAccountId:'', defaultServiceArea:'', hqStreet:'', hqCity:'', hqState:'', hqZip:'', hqLatitude:null, hqLongitude:null, markerColor:'', assetPhotoPath:'', assetPhotoDataUrl:'', assetPhotoName:'', assetPhotoType:'' }, fieldMap:{ clientName:'client_name', clientCode:'client_code', accountStatus:'account_status', sector:'sector', serviceScope:'service_scope', primaryContact:'primary_contact', contactPhone:'contact_phone', contactEmail:'contact_email', billingNotes:'billing_notes', operationalNotes:'operational_notes', salesforceAccountId:'salesforce_account_id', defaultServiceArea:'default_service_area', hqStreet:'hq_street', hqCity:'hq_city', hqState:'hq_state', hqZip:'hq_zip', hqLatitude:'hq_latitude', hqLongitude:'hq_longitude', markerColor:'marker_color', assetPhotoPath:'logo_path' }, numberFields:['hqLatitude', 'hqLongitude'], localOnlyFields:['assetPhotoDataUrl', 'assetPhotoName', 'assetPhotoType'] },
  projects:{ table:'field_projects', label:'Project', idPrefix:'proj', defaults:{ clientId:'', projectName:'', serviceScope:'Field', projectStatus:'Active', notes:'' }, fieldMap:{ clientId:'client_id', projectName:'project_name', serviceScope:'service_scope', projectStatus:'project_status', notes:'notes' }, idFields:['clientId'] },
  contacts:{ table:'field_contacts', label:'Contact', idPrefix:'contact', defaults:{ clientId:'', projectId:'', siteId:'', projectIds:[], siteIds:[], managerContactId:'', contactFirstName:'', contactLastName:'', contactName:'', contactRole:'', phone:'', email:'', contactScope:'Operations', isPrimary:false, notes:'' }, fieldMap:{ clientId:'client_id', projectId:'project_id', siteId:'site_id', managerContactId:'manager_contact_id', contactFirstName:'contact_first_name', contactLastName:'contact_last_name', contactName:'contact_name', contactRole:'contact_role', phone:'phone', email:'email', contactScope:'contact_scope', isPrimary:'is_primary', notes:'notes' }, idFields:['clientId', 'projectId', 'siteId', 'managerContactId'], booleanFields:['isPrimary'], arrayFields:['projectIds', 'siteIds'], localOnlyFields:['projectIds', 'siteIds'] },
  contactProjects:{ table:'field_contact_projects', label:'Contact Project Link', idPrefix:'contactproj', defaults:{ contactId:'', projectId:'' }, fieldMap:{ contactId:'contact_id', projectId:'project_id' }, idFields:['contactId', 'projectId'] },
  contactSites:{ table:'field_contact_sites', label:'Contact Site Link', idPrefix:'contactsite', defaults:{ contactId:'', siteId:'' }, fieldMap:{ contactId:'contact_id', siteId:'site_id' }, idFields:['contactId', 'siteId'] },
  billingProfiles:{ table:'field_billing_profiles', label:'Billing Profile', idPrefix:'bill', defaults:{ clientId:'', projectId:'', billingContactId:'', billingName:'', billingAddress:'', billingEmail:'', billingPhone:'', poNumber:'', referenceNumber:'', invoiceNotes:'', fieldBillingNotes:'', labBillingNotes:'', isDefault:false }, fieldMap:{ clientId:'client_id', projectId:'project_id', billingContactId:'billing_contact_id', billingName:'billing_name', billingAddress:'billing_address', billingEmail:'billing_email', billingPhone:'billing_phone', poNumber:'po_number', referenceNumber:'reference_number', invoiceNotes:'invoice_notes', fieldBillingNotes:'field_billing_notes', labBillingNotes:'lab_billing_notes', isDefault:'is_default' }, idFields:['clientId', 'projectId', 'billingContactId'], booleanFields:['isDefault'] },
  priceItems:{ table:'billing_price_items', label:'Price Item', idPrefix:'priceitem', defaults:{ itemKey:'', priceSection:'', category:'', method:'', description:'', unitName:'Per Sample', sortOrder:0, isActive:true, notes:'' }, fieldMap:{ itemKey:'item_key', priceSection:'price_section', category:'category', method:'method', description:'description', unitName:'unit_name', sortOrder:'sort_order', isActive:'is_active', notes:'notes' }, numberFields:['sortOrder'], booleanFields:['isActive'] },
  billingProfilePrices:{ table:'field_billing_profile_prices', label:'Billing Profile Price', idPrefix:'billprice', defaults:{ billingProfileId:'', priceItemId:'', rateAmount:null, currencyCode:'USD', effectiveYear:BILLING_RATE_EFFECTIVE_YEAR, isActive:true, notes:'' }, fieldMap:{ billingProfileId:'billing_profile_id', priceItemId:'price_item_id', rateAmount:'rate_amount', currencyCode:'currency_code', effectiveYear:'effective_year', isActive:'is_active', notes:'notes' }, idFields:['billingProfileId', 'priceItemId'], numberFields:['rateAmount', 'effectiveYear'], booleanFields:['isActive'] },
  siteTypes:{ table:'field_site_types', label:'Site Type', idPrefix:'sitetype', defaults:{ siteTypeKey:'', siteTypeName:'', isActive:true, siteTypeStatus:'active', defaultJobTypes:[], notes:'' }, fieldMap:{ siteTypeKey:'site_type_key', siteTypeName:'site_type_name', isActive:'is_active', notes:'notes' }, booleanFields:['isActive'], arrayFields:['defaultJobTypes'], localOnlyFields:['siteTypeStatus', 'defaultJobTypes'] },
  sites:{ table:'field_sites', label:'Site/Location', idPrefix:'site', defaults:{ clientId:'', projectId:'', projectIds:[], siteName:'', siteType:'OTHER', physicalAddress:'', countyState:'', gpsCoordinates:'', accessInstructions:'', safetyPpeNotes:'', gateCodeEntryRequirements:'', clientSiteContact:'', accessRequired:false, approvedAccessLabel:'', approvedAccessLatitude:null, approvedAccessLongitude:null, approvedAccessNotes:'', siteStatus:'Active', standardJobTypes:'', notes:'' }, fieldMap:{ clientId:'client_id', projectId:'project_id', siteName:'site_name', siteType:'site_type', physicalAddress:'physical_address', countyState:'county_state', gpsCoordinates:'gps_coordinates', accessInstructions:'access_instructions', safetyPpeNotes:'safety_ppe_notes', gateCodeEntryRequirements:'gate_code_entry_requirements', clientSiteContact:'client_site_contact', accessRequired:'access_required', approvedAccessLabel:'approved_access_label', approvedAccessLatitude:'approved_access_latitude', approvedAccessLongitude:'approved_access_longitude', approvedAccessNotes:'approved_access_notes', siteStatus:'site_status', standardJobTypes:'standard_job_types', notes:'notes' }, idFields:['clientId', 'projectId'], arrayFields:['projectIds'], localOnlyFields:['projectIds'], numberFields:['approvedAccessLatitude', 'approvedAccessLongitude'], booleanFields:['accessRequired'] },
  siteProjects:{ table:'field_site_projects', label:'Site Project Link', idPrefix:'siteproj', defaults:{ siteId:'', projectId:'' }, fieldMap:{ siteId:'site_id', projectId:'project_id' }, idFields:['siteId', 'projectId'] },
  jobTypes:{ table:'field_job_types', label:'Job Type', idPrefix:'jobtype', defaults:{ jobTypeKey:'', jobTypeName:'', jobTypeColor:DEFAULT_JOB_TYPE_COLOR, isActive:true, jobTypeStatus:'active', labEmployeeEligible:false, allowMultipleSites:false, scheduleMode:'range', requiredAssignmentTypes:[], detailGroups:[] }, fieldMap:{ jobTypeKey:'job_type_key', jobTypeName:'job_type_name', jobTypeColor:'job_type_color', isActive:'is_active', labEmployeeEligible:'lab_employee_eligible', allowMultipleSites:'allow_multiple_sites', scheduleMode:'schedule_mode', requiredAssignmentTypes:'required_assignment_types', detailGroups:'detail_groups' }, booleanFields:['isActive', 'labEmployeeEligible', 'allowMultipleSites'], arrayFields:['requiredAssignmentTypes', 'detailGroups'], localOnlyFields:['jobTypeStatus'] },
  siteTypeJobTypes:{ table:'field_site_type_job_types', label:'Site Type Job Type Link', idPrefix:'sitetypejob', defaults:{ siteTypeKey:'', jobTypeKey:'' }, fieldMap:{ siteTypeKey:'site_type_key', jobTypeKey:'job_type_key' } },
  jobs:{ table:'field_jobs', label:'Job', idPrefix:'job', defaults:{ fieldfxTicketId:'', salesforceCaseId:'', salesforceCaseNumber:'', salesforceCaseUrl:'', salesforceSyncedAt:'', salesforceSyncStatus:'', salesforceSyncError:'', noTicketRequired:false, clientId:'', projectId:'', siteId:'', siteIds:[], jobType:'', priority:'Normal', requestedDate:'', scheduledStart:'', scheduledEnd:'', actualStart:'', actualEnd:'', durationPlanned:null, durationActual:null, scopeSummary:'', workInstructions:'', apiStandardReference:'', custodyAllocation:'Allocation', samplesRequired:false, meterUnitId:'', provingRequired:false, maintenanceRequired:false, clientContactForJob:'', dispatchNotes:'', completionNotes:'', followUpRequired:false, followUpNotes:'' }, fieldMap:{ fieldfxTicketId:'fieldfx_ticket_id', salesforceCaseId:'salesforce_case_id', salesforceCaseNumber:'salesforce_case_number', salesforceCaseUrl:'salesforce_case_url', salesforceSyncedAt:'salesforce_synced_at', salesforceSyncStatus:'salesforce_sync_status', salesforceSyncError:'salesforce_sync_error', noTicketRequired:'no_ticket_required', clientId:'client_id', projectId:'project_id', siteId:'site_id', jobType:'job_type', priority:'priority', requestedDate:'requested_date', scheduledStart:'scheduled_start', scheduledEnd:'scheduled_end', actualStart:'actual_start', actualEnd:'actual_end', durationPlanned:'duration_planned_minutes', durationActual:'duration_actual_minutes', scopeSummary:'scope_summary', workInstructions:'work_instructions', apiStandardReference:'api_standard_reference', custodyAllocation:'custody_allocation', samplesRequired:'samples_required', meterUnitId:'meter_unit_id', provingRequired:'proving_required', maintenanceRequired:'maintenance_required', clientContactForJob:'client_contact_for_job', dispatchNotes:'dispatch_notes', completionNotes:'completion_notes', followUpRequired:'follow_up_required', followUpNotes:'follow_up_notes' }, idFields:['clientId', 'projectId', 'siteId'], arrayFields:['siteIds'], localOnlyFields:['siteIds'], numberFields:['durationPlanned', 'durationActual'], booleanFields:['noTicketRequired', 'samplesRequired', 'provingRequired', 'maintenanceRequired', 'followUpRequired'], dateFields:['requestedDate'], dateTimeFields:['salesforceSyncedAt', 'scheduledStart', 'scheduledEnd', 'actualStart', 'actualEnd'] },
  jobSites:{ table:'field_job_sites', label:'Job Site Link', idPrefix:'jobsite', defaults:{ jobId:'', siteId:'', sortOrder:0 }, fieldMap:{ jobId:'job_id', siteId:'site_id', sortOrder:'sort_order' }, idFields:['jobId', 'siteId'], numberFields:['sortOrder'] },
  jobAssignments:{ table:'field_job_assignments', label:'Assignment', idPrefix:'asg', defaults:{ jobId:'', assignmentType:'Technician', resourceId:'' }, fieldMap:{ jobId:'job_id', assignmentType:'assignment_type', resourceId:'resource_id' }, idFields:['jobId', 'resourceId'] },
  partCatalogs:{ table:'field_part_catalogs', label:'Part List Value', idPrefix:'partcat', defaults:{ catalogType:'category', catalogValue:'', sortOrder:0, isActive:true, notes:'' }, fieldMap:{ catalogType:'catalog_type', catalogValue:'catalog_value', sortOrder:'sort_order', isActive:'is_active', notes:'notes' }, numberFields:['sortOrder'], booleanFields:['isActive'] },
  parts:{ table:'field_parts', label:'Part', idPrefix:'part', defaults:{ partKey:'', partNumber:'', partName:'', category:'', vendorName:'', vendorPartNumber:'', unitCost:null, unitName:'Each', storageLocation:'', onHandQuantity:0, reorderPoint:0, isActive:true, notes:'' }, fieldMap:{ partKey:'part_key', partNumber:'part_number', partName:'part_name', category:'category', vendorName:'vendor_name', vendorPartNumber:'vendor_part_number', unitCost:'unit_cost', unitName:'unit_name', storageLocation:'storage_location', onHandQuantity:'on_hand_quantity', reorderPoint:'reorder_point', isActive:'is_active', notes:'notes' }, numberFields:['unitCost', 'onHandQuantity', 'reorderPoint'], booleanFields:['isActive'] },
  jobParts:{ table:'field_job_parts', label:'Job Part', idPrefix:'jobpart', defaults:{ jobId:'', partId:'', quantity:1, partKeySnapshot:'', partNumberSnapshot:'', partNameSnapshot:'', unitCostSnapshot:null, unitNameSnapshot:'Each', notes:'' }, fieldMap:{ jobId:'job_id', partId:'part_id', quantity:'quantity', partKeySnapshot:'part_key_snapshot', partNumberSnapshot:'part_number_snapshot', partNameSnapshot:'part_name_snapshot', unitCostSnapshot:'unit_cost_snapshot', unitNameSnapshot:'unit_name_snapshot', notes:'notes' }, idFields:['jobId', 'partId'], numberFields:['quantity', 'unitCostSnapshot'] },
  partActivity:{ table:'field_part_activity', label:'Part Activity', idPrefix:'partact', defaults:{ partId:'', jobId:'', jobPartId:'', activityType:'', quantityDelta:0, quantityBefore:0, quantityAfter:0, notes:'' }, fieldMap:{ partId:'part_id', jobId:'job_id', jobPartId:'job_part_id', activityType:'activity_type', quantityDelta:'quantity_delta', quantityBefore:'quantity_before', quantityAfter:'quantity_after', notes:'notes' }, idFields:['partId', 'jobId', 'jobPartId'], numberFields:['quantityDelta', 'quantityBefore', 'quantityAfter'] },
  fieldRoutes:{ table:'field_routes', label:'Route', idPrefix:'route', defaults:{ routeName:'', routeDate:'', routeStatus:'Draft', assignedTechnicianId:'', originType:'spl', originSiteId:'', originLabel:'SPL Pittsburgh', originValue:'', originLatitude:null, originLongitude:null, destinationType:'spl', destinationSiteId:'', destinationLabel:'SPL Pittsburgh', destinationValue:'', destinationLatitude:null, destinationLongitude:null, distanceMeters:null, durationSeconds:null, returnDistanceMeters:null, returnDurationSeconds:null, notes:'' }, fieldMap:{ routeName:'route_name', routeDate:'route_date', routeStatus:'route_status', assignedTechnicianId:'assigned_technician_id', originType:'origin_type', originSiteId:'origin_site_id', originLabel:'origin_label', originValue:'origin_value', originLatitude:'origin_latitude', originLongitude:'origin_longitude', destinationType:'destination_type', destinationSiteId:'destination_site_id', destinationLabel:'destination_label', destinationValue:'destination_value', destinationLatitude:'destination_latitude', destinationLongitude:'destination_longitude', distanceMeters:'distance_meters', durationSeconds:'duration_seconds', returnDistanceMeters:'return_distance_meters', returnDurationSeconds:'return_duration_seconds', notes:'notes' }, idFields:['assignedTechnicianId', 'originSiteId', 'destinationSiteId'], numberFields:['originLatitude', 'originLongitude', 'destinationLatitude', 'destinationLongitude', 'distanceMeters', 'durationSeconds', 'returnDistanceMeters', 'returnDurationSeconds'], dateFields:['routeDate'] },
  routePlaceLists:{ table:'field_route_place_lists', label:'Route Place List', idPrefix:'rplist', defaults:{ listName:'', listColor:'#6fe3ff', iconKey:'pin', isActive:true, notes:'' }, fieldMap:{ listName:'list_name', listColor:'list_color', iconKey:'icon_key', isActive:'is_active', notes:'notes' }, booleanFields:['isActive'] },
  routePlaces:{ table:'field_route_places', label:'Route Place', idPrefix:'rplace', defaults:{ listId:'', placeName:'', locationType:'address', addressValue:'', latitude:null, longitude:null, phone:'', websiteUrl:'', isActive:true, notes:'' }, fieldMap:{ listId:'list_id', placeName:'place_name', locationType:'location_type', addressValue:'address_value', latitude:'latitude', longitude:'longitude', phone:'phone', websiteUrl:'website_url', isActive:'is_active', notes:'notes' }, idFields:['listId'], numberFields:['latitude', 'longitude'], booleanFields:['isActive'] },
  restrictedRoads:{ table:'field_restricted_roads', label:'Restricted Road', idPrefix:'rroad', optional:true, defaults:{ roadName:'', isActive:true, clientId:'', siteId:'', polylinePoints:[], bufferMeters:75, notes:'' }, fieldMap:{ roadName:'road_name', isActive:'is_active', clientId:'client_id', siteId:'site_id', polylinePoints:'polyline_points', bufferMeters:'buffer_meters', notes:'notes' }, idFields:['clientId', 'siteId'], numberFields:['bufferMeters'], booleanFields:['isActive'], jsonFields:['polylinePoints'] },
  fieldRouteStops:{ table:'field_route_stops', label:'Route Stop', idPrefix:'rstop', defaults:{ routeId:'', siteId:'', stopType:'site', placeId:'', stopLabel:'', stopValue:'', stopLatitude:null, stopLongitude:null, stopOrder:0, legDistanceMeters:null, legDurationSeconds:null, stopNotes:'' }, fieldMap:{ routeId:'route_id', siteId:'site_id', stopType:'stop_type', placeId:'place_id', stopLabel:'stop_label', stopValue:'stop_value', stopLatitude:'stop_latitude', stopLongitude:'stop_longitude', stopOrder:'stop_order', legDistanceMeters:'leg_distance_meters', legDurationSeconds:'leg_duration_seconds', stopNotes:'stop_notes' }, idFields:['routeId', 'siteId', 'placeId'], numberFields:['stopLatitude', 'stopLongitude', 'stopOrder', 'legDistanceMeters', 'legDurationSeconds'] },
  fieldRouteStopJobs:{ table:'field_route_stop_jobs', label:'Route Stop Job', idPrefix:'rjob', defaults:{ routeStopId:'', jobId:'' }, fieldMap:{ routeStopId:'route_stop_id', jobId:'job_id' }, idFields:['routeStopId', 'jobId'] },
  employees:{ table:'employees', label:'Employee', idPrefix:'emp', defaults:{ employeeFirstName:'', employeeLastName:'', employeeName:'', homeSplSite:LOCAL_SPL_SITE, workScope:'Field', labRole:'', fieldRole:'Field Tech', canSampleTransport:false, isActive:true, phone:'', email:'', notes:'' }, fieldMap:{ employeeFirstName:'employee_first_name', employeeLastName:'employee_last_name', employeeName:'employee_name', homeSplSite:'home_spl_site', workScope:'work_scope', labRole:'lab_role', fieldRole:'field_role', canSampleTransport:'can_sample_transport', isActive:'is_active', phone:'phone', email:'email', notes:'notes' }, booleanFields:['canSampleTransport', 'isActive'] },
  splSites:{ table:'field_spl_sites', label:'SPL Site', idPrefix:'splsite', defaults:{ siteName:'', siteCode:'', locationLabel:'', streetAddress:'', city:'', state:'', zipCode:'', isActive:true, notes:'' }, fieldMap:{ siteName:'site_name', siteCode:'site_code', locationLabel:'location_label', streetAddress:'street_address', city:'city', state:'state', zipCode:'zip_code', isActive:'is_active', notes:'notes' }, booleanFields:['isActive'] },
  technicianTravel:{ table:'field_technician_travel', label:'Technician Travel', idPrefix:'travel', defaults:{ technicianId:'', direction:'Outbound', travelStatus:'Planned', originType:'spl_site', originSplSiteId:'', originClientSiteId:'', originLabel:'', originLocation:'', destinationType:'client_site', destinationSplSiteId:'', destinationClientSiteId:'', destinationLabel:'', destinationLocation:'', arrivalAt:'', departureAt:'', purpose:'', notes:'' }, fieldMap:{ technicianId:'technician_id', direction:'direction', travelStatus:'travel_status', originType:'origin_type', originSplSiteId:'origin_spl_site_id', originClientSiteId:'origin_client_site_id', originLabel:'origin_label', originLocation:'origin_location', destinationType:'destination_type', destinationSplSiteId:'destination_spl_site_id', destinationClientSiteId:'destination_client_site_id', destinationLabel:'destination_label', destinationLocation:'destination_location', arrivalAt:'arrival_at', departureAt:'departure_at', purpose:'purpose', notes:'notes' }, idFields:['technicianId', 'originSplSiteId', 'originClientSiteId', 'destinationSplSiteId', 'destinationClientSiteId'], dateTimeFields:['arrivalAt', 'departureAt'] },
  trucks:{ table:'field_trucks', label:'Truck', idPrefix:'truck', defaults:{ unitNumber:'', vehicleType:'Pickup', fuelType:'', serviceStatus:'Available', currentDriver:'', assignedTechnicianId:'', model:'', licensePlateNumber:'', make:'', color:'', registeredState:'', vin:'', vehicleId:'', vehicleYear:null, nextInspectionDue:'', assetPhotoPath:'', assetPhotoDataUrl:'', assetPhotoName:'', assetPhotoType:'', notes:'' }, fieldMap:{ unitNumber:'unit_number', vehicleType:'vehicle_type', fuelType:'fuel_type', serviceStatus:'service_status', currentDriver:'current_driver', assignedTechnicianId:'assigned_technician_id', model:'model', licensePlateNumber:'license_plate_number', make:'make', color:'color', registeredState:'registered_state', vin:'vin', vehicleId:'vehicle_id', vehicleYear:'vehicle_year', nextInspectionDue:'next_inspection_due', assetPhotoPath:'photo_path', notes:'notes' }, idFields:['assignedTechnicianId'], numberFields:['vehicleYear'], dateFields:['nextInspectionDue'], localOnlyFields:['assetPhotoDataUrl', 'assetPhotoName', 'assetPhotoType'] },
  trailers:{ table:'field_trailers', label:'Trailer', idPrefix:'trailer', defaults:{ trailerNumber:'', trailerType:'', capacityConfiguration:'', serviceStatus:'Available', assignedTruckId:'', assetPhotoPath:'', assetPhotoDataUrl:'', assetPhotoName:'', assetPhotoType:'', notes:'' }, fieldMap:{ trailerNumber:'trailer_number', trailerType:'trailer_type', capacityConfiguration:'capacity_configuration', serviceStatus:'service_status', assignedTruckId:'assigned_truck_id', assetPhotoPath:'photo_path', notes:'notes' }, idFields:['assignedTruckId'], localOnlyFields:['assetPhotoDataUrl', 'assetPhotoName', 'assetPhotoType'] },
  equipment:{ table:'field_equipment', label:'Equipment', idPrefix:'equip', defaults:{ equipmentName:'', equipmentType:'Small Volume Prover', model:'', manufacturer:'', splInventoryBarcode:'', serialNumber:'', calibrationStatus:'Current', lastCalibrationDate:'', nextCalibrationDue:'', maintenanceStatus:'Available', storageLocation:'', assignedTrailerTruck:'', assignedTruckId:'', assignedTrailerId:'', assetPhotoPath:'', assetPhotoDataUrl:'', assetPhotoName:'', assetPhotoType:'', notes:'' }, fieldMap:{ equipmentName:'equipment_name', equipmentType:'equipment_type', model:'model', manufacturer:'manufacturer', splInventoryBarcode:'spl_inventory_barcode', serialNumber:'serial_number', calibrationStatus:'calibration_status', lastCalibrationDate:'last_calibration_date', nextCalibrationDue:'next_calibration_due', maintenanceStatus:'maintenance_status', storageLocation:'storage_location', assignedTrailerTruck:'assigned_trailer_truck', assignedTruckId:'assigned_truck_id', assignedTrailerId:'assigned_trailer_id', assetPhotoPath:'photo_path', notes:'notes' }, idFields:['assignedTruckId', 'assignedTrailerId'], dateFields:['lastCalibrationDate', 'nextCalibrationDue'], localOnlyFields:['assetPhotoDataUrl', 'assetPhotoName', 'assetPhotoType'] },
  samples:{ table:'field_samples', label:'Sample', idPrefix:'sample', defaults:{ jobId:'', clientId:'', siteId:'', sampleType:'Gas', containerType:'Cylinder', collectionDateTime:'', sampleDate:'', sampleTime:'', pickedUpBy:'', dropOffLocation:'', chainOfCustodyStatus:'Requested', labReceiptStatus:'Requested', sampleStatus:'Needs Pulled', sampleName:'', samplePoint:'', isDuplicate:false, sampleCollectionMode:'', cylinderNumber:'', testCodes:[], sampleTempF:null, samplePressurePsig:null, linkedWorkOrderId:'', linkedWorkOrderNumber:'', labReceivedAt:'', sampleSequence:null, priorityTat:'', notes:'' }, fieldMap:{ jobId:'job_id', clientId:'client_id', siteId:'site_id', sampleType:'sample_type', containerType:'container_type', collectionDateTime:'collection_date_time', sampleDate:'sample_date', sampleTime:'sample_time', pickedUpBy:'picked_up_by', dropOffLocation:'drop_off_location', chainOfCustodyStatus:'chain_of_custody_status', labReceiptStatus:'lab_receipt_status', sampleStatus:'sample_status', sampleName:'sample_name', samplePoint:'sample_point', isDuplicate:'is_duplicate', sampleCollectionMode:'sample_collection_mode', cylinderNumber:'cylinder_number', testCodes:'test_codes', sampleTempF:'sample_temp_f', samplePressurePsig:'sample_pressure_psig', linkedWorkOrderId:'linked_work_order_id', linkedWorkOrderNumber:'linked_work_order_number', labReceivedAt:'lab_received_at', sampleSequence:'sample_sequence', priorityTat:'priority_tat', notes:'notes' }, idFields:['jobId', 'clientId', 'siteId'], booleanFields:['isDuplicate'], arrayFields:['testCodes'], numberFields:['sampleSequence', 'sampleTempF', 'samplePressurePsig'], dateFields:['sampleDate'], timeFields:['sampleTime'], dateTimeFields:['collectionDateTime', 'labReceivedAt'] },
  maintenanceRecords:{ table:'field_maintenance_records', label:'Maintenance Record', idPrefix:'maint', defaults:{ assetType:'Equipment', assetId:'', maintenanceType:'Preventive', openDate:'', dueDate:'', completedDate:'', status:'Open', issueDescription:'', resolution:'', vendorInternal:'Internal', cost:null, assignedPerson:'', notes:'' }, fieldMap:{ assetType:'asset_type', assetId:'asset_id', maintenanceType:'maintenance_type', openDate:'open_date', dueDate:'due_date', completedDate:'completed_date', status:'status', issueDescription:'issue_description', resolution:'resolution', vendorInternal:'vendor_internal', cost:'cost', assignedPerson:'assigned_person', notes:'notes' }, idFields:['assetId'], numberFields:['cost'], dateFields:['openDate', 'dueDate', 'completedDate'] }
};

let state = { activeView:IS_CLIENTS_STANDALONE ? 'directory' : 'overview', scheduleAnchorDate:getStartOfWeekISO(new Date()), scheduleView:'work_week', scheduleJobFilter:'all', scheduleAddPromptDate:'', scheduleActionJobId:'', scheduleQuickTechJobId:'', scheduleQuickTechTechnicianId:'', scheduleQuickTicketJobId:'', scheduleQuickTicketNumber:'', scheduleQuickTicketUrl:'', scheduleActionSavingJobId:'', filters:{ dispatchSearch:'', dispatchPriority:'all', dispatchJobType:'all', dispatchJobFilter:'open', dispatchAlertFilter:'all', dispatchAssignmentFilter:'all', dispatchSortKey:'schedule', dispatchSortDirection:'asc', inventorySearch:'', inventoryStatus:'active', partPickerSearch:'', partCatalogType:'category', directoryClient:'all', directorySection:'overview', directoryClientSearch:'', directoryContactSearch:'', directoryContactScope:'all', directoryContactProject:'all', directoryContactSite:'all', directoryContactSortKey:'name', directoryContactSortDirection:'asc' }, data:createEmptyData(), labTestDefinitions:[], sampleLinkModal:createClosedSampleLinkModalState(), partAdjustModal:createClosedPartAdjustModalState(), partPickerOpen:false, sampleTableModalOpen:false, expandedSampleGroups:{}, saveInFlight:false, autoRefreshInFlight:false, autoRefreshTimer:null };
let modalState = createClosedModalState();
let lastLoadedSnapshot = '';
let hideSaveStatusTimer = null;
const remoteAssetPhotoUrlCache = new Map();
const remoteAssetPhotoLoadPromises = new Map();

function createEmptyData(){ return { clients:[], projects:[], contacts:[], contactProjects:[], contactSites:[], billingProfiles:[], priceItems:[], billingProfilePrices:[], siteTypes:[], sites:[], siteProjects:[], jobTypes:[], siteTypeJobTypes:[], jobs:[], jobSites:[], jobAssignments:[], partCatalogs:[], parts:[], jobParts:[], partActivity:[], fieldRoutes:[], routePlaceLists:[], routePlaces:[], restrictedRoads:[], fieldRouteStops:[], fieldRouteStopJobs:[], employees:[], splSites:[], technicianTravel:[], trucks:[], trailers:[], equipment:[], samples:[], maintenanceRecords:[], technicians:[] }; }
function createClosedModalState(){ return { open:false, entity:'', id:'', formData:{}, assignments:[], baselineSnapshot:'', openMultiSelectKey:'', openSampleTestDraftId:'', sampleDraftExpanded:{} }; }
function createClosedSampleLinkModalState(){ return { open:false, mode:'single', sampleId:'', sampleIds:[], selectedWorkOrderId:'', search:'', workOrders:[] }; }
function createClosedPartAdjustModalState(){ return { open:false, partId:'', mode:'receive' }; }
function uid(prefix = 'fld'){ return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function clone(value){ return JSON.parse(JSON.stringify(value)); }
function firstRow(payload){ return Array.isArray(payload) ? payload[0] || null : payload; }
function normalizeBoolean(value){ return value === true || value === 'true' || value === 1 || value === '1'; }
function normalizeNumber(value){ if(value === '' || value === null || value === undefined) return null; const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
function normalizeClientCode(value){ return String(value || '').trim().toUpperCase(); }
function normalizeCatalogKey(raw){ return String(raw || '').trim().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_-]/g, ''); }
function normalizeStringArray(value){
  if(Array.isArray(value)) return [...new Set(value.map((item) => String(item || '').trim()).filter(Boolean))];
  if(typeof value === 'string'){
    const raw = value.trim();
    if(!raw) return [];
    if(raw.startsWith('[') && raw.endsWith(']')){
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? normalizeStringArray(parsed) : [];
      } catch {
        return [];
      }
    }
    return normalizeStringArray(raw.split(','));
  }
  return [];
}
function normalizeJobTypeKey(value){ return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, ''); }
function normalizeSiteTypeKey(value){ return normalizeJobTypeKey(value); }
function normalizeHexColor(value, fallback = DEFAULT_JOB_TYPE_COLOR){
  const raw = String(value || '').trim();
  const normalized = raw.startsWith('#') ? raw : `#${raw}`;
  return /^#[0-9a-fA-F]{6}$/.test(normalized) ? normalized.toLowerCase() : fallback;
}
function normalizeLabTestDefinition(def, index = 0){
  const key = normalizeCatalogKey(def?.key || def?.code || def?.label || `TEST_${index + 1}`);
  if(!key) return null;
  const label = String(def?.label || key).trim() || key;
  return {
    id:String(def?.id || key),
    key,
    label,
    shortLabel:String(def?.shortLabel || label).trim() || label,
    matrixType:String(def?.matrixType || '').trim(),
    sortOrder:Number.isFinite(Number(def?.sortOrder)) ? Number(def.sortOrder) : index
  };
}
function getDefaultLabTestDefinitions(){ return DEFAULT_LAB_TEST_DEFS.map((def, index) => normalizeLabTestDefinition({ ...def, sortOrder:index }, index)).filter(Boolean); }
function setLabTestDefinitions(defs){
  const normalized = (Array.isArray(defs) && defs.length ? defs : getDefaultLabTestDefinitions())
    .map((def, index) => normalizeLabTestDefinition(def, index))
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label));
  state.labTestDefinitions = normalized.length ? normalized : getDefaultLabTestDefinitions();
}
function getLabTestDefinitions(){ return state.labTestDefinitions.length ? state.labTestDefinitions : getDefaultLabTestDefinitions(); }
function getLabTestLabel(key){
  const normalized = normalizeCatalogKey(key);
  return getLabTestDefinitions().find((def) => def.key === normalized)?.label || String(key || '');
}
function getLabTestMatrixType(test){
  const explicit = String(test?.matrixType || '').trim().toLowerCase();
  if(explicit === 'gas') return 'Gas';
  if(explicit === 'liquid') return 'Liquid';
  const key = String(test?.key || test?.label || '').toUpperCase();
  if(key.includes('LIQ') || key.includes('DENS') || key.includes('BFV')) return 'Liquid';
  if(key.includes('GAS') || key.includes('2103')) return 'Gas';
  return '';
}
function getLabTestsForSampleType(sampleType){
  const type = normalizeSampleTypeForWorkflow(sampleType);
  return getLabTestDefinitions().filter((test) => {
    const matrix = getLabTestMatrixType(test);
    return !matrix || matrix === type;
  });
}
function buildLabTestOptionsForSampleType(sampleType){
  return getLabTestsForSampleType(sampleType).map((test) => ({ value:test.key, label:test.label }));
}
function filterTestCodesForSampleType(testCodes, sampleType){
  const allowed = new Set(getLabTestsForSampleType(sampleType).map((test) => test.key));
  return normalizeStringArray(testCodes).filter((code) => allowed.has(normalizeCatalogKey(code)));
}
function getStorageAdapter(){
  return (window.storage && typeof window.storage.get === 'function' && typeof window.storage.set === 'function')
    ? window.storage
    : { get:async (key) => ({ value:localStorage.getItem(key) }), set:async (key, value) => { localStorage.setItem(key, value); } };
}
async function loadLabTestDefinitions(){
  try {
    const result = await getStorageAdapter().get(TEST_DEFINITION_STORAGE_KEY);
    const raw = typeof result?.value === 'string' ? result.value : '';
    if(raw){
      const parsed = JSON.parse(raw);
      if(Array.isArray(parsed) && parsed.length){
        setLabTestDefinitions(parsed);
        return true;
      }
    }
  } catch (error){
    console.warn('Unable to load lab test definitions for Field Ops samples:', error);
  }
  setLabTestDefinitions(getDefaultLabTestDefinitions());
  return false;
}
function normalizeSampleStatus(value, sample = null){
  const raw = String(value || '').trim();
  if(raw === 'Received by Lab') return 'Received by Lab';
  if(raw === 'Needs Pulled') return 'Needs Pulled';
  const labStatus = String(sample?.labReceiptStatus || '').trim();
  const cocStatus = String(sample?.chainOfCustodyStatus || '').trim();
  if(['Delivered', 'Logged In', 'Complete'].includes(labStatus) || ['Delivered', 'Logged In', 'Complete'].includes(cocStatus)) return 'Received by Lab';
  return 'Needs Pulled';
}
function applySampleStatusCompatibility(sample){
  const sampleStatus = normalizeSampleStatus(sample.sampleStatus, sample);
  sample.sampleStatus = sampleStatus;
  if(sampleStatus === 'Received by Lab'){
    sample.chainOfCustodyStatus = sample.chainOfCustodyStatus && sample.chainOfCustodyStatus !== 'Requested' ? sample.chainOfCustodyStatus : 'Delivered';
    sample.labReceiptStatus = sample.labReceiptStatus && sample.labReceiptStatus !== 'Requested' ? sample.labReceiptStatus : 'Logged In';
  } else {
    sample.chainOfCustodyStatus = 'Requested';
    sample.labReceiptStatus = 'Requested';
    sample.linkedWorkOrderId = '';
    sample.linkedWorkOrderNumber = '';
    sample.labReceivedAt = '';
  }
  return sample;
}
function normalizeSampleTypeForWorkflow(value){
  const raw = String(value || '').trim();
  if(raw === 'Liquid') return 'Liquid';
  return 'Gas';
}
function getDefaultJobTypeColor(value){
  return DEFAULT_JOB_TYPE_COLOR;
}
function getJobTypeColor(jobType){
  const record = typeof jobType === 'object' && jobType !== null ? jobType : getJobTypeRecord(jobType);
  const key = record?.jobTypeKey || jobType;
  return normalizeHexColor(record?.jobTypeColor, getDefaultJobTypeColor(key));
}
function hexToRgbParts(value){
  const hex = normalizeHexColor(value).slice(1);
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16)
  ];
}
function rgbaFromHex(value, alpha){
  const [red, green, blue] = hexToRgbParts(value);
  return `rgba(${red},${green},${blue},${alpha})`;
}
function getJobTypeScheduleStyle(jobType){
  const color = getJobTypeColor(jobType);
  return `--schedule-card-color:${color};--schedule-card-border:${rgbaFromHex(color, .32)};--schedule-card-bg:${rgbaFromHex(color, .12)};`;
}
function getJobTypeBadgeStyle(jobType){
  const color = getJobTypeColor(jobType);
  return `color:${color};border-color:${rgbaFromHex(color, .34)};background:${rgbaFromHex(color, .12)};`;
}
function getJobTypeCatalogCardStyle(jobType){
  const color = getJobTypeColor(jobType);
  return `border-left:4px solid ${color};box-shadow:inset 0 1px 0 ${rgbaFromHex(color, .1)};`;
}
function catalogKeyToLabel(value){ return String(value || '').trim().toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()); }
function normalizeCatalogStatus(value){
  return String(value || '').trim().toLowerCase() === 'inactive' ? 'inactive' : 'active';
}
function statusToIsActive(value){ return normalizeCatalogStatus(value) === 'active'; }
function compareStrings(a, b){ return String(a || '').localeCompare(String(b || ''), undefined, { sensitivity:'base' }); }
function compareOptionalDates(left, right){ if(!left && !right) return 0; if(!left) return 1; if(!right) return -1; return left - right; }
function isRemoteMode(){ return !!(window.appAuth && typeof window.appAuth.getMode === 'function' && window.appAuth.getMode() === 'remote'); }
function esc(value){ return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch])); }
function splitContactName(value){
  const raw = String(value || '').trim();
  if(!raw) return { first:'', last:'' };
  if(raw.includes(',')){
    const [last, ...firstParts] = raw.split(',');
    return { first:firstParts.join(',').trim(), last:last.trim() };
  }
  const parts = raw.split(/\s+/).filter(Boolean);
  if(parts.length <= 1) return { first:parts[0] || '', last:'' };
  return { first:parts.slice(0, -1).join(' '), last:parts[parts.length - 1] };
}
function getContactFirstName(contact){ return String(contact?.contactFirstName || '').trim() || splitContactName(contact?.contactName).first; }
function getContactLastName(contact){ return String(contact?.contactLastName || '').trim() || splitContactName(contact?.contactName).last; }
function getContactDisplayName(contact){
  const first = getContactFirstName(contact);
  const last = getContactLastName(contact);
  if(last && first) return `${last}, ${first}`;
  return last || first || contact?.contactName || 'Unnamed contact';
}
function buildContactName(firstName, lastName, fallback = ''){
  const first = String(firstName || '').trim();
  const last = String(lastName || '').trim();
  return [first, last].filter(Boolean).join(' ') || String(fallback || '').trim();
}
function splitEmployeeName(value){ return splitContactName(value); }
function buildEmployeeName(firstName, lastName, fallback = ''){
  const first = String(firstName || '').trim();
  const last = String(lastName || '').trim();
  return [first, last].filter(Boolean).join(' ') || String(fallback || '').trim();
}
function getEmployeeFirstName(employee){ return String(employee?.employeeFirstName || '').trim() || splitEmployeeName(employee?.employeeName).first; }
function getEmployeeLastName(employee){ return String(employee?.employeeLastName || '').trim() || splitEmployeeName(employee?.employeeName).last; }
function getEmployeeFullName(employee){ return buildEmployeeName(getEmployeeFirstName(employee), getEmployeeLastName(employee), employee?.employeeName) || 'Unnamed employee'; }
function getEmployeeListName(employee){
  const first = getEmployeeFirstName(employee);
  const last = getEmployeeLastName(employee);
  if(last && first) return `${last}, ${first}`;
  return last || first || employee?.employeeName || 'Unnamed employee';
}
function getEmployeeHomeSplSite(employee){ return String(employee?.homeSplSite || LOCAL_SPL_SITE).trim() || LOCAL_SPL_SITE; }
function isVisitingEmployee(employee){ return getEmployeeHomeSplSite(employee).toLowerCase() !== LOCAL_SPL_SITE.toLowerCase(); }
function getEmployeeOptionLabel(employee){ return `${getEmployeeListName(employee)} | ${getEmployeeHomeSplSite(employee)}`; }

function todayISO(){
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function parseDateOnly(value){
  if(!value) return null;
  if(value instanceof Date){ const cloneValue = new Date(value.getTime()); cloneValue.setHours(0, 0, 0, 0); return Number.isNaN(cloneValue.getTime()) ? null : cloneValue; }
  const raw = String(value).trim();
  if(!raw) return null;
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:$|T)/);
  const date = match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(raw);
  date.setHours(0, 0, 0, 0);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseDateTime(value){
  if(!value) return null;
  if(value instanceof Date){ return Number.isNaN(value.getTime()) ? null : new Date(value.getTime()); }
  const raw = String(value).trim();
  if(!raw) return null;
  const normalized = /^\d{4}-\d{2}-\d{2}$/.test(raw) ? `${raw}T00:00` : raw;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toInputDate(value){
  const date = parseDateOnly(value);
  return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
}

function toInputDateTime(value){
  const date = parseDateTime(value);
  return date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` : '';
}

function nowInputDateTime(){ return toInputDateTime(new Date()); }
function splitInputDateTime(value){
  const input = toInputDateTime(value);
  if(!input) return { date:'', time:'' };
  const [date = '', time = ''] = input.split('T');
  return { date, time };
}
function combineSampleDateTime(sampleDate, sampleTime){
  const date = toInputDate(sampleDate);
  const time = String(sampleTime || '').trim();
  if(!date) return '';
  return time ? `${date}T${time}` : `${date}T00:00`;
}
function isDateField(cfg, key, remoteKey){
  if((cfg.dateFields || []).includes(key)) return true;
  return remoteKey.endsWith('_date') || key.toLowerCase().endsWith('date');
}
function isDateTimeField(cfg, key, remoteKey){
  if((cfg.timeFields || []).includes(key)) return false;
  if((cfg.dateTimeFields || []).includes(key)) return true;
  const keyLower = key.toLowerCase();
  return remoteKey.endsWith('_time') || keyLower.endsWith('datetime') || keyLower.endsWith('start') || keyLower.endsWith('end');
}
function toRemoteDate(value){ const date = toInputDate(value); return date || null; }
function toRemoteDateTime(value){ const date = parseDateTime(value); return date ? date.toISOString() : null; }
function fmtDate(value){ const date = parseDateOnly(value); return date ? date.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : 'Not set'; }
function fmtDateTime(value){ const date = parseDateTime(value); return date ? date.toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' }) : 'Not scheduled'; }
function fmtTime(value){ const date = parseDateTime(value); return date ? date.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' }) : 'Time TBD'; }
function fmtCurrency(value){ const parsed = normalizeNumber(value); return parsed === null ? 'Not set' : new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(parsed); }

function getStartOfWeekISO(input){
  const date = parseDateOnly(input || new Date()) || new Date();
  const day = date.getDay();
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return toInputDate(date);
}

function getStartOfWorkWeekISO(input){
  return addDaysISO(getStartOfWeekISO(input), 1);
}

function addDaysISO(isoDate, days){
  const date = parseDateOnly(isoDate) || parseDateOnly(todayISO()) || new Date();
  date.setDate(date.getDate() + Number(days || 0));
  return toInputDate(date);
}

function addMonthsISO(isoDate, months){
  const date = parseDateOnly(isoDate) || parseDateOnly(todayISO()) || new Date();
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + Number(months || 0));
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return toInputDate(date);
}

function getStartOfMonthISO(input){
  const date = parseDateOnly(input || new Date()) || new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return toInputDate(date);
}

function isSameDay(left, right){
  const leftDate = parseDateOnly(left);
  const rightDate = parseDateOnly(right);
  return !!(leftDate && rightDate && leftDate.getTime() === rightDate.getTime());
}

function isWeekendDate(value){
  const date = parseDateOnly(value);
  return !!(date && (date.getDay() === 0 || date.getDay() === 6));
}

function getJobPrimaryDate(job){ return parseDateTime(job?.scheduledStart) || parseDateOnly(job?.requestedDate); }
function getJobSecondaryDate(job){ return parseDateTime(job?.scheduledEnd) || getJobPrimaryDate(job); }

function getEntitySorter(entityKey){
  switch(entityKey){
    case 'clients': return (a, b) => compareStrings(a.clientName, b.clientName);
    case 'projects': return (a, b) => compareStrings(a.projectName, b.projectName);
    case 'contacts': return (a, b) => compareStrings(getContactLastName(a), getContactLastName(b)) || compareStrings(getContactFirstName(a), getContactFirstName(b)) || compareStrings(a.contactName, b.contactName);
    case 'contactProjects': return (a, b) => compareStrings(a.contactId, b.contactId) || compareStrings(a.projectId, b.projectId);
    case 'contactSites': return (a, b) => compareStrings(a.contactId, b.contactId) || compareStrings(a.siteId, b.siteId);
    case 'billingProfiles': return (a, b) => Number(b.isDefault) - Number(a.isDefault) || compareStrings(a.billingName, b.billingName);
    case 'priceItems': return (a, b) => Number(a.sortOrder || 0) - Number(b.sortOrder || 0) || compareStrings(a.method, b.method) || compareStrings(a.description, b.description);
    case 'billingProfilePrices': return (a, b) => compareStrings(a.billingProfileId, b.billingProfileId) || Number(a.effectiveYear || 0) - Number(b.effectiveYear || 0) || compareStrings(a.priceItemId, b.priceItemId);
    case 'siteTypes': return (a, b) => compareStrings(a.siteTypeName, b.siteTypeName) || compareStrings(a.siteTypeKey, b.siteTypeKey);
    case 'sites': return (a, b) => compareStrings(a.siteName, b.siteName);
    case 'siteProjects': return (a, b) => compareStrings(a.siteId, b.siteId) || compareStrings(a.projectId, b.projectId);
    case 'jobTypes': return (a, b) => compareStrings(a.jobTypeName, b.jobTypeName) || compareStrings(a.jobTypeKey, b.jobTypeKey);
    case 'siteTypeJobTypes': return (a, b) => compareStrings(a.siteTypeKey, b.siteTypeKey) || compareStrings(a.jobTypeKey, b.jobTypeKey);
    case 'jobs': return (a, b) => compareOptionalDates(getJobPrimaryDate(a), getJobPrimaryDate(b)) || ((PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99)) || compareStrings(a.scopeSummary || a.jobType || a.id, b.scopeSummary || b.jobType || b.id);
    case 'jobSites': return (a, b) => compareStrings(a.jobId, b.jobId) || Number(a.sortOrder || 0) - Number(b.sortOrder || 0) || compareStrings(a.siteId, b.siteId);
    case 'jobAssignments': return (a, b) => compareStrings(a.assignmentType, b.assignmentType) || compareStrings(a.resourceId, b.resourceId);
    case 'partCatalogs': return (a, b) => compareStrings(getPartCatalogTypeLabel(a.catalogType), getPartCatalogTypeLabel(b.catalogType)) || Number(a.sortOrder || 0) - Number(b.sortOrder || 0) || compareStrings(a.catalogValue, b.catalogValue);
    case 'parts': return (a, b) => Number(a.isActive === false) - Number(b.isActive === false) || compareStrings(a.partName, b.partName) || compareStrings(a.partNumber, b.partNumber);
    case 'jobParts': return (a, b) => compareStrings(a.jobId, b.jobId) || compareStrings(getJobPartDisplayName(a), getJobPartDisplayName(b));
    case 'partActivity': return (a, b) => compareOptionalDates(parseDateTime(b.createdAt), parseDateTime(a.createdAt)) || compareStrings(a.activityType, b.activityType);
    case 'fieldRoutes': return (a, b) => compareOptionalDates(parseDateOnly(a.routeDate), parseDateOnly(b.routeDate)) || compareStrings(a.routeName, b.routeName);
    case 'routePlaceLists': return (a, b) => compareStrings(a.listName, b.listName);
    case 'routePlaces': return (a, b) => compareStrings(a.listId, b.listId) || compareStrings(a.placeName, b.placeName);
    case 'restrictedRoads': return (a, b) => Number(b.isActive) - Number(a.isActive) || compareStrings(a.roadName, b.roadName);
    case 'fieldRouteStops': return (a, b) => compareStrings(a.routeId, b.routeId) || Number(a.stopOrder || 0) - Number(b.stopOrder || 0);
    case 'fieldRouteStopJobs': return (a, b) => compareStrings(a.routeStopId, b.routeStopId) || compareStrings(a.jobId, b.jobId);
    case 'employees': return (a, b) => compareStrings(getEmployeeListName(a), getEmployeeListName(b));
    case 'splSites': return (a, b) => Number(b.isActive) - Number(a.isActive) || compareStrings(a.siteName, b.siteName) || compareStrings(a.siteCode, b.siteCode);
    case 'technicianTravel': return (a, b) => compareOptionalDates(parseDateTime(a.arrivalAt), parseDateTime(b.arrivalAt)) || compareStrings(getEmployeeListName(getEmployee(a.technicianId)), getEmployeeListName(getEmployee(b.technicianId)));
    case 'trucks': return (a, b) => compareStrings(a.unitNumber, b.unitNumber);
    case 'trailers': return (a, b) => compareStrings(a.trailerNumber, b.trailerNumber);
    case 'equipment': return (a, b) => compareStrings(a.equipmentName, b.equipmentName);
    case 'samples': return (a, b) => compareOptionalDates(parseDateTime(b.collectionDateTime), parseDateTime(a.collectionDateTime)) || compareStrings(a.sampleType, b.sampleType);
    case 'maintenanceRecords': return (a, b) => compareOptionalDates(parseDateOnly(a.dueDate), parseDateOnly(b.dueDate)) || compareStrings(a.assetType, b.assetType);
    default: return () => 0;
  }
}

function normalizeRecord(entityKey, source, options = {}){
  const cfg = ENTITY_CONFIG[entityKey];
  const fromRemote = !!options.fromRemote;
  const record = { id:String(source?.id || ''), createdAt:String((fromRemote ? source?.created_at : source?.createdAt) || ''), updatedAt:String((fromRemote ? source?.updated_at : source?.updatedAt) || '') };
  Object.keys(cfg.defaults).forEach((key) => {
    const remoteKey = cfg.fieldMap[key] || key;
    const raw = fromRemote ? source?.[remoteKey] : source?.[key];
    if((cfg.booleanFields || []).includes(key)) record[key] = raw === null || raw === undefined ? cfg.defaults[key] : normalizeBoolean(raw);
    else if((cfg.numberFields || []).includes(key)) record[key] = normalizeNumber(raw);
    else if((cfg.jsonFields || []).includes(key)) record[key] = raw === null || raw === undefined ? clone(cfg.defaults[key]) : clone(raw);
    else if((cfg.arrayFields || []).includes(key)) record[key] = normalizeStringArray(raw);
    else if((cfg.idFields || []).includes(key)) record[key] = raw ? String(raw) : '';
    else if(isDateField(cfg, key, remoteKey)) record[key] = toInputDate(raw);
    else if(isDateTimeField(cfg, key, remoteKey)) record[key] = toInputDateTime(raw);
    else record[key] = raw === null || raw === undefined ? cfg.defaults[key] : String(raw);
  });
  if(entityKey === 'samples'){
    if(record.collectionDateTime){
      const parts = splitInputDateTime(record.collectionDateTime);
      record.sampleDate = parts.date;
      record.sampleTime = parts.time;
    }
    if(!record.collectionDateTime && record.sampleDate) record.collectionDateTime = combineSampleDateTime(record.sampleDate, record.sampleTime);
    if(!['Composite', 'Spot'].includes(record.sampleCollectionMode)) record.sampleCollectionMode = '';
    const statusSourceKey = cfg.fieldMap.sampleStatus || 'sampleStatus';
    const statusWasMissing = fromRemote ? source?.[statusSourceKey] === undefined || source?.[statusSourceKey] === null : source?.sampleStatus === undefined || source?.sampleStatus === null;
    if(statusWasMissing) record.sampleStatus = normalizeSampleStatus('', record);
    applySampleStatusCompatibility(record);
  }
  return record;
}

function getDefaultJobTypeRecords(){
  return DEFAULT_JOB_TYPE_DEFS.map((row) => normalizeRecord('jobTypes', { id:row.jobTypeKey, ...row }, { fromRemote:false })).sort(getEntitySorter('jobTypes'));
}

function normalizeJobTypeDetailGroups(detailGroups){
  const groups = normalizeStringArray(detailGroups);
  if(groups.includes(JOB_PARTS_DISABLED_DETAIL_GROUP)){
    return groups.filter((group) => group !== JOB_PARTS_DETAIL_GROUP);
  }
  return groups.includes(JOB_PARTS_DETAIL_GROUP) ? groups : [...groups, JOB_PARTS_DETAIL_GROUP];
}

function prepareJobTypeDetailGroupsForSave(detailGroups){
  const groups = normalizeStringArray(detailGroups).filter((group) => group !== JOB_PARTS_DISABLED_DETAIL_GROUP);
  return groups.includes(JOB_PARTS_DETAIL_GROUP) ? groups : [...groups, JOB_PARTS_DISABLED_DETAIL_GROUP];
}

function getJobTypeDetailGroupLabels(detailGroups){
  const optionByValue = new Map(JOB_TYPE_DETAIL_GROUP_OPTIONS.map((option) => [option.value, option.label]));
  return normalizeStringArray(detailGroups)
    .filter((group) => group !== JOB_PARTS_DISABLED_DETAIL_GROUP)
    .map((group) => optionByValue.get(group) || group);
}

function getDefaultSiteTypeRecords(){
  return DEFAULT_SITE_TYPE_DEFS.map((row) => normalizeRecord('siteTypes', { id:row.siteTypeKey, ...row }, { fromRemote:false })).sort(getEntitySorter('siteTypes'));
}

function getPartCatalogTypeDef(catalogType){
  return FIELD_PART_CATALOG_TYPES.find((type) => type.value === catalogType) || FIELD_PART_CATALOG_TYPES[0];
}
function getPartCatalogTypeLabel(catalogType, plural = false){
  const def = getPartCatalogTypeDef(catalogType);
  return plural ? def.plural : def.label;
}
function getDefaultPartCatalogRecords(){
  return FIELD_PART_CATALOG_TYPES.flatMap((type) => type.defaults.map((value, index) => normalizeRecord('partCatalogs', {
    id:`${type.value}-${normalizeCatalogKey(value) || index + 1}`,
    catalogType:type.value,
    catalogValue:value,
    sortOrder:(index + 1) * 10,
    isActive:true,
    notes:''
  }, { fromRemote:false }))).sort(getEntitySorter('partCatalogs'));
}

function getDefaultBillingPriceItemRecords(){
  return DEFAULT_BILLING_PRICE_ITEMS.map((row) => normalizeRecord('priceItems', {
    id:row.itemKey,
    itemKey:row.itemKey,
    priceSection:row.priceSection,
    category:row.category,
    method:row.method,
    description:row.description,
    unitName:row.unitName,
    sortOrder:row.sortOrder,
    isActive:true,
    notes:''
  }, { fromRemote:false })).sort(getEntitySorter('priceItems'));
}
function getBillingProfileSortScore(profile){
  return [Number(profile?.isDefault !== true), Number(!!profile?.projectId), String(profile?.createdAt || ''), String(profile?.id || '')];
}

function compareBillingProfileKeepPriority(a, b){
  const left = getBillingProfileSortScore(a);
  const right = getBillingProfileSortScore(b);
  for(let index = 0; index < left.length; index += 1){
    const value = compareStrings(left[index], right[index]);
    if(value) return value;
  }
  return 0;
}

function consolidateBillingProfiles(data){
  const redirectProfileIds = new Map();
  const grouped = new Map();
  data.billingProfiles.forEach((profile) => {
    if(!profile.clientId) return;
    if(!grouped.has(profile.clientId)) grouped.set(profile.clientId, []);
    grouped.get(profile.clientId).push(profile);
  });
  grouped.forEach((profiles) => {
    const sortedProfiles = [...profiles].sort(compareBillingProfileKeepPriority);
    const keeper = sortedProfiles[0];
    keeper.projectId = '';
    keeper.isDefault = true;
    sortedProfiles.slice(1).forEach((profile) => {
      ['billingContactId', 'billingName', 'billingAddress', 'billingEmail', 'billingPhone', 'invoiceNotes', 'fieldBillingNotes', 'labBillingNotes'].forEach((key) => {
        if(!keeper[key] && profile[key]) keeper[key] = profile[key];
      });
      redirectProfileIds.set(profile.id, keeper.id);
    });
  });
  if(redirectProfileIds.size){
    const removedIds = new Set(redirectProfileIds.keys());
    data.billingProfiles = data.billingProfiles.filter((profile) => !removedIds.has(profile.id));
    data.billingProfilePrices = data.billingProfilePrices.map((price) => redirectProfileIds.has(price.billingProfileId) ? { ...price, billingProfileId:redirectProfileIds.get(price.billingProfileId) } : price);
  }
  const seenPrices = new Set();
  data.billingProfilePrices = data.billingProfilePrices.filter((price) => {
    const key = `${price.billingProfileId}::${price.priceItemId}::${Number(price.effectiveYear || BILLING_RATE_EFFECTIVE_YEAR)}`;
    if(seenPrices.has(key)) return false;
    seenPrices.add(key);
    return true;
  });
}

function getDefaultSplSiteRecords(){
  return [normalizeRecord('splSites', {
    id:'spl-pittsburgh',
    siteName:'SPL Pittsburgh',
    siteCode:'PITTSBURGH',
    locationLabel:'SPL Pittsburgh',
    isActive:true,
    notes:'Default internal SPL site for Field Ops travel scheduling.'
  }, { fromRemote:false })];
}

function resolveJobTypeValue(jobTypes, value){
  const raw = String(value || '').trim();
  if(!raw) return '';
  const normalized = normalizeJobTypeKey(raw);
  const match = (Array.isArray(jobTypes) ? jobTypes : []).find((jobType) => normalizeJobTypeKey(jobType.jobTypeKey) === normalized || normalizeJobTypeKey(jobType.jobTypeName) === normalized);
  return match ? match.jobTypeKey : raw;
}

function resolveSiteTypeValue(siteTypes, value){
  const raw = String(value || '').trim();
  if(!raw) return 'OTHER';
  const normalized = normalizeSiteTypeKey(raw);
  const match = (Array.isArray(siteTypes) ? siteTypes : []).find((siteType) => normalizeSiteTypeKey(siteType.siteTypeKey) === normalized || normalizeSiteTypeKey(siteType.siteTypeName) === normalized);
  return match ? match.siteTypeKey : (normalized || 'OTHER');
}

function syncCatalogStatuses(data){
  data.siteTypes.forEach((siteType) => { siteType.siteTypeStatus = siteType.isActive ? 'active' : 'inactive'; });
  data.jobTypes.forEach((jobType) => { jobType.jobTypeStatus = jobType.isActive ? 'active' : 'inactive'; });
}

function syncSiteTypeJobTypeLinks(data){
  const links = [];
  const seen = new Set();
  const pushLink = (siteTypeKey, jobTypeKey) => {
    const normalizedSiteTypeKey = resolveSiteTypeValue(data.siteTypes, siteTypeKey);
    const normalizedJobTypeKey = resolveJobTypeValue(data.jobTypes, jobTypeKey);
    if(!normalizedSiteTypeKey || !normalizedJobTypeKey) return;
    if(!data.siteTypes.some((row) => row.siteTypeKey === normalizedSiteTypeKey)) return;
    if(!data.jobTypes.some((row) => row.jobTypeKey === normalizedJobTypeKey)) return;
    const key = `${normalizedSiteTypeKey}::${normalizedJobTypeKey}`;
    if(seen.has(key)) return;
    seen.add(key);
    links.push(normalizeRecord('siteTypeJobTypes', { id:key, siteTypeKey:normalizedSiteTypeKey, jobTypeKey:normalizedJobTypeKey }, { fromRemote:false }));
  };
  (Array.isArray(data.siteTypeJobTypes) ? data.siteTypeJobTypes : []).forEach((row) => pushLink(row.siteTypeKey, row.jobTypeKey));
  if(!links.length){
    data.siteTypes.forEach((siteType) => normalizeStringArray(siteType.defaultJobTypes).forEach((jobTypeKey) => pushLink(siteType.siteTypeKey, jobTypeKey)));
  }
  if(!links.length){
    data.sites.forEach((site) => normalizeStringArray(site.standardJobTypes).forEach((jobTypeName) => pushLink(site.siteType, jobTypeName)));
  }
  data.siteTypeJobTypes = links.sort(getEntitySorter('siteTypeJobTypes'));
  data.siteTypes.forEach((siteType) => {
    siteType.defaultJobTypes = data.siteTypeJobTypes.filter((row) => row.siteTypeKey === siteType.siteTypeKey).map((row) => row.jobTypeKey);
  });
}

function syncSiteProjectLinks(data){
  const nextLinks = [];
  const seen = new Set();
  const pushLink = (siteId, projectId) => {
    const normalizedSiteId = String(siteId || '').trim();
    const normalizedProjectId = String(projectId || '').trim();
    if(!normalizedSiteId || !normalizedProjectId) return;
    const key = `${normalizedSiteId}::${normalizedProjectId}`;
    if(seen.has(key)) return;
    seen.add(key);
    nextLinks.push(normalizeRecord('siteProjects', { id:key, siteId:normalizedSiteId, projectId:normalizedProjectId }, { fromRemote:false }));
  };
  (Array.isArray(data.siteProjects) ? data.siteProjects : []).forEach((row) => pushLink(row.siteId, row.projectId));
  (Array.isArray(data.sites) ? data.sites : []).forEach((site) => {
    const linkedProjectIds = normalizeStringArray(site.projectIds);
    if(linkedProjectIds.length){
      linkedProjectIds.forEach((projectId) => pushLink(site.id, projectId));
      return;
    }
    pushLink(site.id, site.projectId);
  });
  data.siteProjects = nextLinks.sort(getEntitySorter('siteProjects'));
  data.sites.forEach((site) => {
    const linkedProjectIds = data.siteProjects.filter((row) => row.siteId === site.id).map((row) => row.projectId);
    const uniqueProjectIds = [...new Set(linkedProjectIds)];
    site.projectIds = uniqueProjectIds;
    site.projectId = uniqueProjectIds[0] || site.projectId || '';
  });
}

function syncContactLinks(data){
  const nextProjectLinks = [];
  const nextSiteLinks = [];
  const seenProjects = new Set();
  const seenSites = new Set();
  const contactById = new Map((Array.isArray(data.contacts) ? data.contacts : []).map((contact) => [contact.id, contact]));
  const projectById = new Map((Array.isArray(data.projects) ? data.projects : []).map((project) => [project.id, project]));
  const siteById = new Map((Array.isArray(data.sites) ? data.sites : []).map((site) => [site.id, site]));
  const pushProjectLink = (contactId, projectId) => {
    const normalizedContactId = String(contactId || '').trim();
    const normalizedProjectId = String(projectId || '').trim();
    const contact = contactById.get(normalizedContactId);
    const project = projectById.get(normalizedProjectId);
    if(!contact || !project || project.clientId !== contact.clientId) return;
    const key = `${normalizedContactId}::${normalizedProjectId}`;
    if(seenProjects.has(key)) return;
    seenProjects.add(key);
    nextProjectLinks.push(normalizeRecord('contactProjects', { id:key, contactId:normalizedContactId, projectId:normalizedProjectId }, { fromRemote:false }));
  };
  const pushSiteLink = (contactId, siteId) => {
    const normalizedContactId = String(contactId || '').trim();
    const normalizedSiteId = String(siteId || '').trim();
    const contact = contactById.get(normalizedContactId);
    const site = siteById.get(normalizedSiteId);
    if(!contact || !site || site.clientId !== contact.clientId) return;
    const key = `${normalizedContactId}::${normalizedSiteId}`;
    if(seenSites.has(key)) return;
    seenSites.add(key);
    nextSiteLinks.push(normalizeRecord('contactSites', { id:key, contactId:normalizedContactId, siteId:normalizedSiteId }, { fromRemote:false }));
  };
  (Array.isArray(data.contactProjects) ? data.contactProjects : []).forEach((row) => pushProjectLink(row.contactId, row.projectId));
  (Array.isArray(data.contactSites) ? data.contactSites : []).forEach((row) => pushSiteLink(row.contactId, row.siteId));
  (Array.isArray(data.contacts) ? data.contacts : []).forEach((contact) => {
    const linkedProjectIds = normalizeStringArray(contact.projectIds);
    if(linkedProjectIds.length) linkedProjectIds.forEach((projectId) => pushProjectLink(contact.id, projectId));
    else pushProjectLink(contact.id, contact.projectId);
    const linkedSiteIds = normalizeStringArray(contact.siteIds);
    if(linkedSiteIds.length) linkedSiteIds.forEach((siteId) => pushSiteLink(contact.id, siteId));
    else pushSiteLink(contact.id, contact.siteId);
  });
  data.contactProjects = nextProjectLinks.sort(getEntitySorter('contactProjects'));
  data.contactSites = nextSiteLinks.sort(getEntitySorter('contactSites'));
  data.contacts.forEach((contact) => {
    const parsedName = splitContactName(contact.contactName);
    if(!contact.contactFirstName) contact.contactFirstName = parsedName.first;
    if(!contact.contactLastName) contact.contactLastName = parsedName.last;
    contact.contactName = buildContactName(contact.contactFirstName, contact.contactLastName, contact.contactName);
    const projectIds = data.contactProjects.filter((row) => row.contactId === contact.id).map((row) => row.projectId);
    const siteIds = data.contactSites.filter((row) => row.contactId === contact.id).map((row) => row.siteId);
    contact.projectIds = [...new Set(projectIds.filter(Boolean))];
    contact.siteIds = [...new Set(siteIds.filter(Boolean))];
    contact.projectId = contact.projectIds[0] || '';
    contact.siteId = contact.siteIds[0] || '';
    const manager = contact.managerContactId ? contactById.get(contact.managerContactId) : null;
    if(contact.managerContactId && (!manager || manager.clientId !== contact.clientId || manager.id === contact.id)) contact.managerContactId = '';
  });
}

function syncJobSiteLinks(data){
  const nextLinks = [];
  const seen = new Set();
  const jobById = new Map((Array.isArray(data.jobs) ? data.jobs : []).map((job) => [job.id, job]));
  const siteById = new Map((Array.isArray(data.sites) ? data.sites : []).map((site) => [site.id, site]));
  const pushLink = (jobId, siteId, sortOrder = nextLinks.length) => {
    const normalizedJobId = String(jobId || '').trim();
    const normalizedSiteId = String(siteId || '').trim();
    const job = jobById.get(normalizedJobId);
    const site = siteById.get(normalizedSiteId);
    if(!job || !site || site.clientId !== job.clientId) return;
    const key = `${normalizedJobId}::${normalizedSiteId}`;
    if(seen.has(key)) return;
    seen.add(key);
    nextLinks.push(normalizeRecord('jobSites', { id:key, jobId:normalizedJobId, siteId:normalizedSiteId, sortOrder }, { fromRemote:false }));
  };
  (Array.isArray(data.jobSites) ? data.jobSites : []).sort(getEntitySorter('jobSites')).forEach((row) => pushLink(row.jobId, row.siteId, row.sortOrder));
  (Array.isArray(data.jobs) ? data.jobs : []).forEach((job) => {
    const existingCount = nextLinks.filter((row) => row.jobId === job.id).length;
    if(!existingCount) pushLink(job.id, job.siteId, 0);
    normalizeStringArray(job.siteIds).forEach((siteId, index) => pushLink(job.id, siteId, index));
  });
  data.jobSites = nextLinks.sort(getEntitySorter('jobSites'));
  data.jobs.forEach((job) => {
    const linkedSiteIds = data.jobSites.filter((row) => row.jobId === job.id).map((row) => row.siteId);
    job.siteIds = normalizeStringArray(linkedSiteIds.length ? linkedSiteIds : [job.siteId]);
    job.siteId = job.siteIds[0] || job.siteId || '';
  });
}

function normalizeData(source, fromRemote = false){
  const normalized = createEmptyData();
  ENTITY_ORDER.forEach((entityKey) => {
    const rows = Array.isArray(source?.[entityKey]) ? source[entityKey] : [];
    normalized[entityKey] = rows.map((row) => normalizeRecord(entityKey, row, { fromRemote })).sort(getEntitySorter(entityKey));
  });
  if(!normalized.jobTypes.length) normalized.jobTypes = getDefaultJobTypeRecords();
  if(!normalized.splSites.length) normalized.splSites = getDefaultSplSiteRecords();
  if(!normalized.employees.length && Array.isArray(source?.technicians) && source.technicians.length){
    normalized.employees = source.technicians.map((row) => normalizeRecord('employees', {
      id:row?.id || uid('emp'),
      employeeFirstName:row?.employeeFirstName ?? row?.employee_first_name ?? '',
      employeeLastName:row?.employeeLastName ?? row?.employee_last_name ?? '',
      employeeName:row?.employeeName ?? row?.employee_name ?? '',
      homeSplSite:row?.homeSplSite ?? row?.home_spl_site ?? LOCAL_SPL_SITE,
      workScope:'Field',
      labRole:'',
      fieldRole:row?.role || 'Field Tech',
      canSampleTransport:false,
      phone:row?.phone || '',
      email:row?.email || '',
      notes:row?.notes || ''
    }, { fromRemote:false })).sort(getEntitySorter('employees'));
  }
  repairDataRelationships(normalized);
  return normalized;
}

function ensureLegacyProject(data, clientId){
  if(!clientId) return '';
  const existing = data.projects.find((row) => row.clientId === clientId && row.projectName === 'General / Legacy') || data.projects.find((row) => row.clientId === clientId);
  if(existing) return existing.id;
  const client = data.clients.find((row) => row.id === clientId) || null;
  const record = normalizeRecord('projects', {
    id:uid(ENTITY_CONFIG.projects.idPrefix),
    clientId,
    projectName:'General / Legacy',
    serviceScope:client?.serviceScope || 'Field',
    projectStatus:'Active',
    notes:'Auto-created to preserve existing client data during project migration.'
  });
  data.projects.unshift(record);
  data.projects.sort(getEntitySorter('projects'));
  return record.id;
}

function repairDataRelationships(data){
  if(!data || typeof data !== 'object') return data;
  if(!Array.isArray(data.siteTypes) || !data.siteTypes.length) data.siteTypes = getDefaultSiteTypeRecords();
  data.siteTypes = data.siteTypes.map((siteType, index) => normalizeRecord('siteTypes', {
    ...siteType,
    id:siteType.id || normalizeSiteTypeKey(siteType.siteTypeKey || siteType.siteTypeName || `SITE_TYPE_${index + 1}`),
    siteTypeKey:normalizeSiteTypeKey(siteType.siteTypeKey || siteType.siteTypeName || `SITE_TYPE_${index + 1}`),
    siteTypeName:siteType.siteTypeName || catalogKeyToLabel(siteType.siteTypeKey) || `Site Type ${index + 1}`,
    isActive:siteType.siteTypeStatus ? statusToIsActive(siteType.siteTypeStatus) : siteType.isActive
  }, { fromRemote:false })).sort(getEntitySorter('siteTypes'));
  if(!Array.isArray(data.jobTypes) || !data.jobTypes.length) data.jobTypes = getDefaultJobTypeRecords();
  data.jobTypes = data.jobTypes.map((jobType, index) => normalizeRecord('jobTypes', {
    ...jobType,
    id:jobType.id || normalizeJobTypeKey(jobType.jobTypeKey || jobType.jobTypeName || `JOB_TYPE_${index + 1}`),
    jobTypeKey:normalizeJobTypeKey(jobType.jobTypeKey || jobType.jobTypeName || `JOB_TYPE_${index + 1}`),
    jobTypeName:jobType.jobTypeName || catalogKeyToLabel(jobType.jobTypeKey) || `Job Type ${index + 1}`,
    jobTypeColor:normalizeHexColor(jobType.jobTypeColor, getDefaultJobTypeColor(jobType.jobTypeKey || jobType.jobTypeName)),
    detailGroups:normalizeJobTypeDetailGroups(jobType.detailGroups),
    isActive:jobType.jobTypeStatus ? statusToIsActive(jobType.jobTypeStatus) : jobType.isActive
  }, { fromRemote:false })).sort(getEntitySorter('jobTypes'));
  if(!Array.isArray(data.splSites) || !data.splSites.length) data.splSites = getDefaultSplSiteRecords();
  data.splSites = data.splSites.map((site, index) => normalizeRecord('splSites', {
    ...site,
    id:site.id || uid(ENTITY_CONFIG.splSites.idPrefix),
    siteName:site.siteName || `SPL Site ${index + 1}`,
    siteCode:normalizeClientCode(site.siteCode || site.siteName || `SPL_${index + 1}`),
    locationLabel:site.locationLabel || site.siteName || ''
  }, { fromRemote:false })).sort(getEntitySorter('splSites'));
  if(!Array.isArray(data.partCatalogs) || !data.partCatalogs.length) data.partCatalogs = getDefaultPartCatalogRecords();
  data.partCatalogs = data.partCatalogs.map((catalog, index) => normalizeRecord('partCatalogs', {
    ...catalog,
    id:catalog.id || `${catalog.catalogType || 'category'}-${normalizeCatalogKey(catalog.catalogValue) || index + 1}`,
    catalogType:FIELD_PART_CATALOG_TYPES.some((type) => type.value === catalog.catalogType) ? catalog.catalogType : 'category',
    catalogValue:String(catalog.catalogValue || '').trim(),
    sortOrder:Number.isFinite(Number(catalog.sortOrder)) ? Number(catalog.sortOrder) : (index + 1) * 10,
    isActive:catalog.isActive
  }, { fromRemote:false })).filter((catalog) => catalog.catalogValue).sort(getEntitySorter('partCatalogs'));
  if(!Array.isArray(data.priceItems) || !data.priceItems.length) data.priceItems = isRemoteMode() ? [] : getDefaultBillingPriceItemRecords();
  data.priceItems = data.priceItems.map((item, index) => normalizeRecord('priceItems', {
    ...item,
    id:item.id || item.itemKey || normalizeCatalogKey(`${item.method}_${item.description}`) || `PRICE_ITEM_${index + 1}`,
    itemKey:item.itemKey || normalizeCatalogKey(`${item.method}_${item.description}`) || `PRICE_ITEM_${index + 1}`,
    priceSection:item.priceSection || (String(item.category || '').toLowerCase() === 'gas' ? 'Natural Gas Samples' : 'Liquid Samples'),
    unitName:item.unitName || 'Per Sample',
    sortOrder:Number.isFinite(Number(item.sortOrder)) ? Number(item.sortOrder) : (index + 1) * 10,
    isActive:item.isActive
  }, { fromRemote:false })).filter((item) => item.itemKey && item.description).sort(getEntitySorter('priceItems'));
  data.billingProfilePrices = data.billingProfilePrices
    .filter((price) => data.billingProfiles.some((profile) => profile.id === price.billingProfileId))
    .filter((price) => data.priceItems.some((item) => item.id === price.priceItemId))
    .map((price) => normalizeRecord('billingProfilePrices', {
      ...price,
      effectiveYear:price.effectiveYear || BILLING_RATE_EFFECTIVE_YEAR,
      currencyCode:price.currencyCode || 'USD',
      isActive:price.isActive
    }, { fromRemote:false }))
    .sort(getEntitySorter('billingProfilePrices'));
  data.employees.forEach((employee) => {
    const parsedName = splitEmployeeName(employee.employeeName);
    if(!employee.employeeFirstName) employee.employeeFirstName = parsedName.first;
    if(!employee.employeeLastName) employee.employeeLastName = parsedName.last;
    employee.employeeName = getEmployeeFullName(employee);
    employee.homeSplSite = getEmployeeHomeSplSite(employee);
    employee.isActive = employee.isActive !== false;
  });
  data.employees.sort(getEntitySorter('employees'));
  data.projects.forEach((project) => {
    if(!project.clientId && data.clients.length) project.clientId = data.clients[0].id;
    if(!project.serviceScope) project.serviceScope = 'Field';
    if(!project.projectStatus) project.projectStatus = 'Active';
  });
  data.clients.forEach((client) => {
    client.clientCode = normalizeClientCode(client.clientCode);
  });
  data.parts.forEach((part) => {
    part.partKey = buildFieldPartKey(part);
    part.partName = String(part.partName || part.partNumber || 'Unnamed part').trim();
    part.unitName = String(part.unitName || 'Each').trim() || 'Each';
    part.onHandQuantity = Math.max(0, Math.trunc(Number(part.onHandQuantity || 0)));
    part.reorderPoint = Math.max(0, Math.trunc(Number(part.reorderPoint || 0)));
    part.isActive = part.isActive !== false;
  });
  data.parts.sort(getEntitySorter('parts'));
  const knownSiteTypeKeys = new Set(data.siteTypes.map((siteType) => siteType.siteTypeKey));
  data.sites.forEach((site) => {
    const siteTypeKey = resolveSiteTypeValue(data.siteTypes, site.siteType);
    if(siteTypeKey && !knownSiteTypeKeys.has(siteTypeKey)){
      knownSiteTypeKeys.add(siteTypeKey);
      data.siteTypes.push(normalizeRecord('siteTypes', { id:siteTypeKey, siteTypeKey, siteTypeName:catalogKeyToLabel(site.siteType || siteTypeKey), isActive:true, notes:'' }, { fromRemote:false }));
    }
  });
  data.siteTypes.sort(getEntitySorter('siteTypes'));
  data.sites.forEach((site) => {
    site.siteType = resolveSiteTypeValue(data.siteTypes, site.siteType);
    if(site.clientId && !site.projectId && !normalizeStringArray(site.projectIds).length) site.projectId = ensureLegacyProject(data, site.clientId);
  });
  syncSiteProjectLinks(data);
  syncSiteTypeJobTypeLinks(data);
  syncCatalogStatuses(data);
  data.jobs.forEach((job) => {
    job.jobType = resolveJobTypeValue(data.jobTypes, job.jobType);
    if(job.siteId){
      const site = data.sites.find((row) => row.id === job.siteId) || null;
      if(site){
        if(!job.clientId) job.clientId = site.clientId;
        const linkedProjectIds = normalizeStringArray(site.projectIds);
        if(job.projectId && linkedProjectIds.length && !linkedProjectIds.includes(job.projectId)) job.projectId = '';
        if(!job.projectId && linkedProjectIds.length === 1) job.projectId = linkedProjectIds[0];
      }
    }
    if(job.clientId && !job.projectId) job.projectId = ensureLegacyProject(data, job.clientId);
    if(job.projectId && !job.clientId){
      const project = data.projects.find((row) => row.id === job.projectId) || null;
      if(project) job.clientId = project.clientId;
    }
  });
  syncJobSiteLinks(data);
  data.contacts.forEach((contact) => {
    if(contact.projectId && !contact.clientId){
      const project = data.projects.find((row) => row.id === contact.projectId) || null;
      if(project) contact.clientId = project.clientId;
    }
    if(contact.siteId && !contact.projectId){
      const site = data.sites.find((row) => row.id === contact.siteId) || null;
      if(site){
        if(site.projectIds.length === 1) contact.projectId = site.projectIds[0];
        if(!contact.clientId) contact.clientId = site.clientId;
      }
    }
  });
  syncContactLinks(data);
  data.billingProfiles.forEach((profile) => {
    if(profile.projectId && !profile.clientId){
      const project = data.projects.find((row) => row.id === profile.projectId) || null;
      if(project) profile.clientId = project.clientId;
    }
    const billingContact = data.contacts.find((row) => row.id === profile.billingContactId) || null;
    if(billingContact && billingContact.clientId !== profile.clientId) profile.billingContactId = '';
  });
  consolidateBillingProfiles(data);
  return data;
}

function toRemotePayload(entityKey, draft){
  const cfg = ENTITY_CONFIG[entityKey];
  let sourceDraft = draft;
  if(entityKey === 'samples' && draft){
    const collectionDateTime = draft.collectionDateTime || combineSampleDateTime(draft.sampleDate, draft.sampleTime);
    const parts = splitInputDateTime(collectionDateTime);
    sourceDraft = { ...draft, collectionDateTime, sampleDate:parts.date || draft.sampleDate || '', sampleTime:parts.time || draft.sampleTime || '' };
  }
  const payload = {};
  Object.keys(cfg.defaults).forEach((key) => {
    if((cfg.localOnlyFields || []).includes(key)) return;
    const remoteKey = cfg.fieldMap[key] || key;
    const value = sourceDraft[key];
    if((cfg.booleanFields || []).includes(key)) payload[remoteKey] = !!value;
    else if((cfg.numberFields || []).includes(key)) payload[remoteKey] = normalizeNumber(value);
    else if((cfg.jsonFields || []).includes(key)) payload[remoteKey] = value === null || value === undefined ? clone(cfg.defaults[key]) : clone(value);
    else if((cfg.arrayFields || []).includes(key)) payload[remoteKey] = normalizeStringArray(value);
    else if((cfg.idFields || []).includes(key)) payload[remoteKey] = value ? String(value) : null;
    else if(isDateField(cfg, key, remoteKey)) payload[remoteKey] = toRemoteDate(value);
    else if(isDateTimeField(cfg, key, remoteKey)) payload[remoteKey] = toRemoteDateTime(value);
    else payload[remoteKey] = value === null || value === undefined ? '' : String(value);
  });
  return payload;
}

const localRepository = {
  async list(){ try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? normalizeData(JSON.parse(raw), false) : normalizeData(createEmptyData(), false); } catch { return normalizeData(createEmptyData(), false); } },
  async write(data){ const normalized = normalizeData(data, false); localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)); return normalized; }
};

const remoteRepository = {
  async list(){
    const responses = await Promise.all(ENTITY_ORDER.map((entityKey) => window.appAuth.requestJson(`/rest/v1/${ENTITY_CONFIG[entityKey].table}?select=*`).catch((error) => {
      if(ENTITY_CONFIG[entityKey].optional){
        console.warn(`Optional Field Ops table ${ENTITY_CONFIG[entityKey].table} is unavailable.`, error);
        return [];
      }
      throw error;
    })));
    const out = createEmptyData();
    ENTITY_ORDER.forEach((entityKey, index) => { out[entityKey] = responses[index]; });
    return normalizeData(out, true);
  },
  async saveRecord(entityKey, draft){
    const cfg = ENTITY_CONFIG[entityKey];
    const url = draft.id ? `/rest/v1/${cfg.table}?id=eq.${encodeURIComponent(draft.id)}&select=*` : `/rest/v1/${cfg.table}?select=*`;
    const row = firstRow(await window.appAuth.requestJson(url, { method:draft.id ? 'PATCH' : 'POST', headers:{ 'Content-Type':'application/json', 'Prefer':'return=representation' }, body:JSON.stringify(toRemotePayload(entityKey, draft)) }));
    if(!row?.id) throw new Error('Supabase did not return the saved record.');
    return row.id;
  },
  async deleteRecord(entityKey, id){ await window.appAuth.requestJson(`/rest/v1/${ENTITY_CONFIG[entityKey].table}?id=eq.${encodeURIComponent(id)}`, { method:'DELETE' }); },
  async deleteWhere(table, filters){ if(!filters.length) return; const query = filters.map((filter) => `${filter.column}=eq.${encodeURIComponent(filter.value)}`).join('&'); await window.appAuth.requestJson(`/rest/v1/${table}?${query}`, { method:'DELETE' }); },
  async updateWhere(table, filters, payload){ if(!filters.length) return; const query = filters.map((filter) => `${filter.column}=eq.${encodeURIComponent(filter.value)}`).join('&'); await window.appAuth.requestJson(`/rest/v1/${table}?${query}`, { method:'PATCH', headers:{ 'Content-Type':'application/json', 'Prefer':'return=minimal' }, body:JSON.stringify(payload) }); },
  async patchByQuery(table, query, payload){ if(!query) return; await window.appAuth.requestJson(`/rest/v1/${table}?${query}`, { method:'PATCH', headers:{ 'Content-Type':'application/json', 'Prefer':'return=minimal' }, body:JSON.stringify(payload) }); },
  async insertRows(table, rows){ if(!rows.length) return; await window.appAuth.requestJson(`/rest/v1/${table}`, { method:'POST', headers:{ 'Content-Type':'application/json', 'Prefer':'return=minimal' }, body:JSON.stringify(rows) }); }
};

function buildFieldPartKey(part){
  return normalizeCatalogKey(part?.partKey || part?.partNumber || part?.partName || '');
}
function getPart(id){ return state.data.parts.find((row) => row.id === id) || null; }
function getJobPartsForJob(jobId){ return state.data.jobParts.filter((row) => row.jobId === jobId).sort(getEntitySorter('jobParts')); }
function getJobPartDisplayName(jobPart){
  const part = getPart(jobPart?.partId);
  return part?.partName || jobPart?.partNameSnapshot || 'Unknown part';
}
function getJobPartNumber(jobPart){
  const part = getPart(jobPart?.partId);
  return part?.partNumber || jobPart?.partNumberSnapshot || '';
}
function getPartDisplayCode(part){
  return part?.partNumber || part?.vendorPartNumber || part?.partKey || 'No part number';
}
function getPartStatus(part){
  if(part?.isActive === false) return 'Inactive';
  return Number(part?.onHandQuantity || 0) <= Number(part?.reorderPoint || 0) ? 'Low Stock' : 'In Stock';
}
function getPartStatusBadge(part){
  const status = getPartStatus(part);
  const tone = status === 'In Stock' ? 'ok' : (status === 'Low Stock' ? 'warn' : 'muted');
  return `<span class="status-badge ${tone}">${esc(status)}</span>`;
}
function getExistingJobPartQuantity(jobId, partId){
  return getJobPartsForJob(jobId).find((row) => row.partId === partId)?.quantity || 0;
}
function getPartAvailableForJob(partId, jobId = modalState.id || ''){
  const part = getPart(partId);
  if(!part) return 0;
  return Number(part.onHandQuantity || 0) + Number(jobId ? getExistingJobPartQuantity(jobId, partId) : 0);
}
function getModalPartDrafts(){
  if(!Array.isArray(modalState.formData.partDrafts)) modalState.formData.partDrafts = [];
  return modalState.formData.partDrafts;
}
function buildPartDraftFromJobPart(jobPart){
  return {
    draftId:jobPart.id || uid('partdraft'),
    id:jobPart.id || '',
    partId:jobPart.partId || '',
    quantity:Math.max(1, Math.trunc(Number(jobPart.quantity || 1))),
    notes:jobPart.notes || ''
  };
}
function initializeJobPartDrafts(draft, existingJobId = ''){
  draft.partDrafts = existingJobId ? getJobPartsForJob(existingJobId).map(buildPartDraftFromJobPart) : [];
}
function getJobPartRowsForSave(draft){
  return (Array.isArray(draft.partDrafts) ? draft.partDrafts : [])
    .map((row) => ({
      partId:String(row.partId || ''),
      quantity:Math.max(1, Math.trunc(Number(row.quantity || 1))),
      notes:String(row.notes || '').trim()
    }))
    .filter((row) => row.partId && row.quantity > 0);
}
function validateJobPartDraftsForSave(draft, jobId = modalState.id || ''){
  const rows = getJobPartRowsForSave(draft);
  const seen = new Set();
  for(const row of rows){
    if(seen.has(row.partId)) return 'A part can only appear once on a job.';
    seen.add(row.partId);
    const part = getPart(row.partId);
    if(!part) return 'Each job part must reference an existing inventory part.';
    if(part.isActive === false) return `${part.partName || 'This part'} is inactive. Reactivate it before adding it to a job.`;
    const available = getPartAvailableForJob(row.partId, jobId);
    if(row.quantity > available) return `${part.partName || 'This part'} only has ${available} ${part.unitName || 'unit'}${available === 1 ? '' : 's'} available.`;
  }
  return '';
}
function normalizePartDraftQuantity(value){
  const parsed = Math.trunc(Number(value || 1));
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}
function addJobPartDraft(partId){
  if(!modalState.open || modalState.entity !== 'jobs') return;
  const part = getPart(partId);
  if(!part || part.isActive === false) return;
  const drafts = getModalPartDrafts();
  const existing = drafts.find((row) => row.partId === partId);
  const available = getPartAvailableForJob(partId);
  if(existing){
    existing.quantity = Math.min(available || existing.quantity + 1, normalizePartDraftQuantity(existing.quantity) + 1);
  } else {
    drafts.push({ draftId:uid('partdraft'), id:'', partId, quantity:1, notes:'' });
  }
  renderModal();
  renderJobPartPickerModal();
}
function removeJobPartDraft(draftId){
  if(!modalState.open || modalState.entity !== 'jobs') return;
  modalState.formData.partDrafts = getModalPartDrafts().filter((row) => row.draftId !== draftId);
  renderModal();
  renderJobPartPickerModal();
}
function updateJobPartDraftField(draftId, key, value){
  if(!modalState.open || modalState.entity !== 'jobs') return;
  const row = getModalPartDrafts().find((item) => item.draftId === draftId);
  if(!row) return;
  if(key === 'quantity') row.quantity = normalizePartDraftQuantity(value);
  if(key === 'notes') row.notes = String(value || '');
  renderModal();
}
function setPartPickerFilter(value){
  state.filters.partPickerSearch = String(value || '');
  renderJobPartPickerModal();
}
function openJobPartPicker(){
  if(!modalState.open || modalState.entity !== 'jobs') return;
  state.partPickerOpen = true;
  state.filters.partPickerSearch = '';
  renderJobPartPickerModal();
}
function closeJobPartPicker(){
  state.partPickerOpen = false;
  renderJobPartPickerModal();
}
function getPartActivityLabel(type){
  const labels = {
    stock_received:'Stock Received',
    stock_adjusted:'Stock Adjusted',
    job_part_added:'Added To Job',
    job_part_increased:'Job Quantity Increased',
    job_part_decreased:'Job Quantity Decreased',
    job_part_removed:'Removed From Job'
  };
  return labels[type] || String(type || 'Activity').replace(/_/g, ' ');
}
function renderPartQuantity(value, unitName = 'Each'){
  const qty = Number(value || 0);
  const unit = unitName || 'Each';
  const needsPlural = qty !== 1 && unit.toLowerCase() !== 'each' && !unit.toLowerCase().endsWith('s');
  return `${qty} ${unit}${needsPlural ? 's' : ''}`;
}
function getJobTechnicianSummary(jobId){
  const names = getAssignmentsForJob(jobId)
    .filter((assignment) => assignment.assignmentType === 'Technician' && assignment.resourceId)
    .map((assignment) => getTechnicianLabel(assignment.resourceId))
    .filter((name) => name && name !== 'Unassigned');
  return [...new Set(names)].join(', ') || 'Unassigned';
}
function getPartActivityJobContext(activity){
  const job = activity?.jobId ? getJob(activity.jobId) : null;
  return {
    job,
    jobType:job ? getJobTypeDisplayName(job.jobType) : 'Stock Room',
    jobDate:job ? fmtDate(getJobPrimaryDate(job)) : 'Not job-linked',
    client:job ? getClientLabel(job.clientId) : 'Internal',
    technician:job ? getJobTechnicianSummary(job.id) : 'Not assigned'
  };
}

function getClient(id){ return state.data.clients.find((row) => row.id === id) || null; }
function getProject(id){ return state.data.projects.find((row) => row.id === id) || null; }
function getContact(id){ return state.data.contacts.find((row) => row.id === id) || null; }
function getBillingProfile(id){ return state.data.billingProfiles.find((row) => row.id === id) || null; }
function getPriceItem(id){ return state.data.priceItems.find((row) => row.id === id) || null; }
function getSite(id){ return state.data.sites.find((row) => row.id === id) || null; }
function getJob(id){ return state.data.jobs.find((row) => row.id === id) || null; }
function getEmployee(id){ return state.data.employees.find((row) => row.id === id) || null; }
function getSplSite(id){ return state.data.splSites.find((row) => row.id === id) || null; }
function getAssignmentsForJob(jobId){ return state.data.jobAssignments.filter((row) => row.jobId === jobId); }
function getTechnicianAssignmentsForJob(jobId){
  return getAssignmentsForJob(jobId)
    .filter((row) => row.assignmentType === 'Technician' && row.resourceId)
    .sort((a, b) => compareOptionalDates(parseDateTime(a.createdAt), parseDateTime(b.createdAt)) || compareStrings(a.id, b.id));
}
function getPrimaryTechnicianAssignment(jobId){ return getTechnicianAssignmentsForJob(jobId)[0] || null; }
function getClientLabel(clientId){ return getClient(clientId)?.clientName || 'Unknown client'; }
function getProjectLabel(projectId){ return getProject(projectId)?.projectName || 'Unknown project'; }
function getSiteLabel(siteId){ return getSite(siteId)?.siteName || 'Unknown location'; }
function getSplSiteLabel(siteId){
  const site = getSplSite(siteId);
  return site ? (site.siteName || site.locationLabel || 'Unnamed SPL site') : 'Unknown SPL site';
}
function getDefaultSplSiteId(){
  return (state.data.splSites.find((site) => site.isActive !== false) || state.data.splSites[0] || null)?.id || '';
}
function getProjectIdsForSite(siteId){
  const ids = state.data.siteProjects.filter((row) => row.siteId === siteId).map((row) => row.projectId);
  const legacyProjectId = getSite(siteId)?.projectId || '';
  if(legacyProjectId) ids.push(legacyProjectId);
  return [...new Set(ids.filter(Boolean))];
}
function getLinkedProjectsForSite(siteId){ return getProjectIdsForSite(siteId).map((projectId) => getProject(projectId)).filter(Boolean).sort(getEntitySorter('projects')); }
function getProjectIdsForContact(contactId){
  const ids = state.data.contactProjects.filter((row) => row.contactId === contactId).map((row) => row.projectId);
  const legacyProjectId = getContact(contactId)?.projectId || '';
  if(legacyProjectId) ids.push(legacyProjectId);
  return [...new Set(ids.filter(Boolean))];
}
function getSiteIdsForContact(contactId){
  const ids = state.data.contactSites.filter((row) => row.contactId === contactId).map((row) => row.siteId);
  const legacySiteId = getContact(contactId)?.siteId || '';
  if(legacySiteId) ids.push(legacySiteId);
  return [...new Set(ids.filter(Boolean))];
}
function getLinkedProjectsForContact(contactId){ return getProjectIdsForContact(contactId).map((projectId) => getProject(projectId)).filter(Boolean).sort(getEntitySorter('projects')); }
function getLinkedSitesForContact(contactId){ return getSiteIdsForContact(contactId).map((siteId) => getSite(siteId)).filter(Boolean).sort(getEntitySorter('sites')); }
function getContactLabel(contactId){
  const contact = getContact(contactId);
  return contact ? getContactDisplayName(contact) : 'No manager';
}
function getPriceItemLabel(priceItemId){
  const item = getPriceItem(priceItemId);
  return item ? `${item.method || 'No method'} - ${item.description || 'No description'}` : 'Unknown price item';
}
function getActivePriceItems(){
  return state.data.priceItems.filter((item) => item.isActive !== false).sort(getEntitySorter('priceItems'));
}
function getBillingPricesForProfile(profileId, effectiveYear = BILLING_RATE_EFFECTIVE_YEAR){
  return state.data.billingProfilePrices
    .filter((row) => row.billingProfileId === profileId && Number(row.effectiveYear || BILLING_RATE_EFFECTIVE_YEAR) === Number(effectiveYear))
    .sort(getEntitySorter('billingProfilePrices'));
}
function getBillingPriceCount(profileId){
  return getBillingPricesForProfile(profileId).filter((row) => row.isActive !== false && normalizeNumber(row.rateAmount) !== null).length;
}
function buildBillingPriceDrafts(profileId = ''){
  const existingPrices = new Map(getBillingPricesForProfile(profileId).map((row) => [row.priceItemId, row]));
  return getActivePriceItems().map((item) => {
    const existing = existingPrices.get(item.id) || null;
    return {
      draftId:existing?.id || `${profileId || 'draft'}::${item.id}`,
      id:existing?.id || '',
      billingProfileId:profileId || '',
      priceItemId:item.id,
      rateAmount:normalizeNumber(existing?.rateAmount),
      currencyCode:existing?.currencyCode || 'USD',
      effectiveYear:Number(existing?.effectiveYear || BILLING_RATE_EFFECTIVE_YEAR),
      isActive:existing ? existing.isActive !== false : true,
      notes:existing?.notes || ''
    };
  });
}
function getModalBillingPriceDrafts(){
  if(!Array.isArray(modalState.formData.priceDrafts)) modalState.formData.priceDrafts = buildBillingPriceDrafts(modalState.id || modalState.formData.id || '');
  return modalState.formData.priceDrafts;
}
function updateBillingPriceDraft(priceItemId, key, value, mode = 'text'){
  if(!modalState.open || modalState.entity !== 'billingRates') return;
  const row = getModalBillingPriceDrafts().find((item) => item.priceItemId === priceItemId);
  if(!row) return;
  if(key === 'rateAmount') row.rateAmount = mode === 'number' ? normalizeNumber(value) : value;
  else if(key === 'isActive') row.isActive = !!value;
  else if(key === 'notes') row.notes = String(value || '');
}
function getContactsForSite(siteId){
  const site = getSite(siteId);
  if(!site) return [];
  return state.data.contacts
    .filter((contact) => contact.clientId === site.clientId && getSiteIdsForContact(contact.id).includes(site.id))
    .sort(getEntitySorter('contacts'));
}
function getSiteTypeRecord(value){
  const resolvedValue = resolveSiteTypeValue(state.data.siteTypes, value);
  return state.data.siteTypes.find((siteType) => siteType.siteTypeKey === resolvedValue) || null;
}
function getActiveSiteTypes(currentValue = ''){
  const resolvedValue = resolveSiteTypeValue(state.data.siteTypes, currentValue);
  return state.data.siteTypes.filter((siteType) => siteType.isActive || siteType.siteTypeKey === resolvedValue).sort(getEntitySorter('siteTypes'));
}
function getSiteTypeDisplayName(value){
  const record = getSiteTypeRecord(value);
  if(record?.siteTypeName) return record.siteTypeName;
  return String(value || '').trim() ? 'Unknown site type' : 'Not set';
}
function getDefaultJobTypeKeysForSiteType(value){
  const siteTypeKey = resolveSiteTypeValue(state.data.siteTypes, value);
  return state.data.siteTypeJobTypes.filter((row) => row.siteTypeKey === siteTypeKey).map((row) => row.jobTypeKey);
}
function getDefaultJobTypeLabelsForSiteType(value){
  return getDefaultJobTypeKeysForSiteType(value).map((jobTypeKey) => getJobTypeDisplayName(jobTypeKey)).filter(Boolean);
}
function getJobTypeRecord(value){
  const resolvedValue = resolveJobTypeValue(state.data.jobTypes, value);
  return state.data.jobTypes.find((jobType) => jobType.jobTypeKey === resolvedValue) || null;
}
function getActiveJobTypes(currentValue = ''){
  const resolvedValue = resolveJobTypeValue(state.data.jobTypes, currentValue);
  return state.data.jobTypes.filter((jobType) => jobType.isActive || jobType.jobTypeKey === resolvedValue).sort(getEntitySorter('jobTypes'));
}
function getJobTypeDisplayName(value){
  if(value && typeof value === 'object') return value.jobTypeName || catalogKeyToLabel(value.jobTypeKey) || 'Unknown job type';
  const record = getJobTypeRecord(value);
  if(record?.jobTypeName) return record.jobTypeName;
  return String(value || '').trim() ? 'Unknown job type' : 'Not set';
}
function getJobTypeScheduleMode(value){
  const record = getJobTypeRecord(value);
  if(record?.scheduleMode) return record.scheduleMode;
  return isSampleTransportJobType(value) ? 'point_in_time' : 'range';
}
function getRequiredAssignmentTypes(value){
  const record = getJobTypeRecord(value);
  return record ? normalizeStringArray(record.requiredAssignmentTypes) : [];
}
function jobTypeAllowsMultipleSites(value){
  const record = getJobTypeRecord(value);
  return !!record?.allowMultipleSites;
}
function jobTypeHasDetailGroup(value, group){
  const record = getJobTypeRecord(value);
  if(!record) return false;
  const groups = normalizeStringArray(record.detailGroups);
  if(group === JOB_PARTS_DETAIL_GROUP){
    return !groups.includes(JOB_PARTS_DISABLED_DETAIL_GROUP);
  }
  return groups.includes(group);
}
function getJobDisplayTitle(job){
  const jobTypeLabel = getJobTypeDisplayName(job?.jobType);
  if(jobTypeLabel && jobTypeLabel !== 'Not set') return jobTypeLabel;
  if(String(job?.scopeSummary || '').trim()) return String(job.scopeSummary).trim();
  return `Job ${(job?.id || '').slice(0, 8) || 'Draft'}`;
}
function getJobScheduleLabel(job){
  const start = job?.scheduledStart || job?.requestedDate || '';
  if(!start) return 'Not scheduled';
  if(getJobTypeScheduleMode(job?.jobType) === 'point_in_time' || !job?.scheduledEnd) return fmtDateTime(start);
  return `${fmtDateTime(start)} to ${fmtDateTime(job.scheduledEnd)}`;
}
function getSampleGroupHeaderTitle(job){
  if(!job) return 'Manual Samples';
  return `${getClientLabel(job.clientId)} | ${fmtDate(getJobPrimaryDate(job))}`;
}
function isActiveEmployee(employee){ return !!employee && employee.isActive !== false; }
function isFieldEligibleEmployee(employee){ return isActiveEmployee(employee) && ['Field', 'Both'].includes(employee.workScope || ''); }
function isEmployeeEligibleForJobType(employee, jobType = ''){
  if(!isActiveEmployee(employee)) return false;
  if(['Field', 'Both'].includes(employee.workScope || '')) return true;
  if((employee.workScope || '') !== 'Lab') return false;
  const jobTypeRecord = getJobTypeRecord(jobType);
  return !!(jobTypeRecord?.labEmployeeEligible && employee.canSampleTransport);
}
function canAssignEmployeeToJobType(employee, jobType = ''){
  return isEmployeeEligibleForJobType(employee, jobType);
}
function isAssignableEmployeeResource(employee){
  return isActiveEmployee(employee) && (['Field', 'Both'].includes(employee.workScope || '') || ((employee.workScope || '') === 'Lab' && employee.canSampleTransport));
}
function isSampleTransportJobType(jobType){
  const normalized = normalizeJobTypeKey(jobType);
  return ['SAMPLE_PICKUP', 'SAMPLE_DROP_OFF'].includes(normalized) || ['Sample Pickup', 'Sample Drop-Off'].includes(jobType);
}
function getDefaultTruckForTechnician(technicianId){
  return state.data.trucks.find((row) => row.assignedTechnicianId === technicianId) || null;
}
function getProjectIdsForClient(clientId){ return state.data.projects.filter((row) => row.clientId === clientId).map((row) => row.id); }
function getSiteIdsForClient(clientId){ return state.data.sites.filter((row) => row.clientId === clientId).map((row) => row.id); }
function getSitesForProject(projectId){ return state.data.sites.filter((row) => getProjectIdsForSite(row.id).includes(projectId)); }
function getJobsForProject(projectId){ return state.data.jobs.filter((row) => row.projectId === projectId); }
function getContactsForClient(clientId){ return state.data.contacts.filter((row) => row.clientId === clientId); }
function getBillingProfilesForClient(clientId){ return state.data.billingProfiles.filter((row) => row.clientId === clientId); }
function getBillingProfileForClient(clientId){ return getBillingProfilesForClient(clientId).sort(compareBillingProfileKeepPriority)[0] || null; }
function getBillingContactLabel(profile){
  const contact = getContact(profile?.billingContactId || '');
  if(!contact) return 'No billing contact';
  return [getContactDisplayName(contact), contact.contactRole].filter(Boolean).join(' | ');
}
function getJobSiteIds(jobOrId){
  const job = typeof jobOrId === 'object' && jobOrId !== null ? jobOrId : getJob(jobOrId);
  if(!job) return [];
  const linkedIds = normalizeStringArray(job.siteIds).length
    ? normalizeStringArray(job.siteIds)
    : state.data.jobSites.filter((row) => row.jobId === job.id).map((row) => row.siteId);
  return normalizeStringArray([job.siteId, ...linkedIds]);
}
function getNormalizedJobSiteIds(job){
  const primarySiteId = String(job?.siteId || '').trim();
  const siteIds = jobTypeAllowsMultipleSites(job?.jobType) ? normalizeStringArray([primarySiteId, ...normalizeStringArray(job?.siteIds)]) : normalizeStringArray(primarySiteId);
  return siteIds.filter((siteId) => {
    const site = getSite(siteId);
    return !site || !job?.clientId || site.clientId === job.clientId;
  });
}
function jobHasSite(job, siteId){ return !!siteId && getJobSiteIds(job).includes(siteId); }
function getJobSites(jobOrId){ return getJobSiteIds(jobOrId).map((siteId) => getSite(siteId)).filter(Boolean); }
function getJobSiteSummary(jobOrId){
  const sites = getJobSites(jobOrId);
  if(!sites.length) return 'Unknown location';
  const labels = sites.map((site) => site.siteName || 'Unnamed location');
  return labels.length > 2 ? `${labels.slice(0, 2).join(', ')} +${labels.length - 2} more` : labels.join(', ');
}
function getJobsForClientOrSites(clientId, siteIds = getSiteIdsForClient(clientId), projectIds = getProjectIdsForClient(clientId)){ return state.data.jobs.filter((row) => row.clientId === clientId || projectIds.includes(row.projectId) || siteIds.some((siteId) => jobHasSite(row, siteId))); }
function getSamplesForClientOrSites(clientId, siteIds = getSiteIdsForClient(clientId), jobIds = getJobsForClientOrSites(clientId, siteIds).map((row) => row.id)){ return state.data.samples.filter((row) => row.clientId === clientId || siteIds.includes(row.siteId) || jobIds.includes(row.jobId)); }
function getJobsForSite(siteId){ return state.data.jobs.filter((row) => jobHasSite(row, siteId)); }
function getSamplesForSite(siteId, jobIds = getJobsForSite(siteId).map((row) => row.id)){ return state.data.samples.filter((row) => row.siteId === siteId || jobIds.includes(row.jobId)); }
function getSamplesForJob(jobId){
  return state.data.samples
    .filter((row) => row.jobId === jobId)
    .sort((a, b) => (Number(a.sampleSequence || 0) - Number(b.sampleSequence || 0)) || compareStrings(a.id, b.id));
}
function createSampleDraft(source = {}, sequence = 1){
  const collectionParts = splitInputDateTime(source.collectionDateTime);
  const collectionDateTime = toInputDateTime(source.collectionDateTime || combineSampleDateTime(source.sampleDate || collectionParts.date, source.sampleTime || collectionParts.time));
  return {
    draftId:String(source.draftId || source.id || uid('sampledraft')),
    id:String(source.id || ''),
    siteId:String(source.siteId || ''),
    sampleType:normalizeSampleTypeForWorkflow(source.sampleType),
    sampleName:String(source.sampleName || ''),
    samplePoint:String(source.samplePoint || ''),
    collectionDateTime,
    sampleDate:toInputDate(source.sampleDate || collectionParts.date),
    sampleTime:String(source.sampleTime || collectionParts.time || ''),
    isDuplicate:normalizeBoolean(source.isDuplicate),
    sampleCollectionMode:['Composite', 'Spot'].includes(source.sampleCollectionMode) ? source.sampleCollectionMode : '',
    cylinderNumber:String(source.cylinderNumber || ''),
    testCodes:filterTestCodesForSampleType(source.testCodes, source.sampleType),
    sampleTempF:normalizeNumber(source.sampleTempF),
    samplePressurePsig:normalizeNumber(source.samplePressurePsig),
    notes:String(source.notes || ''),
    sampleStatus:normalizeSampleStatus(source.sampleStatus, source),
    linkedWorkOrderId:String(source.linkedWorkOrderId || ''),
    linkedWorkOrderNumber:String(source.linkedWorkOrderNumber || ''),
    labReceivedAt:String(source.labReceivedAt || ''),
    sampleSequence:Number(source.sampleSequence || sequence)
  };
}
function buildSampleDraftsForJob(jobId){
  return getSamplesForJob(jobId).map((sample, index) => createSampleDraft(sample, index + 1));
}
function getModalSampleDrafts(){
  return Array.isArray(modalState.formData.sampleDrafts) ? modalState.formData.sampleDrafts : [];
}
function readFileAsText(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read the selected file.'));
    reader.readAsText(file);
  });
}
function splitCsvRows(text){
  const rows = [];
  let row = [];
  let value = '';
  let quoted = false;
  const raw = String(text || '').replace(/^\uFEFF/, '');
  for(let index = 0; index < raw.length; index += 1){
    const ch = raw[index];
    if(ch === '"'){
      if(quoted && raw[index + 1] === '"'){
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if(ch === ',' && !quoted){
      row.push(value.trim());
      value = '';
    } else if((ch === '\n' || ch === '\r') && !quoted){
      if(ch === '\r' && raw[index + 1] === '\n') index += 1;
      row.push(value.trim());
      if(row.some((cell) => String(cell || '').trim())) rows.push(row);
      row = [];
      value = '';
    } else {
      value += ch;
    }
  }
  row.push(value.trim());
  if(row.some((cell) => String(cell || '').trim())) rows.push(row);
  return rows;
}
function normalizeSampleImportHeader(value){
  return String(value || '').trim().toLowerCase().replace(/[#/()]/g, ' ').replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}
function parseSampleImportCsv(text){
  const rows = splitCsvRows(text);
  if(rows.length < 2) throw new Error('The selected CSV does not contain any sample rows.');
  const headers = rows[0].map(normalizeSampleImportHeader);
  const aliases = {
    sampleName:['sample id', 'sample', 'sample name', 'sample number', 'sample no', 'sample identifier'],
    samplePoint:['sample point', 'point', 'sample location', 'location'],
    collectionDateTime:['sample date time', 'sample datetime', 'collection date time', 'collected at', 'date time'],
    sampleDate:['sample date', 'collection date', 'date'],
    sampleTime:['sample time', 'collection time', 'time'],
    sampleType:['sample type', 'type', 'matrix', 'matrix type'],
    cylinderNumber:['cylinder', 'cylinder number', 'cylinder no', 'container', 'container number'],
    sampleTempF:['sample temp f', 'sample temperature f', 'temp f', 'temperature f', 'sample temp'],
    samplePressurePsig:['sample pressure psig', 'pressure psig', 'sample pressure', 'pressure'],
    testCodes:['test codes required', 'test codes', 'tests', 'test code', 'analysis', 'analyses'],
    isDuplicate:['duplicate', 'dup', 'is duplicate'],
    sampleCollectionMode:['composite spot', 'collection mode', 'sample collection mode', 'mode'],
    notes:['comments', 'comment', 'notes', 'note']
  };
  const headerIndex = (key) => aliases[key].map((alias) => headers.indexOf(alias)).find((index) => index >= 0) ?? -1;
  const indexes = Object.fromEntries(Object.keys(aliases).map((key) => [key, headerIndex(key)]));
  if(indexes.sampleName < 0 && indexes.cylinderNumber < 0) throw new Error('The CSV needs at least a Sample ID or Cylinder # column.');
  const bySample = new Map();
  const getCell = (cells, key) => indexes[key] >= 0 ? String(cells[indexes[key]] || '').trim() : '';
  const parseImportedTests = (raw, sampleType) => {
    const defs = getLabTestsForSampleType(sampleType);
    const byKey = new Map(defs.map((def) => [def.key, def.key]));
    const byLabel = new Map(defs.map((def) => [normalizeCatalogKey(def.label), def.key]));
    return String(raw || '').split(/[;|,]+/).map((part) => {
      const key = normalizeCatalogKey(part);
      return byKey.get(key) || byLabel.get(key) || '';
    }).filter(Boolean);
  };
  rows.slice(1).forEach((cells, index) => {
    const sampleName = getCell(cells, 'sampleName');
    const cylinderNumber = getCell(cells, 'cylinderNumber');
    if(!sampleName && !cylinderNumber) return;
    const rawType = getCell(cells, 'sampleType');
    const sampleType = /^(liq|oil|cond)/i.test(rawType) ? 'Liquid' : normalizeSampleTypeForWorkflow(rawType || 'Gas');
    const sampleDate = getCell(cells, 'sampleDate');
    const sampleTime = getCell(cells, 'sampleTime');
    const collectionDateTime = getCell(cells, 'collectionDateTime') || combineSampleDateTime(sampleDate, sampleTime);
    const mode = getCell(cells, 'sampleCollectionMode');
    const draft = createSampleDraft({
      sampleName,
      samplePoint:getCell(cells, 'samplePoint'),
      collectionDateTime,
      sampleDate,
      sampleTime,
      sampleType,
      cylinderNumber,
      sampleTempF:getCell(cells, 'sampleTempF'),
      samplePressurePsig:getCell(cells, 'samplePressurePsig'),
      isDuplicate:/^(true|yes|y|1|duplicate|dup)$/i.test(getCell(cells, 'isDuplicate')),
      sampleCollectionMode:/^comp/i.test(mode) ? 'Composite' : (/^spot/i.test(mode) ? 'Spot' : ''),
      notes:getCell(cells, 'notes'),
      sampleSequence:index + 1
    }, index + 1);
    draft.testCodes = parseImportedTests(getCell(cells, 'testCodes'), draft.sampleType);
    const key = sampleName || cylinderNumber;
    if(bySample.has(key)){
      const existing = bySample.get(key);
      existing.testCodes = filterTestCodesForSampleType([...existing.testCodes, ...draft.testCodes], existing.sampleType);
      if(draft.notes && !existing.notes) existing.notes = draft.notes;
    } else {
      bySample.set(key, draft);
    }
  });
  const drafts = [...bySample.values()].map((draft, index) => createSampleDraft({ ...draft, sampleSequence:index + 1 }, index + 1));
  if(!drafts.length) throw new Error('No importable sample rows were found in the CSV.');
  if(drafts.length > 50) throw new Error('Sample Logistics supports up to 50 samples per job.');
  return drafts;
}
function ensureModalSampleDrafts(){
  if(!modalState.open || modalState.entity !== 'jobs') return [];
  const count = Math.max(0, Number(modalState.formData.sampleCount || 0));
  const drafts = getModalSampleDrafts().map((row, index) => createSampleDraft(row, index + 1));
  const defaultDateTime = splitInputDateTime(modalState.formData.scheduledStart || modalState.formData.requestedDate || '');
  while(drafts.length < count) drafts.push(createSampleDraft({ siteId:modalState.formData.siteId || '', sampleType:'Gas', collectionDateTime:combineSampleDateTime(defaultDateTime.date, defaultDateTime.time) }, drafts.length + 1));
  modalState.formData.sampleDrafts = drafts.slice(0, count).map((row, index) => ({ ...row, sampleSequence:index + 1 }));
  normalizeModalSampleSiteIds();
  return modalState.formData.sampleDrafts;
}
function initializeJobSampleDrafts(draft, existingJobId = ''){
  const rows = existingJobId ? buildSampleDraftsForJob(existingJobId) : [];
  draft.sampleDrafts = rows;
  draft.sampleCount = rows.length || '';
  draft.samplesRequired = rows.length > 0 || !!draft.samplesRequired;
}
function updateJobSampleCount(value){
  if(!modalState.open || modalState.entity !== 'jobs') return;
  const nextCount = Math.max(0, Math.min(50, Number(value || 0)));
  modalState.formData.sampleCount = nextCount || '';
  ensureModalSampleDrafts();
  modalState.formData.samplesRequired = jobTypeHasDetailGroup(modalState.formData.jobType, 'sample_logistics') || nextCount > 0;
  renderModal();
}
function updateJobSampleDraftField(draftId, key, value){
  if(!modalState.open || modalState.entity !== 'jobs') return;
  const row = getModalSampleDrafts().find((item) => item.draftId === draftId);
  if(!row) return;
  let shouldRender = false;
  if(key === 'sampleType'){
    row.sampleType = normalizeSampleTypeForWorkflow(value);
    row.testCodes = filterTestCodesForSampleType(row.testCodes, row.sampleType);
    shouldRender = true;
  }
  else if(key === 'sampleName') row.sampleName = String(value || '');
  else if(key === 'samplePoint') row.samplePoint = String(value || '');
  else if(key === 'siteId') row.siteId = String(value || '');
  else if(key === 'collectionDateTime'){
    const parts = splitInputDateTime(value);
    row.collectionDateTime = toInputDateTime(value);
    row.sampleDate = parts.date;
    row.sampleTime = parts.time;
  }
  else if(key === 'isDuplicate') row.isDuplicate = !!value;
  else if(key === 'sampleCollectionMode'){
    row.sampleCollectionMode = row.sampleCollectionMode === value ? '' : (['Composite', 'Spot'].includes(value) ? value : '');
    shouldRender = true;
  }
  else if(key === 'cylinderNumber') row.cylinderNumber = String(value || '');
  else if(key === 'sampleTempF') row.sampleTempF = normalizeNumber(value);
  else if(key === 'samplePressurePsig') row.samplePressurePsig = normalizeNumber(value);
  else if(key === 'notes') row.notes = String(value || '');
  if(shouldRender) renderModal();
}
function setJobSampleDraftTests(draftId, values){
  if(!modalState.open || modalState.entity !== 'jobs') return;
  const row = getModalSampleDrafts().find((item) => item.draftId === draftId);
  if(!row) return;
  row.testCodes = filterTestCodesForSampleType(values, row.sampleType);
  renderModal();
  renderSampleTableModal();
}
function toggleJobSampleDraftTest(draftId, testKey){
  if(!modalState.open || modalState.entity !== 'jobs') return;
  const row = getModalSampleDrafts().find((item) => item.draftId === draftId);
  if(!row) return;
  const key = normalizeCatalogKey(testKey);
  const values = filterTestCodesForSampleType(row.testCodes, row.sampleType);
  row.testCodes = values.includes(key) ? values.filter((value) => value !== key) : [...values, key];
  modalState.openSampleTestDraftId = draftId;
  renderModal();
}
function toggleJobSampleTestDropdown(draftId){
  if(!modalState.open || modalState.entity !== 'jobs') return;
  modalState.openSampleTestDraftId = modalState.openSampleTestDraftId === draftId ? '' : draftId;
  renderModal();
}
function saveJobSampleTestSelection(draftId){
  if(!modalState.open || modalState.entity !== 'jobs') return;
  if(modalState.openSampleTestDraftId === draftId) modalState.openSampleTestDraftId = '';
  renderModal();
}
function isJobSampleDraftExpanded(draftId){
  return !!modalState.sampleDraftExpanded?.[draftId];
}
function toggleJobSampleDraftExpanded(draftId){
  if(!modalState.open || modalState.entity !== 'jobs') return;
  modalState.sampleDraftExpanded = { ...(modalState.sampleDraftExpanded || {}), [draftId]:!isJobSampleDraftExpanded(draftId) };
  renderModal();
}
function setAllJobSampleDraftsExpanded(expanded){
  if(!modalState.open || modalState.entity !== 'jobs') return;
  modalState.sampleDraftExpanded = {};
  getModalSampleDrafts().forEach((row) => {
    modalState.sampleDraftExpanded[row.draftId] = !!expanded;
  });
  renderModal();
}
function openSampleTableModal(){
  if(!modalState.open || modalState.entity !== 'jobs') return;
  ensureModalSampleDrafts();
  state.sampleTableModalOpen = true;
  renderSampleTableModal();
}
function openSampleLogisticsImportPicker(){
  if(!modalState.open || modalState.entity !== 'jobs') return;
  document.getElementById('sample-logistics-import-file')?.click();
}
async function handleSampleLogisticsImportSelected(event){
  const file = event?.target?.files?.[0];
  if(!modalState.open || modalState.entity !== 'jobs' || !file) return;
  if(!/\.csv$/i.test(file.name || '') && !String(file.type || '').includes('csv')){
    alert('Please choose a CSV file.');
    event.target.value = '';
    return;
  }
  try {
    const existingCount = getModalSampleDrafts().length;
    if(existingCount && !confirm(`Importing samples will replace the ${existingCount} current sample draft${existingCount === 1 ? '' : 's'} for this job. Continue?`)) return;
    const drafts = parseSampleImportCsv(await readFileAsText(file));
    modalState.formData.sampleDrafts = drafts;
    modalState.formData.sampleCount = drafts.length;
    modalState.formData.samplesRequired = true;
    normalizeModalSampleSiteIds();
    modalState.sampleDraftExpanded = {};
    renderModal();
    renderSampleTableModal();
    alert(`Imported ${drafts.length} sample${drafts.length === 1 ? '' : 's'}. Use the Job Save button to persist them.`);
  } catch (error){
    console.error('Sample Logistics import failed:', error);
    alert(error.message || 'Unable to import the selected CSV.');
  } finally {
    if(event?.target) event.target.value = '';
  }
}
function closeSampleTableModal(){
  state.sampleTableModalOpen = false;
  renderSampleTableModal();
}
function getSampleTableScrollState(){
  const wrap = document.querySelector('#sample-table-modal-body .sample-table-wrap');
  return wrap ? { left:wrap.scrollLeft, top:wrap.scrollTop } : null;
}
function restoreSampleTableScrollState(scrollState){
  if(!scrollState) return;
  const wrap = document.querySelector('#sample-table-modal-body .sample-table-wrap');
  if(!wrap) return;
  wrap.scrollLeft = scrollState.left;
  wrap.scrollTop = scrollState.top;
}
function withSampleTableScrollPreserved(callback){
  const scrollState = getSampleTableScrollState();
  callback();
  restoreSampleTableScrollState(scrollState);
}
function updateSampleTableDraftField(draftId, key, value){
  withSampleTableScrollPreserved(() => {
    updateJobSampleDraftField(draftId, key, value);
    if(['sampleType', 'sampleCollectionMode'].includes(key)) renderSampleTableModal();
  });
}
function updateSampleTableDraftTests(draftId, selectNode){
  const values = Array.from(selectNode?.selectedOptions || []).map((option) => option.value);
  withSampleTableScrollPreserved(() => setJobSampleDraftTests(draftId, values));
}
function renderSampleTableRows(){
  const rows = getModalSampleDrafts();
  if(!rows.length) return '<div class="empty-state">Set the sample count in Sample Logistics before using table entry.</div>';
  const siteOptions = getNormalizedJobSiteIds(modalState.formData).map((siteId) => ({ value:siteId, label:getSiteLabel(siteId) }));
  return `<div class="sample-table-wrap"><table class="sample-entry-table"><thead><tr><th>Sample #</th><th>Sample ID</th><th>Sample Point</th><th>Sample Site</th><th>Sample Date / Time</th><th>Sample Type</th><th>Cylinder #</th><th>Sample Temp (F)</th><th>Sample Pressure (PSIG)</th><th>Test Codes Required</th><th>Duplicate</th><th>Composite / Spot</th><th>Comments</th></tr></thead><tbody>${rows.map((row, index) => {
    const sampleType = normalizeSampleTypeForWorkflow(row.sampleType);
    const tests = getLabTestsForSampleType(sampleType);
    const selectedTests = filterTestCodesForSampleType(row.testCodes, sampleType);
    return `<tr><td class="sample-table-sequence">#${index + 1}</td><td><input class="sample-table-input" type="text" value="${esc(row.sampleName || '')}" required oninput="updateSampleTableDraftField('${esc(row.draftId)}', 'sampleName', this.value)"></td><td><input class="sample-table-input" type="text" value="${esc(row.samplePoint || '')}" oninput="updateSampleTableDraftField('${esc(row.draftId)}', 'samplePoint', this.value)"></td><td><select class="sample-table-input" onchange="updateSampleTableDraftField('${esc(row.draftId)}', 'siteId', this.value)">${siteOptions.map((option) => `<option value="${esc(option.value)}" ${row.siteId === option.value ? 'selected' : ''}>${esc(option.label)}</option>`).join('')}</select></td><td><input class="sample-table-input" type="datetime-local" value="${esc(row.collectionDateTime || '')}" oninput="updateSampleTableDraftField('${esc(row.draftId)}', 'collectionDateTime', this.value)"></td><td><select class="sample-table-input" onchange="updateSampleTableDraftField('${esc(row.draftId)}', 'sampleType', this.value)"><option value="Gas" ${sampleType === 'Gas' ? 'selected' : ''}>Gas</option><option value="Liquid" ${sampleType === 'Liquid' ? 'selected' : ''}>Liquid</option></select></td><td><input class="sample-table-input" type="text" value="${esc(row.cylinderNumber || '')}" required oninput="updateSampleTableDraftField('${esc(row.draftId)}', 'cylinderNumber', this.value)"></td><td><input class="sample-table-input" type="number" step="0.1" value="${esc(row.sampleTempF ?? '')}" oninput="updateSampleTableDraftField('${esc(row.draftId)}', 'sampleTempF', this.value)"></td><td><input class="sample-table-input" type="number" step="0.1" value="${esc(row.samplePressurePsig ?? '')}" oninput="updateSampleTableDraftField('${esc(row.draftId)}', 'samplePressurePsig', this.value)"></td><td><select class="sample-table-input sample-table-tests" multiple size="5" required onchange="updateSampleTableDraftTests('${esc(row.draftId)}', this)">${tests.map((test) => `<option value="${esc(test.key)}" ${selectedTests.includes(test.key) ? 'selected' : ''}>${esc(test.label)}</option>`).join('')}</select></td><td class="sample-table-check"><input type="checkbox" ${row.isDuplicate ? 'checked' : ''} onchange="updateSampleTableDraftField('${esc(row.draftId)}', 'isDuplicate', this.checked)"></td><td><select class="sample-table-input" onchange="updateSampleTableDraftField('${esc(row.draftId)}', 'sampleCollectionMode', this.value)"><option value="" ${!row.sampleCollectionMode ? 'selected' : ''}>Not set</option><option value="Composite" ${row.sampleCollectionMode === 'Composite' ? 'selected' : ''}>Composite</option><option value="Spot" ${row.sampleCollectionMode === 'Spot' ? 'selected' : ''}>Spot</option></select></td><td><textarea class="sample-table-input sample-table-comments" oninput="updateSampleTableDraftField('${esc(row.draftId)}', 'notes', this.value)">${esc(row.notes || '')}</textarea></td></tr>`;
  }).join('')}</tbody></table></div>`;
}
function renderSampleTableModal(){
  const overlay = document.getElementById('sample-table-modal-overlay');
  if(!overlay) return;
  if(!state.sampleTableModalOpen || !modalState.open || modalState.entity !== 'jobs'){
    overlay.classList.remove('open');
    return;
  }
  overlay.classList.add('open');
  document.getElementById('sample-table-modal-body').innerHTML = `<div class="sample-table-intro"><strong>${esc(getJobTypeDisplayName(modalState.formData.jobType))}</strong><span>${esc(getModalSampleDrafts().length)} sample${getModalSampleDrafts().length === 1 ? '' : 's'} in this job draft. Use the Job Save button to persist these edits.</span></div>${renderSampleTableRows()}`;
}
function getSampleStatusCounts(samples){
  const counts = { needsPulled:0, received:0 };
  samples.forEach((sample) => {
    if(normalizeSampleStatus(sample.sampleStatus, sample) === 'Received by Lab') counts.received += 1;
    else counts.needsPulled += 1;
  });
  return counts;
}
function getClientDeleteBlockMessage(clientId){
  const siteIds = getSiteIdsForClient(clientId);
  const jobs = getJobsForClientOrSites(clientId, siteIds);
  const samples = getSamplesForClientOrSites(clientId, siteIds, jobs.map((row) => row.id));
  const travel = state.data.technicianTravel.filter((row) => siteIds.includes(row.originClientSiteId) || siteIds.includes(row.destinationClientSiteId));
  if(!jobs.length && !samples.length && !travel.length) return '';
  return `This client cannot be deleted because it still has ${jobs.length} linked job${jobs.length === 1 ? '' : 's'}, ${samples.length} linked sample${samples.length === 1 ? '' : 's'}, and ${travel.length} travel entr${travel.length === 1 ? 'y' : 'ies'}. Clear those records first.`;
}
function getProjectDeleteBlockMessage(projectId){
  const sites = getSitesForProject(projectId);
  const jobs = getJobsForProject(projectId);
  const siteIds = sites.map((site) => site.id);
  const travel = state.data.technicianTravel.filter((row) => siteIds.includes(row.originClientSiteId) || siteIds.includes(row.destinationClientSiteId));
  if(!sites.length && !jobs.length && !travel.length) return '';
  return `This project cannot be deleted because it still has ${sites.length} linked site/location record${sites.length === 1 ? '' : 's'}, ${jobs.length} linked job${jobs.length === 1 ? '' : 's'}, and ${travel.length} travel entr${travel.length === 1 ? 'y' : 'ies'}. Clear or move those records first.`;
}
function getSiteDeleteBlockMessage(siteId){
  const jobs = getJobsForSite(siteId);
  const samples = getSamplesForSite(siteId, jobs.map((row) => row.id));
  const travel = state.data.technicianTravel.filter((row) => row.originClientSiteId === siteId || row.destinationClientSiteId === siteId);
  if(!jobs.length && !samples.length && !travel.length) return '';
  return `This site/location cannot be deleted because it still has ${jobs.length} linked job${jobs.length === 1 ? '' : 's'}, ${samples.length} linked sample${samples.length === 1 ? '' : 's'}, and ${travel.length} travel entr${travel.length === 1 ? 'y' : 'ies'}. Clear those records first.`;
}
function getSplSiteDeleteBlockMessage(siteId){
  const travel = state.data.technicianTravel.filter((row) => row.originSplSiteId === siteId || row.destinationSplSiteId === siteId);
  if(!travel.length) return '';
  return `This SPL site cannot be deleted because it is used by ${travel.length} technician travel entr${travel.length === 1 ? 'y' : 'ies'}. Clear those travel records first.`;
}

function getResourceRecord(assignmentType, resourceId){
  const entityKey = RESOURCE_ENTITY_BY_TYPE[assignmentType];
  if(!entityKey) return null;
  return state.data[entityKey].find((row) => row.id === resourceId) || null;
}

function getResourceLabel(assignmentType, resourceId){
  const record = getResourceRecord(assignmentType, resourceId);
  if(!record) return 'Unknown resource';
  if(assignmentType === 'Technician') return getEmployeeListName(record);
  if(assignmentType === 'Truck') return record.unitNumber || 'Unnamed truck';
  if(assignmentType === 'Trailer') return record.trailerNumber || 'Unnamed trailer';
  return record.equipmentName || 'Unnamed equipment';
}

function getJobLabel(jobId){
  const job = getJob(jobId);
  return job ? getJobDisplayTitle(job) : 'Unknown job';
}

function getAssetLabel(assetType, assetId){
  if(assetType === 'Truck') return state.data.trucks.find((row) => row.id === assetId)?.unitNumber || 'Unknown truck';
  if(assetType === 'Trailer') return state.data.trailers.find((row) => row.id === assetId)?.trailerNumber || 'Unknown trailer';
  return state.data.equipment.find((row) => row.id === assetId)?.equipmentName || 'Unknown equipment';
}

function getJobMissingRequirements(job, assignments = getAssignmentsForJob(job.id)){
  const required = getRequiredAssignmentTypes(job.jobType);
  const availableTypes = new Set(assignments.filter((row) => row.resourceId).map((row) => row.assignmentType));
  return required.filter((assignmentType) => !availableTypes.has(assignmentType));
}

function getFieldOpsTeamsFunctionPath(){ return '/functions/v1/field-ops-teams'; }

function buildTeamsWebhookPayload(job){
  if(!job){
    return {
      title:'Field Ops Test Alert',
      message:'Manual webhook test from the Field Ops dashboard.',
      job:'No visible schedule job',
      client:'Field Ops',
      site:'Schedule',
      schedule:'Not scheduled',
      missing:'None'
    };
  }
  const missing = getJobMissingRequirements(job);
  return {
    title:'Field Ops Test Alert',
    message:'Manual webhook test from the Field Ops dashboard.',
    job:getJobDisplayTitle(job),
    client:getClientLabel(job.clientId),
      site:getJobSiteSummary(job),
    schedule:getJobScheduleLabel(job),
    missing:missing.length ? missing.join(', ') : 'None'
  };
}

function pickTeamsWebhookTestJob(){
  const visibleJobs = getJobsForScheduleDates(getScheduleDates());
  return visibleJobs.find((job) => !isJobPast(job) && getJobMissingRequirements(job).length)
    || visibleJobs.find((job) => !isJobPast(job))
    || visibleJobs[0]
    || null;
}

async function sendTeamsWebhookTest(){
  if(!window.appAuth || window.appAuth.getMode?.() !== 'remote'){
    alert('Sign in with Remote sync before sending a Teams test.');
    return;
  }
  showSaveStatus('saving', 'SENDING TEAMS TEST');
  try {
    const payload = buildTeamsWebhookPayload(pickTeamsWebhookTestJob());
    const response = await window.appAuth.fetch(getFieldOpsTeamsFunctionPath(), {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify(payload)
    });
    if(!response.ok){
      const detail = await response.json().catch(() => null);
      throw new Error(detail?.error || `Teams webhook failed with HTTP ${response.status}.`);
    }
    showSaveStatus('saved', 'TEAMS TEST SENT');
    hideSaveStatusSoon();
  } catch (error){
    console.error('Unable to send Field Ops Teams webhook test:', error);
    showSaveStatus('error', 'TEAMS TEST FAILED');
    hideSaveStatusSoon(4200);
    alert(error.message || 'Unable to send the Teams webhook test.');
  }
}

function getSalesforceInstanceUrl(){
  return String(window.APP_CONFIG?.salesforceInstanceUrl || '').trim().replace(/\/+$/, '');
}

function getSalesforceCaseUrl(job){
  const explicitUrl = String(job?.salesforceCaseUrl || '').trim();
  if(explicitUrl) return explicitUrl;
  const caseId = String(job?.salesforceCaseId || '').trim();
  const instanceUrl = getSalesforceInstanceUrl();
  return caseId && instanceUrl ? `${instanceUrl}/lightning/r/Case/${encodeURIComponent(caseId)}/view` : '';
}

function getSalesforceCaseLabel(job){
  return String(job?.salesforceCaseNumber || job?.fieldfxTicketId || '').trim();
}

function renderJobSalesforceTag(job){
  const caseLabel = getSalesforceCaseLabel(job);
  if(caseLabel) return `<span class="mini-tag salesforce-case-tag">SF ${esc(caseLabel)}</span>`;
  return '';
}

function renderJobNeedsTicketTag(job){
  const fieldfxTicketId = String(job?.fieldfxTicketId || '').trim();
  return fieldfxTicketId || job?.noTicketRequired ? '' : '<span class="status-badge warn">Needs Ticket</span>';
}

function getRoutedJobIds(){
  return new Set(state.data.fieldRouteStopJobs.map((row) => String(row.jobId || '').trim()).filter(Boolean));
}

function jobNeedsRoute(job, derived = null){
  if(!job || !getJobPrimaryDate(job) || isJobClosed(job)) return false;
  const routedJobIds = derived?.routedJobIds || getRoutedJobIds();
  return !routedJobIds.has(String(job.id || '').trim());
}

function renderJobNeedsRouteTag(job, derived){
  return jobNeedsRoute(job, derived) ? '<span class="status-badge needs-route">🗺️ Needs Route</span>' : '';
}

function renderSalesforceCaseEditor(){
  if(modalState.entity !== 'jobs') return '';
  const job = modalState.formData || {};
  const caseLabel = getSalesforceCaseLabel(job);
  const caseUrl = getSalesforceCaseUrl(job);
  const openButton = caseUrl
    ? `<a class="act-btn salesforce-open-link" href="${esc(caseUrl)}" target="_blank" rel="noopener">Open Salesforce Ticket</a>`
    : '';
  return `<div id="salesforce-ticket-link-section" class="salesforce-editor" tabindex="-1"><div class="assignment-head"><div><h4>Salesforce Ticket Link</h4><div class="section-copy">Paste the Salesforce ticket URL here after the ticket exists in Salesforce. No API authorization is required for this manual link.</div></div><div class="table-actions">${openButton}</div></div><div class="salesforce-sync-card"><div class="form-group"><label class="form-label">Ticket / Case Number</label><input class="form-input" type="text" value="${esc(caseLabel)}" placeholder="Case number or ticket number" data-salesforce-ticket-input="number" oninput="setModalField('salesforceCaseNumber', this.value)"></div><div class="form-group"><label class="form-label">Ticket URL</label><input class="form-input" type="url" value="${esc(caseUrl)}" placeholder="https://..." data-salesforce-ticket-input="url" oninput="setModalField('salesforceCaseUrl', this.value)"></div><div class="form-group"><label class="form-label">No Ticket</label><label class="toggle-card"><input type="checkbox" ${job.noTicketRequired ? 'checked' : ''} onchange="toggleModalField('noTicketRequired', this.checked)"><span>No Ticket</span></label></div></div><div class="form-hint">The ticket number is shown as the SF badge on job cards. The URL powers the Open Salesforce Ticket link after save/reopen. Use No Ticket for scheduled work that should not raise a Needs Ticket alert.</div></div>`;
}

function getJobPastComparisonDate(job){
  return parseDateTime(job?.scheduledEnd) || parseDateTime(job?.scheduledStart) || parseDateTime(job?.requestedDate);
}

function isJobPast(job, now = new Date()){
  const comparisonDate = getJobPastComparisonDate(job);
  return !!(comparisonDate && comparisonDate < now);
}

function isJobBeforeToday(job, now = new Date()){
  const comparisonDate = getJobPastComparisonDate(job);
  if(!comparisonDate) return false;
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return comparisonDate < todayStart;
}

function isJobClosed(job){ return isJobPast(job); }

function isMaintenanceClosed(record){ return ['Complete', 'Canceled'].includes(record.status); }

function isTravelBlocking(travel){ return !['Complete', 'Canceled'].includes(travel?.travelStatus || 'Planned'); }
function getJobTravelWindow(job){
  const start = parseDateTime(job?.scheduledStart) || parseDateTime(job?.requestedDate);
  if(!start) return null;
  const end = parseDateTime(job?.scheduledEnd) || start;
  return { start, end };
}
function getTravelWindow(travel){
  const start = parseDateTime(travel?.arrivalAt);
  const end = parseDateTime(travel?.departureAt);
  return start && end ? { start, end } : null;
}
function windowsOverlap(start, end, blockStart, blockEnd){
  if(!start || !blockStart || !blockEnd) return false;
  const rangeEnd = end || start;
  if(rangeEnd <= start) return start >= blockStart && start < blockEnd;
  return start < blockEnd && rangeEnd > blockStart;
}
function travelCoversWindow(travelWindow, targetWindow){
  if(!travelWindow || !targetWindow) return false;
  const targetEnd = targetWindow.end || targetWindow.start;
  if(targetEnd <= targetWindow.start) return targetWindow.start >= travelWindow.start && targetWindow.start < travelWindow.end;
  return targetWindow.start >= travelWindow.start && targetEnd <= travelWindow.end;
}
function isLocalEmployeeHome(employee){
  const localLabels = [LOCAL_SPL_SITE, `SPL ${LOCAL_SPL_SITE}`, LOCAL_SPL_SITE_CODE].map((value) => value.toLowerCase());
  return localLabels.includes(String(getEmployeeHomeSplSite(employee)).trim().toLowerCase());
}
function isLocalSplSite(siteId){
  const site = getSplSite(siteId);
  if(!site) return false;
  if(normalizeClientCode(site.siteCode) === LOCAL_SPL_SITE_CODE) return true;
  const localLabels = [LOCAL_SPL_SITE, `SPL ${LOCAL_SPL_SITE}`].map((value) => value.toLowerCase());
  return [site.siteName, site.locationLabel].some((value) => localLabels.includes(String(value || '').trim().toLowerCase()));
}
function isLocalSplEndpoint(travel, side){
  return travel?.[`${side}Type`] === 'spl_site' && isLocalSplSite(travel?.[`${side}SplSiteId`]);
}
function inferTravelDirectionFromEndpoints(travel){
  const originIsLocalSpl = isLocalSplEndpoint(travel, 'origin');
  const destinationIsLocalSpl = isLocalSplEndpoint(travel, 'destination');
  if(destinationIsLocalSpl && !originIsLocalSpl) return 'Inbound';
  if(originIsLocalSpl && !destinationIsLocalSpl) return 'Outbound';
  return '';
}
function getTravelEndpointDirectionIssue(travel){
  const originIsLocalSpl = isLocalSplEndpoint(travel, 'origin');
  const destinationIsLocalSpl = isLocalSplEndpoint(travel, 'destination');
  if(originIsLocalSpl && destinationIsLocalSpl) return 'Travel must start or end at Pittsburgh, not both.';
  if(!originIsLocalSpl && !destinationIsLocalSpl) return 'Travel must start or end at Pittsburgh.';
  return '';
}
function isPittsburghAvailabilityTravel(travel){
  return travel?.direction === 'Inbound' && isLocalSplEndpoint(travel, 'destination');
}
function isSchedulingBlockingTravel(travel){
  return !isPittsburghAvailabilityTravel(travel);
}
function getTechnicianTravelRowsWithDraft(technicianId, draft = null, currentTravelId = ''){
  const rows = state.data.technicianTravel.filter((travel) => travel.technicianId === technicianId && travel.id !== currentTravelId);
  return draft?.technicianId === technicianId ? [...rows, draft] : rows;
}
function getTechnicianScheduleIssue(technicianId, window, travelRows = state.data.technicianTravel){
  const employee = getEmployee(technicianId);
  if(!employee || !window) return null;
  const technicianTravel = travelRows.filter((travel) => travel.technicianId === technicianId);
  const blockingTravel = technicianTravel.find((travel) => {
    if(!isSchedulingBlockingTravel(travel)) return false;
    const travelWindow = getTravelWindow(travel);
    return travelWindow && windowsOverlap(window.start, window.end, travelWindow.start, travelWindow.end);
  });
  if(blockingTravel) return { type:'blockingTravel', technicianId, travel:blockingTravel };
  if(!isLocalEmployeeHome(employee)){
    const availabilityTravel = technicianTravel.find((travel) => {
      if(!isPittsburghAvailabilityTravel(travel)) return false;
      return travelCoversWindow(getTravelWindow(travel), window);
    });
    if(!availabilityTravel) return { type:'missingPittsburghTravel', technicianId };
  }
  return null;
}
function findJobScheduleIssue(jobDraft, assignments = []){
  const window = getJobTravelWindow(jobDraft);
  if(!window) return null;
  const technicianIds = [...new Set(assignments.filter((row) => row.assignmentType === 'Technician' && row.resourceId).map((row) => row.resourceId))];
  for(const technicianId of technicianIds){
    const issue = getTechnicianScheduleIssue(technicianId, window);
    if(issue) return issue;
  }
  return null;
}
function findTravelScheduleConflict(travelDraft, currentTravelId = modalState.id || ''){
  if(!travelDraft.technicianId) return null;
  const travelWindow = getTravelWindow(travelDraft);
  if(!travelWindow) return null;
  const travelConflict = state.data.technicianTravel.find((travel) => {
    if(travel.id === currentTravelId || travel.technicianId !== travelDraft.technicianId) return false;
    const existingWindow = getTravelWindow(travel);
    return existingWindow && windowsOverlap(travelWindow.start, travelWindow.end, existingWindow.start, existingWindow.end);
  });
  if(travelConflict) return { type:'travel', travel:travelConflict };
  const travelRows = getTechnicianTravelRowsWithDraft(travelDraft.technicianId, travelDraft, currentTravelId);
  const jobIssue = state.data.jobAssignments
    .filter((assignment) => assignment.assignmentType === 'Technician' && assignment.resourceId === travelDraft.technicianId)
    .map((assignment) => getJob(assignment.jobId))
    .filter(Boolean)
    .filter((job) => !isJobBeforeToday(job))
    .map((job) => {
      const jobWindow = getJobTravelWindow(job);
      if(!jobWindow) return null;
      const issue = getTechnicianScheduleIssue(travelDraft.technicianId, jobWindow, travelRows);
      return issue ? { ...issue, job } : null;
    })
    .find(Boolean);
  return jobIssue || null;
}
function normalizeTravelEndpointForSave(draft, prefix){
  const next = { ...draft };
  const typeKey = `${prefix}Type`;
  const splKey = `${prefix}SplSiteId`;
  const clientKey = `${prefix}ClientSiteId`;
  const labelKey = `${prefix}Label`;
  const locationKey = `${prefix}Location`;
  if(next[typeKey] === 'spl_site'){
    next[splKey] = next[splKey] || getDefaultSplSiteId();
    next[clientKey] = '';
    next[labelKey] = '';
    next[locationKey] = '';
  } else if(next[typeKey] === 'client_site'){
    next[splKey] = '';
    next[labelKey] = '';
    next[locationKey] = '';
  } else {
    next[typeKey] = 'other';
    next[splKey] = '';
    next[clientKey] = '';
  }
  return next;
}
function normalizeTravelDraftForSave(draft){
  let next = {
    ...draft,
    travelStatus:TRAVEL_STATUS_OPTIONS.includes(draft.travelStatus) ? draft.travelStatus : 'Planned',
    purpose:String(draft.purpose || '')
  };
  next = normalizeTravelEndpointForSave(next, 'origin');
  next = normalizeTravelEndpointForSave(next, 'destination');
  next.direction = inferTravelDirectionFromEndpoints(next) || (TRAVEL_DIRECTION_OPTIONS.includes(draft.direction) ? draft.direction : 'Outbound');
  return next;
}
function formatTravelDuration(startValue, endValue){
  const start = parseDateTime(startValue);
  const end = parseDateTime(endValue);
  if(!start || !end || end <= start) return 'Duration TBD';
  const totalMinutes = Math.round((end - start) / 60000);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if(days) parts.push(`${days}d`);
  if(hours) parts.push(`${hours}h`);
  if(minutes || !parts.length) parts.push(`${minutes}m`);
  return parts.join(' ');
}

function getTruckInspectionStatus(truck){
  const dueDate = parseDateOnly(truck?.nextInspectionDue);
  if(!dueDate) return '';
  const today = parseDateOnly(todayISO());
  const warningDate = parseDateOnly(addDaysISO(todayISO(), TRUCK_INSPECTION_WARNING_DAYS));
  if(today && dueDate < today) return 'Inspection Overdue';
  if(warningDate && dueDate <= warningDate) return 'Inspection Due Soon';
  return 'Inspection Current';
}

function getTruckInspectionAlert(truck){
  const status = getTruckInspectionStatus(truck);
  if(status === 'Inspection Overdue') return `${truck?.unitNumber || 'Truck'} inspection overdue`;
  if(status === 'Inspection Due Soon') return `${truck?.unitNumber || 'Truck'} inspection due soon`;
  return '';
}

function getAssignedResourceWarnings(job){
  const warnings = [];
  getAssignmentsForJob(job.id).forEach((assignment) => {
    const resource = getResourceRecord(assignment.assignmentType, assignment.resourceId);
    if(!resource) return;
    if(assignment.assignmentType === 'Truck'){
      if(['Maintenance', 'Out of Service'].includes(resource.serviceStatus)) warnings.push(`${resource.unitNumber || 'Truck'} ${resource.serviceStatus.toLowerCase()}`);
      const inspectionAlert = getTruckInspectionAlert(resource);
      if(inspectionAlert) warnings.push(inspectionAlert);
    }
    if(assignment.assignmentType === 'Trailer' && ['Maintenance', 'Out of Service'].includes(resource.serviceStatus)) warnings.push(`${resource.trailerNumber || 'Trailer'} ${resource.serviceStatus.toLowerCase()}`);
    if(assignment.assignmentType === 'Equipment'){
      if(['Needs Repair', 'Out of Service'].includes(resource.maintenanceStatus)) warnings.push(`${resource.equipmentName || 'Equipment'} ${resource.maintenanceStatus.toLowerCase()}`);
      if(resource.calibrationStatus === 'Overdue') warnings.push(`${resource.equipmentName || 'Equipment'} calibration overdue`);
    }
  });
  return [...new Set(warnings)];
}

function getScheduleConflicts(){
  const conflicts = [];
  const rowsByResource = new Map();
  state.data.jobAssignments.forEach((assignment) => {
    if(!assignment.resourceId) return;
    const job = getJob(assignment.jobId);
    if(!job || isJobClosed(job)) return;
    const start = getJobPrimaryDate(job);
    const end = getJobSecondaryDate(job) || start;
    if(!start || !end) return;
    const key = `${assignment.assignmentType}:${assignment.resourceId}`;
    if(!rowsByResource.has(key)) rowsByResource.set(key, []);
    rowsByResource.get(key).push({ assignment, job, start, end });
  });
  rowsByResource.forEach((rows, key) => {
    rows.sort((left, right) => left.start - right.start);
    for(let index = 0; index < rows.length; index += 1){
      const current = rows[index];
      for(let nextIndex = index + 1; nextIndex < rows.length; nextIndex += 1){
        const next = rows[nextIndex];
        if(next.start >= current.end) break;
        if(next.start < current.end && next.end > current.start){
          conflicts.push({ id:`${current.assignment.id}-${next.assignment.id}`, key, assignmentType:current.assignment.assignmentType, resourceId:current.assignment.resourceId, resourceLabel:getResourceLabel(current.assignment.assignmentType, current.assignment.resourceId), jobA:current.job, jobB:next.job, start:current.start < next.start ? current.start : next.start });
        }
      }
    }
  });
  return conflicts;
}

function buildDerivedState(){
  const conflicts = getScheduleConflicts();
  const conflictJobIds = new Set();
  conflicts.forEach((conflict) => { conflictJobIds.add(conflict.jobA.id); conflictJobIds.add(conflict.jobB.id); });
  const routedJobIds = getRoutedJobIds();
  const needsRouteJobIds = new Set(state.data.jobs.filter((job) => jobNeedsRoute(job, { routedJobIds })).map((job) => job.id));
  return {
    conflicts,
    conflictJobIds,
    routedJobIds,
    needsRouteJobIds,
    missingJobs:state.data.jobs.filter((job) => !isJobClosed(job) && getJobMissingRequirements(job).length > 0),
    overdueMaintenance:state.data.maintenanceRecords.filter((record) => !isMaintenanceClosed(record) && parseDateOnly(record.dueDate) && parseDateOnly(record.dueDate) < parseDateOnly(todayISO())),
    overdueCalibration:state.data.equipment.filter((item) => item.calibrationStatus === 'Overdue'),
    inspectionDueTrucks:state.data.trucks.filter((truck) => ['Inspection Due Soon', 'Inspection Overdue'].includes(getTruckInspectionStatus(truck))),
    downAssets:[...state.data.trucks.filter((item) => ['Maintenance', 'Out of Service'].includes(item.serviceStatus)), ...state.data.trailers.filter((item) => ['Maintenance', 'Out of Service'].includes(item.serviceStatus)), ...state.data.equipment.filter((item) => ['Needs Repair', 'Out of Service'].includes(item.maintenanceStatus))],
    missingCocSamples:state.data.samples.filter((sample) => ['Requested', 'Collected'].includes(sample.chainOfCustodyStatus))
  };
}

(function tickClock(){
  const now = new Date();
  const clockNode = document.getElementById('clock');
  const dateNode = document.getElementById('datedisp');
  if(clockNode) clockNode.textContent = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  if(dateNode) dateNode.textContent = now.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
  setTimeout(tickClock, 1000);
})();

const FORM_DEFINITIONS = {
  clients:[
    { kind:'section', label:'Account' },
    { key:'clientName', label:'Client Name', type:'text', required:true },
    { key:'clientCode', label:'Client Code', type:'text', required:true },
    { key:'assetPhotoPath', label:'Client Logo', type:'image', full:true },
    { key:'accountStatus', label:'Account Status', type:'select', options:ACCOUNT_STATUS_OPTIONS },
    { key:'sector', label:'Sector', type:'select', options:CLIENT_SECTOR_OPTIONS },
    { key:'serviceScope', label:'Service Scope', type:'select', options:SERVICE_SCOPE_OPTIONS },
    { key:'primaryContact', label:'Primary Contact', type:'text' },
    { key:'contactPhone', label:'Contact Phone', type:'text' },
    { key:'contactEmail', label:'Contact Email', type:'email' },
    { key:'defaultServiceArea', label:'Default Service Area / Region', type:'text' },
    { kind:'section', label:'HQ / Mapping' },
    { key:'hqStreet', label:'HQ Street', type:'text', full:true },
    { key:'hqCity', label:'HQ City', type:'text' },
    { key:'hqState', label:'HQ State', type:'text' },
    { key:'hqZip', label:'HQ ZIP', type:'text' },
    { key:'hqLatitude', label:'HQ Latitude', type:'number' },
    { key:'hqLongitude', label:'HQ Longitude', type:'number' },
    { key:'billingNotes', label:'Billing Notes', type:'textarea', full:true },
    { key:'operationalNotes', label:'Operational Notes', type:'textarea', full:true }
  ],
  projects:[
    { kind:'section', label:'Project Setup' },
    { key:'clientId', label:'Client', type:'select', options:() => buildClientOptions() },
    { key:'projectName', label:'Project Name', type:'text', required:true },
    { key:'serviceScope', label:'Service Scope', type:'select', options:SERVICE_SCOPE_OPTIONS },
    { key:'projectStatus', label:'Project Status', type:'select', options:PROJECT_STATUS_OPTIONS },
    { key:'notes', label:'Project Notes', type:'textarea', full:true }
  ],
  contacts:[
    { kind:'section', label:'Contact Details' },
    { key:'contactFirstName', label:'First Name', type:'text' },
    { key:'contactLastName', label:'Last Name', type:'text' },
    { key:'clientId', label:'Client', type:'select', options:() => buildClientOptions(), handler:'changeContactClient' },
    { key:'projectIds', label:'Linked Projects', type:'multi-select', options:() => buildContactProjectOptions(modalState.formData.clientId), disabled:() => !modalState.formData.clientId },
    { key:'siteIds', label:'Linked Sites/Locations', type:'multi-select', options:() => buildContactSiteOptions(modalState.formData.clientId), disabled:() => !modalState.formData.clientId },
    { key:'managerContactId', label:'Reports To', type:'select', options:() => buildContactManagerOptions(modalState.formData.clientId, modalState.id) },
    { key:'contactRole', label:'Role / Title', type:'text' },
    { key:'contactScope', label:'Contact Scope', type:'select', options:CONTACT_SCOPE_OPTIONS },
    { key:'phone', label:'Phone', type:'text' },
    { key:'email', label:'Email', type:'email' },
    { key:'isPrimary', label:'Primary Contact', type:'checkbox' },
    { key:'notes', label:'Notes', type:'textarea', full:true }
  ],
  billingProfiles:[
    { kind:'section', label:'Billing Profile' },
    { key:'clientId', label:'Client', type:'select', options:() => buildClientOptions(), handler:'changeBillingClient' },
    { key:'billingContactId', label:'Billing Contact', type:'select', options:() => buildBillingContactOptions(modalState.formData.clientId) },
    { key:'billingName', label:'Billing Name', type:'text', required:true },
    { key:'billingAddress', label:'Billing Address', type:'textarea', full:true },
    { key:'billingEmail', label:'Billing Email', type:'email' },
    { key:'billingPhone', label:'Billing Phone', type:'text' },
    { key:'invoiceNotes', label:'Invoice Notes', type:'textarea', full:true },
    { key:'fieldBillingNotes', label:'Field Billing Notes', type:'textarea', full:true },
    { key:'labBillingNotes', label:'Lab Billing Notes', type:'textarea', full:true }
  ],
  sites:[
    { kind:'section', label:'Site / Location' },
    { key:'clientId', label:'Client', type:'select', options:() => buildClientOptions(), handler:'changeSiteClient' },
    { key:'projectIds', label:'Linked Projects', type:'multi-select', options:() => buildProjectOptions(modalState.formData.clientId), disabled:() => !modalState.formData.clientId },
    { key:'siteName', label:'Site / Location Name', type:'text', required:true },
    { key:'siteType', label:'Site Type', type:'select', options:() => buildSiteTypeOptions(modalState.formData.siteType) },
    { key:'physicalAddress', label:'Physical Address', type:'text', full:true },
    { key:'countyState', label:'County / State', type:'text' },
    { key:'gpsCoordinates', label:'GPS Coordinates', type:'text' },
    { key:'siteStatus', label:'Site Status', type:'select', options:SITE_STATUS_OPTIONS },
    { key:'clientSiteContact', label:'Client Site Contact', type:'text' },
    { key:'accessRequired', label:'Approved Access Required', type:'checkbox' },
    { key:'approvedAccessLabel', label:'Approved Access Label', type:'text' },
    { key:'approvedAccessLatitude', label:'Approved Access Latitude', type:'number' },
    { key:'approvedAccessLongitude', label:'Approved Access Longitude', type:'number' },
    { key:'approvedAccessNotes', label:'Approved Access Notes', type:'textarea', full:true },
    { key:'accessInstructions', label:'Access Instructions', type:'textarea', full:true },
    { key:'safetyPpeNotes', label:'Safety / PPE Notes', type:'textarea', full:true },
    { key:'gateCodeEntryRequirements', label:'Gate Code / Entry Requirements', type:'textarea', full:true },
    { key:'notes', label:'Notes', type:'textarea', full:true }
  ],
  restrictedRoads:[
    { kind:'section', label:'Restricted Road' },
    { key:'roadName', label:'Road Name', type:'text', required:true },
    { key:'isActive', label:'Active Restriction', type:'checkbox' },
    { key:'clientId', label:'Client Scope', type:'select', options:() => buildClientOptions() },
    { key:'siteId', label:'Site Scope', type:'select', options:() => buildSiteOptions(modalState.formData.clientId), disabled:() => !modalState.formData.clientId },
    { key:'bufferMeters', label:'Buffer Meters', type:'number' },
    { key:'notes', label:'Notes', type:'textarea', full:true }
  ],
  jobs:[
    { kind:'section', label:'Basics' },
    { key:'clientId', label:'Client', type:'select', options:() => buildClientOptions(), handler:'changeJobClient' },
    { key:'siteId', label:'Site/Location', type:'select', options:() => buildJobSiteOptions(modalState.formData.clientId), handler:'changeJobSite', disabled:() => !modalState.formData.clientId, singleSiteOnly:true },
    { key:'siteIds', label:'Job Sites/Locations', type:'multi-select', options:() => buildJobSiteMultiOptions(modalState.formData.clientId), disabled:() => !modalState.formData.clientId, multiSiteOnly:true, ranked:true },
    { key:'projectId', label:'Project', type:'select', options:() => buildModalJobProjectOptions(), handler:'changeJobProject', disabled:() => !modalState.formData.clientId || (!jobTypeAllowsMultipleSites(modalState.formData.jobType) && !modalState.formData.siteId) },
    { key:'jobType', label:'Job Type', type:'select', options:() => buildJobTypeOptions(modalState.formData.jobType), handler:'changeJobType' },
    { key:'priority', label:'Priority', type:'select', options:PRIORITY_OPTIONS },
    { kind:'section', label:'Schedule' },
    { key:'scheduledStart', label:'Start', type:'datetime-local' },
    { key:'scheduledEnd', label:'End', type:'datetime-local', scheduleModes:['range'] },
    { kind:'section', label:'Proving Details', detailGroup:'proving' },
    { key:'meterUnitId', label:'Meter / Unit ID', type:'text', detailGroup:'proving' },
    { key:'apiStandardReference', label:'API Standard Reference', type:'text', detailGroup:'proving' },
    { key:'custodyAllocation', label:'Custody vs Allocation', type:'select', options:CUSTODY_OPTIONS, detailGroup:'proving' },
    { key:'provingRequired', label:'Proving Required', type:'checkbox', detailGroup:'proving' },
    { kind:'section', label:'Maintenance Details', detailGroup:'maintenance' },
    { key:'maintenanceRequired', label:'Maintenance Required', type:'checkbox', detailGroup:'maintenance' },
    { kind:'section', label:'Execution', detailGroup:'execution' },
    { key:'clientContactForJob', label:'Client Contact For Job', type:'select', options:() => buildJobContactOptions(modalState.formData.clientId, modalState.formData.projectId, modalState.formData.siteId), detailGroup:'execution' },
    { key:'followUpRequired', label:'Follow-Up Required', type:'checkbox', detailGroup:'execution' },
    { key:'scopeSummary', label:'Scope Summary', type:'textarea', full:true, detailGroup:'execution' },
    { key:'workInstructions', label:'Work Instructions', type:'textarea', full:true, detailGroup:'execution' },
    { key:'dispatchNotes', label:'Dispatch Notes', type:'textarea', full:true, detailGroup:'execution' },
    { key:'completionNotes', label:'Completion Notes', type:'textarea', full:true, detailGroup:'execution' },
    { key:'followUpNotes', label:'Follow-Up Notes', type:'textarea', full:true, detailGroup:'execution' }
  ],
  jobTypes:[
    { kind:'section', label:'Job Type Catalog' },
    { key:'jobTypeName', label:'Job Type Name', type:'text', required:true },
    { key:'jobTypeStatus', label:'Job Type Status', type:'select', options:JOB_TYPE_STATUS_OPTIONS },
    { key:'labEmployeeEligible', label:'Lab Employee Eligible', type:'checkbox' },
    { key:'allowMultipleSites', label:'Allow Multiple Job Sites', type:'checkbox' },
    { key:'jobTypeColor', label:'Job Type Color', type:'color', full:true },
    { key:'scheduleMode', label:'Schedule Mode', type:'select', options:JOB_TYPE_SCHEDULE_MODE_OPTIONS },
    { key:'requiredAssignmentTypes', label:'Required Assignments', type:'checkbox-group', options:ASSIGNMENT_TYPE_OPTIONS },
    { key:'detailGroups', label:'Visible Detail Sections', type:'checkbox-group', options:JOB_TYPE_DETAIL_GROUP_OPTIONS }
  ],
  siteTypes:[
    { kind:'section', label:'Site Type Catalog' },
    { key:'siteTypeName', label:'Site Type Name', type:'text', required:true },
    { key:'siteTypeStatus', label:'Site Type Status', type:'select', options:SITE_TYPE_STATUS_OPTIONS },
    { key:'defaultJobTypes', label:'Default Job Types', type:'checkbox-group', options:() => buildAllJobTypeOptions() },
    { key:'notes', label:'Notes', type:'textarea', full:true }
  ],
  partCatalogs:[
    { kind:'section', label:'Inventory List Value' },
    { key:'catalogType', label:'List', type:'select', options:FIELD_PART_CATALOG_TYPES.map((type) => ({ value:type.value, label:type.label })), required:true },
    { key:'catalogValue', label:'Value', type:'text', required:true },
    { key:'sortOrder', label:'Sort Order', type:'number' },
    { key:'isActive', label:'Active Value', type:'checkbox' },
    { key:'notes', label:'Notes', type:'textarea', full:true }
  ],
  employees:[
    { kind:'section', label:'Personnel' },
    { key:'employeeFirstName', label:'First Name', type:'text', required:true },
    { key:'employeeLastName', label:'Last Name', type:'text', required:true },
    { key:'homeSplSite', label:'Home SPL Site', type:'text', required:true },
    { key:'workScope', label:'Work Scope', type:'select', options:WORK_SCOPE_OPTIONS },
    { key:'isActive', label:'Active Employee', type:'checkbox' },
    { key:'labRole', label:'Lab Role', type:'select', options:LAB_ROLE_OPTIONS },
    { key:'fieldRole', label:'Field Role', type:'select', options:FIELD_ROLE_OPTIONS },
    { key:'phone', label:'Phone', type:'text' },
    { key:'email', label:'Email', type:'email' },
    { key:'notes', label:'Notes', type:'textarea', full:true }
  ],
  splSites:[
    { kind:'section', label:'SPL Site' },
    { key:'siteName', label:'Site Name', type:'text', required:true },
    { key:'siteCode', label:'Site Code', type:'text', required:true },
    { key:'locationLabel', label:'Location Label', type:'text' },
    { key:'streetAddress', label:'Street Address', type:'text', full:true },
    { key:'city', label:'City', type:'text' },
    { key:'state', label:'State', type:'text' },
    { key:'zipCode', label:'ZIP Code', type:'text' },
    { key:'isActive', label:'Active SPL Site', type:'checkbox' },
    { key:'notes', label:'Notes', type:'textarea', full:true }
  ],
  technicianTravel:[
    { kind:'section', label:'Technician Travel' },
    { key:'technicianId', label:'Technician', type:'select', options:() => buildTechnicianOptions('', modalState.formData.technicianId), required:true },
    { kind:'section', label:'Travel Window' },
    { key:'arrivalAt', label:'Travel Start', type:'datetime-local' },
    { key:'departureAt', label:'Travel End', type:'datetime-local' },
    { kind:'section', label:'Origin' },
    { key:'originType', label:'Origin Type', type:'select', options:TRAVEL_LOCATION_TYPE_OPTIONS, handler:'changeTravelOriginType' },
    { key:'originSplSiteId', label:'Origin SPL Site', type:'select', options:() => buildSplSiteOptions(modalState.formData.originSplSiteId), travelLocationTypeKey:'originType', travelLocationTypeValue:'spl_site' },
    { key:'originClientSiteId', label:'Origin Client Site', type:'select', options:() => buildTravelClientSiteOptions(modalState.formData.originClientSiteId), travelLocationTypeKey:'originType', travelLocationTypeValue:'client_site' },
    { key:'originLabel', label:'Origin Name', type:'text', travelLocationTypeKey:'originType', travelLocationTypeValue:'other' },
    { key:'originLocation', label:'Origin Location', type:'text', full:true, travelLocationTypeKey:'originType', travelLocationTypeValue:'other' },
    { kind:'section', label:'Destination' },
    { key:'destinationType', label:'Destination Type', type:'select', options:TRAVEL_LOCATION_TYPE_OPTIONS, handler:'changeTravelDestinationType' },
    { key:'destinationSplSiteId', label:'Destination SPL Site', type:'select', options:() => buildSplSiteOptions(modalState.formData.destinationSplSiteId), travelLocationTypeKey:'destinationType', travelLocationTypeValue:'spl_site' },
    { key:'destinationClientSiteId', label:'Destination Client Site', type:'select', options:() => buildTravelClientSiteOptions(modalState.formData.destinationClientSiteId), travelLocationTypeKey:'destinationType', travelLocationTypeValue:'client_site' },
    { key:'destinationLabel', label:'Destination Name', type:'text', travelLocationTypeKey:'destinationType', travelLocationTypeValue:'other' },
    { key:'destinationLocation', label:'Destination Location', type:'text', full:true, travelLocationTypeKey:'destinationType', travelLocationTypeValue:'other' },
    { key:'notes', label:'Notes', type:'textarea', full:true }
  ],
  trucks:[
    { kind:'section', label:'Vehicle' },
    { key:'unitNumber', label:'Unit Number', type:'text', required:true },
    { key:'vehicleType', label:'Vehicle Type', type:'select', options:TRUCK_TYPE_OPTIONS },
    { key:'fuelType', label:'Fuel Type', type:'select', options:FUEL_TYPE_OPTIONS, placeholderLabel:'Select fuel type...' },
    { key:'serviceStatus', label:'Service Status', type:'select', options:VEHICLE_STATUS_OPTIONS },
    { key:'assignedTechnicianId', label:'Assigned Employee', type:'select', options:() => buildTechnicianAssignmentOptions(), handler:'changeTruckAssignedTechnician', placeholderLabel:'Pool' },
    { key:'make', label:'Make', type:'text' },
    { key:'color', label:'Truck Color', type:'text' },
    { key:'model', label:'Model', type:'text' },
    { key:'vehicleYear', label:'Year Of Vehicle', type:'number' },
    { key:'vehicleId', label:'Vehicle ID', type:'text' },
    { key:'licensePlateNumber', label:'License Plate Number', type:'text' },
    { key:'registeredState', label:'Registered State', type:'text' },
    { key:'vin', label:'VIN', type:'text' },
    { key:'nextInspectionDue', label:'Next Inspection Due', type:'date' },
    { key:'assetPhotoPath', label:'Truck Photo', type:'image', full:true },
    { key:'notes', label:'Notes', type:'textarea', full:true }
  ],
  trailers:[
    { kind:'section', label:'Trailer' },
    { key:'trailerNumber', label:'Trailer Number', type:'text', required:true },
    { key:'trailerType', label:'Trailer Type', type:'text' },
    { key:'serviceStatus', label:'Service Status', type:'select', options:TRAILER_STATUS_OPTIONS },
    { key:'assignedTruckId', label:'Assigned Truck', type:'select', options:() => buildTruckOptions() },
    { key:'capacityConfiguration', label:'Capacity / Configuration', type:'text', full:true },
    { key:'assetPhotoPath', label:'Trailer Photo', type:'image', full:true },
    { key:'notes', label:'Notes', type:'textarea', full:true }
  ],
  equipment:[
    { kind:'section', label:'Equipment' },
    { key:'equipmentName', label:'Equipment Name', type:'text', required:true },
    { key:'equipmentType', label:'Equipment Type', type:'select', options:EQUIPMENT_TYPE_OPTIONS },
    { key:'model', label:'Model', type:'text' },
    { key:'manufacturer', label:'Manufacturer', type:'text' },
    { key:'splInventoryBarcode', label:'SPL Inventory Barcode #', type:'text' },
    { key:'serialNumber', label:'Serial Number', type:'text' },
    { key:'maintenanceStatus', label:'Maintenance Status', type:'select', options:EQUIPMENT_STATUS_OPTIONS },
    { key:'calibrationStatus', label:'Calibration Status', type:'select', options:CALIBRATION_STATUS_OPTIONS },
    { key:'storageLocation', label:'Storage Location', type:'text' },
    { key:'assignedTruckId', label:'Assigned Truck', type:'select', options:() => buildTruckOptions(), handler:'changeEquipmentAssignedTruck', placeholderLabel:'Pool' },
    { key:'assignedTrailerId', label:'Assigned Trailer', type:'select', options:() => buildTrailerOptions(), handler:'changeEquipmentAssignedTrailer', placeholderLabel:'Pool' },
    { key:'lastCalibrationDate', label:'Last Calibration Date', type:'date' },
    { key:'nextCalibrationDue', label:'Next Calibration Due', type:'date' },
    { key:'assetPhotoPath', label:'Equipment Photo', type:'image', full:true },
    { key:'notes', label:'Notes', type:'textarea', full:true }
  ],
  parts:[
    { kind:'section', label:'Field Part' },
    { key:'partName', label:'Part Name', type:'text', required:true },
    { key:'partNumber', label:'Part Number', type:'text' },
    { key:'category', label:'Category', type:'select', options:() => buildPartDropdownOptions('category', FIELD_PART_CATEGORY_OPTIONS, modalState.formData.category) },
    { key:'vendorName', label:'Vendor', type:'select', options:() => buildPartDropdownOptions('vendorName', FIELD_PART_VENDOR_OPTIONS, modalState.formData.vendorName) },
    { key:'vendorPartNumber', label:'Vendor Part #', type:'text' },
    { key:'unitName', label:'Unit', type:'select', options:() => buildPartDropdownOptions('unitName', FIELD_PART_UNIT_OPTIONS, modalState.formData.unitName), placeholderLabel:'Select unit...' },
    { key:'unitCost', label:'Unit Cost', type:'currency' },
    { key:'onHandQuantity', label:'On Hand', type:'number' },
    { key:'reorderPoint', label:'Reorder Point', type:'number' },
    { key:'storageLocation', label:'Storage Location', type:'select', options:() => buildPartDropdownOptions('storageLocation', FIELD_PART_STORAGE_LOCATION_OPTIONS, modalState.formData.storageLocation) },
    { key:'isActive', label:'Active Part', type:'checkbox' },
    { key:'notes', label:'Notes', type:'textarea', full:true }
  ],
  samples:[
    { kind:'section', label:'Sample Logistics' },
    { key:'jobId', label:'Job', type:'select', options:() => buildJobOptions(), handler:'changeSampleJob' },
    { key:'clientId', label:'Client', type:'select', options:() => buildClientOptions(), handler:'changeSampleClient' },
    { key:'siteId', label:'Site/Location', type:'select', options:() => buildSiteOptions(modalState.formData.clientId) },
    { key:'sampleSequence', label:'Sample #', type:'number' },
    { key:'sampleType', label:'Sample Type *', type:'select', options:['Gas', 'Liquid'], handler:'changeSampleType' },
    { key:'sampleName', label:'Sample ID *', type:'text' },
    { key:'collectionDateTime', label:'Sample Date / Time', type:'datetime-local' },
    { key:'samplePoint', label:'Sample Point', type:'text' },
    { key:'isDuplicate', label:'Duplicate', type:'checkbox' },
    { key:'sampleCollectionMode', label:'Composite / Spot', type:'select', options:[{ value:'', label:'Not set' }, 'Composite', 'Spot'] },
    { key:'cylinderNumber', label:'Cylinder # *', type:'text' },
    { key:'testCodes', label:'Test Codes Required *', type:'test-dropdown', options:() => buildLabTestOptionsForSampleType(modalState.formData.sampleType) },
    { key:'sampleTempF', label:'Sample Temp (F)', type:'number' },
    { key:'samplePressurePsig', label:'Sample Pressure (PSIG)', type:'number' },
    { key:'sampleStatus', label:'Status', type:'select', options:SAMPLE_WORKFLOW_STATUS_OPTIONS },
    { key:'containerType', label:'Container Type', type:'select', options:CONTAINER_TYPE_OPTIONS },
    { key:'pickedUpBy', label:'Picked Up By', type:'text' },
    { key:'dropOffLocation', label:'Drop-Off Location', type:'text' },
    { key:'linkedWorkOrderNumber', label:'Linked WO', type:'text', disabled:true },
    { key:'priorityTat', label:'Priority / TAT', type:'text' },
    { key:'notes', label:'Notes', type:'textarea', full:true }
  ],
  maintenanceRecords:[
    { kind:'section', label:'Maintenance Record' },
    { key:'assetType', label:'Asset Type', type:'select', options:ASSET_TYPE_OPTIONS, handler:'changeMaintenanceAssetType' },
    { key:'assetId', label:'Asset', type:'select', options:() => buildAssetOptions(modalState.formData.assetType) },
    { key:'maintenanceType', label:'Maintenance Type', type:'select', options:MAINTENANCE_TYPE_OPTIONS },
    { key:'status', label:'Status', type:'select', options:MAINTENANCE_STATUS_OPTIONS },
    { key:'assignedPerson', label:'Assigned Person', type:'text', required:true },
    { key:'vendorInternal', label:'Vendor / Internal', type:'select', options:VENDOR_INTERNAL_OPTIONS },
    { key:'cost', label:'Cost', type:'number' },
    { key:'openDate', label:'Open Date', type:'date' },
    { key:'dueDate', label:'Due Date', type:'date' },
    { key:'completedDate', label:'Completed Date', type:'date' },
    { key:'issueDescription', label:'Issue Description', type:'textarea', full:true },
    { key:'resolution', label:'Resolution', type:'textarea', full:true },
    { key:'notes', label:'Notes', type:'textarea', full:true }
  ]
};

function showSaveStatus(statusClass, text){
  const node = document.getElementById('save-indicator');
  if(!node) return;
  node.style.visibility = 'visible';
  node.className = `save-indicator ${statusClass}`;
  node.textContent = text;
}

function hideSaveStatusSoon(delay = 2600){
  clearTimeout(hideSaveStatusTimer);
  hideSaveStatusTimer = setTimeout(() => {
    const node = document.getElementById('save-indicator');
    if(node) node.style.visibility = 'hidden';
  }, delay);
}

function buildClientOptions(){ return state.data.clients.map((row) => ({ value:row.id, label:`${normalizeClientCode(row.clientCode) ? `${normalizeClientCode(row.clientCode)} | ` : ''}${row.clientName || 'Unnamed client'}` })); }
function buildProjectOptions(clientId = ''){ return state.data.projects.filter((row) => !clientId || row.clientId === clientId).map((row) => ({ value:row.id, label:`${row.projectName || 'Unnamed project'} | ${getClientLabel(row.clientId)}` })); }
function buildContactProjectOptions(clientId = ''){
  return state.data.projects
    .filter((row) => !clientId || row.clientId === clientId)
    .map((row) => ({ value:row.id, label:row.projectName || 'Unnamed project' }));
}
function buildSiteOptions(clientId = '', projectId = ''){
  return state.data.sites
    .filter((row) => (!clientId || row.clientId === clientId) && (!projectId || getProjectIdsForSite(row.id).includes(projectId)))
    .map((row) => {
      const linkedProjects = getLinkedProjectsForSite(row.id).map((project) => project.projectName || 'Unnamed project');
      return { value:row.id, label:`${row.siteName || 'Unnamed location'} | ${linkedProjects.join(', ') || 'No linked project'}` };
    });
}
function buildJobSiteOptions(clientId = ''){
  if(!clientId) return [];
  return buildSiteOptions(clientId);
}
function buildJobSiteMultiOptions(clientId = ''){
  if(!clientId) return [];
  return state.data.sites
    .filter((row) => row.clientId === clientId)
    .map((row) => ({ value:row.id, label:row.siteName || 'Unnamed location' }));
}
function buildJobProjectOptions(clientId = '', siteId = ''){
  if(!clientId || !siteId) return [];
  return getLinkedProjectsForSite(siteId)
    .filter((project) => !clientId || project.clientId === clientId)
    .map((project) => ({ value:project.id, label:`${project.projectName || 'Unnamed project'} | ${getClientLabel(project.clientId)}` }));
}
function buildModalJobProjectOptions(){
  if(!modalState.formData.clientId) return [];
  return jobTypeAllowsMultipleSites(modalState.formData.jobType)
    ? buildProjectOptions(modalState.formData.clientId)
    : buildJobProjectOptions(modalState.formData.clientId, modalState.formData.siteId);
}
function buildJobTypeOptions(currentValue = ''){
  return getActiveJobTypes(currentValue).map((jobType) => ({ value:jobType.jobTypeKey, label:jobType.jobTypeName || 'Unnamed job type' }));
}
function buildContactSiteOptions(clientId = ''){
  return state.data.sites
    .filter((row) => !clientId || row.clientId === clientId)
    .map((row) => ({ value:row.id, label:row.siteName || 'Unnamed location' }));
}
function buildSplSiteOptions(currentValue = ''){
  return state.data.splSites
    .filter((row) => row.isActive !== false || row.id === currentValue)
    .map((row) => ({ value:row.id, label:[row.siteName || 'Unnamed SPL site', row.siteCode].filter(Boolean).join(' | ') }));
}
function buildTravelClientSiteOptions(currentValue = ''){
  return state.data.sites
    .map((row) => ({ value:row.id, label:`${row.siteName || 'Unnamed location'} | ${getClientLabel(row.clientId)}` }))
    .concat(currentValue && !getSite(currentValue) ? [{ value:currentValue, label:'Unknown client site' }] : []);
}
function buildAllJobTypeOptions(){
  return [...state.data.jobTypes].sort(getEntitySorter('jobTypes')).map((jobType) => ({ value:jobType.jobTypeKey, label:jobType.jobTypeName || 'Unnamed job type' }));
}
function buildSiteTypeOptions(currentValue = ''){
  return getActiveSiteTypes(currentValue).map((siteType) => ({ value:siteType.siteTypeKey, label:siteType.siteTypeName || 'Unnamed site type' }));
}
function buildPartDropdownOptions(fieldKey, defaults = [], currentValue = ''){
  const catalogType = FIELD_PART_CATALOG_TYPES.find((type) => type.fieldKey === fieldKey)?.value || '';
  const catalogRows = state.data.partCatalogs
    .filter((row) => row.catalogType === catalogType && row.isActive !== false)
    .sort(getEntitySorter('partCatalogs'))
    .map((row) => row.catalogValue);
  const values = new Set((catalogRows.length ? catalogRows : defaults).map((value) => String(value || '').trim()).filter(Boolean));
  state.data.parts.forEach((part) => {
    const value = String(part?.[fieldKey] || '').trim();
    if(value) values.add(value);
  });
  const current = String(currentValue || '').trim();
  if(current) values.add(current);
  return [...values].sort((a, b) => compareStrings(a, b)).map((value) => ({ value, label:value }));
}
function buildJobOptions(){ return state.data.jobs.map((row) => ({ value:row.id, label:`${getJobDisplayTitle(row)} | ${getJobSiteSummary(row)}` })); }
function contactHasNoLinks(contact){ return !getProjectIdsForContact(contact.id).length && !getSiteIdsForContact(contact.id).length; }
function contactMatchesProjectScope(contact, projectId = ''){
  if(!projectId) return true;
  if(contactHasNoLinks(contact)) return true;
  if(getProjectIdsForContact(contact.id).includes(projectId)) return true;
  return getSiteIdsForContact(contact.id).some((siteId) => getProjectIdsForSite(siteId).includes(projectId));
}
function contactMatchesJobScope(contact, projectId = '', siteId = ''){
  if(contactHasNoLinks(contact)) return true;
  const projectIds = getProjectIdsForContact(contact.id);
  const siteIds = getSiteIdsForContact(contact.id);
  return (!!projectId && projectIds.includes(projectId)) || (!!siteId && siteIds.includes(siteId));
}
function buildContactOptions(clientId = '', projectId = ''){
  return state.data.contacts
    .filter((row) => (!clientId || row.clientId === clientId) && contactMatchesProjectScope(row, projectId))
    .map((row) => ({ value:row.id, label:`${getContactDisplayName(row)} | ${row.contactRole || row.contactScope || 'Contact'}` }));
}
function buildBillingContactOptions(clientId = ''){
  return state.data.contacts
    .filter((row) => !clientId || row.clientId === clientId)
    .map((row) => ({ value:row.id, label:`${getContactDisplayName(row)} | ${row.contactRole || row.contactScope || 'Billing contact'}` }));
}
function buildJobContactOptions(clientId = '', projectId = '', siteId = ''){
  return state.data.contacts
    .filter((row) => (!clientId || row.clientId === clientId) && contactMatchesJobScope(row, projectId, siteId))
    .map((row) => ({ value:[getContactDisplayName(row), row.contactRole].filter(Boolean).join(' | ') || getContactDisplayName(row), label:`${getContactDisplayName(row)} | ${row.contactRole || row.contactScope || 'Contact'}` }));
}
function getContactDescendantIds(contactId){
  const descendants = new Set();
  if(!contactId) return descendants;
  const stack = state.data.contacts.filter((row) => row.managerContactId === contactId).map((row) => row.id);
  while(stack.length){
    const id = stack.pop();
    if(!id || descendants.has(id)) continue;
    descendants.add(id);
    state.data.contacts.filter((row) => row.managerContactId === id).forEach((row) => stack.push(row.id));
  }
  return descendants;
}
function buildContactManagerOptions(clientId = '', currentContactId = modalState.id || ''){
  const excluded = getContactDescendantIds(currentContactId);
  if(currentContactId) excluded.add(currentContactId);
  return state.data.contacts
    .filter((row) => (!clientId || row.clientId === clientId) && !excluded.has(row.id))
    .map((row) => ({ value:row.id, label:`${getContactDisplayName(row)} | ${row.contactRole || row.contactScope || 'Contact'}` }));
}
function buildAssetOptions(assetType = ''){ if(assetType === 'Truck') return state.data.trucks.map((row) => ({ value:row.id, label:row.unitNumber || 'Unnamed truck' })); if(assetType === 'Trailer') return state.data.trailers.map((row) => ({ value:row.id, label:row.trailerNumber || 'Unnamed trailer' })); return state.data.equipment.map((row) => ({ value:row.id, label:row.equipmentName || 'Unnamed equipment' })); }
function buildResourceOptions(assignmentType = 'Technician', currentResourceId = ''){
  if(assignmentType === 'Technician') return buildTechnicianOptions(modalState.formData.jobType, currentResourceId);
  const entityKey = RESOURCE_ENTITY_BY_TYPE[assignmentType];
  return entityKey ? state.data[entityKey].map((row) => ({ value:row.id, label:getResourceLabel(assignmentType, row.id) })) : [];
}
function buildTechnicianOptions(jobType = '', currentResourceId = ''){
  const options = state.data.employees
    .filter((row) => canAssignEmployeeToJobType(row, jobType))
    .map((row) => ({ value:row.id, label:getEmployeeOptionLabel(row) }));
  const currentEmployee = currentResourceId ? state.data.employees.find((row) => row.id === currentResourceId) : null;
  if(currentEmployee && !options.some((option) => option.value === currentEmployee.id)){
    const statusLabel = currentEmployee.isActive === false ? 'Inactive' : 'No longer eligible';
    options.push({ value:currentEmployee.id, label:`${getEmployeeOptionLabel(currentEmployee)} | ${statusLabel}` });
  }
  return options;
}
function buildTechnicianAssignmentOptions(){ return [{ value:'', label:'Pool' }, ...buildTechnicianOptions()]; }
function buildTruckAssignmentOptions(){ return [{ value:'', label:'Pool' }, ...buildTruckOptions()]; }
function buildTruckOptions(){ return state.data.trucks.map((row) => ({ value:row.id, label:row.unitNumber || 'Unnamed truck' })); }
function buildTrailerOptions(){ return state.data.trailers.map((row) => ({ value:row.id, label:row.trailerNumber || 'Unnamed trailer' })); }
function getTechnicianLabel(id){
  const employee = state.data.employees.find((row) => row.id === id) || null;
  return employee ? getEmployeeListName(employee) : 'Unassigned';
}
function getTruckLabel(id){ return state.data.trucks.find((row) => row.id === id)?.unitNumber || 'Unassigned'; }
function getTrailerLabel(id){ return state.data.trailers.find((row) => row.id === id)?.trailerNumber || 'Unassigned'; }

function switchView(view){ state.activeView = view === 'dispatch' ? 'schedule' : view; render(); }
function setDispatchFilter(key, value){ state.filters[key] = value; renderDispatch(buildDerivedState()); }
function setDispatchSort(key){
  if(state.filters.dispatchSortKey === key){
    state.filters.dispatchSortDirection = state.filters.dispatchSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    state.filters.dispatchSortKey = key;
    state.filters.dispatchSortDirection = 'asc';
  }
  renderDispatch(buildDerivedState());
}
function setDirectoryClientFilter(value){
  state.filters.directoryClientSearch = '';
  state.filters.directoryClient = value;
  renderDirectory();
}
function openDirectoryClientPicker(){
  state.filters.directoryClientSearch = '';
  const input = document.getElementById('directory-client-picker-input');
  if(input){
    input.value = '';
    input.select();
  }
  updateDirectoryClientPickerResults();
}
function closeDirectoryClientPicker(){
  const results = document.getElementById('directory-client-picker-results');
  if(results) results.classList.remove('open');
  const input = document.getElementById('directory-client-picker-input');
  const activeClient = getClient(getActiveDirectoryClientId());
  state.filters.directoryClientSearch = '';
  if(input) input.value = activeClient?.clientName || '';
}
function setDirectoryClientPickerSearch(value){
  state.filters.directoryClientSearch = String(value || '');
  updateDirectoryClientPickerResults();
}
function chooseDirectoryClient(clientId){
  if(!getClient(clientId)) return;
  closeDirectoryClientPicker();
  setDirectoryClientFilter(clientId);
}
function handleDirectoryClientPickerKey(event){
  if(event.key !== 'Enter') return;
  event.preventDefault();
  const first = getDirectoryClientPickerMatches()[0];
  if(first) chooseDirectoryClient(first.id);
}
function setDirectorySection(value){ state.filters.directorySection = value; renderDirectory(); }
function setDirectoryContactFilter(key, value){ state.filters[key] = value; renderDirectory(); }
function setDirectoryContactSort(key){
  if(state.filters.directoryContactSortKey === key){
    state.filters.directoryContactSortDirection = state.filters.directoryContactSortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    state.filters.directoryContactSortKey = key;
    state.filters.directoryContactSortDirection = 'asc';
  }
  renderDirectory();
}
function setScheduleView(value){
  state.scheduleView = ['week', 'work_week', 'month'].includes(value) ? value : 'work_week';
  state.scheduleAnchorDate = state.scheduleView === 'month' ? getStartOfMonthISO(state.scheduleAnchorDate) : getStartOfWeekISO(state.scheduleAnchorDate);
  renderSchedule(buildDerivedState());
}
function setScheduleJobFilter(value){
  state.scheduleJobFilter = ['all', 'open', 'past'].includes(value) ? value : 'all';
  renderSchedule(buildDerivedState());
}
function changeScheduleWeek(offset){
  const amount = Number(offset || 0);
  state.scheduleAnchorDate = state.scheduleView === 'month' ? getStartOfMonthISO(addMonthsISO(state.scheduleAnchorDate, amount)) : addDaysISO(state.scheduleAnchorDate, amount * 7);
  renderSchedule(buildDerivedState());
}
function resetScheduleWeek(){
  state.scheduleAnchorDate = state.scheduleView === 'month' ? getStartOfMonthISO(new Date()) : getStartOfWeekISO(new Date());
  renderSchedule(buildDerivedState());
}

function openScheduleDayPrompt(dateIso, event){
  if(event?.target?.closest?.('.schedule-card, .schedule-add-popover')) return;
  state.scheduleAddPromptDate = state.scheduleAddPromptDate === dateIso ? '' : dateIso;
  renderSchedule(buildDerivedState());
}

function handleScheduleDayKey(event, dateIso){
  if(!['Enter', ' '].includes(event.key)) return;
  if(event.target?.closest?.('.schedule-card, .schedule-add-popover')) return;
  event.preventDefault();
  openScheduleDayPrompt(dateIso, event);
}

function openScheduleJobFromDay(dateIso){
  state.scheduleAddPromptDate = '';
  renderSchedule(buildDerivedState());
  openEntityModal('jobs', '', { scheduleDate:dateIso });
}

function closeScheduleActionPopover(renderView = true){
  const hadOpenPopover = !!state.scheduleActionJobId;
  state.scheduleActionJobId = '';
  state.scheduleQuickTechJobId = '';
  state.scheduleQuickTechTechnicianId = '';
  state.scheduleQuickTicketJobId = '';
  state.scheduleQuickTicketNumber = '';
  state.scheduleQuickTicketUrl = '';
  if(renderView && hadOpenPopover) renderSchedule(buildDerivedState());
}

function getScheduleQuickTechDefault(jobId){
  return getPrimaryTechnicianAssignment(jobId)?.resourceId || '';
}

function openScheduleJobActions(jobId, event){
  event?.preventDefault?.();
  event?.stopPropagation?.();
  const job = getJob(jobId);
  if(!job) return;
  const isAlreadyOpen = state.scheduleActionJobId === job.id;
  state.scheduleAddPromptDate = '';
  state.scheduleActionJobId = isAlreadyOpen ? '' : job.id;
  state.scheduleQuickTechJobId = '';
  state.scheduleQuickTechTechnicianId = isAlreadyOpen ? '' : getScheduleQuickTechDefault(job.id);
  state.scheduleQuickTicketJobId = '';
  state.scheduleQuickTicketNumber = '';
  state.scheduleQuickTicketUrl = '';
  renderSchedule(buildDerivedState());
}

function handleScheduleJobActionKey(event, jobId){
  if(!['Enter', ' '].includes(event.key) || event.target !== event.currentTarget) return;
  openScheduleJobActions(jobId, event);
}

function openScheduleJobEdit(jobId){
  closeScheduleActionPopover(false);
  openEntityModal('jobs', jobId);
}

function openScheduleJobRoute(jobId){
  closeScheduleActionPopover(false);
  window.location.href = `SureMap/SPLClientMap.HTML?mode=routes&buildRouteFromJob=${encodeURIComponent(jobId)}`;
}

function toggleScheduleQuickTech(jobId){
  if(state.scheduleQuickTechJobId === jobId){
    state.scheduleQuickTechJobId = '';
    state.scheduleQuickTechTechnicianId = '';
  } else {
    state.scheduleQuickTechJobId = jobId;
    state.scheduleQuickTechTechnicianId = getScheduleQuickTechDefault(jobId);
    state.scheduleQuickTicketJobId = '';
    state.scheduleQuickTicketNumber = '';
    state.scheduleQuickTicketUrl = '';
  }
  renderSchedule(buildDerivedState());
}

function setScheduleQuickTechSelection(jobId, technicianId){
  if(state.scheduleQuickTechJobId !== jobId) return;
  state.scheduleQuickTechTechnicianId = String(technicianId || '');
  renderSchedule(buildDerivedState());
}

function getScheduleQuickTicketDefaults(jobId){
  const job = getJob(jobId);
  return {
    ticketNumber:String(getSalesforceCaseLabel(job) || '').trim(),
    ticketUrl:String(getSalesforceCaseUrl(job) || '').trim()
  };
}

function toggleScheduleQuickTicket(jobId){
  if(state.scheduleQuickTicketJobId === jobId){
    state.scheduleQuickTicketJobId = '';
    state.scheduleQuickTicketNumber = '';
    state.scheduleQuickTicketUrl = '';
  } else {
    const defaults = getScheduleQuickTicketDefaults(jobId);
    state.scheduleQuickTicketJobId = jobId;
    state.scheduleQuickTicketNumber = defaults.ticketNumber;
    state.scheduleQuickTicketUrl = defaults.ticketUrl;
    state.scheduleQuickTechJobId = '';
    state.scheduleQuickTechTechnicianId = '';
  }
  renderSchedule(buildDerivedState());
}

function setScheduleQuickTicketField(jobId, key, value){
  if(state.scheduleQuickTicketJobId !== jobId) return;
  if(key === 'number') state.scheduleQuickTicketNumber = String(value || '');
  if(key === 'url') state.scheduleQuickTicketUrl = String(value || '');
}

function getScheduleTicketPayload(ticketNumber, ticketUrl){
  const manualTicketNumber = String(ticketNumber || '').trim();
  const manualTicketUrl = String(ticketUrl || '').trim();
  return {
    fieldfxTicketId:manualTicketNumber,
    salesforceCaseNumber:manualTicketNumber,
    salesforceCaseUrl:manualTicketUrl,
    salesforceSyncStatus:manualTicketNumber || manualTicketUrl ? 'Manual Link' : '',
    salesforceSyncError:''
  };
}

async function saveLocalScheduleTicket(jobId, ticketNumber, ticketUrl){
  const next = clone(state.data);
  const jobIndex = next.jobs.findIndex((row) => row.id === jobId);
  if(jobIndex < 0) throw new Error('Job was not found.');
  const now = new Date().toISOString();
  const existing = next.jobs[jobIndex];
  next.jobs[jobIndex] = normalizeRecord('jobs', { ...existing, ...getScheduleTicketPayload(ticketNumber, ticketUrl), updatedAt:now }, { fromRemote:false });
  await persistLocal(next);
}

async function saveRemoteScheduleTicket(jobId, ticketNumber, ticketUrl){
  const payload = getScheduleTicketPayload(ticketNumber, ticketUrl);
  await remoteRepository.updateWhere(ENTITY_CONFIG.jobs.table, [{ column:'id', value:jobId }], {
    fieldfx_ticket_id:payload.fieldfxTicketId,
    salesforce_case_number:payload.salesforceCaseNumber,
    salesforce_case_url:payload.salesforceCaseUrl,
    salesforce_sync_status:payload.salesforceSyncStatus,
    salesforce_sync_error:payload.salesforceSyncError
  });
  await loadData({ silent:true, force:true });
}

async function saveScheduleQuickTicket(jobId){
  if(!getJob(jobId)){ alert('Job was not found.'); return; }
  const ticketNumber = String(state.scheduleQuickTicketNumber || '');
  const ticketUrl = String(state.scheduleQuickTicketUrl || '');
  state.saveInFlight = true;
  state.scheduleActionSavingJobId = jobId;
  showSaveStatus('saving', 'SAVING');
  renderSchedule(buildDerivedState());
  try {
    if(isRemoteMode()) await saveRemoteScheduleTicket(jobId, ticketNumber, ticketUrl);
    else await saveLocalScheduleTicket(jobId, ticketNumber, ticketUrl);
    closeScheduleActionPopover(false);
    showSaveStatus('saved', 'Ticket updated');
    hideSaveStatusSoon();
    render();
  } catch (error){
    console.error('Unable to quick save Salesforce ticket:', error);
    showSaveStatus('error', 'SAVE FAILED');
    hideSaveStatusSoon(4200);
    alert(error.message || 'Unable to update the Salesforce ticket.');
  } finally {
    const shouldRerenderSchedule = state.scheduleActionSavingJobId === jobId && !!state.scheduleActionJobId;
    state.scheduleActionSavingJobId = '';
    state.saveInFlight = false;
    if(shouldRerenderSchedule) renderSchedule(buildDerivedState());
  }
}

function getQuickTechUpdatedAssignments(jobId, technicianId){
  const assignments = getAssignmentsForJob(jobId).map((row) => clone(row));
  const primaryTech = getPrimaryTechnicianAssignment(jobId);
  const duplicateTech = primaryTech
    ? assignments.find((row) => row.id !== primaryTech.id && row.assignmentType === 'Technician' && row.resourceId === technicianId)
    : null;
  if(!primaryTech){
    assignments.push(normalizeRecord('jobAssignments', { id:uid(ENTITY_CONFIG.jobAssignments.idPrefix), jobId, assignmentType:'Technician', resourceId:technicianId }, { fromRemote:false }));
    return assignments;
  }
  return assignments
    .filter((row) => !(duplicateTech && row.id === primaryTech.id))
    .map((row) => row.id === primaryTech.id ? { ...row, resourceId:technicianId } : row);
}

function formatScheduleIssueMessage(issue){
  if(issue?.type === 'blockingTravel') return `${getTechnicianLabel(issue.technicianId)} is blocked by travel away from Pittsburgh from ${fmtDateTime(issue.travel.arrivalAt)} to ${fmtDateTime(issue.travel.departureAt)}.`;
  if(issue?.type === 'missingPittsburghTravel') return `${getTechnicianLabel(issue.technicianId)} must have Pittsburgh travel covering this job before scheduling.`;
  return '';
}

function validateScheduleQuickTechChange(job, technicianId, assignments){
  if(!job) return 'Job was not found.';
  if(!technicianId) return 'Select a technician.';
  const employee = getEmployee(technicianId);
  if(!employee) return 'Selected technician was not found.';
  const currentTechnicianId = getScheduleQuickTechDefault(job.id);
  const eligibleOptions = buildTechnicianOptions(job.jobType, currentTechnicianId);
  if(!eligibleOptions.some((option) => option.value === technicianId)) return `${getEmployeeListName(employee)} is not eligible for this job type.`;
  const scheduleIssue = findJobScheduleIssue(job, assignments);
  return formatScheduleIssueMessage(scheduleIssue);
}

function getQuickTechPersistencePlan(jobId, technicianId){
  const primaryTech = getPrimaryTechnicianAssignment(jobId);
  const duplicateTech = primaryTech
    ? getTechnicianAssignmentsForJob(jobId).find((row) => row.id !== primaryTech.id && row.resourceId === technicianId)
    : null;
  if(!primaryTech) return { action:'insert', primaryTech:null, duplicateTech:null };
  if(duplicateTech) return { action:'delete-primary', primaryTech, duplicateTech };
  if(primaryTech.resourceId === technicianId) return { action:'none', primaryTech, duplicateTech:null };
  return { action:'update-primary', primaryTech, duplicateTech:null };
}

async function saveLocalScheduleQuickTech(jobId, technicianId){
  const next = clone(state.data);
  const now = new Date().toISOString();
  const nextAssignments = getQuickTechUpdatedAssignments(jobId, technicianId).map((assignment) => normalizeRecord('jobAssignments', {
    ...assignment,
    id:assignment.id || uid(ENTITY_CONFIG.jobAssignments.idPrefix),
    jobId,
    assignmentType:assignment.assignmentType || 'Technician',
    resourceId:assignment.resourceId,
    createdAt:assignment.createdAt || now,
    updatedAt:now
  }, { fromRemote:false }));
  next.jobAssignments = next.jobAssignments.filter((row) => row.jobId !== jobId).concat(nextAssignments);
  await persistLocal(next);
}

async function saveRemoteScheduleQuickTech(jobId, technicianId){
  const table = ENTITY_CONFIG.jobAssignments.table;
  const plan = getQuickTechPersistencePlan(jobId, technicianId);
  if(plan.action === 'insert'){
    await remoteRepository.insertRows(table, [{ job_id:jobId, assignment_type:'Technician', resource_id:technicianId, assignment_status:'Assigned', assignment_notes:'Quick changed from schedule.' }]);
  } else if(plan.action === 'delete-primary'){
    await remoteRepository.deleteWhere(table, [{ column:'id', value:plan.primaryTech.id }]);
  } else if(plan.action === 'update-primary'){
    await remoteRepository.updateWhere(table, [{ column:'id', value:plan.primaryTech.id }], { resource_id:technicianId, assignment_status:'Assigned' });
  }
  await loadData({ silent:true, force:true });
}

async function saveScheduleQuickTech(jobId){
  const job = getJob(jobId);
  const technicianId = String(state.scheduleQuickTechTechnicianId || '');
  const nextAssignments = getQuickTechUpdatedAssignments(jobId, technicianId);
  const validationMessage = validateScheduleQuickTechChange(job, technicianId, nextAssignments);
  if(validationMessage){ alert(validationMessage); return; }
  state.saveInFlight = true;
  state.scheduleActionSavingJobId = jobId;
  showSaveStatus('saving', 'SAVING');
  renderSchedule(buildDerivedState());
  try {
    if(isRemoteMode()) await saveRemoteScheduleQuickTech(jobId, technicianId);
    else await saveLocalScheduleQuickTech(jobId, technicianId);
    closeScheduleActionPopover(false);
    showSaveStatus('saved', 'Technician updated');
    hideSaveStatusSoon();
    render();
  } catch (error){
    console.error('Unable to quick change technician:', error);
    showSaveStatus('error', 'SAVE FAILED');
    hideSaveStatusSoon(4200);
    alert(error.message || 'Unable to update the technician.');
  } finally {
    const shouldRerenderSchedule = state.scheduleActionSavingJobId === jobId && !!state.scheduleActionJobId;
    state.scheduleActionSavingJobId = '';
    state.saveInFlight = false;
    if(shouldRerenderSchedule) renderSchedule(buildDerivedState());
  }
}

function renderScheduleJobActions(job){
  if(state.scheduleActionJobId !== job.id) return '';
  const quickOpen = state.scheduleQuickTechJobId === job.id;
  const quickTicketOpen = state.scheduleQuickTicketJobId === job.id;
  const saving = state.scheduleActionSavingJobId === job.id;
  const ticketActionLabel = getSalesforceCaseLabel(job) || getSalesforceCaseUrl(job) ? 'Edit Salesforce Ticket' : 'Add Salesforce Ticket';
  const selectedTechnicianId = String(state.scheduleQuickTechTechnicianId || getScheduleQuickTechDefault(job.id));
  const technicianOptions = buildTechnicianOptions(job.jobType, selectedTechnicianId);
  const ticketNumber = quickTicketOpen ? state.scheduleQuickTicketNumber : getSalesforceCaseLabel(job);
  const ticketUrl = quickTicketOpen ? state.scheduleQuickTicketUrl : getSalesforceCaseUrl(job);
  const quickTicketMarkup = quickTicketOpen ? `
    <div class="schedule-quick-ticket-row">
      <div class="schedule-quick-ticket-fields">
        <input class="form-input" type="text" value="${esc(ticketNumber)}" placeholder="Ticket / case number" oninput="setScheduleQuickTicketField('${esc(job.id)}', 'number', this.value)" ${saving ? 'disabled' : ''}>
        <input class="form-input" type="url" value="${esc(ticketUrl)}" placeholder="Salesforce ticket URL" oninput="setScheduleQuickTicketField('${esc(job.id)}', 'url', this.value)" ${saving ? 'disabled' : ''}>
      </div>
      <div class="schedule-quick-ticket-actions">
        <button class="btn-save" type="button" onclick="saveScheduleQuickTicket('${esc(job.id)}')" ${saving ? 'disabled' : ''}>${saving ? 'Saving' : 'Save'}</button>
        <button class="btn-cancel" type="button" onclick="toggleScheduleQuickTicket('${esc(job.id)}')" ${saving ? 'disabled' : ''}>Cancel</button>
      </div>
    </div>` : '';
  const quickTechMarkup = quickOpen ? `
    <div class="schedule-quick-tech-row">
      <select class="form-input" onchange="setScheduleQuickTechSelection('${esc(job.id)}', this.value)" ${saving ? 'disabled' : ''}>
        <option value="">Select technician...</option>
        ${technicianOptions.map((option) => `<option value="${esc(option.value)}" ${selectedTechnicianId === option.value ? 'selected' : ''}>${esc(option.label)}</option>`).join('')}
      </select>
      <div class="schedule-quick-tech-actions">
        <button class="btn-save" type="button" onclick="saveScheduleQuickTech('${esc(job.id)}')" ${saving || !selectedTechnicianId ? 'disabled' : ''}>${saving ? 'Saving' : 'Save'}</button>
        <button class="btn-cancel" type="button" onclick="toggleScheduleQuickTech('${esc(job.id)}')" ${saving ? 'disabled' : ''}>Cancel</button>
      </div>
    </div>` : '';
  return `
    <div class="schedule-job-action-popover" role="dialog" aria-label="Job actions for ${esc(getJobDisplayTitle(job))}" onclick="event.stopPropagation()">
      <button class="schedule-job-action-btn" type="button" onclick="openScheduleJobEdit('${esc(job.id)}')" ${saving ? 'disabled' : ''}>Edit Job</button>
      <button class="schedule-job-action-btn" type="button" onclick="openScheduleJobRoute('${esc(job.id)}')" ${saving ? 'disabled' : ''}>Edit/Add Route</button>
      <button class="schedule-job-action-btn ${quickTicketOpen ? 'active' : ''}" type="button" onclick="toggleScheduleQuickTicket('${esc(job.id)}')" ${saving ? 'disabled' : ''}>${esc(ticketActionLabel)}</button>
      ${quickTicketMarkup}
      <button class="schedule-job-action-btn ${quickOpen ? 'active' : ''}" type="button" onclick="toggleScheduleQuickTech('${esc(job.id)}')" ${saving ? 'disabled' : ''}>Quick Change Tech</button>
      ${quickTechMarkup}
    </div>`;
}

function getPriorityBadge(priority){
  const value = priority || 'Low';
  if(['low', 'normal'].includes(String(value).toLowerCase())) return '';
  const cls = value.toLowerCase().replace(/\s+/g, '-');
  return `<span class="priority-badge ${cls}">${esc(value)}</span>`;
}
function getStatusTone(status){ if(['In Progress', 'Available', 'Current', 'Logged In', 'Received by Lab', 'Inspection Current', 'On Site'].includes(status)) return 'ok'; if(['Waiting', 'Scheduled', 'Due Soon', 'Collected', 'Delivered', 'Assigned', 'Needs Pulled', 'Inspection Due Soon', 'Planned', 'In Transit'].includes(status)) return 'warn'; if(['Urgent', 'Overdue', 'Out of Service', 'Needs Repair', 'Canceled', 'Exception', 'Inspection Overdue'].includes(status)) return 'danger'; if(['Complete', 'Closed', 'Inactive'].includes(status)) return 'muted'; return 'info'; }
function getStatusBadge(status){ return `<span class="status-badge ${getStatusTone(status)}">${esc(status || 'Not set')}</span>`; }
function getTruckInspectionBadge(truck){ const status = getTruckInspectionStatus(truck); return status ? getStatusBadge(status) : ''; }
function getFuelTypeBadge(fuelType){
  const value = String(fuelType || '').trim();
  if(!value) return '<span class="fuel-badge fuel-type-unset">Fuel Not Set</span>';
  const cls = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'other';
  return `<span class="fuel-badge fuel-type-${esc(cls)}">${esc(value)}</span>`;
}
function getJobTypeBadge(jobType){
  const label = getJobTypeDisplayName(jobType);
  const key = normalizeJobTypeKey(typeof jobType === 'object' && jobType !== null ? (jobType.jobTypeKey || jobType.jobTypeName) : jobType);
  const cls = key ? key.toLowerCase().replace(/_/g, '-') : 'unknown';
  return `<span class="job-type-badge job-type-${esc(cls)}" style="${esc(getJobTypeBadgeStyle(jobType))}">${esc(label)}</span>`;
}
function getJobTypeClassName(jobType){
  const key = normalizeJobTypeKey(typeof jobType === 'object' && jobType !== null ? (jobType.jobTypeKey || jobType.jobTypeName) : jobType);
  return key ? `job-type-${key.toLowerCase().replace(/_/g, '-')}` : 'job-type-unknown';
}
function normalizeOptions(options){ if(!Array.isArray(options)) return []; return options.map((option) => typeof option === 'string' ? { value:option, label:option } : option); }
function renderTags(csvText){ const tags = String(csvText || '').split(',').map((value) => value.trim()).filter(Boolean); return tags.length ? `<div class="tag-row">${tags.map((tag) => `<span class="tag-chip">${esc(tag)}</span>`).join('')}</div>` : '<span class="muted">None listed</span>'; }
function renderWarnings(warnings){ return warnings.length ? `<div class="warning-row">${warnings.map((warning) => `<span class="warning-chip">${esc(warning)}</span>`).join('')}</div>` : ''; }
function renderCardOpenAttrs(entityKey, id){ return `class="resource-card clickable-card" role="button" tabindex="0" onclick="openEntityModal('${entityKey}','${esc(id)}')" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); openEntityModal('${entityKey}','${esc(id)}'); }"`; }
function renderSelectableOpenAttrs(entityKey, id, className, title = '', style = ''){
  const label = title || `Open ${ENTITY_CONFIG[entityKey].label}`;
  return `class="${esc(className)}" ${style ? `style="${esc(style)}" ` : ''}role="button" tabindex="0" title="${esc(label)}" onclick="openEntityModal('${entityKey}','${esc(id)}')" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); openEntityModal('${entityKey}','${esc(id)}'); }"`;
}
function buildTableRow(entityKey, id, cells){
  return {
    cells,
    attrs:`class="clickable-table-row" role="button" tabindex="0" title="Open ${esc(ENTITY_CONFIG[entityKey].label)}" onclick="openEntityModal('${entityKey}','${esc(id)}')" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); openEntityModal('${entityKey}','${esc(id)}'); }"`
  };
}

function renderTable(columns, rows, emptyMarkup){
  if(!rows.length) return `<div class="empty-state">${emptyMarkup}</div>`;
  return `<div class="table-wrap"><table><thead><tr>${columns.map((column) => `<th>${column}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => {
    const cells = Array.isArray(row) ? row : row.cells;
    const attrs = Array.isArray(row) ? '' : (row.attrs || '');
    return `<tr ${attrs}>${cells.map((cell) => `<td>${cell}</td>`).join('')}</tr>`;
  }).join('')}</tbody></table></div>`;
}

function getJobWarnings(job, derived, options = {}){
  const warnings = [];
  const missing = getJobMissingRequirements(job);
  if(missing.length) warnings.push(`Missing: ${missing.join(', ')}`);
  if(derived.conflictJobIds.has(job.id)) warnings.push('Resource conflict');
  if(!options.omitRoute && (derived.needsRouteJobIds?.has(job.id) || jobNeedsRoute(job, derived))) warnings.push('Needs Route');
  warnings.push(...getAssignedResourceWarnings(job));
  return [...new Set(warnings)];
}

function renderMiniJobList(jobs, derived, emptyText){
  if(!jobs.length) return `<div class="empty-state"><strong>Nothing to show</strong>${esc(emptyText)}</div>`;
  return `<div class="mini-list">${[...jobs].sort(getEntitySorter('jobs')).map((job) => `<div ${renderSelectableOpenAttrs('jobs', job.id, 'mini-card overview-job-card clickable-card', 'Open Job', getJobTypeScheduleStyle(job.jobType))}><div class="mini-head"><div><div class="item-title">${esc(getJobDisplayTitle(job))}</div><div class="muted">${esc(getClientLabel(job.clientId))} | ${esc(getProjectLabel(job.projectId))} | ${esc(getJobSiteSummary(job))}</div></div>${getPriorityBadge(job.priority)}</div><div class="mini-tags"><span class="mini-tag">${esc(getJobScheduleLabel(job))}</span>${renderJobSalesforceTag(job)}</div>${renderWarnings(getJobWarnings(job, derived))}</div>`).join('')}</div>`;
}

function renderIssueCard(label, value, copy){
  return `<div class="issue-item"><div><div class="item-title">${esc(label)}</div><div class="muted">${esc(copy)}</div></div><strong>${esc(value)}</strong></div>`;
}

function summarizeAssignments(jobId){
  const assignments = getAssignmentsForJob(jobId);
  if(!assignments.length) return '<span class="muted">Unassigned</span>';
  const grouped = {};
  assignments.forEach((assignment) => { grouped[assignment.assignmentType] = grouped[assignment.assignmentType] || []; grouped[assignment.assignmentType].push(getResourceLabel(assignment.assignmentType, assignment.resourceId)); });
  return Object.keys(grouped).map((key) => `<span class="tag-chip">${esc(key)}: ${esc(grouped[key].join(' | '))}</span>`).join('');
}

function getDispatchAssignmentLabels(jobId, assignmentTypes){
  const typeSet = new Set(assignmentTypes);
  return getAssignmentsForJob(jobId)
    .filter((assignment) => assignment.resourceId && typeSet.has(assignment.assignmentType))
    .map((assignment) => assignmentTypes.length > 1 ? `${assignment.assignmentType}: ${getResourceLabel(assignment.assignmentType, assignment.resourceId)}` : getResourceLabel(assignment.assignmentType, assignment.resourceId));
}

function renderDispatchAssignmentCell(labels){
  return labels.length ? `<div class="mini-tags dispatch-assignment-tags">${labels.map((label) => `<span class="tag-chip">${esc(label)}</span>`).join('')}</div>` : '<span class="muted">Unassigned</span>';
}

function renderScheduleTechnicianLine(jobId){
  const techLabels = getDispatchAssignmentLabels(jobId, ['Technician']);
  return `<div class="schedule-tech muted">Tech: ${esc(techLabels.join(' | ') || 'Unassigned')}</div>`;
}

function buildDispatchJobView(job, derived){
  const warnings = getJobWarnings(job, derived);
  const techLabels = getDispatchAssignmentLabels(job.id, ['Technician']);
  const truckLabels = getDispatchAssignmentLabels(job.id, ['Truck', 'Trailer']);
  const equipmentLabels = getDispatchAssignmentLabels(job.id, ['Equipment']);
  const missingRequirements = getJobMissingRequirements(job);
  return {
    job,
    warnings,
    missingRequirements,
    techLabels,
    truckLabels,
    equipmentLabels,
    values:{
      job:[getJobTypeDisplayName(job.jobType), job.scopeSummary, job.custodyAllocation].filter(Boolean).join(' '),
      client:[getClientLabel(job.clientId), getProjectLabel(job.projectId), getJobSiteSummary(job)].join(' '),
      schedule:getJobPrimaryDate(job)?.getTime() ?? null,
      priority:PRIORITY_RANK[job.priority] ?? 99,
      tech:techLabels.join(' | '),
      truck:truckLabels.join(' | '),
      equipment:equipmentLabels.join(' | '),
      alerts:warnings.length ? `${warnings.length} ${warnings.join(' ')}` : ''
    }
  };
}

function compareDispatchValues(left, right, direction = 'asc'){
  const leftMissing = left === null || left === undefined || left === '';
  const rightMissing = right === null || right === undefined || right === '';
  if(leftMissing && rightMissing) return 0;
  if(leftMissing) return 1;
  if(rightMissing) return -1;
  const base = typeof left === 'number' && typeof right === 'number'
    ? left - right
    : String(left).localeCompare(String(right), undefined, { numeric:true, sensitivity:'base' });
  return direction === 'desc' ? -base : base;
}

function compareDispatchRows(left, right){
  const sortKey = state.filters.dispatchSortKey || 'schedule';
  const direction = state.filters.dispatchSortDirection || 'asc';
  return compareDispatchValues(left.values[sortKey], right.values[sortKey], direction)
    || compareDispatchValues(left.values.schedule, right.values.schedule, 'asc')
    || compareDispatchValues(left.values.priority, right.values.priority, 'asc')
    || compareDispatchValues(left.values.job, right.values.job, 'asc')
    || compareStrings(left.job.id, right.job.id);
}

function getFilteredDispatchRows(derived){
  const search = state.filters.dispatchSearch.trim().toLowerCase();
  return state.data.jobs.map((job) => buildDispatchJobView(job, derived)).filter((row) => {
    const job = row.job;
    const past = isJobPast(job);
    if(state.filters.dispatchJobFilter === 'open' && past) return false;
    if(state.filters.dispatchJobFilter === 'past' && !past) return false;
    if(state.filters.dispatchPriority !== 'all' && job.priority !== state.filters.dispatchPriority) return false;
    if(state.filters.dispatchJobType !== 'all' && resolveJobTypeValue(state.data.jobTypes, job.jobType) !== state.filters.dispatchJobType) return false;
    if(state.filters.dispatchAlertFilter === 'has' && !row.warnings.length) return false;
    if(state.filters.dispatchAlertFilter === 'none' && row.warnings.length) return false;
    if(state.filters.dispatchAssignmentFilter === 'missing' && !row.missingRequirements.length) return false;
    if(state.filters.dispatchAssignmentFilter === 'complete' && row.missingRequirements.length) return false;
    if(!search) return true;
    const haystack = [getJobDisplayTitle(job), getJobTypeDisplayName(job.jobType), job.scopeSummary, job.clientContactForJob, getClientLabel(job.clientId), getProjectLabel(job.projectId), getJobSiteSummary(job), getJobSites(job).map((site) => site.siteName).join(' '), row.techLabels.join(' '), row.truckLabels.join(' '), row.equipmentLabels.join(' '), row.warnings.join(' ')].join(' ').toLowerCase();
    return haystack.includes(search);
  }).sort(compareDispatchRows);
}

function renderOverview(derived){
  const todayJobs = state.data.jobs.filter((job) => isSameDay(getJobPrimaryDate(job), todayISO()));
  const nextSevenJobs = state.data.jobs.filter((job) => { const date = parseDateOnly(getJobPrimaryDate(job)); const today = parseDateOnly(todayISO()); const max = parseDateOnly(addDaysISO(todayISO(), 7)); return !!(date && today && max && date > today && date <= max); });
  const samplesInTransit = state.data.samples.filter((row) => row.chainOfCustodyStatus === 'In Transit');
  const openJobs = state.data.jobs.filter((job) => !isJobClosed(job));
  document.getElementById('overview-stats').innerHTML = [{ label:'Jobs Today', value:todayJobs.length, cls:'' }, { label:'Open Jobs', value:openJobs.length, cls:'ok' }, { label:'Samples In Transit', value:samplesInTransit.length, cls:'warn' }, { label:'Assets Down', value:derived.downAssets.length, cls:'danger' }, { label:'Inspections Due', value:derived.inspectionDueTrucks.length, cls:derived.inspectionDueTrucks.some((truck) => getTruckInspectionStatus(truck) === 'Inspection Overdue') ? 'danger' : 'warn' }].map((card) => `<div class="stat-card ${card.cls}"><div class="stat-label">${esc(card.label)}</div><div class="stat-value ${card.cls}">${esc(card.value)}</div></div>`).join('');
  document.getElementById('overview-actions').innerHTML = `<button class="add-btn" type="button" onclick="openEntityModal('jobs')">+ Add Job</button>`;
  document.getElementById('today-jobs-panel').innerHTML = renderMiniJobList(todayJobs, derived, 'No field jobs are scheduled for today yet.');
  document.getElementById('next-seven-panel').innerHTML = renderMiniJobList(nextSevenJobs, derived, 'No upcoming jobs are scheduled in the next seven days.');
}

function renderDispatchSortHeader(column){
  const active = state.filters.dispatchSortKey === column.key;
  const direction = active ? state.filters.dispatchSortDirection : '';
  const indicator = active ? (direction === 'desc' ? 'v' : '^') : '';
  return `<button class="sort-header-btn ${active ? 'active' : ''}" type="button" onclick="setDispatchSort('${esc(column.key)}')" aria-label="Sort by ${esc(column.label)}">${esc(column.label)}${indicator ? `<span>${esc(indicator)}</span>` : ''}</button>`;
}

function renderDispatchTable(rows){
  if(!rows.length) return '<div class="empty-state"><strong>No dispatch jobs yet</strong>Use the Add Job button to start building the field schedule.</div>';
  const columns = [
    { key:'job', label:'Job' },
    { key:'client', label:'Client / Project / Site' },
    { key:'schedule', label:'Schedule' },
    { key:'priority', label:'Priority' },
    { key:'tech', label:'Tech' },
    { key:'truck', label:'Truck' },
    { key:'equipment', label:'Equipment' }
  ];
  return `<div class="table-wrap"><table class="dispatch-table"><thead><tr>${columns.map((column) => `<th>${renderDispatchSortHeader(column)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => {
    const job = row.job;
    const cells = [
      `<div class="inline-stack dispatch-job-cell"><div>${getJobTypeBadge(job.jobType)}${renderJobSalesforceTag(job)}</div><div class="muted">${esc(job.scopeSummary || 'No scope summary')}</div>${job.custodyAllocation ? `<div class="muted">${esc(job.custodyAllocation)}</div>` : ''}</div>`,
      `<div class="inline-stack"><div class="item-title">${esc(getClientLabel(job.clientId))}</div><div class="muted">${esc(getProjectLabel(job.projectId))} | ${esc(getJobSiteSummary(job))}</div></div>`,
      `<div class="inline-stack"><div>${esc(getJobScheduleLabel(job))}</div></div>`,
      getPriorityBadge(job.priority),
      renderDispatchAssignmentCell(row.techLabels),
      renderDispatchAssignmentCell(row.truckLabels),
      renderDispatchAssignmentCell(row.equipmentLabels)
    ];
    return `<tr class="clickable-table-row" role="button" tabindex="0" title="Open Job" onclick="openEntityModal('jobs','${esc(job.id)}')" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); openEntityModal('jobs','${esc(job.id)}'); }">${cells.map((cell) => `<td>${cell}</td>`).join('')}</tr>`;
  }).join('')}</tbody></table></div>`;
}

function renderDispatch(derived){
  const filteredRows = getFilteredDispatchRows(derived);
  document.getElementById('dispatch-toolbar').innerHTML = `<span class="label">Search</span><input type="text" value="${esc(state.filters.dispatchSearch)}" placeholder="Job type, client, project, site/location, resource, alert, or scope..." oninput="setDispatchFilter('dispatchSearch', this.value)"><span class="label">Jobs</span><select onchange="setDispatchFilter('dispatchJobFilter', this.value)"><option value="all" ${state.filters.dispatchJobFilter === 'all' ? 'selected' : ''}>All Jobs</option><option value="open" ${state.filters.dispatchJobFilter === 'open' ? 'selected' : ''}>Open Jobs</option><option value="past" ${state.filters.dispatchJobFilter === 'past' ? 'selected' : ''}>Past Jobs</option></select><span class="label">Priority</span><select onchange="setDispatchFilter('dispatchPriority', this.value)"><option value="all">All Priorities</option>${PRIORITY_OPTIONS.map((priority) => `<option value="${esc(priority)}" ${state.filters.dispatchPriority === priority ? 'selected' : ''}>${esc(priority)}</option>`).join('')}</select><span class="label">Type</span><select onchange="setDispatchFilter('dispatchJobType', this.value)"><option value="all">All Job Types</option>${getActiveJobTypes().map((jobType) => `<option value="${esc(jobType.jobTypeKey)}" ${state.filters.dispatchJobType === jobType.jobTypeKey ? 'selected' : ''}>${esc(jobType.jobTypeName)}</option>`).join('')}</select><span class="label">Alerts</span><select onchange="setDispatchFilter('dispatchAlertFilter', this.value)"><option value="all" ${state.filters.dispatchAlertFilter === 'all' ? 'selected' : ''}>All</option><option value="has" ${state.filters.dispatchAlertFilter === 'has' ? 'selected' : ''}>Has Alerts</option><option value="none" ${state.filters.dispatchAlertFilter === 'none' ? 'selected' : ''}>No Alerts</option></select><span class="label">Assignments</span><select onchange="setDispatchFilter('dispatchAssignmentFilter', this.value)"><option value="all" ${state.filters.dispatchAssignmentFilter === 'all' ? 'selected' : ''}>All</option><option value="missing" ${state.filters.dispatchAssignmentFilter === 'missing' ? 'selected' : ''}>Missing Required</option><option value="complete" ${state.filters.dispatchAssignmentFilter === 'complete' ? 'selected' : ''}>Fully Assigned</option></select><div class="toolbar-spacer"></div><button class="act-btn" type="button" onclick="switchView('setup')">Manage Job Types</button><button class="add-btn" type="button" onclick="openEntityModal('jobs')">+ Add Job</button>`;
  document.getElementById('dispatch-summary').textContent = `${filteredRows.length} visible / ${state.data.jobs.length} total`;
  document.getElementById('dispatch-table').innerHTML = renderDispatchTable(filteredRows);
}

function getScheduleViewOptions(){
  return [
    { value:'work_week', label:'Work Week' },
    { value:'week', label:'Weekly' },
    { value:'month', label:'Month' }
  ];
}

function getScheduleFilterOptions(){
  return [
    { value:'all', label:'All' },
    { value:'open', label:'Open' },
    { value:'past', label:'Past' }
  ];
}

function getTravelEndpointLabel(travel, side){
  const type = travel?.[`${side}Type`];
  if(type === 'spl_site') return getSplSiteLabel(travel?.[`${side}SplSiteId`]);
  if(type === 'client_site'){
    const site = getSite(travel?.[`${side}ClientSiteId`]);
    return site ? `${site.siteName || 'Unnamed location'} | ${getClientLabel(site.clientId)}` : 'Unknown client site';
  }
  return travel?.[`${side}Label`] || travel?.[`${side}Location`] || 'Other location';
}

function getTravelRouteLabel(travel){
  return `${getTravelEndpointLabel(travel, 'origin')} to ${getTravelEndpointLabel(travel, 'destination')}`;
}

function getTravelPeriodBounds(dates){
  if(state.scheduleView === 'month'){
    const start = parseDateOnly(getStartOfMonthISO(state.scheduleAnchorDate));
    const end = start ? new Date(start.getFullYear(), start.getMonth() + 1, 1) : null;
    return { start, end };
  }
  const start = parseDateOnly(dates[0]);
  const last = parseDateOnly(dates[dates.length - 1]);
  const end = last ? parseDateOnly(addDaysISO(last, 1)) : null;
  return { start, end };
}

function getTravelForScheduleDates(dates){
  const bounds = getTravelPeriodBounds(dates);
  if(!bounds.start || !bounds.end) return [];
  return state.data.technicianTravel
    .filter((travel) => {
      const window = getTravelWindow(travel);
      return window && windowsOverlap(window.start, window.end, bounds.start, bounds.end);
    })
    .sort(getEntitySorter('technicianTravel'));
}

function getTravelForScheduleDate(travelRows, dateIso){
  const dayStart = parseDateOnly(dateIso);
  const dayEnd = dayStart ? parseDateOnly(addDaysISO(dateIso, 1)) : null;
  if(!dayStart || !dayEnd) return [];
  return travelRows.filter((travel) => {
    const window = getTravelWindow(travel);
    return window && windowsOverlap(window.start, window.end, dayStart, dayEnd);
  });
}

function getTravelDayClasses(dateIso){
  return [
    'day-column',
    'travel-day-column',
    isWeekendDate(dateIso) ? 'weekend-day' : ''
  ].filter(Boolean).join(' ');
}

function isTravelTimeOnDate(value, dateIso){
  const date = parseDateTime(value);
  return !!(date && toInputDate(date) === dateIso);
}

function getTravelStayLocationLabel(travel){
  return getTravelEndpointLabel(travel, 'destination');
}

function renderTravelDayBadges(travel, dateIso){
  const badges = [];
  if(isTravelTimeOnDate(travel.arrivalAt, dateIso)){
    badges.push(`<span class="status-badge info">${esc(travel.direction === 'Inbound' ? 'Inbound' : 'Arrive')} ${esc(fmtTime(travel.arrivalAt))}</span>`);
  }
  if(isTravelTimeOnDate(travel.departureAt, dateIso)){
    badges.push(`<span class="status-badge warn">Depart ${esc(fmtTime(travel.departureAt))}</span>`);
  }
  if(!badges.length) badges.push('<span class="tag-chip">On Site</span>');
  return `<div class="mini-tags travel-day-badges">${badges.join('')}</div>`;
}

function renderTravelCard(travel, dateIso = ''){
  const cardClasses = `travel-card clickable-card ${isTravelBlocking(travel) ? 'active-travel' : 'closed-travel'}`;
  if(dateIso){
    return `<div ${renderSelectableOpenAttrs('technicianTravel', travel.id, cardClasses, 'Open Travel')}><div class="travel-card-head"><div><div class="item-title">${esc(getTechnicianLabel(travel.technicianId))}</div><div class="muted travel-location">At ${esc(getTravelStayLocationLabel(travel))}</div></div>${renderTravelDayBadges(travel, dateIso)}</div></div>`;
  }
  return `<div ${renderSelectableOpenAttrs('technicianTravel', travel.id, cardClasses, 'Open Travel')}><div class="travel-card-head"><div><div class="item-title">${esc(getTechnicianLabel(travel.technicianId))}</div><div class="muted">${esc(getTravelRouteLabel(travel))}</div></div><div class="mini-tags">${getStatusBadge(travel.direction)}</div></div><div class="travel-compact-meta"><span>Arrive ${esc(fmtDateTime(travel.arrivalAt))}</span><span>Depart ${esc(fmtDateTime(travel.departureAt))}</span><span>${esc(formatTravelDuration(travel.arrivalAt, travel.departureAt))}</span></div></div>`;
}

function renderTravelSchedule(dates){
  const summaryNode = document.getElementById('travel-summary');
  const boardNode = document.getElementById('travel-board');
  if(!summaryNode || !boardNode) return;
  const travelRows = getTravelForScheduleDates(dates);
  summaryNode.textContent = `${travelRows.length} travel ${travelRows.length === 1 ? 'entry' : 'entries'} ${getScheduleViewSummaryLabel(state.scheduleView)}`;
  if(!travelRows.length){
    boardNode.innerHTML = '<div class="empty-state"><strong>No technician travel scheduled</strong>Add inbound or outbound travel when technicians are coming to or leaving this site.</div>';
    return;
  }
  if(state.scheduleView !== 'month'){
    boardNode.innerHTML = `<div class="travel-week schedule-week schedule-${esc(state.scheduleView)}">${dates.map((dateIso) => { const travelForDay = getTravelForScheduleDate(travelRows, dateIso); return `<div class="${getTravelDayClasses(dateIso)}"><div class="day-head"><strong>${esc(parseDateOnly(dateIso)?.toLocaleDateString('en-US', { weekday:'long' }) || '')}</strong><span>${esc(fmtDate(dateIso))}</span></div><div class="day-list">${travelForDay.length ? travelForDay.map((travel) => renderTravelCard(travel, dateIso)).join('') : '<div class="empty-state">No travel</div>'}</div></div>`; }).join('')}</div>`;
    return;
  }
  boardNode.innerHTML = `<div class="travel-list">${travelRows.map(renderTravelCard).join('')}</div>`;
}

function renderScheduleSegmentedControl(label, options, activeValue, handlerName){
  return `<span class="label">${esc(label)}</span><div class="segmented-control">${options.map((option) => `<button class="view-btn ${activeValue === option.value ? 'active' : ''}" type="button" onclick="${handlerName}('${esc(option.value)}')">${esc(option.label)}</button>`).join('')}</div>`;
}

function getScheduleViewLabel(value){
  return getScheduleViewOptions().find((option) => option.value === value)?.label || 'Work Week';
}

function getScheduleViewSummaryLabel(value){
  const isCurrentPeriod = value === 'month'
    ? state.scheduleAnchorDate === getStartOfMonthISO(new Date())
    : state.scheduleAnchorDate === getStartOfWeekISO(new Date());
  const prefix = isCurrentPeriod ? 'this' : 'selected';
  if(value === 'work_week') return `${prefix} work week`;
  if(value === 'month') return `${prefix} month`;
  return `${prefix} week`;
}

function getSchedulePeriodLabel(dates){
  const first = dates[0];
  const last = dates[dates.length - 1];
  if(state.scheduleView === 'month'){
    const monthDate = parseDateOnly(state.scheduleAnchorDate);
    return monthDate ? monthDate.toLocaleDateString('en-US', { month:'long', year:'numeric' }) : 'Month';
  }
  return `${fmtDate(first)} - ${fmtDate(last)}`;
}

function getScheduleDates(){
  if(state.scheduleView === 'month'){
    const monthStart = parseDateOnly(getStartOfMonthISO(state.scheduleAnchorDate));
    const gridStartIso = getStartOfWeekISO(monthStart);
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
    const gridEndIso = addDaysISO(getStartOfWeekISO(monthEnd), 6);
    const dates = [];
    for(let cursor = gridStartIso; parseDateOnly(cursor) <= parseDateOnly(gridEndIso); cursor = addDaysISO(cursor, 1)){
      dates.push(cursor);
    }
    return dates;
  }
  const weekStart = getStartOfWeekISO(state.scheduleAnchorDate);
  if(state.scheduleView === 'work_week'){
    const workWeekStart = getStartOfWorkWeekISO(weekStart);
    return Array.from({ length:5 }, (_, index) => addDaysISO(workWeekStart, index));
  }
  return Array.from({ length:7 }, (_, index) => addDaysISO(weekStart, index));
}

function isDateInScheduleMonth(dateIso){
  const date = parseDateOnly(dateIso);
  const monthStart = parseDateOnly(getStartOfMonthISO(state.scheduleAnchorDate));
  return !!(date && monthStart && date.getFullYear() === monthStart.getFullYear() && date.getMonth() === monthStart.getMonth());
}

function getJobsForScheduleDates(dates, jobFilter = state.scheduleJobFilter){
  const dateSet = new Set(dates);
  return state.data.jobs.filter((job) => {
    const jobDate = getJobPrimaryDate(job);
    if(!jobDate) return false;
    const jobDateIso = toInputDate(jobDate);
    if(!dateSet.has(jobDateIso)) return false;
    if(state.scheduleView === 'month' && !isDateInScheduleMonth(jobDateIso)) return false;
    const past = isJobPast(job);
    if(jobFilter === 'open') return !past;
    if(jobFilter === 'past') return past;
    return true;
  }).sort(getEntitySorter('jobs'));
}

function getScheduleDayClasses(dateIso){
  return [
    'day-column',
    isWeekendDate(dateIso) ? 'weekend-day' : '',
    state.scheduleView === 'month' && !isDateInScheduleMonth(dateIso) ? 'outside-month' : '',
    state.scheduleAddPromptDate === dateIso ? 'add-prompt-open' : ''
  ].filter(Boolean).join(' ');
}

function renderSchedule(derived){
  const scheduleDates = getScheduleDates();
  const scheduleJobs = getJobsForScheduleDates(scheduleDates);
  const totalJobsInRange = getJobsForScheduleDates(scheduleDates, 'all').length;
  const filterLabel = getScheduleFilterOptions().find((option) => option.value === state.scheduleJobFilter)?.label || 'All';
  document.getElementById('schedule-toolbar').innerHTML = `${renderScheduleSegmentedControl('View', getScheduleViewOptions(), state.scheduleView, 'setScheduleView')}${renderScheduleSegmentedControl('Jobs', getScheduleFilterOptions(), state.scheduleJobFilter, 'setScheduleJobFilter')}<span class="label">Period</span><button class="act-btn" type="button" onclick="changeScheduleWeek(-1)">Prev</button><button class="act-btn" type="button" onclick="resetScheduleWeek()">Current</button><button class="act-btn" type="button" onclick="changeScheduleWeek(1)">Next</button><button class="act-btn" type="button" onclick="sendTeamsWebhookTest()">Send Teams Test</button><div class="toolbar-summary">${esc(getSchedulePeriodLabel(scheduleDates))}</div>`;
  document.getElementById('schedule-summary').textContent = `${scheduleJobs.length} visible / ${totalJobsInRange} jobs ${getScheduleViewSummaryLabel(state.scheduleView)} | ${getScheduleViewLabel(state.scheduleView)} | ${filterLabel}`;
  document.getElementById('schedule-board').innerHTML = `
    <div class="schedule-week schedule-${esc(state.scheduleView)}">
      ${scheduleDates.map((dateIso) => {
        const jobsForDay = scheduleJobs.filter((job) => isSameDay(getJobPrimaryDate(job), dateIso));
        const addPrompt = state.scheduleAddPromptDate === dateIso
          ? `<div class="schedule-add-popover" role="dialog" aria-label="Add job for ${esc(fmtDate(dateIso))}" onclick="event.stopPropagation()"><button class="add-btn schedule-add-job-btn" type="button" onclick="openScheduleJobFromDay('${esc(dateIso)}')">+ Add Job</button></div>`
          : '';
        return `<div class="${getScheduleDayClasses(dateIso)}" role="button" tabindex="0" title="Click to add a job" onclick="openScheduleDayPrompt('${esc(dateIso)}', event)" onkeydown="handleScheduleDayKey(event, '${esc(dateIso)}')">
          <div class="day-head"><strong>${esc(parseDateOnly(dateIso)?.toLocaleDateString('en-US', { weekday:'long' }) || '')}</strong><span>${esc(fmtDate(dateIso))}</span></div>
          ${addPrompt}
          <div class="day-list">
            ${jobsForDay.length ? jobsForDay.map((job) => {
              const warnings = getJobWarnings(job, derived, { omitRoute:true });
              const missingEquipment = getJobMissingRequirements(job).includes('Equipment');
              const pastJob = isJobPast(job);
              const cardClasses = ['schedule-card', 'clickable-card', getJobTypeClassName(job.jobType), state.scheduleActionJobId === job.id ? 'action-open' : '', missingEquipment ? 'missing-equipment' : '', pastJob ? 'past-job' : '', derived.conflictJobIds.has(job.id) ? 'conflict' : '', warnings.length ? 'warning' : ''].filter(Boolean).join(' ');
              return `<div class="${esc(cardClasses)}" style="${esc(getJobTypeScheduleStyle(job.jobType))}" role="button" tabindex="0" title="Job Actions" aria-expanded="${state.scheduleActionJobId === job.id ? 'true' : 'false'}" onclick="openScheduleJobActions('${esc(job.id)}', event)" onkeydown="handleScheduleJobActionKey(event, '${esc(job.id)}')">
                <div class="item-title">${esc(getJobDisplayTitle(job))}</div>
                <div class="muted">${esc(fmtTime(job.scheduledStart || job.requestedDate))} | ${esc(getJobSiteSummary(job))}</div>
                <div class="mini-tags">${renderJobSalesforceTag(job)}${renderJobNeedsTicketTag(job)}${renderJobNeedsRouteTag(job, derived)}</div>
                ${renderScheduleTechnicianLine(job.id)}
                ${renderWarnings(warnings)}
                ${renderScheduleJobActions(job)}
              </div>`;
            }).join('') : '<div class="empty-state">No scheduled jobs</div>'}
          </div>
        </div>`;
      }).join('')}
    </div>`;
  renderTravelSchedule(scheduleDates);
}

function getActiveDirectoryClientId(){
  if(state.filters.directoryClient !== 'all' && getClient(state.filters.directoryClient)) return state.filters.directoryClient;
  return '';
}
function getDirectoryProjects(clientId){ return state.data.projects.filter((row) => row.clientId === clientId).sort(getEntitySorter('projects')); }
function getDirectoryContacts(clientId, projectId = 'all'){
  return state.data.contacts
    .filter((row) => row.clientId === clientId && (projectId === 'all' || contactMatchesProjectScope(row, projectId)))
    .sort(getEntitySorter('contacts'));
}
function getDirectoryBillingProfiles(clientId, projectId = 'all'){
  const profile = getBillingProfileForClient(clientId);
  return profile ? [profile] : [];
}
function getDirectorySites(clientId, projectId = 'all'){
  return state.data.sites
    .filter((row) => row.clientId === clientId && (projectId === 'all' || getProjectIdsForSite(row.id).includes(projectId)))
    .sort(getEntitySorter('sites'));
}
function getDirectoryJobs(clientId, projectId = 'all'){
  return state.data.jobs
    .filter((row) => row.clientId === clientId && (projectId === 'all' || row.projectId === projectId))
    .sort(getEntitySorter('jobs'));
}
function getDirectoryClientPickerMatches(){
  const query = String(state.filters.directoryClientSearch || '').trim().toLowerCase();
  return [...state.data.clients].sort(getEntitySorter('clients')).filter((client) => {
    if(!query) return true;
    const haystack = [
      client.clientName,
      normalizeClientCode(client.clientCode),
      client.salesforceAccountId,
      client.defaultServiceArea,
      client.primaryContact,
      client.contactPhone,
      client.contactEmail,
      client.accountStatus,
      client.serviceScope,
      client.sector
    ].join(' ').toLowerCase();
    return haystack.includes(query);
  });
}

function renderDirectoryClientPicker(activeClientId){
  const activeClient = getClient(activeClientId);
  const value = state.filters.directoryClientSearch || activeClient?.clientName || '';
  return `<div class="client-picker directory-client-picker"><span class="label">Client</span><div class="client-picker-shell"><input id="directory-client-picker-input" type="text" value="${esc(value)}" placeholder="${state.data.clients.length ? 'Search clients...' : 'No clients yet'}" autocomplete="off" onfocus="openDirectoryClientPicker()" oninput="setDirectoryClientPickerSearch(this.value)" onkeydown="handleDirectoryClientPickerKey(event)" onblur="setTimeout(closeDirectoryClientPicker, 140)"><button class="act-btn client-picker-trigger" type="button" onclick="openDirectoryClientPicker()" aria-label="Open client picker">Select</button><div class="client-picker-results" id="directory-client-picker-results">${renderDirectoryClientPickerResults(activeClientId)}</div></div></div>`;
}

function renderDirectoryClientPickerResults(activeClientId){
  if(!state.data.clients.length) return '<div class="client-picker-empty">Create a client to start onboarding.</div>';
  const matches = getDirectoryClientPickerMatches();
  if(!matches.length) return '<div class="client-picker-empty">No matching clients.</div>';
  return matches.map((client) => renderDirectoryClientPickerOption(client, activeClientId)).join('');
}

function renderDirectoryClientPickerOption(client, activeClientId){
  const projectCount = getDirectoryProjects(client.id).length;
  const siteCount = getDirectorySites(client.id).length;
  const activeClass = client.id === activeClientId ? ' active' : '';
  return `<button type="button" class="client-picker-option${activeClass}" onmousedown="event.preventDefault(); chooseDirectoryClient('${esc(client.id)}')"><strong>${esc(client.clientName || 'Unnamed client')}</strong><span>${esc(normalizeClientCode(client.clientCode) || client.defaultServiceArea || 'No client code')} | ${esc(projectCount)} project${projectCount === 1 ? '' : 's'} | ${esc(siteCount)} site${siteCount === 1 ? '' : 's'}</span></button>`;
}

function updateDirectoryClientPickerResults(){
  const results = document.getElementById('directory-client-picker-results');
  if(!results) return;
  results.innerHTML = renderDirectoryClientPickerResults(getActiveDirectoryClientId());
  results.classList.add('open');
}

function renderDirectorySectionNav(){
  const sections = [
    { value:'overview', label:'Overview' },
    { value:'projects', label:'Projects' },
    { value:'contacts', label:'Contacts' },
    { value:'billing', label:'Billing' },
    { value:'sites', label:'Sites/Locations' }
  ];
  return `<div class="directory-section-nav">${sections.map((section) => `<button type="button" class="view-btn ${state.filters.directorySection === section.value ? 'active' : ''}" onclick="setDirectorySection('${section.value}')">${esc(section.label)}</button>`).join('')}</div>`;
}
function renderDirectoryOverviewSection(client, activeProjectId){
  const projects = getDirectoryProjects(client.id);
  const contacts = getDirectoryContacts(client.id, activeProjectId);
  const billingProfiles = getDirectoryBillingProfiles(client.id, activeProjectId);
  const sites = getDirectorySites(client.id, activeProjectId);
  const jobs = getDirectoryJobs(client.id, activeProjectId);
  const primaryContacts = contacts.filter((row) => row.isPrimary);
  const upcomingJobs = jobs.filter((row) => !isJobClosed(row)).slice(0, 4);
  const address = [client.hqStreet, [client.hqCity, client.hqState].filter(Boolean).join(', '), client.hqZip].filter(Boolean).join(' ');
  return `<div class="summary-grid directory-summary-grid"><div class="summary-card"><div class="label">Service Scope</div><div class="value">${esc(client.serviceScope || 'Field')}</div><div class="muted">${esc(client.sector || 'No sector')}</div></div><div class="summary-card"><div class="label">Client Code</div><div class="value">${esc(normalizeClientCode(client.clientCode) || 'Missing')}</div><div class="muted">Lab samples tie back to this client through the shared code.</div></div><div class="summary-card"><div class="label">Projects</div><div class="value">${projects.length}</div><div class="muted">Manage project scope from the Projects tab.</div></div><div class="summary-card"><div class="label">Contacts</div><div class="value">${contacts.length}</div><div class="muted">${esc(primaryContacts.length ? `${primaryContacts.length} primary contact${primaryContacts.length === 1 ? '' : 's'}` : 'No primary contacts flagged')}</div></div><div class="summary-card"><div class="label">Site/Locations</div><div class="value">${sites.length}</div><div class="muted">${esc(jobs.length)} active workflow record(s) for this client</div></div></div><div class="directory-section-grid"><div class="summary-card"><div class="label">Company Snapshot</div><div class="value">${esc(client.clientName || 'Unnamed client')}</div><div class="muted">${esc(normalizeClientCode(client.clientCode) || 'No client code')}</div><div class="muted">${esc(address || 'No HQ address on file')}</div><div class="muted">${esc(client.defaultServiceArea || 'No default service area')}</div><div class="mini-tags">${getStatusBadge(client.accountStatus)}${getStatusBadge(client.serviceScope || 'Field')}</div></div><div class="summary-card"><div class="label">Billing Snapshot</div><div class="value">${esc(billingProfiles[0]?.billingName || 'No billing profile')}</div><div class="muted">${esc(billingProfiles[0]?.billingEmail || billingProfiles[0]?.billingPhone || client.contactEmail || 'No billing contact on file')}</div><div class="muted">${esc(billingProfiles[0] ? getBillingContactLabel(billingProfiles[0]) : 'No billing contact on file')}</div></div><div class="summary-card"><div class="label">Field Snapshot</div><div class="value">${esc(client.primaryContact || 'No primary contact')}</div><div class="muted">${esc(client.contactPhone || client.contactEmail || 'No client phone or email')}</div><div class="muted">${esc(client.operationalNotes || 'No field notes added yet')}</div></div></div><div class="directory-subsection"><div class="panel-header directory-subsection-head"><h2>Upcoming Jobs</h2><button class="act-btn" type="button" onclick="openEntityModal('jobs')">+ Add Job</button></div><div class="panel-body">${upcomingJobs.length ? `<div class="mini-list">${upcomingJobs.map((job) => `<div class="mini-card clickable-card" role="button" tabindex="0" onclick="openEntityModal('jobs','${esc(job.id)}')" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); openEntityModal('jobs','${esc(job.id)}'); }"><div class="mini-head"><div><div class="item-title">${esc(getJobDisplayTitle(job))}</div><div class="muted">${esc(getProjectLabel(job.projectId))} | ${esc(getJobSiteSummary(job))}</div></div>${getPriorityBadge(job.priority)}</div><div class="mini-tags"><span class="mini-tag">${esc(getJobScheduleLabel(job))}</span>${renderJobSalesforceTag(job)}</div></div>`).join('')}</div>` : '<div class="empty-state">No jobs are queued for this client yet.</div>'}</div></div>`;
}
function renderDirectoryProjectsSection(clientId, activeProjectId){
  const projects = getDirectoryProjects(clientId);
  return renderTable(['Project', 'Scope / Status', 'Timeline', 'Sites / Jobs', 'Notes'], projects.map((project) => {
    const siteCount = getSitesForProject(project.id).length;
    const jobCount = getJobsForProject(project.id).length;
    return buildTableRow('projects', project.id, [
      `<div class="inline-stack"><div class="item-title">${esc(project.projectName || 'Unnamed project')}</div><div class="muted">${esc(getClientLabel(project.clientId))}</div></div>`,
      `<div class="inline-stack">${getStatusBadge(project.serviceScope || 'Field')}${getStatusBadge(project.projectStatus || 'Active')}</div>`,
      `<div class="inline-stack"><div>${esc(fmtDate(project.startDate))}</div><div class="muted">${esc(project.endDate ? `Ends ${fmtDate(project.endDate)}` : 'No end date')}</div></div>`,
      `<div class="inline-stack"><div>${esc(siteCount)} site${siteCount === 1 ? '' : 's'}</div><div class="muted">${esc(jobCount)} job${jobCount === 1 ? '' : 's'}</div></div>`,
      `<div class="muted">${esc(project.notes || 'No notes')}</div>`
    ]);
  }), '<strong>No projects yet</strong>Create a project as soon as the client scope is defined so sites and jobs have a real operational home.');
}
function summarizeNamedItems(items, emptyLabel){
  if(!items.length) return emptyLabel;
  const names = items.slice(0, 2).map((item) => item.projectName || item.siteName || 'Unnamed');
  return items.length > 2 ? `${names.join(', ')} +${items.length - 2} more` : names.join(', ');
}
function getContactProjectSummary(contact){
  return summarizeNamedItems(getLinkedProjectsForContact(contact.id), 'Client-wide');
}
function getContactSiteSummary(contact){
  return summarizeNamedItems(getLinkedSitesForContact(contact.id), 'No sites linked');
}
function getContactSortValue(contact, key){
  if(key === 'scope') return contact.contactScope || '';
  if(key === 'project') return getContactProjectSummary(contact);
  if(key === 'site') return getContactSiteSummary(contact);
  return `${getContactLastName(contact)} ${getContactFirstName(contact)} ${contact.contactName || ''}`;
}
function compareDirectoryContacts(left, right){
  const key = state.filters.directoryContactSortKey || 'name';
  const direction = state.filters.directoryContactSortDirection === 'desc' ? -1 : 1;
  return direction * (compareStrings(getContactSortValue(left, key), getContactSortValue(right, key)) || compareStrings(getContactDisplayName(left), getContactDisplayName(right)));
}
function getFilteredDirectoryContacts(clientId, activeProjectId){
  return getDirectoryContacts(clientId, activeProjectId)
    .filter((contact) => {
      const query = String(state.filters.directoryContactSearch || '').trim().toLowerCase();
      if(query){
        const haystack = [getContactDisplayName(contact), getContactFirstName(contact), getContactLastName(contact), contact.contactName].join(' ').toLowerCase();
        if(!haystack.includes(query)) return false;
      }
      if(state.filters.directoryContactScope !== 'all' && contact.contactScope !== state.filters.directoryContactScope) return false;
      if(state.filters.directoryContactProject !== 'all' && !getProjectIdsForContact(contact.id).includes(state.filters.directoryContactProject)) return false;
      if(state.filters.directoryContactSite !== 'all' && !getSiteIdsForContact(contact.id).includes(state.filters.directoryContactSite)) return false;
      return true;
    })
    .sort(compareDirectoryContacts);
}
function renderDirectoryContactSortHeader(key, label){
  const active = state.filters.directoryContactSortKey === key;
  const indicator = active ? (state.filters.directoryContactSortDirection === 'asc' ? ' ^' : ' v') : '';
  return `<button class="sort-header-btn ${active ? 'active' : ''}" type="button" onclick="setDirectoryContactSort('${esc(key)}')" aria-label="Sort contacts by ${esc(label)}">${esc(label)}<span>${esc(indicator)}</span></button>`;
}
function renderDirectoryContactFilters(clientId){
  const projects = getDirectoryProjects(clientId);
  const sites = getDirectorySites(clientId, 'all');
  return `<div class="toolbar directory-contact-toolbar"><span class="label">Name</span><input type="text" value="${esc(state.filters.directoryContactSearch)}" placeholder="Search contacts..." oninput="setDirectoryContactFilter('directoryContactSearch', this.value)"><span class="label">Scope</span><select onchange="setDirectoryContactFilter('directoryContactScope', this.value)"><option value="all" ${state.filters.directoryContactScope === 'all' ? 'selected' : ''}>All Scopes</option>${CONTACT_SCOPE_OPTIONS.map((scope) => `<option value="${esc(scope)}" ${state.filters.directoryContactScope === scope ? 'selected' : ''}>${esc(scope)}</option>`).join('')}</select><span class="label">Project</span><select onchange="setDirectoryContactFilter('directoryContactProject', this.value)"><option value="all" ${state.filters.directoryContactProject === 'all' ? 'selected' : ''}>All Projects</option>${projects.map((project) => `<option value="${esc(project.id)}" ${state.filters.directoryContactProject === project.id ? 'selected' : ''}>${esc(project.projectName || 'Unnamed project')}</option>`).join('')}</select><span class="label">Site</span><select onchange="setDirectoryContactFilter('directoryContactSite', this.value)"><option value="all" ${state.filters.directoryContactSite === 'all' ? 'selected' : ''}>All Sites</option>${sites.map((site) => `<option value="${esc(site.id)}" ${state.filters.directoryContactSite === site.id ? 'selected' : ''}>${esc(site.siteName || 'Unnamed site')}</option>`).join('')}</select></div>`;
}
function getSiteLocationPrimary(site){
  return site.physicalAddress || site.gpsCoordinates || 'No address';
}
function getSiteLocationSecondary(site){
  if(site.countyState) return site.countyState;
  return site.gpsCoordinates ? 'GPS coordinates' : 'No county/state';
}
function renderDirectoryContactsSection(clientId, activeProjectId){
  const contacts = getFilteredDirectoryContacts(clientId, activeProjectId);
  const columns = [
    renderDirectoryContactSortHeader('name', 'Contact'),
    renderDirectoryContactSortHeader('scope', 'Scope'),
    renderDirectoryContactSortHeader('site', 'Site'),
    renderDirectoryContactSortHeader('project', 'Project'),
    'Phone / Email'
  ];
  return `${renderDirectoryContactFilters(clientId)}${renderTable(columns, contacts.map((contact) => buildTableRow('contacts', contact.id, [
    `<div class="inline-stack"><div class="item-title">${esc(getContactDisplayName(contact))}</div><div class="muted">${esc(contact.contactRole || 'No role/title')}${contact.managerContactId ? ` | Reports to ${esc(getContactLabel(contact.managerContactId))}` : ''}</div></div>`,
    `<div class="inline-stack">${getStatusBadge(contact.contactScope || 'Operations')}${contact.isPrimary ? '<span class="tag-chip">Primary</span>' : ''}</div>`,
    esc(getContactSiteSummary(contact)),
    esc(getContactProjectSummary(contact)),
    `<div class="inline-stack"><div>${esc(contact.phone || 'No phone')}</div><div class="muted">${esc(contact.email || 'No email')}</div></div>`
  ])), '<strong>No contacts match</strong>Adjust the contact filters or add a linked contact for this client.')}`;
}
function renderDirectoryBillingSection(clientId, activeProjectId){
  const profile = getBillingProfileForClient(clientId);
  if(!profile){
    return `<div class="directory-subsection"><div class="panel-header directory-subsection-head"><h2>Billing</h2><button class="act-btn" type="button" onclick="openClientBillingProfile('${esc(clientId)}')">+ Create Billing</button></div><div class="panel-body"><div class="empty-state"><strong>No billing profile yet</strong>Create one billing profile for this client, then add the 2026 rate schedule.</div></div></div>`;
  }
  const billingContact = getContact(profile.billingContactId);
  const contactMeta = billingContact ? [billingContact.phone, billingContact.email].filter(Boolean).join(' | ') : '';
  const detailMarkup = `<div class="billing-profile-summary">
    <div class="billing-detail-card"><span>Billing Name</span><strong>${esc(profile.billingName || 'Unnamed billing profile')}</strong></div>
    <div class="billing-detail-card"><span>Billing Contact</span><strong>${esc(getBillingContactLabel(profile))}</strong>${contactMeta ? `<small>${esc(contactMeta)}</small>` : ''}</div>
    <div class="billing-detail-card"><span>Email</span><strong>${esc(profile.billingEmail || 'No billing email')}</strong></div>
    <div class="billing-detail-card"><span>Phone</span><strong>${esc(profile.billingPhone || 'No billing phone')}</strong></div>
    <div class="billing-detail-card wide"><span>Billing Address</span><strong>${esc(profile.billingAddress || 'No billing address')}</strong></div>
    <div class="billing-detail-card wide"><span>Invoice Notes</span><strong>${esc(profile.invoiceNotes || 'No invoice notes')}</strong></div>
    <div class="billing-detail-card wide"><span>Field Billing Notes</span><strong>${esc(profile.fieldBillingNotes || 'No field billing notes')}</strong></div>
    <div class="billing-detail-card wide"><span>Lab Billing Notes</span><strong>${esc(profile.labBillingNotes || 'No lab billing notes')}</strong></div>
  </div>`;
  const priceCount = getBillingPriceCount(profile.id);
  return `<div class="directory-subsection billing-directory-section">
    <div class="panel-header directory-subsection-head"><h2>Billing</h2><div class="table-actions"><button class="act-btn" type="button" onclick="openClientBillingProfile('${esc(clientId)}')">Edit Billing</button><button class="act-btn" type="button" onclick="openBillingRatesModal('${esc(profile.id)}')">Edit Rates</button></div></div>
    <div class="panel-body">${detailMarkup}<div class="rate-schedule-head"><div><h3>${esc(BILLING_RATE_EFFECTIVE_YEAR)} Rate Schedule</h3><div class="muted">${esc(priceCount)} priced line item${priceCount === 1 ? '' : 's'}</div></div></div>${renderBillingRateScheduleTable(profile)}</div>
  </div>`;
}

function renderDirectorySitesSection(clientId, activeProjectId){
  const sites = getDirectorySites(clientId, activeProjectId);
  return renderTable(['Site/Location', 'Linked Projects', 'Type / Status', 'Location', 'Default Job Types', 'Jobs'], sites.map((site) => buildTableRow('sites', site.id, [
    `<div class="inline-stack"><div class="item-title">${esc(site.siteName || 'Unnamed site')}</div><div class="muted">${esc(site.clientSiteContact || 'No site contact')}</div></div>`,
    esc(getLinkedProjectsForSite(site.id).map((project) => project.projectName || 'Unnamed project').join(', ') || 'No linked project'),
    `<div class="inline-stack">${getStatusBadge(getSiteTypeDisplayName(site.siteType))}${getStatusBadge(site.siteStatus || 'Active')}</div>`,
    `<div class="inline-stack"><div>${esc(getSiteLocationPrimary(site))}</div><div class="muted">${esc(getSiteLocationSecondary(site))}</div></div>`,
    renderTags(getDefaultJobTypeLabelsForSiteType(site.siteType)),
    `<div class="inline-stack"><div>${esc(getJobsForSite(site.id).length)} job${getJobsForSite(site.id).length === 1 ? '' : 's'}</div><div class="muted">${esc(getSamplesForSite(site.id).length)} sample${getSamplesForSite(site.id).length === 1 ? '' : 's'}</div></div>`
  ])), '<strong>No site/locations yet</strong>Add project-linked locations here so field jobs can be scheduled to real places.');
}
function renderDirectoryWorkspace(client, activeProjectId){
  const overview = renderDirectoryOverviewSection(client, activeProjectId);
  if(state.filters.directorySection === 'projects') return renderDirectoryProjectsSection(client.id, activeProjectId);
  if(state.filters.directorySection === 'contacts') return renderDirectoryContactsSection(client.id, activeProjectId);
  if(state.filters.directorySection === 'billing') return renderDirectoryBillingSection(client.id, activeProjectId);
  if(state.filters.directorySection === 'sites') return renderDirectorySitesSection(client.id, activeProjectId);
  return overview;
}
function renderDirectory(){
  const directoryScreen = document.getElementById('directory-screen') || document;
  const activeClientId = getActiveDirectoryClientId();
  const activeClient = getClient(activeClientId);
  const activeProjectId = 'all';
  document.getElementById('directory-toolbar').innerHTML = `${renderDirectoryClientPicker(activeClientId)}<div class="toolbar-spacer"></div><button class="add-btn" type="button" onclick="openEntityModal('clients')">+ Add Client</button>`;
  if(!activeClient){
    document.getElementById('directory-detail-title').textContent = 'Client Workspace';
    document.getElementById('directory-detail-meta').textContent = 'Pick or create a client to start onboarding.';
    document.getElementById('directory-detail-actions').innerHTML = '';
    document.getElementById('directory-workspace').innerHTML = `<div class="empty-state"><strong>No client selected</strong>Create a client to begin the shared client/project onboarding flow.</div>`;
    hydrateAssetPhotoPreviews(directoryScreen);
    return;
  }
  const contacts = getDirectoryContacts(activeClient.id, activeProjectId);
  const billingProfiles = getDirectoryBillingProfiles(activeClient.id, activeProjectId);
  const sites = getDirectorySites(activeClient.id, activeProjectId);
  document.getElementById('directory-detail-title').textContent = activeClient.clientName || 'Client Workspace';
  document.getElementById('directory-detail-meta').textContent = `${normalizeClientCode(activeClient.clientCode) || 'No client code'} | ${getDirectoryProjects(activeClient.id).length} projects | ${contacts.length} contacts | ${billingProfiles.length ? 'Billing profile' : 'No billing profile'} | ${sites.length} site(s)`;
  document.getElementById('directory-detail-actions').innerHTML = `<button class="act-btn" type="button" onclick="openEntityModal('clients','${esc(activeClient.id)}')">Edit Client</button><button class="act-btn" type="button" onclick="openEntityModal('projects')">+ Project</button><button class="act-btn" type="button" onclick="openEntityModal('contacts')">+ Contact</button><button class="act-btn" type="button" onclick="openClientBillingProfile('${esc(activeClient.id)}')">Billing</button><button class="act-btn" type="button" onclick="openEntityModal('sites')">+ Site/Location</button><button class="add-btn" type="button" onclick="openEntityModal('jobs')">+ Job</button>`;
  document.getElementById('directory-workspace').innerHTML = `${renderDirectorySectionNav()}<div class="directory-hero"><div class="client-row-ident client-hero-ident">${renderAssetPhoto(activeClient, { className:'client-logo-thumb client-logo-hero', emptyLabel:'No logo', alt:getAssetPhotoAlt('clients', activeClient) })}<div class="client-hero-title">${esc(activeClient.clientName || 'Unnamed client')}</div></div></div>${renderDirectoryWorkspace(activeClient, activeProjectId)}`;
  hydrateAssetPhotoPreviews(directoryScreen);
}

function renderResourceCards(list, renderer, emptyLabel){
  return list.length ? `<div class="resource-cards">${list.map(renderer).join('')}</div>` : `<div class="empty-state">${esc(emptyLabel)}</div>`;
}

function isAssetPhotoEntity(entityKey){ return ASSET_PHOTO_ENTITY_KEYS.includes(entityKey); }
function hasAssetPhoto(record){ return !!(record?.assetPhotoDataUrl || record?.assetPhotoPath); }
function getAssetPhotoAlt(entityKey, record){
  if(entityKey === 'clients') return `Logo for client ${record?.clientName || 'account'}`;
  if(entityKey === 'trucks') return `Photo for truck ${record?.unitNumber || 'asset'}`;
  if(entityKey === 'trailers') return `Photo for trailer ${record?.trailerNumber || 'asset'}`;
  return `Photo for equipment ${record?.equipmentName || 'asset'}`;
}
function getAssetPhotoEmptyLabel(entityKey){
  if(entityKey === 'clients') return 'No client logo';
  if(entityKey === 'trucks') return 'No truck photo';
  if(entityKey === 'trailers') return 'No trailer photo';
  return 'No equipment photo';
}
function getDefaultAssetIconSrc(entityKey, record){
  if(entityKey === 'trucks') return record?.vehicleType === 'Service Truck' ? DEFAULT_ASSET_ICON_PATHS.truckService : DEFAULT_ASSET_ICON_PATHS.truckPickup;
  if(entityKey === 'trailers') return DEFAULT_ASSET_ICON_PATHS.trailer;
  return '';
}
function renderAssetPhoto(record, options = {}){
  const className = options.className || 'asset-photo';
  const emptyLabel = options.emptyLabel || 'No photo';
  const alt = options.alt || 'Asset photo';
  const fallbackImageSrc = options.fallbackImageSrc || '';
  if(record?.assetPhotoDataUrl) return `<img class="${className}" src="${esc(record.assetPhotoDataUrl)}" alt="${esc(alt)}">`;
  if(record?.assetPhotoPath && isRemoteMode()) return `<img class="${className}" src="" alt="${esc(alt)}" data-asset-photo-path="${esc(record.assetPhotoPath)}">`;
  if(fallbackImageSrc) return `<img class="${className} asset-icon" src="${esc(fallbackImageSrc)}" alt="${esc(alt)}">`;
  return `<div class="${className} empty">${esc(emptyLabel)}</div>`;
}
function buildAssetPhotoStoragePath(entityKey, recordId, fileName){
  const cleaned = String(fileName || 'asset-photo.jpg').toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'asset-photo.jpg';
  return `${entityKey}/${recordId}/${Date.now()}-${cleaned}`;
}
function encodeStoragePath(path){ return String(path || '').split('/').map((segment) => encodeURIComponent(segment)).join('/'); }
function dataUrlToBlob(dataUrl){
  const parts = String(dataUrl || '').split(',');
  if(parts.length < 2) throw new Error('Invalid image payload.');
  const match = parts[0].match(/data:([^;]+);base64/i);
  const mime = match ? match[1] : 'application/octet-stream';
  const binary = atob(parts[1]);
  const bytes = new Uint8Array(binary.length);
  for(let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type:mime });
}
async function ensureAssetPhotoUrl(record){
  if(!record) return '';
  if(record.assetPhotoDataUrl) return record.assetPhotoDataUrl;
  if(!record.assetPhotoPath || !isRemoteMode()) return '';
  if(remoteAssetPhotoUrlCache.has(record.assetPhotoPath)) return remoteAssetPhotoUrlCache.get(record.assetPhotoPath);
  if(remoteAssetPhotoLoadPromises.has(record.assetPhotoPath)) return remoteAssetPhotoLoadPromises.get(record.assetPhotoPath);
  const promise = (async () => {
    const response = await window.appAuth.fetch(`/storage/v1/object/authenticated/${FIELD_ASSET_BUCKET}/${encodeStoragePath(record.assetPhotoPath)}`, { headers:{ Accept:'*/*' } });
    if(!response.ok) throw new Error(`Image request failed (${response.status}).`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    remoteAssetPhotoUrlCache.set(record.assetPhotoPath, url);
    return url;
  })();
  remoteAssetPhotoLoadPromises.set(record.assetPhotoPath, promise);
  try {
    return await promise;
  } finally {
    remoteAssetPhotoLoadPromises.delete(record.assetPhotoPath);
  }
}
function clearCachedAssetPhoto(path){
  const cached = remoteAssetPhotoUrlCache.get(path);
  if(cached){
    URL.revokeObjectURL(cached);
    remoteAssetPhotoUrlCache.delete(path);
  }
}
async function hydrateAssetPhotoPreviews(scope = document){
  const nodes = Array.from(scope.querySelectorAll('img[data-asset-photo-path]'));
  await Promise.all(nodes.map(async (node) => {
    const path = node.dataset.assetPhotoPath || '';
    if(!path || node.getAttribute('src')) return;
    try {
      node.src = await ensureAssetPhotoUrl({ assetPhotoPath:path });
    } catch (error){
      console.warn('Unable to load asset photo:', error);
      node.classList.add('asset-photo-error');
    }
  }));
}
function readFileAsDataUrl(file){
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Unable to read the selected image.'));
    reader.readAsDataURL(file);
  });
}
async function handleAssetPhotoSelected(event){
  const file = event?.target?.files?.[0];
  if(!modalState.open || !file) return;
  if(!String(file.type || '').startsWith('image/')){
    alert('Please choose an image file.');
    event.target.value = '';
    return;
  }
  try {
    const dataUrl = await readFileAsDataUrl(file);
    modalState.formData.assetPhotoDataUrl = dataUrl;
    modalState.formData.assetPhotoName = file.name || '';
    modalState.formData.assetPhotoType = file.type || 'image/jpeg';
    renderModal();
  } catch (error){
    console.error('Unable to read asset photo:', error);
    alert(error.message || 'Unable to read the selected image.');
  } finally {
    if(event?.target) event.target.value = '';
  }
}
function removeModalAssetPhoto(){
  if(!modalState.open) return;
  modalState.formData.assetPhotoPath = '';
  modalState.formData.assetPhotoDataUrl = '';
  modalState.formData.assetPhotoName = '';
  modalState.formData.assetPhotoType = '';
  renderModal();
}
async function openModalAssetPhoto(){
  if(!modalState.open || !hasAssetPhoto(modalState.formData)){
    alert('No photo attached yet.');
    return;
  }
  try {
    const url = await ensureAssetPhotoUrl(modalState.formData);
    if(!url) throw new Error('No photo attached yet.');
    window.open(url, '_blank', 'noopener');
  } catch (error){
    console.error('Unable to open asset photo:', error);
    alert(error.message || 'Unable to open the asset photo.');
  }
}
function renderAssetPhotoField(field){
  const photoLabel = modalState.formData.assetPhotoName || (modalState.formData.assetPhotoPath ? 'Current saved photo' : 'JPG, PNG, or HEIC image');
  return `<div class="form-group full"><label class="form-label">${esc(field.label)}</label><div class="asset-photo-field"><div class="asset-photo-preview-wrap">${renderAssetPhoto(modalState.formData, { className:'asset-photo-preview', emptyLabel:'No photo selected', alt:field.label, fallbackImageSrc:getDefaultAssetIconSrc(modalState.entity, modalState.formData) })}</div><div class="asset-photo-controls"><label class="add-btn asset-photo-upload" for="asset-photo-input">Choose Photo</label><input id="asset-photo-input" class="asset-photo-input" type="file" accept="image/*" onchange="handleAssetPhotoSelected(event)"><div class="muted">${esc(photoLabel)}</div><div class="table-actions"><button class="act-btn" type="button" onclick="openModalAssetPhoto()" ${hasAssetPhoto(modalState.formData) ? '' : 'disabled'}>Open Photo</button><button class="act-btn danger" type="button" onclick="removeModalAssetPhoto()" ${hasAssetPhoto(modalState.formData) ? '' : 'disabled'}>Remove Photo</button></div></div></div></div>`;
}

function renderResources(){
  const splSitesPanel = document.getElementById('spl-sites-panel');
  if(splSitesPanel) splSitesPanel.innerHTML = renderResourceCards(state.data.splSites, (site) => `<div ${renderCardOpenAttrs('splSites', site.id)}><div class="resource-card-head"><div><div class="item-title">${esc(site.siteName || 'Unnamed SPL site')}</div><div class="muted">${esc(site.siteCode || 'No site code')}</div></div>${site.isActive ? '<span class="tag-chip">Active</span>' : '<span class="warning-chip">Inactive</span>'}</div><div class="muted">${esc(site.locationLabel || site.streetAddress || 'No location label')}</div><div class="muted">${esc([site.city, site.state, site.zipCode].filter(Boolean).join(', ') || 'No city/state')}</div></div>`, 'No SPL sites yet');
  document.getElementById('trucks-panel').innerHTML = renderResourceCards(state.data.trucks, (truck) => `<div ${renderCardOpenAttrs('trucks', truck.id)}>${renderAssetPhoto(truck, { className:'resource-photo', emptyLabel:getAssetPhotoEmptyLabel('trucks'), alt:getAssetPhotoAlt('trucks', truck), fallbackImageSrc:getDefaultAssetIconSrc('trucks', truck) })}<div class="resource-card-head"><div><div class="item-title">${esc(truck.unitNumber || 'Unnamed truck')}</div><div class="muted">${esc([truck.color, truck.vehicleYear, truck.make, truck.model].filter(Boolean).join(' ') || truck.vehicleType)}</div></div><div class="mini-tags">${getStatusBadge(truck.serviceStatus)}${getFuelTypeBadge(truck.fuelType)}${getTruckInspectionBadge(truck)}</div></div><div class="muted">${esc(truck.licensePlateNumber || 'No plate')} ${truck.registeredState ? `| ${esc(truck.registeredState)}` : ''}</div><div class="muted">${truck.vin ? `VIN: ${esc(truck.vin)}` : 'No VIN'}</div><div class="muted">Assigned Employee: ${esc(truck.assignedTechnicianId ? getTechnicianLabel(truck.assignedTechnicianId) : 'Pool')}</div></div>`, 'No trucks yet');
  document.getElementById('trailers-panel').innerHTML = renderResourceCards(state.data.trailers, (trailer) => `<div ${renderCardOpenAttrs('trailers', trailer.id)}>${renderAssetPhoto(trailer, { className:'resource-photo', emptyLabel:getAssetPhotoEmptyLabel('trailers'), alt:getAssetPhotoAlt('trailers', trailer), fallbackImageSrc:getDefaultAssetIconSrc('trailers', trailer) })}<div class="resource-card-head"><div><div class="item-title">${esc(trailer.trailerNumber || 'Unnamed trailer')}</div><div class="muted">${esc(trailer.trailerType || 'No trailer type')}</div></div>${getStatusBadge(trailer.serviceStatus)}</div><div class="muted">${esc(trailer.capacityConfiguration || 'No capacity/configuration')}</div><div class="muted">Assigned Truck: ${esc(trailer.assignedTruckId ? getTruckLabel(trailer.assignedTruckId) : 'Unassigned')}</div></div>`, 'No trailers yet');
  document.getElementById('equipment-panel').innerHTML = renderResourceCards(state.data.equipment, (item) => `<div ${renderCardOpenAttrs('equipment', item.id)}><div class="resource-card-head"><div><div class="item-title">${esc(item.equipmentName || 'Unnamed equipment')}</div><div class="muted">${esc(item.equipmentType)}</div></div>${getStatusBadge(item.maintenanceStatus)}</div><div class="mini-tags">${getStatusBadge(item.calibrationStatus)}${item.serialNumber ? `<span class="tag-chip">${esc(item.serialNumber)}</span>` : ''}</div><div class="muted">${esc([item.manufacturer, item.model].filter(Boolean).join(' | ') || 'No manufacturer or model')}</div><div class="muted">${esc(item.splInventoryBarcode ? `Barcode: ${item.splInventoryBarcode}` : 'No SPL inventory barcode')}</div><div class="muted">Truck: ${esc(item.assignedTruckId ? getTruckLabel(item.assignedTruckId) : 'Pool')} | Trailer: ${esc(item.assignedTrailerId ? getTrailerLabel(item.assignedTrailerId) : 'Pool')}</div></div>`, 'No equipment yet');
}

function setInventoryFilter(key, value){
  state.filters[key] = value;
  renderInventory();
}

function getVisibleParts(){
  const search = String(state.filters.inventorySearch || '').trim().toLowerCase();
  return state.data.parts.filter((part) => {
    const status = getPartStatus(part);
    if(state.filters.inventoryStatus === 'active' && part.isActive === false) return false;
    if(state.filters.inventoryStatus === 'low' && status !== 'Low Stock') return false;
    if(state.filters.inventoryStatus === 'inactive' && part.isActive !== false) return false;
    if(!search) return true;
    return [
      part.partName,
      part.partNumber,
      part.partKey,
      part.category,
      part.vendorName,
      part.vendorPartNumber,
      part.storageLocation,
      part.notes
    ].some((value) => String(value || '').toLowerCase().includes(search));
  }).sort(getEntitySorter('parts'));
}

function renderInventoryTable(){
  const rows = getVisibleParts().map((part) => buildTableRow('parts', part.id, [
    `<div class="inline-stack"><div class="item-title">${esc(part.partName || 'Unnamed part')}</div><div class="muted">${esc(getPartDisplayCode(part))}</div></div>`,
    `<div class="inline-stack"><div>${esc(part.category || 'Uncategorized')}</div><div class="muted">${esc(part.storageLocation || 'No location')}</div></div>`,
    `<div class="inline-stack"><div>${esc(part.vendorName || 'Not set')}</div><div class="muted">${esc(part.vendorPartNumber || 'No vendor part #')}</div></div>`,
    `<strong>${esc(renderPartQuantity(part.onHandQuantity, part.unitName))}</strong><div class="muted">Reorder at ${esc(part.reorderPoint)}</div>`,
    fmtCurrency(part.unitCost),
    getPartStatusBadge(part),
    `<div class="table-actions"><button class="act-btn" type="button" onclick="event.stopPropagation(); openPartAdjustModal('${esc(part.id)}', 'receive')">Receive</button><button class="act-btn" type="button" onclick="event.stopPropagation(); openPartAdjustModal('${esc(part.id)}', 'adjust')">Adjust</button></div>`
  ]));
  document.getElementById('parts-table').innerHTML = renderTable(['Part', 'Category / Location', 'Vendor', 'On Hand', 'Unit Cost', 'Status', 'Actions'], rows, '<strong>No parts found</strong>Add a Field Ops part to begin tracking inventory.');
}

function renderInventoryActivity(){
  const rows = state.data.partActivity.slice().sort(getEntitySorter('partActivity')).slice(0, 40).map((activity) => {
    const part = getPart(activity.partId);
    const delta = Number(activity.quantityDelta || 0);
    const context = getPartActivityJobContext(activity);
    return [
      esc(fmtDateTime(activity.createdAt)),
      `<div class="inline-stack"><div>${esc(part?.partName || 'Unknown part')}</div><div class="muted">${esc(part?.partNumber || '')}</div></div>`,
      esc(getPartActivityLabel(activity.activityType)),
      `<span class="${delta < 0 ? 'part-delta-negative' : 'part-delta-positive'}">${esc(delta > 0 ? `+${delta}` : delta)}</span>`,
      esc(`${activity.quantityBefore} -> ${activity.quantityAfter}`),
      esc(context.jobType),
      esc(context.jobDate),
      esc(context.client),
      esc(context.technician),
      `<div class="note-preview">${esc(activity.notes || '')}</div>`
    ];
  });
  document.getElementById('part-activity-panel').innerHTML = renderTable(['When', 'Part', 'Activity', 'Delta', 'Stock', 'Job Type', 'Job Date', 'Client', 'Technician', 'Notes'], rows, '<strong>No part activity yet</strong>Receive stock, adjust counts, or add parts to jobs to build history.');
}

function renderInventory(){
  if(!document.getElementById('inventory-screen')) return;
  document.getElementById('inventory-summary').textContent = `${getVisibleParts().length} visible / ${state.data.parts.length} total`;
  renderInventoryTable();
  renderInventoryActivity();
}

function openPartAdjustModal(partId, mode = 'receive'){
  const part = getPart(partId);
  if(!part) return;
  state.partAdjustModal = { open:true, partId, mode:mode === 'adjust' ? 'adjust' : 'receive' };
  renderPartAdjustModal();
}

function closePartAdjustModal(){
  state.partAdjustModal = createClosedPartAdjustModalState();
  renderPartAdjustModal();
}

function renderPartAdjustModal(){
  const overlay = document.getElementById('part-adjust-modal-overlay');
  if(!overlay) return;
  const part = getPart(state.partAdjustModal.partId);
  if(!state.partAdjustModal.open || !part){
    overlay.classList.remove('open');
    return;
  }
  overlay.classList.add('open');
  const receiveMode = state.partAdjustModal.mode !== 'adjust';
  document.getElementById('part-adjust-modal-title').textContent = receiveMode ? 'Receive Stock' : 'Adjust Stock';
  document.getElementById('part-adjust-modal-body').innerHTML = `
    <div class="part-adjust-summary">
      <div>
        <div class="item-title">${esc(part.partName || 'Unnamed part')}</div>
        <div class="muted">${esc(getPartDisplayCode(part))} | ${esc(renderPartQuantity(part.onHandQuantity, part.unitName))} on hand</div>
      </div>
      ${getPartStatusBadge(part)}
    </div>
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label" for="part-adjust-quantity">${receiveMode ? 'Quantity Received' : 'Quantity Delta'}</label>
        <input class="form-input" id="part-adjust-quantity" type="number" step="1" value="${receiveMode ? '1' : '0'}">
      </div>
      <div class="form-group full">
        <label class="form-label" for="part-adjust-notes">Notes</label>
        <textarea class="form-input" id="part-adjust-notes" rows="4" placeholder="${receiveMode ? 'Packing slip, vendor, or receiving notes' : 'Reason for count correction'}"></textarea>
      </div>
    </div>
  `;
}

async function savePartAdjustment(){
  const part = getPart(state.partAdjustModal.partId);
  if(!part) return;
  const receiveMode = state.partAdjustModal.mode !== 'adjust';
  const rawQuantity = Math.trunc(Number(document.getElementById('part-adjust-quantity')?.value || 0));
  const quantityDelta = receiveMode ? Math.abs(rawQuantity) : rawQuantity;
  const notes = document.getElementById('part-adjust-notes')?.value.trim() || '';
  if(!quantityDelta){
    alert('Quantity must be non-zero.');
    return;
  }
  if(Number(part.onHandQuantity || 0) + quantityDelta < 0){
    alert('Inventory cannot be adjusted below zero.');
    return;
  }
  state.saveInFlight = true;
  showSaveStatus('saving', 'SAVING');
  try {
    if(isRemoteMode()){
      await window.appAuth.requestJson('/rest/v1/rpc/adjust_field_part_stock', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Prefer':'return=minimal' },
        body:JSON.stringify({
          target_part_id:part.id,
          quantity_delta:quantityDelta,
          activity_type:receiveMode ? 'stock_received' : 'stock_adjusted',
          notes
        })
      });
      await loadData({ silent:true, force:true });
    } else {
      const next = clone(state.data);
      applyLocalPartStockDelta(next, part.id, quantityDelta, { activityType:receiveMode ? 'stock_received' : 'stock_adjusted', notes });
      await persistLocal(next);
    }
    closePartAdjustModal();
    showSaveStatus('saved', 'STOCK UPDATED');
    hideSaveStatusSoon();
  } catch (error){
    console.error('Unable to update part stock:', error);
    showSaveStatus('error', 'SAVE FAILED');
    hideSaveStatusSoon(4200);
    alert(error.message || 'Unable to update part stock.');
  } finally {
    state.saveInFlight = false;
  }
}

function renderPartCatalogSetup(){
  const panel = document.getElementById('part-catalogs-panel');
  if(!panel) return;
  const activeType = FIELD_PART_CATALOG_TYPES.some((type) => type.value === state.filters.partCatalogType) ? state.filters.partCatalogType : 'category';
  state.filters.partCatalogType = activeType;
  const typeDef = getPartCatalogTypeDef(activeType);
  const rows = state.data.partCatalogs.filter((row) => row.catalogType === activeType).sort(getEntitySorter('partCatalogs'));
  panel.innerHTML = `
    <div class="part-catalog-toolbar">
      <div class="form-group">
        <label class="form-label">List</label>
        <select class="form-input" onchange="setPartCatalogSetupType(this.value)">
          ${FIELD_PART_CATALOG_TYPES.map((type) => `<option value="${esc(type.value)}" ${activeType === type.value ? 'selected' : ''}>${esc(type.plural)}</option>`).join('')}
        </select>
      </div>
      <div class="part-catalog-summary">
        <div class="item-title">${esc(typeDef.plural)}</div>
        <div class="muted">${esc(rows.filter((row) => row.isActive !== false).length)} active / ${esc(rows.length)} total</div>
      </div>
      <button class="act-btn" type="button" onclick="openPartCatalogModal('${esc(activeType)}')">+ Add ${esc(typeDef.label)}</button>
    </div>
    <div class="part-catalog-list part-catalog-list-compact">
      ${rows.length ? rows.map((row) => {
        const detail = row.notes || `Sort ${row.sortOrder || 0}`;
        return `<button class="part-catalog-row" type="button" onclick="openEntityModal('partCatalogs','${esc(row.id)}')"><span><strong>${esc(row.catalogValue)}</strong><span>${esc(detail)}</span></span>${row.isActive ? '<span class="tag-chip">Active</span>' : '<span class="warning-chip">Inactive</span>'}</button>`;
      }).join('') : '<div class="empty-state">No values yet.</div>'}
    </div>
  `;
}

function setPartCatalogSetupType(catalogType){
  state.filters.partCatalogType = FIELD_PART_CATALOG_TYPES.some((type) => type.value === catalogType) ? catalogType : 'category';
  renderPartCatalogSetup();
}

function renderSetup(){
  const siteTypesPanel = document.getElementById('site-types-panel');
  if(siteTypesPanel) siteTypesPanel.innerHTML = renderResourceCards(state.data.siteTypes.sort(getEntitySorter('siteTypes')), (siteType) => {
    const defaultLabels = getDefaultJobTypeLabelsForSiteType(siteType.siteTypeKey);
    const siteCount = state.data.sites.filter((site) => site.siteType === siteType.siteTypeKey).length;
    return `<div ${renderCardOpenAttrs('siteTypes', siteType.id)}><div class="resource-card-head"><div><div class="item-title">${esc(siteType.siteTypeName || 'Unnamed site type')}</div></div><div class="mini-tags">${siteType.isActive ? '<span class="tag-chip">Active</span>' : '<span class="warning-chip">Inactive</span>'}</div></div><div class="muted">Default Jobs: ${esc(defaultLabels.join(', ') || 'None')}</div><div class="muted">${esc(siteCount)} site${siteCount === 1 ? '' : 's'} using this type</div><div class="muted">${esc(siteType.notes || 'No notes')}</div></div>`;
  }, 'No site types yet');
  const jobTypesPanel = document.getElementById('job-types-panel');
  if(jobTypesPanel) jobTypesPanel.innerHTML = renderResourceCards(state.data.jobTypes.sort(getEntitySorter('jobTypes')), (jobType) => `<div ${renderCardOpenAttrs('jobTypes', jobType.id || jobType.jobTypeKey)} style="${esc(getJobTypeCatalogCardStyle(jobType))}"><div class="resource-card-head"><div><div class="item-title">${esc(jobType.jobTypeName || 'Unnamed job type')}</div><div class="job-type-color-line"><span class="color-dot" style="--swatch-color:${esc(getJobTypeColor(jobType))}"></span><span>${esc(getJobTypeColor(jobType))}</span></div></div><div class="mini-tags">${getJobTypeBadge(jobType)}${getStatusBadge(jobType.scheduleMode || 'range')}${jobType.labEmployeeEligible ? '<span class="tag-chip">Lab Eligible</span>' : ''}${jobType.isActive ? '<span class="tag-chip">Active</span>' : '<span class="warning-chip">Inactive</span>'}</div></div><div class="muted">Required: ${esc(normalizeStringArray(jobType.requiredAssignmentTypes).join(', ') || 'None')}</div><div class="muted">Details: ${esc(getJobTypeDetailGroupLabels(jobType.detailGroups).join(', ') || 'None')}</div></div>`, 'No job types yet');
  renderPartCatalogSetup();
}

async function loadLabWorkOrders(){
  const result = await getStorageAdapter().get(LAB_WIP_WORK_ORDER_STORAGE_KEY);
  const raw = typeof result?.value === 'string' ? result.value : '';
  if(!raw) return [];
  const parsed = JSON.parse(raw);
  const list = Array.isArray(parsed) ? parsed : (Array.isArray(parsed?.workOrders) ? parsed.workOrders : []);
  return list.map(normalizeLabWorkOrder).filter((wo) => wo.id || wo.number);
}

async function saveLabWorkOrders(workOrders){
  await getStorageAdapter().set(LAB_WIP_WORK_ORDER_STORAGE_KEY, JSON.stringify(workOrders));
}

function normalizeLabWorkOrderClientCode(workOrder){
  const explicitCodeText = String(workOrder?.clientCode || '').trim();
  if(/^[A-Za-z0-9_-]+$/.test(explicitCodeText)) return normalizeClientCode(explicitCodeText);
  const clientText = String(workOrder?.client || '').trim();
  return /^[A-Za-z0-9_-]+$/.test(clientText) ? normalizeClientCode(clientText) : '';
}

function findClientForLabWorkOrder(clientCode, ...clientTexts){
  const normalizedClientTexts = clientTexts.map((value) => String(value || '').trim().toLowerCase()).filter(Boolean);
  return state.data.clients.find((client) => (
    (clientCode && normalizeClientCode(client.clientCode) === clientCode) ||
    normalizedClientTexts.includes(String(client.clientName || '').trim().toLowerCase())
  )) || null;
}

function normalizeLabWorkOrder(workOrder){
  const clientText = String(workOrder?.client || '').trim();
  const clientCodeText = String(workOrder?.clientCode || '').trim();
  const clientCode = normalizeLabWorkOrderClientCode(workOrder);
  const matchedClient = findClientForLabWorkOrder(clientCode, clientText, clientCodeText);
  return {
    ...workOrder,
    id:String(workOrder?.id || workOrder?.number || ''),
    number:String(workOrder?.number || ''),
    clientId:String(workOrder?.clientId || matchedClient?.id || ''),
    projectId:String(workOrder?.projectId || ''),
    clientCode,
    client:clientText || matchedClient?.clientName || ''
  };
}

function getSampleDisplayId(sample){
  const sequence = Number(sample?.sampleSequence || 0);
  return sequence ? `FIELD-${sequence}` : `FIELD-${String(sample?.id || '').slice(0, 6).toUpperCase()}`;
}

function getSampleMatrix(sample){
  return sample?.sampleType === 'Liquid' ? 'Liquid' : 'Gas';
}

function getSampleClientIdentity(sample){
  const job = sample?.jobId ? getJob(sample.jobId) : null;
  const client = getClient(sample?.clientId || job?.clientId || '');
  return {
    id:String(client?.id || sample?.clientId || job?.clientId || ''),
    code:normalizeClientCode(client?.clientCode || ''),
    name:String(client?.clientName || '').trim()
  };
}

function workOrderMatchesSampleClient(workOrder, sample){
  const client = getSampleClientIdentity(sample);
  if(client.id && String(workOrder?.clientId || '') === client.id) return true;
  if(client.code && normalizeClientCode(workOrder?.clientCode) === client.code) return true;
  if(client.name && String(workOrder?.client || '').trim().toLowerCase() === client.name.toLowerCase()) return true;
  return false;
}

function hasFieldSampleLink(workOrder){
  if(Array.isArray(workOrder?.fieldSampleLinks) && workOrder.fieldSampleLinks.length) return true;
  const rows = [
    ...(Array.isArray(workOrder?.samples) ? workOrder.samples : []),
    ...(Array.isArray(workOrder?.testRows) ? workOrder.testRows : [])
  ];
  return rows.some((row) => String(row?.fieldSampleId || '').trim());
}

function getEligibleWorkOrdersForSample(sample, workOrders){
  return workOrders
    .filter((workOrder) => workOrderMatchesSampleClient(workOrder, sample) && !hasFieldSampleLink(workOrder))
    .map((wo) => ({ wo, score:getWorkOrderMatchScore(wo, sample) }))
    .sort((a, b) => b.score - a.score || compareStrings(a.wo.number, b.wo.number))
    .map(({ wo }) => wo);
}

function removeFieldSampleFromWorkOrders(workOrders, sampleId){
  return workOrders.map((wo) => ({
    ...wo,
    fieldSampleLinks:Array.isArray(wo.fieldSampleLinks) ? wo.fieldSampleLinks.filter((link) => String(link?.fieldSampleId || '') !== sampleId) : [],
    samples:Array.isArray(wo.samples) ? wo.samples.filter((row) => String(row?.fieldSampleId || '') !== sampleId) : [],
    testRows:Array.isArray(wo.testRows) ? wo.testRows.filter((row) => String(row?.fieldSampleId || '') !== sampleId) : []
  }));
}

function mergeFieldSampleIntoWorkOrder(workOrder, sample){
  const job = getJob(sample.jobId);
  const sampleId = getSampleDisplayId(sample);
  const receivedDate = toInputDate(sample.labReceivedAt || nowInputDateTime());
  const testCodes = normalizeStringArray(sample.testCodes);
  const link = {
    fieldSampleId:sample.id,
    fieldJobId:sample.jobId,
    fieldJobLabel:getJobDisplayTitle(job),
    sampleName:sample.sampleName,
    sampleType:sample.sampleType,
    samplePoint:sample.samplePoint,
    sampleDate:sample.sampleDate || '',
    sampleTime:sample.sampleTime || '',
    isDuplicate:!!sample.isDuplicate,
    sampleCollectionMode:sample.sampleCollectionMode || '',
    cylinderNumber:sample.cylinderNumber || '',
    sampleTempF:sample.sampleTempF,
    samplePressurePsig:sample.samplePressurePsig,
    comments:sample.notes || '',
    testCodes,
    linkedAt:new Date().toISOString()
  };
  const next = {
    ...workOrder,
    fieldSampleLinks:[...(Array.isArray(workOrder.fieldSampleLinks) ? workOrder.fieldSampleLinks : []), link],
    samples:[...(Array.isArray(workOrder.samples) ? workOrder.samples : []), {
      fieldSampleId:sample.id,
      sampleId,
      sampleName:sample.sampleName || '',
      testCodes,
      matrix:getSampleMatrix(sample),
      hydrocarbon:'',
      containerType:sample.containerType || '',
      cylinderNumber:sample.cylinderNumber || '',
      sampleDate:sample.sampleDate || '',
      sampleTime:sample.sampleTime || '',
      isDuplicate:!!sample.isDuplicate,
      sampleCollectionMode:sample.sampleCollectionMode || '',
      sampleTempF:sample.sampleTempF,
      samplePressurePsig:sample.samplePressurePsig,
      comments:sample.notes || '',
      received:receivedDate,
      logDate:receivedDate,
      dueDate:workOrder.dueDate || ''
    }],
    testRows:[...(Array.isArray(workOrder.testRows) ? workOrder.testRows : []), ...testCodes.map((testCode, index) => ({
      id:`field-${sample.id}-${testCode}-${index}`,
      fieldSampleId:sample.id,
      sampleName:sample.sampleName || '',
      type:normalizeCatalogKey(testCode),
      testCode,
      sampleId,
      cylinderNumber:sample.cylinderNumber || '',
      matrix:getSampleMatrix(sample),
      hydrocarbon:'',
      containerType:sample.containerType || '',
      sampleDate:sample.sampleDate || '',
      sampleTime:sample.sampleTime || '',
      isDuplicate:!!sample.isDuplicate,
      sampleCollectionMode:sample.sampleCollectionMode || '',
      sampleTempF:sample.sampleTempF,
      samplePressurePsig:sample.samplePressurePsig,
      comments:sample.notes || '',
      received:receivedDate,
      logDate:receivedDate,
      dueDate:workOrder.dueDate || ''
    }))]
  };
  return next;
}

function getWorkOrderMatchScore(workOrder, sample){
  const job = getJob(sample.jobId);
  let score = 0;
  if(job?.projectId && workOrder.projectId === job.projectId) score += 4;
  if(job?.clientId && workOrder.clientId === job.clientId) score += 3;
  const client = getClient(job?.clientId || sample.clientId);
  if(client?.clientCode && normalizeClientCode(workOrder.clientCode) === normalizeClientCode(client.clientCode)) score += 2;
  return score;
}

function renderSampleTests(sample){
  const tests = normalizeStringArray(sample.testCodes).map((code) => getLabTestLabel(code));
  return tests.length ? tests.join(', ') : 'No tests';
}

function isSampleGroupExpanded(groupId){
  return !!state.expandedSampleGroups?.[groupId];
}
function toggleSampleGroupExpanded(groupId){
  state.expandedSampleGroups = { ...(state.expandedSampleGroups || {}), [groupId]:!isSampleGroupExpanded(groupId) };
  renderSamples();
}
async function receiveAllSamplesForGroup(groupId){
  const samples = state.data.samples.filter((sample) => (sample.jobId || '__manual__') === groupId && normalizeSampleStatus(sample.sampleStatus, sample) !== 'Received by Lab');
  if(!samples.length) return;
  const clientIds = [...new Set(samples.map((sample) => getSampleClientIdentity(sample).id).filter(Boolean))];
  if(clientIds.length > 1){
    alert('This manual sample group contains multiple clients. Receive those samples individually so the Work Order list can be filtered correctly.');
    return;
  }
  state.sampleLinkModal = { ...createClosedSampleLinkModalState(), open:true, mode:'bulk', sampleId:samples[0]?.id || '', sampleIds:samples.map((sample) => sample.id) };
  renderSampleLinkModal();
  try {
    const workOrders = await loadLabWorkOrders();
    state.sampleLinkModal.workOrders = getEligibleWorkOrdersForSample(samples[0], workOrders);
    const best = state.sampleLinkModal.workOrders[0];
    if(best) state.sampleLinkModal.selectedWorkOrderId = best.id;
  } catch (error){
    console.error('Unable to load Lab WIP work orders:', error);
    alert(error.message || 'Unable to load Lab WIP work orders.');
  }
  renderSampleLinkModal();
}

function getPendingSampleDetailJobs(sampleJobIds){
  return state.data.jobs
    .filter((job) => (job.samplesRequired || jobTypeHasDetailGroup(job.jobType, 'sample_logistics')) && !sampleJobIds.has(job.id))
    .sort((a, b) => compareOptionalDates(parseDateTime(a.scheduledStart || a.requestedDate), parseDateTime(b.scheduledStart || b.requestedDate)) || compareStrings(getJobDisplayTitle(a), getJobDisplayTitle(b)));
}

function renderPendingSampleJobCard(job){
  const projectLabel = job?.projectId ? getProjectLabel(job.projectId) : 'No project';
  const headerMeta = `${getClientLabel(job.clientId)} | ${projectLabel} | ${getJobSiteSummary(job)} | ${getJobScheduleLabel(job)}`;
  return `<section class="sample-job-group"><div class="sample-job-header sample-job-toggle" role="button" tabindex="0" onclick="openEntityModal('jobs','${esc(job.id)}')" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); openEntityModal('jobs','${esc(job.id)}'); }"><div><div class="item-title">${esc(getJobDisplayTitle(job))}</div><div class="muted">${esc(headerMeta)}</div></div><div class="mini-tags"><span class="warning-chip">Sample details pending</span><span class="tag-chip">0 samples</span><button class="act-btn" type="button" onclick="event.stopPropagation(); openEntityModal('jobs','${esc(job.id)}')">Open Job</button></div></div></section>`;
}

function renderSamples(){
  const counts = getSampleStatusCounts(state.data.samples);
  const sampleJobIds = new Set(state.data.samples.map((sample) => sample.jobId).filter(Boolean));
  const pendingJobs = getPendingSampleDetailJobs(sampleJobIds);
  document.getElementById('samples-summary').textContent = `${state.data.samples.length} total | ${counts.needsPulled} needs pulled | ${counts.received} received by lab${pendingJobs.length ? ` | ${pendingJobs.length} pending detail${pendingJobs.length === 1 ? '' : 's'}` : ''}`;
  if(!state.data.samples.length && !pendingJobs.length){
    document.getElementById('samples-table').innerHTML = '<div class="empty-state"><strong>No sample records yet</strong>Track pickups, chain of custody, and lab handoff from here.</div>';
    return;
  }
  const grouped = new Map();
  state.data.samples.forEach((sample) => {
    const key = sample.jobId || '__manual__';
    if(!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(sample);
  });
  const groups = [...grouped.entries()].map(([jobId, samples]) => ({ job:getJob(jobId), jobId, samples:samples.sort((a, b) => (Number(a.sampleSequence || 0) - Number(b.sampleSequence || 0)) || compareStrings(a.id, b.id)) }))
    .sort((a, b) => compareOptionalDates(parseDateTime(a.job?.scheduledStart), parseDateTime(b.job?.scheduledStart)) || compareStrings(getJobDisplayTitle(a.job), getJobDisplayTitle(b.job)));
  document.getElementById('samples-table').innerHTML = `<div class="sample-job-groups">${pendingJobs.map((job) => renderPendingSampleJobCard(job)).join('')}${groups.map(({ job, jobId, samples }) => {
    const groupCounts = getSampleStatusCounts(samples);
    const projectLabel = job?.projectId ? getProjectLabel(job.projectId) : 'No project';
    const title = getSampleGroupHeaderTitle(job);
    const headerMeta = job ? `${getClientLabel(job.clientId)} | ${projectLabel} | ${getJobSiteSummary(job)} | ${getJobScheduleLabel(job)}` : 'Samples not linked to a field job';
    const linkedWorkOrderLabels = [...new Map(samples
      .filter((sample) => String(sample.linkedWorkOrderId || sample.linkedWorkOrderNumber || '').trim())
      .map((sample) => {
        const key = String(sample.linkedWorkOrderId || sample.linkedWorkOrderNumber || '');
        const label = sample.linkedWorkOrderNumber ? `WO ${sample.linkedWorkOrderNumber}` : `WO ${sample.linkedWorkOrderId}`;
        return [key, label];
      })).values()];
    const labLinkText = linkedWorkOrderLabels.length
      ? `Lab Link${linkedWorkOrderLabels.length === 1 ? '' : 's'}: ${linkedWorkOrderLabels.slice(0, 2).join(', ')}${linkedWorkOrderLabels.length > 2 ? ` +${linkedWorkOrderLabels.length - 2}` : ''}`
      : 'Lab Link: Not linked';
    const expanded = isSampleGroupExpanded(jobId);
    const sampleRows = expanded ? `<div class="sample-row-list">${samples.map((sample) => {
      const status = normalizeSampleStatus(sample.sampleStatus, sample);
      const action = status === 'Received by Lab'
        ? `<button class="act-btn danger" type="button" onclick="event.stopPropagation(); markSampleNeedsPulled('${esc(sample.id)}')">Revert</button>`
        : `<button class="add-btn" type="button" onclick="event.stopPropagation(); openSampleReceiveModal('${esc(sample.id)}')">Receive</button>`;
      const sampleMeta = [
        getSiteLabel(sample.siteId),
        sample.samplePoint || 'No sample point',
        sample.sampleDate ? `Date ${fmtDate(sample.sampleDate)}` : '',
        sample.sampleTime ? `Time ${sample.sampleTime}` : '',
        sample.cylinderNumber ? `Cylinder ${sample.cylinderNumber}` : '',
        sample.isDuplicate ? 'Duplicate' : '',
        sample.sampleCollectionMode || ''
      ].filter(Boolean).join(' | ');
      return `<div class="sample-row clickable-sample-row" role="button" tabindex="0" onclick="openEntityModal('samples','${esc(sample.id)}')" onkeydown="if((event.key === 'Enter' || event.key === ' ') && event.target === this){ event.preventDefault(); openEntityModal('samples','${esc(sample.id)}'); }"><div><div class="item-title">${esc(sample.sampleName || `Sample ${sample.sampleSequence || ''}`)} | ${esc(sample.sampleType)}</div><div class="muted">${esc(sampleMeta || 'No sample details')}</div></div><div><div class="muted">Tests</div><div>${esc(renderSampleTests(sample))}</div></div><div><div class="muted">Status</div>${getStatusBadge(status)}</div><div class="table-actions">${action}</div></div>`;
    }).join('')}</div>` : '';
    const receiveAllButton = groupCounts.needsPulled ? `<button class="add-btn" type="button" onclick="event.stopPropagation(); receiveAllSamplesForGroup('${esc(jobId)}')">Receive All Samples</button>` : '';
    return `<section class="sample-job-group ${expanded ? 'is-expanded' : ''}"><div class="sample-job-header sample-job-toggle" role="button" tabindex="0" onclick="toggleSampleGroupExpanded('${esc(jobId)}')" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); toggleSampleGroupExpanded('${esc(jobId)}'); }"><div><div class="item-title"><span class="sample-group-caret">${expanded ? 'v' : '>'}</span>${esc(title)}</div><div class="muted">${esc(headerMeta)}</div></div><div class="mini-tags"><span class="tag-chip">${samples.length} sample${samples.length === 1 ? '' : 's'}</span><span class="tag-chip">${groupCounts.needsPulled} needs pulled</span><span class="tag-chip">${groupCounts.received} received</span><span class="tag-chip">${esc(labLinkText)}</span>${receiveAllButton}${job ? `<button class="act-btn" type="button" onclick="event.stopPropagation(); openEntityModal('jobs','${esc(jobId)}')">Open Job</button>` : ''}</div></div>${sampleRows}</section>`;
  }).join('')}</div>`;
}

async function openSampleReceiveModal(sampleId){
  const sample = state.data.samples.find((row) => row.id === sampleId);
  if(!sample) return;
  state.sampleLinkModal = { ...createClosedSampleLinkModalState(), open:true, mode:'single', sampleId, sampleIds:[sampleId], selectedWorkOrderId:sample.linkedWorkOrderId || '' };
  renderSampleLinkModal();
  try {
    const workOrders = await loadLabWorkOrders();
    state.sampleLinkModal.workOrders = getEligibleWorkOrdersForSample(sample, workOrders);
    const selectedStillEligible = state.sampleLinkModal.workOrders.some((wo) => wo.id === state.sampleLinkModal.selectedWorkOrderId);
    if(!selectedStillEligible) state.sampleLinkModal.selectedWorkOrderId = '';
    const best = state.sampleLinkModal.workOrders[0];
    if(!state.sampleLinkModal.selectedWorkOrderId && best) state.sampleLinkModal.selectedWorkOrderId = best.id;
  } catch (error){
    console.error('Unable to load Lab WIP work orders:', error);
    alert(error.message || 'Unable to load Lab WIP work orders.');
  }
  renderSampleLinkModal();
}

function closeSampleLinkModal(){
  state.sampleLinkModal = createClosedSampleLinkModalState();
  renderSampleLinkModal();
}

function setSampleLinkSearch(value){
  state.sampleLinkModal.search = String(value || '');
  renderSampleLinkModal();
}

function selectSampleLinkWorkOrder(workOrderId){
  state.sampleLinkModal.selectedWorkOrderId = String(workOrderId || '');
  renderSampleLinkModal();
}

function getSampleLinkModalSamples(){
  const ids = normalizeStringArray(state.sampleLinkModal.sampleIds?.length ? state.sampleLinkModal.sampleIds : [state.sampleLinkModal.sampleId]);
  return ids.map((sampleId) => state.data.samples.find((row) => row.id === sampleId)).filter(Boolean);
}

function renderSampleLinkModal(){
  const overlay = document.getElementById('sample-link-modal-overlay');
  if(!overlay) return;
  if(!state.sampleLinkModal.open){
    overlay.classList.remove('open');
    return;
  }
  overlay.classList.add('open');
  const samples = getSampleLinkModalSamples();
  const sample = samples[0] || null;
  const job = sample ? getJob(sample.jobId) : null;
  const bulkMode = state.sampleLinkModal.mode === 'bulk';
  const query = String(state.sampleLinkModal.search || '').trim().toLowerCase();
  const rows = (state.sampleLinkModal.workOrders || [])
    .map((wo) => ({ wo, score:sample ? getWorkOrderMatchScore(wo, sample) : 0 }))
    .filter(({ wo }) => {
      if(!query) return true;
      return [wo.number, wo.client, wo.clientCode, getProjectLabel(wo.projectId)].some((value) => String(value || '').toLowerCase().includes(query));
    })
    .sort((a, b) => b.score - a.score || compareStrings(a.wo.number, b.wo.number));
  document.getElementById('sample-link-modal-title').textContent = sample ? (bulkMode ? `Receive ${samples.length} Samples` : `Receive Sample ${sample.sampleSequence || ''}`) : 'Receive Sample';
  const sampleSummary = bulkMode
    ? `<div><div class="form-label">Samples</div><div>${esc(samples.length)} sample${samples.length === 1 ? '' : 's'} selected</div><div class="muted">${esc(samples.map((row) => row.sampleName || `Sample ${row.sampleSequence || ''}`).filter(Boolean).join(', ') || 'No sample names')}</div></div>`
    : `<div><div class="form-label">Sample</div><div>${esc(sample?.sampleName || sample?.sampleType || '')}${sample?.samplePoint ? ` | ${esc(sample.samplePoint)}` : ''}</div><div class="muted">${esc(sample ? renderSampleTests(sample) : '')}</div></div>`;
  const emptyText = query ? 'No available Lab WIP Work Orders for this client match your search.' : 'No available Lab WIP Work Orders were found for this client.';
  document.getElementById('sample-link-modal-body').innerHTML = sample ? `<div class="sample-link-summary"><div><div class="form-label">Field Job</div><div class="item-title">${esc(job ? getJobDisplayTitle(job) : 'Manual Sample')}</div><div class="muted">${esc(`${getClientLabel(getSampleClientIdentity(sample).id || sample.clientId)} | ${getSiteLabel(sample.siteId)}`)}</div></div>${sampleSummary}</div><div class="form-group full"><label class="form-label">Search Work Orders</label><input class="form-input" type="text" value="${esc(state.sampleLinkModal.search)}" onchange="setSampleLinkSearch(this.value)"></div><div class="sample-workorder-list">${rows.length ? rows.map(({ wo, score }) => `<button class="sample-workorder-option ${state.sampleLinkModal.selectedWorkOrderId === wo.id ? 'is-selected' : ''}" type="button" onclick="selectSampleLinkWorkOrder('${esc(wo.id)}')"><span><strong>${esc(wo.number || 'Unnumbered WO')}</strong><span>${esc([wo.client || getClientLabel(wo.clientId), getProjectLabel(wo.projectId), wo.dueDate || 'No due date'].filter(Boolean).join(' | '))}</span></span>${score > 0 ? '<span class="tag-chip">Match</span>' : ''}</button>`).join('') : `<div class="empty-state">${esc(emptyText)}</div>`}</div>` : '<div class="empty-state">Sample not found.</div>';
}

async function saveFieldSampleRecord(sampleRecord){
  if(isRemoteMode()){
    await remoteRepository.saveRecord('samples', sampleRecord);
    await loadData({ silent:true, force:true });
    return;
  }
  const next = clone(state.data);
  const index = next.samples.findIndex((row) => row.id === sampleRecord.id);
  if(index >= 0) next.samples[index] = normalizeRecord('samples', sampleRecord, { fromRemote:false });
  await persistLocal(next);
}

async function confirmSampleWorkOrderLink(){
  const samples = getSampleLinkModalSamples().filter((sample) => normalizeSampleStatus(sample.sampleStatus, sample) !== 'Received by Lab');
  if(!samples.length) return;
  const workOrders = await loadLabWorkOrders();
  const selected = workOrders.find((wo) => wo.id === state.sampleLinkModal.selectedWorkOrderId);
  if(!selected){
    alert('Select an existing Lab WIP work order.');
    return;
  }
  if(!workOrderMatchesSampleClient(selected, samples[0]) || hasFieldSampleLink(selected)){
    alert('Select an available Lab WIP work order for this client.');
    return;
  }
  const receivedAt = nowInputDateTime();
  const receivedSamples = samples.map((sample) => applySampleStatusCompatibility({
    ...sample,
    sampleStatus:'Received by Lab',
    linkedWorkOrderId:selected.id,
    linkedWorkOrderNumber:selected.number || selected.id,
    labReceivedAt:sample.labReceivedAt || receivedAt
  }));
  const cleaned = receivedSamples.reduce((orders, sample) => removeFieldSampleFromWorkOrders(orders, sample.id), workOrders);
  const merged = cleaned.map((wo) => wo.id === selected.id ? receivedSamples.reduce((nextWo, sample) => mergeFieldSampleIntoWorkOrder(nextWo, sample), wo) : wo);
  state.saveInFlight = true;
  showSaveStatus('saving', receivedSamples.length === 1 ? 'LINKING SAMPLE' : 'LINKING SAMPLES');
  try {
    await saveLabWorkOrders(merged);
    if(isRemoteMode()){
      await Promise.all(receivedSamples.map((sample) => remoteRepository.saveRecord('samples', sample)));
      await loadData({ silent:true, force:true });
    } else {
      const next = clone(state.data);
      receivedSamples.forEach((sample) => {
        const index = next.samples.findIndex((row) => row.id === sample.id);
        if(index >= 0) next.samples[index] = normalizeRecord('samples', sample, { fromRemote:false });
      });
      await persistLocal(next);
    }
    closeSampleLinkModal();
    showSaveStatus('saved', receivedSamples.length === 1 ? 'SAMPLE LINKED' : 'SAMPLES LINKED');
    hideSaveStatusSoon();
  } catch (error){
    console.error('Unable to link sample(s) to work order:', error);
    showSaveStatus('error', 'LINK FAILED');
    hideSaveStatusSoon(4200);
    alert(error.message || 'Unable to link these sample(s).');
  } finally {
    state.saveInFlight = false;
  }
}

async function markSampleNeedsPulled(sampleId){
  const sample = state.data.samples.find((row) => row.id === sampleId);
  if(!sample) return;
  if(sample.linkedWorkOrderId && !confirm('Revert this sample to Needs Pulled and remove the field-created lab work order link?')) return;
  state.saveInFlight = true;
  showSaveStatus('saving', 'UPDATING SAMPLE');
  try {
    const workOrders = await loadLabWorkOrders();
    await saveLabWorkOrders(removeFieldSampleFromWorkOrders(workOrders, sample.id));
    await saveFieldSampleRecord(applySampleStatusCompatibility({ ...sample, sampleStatus:'Needs Pulled' }));
    showSaveStatus('saved', 'SAMPLE UPDATED');
    hideSaveStatusSoon();
  } catch (error){
    console.error('Unable to revert sample:', error);
    showSaveStatus('error', 'UPDATE FAILED');
    hideSaveStatusSoon(4200);
    alert(error.message || 'Unable to update this sample.');
  } finally {
    state.saveInFlight = false;
  }
}

function renderMaintenance(){
  document.getElementById('maintenance-summary').textContent = `${state.data.maintenanceRecords.filter((record) => !isMaintenanceClosed(record)).length} open items`;
  document.getElementById('maintenance-table').innerHTML = renderTable(['Asset', 'Type', 'Status', 'Dates', 'Assigned', 'Vendor / Cost'], state.data.maintenanceRecords.map((record) => buildTableRow('maintenanceRecords', record.id, [ `<div class="inline-stack"><div class="item-title">${esc(getAssetLabel(record.assetType, record.assetId))}</div><div class="muted">${esc(record.assetType)}</div></div>`, getStatusBadge(record.maintenanceType), getStatusBadge(record.status), `<div class="inline-stack"><div>${esc(fmtDate(record.dueDate))}</div><div class="muted">${esc(record.openDate ? `Opened ${fmtDate(record.openDate)}` : 'No open date')}</div></div>`, esc(record.assignedPerson || 'Unassigned'), `<div class="inline-stack"><div>${esc(record.vendorInternal || 'Internal')}</div><div class="muted">${esc(fmtCurrency(record.cost))}</div></div>` ])), '<strong>No maintenance records yet</strong>Capture inspections, repairs, and calibration readiness here.');
}

function renderViewState(){
  document.querySelectorAll('.view-btn').forEach((button) => button.classList.toggle('active', button.dataset.view === state.activeView));
  document.querySelectorAll('.screen').forEach((screen) => screen.classList.toggle('active', screen.id === `${state.activeView}-screen`));
}

function render(){
  renderViewState();
  const derived = buildDerivedState();
  if(document.getElementById('overview-stats')) renderOverview(derived);
  if(document.getElementById('dispatch-table')) renderDispatch(derived);
  if(document.getElementById('schedule-board')) renderSchedule(derived);
  if(document.getElementById('directory-toolbar')) renderDirectory();
  if(document.getElementById('parts-table')) renderInventory();
  if(document.getElementById('trucks-panel')) renderResources();
  if(document.getElementById('site-types-panel')) renderSetup();
  if(document.getElementById('samples-table')) renderSamples();
  if(document.getElementById('maintenance-table')) renderMaintenance();
  if(document.getElementById('entity-modal-overlay')) renderModal();
  if(document.getElementById('job-part-modal-overlay')) renderJobPartPickerModal();
  if(document.getElementById('part-adjust-modal-overlay')) renderPartAdjustModal();
  if(document.getElementById('sample-link-modal-overlay')) renderSampleLinkModal();
  hydrateAssetPhotoPreviews();
}

function getNewRecordDraft(entityKey){
  const base = clone(ENTITY_CONFIG[entityKey].defaults);
  if(entityKey === 'samples'){
    const now = nowInputDateTime();
    const parts = splitInputDateTime(now);
    base.collectionDateTime = now;
    base.sampleDate = parts.date;
    base.sampleTime = parts.time;
  }
  if(entityKey === 'maintenanceRecords') base.openDate = todayISO();
  return base;
}

function normalizeOptionsList(options){ return normalizeOptions(typeof options === 'function' ? options() : options); }
function isEmptyOptionValue(value){ return value === '' || value === null || value === undefined; }
function hasExplicitEmptyOption(options){ return options.some((option) => isEmptyOptionValue(option?.value)); }
function isFieldDisabled(field){ return typeof field?.disabled === 'function' ? !!field.disabled() : !!field?.disabled; }
function shouldRenderField(field){
  if(!field) return true;
  if(modalState.entity === 'technicianTravel' && field.travelLocationTypeKey){
    return modalState.formData[field.travelLocationTypeKey] === field.travelLocationTypeValue;
  }
  if(modalState.entity === 'jobs'){
    if(Array.isArray(field.scheduleModes) && field.scheduleModes.length && !field.scheduleModes.includes(getJobTypeScheduleMode(modalState.formData.jobType))) return false;
    if(field.multiSiteOnly && !jobTypeAllowsMultipleSites(modalState.formData.jobType)) return false;
    if(field.singleSiteOnly && jobTypeAllowsMultipleSites(modalState.formData.jobType)) return false;
    if(field.detailGroup && !jobTypeHasDetailGroup(modalState.formData.jobType, field.detailGroup)) return false;
    if(Array.isArray(field.jobTypes) && field.jobTypes.length){
      const currentValue = resolveJobTypeValue(state.data.jobTypes, modalState.formData.jobType);
      return field.jobTypes.map((value) => resolveJobTypeValue(state.data.jobTypes, value)).includes(currentValue);
    }
  }
  return true;
}

function toggleModalArrayValue(key, optionValue, checked){
  if(!modalState.open) return;
  const openMenu = document.querySelector(`.multi-select[data-multi-select-key="${cssEscape(key)}"] .multi-select-menu`);
  const previousScrollTop = openMenu ? openMenu.scrollTop : null;
  const values = normalizeStringArray(modalState.formData[key]);
  let nextValues = checked ? [...new Set([...values, optionValue])] : values.filter((value) => value !== optionValue);
  if(modalState.entity === 'jobTypes' && key === 'detailGroups' && optionValue === JOB_PARTS_DETAIL_GROUP){
    nextValues = checked
      ? nextValues.filter((value) => value !== JOB_PARTS_DISABLED_DETAIL_GROUP)
      : [...new Set([...nextValues, JOB_PARTS_DISABLED_DETAIL_GROUP])];
  }
  modalState.formData[key] = nextValues;
  if(modalState.entity === 'jobs' && key === 'siteIds'){
    normalizeModalJobSiteIds();
    normalizeModalSampleSiteIds();
  }
  renderModal();
  if(previousScrollTop !== null){
    const nextMenu = document.querySelector(`.multi-select[data-multi-select-key="${cssEscape(key)}"] .multi-select-menu`);
    if(nextMenu) nextMenu.scrollTop = previousScrollTop;
  }
}

function toggleModalMultiSelect(key){
  if(!modalState.open) return;
  modalState.openMultiSelectKey = modalState.openMultiSelectKey === key ? '' : key;
  renderModal();
}

function setModalArrayFromSelect(key, selectNode){
  if(!modalState.open || !selectNode) return;
  modalState.formData[key] = Array.from(selectNode.selectedOptions || []).map((option) => option.value);
  if(modalState.entity === 'jobs' && key === 'siteIds'){
    normalizeModalJobSiteIds();
    normalizeModalSampleSiteIds();
  }
  renderModal();
}

function toggleModalTestDropdown(key){
  if(!modalState.open) return;
  modalState.openMultiSelectKey = modalState.openMultiSelectKey === key ? '' : key;
  renderModal();
}

function toggleModalTestValue(key, optionValue){
  if(!modalState.open) return;
  const current = normalizeStringArray(modalState.formData[key]);
  const option = normalizeCatalogKey(optionValue);
  const next = current.includes(option) ? current.filter((value) => value !== option) : [...current, option];
  modalState.formData[key] = key === 'testCodes' ? filterTestCodesForSampleType(next, modalState.formData.sampleType) : next;
  modalState.openMultiSelectKey = key;
  renderModal();
}

function saveModalTestSelection(key){
  if(!modalState.open) return;
  if(modalState.openMultiSelectKey === key) modalState.openMultiSelectKey = '';
  renderModal();
}

function getModalMultiSelectSummary(options, selectedValues){
  const optionByValue = new Map(options.map((option) => [String(option.value), option]));
  const selectedOptions = selectedValues.map((value) => optionByValue.get(String(value))).filter(Boolean);
  if(!selectedOptions.length) return 'Select options...';
  if(selectedOptions.length === 1) return selectedOptions[0].label;
  return `${selectedOptions.length} selected`;
}

function getModalMultiSelectDetail(options, selectedValues){
  const optionByValue = new Map(options.map((option) => [String(option.value), option]));
  const selectedOptions = selectedValues.map((value) => optionByValue.get(String(value))).filter(Boolean);
  return selectedOptions.length ? selectedOptions.map((option) => option.label).join(', ') : 'No selections';
}

function cssEscape(value){
  if(window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(String(value || ''));
  return String(value || '').replace(/["\\]/g, '\\$&');
}

function renderColorField(field){
  const value = normalizeHexColor(modalState.formData[field.key], DEFAULT_JOB_TYPE_COLOR);
  const selectedValue = normalizeHexColor(value);
  return `<div class="form-group${field.full ? ' full' : ''}"><label class="form-label">${esc(field.label)}</label><div class="color-control"><div class="color-swatch-row">${JOB_TYPE_COLOR_OPTIONS.map((option) => `<button class="color-swatch ${selectedValue === option.value ? 'is-selected' : ''}" type="button" title="${esc(option.label)}" style="--swatch-color:${esc(option.value)}" onclick="setJobTypeColor('${esc(option.value)}')"><span class="sr-only">${esc(option.label)}</span></button>`).join('')}</div><div class="color-input-row"><input class="form-input color-picker" type="color" value="${esc(selectedValue)}" oninput="setJobTypeColor(this.value)"><input class="form-input" type="text" value="${esc(modalState.formData[field.key] || selectedValue)}" maxlength="7" placeholder="${esc(DEFAULT_JOB_TYPE_COLOR)}" oninput="setModalField('${field.key}', this.value)" onchange="setJobTypeColor(this.value)"><span class="color-preview" style="--swatch-color:${esc(selectedValue)}">${esc(selectedValue)}</span></div></div></div>`;
}

function renderFormField(field){
  if(!shouldRenderField(field)) return '';
  if(field.kind === 'section') return `<div class="form-section"><h4>${esc(field.label)}</h4></div>`;
  const fullClass = field.full ? ' full' : '';
  const disabled = isFieldDisabled(field);
  if(field.type === 'checkbox') return `<div class="form-group${fullClass}"><label class="form-label">${esc(field.label)}</label><label class="toggle-card ${disabled ? 'is-disabled' : ''}"><input type="checkbox" ${modalState.formData[field.key] ? 'checked' : ''} ${disabled ? 'disabled' : ''} onchange="toggleModalField('${field.key}', this.checked)"><span>${esc(field.label)}</span></label></div>`;
  if(field.type === 'checkbox-group'){
    const options = normalizeOptionsList(field.options || []);
    const selectedValues = normalizeStringArray(modalState.formData[field.key]);
    return `<div class="form-group${fullClass}"><label class="form-label">${esc(field.label)}</label><div class="checkbox-group ${disabled ? 'is-disabled' : ''}">${options.map((option) => `<label class="checkbox-chip"><input type="checkbox" value="${esc(option.value)}" ${selectedValues.includes(String(option.value)) ? 'checked' : ''} ${disabled ? 'disabled' : ''} onchange="toggleModalArrayValue('${field.key}', '${esc(option.value)}', this.checked)"><span>${esc(option.label)}</span></label>`).join('')}</div></div>`;
  }
  if(field.type === 'multi-select'){
    const options = normalizeOptionsList(field.options || []);
    const selectedValues = normalizeStringArray(modalState.formData[field.key]);
    const isOpen = modalState.openMultiSelectKey === field.key;
    const getOptionLabel = (option) => {
      const value = String(option.value);
      const selectedIndex = selectedValues.indexOf(value);
      return field.ranked && selectedIndex >= 0 ? `${selectedIndex + 1}. ${option.label}` : option.label;
    };
    return `<div class="form-group${fullClass}"><label class="form-label">${esc(field.label)}</label><div class="multi-select ${isOpen ? 'open' : ''} ${disabled ? 'is-disabled' : ''}" data-multi-select-key="${esc(field.key)}"><button class="multi-select-trigger" type="button" ${disabled ? 'disabled' : ''} aria-expanded="${isOpen ? 'true' : 'false'}" onclick="toggleModalMultiSelect('${field.key}')"><span>${esc(getModalMultiSelectSummary(options, selectedValues))}</span><span class="multi-select-caret">v</span></button><div class="multi-select-detail">${esc(getModalMultiSelectDetail(options, selectedValues))}</div><div class="multi-select-menu">${options.length ? options.map((option) => `<label class="multi-select-option"><input type="checkbox" value="${esc(option.value)}" ${selectedValues.includes(String(option.value)) ? 'checked' : ''} ${disabled ? 'disabled' : ''} onchange="toggleModalArrayValue('${field.key}', '${esc(option.value)}', this.checked)"><span>${esc(getOptionLabel(option))}</span></label>`).join('') : '<div class="empty-state">No options available.</div>'}</div></div></div>`;
  }
  if(field.type === 'select-multiple'){
    const options = normalizeOptionsList(field.options || []);
    const selectedValues = normalizeStringArray(modalState.formData[field.key]);
    return `<div class="form-group${fullClass}"><label class="form-label">${esc(field.label)}</label><select class="form-input" multiple size="${Math.min(7, Math.max(3, options.length || 3))}" ${disabled ? 'disabled' : ''} onchange="setModalArrayFromSelect('${field.key}', this)">${options.map((option) => `<option value="${esc(option.value)}" ${selectedValues.includes(String(option.value)) ? 'selected' : ''}>${esc(option.label)}</option>`).join('')}</select><div class="multi-select-detail">${esc(getModalMultiSelectDetail(options, selectedValues))}</div></div>`;
  }
  if(field.type === 'test-dropdown'){
    const options = normalizeOptionsList(field.options || []);
    const selectedValues = normalizeStringArray(modalState.formData[field.key]);
    const isOpen = modalState.openMultiSelectKey === field.key;
    return `<div class="form-group${fullClass}"><label class="form-label">${esc(field.label)}</label><div class="sample-test-dropdown ${isOpen ? 'open' : ''} ${disabled ? 'is-disabled' : ''}"><button class="multi-select-trigger" type="button" ${disabled ? 'disabled' : ''} onclick="toggleModalTestDropdown('${field.key}')"><span>${esc(getModalMultiSelectSummary(options, selectedValues))}</span><span class="multi-select-caret">v</span></button><div class="multi-select-detail">${esc(getModalMultiSelectDetail(options, selectedValues))}</div><div class="sample-test-menu"><div class="sample-test-options">${options.length ? options.map((option) => `<button class="sample-test-option ${selectedValues.includes(String(option.value)) ? 'is-selected' : ''}" type="button" onclick="toggleModalTestValue('${field.key}', '${esc(option.value)}')">${esc(option.label)}</button>`).join('') : '<div class="empty-state">No tests available for this sample type.</div>'}</div><div class="sample-test-footer"><button class="sample-test-save" type="button" onclick="saveModalTestSelection('${field.key}')">Save test selection</button></div></div></div></div>`;
  }
  if(field.type === 'image') return renderAssetPhotoField(field);
  if(field.type === 'color') return renderColorField(field);
  const value = modalState.formData[field.key];
  const options = normalizeOptionsList(field.options || []);
  const includeEmptyOption = !hasExplicitEmptyOption(options);
  const emptyOptionLabel = field.placeholderLabel || (field.required ? 'Select...' : '');
  if(field.type === 'currency'){
    return `<div class="form-group${fullClass}"><label class="form-label">${esc(field.label)}</label><div class="currency-input-wrap"><span>$</span><input class="form-input" ${disabled ? 'disabled' : ''} type="number" step="0.01" min="0" value="${esc(value ?? '')}" oninput="setModalField('${field.key}', this.value, 'number')"></div></div>`;
  }
  const control = field.type === 'textarea'
    ? `<textarea class="form-input" ${disabled ? 'disabled' : ''} oninput="setModalField('${field.key}', this.value)">${esc(value)}</textarea>`
    : field.type === 'select'
      ? `<select class="form-input" ${disabled ? 'disabled' : ''} onchange="${field.handler ? `${field.handler}(this.value)` : `setModalField('${field.key}', this.value)`}">${includeEmptyOption ? `<option value="">${esc(emptyOptionLabel)}</option>` : ''}${options.map((option) => `<option value="${esc(option.value)}" ${String(value) === String(option.value) ? 'selected' : ''}>${esc(option.label)}</option>`).join('')}</select>`
      : `<input class="form-input" ${disabled ? 'disabled' : ''} type="${field.type || 'text'}" value="${esc(value ?? '')}" oninput="setModalField('${field.key}', this.value, '${field.type === 'number' ? 'number' : 'text'}')">`;
  return `<div class="form-group${fullClass}"><label class="form-label">${esc(field.label)}</label>${control}</div>`;
}

function getBillingRateSectionClass(section){
  if(section === 'Natural Gas Samples') return 'gas';
  if(section === 'Field & Labor') return 'field-labor';
  return 'liquid';
}
function getBillingRateSections(){ return ['Liquid Samples', 'Natural Gas Samples', 'Field & Labor']; }
function getBillingRateItemsBySection(){
  return getBillingRateSections().map((section) => ({
    section,
    items:getActivePriceItems().filter((item) => (item.priceSection || (item.category === 'Gas' ? 'Natural Gas Samples' : 'Liquid Samples')) === section)
  })).filter((group) => group.items.length);
}
function getBillingPriceMap(profileId){
  return new Map(getBillingPricesForProfile(profileId).map((row) => [row.priceItemId, row]));
}
function renderBillingRateScheduleTable(profile){
  const groups = getBillingRateItemsBySection();
  if(!groups.length) return '<div class="empty-state">No price items are available yet.</div>';
  const priceByItemId = getBillingPriceMap(profile?.id || '');
  const body = groups.map((group) => {
    const sectionClass = getBillingRateSectionClass(group.section);
    const rows = group.items.map((item) => {
      const price = priceByItemId.get(item.id) || null;
      const rate = normalizeNumber(price?.rateAmount);
      const inactive = price && price.isActive === false;
      return `<tr class="${inactive ? 'is-inactive' : ''}">
        <td>${esc(item.method || '')}</td>
        <td>${esc(item.description || '')}</td>
        <td>${esc(item.unitName || '')}</td>
        <td class="rate-cell">${esc(rate === null ? '' : fmtCurrency(rate))}</td>
      </tr>`;
    }).join('');
    return `<tbody class="billing-rate-section billing-rate-section-${sectionClass}">
      <tr class="section-row"><th colspan="4">${esc(group.section)}</th></tr>
      <tr class="column-row"><th>Method</th><th>Description</th><th>Units</th><th>${esc(BILLING_RATE_EFFECTIVE_YEAR)} Rate</th></tr>
      ${rows}
    </tbody>`;
  }).join('');
  return `<div class="billing-rate-table-wrap"><table class="billing-rate-table">${body}</table></div>`;
}
function renderBillingRateScheduleEditor(){
  if(modalState.entity !== 'billingRates') return '';
  const drafts = getModalBillingPriceDrafts();
  const draftByItemId = new Map(drafts.map((row) => [row.priceItemId, row]));
  const groups = getBillingRateItemsBySection();
  if(!groups.length){
    return `<div class="billing-price-editor"><div class="empty-state">No price items are available yet.</div></div>`;
  }
  const groupMarkup = groups.map((group) => {
    const sectionClass = getBillingRateSectionClass(group.section);
    const rows = group.items.map((item) => {
      const draft = draftByItemId.get(item.id) || {};
      return `<tr>
        <td>${esc(item.method || '')}</td>
        <td>${esc(item.description || '')}</td>
        <td>${esc(item.unitName || '')}</td>
        <td><div class="currency-input-wrap compact-currency"><span>$</span><input class="form-input" type="number" step="0.01" min="0" value="${esc(draft.rateAmount ?? '')}" oninput="updateBillingPriceDraft('${esc(item.id)}', 'rateAmount', this.value, 'number')"></div></td>
        <td><label class="rate-active-toggle"><input type="checkbox" ${draft.isActive !== false ? 'checked' : ''} onchange="updateBillingPriceDraft('${esc(item.id)}', 'isActive', this.checked)"><span>Active</span></label></td>
        <td><input class="form-input compact-notes-input" type="text" value="${esc(draft.notes || '')}" oninput="updateBillingPriceDraft('${esc(item.id)}', 'notes', this.value)"></td>
      </tr>`;
    }).join('');
    return `<tbody class="billing-rate-section billing-rate-section-${sectionClass}">
      <tr class="section-row"><th colspan="6">${esc(group.section)}</th></tr>
      <tr class="column-row"><th>Method</th><th>Description</th><th>Units</th><th>${esc(BILLING_RATE_EFFECTIVE_YEAR)} Rate</th><th>Active</th><th>Notes</th></tr>
      ${rows}
    </tbody>`;
  }).join('');
  return `<div class="billing-price-editor"><div class="section-copy">Edit all ${esc(BILLING_RATE_EFFECTIVE_YEAR)} rates for this billing profile. Save applies the full rate schedule together.</div><div class="billing-rate-table-wrap billing-rate-edit-wrap"><table class="billing-rate-table billing-rate-edit-table">${groupMarkup}</table></div></div>`;
}

function renderAssignmentRow(assignment){
  const needsTruckAssignment = assignment.assignmentType === 'Truck' && !assignment.resourceId && getRequiredAssignmentTypes(modalState.formData.jobType).includes('Truck');
  const resourceWarning = needsTruckAssignment ? '<div class="assignment-warning">Truck needs assigned for this job type.</div>' : '';
  return `<div class="assignment-row ${needsTruckAssignment ? 'assignment-row-warning' : ''}"><div class="form-group"><label class="form-label">Assignment Type</label><select class="form-input" onchange="updateModalAssignmentField('${assignment.id}', 'assignmentType', this.value)">${ASSIGNMENT_TYPE_OPTIONS.map((option) => `<option value="${esc(option)}" ${assignment.assignmentType === option ? 'selected' : ''}>${esc(option)}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">Resource</label><select class="form-input ${needsTruckAssignment ? 'assignment-resource-warning' : ''}" onchange="updateModalAssignmentField('${assignment.id}', 'resourceId', this.value)"><option value="">Select resource...</option>${buildResourceOptions(assignment.assignmentType, assignment.resourceId).map((option) => `<option value="${esc(option.value)}" ${assignment.resourceId === option.value ? 'selected' : ''}>${esc(option.label)}</option>`).join('')}</select>${resourceWarning}</div><div class="form-group"><label class="form-label">Remove</label><button class="act-btn danger" type="button" onclick="removeAssignmentRow('${assignment.id}')">Delete</button></div></div>`;
}

function getModalTruckAssignment(){ return modalState.assignments.find((item) => item.assignmentType === 'Truck' && item.resourceId) || null; }
function getOrCreateModalTruckAssignment(){
  let row = modalState.assignments.find((item) => item.assignmentType === 'Truck' && item.resourceId) || modalState.assignments.find((item) => item.assignmentType === 'Truck');
  if(row) return row;
  row = normalizeRecord('jobAssignments', { id:uid(ENTITY_CONFIG.jobAssignments.idPrefix), assignmentType:'Truck', resourceId:'' });
  modalState.assignments.push(row);
  return row;
}
function getOrCreateEmptyModalTruckAssignment(){
  let row = modalState.assignments.find((item) => item.assignmentType === 'Truck' && !item.resourceId);
  if(row) return row;
  if(modalState.assignments.some((item) => item.assignmentType === 'Truck' && item.resourceId)) return null;
  row = normalizeRecord('jobAssignments', { id:uid(ENTITY_CONFIG.jobAssignments.idPrefix), assignmentType:'Truck', resourceId:'' });
  modalState.assignments.push(row);
  return row;
}
function getModalDefaultTruckSuggestions(){
  const seen = new Set();
  return modalState.assignments
    .filter((item) => item.assignmentType === 'Technician' && item.resourceId)
    .map((item) => {
      const employee = state.data.employees.find((row) => row.id === item.resourceId) || null;
      const defaultTruck = getDefaultTruckForTechnician(item.resourceId);
      if(!employee || !defaultTruck || seen.has(item.resourceId)) return null;
      seen.add(item.resourceId);
      return { employee, defaultTruck };
    })
    .filter(Boolean);
}
function applyTechnicianDefaultTruck(technicianId, replace = false){
  if(!modalState.open) return;
  const defaultTruck = getDefaultTruckForTechnician(technicianId);
  if(!defaultTruck){
    const target = getOrCreateEmptyModalTruckAssignment();
    if(target){
      target.assignmentType = 'Truck';
      target.resourceId = '';
    }
    renderModal();
    return;
  }
  const currentTruck = getModalTruckAssignment();
  if(currentTruck && currentTruck.resourceId === defaultTruck.id) return;
  if(currentTruck && !replace){
    alert('A truck is already assigned to this job. Use the existing truck row to swap vehicles, or use this shortcut after clearing the current truck.');
    return;
  }
  const target = getOrCreateModalTruckAssignment();
  target.assignmentType = 'Truck';
  target.resourceId = defaultTruck.id;
  renderModal();
}
function clearModalTruckAssignment(){
  const target = modalState.assignments.find((item) => item.assignmentType === 'Truck');
  if(!target) return;
  target.resourceId = '';
  renderModal();
}
function renderAssignmentEditor(){
  const requirements = getRequiredAssignmentTypes(modalState.formData.jobType);
  const suggestions = getModalDefaultTruckSuggestions();
  const currentTruck = getModalTruckAssignment();
  const suggestionMarkup = suggestions.length ? `<div class="assignment-defaults">${suggestions.map(({ employee, defaultTruck }) => `<div class="assignment-default-row"><div><div class="item-title">${esc(getEmployeeOptionLabel(employee))}</div><div class="muted">Default truck ${esc(defaultTruck.unitNumber || 'Unnamed truck')}</div></div><div class="table-actions"><button class="act-btn" type="button" onclick="applyTechnicianDefaultTruck('${esc(employee.id)}', true)" ${currentTruck?.resourceId === defaultTruck.id ? 'disabled' : ''}>Use Default Truck</button>${currentTruck ? `<button class="act-btn danger" type="button" onclick="clearModalTruckAssignment()">Clear Truck</button>` : ''}</div></div>`).join('')}</div>` : '';
  return `<div class="assignment-editor"><div class="assignment-head"><div><h4>Job Assignments</h4><div class="section-copy">${requirements.length ? `Required for ${getJobTypeDisplayName(modalState.formData.jobType)}: ${requirements.join(', ')}.` : 'Choose a job type, then add employees, trucks, trailers, and equipment as needed.'}</div></div><button class="add-btn" type="button" onclick="addAssignmentRow()">+ Add Assignment</button></div>${suggestionMarkup}<div class="assignment-list">${modalState.assignments.length ? modalState.assignments.map((assignment) => renderAssignmentRow(assignment)).join('') : '<div class="empty-state">No assignments added yet.</div>'}</div><div class="form-hint">Selecting an employee auto-fills their default truck when no truck is assigned. You can swap to another vehicle or clear the truck from this editor at any time.</div></div>`;
}

function renderJobSampleLogisticsEditor(){
  if(modalState.entity !== 'jobs' || !jobTypeHasDetailGroup(modalState.formData.jobType, 'sample_logistics')) return '';
  const count = Math.max(0, Number(modalState.formData.sampleCount || 0));
  if(count && getModalSampleDrafts().length !== count) ensureModalSampleDrafts();
  const rows = getModalSampleDrafts();
  const sampleCountOptions = Array.from({ length:50 }, (_, index) => index + 1);
  const renderSampleSummary = () => {
    const summary = {
      Gas:{ total:0, tests:new Map() },
      Liquid:{ total:0, tests:new Map() }
    };
    rows.forEach((row) => {
      const sampleType = normalizeSampleTypeForWorkflow(row.sampleType);
      if(!summary[sampleType]) return;
      summary[sampleType].total += 1;
      filterTestCodesForSampleType(row.testCodes, sampleType).forEach((testCode) => {
        summary[sampleType].tests.set(testCode, (summary[sampleType].tests.get(testCode) || 0) + 1);
      });
    });
    const renderType = (sampleType) => {
      const typeSummary = summary[sampleType];
      const testRows = [...typeSummary.tests.entries()]
        .sort((a, b) => compareStrings(getLabTestLabel(a[0]), getLabTestLabel(b[0])))
        .map(([testCode, testCount]) => `<div class="sample-summary-test"><span>${esc(getLabTestLabel(testCode))}</span><strong>${esc(testCount)}</strong></div>`)
        .join('');
      return `<div class="sample-summary-card"><div class="sample-summary-total"><span>Total ${esc(sampleType)} Samples</span><strong>${esc(typeSummary.total)}</strong></div><div class="sample-summary-tests">${testRows || '<div class="sample-summary-empty">No tests selected</div>'}</div></div>`;
    };
    return `<div class="sample-logistics-summary">${renderType('Gas')}${renderType('Liquid')}</div>`;
  };
  const renderTestDropdown = (row) => {
    const tests = getLabTestsForSampleType(row.sampleType);
    const selected = normalizeStringArray(row.testCodes);
    const options = tests.map((test) => ({ value:test.key, label:test.label }));
    const isOpen = modalState.openSampleTestDraftId === row.draftId;
    return `<div class="sample-test-dropdown ${isOpen ? 'open' : ''}"><button class="multi-select-trigger" type="button" onclick="toggleJobSampleTestDropdown('${esc(row.draftId)}')"><span>${esc(getModalMultiSelectSummary(options, selected))}</span><span class="multi-select-caret">v</span></button><div class="multi-select-detail">${esc(tests.length ? getModalMultiSelectDetail(options, selected) : 'No tests available for this sample type')}</div><div class="sample-test-menu"><div class="sample-test-options">${tests.length ? tests.map((test) => `<button class="sample-test-option ${selected.includes(test.key) ? 'is-selected' : ''}" type="button" onclick="toggleJobSampleDraftTest('${esc(row.draftId)}', '${esc(test.key)}')">${esc(test.label)}</button>`).join('') : '<div class="empty-state">No tests available for this sample type.</div>'}</div><div class="sample-test-footer"><button class="sample-test-save" type="button" onclick="saveJobSampleTestSelection('${esc(row.draftId)}')">Save test selection</button></div></div></div>`;
  };
  const renderCollectionModeControl = (row) => `<div class="form-group"><label class="form-label">Composite / Spot</label><div class="checkbox-group sample-mode-group"><label class="checkbox-chip"><input type="checkbox" ${row.sampleCollectionMode === 'Composite' ? 'checked' : ''} onchange="updateJobSampleDraftField('${esc(row.draftId)}', 'sampleCollectionMode', 'Composite')"><span>Composite</span></label><label class="checkbox-chip"><input type="checkbox" ${row.sampleCollectionMode === 'Spot' ? 'checked' : ''} onchange="updateJobSampleDraftField('${esc(row.draftId)}', 'sampleCollectionMode', 'Spot')"><span>Spot</span></label></div></div>`;
  const renderSampleSiteSelect = (row) => {
    const options = getNormalizedJobSiteIds(modalState.formData).map((siteId) => ({ value:siteId, label:getSiteLabel(siteId) }));
    return `<div class="form-group"><label class="form-label">Sample Site *</label><select class="form-input" onchange="updateJobSampleDraftField('${esc(row.draftId)}', 'siteId', this.value)">${options.map((option) => `<option value="${esc(option.value)}" ${row.siteId === option.value ? 'selected' : ''}>${esc(option.label)}</option>`).join('')}</select></div>`;
  };
  const sampleRows = rows.length
    ? rows.map((row, index) => {
      const expanded = isJobSampleDraftExpanded(row.draftId);
      const selectedTests = filterTestCodesForSampleType(row.testCodes, row.sampleType);
      const title = `Sample ${index + 1} - ${row.sampleName || 'Sample ID'}`;
      const point = row.samplePoint || 'No sample point';
      const body = expanded ? `<div class="sample-draft-body"><div class="sample-coc-layout"><div class="sample-sequence">#${index + 1}</div><div class="sample-coc-fields"><div class="sample-coc-row sample-coc-row-primary"><div class="form-group"><label class="form-label">Sample ID *</label><input class="form-input" type="text" value="${esc(row.sampleName)}" oninput="updateJobSampleDraftField('${esc(row.draftId)}', 'sampleName', this.value)"></div><div class="form-group"><label class="form-label">Sample Point</label><input class="form-input" type="text" value="${esc(row.samplePoint || '')}" oninput="updateJobSampleDraftField('${esc(row.draftId)}', 'samplePoint', this.value)"></div>${renderSampleSiteSelect(row)}<div class="form-group"><label class="form-label">Sample Date / Time</label><input class="form-input" type="datetime-local" value="${esc(row.collectionDateTime)}" oninput="updateJobSampleDraftField('${esc(row.draftId)}', 'collectionDateTime', this.value)"></div></div><div class="sample-coc-row sample-coc-row-measurements"><div class="form-group"><label class="form-label">Sample Type *</label><select class="form-input" onchange="updateJobSampleDraftField('${esc(row.draftId)}', 'sampleType', this.value)"><option value="Gas" ${row.sampleType === 'Gas' ? 'selected' : ''}>Gas</option><option value="Liquid" ${row.sampleType === 'Liquid' ? 'selected' : ''}>Liq</option></select></div><div class="form-group"><label class="form-label">Cylinder # *</label><input class="form-input" type="text" value="${esc(row.cylinderNumber)}" oninput="updateJobSampleDraftField('${esc(row.draftId)}', 'cylinderNumber', this.value)"></div><div class="form-group"><label class="form-label">Sample Temp (F)</label><input class="form-input" type="number" step="0.1" value="${esc(row.sampleTempF ?? '')}" oninput="updateJobSampleDraftField('${esc(row.draftId)}', 'sampleTempF', this.value)"></div><div class="form-group"><label class="form-label">Sample Pressure (PSIG)</label><input class="form-input" type="number" step="0.1" value="${esc(row.samplePressurePsig ?? '')}" oninput="updateJobSampleDraftField('${esc(row.draftId)}', 'samplePressurePsig', this.value)"></div></div></div></div><div class="form-group full"><label class="form-label">Test Codes Required *</label>${renderTestDropdown(row)}</div><div class="sample-coc-flags"><div class="form-group"><label class="form-label">Duplicate</label><label class="toggle-card sample-toggle-card"><input type="checkbox" ${row.isDuplicate ? 'checked' : ''} onchange="updateJobSampleDraftField('${esc(row.draftId)}', 'isDuplicate', this.checked)"><span>Duplicate</span></label></div>${renderCollectionModeControl(row)}</div><div class="form-group full"><label class="form-label">Comments</label><textarea class="form-input" oninput="updateJobSampleDraftField('${esc(row.draftId)}', 'notes', this.value)">${esc(row.notes || '')}</textarea></div></div>` : '';
      return `<div class="sample-draft-row ${expanded ? 'is-expanded' : ''}"><button class="sample-draft-toggle" type="button" onclick="toggleJobSampleDraftExpanded('${esc(row.draftId)}')"><span class="sample-draft-caret">${expanded ? 'v' : '>'}</span><span><strong>${esc(title)}</strong><span>${esc(row.sampleType)} | ${esc(point)}</span></span><span class="sample-draft-test-count">${selectedTests.length} test${selectedTests.length === 1 ? '' : 's'}</span></button>${body}</div>`;
    }).join('')
    : '<div class="empty-state">Set the sample count to add sample rows.</div>';
  const rollupActions = `<div class="sample-rollup-actions"><button class="act-btn" type="button" onclick="openSampleLogisticsImportPicker()">Import CSV</button>${rows.length ? `<button class="act-btn" type="button" onclick="openSampleTableModal()">Edit in Table</button><button class="act-btn" type="button" onclick="setAllJobSampleDraftsExpanded(true)">Expand All</button><button class="act-btn" type="button" onclick="setAllJobSampleDraftsExpanded(false)">Collapse All</button>` : ''}</div>`;
  return `<div class="sample-logistics-editor"><div class="assignment-head"><div><h4>Sample Logistics</h4><div class="section-copy">${esc(getJobTypeDisplayName(modalState.formData.jobType))}</div></div><div class="form-group sample-count-field"><label class="form-label">Sample Count</label><select class="form-input" onchange="updateJobSampleCount(this.value)"><option value="">Select...</option>${sampleCountOptions.map((option) => `<option value="${option}" ${Number(modalState.formData.sampleCount || 0) === option ? 'selected' : ''}>${option}</option>`).join('')}</select></div></div>${renderSampleSummary()}${rollupActions}<div class="sample-draft-list">${sampleRows}</div></div>`;
}

function renderJobPartsEditor(){
  if(modalState.entity !== 'jobs' || !jobTypeHasDetailGroup(modalState.formData.jobType, JOB_PARTS_DETAIL_GROUP)) return '';
  const rows = getModalPartDrafts();
  const totalCost = rows.reduce((sum, row) => {
    const part = getPart(row.partId);
    return sum + (Number(part?.unitCost || 0) * Number(row.quantity || 0));
  }, 0);
  const rowMarkup = rows.length ? rows.map((row) => {
    const part = getPart(row.partId);
    const available = getPartAvailableForJob(row.partId);
    return `<div class="job-part-row">
      <div class="job-part-main">
        <div class="item-title">${esc(part?.partName || 'Unknown part')}</div>
        <div class="muted">${esc(part ? getPartDisplayCode(part) : '')} | Available ${esc(available)} ${esc(part?.unitName || 'Each')}</div>
      </div>
      <div class="form-group job-part-qty">
        <label class="form-label">Qty</label>
        <input class="form-input" type="number" min="1" step="1" value="${esc(row.quantity || 1)}" oninput="updateJobPartDraftField('${esc(row.draftId)}', 'quantity', this.value)">
      </div>
      <div class="form-group job-part-notes">
        <label class="form-label">Notes</label>
        <input class="form-input" type="text" value="${esc(row.notes || '')}" oninput="updateJobPartDraftField('${esc(row.draftId)}', 'notes', this.value)">
      </div>
      <div class="job-part-actions">
        <button class="act-btn danger" type="button" onclick="removeJobPartDraft('${esc(row.draftId)}')">Remove</button>
      </div>
    </div>`;
  }).join('') : '<div class="empty-state">No parts added to this job.</div>';
  return `<div class="job-parts-editor">
    <div class="assignment-head">
      <div>
        <h4>Job Parts</h4>
        <div class="section-copy">Parts deduct from Field Ops inventory when the job is saved.</div>
      </div>
      <div class="table-actions">
        <span class="tag-chip">${esc(rows.length)} part${rows.length === 1 ? '' : 's'}</span>
        <span class="tag-chip">${esc(fmtCurrency(totalCost))}</span>
        <button class="add-btn" type="button" onclick="openJobPartPicker()">Add Parts</button>
      </div>
    </div>
    <div class="job-part-list">${rowMarkup}</div>
  </div>`;
}

function getPartPickerRows(){
  const query = String(state.filters.partPickerSearch || '').trim().toLowerCase();
  const selectedIds = new Set(getModalPartDrafts().map((row) => row.partId));
  return state.data.parts
    .filter((part) => part.isActive !== false)
    .filter((part) => {
      if(!query) return true;
      return [part.partName, part.partNumber, part.vendorPartNumber, part.category, part.storageLocation].some((value) => String(value || '').toLowerCase().includes(query));
    })
    .sort((a, b) => Number(selectedIds.has(b.id)) - Number(selectedIds.has(a.id)) || getEntitySorter('parts')(a, b));
}

function renderJobPartPickerModal(){
  const overlay = document.getElementById('job-part-modal-overlay');
  if(!overlay) return;
  if(!state.partPickerOpen || !modalState.open || modalState.entity !== 'jobs'){
    overlay.classList.remove('open');
    return;
  }
  overlay.classList.add('open');
  const selectedIds = new Set(getModalPartDrafts().map((row) => row.partId));
  const rows = getPartPickerRows();
  document.getElementById('job-part-modal-body').innerHTML = `
    <div class="toolbar simple-toolbar job-part-picker-toolbar">
      <div class="toolbar-summary">Choose parts to attach to this job draft.</div>
      <input type="text" value="${esc(state.filters.partPickerSearch)}" placeholder="Search parts..." oninput="setPartPickerFilter(this.value)">
    </div>
    <div class="part-picker-list">
      ${rows.length ? rows.map((part) => {
        const selected = selectedIds.has(part.id);
        const available = getPartAvailableForJob(part.id);
        const disabled = !selected && available <= 0;
        return `<div class="part-picker-row ${selected ? 'selected' : ''}">
          <div>
            <div class="item-title">${esc(part.partName || 'Unnamed part')}</div>
            <div class="muted">${esc(getPartDisplayCode(part))} | ${esc(part.category || 'Uncategorized')} | ${esc(part.storageLocation || 'No location')}</div>
            <div class="mini-tags">${getPartStatusBadge(part)}<span class="tag-chip">${esc(renderPartQuantity(part.onHandQuantity, part.unitName))}</span><span class="tag-chip">${esc(fmtCurrency(part.unitCost))}</span></div>
          </div>
          <button class="add-btn" type="button" onclick="addJobPartDraft('${esc(part.id)}')" ${disabled ? 'disabled' : ''}>${selected ? 'Add Another' : 'Add'}</button>
        </div>`;
      }).join('') : '<div class="empty-state">No active parts match that search.</div>'}
    </div>
  `;
}

function renderTechnicianTravelEditor(){
  const technicianField = { key:'technicianId', label:'Technician', type:'select', options:() => buildTechnicianOptions('', modalState.formData.technicianId), required:true };
  const startFields = [
    { key:'arrivalAt', label:'Travel Start', type:'datetime-local' },
    { key:'originType', label:'Origin Type', type:'select', options:TRAVEL_LOCATION_TYPE_OPTIONS, handler:'changeTravelOriginType' },
    { key:'originSplSiteId', label:'Origin SPL Site', type:'select', options:() => buildSplSiteOptions(modalState.formData.originSplSiteId), travelLocationTypeKey:'originType', travelLocationTypeValue:'spl_site' },
    { key:'originClientSiteId', label:'Origin Client Site', type:'select', options:() => buildTravelClientSiteOptions(modalState.formData.originClientSiteId), travelLocationTypeKey:'originType', travelLocationTypeValue:'client_site' },
    { key:'originLabel', label:'Origin Name', type:'text', travelLocationTypeKey:'originType', travelLocationTypeValue:'other' },
    { key:'originLocation', label:'Origin Location', type:'text', full:true, travelLocationTypeKey:'originType', travelLocationTypeValue:'other' }
  ];
  const endFields = [
    { key:'departureAt', label:'Travel End', type:'datetime-local' },
    { key:'destinationType', label:'Destination Type', type:'select', options:TRAVEL_LOCATION_TYPE_OPTIONS, handler:'changeTravelDestinationType' },
    { key:'destinationSplSiteId', label:'Destination SPL Site', type:'select', options:() => buildSplSiteOptions(modalState.formData.destinationSplSiteId), travelLocationTypeKey:'destinationType', travelLocationTypeValue:'spl_site' },
    { key:'destinationClientSiteId', label:'Destination Client Site', type:'select', options:() => buildTravelClientSiteOptions(modalState.formData.destinationClientSiteId), travelLocationTypeKey:'destinationType', travelLocationTypeValue:'client_site' },
    { key:'destinationLabel', label:'Destination Name', type:'text', travelLocationTypeKey:'destinationType', travelLocationTypeValue:'other' },
    { key:'destinationLocation', label:'Destination Location', type:'text', full:true, travelLocationTypeKey:'destinationType', travelLocationTypeValue:'other' }
  ];
  return `
    <div class="form-grid travel-editor-grid">
      <div class="form-section"><h4>Technician Travel</h4></div>
      ${renderFormField(technicianField)}
      <div class="travel-modal-grid">
        <div class="travel-modal-panel">
          <div class="travel-modal-panel-title">Travel Start</div>
          ${startFields.map((field) => renderFormField(field)).join('')}
        </div>
        <div class="travel-modal-panel">
          <div class="travel-modal-panel-title">Travel End</div>
          ${endFields.map((field) => renderFormField(field)).join('')}
        </div>
      </div>
      ${renderFormField({ key:'notes', label:'Notes', type:'textarea', full:true })}
    </div>
  `;
}

function renderModal(){
  const overlay = document.getElementById('entity-modal-overlay');
  if(!overlay) return;
  if(!modalState.open){ overlay.classList.remove('open'); return; }
  overlay.classList.add('open');
  const modalTitle = modalState.entity === 'billingRates' ? 'Edit Rate Schedule' : `${modalState.id ? 'Edit' : 'Add'} ${ENTITY_CONFIG[modalState.entity].label}`;
  document.getElementById('entity-modal-title').textContent = modalTitle;
  document.getElementById('entity-modal-delete').style.display = modalState.id && modalState.entity !== 'billingRates' ? '' : 'none';
  document.getElementById('entity-modal-duplicate').style.display = modalState.entity === 'jobs' && modalState.id ? '' : 'none';
  const bodyMarkup = modalState.entity === 'billingRates'
    ? renderBillingRateScheduleEditor()
    : modalState.entity === 'technicianTravel'
      ? renderTechnicianTravelEditor()
      : `<div class="form-grid">${(FORM_DEFINITIONS[modalState.entity] || []).map((field) => renderFormField(field)).join('')}</div>${modalState.entity === 'jobs' ? `${renderJobSampleLogisticsEditor()}${renderJobPartsEditor()}${renderAssignmentEditor()}${renderSalesforceCaseEditor()}` : ''}`;
  document.getElementById('entity-modal-body').innerHTML = bodyMarkup;
  hydrateAssetPhotoPreviews(document.getElementById('entity-modal-body'));
}

function openSharedSiteEditor(siteId = ''){
  const existing = siteId ? getSite(siteId) : null;
  let clientId = existing?.clientId || '';
  if(!clientId && existing?.projectId){
    const project = getProject(existing.projectId);
    if(project) clientId = project.clientId;
  }
  if(!clientId && state.activeView === 'directory') clientId = getActiveDirectoryClientId();
  if(!clientId && state.filters.directoryClient !== 'all') clientId = state.filters.directoryClient;
  window.SiteEditor.open({
    siteId,
    clientId,
    data:state.data,
    getProjectsForClient:(targetClientId) => state.data.projects.filter((project) => project.clientId === String(targetClientId || '')).sort(getEntitySorter('projects')),
    getProjectIdsForSite,
    getContactsForSite,
    getSiteTypeOptions:(currentValue = '') => buildSiteTypeOptions(currentValue),
    getSiteTypeDefaultJobTypes:(siteType) => getDefaultJobTypeLabelsForSiteType(siteType),
    resolveSiteTypeValue:(siteType) => resolveSiteTypeValue(state.data.siteTypes, siteType),
    getSiteTypeDisplayName,
    getActiveJobTypes,
    saveSite:async (record) => {
      state.saveInFlight = true;
      showSaveStatus('saving', 'SAVING');
      try {
        if(isRemoteMode()){
          const savedSiteId = await saveRemoteSiteRecord(record);
          await loadData({ silent:true, force:true });
          return savedSiteId;
        }
        return saveLocalSiteRecord(record);
      } finally {
        state.saveInFlight = false;
      }
    },
    deleteSite:async (id) => deleteEntityRecord('sites', id),
    afterSave:async () => {
      hideSaveStatusSoon();
    },
    showStatus:showSaveStatus
  });
}

function openEntityModal(entityKey, id = '', options = {}){
  if(entityKey === 'employees'){
    window.location.href = 'employees.html';
    return;
  }
  if(entityKey === 'sites' && window.SiteEditor && (id || state.activeView === 'directory' || state.filters.directoryClient !== 'all')){
    openSharedSiteEditor(id);
    return;
  }
  const directoryClientId = state.activeView === 'directory' ? getActiveDirectoryClientId() : (state.filters.directoryClient !== 'all' ? state.filters.directoryClient : '');
  if(entityKey === 'billingProfiles' && !id && directoryClientId){
    const existingBillingProfile = getBillingProfileForClient(directoryClientId);
    if(existingBillingProfile) id = existingBillingProfile.id;
  }
  const existing = id ? state.data[entityKey].find((row) => row.id === id) : null;
  let draft = existing ? clone(existing) : getNewRecordDraft(entityKey);
  if(!existing){
    const defaultClientId = options.clientId || directoryClientId;
    if(['projects', 'contacts', 'billingProfiles', 'sites', 'jobs'].includes(entityKey) && defaultClientId) draft.clientId = defaultClientId;
  }
  if(entityKey === 'sites' && draft.projectId && !draft.clientId){
    const project = getProject(draft.projectId);
    if(project) draft.clientId = project.clientId;
  }
  if(entityKey === 'sites'){
    draft.projectIds = normalizeStringArray(draft.projectIds).length ? normalizeStringArray(draft.projectIds) : normalizeStringArray(draft.projectId);
    draft.siteType = resolveSiteTypeValue(state.data.siteTypes, draft.siteType);
  }
  if(entityKey === 'contacts'){
    const parsedName = splitContactName(draft.contactName);
    if(!draft.contactFirstName) draft.contactFirstName = parsedName.first;
    if(!draft.contactLastName) draft.contactLastName = parsedName.last;
    draft.contactName = buildContactName(draft.contactFirstName, draft.contactLastName, draft.contactName);
    draft.projectIds = normalizeStringArray(draft.projectIds).length ? normalizeStringArray(draft.projectIds) : getProjectIdsForContact(draft.id);
    draft.siteIds = normalizeStringArray(draft.siteIds).length ? normalizeStringArray(draft.siteIds) : getSiteIdsForContact(draft.id);
    draft.projectId = draft.projectIds[0] || '';
    draft.siteId = draft.siteIds[0] || '';
  }
  if(entityKey === 'siteTypes'){
    draft.siteTypeKey = normalizeSiteTypeKey(draft.siteTypeKey || draft.siteTypeName);
    draft.siteTypeStatus = draft.isActive ? 'active' : 'inactive';
    draft.defaultJobTypes = draft.siteTypeKey ? getDefaultJobTypeKeysForSiteType(draft.siteTypeKey) : [];
  }
  if(entityKey === 'jobTypes'){
    draft.jobTypeKey = normalizeJobTypeKey(draft.jobTypeKey || draft.jobTypeName);
    draft.jobTypeStatus = draft.isActive ? 'active' : 'inactive';
    draft.jobTypeColor = normalizeHexColor(draft.jobTypeColor, getDefaultJobTypeColor(draft.jobTypeKey));
    draft.detailGroups = normalizeJobTypeDetailGroups(draft.detailGroups);
  }
  if(entityKey === 'jobs' && draft.projectId && !draft.clientId){
    const project = getProject(draft.projectId);
    if(project) draft.clientId = project.clientId;
  }
  if(entityKey === 'jobs'){
    draft.siteIds = normalizeStringArray(draft.siteIds).length ? normalizeStringArray(draft.siteIds) : getJobSiteIds(draft);
    if(!jobTypeAllowsMultipleSites(draft.jobType)) draft.siteIds = normalizeStringArray(draft.siteId);
  }
  if(entityKey === 'jobs' && !existing && options.scheduleDate){
    const scheduleDate = toInputDate(parseDateOnly(options.scheduleDate));
    if(scheduleDate){
      draft.requestedDate = scheduleDate;
      draft.scheduledStart = `${scheduleDate}T08:00`;
      draft.scheduledEnd = `${scheduleDate}T09:00`;
    }
  }
  if(entityKey === 'technicianTravel'){
    if(!draft.originSplSiteId && draft.originType === 'spl_site') draft.originSplSiteId = getDefaultSplSiteId();
    if(!draft.destinationSplSiteId && draft.destinationType === 'spl_site') draft.destinationSplSiteId = getDefaultSplSiteId();
    if(!existing){
      const scheduleDate = toInputDate(parseDateOnly(options.scheduleDate || state.scheduleAnchorDate || todayISO()));
      draft.arrivalAt = draft.arrivalAt || `${scheduleDate || todayISO()}T08:00`;
      draft.departureAt = draft.departureAt || `${scheduleDate || todayISO()}T17:00`;
      draft.originSplSiteId = draft.originSplSiteId || getDefaultSplSiteId();
      if(options.direction) draft.direction = options.direction;
      if(draft.direction === 'Inbound'){
        draft.originType = draft.originType === 'spl_site' ? 'client_site' : draft.originType;
        draft.originSplSiteId = '';
        draft.destinationType = 'spl_site';
        draft.destinationSplSiteId = draft.destinationSplSiteId || getDefaultSplSiteId();
      }
      if(draft.direction === 'Outbound'){
        draft.originType = 'spl_site';
        draft.originSplSiteId = draft.originSplSiteId || getDefaultSplSiteId();
        draft.destinationType = draft.destinationType === 'spl_site' ? 'client_site' : draft.destinationType;
        draft.destinationSplSiteId = '';
      }
      draft = normalizeTravelDraftForSave(draft);
    }
  }
  if(entityKey === 'jobs'){
    initializeJobSampleDrafts(draft, existing?.id || '');
    initializeJobPartDrafts(draft, existing?.id || '');
  }
  modalState = { ...createClosedModalState(), open:true, entity:entityKey, id:existing?.id || '', formData:draft, assignments:entityKey === 'jobs' ? (existing ? getAssignmentsForJob(existing.id).map((row) => clone(row)) : []) : [], openMultiSelectKey:'' };
  if(entityKey === 'equipment' && !existing) syncEquipmentAssignmentSummary();
  setEntityModalBaseline();
  renderModal();
}

function openClientBillingProfile(clientId){
  const existing = getBillingProfileForClient(clientId);
  if(existing) openEntityModal('billingProfiles', existing.id);
  else openEntityModal('billingProfiles', '', { clientId });
}

function openBillingRatesModal(profileId){
  const profile = getBillingProfile(profileId);
  if(!profile){ alert('Create a billing profile before editing rates.'); return; }
  modalState = { ...createClosedModalState(), open:true, entity:'billingRates', id:profile.id, formData:{ billingProfileId:profile.id, clientId:profile.clientId, priceDrafts:buildBillingPriceDrafts(profile.id) }, openMultiSelectKey:'' };
  setEntityModalBaseline();
  renderModal();
}
function openPartCatalogModal(catalogType){
  openEntityModal('partCatalogs');
  modalState.formData.catalogType = FIELD_PART_CATALOG_TYPES.some((type) => type.value === catalogType) ? catalogType : 'category';
  const sameTypeRows = state.data.partCatalogs.filter((row) => row.catalogType === modalState.formData.catalogType);
  const maxSortOrder = sameTypeRows.reduce((max, row) => Math.max(max, Number(row.sortOrder || 0)), 0);
  modalState.formData.sortOrder = maxSortOrder + 10;
  setEntityModalBaseline();
  renderModal();
}

function getEntityModalDirtySnapshot(){
  if(!modalState.open) return '';
  return JSON.stringify({
    entity:modalState.entity,
    id:modalState.id,
    formData:modalState.formData || {},
    assignments:modalState.assignments || []
  });
}

function setEntityModalBaseline(){ modalState.baselineSnapshot = getEntityModalDirtySnapshot(); }

function isEntityModalDirty(){
  return !!(modalState.open && modalState.baselineSnapshot && getEntityModalDirtySnapshot() !== modalState.baselineSnapshot);
}

function closeEntityModal(options = {}){
  if(!options.force && isEntityModalDirty() && !window.confirm('Discard unsaved changes?')) return false;
  state.partPickerOpen = false;
  renderJobPartPickerModal();
  state.sampleTableModalOpen = false;
  renderSampleTableModal();
  modalState = createClosedModalState();
  renderModal();
  return true;
}
function setModalField(key, value, mode = 'text'){ if(modalState.open) modalState.formData[key] = mode === 'number' ? normalizeNumber(value) : value; }
function toggleModalField(key, checked){ if(modalState.open) modalState.formData[key] = !!checked; }
function applyTravelTypeDefaults(prefix, type){
  if(!modalState.open || modalState.entity !== 'technicianTravel') return;
  modalState.formData[`${prefix}Type`] = type;
  if(type === 'spl_site'){
    modalState.formData[`${prefix}SplSiteId`] = modalState.formData[`${prefix}SplSiteId`] || getDefaultSplSiteId();
    modalState.formData[`${prefix}ClientSiteId`] = '';
    modalState.formData[`${prefix}Label`] = '';
    modalState.formData[`${prefix}Location`] = '';
  } else if(type === 'client_site'){
    modalState.formData[`${prefix}SplSiteId`] = '';
    modalState.formData[`${prefix}Label`] = '';
    modalState.formData[`${prefix}Location`] = '';
  } else {
    modalState.formData[`${prefix}SplSiteId`] = '';
    modalState.formData[`${prefix}ClientSiteId`] = '';
  }
}
function changeTravelDirection(value){
  if(!modalState.open) return;
  modalState.formData.direction = TRAVEL_DIRECTION_OPTIONS.includes(value) ? value : 'Outbound';
  if(modalState.formData.direction === 'Inbound'){
    applyTravelTypeDefaults('destination', 'spl_site');
    if(modalState.formData.originType === 'spl_site') applyTravelTypeDefaults('origin', modalState.formData.originClientSiteId ? 'client_site' : 'other');
  } else {
    applyTravelTypeDefaults('origin', 'spl_site');
    if(modalState.formData.destinationType === 'spl_site') applyTravelTypeDefaults('destination', modalState.formData.destinationClientSiteId ? 'client_site' : 'other');
  }
  renderModal();
}
function changeTravelOriginType(value){ applyTravelTypeDefaults('origin', value); renderModal(); }
function changeTravelDestinationType(value){ applyTravelTypeDefaults('destination', value); renderModal(); }
function setJobTypeColor(value){
  if(!modalState.open) return;
  const key = normalizeJobTypeKey(modalState.formData.jobTypeKey || modalState.formData.jobTypeName);
  modalState.formData.jobTypeColor = normalizeHexColor(value, getDefaultJobTypeColor(key));
  renderModal();
}

function buildDuplicatedJobDraft(source){
  return normalizeRecord('jobs', {
    ...source,
    id:'',
    fieldfxTicketId:'',
    salesforceCaseId:'',
    salesforceCaseNumber:'',
    salesforceCaseUrl:'',
    salesforceSyncedAt:'',
    salesforceSyncStatus:'',
    salesforceSyncError:'',
    noTicketRequired:false,
    actualStart:'',
    actualEnd:'',
    durationActual:null,
    completionNotes:'',
    followUpRequired:false,
    followUpNotes:'',
    createdAt:'',
    updatedAt:''
  }, { fromRemote:false });
}

function buildDuplicatedJobAssignmentDrafts(assignments){
  return assignments
    .filter((assignment) => assignment.assignmentType || assignment.resourceId)
    .map((assignment) => normalizeRecord('jobAssignments', {
      ...assignment,
      id:uid(ENTITY_CONFIG.jobAssignments.idPrefix),
      jobId:'',
      createdAt:'',
      updatedAt:''
    }, { fromRemote:false }));
}

function duplicateCurrentModalJob(){
  if(!modalState.open || modalState.entity !== 'jobs') return;
  modalState = {
    ...createClosedModalState(),
    open:true,
    entity:'jobs',
    id:'',
    formData:buildDuplicatedJobDraft(modalState.formData),
    assignments:buildDuplicatedJobAssignmentDrafts(modalState.assignments)
  };
  setEntityModalBaseline();
  renderModal();
}

function changeSiteClient(value){
  modalState.formData.clientId = value;
  modalState.formData.projectIds = normalizeStringArray(modalState.formData.projectIds).filter((projectId) => getProject(projectId)?.clientId === value);
  modalState.formData.projectId = modalState.formData.projectIds[0] || '';
  renderModal();
}
function changeContactClient(value){
  modalState.formData.clientId = value;
  modalState.formData.projectIds = normalizeStringArray(modalState.formData.projectIds).filter((projectId) => getProject(projectId)?.clientId === value);
  modalState.formData.siteIds = normalizeStringArray(modalState.formData.siteIds).filter((siteId) => getSite(siteId)?.clientId === value);
  const manager = getContact(modalState.formData.managerContactId);
  if(manager && manager.clientId !== value) modalState.formData.managerContactId = '';
  modalState.formData.projectId = modalState.formData.projectIds[0] || '';
  modalState.formData.siteId = modalState.formData.siteIds[0] || '';
  renderModal();
}
function changeContactProject(value){
  modalState.formData.projectId = value;
  const project = getProject(value);
  if(project) modalState.formData.clientId = project.clientId;
  const site = getSite(modalState.formData.siteId);
  if(site && value && !getProjectIdsForSite(site.id).includes(value)) modalState.formData.siteId = '';
  renderModal();
}
function changeBillingClient(value){
  modalState.formData.clientId = value;
  modalState.formData.projectId = '';
  const billingContact = getContact(modalState.formData.billingContactId);
  if(billingContact && billingContact.clientId !== value) modalState.formData.billingContactId = '';
  renderModal();
}
function changeBillingProject(value){
  modalState.formData.projectId = '';
  renderModal();
}
function normalizeModalJobSiteIds(){
  if(!modalState.open || modalState.entity !== 'jobs') return;
  const primarySiteId = String(modalState.formData.siteId || '').trim();
  const clientId = String(modalState.formData.clientId || '').trim();
  const next = normalizeStringArray([primarySiteId, ...normalizeStringArray(modalState.formData.siteIds)])
    .filter((siteId) => {
      const site = getSite(siteId);
      return !!site && (!clientId || site.clientId === clientId);
    });
  if(jobTypeAllowsMultipleSites(modalState.formData.jobType)){
    modalState.formData.siteIds = next;
    modalState.formData.siteId = next[0] || '';
  } else {
    modalState.formData.siteIds = normalizeStringArray(primarySiteId);
  }
}
function normalizeModalSampleSiteIds(){
  if(!modalState.open || modalState.entity !== 'jobs') return;
  const allowedSiteIds = getNormalizedJobSiteIds(modalState.formData);
  const fallbackSiteId = modalState.formData.siteId || allowedSiteIds[0] || '';
  getModalSampleDrafts().forEach((sample) => {
    if(!allowedSiteIds.includes(sample.siteId)) sample.siteId = fallbackSiteId;
  });
}
function changeJobClient(value){
  modalState.formData.clientId = value;
  const project = getProject(modalState.formData.projectId);
  if(project && project.clientId !== value) modalState.formData.projectId = '';
  const site = getSite(modalState.formData.siteId);
  if(site && site.clientId !== value) modalState.formData.siteId = '';
  modalState.formData.siteIds = normalizeStringArray(modalState.formData.siteIds).filter((siteId) => getSite(siteId)?.clientId === value);
  if(jobTypeAllowsMultipleSites(modalState.formData.jobType) && !modalState.formData.siteId) modalState.formData.siteId = modalState.formData.siteIds[0] || '';
  if(modalState.formData.siteId || jobTypeAllowsMultipleSites(modalState.formData.jobType)){
    const projectOptions = buildModalJobProjectOptions();
    if(projectOptions.length === 1) modalState.formData.projectId = projectOptions[0].value;
    else if(!projectOptions.some((option) => option.value === modalState.formData.projectId)) modalState.formData.projectId = '';
  }
  normalizeModalJobSiteIds();
  normalizeModalSampleSiteIds();
  renderModal();
}
function changeJobSite(value){
  modalState.formData.siteId = value;
  const site = getSite(value);
  if(site) modalState.formData.clientId = site.clientId;
  normalizeModalJobSiteIds();
  const projectOptions = buildModalJobProjectOptions();
  if(projectOptions.length === 1) modalState.formData.projectId = projectOptions[0].value;
  else if(!projectOptions.some((option) => option.value === modalState.formData.projectId)) modalState.formData.projectId = '';
  normalizeModalSampleSiteIds();
  renderModal();
}
function changeJobProject(value){
  modalState.formData.projectId = value;
  const project = getProject(value);
  if(project) modalState.formData.clientId = project.clientId;
  renderModal();
}
function changeJobType(value){
  modalState.formData.jobType = value;
  if(getJobTypeScheduleMode(value) === 'point_in_time') modalState.formData.scheduledEnd = '';
  normalizeModalJobSiteIds();
  if(modalState.formData.siteId || jobTypeAllowsMultipleSites(modalState.formData.jobType)){
    const projectOptions = buildModalJobProjectOptions();
    if(projectOptions.length === 1) modalState.formData.projectId = projectOptions[0].value;
    else if(!projectOptions.some((option) => option.value === modalState.formData.projectId)) modalState.formData.projectId = '';
  }
  modalState.formData.samplesRequired = jobTypeHasDetailGroup(value, 'sample_logistics');
  if(!modalState.formData.samplesRequired && !Number(modalState.formData.sampleCount || 0)) modalState.formData.sampleDrafts = [];
  normalizeModalSampleSiteIds();
  renderModal();
}
function changeSampleJob(value){ modalState.formData.jobId = value; const job = getJob(value); if(job){ modalState.formData.clientId = job.clientId; modalState.formData.siteId = job.siteId; } renderModal(); }
function changeSampleClient(value){ modalState.formData.clientId = value; const site = getSite(modalState.formData.siteId); if(site && site.clientId !== value) modalState.formData.siteId = ''; renderModal(); }
function changeSampleType(value){
  modalState.formData.sampleType = normalizeSampleTypeForWorkflow(value);
  modalState.formData.testCodes = filterTestCodesForSampleType(modalState.formData.testCodes, modalState.formData.sampleType);
  renderModal();
}
function changeMaintenanceAssetType(value){ modalState.formData.assetType = value; modalState.formData.assetId = ''; renderModal(); }
function changeTruckAssignedTechnician(value){
  modalState.formData.assignedTechnicianId = value;
  const tech = state.data.employees.find((row) => row.id === value) || null;
  modalState.formData.currentDriver = tech ? getEmployeeFullName(tech) : '';
  renderModal();
}
function syncEquipmentAssignmentSummary(){
  const truck = modalState.formData.assignedTruckId ? getTruckLabel(modalState.formData.assignedTruckId) : '';
  const trailer = modalState.formData.assignedTrailerId ? getTrailerLabel(modalState.formData.assignedTrailerId) : '';
  modalState.formData.assignedTrailerTruck = [truck, trailer].filter((value) => value && value !== 'Unassigned').join(' | ');
}
function changeEquipmentAssignedTruck(value){
  modalState.formData.assignedTruckId = value;
  syncEquipmentAssignmentSummary();
  renderModal();
}
function changeEquipmentAssignedTrailer(value){
  modalState.formData.assignedTrailerId = value;
  syncEquipmentAssignmentSummary();
  renderModal();
}

function addAssignmentRow(){ modalState.assignments.push(normalizeRecord('jobAssignments', { id:uid(ENTITY_CONFIG.jobAssignments.idPrefix), assignmentType:'Technician', resourceId:'' })); renderModal(); }
function removeAssignmentRow(id){ modalState.assignments = modalState.assignments.filter((row) => row.id !== id); renderModal(); }
function updateModalAssignmentField(id, key, value){
  const row = modalState.assignments.find((item) => item.id === id);
  if(!row) return;
  row[key] = value;
  if(key === 'assignmentType'){
    row.resourceId = '';
    renderModal();
    return;
  }
  if(key === 'resourceId' && row.assignmentType === 'Technician' && value){
    const currentTruck = getModalTruckAssignment();
    if(!currentTruck) applyTechnicianDefaultTruck(value, false);
    else renderModal();
    return;
  }
  if(key === 'resourceId'){
    renderModal();
    return;
  }
}

function validateModal(){
  const entityKey = modalState.entity;
  const formData = modalState.formData;
  if(entityKey === 'clients'){
    if(!String(formData.clientName || '').trim()) return 'Client name is required.';
    if(!normalizeClientCode(formData.clientCode)) return 'Client code is required.';
    const duplicateClient = state.data.clients.find((row) => row.id !== modalState.id && normalizeClientCode(row.clientCode) === normalizeClientCode(formData.clientCode));
    if(duplicateClient) return `Client code ${normalizeClientCode(formData.clientCode)} is already in use by ${duplicateClient.clientName || 'another client'}.`;
  }
  if(entityKey === 'projects'){
    if(!String(formData.clientId || '').trim()) return 'Client is required.';
    if(!String(formData.projectName || '').trim()) return 'Project name is required.';
  }
  if(entityKey === 'contacts'){
    if(!String(formData.clientId || '').trim()) return 'Client is required.';
    if(!String(formData.contactFirstName || '').trim() && !String(formData.contactLastName || '').trim()) return 'First or last name is required.';
    const invalidProject = normalizeStringArray(formData.projectIds).find((projectId) => getProject(projectId)?.clientId !== formData.clientId);
    if(invalidProject) return 'Each linked project must belong to the selected client.';
    const invalidSite = normalizeStringArray(formData.siteIds).find((siteId) => getSite(siteId)?.clientId !== formData.clientId);
    if(invalidSite) return 'Each linked site/location must belong to the selected client.';
    const manager = getContact(formData.managerContactId);
    if(manager && manager.clientId !== formData.clientId) return 'The manager contact must belong to the selected client.';
    if(modalState.id && formData.managerContactId && formData.managerContactId === modalState.id) return 'A contact cannot report to themselves.';
    if(modalState.id && formData.managerContactId && getContactDescendantIds(modalState.id).has(formData.managerContactId)) return 'A contact cannot report to someone below them in the hierarchy.';
    if(modalState.id){
      const reportWithDifferentClient = state.data.contacts.find((row) => row.managerContactId === modalState.id && row.clientId !== formData.clientId);
      if(reportWithDifferentClient) return 'Existing report contacts must belong to the same client.';
    }
  }
  if(entityKey === 'billingProfiles'){
    if(!String(formData.clientId || '').trim()) return 'Client is required.';
    if(!String(formData.billingName || '').trim()) return 'Billing name is required.';
    const duplicateProfile = state.data.billingProfiles.find((row) => row.id !== modalState.id && row.clientId === formData.clientId);
    if(duplicateProfile) return 'Each client can only have one billing profile.';
    const billingContact = getContact(formData.billingContactId);
    if(billingContact && billingContact.clientId !== formData.clientId) return 'Billing contact must belong to the selected client.';
  }
  if(entityKey === 'billingRates'){
    const invalidRate = (Array.isArray(formData.priceDrafts) ? formData.priceDrafts : []).find((row) => normalizeNumber(row.rateAmount) !== null && Number(row.rateAmount) < 0);
    if(invalidRate) return 'Billing profile rates cannot be negative.';
  }
  if(entityKey === 'sites'){
    if(!String(formData.clientId || '').trim()) return 'Client is required.';
    const projectIds = normalizeStringArray(formData.projectIds);
    if(!projectIds.length) return 'At least one linked project is required.';
    if(!String(formData.siteName || '').trim()) return 'Site / location name is required.';
    const invalidProject = projectIds.find((projectId) => getProject(projectId)?.clientId !== formData.clientId);
    if(invalidProject) return 'Each linked project must belong to the selected client.';
  }
  if(entityKey === 'jobs'){
    if(!String(formData.clientId || '').trim()) return 'Client is required.';
    if(!String(formData.projectId || '').trim()) return 'Project is required.';
    if(!String(formData.siteId || '').trim()) return 'Site / location is required.';
    if(!String(formData.jobType || '').trim()) return 'Job type is required.';
    const project = getProject(formData.projectId);
    if(project && project.clientId !== formData.clientId) return 'The selected project does not belong to the selected client.';
    const site = getSite(formData.siteId);
    if(site && site.clientId !== formData.clientId) return 'The selected site/location does not belong to the selected client.';
    if(site && !jobTypeAllowsMultipleSites(formData.jobType) && !getProjectIdsForSite(site.id).includes(formData.projectId)) return 'The selected project is not linked to the selected site/location.';
    const jobSiteIds = getNormalizedJobSiteIds(formData);
    if(!jobSiteIds.length) return 'At least one job site/location is required.';
    const invalidJobSite = jobSiteIds.find((siteId) => getSite(siteId)?.clientId !== formData.clientId);
    if(invalidJobSite) return 'Each job site/location must belong to the selected client.';
    const assignmentKeys = new Set();
    for(const assignment of modalState.assignments){
      if((assignment.assignmentType && !assignment.resourceId) || (!assignment.assignmentType && assignment.resourceId)) return 'Each assignment row must include both a type and a resource.';
      if(!assignment.resourceId) continue;
      const key = `${assignment.assignmentType}:${assignment.resourceId}`;
      if(assignmentKeys.has(key)) return 'The same resource cannot be assigned twice on the same job.';
      assignmentKeys.add(key);
    }
    const missing = getJobMissingRequirements({ ...formData, id:modalState.id || 'draft' }, modalState.assignments);
    if(missing.length) return `This ${formData.jobType} job still needs: ${missing.join(', ')}.`;
    const scheduleIssue = findJobScheduleIssue(formData, modalState.assignments);
    if(scheduleIssue?.type === 'blockingTravel') return `${getTechnicianLabel(scheduleIssue.technicianId)} is blocked by travel away from Pittsburgh from ${fmtDateTime(scheduleIssue.travel.arrivalAt)} to ${fmtDateTime(scheduleIssue.travel.departureAt)}.`;
    if(scheduleIssue?.type === 'missingPittsburghTravel') return `${getTechnicianLabel(scheduleIssue.technicianId)} must have Pittsburgh travel covering this job before scheduling.`;
    if(jobTypeHasDetailGroup(formData.jobType, 'sample_logistics')){
      const sampleCount = Number(formData.sampleCount || 0);
      const sampleDrafts = Array.isArray(formData.sampleDrafts) ? formData.sampleDrafts : [];
      if(sampleCount > 0){
        if(sampleDrafts.length !== sampleCount) return 'Each required sample needs a sample row.';
        for(let index = 0; index < sampleDrafts.length; index += 1){
          const sample = sampleDrafts[index];
          if(!String(sample.sampleName || '').trim()) return `Sample ${index + 1} needs a Sample ID.`;
          if(!jobSiteIds.includes(sample.siteId || formData.siteId)) return `Sample ${index + 1} needs a valid job site.`;
          if(!['Gas', 'Liquid'].includes(sample.sampleType)) return `Sample ${index + 1} needs a Gas or Liquid sample type.`;
          if(!String(sample.cylinderNumber || '').trim()) return `Sample ${index + 1} needs a cylinder number.`;
          if(!normalizeStringArray(sample.testCodes).length) return `Sample ${index + 1} needs at least one test.`;
        }
      }
    }
    if(jobTypeHasDetailGroup(formData.jobType, JOB_PARTS_DETAIL_GROUP)){
      const partValidationMessage = validateJobPartDraftsForSave(formData, modalState.id || '');
      if(partValidationMessage) return partValidationMessage;
    }
  }
  if(entityKey === 'jobTypes'){
    if(!String(formData.jobTypeName || '').trim()) return 'Job type name is required.';
    const nextKey = normalizeJobTypeKey(formData.jobTypeKey || formData.jobTypeName);
    if(!nextKey) return 'Job type name is required.';
    const duplicate = state.data.jobTypes.find((row) => row.id !== modalState.id && normalizeJobTypeKey(row.jobTypeKey) === nextKey);
    if(duplicate) return 'A job type with this name already exists.';
  }
  if(entityKey === 'siteTypes'){
    if(!String(formData.siteTypeName || '').trim()) return 'Site type name is required.';
    const nextKey = normalizeSiteTypeKey(formData.siteTypeKey || formData.siteTypeName);
    if(!nextKey) return 'Site type name is required.';
    const duplicate = state.data.siteTypes.find((row) => row.id !== modalState.id && normalizeSiteTypeKey(row.siteTypeKey) === nextKey);
    if(duplicate) return 'A site type with this name already exists.';
  }
  if(entityKey === 'partCatalogs'){
    if(!FIELD_PART_CATALOG_TYPES.some((type) => type.value === formData.catalogType)) return 'List type is required.';
    const nextValue = String(formData.catalogValue || '').trim();
    if(!nextValue) return 'List value is required.';
    const duplicate = state.data.partCatalogs.find((row) => row.id !== modalState.id && row.catalogType === formData.catalogType && String(row.catalogValue || '').trim().toLowerCase() === nextValue.toLowerCase());
    if(duplicate) return `${getPartCatalogTypeLabel(formData.catalogType)} "${nextValue}" already exists.`;
  }
  if(entityKey === 'employees'){
    if(!String(formData.employeeFirstName || '').trim() && !String(formData.employeeLastName || '').trim()) return 'First or last name is required.';
    if(!String(formData.homeSplSite || '').trim()) return 'Home SPL Site is required.';
  }
  if(entityKey === 'splSites'){
    if(!String(formData.siteName || '').trim()) return 'SPL site name is required.';
    if(!String(formData.siteCode || '').trim()) return 'SPL site code is required.';
    const duplicate = state.data.splSites.find((row) => row.id !== modalState.id && normalizeClientCode(row.siteCode) === normalizeClientCode(formData.siteCode));
    if(duplicate) return `SPL site code ${normalizeClientCode(formData.siteCode)} is already in use.`;
  }
  if(entityKey === 'technicianTravel'){
    if(!String(formData.technicianId || '').trim()) return 'Technician is required.';
    const arrival = parseDateTime(formData.arrivalAt);
    const departure = parseDateTime(formData.departureAt);
    if(!arrival) return 'Travel Start date/time is required.';
    if(!departure) return 'Travel End date/time is required.';
    if(departure <= arrival) return 'Travel End must be after Travel Start.';
    if(formData.originType === 'spl_site' && !formData.originSplSiteId) return 'Origin SPL site is required.';
    if(formData.originType === 'client_site' && !formData.originClientSiteId) return 'Origin client site is required.';
    if(formData.originType === 'other' && !String(formData.originLabel || '').trim()) return 'Origin name is required for other locations.';
    if(formData.destinationType === 'spl_site' && !formData.destinationSplSiteId) return 'Destination SPL site is required.';
    if(formData.destinationType === 'client_site' && !formData.destinationClientSiteId) return 'Destination client site is required.';
    if(formData.destinationType === 'other' && !String(formData.destinationLabel || '').trim()) return 'Destination name is required for other locations.';
    const normalizedTravel = normalizeTravelDraftForSave(formData);
    const endpointIssue = getTravelEndpointDirectionIssue(normalizedTravel);
    if(endpointIssue) return endpointIssue;
    const conflict = findTravelScheduleConflict(normalizedTravel);
    if(conflict?.type === 'travel') return `This overlaps existing travel for ${getTechnicianLabel(normalizedTravel.technicianId)} from ${fmtDateTime(conflict.travel.arrivalAt)} to ${fmtDateTime(conflict.travel.departureAt)}.`;
    if(conflict?.type === 'blockingTravel') return `This would leave ${getTechnicianLabel(normalizedTravel.technicianId)} blocked by travel during ${getJobDisplayTitle(conflict.job)} at ${getJobScheduleLabel(conflict.job)}.`;
    if(conflict?.type === 'missingPittsburghTravel') return `This would leave ${getTechnicianLabel(normalizedTravel.technicianId)} without Pittsburgh travel covering ${getJobDisplayTitle(conflict.job)} at ${getJobScheduleLabel(conflict.job)}.`;
  }
  if(entityKey === 'trucks' && !String(formData.unitNumber || '').trim()) return 'Truck unit number is required.';
  if(entityKey === 'trailers' && !String(formData.trailerNumber || '').trim()) return 'Trailer number is required.';
  if(entityKey === 'equipment' && !String(formData.equipmentName || '').trim()) return 'Equipment name is required.';
  if(entityKey === 'parts'){
    if(!String(formData.partName || '').trim()) return 'Part name is required.';
    const nextKey = buildFieldPartKey(formData);
    if(!nextKey) return 'Part name or part number is required.';
    if(Number(formData.onHandQuantity || 0) < 0) return 'On-hand quantity cannot be negative.';
    if(Number(formData.reorderPoint || 0) < 0) return 'Reorder point cannot be negative.';
    const duplicateKey = state.data.parts.find((row) => row.id !== modalState.id && row.isActive !== false && formData.isActive !== false && buildFieldPartKey(row).toLowerCase() === nextKey.toLowerCase());
    if(duplicateKey) return 'An active part with this key or number already exists.';
    const partNumber = String(formData.partNumber || '').trim().toLowerCase();
    if(partNumber){
      const duplicateNumber = state.data.parts.find((row) => row.id !== modalState.id && row.isActive !== false && formData.isActive !== false && String(row.partNumber || '').trim().toLowerCase() === partNumber);
      if(duplicateNumber) return 'An active part with this part number already exists.';
    }
  }
  if(entityKey === 'samples'){
    if(!String(formData.jobId || '').trim()) return 'Job is required for a sample.';
    if(!String(formData.clientId || '').trim()) return 'Client is required for a sample.';
    if(!String(formData.siteId || '').trim()) return 'Site / location is required for a sample.';
    if(!String(formData.sampleName || '').trim()) return 'Sample ID is required.';
    if(!['Gas', 'Liquid'].includes(formData.sampleType)) return 'Sample type must be Gas or Liquid.';
    if(!String(formData.cylinderNumber || '').trim()) return 'Cylinder number is required.';
    if(!normalizeStringArray(formData.testCodes).length) return 'At least one test is required for a sample.';
    if(formData.sampleStatus === 'Received by Lab' && !String(formData.linkedWorkOrderId || '').trim()) return 'Use the Samples page to receive and link this sample to a lab work order.';
  }
  if(entityKey === 'maintenanceRecords'){ if(!String(formData.assetType || '').trim()) return 'Asset type is required.'; if(!String(formData.assetId || '').trim()) return 'Asset is required.'; if(!String(formData.maintenanceType || '').trim()) return 'Maintenance type is required.'; if(!String(formData.status || '').trim()) return 'Status is required.'; if(!String(formData.assignedPerson || '').trim()) return 'Assigned person is required.'; }
  return '';
}

async function persistLocal(nextData){ const normalized = await localRepository.write(nextData); state.data = normalized; lastLoadedSnapshot = JSON.stringify(normalized); render(); return normalized; }

function clearTruckTechnicianAssignment(truck){
  return { ...truck, assignedTechnicianId:'', currentDriver:'' };
}

function syncTechnicianDefaultTruckLocal(next, technicianRecord){
  const defaultTruckId = String(technicianRecord.defaultTruckId || '');
  const technicianId = technicianRecord.id;
  const technicianName = getEmployeeFullName(technicianRecord);
  next.trucks = next.trucks.map((truck) => {
    if(defaultTruckId && truck.id === defaultTruckId) return { ...truck, assignedTechnicianId:technicianId, currentDriver:technicianName };
    if(truck.assignedTechnicianId === technicianId) return clearTruckTechnicianAssignment(truck);
    return truck;
  });
}

function syncTruckTechnicianLocal(next, truckRecord){
  const technicianId = String(truckRecord.assignedTechnicianId || '');
  const technician = technicianId ? next.employees.find((row) => row.id === technicianId) : null;
  const technicianName = technicianId ? (technician ? getEmployeeFullName(technician) : truckRecord.currentDriver || '') : '';
  const normalizedTruck = technicianId
    ? { ...truckRecord, currentDriver:technicianName }
    : { ...truckRecord, currentDriver:'' };
  next.trucks = next.trucks.map((truck) => {
    if(truck.id === normalizedTruck.id) return normalizedTruck;
    if(technicianId && truck.assignedTechnicianId === technicianId) return clearTruckTechnicianAssignment(truck);
    return truck;
  });
}

async function saveLocalRecord(entityKey, draft){
  const next = clone(state.data);
  const cfg = ENTITY_CONFIG[entityKey];
  const list = next[entityKey];
  const existingIndex = list.findIndex((row) => row.id === draft.id);
  const existing = existingIndex >= 0 ? list[existingIndex] : null;
  const now = new Date().toISOString();
  let normalizedDraft = entityKey === 'clients' ? { ...draft, clientCode:normalizeClientCode(draft.clientCode) } : draft;
  if(entityKey === 'parts'){
    normalizedDraft = {
      ...normalizedDraft,
      partKey:buildFieldPartKey(normalizedDraft),
      onHandQuantity:Math.max(0, Math.trunc(Number(normalizedDraft.onHandQuantity || 0))),
      reorderPoint:Math.max(0, Math.trunc(Number(normalizedDraft.reorderPoint || 0))),
      unitName:String(normalizedDraft.unitName || 'Each').trim() || 'Each'
    };
  }
  if(entityKey === 'partCatalogs'){
    normalizedDraft = {
      ...normalizedDraft,
      catalogType:FIELD_PART_CATALOG_TYPES.some((type) => type.value === normalizedDraft.catalogType) ? normalizedDraft.catalogType : 'category',
      catalogValue:String(normalizedDraft.catalogValue || '').trim(),
      sortOrder:Math.trunc(Number(normalizedDraft.sortOrder || 0)),
      isActive:normalizedDraft.isActive !== false
    };
  }
  if(entityKey === 'jobTypes'){
    const jobTypeKey = normalizeJobTypeKey(normalizedDraft.jobTypeKey || normalizedDraft.jobTypeName);
    normalizedDraft = { ...normalizedDraft, jobTypeKey, jobTypeColor:normalizeHexColor(normalizedDraft.jobTypeColor, getDefaultJobTypeColor(jobTypeKey)), isActive:statusToIsActive(normalizedDraft.jobTypeStatus) };
  }
  if(entityKey === 'employees') normalizedDraft = { ...normalizedDraft, employeeName:buildEmployeeName(normalizedDraft.employeeFirstName, normalizedDraft.employeeLastName, normalizedDraft.employeeName), homeSplSite:String(normalizedDraft.homeSplSite || LOCAL_SPL_SITE).trim() || LOCAL_SPL_SITE, canSampleTransport:normalizedDraft.workScope === 'Lab' && !!normalizedDraft.canSampleTransport };
  if(entityKey === 'splSites') normalizedDraft = { ...normalizedDraft, siteCode:normalizeClientCode(normalizedDraft.siteCode || normalizedDraft.siteName), locationLabel:String(normalizedDraft.locationLabel || normalizedDraft.siteName || '').trim() };
  if(entityKey === 'technicianTravel') normalizedDraft = normalizeTravelDraftForSave(normalizedDraft);
  const record = normalizeRecord(entityKey, { ...existing, ...normalizedDraft, id:normalizedDraft.id || existing?.id || uid(cfg.idPrefix), createdAt:existing?.createdAt || now, updatedAt:now });
  if(entityKey === 'jobTypes' && existing?.jobTypeKey && existing.jobTypeKey !== record.jobTypeKey){
    next.siteTypeJobTypes = next.siteTypeJobTypes.map((link) => link.jobTypeKey === existing.jobTypeKey ? { ...link, jobTypeKey:record.jobTypeKey } : link);
    next.jobs = next.jobs.map((job) => resolveJobTypeValue([existing], job.jobType) === existing.jobTypeKey ? { ...job, jobType:record.jobTypeKey } : job);
  }
  if(existingIndex >= 0) list[existingIndex] = record; else list.unshift(record);
  if(entityKey === 'employees') syncTechnicianDefaultTruckLocal(next, record);
  if(entityKey === 'trucks') syncTruckTechnicianLocal(next, record);
  await persistLocal(next);
  return record.id;
}

function syncLocalContactLinks(next, contactId, projectIds, siteIds){
  next.contactProjects = next.contactProjects.filter((row) => row.contactId !== contactId);
  next.contactSites = next.contactSites.filter((row) => row.contactId !== contactId);
  projectIds.forEach((projectId) => next.contactProjects.push(normalizeRecord('contactProjects', { id:`${contactId}::${projectId}`, contactId, projectId }, { fromRemote:false })));
  siteIds.forEach((siteId) => next.contactSites.push(normalizeRecord('contactSites', { id:`${contactId}::${siteId}`, contactId, siteId }, { fromRemote:false })));
}

async function saveLocalContactRecord(draft){
  const next = clone(state.data);
  const projectIds = normalizeStringArray(draft.projectIds);
  const siteIds = normalizeStringArray(draft.siteIds);
  const contactName = buildContactName(draft.contactFirstName, draft.contactLastName, draft.contactName);
  const contactDraft = { ...draft, contactName, projectIds, siteIds, projectId:projectIds[0] || '', siteId:siteIds[0] || '' };
  const cfg = ENTITY_CONFIG.contacts;
  const existingIndex = next.contacts.findIndex((row) => row.id === contactDraft.id);
  const existing = existingIndex >= 0 ? next.contacts[existingIndex] : null;
  const now = new Date().toISOString();
  const record = normalizeRecord('contacts', { ...existing, ...contactDraft, id:contactDraft.id || existing?.id || uid(cfg.idPrefix), createdAt:existing?.createdAt || now, updatedAt:now }, { fromRemote:false });
  record.projectIds = projectIds;
  record.siteIds = siteIds;
  record.projectId = projectIds[0] || '';
  record.siteId = siteIds[0] || '';
  if(existingIndex >= 0) next.contacts[existingIndex] = record; else next.contacts.unshift(record);
  syncLocalContactLinks(next, record.id, projectIds, siteIds);
  repairDataRelationships(next);
  await persistLocal(next);
  return record.id;
}

async function saveLocalBillingProfileRecord(draft){
  const next = clone(state.data);
  const cfg = ENTITY_CONFIG.billingProfiles;
  const existingIndex = next.billingProfiles.findIndex((row) => row.id === draft.id);
  const existing = existingIndex >= 0 ? next.billingProfiles[existingIndex] : null;
  const now = new Date().toISOString();
  const record = normalizeRecord('billingProfiles', { ...existing, ...draft, projectId:'', isDefault:true, id:draft.id || existing?.id || uid(cfg.idPrefix), createdAt:existing?.createdAt || now, updatedAt:now }, { fromRemote:false });
  if(existingIndex >= 0) next.billingProfiles[existingIndex] = record; else next.billingProfiles.unshift(record);
  repairDataRelationships(next);
  await persistLocal(next);
  return record.id;
}

async function saveLocalBillingRateRows(profileId, priceDrafts){
  const next = clone(state.data);
  const profile = next.billingProfiles.find((row) => row.id === profileId) || null;
  if(!profile) throw new Error('Billing profile was not found.');
  const keepYear = BILLING_RATE_EFFECTIVE_YEAR;
  const now = new Date().toISOString();
  next.billingProfilePrices = next.billingProfilePrices.filter((row) => !(row.billingProfileId === profileId && Number(row.effectiveYear || keepYear) === keepYear));
  (Array.isArray(priceDrafts) ? priceDrafts : []).forEach((row) => {
    if(!row.priceItemId || !next.priceItems.some((item) => item.id === row.priceItemId)) return;
    next.billingProfilePrices.push(normalizeRecord('billingProfilePrices', {
      id:row.id || `${profileId}::${row.priceItemId}::${keepYear}`,
      billingProfileId:profileId,
      priceItemId:row.priceItemId,
      rateAmount:normalizeNumber(row.rateAmount),
      currencyCode:row.currencyCode || 'USD',
      effectiveYear:keepYear,
      isActive:row.isActive !== false,
      notes:row.notes || '',
      createdAt:now,
      updatedAt:now
    }, { fromRemote:false }));
  });
  repairDataRelationships(next);
  await persistLocal(next);
  return profileId;
}

function syncLocalSiteProjectLinks(next, siteId, projectIds){
  next.siteProjects = next.siteProjects.filter((row) => row.siteId !== siteId);
  projectIds.forEach((projectId) => next.siteProjects.push(normalizeRecord('siteProjects', { id:`${siteId}::${projectId}`, siteId, projectId }, { fromRemote:false })));
}

async function saveLocalSiteRecord(draft){
  const next = clone(state.data);
  const projectIds = normalizeStringArray(draft.projectIds);
  const siteDraft = { ...draft, projectIds, projectId:projectIds[0] || '', siteType:resolveSiteTypeValue(next.siteTypes, draft.siteType) };
  const cfg = ENTITY_CONFIG.sites;
  const existingIndex = next.sites.findIndex((row) => row.id === siteDraft.id);
  const existing = existingIndex >= 0 ? next.sites[existingIndex] : null;
  const now = new Date().toISOString();
  const record = normalizeRecord('sites', { ...existing, ...siteDraft, id:siteDraft.id || existing?.id || uid(cfg.idPrefix), createdAt:existing?.createdAt || now, updatedAt:now }, { fromRemote:false });
  record.projectIds = projectIds;
  record.projectId = projectIds[0] || '';
  if(existingIndex >= 0) next.sites[existingIndex] = record; else next.sites.unshift(record);
  syncLocalSiteProjectLinks(next, record.id, projectIds);
  repairDataRelationships(next);
  await persistLocal(next);
  return record.id;
}

function syncLocalSiteTypeJobTypeLinks(next, siteTypeKey, jobTypeKeys){
  const normalizedSiteTypeKey = resolveSiteTypeValue(next.siteTypes, siteTypeKey);
  next.siteTypeJobTypes = next.siteTypeJobTypes.filter((row) => row.siteTypeKey !== normalizedSiteTypeKey);
  normalizeStringArray(jobTypeKeys).forEach((jobTypeKey) => {
    const normalizedJobTypeKey = resolveJobTypeValue(next.jobTypes, jobTypeKey);
    if(!normalizedJobTypeKey) return;
    next.siteTypeJobTypes.push(normalizeRecord('siteTypeJobTypes', { id:`${normalizedSiteTypeKey}::${normalizedJobTypeKey}`, siteTypeKey:normalizedSiteTypeKey, jobTypeKey:normalizedJobTypeKey }, { fromRemote:false }));
  });
}

function syncLocalJobSiteLinks(next, jobRecord, siteIds){
  next.jobSites = next.jobSites.filter((row) => row.jobId !== jobRecord.id);
  normalizeStringArray(siteIds).forEach((siteId, index) => {
    next.jobSites.push(normalizeRecord('jobSites', { id:`${jobRecord.id}::${siteId}`, jobId:jobRecord.id, siteId, sortOrder:index }, { fromRemote:false }));
  });
}

async function saveLocalSiteTypeRecord(draft){
  const next = clone(state.data);
  const siteTypeDraft = { ...draft, siteTypeKey:normalizeSiteTypeKey(draft.siteTypeKey || draft.siteTypeName), isActive:statusToIsActive(draft.siteTypeStatus), defaultJobTypes:normalizeStringArray(draft.defaultJobTypes) };
  const cfg = ENTITY_CONFIG.siteTypes;
  const existingIndex = next.siteTypes.findIndex((row) => row.id === siteTypeDraft.id);
  const existing = existingIndex >= 0 ? next.siteTypes[existingIndex] : null;
  const previousKey = existing?.siteTypeKey || '';
  const now = new Date().toISOString();
  const record = normalizeRecord('siteTypes', { ...existing, ...siteTypeDraft, id:siteTypeDraft.id || existing?.id || uid(cfg.idPrefix), createdAt:existing?.createdAt || now, updatedAt:now }, { fromRemote:false });
  if(previousKey && previousKey !== record.siteTypeKey){
    next.sites = next.sites.map((site) => site.siteType === previousKey ? { ...site, siteType:record.siteTypeKey } : site);
    next.siteTypeJobTypes = next.siteTypeJobTypes.map((link) => link.siteTypeKey === previousKey ? { ...link, siteTypeKey:record.siteTypeKey } : link);
  }
  if(existingIndex >= 0) next.siteTypes[existingIndex] = record; else next.siteTypes.unshift(record);
  syncLocalSiteTypeJobTypeLinks(next, record.siteTypeKey, siteTypeDraft.defaultJobTypes);
  repairDataRelationships(next);
  await persistLocal(next);
  return record.id;
}

function buildSampleRecordForJob(jobRecord, draft, existing, index, options = {}){
  const shouldGenerateId = options.generateId !== false;
  const collectionDateTime = draft.collectionDateTime || combineSampleDateTime(draft.sampleDate || existing?.sampleDate, draft.sampleTime || existing?.sampleTime) || existing?.collectionDateTime || '';
  const collectionParts = splitInputDateTime(collectionDateTime);
  const record = normalizeRecord('samples', {
    ...existing,
    id:existing?.id || (shouldGenerateId ? (draft.id || uid(ENTITY_CONFIG.samples.idPrefix)) : ''),
    jobId:jobRecord.id,
    clientId:jobRecord.clientId,
    siteId:draft.siteId || jobRecord.siteId,
    sampleType:normalizeSampleTypeForWorkflow(draft.sampleType),
    containerType:existing?.containerType || (draft.sampleType === 'Liquid' ? 'Bottle' : 'Cylinder'),
    sampleStatus:draft.sampleStatus || existing?.sampleStatus || 'Needs Pulled',
    sampleName:draft.sampleName || '',
    samplePoint:draft.samplePoint || '',
    sampleDate:draft.sampleDate || collectionParts.date || existing?.sampleDate || '',
    sampleTime:draft.sampleTime || collectionParts.time || existing?.sampleTime || '',
    isDuplicate:!!draft.isDuplicate,
    sampleCollectionMode:draft.sampleCollectionMode || existing?.sampleCollectionMode || '',
    cylinderNumber:draft.cylinderNumber || existing?.cylinderNumber || '',
    testCodes:filterTestCodesForSampleType(draft.testCodes, draft.sampleType),
    sampleTempF:normalizeNumber(draft.sampleTempF ?? existing?.sampleTempF),
    samplePressurePsig:normalizeNumber(draft.samplePressurePsig ?? existing?.samplePressurePsig),
    linkedWorkOrderId:draft.linkedWorkOrderId || existing?.linkedWorkOrderId || '',
    linkedWorkOrderNumber:draft.linkedWorkOrderNumber || existing?.linkedWorkOrderNumber || '',
    labReceivedAt:draft.labReceivedAt || existing?.labReceivedAt || '',
    sampleSequence:index + 1,
    collectionDateTime,
    pickedUpBy:existing?.pickedUpBy || '',
    dropOffLocation:existing?.dropOffLocation || '',
    priorityTat:existing?.priorityTat || '',
    notes:draft.notes || existing?.notes || ''
  }, { fromRemote:false });
  return applySampleStatusCompatibility(record);
}

function getJobSampleDraftsForSave(draft){
  if(!jobTypeHasDetailGroup(draft.jobType, 'sample_logistics')) return [];
  const sampleCount = Number(draft.sampleCount || 0);
  if(!sampleCount || sampleCount < 1) return [];
  return (Array.isArray(draft.sampleDrafts) ? draft.sampleDrafts : []).slice(0, sampleCount).map((row, index) => createSampleDraft(row, index + 1));
}

function syncLocalJobSamples(next, jobRecord, draft){
  const sampleDrafts = getJobSampleDraftsForSave(draft);
  if(!sampleDrafts.length) return;
  const existingForJob = next.samples.filter((sample) => sample.jobId === jobRecord.id);
  const existingById = new Map(existingForJob.map((sample) => [sample.id, sample]));
  const nextRecords = sampleDrafts.map((sampleDraft, index) => buildSampleRecordForJob(jobRecord, sampleDraft, existingById.get(sampleDraft.id), index, { generateId:true }));
  const keepIds = new Set(nextRecords.map((sample) => sample.id));
  next.samples = next.samples.filter((sample) => sample.jobId !== jobRecord.id || keepIds.has(sample.id));
  nextRecords.forEach((sample) => {
    const index = next.samples.findIndex((row) => row.id === sample.id);
    if(index >= 0) next.samples[index] = sample;
    else next.samples.push(sample);
  });
}

async function syncRemoteJobSamples(jobId, jobDraft){
  const sampleDrafts = getJobSampleDraftsForSave(jobDraft);
  if(!sampleDrafts.length) return;
  const jobRecord = { ...jobDraft, id:jobId };
  const existingForJob = state.data.samples.filter((sample) => sample.jobId === jobId);
  const existingById = new Map(existingForJob.map((sample) => [sample.id, sample]));
  const keepIds = new Set();
  for(let index = 0; index < sampleDrafts.length; index += 1){
    const sampleDraft = sampleDrafts[index];
    const sampleRecord = buildSampleRecordForJob(jobRecord, sampleDraft, existingById.get(sampleDraft.id), index, { generateId:false });
    const savedId = await remoteRepository.saveRecord('samples', sampleRecord);
    keepIds.add(savedId);
  }
  for(const sample of existingForJob){
    if(!keepIds.has(sample.id)) await remoteRepository.deleteRecord('samples', sample.id);
  }
}

function pushLocalPartActivity(next, partId, jobId, jobPartId, activityType, quantityDelta, quantityBefore, quantityAfter, notes){
  const now = new Date().toISOString();
  next.partActivity.unshift(normalizeRecord('partActivity', {
    id:uid(ENTITY_CONFIG.partActivity.idPrefix),
    partId,
    jobId,
    jobPartId,
    activityType,
    quantityDelta,
    quantityBefore,
    quantityAfter,
    notes:notes || '',
    createdAt:now,
    updatedAt:now
  }, { fromRemote:false }));
}

function applyLocalPartStockDelta(next, partId, quantityDelta, activityMeta = {}){
  const partIndex = next.parts.findIndex((part) => part.id === partId);
  if(partIndex < 0) throw new Error('Field part was not found.');
  const part = next.parts[partIndex];
  const quantityBefore = Number(part.onHandQuantity || 0);
  const quantityAfter = quantityBefore + Number(quantityDelta || 0);
  if(quantityAfter < 0){
    throw new Error(`${part.partName || 'This part'} only has ${quantityBefore} ${part.unitName || 'unit'}${quantityBefore === 1 ? '' : 's'} available.`);
  }
  next.parts[partIndex] = normalizeRecord('parts', { ...part, onHandQuantity:quantityAfter, updatedAt:new Date().toISOString() }, { fromRemote:false });
  pushLocalPartActivity(next, partId, activityMeta.jobId || '', activityMeta.jobPartId || '', activityMeta.activityType || 'stock_adjusted', Number(quantityDelta || 0), quantityBefore, quantityAfter, activityMeta.notes || '');
  return next.parts[partIndex];
}

function buildLocalJobPartRecord(jobRecord, row, existing){
  const part = getPart(row.partId) || state.data.parts.find((item) => item.id === row.partId) || null;
  return normalizeRecord('jobParts', {
    ...existing,
    id:existing?.id || row.id || uid(ENTITY_CONFIG.jobParts.idPrefix),
    jobId:jobRecord.id,
    partId:row.partId,
    quantity:row.quantity,
    partKeySnapshot:part?.partKey || existing?.partKeySnapshot || '',
    partNumberSnapshot:part?.partNumber || existing?.partNumberSnapshot || '',
    partNameSnapshot:part?.partName || existing?.partNameSnapshot || '',
    unitCostSnapshot:part?.unitCost ?? existing?.unitCostSnapshot ?? null,
    unitNameSnapshot:part?.unitName || existing?.unitNameSnapshot || 'Each',
    notes:row.notes || '',
    createdAt:existing?.createdAt || new Date().toISOString(),
    updatedAt:new Date().toISOString()
  }, { fromRemote:false });
}

function syncLocalJobParts(next, jobRecord, draft){
  const desiredRows = getJobPartRowsForSave(draft);
  const desiredPartIds = new Set(desiredRows.map((row) => row.partId));
  const existingForJob = next.jobParts.filter((row) => row.jobId === jobRecord.id);
  const existingByPartId = new Map(existingForJob.map((row) => [row.partId, row]));

  existingForJob
    .filter((row) => !desiredPartIds.has(row.partId))
    .forEach((row) => {
      applyLocalPartStockDelta(next, row.partId, row.quantity, { jobId:jobRecord.id, jobPartId:row.id, activityType:'job_part_removed', notes:row.notes });
    });
  next.jobParts = next.jobParts.filter((row) => row.jobId !== jobRecord.id || desiredPartIds.has(row.partId));

  desiredRows.forEach((row) => {
    const existing = existingByPartId.get(row.partId);
    const record = buildLocalJobPartRecord(jobRecord, row, existing);
    const quantityDelta = existing ? Number(existing.quantity || 0) - Number(row.quantity || 0) : -Number(row.quantity || 0);
    if(quantityDelta !== 0){
      const activityType = existing ? (quantityDelta < 0 ? 'job_part_increased' : 'job_part_decreased') : 'job_part_added';
      applyLocalPartStockDelta(next, row.partId, quantityDelta, { jobId:jobRecord.id, jobPartId:record.id, activityType, notes:row.notes });
    }
    const index = next.jobParts.findIndex((item) => item.id === record.id);
    if(index >= 0) next.jobParts[index] = record;
    else next.jobParts.push(record);
  });
}

async function syncRemoteJobParts(jobId, jobDraft){
  const rows = getJobPartRowsForSave(jobDraft).map((row) => ({
    part_id:row.partId,
    quantity:row.quantity,
    notes:row.notes
  }));
  await window.appAuth.requestJson('/rest/v1/rpc/save_field_job_parts', {
    method:'POST',
    headers:{ 'Content-Type':'application/json', 'Prefer':'return=minimal' },
    body:JSON.stringify({ target_job_id:jobId, part_rows:rows })
  });
}

async function saveLocalJob(draft, assignments){
  const next = clone(state.data);
  const jobIndex = next.jobs.findIndex((row) => row.id === draft.id);
  const existing = jobIndex >= 0 ? next.jobs[jobIndex] : null;
  const now = new Date().toISOString();
  const normalizedDraft = { ...draft, samplesRequired:jobTypeHasDetailGroup(draft.jobType, 'sample_logistics') };
  if(getJobTypeScheduleMode(normalizedDraft.jobType) === 'point_in_time') normalizedDraft.scheduledEnd = '';
  normalizedDraft.siteIds = getNormalizedJobSiteIds(normalizedDraft);
  normalizedDraft.siteId = normalizedDraft.siteIds[0] || '';
  const jobRecord = normalizeRecord('jobs', { ...existing, ...normalizedDraft, id:draft.id || existing?.id || uid(ENTITY_CONFIG.jobs.idPrefix), createdAt:existing?.createdAt || now, updatedAt:now }, { fromRemote:false });
  jobRecord.siteIds = normalizedDraft.siteIds;
  if(jobIndex >= 0) next.jobs[jobIndex] = jobRecord; else next.jobs.unshift(jobRecord);
  syncLocalJobSiteLinks(next, jobRecord, normalizedDraft.siteIds);
  next.jobAssignments = next.jobAssignments.filter((row) => row.jobId !== jobRecord.id);
  assignments.filter((row) => row.resourceId).forEach((assignment) => next.jobAssignments.push(normalizeRecord('jobAssignments', { ...assignment, id:assignment.id || uid(ENTITY_CONFIG.jobAssignments.idPrefix), jobId:jobRecord.id, createdAt:assignment.createdAt || now, updatedAt:now })));
  syncLocalJobSamples(next, jobRecord, normalizedDraft);
  if(jobTypeHasDetailGroup(normalizedDraft.jobType, JOB_PARTS_DETAIL_GROUP)) syncLocalJobParts(next, jobRecord, normalizedDraft);
  await persistLocal(next);
  return jobRecord.id;
}

async function saveRemoteJob(draft, assignments){
  const jobDraft = { ...draft, samplesRequired:jobTypeHasDetailGroup(draft.jobType, 'sample_logistics') };
  if(getJobTypeScheduleMode(jobDraft.jobType) === 'point_in_time') jobDraft.scheduledEnd = '';
  jobDraft.siteIds = getNormalizedJobSiteIds(jobDraft);
  jobDraft.siteId = jobDraft.siteIds[0] || '';
  const jobId = await remoteRepository.saveRecord('jobs', jobDraft);
  await remoteRepository.deleteWhere(ENTITY_CONFIG.jobSites.table, [{ column:'job_id', value:jobId }]);
  await remoteRepository.insertRows(ENTITY_CONFIG.jobSites.table, jobDraft.siteIds.map((siteId, index) => ({ job_id:jobId, site_id:siteId, sort_order:index })));
  await remoteRepository.deleteWhere(ENTITY_CONFIG.jobAssignments.table, [{ column:'job_id', value:jobId }]);
  await remoteRepository.insertRows(ENTITY_CONFIG.jobAssignments.table, assignments.filter((row) => row.resourceId).map((row) => ({ job_id:jobId, assignment_type:row.assignmentType, resource_id:row.resourceId || null, assigned_start:null, assigned_end:null, assignment_status:'Assigned', assignment_notes:'' })));
  await syncRemoteJobSamples(jobId, jobDraft);
  if(jobTypeHasDetailGroup(jobDraft.jobType, JOB_PARTS_DETAIL_GROUP)) await syncRemoteJobParts(jobId, jobDraft);
  return jobId;
}

async function saveRemoteContactRecord(draft){
  const projectIds = normalizeStringArray(draft.projectIds);
  const siteIds = normalizeStringArray(draft.siteIds);
  const contactName = buildContactName(draft.contactFirstName, draft.contactLastName, draft.contactName);
  const contactId = await remoteRepository.saveRecord('contacts', { ...draft, contactName, projectId:projectIds[0] || '', siteId:siteIds[0] || '' });
  await remoteRepository.deleteWhere(ENTITY_CONFIG.contactProjects.table, [{ column:'contact_id', value:contactId }]);
  await remoteRepository.deleteWhere(ENTITY_CONFIG.contactSites.table, [{ column:'contact_id', value:contactId }]);
  await remoteRepository.insertRows(ENTITY_CONFIG.contactProjects.table, projectIds.map((projectId) => ({ contact_id:contactId, project_id:projectId })));
  await remoteRepository.insertRows(ENTITY_CONFIG.contactSites.table, siteIds.map((siteId) => ({ contact_id:contactId, site_id:siteId })));
  return contactId;
}

function buildBillingPriceRowsForSave(profileId, priceDrafts){
  return (Array.isArray(priceDrafts) ? priceDrafts : [])
    .filter((row) => row.priceItemId && getPriceItem(row.priceItemId))
    .map((row) => ({
      billing_profile_id:profileId,
      price_item_id:row.priceItemId,
      rate_amount:normalizeNumber(row.rateAmount),
      currency_code:row.currencyCode || 'USD',
      effective_year:Number(row.effectiveYear || BILLING_RATE_EFFECTIVE_YEAR),
      is_active:row.isActive !== false,
      notes:String(row.notes || '')
    }));
}

async function syncRemoteBillingProfilePrices(profileId, draft){
  const effectiveYear = BILLING_RATE_EFFECTIVE_YEAR;
  await remoteRepository.deleteWhere(ENTITY_CONFIG.billingProfilePrices.table, [
    { column:'billing_profile_id', value:profileId },
    { column:'effective_year', value:effectiveYear }
  ]);
  await remoteRepository.insertRows(ENTITY_CONFIG.billingProfilePrices.table, buildBillingPriceRowsForSave(profileId, draft.priceDrafts));
}

async function saveRemoteBillingProfileRecord(draft){
  return remoteRepository.saveRecord('billingProfiles', { ...draft, projectId:'', isDefault:true });
}

async function saveRemoteBillingRateRows(profileId, priceDrafts){
  await syncRemoteBillingProfilePrices(profileId, { priceDrafts });
  return profileId;
}

async function saveRemoteSiteRecord(draft){
  const projectIds = normalizeStringArray(draft.projectIds);
  const siteId = await remoteRepository.saveRecord('sites', { ...draft, siteType:resolveSiteTypeValue(state.data.siteTypes, draft.siteType), projectId:projectIds[0] || '' });
  await remoteRepository.deleteWhere(ENTITY_CONFIG.siteProjects.table, [{ column:'site_id', value:siteId }]);
  await remoteRepository.insertRows(ENTITY_CONFIG.siteProjects.table, projectIds.map((projectId) => ({ site_id:siteId, project_id:projectId })));
  return siteId;
}

async function saveRemoteSiteTypeRecord(draft){
  const existing = draft.id ? state.data.siteTypes.find((row) => row.id === draft.id) : null;
  const previousKey = existing?.siteTypeKey || '';
  const siteTypeKey = normalizeSiteTypeKey(draft.siteTypeKey || draft.siteTypeName);
  const recordId = await remoteRepository.saveRecord('siteTypes', { ...draft, siteTypeKey, isActive:statusToIsActive(draft.siteTypeStatus) });
  if(previousKey && previousKey !== siteTypeKey){
    await remoteRepository.updateWhere(ENTITY_CONFIG.sites.table, [{ column:'site_type', value:previousKey }], { site_type:siteTypeKey });
  }
  await remoteRepository.deleteWhere(ENTITY_CONFIG.siteTypeJobTypes.table, [{ column:'site_type_key', value:siteTypeKey }]);
  await remoteRepository.insertRows(ENTITY_CONFIG.siteTypeJobTypes.table, normalizeStringArray(draft.defaultJobTypes).map((jobTypeKey) => ({ site_type_key:siteTypeKey, job_type_key:resolveJobTypeValue(state.data.jobTypes, jobTypeKey) })).filter((row) => row.job_type_key));
  return recordId;
}

async function uploadRemoteAssetPhoto(path, dataUrl, type){
  const response = await window.appAuth.fetch(`/storage/v1/object/${FIELD_ASSET_BUCKET}/${encodeStoragePath(path)}`, {
    method:'POST',
    headers:{ Accept:'application/json', 'Content-Type':type || 'image/jpeg', 'x-upsert':'true' },
    body:dataUrlToBlob(dataUrl)
  });
  if(!response.ok){
    const payload = await response.json().catch(() => ({}));
    const message = String(payload?.message || payload?.error || `Image upload failed (${response.status}).`);
    if(message.toLowerCase().includes('bucket not found')) throw new Error(`Supabase storage bucket "${FIELD_ASSET_BUCKET}" was not found. Run the storage bucket section of supabase/schema.sql in Supabase, then try again.`);
    throw new Error(message);
  }
}
async function removeRemoteAssetPhoto(path){
  if(!path) return;
  await window.appAuth.requestJson('/storage/v1/object/remove', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body:JSON.stringify({ prefixes:[path] })
  });
}
function buildRemoteTruckAssignmentPayload(technicianId, technicianName = ''){
  return {
    assigned_technician_id:technicianId || null,
    current_driver:technicianName || ''
  };
}
async function syncRemoteTruckAssignmentsForTechnician(technicianId, technicianName, defaultTruckId){
  if(defaultTruckId){
    await remoteRepository.patchByQuery(ENTITY_CONFIG.trucks.table, `assigned_technician_id=eq.${encodeURIComponent(technicianId)}&id=neq.${encodeURIComponent(defaultTruckId)}`, buildRemoteTruckAssignmentPayload(null));
    await remoteRepository.patchByQuery(ENTITY_CONFIG.trucks.table, `id=eq.${encodeURIComponent(defaultTruckId)}`, buildRemoteTruckAssignmentPayload(technicianId, technicianName));
    return;
  }
  await remoteRepository.updateWhere(ENTITY_CONFIG.trucks.table, [{ column:'assigned_technician_id', value:technicianId }], buildRemoteTruckAssignmentPayload(null));
}
async function syncRemoteTruckAssignmentsForTruck(truckId, technicianId, technicianName){
  if(!technicianId) return;
  await remoteRepository.patchByQuery(ENTITY_CONFIG.trucks.table, `assigned_technician_id=eq.${encodeURIComponent(technicianId)}&id=neq.${encodeURIComponent(truckId)}`, buildRemoteTruckAssignmentPayload(null));
}
async function saveRemoteTechnicianRecord(draft){
  const employeeDraft = { ...draft, employeeName:buildEmployeeName(draft.employeeFirstName, draft.employeeLastName, draft.employeeName), homeSplSite:String(draft.homeSplSite || LOCAL_SPL_SITE).trim() || LOCAL_SPL_SITE, canSampleTransport:draft.workScope === 'Lab' && !!draft.canSampleTransport };
  const recordId = await remoteRepository.saveRecord('employees', employeeDraft);
  await syncRemoteTruckAssignmentsForTechnician(recordId, employeeDraft.employeeName || '', String(employeeDraft.defaultTruckId || ''));
  return recordId;
}
async function saveRemoteAssetRecord(entityKey, draft){
  const existing = draft.id ? state.data[entityKey].find((row) => row.id === draft.id) : null;
  const currentPath = existing?.assetPhotoPath || '';
  const baseDraft = { ...draft, assetPhotoPath:draft.assetPhotoDataUrl ? (currentPath || '') : (draft.assetPhotoPath || '') };
  const recordId = await remoteRepository.saveRecord(entityKey, baseDraft);
  if(draft.assetPhotoDataUrl){
    const uploadPath = buildAssetPhotoStoragePath(entityKey, recordId, draft.assetPhotoName || 'asset-photo.jpg');
    await uploadRemoteAssetPhoto(uploadPath, draft.assetPhotoDataUrl, draft.assetPhotoType || 'image/jpeg');
    await remoteRepository.saveRecord(entityKey, { ...draft, id:recordId, assetPhotoPath:uploadPath });
    if(currentPath && currentPath !== uploadPath){
      await removeRemoteAssetPhoto(currentPath).catch((error) => console.warn('Unable to remove replaced asset photo:', error));
      clearCachedAssetPhoto(currentPath);
    }
  } else if(currentPath && !draft.assetPhotoPath){
    await removeRemoteAssetPhoto(currentPath).catch((error) => console.warn('Unable to remove asset photo:', error));
    clearCachedAssetPhoto(currentPath);
  }
  if(entityKey === 'trucks'){
    const technicianId = String(draft.assignedTechnicianId || '');
    const technician = technicianId ? state.data.employees.find((row) => row.id === technicianId) : null;
    const technicianName = technicianId ? (technician ? getEmployeeFullName(technician) : draft.currentDriver || '') : '';
    if(technicianId) await syncRemoteTruckAssignmentsForTruck(recordId, technicianId, technicianName);
  }
  return recordId;
}

async function saveEntityFromModal(){
  if(modalState.entity === 'clients') modalState.formData.clientCode = normalizeClientCode(modalState.formData.clientCode);
  if(modalState.entity === 'samples'){
    modalState.formData.sampleType = normalizeSampleTypeForWorkflow(modalState.formData.sampleType);
    modalState.formData.testCodes = filterTestCodesForSampleType(modalState.formData.testCodes, modalState.formData.sampleType);
    applySampleStatusCompatibility(modalState.formData);
  }
  if(modalState.entity === 'jobs'){
    const manualTicketNumber = String(modalState.formData.salesforceCaseNumber || '').trim();
    modalState.formData.salesforceCaseNumber = manualTicketNumber;
    modalState.formData.salesforceCaseUrl = String(modalState.formData.salesforceCaseUrl || '').trim();
    modalState.formData.fieldfxTicketId = manualTicketNumber;
    modalState.formData.noTicketRequired = !manualTicketNumber && !modalState.formData.salesforceCaseUrl && !!modalState.formData.noTicketRequired;
    modalState.formData.salesforceSyncStatus = manualTicketNumber || modalState.formData.salesforceCaseUrl ? 'Manual Link' : '';
    modalState.formData.salesforceSyncError = '';
    modalState.formData.samplesRequired = jobTypeHasDetailGroup(modalState.formData.jobType, 'sample_logistics');
  }
  if(modalState.entity === 'jobTypes'){
    modalState.formData.jobTypeKey = normalizeJobTypeKey(modalState.formData.jobTypeKey || modalState.formData.jobTypeName);
    modalState.formData.jobTypeColor = normalizeHexColor(modalState.formData.jobTypeColor, getDefaultJobTypeColor(modalState.formData.jobTypeKey));
    modalState.formData.detailGroups = prepareJobTypeDetailGroupsForSave(modalState.formData.detailGroups);
    modalState.formData.isActive = statusToIsActive(modalState.formData.jobTypeStatus);
  }
  if(modalState.entity === 'siteTypes'){
    modalState.formData.siteTypeKey = normalizeSiteTypeKey(modalState.formData.siteTypeKey || modalState.formData.siteTypeName);
    modalState.formData.isActive = statusToIsActive(modalState.formData.siteTypeStatus);
  }
  if(modalState.entity === 'splSites') modalState.formData.siteCode = normalizeClientCode(modalState.formData.siteCode || modalState.formData.siteName);
  if(modalState.entity === 'technicianTravel') modalState.formData = normalizeTravelDraftForSave(modalState.formData);
  if(modalState.entity === 'parts'){
    modalState.formData.partKey = buildFieldPartKey(modalState.formData);
    modalState.formData.onHandQuantity = Math.max(0, Math.trunc(Number(modalState.formData.onHandQuantity || 0)));
    modalState.formData.reorderPoint = Math.max(0, Math.trunc(Number(modalState.formData.reorderPoint || 0)));
    modalState.formData.unitName = String(modalState.formData.unitName || 'Each').trim() || 'Each';
  }
  if(modalState.entity === 'partCatalogs'){
    modalState.formData.catalogType = FIELD_PART_CATALOG_TYPES.some((type) => type.value === modalState.formData.catalogType) ? modalState.formData.catalogType : 'category';
    modalState.formData.catalogValue = String(modalState.formData.catalogValue || '').trim();
    modalState.formData.sortOrder = Math.trunc(Number(modalState.formData.sortOrder || 0));
    modalState.formData.isActive = modalState.formData.isActive !== false;
  }
  const validationMessage = validateModal();
  if(validationMessage){ alert(validationMessage); return; }
  state.saveInFlight = true;
  showSaveStatus('saving', 'SAVING');
  try {
    if(modalState.entity === 'jobs'){
      if(isRemoteMode()){ await saveRemoteJob(modalState.formData, modalState.assignments); await loadData({ silent:true, force:true }); }
      else await saveLocalJob(modalState.formData, modalState.assignments);
    } else if(modalState.entity === 'contacts'){
      if(isRemoteMode()){ await saveRemoteContactRecord(modalState.formData); await loadData({ silent:true, force:true }); }
      else await saveLocalContactRecord(modalState.formData);
    } else if(modalState.entity === 'billingProfiles'){
      if(isRemoteMode()){ await saveRemoteBillingProfileRecord(modalState.formData); await loadData({ silent:true, force:true }); }
      else await saveLocalBillingProfileRecord(modalState.formData);
    } else if(modalState.entity === 'billingRates'){
      const profileId = modalState.formData.billingProfileId || modalState.id;
      if(isRemoteMode()){ await saveRemoteBillingRateRows(profileId, modalState.formData.priceDrafts); await loadData({ silent:true, force:true }); }
      else await saveLocalBillingRateRows(profileId, modalState.formData.priceDrafts);
    } else if(modalState.entity === 'sites'){
      if(isRemoteMode()){ await saveRemoteSiteRecord(modalState.formData); await loadData({ silent:true, force:true }); }
      else await saveLocalSiteRecord(modalState.formData);
    } else if(modalState.entity === 'siteTypes'){
      if(isRemoteMode()){ await saveRemoteSiteTypeRecord(modalState.formData); await loadData({ silent:true, force:true }); }
      else await saveLocalSiteTypeRecord(modalState.formData);
    } else if(isRemoteMode()){
      if(modalState.entity === 'employees') await saveRemoteTechnicianRecord(modalState.formData);
      else if(isAssetPhotoEntity(modalState.entity)) await saveRemoteAssetRecord(modalState.entity, modalState.formData);
      else await remoteRepository.saveRecord(modalState.entity, modalState.formData);
      await loadData({ silent:true, force:true });
    }
    else await saveLocalRecord(modalState.entity, modalState.formData);
    const savedMessage = modalState.entity === 'jobs' ? 'Job saved' : (modalState.entity === 'billingRates' ? 'Rates saved' : 'SAVED');
    closeEntityModal({ force:true });
    showSaveStatus('saved', savedMessage);
    hideSaveStatusSoon();
  } catch (error){
    console.error('Unable to save Field Ops record:', error);
    showSaveStatus('error', 'SAVE FAILED');
    hideSaveStatusSoon(4200);
    alert(error.message || 'Unable to save the Field Ops record.');
  } finally {
    state.saveInFlight = false;
  }
}

function buildLocalDeleteResult(entityKey, id){
  const next = clone(state.data);
  if(entityKey === 'clients'){
    const clientSiteIds = new Set(next.sites.filter((row) => row.clientId === id).map((row) => row.id));
    const clientBillingProfileIds = new Set(next.billingProfiles.filter((row) => row.clientId === id).map((row) => row.id));
    next.clients = next.clients.filter((row) => row.id !== id);
    next.projects = next.projects.filter((row) => row.clientId !== id);
    next.contacts = next.contacts.filter((row) => row.clientId !== id);
    next.contactProjects = next.contactProjects.filter((row) => next.contacts.some((contact) => contact.id === row.contactId));
    next.contactSites = next.contactSites.filter((row) => next.contacts.some((contact) => contact.id === row.contactId));
    next.billingProfiles = next.billingProfiles.filter((row) => row.clientId !== id);
    next.billingProfilePrices = next.billingProfilePrices.filter((row) => !clientBillingProfileIds.has(row.billingProfileId));
    next.sites = next.sites.filter((row) => row.clientId !== id);
    next.siteProjects = next.siteProjects.filter((row) => !clientSiteIds.has(row.siteId));
  }
  else if(entityKey === 'projects'){
    const projectBillingProfileIds = new Set(next.billingProfiles.filter((row) => row.projectId === id).map((row) => row.id));
    next.projects = next.projects.filter((row) => row.id !== id);
    next.contacts = next.contacts.map((row) => row.projectId === id ? { ...row, projectId:'' } : row);
    next.contactProjects = next.contactProjects.filter((row) => row.projectId !== id);
    next.billingProfiles = next.billingProfiles.filter((row) => row.projectId !== id);
    next.billingProfilePrices = next.billingProfilePrices.filter((row) => !projectBillingProfileIds.has(row.billingProfileId));
    next.siteProjects = next.siteProjects.filter((row) => row.projectId !== id);
  }
  else if(entityKey === 'sites'){
    next.sites = next.sites.filter((row) => row.id !== id);
    next.siteProjects = next.siteProjects.filter((row) => row.siteId !== id);
    next.contacts = next.contacts.map((row) => row.siteId === id ? { ...row, siteId:'' } : row);
    next.contactSites = next.contactSites.filter((row) => row.siteId !== id);
  }
  else if(entityKey === 'contacts'){
    next.contacts = next.contacts.filter((row) => row.id !== id).map((row) => row.managerContactId === id ? { ...row, managerContactId:'' } : row);
    next.contactProjects = next.contactProjects.filter((row) => row.contactId !== id);
    next.contactSites = next.contactSites.filter((row) => row.contactId !== id);
  }
  else if(entityKey === 'billingProfiles'){
    next.billingProfiles = next.billingProfiles.filter((row) => row.id !== id);
    next.billingProfilePrices = next.billingProfilePrices.filter((row) => row.billingProfileId !== id);
  }
  else if(entityKey === 'siteTypes'){
    const siteType = next.siteTypes.find((row) => row.id === id) || null;
    const siteTypeKey = siteType?.siteTypeKey || '';
    next.siteTypes = next.siteTypes.filter((row) => row.id !== id);
    next.siteTypeJobTypes = next.siteTypeJobTypes.filter((row) => row.siteTypeKey !== siteTypeKey);
  }
  else if(entityKey === 'jobTypes'){
    const jobType = next.jobTypes.find((row) => row.id === id) || null;
    const jobTypeKey = jobType?.jobTypeKey || '';
    next.jobTypes = next.jobTypes.filter((row) => row.id !== id);
    next.siteTypeJobTypes = next.siteTypeJobTypes.filter((row) => row.jobTypeKey !== jobTypeKey);
  }
  else if(entityKey === 'jobs'){
    next.jobParts.filter((row) => row.jobId === id).forEach((row) => {
      applyLocalPartStockDelta(next, row.partId, row.quantity, { jobId:id, jobPartId:row.id, activityType:'job_part_removed', notes:row.notes });
    });
    next.jobs = next.jobs.filter((row) => row.id !== id);
    next.jobSites = next.jobSites.filter((row) => row.jobId !== id);
    next.jobAssignments = next.jobAssignments.filter((row) => row.jobId !== id);
    next.samples = next.samples.filter((row) => row.jobId !== id);
    next.jobParts = next.jobParts.filter((row) => row.jobId !== id);
  }
  else if(entityKey === 'employees'){ next.employees = next.employees.filter((row) => row.id !== id); next.trucks = next.trucks.map((row) => row.assignedTechnicianId === id ? { ...row, assignedTechnicianId:'', currentDriver:'' } : row); next.jobAssignments = next.jobAssignments.filter((row) => !(row.assignmentType === 'Technician' && row.resourceId === id)); next.technicianTravel = next.technicianTravel.filter((row) => row.technicianId !== id); }
  else if(entityKey === 'splSites'){ next.splSites = next.splSites.filter((row) => row.id !== id); }
  else if(entityKey === 'trucks'){ next.trucks = next.trucks.filter((row) => row.id !== id); next.trailers = next.trailers.map((row) => row.assignedTruckId === id ? { ...row, assignedTruckId:'' } : row); next.equipment = next.equipment.map((row) => row.assignedTruckId === id ? { ...row, assignedTruckId:'', assignedTrailerTruck:row.assignedTrailerId ? getTrailerLabel(row.assignedTrailerId) : '' } : row); next.jobAssignments = next.jobAssignments.filter((row) => !(row.assignmentType === 'Truck' && row.resourceId === id)); next.maintenanceRecords = next.maintenanceRecords.filter((row) => !(row.assetType === 'Truck' && row.assetId === id)); }
  else if(entityKey === 'trailers'){ next.trailers = next.trailers.filter((row) => row.id !== id); next.equipment = next.equipment.map((row) => row.assignedTrailerId === id ? { ...row, assignedTrailerId:'', assignedTrailerTruck:row.assignedTruckId ? getTruckLabel(row.assignedTruckId) : '' } : row); next.jobAssignments = next.jobAssignments.filter((row) => !(row.assignmentType === 'Trailer' && row.resourceId === id)); next.maintenanceRecords = next.maintenanceRecords.filter((row) => !(row.assetType === 'Trailer' && row.assetId === id)); }
  else if(entityKey === 'equipment'){ next.equipment = next.equipment.filter((row) => row.id !== id); next.jobAssignments = next.jobAssignments.filter((row) => !(row.assignmentType === 'Equipment' && row.resourceId === id)); next.maintenanceRecords = next.maintenanceRecords.filter((row) => !(row.assetType === 'Equipment' && row.assetId === id)); }
  else if(entityKey === 'parts'){ next.parts = next.parts.filter((row) => row.id !== id); next.partActivity = next.partActivity.filter((row) => row.partId !== id); }
  else next[entityKey] = next[entityKey].filter((row) => row.id !== id);
  return next;
}

async function deleteEntityRecord(entityKey, id){
  if(entityKey === 'clients'){
    const blockMessage = getClientDeleteBlockMessage(id);
    if(blockMessage){ alert(blockMessage); return false; }
  }
  if(entityKey === 'projects'){
    const blockMessage = getProjectDeleteBlockMessage(id);
    if(blockMessage){ alert(blockMessage); return false; }
  }
  if(entityKey === 'sites'){
    const blockMessage = getSiteDeleteBlockMessage(id);
    if(blockMessage){ alert(blockMessage); return false; }
  }
  if(entityKey === 'splSites'){
    const blockMessage = getSplSiteDeleteBlockMessage(id);
    if(blockMessage){ alert(blockMessage); return false; }
  }
  if(entityKey === 'jobTypes'){
    const jobType = state.data.jobTypes.find((row) => row.id === id) || null;
    const targetKey = normalizeJobTypeKey(jobType?.jobTypeKey || id);
    const inUse = state.data.jobs.some((job) => normalizeJobTypeKey(resolveJobTypeValue(state.data.jobTypes, job.jobType)) === targetKey);
    if(inUse){ alert('This job type is still in use by existing jobs. Mark it inactive instead of deleting it.'); return false; }
  }
  if(entityKey === 'siteTypes'){
    const siteType = state.data.siteTypes.find((row) => row.id === id) || null;
    const targetKey = siteType?.siteTypeKey || '';
    const inUse = state.data.sites.some((site) => site.siteType === targetKey);
    if(inUse){ alert('This site type is still in use by existing sites. Mark it inactive instead of deleting it.'); return false; }
  }
  if(entityKey === 'parts'){
    const inUse = state.data.jobParts.some((row) => row.partId === id);
    if(inUse){ alert('This part is still attached to one or more jobs. Mark it inactive instead of deleting it.'); return false; }
  }
  if(!confirm(`Delete this ${ENTITY_CONFIG[entityKey].label.toLowerCase()}? This cannot be undone.`)) return false;
  state.saveInFlight = true;
  showSaveStatus('saving', 'DELETING');
  try {
    if(isRemoteMode()){
      const existing = state.data[entityKey]?.find((row) => row.id === id) || null;
      if(entityKey === 'employees'){ await remoteRepository.updateWhere(ENTITY_CONFIG.trucks.table, [{ column:'assigned_technician_id', value:id }], buildRemoteTruckAssignmentPayload(null)); await remoteRepository.deleteWhere(ENTITY_CONFIG.jobAssignments.table, [{ column:'assignment_type', value:'Technician' }, { column:'resource_id', value:id }]); await remoteRepository.deleteWhere(ENTITY_CONFIG.technicianTravel.table, [{ column:'technician_id', value:id }]); }
      if(entityKey === 'trucks'){ await remoteRepository.updateWhere(ENTITY_CONFIG.trailers.table, [{ column:'assigned_truck_id', value:id }], { assigned_truck_id:null }); await remoteRepository.updateWhere(ENTITY_CONFIG.equipment.table, [{ column:'assigned_truck_id', value:id }], { assigned_truck_id:null, assigned_trailer_truck:'' }); await remoteRepository.deleteWhere(ENTITY_CONFIG.jobAssignments.table, [{ column:'assignment_type', value:'Truck' }, { column:'resource_id', value:id }]); await remoteRepository.deleteWhere(ENTITY_CONFIG.maintenanceRecords.table, [{ column:'asset_type', value:'Truck' }, { column:'asset_id', value:id }]); }
      if(entityKey === 'trailers'){ await remoteRepository.updateWhere(ENTITY_CONFIG.equipment.table, [{ column:'assigned_trailer_id', value:id }], { assigned_trailer_id:null, assigned_trailer_truck:'' }); await remoteRepository.deleteWhere(ENTITY_CONFIG.jobAssignments.table, [{ column:'assignment_type', value:'Trailer' }, { column:'resource_id', value:id }]); await remoteRepository.deleteWhere(ENTITY_CONFIG.maintenanceRecords.table, [{ column:'asset_type', value:'Trailer' }, { column:'asset_id', value:id }]); }
      if(entityKey === 'equipment'){ await remoteRepository.deleteWhere(ENTITY_CONFIG.jobAssignments.table, [{ column:'assignment_type', value:'Equipment' }, { column:'resource_id', value:id }]); await remoteRepository.deleteWhere(ENTITY_CONFIG.maintenanceRecords.table, [{ column:'asset_type', value:'Equipment' }, { column:'asset_id', value:id }]); }
      if(existing?.assetPhotoPath){ await removeRemoteAssetPhoto(existing.assetPhotoPath).catch((error) => console.warn('Unable to remove deleted asset photo:', error)); clearCachedAssetPhoto(existing.assetPhotoPath); }
      await remoteRepository.deleteRecord(entityKey, id);
      await loadData({ silent:true, force:true });
    } else await persistLocal(buildLocalDeleteResult(entityKey, id));
    if(modalState.open && modalState.entity === entityKey && modalState.id === id) closeEntityModal({ force:true });
    showSaveStatus('saved', 'DELETED');
    hideSaveStatusSoon();
    return true;
  } catch (error){
    console.error('Unable to delete Field Ops record:', error);
    showSaveStatus('error', 'DELETE FAILED');
    hideSaveStatusSoon(4200);
    alert(error.message || 'Unable to delete the Field Ops record.');
    return false;
  } finally {
    state.saveInFlight = false;
  }
}

async function deleteCurrentModalEntity(){ if(modalState.id) await deleteEntityRecord(modalState.entity, modalState.id); }

function isInteractionOverlayOpen(){ return !!state.scheduleActionJobId || !!document.getElementById('entity-modal-overlay')?.classList.contains('open') || !!document.getElementById('job-part-modal-overlay')?.classList.contains('open') || !!document.getElementById('part-adjust-modal-overlay')?.classList.contains('open') || !!document.getElementById('sample-link-modal-overlay')?.classList.contains('open') || !!document.getElementById('sample-table-modal-overlay')?.classList.contains('open') || !!document.getElementById('site-editor-overlay')?.classList.contains('open') || !!document.getElementById('site-editor-address-overlay')?.classList.contains('open'); }

async function loadData(options = {}){
  try {
    const next = await (isRemoteMode() ? remoteRepository.list() : localRepository.list());
    const snapshot = JSON.stringify(next);
    if(!options.force && snapshot === lastLoadedSnapshot) return false;
    state.data = next;
    lastLoadedSnapshot = snapshot;
    render();
    if(!options.silent){ showSaveStatus('loaded', 'FIELD OPS READY'); hideSaveStatusSoon(); }
    return true;
  } catch (error){
    console.error('Unable to load Field Ops data:', error);
    if(!options.silent){ showSaveStatus('error', 'LOAD FAILED'); hideSaveStatusSoon(4200); }
    return false;
  }
}

async function refreshFromRemote(){
  if(!isRemoteMode() || document.hidden || isInteractionOverlayOpen() || state.autoRefreshInFlight || state.saveInFlight) return;
  state.autoRefreshInFlight = true;
  try {
    const changed = await loadData({ silent:true });
    if(changed){ showSaveStatus('loaded', 'SYNCED'); hideSaveStatusSoon(1600); }
  } finally {
    state.autoRefreshInFlight = false;
  }
}

function startAutoRefresh(){ stopAutoRefresh(); if(isRemoteMode()) state.autoRefreshTimer = setInterval(refreshFromRemote, AUTO_REFRESH_MS); }
function stopAutoRefresh(){ if(state.autoRefreshTimer){ clearInterval(state.autoRefreshTimer); state.autoRefreshTimer = null; } }

document.getElementById('entity-modal-overlay')?.addEventListener('click', (event) => { if(event.target === event.currentTarget) event.stopPropagation(); });
document.getElementById('job-part-modal-overlay')?.addEventListener('click', (event) => { if(event.target === event.currentTarget) event.stopPropagation(); });
document.getElementById('part-adjust-modal-overlay')?.addEventListener('click', (event) => { if(event.target === event.currentTarget) event.stopPropagation(); });
document.getElementById('sample-link-modal-overlay')?.addEventListener('click', (event) => { if(event.target === event.currentTarget) event.stopPropagation(); });
document.getElementById('sample-table-modal-overlay')?.addEventListener('click', (event) => { if(event.target === event.currentTarget) event.stopPropagation(); });
document.addEventListener('click', (event) => { if(state.scheduleActionJobId && !event.target.closest?.('.schedule-card')) closeScheduleActionPopover(); });
document.addEventListener('visibilitychange', () => { if(!document.hidden) refreshFromRemote(); });
window.addEventListener('keydown', (event) => {
  if(event.key !== 'Escape' || !isInteractionOverlayOpen()) return;
  if(state.scheduleActionJobId) closeScheduleActionPopover();
  else if(document.getElementById('job-part-modal-overlay')?.classList.contains('open')) closeJobPartPicker();
  else if(document.getElementById('part-adjust-modal-overlay')?.classList.contains('open')) closePartAdjustModal();
  else if(document.getElementById('sample-table-modal-overlay')?.classList.contains('open')) closeSampleTableModal();
  else if(document.getElementById('sample-link-modal-overlay')?.classList.contains('open')) closeSampleLinkModal();
  else closeEntityModal();
});

(async function init(){
  await (window.authReadyPromise || Promise.resolve());
  await Promise.all([loadData({ silent:true, force:true }), loadLabTestDefinitions()]);
  render();
  startAutoRefresh();
})();
