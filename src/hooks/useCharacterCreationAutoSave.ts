import { useState, useCallback, useEffect, useRef } from 'react';
import { EntityID } from '@/types/common.types';

/**
 * Character creation state interface for auto-save functionality
 * @interface CharacterCreationState
 */
interface CharacterCreationState {
  /** Current wizard step index */
  currentStep: number;
  /** World ID for the character being created */
  worldId: EntityID;
  /** Character data being created */
  characterData: unknown;
  /** Validation state for each step */
  validation: unknown;
  /** Point pool allocation state */
  pointPools: unknown;
  /** ISO timestamp of last save operation */
  lastSaved?: string;
}

/**
 * Character Creation Auto-Save Hook
 * 
 * Provides automatic saving and recovery functionality for character creation workflows.
 * Uses localStorage for persistence with debounced saves to prevent excessive writes.
 * Includes recovery detection and user choice dialog integration.
 * 
 * Key Features:
 * - Automatic debounced saving (300ms delay)
 * - Recovery data detection on mount
 * - Visual save status feedback
 * - Manual save clearing on completion
 * - Migration from sessionStorage to localStorage
 * 
 * @param worldId - The ID of the world for which the character is being created
 * @returns Object containing save state, data handlers, and recovery status
 * 
 * @example
 * ```tsx
 * const {
 *   data,
 *   setData,
 *   clearAutoSave,
 *   hasRecoveryData,
 *   saveStatus
 * } = useCharacterCreationAutoSave(worldId);
 * 
 * // Check for recovery data
 * if (hasRecoveryData) {
 *   // Show recovery dialog
 * }
 * 
 * // Update character data (auto-saves after 300ms)
 * setData({
 *   currentStep: 1,
 *   worldId,
 *   characterData: updatedCharacter,
 *   validation: stepValidation,
 *   pointPools: poolState
 * });
 * 
 * // Clear save data when character creation completes
 * clearAutoSave();
 * ```
 */
export const useCharacterCreationAutoSave = (worldId: EntityID) => {
  /** Internal state for character creation data */
  const [data, setDataInternal] = useState<CharacterCreationState | undefined>();
  /** Whether recovery data was found in localStorage */
  const [hasRecoveryData, setHasRecoveryData] = useState(false);
  /** Current save operation status for UI feedback */
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  /** localStorage key for this world's character creation data */
  const saveKey = `character-creation-${worldId}`;
  /** Prevents saving before initial data load is complete */
  const hasLoadedRef = useRef(false);
  /** Timeout reference for debounced save operations */
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
  
  /**
   * Updates character creation data and triggers auto-save
   * @param newData - New character creation state to save
   */
  const setData = (newData: CharacterCreationState | undefined) => {
    setDataInternal(newData);
  };
  
  
  /**
   * Legacy field blur handler for API compatibility
   * Auto-save now happens automatically when data changes
   * @deprecated Use automatic saving via setData instead
   */
  const handleFieldBlur = useCallback(() => {
    // No-op: Auto-save happens automatically when data changes
  }, []);
  
  // Restore on mount and when worldId changes
  useEffect(() => {
    // Only load once per worldId
    if (hasLoadedRef.current) return;
    
    const loadData = () => {
      const saved = localStorage.getItem(saveKey);
      if (saved) {
        setHasRecoveryData(true);
        try {
          const parsed = JSON.parse(saved);
          setDataInternal(parsed);
          hasLoadedRef.current = true; // Mark as loaded after setting data
        } catch (e) {
          console.error('[AutoSave] Failed to restore character creation data', e);
          // Keep hasRecoveryData true since data exists, even if corrupted
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
  
  /**
   * Clears all auto-save data and resets state
   * Call this when character creation is completed or cancelled
   */
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
  
  return {
    /** Current character creation data with save metadata */
    data,
    /** Function to update character data (triggers auto-save) */
    setData,
    /** @deprecated Legacy field blur handler - auto-save is now automatic */
    handleFieldBlur,
    /** Function to clear all auto-save data */
    clearAutoSave,
    /** Whether recovery data was detected on mount */
    hasRecoveryData,
    /** Current save status: 'idle' | 'saving' | 'saved' */
    saveStatus
  };
};
