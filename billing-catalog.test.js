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

test('Test Catalog normalizes the relational Test Type model', () => {
  const source = fs.readFileSync('test-catalog.js', 'utf8');
  const context = { normalizeCode:(value) => String(value || '').trim().toUpperCase(), uid:() => 'fallback' };
  vm.createContext(context);
  vm.runInContext(readFunction(source, 'normalizeTest'), context);
  const result = context.normalizeTest({id:'type-1', test_code:'gc-bfvc6mz', test_name:'BFV C6', matrix_type:'Liquid', method_id:null, is_active:true}, true);
  assert.equal(result.testCode, 'GC-BFVC6MZ');
  assert.equal(result.testName, 'BFV C6');
  assert.equal(result.matrixType, 'Liquid');
  assert.equal(result.methodId, '');
});

test('new client catalog drafts start unselected while retained rows keep rate and notes', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const context = {
    state:{ data:{ priceItems:[{id:'new',isActive:true},{id:'saved',isActive:true}] } },
    BILLING_RATE_EFFECTIVE_YEAR:2026,
    getBillingPricesForProfile:() => [{id:'price-1',priceItemId:'saved',rateAmount:42,isActive:true,effectiveYear:2026,notes:'keep'}],
    getEntitySorter:() => () => 0,
    normalizeNumber:(value) => value === null || value === undefined ? null : Number(value)
  };
  vm.createContext(context);
  vm.runInContext(readFunction(source, 'buildBillingPriceDrafts'), context);
  const rows = context.buildBillingPriceDrafts('profile-1');
  assert.equal(rows.find((row) => row.priceItemId === 'new').isActive, false);
  assert.deepEqual(
    {active:rows.find((row) => row.priceItemId === 'saved').isActive,rate:rows.find((row) => row.priceItemId === 'saved').rateAmount,notes:rows.find((row) => row.priceItemId === 'saved').notes},
    {active:true,rate:42,notes:'keep'}
  );
});

test('client remove and re-add toggles visibility without clearing billing data', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const draft = {priceItemId:'catalog-1',isActive:true,rateAmount:125,notes:'contract rate'};
  const context = {
    modalState:{open:true,entity:'billingRates',formData:{priceDrafts:[draft],methodPickerSelection:['catalog-1'],methodPickerOpen:true}},
    normalizeStringArray:(value) => Array.isArray(value) ? value : [],
    getModalBillingPriceDrafts:() => context.modalState.formData.priceDrafts,
    renderModal:() => {}
  };
  vm.createContext(context);
  vm.runInContext([readFunction(source,'removeBillingMethodFromClient'),readFunction(source,'addSelectedBillingMethods')].join('\n'),context);
  context.removeBillingMethodFromClient('catalog-1');
  assert.deepEqual({active:draft.isActive,rate:draft.rateAmount,notes:draft.notes},{active:false,rate:125,notes:'contract rate'});
  context.addSelectedBillingMethods();
  assert.deepEqual({active:draft.isActive,rate:draft.rateAmount,notes:draft.notes},{active:true,rate:125,notes:'contract rate'});
});

test('schema implements normalized catalog, setup migration, RPC, and scoped access', () => {
  const schema = fs.readFileSync('supabase/schema.sql','utf8');
  assert.match(schema,/create table if not exists public\.lab_methods/);
  assert.match(schema,/create table if not exists public\.lab_test_type_aliases/);
  assert.match(schema,/create table if not exists public\.lab_instruments/);
  assert.match(schema,/create table if not exists public\.lab_test_setups/);
  assert.match(schema,/create table if not exists public\.billing_services/);
  assert.match(schema,/admin_resolve_legacy_billing_item/);
  assert.match(schema,/is_migration_placeholder/);
  assert.match(schema,/lab\.tests\.manage/);
  assert.match(schema,/current_employee_spl_site_id/);
  assert.doesNotMatch(schema,/billing-method-selection-v1-migrated/);
});

test('new import rows carry stable catalog IDs and remain explicitly unassigned', () => {
  const source = fs.readFileSync('import.html','utf8');
  assert.match(source,/testTypeId:getDefinitionByKey\(defs,canonicalType\)\?\.id/);
  assert.match(source,/testSetupId:''/);
  assert.match(source,/instrumentId:''/);
  assert.match(source,/setupAssignmentStatus:'unassigned'/);
});
