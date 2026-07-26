// __mocks__/@vercel/analytics.js
// Real package is ESM-only (dist/index.mjs), which ts-jest's CJS transform
// can't parse. Manual mock keeps trackFunnelStep's transitive import
// test-safe, same pattern as __mocks__/@google/genai.js.

module.exports = {
  track: jest.fn(),
};
