/**
 * useAutoSave hook - Provides auto-save functionality for game components
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '@/state/sessionStore';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useJournalStore } from '@/state/journalStore';
import { AutoSaveService, SaveTriggerReason, GameState } from '@/lib/services/autoSaveService';

/**
 * Hook for managing auto-save functionality
 */
export const useAutoSave = () => {
  const sessionStore = useSessionStore();
  const worldStore = useWorldStore();
  const characterStore = useCharacterStore();
  const narrativeStore = useNarrativeStore();
  const journalStore = useJournalStore();
  
  const autoSaveServiceRef = useRef<AutoSaveService | null>(null);

  // Create state provider function
  const stateProvider = useCallback(async (): Promise<GameState> => {
    return {
      session: {
        id: sessionStore.id || 'unknown',
        status: sessionStore.status,
      },
      world: sessionStore.worldId ? worldStore.entities[sessionStore.worldId] : undefined,
      character: sessionStore.characterId ? characterStore.entities[sessionStore.characterId] : undefined,
      narrative: {
        entries: Object.values(narrativeStore.entries || {}),
        currentEntry: narrativeStore.currentEntry,
      },
      journal: {
        entries: Object.values(journalStore.entries || {}),
      },
    };
  }, [sessionStore, worldStore, characterStore, narrativeStore, journalStore]);

  // Initialize auto-save service
  useEffect(() => {
    if (!autoSaveServiceRef.current) {
      autoSaveServiceRef.current = new AutoSaveService(stateProvider, {
        onSave: (result) => {
          sessionStore.recordAutoSave(result.timestamp.toISOString());
        },
        onError: (error) => {
          // Use enhanced error information if available
          const enhancedError = error as any;
          const errorMessage = enhancedError.userFriendlyError?.message || error.message;
          sessionStore.updateAutoSaveStatus('error', errorMessage);
        },
      });
    }

    return () => {
      if (autoSaveServiceRef.current) {
        autoSaveServiceRef.current.stop();
      }
    };
  }, [stateProvider, sessionStore]);

  // Auto-start when session becomes active
  useEffect(() => {
    if (sessionStore.autoSave.enabled && sessionStore.status === 'active' && autoSaveServiceRef.current) {
      autoSaveServiceRef.current.start();
    }
  }, [sessionStore.autoSave.enabled, sessionStore.status]);

  const start = useCallback(() => {
    if (autoSaveServiceRef.current) {
      autoSaveServiceRef.current.start();
    }
  }, []);

  const stop = useCallback(() => {
    if (autoSaveServiceRef.current) {
      autoSaveServiceRef.current.stop();
    }
  }, []);

  const triggerSave = useCallback(async (reason: SaveTriggerReason) => {
    if (autoSaveServiceRef.current) {
      sessionStore.updateAutoSaveStatus('saving');
      try {
        await autoSaveServiceRef.current.triggerSave(reason);
      } catch (error) {
        sessionStore.updateAutoSaveStatus('error', error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }, [sessionStore]);

  const setEnabled = useCallback((enabled: boolean) => {
    sessionStore.setAutoSaveEnabled(enabled);
    if (!enabled && autoSaveServiceRef.current) {
      autoSaveServiceRef.current.stop();
    } else if (enabled && sessionStore.status === 'active' && autoSaveServiceRef.current) {
      autoSaveServiceRef.current.start();
    }
  }, [sessionStore]);

  const retry = useCallback(async () => {
    if (autoSaveServiceRef.current && sessionStore.autoSave.status === 'error') {
      sessionStore.updateAutoSaveStatus('saving');
      try {
        await autoSaveServiceRef.current.triggerSave('manual');
      } catch (error) {
        // Error will be handled by the service's onError callback
      }
    }
  }, [sessionStore]);

  return {
    // State
    isEnabled: sessionStore.autoSave.enabled,
    status: sessionStore.autoSave.status,
    lastSaveTime: sessionStore.autoSave.lastSaveTime,
    errorMessage: sessionStore.autoSave.errorMessage,
    totalSaves: sessionStore.autoSave.totalSaves,
    isRunning: autoSaveServiceRef.current?.isRunning() ?? false,
    
    // Actions
    start,
    stop,
    triggerSave,
    setEnabled,
    retry,
  };
};