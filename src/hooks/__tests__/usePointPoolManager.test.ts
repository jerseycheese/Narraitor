import { renderHook, act } from '@testing-library/react';
import { usePointPoolManager, useAttributePointPool, useSkillPointPool } from '../usePointPoolManager';

describe('usePointPoolManager', () => {
  const initialItems = [
    { id: 'strength', value: 5, minValue: 1, maxValue: 10 },
    { id: 'intelligence', value: 3, minValue: 1, maxValue: 10 },
    { id: 'agility', value: 2, minValue: 1, maxValue: 10 },
  ];

  it('should initialize with correct pool state', () => {
    const { result } = renderHook(() =>
      usePointPoolManager({
        totalPoints: 20,
        items: initialItems,
      })
    );

    expect(result.current.pool).toEqual({
      total: 20,
      spent: 10, // 5 + 3 + 2
      remaining: 10,
    });

    expect(result.current.items).toEqual(initialItems);
    expect(result.current.hasPointsRemaining).toBe(true);
    expect(result.current.isValidDistribution).toBe(true);
  });

  it('should handle value increases correctly', () => {
    const { result } = renderHook(() =>
      usePointPoolManager({
        totalPoints: 20,
        items: initialItems,
      })
    );

    act(() => {
      result.current.increaseValue('strength', 2);
    });

    const updatedItem = result.current.getItemById('strength');
    expect(updatedItem?.value).toBe(7);
    expect(result.current.pool.spent).toBe(12);
    expect(result.current.pool.remaining).toBe(8);
  });

  it('should handle value decreases correctly', () => {
    const { result } = renderHook(() =>
      usePointPoolManager({
        totalPoints: 20,
        items: initialItems,
      })
    );

    act(() => {
      result.current.decreaseValue('strength', 2);
    });

    const updatedItem = result.current.getItemById('strength');
    expect(updatedItem?.value).toBe(3);
    expect(result.current.pool.spent).toBe(8);
    expect(result.current.pool.remaining).toBe(12);
  });

  it('should enforce minimum and maximum values', () => {
    const { result } = renderHook(() =>
      usePointPoolManager({
        totalPoints: 20,
        items: initialItems,
      })
    );

    // Try to decrease below minimum
    act(() => {
      result.current.decreaseValue('agility', 5); // Current: 2, min: 1
    });

    const agilityItem = result.current.getItemById('agility');
    expect(agilityItem?.value).toBe(1); // Should be clamped to minimum

    // Try to increase beyond maximum
    act(() => {
      result.current.increaseValue('strength', 10); // Current: 5, max: 10
    });

    const strengthItem = result.current.getItemById('strength');
    expect(strengthItem?.value).toBe(10); // Should be clamped to maximum
  });

  it('should prevent exceeding total point pool', () => {
    const items = [
      { id: 'strength', value: 8, minValue: 1, maxValue: 10 },
      { id: 'intelligence', value: 8, minValue: 1, maxValue: 10 },
      { id: 'agility', value: 4, minValue: 1, maxValue: 10 },
    ];

    const { result } = renderHook(() =>
      usePointPoolManager({
        totalPoints: 20,
        items,
      })
    );

    expect(result.current.pool.remaining).toBe(0);

    // Try to increase when no points remaining
    expect(result.current.canIncrease('strength')).toBe(false);

    act(() => {
      result.current.increaseValue('strength');
    });

    const strengthItem = result.current.getItemById('strength');
    expect(strengthItem?.value).toBe(8); // Should remain unchanged
  });

  it('should handle setValue correctly', () => {
    const { result } = renderHook(() =>
      usePointPoolManager({
        totalPoints: 20,
        items: initialItems,
      })
    );

    act(() => {
      result.current.setValue('intelligence', 8);
    });

    const intelligenceItem = result.current.getItemById('intelligence');
    expect(intelligenceItem?.value).toBe(8);
    expect(result.current.pool.spent).toBe(15); // 5 + 8 + 2
    expect(result.current.pool.remaining).toBe(5);
  });

  it('should handle reset operations', () => {
    const { result } = renderHook(() =>
      usePointPoolManager({
        totalPoints: 20,
        items: initialItems,
      })
    );

    // Make some changes
    act(() => {
      result.current.increaseValue('strength', 3);
      result.current.increaseValue('intelligence', 2);
    });

    // Reset one item
    act(() => {
      result.current.resetItem('strength');
    });

    const strengthItem = result.current.getItemById('strength');
    expect(strengthItem?.value).toBe(1); // Reset to minimum

    // Reset all items
    act(() => {
      result.current.resetAll();
    });

    result.current.items.forEach(item => {
      expect(item.value).toBe(item.minValue);
    });
  });

  it('should provide correct navigation helpers', () => {
    const { result } = renderHook(() =>
      usePointPoolManager({
        totalPoints: 20,
        items: initialItems,
      })
    );

    // Can increase when below max and points available
    expect(result.current.canIncrease('agility')).toBe(true);

    // Can decrease when above min
    expect(result.current.canDecrease('strength')).toBe(true);

    // Cannot decrease when at minimum
    const minItems = [{ id: 'test', value: 1, minValue: 1, maxValue: 10 }];
    const { result: minResult } = renderHook(() =>
      usePointPoolManager({
        totalPoints: 10,
        items: minItems,
      })
    );

    expect(minResult.current.canDecrease('test')).toBe(false);
  });
});

describe('useAttributePointPool', () => {
  it('should work as a specialized usePointPoolManager', () => {
    const items = [
      { id: 'str', value: 5, minValue: 1, maxValue: 10 },
      { id: 'int', value: 3, minValue: 1, maxValue: 10 },
    ];

    const { result } = renderHook(() =>
      useAttributePointPool({
        totalPoints: 15,
        items,
      })
    );

    expect(result.current.pool.spent).toBe(8);
    expect(result.current.items).toEqual(items);
  });
});

describe('useSkillPointPool', () => {
  const skills = [
    { id: 'combat', value: 5, minValue: 1, maxValue: 10, isSelected: true },
    { id: 'stealth', value: 3, minValue: 1, maxValue: 10, isSelected: false },
    { id: 'magic', value: 4, minValue: 1, maxValue: 10, isSelected: true },
  ];

  it('should only count selected skills in spent calculation', () => {
    const { result } = renderHook(() =>
      useSkillPointPool({
        totalPoints: 20,
        skills,
      })
    );

    // Only combat (5) and magic (4) should count, stealth (3) is not selected
    expect(result.current.pool.spent).toBe(9);
    expect(result.current.pool.remaining).toBe(11);
  });

  it('should handle skill selection toggling', () => {
    const { result } = renderHook(() =>
      useSkillPointPool({
        totalPoints: 20,
        skills,
      })
    );

    act(() => {
      result.current.toggleSkillSelection('stealth');
    });

    expect(result.current.skills.find(s => s.id === 'stealth')?.isSelected).toBe(true);
    expect(result.current.selectedSkillsCount).toBe(3);
    expect(result.current.pool.spent).toBe(12); // Now includes stealth (3)

    act(() => {
      result.current.toggleSkillSelection('combat');
    });

    expect(result.current.skills.find(s => s.id === 'combat')?.isSelected).toBe(false);
    expect(result.current.selectedSkillsCount).toBe(2);
    expect(result.current.pool.spent).toBe(7); // combat (5) no longer counted
  });

  it('should sync skill values with point pool operations', () => {
    const { result } = renderHook(() =>
      useSkillPointPool({
        totalPoints: 20,
        skills,
      })
    );

    act(() => {
      result.current.increaseValue('combat', 2);
    });

    const combatSkill = result.current.skills.find(s => s.id === 'combat');
    expect(combatSkill?.value).toBe(7);
    expect(result.current.pool.spent).toBe(11); // 7 + 4 (combat + magic)
  });

  it('should provide skill-specific helpers', () => {
    const { result } = renderHook(() =>
      useSkillPointPool({
        totalPoints: 20,
        skills,
      })
    );

    expect(result.current.selectedSkillsCount).toBe(2);
    expect(result.current.canSelectMoreSkills).toBe(true);
  });
});