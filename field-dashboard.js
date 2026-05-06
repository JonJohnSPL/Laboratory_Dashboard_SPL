const STORAGE_KEY = 'field-ops-dashboard-data';
const AUTO_REFRESH_MS = 15000;
const ENTITY_ORDER = ['clients', 'projects', 'contacts', 'contactProjects', 'contactSites', 'billingProfiles', 'siteTypes', 'sites', 'siteProjects', 'jobTypes', 'siteTypeJobTypes', 'jobs', 'jobAssignments', 'employees', 'trucks', 'trailers', 'equipment', 'samples', 'maintenanceRecords'];
const FIELD_ASSET_BUCKET = 'field-assets';
const ASSET_PHOTO_ENTITY_KEYS = ['clients', 'trucks', 'trailers', 'equipment'];
const DEFAULT_ASSET_ICON_PATHS = {
  truckPickup:'assets/truck-icon-pickup.png',
  truckService:'assets/truck-icon-service.png',
  trailer:'assets/trailer-icon-box.png'
};
const FIELD_OPS_STANDALONE_MODE = String(window.FIELD_OPS_STANDALONE_MODE || '').toLowerCase();
const IS_CLIENTS_STANDALONE = FIELD_OPS_STANDALONE_MODE === 'clients';

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
const VEHICLE_STATUS_OPTIONS = ['Available', 'In Use', 'Maintenance', 'Out of Service'];
const TRAILER_STATUS_OPTIONS = ['Available', 'Assigned', 'In Use', 'Maintenance', 'Out of Service'];
const EQUIPMENT_TYPE_OPTIONS = ['Small Volume Prover', 'Master Meter', 'Regulator', 'Hose Set', 'Sampling Equipment', 'Tooling', 'Other'];
const CALIBRATION_STATUS_OPTIONS = ['Current', 'Due Soon', 'Overdue'];
const EQUIPMENT_STATUS_OPTIONS = ['Available', 'Assigned', 'In Use', 'Needs Repair', 'Out of Service'];
const SAMPLE_TYPE_OPTIONS = ['Gas', 'Liquid', 'Condensate', 'Other'];
const CONTAINER_TYPE_OPTIONS = ['Cylinder', 'Bottle', 'Other'];
const SAMPLE_STATUS_OPTIONS = ['Requested', 'Collected', 'In Transit', 'Delivered', 'Logged In', 'Complete', 'Exception'];
const LAB_RECEIPT_STATUS_OPTIONS = ['Requested', 'Delivered', 'Logged In', 'Complete', 'Exception'];
const MAINTENANCE_TYPE_OPTIONS = ['Preventive', 'Repair', 'Inspection', 'Calibration'];
const MAINTENANCE_STATUS_OPTIONS = ['Open', 'Scheduled', 'In Progress', 'Complete', 'Canceled'];
const ASSET_TYPE_OPTIONS = ['Truck', 'Trailer', 'Equipment'];
const VENDOR_INTERNAL_OPTIONS = ['Vendor', 'Internal'];
const JOB_TYPE_SCHEDULE_MODE_OPTIONS = ['range', 'point_in_time'];
const JOB_TYPE_DETAIL_GROUP_OPTIONS = [
  { value:'proving', label:'Proving' },
  { value:'sample_logistics', label:'Sample Logistics' },
  { value:'maintenance', label:'Maintenance' },
  { value:'execution', label:'Execution' }
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
const DEFAULT_JOB_TYPE_DEFS = [
  { jobTypeKey:'ALLOCATION_PROVING', jobTypeName:'Allocation Proving', isActive:true, scheduleMode:'range', requiredAssignmentTypes:['Technician', 'Truck', 'Equipment'], detailGroups:['proving', 'execution'] },
  { jobTypeKey:'LACT_PROVING', jobTypeName:'LACT Proving', isActive:true, scheduleMode:'range', requiredAssignmentTypes:['Technician', 'Truck', 'Equipment'], detailGroups:['proving', 'execution'] },
  { jobTypeKey:'SAMPLE_PICKUP', jobTypeName:'Sample Pickup', isActive:true, scheduleMode:'point_in_time', requiredAssignmentTypes:['Technician', 'Truck'], detailGroups:['sample_logistics', 'execution'] },
  { jobTypeKey:'SAMPLE_DROP_OFF', jobTypeName:'Sample Drop-Off', isActive:true, scheduleMode:'point_in_time', requiredAssignmentTypes:['Technician', 'Truck'], detailGroups:['sample_logistics', 'execution'] },
  { jobTypeKey:'MAINTENANCE', jobTypeName:'Maintenance', isActive:true, scheduleMode:'range', requiredAssignmentTypes:[], detailGroups:['maintenance', 'execution'] },
  { jobTypeKey:'MULTI_SERVICE', jobTypeName:'Multi-Service', isActive:true, scheduleMode:'range', requiredAssignmentTypes:[], detailGroups:['proving', 'sample_logistics', 'maintenance', 'execution'] }
];

const PRIORITY_RANK = { Urgent:0, High:1, Normal:2, Low:3 };
const RESOURCE_ENTITY_BY_TYPE = { Technician:'employees', Truck:'trucks', Trailer:'trailers', Equipment:'equipment' };

const ENTITY_CONFIG = {
  clients:{ table:'field_clients', label:'Client', idPrefix:'client', defaults:{ clientName:'', clientCode:'', accountStatus:'Active', sector:'Upstream', serviceScope:'Field', primaryContact:'', contactPhone:'', contactEmail:'', billingNotes:'', operationalNotes:'', salesforceAccountId:'', defaultServiceArea:'', hqStreet:'', hqCity:'', hqState:'', hqZip:'', hqLatitude:null, hqLongitude:null, assetPhotoPath:'', assetPhotoDataUrl:'', assetPhotoName:'', assetPhotoType:'' }, fieldMap:{ clientName:'client_name', clientCode:'client_code', accountStatus:'account_status', sector:'sector', serviceScope:'service_scope', primaryContact:'primary_contact', contactPhone:'contact_phone', contactEmail:'contact_email', billingNotes:'billing_notes', operationalNotes:'operational_notes', salesforceAccountId:'salesforce_account_id', defaultServiceArea:'default_service_area', hqStreet:'hq_street', hqCity:'hq_city', hqState:'hq_state', hqZip:'hq_zip', hqLatitude:'hq_latitude', hqLongitude:'hq_longitude', assetPhotoPath:'logo_path' }, numberFields:['hqLatitude', 'hqLongitude'], localOnlyFields:['assetPhotoDataUrl', 'assetPhotoName', 'assetPhotoType'] },
  projects:{ table:'field_projects', label:'Project', idPrefix:'proj', defaults:{ clientId:'', projectName:'', serviceScope:'Field', projectStatus:'Active', notes:'' }, fieldMap:{ clientId:'client_id', projectName:'project_name', serviceScope:'service_scope', projectStatus:'project_status', notes:'notes' }, idFields:['clientId'] },
  contacts:{ table:'field_contacts', label:'Contact', idPrefix:'contact', defaults:{ clientId:'', projectId:'', siteId:'', projectIds:[], siteIds:[], managerContactId:'', contactFirstName:'', contactLastName:'', contactName:'', contactRole:'', phone:'', email:'', contactScope:'Operations', isPrimary:false, notes:'' }, fieldMap:{ clientId:'client_id', projectId:'project_id', siteId:'site_id', managerContactId:'manager_contact_id', contactFirstName:'contact_first_name', contactLastName:'contact_last_name', contactName:'contact_name', contactRole:'contact_role', phone:'phone', email:'email', contactScope:'contact_scope', isPrimary:'is_primary', notes:'notes' }, idFields:['clientId', 'projectId', 'siteId', 'managerContactId'], booleanFields:['isPrimary'], arrayFields:['projectIds', 'siteIds'], localOnlyFields:['projectIds', 'siteIds'] },
  contactProjects:{ table:'field_contact_projects', label:'Contact Project Link', idPrefix:'contactproj', defaults:{ contactId:'', projectId:'' }, fieldMap:{ contactId:'contact_id', projectId:'project_id' }, idFields:['contactId', 'projectId'] },
  contactSites:{ table:'field_contact_sites', label:'Contact Site Link', idPrefix:'contactsite', defaults:{ contactId:'', siteId:'' }, fieldMap:{ contactId:'contact_id', siteId:'site_id' }, idFields:['contactId', 'siteId'] },
  billingProfiles:{ table:'field_billing_profiles', label:'Billing Profile', idPrefix:'bill', defaults:{ clientId:'', projectId:'', billingName:'', billingAddress:'', billingEmail:'', billingPhone:'', poNumber:'', referenceNumber:'', invoiceNotes:'', fieldBillingNotes:'', labBillingNotes:'', isDefault:false }, fieldMap:{ clientId:'client_id', projectId:'project_id', billingName:'billing_name', billingAddress:'billing_address', billingEmail:'billing_email', billingPhone:'billing_phone', poNumber:'po_number', referenceNumber:'reference_number', invoiceNotes:'invoice_notes', fieldBillingNotes:'field_billing_notes', labBillingNotes:'lab_billing_notes', isDefault:'is_default' }, idFields:['clientId', 'projectId'], booleanFields:['isDefault'] },
  siteTypes:{ table:'field_site_types', label:'Site Type', idPrefix:'sitetype', defaults:{ siteTypeKey:'', siteTypeName:'', isActive:true, siteTypeStatus:'active', defaultJobTypes:[], notes:'' }, fieldMap:{ siteTypeKey:'site_type_key', siteTypeName:'site_type_name', isActive:'is_active', notes:'notes' }, booleanFields:['isActive'], arrayFields:['defaultJobTypes'], localOnlyFields:['siteTypeStatus', 'defaultJobTypes'] },
  sites:{ table:'field_sites', label:'Site/Location', idPrefix:'site', defaults:{ clientId:'', projectId:'', projectIds:[], siteName:'', siteType:'OTHER', physicalAddress:'', countyState:'', gpsCoordinates:'', accessInstructions:'', safetyPpeNotes:'', gateCodeEntryRequirements:'', clientSiteContact:'', siteStatus:'Active', standardJobTypes:'', notes:'' }, fieldMap:{ clientId:'client_id', projectId:'project_id', siteName:'site_name', siteType:'site_type', physicalAddress:'physical_address', countyState:'county_state', gpsCoordinates:'gps_coordinates', accessInstructions:'access_instructions', safetyPpeNotes:'safety_ppe_notes', gateCodeEntryRequirements:'gate_code_entry_requirements', clientSiteContact:'client_site_contact', siteStatus:'site_status', standardJobTypes:'standard_job_types', notes:'notes' }, idFields:['clientId', 'projectId'], arrayFields:['projectIds'], localOnlyFields:['projectIds'] },
  siteProjects:{ table:'field_site_projects', label:'Site Project Link', idPrefix:'siteproj', defaults:{ siteId:'', projectId:'' }, fieldMap:{ siteId:'site_id', projectId:'project_id' }, idFields:['siteId', 'projectId'] },
  jobTypes:{ table:'field_job_types', label:'Job Type', idPrefix:'jobtype', defaults:{ jobTypeKey:'', jobTypeName:'', isActive:true, jobTypeStatus:'active', scheduleMode:'range', requiredAssignmentTypes:[], detailGroups:[] }, fieldMap:{ jobTypeKey:'job_type_key', jobTypeName:'job_type_name', isActive:'is_active', scheduleMode:'schedule_mode', requiredAssignmentTypes:'required_assignment_types', detailGroups:'detail_groups' }, booleanFields:['isActive'], arrayFields:['requiredAssignmentTypes', 'detailGroups'], localOnlyFields:['jobTypeStatus'] },
  siteTypeJobTypes:{ table:'field_site_type_job_types', label:'Site Type Job Type Link', idPrefix:'sitetypejob', defaults:{ siteTypeKey:'', jobTypeKey:'' }, fieldMap:{ siteTypeKey:'site_type_key', jobTypeKey:'job_type_key' } },
  jobs:{ table:'field_jobs', label:'Job', idPrefix:'job', defaults:{ fieldfxTicketId:'', clientId:'', projectId:'', siteId:'', jobType:'', priority:'Normal', requestedDate:'', scheduledStart:'', scheduledEnd:'', actualStart:'', actualEnd:'', durationPlanned:null, durationActual:null, scopeSummary:'', workInstructions:'', apiStandardReference:'', custodyAllocation:'Allocation', samplesRequired:false, meterUnitId:'', provingRequired:false, maintenanceRequired:false, clientContactForJob:'', dispatchNotes:'', completionNotes:'', followUpRequired:false, followUpNotes:'' }, fieldMap:{ fieldfxTicketId:'fieldfx_ticket_id', clientId:'client_id', projectId:'project_id', siteId:'site_id', jobType:'job_type', priority:'priority', requestedDate:'requested_date', scheduledStart:'scheduled_start', scheduledEnd:'scheduled_end', actualStart:'actual_start', actualEnd:'actual_end', durationPlanned:'duration_planned_minutes', durationActual:'duration_actual_minutes', scopeSummary:'scope_summary', workInstructions:'work_instructions', apiStandardReference:'api_standard_reference', custodyAllocation:'custody_allocation', samplesRequired:'samples_required', meterUnitId:'meter_unit_id', provingRequired:'proving_required', maintenanceRequired:'maintenance_required', clientContactForJob:'client_contact_for_job', dispatchNotes:'dispatch_notes', completionNotes:'completion_notes', followUpRequired:'follow_up_required', followUpNotes:'follow_up_notes' }, idFields:['clientId', 'projectId', 'siteId'], numberFields:['durationPlanned', 'durationActual'], booleanFields:['samplesRequired', 'provingRequired', 'maintenanceRequired', 'followUpRequired'], dateFields:['requestedDate'], dateTimeFields:['scheduledStart', 'scheduledEnd', 'actualStart', 'actualEnd'] },
  jobAssignments:{ table:'field_job_assignments', label:'Assignment', idPrefix:'asg', defaults:{ jobId:'', assignmentType:'Technician', resourceId:'' }, fieldMap:{ jobId:'job_id', assignmentType:'assignment_type', resourceId:'resource_id' }, idFields:['jobId', 'resourceId'] },
  employees:{ table:'employees', label:'Employee', idPrefix:'emp', defaults:{ employeeName:'', workScope:'Field', labRole:'', fieldRole:'Field Tech', canSampleTransport:false, phone:'', email:'', notes:'' }, fieldMap:{ employeeName:'employee_name', workScope:'work_scope', labRole:'lab_role', fieldRole:'field_role', canSampleTransport:'can_sample_transport', phone:'phone', email:'email', notes:'notes' }, booleanFields:['canSampleTransport'] },
  trucks:{ table:'field_trucks', label:'Truck', idPrefix:'truck', defaults:{ unitNumber:'', vehicleType:'Pickup', serviceStatus:'Available', currentDriver:'', assignedTechnicianId:'', model:'', licensePlateNumber:'', make:'', color:'', registeredState:'', vin:'', vehicleId:'', vehicleYear:null, assetPhotoPath:'', assetPhotoDataUrl:'', assetPhotoName:'', assetPhotoType:'', notes:'' }, fieldMap:{ unitNumber:'unit_number', vehicleType:'vehicle_type', serviceStatus:'service_status', currentDriver:'current_driver', assignedTechnicianId:'assigned_technician_id', model:'model', licensePlateNumber:'license_plate_number', make:'make', color:'color', registeredState:'registered_state', vin:'vin', vehicleId:'vehicle_id', vehicleYear:'vehicle_year', assetPhotoPath:'photo_path', notes:'notes' }, idFields:['assignedTechnicianId'], numberFields:['vehicleYear'], localOnlyFields:['assetPhotoDataUrl', 'assetPhotoName', 'assetPhotoType'] },
  trailers:{ table:'field_trailers', label:'Trailer', idPrefix:'trailer', defaults:{ trailerNumber:'', trailerType:'', capacityConfiguration:'', serviceStatus:'Available', assignedTruckId:'', assetPhotoPath:'', assetPhotoDataUrl:'', assetPhotoName:'', assetPhotoType:'', notes:'' }, fieldMap:{ trailerNumber:'trailer_number', trailerType:'trailer_type', capacityConfiguration:'capacity_configuration', serviceStatus:'service_status', assignedTruckId:'assigned_truck_id', assetPhotoPath:'photo_path', notes:'notes' }, idFields:['assignedTruckId'], localOnlyFields:['assetPhotoDataUrl', 'assetPhotoName', 'assetPhotoType'] },
  equipment:{ table:'field_equipment', label:'Equipment', idPrefix:'equip', defaults:{ equipmentName:'', equipmentType:'Small Volume Prover', model:'', manufacturer:'', splInventoryBarcode:'', serialNumber:'', calibrationStatus:'Current', lastCalibrationDate:'', nextCalibrationDue:'', maintenanceStatus:'Available', storageLocation:'', assignedTrailerTruck:'', assignedTruckId:'', assignedTrailerId:'', assetPhotoPath:'', assetPhotoDataUrl:'', assetPhotoName:'', assetPhotoType:'', notes:'' }, fieldMap:{ equipmentName:'equipment_name', equipmentType:'equipment_type', model:'model', manufacturer:'manufacturer', splInventoryBarcode:'spl_inventory_barcode', serialNumber:'serial_number', calibrationStatus:'calibration_status', lastCalibrationDate:'last_calibration_date', nextCalibrationDue:'next_calibration_due', maintenanceStatus:'maintenance_status', storageLocation:'storage_location', assignedTrailerTruck:'assigned_trailer_truck', assignedTruckId:'assigned_truck_id', assignedTrailerId:'assigned_trailer_id', assetPhotoPath:'photo_path', notes:'notes' }, idFields:['assignedTruckId', 'assignedTrailerId'], dateFields:['lastCalibrationDate', 'nextCalibrationDue'], localOnlyFields:['assetPhotoDataUrl', 'assetPhotoName', 'assetPhotoType'] },
  samples:{ table:'field_samples', label:'Sample', idPrefix:'sample', defaults:{ jobId:'', clientId:'', siteId:'', sampleType:'Gas', containerType:'Cylinder', collectionDateTime:'', pickedUpBy:'', dropOffLocation:'', chainOfCustodyStatus:'Requested', labReceiptStatus:'Requested', priorityTat:'', notes:'' }, fieldMap:{ jobId:'job_id', clientId:'client_id', siteId:'site_id', sampleType:'sample_type', containerType:'container_type', collectionDateTime:'collection_date_time', pickedUpBy:'picked_up_by', dropOffLocation:'drop_off_location', chainOfCustodyStatus:'chain_of_custody_status', labReceiptStatus:'lab_receipt_status', priorityTat:'priority_tat', notes:'notes' }, idFields:['jobId', 'clientId', 'siteId'], dateTimeFields:['collectionDateTime'] },
  maintenanceRecords:{ table:'field_maintenance_records', label:'Maintenance Record', idPrefix:'maint', defaults:{ assetType:'Equipment', assetId:'', maintenanceType:'Preventive', openDate:'', dueDate:'', completedDate:'', status:'Open', issueDescription:'', resolution:'', vendorInternal:'Internal', cost:null, assignedPerson:'', notes:'' }, fieldMap:{ assetType:'asset_type', assetId:'asset_id', maintenanceType:'maintenance_type', openDate:'open_date', dueDate:'due_date', completedDate:'completed_date', status:'status', issueDescription:'issue_description', resolution:'resolution', vendorInternal:'vendor_internal', cost:'cost', assignedPerson:'assigned_person', notes:'notes' }, idFields:['assetId'], numberFields:['cost'], dateFields:['openDate', 'dueDate', 'completedDate'] }
};

let state = { activeView:IS_CLIENTS_STANDALONE ? 'directory' : 'overview', scheduleAnchorDate:getStartOfWeekISO(new Date()), scheduleView:'work_week', scheduleJobFilter:'all', filters:{ dispatchSearch:'', dispatchPriority:'all', dispatchJobType:'all', dispatchJobFilter:'all', dispatchAlertFilter:'all', dispatchAssignmentFilter:'all', dispatchSortKey:'schedule', dispatchSortDirection:'asc', directoryClient:'all', directorySection:'overview', directoryClientSearch:'', directoryContactSearch:'', directoryContactScope:'all', directoryContactProject:'all', directoryContactSite:'all', directoryContactSortKey:'name', directoryContactSortDirection:'asc' }, data:createEmptyData(), saveInFlight:false, autoRefreshInFlight:false, autoRefreshTimer:null };
let modalState = createClosedModalState();
let lastLoadedSnapshot = '';
let hideSaveStatusTimer = null;
const remoteAssetPhotoUrlCache = new Map();
const remoteAssetPhotoLoadPromises = new Map();

function createEmptyData(){ return { clients:[], projects:[], contacts:[], contactProjects:[], contactSites:[], billingProfiles:[], siteTypes:[], sites:[], siteProjects:[], jobTypes:[], siteTypeJobTypes:[], jobs:[], jobAssignments:[], employees:[], trucks:[], trailers:[], equipment:[], samples:[], maintenanceRecords:[], technicians:[] }; }
function createClosedModalState(){ return { open:false, entity:'', id:'', formData:{}, assignments:[], openMultiSelectKey:'' }; }
function uid(prefix = 'fld'){ return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function clone(value){ return JSON.parse(JSON.stringify(value)); }
function firstRow(payload){ return Array.isArray(payload) ? payload[0] || null : payload; }
function normalizeBoolean(value){ return value === true || value === 'true' || value === 1 || value === '1'; }
function normalizeNumber(value){ if(value === '' || value === null || value === undefined) return null; const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
function normalizeClientCode(value){ return String(value || '').trim().toUpperCase(); }
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
function isDateField(cfg, key, remoteKey){
  if((cfg.dateFields || []).includes(key)) return true;
  return remoteKey.endsWith('_date') || key.toLowerCase().endsWith('date');
}
function isDateTimeField(cfg, key, remoteKey){
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
    case 'siteTypes': return (a, b) => compareStrings(a.siteTypeName, b.siteTypeName) || compareStrings(a.siteTypeKey, b.siteTypeKey);
    case 'sites': return (a, b) => compareStrings(a.siteName, b.siteName);
    case 'siteProjects': return (a, b) => compareStrings(a.siteId, b.siteId) || compareStrings(a.projectId, b.projectId);
    case 'jobTypes': return (a, b) => compareStrings(a.jobTypeName, b.jobTypeName) || compareStrings(a.jobTypeKey, b.jobTypeKey);
    case 'siteTypeJobTypes': return (a, b) => compareStrings(a.siteTypeKey, b.siteTypeKey) || compareStrings(a.jobTypeKey, b.jobTypeKey);
    case 'jobs': return (a, b) => compareOptionalDates(getJobPrimaryDate(a), getJobPrimaryDate(b)) || ((PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99)) || compareStrings(a.scopeSummary || a.jobType || a.id, b.scopeSummary || b.jobType || b.id);
    case 'jobAssignments': return (a, b) => compareStrings(a.assignmentType, b.assignmentType) || compareStrings(a.resourceId, b.resourceId);
    case 'employees': return (a, b) => compareStrings(a.employeeName, b.employeeName);
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
    if((cfg.booleanFields || []).includes(key)) record[key] = normalizeBoolean(raw);
    else if((cfg.numberFields || []).includes(key)) record[key] = normalizeNumber(raw);
    else if((cfg.arrayFields || []).includes(key)) record[key] = normalizeStringArray(raw);
    else if((cfg.idFields || []).includes(key)) record[key] = raw ? String(raw) : '';
    else if(isDateField(cfg, key, remoteKey)) record[key] = toInputDate(raw);
    else if(isDateTimeField(cfg, key, remoteKey)) record[key] = toInputDateTime(raw);
    else record[key] = raw === null || raw === undefined ? cfg.defaults[key] : String(raw);
  });
  return record;
}

function getDefaultJobTypeRecords(){
  return DEFAULT_JOB_TYPE_DEFS.map((row) => normalizeRecord('jobTypes', { id:row.jobTypeKey, ...row }, { fromRemote:false })).sort(getEntitySorter('jobTypes'));
}

function getDefaultSiteTypeRecords(){
  return DEFAULT_SITE_TYPE_DEFS.map((row) => normalizeRecord('siteTypes', { id:row.siteTypeKey, ...row }, { fromRemote:false })).sort(getEntitySorter('siteTypes'));
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

function normalizeData(source, fromRemote = false){
  const normalized = createEmptyData();
  ENTITY_ORDER.forEach((entityKey) => {
    const rows = Array.isArray(source?.[entityKey]) ? source[entityKey] : [];
    normalized[entityKey] = rows.map((row) => normalizeRecord(entityKey, row, { fromRemote })).sort(getEntitySorter(entityKey));
  });
  if(!normalized.jobTypes.length) normalized.jobTypes = getDefaultJobTypeRecords();
  if(!normalized.employees.length && Array.isArray(source?.technicians) && source.technicians.length){
    normalized.employees = source.technicians.map((row) => normalizeRecord('employees', {
      id:row?.id || uid('emp'),
      employeeName:row?.employeeName ?? row?.employee_name ?? '',
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
    isActive:jobType.jobTypeStatus ? statusToIsActive(jobType.jobTypeStatus) : jobType.isActive
  }, { fromRemote:false })).sort(getEntitySorter('jobTypes'));
  data.projects.forEach((project) => {
    if(!project.clientId && data.clients.length) project.clientId = data.clients[0].id;
    if(!project.serviceScope) project.serviceScope = 'Field';
    if(!project.projectStatus) project.projectStatus = 'Active';
  });
  data.clients.forEach((client) => {
    client.clientCode = normalizeClientCode(client.clientCode);
  });
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
  });
  return data;
}

function toRemotePayload(entityKey, draft){
  const cfg = ENTITY_CONFIG[entityKey];
  const payload = {};
  Object.keys(cfg.defaults).forEach((key) => {
    if((cfg.localOnlyFields || []).includes(key)) return;
    const remoteKey = cfg.fieldMap[key] || key;
    const value = draft[key];
    if((cfg.booleanFields || []).includes(key)) payload[remoteKey] = !!value;
    else if((cfg.numberFields || []).includes(key)) payload[remoteKey] = normalizeNumber(value);
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
    const responses = await Promise.all(ENTITY_ORDER.map((entityKey) => window.appAuth.requestJson(`/rest/v1/${ENTITY_CONFIG[entityKey].table}?select=*`)));
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

function getClient(id){ return state.data.clients.find((row) => row.id === id) || null; }
function getProject(id){ return state.data.projects.find((row) => row.id === id) || null; }
function getContact(id){ return state.data.contacts.find((row) => row.id === id) || null; }
function getBillingProfile(id){ return state.data.billingProfiles.find((row) => row.id === id) || null; }
function getSite(id){ return state.data.sites.find((row) => row.id === id) || null; }
function getJob(id){ return state.data.jobs.find((row) => row.id === id) || null; }
function getAssignmentsForJob(jobId){ return state.data.jobAssignments.filter((row) => row.jobId === jobId); }
function getClientLabel(clientId){ return getClient(clientId)?.clientName || 'Unknown client'; }
function getProjectLabel(projectId){ return getProject(projectId)?.projectName || 'Unknown project'; }
function getSiteLabel(siteId){ return getSite(siteId)?.siteName || 'Unknown location'; }
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
function jobTypeHasDetailGroup(value, group){
  const record = getJobTypeRecord(value);
  return !!(record && normalizeStringArray(record.detailGroups).includes(group));
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
function isFieldEligibleEmployee(employee){ return !!employee && ['Field', 'Both'].includes(employee.workScope || ''); }
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
function getJobsForClientOrSites(clientId, siteIds = getSiteIdsForClient(clientId), projectIds = getProjectIdsForClient(clientId)){ return state.data.jobs.filter((row) => row.clientId === clientId || projectIds.includes(row.projectId) || siteIds.includes(row.siteId)); }
function getSamplesForClientOrSites(clientId, siteIds = getSiteIdsForClient(clientId), jobIds = getJobsForClientOrSites(clientId, siteIds).map((row) => row.id)){ return state.data.samples.filter((row) => row.clientId === clientId || siteIds.includes(row.siteId) || jobIds.includes(row.jobId)); }
function getJobsForSite(siteId){ return state.data.jobs.filter((row) => row.siteId === siteId); }
function getSamplesForSite(siteId, jobIds = getJobsForSite(siteId).map((row) => row.id)){ return state.data.samples.filter((row) => row.siteId === siteId || jobIds.includes(row.jobId)); }
function getClientDeleteBlockMessage(clientId){
  const siteIds = getSiteIdsForClient(clientId);
  const jobs = getJobsForClientOrSites(clientId, siteIds);
  const samples = getSamplesForClientOrSites(clientId, siteIds, jobs.map((row) => row.id));
  if(!jobs.length && !samples.length) return '';
  return `This client cannot be deleted because it still has ${jobs.length} linked job${jobs.length === 1 ? '' : 's'} and ${samples.length} linked sample${samples.length === 1 ? '' : 's'}. Clear those records first.`;
}
function getProjectDeleteBlockMessage(projectId){
  const sites = getSitesForProject(projectId);
  const jobs = getJobsForProject(projectId);
  if(!sites.length && !jobs.length) return '';
  return `This project cannot be deleted because it still has ${sites.length} linked site/location record${sites.length === 1 ? '' : 's'} and ${jobs.length} linked job${jobs.length === 1 ? '' : 's'}. Clear or move those records first.`;
}
function getSiteDeleteBlockMessage(siteId){
  const jobs = getJobsForSite(siteId);
  const samples = getSamplesForSite(siteId, jobs.map((row) => row.id));
  if(!jobs.length && !samples.length) return '';
  return `This site/location cannot be deleted because it still has ${jobs.length} linked job${jobs.length === 1 ? '' : 's'} and ${samples.length} linked sample${samples.length === 1 ? '' : 's'}. Clear those records first.`;
}

function getResourceRecord(assignmentType, resourceId){
  const entityKey = RESOURCE_ENTITY_BY_TYPE[assignmentType];
  if(!entityKey) return null;
  return state.data[entityKey].find((row) => row.id === resourceId) || null;
}

function getResourceLabel(assignmentType, resourceId){
  const record = getResourceRecord(assignmentType, resourceId);
  if(!record) return 'Unknown resource';
  if(assignmentType === 'Technician') return record.employeeName || 'Unnamed employee';
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

function getFieldOpsWebhookUrl(){ return String(window.APP_CONFIG?.fieldOpsTeamsWebhookUrl || '').trim(); }

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
    site:getSiteLabel(job.siteId),
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
  const webhookUrl = getFieldOpsWebhookUrl();
  if(!webhookUrl){
    alert('Field Ops Teams webhook URL is not configured. Add fieldOpsTeamsWebhookUrl to app-config.js, then try again.');
    return;
  }
  showSaveStatus('saving', 'SENDING TEAMS TEST');
  try {
    const payload = buildTeamsWebhookPayload(pickTeamsWebhookTestJob());
    const response = await fetch(webhookUrl, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify(payload)
    });
    if(!response.ok){
      const detail = await response.text().catch(() => '');
      throw new Error(detail || `Teams webhook failed with HTTP ${response.status}.`);
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

function getJobPastComparisonDate(job){
  return parseDateTime(job?.scheduledEnd) || parseDateTime(job?.scheduledStart) || parseDateTime(job?.requestedDate);
}

function isJobPast(job, now = new Date()){
  const comparisonDate = getJobPastComparisonDate(job);
  return !!(comparisonDate && comparisonDate < now);
}

function isJobClosed(job){ return isJobPast(job); }

function isMaintenanceClosed(record){ return ['Complete', 'Canceled'].includes(record.status); }

function getAssignedResourceWarnings(job){
  const warnings = [];
  getAssignmentsForJob(job.id).forEach((assignment) => {
    const resource = getResourceRecord(assignment.assignmentType, assignment.resourceId);
    if(!resource) return;
    if(assignment.assignmentType === 'Truck' && ['Maintenance', 'Out of Service'].includes(resource.serviceStatus)) warnings.push(`${resource.unitNumber || 'Truck'} ${resource.serviceStatus.toLowerCase()}`);
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
  return {
    conflicts,
    conflictJobIds,
    missingJobs:state.data.jobs.filter((job) => !isJobClosed(job) && getJobMissingRequirements(job).length > 0),
    overdueMaintenance:state.data.maintenanceRecords.filter((record) => !isMaintenanceClosed(record) && parseDateOnly(record.dueDate) && parseDateOnly(record.dueDate) < parseDateOnly(todayISO())),
    overdueCalibration:state.data.equipment.filter((item) => item.calibrationStatus === 'Overdue'),
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
    { key:'salesforceAccountId', label:'Salesforce Account ID', type:'text' },
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
    { key:'projectIds', label:'Linked Projects', type:'multi-select', options:() => buildProjectOptions(modalState.formData.clientId), disabled:() => !modalState.formData.clientId },
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
    { key:'projectId', label:'Project', type:'select', options:() => buildProjectOptions(modalState.formData.clientId), handler:'changeBillingProject' },
    { key:'billingName', label:'Billing Name', type:'text', required:true },
    { key:'billingAddress', label:'Billing Address', type:'textarea', full:true },
    { key:'billingEmail', label:'Billing Email', type:'email' },
    { key:'billingPhone', label:'Billing Phone', type:'text' },
    { key:'poNumber', label:'PO Number', type:'text' },
    { key:'referenceNumber', label:'Reference Number', type:'text' },
    { key:'isDefault', label:'Default Billing Profile', type:'checkbox' },
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
    { key:'accessInstructions', label:'Access Instructions', type:'textarea', full:true },
    { key:'safetyPpeNotes', label:'Safety / PPE Notes', type:'textarea', full:true },
    { key:'gateCodeEntryRequirements', label:'Gate Code / Entry Requirements', type:'textarea', full:true },
    { key:'notes', label:'Notes', type:'textarea', full:true }
  ],
  jobs:[
    { kind:'section', label:'Basics' },
    { key:'clientId', label:'Client', type:'select', options:() => buildClientOptions(), handler:'changeJobClient' },
    { key:'siteId', label:'Site/Location', type:'select', options:() => buildJobSiteOptions(modalState.formData.clientId), handler:'changeJobSite', disabled:() => !modalState.formData.clientId },
    { key:'projectId', label:'Project', type:'select', options:() => buildJobProjectOptions(modalState.formData.clientId, modalState.formData.siteId), handler:'changeJobProject', disabled:() => !modalState.formData.clientId || !modalState.formData.siteId },
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
    { kind:'section', label:'Sample Logistics', detailGroup:'sample_logistics' },
    { key:'samplesRequired', label:'Samples Required', type:'checkbox', detailGroup:'sample_logistics' },
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
  employees:[
    { kind:'section', label:'Personnel' },
    { key:'employeeName', label:'Employee Name', type:'text', required:true },
    { key:'workScope', label:'Work Scope', type:'select', options:WORK_SCOPE_OPTIONS },
    { key:'labRole', label:'Lab Role', type:'select', options:LAB_ROLE_OPTIONS },
    { key:'fieldRole', label:'Field Role', type:'select', options:FIELD_ROLE_OPTIONS },
    { key:'canSampleTransport', label:'Sample Pickup / Drop-Off Eligible', type:'checkbox' },
    { key:'phone', label:'Phone', type:'text' },
    { key:'email', label:'Email', type:'email' },
    { key:'notes', label:'Notes', type:'textarea', full:true }
  ],
  trucks:[
    { kind:'section', label:'Vehicle' },
    { key:'unitNumber', label:'Unit Number', type:'text', required:true },
    { key:'vehicleType', label:'Vehicle Type', type:'select', options:TRUCK_TYPE_OPTIONS },
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
  samples:[
    { kind:'section', label:'Sample Logistics' },
    { key:'jobId', label:'Job', type:'select', options:() => buildJobOptions(), handler:'changeSampleJob' },
    { key:'clientId', label:'Client', type:'select', options:() => buildClientOptions(), handler:'changeSampleClient' },
    { key:'siteId', label:'Site/Location', type:'select', options:() => buildSiteOptions(modalState.formData.clientId) },
    { key:'sampleType', label:'Sample Type', type:'select', options:SAMPLE_TYPE_OPTIONS },
    { key:'containerType', label:'Container Type', type:'select', options:CONTAINER_TYPE_OPTIONS },
    { key:'collectionDateTime', label:'Collection Date / Time', type:'datetime-local' },
    { key:'pickedUpBy', label:'Picked Up By', type:'text' },
    { key:'dropOffLocation', label:'Drop-Off Location', type:'text' },
    { key:'chainOfCustodyStatus', label:'Chain Of Custody Status', type:'select', options:SAMPLE_STATUS_OPTIONS },
    { key:'labReceiptStatus', label:'Lab Receipt Status', type:'select', options:LAB_RECEIPT_STATUS_OPTIONS },
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
function buildJobProjectOptions(clientId = '', siteId = ''){
  if(!clientId || !siteId) return [];
  return getLinkedProjectsForSite(siteId)
    .filter((project) => !clientId || project.clientId === clientId)
    .map((project) => ({ value:project.id, label:`${project.projectName || 'Unnamed project'} | ${getClientLabel(project.clientId)}` }));
}
function buildJobTypeOptions(currentValue = ''){
  return getActiveJobTypes(currentValue).map((jobType) => ({ value:jobType.jobTypeKey, label:jobType.jobTypeName || 'Unnamed job type' }));
}
function buildContactSiteOptions(clientId = ''){
  return state.data.sites
    .filter((row) => !clientId || row.clientId === clientId)
    .map((row) => {
      const linkedProjects = getLinkedProjectsForSite(row.id).map((project) => project.projectName || 'Unnamed project');
      return { value:row.id, label:`${row.siteName || 'Unnamed location'} | ${linkedProjects.join(', ') || 'No linked project'}` };
    });
}
function buildAllJobTypeOptions(){
  return [...state.data.jobTypes].sort(getEntitySorter('jobTypes')).map((jobType) => ({ value:jobType.jobTypeKey, label:jobType.jobTypeName || 'Unnamed job type' }));
}
function buildSiteTypeOptions(currentValue = ''){
  return getActiveSiteTypes(currentValue).map((siteType) => ({ value:siteType.siteTypeKey, label:siteType.siteTypeName || 'Unnamed site type' }));
}
function buildJobOptions(){ return state.data.jobs.map((row) => ({ value:row.id, label:`${getJobDisplayTitle(row)} | ${getSiteLabel(row.siteId)}` })); }
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
function buildResourceOptions(assignmentType = 'Technician'){
  if(assignmentType === 'Technician') return buildTechnicianOptions(modalState.formData.jobType);
  const entityKey = RESOURCE_ENTITY_BY_TYPE[assignmentType];
  return entityKey ? state.data[entityKey].map((row) => ({ value:row.id, label:getResourceLabel(assignmentType, row.id) })) : [];
}
function buildTechnicianOptions(jobType = ''){
  return state.data.employees
    .filter((row) => isFieldEligibleEmployee(row) && (!isSampleTransportJobType(jobType) || row.canSampleTransport))
    .map((row) => ({ value:row.id, label:row.employeeName || 'Unnamed employee' }));
}
function buildTechnicianAssignmentOptions(){ return [{ value:'', label:'Pool' }, ...buildTechnicianOptions()]; }
function buildTruckAssignmentOptions(){ return [{ value:'', label:'Pool' }, ...buildTruckOptions()]; }
function buildTruckOptions(){ return state.data.trucks.map((row) => ({ value:row.id, label:row.unitNumber || 'Unnamed truck' })); }
function buildTrailerOptions(){ return state.data.trailers.map((row) => ({ value:row.id, label:row.trailerNumber || 'Unnamed trailer' })); }
function getTechnicianLabel(id){ return state.data.employees.find((row) => row.id === id)?.employeeName || 'Unassigned'; }
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

function getPriorityBadge(priority){ const value = priority || 'Low'; const cls = value.toLowerCase().replace(/\s+/g, '-'); return `<span class="priority-badge ${cls}">${esc(value)}</span>`; }
function getStatusTone(status){ if(['In Progress', 'Available', 'Current', 'Logged In'].includes(status)) return 'ok'; if(['Waiting', 'Scheduled', 'Due Soon', 'Collected', 'Delivered', 'Assigned'].includes(status)) return 'warn'; if(['Urgent', 'Overdue', 'Out of Service', 'Needs Repair', 'Canceled', 'Exception'].includes(status)) return 'danger'; if(['Complete', 'Closed', 'Inactive'].includes(status)) return 'muted'; return 'info'; }
function getStatusBadge(status){ return `<span class="status-badge ${getStatusTone(status)}">${esc(status || 'Not set')}</span>`; }
function getJobTypeBadge(jobType){
  const label = getJobTypeDisplayName(jobType);
  const key = normalizeJobTypeKey(jobType);
  const cls = key ? key.toLowerCase().replace(/_/g, '-') : 'unknown';
  return `<span class="job-type-badge job-type-${esc(cls)}">${esc(label)}</span>`;
}
function getJobTypeClassName(jobType){
  const key = normalizeJobTypeKey(jobType);
  return key ? `job-type-${key.toLowerCase().replace(/_/g, '-')}` : 'job-type-unknown';
}
function normalizeOptions(options){ if(!Array.isArray(options)) return []; return options.map((option) => typeof option === 'string' ? { value:option, label:option } : option); }
function renderTags(csvText){ const tags = String(csvText || '').split(',').map((value) => value.trim()).filter(Boolean); return tags.length ? `<div class="tag-row">${tags.map((tag) => `<span class="tag-chip">${esc(tag)}</span>`).join('')}</div>` : '<span class="muted">None listed</span>'; }
function renderWarnings(warnings){ return warnings.length ? `<div class="warning-row">${warnings.map((warning) => `<span class="warning-chip">${esc(warning)}</span>`).join('')}</div>` : ''; }
function renderCardOpenAttrs(entityKey, id){ return `class="resource-card clickable-card" role="button" tabindex="0" onclick="openEntityModal('${entityKey}','${esc(id)}')" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); openEntityModal('${entityKey}','${esc(id)}'); }"`; }
function renderSelectableOpenAttrs(entityKey, id, className, title = ''){
  const label = title || `Open ${ENTITY_CONFIG[entityKey].label}`;
  return `class="${esc(className)}" role="button" tabindex="0" title="${esc(label)}" onclick="openEntityModal('${entityKey}','${esc(id)}')" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); openEntityModal('${entityKey}','${esc(id)}'); }"`;
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

function getJobWarnings(job, derived){
  const warnings = [];
  const missing = getJobMissingRequirements(job);
  if(missing.length) warnings.push(`Missing: ${missing.join(', ')}`);
  if(derived.conflictJobIds.has(job.id)) warnings.push('Resource conflict');
  warnings.push(...getAssignedResourceWarnings(job));
  return [...new Set(warnings)];
}

function renderMiniJobList(jobs, derived, emptyText){
  if(!jobs.length) return `<div class="empty-state"><strong>Nothing to show</strong>${esc(emptyText)}</div>`;
  return `<div class="mini-list">${[...jobs].sort(getEntitySorter('jobs')).map((job) => `<div class="mini-card"><div class="mini-head"><div><div class="item-title">${esc(getJobDisplayTitle(job))}</div><div class="muted">${esc(getClientLabel(job.clientId))} | ${esc(getProjectLabel(job.projectId))} | ${esc(getSiteLabel(job.siteId))}</div></div>${getPriorityBadge(job.priority)}</div><div class="mini-tags"><span class="mini-tag">${esc(getJobScheduleLabel(job))}</span></div>${renderWarnings(getJobWarnings(job, derived))}</div>`).join('')}</div>`;
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

function renderDispatchAlertsCell(warnings){
  return warnings.length ? renderWarnings(warnings) : '<span class="muted">None</span>';
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
      client:[getClientLabel(job.clientId), getProjectLabel(job.projectId), getSiteLabel(job.siteId)].join(' '),
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
    const haystack = [getJobDisplayTitle(job), getJobTypeDisplayName(job.jobType), job.scopeSummary, job.clientContactForJob, getClientLabel(job.clientId), getProjectLabel(job.projectId), getSiteLabel(job.siteId), row.techLabels.join(' '), row.truckLabels.join(' '), row.equipmentLabels.join(' '), row.warnings.join(' ')].join(' ').toLowerCase();
    return haystack.includes(search);
  }).sort(compareDispatchRows);
}

function renderOverview(derived){
  const todayJobs = state.data.jobs.filter((job) => isSameDay(getJobPrimaryDate(job), todayISO()));
  const nextSevenJobs = state.data.jobs.filter((job) => { const date = getJobPrimaryDate(job); const today = parseDateOnly(todayISO()); const max = parseDateOnly(addDaysISO(todayISO(), 7)); return !!(date && today && max && date >= today && date <= max); });
  const samplesInTransit = state.data.samples.filter((row) => row.chainOfCustodyStatus === 'In Transit');
  const openJobs = state.data.jobs.filter((job) => !isJobClosed(job));
  document.getElementById('overview-stats').innerHTML = [{ label:'Jobs Today', value:todayJobs.length, cls:'' }, { label:'Open Jobs', value:openJobs.length, cls:'ok' }, { label:'Samples In Transit', value:samplesInTransit.length, cls:'warn' }, { label:'Assets Down', value:derived.downAssets.length, cls:'danger' }].map((card) => `<div class="stat-card ${card.cls}"><div class="stat-label">${esc(card.label)}</div><div class="stat-value ${card.cls}">${esc(card.value)}</div></div>`).join('');
  document.getElementById('overview-actions').innerHTML = `<button class="add-btn" type="button" onclick="openEntityModal('jobs')">+ Add Job</button><button class="act-btn" type="button" onclick="window.location.href='clients.html'">Open Clients</button><button class="act-btn" type="button" onclick="window.location.href='employees.html'">Open Employees</button><button class="act-btn" type="button" onclick="openEntityModal('samples')">+ Add Sample</button>`;
  document.getElementById('today-jobs-panel').innerHTML = renderMiniJobList(todayJobs, derived, 'No field jobs are scheduled for today yet.');
  const assignedTechCount = state.data.trucks.filter((row) => row.assignedTechnicianId).length;
  document.getElementById('resource-readiness-panel').innerHTML = `<div class="summary-grid"><div class="summary-card"><div class="label">Employees</div><div class="value">${state.data.employees.filter((row) => isFieldEligibleEmployee(row)).length}</div><div class="muted">${assignedTechCount} truck assignment${assignedTechCount === 1 ? '' : 's'}</div></div><div class="summary-card"><div class="label">Available Trucks</div><div class="value">${state.data.trucks.filter((row) => row.serviceStatus === 'Available').length}</div><div class="muted">${state.data.trucks.filter((row) => row.serviceStatus === 'Out of Service').length} out of service</div></div><div class="summary-card"><div class="label">Available Trailers</div><div class="value">${state.data.trailers.filter((row) => ['Available', 'Assigned'].includes(row.serviceStatus)).length}</div><div class="muted">${state.data.trailers.filter((row) => row.serviceStatus === 'Maintenance').length} in maintenance</div></div><div class="summary-card"><div class="label">Ready Provers</div><div class="value">${state.data.equipment.filter((row) => ['Small Volume Prover', 'Master Meter'].includes(row.equipmentType) && row.maintenanceStatus !== 'Out of Service' && row.calibrationStatus !== 'Overdue').length}</div><div class="muted">${derived.overdueCalibration.length} calibration overdue</div></div></div>`;
  document.getElementById('issues-panel').innerHTML = `<div class="issue-list">${renderIssueCard('Scheduling Conflicts', derived.conflicts.length, 'Double-booked employees, trucks, trailers, or equipment.')}${renderIssueCard('Jobs Missing Required Resources', derived.missingJobs.length, 'Required assignments still missing for active jobs.')}${renderIssueCard('Missing / Early COC', derived.missingCocSamples.length, 'Samples still requested or collected without a complete handoff chain.')}${renderIssueCard('Overdue Maintenance', derived.overdueMaintenance.length, 'Maintenance items past their due date and still open.')}${renderIssueCard('Calibration Overdue', derived.overdueCalibration.length, 'Equipment that should not be dispatched without review.')}</div>`;
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
    { key:'equipment', label:'Equipment' },
    { key:'alerts', label:'Alerts' }
  ];
  return `<div class="table-wrap"><table class="dispatch-table"><thead><tr>${columns.map((column) => `<th>${renderDispatchSortHeader(column)}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => {
    const job = row.job;
    const cells = [
      `<div class="inline-stack dispatch-job-cell"><div>${getJobTypeBadge(job.jobType)}</div><div class="muted">${esc(job.scopeSummary || 'No scope summary')}</div>${job.custodyAllocation ? `<div class="muted">${esc(job.custodyAllocation)}</div>` : ''}</div>`,
      `<div class="inline-stack"><div class="item-title">${esc(getClientLabel(job.clientId))}</div><div class="muted">${esc(getProjectLabel(job.projectId))} | ${esc(getSiteLabel(job.siteId))}</div></div>`,
      `<div class="inline-stack"><div>${esc(getJobScheduleLabel(job))}</div></div>`,
      getPriorityBadge(job.priority),
      renderDispatchAssignmentCell(row.techLabels),
      renderDispatchAssignmentCell(row.truckLabels),
      renderDispatchAssignmentCell(row.equipmentLabels),
      renderDispatchAlertsCell(row.warnings)
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
    state.scheduleView === 'month' && !isDateInScheduleMonth(dateIso) ? 'outside-month' : ''
  ].filter(Boolean).join(' ');
}

function renderSchedule(derived){
  const scheduleDates = getScheduleDates();
  const scheduleJobs = getJobsForScheduleDates(scheduleDates);
  const totalJobsInRange = getJobsForScheduleDates(scheduleDates, 'all').length;
  const filterLabel = getScheduleFilterOptions().find((option) => option.value === state.scheduleJobFilter)?.label || 'All';
  document.getElementById('schedule-toolbar').innerHTML = `${renderScheduleSegmentedControl('View', getScheduleViewOptions(), state.scheduleView, 'setScheduleView')}${renderScheduleSegmentedControl('Jobs', getScheduleFilterOptions(), state.scheduleJobFilter, 'setScheduleJobFilter')}<span class="label">Period</span><button class="act-btn" type="button" onclick="changeScheduleWeek(-1)">Prev</button><button class="act-btn" type="button" onclick="resetScheduleWeek()">Current</button><button class="act-btn" type="button" onclick="changeScheduleWeek(1)">Next</button><button class="act-btn" type="button" onclick="sendTeamsWebhookTest()">Send Teams Test</button><div class="toolbar-summary">${esc(getSchedulePeriodLabel(scheduleDates))}</div>`;
  document.getElementById('schedule-summary').textContent = `${scheduleJobs.length} visible / ${totalJobsInRange} jobs ${getScheduleViewSummaryLabel(state.scheduleView)} | ${getScheduleViewLabel(state.scheduleView)} | ${filterLabel}`;
  document.getElementById('schedule-board').innerHTML = `<div class="schedule-week schedule-${esc(state.scheduleView)}">${scheduleDates.map((dateIso) => { const jobsForDay = scheduleJobs.filter((job) => isSameDay(getJobPrimaryDate(job), dateIso)); return `<div class="${getScheduleDayClasses(dateIso)}"><div class="day-head"><strong>${esc(parseDateOnly(dateIso)?.toLocaleDateString('en-US', { weekday:'long' }) || '')}</strong><span>${esc(fmtDate(dateIso))}</span></div><div class="day-list">${jobsForDay.length ? jobsForDay.map((job) => { const warnings = getJobWarnings(job, derived); const missingEquipment = getJobMissingRequirements(job).includes('Equipment'); const pastJob = isJobPast(job); const cardClasses = ['schedule-card', 'clickable-card', getJobTypeClassName(job.jobType), missingEquipment ? 'missing-equipment' : '', pastJob ? 'past-job' : '', derived.conflictJobIds.has(job.id) ? 'conflict' : '', warnings.length ? 'warning' : ''].filter(Boolean).join(' '); return `<div ${renderSelectableOpenAttrs('jobs', job.id, cardClasses, 'Open Job')}><div class="item-title">${esc(getJobDisplayTitle(job))}</div><div class="muted">${esc(fmtTime(job.scheduledStart || job.requestedDate))} | ${esc(getSiteLabel(job.siteId))}</div>${renderScheduleTechnicianLine(job.id)}${renderWarnings(warnings)}</div>`; }).join('') : '<div class="empty-state">No scheduled jobs</div>'}</div></div>`; }).join('')}</div>`;
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
  return state.data.billingProfiles
    .filter((row) => row.clientId === clientId && (projectId === 'all' || !row.projectId || row.projectId === projectId))
    .sort(getEntitySorter('billingProfiles'));
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
  return `<div class="summary-grid directory-summary-grid"><div class="summary-card"><div class="label">Service Scope</div><div class="value">${esc(client.serviceScope || 'Field')}</div><div class="muted">${esc(client.sector || 'No sector')}</div></div><div class="summary-card"><div class="label">Client Code</div><div class="value">${esc(normalizeClientCode(client.clientCode) || 'Missing')}</div><div class="muted">Lab samples tie back to this client through the shared code.</div></div><div class="summary-card"><div class="label">Projects</div><div class="value">${projects.length}</div><div class="muted">Manage project scope from the Projects tab.</div></div><div class="summary-card"><div class="label">Contacts</div><div class="value">${contacts.length}</div><div class="muted">${esc(primaryContacts.length ? `${primaryContacts.length} primary contact${primaryContacts.length === 1 ? '' : 's'}` : 'No primary contacts flagged')}</div></div><div class="summary-card"><div class="label">Site/Locations</div><div class="value">${sites.length}</div><div class="muted">${esc(jobs.length)} active workflow record(s) for this client</div></div></div><div class="directory-section-grid"><div class="summary-card"><div class="label">Company Snapshot</div><div class="value">${esc(client.clientName || 'Unnamed client')}</div><div class="muted">${esc(normalizeClientCode(client.clientCode) || 'No client code')}</div><div class="muted">${esc(address || 'No HQ address on file')}</div><div class="muted">${esc(client.defaultServiceArea || 'No default service area')}</div><div class="mini-tags">${getStatusBadge(client.accountStatus)}${getStatusBadge(client.serviceScope || 'Field')}</div></div><div class="summary-card"><div class="label">Billing Snapshot</div><div class="value">${esc(billingProfiles[0]?.billingName || 'No billing profile')}</div><div class="muted">${esc(billingProfiles[0]?.billingEmail || billingProfiles[0]?.billingPhone || client.contactEmail || 'No billing contact on file')}</div><div class="muted">${esc(billingProfiles[0]?.poNumber || billingProfiles[0]?.referenceNumber || 'No PO / reference')}</div></div><div class="summary-card"><div class="label">Field Snapshot</div><div class="value">${esc(client.primaryContact || 'No primary contact')}</div><div class="muted">${esc(client.contactPhone || client.contactEmail || 'No client phone or email')}</div><div class="muted">${esc(client.operationalNotes || 'No field notes added yet')}</div></div></div><div class="directory-subsection"><div class="panel-header directory-subsection-head"><h2>Upcoming Jobs</h2><button class="act-btn" type="button" onclick="openEntityModal('jobs')">+ Add Job</button></div><div class="panel-body">${upcomingJobs.length ? `<div class="mini-list">${upcomingJobs.map((job) => `<div class="mini-card clickable-card" role="button" tabindex="0" onclick="openEntityModal('jobs','${esc(job.id)}')" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); openEntityModal('jobs','${esc(job.id)}'); }"><div class="mini-head"><div><div class="item-title">${esc(getJobDisplayTitle(job))}</div><div class="muted">${esc(getProjectLabel(job.projectId))} | ${esc(getSiteLabel(job.siteId))}</div></div>${getPriorityBadge(job.priority)}</div><div class="mini-tags"><span class="mini-tag">${esc(getJobScheduleLabel(job))}</span></div></div>`).join('')}</div>` : '<div class="empty-state">No jobs are queued for this client yet.</div>'}</div></div>`;
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
  const billingProfiles = getDirectoryBillingProfiles(clientId, activeProjectId);
  return renderTable(['Billing Profile', 'Project', 'Billing Contact', 'PO / Reference', 'Default', 'Notes'], billingProfiles.map((profile) => buildTableRow('billingProfiles', profile.id, [
    `<div class="inline-stack"><div class="item-title">${esc(profile.billingName || 'Unnamed billing profile')}</div><div class="muted">${esc(profile.billingAddress || 'No billing address')}</div></div>`,
    esc(profile.projectId ? getProjectLabel(profile.projectId) : 'Client-wide'),
    `<div class="inline-stack"><div>${esc(profile.billingEmail || 'No email')}</div><div class="muted">${esc(profile.billingPhone || 'No phone')}</div></div>`,
    `<div class="inline-stack"><div>${esc(profile.poNumber || 'No PO')}</div><div class="muted">${esc(profile.referenceNumber || 'No reference')}</div></div>`,
    profile.isDefault ? '<span class="tag-chip">Default</span>' : '<span class="muted">No</span>',
    `<div class="muted">${esc(profile.invoiceNotes || profile.fieldBillingNotes || profile.labBillingNotes || 'No notes')}</div>`
  ])), '<strong>No billing profiles yet</strong>Capture field and lab invoicing details here so the client record stays usable across both teams.');
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
  document.getElementById('directory-detail-meta').textContent = `${normalizeClientCode(activeClient.clientCode) || 'No client code'} | ${getDirectoryProjects(activeClient.id).length} projects | ${contacts.length} contacts | ${billingProfiles.length} billing profile(s) | ${sites.length} site(s)`;
  document.getElementById('directory-detail-actions').innerHTML = `<button class="act-btn" type="button" onclick="openEntityModal('clients','${esc(activeClient.id)}')">Edit Client</button><button class="act-btn" type="button" onclick="openEntityModal('projects')">+ Project</button><button class="act-btn" type="button" onclick="openEntityModal('contacts')">+ Contact</button><button class="act-btn" type="button" onclick="openEntityModal('billingProfiles')">+ Billing</button><button class="act-btn" type="button" onclick="openEntityModal('sites')">+ Site/Location</button><button class="add-btn" type="button" onclick="openEntityModal('jobs')">+ Job</button>`;
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
  document.getElementById('employees-panel').innerHTML = renderResourceCards(state.data.employees.filter((employee) => isFieldEligibleEmployee(employee)), (employee) => `<div class="resource-card clickable-card" role="button" tabindex="0" onclick="window.location.href='employees.html'" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); window.location.href='employees.html'; }"><div class="resource-card-head"><div><div class="item-title">${esc(employee.employeeName || 'Unnamed employee')}</div><div class="muted">${esc(employee.fieldRole || employee.labRole || 'No role set')}</div></div><div class="mini-tags">${getStatusBadge(employee.workScope || 'Field')}${employee.canSampleTransport ? '<span class="warning-chip">Sample Pickup / Drop-Off</span>' : ''}</div></div><div class="muted">Default Truck: ${esc(getDefaultTruckForTechnician(employee.id)?.unitNumber || 'Pool')}</div><div class="muted">${esc(employee.phone || employee.email || 'No contact info')}</div></div>`, 'No field-eligible employees yet');
  document.getElementById('trucks-panel').innerHTML = renderResourceCards(state.data.trucks, (truck) => `<div ${renderCardOpenAttrs('trucks', truck.id)}>${renderAssetPhoto(truck, { className:'resource-photo', emptyLabel:getAssetPhotoEmptyLabel('trucks'), alt:getAssetPhotoAlt('trucks', truck), fallbackImageSrc:getDefaultAssetIconSrc('trucks', truck) })}<div class="resource-card-head"><div><div class="item-title">${esc(truck.unitNumber || 'Unnamed truck')}</div><div class="muted">${esc([truck.color, truck.vehicleYear, truck.make, truck.model].filter(Boolean).join(' ') || truck.vehicleType)}</div></div>${getStatusBadge(truck.serviceStatus)}</div><div class="muted">${esc(truck.licensePlateNumber || 'No plate')} ${truck.registeredState ? `| ${esc(truck.registeredState)}` : ''}</div><div class="muted">${truck.vin ? `VIN: ${esc(truck.vin)}` : 'No VIN'}</div><div class="muted">Assigned Employee: ${esc(truck.assignedTechnicianId ? getTechnicianLabel(truck.assignedTechnicianId) : 'Pool')}</div></div>`, 'No trucks yet');
  document.getElementById('trailers-panel').innerHTML = renderResourceCards(state.data.trailers, (trailer) => `<div ${renderCardOpenAttrs('trailers', trailer.id)}>${renderAssetPhoto(trailer, { className:'resource-photo', emptyLabel:getAssetPhotoEmptyLabel('trailers'), alt:getAssetPhotoAlt('trailers', trailer), fallbackImageSrc:getDefaultAssetIconSrc('trailers', trailer) })}<div class="resource-card-head"><div><div class="item-title">${esc(trailer.trailerNumber || 'Unnamed trailer')}</div><div class="muted">${esc(trailer.trailerType || 'No trailer type')}</div></div>${getStatusBadge(trailer.serviceStatus)}</div><div class="muted">${esc(trailer.capacityConfiguration || 'No capacity/configuration')}</div><div class="muted">Assigned Truck: ${esc(trailer.assignedTruckId ? getTruckLabel(trailer.assignedTruckId) : 'Unassigned')}</div></div>`, 'No trailers yet');
  document.getElementById('equipment-panel').innerHTML = renderResourceCards(state.data.equipment, (item) => `<div ${renderCardOpenAttrs('equipment', item.id)}><div class="resource-card-head"><div><div class="item-title">${esc(item.equipmentName || 'Unnamed equipment')}</div><div class="muted">${esc(item.equipmentType)}</div></div>${getStatusBadge(item.maintenanceStatus)}</div><div class="mini-tags">${getStatusBadge(item.calibrationStatus)}${item.serialNumber ? `<span class="tag-chip">${esc(item.serialNumber)}</span>` : ''}</div><div class="muted">${esc([item.manufacturer, item.model].filter(Boolean).join(' | ') || 'No manufacturer or model')}</div><div class="muted">${esc(item.splInventoryBarcode ? `Barcode: ${item.splInventoryBarcode}` : 'No SPL inventory barcode')}</div><div class="muted">Truck: ${esc(item.assignedTruckId ? getTruckLabel(item.assignedTruckId) : 'Pool')} | Trailer: ${esc(item.assignedTrailerId ? getTrailerLabel(item.assignedTrailerId) : 'Pool')}</div></div>`, 'No equipment yet');
}

function renderSetup(){
  const siteTypesPanel = document.getElementById('site-types-panel');
  if(siteTypesPanel) siteTypesPanel.innerHTML = renderResourceCards(state.data.siteTypes.sort(getEntitySorter('siteTypes')), (siteType) => {
    const defaultLabels = getDefaultJobTypeLabelsForSiteType(siteType.siteTypeKey);
    const siteCount = state.data.sites.filter((site) => site.siteType === siteType.siteTypeKey).length;
    return `<div ${renderCardOpenAttrs('siteTypes', siteType.id)}><div class="resource-card-head"><div><div class="item-title">${esc(siteType.siteTypeName || 'Unnamed site type')}</div></div><div class="mini-tags">${siteType.isActive ? '<span class="tag-chip">Active</span>' : '<span class="warning-chip">Inactive</span>'}</div></div><div class="muted">Default Jobs: ${esc(defaultLabels.join(', ') || 'None')}</div><div class="muted">${esc(siteCount)} site${siteCount === 1 ? '' : 's'} using this type</div><div class="muted">${esc(siteType.notes || 'No notes')}</div></div>`;
  }, 'No site types yet');
  const jobTypesPanel = document.getElementById('job-types-panel');
  if(jobTypesPanel) jobTypesPanel.innerHTML = renderResourceCards(state.data.jobTypes.sort(getEntitySorter('jobTypes')), (jobType) => `<div ${renderCardOpenAttrs('jobTypes', jobType.id || jobType.jobTypeKey)}><div class="resource-card-head"><div><div class="item-title">${esc(jobType.jobTypeName || 'Unnamed job type')}</div></div><div class="mini-tags">${getStatusBadge(jobType.scheduleMode || 'range')}${jobType.isActive ? '<span class="tag-chip">Active</span>' : '<span class="warning-chip">Inactive</span>'}</div></div><div class="muted">Required: ${esc(normalizeStringArray(jobType.requiredAssignmentTypes).join(', ') || 'None')}</div><div class="muted">Details: ${esc(normalizeStringArray(jobType.detailGroups).join(', ') || 'None')}</div></div>`, 'No job types yet');
}

function renderSamples(){
  const inTransit = state.data.samples.filter((sample) => sample.chainOfCustodyStatus === 'In Transit').length;
  document.getElementById('samples-summary').textContent = `${state.data.samples.length} total | ${inTransit} in transit`;
  document.getElementById('samples-table').innerHTML = renderTable(['Sample', 'Job / Client Scope', 'Collected', 'COC', 'Lab Receipt', 'Drop-Off / Priority'], state.data.samples.map((sample) => { const job = getJob(sample.jobId); const projectLabel = job?.projectId ? getProjectLabel(job.projectId) : 'No project'; return buildTableRow('samples', sample.id, [ `<div class="inline-stack"><div class="item-title">${esc(sample.sampleType)}</div><div class="muted">${esc(sample.containerType)}</div></div>`, `<div class="inline-stack"><div>${esc(getJobLabel(sample.jobId))}</div><div class="muted">${esc(getClientLabel(sample.clientId))} | ${esc(projectLabel)} | ${esc(getSiteLabel(sample.siteId))}</div></div>`, esc(fmtDateTime(sample.collectionDateTime)), getStatusBadge(sample.chainOfCustodyStatus), getStatusBadge(sample.labReceiptStatus), `<div class="inline-stack"><div>${esc(sample.dropOffLocation || 'No drop-off set')}</div><div class="muted">${esc(sample.priorityTat || 'No priority / TAT')}</div></div>` ]); }), '<strong>No sample records yet</strong>Track pickups, chain of custody, and lab handoff from here.');
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
  if(document.getElementById('employees-panel')) renderResources();
  if(document.getElementById('site-types-panel')) renderSetup();
  if(document.getElementById('samples-table')) renderSamples();
  if(document.getElementById('maintenance-table')) renderMaintenance();
  if(document.getElementById('entity-modal-overlay')) renderModal();
  hydrateAssetPhotoPreviews();
}

function getNewRecordDraft(entityKey){
  const base = clone(ENTITY_CONFIG[entityKey].defaults);
  if(entityKey === 'samples') base.collectionDateTime = nowInputDateTime();
  if(entityKey === 'maintenanceRecords') base.openDate = todayISO();
  return base;
}

function normalizeOptionsList(options){ return normalizeOptions(typeof options === 'function' ? options() : options); }
function isEmptyOptionValue(value){ return value === '' || value === null || value === undefined; }
function hasExplicitEmptyOption(options){ return options.some((option) => isEmptyOptionValue(option?.value)); }
function isFieldDisabled(field){ return typeof field?.disabled === 'function' ? !!field.disabled() : !!field?.disabled; }
function shouldRenderField(field){
  if(!field || modalState.entity !== 'jobs') return true;
  if(Array.isArray(field.scheduleModes) && field.scheduleModes.length && !field.scheduleModes.includes(getJobTypeScheduleMode(modalState.formData.jobType))) return false;
  if(field.detailGroup && !jobTypeHasDetailGroup(modalState.formData.jobType, field.detailGroup)) return false;
  if(Array.isArray(field.jobTypes) && field.jobTypes.length){
    const currentValue = resolveJobTypeValue(state.data.jobTypes, modalState.formData.jobType);
    return field.jobTypes.map((value) => resolveJobTypeValue(state.data.jobTypes, value)).includes(currentValue);
  }
  return true;
}

function toggleModalArrayValue(key, optionValue, checked){
  if(!modalState.open) return;
  const values = normalizeStringArray(modalState.formData[key]);
  const nextValues = checked ? [...new Set([...values, optionValue])] : values.filter((value) => value !== optionValue);
  modalState.formData[key] = nextValues;
  renderModal();
}

function toggleModalMultiSelect(key){
  if(!modalState.open) return;
  modalState.openMultiSelectKey = modalState.openMultiSelectKey === key ? '' : key;
  renderModal();
}

function getModalMultiSelectSummary(options, selectedValues){
  const selectedOptions = options.filter((option) => selectedValues.includes(String(option.value)));
  if(!selectedOptions.length) return 'Select options...';
  if(selectedOptions.length === 1) return selectedOptions[0].label;
  return `${selectedOptions.length} selected`;
}

function getModalMultiSelectDetail(options, selectedValues){
  const selectedOptions = options.filter((option) => selectedValues.includes(String(option.value)));
  return selectedOptions.length ? selectedOptions.map((option) => option.label).join(', ') : 'No selections';
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
    return `<div class="form-group${fullClass}"><label class="form-label">${esc(field.label)}</label><div class="multi-select ${isOpen ? 'open' : ''} ${disabled ? 'is-disabled' : ''}"><button class="multi-select-trigger" type="button" ${disabled ? 'disabled' : ''} aria-expanded="${isOpen ? 'true' : 'false'}" onclick="toggleModalMultiSelect('${field.key}')"><span>${esc(getModalMultiSelectSummary(options, selectedValues))}</span><span class="multi-select-caret">v</span></button><div class="multi-select-detail">${esc(getModalMultiSelectDetail(options, selectedValues))}</div><div class="multi-select-menu">${options.length ? options.map((option) => `<label class="multi-select-option"><input type="checkbox" value="${esc(option.value)}" ${selectedValues.includes(String(option.value)) ? 'checked' : ''} ${disabled ? 'disabled' : ''} onchange="toggleModalArrayValue('${field.key}', '${esc(option.value)}', this.checked)"><span>${esc(option.label)}</span></label>`).join('') : '<div class="empty-state">No options available.</div>'}</div></div></div>`;
  }
  if(field.type === 'image') return renderAssetPhotoField(field);
  const value = modalState.formData[field.key];
  const options = normalizeOptionsList(field.options || []);
  const includeEmptyOption = !hasExplicitEmptyOption(options);
  const emptyOptionLabel = field.placeholderLabel || (field.required ? 'Select...' : '');
  const control = field.type === 'textarea'
    ? `<textarea class="form-input" ${disabled ? 'disabled' : ''} oninput="setModalField('${field.key}', this.value)">${esc(value)}</textarea>`
    : field.type === 'select'
      ? `<select class="form-input" ${disabled ? 'disabled' : ''} onchange="${field.handler ? `${field.handler}(this.value)` : `setModalField('${field.key}', this.value)`}">${includeEmptyOption ? `<option value="">${esc(emptyOptionLabel)}</option>` : ''}${options.map((option) => `<option value="${esc(option.value)}" ${String(value) === String(option.value) ? 'selected' : ''}>${esc(option.label)}</option>`).join('')}</select>`
      : `<input class="form-input" ${disabled ? 'disabled' : ''} type="${field.type || 'text'}" value="${esc(value ?? '')}" oninput="setModalField('${field.key}', this.value, '${field.type === 'number' ? 'number' : 'text'}')">`;
  return `<div class="form-group${fullClass}"><label class="form-label">${esc(field.label)}</label>${control}</div>`;
}

function renderAssignmentRow(assignment){
  return `<div class="assignment-row"><div class="form-group"><label class="form-label">Assignment Type</label><select class="form-input" onchange="updateModalAssignmentField('${assignment.id}', 'assignmentType', this.value)">${ASSIGNMENT_TYPE_OPTIONS.map((option) => `<option value="${esc(option)}" ${assignment.assignmentType === option ? 'selected' : ''}>${esc(option)}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">Resource</label><select class="form-input" onchange="updateModalAssignmentField('${assignment.id}', 'resourceId', this.value)"><option value="">Select resource...</option>${buildResourceOptions(assignment.assignmentType).map((option) => `<option value="${esc(option.value)}" ${assignment.resourceId === option.value ? 'selected' : ''}>${esc(option.label)}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">Remove</label><button class="act-btn danger" type="button" onclick="removeAssignmentRow('${assignment.id}')">Delete</button></div></div>`;
}

function getModalTruckAssignment(){ return modalState.assignments.find((item) => item.assignmentType === 'Truck' && item.resourceId) || null; }
function getOrCreateModalTruckAssignment(){
  let row = modalState.assignments.find((item) => item.assignmentType === 'Truck' && item.resourceId) || modalState.assignments.find((item) => item.assignmentType === 'Truck');
  if(row) return row;
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
    alert('This employee does not have a default truck yet.');
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
  const suggestionMarkup = suggestions.length ? `<div class="assignment-defaults">${suggestions.map(({ employee, defaultTruck }) => `<div class="assignment-default-row"><div><div class="item-title">${esc(employee.employeeName || 'Employee')}</div><div class="muted">Default truck ${esc(defaultTruck.unitNumber || 'Unnamed truck')}</div></div><div class="table-actions"><button class="act-btn" type="button" onclick="applyTechnicianDefaultTruck('${esc(employee.id)}', true)" ${currentTruck?.resourceId === defaultTruck.id ? 'disabled' : ''}>Use Default Truck</button>${currentTruck ? `<button class="act-btn danger" type="button" onclick="clearModalTruckAssignment()">Clear Truck</button>` : ''}</div></div>`).join('')}</div>` : '';
  return `<div class="assignment-editor"><div class="assignment-head"><div><h4>Job Assignments</h4><div class="section-copy">${requirements.length ? `Required for ${getJobTypeDisplayName(modalState.formData.jobType)}: ${requirements.join(', ')}.` : 'Choose a job type, then add employees, trucks, trailers, and equipment as needed.'}</div></div><button class="add-btn" type="button" onclick="addAssignmentRow()">+ Add Assignment</button></div>${suggestionMarkup}<div class="assignment-list">${modalState.assignments.length ? modalState.assignments.map((assignment) => renderAssignmentRow(assignment)).join('') : '<div class="empty-state">No assignments added yet.</div>'}</div><div class="form-hint">Selecting an employee auto-fills their default truck when no truck is assigned. You can swap to another vehicle or clear the truck from this editor at any time.</div></div>`;
}

function renderModal(){
  const overlay = document.getElementById('entity-modal-overlay');
  if(!overlay) return;
  if(!modalState.open){ overlay.classList.remove('open'); return; }
  overlay.classList.add('open');
  document.getElementById('entity-modal-title').textContent = `${modalState.id ? 'Edit' : 'Add'} ${ENTITY_CONFIG[modalState.entity].label}`;
  document.getElementById('entity-modal-delete').style.display = modalState.id ? '' : 'none';
  document.getElementById('entity-modal-duplicate').style.display = modalState.entity === 'jobs' && modalState.id ? '' : 'none';
  document.getElementById('entity-modal-body').innerHTML = `<div class="form-grid">${(FORM_DEFINITIONS[modalState.entity] || []).map((field) => renderFormField(field)).join('')}</div>${modalState.entity === 'jobs' ? renderAssignmentEditor() : ''}`;
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

function openEntityModal(entityKey, id = ''){
  if(entityKey === 'employees'){
    window.location.href = 'employees.html';
    return;
  }
  if(entityKey === 'sites' && window.SiteEditor && (id || state.activeView === 'directory' || state.filters.directoryClient !== 'all')){
    openSharedSiteEditor(id);
    return;
  }
  const existing = id ? state.data[entityKey].find((row) => row.id === id) : null;
  const draft = existing ? clone(existing) : getNewRecordDraft(entityKey);
  const directoryClientId = state.activeView === 'directory' ? getActiveDirectoryClientId() : (state.filters.directoryClient !== 'all' ? state.filters.directoryClient : '');
  if(!existing){
    if(['projects', 'contacts', 'billingProfiles', 'sites', 'jobs'].includes(entityKey) && directoryClientId) draft.clientId = directoryClientId;
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
  }
  if(entityKey === 'jobs' && draft.projectId && !draft.clientId){
    const project = getProject(draft.projectId);
    if(project) draft.clientId = project.clientId;
  }
  modalState = { open:true, entity:entityKey, id:existing?.id || '', formData:draft, assignments:entityKey === 'jobs' ? (existing ? getAssignmentsForJob(existing.id).map((row) => clone(row)) : []) : [], openMultiSelectKey:'' };
  if(entityKey === 'equipment' && !existing) syncEquipmentAssignmentSummary();
  renderModal();
}

function closeEntityModal(){ modalState = createClosedModalState(); renderModal(); }
function setModalField(key, value, mode = 'text'){ if(modalState.open) modalState.formData[key] = mode === 'number' ? normalizeNumber(value) : value; }
function toggleModalField(key, checked){ if(modalState.open) modalState.formData[key] = !!checked; }

function buildDuplicatedJobDraft(source){
  return normalizeRecord('jobs', {
    ...source,
    id:'',
    fieldfxTicketId:'',
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
    open:true,
    entity:'jobs',
    id:'',
    formData:buildDuplicatedJobDraft(modalState.formData),
    assignments:buildDuplicatedJobAssignmentDrafts(modalState.assignments)
  };
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
  const project = getProject(modalState.formData.projectId);
  if(project && project.clientId !== value) modalState.formData.projectId = '';
  renderModal();
}
function changeBillingProject(value){
  modalState.formData.projectId = value;
  const project = getProject(value);
  if(project) modalState.formData.clientId = project.clientId;
  renderModal();
}
function changeJobClient(value){
  modalState.formData.clientId = value;
  const project = getProject(modalState.formData.projectId);
  if(project && project.clientId !== value) modalState.formData.projectId = '';
  const site = getSite(modalState.formData.siteId);
  if(site && site.clientId !== value) modalState.formData.siteId = '';
  if(modalState.formData.siteId){
    const projectOptions = buildJobProjectOptions(value, modalState.formData.siteId);
    if(projectOptions.length === 1) modalState.formData.projectId = projectOptions[0].value;
    else if(!projectOptions.some((option) => option.value === modalState.formData.projectId)) modalState.formData.projectId = '';
  }
  renderModal();
}
function changeJobSite(value){
  modalState.formData.siteId = value;
  const site = getSite(value);
  if(site) modalState.formData.clientId = site.clientId;
  const projectOptions = buildJobProjectOptions(modalState.formData.clientId, value);
  if(projectOptions.length === 1) modalState.formData.projectId = projectOptions[0].value;
  else if(!projectOptions.some((option) => option.value === modalState.formData.projectId)) modalState.formData.projectId = '';
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
  renderModal();
}
function changeSampleJob(value){ modalState.formData.jobId = value; const job = getJob(value); if(job){ modalState.formData.clientId = job.clientId; modalState.formData.siteId = job.siteId; } renderModal(); }
function changeSampleClient(value){ modalState.formData.clientId = value; const site = getSite(modalState.formData.siteId); if(site && site.clientId !== value) modalState.formData.siteId = ''; renderModal(); }
function changeMaintenanceAssetType(value){ modalState.formData.assetType = value; modalState.formData.assetId = ''; renderModal(); }
function changeTruckAssignedTechnician(value){
  modalState.formData.assignedTechnicianId = value;
  const tech = state.data.employees.find((row) => row.id === value) || null;
  modalState.formData.currentDriver = tech?.employeeName || '';
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
    if(formData.managerContactId && formData.managerContactId === modalState.id) return 'A contact cannot report to themselves.';
    if(formData.managerContactId && getContactDescendantIds(modalState.id).has(formData.managerContactId)) return 'A contact cannot report to someone below them in the hierarchy.';
    const reportWithDifferentClient = state.data.contacts.find((row) => row.managerContactId === modalState.id && row.clientId !== formData.clientId);
    if(reportWithDifferentClient) return 'Existing report contacts must belong to the same client.';
  }
  if(entityKey === 'billingProfiles'){
    if(!String(formData.clientId || '').trim()) return 'Client is required.';
    if(!String(formData.billingName || '').trim()) return 'Billing name is required.';
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
    if(site && !getProjectIdsForSite(site.id).includes(formData.projectId)) return 'The selected project is not linked to the selected site/location.';
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
  if(entityKey === 'employees' && !String(formData.employeeName || '').trim()) return 'Employee name is required.';
  if(entityKey === 'trucks' && !String(formData.unitNumber || '').trim()) return 'Truck unit number is required.';
  if(entityKey === 'trailers' && !String(formData.trailerNumber || '').trim()) return 'Trailer number is required.';
  if(entityKey === 'equipment' && !String(formData.equipmentName || '').trim()) return 'Equipment name is required.';
  if(entityKey === 'samples'){ if(!String(formData.jobId || '').trim()) return 'Job is required for a sample.'; if(!String(formData.clientId || '').trim()) return 'Client is required for a sample.'; if(!String(formData.siteId || '').trim()) return 'Site / location is required for a sample.'; }
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
  const technicianName = technicianRecord.employeeName || '';
  next.trucks = next.trucks.map((truck) => {
    if(defaultTruckId && truck.id === defaultTruckId) return { ...truck, assignedTechnicianId:technicianId, currentDriver:technicianName };
    if(truck.assignedTechnicianId === technicianId) return clearTruckTechnicianAssignment(truck);
    return truck;
  });
}

function syncTruckTechnicianLocal(next, truckRecord){
  const technicianId = String(truckRecord.assignedTechnicianId || '');
  const technicianName = technicianId ? (next.employees.find((row) => row.id === technicianId)?.employeeName || truckRecord.currentDriver || '') : '';
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
  if(entityKey === 'jobTypes') normalizedDraft = { ...normalizedDraft, isActive:statusToIsActive(normalizedDraft.jobTypeStatus) };
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

async function saveLocalJob(draft, assignments){
  const next = clone(state.data);
  const jobIndex = next.jobs.findIndex((row) => row.id === draft.id);
  const existing = jobIndex >= 0 ? next.jobs[jobIndex] : null;
  const now = new Date().toISOString();
  const normalizedDraft = { ...draft };
  if(getJobTypeScheduleMode(normalizedDraft.jobType) === 'point_in_time') normalizedDraft.scheduledEnd = '';
  const jobRecord = normalizeRecord('jobs', { ...existing, ...normalizedDraft, id:draft.id || existing?.id || uid(ENTITY_CONFIG.jobs.idPrefix), createdAt:existing?.createdAt || now, updatedAt:now }, { fromRemote:false });
  if(jobIndex >= 0) next.jobs[jobIndex] = jobRecord; else next.jobs.unshift(jobRecord);
  next.jobAssignments = next.jobAssignments.filter((row) => row.jobId !== jobRecord.id);
  assignments.filter((row) => row.resourceId).forEach((assignment) => next.jobAssignments.push(normalizeRecord('jobAssignments', { ...assignment, id:assignment.id || uid(ENTITY_CONFIG.jobAssignments.idPrefix), jobId:jobRecord.id, createdAt:assignment.createdAt || now, updatedAt:now })));
  await persistLocal(next);
  return jobRecord.id;
}

async function saveRemoteJob(draft, assignments){
  const jobDraft = { ...draft };
  if(getJobTypeScheduleMode(jobDraft.jobType) === 'point_in_time') jobDraft.scheduledEnd = '';
  const jobId = await remoteRepository.saveRecord('jobs', jobDraft);
  await remoteRepository.deleteWhere(ENTITY_CONFIG.jobAssignments.table, [{ column:'job_id', value:jobId }]);
  await remoteRepository.insertRows(ENTITY_CONFIG.jobAssignments.table, assignments.filter((row) => row.resourceId).map((row) => ({ job_id:jobId, assignment_type:row.assignmentType, resource_id:row.resourceId || null, assigned_start:null, assigned_end:null, assignment_status:'Assigned', assignment_notes:'' })));
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
  const recordId = await remoteRepository.saveRecord('employees', draft);
  await syncRemoteTruckAssignmentsForTechnician(recordId, draft.employeeName || '', String(draft.defaultTruckId || ''));
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
    const technicianName = technicianId ? (state.data.employees.find((row) => row.id === technicianId)?.employeeName || draft.currentDriver || '') : '';
    if(technicianId) await syncRemoteTruckAssignmentsForTruck(recordId, technicianId, technicianName);
  }
  return recordId;
}

async function saveEntityFromModal(){
  if(modalState.entity === 'clients') modalState.formData.clientCode = normalizeClientCode(modalState.formData.clientCode);
  if(modalState.entity === 'jobTypes'){
    modalState.formData.jobTypeKey = normalizeJobTypeKey(modalState.formData.jobTypeKey || modalState.formData.jobTypeName);
    modalState.formData.isActive = statusToIsActive(modalState.formData.jobTypeStatus);
  }
  if(modalState.entity === 'siteTypes'){
    modalState.formData.siteTypeKey = normalizeSiteTypeKey(modalState.formData.siteTypeKey || modalState.formData.siteTypeName);
    modalState.formData.isActive = statusToIsActive(modalState.formData.siteTypeStatus);
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
    closeEntityModal();
    showSaveStatus('saved', 'SAVED');
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
    next.clients = next.clients.filter((row) => row.id !== id);
    next.projects = next.projects.filter((row) => row.clientId !== id);
    next.contacts = next.contacts.filter((row) => row.clientId !== id);
    next.contactProjects = next.contactProjects.filter((row) => next.contacts.some((contact) => contact.id === row.contactId));
    next.contactSites = next.contactSites.filter((row) => next.contacts.some((contact) => contact.id === row.contactId));
    next.billingProfiles = next.billingProfiles.filter((row) => row.clientId !== id);
    next.sites = next.sites.filter((row) => row.clientId !== id);
    next.siteProjects = next.siteProjects.filter((row) => !clientSiteIds.has(row.siteId));
  }
  else if(entityKey === 'projects'){
    next.projects = next.projects.filter((row) => row.id !== id);
    next.contacts = next.contacts.map((row) => row.projectId === id ? { ...row, projectId:'' } : row);
    next.contactProjects = next.contactProjects.filter((row) => row.projectId !== id);
    next.billingProfiles = next.billingProfiles.filter((row) => row.projectId !== id);
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
  else if(entityKey === 'jobs'){ next.jobs = next.jobs.filter((row) => row.id !== id); next.jobAssignments = next.jobAssignments.filter((row) => row.jobId !== id); next.samples = next.samples.filter((row) => row.jobId !== id); }
  else if(entityKey === 'employees'){ next.employees = next.employees.filter((row) => row.id !== id); next.trucks = next.trucks.map((row) => row.assignedTechnicianId === id ? { ...row, assignedTechnicianId:'', currentDriver:'' } : row); next.jobAssignments = next.jobAssignments.filter((row) => !(row.assignmentType === 'Technician' && row.resourceId === id)); }
  else if(entityKey === 'trucks'){ next.trucks = next.trucks.filter((row) => row.id !== id); next.trailers = next.trailers.map((row) => row.assignedTruckId === id ? { ...row, assignedTruckId:'' } : row); next.equipment = next.equipment.map((row) => row.assignedTruckId === id ? { ...row, assignedTruckId:'', assignedTrailerTruck:row.assignedTrailerId ? getTrailerLabel(row.assignedTrailerId) : '' } : row); next.jobAssignments = next.jobAssignments.filter((row) => !(row.assignmentType === 'Truck' && row.resourceId === id)); next.maintenanceRecords = next.maintenanceRecords.filter((row) => !(row.assetType === 'Truck' && row.assetId === id)); }
  else if(entityKey === 'trailers'){ next.trailers = next.trailers.filter((row) => row.id !== id); next.equipment = next.equipment.map((row) => row.assignedTrailerId === id ? { ...row, assignedTrailerId:'', assignedTrailerTruck:row.assignedTruckId ? getTruckLabel(row.assignedTruckId) : '' } : row); next.jobAssignments = next.jobAssignments.filter((row) => !(row.assignmentType === 'Trailer' && row.resourceId === id)); next.maintenanceRecords = next.maintenanceRecords.filter((row) => !(row.assetType === 'Trailer' && row.assetId === id)); }
  else if(entityKey === 'equipment'){ next.equipment = next.equipment.filter((row) => row.id !== id); next.jobAssignments = next.jobAssignments.filter((row) => !(row.assignmentType === 'Equipment' && row.resourceId === id)); next.maintenanceRecords = next.maintenanceRecords.filter((row) => !(row.assetType === 'Equipment' && row.assetId === id)); }
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
  if(!confirm(`Delete this ${ENTITY_CONFIG[entityKey].label.toLowerCase()}? This cannot be undone.`)) return false;
  state.saveInFlight = true;
  showSaveStatus('saving', 'DELETING');
  try {
    if(isRemoteMode()){
      const existing = state.data[entityKey]?.find((row) => row.id === id) || null;
      if(entityKey === 'employees'){ await remoteRepository.updateWhere(ENTITY_CONFIG.trucks.table, [{ column:'assigned_technician_id', value:id }], buildRemoteTruckAssignmentPayload(null)); await remoteRepository.deleteWhere(ENTITY_CONFIG.jobAssignments.table, [{ column:'assignment_type', value:'Technician' }, { column:'resource_id', value:id }]); }
      if(entityKey === 'trucks'){ await remoteRepository.updateWhere(ENTITY_CONFIG.trailers.table, [{ column:'assigned_truck_id', value:id }], { assigned_truck_id:null }); await remoteRepository.updateWhere(ENTITY_CONFIG.equipment.table, [{ column:'assigned_truck_id', value:id }], { assigned_truck_id:null, assigned_trailer_truck:'' }); await remoteRepository.deleteWhere(ENTITY_CONFIG.jobAssignments.table, [{ column:'assignment_type', value:'Truck' }, { column:'resource_id', value:id }]); await remoteRepository.deleteWhere(ENTITY_CONFIG.maintenanceRecords.table, [{ column:'asset_type', value:'Truck' }, { column:'asset_id', value:id }]); }
      if(entityKey === 'trailers'){ await remoteRepository.updateWhere(ENTITY_CONFIG.equipment.table, [{ column:'assigned_trailer_id', value:id }], { assigned_trailer_id:null, assigned_trailer_truck:'' }); await remoteRepository.deleteWhere(ENTITY_CONFIG.jobAssignments.table, [{ column:'assignment_type', value:'Trailer' }, { column:'resource_id', value:id }]); await remoteRepository.deleteWhere(ENTITY_CONFIG.maintenanceRecords.table, [{ column:'asset_type', value:'Trailer' }, { column:'asset_id', value:id }]); }
      if(entityKey === 'equipment'){ await remoteRepository.deleteWhere(ENTITY_CONFIG.jobAssignments.table, [{ column:'assignment_type', value:'Equipment' }, { column:'resource_id', value:id }]); await remoteRepository.deleteWhere(ENTITY_CONFIG.maintenanceRecords.table, [{ column:'asset_type', value:'Equipment' }, { column:'asset_id', value:id }]); }
      if(existing?.assetPhotoPath){ await removeRemoteAssetPhoto(existing.assetPhotoPath).catch((error) => console.warn('Unable to remove deleted asset photo:', error)); clearCachedAssetPhoto(existing.assetPhotoPath); }
      await remoteRepository.deleteRecord(entityKey, id);
      await loadData({ silent:true, force:true });
    } else await persistLocal(buildLocalDeleteResult(entityKey, id));
    if(modalState.open && modalState.entity === entityKey && modalState.id === id) closeEntityModal();
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

function isInteractionOverlayOpen(){ return !!document.getElementById('entity-modal-overlay')?.classList.contains('open') || !!document.getElementById('site-editor-overlay')?.classList.contains('open') || !!document.getElementById('site-editor-address-overlay')?.classList.contains('open'); }

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

document.getElementById('entity-modal-overlay')?.addEventListener('click', (event) => { if(event.target === document.getElementById('entity-modal-overlay')) closeEntityModal(); });
document.addEventListener('visibilitychange', () => { if(!document.hidden) refreshFromRemote(); });
window.addEventListener('keydown', (event) => { if(event.key === 'Escape' && isInteractionOverlayOpen()) closeEntityModal(); });

(async function init(){
  await (window.authReadyPromise || Promise.resolve());
  await loadData({ silent:true, force:true });
  render();
  startAutoRefresh();
})();
