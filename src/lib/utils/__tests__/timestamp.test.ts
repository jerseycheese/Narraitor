import { getTimestamp } from '../timestamp';

describe('getTimestamp', () => {
  it('returns a valid ISO 8601 string', () => {
    const timestamp = getTimestamp();

    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(new Date(timestamp).toISOString()).toBe(timestamp);
  });
});
