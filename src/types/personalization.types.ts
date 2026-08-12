/**
 * Personalization types for enhanced AI narrative generation
 * Supports deep character context and player preference integration
 */

import { EntityID } from './common.types';

/**
 * Types of choices players tend to prefer
 */
export type ChoiceTypePreference =
  | 'diplomatic'
  | 'aggressive'
  | 'stealthy'
  | 'helpful'
  | 'selfish'
  | 'lawful'
  | 'chaotic'
  | 'neutral';

/**
 * Player's goals and motivations
 */
export interface CharacterGoal {
  /** Unique identifier for the goal */
  id: EntityID;
  /** Description of the goal */
  description: string;
  /** Priority level of this goal */
  priority: 'primary' | 'secondary' | 'minor';
  /** Current progress toward this goal */
  progress: number; // 0-100
  /** When this goal was established */
  establishedAt: string;
  /** Whether this goal is still active */
  isActive: boolean;
}

/**
 * Record of a player's decision for pattern analysis
 */
export interface PlayerDecision {
  /** Unique identifier for the decision */
  id: EntityID;
  /** The decision prompt or context */
  prompt: string;
  /** The choice the player made */
  choiceText: string;
  /** Type/category of the choice */
  choiceType: ChoiceTypePreference;
  /** When the decision was made */
  timestamp: string;
  /** Session ID when the decision was made */
  sessionId: EntityID;
  /** World context when decision was made */
  worldId: EntityID;
  /** Narrative context at time of decision */
  context: {
    location?: string;
    situation?: string;
    charactersPresent?: string[];
  };
}

