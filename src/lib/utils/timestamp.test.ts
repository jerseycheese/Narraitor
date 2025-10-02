import { getTimestamp } from './timestamp';

describe('getTimestamp', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe('format validation', () => {
    test('returns valid ISO 8601 format', () => {
      const timestamp = getTimestamp();

      // ISO 8601 format: YYYY-MM-DDTHH:mm:ss.sssZ
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    test('returns string type', () => {
      const timestamp = getTimestamp();
      expect(typeof timestamp).toBe('string');
    });

    test('ends with Z indicating UTC timezone', () => {
      const timestamp = getTimestamp();
      expect(timestamp).toMatch(/Z$/);
    });
  });

  describe('mockability', () => {
    test('is mockable with jest.useFakeTimers', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2025-01-15T10:30:00.000Z'));

      const timestamp = getTimestamp();
      expect(timestamp).toBe('2025-01-15T10:30:00.000Z');
    });

    test('can simulate different timestamps in sequence', () => {
      jest.useFakeTimers();

      jest.setSystemTime(new Date('2025-01-15T10:00:00.000Z'));
      const t1 = getTimestamp();

      jest.setSystemTime(new Date('2025-01-15T11:00:00.000Z'));
      const t2 = getTimestamp();

      expect(t1).toBe('2025-01-15T10:00:00.000Z');
      expect(t2).toBe('2025-01-15T11:00:00.000Z');
      expect(t1).not.toBe(t2);
    });

    test('controlled timestamps are useful for testing entity creation', () => {
      jest.useFakeTimers();
      const fixedTime = new Date('2025-01-15T12:00:00.000Z');
      jest.setSystemTime(fixedTime);

      const entity = {
        id: 'test-123',
        createdAt: getTimestamp(),
        updatedAt: getTimestamp()
      };

      expect(entity.createdAt).toBe('2025-01-15T12:00:00.000Z');
      expect(entity.updatedAt).toBe('2025-01-15T12:00:00.000Z');
    });
  });

  describe('consistency', () => {
    test('produces consistent format across multiple calls', () => {
      const timestamps = Array.from({ length: 10 }, () => getTimestamp());

      timestamps.forEach(ts => {
        expect(ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    test('timestamps are chronologically ordered when called sequentially', () => {
      const t1 = getTimestamp();
      const t2 = getTimestamp();

      // t2 should be >= t1 (allowing for same millisecond)
      expect(new Date(t2).getTime()).toBeGreaterThanOrEqual(new Date(t1).getTime());
    });
  });

  describe('real-world usage patterns', () => {
    test('can be used for entity timestamps', () => {
      const entity = {
        id: 'test-id',
        name: 'Test Entity',
        createdAt: getTimestamp(),
        updatedAt: getTimestamp()
      };

      expect(entity.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(entity.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    test('timestamps can be parsed back to Date objects', () => {
      const timestamp = getTimestamp();
      const date = new Date(timestamp);

      expect(date).toBeInstanceOf(Date);
      expect(date.toISOString()).toBe(timestamp);
    });
  });
});
