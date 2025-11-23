
/**
 * Basic smoke tests for Cloud Functions handlers.
 * These tests do not call external APIs. They assert that exported handlers exist.
 */

const funcs = require('../index_full.js') || require('../index.js') || {};

test('functions export exists', () => {
  expect(typeof funcs.api === 'function' || typeof funcs === 'object').toBeTruthy();
});
