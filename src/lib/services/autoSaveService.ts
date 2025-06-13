/**
 * AutoSaveService - Manages automatic saving of game state
 * Integrates with IndexedDB for persistent storage
 */

import { createIndexedDBStorage } from '@/state/persistence';
import { getUserFriendlyError, isRetryableError } from '@/lib/utils/errorUtils';
import { debounce, type DebouncedFunction } from '@/lib/utils/debounce';
import Logger from '@/lib/utils/logger';

export type GameState = {
  session: { id: string; status: string };
  world?: { id: string; name: string };
  character?: unknown;
  narrative?: unknown;
  journal?: unknown;
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
  onError?: (error: Error) => void;
  debounceMs?: number;
  compressionEnabled?: boolean;
};

/**
 * AutoSaveService handles periodic and event-based auto-saving
 */
export class AutoSaveService {
  private stateProvider: StateProvider;
  private intervalId: NodeJS.Timeout | null = null;
  private isServiceRunning = false;
  private readonly intervalMs = 5 * 60 * 1000; // 5 minutes
  private options: AutoSaveOptions;
  private storage = createIndexedDBStorage();
  private debouncedSave: DebouncedFunction<(reason: SaveTriggerReason) => Promise<void>> | null = null;
  private readonly debounceMs: number;
  private readonly compressionEnabled: boolean;
  private logger: Logger;
  private retryCount = new Map<string, number>();
  private readonly maxRetries = 3;

  constructor(stateProvider: StateProvider, options: AutoSaveOptions = {}) {
    this.stateProvider = stateProvider;
    this.options = options;
    this.debounceMs = options.debounceMs ?? 500; // Default 500ms debounce
    this.compressionEnabled = options.compressionEnabled ?? false;
    this.logger = new Logger('AutoSaveService');
    
    // Create debounced save function
    this.debouncedSave = debounce(this.performAutoSave.bind(this), this.debounceMs);
  }

  /**
   * Start the auto-save service
   */
  start(): void {
    if (this.isServiceRunning) {
      this.logger.warn('Auto-save service is already running');
      return;
    }

    this.logger.info('Starting auto-save service with interval:', this.intervalMs / 1000 / 60, 'minutes');
    this.isServiceRunning = true;
    this.intervalId = setInterval(() => {
      this.performAutoSave('periodic');
    }, this.intervalMs);
  }

  /**
   * Stop the auto-save service
   */
  stop(): void {
    this.logger.info('Stopping auto-save service');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.debouncedSave) {
      this.debouncedSave.cancel();
    }
    
    this.retryCount.clear();
    this.isServiceRunning = false;
  }

  /**
   * Check if the service is currently running
   */
  isRunning(): boolean {
    return this.isServiceRunning;
  }

  /**
   * Trigger a save with debouncing for performance
   */
  async triggerSave(reason: SaveTriggerReason): Promise<void> {
    // For manual saves, execute immediately
    if (reason === 'manual') {
      return this.performAutoSave(reason);
    }

    // For other triggers, use shared debouncing utility
    if (this.debouncedSave) {
      return this.debouncedSave(reason);
    }
    
    // Fallback to immediate execution if debounce not available
    return this.performAutoSave(reason);
  }

  /**
   * Perform auto-save operation with retry logic
   */
  private async performAutoSave(reason: SaveTriggerReason): Promise<void> {
    const operationId = `${reason}-${Date.now()}`;
    const startTime = Date.now();
    
    try {
      this.logger.debug('Starting auto-save operation:', { reason, operationId });
      const gameState = await this.stateProvider();
      
      // Only save if session is active (or if it's a manual save)
      if (gameState.session.status === 'active' || reason === 'manual') {
        await this.performSaveWithRetry(gameState, reason, startTime, operationId);
      } else {
        this.logger.debug('Skipping save - session not active:', gameState.session.status);
      }
    } catch (error) {
      await this.handleSaveError(error as Error, reason, operationId);
    }
  }

  /**
   * Perform save operation with automatic retry logic
   */
  private async performSaveWithRetry(
    gameState: GameState, 
    reason: SaveTriggerReason, 
    startTime: number,
    operationId: string
  ): Promise<void> {
    const currentRetry = this.retryCount.get(operationId) ?? 0;

    try {
      const endTime = Date.now();
      const duration = endTime - startTime;
      const gameStateStr = JSON.stringify(gameState);
      const size = gameStateStr.length;
      
      this.logger.debug('Saving game state:', { size, reason, sessionId: gameState.session.id });
      
      // Save game state to IndexedDB
      const saveKey = `auto-save-${gameState.session.id}-${Date.now()}`;
      
      // Optimize large state objects
      let stateToSave = gameState;
      if (this.compressionEnabled && size > 100000) { // 100KB threshold
        this.logger.info('Compressing large state object:', size, 'bytes');
        // For large states, only save essential data
        stateToSave = {
          session: gameState.session,
          world: gameState.world ? { id: gameState.world.id, name: gameState.world.name } : undefined,
          character: gameState.character,
          // Truncate narrative entries to last 10 for performance
          narrative: gameState.narrative ? {
            ...gameState.narrative,
            entries: Array.isArray(gameState.narrative.entries) 
              ? gameState.narrative.entries.slice(-10)
              : gameState.narrative.entries
          } : undefined,
          journal: gameState.journal,
        };
      }
      
      await this.storage.setItem(saveKey, {
        state: stateToSave,
        version: 1,
      });
      
      // Clear retry count on success
      this.retryCount.delete(operationId);
      
      const result: SaveResult = {
        success: true,
        timestamp: new Date(endTime),
        reason,
        size,
        duration
      };
      
      this.logger.info('Auto-save successful:', { reason, size, duration });
      
      if (this.options.onSave) {
        this.options.onSave(result);
      }
    } catch (error) {
      const errorInstance = error as Error;
      const userFriendlyError = getUserFriendlyError(errorInstance);
      
      if (isRetryableError(errorInstance) && currentRetry < this.maxRetries) {
        this.retryCount.set(operationId, currentRetry + 1);
        this.logger.warn('Retrying save operation:', { 
          attempt: currentRetry + 1, 
          maxRetries: this.maxRetries,
          error: errorInstance.message 
        });
        
        // Exponential backoff: 1s, 2s, 4s
        const retryDelay = Math.pow(2, currentRetry) * 1000;
        setTimeout(() => {
          this.performSaveWithRetry(gameState, reason, startTime, operationId);
        }, retryDelay);
      } else {
        // Max retries exceeded or non-retryable error
        this.retryCount.delete(operationId);
        throw new Error(`Save failed after ${currentRetry} retries: ${userFriendlyError.message}`);
      }
    }
  }

  /**
   * Handle save errors with user-friendly messaging
   */
  private async handleSaveError(error: Error, reason: SaveTriggerReason, operationId: string): Promise<void> {
    const userFriendlyError = getUserFriendlyError(error);
    
    this.logger.error('Auto-save failed:', { 
      reason, 
      operationId,
      error: error.message,
      userFriendlyMessage: userFriendlyError.message
    });
    
    if (this.options.onError) {
      // Enhance error with user-friendly information
      const enhancedError = new Error(userFriendlyError.message);
      (enhancedError as any).retryable = userFriendlyError.retryable;
      (enhancedError as any).userFriendlyError = userFriendlyError;
      
      this.options.onError(enhancedError);
    }
  }
}