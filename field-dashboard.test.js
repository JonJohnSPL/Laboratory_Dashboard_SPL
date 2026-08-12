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
  assert.deepEqual(calls.filter((call) => call.type === 'sync'), [
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
