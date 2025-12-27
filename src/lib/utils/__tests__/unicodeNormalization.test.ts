/**
 * Tests for Unicode normalization utilities
 * Focus: Acceptance criteria and edge cases, NOT implementation details
 */

import { removeAccents, hasNonLatinCharacters, generateSafeKey } from '../unicodeNormalization';

describe('Unicode Normalization', () => {
  describe('removeAccents', () => {
    it('handles Western European accents', () => {
      expect(removeAccents('François')).toBe('Francois');
      expect(removeAccents('Zürich')).toBe('Zurich');
      expect(removeAccents('naïve')).toBe('naive');
      expect(removeAccents('Café')).toBe('Cafe');
      expect(removeAccents('Øresund')).toBe('Øresund'); // Ø is not decomposable
    });

    it('handles multiple accents in single word', () => {
      expect(removeAccents('Größe')).toBe('Große'); // ö decomposes, ß doesn't
      expect(removeAccents('Naïveté')).toBe('Naivete');
    });

    it('handles empty and whitespace', () => {
      expect(removeAccents('')).toBe('');
      expect(removeAccents('   ')).toBe('   ');
    });

    it('preserves non-accented text', () => {
      expect(removeAccents('Hello World')).toBe('Hello World');
      expect(removeAccents('123abc')).toBe('123abc');
    });
  });

  describe('hasNonLatinCharacters', () => {
    it('detects non-Latin scripts', () => {
      // CJK (Chinese, Japanese, Korean)
      expect(hasNonLatinCharacters('村田さん')).toBe(true);
      expect(hasNonLatinCharacters('李明')).toBe(true);
      expect(hasNonLatinCharacters('김철수')).toBe(true);

      // Cyrillic
      expect(hasNonLatinCharacters('Владимир')).toBe(true);
      expect(hasNonLatinCharacters('Москва')).toBe(true);

      // Arabic
      expect(hasNonLatinCharacters('محمد')).toBe(true);

      // Mixed scripts
      expect(hasNonLatinCharacters('Jean-李')).toBe(true);
      expect(hasNonLatinCharacters('Café 村田')).toBe(true);

      // Emoji
      expect(hasNonLatinCharacters('Player💀')).toBe(true);
      expect(hasNonLatinCharacters('🎮Game')).toBe(true);
    });

    it('accepts Latin scripts with accents', () => {
      expect(hasNonLatinCharacters('François')).toBe(false);
      expect(hasNonLatinCharacters('Zürich')).toBe(false);
      expect(hasNonLatinCharacters('naïve')).toBe(false);
      expect(hasNonLatinCharacters('Größe')).toBe(false);
    });

    it('accepts basic ASCII', () => {
      expect(hasNonLatinCharacters('John Smith')).toBe(false);
      expect(hasNonLatinCharacters('Hello-World')).toBe(false);
      expect(hasNonLatinCharacters("O'Brien")).toBe(false);
      expect(hasNonLatinCharacters('Dr. Watson')).toBe(false);
    });

    it('accepts Latin Extended characters', () => {
      expect(hasNonLatinCharacters('Ĉapelo')).toBe(false); // Esperanto
      expect(hasNonLatinCharacters('Đorđe')).toBe(false); // Serbian Latin
    });

    it('handles empty and whitespace', () => {
      expect(hasNonLatinCharacters('')).toBe(false); // Empty matches Latin range
      expect(hasNonLatinCharacters('   ')).toBe(false);
    });
  });

  describe('generateSafeKey', () => {
    describe('Western European normalization', () => {
      it('normalizes accented characters to lowercase ASCII', () => {
        expect(generateSafeKey('François')).toBe('francois');
        expect(generateSafeKey('Zürich')).toBe('zurich');
        expect(generateSafeKey('Café')).toBe('cafe');
        expect(generateSafeKey('naïve')).toBe('naive');
      });

      it('replaces special characters with underscores', () => {
        expect(generateSafeKey('Jean-Pierre')).toBe('jean_pierre');
        expect(generateSafeKey("O'Brien")).toBe('o_brien');
        expect(generateSafeKey('Dr. Watson')).toBe('dr_watson');
      });

      it('collapses multiple underscores', () => {
        expect(generateSafeKey('Name   With    Spaces')).toBe('name_with_spaces');
        expect(generateSafeKey('Multiple---Dashes')).toBe('multiple_dashes');
      });

      it('trims leading and trailing underscores', () => {
        expect(generateSafeKey('  Leading')).toBe('leading');
        expect(generateSafeKey('Trailing  ')).toBe('trailing');
        expect(generateSafeKey('  Both  ')).toBe('both');
      });

      it('handles mixed case input', () => {
        expect(generateSafeKey('UPPERCASE')).toBe('uppercase');
        expect(generateSafeKey('MixedCase')).toBe('mixedcase');
        expect(generateSafeKey('camelCase')).toBe('camelcase');
      });
    });

    describe('Non-Latin UUID fallback', () => {
      it('generates UUID for CJK characters', () => {
        const key1 = generateSafeKey('村田さん');
        const key2 = generateSafeKey('李明');
        const key3 = generateSafeKey('김철수');

        // UUID format: 8-4-4-4-12 hex digits
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
        expect(key1).toMatch(uuidPattern);
        expect(key2).toMatch(uuidPattern);
        expect(key3).toMatch(uuidPattern);
      });

      it('generates UUID for Cyrillic characters', () => {
        const key = generateSafeKey('Владимир');
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
        expect(key).toMatch(uuidPattern);
      });

      it('generates UUID for Arabic characters', () => {
        const key = generateSafeKey('محمد');
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
        expect(key).toMatch(uuidPattern);
      });

      it('generates UUID for emoji', () => {
        const key = generateSafeKey('Player💀');
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
        expect(key).toMatch(uuidPattern);
      });

      it('generates UUID for mixed scripts', () => {
        const key = generateSafeKey('Jean-李');
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
        expect(key).toMatch(uuidPattern);
      });

      it('generates random UUIDs for same input', () => {
        const key1 = generateSafeKey('村田さん');
        const key2 = generateSafeKey('村田さん');

        // UUIDs should be different (random, not deterministic)
        expect(key1).not.toBe(key2);
      });

      it('uses prefix for UUID fallback when provided', () => {
        const key = generateSafeKey('村田さん', 'character');
        expect(key).toMatch(/^character_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      });
    });

    describe('Edge cases with UUID fallback', () => {
      it('handles empty string', () => {
        const key = generateSafeKey('');
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
        expect(key).toMatch(uuidPattern);
      });

      it('handles whitespace-only string', () => {
        const key = generateSafeKey('   ');
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
        expect(key).toMatch(uuidPattern);
      });

      it('handles symbols-only string', () => {
        const key = generateSafeKey('!!!');
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
        expect(key).toMatch(uuidPattern);
      });

      it('handles single character (below minimum)', () => {
        const key = generateSafeKey('a');
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
        expect(key).toMatch(uuidPattern);
      });

      it('handles single character with prefix', () => {
        const key = generateSafeKey('a', 'character');
        expect(key).toMatch(/^character_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
      });
    });

    describe('Consistency and determinism', () => {
      it('generates consistent keys for same Latin input', () => {
        const key1 = generateSafeKey('François');
        const key2 = generateSafeKey('François');
        const key3 = generateSafeKey('François');

        expect(key1).toBe('francois');
        expect(key2).toBe('francois');
        expect(key3).toBe('francois');
      });

      it('generates consistent keys for same ASCII input', () => {
        const key1 = generateSafeKey('John Smith');
        const key2 = generateSafeKey('John Smith');

        expect(key1).toBe('john_smith');
        expect(key2).toBe('john_smith');
      });
    });

    describe('Length limits', () => {
      it('truncates very long names to 100 characters', () => {
        const longName = 'A'.repeat(150);
        const key = generateSafeKey(longName);

        expect(key).toBe('a'.repeat(100));
        expect(key.length).toBe(100);
      });

      it('handles exactly 100 character input', () => {
        const name = 'A'.repeat(100);
        const key = generateSafeKey(name);

        expect(key).toBe('a'.repeat(100));
        expect(key.length).toBe(100);
      });

      it('does not truncate short names', () => {
        const key = generateSafeKey('François');
        expect(key).toBe('francois');
        expect(key.length).toBeLessThan(100);
      });
    });
  });
});
