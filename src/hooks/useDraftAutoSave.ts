import { useState, useCallback, useEffect, useRef } from 'react';
import { getTimestamp } from '@/lib/utils';
import Logger from '@/lib/utils/logger';

const logger = new Logger('UseDraftAutoSave');

const AUTO_SAVE_DEBOUNCE_MS = 300;

export type DraftAutoSaveStatus = 'idle' | 'saving' | 'saved';

interface DraftWithTimestamp {
  lastSaved?: string;
}

export interface UseDraftAutoSaveOptions<TDraft extends DraftWithTimestamp, TPreview> {
  /** localStorage key this draft is saved under. */
  storageKey: string;
  /** Builds a lightweight preview of a restored draft, for the recovery dialog. */
  analyzeRecovery: (data: TDraft) => TPreview;
  /** Whether the given draft has meaningful data that recovering would overwrite. */
  hasCurrentData: (data: TDraft | undefined) => boolean;
  /**
   * Type guard validating a parsed localStorage value has the expected draft shape.
   * A saved value that fails JSON parsing or fails this check is treated as corrupt:
   * it's discarded silently rather than offered for recovery or thrown as an error.
   */
  isValidDraft: (value: unknown) => value is TDraft;
}

export interface UseDraftAutoSaveResult<TDraft, TPreview> {
  data: TDraft | undefined;
  setData: (newData: TDraft | undefined) => void;
  clearAutoSave: () => void;
  dismissRecovery: () => void;
  hasRecoveryData: boolean;
  recoveryPreview: TPreview | undefined;
  hasCurrentData: boolean;
  saveStatus: DraftAutoSaveStatus;
  isLoaded: boolean;
}

/**
 * Generic draft auto-save hook shared by the world and character creation wizards.
 *
 * Debounces writes to localStorage at 300ms, restores a draft on mount, and exposes
 * recovery state for a prompt UI. Each call site configures its own storage key,
 * draft shape, and preview/validation logic rather than duplicating the save/restore
 * mechanics.
 */
export function useDraftAutoSave<TDraft extends DraftWithTimestamp, TPreview>({
  storageKey,
  analyzeRecovery,
  hasCurrentData: hasCurrentDataFn,
  isValidDraft,
}: UseDraftAutoSaveOptions<TDraft, TPreview>): UseDraftAutoSaveResult<TDraft, TPreview> {
  const [data, setDataInternal] = useState<TDraft | undefined>();
  const [hasRecoveryData, setHasRecoveryData] = useState(false);
  const [recoveryPreview, setRecoveryPreview] = useState<TPreview | undefined>();
  const [saveStatus, setSaveStatus] = useState<DraftAutoSaveStatus>('idle');
  const [isLoaded, setIsLoaded] = useState(false);

  const hasLoadedRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Restore on mount. Anything that fails to parse or fails the shape check is
  // treated as a corrupt draft and discarded, never surfaced to the caller.
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);

    if (saved) {
      try {
        const parsed: unknown = JSON.parse(saved);
        if (!isValidDraft(parsed)) {
          throw new Error('Saved draft does not match the expected shape');
        }
        setHasRecoveryData(true);
        setRecoveryPreview(analyzeRecovery(parsed));
        setDataInternal(parsed);
      } catch (error) {
        logger.error('Discarding corrupt draft', storageKey, error);
        localStorage.removeItem(storageKey);
        setHasRecoveryData(false);
        setRecoveryPreview(undefined);
        setDataInternal(undefined);
      }
    } else {
      setHasRecoveryData(false);
      setRecoveryPreview(undefined);
    }

    hasLoadedRef.current = true;
    setIsLoaded(true);
    // storageKey is stable for the lifetime of a given call site; analyzeRecovery/
    // isValidDraft are expected to be stable too, so this only runs once per mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  // Debounced auto-save to localStorage whenever data changes
  useEffect(() => {
    if (!data || !hasLoadedRef.current) return;

    setSaveStatus('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      try {
        const dataWithTimestamp = { ...data, lastSaved: getTimestamp() };
        localStorage.setItem(storageKey, JSON.stringify(dataWithTimestamp));
        setSaveStatus('saved');
      } catch (error) {
        logger.error('Failed to save draft', storageKey, error);
        setSaveStatus('idle');
      }
    }, AUTO_SAVE_DEBOUNCE_MS);
  }, [data, storageKey]);

  // Cleanup pending save on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const setData = useCallback((newData: TDraft | undefined) => {
    if (!hasLoadedRef.current) return;
    setDataInternal(newData);
  }, []);

  const dismissRecovery = useCallback(() => {
    setHasRecoveryData(false);
  }, []);

  const clearAutoSave = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    localStorage.removeItem(storageKey);
    setHasRecoveryData(false);
    setRecoveryPreview(undefined);
    setDataInternal(undefined);
    setSaveStatus('idle');
  }, [storageKey]);

  return {
    data,
    setData,
    clearAutoSave,
    dismissRecovery,
    hasRecoveryData,
    recoveryPreview,
    hasCurrentData: hasCurrentDataFn(data),
    saveStatus,
    isLoaded,
  };
}
