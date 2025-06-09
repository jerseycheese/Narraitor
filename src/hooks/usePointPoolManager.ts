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

export interface UsePointPoolManagerOptions {
  totalPoints: number;
  items: PointPoolItem[];
  calculateSpent?: (items: PointPoolItem[]) => number;
}

export interface UsePointPoolManagerReturn {
  pool: PointPool;
  items: PointPoolItem[];
  canIncrease: (itemId: string) => boolean;
  canDecrease: (itemId: string) => boolean;
  increaseValue: (itemId: string, amount?: number) => void;
  decreaseValue: (itemId: string, amount?: number) => void;
  setValue: (itemId: string, value: number) => void;
  resetItem: (itemId: string) => void;
  resetAll: () => void;
  getItemById: (itemId: string) => PointPoolItem | undefined;
  hasPointsRemaining: boolean;
  isValidDistribution: boolean;
}

export function usePointPoolManager({
  totalPoints,
  items: initialItems,
  calculateSpent,
}: UsePointPoolManagerOptions): UsePointPoolManagerReturn {
  const [items, setItems] = useState<PointPoolItem[]>(initialItems);

  // Default spent calculation function
  const defaultCalculateSpent = useCallback((items: PointPoolItem[]) => {
    return items.reduce((sum, item) => sum + item.value, 0);
  }, []);

  const spentCalculator = calculateSpent || defaultCalculateSpent;

  // Calculate pool state
  const pool = useMemo((): PointPool => {
    const spent = spentCalculator(items);
    return {
      total: totalPoints,
      spent,
      remaining: totalPoints - spent,
    };
  }, [totalPoints, items, spentCalculator]);

  // Helper computed values
  const hasPointsRemaining = pool.remaining > 0;
  const isValidDistribution = pool.remaining >= 0;

  // Get item by ID
  const getItemById = useCallback((itemId: string): PointPoolItem | undefined => {
    return items.find(item => item.id === itemId);
  }, [items]);

  // Check if we can increase an item's value
  const canIncrease = useCallback((itemId: string): boolean => {
    const item = getItemById(itemId);
    if (!item) return false;
    
    return item.value < item.maxValue && pool.remaining > 0;
  }, [getItemById, pool.remaining]);

  // Check if we can decrease an item's value
  const canDecrease = useCallback((itemId: string): boolean => {
    const item = getItemById(itemId);
    if (!item) return false;
    
    return item.value > item.minValue;
  }, [getItemById]);

  // Increase item value
  const increaseValue = useCallback((itemId: string, amount: number = 1): void => {
    if (!canIncrease(itemId)) return;

    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      
      const newValue = Math.min(
        item.value + amount,
        item.maxValue,
        item.value + pool.remaining
      );
      
      return { ...item, value: newValue };
    }));
  }, [canIncrease, pool.remaining]);

  // Decrease item value
  const decreaseValue = useCallback((itemId: string, amount: number = 1): void => {
    if (!canDecrease(itemId)) return;

    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      
      const newValue = Math.max(item.value - amount, item.minValue);
      return { ...item, value: newValue };
    }));
  }, [canDecrease]);

  // Set specific value for an item
  const setValue = useCallback((itemId: string, value: number): void => {
    const item = getItemById(itemId);
    if (!item) return;

    // Clamp value within bounds
    const clampedValue = Math.max(
      item.minValue,
      Math.min(value, item.maxValue)
    );

    // Check if the new value would exceed the point pool
    const currentSpent = spentCalculator(items);
    const currentItemValue = item.value;
    const pointDifference = clampedValue - currentItemValue;
    const newTotalSpent = currentSpent + pointDifference;

    if (newTotalSpent > totalPoints) {
      // Adjust value to not exceed pool
      const maxAllowedValue = currentItemValue + (totalPoints - currentSpent);
      const finalValue = Math.min(clampedValue, maxAllowedValue);
      
      setItems(prev => prev.map(i => 
        i.id === itemId ? { ...i, value: finalValue } : i
      ));
    } else {
      setItems(prev => prev.map(i => 
        i.id === itemId ? { ...i, value: clampedValue } : i
      ));
    }
  }, [getItemById, items, spentCalculator, totalPoints]);

  // Reset item to minimum value
  const resetItem = useCallback((itemId: string): void => {
    setItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, value: item.minValue } : item
    ));
  }, []);

  // Reset all items to minimum values
  const resetAll = useCallback((): void => {
    setItems(prev => prev.map(item => ({ ...item, value: item.minValue })));
  }, []);

  return {
    pool,
    items,
    canIncrease,
    canDecrease,
    increaseValue,
    decreaseValue,
    setValue,
    resetItem,
    resetAll,
    getItemById,
    hasPointsRemaining,
    isValidDistribution,
  };
}

// Specialized hook for character attributes
export function useAttributePointPool(options: UsePointPoolManagerOptions) {
  return usePointPoolManager({
    ...options,
    calculateSpent: options.calculateSpent || ((items) => 
      items.reduce((sum, item) => sum + item.value, 0)
    ),
  });
}

// Specialized hook for character skills with selection state
export interface SkillPointPoolItem extends PointPoolItem {
  isSelected: boolean;
}

export interface UseSkillPointPoolOptions {
  totalPoints: number;
  skills: SkillPointPoolItem[];
}

export interface UseSkillPointPoolReturn extends Omit<UsePointPoolManagerReturn, 'items'> {
  skills: SkillPointPoolItem[];
  toggleSkillSelection: (skillId: string) => void;
  selectedSkillsCount: number;
  canSelectMoreSkills: boolean;
  maxSkills?: number;
}

export function useSkillPointPool({
  totalPoints,
  skills: initialSkills,
}: UseSkillPointPoolOptions): UseSkillPointPoolReturn {
  const [skills, setSkills] = useState<SkillPointPoolItem[]>(initialSkills);

  // We don't need the base pool manager for skills since we handle it directly

  // Override pool manager methods to sync with skills state
  const increaseValue = useCallback((skillId: string, amount?: number) => {
    setSkills(prev => prev.map(skill => {
      if (skill.id === skillId) {
        const newValue = Math.min(
          skill.value + (amount || 1),
          skill.maxValue
        );
        return { ...skill, value: newValue };
      }
      return skill;
    }));
  }, []);

  const decreaseValue = useCallback((skillId: string, amount?: number) => {
    setSkills(prev => prev.map(skill => {
      if (skill.id === skillId) {
        const newValue = Math.max(
          skill.value - (amount || 1),
          skill.minValue
        );
        return { ...skill, value: newValue };
      }
      return skill;
    }));
  }, []);

  const setValue = useCallback((skillId: string, value: number) => {
    setSkills(prev => prev.map(skill => {
      if (skill.id === skillId) {
        const clampedValue = Math.max(
          skill.minValue,
          Math.min(value, skill.maxValue)
        );
        return { ...skill, value: clampedValue };
      }
      return skill;
    }));
  }, []);

  const resetItem = useCallback((skillId: string) => {
    setSkills(prev => prev.map(skill => 
      skill.id === skillId ? { ...skill, value: skill.minValue } : skill
    ));
  }, []);

  const resetAll = useCallback(() => {
    setSkills(prev => prev.map(skill => ({ ...skill, value: skill.minValue })));
  }, []);

  // Toggle skill selection
  const toggleSkillSelection = useCallback((skillId: string) => {
    setSkills(prev => prev.map(skill => 
      skill.id === skillId 
        ? { ...skill, isSelected: !skill.isSelected }
        : skill
    ));
  }, []);

  // Calculate our own pool state for skills
  const spent = skills
    .filter(skill => skill.isSelected)
    .reduce((sum, skill) => sum + skill.value, 0);
    
  const pool = {
    total: totalPoints,
    spent,
    remaining: totalPoints - spent,
  };

  // Additional computed values for skills
  const selectedSkillsCount = skills.filter(skill => skill.isSelected).length;
  const canSelectMoreSkills = true; // Can be extended with maxSkills logic

  // Helper functions from the base pool manager
  const getItemById = useCallback((itemId: string) => {
    return skills.find(skill => skill.id === itemId);
  }, [skills]);

  const canIncrease = useCallback((skillId: string) => {
    const skill = getItemById(skillId);
    if (!skill) return false;
    return skill.value < skill.maxValue && pool.remaining > 0;
  }, [getItemById, pool.remaining]);

  const canDecrease = useCallback((skillId: string) => {
    const skill = getItemById(skillId);
    if (!skill) return false;
    return skill.value > skill.minValue;
  }, [getItemById]);

  return {
    pool,
    skills,
    canIncrease,
    canDecrease,
    increaseValue,
    decreaseValue,
    setValue,
    resetItem,
    resetAll,
    getItemById,
    hasPointsRemaining: pool.remaining > 0,
    isValidDistribution: pool.remaining >= 0,
    toggleSkillSelection,
    selectedSkillsCount,
    canSelectMoreSkills,
  };
}