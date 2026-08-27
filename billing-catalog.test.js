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

test('remote test types normalize into the shared browser model', () => {
  const source = fs.readFileSync('master-methods.js', 'utf8');
  const context = { normalizeKey:(value) => String(value || '').trim().toUpperCase(), uid:() => 'fallback' };
  vm.createContext(context);
  vm.runInContext(readFunction(source, 'normalizeTestType'), context);
  const result = context.normalizeTestType({
    id:'type-1', test_code:'GC-BFVC6MZ', display_label:'BFV C6', short_label:'BFVC6',
    count_mode:'perSample', matrix_type:'Liquid', lab_wip_enabled:false, is_active:true
  }, 0, true);
  assert.equal(result.testCode, 'GC-BFVC6MZ');
  assert.equal(result.displayLabel, 'BFV C6');
  assert.equal(result.labWipEnabled, false);
});

test('new client drafts start unselected while retained rows preserve selection', () => {
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
  assert.equal(rows.find((row) => row.priceItemId === 'saved').isActive, true);
  assert.equal(rows.find((row) => row.priceItemId === 'saved').rateAmount, 42);
});

test('client remove and add toggles visibility without clearing rate data', () => {
  const source = fs.readFileSync('field-dashboard.js', 'utf8');
  const draft = {priceItemId:'method-1',isActive:true,rateAmount:125,notes:'contract rate'};
  const context = {
    modalState:{open:true,entity:'billingRates',formData:{priceDrafts:[draft],methodPickerSelection:['method-1'],methodPickerOpen:true}},
    normalizeStringArray:(value) => Array.isArray(value) ? value : [],
    getModalBillingPriceDrafts:() => context.modalState.formData.priceDrafts,
    renderModal:() => {}
  };
  vm.createContext(context);
  vm.runInContext([readFunction(source,'removeBillingMethodFromClient'),readFunction(source,'addSelectedBillingMethods')].join('\n'),context);
  context.removeBillingMethodFromClient('method-1');
  assert.equal(draft.isActive,false);
  assert.equal(draft.rateAmount,125);
  assert.equal(draft.notes,'contract rate');
  context.addSelectedBillingMethods();
  assert.equal(draft.isActive,true);
  assert.equal(draft.rateAmount,125);
});

test('schema provides relational linkage, migration marker, and Lab read policy', () => {
  const schema = fs.readFileSync('supabase/schema.sql','utf8');
  assert.match(schema,/create table if not exists public\.lab_test_types/);
  assert.match(schema,/test_type_id uuid references public\.lab_test_types/);
  assert.match(schema,/billing-method-selection-v1-migrated/);
  assert.match(schema,/has_employee_feature\('lab\.tests\.view'\)/);
  assert.match(schema,/admin_create_billing_method_with_test_type/);
  assert.match(schema,/old\.test_code/);
});
