import { useState, useCallback, useEffect, useRef } from 'react';
import { EntityID } from '@/types/common.types';
import { getTimestamp } from '@/lib/utils';

import Logger from '@/lib/utils/logger';
const logger = new Logger('UseCharacterCreationAutoSave');

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

interface RecoveryDataPreview {
  name?: string;
  currentStep?: number;
  lastSaved?: string;
  hasAttributes?: boolean;
  hasSkills?: boolean;
  hasBackground?: boolean;
  selectedSkillCount?: number;
  totalAttributePoints?: number;
}

/**
 * Analyzes character data to generate preview information
 */
function analyzeRecoveryData(data: CharacterCreationState): RecoveryDataPreview {
  const preview: RecoveryDataPreview = {
    currentStep: data.currentStep,
    lastSaved: data.lastSaved,
  };

  const characterData = data.characterData as Record<string, unknown> | null;
  if (!characterData) {
    return preview;
  }

  if (typeof characterData.name === 'string') {
    preview.name = characterData.name;
  }

  if (Array.isArray(characterData.attributes)) {
    preview.hasAttributes = characterData.attributes.length > 0;
    preview.totalAttributePoints = characterData.attributes.reduce(
      (sum: number, attr: Record<string, unknown>) => sum + (Number(attr.value) || 0), 0
    );
  }

  if (Array.isArray(characterData.skills)) {
    const selectedSkills = characterData.skills.filter(
      (skill: Record<string, unknown>) => skill.isSelected
    );
    preview.hasSkills = selectedSkills.length > 0;
    preview.selectedSkillCount = selectedSkills.length;
  }

  if (characterData.background && typeof characterData.background === 'object') {
    const bg = characterData.background as Record<string, unknown>;
    preview.hasBackground = !!(
      bg.history || bg.personality || bg.motivation ||
      (Array.isArray(bg.goals) && bg.goals.length > 0)
    );
  }

  return preview;
}

/**
 * Checks if background data has meaningful content
 */
function hasBackgroundData(background: Record<string, unknown>): boolean {
  return !!(background.history || background.personality || background.motivation || 
           (background.goals && Array.isArray(background.goals) && background.goals.length > 0));
}

/**
 * Checks if current data conflicts with recovery data
 */
function hasCurrentFormData(data: CharacterCreationState | undefined): boolean {
  if (!data || !data.characterData) return false;

  const characterData = data.characterData as Record<string, unknown>;

  const hasAttributePoints =
    Array.isArray(characterData.attributes) &&
    characterData.attributes.some((attr: Record<string, unknown>) =>
      Number(attr.value || 0) > Number(attr.minValue || 0)
    );

  const hasSelectedSkill =
    Array.isArray(characterData.skills) &&
    characterData.skills.some((skill: Record<string, unknown>) => skill.isSelected);

  const background =
    characterData.background && typeof characterData.background === 'object'
      ? (characterData.background as Record<string, unknown>)
      : null;

  return !!(
    characterData.name ||
    hasAttributePoints ||
    hasSelectedSkill ||
    (background && hasBackgroundData(background))
  );
}

/**
 * Character Creation Auto-Save Hook
 *
 * Saves character creation progress to localStorage, debounced at 300ms so typing doesn't
 * thrash the write. Detects recoverable data on mount and exposes a save status for UI
 * feedback, plus a manual clear for when creation completes.
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
  /** Preview data for recovery dialog */
  const [recoveryPreview, setRecoveryPreview] = useState<RecoveryDataPreview | undefined>();
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
            lastSaved: getTimestamp() 
          };
          localStorage.setItem(saveKey, JSON.stringify(dataWithTimestamp));
          setSaveStatus('saved');
        } catch (error) {
          logger.error('[AutoSave] Failed to save character creation data', error);
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

  // Restore on mount and when worldId changes
  useEffect(() => {
    // Only load once per worldId
    if (hasLoadedRef.current) return;
    
    const loadData = () => {
      const saved = localStorage.getItem(saveKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setHasRecoveryData(true);
          setRecoveryPreview(analyzeRecoveryData(parsed));
          setDataInternal(parsed);
          hasLoadedRef.current = true; // Mark as loaded after setting data
        } catch (e) {
          logger.error('[AutoSave] Failed to restore character creation data', e);
          setHasRecoveryData(true); // Keep recovery data true since data exists, even if corrupted
          setRecoveryPreview(undefined); // Can't preview corrupted data
          hasLoadedRef.current = true; // Still mark as loaded to prevent retries
        }
      } else {
        setHasRecoveryData(false);
        setRecoveryPreview(undefined);
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
    setRecoveryPreview(undefined);
    setDataInternal(undefined);
    hasLoadedRef.current = false;
    setSaveStatus('idle');
  }, [saveKey]);
  
  return {
    /** Current character creation data with save metadata */
    data,
    /** Function to update character data (triggers auto-save) */
    setData,
    /** Function to clear all auto-save data */
    clearAutoSave,
    /** Whether recovery data was detected on mount */
    hasRecoveryData,
    /** Preview data for recovery dialog */
    recoveryPreview,
    /** Whether current form has meaningful data that would be overwritten */
    hasCurrentData: hasCurrentFormData(data),
    /** Current save status: 'idle' | 'saving' | 'saved' */
    saveStatus
  };
};
