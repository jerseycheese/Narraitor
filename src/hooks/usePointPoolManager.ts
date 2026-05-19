import { useState, useCallback, useMemo } from 'react';

export interface PointPoolItem {
  id: string;
  value: number;
  minValue: number;
  maxValue: number;
}

export interface PointPool {
  total: number;
  spent: number;
  remaining: number;
}

export interface UsePointPoolManagerOptions<T extends PointPoolItem> {
  totalPoints: number;
  items: T[];
  calculateSpent?: (items: T[]) => number;
}

export interface UsePointPoolManagerReturn<T extends PointPoolItem> {
  pool: PointPool;
  items: T[];
  canIncrease: (itemId: string) => boolean;
  canDecrease: (itemId: string) => boolean;
  increaseValue: (itemId: string, amount?: number) => void;
  decreaseValue: (itemId: string, amount?: number) => void;
  setValue: (itemId: string, value: number) => void;
  updateItem: (itemId: string, updater: (item: T) => T) => void;
  resetItem: (itemId: string) => void;
  resetAll: () => void;
  getItemById: (itemId: string) => T | undefined;
  hasPointsRemaining: boolean;
  isValidDistribution: boolean;
}

export function usePointPoolManager<T extends PointPoolItem>({
  totalPoints,
  items: initialItems,
  calculateSpent,
}: UsePointPoolManagerOptions<T>): UsePointPoolManagerReturn<T> {
  const [items, setItems] = useState<T[]>(initialItems);

  const defaultCalculateSpent = useCallback((list: T[]) => {
    return list.reduce((sum, item) => sum + item.value, 0);
  }, []);

  const spentCalculator = calculateSpent || defaultCalculateSpent;

  const pool = useMemo((): PointPool => {
    const spent = spentCalculator(items);
    return {
      total: totalPoints,
      spent,
      remaining: totalPoints - spent,
    };
  }, [totalPoints, items, spentCalculator]);

  const hasPointsRemaining = pool.remaining > 0;
  const isValidDistribution = pool.remaining >= 0;

  const getItemById = useCallback(
    (itemId: string): T | undefined => items.find((item) => item.id === itemId),
    [items]
  );

  const canIncrease = useCallback(
    (itemId: string): boolean => {
      const item = getItemById(itemId);
      if (!item) return false;
      return item.value < item.maxValue && pool.remaining > 0;
    },
    [getItemById, pool.remaining]
  );

  const canDecrease = useCallback(
    (itemId: string): boolean => {
      const item = getItemById(itemId);
      if (!item) return false;
      return item.value > item.minValue;
    },
    [getItemById]
  );

  const updateItem = useCallback(
    (itemId: string, updater: (item: T) => T): void => {
      setItems((prev) =>
        prev.map((item) => (item.id === itemId ? updater(item) : item))
      );
    },
    []
  );

  const increaseValue = useCallback(
    (itemId: string, amount: number = 1): void => {
      if (!canIncrease(itemId)) return;

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          const newValue = Math.min(
            item.value + amount,
            item.maxValue,
            item.value + pool.remaining
          );
          return { ...item, value: newValue };
        })
      );
    },
    [canIncrease, pool.remaining]
  );

  const decreaseValue = useCallback(
    (itemId: string, amount: number = 1): void => {
      if (!canDecrease(itemId)) return;

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          const newValue = Math.max(item.value - amount, item.minValue);
          return { ...item, value: newValue };
        })
      );
    },
    [canDecrease]
  );

  const setValue = useCallback(
    (itemId: string, value: number): void => {
      const item = getItemById(itemId);
      if (!item) return;

      const clampedValue = Math.max(
        item.minValue,
        Math.min(value, item.maxValue)
      );

      const currentSpent = spentCalculator(items);
      const currentItemValue = item.value;
      const pointDifference = clampedValue - currentItemValue;
      const newTotalSpent = currentSpent + pointDifference;

      if (newTotalSpent > totalPoints) {
        const maxAllowedValue = currentItemValue + (totalPoints - currentSpent);
        const finalValue = Math.min(clampedValue, maxAllowedValue);
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, value: finalValue } : i))
        );
      } else {
        setItems((prev) =>
          prev.map((i) => (i.id === itemId ? { ...i, value: clampedValue } : i))
        );
      }
    },
    [getItemById, items, spentCalculator, totalPoints]
  );

  const resetItem = useCallback((itemId: string): void => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, value: item.minValue } : item
      )
    );
  }, []);

  const resetAll = useCallback((): void => {
    setItems((prev) => prev.map((item) => ({ ...item, value: item.minValue })));
  }, []);

  return {
    pool,
    items,
    canIncrease,
    canDecrease,
    increaseValue,
    decreaseValue,
    setValue,
    updateItem,
    resetItem,
    resetAll,
    getItemById,
    hasPointsRemaining,
    isValidDistribution,
  };
}

export interface SkillPointPoolItem extends PointPoolItem {
  isSelected: boolean;
}

export interface UseSkillPointPoolOptions {
  totalPoints: number;
  skills: SkillPointPoolItem[];
}

export interface UseSkillPointPoolReturn
  extends Omit<UsePointPoolManagerReturn<SkillPointPoolItem>, 'items'> {
  skills: SkillPointPoolItem[];
  toggleSkillSelection: (skillId: string) => void;
  selectedSkillsCount: number;
  canSelectMoreSkills: boolean;
  maxSkills?: number;
}

const sumSelectedSkillValues = (skills: SkillPointPoolItem[]): number =>
  skills.filter((skill) => skill.isSelected).reduce((sum, skill) => sum + skill.value, 0);

export function useSkillPointPool({
  totalPoints,
  skills: initialSkills,
}: UseSkillPointPoolOptions): UseSkillPointPoolReturn {
  const pool = usePointPoolManager<SkillPointPoolItem>({
    totalPoints,
    items: initialSkills,
    calculateSpent: sumSelectedSkillValues,
  });

  const toggleSkillSelection = useCallback(
    (skillId: string) => {
      pool.updateItem(skillId, (skill) => ({
        ...skill,
        isSelected: !skill.isSelected,
      }));
    },
    [pool]
  );

  const selectedSkillsCount = pool.items.filter((skill) => skill.isSelected).length;

  return {
    pool: pool.pool,
    skills: pool.items,
    canIncrease: pool.canIncrease,
    canDecrease: pool.canDecrease,
    increaseValue: pool.increaseValue,
    decreaseValue: pool.decreaseValue,
    setValue: pool.setValue,
    updateItem: pool.updateItem,
    resetItem: pool.resetItem,
    resetAll: pool.resetAll,
    getItemById: pool.getItemById,
    hasPointsRemaining: pool.hasPointsRemaining,
    isValidDistribution: pool.isValidDistribution,
    toggleSkillSelection,
    selectedSkillsCount,
    canSelectMoreSkills: true,
  };
}
