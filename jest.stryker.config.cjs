// Jest config used only by Stryker mutation runs.
// Narrows the test set to the module(s) under mutation so the dry run does not
// execute the whole suite (which pulls in user-event component tests that crash
// on teardown under Stryker). Override testMatch per wave as scope expands.
const base = require('./jest.config.cjs');

module.exports = {
  ...base,
  testMatch: [
    // Wave 2a: state stores + storage + narrative
    '<rootDir>/src/state/**/*.test.{ts,tsx}',
    '<rootDir>/src/lib/storage/**/*.test.{ts,tsx}',
    '<rootDir>/src/lib/narrative/**/*.test.{ts,tsx}',
  ],
};
