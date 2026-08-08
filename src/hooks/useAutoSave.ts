/**
 * useAutoSave hook - Provides auto-save functionality for game components
 * 
 * Manages automatic saving of game state with toast notifications for user feedback.
 * Integrates with the toast system to provide visual confirmation of save operations
 * and error notifications when saves fail.
 * 
 * @example
 * ```tsx
 * function GameComponent() {
 *   const autoSave = useAutoSave()
 * 
 *   const handleManualSave = () => {
 *     // Triggers save with success toast
 *     autoSave.triggerSave('manual')
 *   }
 * 
 *   const handleToggleAutoSave = () => {
 *     autoSave.setEnabled(!autoSave.isEnabled)
 *   }
 * 
 *   return (
 *     <div>
 *       <button onClick={handleManualSave}>Save Now</button>
 *       <button onClick={handleToggleAutoSave}>
 *         {autoSave.isEnabled ? 'Disable' : 'Enable'} Auto-Save
 *       </button>
 *       <p>Status: {autoSave.status}</p>
 *     </div>
 *   )
 * }
 * ```
 * 
 * @integration
 * Toast Integration:
 * - Success toasts for manual saves showing save size
 * - Error toasts for failed saves with user-friendly messages
 * - No toasts for automatic saves (non-intrusive)
 * 
 * @hook
 */

import { useEffect, useRef, useCallback } from 'react';
import { useSessionStore } from '@/state/sessionStore';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { getTimestamp } from '@/lib/utils';
import { useJournalStore } from '@/state/journalStore';
import { createAutoSave, AutoSave, SaveTriggerReason, GameState } from '@/lib/services/autoSaveService';
import { useToast } from '@/components/ui/toast';

/**
 * Hook for managing auto-save functionality with toast notifications
 * 
 * Provides auto-save capabilities with user feedback through toast notifications.
 * Handles both automatic and manual saves, with different notification strategies for each.
 * 
 * @returns Object containing auto-save state and control methods
 * @returns {boolean} returns.isEnabled - Whether auto-save is currently enabled
 * @returns {string} returns.status - Current save status ('idle', 'saving', 'error')
 * @returns {string|null} returns.lastSaveTime - ISO string of last successful save
 * @returns {string|null} returns.errorMessage - Error message if save failed
 * @returns {number} returns.totalSaves - Total number of successful saves
 * @returns {boolean} returns.isRunning - Whether auto-save service is actively running
 * @returns {Function} returns.start - Start the auto-save service
 * @returns {Function} returns.stop - Stop the auto-save service
 * @returns {Function} returns.triggerSave - Manually trigger a save
 * @returns {Function} returns.setEnabled - Enable/disable auto-save
 * @returns {Function} returns.retry - Retry failed save operation
 * 
 * @hook
 */
export const useAutoSave = () => {
  const autoSaveState = useSessionStore(state => state.autoSave);
  const sessionStatus = useSessionStore(state => state.status);
  const toast = useToast();
  
  const autoSaveServiceRef = useRef<AutoSave | null>(null);

  // Create state provider function using direct store accessors to avoid re-subscribing
  const stateProvider = useCallback(async (): Promise<GameState> => {
    const sessionState = useSessionStore.getState();
    const worldState = useWorldStore.getState();
    const characterState = useCharacterStore.getState();
    const narrativeState = useNarrativeStore.getState();
    const journalState = useJournalStore.getState();

    return {
      session: {
        id: sessionState.id || 'unknown',
        status: sessionState.status,
      },
      world: sessionState.worldId ? worldState.worlds[sessionState.worldId] : undefined,
      character: sessionState.characterId ? characterState.characters[sessionState.characterId] : undefined,
      narrative: {
        entries: Object.values(narrativeState.segments || {}),
        currentEntry: narrativeState.currentEnding,
      },
      journal: {
        entries: Object.values(journalState.entries || {}),
      },
    };
  }, []);

  // Initialize auto-save service
  useEffect(() => {
    if (!autoSaveServiceRef.current) {
      autoSaveServiceRef.current = createAutoSave(stateProvider, {
        onSaveStart: (reason) => {
          // Manual saves set the status before calling triggerSave
          if (reason !== 'manual') {
            useSessionStore.getState().updateAutoSaveStatus('saving');
          }
        },
        onSave: (result) => {
          if (result.success) {
            const timestamp = getTimestamp();
            setTimeout(() => {
              useSessionStore.getState().recordAutoSave(timestamp);
            }, 150);

            // Show success toast for manual saves only (non-intrusive for auto-saves)
            if (result.reason === 'manual') {
              toast.success(
                'Game saved successfully',
                `Your progress has been saved (${result.size ? Math.round(result.size / 1024) : 0}KB)`
              );
            }
          } else {
            // No changes saved (e.g., session inactive) — reset status to idle
            useSessionStore.getState().updateAutoSaveStatus('idle');
          }
        },
        onError: (error) => {
          // Use enhanced error information if available
          const enhancedError = error as Error & { 
            userFriendlyError?: { message: string } 
          };
          const errorMessage = enhancedError.userFriendlyError?.message || error.message;
          useSessionStore.getState().updateAutoSaveStatus('error', errorMessage);
          
          // Show error toast for all save failures (both manual and automatic)
          toast.error('Save failed', errorMessage);
        },
      });
    }

    return () => {
      if (autoSaveServiceRef.current) {
        autoSaveServiceRef.current.stop();
        autoSaveServiceRef.current = null;
      }
    };
  }, [stateProvider, toast]);

  // Auto-start when session becomes active
  useEffect(() => {
    const service = autoSaveServiceRef.current;
    if (!service) return;

    if (autoSaveState.enabled && sessionStatus === 'active' && !service.isRunning()) {
      service.start();
    }

    // If auto-save is disabled, stop immediately
    if (!autoSaveState.enabled && service.isRunning()) {
      service.stop();
    }
  }, [autoSaveState.enabled, sessionStatus]);

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
      const wasRunning = autoSaveServiceRef.current.isRunning();
      if (!wasRunning) {
        autoSaveServiceRef.current.start();
      }
      useSessionStore.getState().updateAutoSaveStatus('saving');
      const fallbackTimer = setTimeout(() => {
        const currentStatus = useSessionStore.getState().autoSave.status;
        if (currentStatus === 'saving') {
          useSessionStore.getState().updateAutoSaveStatus('idle');
        }
      }, 10000);
      try {
        await autoSaveServiceRef.current.triggerSave(reason);
      } catch (error) {
        useSessionStore.getState().updateAutoSaveStatus('error', error instanceof Error ? error.message : 'Unknown error');
      } finally {
        clearTimeout(fallbackTimer);
        if (!wasRunning) {
          autoSaveServiceRef.current?.stop();
        }
      }
    }
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    useSessionStore.getState().setAutoSaveEnabled(enabled);
    if (!enabled && autoSaveServiceRef.current?.isRunning()) {
      autoSaveServiceRef.current.stop();
    }
  }, []);

  const retry = useCallback(async () => {
    if (autoSaveServiceRef.current && useSessionStore.getState().autoSave.status === 'error') {
      useSessionStore.getState().updateAutoSaveStatus('saving');
      try {
        await autoSaveServiceRef.current.triggerSave('manual');
      } catch {
        // Error will be handled by the service's onError callback
      }
    }
  }, []);

  return {
    // State
    isEnabled: autoSaveState.enabled,
    status: autoSaveState.status,
    lastSaveTime: autoSaveState.lastSaveTime,
    errorMessage: autoSaveState.errorMessage,
    totalSaves: autoSaveState.totalSaves,
    isRunning: autoSaveServiceRef.current?.isRunning() ?? false,
    
    // Actions
    start,
    stop,
    triggerSave,
    setEnabled,
    retry,
  };
};

export type UseAutoSaveReturn = ReturnType<typeof useAutoSave>;
