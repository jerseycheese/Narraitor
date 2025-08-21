import { useState, useCallback, useEffect, useRef } from 'react';
import { EntityID } from '@/types/common.types';

interface CharacterCreationState {
  currentStep: number;
  worldId: EntityID;
  characterData: unknown;
  validation: unknown;
  pointPools: unknown;
  lastSaved?: string;
}

export const useCharacterCreationAutoSave = (worldId: EntityID) => {
  const [data, setDataInternal] = useState<CharacterCreationState | undefined>();
  const [hasRecoveryData, setHasRecoveryData] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const saveKey = `character-creation-${worldId}`;
  const hasLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Debounced auto-save to localStorage whenever data changes
  useEffect(() => {
    if (data && hasLoadedRef.current) { // Only save after initial load is complete
      setSaveStatus('saving');
      
      // Clear any existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Debounce the save operation to prevent excessive writes
      saveTimeoutRef.current = setTimeout(() => {
        try {
          const dataWithTimestamp = { 
            ...data, 
            lastSaved: new Date().toISOString() 
          };
          localStorage.setItem(saveKey, JSON.stringify(dataWithTimestamp));
          setSaveStatus('saved');
        } catch (error) {
          console.error('[AutoSave] Failed to save character creation data', error);
          setSaveStatus('idle');
        }
      }, 300); // 300ms debounce
    }
  }, [data, saveKey, worldId]);
  
  // Create a simple setData function that doesn't use useCallback or refs
  // This will change on every render, so we'll handle that in the component
  const setData = (newData: CharacterCreationState | undefined) => {
    setDataInternal(newData);
  };
  
  
  // Field blur handler (auto-save is now handled automatically in useEffect above)
  const handleFieldBlur = useCallback(() => {
    // Auto-save happens automatically when data changes
    // This is kept for API compatibility but no longer needed
  }, []);
  
  // Restore on mount and when worldId changes
  useEffect(() => {
    // Only load once per worldId
    if (hasLoadedRef.current) return;
    
    const loadData = () => {
      const saved = localStorage.getItem(saveKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setDataInternal(parsed);
          setHasRecoveryData(true);
          hasLoadedRef.current = true; // Mark as loaded after setting data
        } catch (e) {
          console.error('[AutoSave] Failed to restore character creation data', e);
          setHasRecoveryData(false);
          hasLoadedRef.current = true; // Still mark as loaded to prevent retries
        }
      } else {
        setHasRecoveryData(false);
        hasLoadedRef.current = true; // Mark as loaded even if no data found
      }
    };
    
    // Try to load immediately
    loadData();
    
    // Also try after a small delay in case data was just set
    const timeoutId = setTimeout(loadData, 50);
    
    return () => clearTimeout(timeoutId);
  }, [saveKey, worldId]);
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);
  
  // Clear on completion
  const clearAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    localStorage.removeItem(saveKey);
    setHasRecoveryData(false);
    setDataInternal(undefined);
    hasLoadedRef.current = false;
    setSaveStatus('idle');
  }, [saveKey]);
  
  return { data, setData, handleFieldBlur, clearAutoSave, hasRecoveryData, saveStatus };
};
