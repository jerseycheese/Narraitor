/**
 * NarrativeGenerationContext
 *
 * Data-first context object that captures everything needed for narrative generation.
 * Built once per request instead of rebuilding pieces across methods.
 */

import { EntityID } from '@/types/common.types';
import { NarrativeContext, NarrativeGenerationRequest } from '@/types/narrative.types';
import { ToneSettings } from '@/types/tone-settings.types';
import { PlayerDecision } from '@/types/personalization.types';
import { WorldData, CharacterData, NPCData } from './narrativeContextGateway';

/**
 * Complete context for narrative generation
 * Contains all data needed by templates and enhancers
 */
export interface NarrativeGenerationContext {
  // World data
  world: WorldData;
  worldId: EntityID;

  // Character data
  characters: Record<EntityID, CharacterData>;
  characterIds: EntityID[];
  playerCharacter: CharacterData | null;

  // Session data
  sessionId?: EntityID;
  narrativeContext?: NarrativeContext;

  // NPC roster
  npcRoster: NPCData[];

  // Tone and style
  toneSettings: ToneSettings;

  // Personalization data
  relevantDecisions: PlayerDecision[];
  goals: Array<Record<string, unknown>>;
  goalContext?: string;

  // Inventory data
  inventoryItems: Array<unknown>;
  equippedItemIds: string[];

  // Other character context for multi-character worlds
  otherCharacterContext?: string;

  // Lore context
  loreContext: string;

  // Generation parameters
  generationParameters?: NarrativeGenerationRequest['generationParameters'];

  // Template type
  templateType: string;
}

/**
 * Builder for creating NarrativeGenerationContext
 */
export interface ContextBuilder {
  /**
   * Build a complete context from a generation request
   */
  buildContext(
    request: NarrativeGenerationRequest,
    templateType: string
  ): Promise<NarrativeGenerationContext>;

  /**
   * Build context for initial scene generation
   */
  buildInitialSceneContext(
    worldId: EntityID,
    characterIds: EntityID[],
    sessionId?: EntityID
  ): Promise<NarrativeGenerationContext>;
}
