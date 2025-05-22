import { useState, useCallback, useEffect } from 'react';
import { EntityID } from '@/types/common.types';

interface CharacterCreationState {
  currentStep: number;
  worldId: EntityID;
  characterData: any;
  validation: any;
  pointPools: any;
}

export const useCharacterCreationAutoSave = (worldId: EntityID) => {
  const [data, setData] = useState<CharacterCreationState | undefined>();
  const saveKey = `character-creation-${worldId}`;
  
  // Save on field blur
  const handleFieldBlur = useCallback(() => {
    if (data) {
      sessionStorage.setItem(saveKey, JSON.stringify(data));
    }
  }, [data, saveKey]);
  
  // Restore on mount
  useEffect(() => {
    const saved = sessionStorage.getItem(saveKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setData(parsed);
      } catch (e) {
        console.error('Failed to restore character creation data', e);
      }
    }
  }, [saveKey]);
  
  // Clear on completion
  const clearAutoSave = useCallback(() => {
    sessionStorage.removeItem(saveKey);
  }, [saveKey]);
  
  return { data, setData, handleFieldBlur, clearAutoSave };
};