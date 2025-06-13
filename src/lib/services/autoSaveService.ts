/**
 * AutoSaveService - Manages automatic saving of game state
 * Integrates with IndexedDB for persistent storage
 */

import { createIndexedDBStorage } from '@/state/persistence';

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
  private debounceTimeoutId: NodeJS.Timeout | null = null;
  private readonly debounceMs: number;
  private readonly compressionEnabled: boolean;

  constructor(stateProvider: StateProvider, options: AutoSaveOptions = {}) {
    this.stateProvider = stateProvider;
    this.options = options;
    this.debounceMs = options.debounceMs ?? 500; // Default 500ms debounce
    this.compressionEnabled = options.compressionEnabled ?? false;
  }

  /**
   * Start the auto-save service
   */
  start(): void {
    if (this.isServiceRunning) {
      return;
    }

    this.isServiceRunning = true;
    this.intervalId = setInterval(() => {
      this.performAutoSave('periodic');
    }, this.intervalMs);
  }

  /**
   * Stop the auto-save service
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    if (this.debounceTimeoutId) {
      clearTimeout(this.debounceTimeoutId);
      this.debounceTimeoutId = null;
    }
    
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

    // For other triggers, use debouncing to prevent excessive saves
    if (this.debounceTimeoutId) {
      clearTimeout(this.debounceTimeoutId);
    }

    return new Promise((resolve, reject) => {
      this.debounceTimeoutId = setTimeout(async () => {
        try {
          await this.performAutoSave(reason);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, this.debounceMs);
    });
  }

  /**
   * Perform auto-save operation
   */
  private async performAutoSave(reason: SaveTriggerReason): Promise<void> {
    const startTime = Date.now();
    
    try {
      const gameState = await this.stateProvider();
      
      // Only save if session is active (or if it's a manual save)
      if (gameState.session.status === 'active' || reason === 'manual') {
        const endTime = Date.now();
        const duration = endTime - startTime;
        const gameStateStr = JSON.stringify(gameState);
        const size = gameStateStr.length;
        
        // Save game state to IndexedDB
        const saveKey = `auto-save-${gameState.session.id}-${Date.now()}`;
        
        // Optimize large state objects
        let stateToSave = gameState;
        if (this.compressionEnabled && size > 100000) { // 100KB threshold
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
        
        const result: SaveResult = {
          success: true,
          timestamp: new Date(endTime),
          reason,
          size,
          duration
        };
        
        if (this.options.onSave) {
          this.options.onSave(result);
        }
      }
    } catch (error) {
      console.error('Auto-save failed:', error);
      if (this.options.onError) {
        this.options.onError(error as Error);
      }
    }
  }
}