/**
 * Export/Import helpers for full game state backup.
 * Stateless functions that read from and write to the Zustand stores.
 */

import { useWorldStore, WorldStore } from '../../state/worldStore';
import { useCharacterStore, CharacterStore } from '../../state/characterStore';
import { useSessionStore } from '../../state/sessionStore';
import { useJournalStore } from '../../state/journalStore';
import { useNarrativeStore } from '../../state/narrativeStore';
import { useInventoryStore } from '../../state/inventoryStore';
import { useLoreStore } from '../../state/loreStore';
import { useGoalStore } from '../../state/goalStore';
import { useWorldThreadStore } from '../../state/worldThreadStore';
import { useNPCStore } from '../../state/npcStore';
import { validateWorld } from '@/lib/utils/typeGuards';
import { getTimestamp } from '../utils';

const CURRENT_VERSION = '1.0.0';
const COMPATIBLE_VERSIONS = ['1.0.0'];

interface GameStateExport {
  version: string;
  exportedAt: string;
  worldState: unknown;
  characterState: unknown;
  sessionState: unknown;
  journalState?: unknown;
  narrativeState?: unknown;
  inventoryState?: unknown;
  loreState?: unknown;
  goalState?: unknown;
  worldThreadState?: unknown;
  npcState?: unknown;
}

interface ExportResult {
  success: boolean;
  data?: GameStateExport;
  error?: string;
}

export interface ImportResult {
  success: boolean;
  message?: string;
  error?: string;
}

export async function exportGameState(): Promise<ExportResult> {
  try {
    // inventoryStore carries transient Set/Map fields (generatingImageFor,
    // imageGenerationErrors) that JSON.stringify turns into {} and that the
    // store later rebuilds via new Set()/new Map() — exporting them would throw
    // on re-import. Export only the durable fields (its persist partialize set).
    const inventory = useInventoryStore.getState();

    const gameState: GameStateExport = {
      version: CURRENT_VERSION,
      exportedAt: getTimestamp(),
      worldState: useWorldStore.getState(),
      characterState: useCharacterStore.getState(),
      sessionState: useSessionStore.getState(),
      journalState: useJournalStore.getState(),
      narrativeState: useNarrativeStore.getState(),
      inventoryState: {
        items: inventory.items,
        entities: inventory.entities,
        characterInventories: inventory.characterInventories,
      },
      loreState: useLoreStore.getState(),
      goalState: useGoalStore.getState(),
      worldThreadState: useWorldThreadStore.getState(),
      npcState: useNPCStore.getState(),
    };

    return { success: true, data: gameState };
  } catch {
    return { success: false, error: 'Failed to export game state' };
  }
}

export async function downloadGameState(): Promise<void> {
  const exportResult = await exportGameState();

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

async function importGameState(gameState: unknown): Promise<ImportResult> {
  try {
    const validationResult = validateGameState(gameState);

    if (!validationResult.valid) {
      return { success: false, error: validationResult.error };
    }

    const validatedGameState = gameState as GameStateExport;

    if (validatedGameState.worldState) {
      const incomingState = validatedGameState.worldState as Partial<WorldStore> &
        Record<string, unknown>;
      const normalizedWorldState: Partial<WorldStore> = { ...incomingState };

      if (!normalizedWorldState.entities && normalizedWorldState.worlds) {
        normalizedWorldState.entities = { ...normalizedWorldState.worlds };
      }

      if (normalizedWorldState.currentWorldId && !normalizedWorldState.currentEntityId) {
        normalizedWorldState.currentEntityId = normalizedWorldState.currentWorldId;
      }

      if (normalizedWorldState.currentEntityId && !normalizedWorldState.currentWorldId) {
        normalizedWorldState.currentWorldId = normalizedWorldState.currentEntityId;
      }

      useWorldStore.setState(normalizedWorldState);
    }

    if (validatedGameState.characterState) {
      const incomingCharacterState = validatedGameState.characterState as Partial<CharacterStore> &
        Record<string, unknown>;
      const normalizedCharacterState: Partial<CharacterStore> = { ...incomingCharacterState };

      if (!normalizedCharacterState.entities && normalizedCharacterState.characters) {
        normalizedCharacterState.entities = { ...normalizedCharacterState.characters };
      }

      if (
        typeof normalizedCharacterState.currentCharacterId === 'string' &&
        !normalizedCharacterState.currentEntityId
      ) {
        normalizedCharacterState.currentEntityId = normalizedCharacterState.currentCharacterId;
      }

      if (
        typeof normalizedCharacterState.currentEntityId === 'string' &&
        !normalizedCharacterState.currentCharacterId
      ) {
        normalizedCharacterState.currentCharacterId = normalizedCharacterState.currentEntityId;
      }

      useCharacterStore.setState(normalizedCharacterState);
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

    if (validatedGameState.inventoryState) {
      useInventoryStore.setState(validatedGameState.inventoryState);
    }

    if (validatedGameState.loreState) {
      useLoreStore.setState(validatedGameState.loreState);
    }

    if (validatedGameState.goalState) {
      useGoalStore.setState(validatedGameState.goalState);
    }

    if (validatedGameState.worldThreadState) {
      useWorldThreadStore.setState(validatedGameState.worldThreadState);
    }

    if (validatedGameState.npcState) {
      useNPCStore.setState(validatedGameState.npcState);
    }

    return { success: true, message: 'Game state imported successfully' };
  } catch {
    return { success: false, error: 'Failed to import game state' };
  }
}

export async function importFromFile(file: File): Promise<ImportResult> {
  try {
    const text = await file.text();
    const gameState = JSON.parse(text);
    return await importGameState(gameState);
  } catch {
    return { success: false, error: 'Invalid JSON file' };
  }
}

function validateGameState(gameState: unknown): { valid: boolean; error?: string } {
  if (!gameState || typeof gameState !== 'object') {
    return { valid: false, error: 'Invalid game state format' };
  }

  const state = gameState as Record<string, unknown>;

  if (!state.version) {
    return { valid: false, error: 'Invalid game state format' };
  }

  if (!COMPATIBLE_VERSIONS.includes(state.version as string)) {
    return { valid: false, error: 'Incompatible save file version' };
  }

  if (!state.exportedAt) {
    return { valid: false, error: 'Invalid game state format' };
  }

  const requiredFields = ['worldState', 'characterState', 'sessionState'];
  for (const field of requiredFields) {
    if (!state[field]) {
      return { valid: false, error: 'Invalid game state format' };
    }
  }

  if (state.worldState && typeof state.worldState === 'object') {
    const worldState = state.worldState as Record<string, unknown>;
    if (worldState.worlds && typeof worldState.worlds === 'object') {
      for (const [worldId, worldData] of Object.entries(worldState.worlds)) {
        const validation = validateWorld(worldData);
        if (!validation.valid) {
          return {
            valid: false,
            error: `Invalid world data for ${worldId}: ${validation.errors[0]}`,
          };
        }
      }
    }
  }

  return { valid: true };
}
