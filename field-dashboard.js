const STORAGE_KEY = 'field-ops-dashboard-data';
const AUTO_REFRESH_MS = 15000;
const ENTITY_ORDER = ['clients', 'sites', 'jobs', 'jobAssignments', 'technicians', 'trucks', 'trailers', 'equipment', 'samples', 'maintenanceRecords'];
const FIELD_ASSET_BUCKET = 'field-assets';
const ASSET_PHOTO_ENTITY_KEYS = ['trucks', 'trailers', 'equipment'];

const ACCOUNT_STATUS_OPTIONS = ['Active', 'On Hold', 'Inactive'];
const SITE_TYPE_OPTIONS = ['Well Pad', 'LACT Unit', 'Facility', 'Pipeline Location', 'Office / Yard', 'Other'];
const SITE_STATUS_OPTIONS = ['Active', 'Restricted', 'Inactive'];
const JOB_TYPE_OPTIONS = ['Allocation Proving', 'LACT Proving', 'Sample Pickup', 'Sample Drop-Off', 'Maintenance', 'Multi-Service'];
const JOB_STATUS_OPTIONS = ['New', 'Scheduled', 'Dispatched', 'In Progress', 'Waiting', 'Complete', 'Closed', 'Canceled'];
const PRIORITY_OPTIONS = ['Low', 'Normal', 'High', 'Urgent'];
const CUSTODY_OPTIONS = ['Allocation', 'Custody', 'Both'];
const ASSIGNMENT_TYPE_OPTIONS = ['Technician', 'Truck', 'Trailer', 'Equipment'];
const ASSIGNMENT_STATUS_OPTIONS = ['Assigned', 'Confirmed', 'In Progress', 'Complete'];
const TECH_ROLE_OPTIONS = ['Field Tech', 'Senior Field Tech', 'Supervisor', 'Manager'];
const TECH_AVAILABILITY_OPTIONS = ['Available', 'Assigned', 'PTO', 'Unavailable'];
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

const PRIORITY_RANK = { Urgent:0, High:1, Normal:2, Low:3 };
const RESOURCE_ENTITY_BY_TYPE = { Technician:'technicians', Truck:'trucks', Trailer:'trailers', Equipment:'equipment' };
const REQUIRED_ASSIGNMENTS_BY_JOB_TYPE = {
  'Allocation Proving':['Technician', 'Truck', 'Equipment'],
  'LACT Proving':['Technician', 'Truck', 'Equipment'],
  'Sample Pickup':['Technician', 'Truck'],
  'Sample Drop-Off':['Technician', 'Truck']
};

const ENTITY_CONFIG = {
  clients:{ table:'field_clients', label:'Client', idPrefix:'client', defaults:{ clientName:'', accountStatus:'Active', primaryContact:'', contactPhone:'', contactEmail:'', billingNotes:'', operationalNotes:'', salesforceAccountId:'', defaultServiceArea:'' }, fieldMap:{ clientName:'client_name', accountStatus:'account_status', primaryContact:'primary_contact', contactPhone:'contact_phone', contactEmail:'contact_email', billingNotes:'billing_notes', operationalNotes:'operational_notes', salesforceAccountId:'salesforce_account_id', defaultServiceArea:'default_service_area' } },
  sites:{ table:'field_sites', label:'Site', idPrefix:'site', defaults:{ clientId:'', siteName:'', siteType:'Other', physicalAddress:'', countyState:'', gpsCoordinates:'', accessInstructions:'', safetyPpeNotes:'', gateCodeEntryRequirements:'', clientSiteContact:'', siteStatus:'Active', standardJobTypes:'', notes:'' }, fieldMap:{ clientId:'client_id', siteName:'site_name', siteType:'site_type', physicalAddress:'physical_address', countyState:'county_state', gpsCoordinates:'gps_coordinates', accessInstructions:'access_instructions', safetyPpeNotes:'safety_ppe_notes', gateCodeEntryRequirements:'gate_code_entry_requirements', clientSiteContact:'client_site_contact', siteStatus:'site_status', standardJobTypes:'standard_job_types', notes:'notes' } },
  jobs:{ table:'field_jobs', label:'Job', idPrefix:'job', defaults:{ fieldfxTicketId:'', clientId:'', siteId:'', jobType:'', jobStatus:'New', priority:'Normal', requestedDate:'', scheduledStart:'', scheduledEnd:'', actualStart:'', actualEnd:'', durationPlanned:null, durationActual:null, scopeSummary:'', workInstructions:'', apiStandardReference:'', custodyAllocation:'Allocation', samplesRequired:false, meterUnitId:'', provingRequired:false, maintenanceRequired:false, clientContactForJob:'', dispatchNotes:'', completionNotes:'', followUpRequired:false, followUpNotes:'' }, fieldMap:{ fieldfxTicketId:'fieldfx_ticket_id', clientId:'client_id', siteId:'site_id', jobType:'job_type', jobStatus:'job_status', priority:'priority', requestedDate:'requested_date', scheduledStart:'scheduled_start', scheduledEnd:'scheduled_end', actualStart:'actual_start', actualEnd:'actual_end', durationPlanned:'duration_planned_minutes', durationActual:'duration_actual_minutes', scopeSummary:'scope_summary', workInstructions:'work_instructions', apiStandardReference:'api_standard_reference', custodyAllocation:'custody_allocation', samplesRequired:'samples_required', meterUnitId:'meter_unit_id', provingRequired:'proving_required', maintenanceRequired:'maintenance_required', clientContactForJob:'client_contact_for_job', dispatchNotes:'dispatch_notes', completionNotes:'completion_notes', followUpRequired:'follow_up_required', followUpNotes:'follow_up_notes' }, numberFields:['durationPlanned', 'durationActual'], booleanFields:['samplesRequired', 'provingRequired', 'maintenanceRequired', 'followUpRequired'] },
  jobAssignments:{ table:'field_job_assignments', label:'Assignment', idPrefix:'asg', defaults:{ jobId:'', assignmentType:'Technician', resourceId:'', assignedStart:'', assignedEnd:'', assignmentStatus:'Assigned', assignmentNotes:'' }, fieldMap:{ jobId:'job_id', assignmentType:'assignment_type', resourceId:'resource_id', assignedStart:'assigned_start', assignedEnd:'assigned_end', assignmentStatus:'assignment_status', assignmentNotes:'assignment_notes' } },
  technicians:{ table:'field_technicians', label:'Technician', idPrefix:'tech', defaults:{ employeeName:'', role:'Field Tech', phone:'', email:'', homeBase:'', certifications:'', apiSafetyTrainingStatus:'', availabilityStatus:'Available', skillTags:'', notes:'' }, fieldMap:{ employeeName:'employee_name', role:'role', phone:'phone', email:'email', homeBase:'home_base', certifications:'certifications', apiSafetyTrainingStatus:'api_safety_training_status', availabilityStatus:'availability_status', skillTags:'skill_tags', notes:'notes' } },
  trucks:{ table:'field_trucks', label:'Truck', idPrefix:'truck', defaults:{ unitNumber:'', vehicleType:'Pickup', plateVin:'', assignedRegion:'', odometer:null, serviceStatus:'Available', lastServiceDate:'', nextServiceDue:'', truckWorkflow:'', gpsId:'', gpsStatus:'', gvwr:null, businessUnit:'', primaryUse:'', assignedTo:'', currentDriver:'', assignedTechnicianId:'', duty:'', model:'', vehicleInformation:'', leaseCompany:'', leaseBeginDate:'', deliveryDate:'', leaseEndDate:'', returnedDate:'', licensePlateNumber:'', make:'', color:'', ownership:'', registeredState:'', registrationExpirationDate:'', stateInsuranceExpirationDate:'', vin:'', vehicleId:'', vehicleYear:null, assetPhotoPath:'', assetPhotoDataUrl:'', assetPhotoName:'', assetPhotoType:'', notes:'' }, fieldMap:{ unitNumber:'unit_number', vehicleType:'vehicle_type', plateVin:'plate_vin', assignedRegion:'assigned_region', odometer:'odometer', serviceStatus:'service_status', lastServiceDate:'last_service_date', nextServiceDue:'next_service_due', truckWorkflow:'workflow', gpsId:'gps_id', gpsStatus:'gps_status', gvwr:'gvwr', businessUnit:'business_unit', primaryUse:'primary_use', assignedTo:'assigned_to', currentDriver:'current_driver', assignedTechnicianId:'assigned_technician_id', duty:'duty', model:'model', vehicleInformation:'vehicle_information', leaseCompany:'lease_company', leaseBeginDate:'lease_begin_date', deliveryDate:'delivery_date', leaseEndDate:'lease_end_date', returnedDate:'returned_date', licensePlateNumber:'license_plate_number', make:'make', color:'color', ownership:'ownership', registeredState:'registered_state', registrationExpirationDate:'registration_expiration_date', stateInsuranceExpirationDate:'state_insurance_expiration_date', vin:'vin', vehicleId:'vehicle_id', vehicleYear:'vehicle_year', assetPhotoPath:'photo_path', notes:'notes' }, numberFields:['odometer', 'gvwr', 'vehicleYear'], localOnlyFields:['assetPhotoDataUrl', 'assetPhotoName', 'assetPhotoType'] },
  trailers:{ table:'field_trailers', label:'Trailer', idPrefix:'trailer', defaults:{ trailerNumber:'', trailerType:'', capacityConfiguration:'', serviceStatus:'Available', assignedTruckId:'', lastInspectionDate:'', nextInspectionDue:'', assetPhotoPath:'', assetPhotoDataUrl:'', assetPhotoName:'', assetPhotoType:'', notes:'' }, fieldMap:{ trailerNumber:'trailer_number', trailerType:'trailer_type', capacityConfiguration:'capacity_configuration', serviceStatus:'service_status', assignedTruckId:'assigned_truck_id', lastInspectionDate:'last_inspection_date', nextInspectionDue:'next_inspection_due', assetPhotoPath:'photo_path', notes:'notes' }, localOnlyFields:['assetPhotoDataUrl', 'assetPhotoName', 'assetPhotoType'] },
  equipment:{ table:'field_equipment', label:'Equipment', idPrefix:'equip', defaults:{ equipmentName:'', equipmentType:'Small Volume Prover', serialNumber:'', calibrationStatus:'Current', lastCalibrationDate:'', nextCalibrationDue:'', maintenanceStatus:'Available', storageLocation:'', assignedTrailerTruck:'', assignedTruckId:'', assignedTrailerId:'', assetPhotoPath:'', assetPhotoDataUrl:'', assetPhotoName:'', assetPhotoType:'', notes:'' }, fieldMap:{ equipmentName:'equipment_name', equipmentType:'equipment_type', serialNumber:'serial_number', calibrationStatus:'calibration_status', lastCalibrationDate:'last_calibration_date', nextCalibrationDue:'next_calibration_due', maintenanceStatus:'maintenance_status', storageLocation:'storage_location', assignedTrailerTruck:'assigned_trailer_truck', assignedTruckId:'assigned_truck_id', assignedTrailerId:'assigned_trailer_id', assetPhotoPath:'photo_path', notes:'notes' }, localOnlyFields:['assetPhotoDataUrl', 'assetPhotoName', 'assetPhotoType'] },
  samples:{ table:'field_samples', label:'Sample', idPrefix:'sample', defaults:{ jobId:'', clientId:'', siteId:'', sampleType:'Gas', containerType:'Cylinder', collectionDateTime:'', pickedUpBy:'', dropOffLocation:'', chainOfCustodyStatus:'Requested', labReceiptStatus:'Requested', priorityTat:'', notes:'' }, fieldMap:{ jobId:'job_id', clientId:'client_id', siteId:'site_id', sampleType:'sample_type', containerType:'container_type', collectionDateTime:'collection_date_time', pickedUpBy:'picked_up_by', dropOffLocation:'drop_off_location', chainOfCustodyStatus:'chain_of_custody_status', labReceiptStatus:'lab_receipt_status', priorityTat:'priority_tat', notes:'notes' } },
  maintenanceRecords:{ table:'field_maintenance_records', label:'Maintenance Record', idPrefix:'maint', defaults:{ assetType:'Equipment', assetId:'', maintenanceType:'Preventive', openDate:'', dueDate:'', completedDate:'', status:'Open', issueDescription:'', resolution:'', vendorInternal:'Internal', cost:null, assignedPerson:'', notes:'' }, fieldMap:{ assetType:'asset_type', assetId:'asset_id', maintenanceType:'maintenance_type', openDate:'open_date', dueDate:'due_date', completedDate:'completed_date', status:'status', issueDescription:'issue_description', resolution:'resolution', vendorInternal:'vendor_internal', cost:'cost', assignedPerson:'assigned_person', notes:'notes' }, numberFields:['cost'] }
};

let state = { activeView:'overview', scheduleAnchorDate:getStartOfWeekISO(new Date()), filters:{ dispatchSearch:'', dispatchStatus:'all', dispatchPriority:'all', dispatchJobType:'all', directoryClient:'all' }, data:createEmptyData(), saveInFlight:false, autoRefreshInFlight:false, autoRefreshTimer:null };
let modalState = createClosedModalState();
let lastLoadedSnapshot = '';
let hideSaveStatusTimer = null;
const remoteAssetPhotoUrlCache = new Map();
const remoteAssetPhotoLoadPromises = new Map();

function createEmptyData(){ return { clients:[], sites:[], jobs:[], jobAssignments:[], technicians:[], trucks:[], trailers:[], equipment:[], samples:[], maintenanceRecords:[] }; }
function createClosedModalState(){ return { open:false, entity:'', id:'', formData:{}, assignments:[] }; }
function uid(prefix = 'fld'){ return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function clone(value){ return JSON.parse(JSON.stringify(value)); }
function firstRow(payload){ return Array.isArray(payload) ? payload[0] || null : payload; }
function normalizeBoolean(value){ return value === true || value === 'true' || value === 1 || value === '1'; }
function normalizeNumber(value){ if(value === '' || value === null || value === undefined) return null; const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
function compareStrings(a, b){ return String(a || '').localeCompare(String(b || ''), undefined, { sensitivity:'base' }); }
function compareOptionalDates(left, right){ if(!left && !right) return 0; if(!left) return 1; if(!right) return -1; return left - right; }
function isRemoteMode(){ return !!(window.appAuth && typeof window.appAuth.getMode === 'function' && window.appAuth.getMode() === 'remote'); }
function esc(value){ return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch])); }

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
function toRemoteDate(value){ const date = toInputDate(value); return date || null; }
function toRemoteDateTime(value){ const date = parseDateTime(value); return date ? date.toISOString() : null; }
function fmtDate(value){ const date = parseDateOnly(value); return date ? date.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) : 'Not set'; }
function fmtDateTime(value){ const date = parseDateTime(value); return date ? date.toLocaleString('en-US', { month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' }) : 'Not scheduled'; }
function fmtTime(value){ const date = parseDateTime(value); return date ? date.toLocaleTimeString('en-US', { hour:'numeric', minute:'2-digit' }) : 'Time TBD'; }
function fmtCurrency(value){ const parsed = normalizeNumber(value); return parsed === null ? 'Not set' : new Intl.NumberFormat('en-US', { style:'currency', currency:'USD' }).format(parsed); }

function getStartOfWeekISO(input){
  const date = parseDateOnly(input || new Date()) || new Date();
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return toInputDate(date);
}

function addDaysISO(isoDate, days){
  const date = parseDateOnly(isoDate) || parseDateOnly(todayISO()) || new Date();
  date.setDate(date.getDate() + Number(days || 0));
  return toInputDate(date);
}

function isSameDay(left, right){
  const leftDate = parseDateOnly(left);
  const rightDate = parseDateOnly(right);
  return !!(leftDate && rightDate && leftDate.getTime() === rightDate.getTime());
}

function getJobPrimaryDate(job){ return parseDateTime(job?.scheduledStart) || parseDateOnly(job?.requestedDate); }
function getJobSecondaryDate(job){ return parseDateTime(job?.scheduledEnd) || getJobPrimaryDate(job); }

function getEntitySorter(entityKey){
  switch(entityKey){
    case 'clients': return (a, b) => compareStrings(a.clientName, b.clientName);
    case 'sites': return (a, b) => compareStrings(a.siteName, b.siteName);
    case 'jobs': return (a, b) => compareOptionalDates(getJobPrimaryDate(a), getJobPrimaryDate(b)) || ((PRIORITY_RANK[a.priority] ?? 99) - (PRIORITY_RANK[b.priority] ?? 99)) || compareStrings(a.fieldfxTicketId || a.id, b.fieldfxTicketId || b.id);
    case 'jobAssignments': return (a, b) => compareStrings(a.assignmentType, b.assignmentType) || compareStrings(a.resourceId, b.resourceId);
    case 'technicians': return (a, b) => compareStrings(a.employeeName, b.employeeName);
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
    else if(remoteKey.endsWith('_date') || key.toLowerCase().endsWith('Date')) record[key] = toInputDate(raw);
    else if(remoteKey.endsWith('_time') || key.toLowerCase().endsWith('DateTime') || key.toLowerCase().endsWith('Start') || key.toLowerCase().endsWith('End')) record[key] = toInputDateTime(raw);
    else record[key] = raw === null || raw === undefined ? cfg.defaults[key] : String(raw);
  });
  return record;
}

function normalizeData(source, fromRemote = false){
  const normalized = createEmptyData();
  ENTITY_ORDER.forEach((entityKey) => {
    const rows = Array.isArray(source?.[entityKey]) ? source[entityKey] : [];
    normalized[entityKey] = rows.map((row) => normalizeRecord(entityKey, row, { fromRemote })).sort(getEntitySorter(entityKey));
  });
  return normalized;
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
    else if(remoteKey.endsWith('_date') || key.toLowerCase().endsWith('Date')) payload[remoteKey] = toRemoteDate(value);
    else if(remoteKey.endsWith('_time') || key.toLowerCase().endsWith('DateTime') || key.toLowerCase().endsWith('Start') || key.toLowerCase().endsWith('End')) payload[remoteKey] = toRemoteDateTime(value);
    else payload[remoteKey] = value === null || value === undefined ? '' : String(value);
  });
  return payload;
}

const localRepository = {
  async list(){ try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? normalizeData(JSON.parse(raw), false) : createEmptyData(); } catch { return createEmptyData(); } },
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
  async insertRows(table, rows){ if(!rows.length) return; await window.appAuth.requestJson(`/rest/v1/${table}`, { method:'POST', headers:{ 'Content-Type':'application/json', 'Prefer':'return=minimal' }, body:JSON.stringify(rows) }); }
};

function getClient(id){ return state.data.clients.find((row) => row.id === id) || null; }
function getSite(id){ return state.data.sites.find((row) => row.id === id) || null; }
function getJob(id){ return state.data.jobs.find((row) => row.id === id) || null; }
function getAssignmentsForJob(jobId){ return state.data.jobAssignments.filter((row) => row.jobId === jobId); }
function getClientLabel(clientId){ return getClient(clientId)?.clientName || 'Unknown client'; }
function getSiteLabel(siteId){ return getSite(siteId)?.siteName || 'Unknown site'; }

function getResourceRecord(assignmentType, resourceId){
  const entityKey = RESOURCE_ENTITY_BY_TYPE[assignmentType];
  if(!entityKey) return null;
  return state.data[entityKey].find((row) => row.id === resourceId) || null;
}

function getResourceLabel(assignmentType, resourceId){
  const record = getResourceRecord(assignmentType, resourceId);
  if(!record) return 'Unknown resource';
  if(assignmentType === 'Technician') return record.employeeName || 'Unnamed technician';
  if(assignmentType === 'Truck') return record.unitNumber || 'Unnamed truck';
  if(assignmentType === 'Trailer') return record.trailerNumber || 'Unnamed trailer';
  return record.equipmentName || 'Unnamed equipment';
}

function getJobLabel(jobId){
  const job = getJob(jobId);
  return job ? (job.fieldfxTicketId || `${job.jobType || 'Job'} ${job.id.slice(0, 8)}`) : 'Unknown job';
}

function getAssetLabel(assetType, assetId){
  if(assetType === 'Truck') return state.data.trucks.find((row) => row.id === assetId)?.unitNumber || 'Unknown truck';
  if(assetType === 'Trailer') return state.data.trailers.find((row) => row.id === assetId)?.trailerNumber || 'Unknown trailer';
  return state.data.equipment.find((row) => row.id === assetId)?.equipmentName || 'Unknown equipment';
}

function getJobMissingRequirements(job, assignments = getAssignmentsForJob(job.id)){
  const required = REQUIRED_ASSIGNMENTS_BY_JOB_TYPE[job.jobType] || [];
  const availableTypes = new Set(assignments.filter((row) => row.resourceId).map((row) => row.assignmentType));
  return required.filter((assignmentType) => !availableTypes.has(assignmentType));
}

function isJobClosed(job){ return ['Complete', 'Closed', 'Canceled'].includes(job.jobStatus); }

function isJobOverdue(job){
  if(isJobClosed(job)) return false;
  const target = getJobSecondaryDate(job);
  const today = parseDateOnly(todayISO());
  return !!(target && today && target < today);
}

function isMaintenanceClosed(record){ return ['Complete', 'Canceled'].includes(record.status); }

function getAssignedResourceWarnings(job){
  const warnings = [];
  getAssignmentsForJob(job.id).forEach((assignment) => {
    const resource = getResourceRecord(assignment.assignmentType, assignment.resourceId);
    if(!resource) return;
    if(assignment.assignmentType === 'Technician' && ['PTO', 'Unavailable'].includes(resource.availabilityStatus)) warnings.push(`${resource.employeeName || 'Technician'} ${resource.availabilityStatus.toLowerCase()}`);
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
    const start = parseDateTime(assignment.assignedStart) || getJobPrimaryDate(job);
    const end = parseDateTime(assignment.assignedEnd) || getJobSecondaryDate(job) || start;
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
    overdueJobs:state.data.jobs.filter(isJobOverdue),
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
    { key:'accountStatus', label:'Account Status', type:'select', options:ACCOUNT_STATUS_OPTIONS },
    { key:'primaryContact', label:'Primary Contact', type:'text' },
    { key:'contactPhone', label:'Contact Phone', type:'text' },
    { key:'contactEmail', label:'Contact Email', type:'email' },
    { key:'salesforceAccountId', label:'Salesforce Account ID', type:'text' },
    { key:'defaultServiceArea', label:'Default Service Area / Region', type:'text' },
    { key:'billingNotes', label:'Billing Notes', type:'textarea', full:true },
    { key:'operationalNotes', label:'Operational Notes', type:'textarea', full:true }
  ],
  sites:[
    { kind:'section', label:'Location' },
    { key:'clientId', label:'Client', type:'select', options:() => buildClientOptions() },
    { key:'siteName', label:'Site Name', type:'text', required:true },
    { key:'siteType', label:'Site Type', type:'select', options:SITE_TYPE_OPTIONS },
    { key:'physicalAddress', label:'Physical Address', type:'text', full:true },
    { key:'countyState', label:'County / State', type:'text' },
    { key:'gpsCoordinates', label:'GPS Coordinates', type:'text' },
    { key:'siteStatus', label:'Site Status', type:'select', options:SITE_STATUS_OPTIONS },
    { key:'clientSiteContact', label:'Client Site Contact', type:'text' },
    { key:'standardJobTypes', label:'Standard Job Types', type:'text', full:true },
    { key:'accessInstructions', label:'Access Instructions', type:'textarea', full:true },
    { key:'safetyPpeNotes', label:'Safety / PPE Notes', type:'textarea', full:true },
    { key:'gateCodeEntryRequirements', label:'Gate Code / Entry Requirements', type:'textarea', full:true },
    { key:'notes', label:'Notes', type:'textarea', full:true }
  ],
  jobs:[
    { kind:'section', label:'Basics' },
    { key:'clientId', label:'Client', type:'select', options:() => buildClientOptions(), handler:'changeJobClient' },
    { key:'siteId', label:'Site', type:'select', options:() => buildSiteOptions(modalState.formData.clientId) },
    { key:'fieldfxTicketId', label:'FieldFX / Salesforce Ticket ID', type:'text' },
    { key:'jobType', label:'Job Type', type:'select', options:JOB_TYPE_OPTIONS, handler:'changeJobType' },
    { key:'jobStatus', label:'Job Status', type:'select', options:JOB_STATUS_OPTIONS },
    { key:'priority', label:'Priority', type:'select', options:PRIORITY_OPTIONS },
    { kind:'section', label:'Schedule' },
    { key:'requestedDate', label:'Requested Date', type:'date' },
    { key:'scheduledStart', label:'Scheduled Start', type:'datetime-local' },
    { key:'scheduledEnd', label:'Scheduled End', type:'datetime-local' },
    { key:'actualStart', label:'Actual Start', type:'datetime-local' },
    { key:'actualEnd', label:'Actual End', type:'datetime-local' },
    { key:'durationPlanned', label:'Duration Planned (min)', type:'number' },
    { key:'durationActual', label:'Duration Actual (min)', type:'number' },
    { kind:'section', label:'Execution' },
    { key:'meterUnitId', label:'Meter / Unit ID', type:'text' },
    { key:'apiStandardReference', label:'API Standard Reference', type:'text' },
    { key:'custodyAllocation', label:'Custody vs Allocation', type:'select', options:CUSTODY_OPTIONS },
    { key:'clientContactForJob', label:'Client Contact For Job', type:'text' },
    { key:'samplesRequired', label:'Samples Required', type:'checkbox' },
    { key:'provingRequired', label:'Proving Required', type:'checkbox' },
    { key:'maintenanceRequired', label:'Maintenance Required', type:'checkbox' },
    { key:'followUpRequired', label:'Follow-Up Required', type:'checkbox' },
    { key:'scopeSummary', label:'Scope Summary', type:'textarea', full:true },
    { key:'workInstructions', label:'Work Instructions', type:'textarea', full:true },
    { key:'dispatchNotes', label:'Dispatch Notes', type:'textarea', full:true },
    { key:'completionNotes', label:'Completion Notes', type:'textarea', full:true },
    { key:'followUpNotes', label:'Follow-Up Notes', type:'textarea', full:true }
  ],
  technicians:[
    { kind:'section', label:'Personnel' },
    { key:'employeeName', label:'Employee Name', type:'text', required:true },
    { key:'role', label:'Role', type:'select', options:TECH_ROLE_OPTIONS },
    { key:'availabilityStatus', label:'Availability Status', type:'select', options:TECH_AVAILABILITY_OPTIONS },
    { key:'homeBase', label:'Home Base', type:'text' },
    { key:'phone', label:'Phone', type:'text' },
    { key:'email', label:'Email', type:'email' },
    { key:'apiSafetyTrainingStatus', label:'API / Safety Training Status', type:'text' },
    { key:'skillTags', label:'Skill Tags', type:'text', full:true },
    { key:'certifications', label:'Certifications', type:'textarea', full:true },
    { key:'notes', label:'Notes', type:'textarea', full:true }
  ],
  trucks:[
    { kind:'section', label:'Vehicle' },
    { key:'unitNumber', label:'Unit Number', type:'text', required:true },
    { key:'vehicleType', label:'Vehicle Type', type:'select', options:TRUCK_TYPE_OPTIONS },
    { key:'serviceStatus', label:'Service Status', type:'select', options:VEHICLE_STATUS_OPTIONS },
    { key:'assignedRegion', label:'Assigned Region', type:'text' },
    { key:'truckWorkflow', label:'Workflow', type:'text' },
    { key:'businessUnit', label:'Lab / Field / Sales', type:'text' },
    { key:'primaryUse', label:'Primary Use', type:'text' },
    { key:'assignedTechnicianId', label:'Assigned Tech', type:'select', options:() => buildTechnicianAssignmentOptions(), handler:'changeTruckAssignedTechnician', placeholderLabel:'Pool' },
    { key:'assignedTo', label:'Assigned To', type:'text' },
    { key:'duty', label:'Duty', type:'text' },
    { key:'make', label:'Make', type:'text' },
    { key:'color', label:'Truck Color', type:'text' },
    { key:'model', label:'Model', type:'text' },
    { key:'vehicleYear', label:'Year Of Vehicle', type:'number' },
    { key:'vehicleId', label:'Vehicle ID', type:'text' },
    { key:'vehicleInformation', label:'Vehicle Information', type:'text' },
    { key:'ownership', label:'Ownership', type:'text' },
    { key:'leaseCompany', label:'Lease Company', type:'text' },
    { key:'leaseBeginDate', label:'Lease Begin Date', type:'date' },
    { key:'deliveryDate', label:'Delivery Date', type:'date' },
    { key:'leaseEndDate', label:'Lease End Date', type:'date' },
    { key:'returnedDate', label:'Returned Date', type:'date' },
    { key:'licensePlateNumber', label:'License Plate Number', type:'text' },
    { key:'registeredState', label:'Registered State', type:'text' },
    { key:'vin', label:'VIN', type:'text' },
    { key:'plateVin', label:'Plate / VIN Summary', type:'text' },
    { key:'gpsId', label:'GPS ID', type:'text' },
    { key:'gpsStatus', label:'GPS Status', type:'text' },
    { key:'gvwr', label:'GVWR', type:'number' },
    { key:'odometer', label:'Odometer', type:'number' },
    { key:'lastServiceDate', label:'Date Of Last Inspection', type:'date' },
    { key:'registrationExpirationDate', label:'Registration Expiration Date', type:'date' },
    { key:'stateInsuranceExpirationDate', label:'State Insurance Expiration Date', type:'date' },
    { key:'nextServiceDue', label:'Next Service Due', type:'date' },
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
    { key:'lastInspectionDate', label:'Last Inspection Date', type:'date' },
    { key:'nextInspectionDue', label:'Next Inspection Due', type:'date' },
    { key:'assetPhotoPath', label:'Trailer Photo', type:'image', full:true },
    { key:'notes', label:'Notes', type:'textarea', full:true }
  ],
  equipment:[
    { kind:'section', label:'Equipment' },
    { key:'equipmentName', label:'Equipment Name', type:'text', required:true },
    { key:'equipmentType', label:'Equipment Type', type:'select', options:EQUIPMENT_TYPE_OPTIONS },
    { key:'serialNumber', label:'Serial Number', type:'text' },
    { key:'maintenanceStatus', label:'Maintenance Status', type:'select', options:EQUIPMENT_STATUS_OPTIONS },
    { key:'calibrationStatus', label:'Calibration Status', type:'select', options:CALIBRATION_STATUS_OPTIONS },
    { key:'storageLocation', label:'Storage Location', type:'text' },
    { key:'assignedTruckId', label:'Assigned Truck', type:'select', options:() => buildTruckOptions(), handler:'changeEquipmentAssignedTruck' },
    { key:'assignedTrailerId', label:'Assigned Trailer', type:'select', options:() => buildTrailerOptions(), handler:'changeEquipmentAssignedTrailer' },
    { key:'lastCalibrationDate', label:'Last Calibration Date', type:'date' },
    { key:'nextCalibrationDue', label:'Next Calibration Due', type:'date' },
    { key:'assetPhotoPath', label:'Equipment Photo', type:'image', full:true },
    { key:'notes', label:'Notes', type:'textarea', full:true }
  ],
  samples:[
    { kind:'section', label:'Sample Logistics' },
    { key:'jobId', label:'Job', type:'select', options:() => buildJobOptions(), handler:'changeSampleJob' },
    { key:'clientId', label:'Client', type:'select', options:() => buildClientOptions(), handler:'changeSampleClient' },
    { key:'siteId', label:'Site', type:'select', options:() => buildSiteOptions(modalState.formData.clientId) },
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

function buildClientOptions(){ return state.data.clients.map((row) => ({ value:row.id, label:row.clientName || 'Unnamed client' })); }
function buildSiteOptions(clientId = ''){ return state.data.sites.filter((row) => !clientId || row.clientId === clientId).map((row) => ({ value:row.id, label:`${row.siteName || 'Unnamed site'} | ${getClientLabel(row.clientId)}` })); }
function buildJobOptions(){ return state.data.jobs.map((row) => ({ value:row.id, label:`${row.fieldfxTicketId || row.jobType || 'Job'} | ${getSiteLabel(row.siteId)}` })); }
function buildAssetOptions(assetType = ''){ if(assetType === 'Truck') return state.data.trucks.map((row) => ({ value:row.id, label:row.unitNumber || 'Unnamed truck' })); if(assetType === 'Trailer') return state.data.trailers.map((row) => ({ value:row.id, label:row.trailerNumber || 'Unnamed trailer' })); return state.data.equipment.map((row) => ({ value:row.id, label:row.equipmentName || 'Unnamed equipment' })); }
function buildResourceOptions(assignmentType = 'Technician'){ const entityKey = RESOURCE_ENTITY_BY_TYPE[assignmentType]; return entityKey ? state.data[entityKey].map((row) => ({ value:row.id, label:getResourceLabel(assignmentType, row.id) })) : []; }
function buildTechnicianOptions(){ return state.data.technicians.map((row) => ({ value:row.id, label:row.employeeName || 'Unnamed technician' })); }
function buildTechnicianAssignmentOptions(){ return [{ value:'', label:'Pool' }, ...buildTechnicianOptions()]; }
function buildTruckOptions(){ return state.data.trucks.map((row) => ({ value:row.id, label:row.unitNumber || 'Unnamed truck' })); }
function buildTrailerOptions(){ return state.data.trailers.map((row) => ({ value:row.id, label:row.trailerNumber || 'Unnamed trailer' })); }
function getTechnicianLabel(id){ return state.data.technicians.find((row) => row.id === id)?.employeeName || 'Unassigned'; }
function getTruckLabel(id){ return state.data.trucks.find((row) => row.id === id)?.unitNumber || 'Unassigned'; }
function getTrailerLabel(id){ return state.data.trailers.find((row) => row.id === id)?.trailerNumber || 'Unassigned'; }

function switchView(view){ state.activeView = view; render(); }
function setDispatchFilter(key, value){ state.filters[key] = value; renderDispatch(buildDerivedState()); }
function setDirectoryClientFilter(value){ state.filters.directoryClient = value; renderDirectory(); }
function changeScheduleWeek(offset){ state.scheduleAnchorDate = addDaysISO(state.scheduleAnchorDate, Number(offset || 0) * 7); renderSchedule(buildDerivedState()); }
function resetScheduleWeek(){ state.scheduleAnchorDate = getStartOfWeekISO(new Date()); renderSchedule(buildDerivedState()); }

function getPriorityBadge(priority){ const value = priority || 'Low'; const cls = value.toLowerCase().replace(/\s+/g, '-'); return `<span class="priority-badge ${cls}">${esc(value)}</span>`; }
function getStatusTone(status){ if(['In Progress', 'Available', 'Current', 'Logged In'].includes(status)) return 'ok'; if(['Waiting', 'Scheduled', 'Due Soon', 'Collected', 'Delivered', 'Assigned'].includes(status)) return 'warn'; if(['Urgent', 'Overdue', 'Out of Service', 'Needs Repair', 'Canceled', 'Exception'].includes(status)) return 'danger'; if(['Complete', 'Closed', 'Inactive'].includes(status)) return 'muted'; return 'info'; }
function getStatusBadge(status){ return `<span class="status-badge ${getStatusTone(status)}">${esc(status || 'Not set')}</span>`; }
function normalizeOptions(options){ if(!Array.isArray(options)) return []; return options.map((option) => typeof option === 'string' ? { value:option, label:option } : option); }
function renderTags(csvText){ const tags = String(csvText || '').split(',').map((value) => value.trim()).filter(Boolean); return tags.length ? `<div class="tag-row">${tags.map((tag) => `<span class="tag-chip">${esc(tag)}</span>`).join('')}</div>` : '<span class="muted">None listed</span>'; }
function renderWarnings(warnings){ return warnings.length ? `<div class="warning-row">${warnings.map((warning) => `<span class="warning-chip">${esc(warning)}</span>`).join('')}</div>` : ''; }
function renderActionButtons(entityKey, id){ return `<div class="table-actions"><button class="act-btn" type="button" onclick="event.stopPropagation(); openEntityModal('${entityKey}','${esc(id)}')">Edit</button><button class="act-btn danger" type="button" onclick="event.stopPropagation(); deleteEntityRecord('${entityKey}','${esc(id)}')">Delete</button></div>`; }
function renderCardOpenAttrs(entityKey, id){ return `class="resource-card clickable-card" role="button" tabindex="0" onclick="openEntityModal('${entityKey}','${esc(id)}')" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); openEntityModal('${entityKey}','${esc(id)}'); }"`; }

function renderTable(columns, rows, emptyMarkup){
  if(!rows.length) return `<div class="empty-state">${emptyMarkup}</div>`;
  return `<div class="table-wrap"><table><thead><tr>${columns.map((column) => `<th>${esc(column)}</th>`).join('')}</tr></thead><tbody>${rows.map((cells) => `<tr>${cells.map((cell) => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
}

function getJobWarnings(job, derived){
  const warnings = [];
  const missing = getJobMissingRequirements(job);
  if(missing.length) warnings.push(`Missing: ${missing.join(', ')}`);
  if(derived.conflictJobIds.has(job.id)) warnings.push('Resource conflict');
  warnings.push(...getAssignedResourceWarnings(job));
  if(isJobOverdue(job)) warnings.push('Overdue');
  return [...new Set(warnings)];
}

function renderMiniJobList(jobs, derived, emptyText){
  if(!jobs.length) return `<div class="empty-state"><strong>Nothing to show</strong>${esc(emptyText)}</div>`;
  return `<div class="mini-list">${[...jobs].sort(getEntitySorter('jobs')).map((job) => `<div class="mini-card"><div class="mini-head"><div><div class="item-title">${esc(job.fieldfxTicketId || job.jobType || 'Field job')}</div><div class="muted">${esc(getClientLabel(job.clientId))} | ${esc(getSiteLabel(job.siteId))}</div></div>${getPriorityBadge(job.priority)}</div><div class="mini-tags">${getStatusBadge(job.jobStatus)}<span class="mini-tag">${esc(fmtDateTime(job.scheduledStart || job.requestedDate))}</span></div>${renderWarnings(getJobWarnings(job, derived))}</div>`).join('')}</div>`;
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

function getFilteredDispatchJobs(){
  const search = state.filters.dispatchSearch.trim().toLowerCase();
  return state.data.jobs.filter((job) => {
    if(state.filters.dispatchStatus !== 'all' && job.jobStatus !== state.filters.dispatchStatus) return false;
    if(state.filters.dispatchPriority !== 'all' && job.priority !== state.filters.dispatchPriority) return false;
    if(state.filters.dispatchJobType !== 'all' && job.jobType !== state.filters.dispatchJobType) return false;
    if(!search) return true;
    const haystack = [job.fieldfxTicketId, job.jobType, job.scopeSummary, job.clientContactForJob, getClientLabel(job.clientId), getSiteLabel(job.siteId)].join(' ').toLowerCase();
    return haystack.includes(search);
  }).sort(getEntitySorter('jobs'));
}

function renderOverview(derived){
  const todayJobs = state.data.jobs.filter((job) => isSameDay(getJobPrimaryDate(job), todayISO()));
  const nextSevenJobs = state.data.jobs.filter((job) => { const date = getJobPrimaryDate(job); const today = parseDateOnly(todayISO()); const max = parseDateOnly(addDaysISO(todayISO(), 7)); return !!(date && today && max && date >= today && date <= max); });
  const samplesInTransit = state.data.samples.filter((row) => row.chainOfCustodyStatus === 'In Transit');
  const jobsInProgress = state.data.jobs.filter((job) => job.jobStatus === 'In Progress');
  document.getElementById('overview-stats').innerHTML = [{ label:'Jobs Today', value:todayJobs.length, cls:'' }, { label:'Jobs In Progress', value:jobsInProgress.length, cls:'ok' }, { label:'Jobs Overdue', value:derived.overdueJobs.length, cls:'danger' }, { label:'Samples In Transit', value:samplesInTransit.length, cls:'warn' }, { label:'Assets Down', value:derived.downAssets.length, cls:'danger' }].map((card) => `<div class="stat-card ${card.cls}"><div class="stat-label">${esc(card.label)}</div><div class="stat-value ${card.cls}">${esc(card.value)}</div></div>`).join('');
  document.getElementById('overview-actions').innerHTML = `<button class="add-btn" type="button" onclick="openEntityModal('jobs')">+ Add Job</button><button class="act-btn" type="button" onclick="openEntityModal('clients')">+ Add Client</button><button class="act-btn" type="button" onclick="openEntityModal('technicians')">+ Add Tech</button><button class="act-btn" type="button" onclick="openEntityModal('samples')">+ Add Sample</button>`;
  document.getElementById('today-jobs-panel').innerHTML = renderMiniJobList(todayJobs, derived, 'No field jobs are scheduled for today yet.');
  document.getElementById('resource-readiness-panel').innerHTML = `<div class="summary-grid"><div class="summary-card"><div class="label">Available Techs</div><div class="value">${state.data.technicians.filter((row) => row.availabilityStatus === 'Available').length}</div><div class="muted">${state.data.technicians.length} total technicians</div></div><div class="summary-card"><div class="label">Available Trucks</div><div class="value">${state.data.trucks.filter((row) => row.serviceStatus === 'Available').length}</div><div class="muted">${state.data.trucks.filter((row) => row.serviceStatus === 'Out of Service').length} out of service</div></div><div class="summary-card"><div class="label">Available Trailers</div><div class="value">${state.data.trailers.filter((row) => ['Available', 'Assigned'].includes(row.serviceStatus)).length}</div><div class="muted">${state.data.trailers.filter((row) => row.serviceStatus === 'Maintenance').length} in maintenance</div></div><div class="summary-card"><div class="label">Ready Provers</div><div class="value">${state.data.equipment.filter((row) => ['Small Volume Prover', 'Master Meter'].includes(row.equipmentType) && row.maintenanceStatus !== 'Out of Service' && row.calibrationStatus !== 'Overdue').length}</div><div class="muted">${derived.overdueCalibration.length} calibration overdue</div></div></div>`;
  document.getElementById('issues-panel').innerHTML = `<div class="issue-list">${renderIssueCard('Scheduling Conflicts', derived.conflicts.length, 'Double-booked technicians, trucks, trailers, or equipment.')}${renderIssueCard('Jobs Missing Required Resources', derived.missingJobs.length, 'Required assignments still missing for active jobs.')}${renderIssueCard('Missing / Early COC', derived.missingCocSamples.length, 'Samples still requested or collected without a complete handoff chain.')}${renderIssueCard('Overdue Maintenance', derived.overdueMaintenance.length, 'Maintenance items past their due date and still open.')}${renderIssueCard('Calibration Overdue', derived.overdueCalibration.length, 'Equipment that should not be dispatched without review.')}</div>`;
  document.getElementById('next-seven-panel').innerHTML = renderMiniJobList(nextSevenJobs, derived, 'No upcoming jobs are scheduled in the next seven days.');
}

function renderDispatch(derived){
  const filteredJobs = getFilteredDispatchJobs();
  document.getElementById('dispatch-toolbar').innerHTML = `<span class="label">Search</span><input type="text" value="${esc(state.filters.dispatchSearch)}" placeholder="Ticket, client, site, or scope..." oninput="setDispatchFilter('dispatchSearch', this.value)"><span class="label">Status</span><select onchange="setDispatchFilter('dispatchStatus', this.value)"><option value="all">All Statuses</option>${JOB_STATUS_OPTIONS.map((status) => `<option value="${esc(status)}" ${state.filters.dispatchStatus === status ? 'selected' : ''}>${esc(status)}</option>`).join('')}</select><span class="label">Priority</span><select onchange="setDispatchFilter('dispatchPriority', this.value)"><option value="all">All Priorities</option>${PRIORITY_OPTIONS.map((priority) => `<option value="${esc(priority)}" ${state.filters.dispatchPriority === priority ? 'selected' : ''}>${esc(priority)}</option>`).join('')}</select><span class="label">Type</span><select onchange="setDispatchFilter('dispatchJobType', this.value)"><option value="all">All Job Types</option>${JOB_TYPE_OPTIONS.map((jobType) => `<option value="${esc(jobType)}" ${state.filters.dispatchJobType === jobType ? 'selected' : ''}>${esc(jobType)}</option>`).join('')}</select><div class="toolbar-spacer"></div><button class="add-btn" type="button" onclick="openEntityModal('jobs')">+ Add Job</button>`;
  document.getElementById('dispatch-summary').textContent = `${filteredJobs.length} visible / ${state.data.jobs.length} total`;
  document.getElementById('dispatch-table').innerHTML = renderTable(['Ticket / Scope', 'Client / Site', 'Job Type', 'Schedule', 'Priority', 'Status', 'Assignments / Alerts', 'Actions'], filteredJobs.map((job) => [ `<div class="inline-stack"><div class="item-title">${esc(job.fieldfxTicketId || `${job.jobType || 'Job'} ${job.id.slice(0, 8)}`)}</div><div class="muted">${esc(job.scopeSummary || 'No scope summary')}</div></div>`, `<div class="inline-stack"><div class="item-title">${esc(getClientLabel(job.clientId))}</div><div class="muted">${esc(getSiteLabel(job.siteId))}</div></div>`, `<div class="inline-stack">${getStatusBadge(job.jobType || 'Not set')}${job.custodyAllocation ? `<div class="muted">${esc(job.custodyAllocation)}</div>` : ''}</div>`, `<div class="inline-stack"><div>${esc(fmtDateTime(job.scheduledStart || job.requestedDate))}</div><div class="muted">${job.durationPlanned ? `${esc(job.durationPlanned)} min planned` : 'No duration set'}</div></div>`, getPriorityBadge(job.priority), `<div class="inline-stack">${getStatusBadge(job.jobStatus)}${isJobOverdue(job) ? '<div class="muted">Past due</div>' : ''}</div>`, `<div>${summarizeAssignments(job.id)}${renderWarnings(getJobWarnings(job, derived))}</div>`, renderActionButtons('jobs', job.id) ]), '<strong>No dispatch jobs yet</strong>Use the Add Job button to start building the field schedule.');
}

function renderSchedule(derived){
  const weekDates = Array.from({ length:7 }, (_, index) => addDaysISO(state.scheduleAnchorDate, index));
  const weekStart = parseDateOnly(state.scheduleAnchorDate);
  const weekEnd = parseDateOnly(addDaysISO(state.scheduleAnchorDate, 6));
  const weekJobs = state.data.jobs.filter((job) => { const jobDate = getJobPrimaryDate(job); return !!(jobDate && weekStart && weekEnd && jobDate >= weekStart && jobDate <= weekEnd); }).sort(getEntitySorter('jobs'));
  document.getElementById('schedule-toolbar').innerHTML = `<span class="label">Week</span><button class="act-btn" type="button" onclick="changeScheduleWeek(-1)">Prev</button><button class="act-btn" type="button" onclick="resetScheduleWeek()">Current</button><button class="act-btn" type="button" onclick="changeScheduleWeek(1)">Next</button><div class="toolbar-summary">${esc(fmtDate(weekStart))} - ${esc(fmtDate(weekEnd))}</div><div class="toolbar-spacer"></div><button class="add-btn" type="button" onclick="openEntityModal('jobs')">+ Add Job</button>`;
  document.getElementById('schedule-summary').textContent = `${weekJobs.length} jobs this week`;
  document.getElementById('schedule-board').innerHTML = `<div class="schedule-week">${weekDates.map((dateIso) => { const jobsForDay = weekJobs.filter((job) => isSameDay(getJobPrimaryDate(job), dateIso)); return `<div class="day-column"><div class="day-head"><strong>${esc(parseDateOnly(dateIso)?.toLocaleDateString('en-US', { weekday:'long' }) || '')}</strong><span>${esc(fmtDate(dateIso))}</span></div><div class="day-list">${jobsForDay.length ? jobsForDay.map((job) => { const warnings = getJobWarnings(job, derived); const cardClasses = ['schedule-card', derived.conflictJobIds.has(job.id) ? 'conflict' : '', warnings.length ? 'warning' : ''].filter(Boolean).join(' '); return `<div class="${cardClasses}"><div class="item-title">${esc(job.fieldfxTicketId || job.jobType || 'Field job')}</div><div class="muted">${esc(fmtTime(job.scheduledStart || job.requestedDate))} | ${esc(getSiteLabel(job.siteId))}</div><div class="mini-tags">${getStatusBadge(job.jobStatus)}${getPriorityBadge(job.priority)}</div>${renderWarnings(warnings)}</div>`; }).join('') : '<div class="empty-state">No scheduled jobs</div>'}</div></div>`; }).join('')}</div>`;
  const weekConflictList = derived.conflicts.filter((conflict) => conflict.start >= weekStart && conflict.start <= weekEnd);
  const weekMissingJobs = derived.missingJobs.filter((job) => { const jobDate = getJobPrimaryDate(job); return !!(jobDate && weekStart && weekEnd && jobDate >= weekStart && jobDate <= weekEnd); });
  document.getElementById('schedule-conflicts').innerHTML = `<div class="card-list"><div class="summary-card"><div class="label">Scheduling Conflicts</div><div class="value">${weekConflictList.length}</div><div class="muted">Double-booked resources inside the visible week.</div></div>${weekConflictList.length ? weekConflictList.map((conflict) => `<div class="issue-item"><div><div class="item-title">${esc(conflict.resourceLabel)}</div><div class="muted">${esc(conflict.jobA.fieldfxTicketId || conflict.jobA.jobType || 'Job')} overlaps ${esc(conflict.jobB.fieldfxTicketId || conflict.jobB.jobType || 'Job')}</div></div>${getStatusBadge(conflict.assignmentType)}</div>`).join('') : '<div class="empty-state">No resource conflicts for this week.</div>'}<div class="summary-card"><div class="label">Jobs Missing Required Resources</div><div class="value">${weekMissingJobs.length}</div><div class="muted">These jobs still need core resource assignments before dispatch.</div></div>${weekMissingJobs.length ? weekMissingJobs.map((job) => `<div class="issue-item"><div><div class="item-title">${esc(job.fieldfxTicketId || job.jobType || 'Field job')}</div><div class="muted">${esc(getJobMissingRequirements(job).join(', '))}</div></div><button class="act-btn" type="button" onclick="openEntityModal('jobs','${esc(job.id)}')">Edit</button></div>`).join('') : '<div class="empty-state">All visible jobs have their required resource types.</div>'}</div>`;
}

function renderDirectory(){
  document.getElementById('directory-toolbar').innerHTML = `<span class="label">Filter Sites</span><select onchange="setDirectoryClientFilter(this.value)"><option value="all">All Clients</option>${state.data.clients.map((client) => `<option value="${esc(client.id)}" ${state.filters.directoryClient === client.id ? 'selected' : ''}>${esc(client.clientName || 'Unnamed client')}</option>`).join('')}</select><div class="toolbar-spacer"></div><button class="add-btn" type="button" onclick="openEntityModal('clients')">+ Add Client</button><button class="act-btn" type="button" onclick="openEntityModal('sites')">+ Add Site</button>`;
  document.getElementById('clients-table').innerHTML = renderTable(['Client', 'Status', 'Contact', 'Region', 'Notes', 'Actions'], state.data.clients.map((client) => [ `<div class="inline-stack"><div class="item-title">${esc(client.clientName || 'Unnamed client')}</div><div class="muted">${esc(client.salesforceAccountId || 'No Salesforce ID')}</div></div>`, getStatusBadge(client.accountStatus), `<div class="inline-stack"><div>${esc(client.primaryContact || 'No contact')}</div><div class="muted">${esc(client.contactPhone || client.contactEmail || 'No phone or email')}</div></div>`, esc(client.defaultServiceArea || 'Not set'), `<div class="inline-stack"><div class="muted">${esc(client.operationalNotes || client.billingNotes || 'No notes')}</div></div>`, renderActionButtons('clients', client.id) ]), '<strong>No clients yet</strong>Create a client first so sites and jobs have an account to live under.');
  const visibleSites = state.data.sites.filter((site) => state.filters.directoryClient === 'all' || site.clientId === state.filters.directoryClient);
  document.getElementById('sites-table').innerHTML = renderTable(['Site', 'Client', 'Type', 'Status', 'Location', 'Standard Job Types', 'Actions'], visibleSites.map((site) => [ `<div class="inline-stack"><div class="item-title">${esc(site.siteName || 'Unnamed site')}</div><div class="muted">${esc(site.clientSiteContact || 'No site contact')}</div></div>`, esc(getClientLabel(site.clientId)), getStatusBadge(site.siteType), getStatusBadge(site.siteStatus), `<div class="inline-stack"><div>${esc(site.physicalAddress || 'No address')}</div><div class="muted">${esc(site.countyState || 'No county/state')}</div></div>`, renderTags(site.standardJobTypes), renderActionButtons('sites', site.id) ]), '<strong>No sites yet</strong>Add sites under clients so field jobs can be scheduled to a real location.');
}

function renderResourceCards(list, renderer, emptyLabel){
  return list.length ? `<div class="resource-cards">${list.map(renderer).join('')}</div>` : `<div class="empty-state">${esc(emptyLabel)}</div>`;
}

function isAssetPhotoEntity(entityKey){ return ASSET_PHOTO_ENTITY_KEYS.includes(entityKey); }
function hasAssetPhoto(record){ return !!(record?.assetPhotoDataUrl || record?.assetPhotoPath); }
function getAssetPhotoAlt(entityKey, record){
  if(entityKey === 'trucks') return `Photo for truck ${record?.unitNumber || 'asset'}`;
  if(entityKey === 'trailers') return `Photo for trailer ${record?.trailerNumber || 'asset'}`;
  return `Photo for equipment ${record?.equipmentName || 'asset'}`;
}
function getAssetPhotoEmptyLabel(entityKey){
  if(entityKey === 'trucks') return 'No truck photo';
  if(entityKey === 'trailers') return 'No trailer photo';
  return 'No equipment photo';
}
function renderAssetPhoto(record, options = {}){
  const className = options.className || 'asset-photo';
  const emptyLabel = options.emptyLabel || 'No photo';
  const alt = options.alt || 'Asset photo';
  if(record?.assetPhotoDataUrl) return `<img class="${className}" src="${esc(record.assetPhotoDataUrl)}" alt="${esc(alt)}">`;
  if(record?.assetPhotoPath && isRemoteMode()) return `<img class="${className}" src="" alt="${esc(alt)}" data-asset-photo-path="${esc(record.assetPhotoPath)}">`;
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
  return `<div class="form-group full"><label class="form-label">${esc(field.label)}</label><div class="asset-photo-field"><div class="asset-photo-preview-wrap">${renderAssetPhoto(modalState.formData, { className:'asset-photo-preview', emptyLabel:'No photo selected', alt:field.label })}</div><div class="asset-photo-controls"><label class="add-btn asset-photo-upload" for="asset-photo-input">Choose Photo</label><input id="asset-photo-input" class="asset-photo-input" type="file" accept="image/*" onchange="handleAssetPhotoSelected(event)"><div class="muted">${esc(photoLabel)}</div><div class="table-actions"><button class="act-btn" type="button" onclick="openModalAssetPhoto()" ${hasAssetPhoto(modalState.formData) ? '' : 'disabled'}>Open Photo</button><button class="act-btn danger" type="button" onclick="removeModalAssetPhoto()" ${hasAssetPhoto(modalState.formData) ? '' : 'disabled'}>Remove Photo</button></div></div></div></div>`;
}

function renderResources(){
  document.getElementById('technicians-panel').innerHTML = renderResourceCards(state.data.technicians, (tech) => `<div ${renderCardOpenAttrs('technicians', tech.id)}><div class="resource-card-head"><div><div class="item-title">${esc(tech.employeeName || 'Unnamed technician')}</div><div class="muted">${esc(tech.role)}</div></div>${getStatusBadge(tech.availabilityStatus)}</div>${renderTags(tech.skillTags)}<div class="muted">${esc(tech.phone || tech.email || 'No contact info')}</div></div>`, 'No technicians yet');
  document.getElementById('trucks-panel').innerHTML = renderResourceCards(state.data.trucks, (truck) => `<div ${renderCardOpenAttrs('trucks', truck.id)}><div class="resource-card-head"><div><div class="item-title">${esc(truck.unitNumber || 'Unnamed truck')}</div><div class="muted">${esc([truck.color, truck.vehicleYear, truck.make, truck.model, truck.duty || truck.vehicleType].filter(Boolean).join(' ') || truck.vehicleType)}</div></div>${getStatusBadge(truck.serviceStatus)}</div><div class="mini-tags">${truck.truckWorkflow ? `<span class="tag-chip">${esc(truck.truckWorkflow)}</span>` : ''}${truck.businessUnit ? `<span class="tag-chip">${esc(truck.businessUnit)}</span>` : ''}${truck.primaryUse ? `<span class="tag-chip">${esc(truck.primaryUse)}</span>` : ''}${truck.gpsStatus ? getStatusBadge(truck.gpsStatus) : ''}</div><div class="muted">${esc(truck.assignedRegion || 'No region')} | ${esc(truck.licensePlateNumber || truck.plateVin || 'No plate')} | ${esc(truck.vin || 'No VIN')}</div><div class="muted">Tech: ${esc(truck.assignedTechnicianId ? getTechnicianLabel(truck.assignedTechnicianId) : (truck.assignedTo || 'Pool'))}</div><div class="muted">${truck.odometer !== null ? `${esc(truck.odometer)} mi` : 'No odometer'} ${truck.vehicleInformation ? `| ${esc(truck.vehicleInformation)}` : ''}</div><div class="muted">${esc(truck.ownership || 'No ownership')} ${truck.leaseCompany ? `| ${esc(truck.leaseCompany)}` : ''}</div></div>`, 'No trucks yet');
  document.getElementById('trailers-panel').innerHTML = renderResourceCards(state.data.trailers, (trailer) => `<div ${renderCardOpenAttrs('trailers', trailer.id)}><div class="resource-card-head"><div><div class="item-title">${esc(trailer.trailerNumber || 'Unnamed trailer')}</div><div class="muted">${esc(trailer.trailerType || 'No trailer type')}</div></div>${getStatusBadge(trailer.serviceStatus)}</div><div class="muted">${esc(trailer.capacityConfiguration || 'No capacity/configuration')}</div><div class="muted">Assigned Truck: ${esc(trailer.assignedTruckId ? getTruckLabel(trailer.assignedTruckId) : 'Unassigned')}</div></div>`, 'No trailers yet');
  document.getElementById('equipment-panel').innerHTML = renderResourceCards(state.data.equipment, (item) => `<div ${renderCardOpenAttrs('equipment', item.id)}><div class="resource-card-head"><div><div class="item-title">${esc(item.equipmentName || 'Unnamed equipment')}</div><div class="muted">${esc(item.equipmentType)}</div></div>${getStatusBadge(item.maintenanceStatus)}</div><div class="mini-tags">${getStatusBadge(item.calibrationStatus)}${item.serialNumber ? `<span class="tag-chip">${esc(item.serialNumber)}</span>` : ''}</div><div class="muted">${esc(item.storageLocation || 'No storage location')}</div><div class="muted">Truck: ${esc(item.assignedTruckId ? getTruckLabel(item.assignedTruckId) : 'Unassigned')} | Trailer: ${esc(item.assignedTrailerId ? getTrailerLabel(item.assignedTrailerId) : 'Unassigned')}</div></div>`, 'No equipment yet');
}

function renderSamples(){
  const inTransit = state.data.samples.filter((sample) => sample.chainOfCustodyStatus === 'In Transit').length;
  document.getElementById('samples-summary').textContent = `${state.data.samples.length} total | ${inTransit} in transit`;
  document.getElementById('samples-table').innerHTML = renderTable(['Sample', 'Job / Location', 'Collected', 'COC', 'Lab Receipt', 'Drop-Off / Priority', 'Actions'], state.data.samples.map((sample) => [ `<div class="inline-stack"><div class="item-title">${esc(sample.sampleType)}</div><div class="muted">${esc(sample.containerType)}</div></div>`, `<div class="inline-stack"><div>${esc(getJobLabel(sample.jobId))}</div><div class="muted">${esc(getClientLabel(sample.clientId))} | ${esc(getSiteLabel(sample.siteId))}</div></div>`, esc(fmtDateTime(sample.collectionDateTime)), getStatusBadge(sample.chainOfCustodyStatus), getStatusBadge(sample.labReceiptStatus), `<div class="inline-stack"><div>${esc(sample.dropOffLocation || 'No drop-off set')}</div><div class="muted">${esc(sample.priorityTat || 'No priority / TAT')}</div></div>`, renderActionButtons('samples', sample.id) ]), '<strong>No sample records yet</strong>Track pickups, chain of custody, and lab handoff from here.');
}

function renderMaintenance(){
  document.getElementById('maintenance-summary').textContent = `${state.data.maintenanceRecords.filter((record) => !isMaintenanceClosed(record)).length} open items`;
  document.getElementById('maintenance-table').innerHTML = renderTable(['Asset', 'Type', 'Status', 'Dates', 'Assigned', 'Vendor / Cost', 'Actions'], state.data.maintenanceRecords.map((record) => [ `<div class="inline-stack"><div class="item-title">${esc(getAssetLabel(record.assetType, record.assetId))}</div><div class="muted">${esc(record.assetType)}</div></div>`, getStatusBadge(record.maintenanceType), getStatusBadge(record.status), `<div class="inline-stack"><div>${esc(fmtDate(record.dueDate))}</div><div class="muted">${esc(record.openDate ? `Opened ${fmtDate(record.openDate)}` : 'No open date')}</div></div>`, esc(record.assignedPerson || 'Unassigned'), `<div class="inline-stack"><div>${esc(record.vendorInternal || 'Internal')}</div><div class="muted">${esc(fmtCurrency(record.cost))}</div></div>`, renderActionButtons('maintenanceRecords', record.id) ]), '<strong>No maintenance records yet</strong>Capture inspections, repairs, and calibration readiness here.');
}

function renderViewState(){
  document.querySelectorAll('.view-btn').forEach((button) => button.classList.toggle('active', button.dataset.view === state.activeView));
  document.querySelectorAll('.screen').forEach((screen) => screen.classList.toggle('active', screen.id === `${state.activeView}-screen`));
}

function render(){
  renderViewState();
  const derived = buildDerivedState();
  renderOverview(derived);
  renderDispatch(derived);
  renderSchedule(derived);
  renderDirectory();
  renderResources();
  renderSamples();
  renderMaintenance();
  renderModal();
  hydrateAssetPhotoPreviews();
}

function getNewRecordDraft(entityKey){
  const base = clone(ENTITY_CONFIG[entityKey].defaults);
  if(entityKey === 'jobs') base.requestedDate = todayISO();
  if(entityKey === 'samples') base.collectionDateTime = nowInputDateTime();
  if(entityKey === 'maintenanceRecords') base.openDate = todayISO();
  return base;
}

function normalizeOptionsList(options){ return normalizeOptions(typeof options === 'function' ? options() : options); }

function renderFormField(field){
  if(field.kind === 'section') return `<div class="form-section"><h4>${esc(field.label)}</h4></div>`;
  const fullClass = field.full ? ' full' : '';
  if(field.type === 'checkbox') return `<div class="form-group${fullClass}"><label class="form-label">${esc(field.label)}</label><label class="toggle-card"><input type="checkbox" ${modalState.formData[field.key] ? 'checked' : ''} onchange="toggleModalField('${field.key}', this.checked)"><span>${esc(field.label)}</span></label></div>`;
  if(field.type === 'image') return renderAssetPhotoField(field);
  const value = modalState.formData[field.key];
  const options = normalizeOptionsList(field.options || []);
  const control = field.type === 'textarea'
    ? `<textarea class="form-input" oninput="setModalField('${field.key}', this.value)">${esc(value)}</textarea>`
    : field.type === 'select'
      ? `<select class="form-input" onchange="${field.handler ? `${field.handler}(this.value)` : `setModalField('${field.key}', this.value)`}"><option value="">${esc(field.placeholderLabel || (field.required ? 'Select...' : 'Optional'))}</option>${options.map((option) => `<option value="${esc(option.value)}" ${String(value) === String(option.value) ? 'selected' : ''}>${esc(option.label)}</option>`).join('')}</select>`
      : `<input class="form-input" type="${field.type || 'text'}" value="${esc(value ?? '')}" oninput="setModalField('${field.key}', this.value, '${field.type === 'number' ? 'number' : 'text'}')">`;
  return `<div class="form-group${fullClass}"><label class="form-label">${esc(field.label)}</label>${control}</div>`;
}

function renderAssignmentRow(assignment){
  return `<div class="assignment-row"><div class="form-group"><label class="form-label">Assignment Type</label><select class="form-input" onchange="updateModalAssignmentField('${assignment.id}', 'assignmentType', this.value)">${ASSIGNMENT_TYPE_OPTIONS.map((option) => `<option value="${esc(option)}" ${assignment.assignmentType === option ? 'selected' : ''}>${esc(option)}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">Resource</label><select class="form-input" onchange="updateModalAssignmentField('${assignment.id}', 'resourceId', this.value)"><option value="">Select resource...</option>${buildResourceOptions(assignment.assignmentType).map((option) => `<option value="${esc(option.value)}" ${assignment.resourceId === option.value ? 'selected' : ''}>${esc(option.label)}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">Assigned Start</label><input class="form-input" type="datetime-local" value="${esc(assignment.assignedStart)}" oninput="updateModalAssignmentField('${assignment.id}', 'assignedStart', this.value)"></div><div class="form-group"><label class="form-label">Assigned End</label><input class="form-input" type="datetime-local" value="${esc(assignment.assignedEnd)}" oninput="updateModalAssignmentField('${assignment.id}', 'assignedEnd', this.value)"></div><div class="form-group"><label class="form-label">Status</label><select class="form-input" onchange="updateModalAssignmentField('${assignment.id}', 'assignmentStatus', this.value)">${ASSIGNMENT_STATUS_OPTIONS.map((option) => `<option value="${esc(option)}" ${assignment.assignmentStatus === option ? 'selected' : ''}>${esc(option)}</option>`).join('')}</select></div><div class="form-group"><label class="form-label">Notes</label><textarea class="form-input" oninput="updateModalAssignmentField('${assignment.id}', 'assignmentNotes', this.value)">${esc(assignment.assignmentNotes)}</textarea></div><div class="form-group"><label class="form-label">Remove</label><button class="act-btn danger" type="button" onclick="removeAssignmentRow('${assignment.id}')">Delete</button></div></div>`;
}

function renderAssignmentEditor(){
  const requirements = REQUIRED_ASSIGNMENTS_BY_JOB_TYPE[modalState.formData.jobType] || [];
  return `<div class="assignment-editor"><div class="assignment-head"><div><h4>Job Assignments</h4><div class="section-copy">${requirements.length ? `Required for ${modalState.formData.jobType}: ${requirements.join(', ')}.` : 'Add technicians, trucks, trailers, and equipment as needed for this job.'}</div></div><button class="add-btn" type="button" onclick="addAssignmentRow()">+ Add Assignment</button></div><div class="assignment-list">${modalState.assignments.length ? modalState.assignments.map((assignment) => renderAssignmentRow(assignment)).join('') : '<div class="empty-state">No assignments added yet.</div>'}</div><div class="form-hint">Scheduling conflicts, missing required resources, out-of-service assets, and overdue calibration are surfaced in the dashboard after save.</div></div>`;
}

function renderModal(){
  const overlay = document.getElementById('entity-modal-overlay');
  if(!overlay) return;
  if(!modalState.open){ overlay.classList.remove('open'); return; }
  overlay.classList.add('open');
  document.getElementById('entity-modal-title').textContent = `${modalState.id ? 'Edit' : 'Add'} ${ENTITY_CONFIG[modalState.entity].label}`;
  document.getElementById('entity-modal-delete').style.display = modalState.id ? '' : 'none';
  document.getElementById('entity-modal-body').innerHTML = `<div class="form-grid">${(FORM_DEFINITIONS[modalState.entity] || []).map((field) => renderFormField(field)).join('')}</div>${modalState.entity === 'jobs' ? renderAssignmentEditor() : ''}`;
  hydrateAssetPhotoPreviews(document.getElementById('entity-modal-body'));
}

function openEntityModal(entityKey, id = ''){
  const existing = id ? state.data[entityKey].find((row) => row.id === id) : null;
  modalState = { open:true, entity:entityKey, id:existing?.id || '', formData:existing ? clone(existing) : getNewRecordDraft(entityKey), assignments:entityKey === 'jobs' ? (existing ? getAssignmentsForJob(existing.id).map((row) => clone(row)) : []) : [] };
  if(entityKey === 'equipment' && !existing) syncEquipmentAssignmentSummary();
  renderModal();
}

function closeEntityModal(){ modalState = createClosedModalState(); renderModal(); }
function setModalField(key, value, mode = 'text'){ if(modalState.open) modalState.formData[key] = mode === 'number' ? normalizeNumber(value) : value; }
function toggleModalField(key, checked){ if(modalState.open) modalState.formData[key] = !!checked; }

function changeJobClient(value){ modalState.formData.clientId = value; const site = getSite(modalState.formData.siteId); if(site && site.clientId !== value) modalState.formData.siteId = ''; renderModal(); }
function changeJobType(value){ modalState.formData.jobType = value; renderModal(); }
function changeSampleJob(value){ modalState.formData.jobId = value; const job = getJob(value); if(job){ modalState.formData.clientId = job.clientId; modalState.formData.siteId = job.siteId; } renderModal(); }
function changeSampleClient(value){ modalState.formData.clientId = value; const site = getSite(modalState.formData.siteId); if(site && site.clientId !== value) modalState.formData.siteId = ''; renderModal(); }
function changeMaintenanceAssetType(value){ modalState.formData.assetType = value; modalState.formData.assetId = ''; renderModal(); }
function changeTruckAssignedTechnician(value){
  modalState.formData.assignedTechnicianId = value;
  const tech = state.data.technicians.find((row) => row.id === value) || null;
  modalState.formData.assignedTo = tech?.employeeName || '';
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

function addAssignmentRow(){ modalState.assignments.push(normalizeRecord('jobAssignments', { id:uid(ENTITY_CONFIG.jobAssignments.idPrefix), assignmentType:'Technician', resourceId:'', assignedStart:modalState.formData.scheduledStart || '', assignedEnd:modalState.formData.scheduledEnd || '', assignmentStatus:'Assigned', assignmentNotes:'' })); renderModal(); }
function removeAssignmentRow(id){ modalState.assignments = modalState.assignments.filter((row) => row.id !== id); renderModal(); }
function updateModalAssignmentField(id, key, value){ const row = modalState.assignments.find((item) => item.id === id); if(!row) return; row[key] = value; if(key === 'assignmentType'){ row.resourceId = ''; renderModal(); } }

function validateModal(){
  const entityKey = modalState.entity;
  const formData = modalState.formData;
  if(entityKey === 'clients' && !String(formData.clientName || '').trim()) return 'Client name is required.';
  if(entityKey === 'sites'){ if(!String(formData.clientId || '').trim()) return 'Client is required.'; if(!String(formData.siteName || '').trim()) return 'Site name is required.'; }
  if(entityKey === 'jobs'){
    if(!String(formData.clientId || '').trim()) return 'Client is required.';
    if(!String(formData.siteId || '').trim()) return 'Site is required.';
    if(!String(formData.jobType || '').trim()) return 'Job type is required.';
    if(!String(formData.jobStatus || '').trim()) return 'Job status is required.';
    const site = getSite(formData.siteId);
    if(site && site.clientId !== formData.clientId) return 'The selected site does not belong to the selected client.';
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
  if(entityKey === 'technicians' && !String(formData.employeeName || '').trim()) return 'Technician name is required.';
  if(entityKey === 'trucks' && !String(formData.unitNumber || '').trim()) return 'Truck unit number is required.';
  if(entityKey === 'trailers' && !String(formData.trailerNumber || '').trim()) return 'Trailer number is required.';
  if(entityKey === 'equipment' && !String(formData.equipmentName || '').trim()) return 'Equipment name is required.';
  if(entityKey === 'samples'){ if(!String(formData.jobId || '').trim()) return 'Job is required for a sample.'; if(!String(formData.clientId || '').trim()) return 'Client is required for a sample.'; if(!String(formData.siteId || '').trim()) return 'Site is required for a sample.'; }
  if(entityKey === 'maintenanceRecords'){ if(!String(formData.assetType || '').trim()) return 'Asset type is required.'; if(!String(formData.assetId || '').trim()) return 'Asset is required.'; if(!String(formData.maintenanceType || '').trim()) return 'Maintenance type is required.'; if(!String(formData.status || '').trim()) return 'Status is required.'; if(!String(formData.assignedPerson || '').trim()) return 'Assigned person is required.'; }
  return '';
}

async function persistLocal(nextData){ const normalized = await localRepository.write(nextData); state.data = normalized; lastLoadedSnapshot = JSON.stringify(normalized); render(); return normalized; }

async function saveLocalRecord(entityKey, draft){
  const next = clone(state.data);
  const cfg = ENTITY_CONFIG[entityKey];
  const list = next[entityKey];
  const existingIndex = list.findIndex((row) => row.id === draft.id);
  const existing = existingIndex >= 0 ? list[existingIndex] : null;
  const now = new Date().toISOString();
  const record = normalizeRecord(entityKey, { ...existing, ...draft, id:draft.id || existing?.id || uid(cfg.idPrefix), createdAt:existing?.createdAt || now, updatedAt:now });
  if(existingIndex >= 0) list[existingIndex] = record; else list.unshift(record);
  await persistLocal(next);
  return record.id;
}

async function saveLocalJob(draft, assignments){
  const next = clone(state.data);
  const jobIndex = next.jobs.findIndex((row) => row.id === draft.id);
  const existing = jobIndex >= 0 ? next.jobs[jobIndex] : null;
  const now = new Date().toISOString();
  const jobRecord = normalizeRecord('jobs', { ...existing, ...draft, id:draft.id || existing?.id || uid(ENTITY_CONFIG.jobs.idPrefix), createdAt:existing?.createdAt || now, updatedAt:now });
  if(jobIndex >= 0) next.jobs[jobIndex] = jobRecord; else next.jobs.unshift(jobRecord);
  next.jobAssignments = next.jobAssignments.filter((row) => row.jobId !== jobRecord.id);
  assignments.filter((row) => row.resourceId).forEach((assignment) => next.jobAssignments.push(normalizeRecord('jobAssignments', { ...assignment, id:assignment.id || uid(ENTITY_CONFIG.jobAssignments.idPrefix), jobId:jobRecord.id, createdAt:assignment.createdAt || now, updatedAt:now })));
  await persistLocal(next);
  return jobRecord.id;
}

async function saveRemoteJob(draft, assignments){
  const jobId = await remoteRepository.saveRecord('jobs', draft);
  await remoteRepository.deleteWhere(ENTITY_CONFIG.jobAssignments.table, [{ column:'job_id', value:jobId }]);
  await remoteRepository.insertRows(ENTITY_CONFIG.jobAssignments.table, assignments.filter((row) => row.resourceId).map((row) => ({ job_id:jobId, assignment_type:row.assignmentType, resource_id:row.resourceId || null, assigned_start:toRemoteDateTime(row.assignedStart), assigned_end:toRemoteDateTime(row.assignedEnd), assignment_status:row.assignmentStatus, assignment_notes:row.assignmentNotes || '' })));
  return jobId;
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
  return recordId;
}

async function saveEntityFromModal(){
  const validationMessage = validateModal();
  if(validationMessage){ alert(validationMessage); return; }
  state.saveInFlight = true;
  showSaveStatus('saving', 'SAVING');
  try {
    if(modalState.entity === 'jobs'){
      if(isRemoteMode()){ await saveRemoteJob(modalState.formData, modalState.assignments); await loadData({ silent:true, force:true }); }
      else await saveLocalJob(modalState.formData, modalState.assignments);
    } else if(isRemoteMode()){ if(isAssetPhotoEntity(modalState.entity)) await saveRemoteAssetRecord(modalState.entity, modalState.formData); else await remoteRepository.saveRecord(modalState.entity, modalState.formData); await loadData({ silent:true, force:true }); }
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
  if(entityKey === 'clients'){ const siteIds = next.sites.filter((site) => site.clientId === id).map((site) => site.id); const jobIds = next.jobs.filter((job) => job.clientId === id || siteIds.includes(job.siteId)).map((job) => job.id); next.clients = next.clients.filter((row) => row.id !== id); next.sites = next.sites.filter((row) => row.clientId !== id); next.jobs = next.jobs.filter((row) => row.clientId !== id && !siteIds.includes(row.siteId)); next.jobAssignments = next.jobAssignments.filter((row) => !jobIds.includes(row.jobId)); next.samples = next.samples.filter((row) => row.clientId !== id && !siteIds.includes(row.siteId) && !jobIds.includes(row.jobId)); }
  else if(entityKey === 'sites'){ const jobIds = next.jobs.filter((job) => job.siteId === id).map((job) => job.id); next.sites = next.sites.filter((row) => row.id !== id); next.jobs = next.jobs.filter((row) => row.siteId !== id); next.jobAssignments = next.jobAssignments.filter((row) => !jobIds.includes(row.jobId)); next.samples = next.samples.filter((row) => row.siteId !== id && !jobIds.includes(row.jobId)); }
  else if(entityKey === 'jobs'){ next.jobs = next.jobs.filter((row) => row.id !== id); next.jobAssignments = next.jobAssignments.filter((row) => row.jobId !== id); next.samples = next.samples.filter((row) => row.jobId !== id); }
  else if(entityKey === 'technicians'){ next.technicians = next.technicians.filter((row) => row.id !== id); next.trucks = next.trucks.map((row) => row.assignedTechnicianId === id ? { ...row, assignedTechnicianId:'', assignedTo:'', currentDriver:'' } : row); next.jobAssignments = next.jobAssignments.filter((row) => !(row.assignmentType === 'Technician' && row.resourceId === id)); }
  else if(entityKey === 'trucks'){ next.trucks = next.trucks.filter((row) => row.id !== id); next.trailers = next.trailers.map((row) => row.assignedTruckId === id ? { ...row, assignedTruckId:'' } : row); next.equipment = next.equipment.map((row) => row.assignedTruckId === id ? { ...row, assignedTruckId:'', assignedTrailerTruck:row.assignedTrailerId ? getTrailerLabel(row.assignedTrailerId) : '' } : row); next.jobAssignments = next.jobAssignments.filter((row) => !(row.assignmentType === 'Truck' && row.resourceId === id)); next.maintenanceRecords = next.maintenanceRecords.filter((row) => !(row.assetType === 'Truck' && row.assetId === id)); }
  else if(entityKey === 'trailers'){ next.trailers = next.trailers.filter((row) => row.id !== id); next.equipment = next.equipment.map((row) => row.assignedTrailerId === id ? { ...row, assignedTrailerId:'', assignedTrailerTruck:row.assignedTruckId ? getTruckLabel(row.assignedTruckId) : '' } : row); next.jobAssignments = next.jobAssignments.filter((row) => !(row.assignmentType === 'Trailer' && row.resourceId === id)); next.maintenanceRecords = next.maintenanceRecords.filter((row) => !(row.assetType === 'Trailer' && row.assetId === id)); }
  else if(entityKey === 'equipment'){ next.equipment = next.equipment.filter((row) => row.id !== id); next.jobAssignments = next.jobAssignments.filter((row) => !(row.assignmentType === 'Equipment' && row.resourceId === id)); next.maintenanceRecords = next.maintenanceRecords.filter((row) => !(row.assetType === 'Equipment' && row.assetId === id)); }
  else next[entityKey] = next[entityKey].filter((row) => row.id !== id);
  return next;
}

async function deleteEntityRecord(entityKey, id){
  if(!confirm(`Delete this ${ENTITY_CONFIG[entityKey].label.toLowerCase()}? This cannot be undone.`)) return;
  state.saveInFlight = true;
  showSaveStatus('saving', 'DELETING');
  try {
    if(isRemoteMode()){
      const existing = state.data[entityKey]?.find((row) => row.id === id) || null;
      if(entityKey === 'technicians'){ await remoteRepository.updateWhere(ENTITY_CONFIG.trucks.table, [{ column:'assigned_technician_id', value:id }], { assigned_technician_id:'', assigned_to:'', current_driver:'' }); await remoteRepository.deleteWhere(ENTITY_CONFIG.jobAssignments.table, [{ column:'assignment_type', value:'Technician' }, { column:'resource_id', value:id }]); }
      if(entityKey === 'trucks'){ await remoteRepository.updateWhere(ENTITY_CONFIG.trailers.table, [{ column:'assigned_truck_id', value:id }], { assigned_truck_id:'' }); await remoteRepository.updateWhere(ENTITY_CONFIG.equipment.table, [{ column:'assigned_truck_id', value:id }], { assigned_truck_id:'', assigned_trailer_truck:'' }); await remoteRepository.deleteWhere(ENTITY_CONFIG.jobAssignments.table, [{ column:'assignment_type', value:'Truck' }, { column:'resource_id', value:id }]); await remoteRepository.deleteWhere(ENTITY_CONFIG.maintenanceRecords.table, [{ column:'asset_type', value:'Truck' }, { column:'asset_id', value:id }]); }
      if(entityKey === 'trailers'){ await remoteRepository.updateWhere(ENTITY_CONFIG.equipment.table, [{ column:'assigned_trailer_id', value:id }], { assigned_trailer_id:'', assigned_trailer_truck:'' }); await remoteRepository.deleteWhere(ENTITY_CONFIG.jobAssignments.table, [{ column:'assignment_type', value:'Trailer' }, { column:'resource_id', value:id }]); await remoteRepository.deleteWhere(ENTITY_CONFIG.maintenanceRecords.table, [{ column:'asset_type', value:'Trailer' }, { column:'asset_id', value:id }]); }
      if(entityKey === 'equipment'){ await remoteRepository.deleteWhere(ENTITY_CONFIG.jobAssignments.table, [{ column:'assignment_type', value:'Equipment' }, { column:'resource_id', value:id }]); await remoteRepository.deleteWhere(ENTITY_CONFIG.maintenanceRecords.table, [{ column:'asset_type', value:'Equipment' }, { column:'asset_id', value:id }]); }
      if(existing?.assetPhotoPath){ await removeRemoteAssetPhoto(existing.assetPhotoPath).catch((error) => console.warn('Unable to remove deleted asset photo:', error)); clearCachedAssetPhoto(existing.assetPhotoPath); }
      await remoteRepository.deleteRecord(entityKey, id);
      await loadData({ silent:true, force:true });
    } else await persistLocal(buildLocalDeleteResult(entityKey, id));
    if(modalState.open && modalState.entity === entityKey && modalState.id === id) closeEntityModal();
    showSaveStatus('saved', 'DELETED');
    hideSaveStatusSoon();
  } catch (error){
    console.error('Unable to delete Field Ops record:', error);
    showSaveStatus('error', 'DELETE FAILED');
    hideSaveStatusSoon(4200);
    alert(error.message || 'Unable to delete the Field Ops record.');
  } finally {
    state.saveInFlight = false;
  }
}

async function deleteCurrentModalEntity(){ if(modalState.id) await deleteEntityRecord(modalState.entity, modalState.id); }

function isInteractionOverlayOpen(){ return !!document.getElementById('entity-modal-overlay')?.classList.contains('open'); }

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

document.getElementById('entity-modal-overlay').addEventListener('click', (event) => { if(event.target === document.getElementById('entity-modal-overlay')) closeEntityModal(); });
document.addEventListener('visibilitychange', () => { if(!document.hidden) refreshFromRemote(); });
window.addEventListener('keydown', (event) => { if(event.key === 'Escape' && isInteractionOverlayOpen()) closeEntityModal(); });

(async function init(){
  await (window.authReadyPromise || Promise.resolve());
  await loadData({ silent:true, force:true });
  render();
  startAutoRefresh();
})();
