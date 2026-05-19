/**
 * Auto-save factory — manages periodic and event-based saving of game state to IndexedDB.
 */

import { createIndexedDBStorage } from '@/state/persistence';
import { getUserFriendlyError, isRetryableError } from '@/lib/utils/errorUtils';
import { debounce } from '@/lib/utils/debounce';
import Logger from '@/lib/utils/logger';

export type GameState = {
  session: { id: string; status: string };
  world?: { id: string; name: string };
  character?: unknown;
  narrative?: {
    entries: unknown[];
    currentEntry?: unknown;
  };
  journal?: {
    entries: unknown[];
  };
};

export type StateProvider = () => Promise<GameState>;

export type SaveTriggerReason = 'periodic' | 'player-choice' | 'scene-change' | 'manual';

export type SaveResult = {
  success: boolean;
  timestamp: Date;
  reason: SaveTriggerReason;
  size?: number;
  duration?: number;
  retryable?: boolean;
  userFriendlyMessage?: string;
};

export type AutoSaveOptions = {
  onSave?: (result: SaveResult) => void;
  onSaveStart?: (reason: SaveTriggerReason) => void;
  onError?: (error: Error) => void;
  debounceMs?: number;
};

export interface AutoSave {
  start(): void;
  stop(): void;
  isRunning(): boolean;
  triggerSave(reason: SaveTriggerReason): Promise<void>;
}

const INTERVAL_MS = 5 * 60 * 1000;
const MAX_RETRIES = 3;
const DEFAULT_DEBOUNCE_MS = 500;

function nextRetryDelayMs(attempt: number): number {
  return Math.pow(2, attempt) * 1000;
}

function shouldSkipForInactiveSession(state: GameState, reason: SaveTriggerReason): boolean {
  return state.session.status !== 'active' && reason !== 'manual';
}

function wrapErrorForCaller(error: Error) {
  const userFriendlyError = getUserFriendlyError(error);
  const enhanced = new Error(userFriendlyError.message) as Error & {
    retryable: boolean;
    userFriendlyError: typeof userFriendlyError;
  };
  enhanced.retryable = userFriendlyError.retryable;
  enhanced.userFriendlyError = userFriendlyError;
  return { enhanced, userFriendlyError };
}

export function createAutoSave(
  stateProvider: StateProvider,
  options: AutoSaveOptions = {}
): AutoSave {
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const logger = new Logger('AutoSaveService');
  const storage = createIndexedDBStorage();
  const retryCount = new Map<string, number>();

  let intervalId: NodeJS.Timeout | null = null;
  let running = false;

  async function performSaveWithRetry(
    gameState: GameState,
    reason: SaveTriggerReason,
    startTime: number,
    operationId: string
  ): Promise<void> {
    const currentRetry = retryCount.get(operationId) ?? 0;

    try {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const gameStateStr = JSON.stringify(gameState);
      const size = gameStateStr.length;

      const saveKey = `auto-save-${gameState.session.id}-${Date.now()}`;
      await storage.setItem(saveKey, { state: gameState, version: 1 });

      retryCount.delete(operationId);
      options.onSave?.({
        success: true,
        timestamp: new Date(endTime),
        reason,
        size,
        duration,
      });
    } catch (error) {
      const errorInstance = error as Error;
      const userFriendlyError = getUserFriendlyError(errorInstance);

      if (isRetryableError(errorInstance) && currentRetry < MAX_RETRIES) {
        retryCount.set(operationId, currentRetry + 1);
        logger.warn('Retrying save operation:', {
          attempt: currentRetry + 1,
          maxRetries: MAX_RETRIES,
          error: errorInstance.message,
        });
        setTimeout(() => {
          performSaveWithRetry(gameState, reason, startTime, operationId);
        }, nextRetryDelayMs(currentRetry));
      } else {
        retryCount.delete(operationId);
        throw new Error(`Save failed after ${currentRetry} retries: ${userFriendlyError.message}`);
      }
    }
  }

  async function handleSaveError(error: Error, reason: SaveTriggerReason, operationId: string): Promise<void> {
    const { enhanced, userFriendlyError } = wrapErrorForCaller(error);
    logger.error('Auto-save failed:', {
      reason,
      operationId,
      error: error.message,
      userFriendlyMessage: userFriendlyError.message,
    });
    options.onError?.(enhanced);
  }

  async function performAutoSave(reason: SaveTriggerReason): Promise<void> {
    const operationId = `${reason}-${Date.now()}`;
    const startTime = Date.now();

    try {
      options.onSaveStart?.(reason);
      const gameState = await stateProvider();

      if (shouldSkipForInactiveSession(gameState, reason)) {
        logger.debug('Skipping save - session not active:', gameState.session.status);
        options.onSave?.({
          success: false,
          timestamp: new Date(),
          reason,
        });
        return;
      }

      await performSaveWithRetry(gameState, reason, startTime, operationId);
    } catch (error) {
      await handleSaveError(error as Error, reason, operationId);
    }
  }

  const debouncedSave = debounce(performAutoSave, debounceMs);

  return {
    start(): void {
      if (running) {
        logger.warn('Auto-save service is already running');
        return;
      }
      running = true;
      intervalId = setInterval(() => {
        performAutoSave('periodic');
      }, INTERVAL_MS);

      // Run an immediate save so the first interval isn't delayed for users
      performAutoSave('periodic').catch(error => {
        logger.error('Initial auto-save failed:', error);
      });
    },

    stop(): void {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      debouncedSave.cancel();
      retryCount.clear();
      running = false;
    },

    isRunning(): boolean {
      return running;
    },

    async triggerSave(reason: SaveTriggerReason): Promise<void> {
      if (reason === 'manual') {
        return performAutoSave(reason);
      }
      return debouncedSave(reason);
    },
  };
}
