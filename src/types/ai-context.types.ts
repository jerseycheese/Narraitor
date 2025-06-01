// src/types/ai-context.types.ts

import { World } from './world.types';
import { Character } from './character.types';
import { NarrativeSegment } from './narrative.types';
import { GameSession } from './session.types';

/**
 * Context provided to AI for processing
 */
export interface AIContext {
  world: World;
  character: Character;
  recentNarrative: NarrativeSegment[];
  relevantNPCs?: Character[];
  currentObjectives?: string[];
  sessionHistory?: GameSession;
}

/**
 * Context for AI prompt processing
 */
export interface AIPromptContext {
  templateId: string;
  variables: Record<string, unknown>;
  context: AIContext;
  constraints?: AIConstraint[];
}

/**
 * Constraint for AI generation
 */
export interface AIConstraint {
  type: 'tone' | 'content' | 'length' | 'character';
  value: string | number;
  priority: 'required' | 'preferred';
}
