const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

function readFunction(source, name){
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Could not find ${name}`);

  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for(let index = bodyStart; index < source.length; index += 1){
    if(source[index] === '{') depth += 1;
    if(source[index] === '}') depth -= 1;
    if(depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Could not parse ${name}`);
}

function createAssignmentContext(){
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const context = {
    state:{
      data:{
        trailers:[
          { id:'linked-trailer', assignedTruckId:'truck-1' },
          { id:'unassigned-trailer-1', assignedTruckId:'' },
          { id:'unassigned-trailer-2', assignedTruckId:'' }
        ]
      }
    },
    modalState:{ assignments:[] },
    ENTITY_CONFIG:{ jobAssignments:{ idPrefix:'asg' } },
    uid:() => 'new-assignment',
    normalizeRecord:(_entity, record) => record,
    renderModal:() => {}
  };

  vm.createContext(context);
  vm.runInContext([
    readFunction(source, 'jobUsesProverInsteadOfTruck'),
    readFunction(source, 'getOrCreateModalProverAssignment'),
    readFunction(source, 'getTrailersLinkedToTruck'),
    readFunction(source, 'syncModalLinkedTrailerAssignments'),
    readFunction(source, 'applyModalProverOverride'),
    readFunction(source, 'removeAssignmentRow')
  ].join('\n'), context);
  return context;
}

test('deleting a truck assignment does not add unassigned trailers', () => {
  const context = createAssignmentContext();
  context.modalState.assignments = [
    { id:'truck-assignment', assignmentType:'Truck', resourceId:'truck-1' },
    { id:'trailer-assignment', assignmentType:'Trailer', resourceId:'linked-trailer' }
  ];

  context.removeAssignmentRow('truck-assignment');

  assert.deepEqual(context.modalState.assignments, []);
});

test('selecting a truck adds only trailers linked to that truck', () => {
  const context = createAssignmentContext();

  context.syncModalLinkedTrailerAssignments('truck-1');

  assert.deepEqual(
    context.modalState.assignments.map((assignment) => assignment.resourceId),
    ['linked-trailer']
  );
});

test('a Prover-only job replaces its truck default with a Prover selector', () => {
  const context = createAssignmentContext();
  context.getRequiredAssignmentTypes = () => ['Technician', 'Prover'];
  context.modalState.formData = { jobType:'prover-only' };
  context.modalState.assignments = [
    { id:'technician-assignment', assignmentType:'Technician', resourceId:'technician-1' },
    { id:'truck-assignment', assignmentType:'Truck', resourceId:'truck-1' },
    { id:'trailer-assignment', assignmentType:'Trailer', resourceId:'linked-trailer' }
  ];

  assert.equal(context.jobUsesProverInsteadOfTruck(), true);
  context.applyModalProverOverride();

  assert.deepEqual(
    context.modalState.assignments.map(({ assignmentType, resourceId }) => ({ assignmentType, resourceId })),
    [
      { assignmentType:'Technician', resourceId:'technician-1' },
      { assignmentType:'Prover', resourceId:'' }
    ]
  );
});

test('Geotab communication state flags a linked offline device', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFunction(source, 'getGeotabCommunicationState'), context);

  const status = context.getGeotabCommunicationState({ geotabDeviceId:'device-1', geotabIsCommunicating:false });
  assert.equal(status.tone, 'danger');
  assert.equal(status.label, 'Device not communicating');
});

test('Geotab communication state does not treat unavailable data as offline', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFunction(source, 'getGeotabCommunicationState'), context);

  const unavailable = context.getGeotabCommunicationState({ geotabDeviceId:'device-1', geotabIsCommunicating:null });
  assert.equal(unavailable.tone, 'muted');
  assert.equal(unavailable.label, 'GPS status unavailable');
  const notFound = context.getGeotabCommunicationState({ geotabDeviceId:'', geotabLinkStatus:'Not Found' });
  assert.equal(notFound.tone, 'warn');
  assert.equal(notFound.label, 'GPS device not found');
});

test('Geotab communication state applies to a linked trailer device', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFunction(source, 'getGeotabCommunicationState'), context);

  const status = context.getGeotabCommunicationState({ geotabDeviceId:'trailer-device-1', geotabIsCommunicating:false });
  assert.equal(status.tone, 'danger');
  assert.equal(status.label, 'Device not communicating');
});

test('Geotab summary counts offline trucks and trailers', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const summary = { textContent:'' };
  const button = { disabled:false, textContent:'' };
  const context = {
    state:{
      geotabSyncInFlight:false,
      data:{
        trucks:[{ geotabDeviceId:'truck-device', geotabIsCommunicating:false, geotabStatusCheckedAt:'2026-08-12T14:00:00Z' }],
        trailers:[{ geotabDeviceId:'trailer-device', geotabIsCommunicating:false, geotabStatusCheckedAt:'2026-08-12T14:01:00Z' }]
      }
    },
    document:{ getElementById:(id) => id === 'geotab-sync-summary' ? summary : button },
    parseDateTime:(value) => value ? new Date(value) : null
  };
  vm.createContext(context);
  vm.runInContext(readFunction(source, 'renderGeotabSyncSummary'), context);

  context.renderGeotabSyncSummary();

  assert.match(summary.textContent, /^2 offline \(1 truck, 1 trailer\) \|/);
});

test('opening Resources automatically starts one silent Geotab sync for admins', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const calls = [];
  const context = {
    state:{ activeView:'overview' },
    window:{ appAuth:{ isAdmin:() => true } },
    isRemoteMode:() => true,
    render:() => calls.push({ type:'render' }),
    refreshGeotabFleetStatus:(options) => calls.push({ type:'sync', options })
  };
  vm.createContext(context);
  vm.runInContext(readFunction(source, 'switchView'), context);

  context.switchView('resources');
  context.switchView('resources');

  assert.equal(calls.filter((call) => call.type === 'render').length, 2);
  assert.deepEqual(JSON.parse(JSON.stringify(calls.filter((call) => call.type === 'sync'))), [
    { type:'sync', options:{ silent:true } }
  ]);
});

test('opening Resources does not start an automatic Geotab sync for non-admins', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  let syncCalls = 0;
  const context = {
    state:{ activeView:'overview' },
    window:{ appAuth:{ isAdmin:() => false } },
    isRemoteMode:() => true,
    render:() => {},
    refreshGeotabFleetStatus:() => { syncCalls += 1; }
  };
  vm.createContext(context);
  vm.runInContext(readFunction(source, 'switchView'), context);

  context.switchView('resources');

  assert.equal(syncCalls, 0);
});

test('dispatch date range includes jobs whose schedule overlaps either boundary', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext([
    readFunction(source, 'parseDateOnly'),
    readFunction(source, 'parseDateTime'),
    readFunction(source, 'getJobPrimaryDate'),
    readFunction(source, 'getJobSecondaryDate'),
    readFunction(source, 'jobOverlapsDispatchDateRange')
  ].join('\n'), context);

  const spanningJob = { scheduledStart:'2026-08-10T08:00:00', scheduledEnd:'2026-08-14T17:00:00' };
  assert.equal(context.jobOverlapsDispatchDateRange(spanningJob, '2026-08-12', '2026-08-13'), true);
  assert.equal(context.jobOverlapsDispatchDateRange(spanningJob, '2026-08-15', ''), false);
  assert.equal(context.jobOverlapsDispatchDateRange(spanningJob, '', '2026-08-09'), false);
});

test('dispatch board exposes the requested filters and removes priority controls', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const renderDispatchSource = readFunction(source, 'renderDispatch');

  for(const filter of ['dispatchClient', 'dispatchJobType', 'dispatchDatePreset', 'dispatchDateFrom', 'dispatchDateTo', 'dispatchStatus', 'dispatchTechnician']){
    assert.match(renderDispatchSource, new RegExp(filter));
  }
  assert.doesNotMatch(source, /dispatchPriority|dispatchAlertFilter|dispatchAssignmentFilter|getPriorityBadge|PRIORITY_OPTIONS/);
});

test('custody or allocation is displayed only for proving job types', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const renderDispatchTableSource = readFunction(source, 'renderDispatchTable');
  assert.match(renderDispatchTableSource, /jobTypeHasDetailGroup\(job\.jobType, 'proving'\) && job\.custodyAllocation/);
});

test('job tables use a dedicated Salesforce Ticket column and omit Scope Summary', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const renderDispatchTableSource = readFunction(source, 'renderDispatchTable');
  assert.match(renderDispatchTableSource, /label:'Salesforce Ticket'/);
  assert.match(renderDispatchTableSource, /renderJobSalesforceTicket\(job\)/);
  assert.doesNotMatch(renderDispatchTableSource, /scopeSummary/);
  assert.match(readFunction(source, 'renderJobSalesforceTicket'), /renderJobNeedsTicketTag/);
});

test('dispatch date presets default to this week and include the requested periods', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const renderDispatchSource = readFunction(source, 'renderDispatch');
  assert.match(source, /dispatchDatePreset:'this_week'/);
  for(const label of ['This Week', 'Last Week', 'Next Week', 'This Month', 'Last Month', 'Next Month', 'Date Range']){
    assert.match(renderDispatchSource, new RegExp(label));
  }
});

test('Schedule uses non-date filters that are separate from the Job Board', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const html = fs.readFileSync('field-dashboard.html', 'utf8');
  const renderScheduleSource = readFunction(source, 'renderSchedule');
  assert.match(html, /data-view="job-board"/);
  assert.match(html, /id="job-board-screen"/);
  assert.match(html, /id="schedule-dispatch-toolbar"/);
  assert.match(html, /id="schedule-dispatch-table"/);
  assert.match(renderScheduleSource, /getFilteredScheduleJobs/);
  assert.match(renderScheduleSource, /renderScheduleDispatch/);
  assert.doesNotMatch(readFunction(source, 'getScheduleDates'), /dispatchDate/);
  const scheduleFilterSource = readFunction(source, 'getFilteredScheduleJobs');
  for(const filter of ['scheduleSearch', 'scheduleClient', 'scheduleJobType', 'scheduleTechnician']){
    assert.match(scheduleFilterSource, new RegExp(filter));
  }
  assert.doesNotMatch(scheduleFilterSource, /dispatchDate/);
});

test('Schedule and Job Board filters do not mutate one another', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  let renders = 0;
  const context = {
    state:{ filters:{ scheduleClient:'all', dispatchClient:'job-board-client' } },
    render:() => { renders += 1; }
  };
  vm.createContext(context);
  vm.runInContext([readFunction(source, 'setScheduleFilter'), readFunction(source, 'setDispatchFilter')].join('\n'), context);

  context.setScheduleFilter('scheduleClient', 'schedule-client');
  assert.equal(context.state.filters.scheduleClient, 'schedule-client');
  assert.equal(context.state.filters.dispatchClient, 'job-board-client');
  context.setDispatchFilter('dispatchClient', 'updated-job-board-client');
  assert.equal(context.state.filters.scheduleClient, 'schedule-client');
  assert.equal(context.state.filters.dispatchClient, 'updated-job-board-client');
  assert.equal(renders, 2);
});

test('both filter toolbars provide a Clear Filter action', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  assert.match(readFunction(source, 'renderDispatch'), /clearDispatchFilters\(\)/);
  assert.match(readFunction(source, 'renderScheduleFilterToolbar'), /clearScheduleFilters\(\)/);
});

test('Field Ops lands on Schedule without an Overview tab', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const html = fs.readFileSync('field-dashboard.html', 'utf8');

  assert.match(source, /activeView:IS_CLIENTS_STANDALONE \? 'directory' : 'schedule'/);
  assert.doesNotMatch(html, /data-view="overview"/);
  assert.doesNotMatch(html, /id="overview-screen"/);
  assert.match(html, /id="schedule-screen" class="screen active"/);
});

test('month schedule includes jobs shown on adjacent-month grid days', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const context = {
    state:{
      scheduleView:'month',
      data:{
        jobs:[
          { id:'july-job', scheduledStart:'2026-07-31T08:00:00' },
          { id:'august-job', scheduledStart:'2026-08-05T08:00:00' },
          { id:'september-job', scheduledStart:'2026-09-01T08:00:00' }
        ]
      }
    },
    getJobPrimaryDate:(job) => new Date(job.scheduledStart),
    toInputDate:(date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
    isDateInScheduleMonth:(dateIso) => dateIso.startsWith('2026-08'),
    isJobPast:() => false,
    getEntitySorter:() => (left, right) => left.id.localeCompare(right.id)
  };
  vm.createContext(context);
  vm.runInContext(readFunction(source, 'getJobsForScheduleDates'), context);

  const jobs = context.getJobsForScheduleDates(['2026-07-31', '2026-08-05', '2026-09-01']);
  assert.deepEqual(Array.from(jobs, (job) => job.id), ['august-job', 'july-job', 'september-job']);
});

function isoDate(value){
  const date = new Date(`${value}T12:00:00`);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function addIsoDays(value, amount){
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return isoDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
}

function startOfSundayWeek(value){
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() - date.getDay());
  return isoDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
}

function startOfMonth(value){
  const date = new Date(`${value}T12:00:00`);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

test('calendar print defaults follow the selected schedule view', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const context = {
    state:{ scheduleView:'week', scheduleAnchorDate:'2026-08-19' },
    getStartOfMonthISO:startOfMonth,
    getStartOfWeekISO:startOfSundayWeek,
    getStartOfWorkWeekISO:(value) => addIsoDays(startOfSundayWeek(value), 1),
    addMonthsISO:(value, amount) => {
      const date = new Date(`${value}T12:00:00`);
      date.setMonth(date.getMonth() + amount);
      return isoDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
    },
    addDaysISO:addIsoDays
  };
  vm.createContext(context);
  vm.runInContext(readFunction(source, 'getScheduleCalendarPrintDefaultRange'), context);

  assert.deepEqual(context.getScheduleCalendarPrintDefaultRange(), { from:'2026-08-16', to:'2026-08-22' });
  context.state.scheduleView = 'work_week';
  assert.deepEqual(context.getScheduleCalendarPrintDefaultRange(), { from:'2026-08-17', to:'2026-08-21' });
  context.state.scheduleView = 'month';
  assert.deepEqual(context.getScheduleCalendarPrintDefaultRange(), { from:'2026-08-01', to:'2026-08-31' });
});

test('calendar print range is inclusive and its grid begins on Sunday', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const context = {
    parseDateOnly:(value) => value ? new Date(`${value}T12:00:00`) : null,
    toInputDate:(value) => value instanceof Date ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}` : String(value || ''),
    addDaysISO:addIsoDays
  };
  vm.createContext(context);
  vm.runInContext([
    readFunction(source, 'getScheduleCalendarPrintDateRange'),
    readFunction(source, 'getSundayWeekStartISO'),
    readFunction(source, 'getScheduleCalendarPrintGridDates')
  ].join('\n'), context);

  const selected = context.getScheduleCalendarPrintDateRange('2026-08-19', '2026-08-25');
  assert.deepEqual(Array.from(selected), ['2026-08-19', '2026-08-20', '2026-08-21', '2026-08-22', '2026-08-23', '2026-08-24', '2026-08-25']);
  assert.deepEqual(Array.from(context.getScheduleCalendarPrintGridDates(selected)), ['2026-08-16', '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21', '2026-08-22', '2026-08-23', '2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27', '2026-08-28', '2026-08-29']);
  assert.deepEqual(Array.from(context.getScheduleCalendarPrintDateRange('2026-08-25', '2026-08-19')), []);
});

test('calendar print selects filtered or all schedule jobs as requested', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const context = {
    getFilteredScheduleJobs:(dates, derived) => [{ id:'filtered', dates, derived }],
    getJobsForScheduleDates:(dates, filter) => [{ id:'all', dates, filter }]
  };
  vm.createContext(context);
  vm.runInContext(readFunction(source, 'getScheduleCalendarPrintJobs'), context);

  assert.equal(context.getScheduleCalendarPrintJobs(['2026-08-19'], 'active', 'derived')[0].id, 'filtered');
  assert.equal(context.getScheduleCalendarPrintJobs(['2026-08-19'], 'all', 'derived')[0].id, 'all');
});

test('calendar print output includes the requested field job details and excludes travel', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const html = fs.readFileSync('field-dashboard.html', 'utf8');
  assert.match(source, /openScheduleCalendarPrintModal\(\)/);
  assert.match(source, /getScheduleCalendarPrintTechnicianLabel/);
  assert.match(source, /getScheduleCalendarPrintTimeLabel/);
  assert.match(source, /getJobTypeDisplayName\(job\.jobType\)/);
  assert.doesNotMatch(readFunction(source, 'getScheduleCalendarPrintJobs'), /technicianTravel/);
  assert.match(html, /id="schedule-calendar-print-modal-overlay"/);
});

test('Salesforce ticket choices default to the job client Account and exclude occupied tickets', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const context = {
    state:{ data:{
      salesforceTicketLinks:[{ jobId:'job-2', ticketId:'ticket-occupied' }],
      salesforceTickets:[
        { id:'ticket-match', ticketNumber:'100', subject:'Meter proving', accountRecordId:'account-1', isActive:true, isLinkable:true, sourceModifiedAt:'2026-08-30' },
        { id:'ticket-other', ticketNumber:'200', subject:'Pickup', accountRecordId:'account-2', isActive:true, isLinkable:true, sourceModifiedAt:'2026-08-31' },
        { id:'ticket-occupied', ticketNumber:'300', subject:'Assigned', accountRecordId:'account-1', isActive:true, isLinkable:true, sourceModifiedAt:'2026-08-29' }
      ]
    } },
    getJob:() => ({ id:'job-1', clientId:'client-1' }),
    getClient:() => ({ id:'client-1', salesforceAccountId:'account-1' })
  };
  vm.createContext(context);
  vm.runInContext([readFunction(source, 'getSalesforceTicketLinkForJob'), readFunction(source, 'getAvailableSalesforceTickets')].join('\n'), context);

  assert.deepEqual(Array.from(context.getAvailableSalesforceTickets('job-1'), (ticket) => ticket.id), ['ticket-match']);
  assert.deepEqual(Array.from(context.getAvailableSalesforceTickets('job-1', { showAll:true }), (ticket) => ticket.id), ['ticket-other', 'ticket-match']);
});

test('Salesforce integration is read-only upstream and the old writer is retired', () => {
  const syncSource = fs.readFileSync('supabase/functions/salesforce-ticket-sync/index.ts', 'utf8');
  const retiredSource = fs.readFileSync('supabase/functions/salesforce-case/index.ts', 'utf8');
  assert.match(syncSource, /function salesforceGet/);
  assert.match(syncSource, /method: "GET"/);
  assert.doesNotMatch(syncSource, /salesforce(?:Request|Get)[\s\S]{0,200}method: "(?:PATCH|DELETE)"/);
  assert.match(retiredSource, /status: 410/);
  assert.doesNotMatch(retiredSource, /fetch\(/);
});

test('Salesforce schema enforces RLS, admin RPCs, and one-to-one links', () => {
  const schema = fs.readFileSync('supabase/schema.sql', 'utf8');
  assert.match(schema, /job_id uuid not null unique references public\.field_jobs/);
  assert.match(schema, /ticket_id uuid not null unique references public\.salesforce_tickets/);
  assert.match(schema, /alter table public\.salesforce_tickets enable row level security/);
  assert.match(schema, /create or replace function public\.link_salesforce_ticket/);
  assert.match(schema, /create or replace function public\.unlink_salesforce_ticket/);
  assert.match(schema, /if not public\.is_app_admin\(\)/);
});

test('Resources includes Salesforce configuration, preview, and synchronization controls', () => {
  const html = fs.readFileSync('field-dashboard.html', 'utf8');
  assert.match(html, /openSalesforceConfigModal\(\)/);
  assert.match(html, /previewSalesforceTickets\(\)/);
  assert.match(html, /syncSalesforceTickets\(\)/);
  assert.match(html, /id="salesforce-ticket-modal-overlay"/);
});
