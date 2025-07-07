import {
  formatRelativeTime,
  formatDate,
  formatTime,
  formatDateTime,
  truncate,
  capitalize,
  titleCase,
  sentenceCase,
  safeTrim,
  formatNumber,
  formatPercentage,
  formatCompactNumber
} from './formatters';

describe('Date Formatting', () => {
  describe('formatRelativeTime', () => {
    const now = new Date('2024-01-15T10:00:00Z');
    
    beforeEach(() => {
      jest.useFakeTimers();
      jest.setSystemTime(now);
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('formats recent times as relative', () => {
      expect(formatRelativeTime(new Date('2024-01-15T09:59:00Z'))).toBe('1 minute ago');
      expect(formatRelativeTime(new Date('2024-01-15T08:00:00Z'))).toBe('2 hours ago');
      expect(formatRelativeTime(new Date('2024-01-14T10:00:00Z'))).toBe('yesterday');
    });

    it('formats future times', () => {
      expect(formatRelativeTime(new Date('2024-01-15T11:00:00Z'))).toBe('in 1 hour');
      expect(formatRelativeTime(new Date('2024-01-16T10:00:00Z'))).toBe('tomorrow');
    });

    it('handles invalid dates gracefully', () => {
      expect(formatRelativeTime(new Date('invalid'))).toBe('Invalid date');
      expect(formatRelativeTime(null as any)).toBe('Invalid date');
    });
  });

  describe('formatDate', () => {
    it('formats dates in locale-appropriate format', () => {
      const date = new Date('2024-01-15T10:00:00Z');
      const result = formatDate(date);
      // Should return a readable date format (exact format may vary by locale)
      expect(result).toMatch(/\d/); // Contains numbers
      expect(result.length).toBeGreaterThan(0);
    });

    it('supports custom format options', () => {
      const date = new Date('2024-01-15T10:00:00Z');
      const result = formatDate(date, { month: 'long', day: 'numeric' });
      expect(result).toContain('January');
      expect(result).toContain('15');
    });
  });

  describe('formatTime', () => {
    it('formats time in locale-appropriate format', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const result = formatTime(date);
      expect(result).toMatch(/\d{1,2}:\d{2}/); // Contains time pattern
    });
  });

  describe('formatDateTime', () => {
    it('formats both date and time together', () => {
      const date = new Date('2024-01-15T14:30:00Z');
      const result = formatDateTime(date);
      expect(result).toMatch(/\d/); // Contains numbers
      expect(result).toContain(':'); // Contains time separator
    });
  });
});

describe('String Formatting', () => {
  describe('truncate', () => {
    it('leaves short strings unchanged', () => {
      expect(truncate('Hello', 10)).toBe('Hello');
    });

    it('truncates long strings with ellipsis', () => {
      expect(truncate('Hello World from TypeScript', 11)).toBe('Hello World...');
    });

    it('respects custom ellipsis', () => {
      expect(truncate('Hello World', 5, '…')).toBe('Hello…');
    });

    it('handles edge cases', () => {
      expect(truncate('', 10)).toBe('');
      expect(truncate('Hello', 0)).toBe('...');
    });
  });

  describe('capitalize', () => {
    it('capitalizes first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('HELLO')).toBe('Hello');
    });

    it('handles empty strings', () => {
      expect(capitalize('')).toBe('');
    });

    it('preserves single characters', () => {
      expect(capitalize('a')).toBe('A');
    });
  });

  describe('titleCase', () => {
    it('converts to title case', () => {
      expect(titleCase('hello world')).toBe('Hello World');
      expect(titleCase('the quick brown fox')).toBe('The Quick Brown Fox');
    });

    it('handles mixed case input', () => {
      expect(titleCase('hELLo WoRLD')).toBe('Hello World');
    });
  });

  describe('sentenceCase', () => {
    it('converts to sentence case', () => {
      expect(sentenceCase('hello world. this is great.')).toBe('Hello world. This is great.');
      expect(sentenceCase('HELLO WORLD')).toBe('Hello world');
    });

    it('preserves punctuation', () => {
      expect(sentenceCase('hello! how are you?')).toBe('Hello! How are you?');
    });
  });

  describe('safeTrim', () => {
    it('removes whitespace safely', () => {
      expect(safeTrim('  hello  ')).toBe('hello');
      expect(safeTrim('\n\thello\r\n')).toBe('hello');
    });

    it('handles null and undefined', () => {
      expect(safeTrim(null as any)).toBe('');
      expect(safeTrim(undefined as any)).toBe('');
    });

    it('preserves empty strings', () => {
      expect(safeTrim('')).toBe('');
    });
  });
});

describe('Number Formatting', () => {
  describe('formatNumber', () => {
    it('formats numbers with locale separators', () => {
      expect(formatNumber(1234567.89)).toMatch(/1.234.567|1,234,567/); // Handles different locales
    });

    it('respects decimal places', () => {
      expect(formatNumber(123.456, 2)).toMatch(/123\.46|123,46/);
    });

    it('handles edge cases', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(-1234)).toMatch(/-1.234|-1,234/);
    });
  });

  describe('formatPercentage', () => {
    it('formats as percentage', () => {
      expect(formatPercentage(0.75)).toBe('75%');
      expect(formatPercentage(0.1234)).toBe('12.34%');
    });

    it('respects decimal places', () => {
      expect(formatPercentage(0.1234, 1)).toBe('12.3%');
      expect(formatPercentage(0.1234, 0)).toBe('12%');
    });

    it('handles edge values', () => {
      expect(formatPercentage(0)).toBe('0%');
      expect(formatPercentage(1)).toBe('100%');
      expect(formatPercentage(1.5)).toBe('150%');
    });
  });

  describe('formatCompactNumber', () => {
    it('formats large numbers compactly', () => {
      expect(formatCompactNumber(1234)).toMatch(/1\.2K|1,2K/);
      expect(formatCompactNumber(1234567)).toMatch(/1\.2M|1,2M/);
      expect(formatCompactNumber(1234567890)).toMatch(/1\.2B|1,2B/);
    });

    it('preserves small numbers', () => {
      expect(formatCompactNumber(999)).toBe('999');
      expect(formatCompactNumber(0)).toBe('0');
    });

    it('handles negative numbers', () => {
      expect(formatCompactNumber(-1234)).toMatch(/-1\.2K|-1,2K/);
    });
  });
});