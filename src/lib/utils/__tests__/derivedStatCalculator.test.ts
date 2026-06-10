/**
 * Tests for Derived Stat Calculator
 *
 * Following TDD approach - tests verify behavior, not implementation
 */

import {
  calculateDerivedStat,
  calculateAllDerivedStats,
  validateFormula,
} from '../derivedStatCalculator';
import { DerivedStatFormula } from '@/types/world.types';
import { CharacterAttribute } from '@/state/characterStore.types';

describe('calculateDerivedStat', () => {
  // Helper to create test attributes
  const createAttribute = (
    id: string,
    worldAttributeId: string,
    baseValue: number,
    modifiedValue?: number
  ): CharacterAttribute => ({
    id,
    characterId: 'char-1',
    worldAttributeId,
    name: worldAttributeId,
    baseValue,
    modifiedValue: modifiedValue ?? baseValue,
    category: 'test',
  });

  describe('basic multiplier calculations', () => {
    it('calculates simple multiplier formula (Constitution × 10)', () => {
      const formula: DerivedStatFormula = {
        id: 'vitality-pool',
        name: 'Vitality Pool',
        worldId: 'world-1',
        description: 'Health pool',
        attributeMultipliers: { constitution: 10 },
      };

      const attributes = [createAttribute('attr-1', 'constitution', 15)];

      const result = calculateDerivedStat(formula, attributes);

      expect(result).toBe(150);
    });

    it('uses modifiedValue when available over baseValue', () => {
      const formula: DerivedStatFormula = {
        id: 'vitality-pool',
        name: 'Vitality Pool',
        worldId: 'world-1',
        description: 'Health pool',
        attributeMultipliers: { constitution: 10 },
      };

      // baseValue is 10, but modifiedValue is 15 (e.g., from item bonus)
      const attributes = [createAttribute('attr-1', 'constitution', 10, 15)];

      const result = calculateDerivedStat(formula, attributes);

      expect(result).toBe(150); // Uses modifiedValue (15), not baseValue (10)
    });

    it('calculates fractional multiplier (Dexterity × 0.5)', () => {
      const formula: DerivedStatFormula = {
        id: 'defense-bonus',
        name: 'Defense Bonus',
        worldId: 'world-1',
        description: 'Dexterity bonus to defense',
        attributeMultipliers: { dexterity: 0.5 },
      };

      const attributes = [createAttribute('attr-1', 'dexterity', 16)];

      const result = calculateDerivedStat(formula, attributes);

      expect(result).toBe(8); // 16 × 0.5 = 8
    });

    it('rounds to nearest whole number', () => {
      const formula: DerivedStatFormula = {
        id: 'defense-bonus',
        name: 'Defense Bonus',
        worldId: 'world-1',
        description: 'Dexterity bonus',
        attributeMultipliers: { dexterity: 0.5 },
      };

      const attributes = [createAttribute('attr-1', 'dexterity', 15)];

      const result = calculateDerivedStat(formula, attributes);

      expect(result).toBe(8); // 15 × 0.5 = 7.5, rounded to 8
    });
  });

  describe('base value + multipliers', () => {
    it('calculates base + single multiplier (10 + Dexterity × 0.5)', () => {
      const formula: DerivedStatFormula = {
        id: 'defense-rating',
        name: 'Defense Rating',
        worldId: 'world-1',
        description: 'Base defense + dexterity bonus',
        baseValue: 10,
        attributeMultipliers: { dexterity: 0.5 },
      };

      const attributes = [createAttribute('attr-1', 'dexterity', 16)];

      const result = calculateDerivedStat(formula, attributes);

      expect(result).toBe(18); // 10 + (16 × 0.5) = 10 + 8 = 18
    });

    it('calculates base + multiple multipliers', () => {
      const formula: DerivedStatFormula = {
        id: 'defense-rating',
        name: 'Defense Rating',
        worldId: 'world-1',
        description: 'Defense from dex and con',
        baseValue: 10,
        attributeMultipliers: {
          dexterity: 0.5,
          constitution: 0.3,
        },
      };

      const attributes = [
        createAttribute('attr-1', 'dexterity', 16),
        createAttribute('attr-2', 'constitution', 10),
      ];

      const result = calculateDerivedStat(formula, attributes);

      expect(result).toBe(21); // 10 + (16 × 0.5) + (10 × 0.3) = 10 + 8 + 3 = 21
    });
  });

  describe('min/max clamping', () => {
    it('clamps to minimum value', () => {
      const formula: DerivedStatFormula = {
        id: 'vitality-pool',
        name: 'Vitality Pool',
        worldId: 'world-1',
        description: 'Health pool',
        attributeMultipliers: { constitution: 10 },
        minValue: 50,
      };

      const attributes = [createAttribute('attr-1', 'constitution', 3)];

      const result = calculateDerivedStat(formula, attributes);

      expect(result).toBe(50); // 3 × 10 = 30, clamped to min 50
    });

    it('clamps to maximum value', () => {
      const formula: DerivedStatFormula = {
        id: 'vitality-pool',
        name: 'Vitality Pool',
        worldId: 'world-1',
        description: 'Health pool',
        attributeMultipliers: { constitution: 10 },
        maxValue: 100,
      };

      const attributes = [createAttribute('attr-1', 'constitution', 15)];

      const result = calculateDerivedStat(formula, attributes);

      expect(result).toBe(100); // 15 × 10 = 150, clamped to max 100
    });

    it('applies both min and max when in range', () => {
      const formula: DerivedStatFormula = {
        id: 'vitality-pool',
        name: 'Vitality Pool',
        worldId: 'world-1',
        description: 'Health pool',
        attributeMultipliers: { constitution: 10 },
        minValue: 50,
        maxValue: 200,
      };

      const attributes = [createAttribute('attr-1', 'constitution', 10)];

      const result = calculateDerivedStat(formula, attributes);

      expect(result).toBe(100); // 10 × 10 = 100 (within [50, 200])
    });
  });

  describe('missing attribute handling', () => {
    it('gracefully handles missing attribute by skipping it', () => {
      const formula: DerivedStatFormula = {
        id: 'combined-stat',
        name: 'Combined Stat',
        worldId: 'world-1',
        description: 'Multiple attributes',
        baseValue: 10,
        attributeMultipliers: {
          strength: 5,
          dexterity: 3,
          constitution: 2, // This attribute missing
        },
      };

      const attributes = [
        createAttribute('attr-1', 'strength', 10),
        createAttribute('attr-2', 'dexterity', 8),
        // constitution missing
      ];

      const result = calculateDerivedStat(formula, attributes);

      expect(result).toBe(84); // 10 + (10 × 5) + (8 × 3) + (missing × 2) = 10 + 50 + 24 + 0 = 84
    });

    it('returns base value when no attributes match', () => {
      const formula: DerivedStatFormula = {
        id: 'defense-rating',
        name: 'Defense Rating',
        worldId: 'world-1',
        description: 'Base defense',
        baseValue: 10,
        attributeMultipliers: { dexterity: 0.5 },
      };

      const attributes = [createAttribute('attr-1', 'strength', 15)]; // Wrong attribute

      const result = calculateDerivedStat(formula, attributes);

      expect(result).toBe(10); // Base value only
    });

    it('returns 0 when no base value and no matching attributes', () => {
      const formula: DerivedStatFormula = {
        id: 'stat',
        name: 'Stat',
        worldId: 'world-1',
        description: 'Test',
        attributeMultipliers: { missing: 10 },
      };

      const attributes = [createAttribute('attr-1', 'other', 5)];

      const result = calculateDerivedStat(formula, attributes);

      expect(result).toBe(0);
    });
  });
});

describe('calculateAllDerivedStats', () => {
  const createAttribute = (
    id: string,
    worldAttributeId: string,
    baseValue: number
  ): CharacterAttribute => ({
    id,
    characterId: 'char-1',
    worldAttributeId,
    name: worldAttributeId,
    baseValue,
    modifiedValue: baseValue,
    category: 'test',
  });

  it('calculates multiple formulas in order', () => {
    const formulas: DerivedStatFormula[] = [
      {
        id: 'vitality',
        name: 'Vitality Pool',
        worldId: 'world-1',
        description: 'Health',
        attributeMultipliers: { constitution: 10 },
      },
      {
        id: 'mana',
        name: 'Arcane Reservoir',
        worldId: 'world-1',
        description: 'Mana',
        attributeMultipliers: { intelligence: 8 },
      },
      {
        id: 'defense',
        name: 'Defense Rating',
        worldId: 'world-1',
        description: 'Defense',
        baseValue: 10,
        attributeMultipliers: { dexterity: 0.5 },
      },
    ];

    const attributes = [
      createAttribute('attr-1', 'constitution', 12),
      createAttribute('attr-2', 'intelligence', 10),
      createAttribute('attr-3', 'dexterity', 14),
    ];

    const results = calculateAllDerivedStats(formulas, attributes);

    expect(results).toEqual([
      120, // constitution 12 × 10
      80, // intelligence 10 × 8
      17, // 10 + (dexterity 14 × 0.5) = 10 + 7
    ]);
  });

  it('returns empty array for empty formulas', () => {
    const attributes = [createAttribute('attr-1', 'strength', 10)];

    const results = calculateAllDerivedStats([], attributes);

    expect(results).toEqual([]);
  });
});

describe('validateFormula', () => {
  it('validates a valid formula', () => {
    const formula: DerivedStatFormula = {
      id: 'vitality',
      name: 'Vitality Pool',
      worldId: 'world-1',
      description: 'Health',
      attributeMultipliers: { constitution: 10 },
    };

    const availableIds = new Set(['constitution', 'strength', 'dexterity']);

    const result = validateFormula(formula, availableIds);

    expect(result.valid).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it('rejects formula with no attribute multipliers', () => {
    const formula: DerivedStatFormula = {
      id: 'test',
      name: 'Test',
      worldId: 'world-1',
      description: 'Test',
      attributeMultipliers: {},
    };

    const availableIds = new Set(['constitution']);

    const result = validateFormula(formula, availableIds);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Formula must reference at least one attribute'
    );
  });

  it('rejects formula referencing non-existent attribute', () => {
    const formula: DerivedStatFormula = {
      id: 'test',
      name: 'Test',
      worldId: 'world-1',
      description: 'Test',
      attributeMultipliers: { 'missing-attr': 10 },
    };

    const availableIds = new Set(['constitution', 'strength']);

    const result = validateFormula(formula, availableIds);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Referenced attribute "missing-attr" not found in world'
    );
  });

  it('rejects formula with invalid multiplier', () => {
    const formula: DerivedStatFormula = {
      id: 'test',
      name: 'Test',
      worldId: 'world-1',
      description: 'Test',
      attributeMultipliers: { constitution: NaN },
    };

    const availableIds = new Set(['constitution']);

    const result = validateFormula(formula, availableIds);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      'Multiplier for attribute "constitution" must be a valid number'
    );
  });

  it('rejects formula where minValue > maxValue', () => {
    const formula: DerivedStatFormula = {
      id: 'test',
      name: 'Test',
      worldId: 'world-1',
      description: 'Test',
      attributeMultipliers: { constitution: 10 },
      minValue: 100,
      maxValue: 50,
    };

    const availableIds = new Set(['constitution']);

    const result = validateFormula(formula, availableIds);

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('minValue cannot be greater than maxValue');
  });
});
