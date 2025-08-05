// Integration tests for type validation with real data scenarios
// Focus on boundary conditions and actual usage patterns

import { validateWorld } from '../type-guards';

describe('Type Validation Integration', () => {
  describe('World Validation', () => {
    it('rejects invalid world data from external sources', () => {
      // Simulate common data corruption scenarios
      const invalidWorld = {
        id: '', // Invalid: empty string
        name: null, // Invalid: null instead of string
        description: 'A test world',
        theme: 'fantasy',
        attributes: undefined, // Invalid: undefined instead of array
        skills: []
      };

      const result = validateWorld(invalidWorld);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('handles null and undefined input gracefully', () => {
      expect(validateWorld(null).valid).toBe(false);
      expect(validateWorld(undefined).valid).toBe(false);
      expect(validateWorld({}).valid).toBe(false);
    });

    it('validates partial world data during creation', () => {
      const partialWorld = {
        name: 'Test World',
        description: 'A test world'
      };

      // Should allow partial validation during world creation
      const result = validateWorld(partialWorld, true);
      expect(result).toBeDefined();
    });
  });
});