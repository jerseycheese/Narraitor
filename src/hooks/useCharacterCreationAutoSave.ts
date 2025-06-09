import { useState, useCallback, useEffect, useRef } from 'react';
import { EntityID } from '@/types/common.types';

interface CharacterCreationState {
  currentStep: number;
  worldId: EntityID;
  characterData: unknown;
  validation: unknown;
  pointPools: unknown;
}

export const useCharacterCreationAutoSave = (worldId: EntityID) => {
  const [data, setData] = useState<CharacterCreationState | undefined>();
  const saveKey = `character-creation-${worldId}`;
  const hasLoadedRef = useRef(false);
  
  // Save on field blur
  const handleFieldBlur = useCallback(() => {
    if (data) {
      sessionStorage.setItem(saveKey, JSON.stringify(data));
    }
  }, [data, saveKey]);
  
  // Restore on mount and when worldId changes
  useEffect(() => {
    // Only load once per worldId
    if (hasLoadedRef.current) return;
    
    const loadData = () => {
      const saved = sessionStorage.getItem(saveKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          console.log(`[AutoSave] Loaded character creation data for world ${worldId}:`, parsed);
          setData(parsed);
          hasLoadedRef.current = true;
        } catch (e) {
          console.error('[AutoSave] Failed to restore character creation data', e);
        }
      } else {
        console.log(`[AutoSave] No saved data found for key: ${saveKey}`);
      }
    };
    
    // Try to load immediately
    loadData();
    
    // Also try after a small delay in case data was just set
    const timeoutId = setTimeout(loadData, 50);
    
    return () => clearTimeout(timeoutId);
  }, [saveKey, worldId]);
  
  // Clear on completion
  const clearAutoSave = useCallback(() => {
    sessionStorage.removeItem(saveKey);
    hasLoadedRef.current = false;
  }, [saveKey]);
  
  return { data, setData, handleFieldBlur, clearAutoSave };
};
