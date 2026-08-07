import type { WorldAttribute } from '@/types/world.types';

/** Minimal NPC shape the narrative templates render into the roster section. */
interface NpcRosterEntry {
  id: string;
  name: string;
  description?: string;
}

/**
 * Subset of narrative context the templates actually read. The generator and tests
 * build this loosely (sometimes partially), so every field is optional and segments
 * are narrowed to the one property templates use.
 */
interface NarrativeTemplateNarrativeContext {
  recentSegments?: Array<{ content?: string }>;
  currentLocation?: string;
  currentSituation?: string;
  currentTags?: string[];
  /** Consecutive segments since the last complication — see computeTurnsSinceComplication */
  turnsSinceComplication?: number;
  importantEntities?: Array<{
    id?: string;
    type?: string;
    name?: string;
    description?: string;
  }>;
}

/** Subset of generation parameters the templates read. */
interface NarrativeTemplateGenerationParameters {
  desiredLength?: 'short' | 'medium' | 'long';
  exampleTokenBudget?: number;
  segmentType?: string;
  decisionWeight?: string;
}

/**
 * The context "bag" passed to narrative prompt templates. Different templates read
 * different subsets, so every field is optional; the generator assembles whichever
 * fields a given template needs (see narrativeGenerator / narrativeGenerator.prompt).
 */
export interface NarrativeTemplateContext {
  worldName?: string;
  worldDescription?: string;
  genre?: string;
  tone?: string;
  attributes?: WorldAttribute[];
  narrativeContext?: NarrativeTemplateNarrativeContext;
  generationParameters?: NarrativeTemplateGenerationParameters;
  /** Opaque to templates — only forwarded/stringified, never field-accessed. */
  toneSettings?: unknown;
  npcRoster?: NpcRosterEntry[];
  characterSkillContext?: string;
  enhancedCharacterContext?: string;
  playerCharacterName?: string;
  playerCharacterBackground?: unknown;
  characterIds?: string[];
  previousContent?: string;
  previousType?: string;
  newLocation?: string;
}
