const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

function readFunction(source, name){
  const functionStart = source.indexOf(`function ${name}(`);
  assert.notEqual(functionStart, -1, `Could not find ${name}`);
  const start = source.slice(functionStart - 6, functionStart) === 'async ' ? functionStart - 6 : functionStart;
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for(let index = bodyStart; index < source.length; index += 1){
    if(source[index] === '{') depth += 1;
    if(source[index] === '}') depth -= 1;
    if(depth === 0) return source.slice(start, index + 1);
  }
  throw new Error(`Could not parse ${name}`);
}

function createContext(assignments){
  const source = fs.readFileSync('SureMap/suremap.js', 'utf8');
  const raw = { jobAssignments:assignments.map((assignment) => ({ ...assignment })) };
  const context = {
    state:{ indexes:{ trucksById:new Map() } },
    STORAGE_KEY:'suremap-test',
    readLocalRaw:() => raw,
    normalizeJobAssignment:(assignment) => ({ ...assignment }),
    getAssignmentsForJob:(jobId) => assignments.filter((assignment) => assignment.jobId === jobId),
    getProverAssetIdsToPreserve:() => [],
    getJobById:(jobId) => ({ id:jobId }),
    jobRequiresAssignmentType:() => true,
    getTrailersLinkedToTruck:() => [],
    uid:() => 'new-assignment',
    localStorage:{ setItem:(_key, value) => { context.saved = JSON.parse(value); } }
  };
  vm.createContext(context);
  vm.runInContext([
    readFunction(source, 'getRouteTruckIdForJob'),
    readFunction(source, 'assignLocalRouteJobs')
  ].join('\n'), context);
  return context;
}

test('route assignment preserves a job truck that differs from the technician default', () => {
  const context = createContext([
    { id:'truck-assignment', jobId:'job-1', assignmentType:'Truck', resourceId:'alternate-truck' }
  ]);

  context.assignLocalRouteJobs(['job-1'], 'technician-1', 'default-truck');

  const truckIds = context.saved.jobAssignments
    .filter((assignment) => assignment.assignmentType === 'Truck')
    .map((assignment) => assignment.resourceId);
  assert.deepEqual(truckIds, ['alternate-truck']);
});

test('route assignment uses the technician default when the job has no truck', () => {
  const context = createContext([]);

  context.assignLocalRouteJobs(['job-1'], 'technician-1', 'default-truck');

  const truckIds = context.saved.jobAssignments
    .filter((assignment) => assignment.assignmentType === 'Truck')
    .map((assignment) => assignment.resourceId);
  assert.deepEqual(truckIds, ['default-truck']);
});

test('cloud route assignment does not delete or replace an explicitly assigned truck', async () => {
  const assignments = [
    { id:'truck-assignment', jobId:'job-1', assignmentType:'Truck', resourceId:'alternate-truck' }
  ];
  const requests = [];
  const source = fs.readFileSync('SureMap/suremap.js', 'utf8');
  const context = {
    state:{ indexes:{ trucksById:new Map() } },
    window:{ appAuth:{ requestJson:async (url, options = {}) => { requests.push({ url, options }); } } },
    getAssignmentsForJob:(jobId) => assignments.filter((assignment) => assignment.jobId === jobId),
    getProverAssetIdsToPreserve:() => [],
    getJobById:(jobId) => ({ id:jobId }),
    jobRequiresAssignmentType:() => true,
    getTrailersLinkedToTruck:() => []
  };
  vm.createContext(context);
  vm.runInContext([
    readFunction(source, 'getRouteTruckIdForJob'),
    readFunction(source, 'assignRemoteRouteJobs')
  ].join('\n'), context);

  await context.assignRemoteRouteJobs(['job-1'], 'technician-1', 'default-truck');

  assert.equal(requests.some(({ url, options }) => options.method === 'DELETE' && url.includes('assignment_type=eq.Truck')), false);
  const postedRows = requests.flatMap(({ options }) => options.body ? JSON.parse(options.body) : []);
  assert.equal(postedRows.some((row) => row.assignment_type === 'Truck'), false);
});
