import React from 'react';
import { usePointPoolManager } from '@/hooks/usePointPoolManager';
import { calculateSkillPointPool } from '@/components/CharacterCreationWizard/utils/skillAllocation';
import { World } from '@/types/world.types';
import { CharacterCreationData } from './useCharacterCreationWizard';

interface UseCharacterPointPoolsProps {
  world: World;
  characterData: CharacterCreationData;
}

/**
 * Custom hook for managing attribute and skill point pools in character creation
 */
export function useCharacterPointPools({ world, characterData }: UseCharacterPointPoolsProps) {
  // Attribute point pool manager
  const attributePool = usePointPoolManager({
    totalPoints: world?.settings.attributePointPool || 0,
    items: characterData.attributes.map(attr => ({
      id: attr.attributeId,
      value: attr.value,
      minValue: attr.minValue,
      maxValue: attr.maxValue,
    })),
  });

  // Skill point pool manager
  const skillPool = React.useMemo(() => {
    const totalPoints = world?.settings.skillPointPool || 0;
    return calculateSkillPointPool(characterData.skills, world, totalPoints);
  }, [characterData.skills, world]);

  return {
    attributePool,
    skillPool
  };
}
