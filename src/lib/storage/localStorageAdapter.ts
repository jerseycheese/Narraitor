/**
 * LocalStorage adapter for critical state backup
 * Provides backup persistence for game state references to survive cache clearing
 * 
 * This adapter stores only critical state references in LocalStorage which has
 * better persistence characteristics than IndexedDB but smaller size limits.
 * It's used as a backup mechanism when IndexedDB is cleared.
 */

export interface CriticalState {
  version: string;
  lastSaved: string;
  activeWorldId: string | null;
  activeCharacterId: string | null;
  activeSessionId: string | null;
  recentExportPath?: string;
}

export class LocalStorageAdapter {
  private readonly CRITICAL_STATE_KEY = 'narraitor-critical-state';
  private readonly VERSION = '1.0.0';

  /**
   * Check if LocalStorage is available
   */
  isAvailable(): boolean {
    try {
      return typeof localStorage !== 'undefined';
    } catch {
      return false;
    }
  }

  /**
   * Store critical state in LocalStorage
   */
  async storeCriticalState(state: Omit<CriticalState, 'version' | 'lastSaved'>): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const criticalState: CriticalState = {
        version: this.VERSION,
        lastSaved: new Date().toISOString(),
        ...state,
      };

      const serialized = JSON.stringify(criticalState);
      
      // Check size (warn if approaching 5MB limit)
      if (serialized.length > 4 * 1024 * 1024) { // 4MB warning threshold
        console.warn('Critical state backup approaching LocalStorage size limit');
      }

      localStorage.setItem(this.CRITICAL_STATE_KEY, serialized);
    } catch (error) {
      // Fail silently to prevent disrupting the application
      console.warn('Failed to store critical state:', error);
    }
  }

  /**
   * Retrieve critical state from LocalStorage
   */
  async getCriticalState(): Promise<CriticalState | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const stored = localStorage.getItem(this.CRITICAL_STATE_KEY);
      if (!stored) {
        return null;
      }

      const parsed = JSON.parse(stored) as CriticalState;
      
      // Validate structure
      if (!parsed.version || !parsed.lastSaved) {
        return null;
      }

      return parsed;
    } catch {
      // Return null for corrupted data
      return null;
    }
  }

  /**
   * Clear critical state from LocalStorage
   */
  async clearCriticalState(): Promise<void> {
    if (!this.isAvailable()) {
      return;
    }

    try {
      localStorage.removeItem(this.CRITICAL_STATE_KEY);
    } catch {
      // Fail silently
    }
  }

  /**
   * Update only specific fields in critical state
   */
  async updateCriticalState(updates: Partial<Omit<CriticalState, 'version' | 'lastSaved'>>): Promise<void> {
    const existing = await this.getCriticalState();
    
    if (existing) {
      await this.storeCriticalState({
        activeWorldId: existing.activeWorldId,
        activeCharacterId: existing.activeCharacterId,
        activeSessionId: existing.activeSessionId,
        recentExportPath: existing.recentExportPath,
        ...updates,
      });
    } else {
      // Create new critical state with defaults
      await this.storeCriticalState({
        activeWorldId: null,
        activeCharacterId: null,
        activeSessionId: null,
        ...updates,
      });
    }
  }
}