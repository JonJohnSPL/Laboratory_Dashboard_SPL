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

test('import setup matching accepts only valid setups at the selected site', () => {
  const source = fs.readFileSync('import.html', 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFunction(source, 'getAssignableImportSetups'), context);

  const instruments = [
    {id:'gc-active',splSiteId:'pit',isActive:true},
    {id:'gc-archived',splSiteId:'pit',isActive:false},
    {id:'gc-other',splSiteId:'other',isActive:true}
  ];
  const setups = [
    {id:'valid',testTypeId:'c6gas',splSiteId:'pit',setupKind:'instrument',instrumentId:'gc-active',isActive:true,isMigrationPlaceholder:false},
    {id:'no-instrument',testTypeId:'c6gas',splSiteId:'pit',setupKind:'no_instrument',instrumentId:'',isActive:true,isMigrationPlaceholder:false},
    {id:'placeholder',testTypeId:'c6gas',splSiteId:'pit',setupKind:'migration_pending',instrumentId:'',isActive:true,isMigrationPlaceholder:true},
    {id:'archived-setup',testTypeId:'c6gas',splSiteId:'pit',setupKind:'instrument',instrumentId:'gc-active',isActive:false,isMigrationPlaceholder:false},
    {id:'archived-instrument',testTypeId:'c6gas',splSiteId:'pit',setupKind:'instrument',instrumentId:'gc-archived',isActive:true,isMigrationPlaceholder:false},
    {id:'wrong-site-instrument',testTypeId:'c6gas',splSiteId:'pit',setupKind:'instrument',instrumentId:'gc-other',isActive:true,isMigrationPlaceholder:false},
    {id:'other-site',testTypeId:'c6gas',splSiteId:'other',setupKind:'instrument',instrumentId:'gc-other',isActive:true,isMigrationPlaceholder:false}
  ];

  assert.deepEqual(
    Array.from(context.getAssignableImportSetups('c6gas', 'pit', setups, instruments), (row) => row.id),
    ['valid', 'no-instrument']
  );
});

test('import site uses employee Home SPL Site and falls back to Pittsburgh', () => {
  const source = fs.readFileSync('import.html', 'utf8');
  const sites = [
    {id:'pit',siteCode:'PITTSBURGH',isActive:true},
    {id:'hou',siteCode:'HOUSTON',isActive:true}
  ];
  const context = {window:{appAuth:{getProfile:() => ({employee:{homeSplSiteId:'hou'}})}}};
  vm.createContext(context);
  vm.runInContext(readFunction(source, 'resolveImportSite'), context);
  assert.equal(context.resolveImportSite(sites).id, 'hou');
  context.window.appAuth.getProfile = () => ({employee:{homeSplSiteId:''}});
  assert.equal(context.resolveImportSite(sites).id, 'pit');
});

test('dashboard repair assigns 130 existing C6GAS rows when one setup is valid', () => {
  const source = fs.readFileSync('lab-dashboard.js', 'utf8');
  const setup = {id:'setup-c6gas',instrumentId:'gc-1'};
  const workOrders = Array.from({length:6}, (_, workOrderIndex) => ({
    id:`wo-${workOrderIndex}`,
    location:'Pittsburgh',
    testRows:Array.from({length:workOrderIndex < 4 ? 22 : 21}, (_, rowIndex) => ({
      id:`row-${workOrderIndex}-${rowIndex}`,
      type:'C6GAS',
      testTypeId:'type-c6gas',
      testSetupId:'',
      instrumentId:'',
      setupAssignmentStatus:'unassigned'
    }))
  }));
  const definition = {id:'type-c6gas',key:'C6GAS'};
  const context = {
    WOs:workOrders,
    resolveWorkOrderSiteId:() => 'pit',
    getTestDefinitionById:(id) => id === definition.id ? definition : null,
    getTestDefinitionByKey:() => definition,
    normalizeTestCode:() => 'C6GAS',
    getAssignableSetupsForTest:() => [setup]
  };
  vm.createContext(context);
  vm.runInContext(readFunction(source, 'reconcileUnassignedTestSetups'), context);
  assert.equal(context.reconcileUnassignedTestSetups(), 130);
  const rows = workOrders.flatMap((workOrder) => workOrder.testRows);
  assert.equal(rows.filter((row) => row.testSetupId === setup.id && row.setupAssignmentStatus === 'assigned').length, 130);
});

test('dashboard repair leaves ambiguous rows unassigned and preserves assigned rows', () => {
  const source = fs.readFileSync('lab-dashboard.js', 'utf8');
  const rows = [
    {id:'unassigned',type:'C6GAS',testTypeId:'type-c6gas',testSetupId:'',instrumentId:'',setupAssignmentStatus:'unassigned'},
    {id:'assigned',type:'C6GAS',testTypeId:'type-c6gas',testSetupId:'existing',instrumentId:'gc-old',setupAssignmentStatus:'assigned'}
  ];
  const definition = {id:'type-c6gas',key:'C6GAS'};
  const context = {
    WOs:[{location:'Pittsburgh',testRows:rows}],
    resolveWorkOrderSiteId:() => 'pit',
    getTestDefinitionById:() => definition,
    getTestDefinitionByKey:() => definition,
    normalizeTestCode:() => 'C6GAS',
    getAssignableSetupsForTest:() => [{id:'one'},{id:'two'}]
  };
  vm.createContext(context);
  vm.runInContext(readFunction(source, 'reconcileUnassignedTestSetups'), context);
  assert.equal(context.reconcileUnassignedTestSetups(), 0);
  assert.equal(rows[0].testSetupId, '');
  assert.deepEqual({setup:rows[1].testSetupId,instrument:rows[1].instrumentId},{setup:'existing',instrument:'gc-old'});
});

test('bulk assignment updates only selected compatible rows in the open work order', () => {
  const source = fs.readFileSync('lab-dashboard.js', 'utf8');
  const rows = [
    {id:'row-1',testTypeId:'type-c6gas',testSetupId:'',instrumentId:'',setupAssignmentStatus:'unassigned'},
    {id:'row-2',testTypeId:'type-c6gas',testSetupId:'',instrumentId:'',setupAssignmentStatus:'unassigned'},
    {id:'row-3',testTypeId:'type-c6gas',testSetupId:'',instrumentId:'',setupAssignmentStatus:'unassigned'}
  ];
  const definition = {id:'type-c6gas',key:'C6GAS'};
  const setup = {id:'setup-2',testTypeId:'type-c6gas',instrumentId:'gc-2'};
  const context = {
    editId:'wo-1',
    WOs:[{id:'wo-1',testRows:rows}],
    document:{
      getElementById:(id) => ({value:id === 'bulk-test-type' ? 'type-c6gas' : 'setup-2'}),
      querySelectorAll:() => [{value:'row-1'},{value:'row-2'}]
    },
    getTestSetupById:() => setup,
    getBulkAssignmentSiteId:() => 'pit',
    isSetupAssignable:() => true,
    getTestDefinitionById:() => definition,
    getTestDefinitionByKey:() => definition,
    getCanonicalTestTypeForRow:() => 'C6GAS',
    getDraftRowsFromWO:() => [],
    closeTestSelectorModal:() => {},
    render:() => {},
    renderSchedule:() => {},
    scheduleSave:() => {},
    alert:() => { throw new Error('Unexpected alert'); },
    modalDraftTestRows:[]
  };
  vm.createContext(context);
  vm.runInContext(readFunction(source, 'saveBulkSetupAssignments'), context);
  context.saveBulkSetupAssignments();
  assert.equal(rows[0].testSetupId, 'setup-2');
  assert.equal(rows[1].testSetupId, 'setup-2');
  assert.equal(rows[2].testSetupId, '');
});

test('bulk assignment UI exposes Test Code filtering and Select All', () => {
  const html = fs.readFileSync('lab-dashboard.html', 'utf8');
  assert.match(html,/id="bulk-test-type"/);
  assert.match(html,/setAllBulkAssignmentRows\(true\)/);
  assert.match(html,/id="bulk-assignment-tbody"/);
  assert.match(html,/saveBulkSetupAssignments\(\)/);
  assert.doesNotMatch(html,/id="test-edit-overlay"/);
});
