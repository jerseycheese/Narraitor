import { renderHook, act } from '@testing-library/react';
import { useLoreStore } from '../loreStore';
import { setupLoreStore } from './loreStore.testHelpers';

describe('LoreStore - Alias Management', () => {
  beforeEach(() => {
    setupLoreStore();
  });

  describe('addAlias', () => {
    it('should add an alias to a fact', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId!: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
      });

      act(() => {
        result.current.addAlias(factId, 'Seraphina');
      });

      const fact = result.current.getById(factId);
      expect(fact?.aliases).toEqual(['Seraphina']);
    });

    it('should add multiple aliases sequentially', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId!: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
      });

      act(() => {
        result.current.addAlias(factId, 'Seraphina');
        result.current.addAlias(factId, 'Lady Sera');
        result.current.addAlias(factId, 'The Mysterious Woman');
      });

      const fact = result.current.getById(factId);
      expect(fact?.aliases).toEqual(['Seraphina', 'Lady Sera', 'The Mysterious Woman']);
    });

    it('should prevent duplicate aliases', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId!: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
      });

      act(() => {
        result.current.addAlias(factId, 'Seraphina');
        result.current.addAlias(factId, 'Seraphina'); // Duplicate
      });

      const fact = result.current.getById(factId);
      expect(fact?.aliases).toEqual(['Seraphina']);
    });

    it('should not add empty aliases', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId!: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
      });

      act(() => {
        result.current.addAlias(factId, '');
        result.current.addAlias(factId, '   ');
      });

      const fact = result.current.getById(factId);
      expect(fact?.aliases).toEqual([]);
    });

    it('should trim whitespace from aliases', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId!: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
      });

      act(() => {
        result.current.addAlias(factId, '  Seraphina  ');
      });

      const fact = result.current.getById(factId);
      expect(fact?.aliases).toEqual(['Seraphina']);
    });

    it('should do nothing if fact does not exist', () => {
      const { result } = renderHook(() => useLoreStore());

      expect(() => {
        act(() => {
          result.current.addAlias('non-existent-id', 'Alias');
        });
      }).not.toThrow();
    });
  });

  describe('removeAlias', () => {
    it('should remove an alias from a fact', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId!: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
        result.current.setAliases(factId, ['Seraphina', 'Lady Sera', 'The Mysterious Woman']);
      });

      act(() => {
        result.current.removeAlias(factId, 'Lady Sera');
      });

      const fact = result.current.getById(factId);
      expect(fact?.aliases).toEqual(['Seraphina', 'The Mysterious Woman']);
    });

    it('should handle removing non-existent alias', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId!: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
        result.current.setAliases(factId, ['Seraphina', 'Lady Sera', 'The Mysterious Woman']);
      });

      act(() => {
        result.current.removeAlias(factId, 'Non-existent');
      });

      const fact = result.current.getById(factId);
      expect(fact?.aliases).toEqual(['Seraphina', 'Lady Sera', 'The Mysterious Woman']);
    });

    it('should do nothing if fact does not exist', () => {
      const { result } = renderHook(() => useLoreStore());

      expect(() => {
        act(() => {
          result.current.removeAlias('non-existent-id', 'Alias');
        });
      }).not.toThrow();
    });
  });

  describe('setAliases', () => {
    it('should set multiple aliases at once', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId!: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
      });

      act(() => {
        result.current.setAliases(factId, ['Seraphina', 'Lady Sera', 'The Mysterious Woman']);
      });

      const fact = result.current.getById(factId);
      expect(fact?.aliases).toEqual(['Seraphina', 'Lady Sera', 'The Mysterious Woman']);
    });

    it('should replace existing aliases', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId!: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
      });

      act(() => {
        result.current.setAliases(factId, ['Old Alias']);
        result.current.setAliases(factId, ['New Alias 1', 'New Alias 2']);
      });

      const fact = result.current.getById(factId);
      expect(fact?.aliases).toEqual(['New Alias 1', 'New Alias 2']);
    });

    it('should remove duplicates when setting aliases', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId!: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
      });

      act(() => {
        result.current.setAliases(factId, ['Seraphina', 'Lady Sera', 'Seraphina']);
      });

      const fact = result.current.getById(factId);
      expect(fact?.aliases).toEqual(['Seraphina', 'Lady Sera']);
    });

    it('should filter out empty aliases', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId!: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
      });

      act(() => {
        result.current.setAliases(factId, ['Seraphina', '', '  ', 'Lady Sera']);
      });

      const fact = result.current.getById(factId);
      expect(fact?.aliases).toEqual(['Seraphina', 'Lady Sera']);
    });

    it('should trim whitespace from aliases', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId!: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
      });

      act(() => {
        result.current.setAliases(factId, ['  Seraphina  ', '  Lady Sera  ']);
      });

      const fact = result.current.getById(factId);
      expect(fact?.aliases).toEqual(['Seraphina', 'Lady Sera']);
    });

    it('should allow setting empty array to clear aliases', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId!: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
      });

      act(() => {
        result.current.addAlias(factId, 'Seraphina');
        result.current.setAliases(factId, []);
      });

      const fact = result.current.getById(factId);
      expect(fact?.aliases).toEqual([]);
    });

    it('should do nothing if fact does not exist', () => {
      const { result } = renderHook(() => useLoreStore());

      expect(() => {
        act(() => {
          result.current.setAliases('non-existent-id', ['Alias']);
        });
      }).not.toThrow();
    });
  });

  describe('findEntityByAnyName', () => {
    it('should find entity by canonical name', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId!: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
        result.current.setAliases(factId, ['Seraphina', 'Lady Sera', 'The Mysterious Woman']);
      });

      const found = result.current.findEntityByAnyName('Lady Seraphina', 'world-1');

      expect(found).toBeDefined();
      expect(found?.id).toBe(factId);
    });

    it('should find entity by any alias', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId!: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
        result.current.setAliases(factId, ['Seraphina', 'Lady Sera', 'The Mysterious Woman']);
      });

      const byAlias1 = result.current.findEntityByAnyName('Seraphina', 'world-1');
      const byAlias2 = result.current.findEntityByAnyName('Lady Sera', 'world-1');
      const byAlias3 = result.current.findEntityByAnyName('The Mysterious Woman', 'world-1');

      expect(byAlias1?.id).toBe(factId);
      expect(byAlias2?.id).toBe(factId);
      expect(byAlias3?.id).toBe(factId);
    });

    it('should be case-insensitive', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId!: string;
      act(() => {
        factId = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
        result.current.setAliases(factId, ['Seraphina', 'Lady Sera']);
      });

      const found1 = result.current.findEntityByAnyName('lady seraphina', 'world-1');
      const found2 = result.current.findEntityByAnyName('SERAPHINA', 'world-1');
      const found3 = result.current.findEntityByAnyName('LaDy SeRa', 'world-1');

      expect(found1?.id).toBe(factId);
      expect(found2?.id).toBe(factId);
      expect(found3?.id).toBe(factId);
    });

    it('should return null if no entity found', () => {
      const { result } = renderHook(() => useLoreStore());

      const found = result.current.findEntityByAnyName('Unknown Name', 'world-1');

      expect(found).toBeNull();
    });

    it('should only search within specified world', () => {
      const { result } = renderHook(() => useLoreStore());

      let factId1!: string, factId2!: string;
      act(() => {
        factId1 = result.current.addFact(
          'character:lady-seraphina',
          'Lady Seraphina',
          'characters',
          'manual',
          'world-1'
        );
        result.current.setAliases(factId1, ['Seraphina']);

        factId2 = result.current.addFact(
          'character:lady-victoria',
          'Lady Victoria',
          'characters',
          'manual',
          'world-2'
        );
        result.current.setAliases(factId2, ['Seraphina']); // Same alias as world-1
      });

      // Search in world 1 should find the first character
      const found1 = result.current.findEntityByAnyName('Seraphina', 'world-1');
      expect(found1?.id).toBe(factId1);
      expect(found1?.value).toBe('Lady Seraphina');

      // Search in world 2 should find the second character
      const found2 = result.current.findEntityByAnyName('Seraphina', 'world-2');
      expect(found2?.id).toBe(factId2);
      expect(found2?.value).toBe('Lady Victoria');
    });

    it('should handle special characters in names', () => {
      const { result } = renderHook(() => useLoreStore());

      let specialFactId!: string;
      act(() => {
        specialFactId = result.current.addFact(
          'character:dr-oconnor',
          "Dr. O'Connor",
          'characters',
          'manual',
          'world-1'
        );
        result.current.setAliases(specialFactId, ["O'Connor", 'The Doctor']);
      });

      const found = result.current.findEntityByAnyName("O'Connor", 'world-1');

      expect(found?.id).toBe(specialFactId);
    });
  });

  describe('Default aliases for new facts', () => {
    it('should initialize new facts with empty aliases array', () => {
      const { result } = renderHook(() => useLoreStore());

      let newFactId!: string;
      act(() => {
        newFactId = result.current.addFact(
          'location:castle',
          'The Grand Castle',
          'locations',
          'manual',
          'world-1'
        );
      });

      const fact = result.current.getById(newFactId);
      expect(fact?.aliases).toEqual([]);
    });
  });
});
