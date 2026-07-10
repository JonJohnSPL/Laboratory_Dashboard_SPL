const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');
const vm = require('node:vm');

test('example app config defines browser settings', () => {
  const source = fs.readFileSync('app-config.example.js', 'utf8');
  const context = { window: {} };
  vm.runInNewContext(source, context);

  assert.ok(context.window.APP_CONFIG);
  assert.match(context.window.APP_CONFIG.supabaseUrl, /^https:\/\/.+\.supabase\.co$/);
  assert.match(context.window.APP_CONFIG.authEmailSuffix, /^@.+\..+$/);
  assert.ok(context.window.APP_CONFIG.authTitle.length > 0);
});
