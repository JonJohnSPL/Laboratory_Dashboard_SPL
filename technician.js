const LAB_STATE_KEYS = ['lab-wip-workorders', 'lab-wip-daily-schedule', 'lab-wip-test-definitions', 'lab-wip-subcontract-labs'];
const ASSIGNMENT_STATUSES = ['Assigned', 'Confirmed', 'In Progress', 'Complete'];
const ROUTE_STATUSES = ['Draft', 'Planned', 'Assigned', 'Complete', 'Archived'];
const SAMPLE_STATUSES = ['Needs Pulled', 'Received by Lab'];
const OPEN_ORDER_STATUSES = ['Needed', 'Ordered'];

let portalState = {
  access: null,
  employee: null,
  filters: {
    assignedOnly: true
  },
  data: {
    labWorkOrders: [],
    labSchedule: null,
    clients: [],
    projects: [],
    sites: [],
    jobs: [],
    assignments: [],
    jobSites: [],
    routes: [],
    routeStops: [],
    routeStopJobs: [],
    employees: [],
    samples: [],
    consumableItems: [],
    consumableCounts: [],
    consumableOrders: [],
    consumableActivity: []
  }
};

function esc(value){
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[ch]));
}

function fmtDate(value){
  if(!value) return 'Not set';
  const date = new Date(value);
  if(Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

function fmtDateTime(value){
  if(!value) return 'Not set';
  const date = new Date(value);
  if(Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('en-US', { month:'short', day:'numeric', hour:'numeric', minute:'2-digit' });
}

function todayISO(){
  return new Date().toISOString().slice(0, 10);
}

function feature(featureKey){
  return !!(window.appAuth && window.appAuth.hasFeature && window.appAuth.hasFeature(featureKey));
}

function isAdmin(){
  return !!(window.appAuth && window.appAuth.isAdmin && window.appAuth.isAdmin());
}

function hasScope(scope){
  if(isAdmin()) return true;
  const workScope = portalState.employee?.workScope || '';
  if(scope === 'lab') return workScope === 'Lab' || workScope === 'Both';
  if(scope === 'field') return workScope === 'Field' || workScope === 'Both';
  return false;
}

function canUse(featureKey, scope){
  return hasScope(scope) && feature(featureKey);
}

function setStatus(message, tone = ''){
  const node = document.getElementById('portal-status');
  node.className = `status-panel ${tone}`.trim();
  node.textContent = message;
}

function requestJson(path, options){
  return window.appAuth.requestJson(path, options);
}

function byId(list){
  return new Map((list || []).map((row) => [String(row.id || ''), row]));
}

function parseJson(raw, fallback){
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeWorkOrders(value){
  if(Array.isArray(value)) return value;
  if(value && Array.isArray(value.workOrders)) return value.workOrders;
  return [];
}

function normalizeEmployee(row){
  const first = String(row?.employee_first_name || '');
  const last = String(row?.employee_last_name || '');
  return {
    id:String(row?.id || ''),
    name:[first, last].filter(Boolean).join(' ') || String(row?.employee_name || 'Unnamed employee'),
    workScope:String(row?.work_scope || ''),
    fieldRole:String(row?.field_role || ''),
    labRole:String(row?.lab_role || '')
  };
}

function employeeName(employeeId){
  return byId(portalState.data.employees).get(String(employeeId || ''))?.name || 'Unassigned';
}

function clientName(clientId){
  return byId(portalState.data.clients).get(String(clientId || ''))?.client_name || 'Unassigned client';
}

function projectName(projectId){
  return byId(portalState.data.projects).get(String(projectId || ''))?.project_name || '';
}

function siteName(siteId){
  return byId(portalState.data.sites).get(String(siteId || ''))?.site_name || 'Unassigned site';
}

function routeStopLabel(stop){
  return String(stop?.stop_label || '') || siteName(stop?.site_id) || 'Route stop';
}

function getAssignmentsForJob(jobId){
  return portalState.data.assignments.filter((assignment) => String(assignment.job_id || '') === String(jobId || ''));
}

function getTechnicianAssignmentsForJob(jobId){
  return getAssignmentsForJob(jobId).filter((assignment) => assignment.assignment_type === 'Technician');
}

function isAssignedToMe(job){
  const employeeId = portalState.employee?.id || '';
  if(!employeeId) return false;
  return getTechnicianAssignmentsForJob(job.id).some((assignment) => String(assignment.resource_id || '') === employeeId);
}

function getLabScheduleEntries(){
  return Array.isArray(portalState.data.labSchedule?.entries) ? portalState.data.labSchedule.entries : [];
}

function getLabScheduleEntryForWorkOrder(workOrder){
  const workOrderId = String(workOrder?.id || '').trim();
  if(!workOrderId) return null;
  return getLabScheduleEntries().find((entry) => String(entry?.woId || '').trim() === workOrderId) || null;
}

function getLabScheduleAssignmentEmployeeIds(workOrder){
  const entry = getLabScheduleEntryForWorkOrder(workOrder);
  const assignments = entry?.assignments && typeof entry.assignments === 'object' ? entry.assignments : {};
  return [...new Set(Object.values(assignments).map((value) => String(value || '').trim()).filter(Boolean))];
}

function getLabScheduleAssignmentLabel(workOrder){
  const ids = getLabScheduleAssignmentEmployeeIds(workOrder);
  if(ids.includes(portalState.employee?.id || '')) return portalState.employee?.employeeName || 'Assigned to me';
  return String(workOrder?.assignedTo || '').trim() || (ids.length ? `${ids.length} scheduled assignment(s)` : 'Unassigned');
}

function labWoAssignedToMe(workOrder){
  const employeeId = portalState.employee?.id || '';
  if(employeeId && getLabScheduleAssignmentEmployeeIds(workOrder).includes(employeeId)) return true;
  const employeeNameValue = portalState.employee?.employeeName || '';
  if(!employeeNameValue) return false;
  return String(workOrder?.assignedTo || '').toLowerCase().includes(employeeNameValue.toLowerCase());
}

async function loadPortalData(){
  const loads = [];
  if(canUse('lab.tests.view', 'lab')) loads.push(loadLabWorkOrders());
  if(hasScope('field') && (feature('field.jobs.view') || feature('field.routes.view') || feature('field.samples.view') || feature('field.jobs.update_status') || feature('field.routes.edit') || feature('field.samples.update_status'))){
    loads.push(loadFieldData());
  }
  if(hasScope('lab') && (feature('lab.consumables.view') || feature('lab.consumables.change_counts') || feature('lab.consumables.manage_orders'))){
    loads.push(loadConsumables());
  }
  await Promise.all(loads);
}

async function loadLabWorkOrders(){
  const keyList = LAB_STATE_KEYS.map(encodeURIComponent).join(',');
  const rows = await requestJson(`/rest/v1/app_state?select=storage_key,storage_value&storage_key=in.(${keyList})`);
  const byKey = new Map((Array.isArray(rows) ? rows : []).map((row) => [row.storage_key, row.storage_value]));
  portalState.data.labWorkOrders = normalizeWorkOrders(parseJson(byKey.get('lab-wip-workorders'), []));
  portalState.data.labSchedule = parseJson(byKey.get('lab-wip-daily-schedule'), null);
}

async function loadFieldData(){
  const [
    clients,
    projects,
    sites,
    jobs,
    assignments,
    jobSites,
    routes,
    routeStops,
    routeStopJobs,
    employees,
    samples
  ] = await Promise.all([
    requestJson('/rest/v1/field_clients?select=id,client_name,client_code,service_scope&order=client_name.asc'),
    requestJson('/rest/v1/field_projects?select=id,client_id,project_name,service_scope,project_status&order=project_name.asc'),
    requestJson('/rest/v1/field_sites?select=*&order=site_name.asc'),
    requestJson('/rest/v1/field_jobs?select=*&order=scheduled_start.asc'),
    requestJson('/rest/v1/field_job_assignments?select=*&order=assignment_type.asc'),
    requestJson('/rest/v1/field_job_sites?select=*'),
    requestJson('/rest/v1/field_routes?select=*&order=route_date.asc'),
    requestJson('/rest/v1/field_route_stops?select=*&order=stop_order.asc'),
    requestJson('/rest/v1/field_route_stop_jobs?select=*'),
    requestJson('/rest/v1/employees?select=id,employee_first_name,employee_last_name,employee_name,work_scope,lab_role,field_role,is_active&order=employee_last_name.asc'),
    requestJson('/rest/v1/field_samples?select=*&order=sample_date.asc')
  ]);
  portalState.data.clients = Array.isArray(clients) ? clients : [];
  portalState.data.projects = Array.isArray(projects) ? projects : [];
  portalState.data.sites = Array.isArray(sites) ? sites : [];
  portalState.data.jobs = Array.isArray(jobs) ? jobs : [];
  portalState.data.assignments = Array.isArray(assignments) ? assignments : [];
  portalState.data.jobSites = Array.isArray(jobSites) ? jobSites : [];
  portalState.data.routes = Array.isArray(routes) ? routes : [];
  portalState.data.routeStops = Array.isArray(routeStops) ? routeStops : [];
  portalState.data.routeStopJobs = Array.isArray(routeStopJobs) ? routeStopJobs : [];
  portalState.data.employees = (Array.isArray(employees) ? employees : []).map(normalizeEmployee);
  portalState.data.samples = Array.isArray(samples) ? samples : [];
}

async function loadConsumables(){
  const [items, counts, orders, activity] = await Promise.all([
    requestJson('/rest/v1/consumable_items?select=*&is_active=eq.true&order=category.asc,item_name.asc'),
    requestJson('/rest/v1/consumable_stock_counts?select=*'),
    requestJson('/rest/v1/consumable_orders?select=*&order=created_at.desc'),
    requestJson('/rest/v1/consumable_activity?select=*&order=created_at.desc&limit=100')
  ]);
  portalState.data.consumableItems = Array.isArray(items) ? items : [];
  portalState.data.consumableCounts = Array.isArray(counts) ? counts : [];
  portalState.data.consumableOrders = Array.isArray(orders) ? orders : [];
  portalState.data.consumableActivity = Array.isArray(activity) ? activity : [];
}

function render(){
  renderHeader();
  renderControls();
  renderStats();
  renderSections();
}

function renderHeader(){
  const subtitle = document.getElementById('portal-subtitle');
  if(isAdmin()){
    subtitle.textContent = 'Admin session. Use the Employee Directory to link technician accounts.';
    return;
  }
  const employee = portalState.employee;
  subtitle.textContent = employee
    ? `${employee.employeeName || 'Technician'} | ${employee.workScope || 'No scope'}`
    : 'No linked employee profile found.';
}

function renderControls(){
  document.getElementById('portal-controls').innerHTML = `
    <div class="control-row">
      <label class="toggle-line"><input type="checkbox" ${portalState.filters.assignedOnly ? 'checked' : ''} onchange="setAssignedFilter(this.checked)"> Assigned to me</label>
      <button type="button" onclick="refreshPortal()">Refresh</button>
    </div>
    <div class="muted">Feature access is managed from the shared employee directory.</div>
  `;
}

function renderStats(){
  const assignedJobs = portalState.data.jobs.filter(isAssignedToMe).length;
  const openSamples = portalState.data.samples.filter((sample) => sample.sample_status !== 'Received by Lab').length;
  const needsOrder = portalState.data.consumableItems.filter((item) => {
    const count = getConsumableCount(item.id);
    return Number(count.new_count || 0) <= Number(item.reorder_point || 0);
  }).length;
  document.getElementById('portal-stats').innerHTML = `
    <div class="stat-card field"><div class="stat-label">Field Jobs</div><div class="stat-value">${portalState.data.jobs.length}</div></div>
    <div class="stat-card ok"><div class="stat-label">Assigned Jobs</div><div class="stat-value">${assignedJobs}</div></div>
    <div class="stat-card lab"><div class="stat-label">Open Lab WOs</div><div class="stat-value">${portalState.data.labWorkOrders.length}</div></div>
    <div class="stat-card"><div class="stat-label">Needs Order</div><div class="stat-value">${needsOrder + openSamples}</div></div>
  `;
}

function renderSections(){
  const sections = [];
  if(canUse('lab.tests.view', 'lab')) sections.push(renderLabTestsPanel());
  else if(hasScope('lab')) sections.push(renderLockedPanel('Lab Tests', 'Lab test visibility is not enabled for this account.'));

  if(hasScope('lab') && (feature('lab.consumables.view') || feature('lab.consumables.change_counts') || feature('lab.consumables.manage_orders'))) sections.push(renderConsumablesPanel());
  else if(hasScope('lab')) sections.push(renderLockedPanel('Consumables', 'Consumable visibility is not enabled for this account.'));

  if(hasScope('field') && (feature('field.jobs.view') || feature('field.jobs.update_status'))) sections.push(renderFieldJobsPanel());
  else if(hasScope('field')) sections.push(renderLockedPanel('Field Jobs', 'Field job visibility is not enabled for this account.'));

  if(hasScope('field') && (feature('field.routes.view') || feature('field.routes.edit'))) sections.push(renderRoutesPanel());
  if(hasScope('field') && (feature('field.samples.view') || feature('field.samples.update_status'))) sections.push(renderSamplesPanel());

  if(!sections.length){
    sections.push(renderLockedPanel('No Portal Features', 'Your login is valid, but no technician portal features are enabled yet.'));
  }
  document.getElementById('portal-sections').innerHTML = sections.join('');
}

function renderLockedPanel(title, message){
  return `
    <section class="panel">
      <div class="panel-header"><h2>${esc(title)}</h2></div>
      <div class="panel-body"><div class="empty-state">${esc(message)}</div></div>
    </section>
  `;
}

function renderLabTestsPanel(){
  const rows = (portalState.filters.assignedOnly ? portalState.data.labWorkOrders.filter(labWoAssignedToMe) : portalState.data.labWorkOrders)
    .slice()
    .sort((a, b) => String(a.dueDate || '').localeCompare(String(b.dueDate || '')))
    .slice(0, 24);
  return `
    <section class="panel full">
      <div class="panel-header">
        <div><h2>Lab Work</h2><div class="panel-meta">${rows.length} shown of ${portalState.data.labWorkOrders.length}</div></div>
      </div>
      <div class="panel-body">
        ${rows.length ? `<div class="card-list">${rows.map(renderLabWorkOrderCard).join('')}</div>` : '<div class="empty-state">No lab work orders match the current filter.</div>'}
      </div>
    </section>
  `;
}

function renderLabWorkOrderCard(workOrder){
  const tests = Array.isArray(workOrder.testRows) ? workOrder.testRows.length : (Array.isArray(workOrder.samples) ? workOrder.samples.reduce((sum, sample) => sum + (Array.isArray(sample.testCodes) ? sample.testCodes.length : 0), 0) : 0);
  return `
    <article class="work-card">
      <div class="card-head">
        <div>
          <div class="card-title">WO ${esc(workOrder.number || workOrder.id || 'Unnumbered')}</div>
          <div class="card-sub">${esc(workOrder.client || 'Unassigned client')} ${workOrder.projectId ? `| Project linked` : ''}</div>
        </div>
        <div class="badge-row">
          <span class="badge warn">${esc(workOrder.priority || 'NONE')}</span>
          <span class="badge">${esc(workOrder.stage || (workOrder.complete ? 'Done' : 'Open'))}</span>
        </div>
      </div>
      <div class="card-sub">Due ${esc(fmtDate(workOrder.dueDate))} | Assigned ${esc(getLabScheduleAssignmentLabel(workOrder))} | ${tests} test rows</div>
      ${workOrder.notes ? `<div class="muted">${esc(workOrder.notes)}</div>` : ''}
    </article>
  `;
}

function getConsumableCount(itemId){
  return portalState.data.consumableCounts.find((row) => String(row.item_id || '') === String(itemId || '')) || { new_count:0, in_use_count:0, empty_count:0 };
}

function getOpenOrder(itemId){
  return portalState.data.consumableOrders.find((order) => String(order.item_id || '') === String(itemId || '') && OPEN_ORDER_STATUSES.includes(order.order_status));
}

function renderConsumablesPanel(){
  const items = portalState.data.consumableItems.slice(0, 18);
  return `
    <section class="panel full">
      <div class="panel-header">
        <div><h2>Consumables</h2><div class="panel-meta">${items.length} active items</div></div>
      </div>
      <div class="panel-body">
        ${items.length ? `<div class="card-list">${items.map(renderConsumableCard).join('')}</div>` : '<div class="empty-state">No consumables available.</div>'}
      </div>
    </section>
  `;
}

function renderConsumableCard(item){
  const count = getConsumableCount(item.id);
  const order = getOpenOrder(item.id);
  const low = Number(count.new_count || 0) <= Number(item.reorder_point || 0);
  const canChange = canUse('lab.consumables.change_counts', 'lab');
  const canOrder = canUse('lab.consumables.manage_orders', 'lab');
  return `
    <article class="work-card">
      <div class="card-head">
        <div>
          <div class="card-title">${esc(item.item_name || 'Consumable')}</div>
          <div class="card-sub">${esc(item.category || '')} | ${esc(item.vendor_name || 'No vendor')}</div>
        </div>
        <div class="badge-row">
          <span class="badge ${low ? 'warn' : 'ok'}">${low ? 'Needs Order' : 'Stock OK'}</span>
          ${order ? `<span class="badge warn">${esc(order.order_status)} Order</span>` : ''}
        </div>
      </div>
      <div class="card-sub">New ${count.new_count || 0} | In use ${count.in_use_count || 0} | Empty ${count.empty_count || 0} | Reorder ${item.reorder_point || 0}</div>
      <div class="action-row">
        ${canChange ? `<button type="button" onclick="adjustConsumable('${esc(item.id)}','receive')">Receive +1</button><button type="button" onclick="adjustConsumable('${esc(item.id)}','start')">Start</button><button type="button" onclick="adjustConsumable('${esc(item.id)}','empty')">Mark Empty</button><button type="button" onclick="adjustConsumable('${esc(item.id)}','return')">Return Empty</button>` : ''}
        ${canOrder && !order ? `<button class="warn" type="button" onclick="createConsumableOrder('${esc(item.id)}')">Create Order</button>` : ''}
        ${canOrder && order?.order_status === 'Needed' ? `<button class="warn" type="button" onclick="updateConsumableOrder('${esc(order.id)}','Ordered')">Mark Ordered</button>` : ''}
        ${canOrder && order ? `<button class="ok" type="button" onclick="updateConsumableOrder('${esc(order.id)}','Received')">Receive Order</button>` : ''}
      </div>
    </article>
  `;
}

function getVisibleJobs(){
  const jobs = portalState.data.jobs.slice();
  const filtered = portalState.filters.assignedOnly ? jobs.filter(isAssignedToMe) : jobs;
  return filtered.sort((a, b) => String(a.scheduled_start || a.requested_date || '').localeCompare(String(b.scheduled_start || b.requested_date || '')));
}

function renderFieldJobsPanel(){
  const rows = getVisibleJobs().slice(0, 24);
  return `
    <section class="panel full">
      <div class="panel-header">
        <div><h2>Field Jobs</h2><div class="panel-meta">${rows.length} shown of ${portalState.data.jobs.length}</div></div>
      </div>
      <div class="panel-body">
        ${rows.length ? `<div class="card-list">${rows.map(renderFieldJobCard).join('')}</div>` : '<div class="empty-state">No field jobs match the current filter.</div>'}
      </div>
    </section>
  `;
}

function renderFieldJobCard(job){
  const assignments = getTechnicianAssignmentsForJob(job.id);
  const assignmentRows = assignments.length ? assignments.map(renderAssignmentAction).join('') : '<div class="muted">No technician assignments.</div>';
  return `
    <article class="work-card">
      <div class="card-head">
        <div>
          <div class="card-title">${esc(job.job_type || 'Field Job')} ${job.fieldfx_ticket_id ? `#${esc(job.fieldfx_ticket_id)}` : ''}</div>
          <div class="card-sub">${esc(clientName(job.client_id))} | ${esc(projectName(job.project_id) || 'No project')} | ${esc(siteName(job.site_id))}</div>
        </div>
        <div class="badge-row">
          <span class="badge field">${esc(job.priority || 'Normal')}</span>
          ${isAssignedToMe(job) ? '<span class="badge ok">Assigned To Me</span>' : ''}
        </div>
      </div>
      <div class="card-sub">${esc(fmtDateTime(job.scheduled_start || job.requested_date))} - ${esc(job.scheduled_end ? fmtDateTime(job.scheduled_end) : 'Open end')}</div>
      ${job.scope_summary ? `<div class="muted">${esc(job.scope_summary)}</div>` : ''}
      ${job.work_instructions ? `<div class="muted">${esc(job.work_instructions)}</div>` : ''}
      <div class="card-list">${assignmentRows}</div>
    </article>
  `;
}

function renderAssignmentAction(assignment){
  const canUpdate = canUse('field.jobs.update_status', 'field');
  return `
    <div class="mini-card">
      <div class="card-head">
        <div>
          <div class="card-title">${esc(employeeName(assignment.resource_id))}</div>
          <div class="card-sub">${esc(assignment.assignment_status || 'Assigned')}</div>
        </div>
      </div>
      ${canUpdate ? `<div class="action-row"><select id="assignment-status-${esc(assignment.id)}">${ASSIGNMENT_STATUSES.map((status) => `<option value="${esc(status)}" ${assignment.assignment_status === status ? 'selected' : ''}>${esc(status)}</option>`).join('')}</select><input class="input" id="assignment-notes-${esc(assignment.id)}" value="${esc(assignment.assignment_notes || '')}" placeholder="Notes"><button type="button" onclick="saveAssignmentStatus('${esc(assignment.id)}')">Save</button></div>` : ''}
    </div>
  `;
}

function renderRoutesPanel(){
  const employeeId = portalState.employee?.id || '';
  const routes = (portalState.filters.assignedOnly && employeeId)
    ? portalState.data.routes.filter((route) => String(route.assigned_technician_id || '') === employeeId)
    : portalState.data.routes;
  return `
    <section class="panel">
      <div class="panel-header"><div><h2>Routes</h2><div class="panel-meta">${routes.length} routes</div></div></div>
      <div class="panel-body">
        ${routes.length ? `<div class="card-list">${routes.slice(0, 16).map(renderRouteCard).join('')}</div>` : '<div class="empty-state">No routes match the current filter.</div>'}
      </div>
    </section>
  `;
}

function renderRouteCard(route){
  const stops = portalState.data.routeStops
    .filter((stop) => String(stop.route_id || '') === String(route.id || ''))
    .sort((left, right) => Number(left.stop_order || 0) - Number(right.stop_order || 0));
  const canEdit = canUse('field.routes.edit', 'field');
  const stopMarkup = stops.length
    ? `<div class="card-list">${stops.map((stop) => renderRouteStopAction(stop, canEdit)).join('')}</div>`
    : '<div class="muted">No stops have been added to this route.</div>';
  return `
    <article class="work-card">
      <div class="card-head">
        <div>
          <div class="card-title">${esc(route.route_name || 'Route')}</div>
          <div class="card-sub">${esc(fmtDate(route.route_date))} | ${esc(employeeName(route.assigned_technician_id))}</div>
        </div>
        <span class="badge field">${esc(route.route_status || 'Draft')}</span>
      </div>
      <div class="card-sub">${stops.length} stop(s) | ${esc(route.origin_label || 'Origin')} to ${esc(route.destination_label || 'Destination')}</div>
      ${canEdit ? `<div class="action-row"><select id="route-status-${esc(route.id)}">${ROUTE_STATUSES.map((status) => `<option value="${esc(status)}" ${route.route_status === status ? 'selected' : ''}>${esc(status)}</option>`).join('')}</select><input class="input" id="route-notes-${esc(route.id)}" value="${esc(route.notes || '')}" placeholder="Route notes"><button type="button" onclick="saveRoute('${esc(route.id)}')">Save Route</button></div>` : ''}
      ${stopMarkup}
    </article>
  `;
}

function renderRouteStopAction(stop, canEdit){
  return `
    <div class="mini-card">
      <div class="card-head">
        <div>
          <div class="card-title">${esc(routeStopLabel(stop))}</div>
          <div class="card-sub">Stop ${Number(stop.stop_order || 0) + 1} | ${esc(stop.stop_type || 'site')}</div>
        </div>
      </div>
      ${stop.stop_value ? `<div class="muted">${esc(stop.stop_value)}</div>` : ''}
      ${canEdit ? `<div class="action-row"><input class="input short-input" id="route-stop-order-${esc(stop.id)}" type="number" min="0" value="${esc(stop.stop_order || 0)}"><input class="input" id="route-stop-notes-${esc(stop.id)}" value="${esc(stop.stop_notes || '')}" placeholder="Stop notes"><button type="button" onclick="saveRouteStop('${esc(stop.id)}')">Save Stop</button></div>` : ''}
    </div>
  `;
}

function renderSamplesPanel(){
  const samples = portalState.data.samples.filter((sample) => !portalState.filters.assignedOnly || isSampleAssignedToMe(sample));
  return `
    <section class="panel">
      <div class="panel-header"><div><h2>Samples</h2><div class="panel-meta">${samples.length} samples</div></div></div>
      <div class="panel-body">
        ${samples.length ? `<div class="table-wrap"><table><thead><tr><th>Sample</th><th>Site</th><th>Status</th><th>Tests</th><th>Action</th></tr></thead><tbody>${samples.slice(0, 32).map(renderSampleRow).join('')}</tbody></table></div>` : '<div class="empty-state">No samples match the current filter.</div>'}
      </div>
    </section>
  `;
}

function isSampleAssignedToMe(sample){
  const job = portalState.data.jobs.find((row) => String(row.id || '') === String(sample.job_id || ''));
  return job ? isAssignedToMe(job) : false;
}

function renderSampleRow(sample){
  const canUpdate = canUse('field.samples.update_status', 'field');
  return `
    <tr>
      <td>${esc(sample.sample_name || sample.cylinder_number || 'Sample')}</td>
      <td>${esc(siteName(sample.site_id))}</td>
      <td><span class="badge ${sample.sample_status === 'Received by Lab' ? 'ok' : 'warn'}">${esc(sample.sample_status || 'Needs Pulled')}</span></td>
      <td>${esc((Array.isArray(sample.test_codes) ? sample.test_codes : []).join(', ') || 'No tests')}</td>
      <td>${canUpdate ? `<select id="sample-status-${esc(sample.id)}">${SAMPLE_STATUSES.map((status) => `<option value="${esc(status)}" ${sample.sample_status === status ? 'selected' : ''}>${esc(status)}</option>`).join('')}</select><button type="button" onclick="saveSampleStatus('${esc(sample.id)}')">Save</button>` : ''}</td>
    </tr>
  `;
}

function setAssignedFilter(checked){
  portalState.filters.assignedOnly = !!checked;
  render();
}

async function refreshPortal(){
  setStatus('Refreshing portal data...');
  await loadPortalData();
  render();
  setStatus('Portal data refreshed.', 'ok');
}

async function saveAssignmentStatus(assignmentId){
  const status = document.getElementById(`assignment-status-${assignmentId}`)?.value || 'Assigned';
  const notes = document.getElementById(`assignment-notes-${assignmentId}`)?.value || '';
  await requestJson('/rest/v1/rpc/portal_update_field_job_assignment_status', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body:JSON.stringify({ target_assignment_id:assignmentId, next_status:status, next_notes:notes })
  });
  await refreshPortal();
}

async function saveRoute(routeId){
  const status = document.getElementById(`route-status-${routeId}`)?.value || 'Draft';
  const notes = document.getElementById(`route-notes-${routeId}`)?.value || '';
  await requestJson('/rest/v1/rpc/portal_update_field_route', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body:JSON.stringify({ target_route_id:routeId, next_status:status, next_notes:notes })
  });
  await refreshPortal();
}

async function saveRouteStop(stopId){
  const order = Number(document.getElementById(`route-stop-order-${stopId}`)?.value || 0);
  const notes = document.getElementById(`route-stop-notes-${stopId}`)?.value || '';
  await requestJson('/rest/v1/rpc/portal_update_field_route_stop', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body:JSON.stringify({ target_route_stop_id:stopId, next_stop_order:order, next_stop_notes:notes })
  });
  await refreshPortal();
}

async function saveSampleStatus(sampleId){
  const status = document.getElementById(`sample-status-${sampleId}`)?.value || 'Needs Pulled';
  await requestJson('/rest/v1/rpc/portal_update_field_sample_status', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body:JSON.stringify({ target_sample_id:sampleId, next_status:status })
  });
  await refreshPortal();
}

async function adjustConsumable(itemId, action){
  const count = getConsumableCount(itemId);
  const next = {
    new_count:Number(count.new_count || 0),
    in_use_count:Number(count.in_use_count || 0),
    empty_count:Number(count.empty_count || 0)
  };
  let delta = 0;
  if(action === 'receive'){
    next.new_count += 1;
    delta = 1;
  } else if(action === 'start'){
    if(next.new_count <= 0) return alert('No new stock is available to start.');
    next.new_count -= 1;
    next.in_use_count += 1;
  } else if(action === 'empty'){
    if(next.in_use_count <= 0) return alert('No in-use stock is available to mark empty.');
    next.in_use_count -= 1;
    next.empty_count += 1;
  } else if(action === 'return'){
    if(next.empty_count <= 0) return alert('No empty stock is available to return.');
    next.empty_count -= 1;
    delta = -1;
  }
  await requestJson('/rest/v1/rpc/portal_adjust_consumable_counts', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body:JSON.stringify({
      target_item_id:itemId,
      next_new_count:next.new_count,
      next_in_use_count:next.in_use_count,
      next_empty_count:next.empty_count,
      activity_type_value:action === 'receive' ? 'receive_stock' : action === 'start' ? 'start_stock' : action === 'empty' ? 'mark_empty' : 'return_empty',
      quantity_delta_value:delta,
      notes_value:'Technician portal update'
    })
  });
  await refreshPortal();
}

async function createConsumableOrder(itemId){
  const item = portalState.data.consumableItems.find((row) => String(row.id || '') === String(itemId || ''));
  const quantity = Math.max(1, Number(window.prompt(`Order quantity for ${item?.item_name || 'item'}?`, String(item?.reorder_point || 1)) || 0));
  if(!quantity) return;
  await requestJson('/rest/v1/rpc/portal_save_consumable_order', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body:JSON.stringify({
      target_order_id:null,
      target_item_id:itemId,
      quantity_value:quantity,
      order_status_value:'Needed',
      ordered_on_value:null,
      received_on_value:null,
      notes_value:'Technician portal order'
    })
  });
  await refreshPortal();
}

async function updateConsumableOrder(orderId, status){
  const order = portalState.data.consumableOrders.find((row) => String(row.id || '') === String(orderId || ''));
  if(!order) return;
  await requestJson('/rest/v1/rpc/portal_save_consumable_order', {
    method:'POST',
    headers:{ 'Content-Type':'application/json' },
    body:JSON.stringify({
      target_order_id:order.id,
      target_item_id:order.item_id,
      quantity_value:order.quantity,
      order_status_value:status,
      ordered_on_value:status === 'Ordered' ? (order.ordered_on || todayISO()) : (order.ordered_on || null),
      received_on_value:status === 'Received' ? (order.received_on || todayISO()) : (order.received_on || null),
      notes_value:order.notes || 'Technician portal order update'
    })
  });
  await refreshPortal();
}

function tickClock(){
  const now = new Date();
  document.getElementById('clock').textContent = now.toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  document.getElementById('datedisp').textContent = now.toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric', year:'numeric' });
  setTimeout(tickClock, 1000);
}

(async function init(){
  tickClock();
  await (window.authReadyPromise || Promise.resolve());
  portalState.access = window.appAuth?.getAccess ? window.appAuth.getAccess() : null;
  portalState.employee = window.appAuth?.getEmployee ? window.appAuth.getEmployee() : null;
  portalState.filters.assignedOnly = !isAdmin();

  if(window.appAuth?.getMode && window.appAuth.getMode() !== 'remote'){
    setStatus('Technician portal requires Supabase remote mode.', 'warn');
    render();
    return;
  }

  if(!isAdmin() && (!portalState.access?.profile || portalState.access.profile.accessRole !== 'employee' || !portalState.access.profile.portalEnabled || !portalState.employee)){
    setStatus('This login is not linked to an enabled technician portal profile. Ask an admin to link the Supabase Auth user ID in the Employee Directory.', 'error');
    render();
    return;
  }

  try {
    setStatus('Loading enabled technician tools...');
    await loadPortalData();
    render();
    setStatus('Technician portal ready.', 'ok');
  } catch (error){
    console.error('Unable to load technician portal:', error);
    setStatus(error.message || 'Unable to load technician portal.', 'error');
    render();
  }
})();
