const EMPLOYEE_STORAGE_KEY = 'field-ops-dashboard-data';
const LAB_ROLE_OPTIONS = ['Lab Tech', 'Senior Lab Tech', 'Lab Lead', 'Lab Supervisor'];
const FIELD_ROLE_OPTIONS = ['Field Tech', 'Senior Field Tech', 'Supervisor', 'Manager'];
const WORK_SCOPE_OPTIONS = ['Lab', 'Field', 'Both'];
const LOCAL_SPL_SITE = 'Pittsburgh';
const PORTAL_FEATURE_FALLBACKS = [
  { featureKey:'lab.tests.view', featureScope:'lab', featureName:'Lab Test Visibility', featureDescription:'View lab WIP work orders and test visibility.', sortOrder:10 },
  { featureKey:'lab.consumables.view', featureScope:'lab', featureName:'Consumables Visibility', featureDescription:'View consumable inventory.', sortOrder:20 },
  { featureKey:'lab.consumables.change_counts', featureScope:'lab', featureName:'Consumable Count Changes', featureDescription:'Receive, start, empty, return, and adjust consumable counts.', sortOrder:30 },
  { featureKey:'lab.consumables.manage_orders', featureScope:'lab', featureName:'Consumable Order Management', featureDescription:'Create, update, order, and receive consumable orders.', sortOrder:40 },
  { featureKey:'field.jobs.view', featureScope:'field', featureName:'Field Job Visibility', featureDescription:'View field jobs and dispatch details.', sortOrder:110 },
  { featureKey:'field.jobs.update_status', featureScope:'field', featureName:'Field Job Status Updates', featureDescription:'Update field job assignment statuses.', sortOrder:120 },
  { featureKey:'field.routes.view', featureScope:'field', featureName:'Route Visibility', featureDescription:'View field routes and route stops.', sortOrder:130 },
  { featureKey:'field.routes.edit', featureScope:'field', featureName:'Route Changes', featureDescription:'Update route status, route notes, and stop details.', sortOrder:140 },
  { featureKey:'field.samples.view', featureScope:'field', featureName:'Sample Logistics Visibility', featureDescription:'View field sample logistics.', sortOrder:150 },
  { featureKey:'field.samples.update_status', featureScope:'field', featureName:'Sample Status Updates', featureDescription:'Update sample workflow status.', sortOrder:160 }
];

let state = {
  employees: [],
  trucks: [],
  portalFeatures: [],
  saveInFlight: false
};

let modalState = {
  open: false,
  id: '',
  formData: {}
};

function uid(prefix = 'emp'){
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clone(value){
  return JSON.parse(JSON.stringify(value));
}

function esc(value){
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

function normalizeBoolean(value){
  return value === true || value === 'true' || value === 1 || value === '1';
}

function splitEmployeeName(value){
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

function buildEmployeeName(firstName, lastName, fallback = ''){
  const first = String(firstName || '').trim();
  const last = String(lastName || '').trim();
  const combined = [first, last].filter(Boolean).join(' ');
  return combined || String(fallback || '').trim();
}

function getEmployeeFullName(employee){
  return buildEmployeeName(employee?.employeeFirstName, employee?.employeeLastName, employee?.employeeName) || 'Unnamed employee';
}

function getEmployeeListName(employee){
  const first = String(employee?.employeeFirstName || '').trim();
  const last = String(employee?.employeeLastName || '').trim();
  if(first && last) return `${last}, ${first}`;
  if(last) return last;
  return first || String(employee?.employeeName || '').trim() || 'Unnamed employee';
}

function isVisitingEmployee(employee){
  const site = String(employee?.homeSplSite || LOCAL_SPL_SITE).trim();
  return !!site && site.toLowerCase() !== LOCAL_SPL_SITE.toLowerCase();
}

function getEmployeeOptionLabel(employee){
  const site = String(employee?.homeSplSite || LOCAL_SPL_SITE).trim() || LOCAL_SPL_SITE;
  return `${getEmployeeListName(employee)} | ${site}`;
}

function isRemoteMode(){
  return !!(window.appAuth && typeof window.appAuth.getMode === 'function' && window.appAuth.getMode() === 'remote');
}

function createEmployeeDraft(){
  return {
    employeeFirstName: '',
    employeeLastName: '',
    employeeName: '',
    homeSplSite: LOCAL_SPL_SITE,
    workScope: 'Field',
    labRole: '',
    fieldRole: 'Field Tech',
    canSampleTransport: false,
    isActive: true,
    phone: '',
    email: '',
    notes: '',
    defaultTruckId: '',
    portalUserId: '',
    portalEnabled: false,
    portalFeatureKeys: []
  };
}

function normalizeEmployeeRecord(source, fromRemote = false){
  const record = createEmployeeDraft();
  record.id = String(source?.id || '');
  record.employeeFirstName = String((fromRemote ? source?.employee_first_name : source?.employeeFirstName) || '');
  record.employeeLastName = String((fromRemote ? source?.employee_last_name : source?.employeeLastName) || '');
  record.employeeName = String((fromRemote ? source?.employee_name : source?.employeeName) || '');
  const parsedName = splitEmployeeName(record.employeeName);
  if(!record.employeeFirstName) record.employeeFirstName = parsedName.first;
  if(!record.employeeLastName) record.employeeLastName = parsedName.last;
  record.employeeName = buildEmployeeName(record.employeeFirstName, record.employeeLastName, record.employeeName);
  record.homeSplSite = String((fromRemote ? source?.home_spl_site : source?.homeSplSite) || LOCAL_SPL_SITE);
  record.workScope = String((fromRemote ? source?.work_scope : source?.workScope) || 'Field');
  record.labRole = String((fromRemote ? source?.lab_role : source?.labRole) || '');
  record.fieldRole = String((fromRemote ? source?.field_role : source?.fieldRole) || '');
  record.canSampleTransport = normalizeBoolean(fromRemote ? source?.can_sample_transport : source?.canSampleTransport);
  const activeValue = fromRemote ? source?.is_active : source?.isActive;
  record.isActive = activeValue === undefined || activeValue === null ? true : normalizeBoolean(activeValue);
  record.phone = String((fromRemote ? source?.phone : source?.phone) || '');
  record.email = String((fromRemote ? source?.email : source?.email) || '');
  record.notes = String((fromRemote ? source?.notes : source?.notes) || '');
  record.defaultTruckId = String(source?.defaultTruckId || '');
  record.portalUserId = String(source?.portalUserId || source?.portal_user_id || '');
  record.portalEnabled = normalizeBoolean(source?.portalEnabled ?? source?.portal_enabled);
  record.portalFeatureKeys = Array.isArray(source?.portalFeatureKeys)
    ? source.portalFeatureKeys.map((key) => String(key || '')).filter(Boolean)
    : [];
  return record;
}

function normalizePortalFeature(row){
  return {
    featureKey: String(row?.featureKey || row?.feature_key || ''),
    featureScope: String(row?.featureScope || row?.feature_scope || ''),
    featureName: String(row?.featureName || row?.feature_name || row?.feature_key || ''),
    featureDescription: String(row?.featureDescription || row?.feature_description || ''),
    sortOrder: Number(row?.sortOrder ?? row?.sort_order ?? 0),
    isActive: row?.isActive === undefined && row?.is_active === undefined ? true : normalizeBoolean(row?.isActive ?? row?.is_active)
  };
}

function normalizePortalProfile(row){
  return {
    userId: String(row?.user_id || ''),
    accessRole: String(row?.access_role || 'employee'),
    employeeId: String(row?.employee_id || ''),
    isActive: row?.is_active !== false,
    portalEnabled: row?.portal_enabled === true
  };
}

function normalizeTruckRecord(source, fromRemote = false){
  return {
    id: String(source?.id || ''),
    unitNumber: String((fromRemote ? source?.unit_number : source?.unitNumber) || ''),
    serviceStatus: String((fromRemote ? source?.service_status : source?.serviceStatus) || 'Available'),
    assignedTechnicianId: String((fromRemote ? source?.assigned_technician_id : source?.assignedTechnicianId) || ''),
    currentDriver: String((fromRemote ? source?.current_driver : source?.currentDriver) || '')
  };
}

function compareStrings(left, right){
  return String(left || '').localeCompare(String(right || ''), undefined, { sensitivity:'base' });
}

function sortEmployees(list){
  return [...list].sort((left, right) => compareStrings(getEmployeeListName(left), getEmployeeListName(right)));
}

function sortTrucks(list){
  return [...list].sort((left, right) => compareStrings(left.unitNumber, right.unitNumber));
}

function deriveEmployeesFromLegacyTechnicians(raw){
  const technicians = Array.isArray(raw?.technicians) ? raw.technicians : [];
  return technicians.map((tech) => normalizeEmployeeRecord({
    id: tech.id || uid(),
    employeeFirstName: tech.employeeFirstName || tech.employee_first_name || '',
    employeeLastName: tech.employeeLastName || tech.employee_last_name || '',
    employeeName: tech.employeeName || tech.employee_name || '',
    homeSplSite: tech.homeSplSite || tech.home_spl_site || LOCAL_SPL_SITE,
    workScope: 'Field',
    labRole: '',
    fieldRole: tech.role || 'Field Tech',
    canSampleTransport: false,
    phone: tech.phone || '',
    email: tech.email || '',
    notes: tech.notes || '',
    defaultTruckId: tech.defaultTruckId || ''
  }));
}

function getDefaultTruckForEmployee(employeeId){
  return state.trucks.find((truck) => truck.assignedTechnicianId === employeeId) || null;
}

async function readLocalDirectory(){
  try {
    const raw = localStorage.getItem(EMPLOYEE_STORAGE_KEY);
    if(!raw) return { rawData:{}, employees:[], trucks:[] };
    const parsed = JSON.parse(raw);
    const baseEmployees = Array.isArray(parsed?.employees) && parsed.employees.length
      ? parsed.employees.map((row) => normalizeEmployeeRecord(row))
      : deriveEmployeesFromLegacyTechnicians(parsed);
    const employees = sortEmployees(baseEmployees.map((row) => ({
      ...row,
      defaultTruckId: String(row.defaultTruckId || '')
    })));
    const trucks = sortTrucks((Array.isArray(parsed?.trucks) ? parsed.trucks : []).map((row) => normalizeTruckRecord(row)));
    return { rawData:parsed, employees, trucks };
  } catch (error){
    console.warn('Unable to read local employee directory:', error);
    return { rawData:{}, employees:[], trucks:[] };
  }
}

function buildLocalWritePayload(rawData, employees, trucks){
  return {
    ...(rawData || {}),
    employees: sortEmployees(employees).map((employee) => ({
      id: employee.id,
      employeeFirstName: employee.employeeFirstName,
      employeeLastName: employee.employeeLastName,
      employeeName: employee.employeeName,
      homeSplSite: employee.homeSplSite || LOCAL_SPL_SITE,
      workScope: employee.workScope,
      labRole: employee.labRole,
      fieldRole: employee.fieldRole,
      canSampleTransport: !!employee.canSampleTransport,
      isActive: employee.isActive !== false,
      phone: employee.phone,
      email: employee.email,
      notes: employee.notes
    })),
    trucks: sortTrucks(trucks).map((truck) => ({
      ...(Array.isArray(rawData?.trucks) ? (rawData.trucks.find((row) => String(row?.id || '') === truck.id) || {}) : {}),
      id: truck.id,
      unitNumber: truck.unitNumber,
      serviceStatus: truck.serviceStatus,
      assignedTechnicianId: truck.assignedTechnicianId,
      currentDriver: truck.currentDriver
    }))
  };
}

const remoteRepository = {
  async list(){
    const [employees, trucks, features, profiles, grants] = await Promise.all([
      window.appAuth.requestJson('/rest/v1/employees?select=*'),
      window.appAuth.requestJson('/rest/v1/field_trucks?select=id,unit_number,service_status,assigned_technician_id,current_driver'),
      window.appAuth.requestJson('/rest/v1/app_features?select=*&is_active=eq.true&order=sort_order.asc'),
      window.appAuth.requestJson('/rest/v1/app_user_profiles?select=*'),
      window.appAuth.requestJson('/rest/v1/employee_feature_grants?select=*')
    ]);
    const featureRows = (Array.isArray(features) && features.length ? features : PORTAL_FEATURE_FALLBACKS).map(normalizePortalFeature).filter((feature) => feature.featureKey);
    const employeeProfiles = (Array.isArray(profiles) ? profiles : [])
      .map(normalizePortalProfile)
      .filter((profile) => profile.accessRole === 'employee' && profile.employeeId);
    const profileByEmployeeId = new Map(employeeProfiles.map((profile) => [profile.employeeId, profile]));
    const grantKeysByEmployeeId = new Map();
    (Array.isArray(grants) ? grants : []).forEach((grant) => {
      if(grant?.is_enabled === false) return;
      const employeeId = String(grant?.employee_id || '');
      const featureKey = String(grant?.feature_key || '');
      if(!employeeId || !featureKey) return;
      if(!grantKeysByEmployeeId.has(employeeId)) grantKeysByEmployeeId.set(employeeId, []);
      grantKeysByEmployeeId.get(employeeId).push(featureKey);
    });
    const employeeRows = sortEmployees((Array.isArray(employees) ? employees : []).map((row) => {
      const employee = normalizeEmployeeRecord(row, true);
      const profile = profileByEmployeeId.get(employee.id) || null;
      return {
        ...employee,
        portalUserId: profile?.userId || '',
        portalEnabled: !!(profile && profile.isActive !== false && profile.portalEnabled),
        portalFeatureKeys: grantKeysByEmployeeId.get(employee.id) || []
      };
    }));
    return {
      employees: employeeRows,
      trucks: sortTrucks((Array.isArray(trucks) ? trucks : []).map((row) => normalizeTruckRecord(row, true))),
      features: featureRows
    };
  },
  async saveEmployee(formData){
    const employeeName = buildEmployeeName(formData.employeeFirstName, formData.employeeLastName, formData.employeeName);
    const payload = {
      employee_first_name: String(formData.employeeFirstName || '').trim(),
      employee_last_name: String(formData.employeeLastName || '').trim(),
      employee_name: employeeName,
      home_spl_site: String(formData.homeSplSite || LOCAL_SPL_SITE).trim() || LOCAL_SPL_SITE,
      work_scope: formData.workScope,
      lab_role: formData.labRole,
      field_role: formData.fieldRole,
      can_sample_transport: !!formData.canSampleTransport,
      is_active: formData.isActive !== false,
      phone: formData.phone,
      email: formData.email,
      notes: formData.notes
    };
    const url = formData.id
      ? `/rest/v1/employees?id=eq.${encodeURIComponent(formData.id)}&select=*`
      : '/rest/v1/employees?select=*';
    const response = await window.appAuth.requestJson(url, {
      method: formData.id ? 'PATCH' : 'POST',
      headers: { 'Content-Type':'application/json', 'Prefer':'return=representation' },
      body: JSON.stringify(payload)
    });
    const row = Array.isArray(response) ? response[0] : response;
    if(!row?.id) throw new Error('Supabase did not return the saved employee.');
    return String(row.id);
  },
  async assignDefaultTruck(employeeId, employeeName, truckId){
    if(truckId){
      await window.appAuth.requestJson(`/rest/v1/field_trucks?assigned_technician_id=eq.${encodeURIComponent(employeeId)}&id=neq.${encodeURIComponent(truckId)}`, {
        method:'PATCH',
        headers:{ 'Content-Type':'application/json', 'Prefer':'return=minimal' },
        body: JSON.stringify({ assigned_technician_id:null, current_driver:'' })
      });
      await window.appAuth.requestJson(`/rest/v1/field_trucks?id=eq.${encodeURIComponent(truckId)}`, {
        method:'PATCH',
        headers:{ 'Content-Type':'application/json', 'Prefer':'return=minimal' },
        body: JSON.stringify({ assigned_technician_id:employeeId, current_driver:employeeName || '' })
      });
      return;
    }
    await window.appAuth.requestJson(`/rest/v1/field_trucks?assigned_technician_id=eq.${encodeURIComponent(employeeId)}`, {
      method:'PATCH',
      headers:{ 'Content-Type':'application/json', 'Prefer':'return=minimal' },
      body: JSON.stringify({ assigned_technician_id:null, current_driver:'' })
    });
  },
  async setEmployeeActive(employeeId, isActive){
    await window.appAuth.requestJson(`/rest/v1/employees?id=eq.${encodeURIComponent(employeeId)}`, {
      method:'PATCH',
      headers:{ 'Content-Type':'application/json', 'Prefer':'return=minimal' },
      body: JSON.stringify({ is_active:!!isActive })
    });
  },
  async savePortalAccess(employeeId, formData){
    const portalUserId = String(formData.portalUserId || '').trim();
    const enabledFeatureKeys = Array.isArray(formData.portalFeatureKeys) ? [...new Set(formData.portalFeatureKeys.map((key) => String(key || '')).filter(Boolean))] : [];

    await window.appAuth.requestJson(`/rest/v1/employee_feature_grants?employee_id=eq.${encodeURIComponent(employeeId)}`, {
      method:'DELETE'
    });
    if(enabledFeatureKeys.length){
      await window.appAuth.requestJson('/rest/v1/employee_feature_grants', {
        method:'POST',
        headers:{ 'Content-Type':'application/json', 'Prefer':'return=minimal' },
        body: JSON.stringify(enabledFeatureKeys.map((featureKey) => ({
          employee_id: employeeId,
          feature_key: featureKey,
          is_enabled: true
        })))
      });
    }

    if(!portalUserId){
      await window.appAuth.requestJson(`/rest/v1/app_user_profiles?employee_id=eq.${encodeURIComponent(employeeId)}&access_role=eq.employee`, {
        method:'DELETE'
      });
      return;
    }

    await window.appAuth.requestJson(`/rest/v1/app_user_profiles?employee_id=eq.${encodeURIComponent(employeeId)}&access_role=eq.employee&user_id=neq.${encodeURIComponent(portalUserId)}`, {
      method:'DELETE'
    });
    await window.appAuth.requestJson('/rest/v1/app_user_profiles?on_conflict=user_id', {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Prefer':'resolution=merge-duplicates,return=minimal'
      },
      body: JSON.stringify([{
        user_id: portalUserId,
        access_role: 'employee',
        employee_id: employeeId,
        is_active: true,
        portal_enabled: !!formData.portalEnabled
      }])
    });
  }
};

function syncEmployeeDefaultTruckLocal(employees, trucks, employeeRecord){
  const employeeId = String(employeeRecord.id || '');
  const employeeName = getEmployeeFullName(employeeRecord);
  const defaultTruckId = String(employeeRecord.defaultTruckId || '');
  const nextTrucks = trucks.map((truck) => {
    if(defaultTruckId && truck.id === defaultTruckId){
      return { ...truck, assignedTechnicianId:employeeId, currentDriver:employeeName };
    }
    if(truck.assignedTechnicianId === employeeId){
      return { ...truck, assignedTechnicianId:'', currentDriver:'' };
    }
    return truck;
  });
  return nextTrucks;
}

async function loadData(){
  try {
    if(isRemoteMode()){
      const next = await remoteRepository.list();
      state.employees = next.employees;
      state.trucks = next.trucks;
      state.portalFeatures = next.features || [];
    } else {
      const next = await readLocalDirectory();
      state.employees = next.employees;
      state.trucks = next.trucks;
      state.portalFeatures = PORTAL_FEATURE_FALLBACKS;
    }
    render();
  } catch (error){
    console.error('Unable to load employees:', error);
    showSaveStatus('error', 'LOAD FAILED');
  }
}

function getScopeBadge(scope){
  return `<span class="status-badge ${scope === 'Both' ? 'info' : scope === 'Lab' ? 'warn' : 'ok'}">${esc(scope)}</span>`;
}

function getEmployeeStatusBadge(employee){
  return employee.isActive === false ? '<span class="status-badge danger">Inactive</span>' : '<span class="status-badge ok">Active</span>';
}

function getRoleSummary(employee){
  const roles = [];
  if(employee.labRole) roles.push(`Lab: ${employee.labRole}`);
  if(employee.fieldRole) roles.push(`Field: ${employee.fieldRole}`);
  return roles.length ? roles.join(' | ') : 'No role set';
}

function getFilteredEmployees(){
  const scope = document.getElementById('scope-filter')?.value || 'all';
  const status = document.getElementById('status-filter')?.value || 'active';
  const search = String(document.getElementById('employee-search')?.value || '').trim().toLowerCase();
  return state.employees.filter((employee) => {
    if(scope !== 'all' && employee.workScope !== scope) return false;
    if(status === 'active' && employee.isActive === false) return false;
    if(status === 'inactive' && employee.isActive !== false) return false;
    if(!search) return true;
    return [
      employee.employeeFirstName,
      employee.employeeLastName,
      employee.employeeName,
      getEmployeeListName(employee),
      employee.homeSplSite,
      employee.email,
      employee.phone,
      employee.labRole,
      employee.fieldRole,
      employee.notes
    ].some((value) => String(value || '').toLowerCase().includes(search));
  });
}

function renderStats(filteredEmployees){
  const activeEmployees = state.employees.filter((employee) => employee.isActive !== false);
  const labCount = activeEmployees.filter((employee) => ['Lab', 'Both'].includes(employee.workScope)).length;
  const fieldCount = activeEmployees.filter((employee) => ['Field', 'Both'].includes(employee.workScope)).length;
  const transportCount = activeEmployees.filter((employee) => employee.workScope === 'Lab' && employee.canSampleTransport).length;
  const portalCount = activeEmployees.filter((employee) => employee.portalEnabled && employee.portalUserId).length;
  document.getElementById('employee-stats').innerHTML = `
    <div class="stat-card"><div class="stat-label">Filtered Employees</div><div class="stat-value">${filteredEmployees.length}</div></div>
    <div class="stat-card warn"><div class="stat-label">Lab Eligible</div><div class="stat-value warn">${labCount}</div></div>
    <div class="stat-card ok"><div class="stat-label">Field Eligible</div><div class="stat-value ok">${fieldCount}</div></div>
    <div class="stat-card priority"><div class="stat-label">Sample Transport</div><div class="stat-value priority">${transportCount}</div></div>
    <div class="stat-card"><div class="stat-label">Portal Users</div><div class="stat-value">${portalCount}</div></div>
  `;
}

function renderEmployeeCard(employee){
  const defaultTruck = getDefaultTruckForEmployee(employee.id);
  const transportBadge = employee.workScope === 'Lab' && employee.canSampleTransport ? '<span class="warning-chip">Sample Pickup / Drop-Off</span>' : '';
  const visitingBadge = isVisitingEmployee(employee) ? '<span class="warning-chip">Visiting</span>' : '';
  const portalBadge = employee.portalEnabled && employee.portalUserId ? '<span class="status-badge info">Portal</span>' : '';
  return `
    <div class="employee-card clickable-card" role="button" tabindex="0" onclick="openEmployeeModal('${esc(employee.id)}')" onkeydown="if(event.key === 'Enter' || event.key === ' '){ event.preventDefault(); openEmployeeModal('${esc(employee.id)}'); }">
      <div class="employee-card-head">
        <div class="employee-card-copy">
          <div class="item-title">${esc(getEmployeeFullName(employee))}</div>
          <div class="muted">${esc(getRoleSummary(employee))}</div>
        </div>
        <div class="mini-tags">${getEmployeeStatusBadge(employee)}${getScopeBadge(employee.workScope)}${portalBadge}${visitingBadge}${transportBadge}</div>
      </div>
      <div class="employee-meta-grid">
        <div class="employee-meta">
          <div class="label">Default Truck</div>
          <div class="value">${esc(defaultTruck?.unitNumber || 'Pool')}</div>
        </div>
        <div class="employee-meta">
          <div class="label">Contact</div>
          <div class="value">${esc(employee.phone || employee.email || 'No contact info')}</div>
        </div>
        <div class="employee-meta">
          <div class="label">Home SPL Site</div>
          <div class="value">${esc(employee.homeSplSite || LOCAL_SPL_SITE)}</div>
        </div>
      </div>
      <div class="muted">${esc(employee.notes || 'No profile notes added yet.')}</div>
      ${employee.portalEnabled && employee.portalUserId ? `<div class="muted">Portal features: ${esc((employee.portalFeatureKeys || []).length || 0)} enabled</div>` : ''}
    </div>
  `;
}

function render(){
  const filteredEmployees = getFilteredEmployees();
  renderStats(filteredEmployees);
  document.getElementById('employee-summary').textContent = `${filteredEmployees.length} shown of ${state.employees.length}`;
  const listNode = document.getElementById('employee-list');
  if(!filteredEmployees.length){
    listNode.innerHTML = '<div class="empty-state employee-directory-empty"><strong>No employees match the current filters.</strong>Use the add button to build the shared directory.</div>';
    return;
  }
  listNode.innerHTML = filteredEmployees.map((employee) => renderEmployeeCard(employee)).join('');
}

function buildTruckOptions(){
  return [{ value:'', label:'Pool' }].concat(
    state.trucks.map((truck) => ({ value:truck.id, label:truck.unitNumber || 'Unnamed truck' }))
  );
}

function isLabEligible(scope){
  return scope === 'Lab' || scope === 'Both';
}

function isFieldEligible(scope){
  return scope === 'Field' || scope === 'Both';
}

function getPortalFeaturesForScope(scope){
  const features = (state.portalFeatures && state.portalFeatures.length ? state.portalFeatures : PORTAL_FEATURE_FALLBACKS)
    .map(normalizePortalFeature)
    .filter((feature) => feature.featureKey && feature.isActive !== false);
  return features.filter((feature) => {
    if(feature.featureScope === 'lab') return isLabEligible(scope);
    if(feature.featureScope === 'field') return isFieldEligible(scope);
    return true;
  }).sort((left, right) => left.sortOrder - right.sortOrder || left.featureName.localeCompare(right.featureName));
}

function getPortalFeatureGroups(scope){
  const groups = { lab:[], field:[] };
  getPortalFeaturesForScope(scope).forEach((feature) => {
    const key = feature.featureScope === 'lab' ? 'lab' : 'field';
    groups[key].push(feature);
  });
  return groups;
}

function renderPortalAccessSection(scope){
  if(!isRemoteMode()){
    return `
      <div class="form-group full portal-access-panel">
        <div class="section-title">Portal Access</div>
        <div class="muted">Portal access is available in Supabase remote mode.</div>
      </div>
    `;
  }

  const selectedKeys = new Set(modalState.formData.portalFeatureKeys || []);
  const groups = getPortalFeatureGroups(scope);
  const groupMarkup = Object.entries(groups)
    .filter(([, features]) => features.length)
    .map(([groupKey, features]) => `
      <div class="portal-feature-group">
        <div class="portal-feature-heading">${groupKey === 'lab' ? 'Lab Features' : 'Field Features'}</div>
        ${features.map((feature) => `
          <label class="portal-feature-row">
            <input type="checkbox" ${selectedKeys.has(feature.featureKey) ? 'checked' : ''} onchange="togglePortalFeature('${esc(feature.featureKey)}', this.checked)">
            <span>
              <strong>${esc(feature.featureName || feature.featureKey)}</strong>
              <small>${esc(feature.featureDescription || feature.featureKey)}</small>
            </span>
          </label>
        `).join('')}
      </div>
    `).join('') || '<div class="muted">No features are available for this employee scope.</div>';

  return `
    <div class="form-group full portal-access-panel">
      <div class="section-title">Portal Access</div>
      <div class="portal-access-grid">
        <label class="toggle-card">
          <input type="checkbox" ${modalState.formData.portalEnabled ? 'checked' : ''} onchange="toggleModalField('portalEnabled', this.checked)">
          <span>Enable technician portal for this employee</span>
        </label>
        <div>
          <label class="form-label">Supabase Auth User UUID</label>
          <input class="form-input" type="text" value="${esc(modalState.formData.portalUserId || '')}" placeholder="Paste the Auth user ID after creating the login" oninput="setModalField('portalUserId', this.value)">
          <div class="form-hint">Create the technician login in Supabase Auth first, then paste that user's UUID here.</div>
        </div>
      </div>
      <div class="portal-feature-list">${groupMarkup}</div>
    </div>
  `;
}

function renderModalBody(){
  const scope = modalState.formData.workScope || 'Field';
  const showLabRole = isLabEligible(scope);
  const showFieldRole = isFieldEligible(scope);
  const showDefaultTruck = isFieldEligible(scope);
  const showSampleTransport = scope === 'Lab';
  const defaultTruckId = modalState.formData.defaultTruckId || '';
  const truckOptions = buildTruckOptions();
  const body = `
    <div class="form-grid">
      <div class="form-group">
        <label class="form-label">First Name</label>
        <input class="form-input" type="text" value="${esc(modalState.formData.employeeFirstName || '')}" oninput="setModalField('employeeFirstName', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Last Name</label>
        <input class="form-input" type="text" value="${esc(modalState.formData.employeeLastName || '')}" oninput="setModalField('employeeLastName', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Home SPL Site</label>
        <input class="form-input" type="text" value="${esc(modalState.formData.homeSplSite || LOCAL_SPL_SITE)}" oninput="setModalField('homeSplSite', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Work Scope</label>
        <select class="form-input" onchange="changeWorkScope(this.value)">
          ${WORK_SCOPE_OPTIONS.map((option) => `<option value="${esc(option)}" ${scope === option ? 'selected' : ''}>${esc(option)}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Employment Status</label>
        <select class="form-input" onchange="setModalActiveStatus(this.value)">
          <option value="active" ${modalState.formData.isActive !== false ? 'selected' : ''}>Active</option>
          <option value="inactive" ${modalState.formData.isActive === false ? 'selected' : ''}>Inactive</option>
        </select>
      </div>
      ${showLabRole ? `<div class="form-group"><label class="form-label">Lab Role</label><select class="form-input" onchange="setModalField('labRole', this.value)">${[''].concat(LAB_ROLE_OPTIONS).map((option) => `<option value="${esc(option)}" ${String(modalState.formData.labRole || '') === String(option) ? 'selected' : ''}>${esc(option || 'Select lab role...')}</option>`).join('')}</select></div>` : ''}
      ${showFieldRole ? `<div class="form-group"><label class="form-label">Field Role</label><select class="form-input" onchange="setModalField('fieldRole', this.value)">${[''].concat(FIELD_ROLE_OPTIONS).map((option) => `<option value="${esc(option)}" ${String(modalState.formData.fieldRole || '') === String(option) ? 'selected' : ''}>${esc(option || 'Select field role...')}</option>`).join('')}</select></div>` : ''}
      ${showDefaultTruck ? `<div class="form-group"><label class="form-label">Default Truck</label><select class="form-input" onchange="setModalField('defaultTruckId', this.value)">${truckOptions.map((option) => `<option value="${esc(option.value)}" ${String(defaultTruckId) === String(option.value) ? 'selected' : ''}>${esc(option.label)}</option>`).join('')}</select></div>` : ''}
      <div class="form-group">
        <label class="form-label">Phone</label>
        <input class="form-input" type="text" value="${esc(modalState.formData.phone || '')}" oninput="setModalField('phone', this.value)">
      </div>
      <div class="form-group">
        <label class="form-label">Email</label>
        <input class="form-input" type="email" value="${esc(modalState.formData.email || '')}" oninput="setModalField('email', this.value)">
      </div>
      ${showSampleTransport ? `<div class="form-group full">
        <label class="form-label">Company Vehicle Eligibility</label>
        <label class="toggle-card"><input type="checkbox" ${modalState.formData.canSampleTransport ? 'checked' : ''} onchange="toggleModalField('canSampleTransport', this.checked)">Eligible to use a company vehicle for lab duties</label>
      </div>` : ''}
      <div class="form-group full">
        <label class="form-label">Notes</label>
        <textarea class="form-input" oninput="setModalField('notes', this.value)">${esc(modalState.formData.notes || '')}</textarea>
      </div>
      ${renderPortalAccessSection(scope)}
    </div>
  `;
  document.getElementById('employee-modal-body').innerHTML = body;
}

function openEmployeeModal(id = ''){
  const existing = id ? state.employees.find((employee) => employee.id === id) : null;
  const draft = existing ? clone(existing) : createEmployeeDraft();
  draft.defaultTruckId = existing ? (getDefaultTruckForEmployee(existing.id)?.id || '') : '';
  modalState = { open:true, id:existing?.id || '', formData:draft };
  document.getElementById('employee-modal-title').textContent = `${modalState.id ? 'Edit' : 'Add'} Employee`;
  const statusButton = document.getElementById('employee-modal-delete');
  statusButton.style.display = modalState.id ? '' : 'none';
  statusButton.textContent = draft.isActive === false ? 'Reactivate' : 'Mark Inactive';
  document.getElementById('employee-modal-overlay').classList.add('open');
  renderModalBody();
}

function closeEmployeeModal(){
  modalState = { open:false, id:'', formData:createEmployeeDraft() };
  document.getElementById('employee-modal-overlay').classList.remove('open');
}

function setModalField(key, value){
  modalState.formData[key] = value;
}

function toggleModalField(key, checked){
  modalState.formData[key] = !!checked;
}

function togglePortalFeature(featureKey, checked){
  const key = String(featureKey || '');
  if(!key) return;
  const current = new Set(modalState.formData.portalFeatureKeys || []);
  if(checked) current.add(key);
  else current.delete(key);
  modalState.formData.portalFeatureKeys = [...current];
}

function setModalActiveStatus(value){
  modalState.formData.isActive = value !== 'inactive';
}

function changeWorkScope(value){
  modalState.formData.workScope = value;
  if(!isLabEligible(value)) modalState.formData.labRole = '';
  if(!isFieldEligible(value)){
    modalState.formData.fieldRole = '';
    modalState.formData.defaultTruckId = '';
  }
  if(value !== 'Lab') modalState.formData.canSampleTransport = false;
  const allowed = new Set(getPortalFeaturesForScope(value).map((feature) => feature.featureKey));
  modalState.formData.portalFeatureKeys = (modalState.formData.portalFeatureKeys || []).filter((featureKey) => allowed.has(featureKey));
  renderModalBody();
}

function validateModal(){
  const formData = modalState.formData;
  if(!String(formData.employeeFirstName || '').trim() && !String(formData.employeeLastName || '').trim()) return 'First or last name is required.';
  if(!String(formData.homeSplSite || '').trim()) return 'Home SPL Site is required.';
  if(!WORK_SCOPE_OPTIONS.includes(formData.workScope)) return 'Choose a valid work scope.';
  if(isLabEligible(formData.workScope) && !String(formData.labRole || '').trim()) return 'Lab role is required for Lab or Both employees.';
  if(isFieldEligible(formData.workScope) && !String(formData.fieldRole || '').trim()) return 'Field role is required for Field or Both employees.';
  const portalUserId = String(formData.portalUserId || '').trim();
  if(formData.portalEnabled && !portalUserId) return 'Paste the Supabase Auth user UUID before enabling portal access.';
  if(portalUserId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(portalUserId)) return 'Supabase Auth user ID must be a valid UUID.';
  return '';
}

function showSaveStatus(status, message){
  const node = document.getElementById('save-indicator');
  if(!node) return;
  node.style.visibility = 'visible';
  node.className = `save-indicator ${status}`;
  node.textContent = message;
}

function hideSaveStatusSoon(delay = 2600){
  setTimeout(() => {
    const node = document.getElementById('save-indicator');
    if(node) node.style.visibility = 'hidden';
  }, delay);
}

async function saveEmployee(){
  const validationMessage = validateModal();
  if(validationMessage){
    alert(validationMessage);
    return;
  }
  state.saveInFlight = true;
  showSaveStatus('saving', 'SAVING');
  try {
    const formData = clone(modalState.formData);
    formData.homeSplSite = String(formData.homeSplSite || LOCAL_SPL_SITE).trim() || LOCAL_SPL_SITE;
    formData.employeeName = buildEmployeeName(formData.employeeFirstName, formData.employeeLastName, formData.employeeName);
    formData.isActive = formData.isActive !== false;
    formData.canSampleTransport = formData.workScope === 'Lab' && !!formData.canSampleTransport;
    if(isRemoteMode()){
      const employeeId = await remoteRepository.saveEmployee({ ...formData, id:modalState.id });
      await remoteRepository.assignDefaultTruck(employeeId, formData.employeeName, isFieldEligible(formData.workScope) ? String(formData.defaultTruckId || '') : '');
      await remoteRepository.savePortalAccess(employeeId, formData);
    } else {
      const current = await readLocalDirectory();
      const employees = sortEmployees(current.employees);
      const employeeId = modalState.id || uid();
      const record = normalizeEmployeeRecord({ ...formData, id:employeeId });
      const nextEmployees = employees.filter((employee) => employee.id !== employeeId);
      nextEmployees.unshift(record);
      const nextTrucks = syncEmployeeDefaultTruckLocal(nextEmployees, current.trucks, record);
      localStorage.setItem(EMPLOYEE_STORAGE_KEY, JSON.stringify(buildLocalWritePayload(current.rawData, nextEmployees, nextTrucks)));
    }
    closeEmployeeModal();
    await loadData();
    showSaveStatus('saved', 'SAVED');
    hideSaveStatusSoon();
  } catch (error){
    console.error('Unable to save employee:', error);
    showSaveStatus('error', 'SAVE FAILED');
    alert(error.message || 'Unable to save the employee.');
    hideSaveStatusSoon(4200);
  } finally {
    state.saveInFlight = false;
  }
}

async function deleteCurrentEmployee(){
  const employeeId = modalState.id;
  if(!employeeId) return;
  const currentEmployee = state.employees.find((employee) => employee.id === employeeId) || null;
  const nextActive = currentEmployee?.isActive === false;
  if(!confirm(nextActive ? 'Reactivate this employee?' : 'Mark this employee inactive? Existing job history will be preserved.')) return;
  state.saveInFlight = true;
  showSaveStatus('saving', nextActive ? 'REACTIVATING' : 'MARKING INACTIVE');
  try {
    if(isRemoteMode()){
      await remoteRepository.setEmployeeActive(employeeId, nextActive);
    } else {
      const current = await readLocalDirectory();
      const nextEmployees = current.employees.map((employee) => employee.id === employeeId ? { ...employee, isActive:nextActive } : employee);
      const payload = buildLocalWritePayload(current.rawData, nextEmployees, current.trucks);
      localStorage.setItem(EMPLOYEE_STORAGE_KEY, JSON.stringify(payload));
    }
    closeEmployeeModal();
    await loadData();
    showSaveStatus('saved', nextActive ? 'REACTIVATED' : 'MARKED INACTIVE');
    hideSaveStatusSoon();
  } catch (error){
    console.error('Unable to update employee status:', error);
    showSaveStatus('error', 'STATUS UPDATE FAILED');
    alert(error.message || 'Unable to update the employee status.');
    hideSaveStatusSoon(4200);
  } finally {
    state.saveInFlight = false;
  }
}

(function tickClock(){
  const now = new Date();
  const clockNode = document.getElementById('clock');
  const dateNode = document.getElementById('datedisp');
  if(clockNode) clockNode.textContent = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  if(dateNode) dateNode.textContent = now.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
  setTimeout(tickClock, 1000);
})();

(async function init(){
  await (window.authReadyPromise || Promise.resolve());
  await loadData();
})();
