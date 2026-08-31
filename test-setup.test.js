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

test('calculated setups always normalize to no instrument required', () => {
  const source = fs.readFileSync('test-setup.js', 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFunction(source, 'normalizeCalculatedSetup'), context);

  const setup = context.normalizeCalculatedSetup(
    {testTypeId:'calculated',setupKind:'instrument',instrumentId:'gc-1',isMigrationPlaceholder:true,estimatedMinutes:10},
    [{id:'calculated',matrixType:'Calculated'}]
  );
  assert.deepEqual(
    {setupKind:setup.setupKind,instrumentId:setup.instrumentId,isMigrationPlaceholder:setup.isMigrationPlaceholder,estimatedMinutes:setup.estimatedMinutes},
    {setupKind:'no_instrument',instrumentId:'',isMigrationPlaceholder:false,estimatedMinutes:10}
  );
});

test('non-calculated setups retain their instrument assignment', () => {
  const source = fs.readFileSync('test-setup.js', 'utf8');
  const context = {};
  vm.createContext(context);
  vm.runInContext(readFunction(source, 'normalizeCalculatedSetup'), context);

  const sourceSetup = {testTypeId:'gas',setupKind:'instrument',instrumentId:'gc-1',isMigrationPlaceholder:false};
  const setup = context.normalizeCalculatedSetup(sourceSetup, [{id:'gas',matrixType:'Gas'}]);
  assert.deepEqual(setup, sourceSetup);
});

test('Test Setup UI and schema enforce the calculated no-instrument rule', () => {
  const source = fs.readFileSync('test-setup.js', 'utf8');
  const schema = fs.readFileSync('supabase/schema.sql', 'utf8');
  assert.match(source, /function isCalculatedTest\(testId\)/);
  assert.match(source, /const setupKind=calculated\?'no_instrument':document\.getElementById\('set-kind'\)\.value/);
  assert.match(source, /kindGroup\.style\.display=calculated\?'none':''/);
  assert.match(schema, /create or replace function public\.normalize_calculated_test_setups\(\)/);
  assert.match(schema, /if test_matrix_type = 'Calculated' then/);
  assert.match(schema, /create trigger lab_test_types_normalize_calculated_setups after insert or update of matrix_type/);
});
