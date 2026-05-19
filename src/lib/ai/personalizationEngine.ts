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
  ChoiceTypePreference,
} from '@/types/personalization.types';
import { isPlayerDecisionArray, sanitizeString } from '@/lib/utils/typeGuards';
import { getTimestamp } from '../utils';
import {
  formatAttributesForNarrative,
  formatSkillsForNarrative,
  formatDerivedStatsForNarrative,
} from './attributeSkillFormatter';

// Simple character interface for personalization
interface PersonalizationCharacter {
  id: string;
  name: string;
  background: string;
  attributes:
    | Record<string, number>
    | Array<{ attributeId: string; value: number }>;
  skills:
    | Array<{ name: string; level: number; worldSkillId?: string }>
    | Array<{ skillId: string; level: number }>;
  derivedStats?: Array<{
    name: string;
    currentValue: number;
    maxValue: number;
  }>;
  createdAt: string;
  updatedAt: string;
}

import { World } from '@/types/world.types';

/**
 * PersonalizationEngine - aggregates context for the LLM.
 *
 * Trait inference is delegated to the LLM at narrative-generation time. The
 * raw decision history (including each decision's `choiceType`) is already
 * present in the prompt via `formatDecisions`, so the LLM has everything it
 * needs to infer traits naturally.
 */
export class PersonalizationEngine {
  /**
   * Analyzes player behavior - now just aggregates data for the LLM
   */
  analyzePlayerBehavior(
    character: PersonalizationCharacter,
    decisions: PlayerDecision[],
    relationships: CharacterRelationship[] = [],
    goals: CharacterGoal[] = []
  ): PersonalizationAnalysis {
    if (!isPlayerDecisionArray(decisions)) {
      return this.getDefaultAnalysis();
    }

    const choiceTypeCounts = new Map<ChoiceTypePreference, number>();
    decisions.forEach((d) => {
      choiceTypeCounts.set(
        d.choiceType,
        (choiceTypeCounts.get(d.choiceType) || 0) + 1
      );
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
      lastUpdated: getTimestamp(),
    };

    return {
      detectedTraits: [],
      preferences,
      narrativeEmphasis: {
        characterFocus: [character.background || ''],
        relationshipFocus: relationships,
        goalFocus: goals.filter((g) => g.isActive),
      },
      confidence: decisions.length > 0 ? 75 : 20,
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
    const analysis = this.analyzePlayerBehavior(
      character,
      decisions,
      relationships,
      goals
    );

    return {
      character: {
        personality: analysis.detectedTraits,
        goals: goals.filter((g) => g.isActive),
        relationships,
        recentDecisions: decisions.slice(-10), // Last 10 decisions
        attributes: character.attributes,
        skills: character.skills,
      },
      playerPreferences: analysis.preferences,
      narrativeHistory: {
        keyEvents: narrativeHistory,
        establishedElements: [
          character.name,
          world.name,
          character.background,
        ].filter(Boolean),
        characterMilestones: [],
      },
    };
  }

  /**
   * Generate narrative enhancement by sending structured data to LLM
   * Instead of manually building complex instructions, we let Gemini analyze patterns
   */
  generateNarrativeEnhancement(context: PersonalizedNarrativeContext): string {
    const parts: string[] = [];

    // Character basics
    const characterName = sanitizeString(
      context.narrativeHistory.establishedElements[0]
    );
    if (characterName) {
      parts.push(`CHARACTER: ${characterName}`);
    }

    // Character attributes (notable values only)
    if (context.character.attributes) {
      const attributeString = formatAttributesForNarrative(
        context.character.attributes
      );
      if (attributeString) {
        parts.push(`ATTRIBUTES: ${attributeString}`);
      }
    }

    // Character skills
    if (context.character.skills && context.character.skills.length > 0) {
      const skillString = formatSkillsForNarrative(context.character.skills);
      if (skillString) {
        parts.push(`SKILLS: ${skillString}`);
      }
    }

    // Derived stats (calculated from attributes)
    if (
      context.character.derivedStats &&
      context.character.derivedStats.length > 0
    ) {
      const derivedStatsString = formatDerivedStatsForNarrative(
        context.character.derivedStats
      );
      if (derivedStatsString) {
        parts.push(`DERIVED STATS: ${derivedStatsString}`);
      }
    }

    // Personality traits (if detected)
    if (context.character.personality.length > 0) {
      parts.push(
        `CHARACTER TRAITS: ${context.character.personality.join(', ')}`
      );
    }

    // Active goals (for context)
    if (context.character.goals.length > 0) {
      const goalsList = context.character.goals
        .filter((g) => g.isActive)
        .slice(0, 3)
        .map((g) => `• ${g.description} (${g.priority})`)
        .join('\n');
      parts.push(`ACTIVE GOALS:\n${goalsList}`);
    }

    // Player preferences (minimal guidance)
    const prefs = context.playerPreferences;
    if (prefs.preferredChoiceTypes.length > 0) {
      parts.push(
        `PREFERRED PLAY STYLE: ${prefs.preferredChoiceTypes.slice(0, 2).join(', ')}`
      );
    }

    return parts.join('\n\n');
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
        lastUpdated: getTimestamp(),
      },
      narrativeEmphasis: {
        characterFocus: [],
        relationshipFocus: [],
        goalFocus: [],
      },
      confidence: 0,
    };
  }
}
