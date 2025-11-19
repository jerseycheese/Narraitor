import { renderHook, act } from '@testing-library/react';
import { usePointPoolManager, useSkillPointPool } from '../usePointPoolManager';

describe('usePointPoolManager', () => {
  const initialItems = [
    { id: 'strength', value: 5, minValue: 1, maxValue: 10 },
    { id: 'intelligence', value: 3, minValue: 1, maxValue: 10 },
    { id: 'agility', value: 2, minValue: 1, maxValue: 10 },
  ];

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

describe('useSkillPointPool', () => {
  const skills = [
    { id: 'combat', value: 5, minValue: 1, maxValue: 10, isSelected: true },
    { id: 'stealth', value: 3, minValue: 1, maxValue: 10, isSelected: false },
    { id: 'magic', value: 4, minValue: 1, maxValue: 10, isSelected: true },
  ];

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