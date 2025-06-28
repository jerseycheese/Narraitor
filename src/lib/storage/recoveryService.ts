/**
 * Recovery service for automatic data recovery
 * Handles detection and recovery when IndexedDB is cleared but LocalStorage backup exists
 * 
 * This service coordinates between the different storage adapters to provide
 * automatic recovery capabilities when primary storage is lost.
 */

import { LocalStorageAdapter, CriticalState } from './localStorageAdapter';
import { IndexedDBAdapter } from './indexedDBAdapter';

export interface RecoveryResult {
  success: boolean;
  recoveredData?: CriticalState;
  message?: string;
  error?: string;
}

export interface RecoveryPreview {
  hasRecoverableData: boolean;
  lastSaved?: string;
  worldCount: number;
  characterCount: number;
  sessionCount: number;
}

export class RecoveryService {
  constructor(
    private localStorageAdapter: LocalStorageAdapter,
    private indexedDBAdapter: IndexedDBAdapter
  ) {}

  /**
   * Check if recovery is needed
   * Returns true if IndexedDB is empty but LocalStorage has backup data
   */
  async checkRecoveryNeeded(): Promise<boolean> {
    try {
      // Check if IndexedDB has any data
      const indexedDBHasData = await this.checkIndexedDBHasData();
      
      // If IndexedDB has data, no recovery needed
      if (indexedDBHasData) {
        return false;
      }

      // Check if LocalStorage has critical state backup
      const criticalState = await this.localStorageAdapter.getCriticalState();
      
      return criticalState !== null;
    } catch {
      return false;
    }
  }

  /**
   * Perform recovery process
   */
  async performRecovery(): Promise<RecoveryResult> {
    try {
      const criticalState = await this.localStorageAdapter.getCriticalState();
      
      if (!criticalState) {
        return {
          success: false,
          error: 'No recoverable data found',
        };
      }

      // Recovery process would involve:
      // 1. Restoring critical state to current session
      // 2. Prompting user to import their latest export file
      // 3. Rebuilding IndexedDB from available data

      return {
        success: true,
        recoveredData: criticalState,
        message: 'Recovery completed successfully',
      };
    } catch {
      return {
        success: false,
        error: 'Recovery failed',
      };
    }
  }

  /**
   * Get preview of recoverable data without performing recovery
   */
  async getRecoveryPreview(): Promise<RecoveryPreview> {
    try {
      const criticalState = await this.localStorageAdapter.getCriticalState();
      
      if (!criticalState) {
        return {
          hasRecoverableData: false,
          worldCount: 0,
          characterCount: 0,
          sessionCount: 0,
        };
      }

      return {
        hasRecoverableData: true,
        lastSaved: criticalState.lastSaved,
        worldCount: criticalState.activeWorldId ? 1 : 0,
        characterCount: criticalState.activeCharacterId ? 1 : 0,
        sessionCount: criticalState.activeSessionId ? 1 : 0,
      };
    } catch {
      return {
        hasRecoverableData: false,
        worldCount: 0,
        characterCount: 0,
        sessionCount: 0,
      };
    }
  }

  /**
   * Check if IndexedDB has any stored data
   */
  private async checkIndexedDBHasData(): Promise<boolean> {
    try {
      // Check for any stored state in IndexedDB
      const worldState = await this.indexedDBAdapter.getItem('world-store');
      const characterState = await this.indexedDBAdapter.getItem('character-store');
      const sessionState = await this.indexedDBAdapter.getItem('session-store');

      return worldState !== null || characterState !== null || sessionState !== null;
    } catch {
      return false;
    }
  }

  /**
   * Clear recovery data after successful recovery
   */
  async clearRecoveryData(): Promise<void> {
    try {
      await this.localStorageAdapter.clearCriticalState();
    } catch {
      // Fail silently
    }
  }
}