/**
 * Export/Import service for full game state backup
 * Provides functionality to export complete game state to files and import them back
 * 
 * This service handles the creation of downloadable backup files and validation
 * of imported game state to ensure data integrity.
 */

import { useWorldStore } from '../../state/worldStore';
import { useCharacterStore } from '../../state/characterStore';
import { useSessionStore } from '../../state/sessionStore';
import { useJournalStore } from '../../state/journalStore';
import { useNarrativeStore } from '../../state/narrativeStore';
import { validateWorld } from '../../types/type-guards';
import { getTimestamp } from '../utils';


export interface GameStateExport {
  version: string;
  exportedAt: string;
  worldState: unknown;
  characterState: unknown;
  sessionState: unknown;
  journalState?: unknown;
  narrativeState?: unknown;
}

export interface ExportResult {
  success: boolean;
  data?: GameStateExport;
  error?: string;
}

export interface ImportResult {
  success: boolean;
  message?: string;
  error?: string;
}

export class ExportService {
  private readonly CURRENT_VERSION = '1.0.0';
  private readonly COMPATIBLE_VERSIONS = ['1.0.0'];

  /**
   * Export complete game state
   */
  async exportGameState(): Promise<ExportResult> {
    try {
      const gameState: GameStateExport = {
        version: this.CURRENT_VERSION,
        exportedAt: getTimestamp(),
        worldState: useWorldStore.getState(),
        characterState: useCharacterStore.getState(),
        sessionState: useSessionStore.getState(),
        journalState: useJournalStore.getState(),
        narrativeState: useNarrativeStore.getState(),
      };

      return {
        success: true,
        data: gameState,
      };
    } catch {
      return {
        success: false,
        error: 'Failed to export game state',
      };
    }
  }

  /**
   * Create and download a game state file
   */
  async downloadGameState(): Promise<void> {
    const exportResult = await this.exportGameState();
    
    if (!exportResult.success || !exportResult.data) {
      throw new Error(exportResult.error || 'Export failed');
    }

    const json = JSON.stringify(exportResult.data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const filename = `narraitor-save-${getTimestamp().split('T')[0]}.json`;

    const element = document.createElement('a');
    element.setAttribute('href', url);
    element.setAttribute('download', filename);
    element.style.display = 'none';
    
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Import game state from data object
   */
  async importGameState(gameState: unknown): Promise<ImportResult> {
    try {
      const validationResult = this.validateGameState(gameState);
      
      if (!validationResult.valid) {
        return {
          success: false,
          error: validationResult.error,
        };
      }

      // Import data into stores - cast to GameStateExport after validation
      const validatedGameState = gameState as GameStateExport;
      
      // Use the underlying Zustand setState method if available
      if (validatedGameState.worldState) {
        useWorldStore.setState(validatedGameState.worldState);
      }
      
      if (validatedGameState.characterState) {
        useCharacterStore.setState(validatedGameState.characterState);
      }
      
      if (validatedGameState.sessionState) {
        useSessionStore.setState(validatedGameState.sessionState);
      }
      
      if (validatedGameState.journalState) {
        useJournalStore.setState(validatedGameState.journalState);
      }
      
      if (validatedGameState.narrativeState) {
        useNarrativeStore.setState(validatedGameState.narrativeState);
      }

      return {
        success: true,
        message: 'Game state imported successfully',
      };
    } catch {
      return {
        success: false,
        error: 'Failed to import game state',
      };
    }
  }

  /**
   * Import game state from file
   */
  async importFromFile(file: File): Promise<ImportResult> {
    try {
      const text = await file.text();
      const gameState = JSON.parse(text);
      
      return await this.importGameState(gameState);
    } catch {
      return {
        success: false,
        error: 'Invalid JSON file',
      };
    }
  }

  /**
   * Validate game state structure and version
   */
  private validateGameState(gameState: unknown): { valid: boolean; error?: string } {
    if (!gameState || typeof gameState !== 'object') {
      return { valid: false, error: 'Invalid game state format' };
    }

    const state = gameState as Record<string, unknown>;

    if (!state.version) {
      return { valid: false, error: 'Invalid game state format' };
    }

    if (!this.COMPATIBLE_VERSIONS.includes(state.version as string)) {
      return { valid: false, error: 'Incompatible save file version' };
    }

    if (!state.exportedAt) {
      return { valid: false, error: 'Invalid game state format' };
    }

    // Basic structure validation
    const requiredFields = ['worldState', 'characterState', 'sessionState'];
    for (const field of requiredFields) {
      if (!state[field]) {
        return { valid: false, error: 'Invalid game state format' };
      }
    }

    // Validate world data if present
    if (state.worldState && typeof state.worldState === 'object') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const worldState = state.worldState as any;
      if (worldState.worlds && typeof worldState.worlds === 'object') {
        for (const [worldId, worldData] of Object.entries(worldState.worlds)) {
          const validation = validateWorld(worldData);
          if (!validation.valid) {
            return { 
              valid: false, 
              error: `Invalid world data for ${worldId}: ${validation.errors[0]}` 
            };
          }
        }
      }
    }

    return { valid: true };
  }

  /**
   * Get export file size estimate
   */
  async getExportSize(): Promise<number> {
    const exportResult = await this.exportGameState();
    
    if (!exportResult.success || !exportResult.data) {
      return 0;
    }

    const json = JSON.stringify(exportResult.data);
    return new Blob([json]).size;
  }
}