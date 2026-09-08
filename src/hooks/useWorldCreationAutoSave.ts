import { useState, useCallback, useEffect, useRef } from 'react';
import { World } from '@/types/world.types';
import { getTimestamp } from '@/lib/utils';
import Logger from '@/lib/utils/logger';
import { AttributeSuggestion, SkillSuggestion } from '@/components/WorldCreationWizard/WizardState';
import { AIGuidanceSource } from '@/lib/constants/worldGuidance';

const logger = new Logger('UseWorldCreationAutoSave');

export const DRAFT_STORAGE_KEY = 'world-creation-draft';

export interface WorldCreationData extends Partial<World> {
  aiSuggestions?: {
    attributes: AttributeSuggestion[];
    skills: SkillSuggestion[];
  };
  aiSuggestionsGenerated?: boolean;
  worldType?: 'original' | 'inspired_by' | 'set_within';
  createdWorldId?: string;
  aiSuggestionMeta?: {
    source: AIGuidanceSource;
    generatedAt?: string;
    descriptionSnapshot?: string;
  };
}

export interface WorldCreationState {
  currentStep: number;
  worldData: WorldCreationData;
  lastSaved?: string;
}

export interface WorldCreationRecoveryPreview {
  name?: string;
  genre?: string;
  description?: string;
  currentStep?: number;
  lastSaved?: string;
  hasAttributes?: boolean;
  hasSkills?: boolean;
  attributeCount?: number;
  skillCount?: number;
}

/**
 * Analyzes world creation draft data to generate preview information
 */
function analyzeRecoveryData(data: WorldCreationState): WorldCreationRecoveryPreview {
  const preview: WorldCreationRecoveryPreview = {
    currentStep: data.currentStep,
    lastSaved: data.lastSaved,
  };

  const worldData = data.worldData;
  if (!worldData) {
    return preview;
  }

  if (typeof worldData.name === 'string' && worldData.name.trim()) {
    preview.name = worldData.name;
  }

  if (typeof worldData.genre === 'string' && worldData.genre.trim()) {
    preview.genre = worldData.genre;
  }

  if (typeof worldData.description === 'string' && worldData.description.trim()) {
    preview.description = worldData.description;
  }

  if (Array.isArray(worldData.attributes) && worldData.attributes.length > 0) {
    preview.hasAttributes = true;
    preview.attributeCount = worldData.attributes.length;
  }

  if (Array.isArray(worldData.skills) && worldData.skills.length > 0) {
    preview.hasSkills = true;
    preview.skillCount = worldData.skills.length;
  }

  return preview;
}

/**
 * Checks if current form has meaningful data
 */
function hasCurrentFormData(data: WorldCreationState | undefined): boolean {
  if (!data || !data.worldData) return false;

  const worldData = data.worldData;

  return !!(
    worldData.name ||
    worldData.genre ||
    worldData.description ||
    (Array.isArray(worldData.attributes) && worldData.attributes.length > 0) ||
    (Array.isArray(worldData.skills) && worldData.skills.length > 0)
  );
}

/**
 * World Creation Auto-Save Hook
 *
 * Saves world creation progress to localStorage under key 'world-creation-draft',
 * debounced at 300ms so typing doesn't thrash writes. Detects recoverable data on mount.
 */
export const useWorldCreationAutoSave = () => {
  const [data, setDataInternal] = useState<WorldCreationState | undefined>();
  const [hasRecoveryData, setHasRecoveryData] = useState(false);
  const [recoveryPreview, setRecoveryPreview] = useState<WorldCreationRecoveryPreview | undefined>();
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const saveKey = DRAFT_STORAGE_KEY;
  const hasLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced auto-save to localStorage whenever data changes
  useEffect(() => {
    if (data && hasLoadedRef.current) {
      setSaveStatus('saving');

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        try {
          const dataWithTimestamp = {
            ...data,
            lastSaved: getTimestamp(),
          };
          localStorage.setItem(saveKey, JSON.stringify(dataWithTimestamp));
          setSaveStatus('saved');
        } catch (error) {
          logger.error('[AutoSave] Failed to save world creation data', error);
          setSaveStatus('idle');
        }
      }, 300);
    }
  }, [data, saveKey]);

  const hasRecoveryDataRef = useRef(false);
  hasRecoveryDataRef.current = hasRecoveryData;

  const setData = useCallback((newData: WorldCreationState | undefined) => {
    if (!hasLoadedRef.current) return;
    setDataInternal(newData);
  }, []);

  // Restore on mount
  useEffect(() => {
    if (hasLoadedRef.current) return;

    const loadData = () => {
      const saved = localStorage.getItem(saveKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setHasRecoveryData(true);
          setRecoveryPreview(analyzeRecoveryData(parsed));
          setDataInternal(parsed);
          hasLoadedRef.current = true;
        } catch (e) {
          logger.error('[AutoSave] Failed to restore world creation data', e);
          setHasRecoveryData(true);
          setRecoveryPreview(undefined);
          hasLoadedRef.current = true;
        }
      } else {
        setHasRecoveryData(false);
        setRecoveryPreview(undefined);
        hasLoadedRef.current = true;
      }
    };

    loadData();

    const timeoutId = setTimeout(loadData, 50);

    return () => clearTimeout(timeoutId);
  }, [saveKey]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const dismissRecovery = useCallback(() => {
    setHasRecoveryData(false);
  }, []);

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
    data,
    setData,
    clearAutoSave,
    dismissRecovery,
    hasRecoveryData,
    recoveryPreview,
    hasCurrentData: hasCurrentFormData(data),
    saveStatus,
    isLoaded: hasLoadedRef.current,
  };
};
