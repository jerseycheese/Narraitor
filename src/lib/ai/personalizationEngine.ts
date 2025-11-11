/**
 * PersonalizationEngine - AI-Driven Narrative Personalization
 *
 * Simplified approach: Send raw decision history to Gemini and let the LLM
 * infer patterns instead of manually calculating heuristics.
 *
 * Key Features:
 * - Lightweight decision normalization
 * - Direct LLM-based pattern inference
 * - Secure input validation
 */

import {
  PersonalizedNarrativeContext,
  PersonalizationAnalysis,
  PlayerDecision,
  CharacterGoal,
  CharacterRelationship,
  PlayerPreferences,
  PersonalityTrait,
  ChoiceTypePreference,
} from '@/types/personalization.types';
import {
  isPlayerDecisionArray,
  sanitizeString
} from '@/types/type-guards';
import { getTimestamp } from '../utils';

// Simple character interface for personalization
interface PersonalizationCharacter {
  id: string;
  name: string;
  background: string;
  attributes: Record<string, number> | Array<{ attributeId: string; value: number }>;
  skills: Array<{ name: string; level: number; worldSkillId?: string }> | Array<{ skillId: string; level: number }>;
  createdAt: string;
  updatedAt: string;
}

import { World } from '@/types/world.types';

/**
 * Maps choice types to personality traits (kept for basic trait inference)
 */
const CHOICE_TO_TRAIT_MAP: Record<ChoiceTypePreference, PersonalityTrait[]> = {
  diplomatic: ['diplomatic', 'patient', 'empathetic'],
  aggressive: ['direct', 'impulsive', 'brave'],
  stealthy: ['cautious', 'patient', 'logical'],
  helpful: ['empathetic', 'loyal', 'optimistic'],
  selfish: ['independent', 'ambitious', 'direct'],
  lawful: ['loyal', 'patient', 'logical'],
  chaotic: ['impulsive', 'independent', 'brave'],
  neutral: ['logical', 'cautious', 'diplomatic']
};

/**
 * PersonalizationEngine - Let the LLM do the heavy lifting
 */
export class PersonalizationEngine {
  /**
   * Analyzes player behavior - now just aggregates data for the LLM
   */
  analyzePlayerBehavior(
    character: PersonalizationCharacter,
    world: World,
    decisions: PlayerDecision[],
    relationships: CharacterRelationship[] = [],
    goals: CharacterGoal[] = []
  ): PersonalizationAnalysis {
    if (!isPlayerDecisionArray(decisions)) {
      return this.getDefaultAnalysis();
    }

    // Simple trait detection (kept minimal for UI display)
    const detectedTraits = this.detectPersonalityTraits(decisions);

    // Basic preference aggregation
    const choiceTypeCounts = new Map<ChoiceTypePreference, number>();
    decisions.forEach(d => {
      choiceTypeCounts.set(d.choiceType, (choiceTypeCounts.get(d.choiceType) || 0) + 1);
    });

    const preferredChoiceTypes = Array.from(choiceTypeCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([type]) => type)
      .slice(0, 3);

    const preferences: PlayerPreferences = {
      narrativeStyle: 'exploration',
      preferredChoiceTypes,
      detailLevel: 'moderate',
      contentFocus: 'balanced',
      confidenceLevel: Math.min(85, decisions.length * 15),
      lastUpdated: getTimestamp()
    };

    return {
      detectedTraits,
      preferences,
      narrativeEmphasis: {
        characterFocus: [character.background || ''],
        relationshipFocus: relationships,
        goalFocus: goals.filter(g => g.isActive)
      },
      confidence: decisions.length > 0 ? 75 : 20
    };
  }

  /**
   * Creates personalized context for narrative generation
   */
  createPersonalizedContext(
    character: PersonalizationCharacter,
    world: World,
    decisions: PlayerDecision[],
    relationships: CharacterRelationship[] = [],
    goals: CharacterGoal[] = [],
    narrativeHistory: string[] = []
  ): PersonalizedNarrativeContext {
    const analysis = this.analyzePlayerBehavior(character, world, decisions, relationships, goals);

    return {
      character: {
        personality: analysis.detectedTraits,
        goals: goals.filter(g => g.isActive),
        relationships,
        recentDecisions: decisions.slice(-10) // Last 10 decisions
      },
      playerPreferences: analysis.preferences,
      narrativeHistory: {
        keyEvents: narrativeHistory,
        establishedElements: [character.name, world.name, character.background].filter(Boolean),
        characterMilestones: []
      }
    };
  }

  /**
   * Generate narrative enhancement by sending structured data to LLM
   * Instead of manually building complex instructions, we let Gemini analyze patterns
   */
  generateNarrativeEnhancement(context: PersonalizedNarrativeContext): string {
    const parts: string[] = [];

    // Character basics
    const characterName = sanitizeString(context.narrativeHistory.establishedElements[0]);
    if (characterName) {
      parts.push(`CHARACTER: ${characterName}`);
    }

    // Recent decisions (raw data for LLM to analyze)
    if (context.character.recentDecisions.length > 0) {
      const decisionList = context.character.recentDecisions
        .slice(0, 5)
        .map(d => {
          const location = d.context?.location ? ` at ${d.context.location}` : '';
          const npcs = d.context?.charactersPresent?.length
            ? ` (with: ${d.context.charactersPresent.join(', ')})`
            : '';
          return `• ${d.choiceText}${location}${npcs} [${d.choiceType}]`;
        })
        .join('\n');

      parts.push(`RECENT PLAYER DECISIONS:\n${decisionList}\n\nBased on these decisions, adapt the narrative to match the player's style and reference past choices where relevant.`);
    }

    // Personality traits (if detected)
    if (context.character.personality.length > 0) {
      parts.push(`CHARACTER TRAITS: ${context.character.personality.join(', ')}`);
    }

    // Active goals (for context)
    if (context.character.goals.length > 0) {
      const goalsList = context.character.goals
        .filter(g => g.isActive)
        .slice(0, 3)
        .map(g => `• ${g.description} (${g.priority})`)
        .join('\n');
      parts.push(`ACTIVE GOALS:\n${goalsList}`);
    }

    // Player preferences (minimal guidance)
    const prefs = context.playerPreferences;
    if (prefs.preferredChoiceTypes.length > 0) {
      parts.push(`PREFERRED PLAY STYLE: ${prefs.preferredChoiceTypes.slice(0, 2).join(', ')}`);
    }

    return parts.join('\n\n');
  }

  /**
   * Simple trait detection from choice types
   */
  private detectPersonalityTraits(decisions: PlayerDecision[]): PersonalityTrait[] {
    const traitCounts = new Map<PersonalityTrait, number>();

    decisions.forEach(decision => {
      const traits = CHOICE_TO_TRAIT_MAP[decision.choiceType] || [];
      traits.forEach(trait => {
        traitCounts.set(trait, (traitCounts.get(trait) || 0) + 1);
      });
    });

    return Array.from(traitCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([trait]) => trait);
  }

  /**
   * Default analysis for empty/invalid input
   */
  private getDefaultAnalysis(): PersonalizationAnalysis {
    return {
      detectedTraits: [],
      preferences: {
        narrativeStyle: 'exploration',
        preferredChoiceTypes: [],
        detailLevel: 'moderate',
        contentFocus: 'balanced',
        confidenceLevel: 0,
        lastUpdated: getTimestamp()
      },
      narrativeEmphasis: {
        characterFocus: [],
        relationshipFocus: [],
        goalFocus: []
      },
      confidence: 0
    };
  }
}
