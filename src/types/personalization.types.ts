/**
 * Personalization types for enhanced AI narrative generation
 * Supports deep character context and player preference integration
 */

import { EntityID } from './common.types';

/**
 * Character personality traits that influence narrative generation
 */
type PersonalityTrait =
  | 'brave'
  | 'cautious'
  | 'curious'
  | 'diplomatic'
  | 'direct'
  | 'empathetic'
  | 'logical'
  | 'impulsive'
  | 'patient'
  | 'stubborn'
  | 'optimistic'
  | 'pessimistic'
  | 'loyal'
  | 'independent'
  | 'ambitious';

/**
 * Types of relationships between characters
 */
type RelationshipType =
  | 'ally'
  | 'rival'
  | 'mentor'
  | 'enemy'
  | 'neutral'
  | 'friend'
  | 'family'
  | 'romantic'
  | 'professional';

/**
 * Player narrative style preferences
 */
type NarrativeStylePreference =
  | 'action-focused'
  | 'character-driven'
  | 'exploration'
  | 'dialogue-heavy'
  | 'mystery'
  | 'strategic';

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
 * Relationship between the player character and NPCs
 */
export interface CharacterRelationship {
  /** ID of the NPC character */
  npcId: EntityID;
  /** Name of the NPC for narrative references */
  npcName: string;
  /** Type of relationship */
  relationshipType: RelationshipType;
  /** Backstory or context about the relationship */
  backstory: string;
  /** Strength of the relationship (1-10) */
  strength: number;
  /** When this relationship was established */
  establishedAt: string;
  /** Last time this relationship was referenced in narrative */
  lastReferencedAt?: string;
}

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

/**
 * Player preferences learned from their decisions and choices
 */
export interface PlayerPreferences {
  /** Preferred narrative style based on engagement patterns */
  narrativeStyle: NarrativeStylePreference;
  /** Types of choices the player tends to make */
  preferredChoiceTypes: ChoiceTypePreference[];
  /** How much detail the player prefers in descriptions */
  detailLevel: 'minimal' | 'moderate' | 'detailed';
  /** Whether player prefers action or dialogue focus */
  contentFocus: 'action' | 'dialogue' | 'balanced';
  /** Confidence level in these preferences (0-100) */
  confidenceLevel: number;
  /** When these preferences were last updated */
  lastUpdated: string;
}

/**
 * Personalized context for narrative generation
 */
export interface PersonalizedNarrativeContext {
  /** Character personality information */
  character: {
    /** Personality traits that influence narrative */
    personality: PersonalityTrait[];
    /** Character's active goals and motivations */
    goals: CharacterGoal[];
    /** Relationships with other characters */
    relationships: CharacterRelationship[];
    /** Recent decisions that inform characterization */
    recentDecisions: PlayerDecision[];
    /** Character attributes for narrative personalization */
    attributes?:
      | Record<string, number>
      | Array<{ attributeId: string; value: number }>;
    /** Character skills for narrative personalization */
    skills?:
      | Array<{ name: string; level: number; worldSkillId?: string }>
      | Array<{ skillId: string; level: number }>;
    /** Derived stats calculated from attributes */
    derivedStats?: Array<{
      name: string;
      currentValue: number;
      maxValue: number;
    }>;
  };
  /** Player preferences and patterns */
  playerPreferences: PlayerPreferences;
  /** Historical context for continuity */
  narrativeHistory: {
    /** Key events that should be referenced */
    keyEvents: string[];
    /** Established narrative elements */
    establishedElements: string[];
    /** Character development milestones */
    characterMilestones: string[];
  };
}

/**
 * Result of personalization analysis
 */
export interface PersonalizationAnalysis {
  /** Detected personality traits from player behavior */
  detectedTraits: PersonalityTrait[];
  /** Identified player preferences */
  preferences: PlayerPreferences;
  /** Key narrative elements to emphasize */
  narrativeEmphasis: {
    /** Character aspects to highlight */
    characterFocus: string[];
    /** Relationship dynamics to explore */
    relationshipFocus: CharacterRelationship[];
    /** Goals to reference or advance */
    goalFocus: CharacterGoal[];
  };
  /** Confidence in the analysis */
  confidence: number;
}
