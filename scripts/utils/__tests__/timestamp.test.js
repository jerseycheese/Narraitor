/**
 * Test to ensure scripts/utils/timestamp.js stays in sync with src/lib/utils/timestamp.ts
 *
 * This test validates that the CLI helper maintains the same timestamp format
 * as the TypeScript implementation.
 */

import { getTimestamp } from '../timestamp.js';

describe('timestamp utility (scripts)', () => {
  test('should generate ISO 8601 timestamp format', () => {
    const timestamp = getTimestamp();

    // Validate ISO 8601 format with milliseconds: YYYY-MM-DDTHH:mm:ss.sssZ
    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
    expect(timestamp).toMatch(iso8601Pattern);
  });

  test('should match TypeScript implementation format', () => {
    // Create a controlled timestamp
    const fixedDate = new Date('2025-01-15T12:00:00.000Z');
    const expectedFormat = fixedDate.toISOString();

    // Mock Date to ensure consistent output
    const realDate = global.Date;
    global.Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          super(fixedDate);
        } else {
          super(...args);
        }
      }
    };

    const timestamp = getTimestamp();

    // Restore Date
    global.Date = realDate;

    expect(timestamp).toBe(expectedFormat);
    expect(timestamp).toBe('2025-01-15T12:00:00.000Z');
  });

  test('should produce valid Date when parsed', () => {
    const timestamp = getTimestamp();
    const parsed = new Date(timestamp);

    expect(parsed).toBeInstanceOf(Date);
    expect(isNaN(parsed.getTime())).toBe(false);
  });

  test('should include milliseconds precision', () => {
    const timestamp = getTimestamp();

    // Extract milliseconds part
    const millisecondsMatch = timestamp.match(/\.(\d{3})Z$/);
    expect(millisecondsMatch).not.toBeNull();
    expect(millisecondsMatch[1]).toHaveLength(3);
  });
});
