/**
 * PersonalizationEngine - Minimal implementation to pass MVP tests
 * Creates personalized narrative context from character and decision data
 */

import { 
  PersonalizedNarrativeContext,
  PersonalizationAnalysis,
  PlayerDecision,
  CharacterGoal,
  CharacterRelationship,
  PlayerPreferences,
  PersonalityTrait,
  ChoiceTypePreference
} from '@/types/personalization.types';
import { Character } from '@/types/character.types';
import { World } from '@/types/world.types';

/**
 * Maps choice types to personality traits
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
 * Engine for creating personalized narrative contexts
 */
export class PersonalizationEngine {
  /**
   * Analyzes player behavior to create personalized narrative context
   */
  analyzePlayerBehavior(
    character: Character,
    world: World,
    decisions: PlayerDecision[],
    relationships: CharacterRelationship[] = [],
    goals: CharacterGoal[] = []
  ): PersonalizationAnalysis {
    const detectedTraits = this.detectPersonalityTraits(decisions);
    const preferences = this.analyzePreferences(decisions);
    
    const narrativeEmphasis = {
      characterFocus: [character.background || ''],
      relationshipFocus: relationships,
      goalFocus: goals.filter(g => g.isActive)
    };

    return {
      detectedTraits,
      preferences,
      narrativeEmphasis,
      confidence: decisions.length > 0 ? 75 : 20
    };
  }

  /**
   * Creates comprehensive personalized context for narrative generation
   */
  createPersonalizedContext(
    character: Character,
    world: World,
    decisions: PlayerDecision[],
    relationships: CharacterRelationship[] = [],
    goals: CharacterGoal[] = [],
    narrativeHistory: string[] = []
  ): PersonalizedNarrativeContext {
    const analysis = this.analyzePlayerBehavior(character, world, decisions, relationships, goals);
    
    // Include skill names in established elements
    const skillNames = character.skills?.map(skill => skill.name) || [];
    
    return {
      character: {
        personality: analysis.detectedTraits,
        goals: goals.filter(g => g.isActive),
        relationships,
        recentDecisions: decisions.slice(0, 5)
      },
      playerPreferences: analysis.preferences,
      narrativeHistory: {
        keyEvents: narrativeHistory,
        establishedElements: [character.name, world.name, character.background, ...skillNames],
        characterMilestones: []
      }
    };
  }

  /**
   * Generates narrative enhancement text based on personalized context
   */
  generateNarrativeEnhancement(context: PersonalizedNarrativeContext): string {
    const enhancements: string[] = [];

    // Add character background details
    const characterName = context.narrativeHistory.establishedElements[0];
    const characterBackground = context.narrativeHistory.establishedElements[2];
    if (characterName && characterName !== 'undefined') {
      enhancements.push(`CHARACTER FOCUS: Reference ${characterName}${characterBackground ? ` as ${characterBackground}` : ''} and their background details.`);
    }

    // Add character skills
    const skills = context.narrativeHistory.establishedElements.slice(3); // Skills start at index 3
    if (skills.length > 0) {
      enhancements.push(`CHARACTER SKILLS: The character has expertise in ${skills.join(', ')}.`);
    }

    // Add character personality
    if (context.character.personality.length > 0) {
      enhancements.push(`CHARACTER PERSONALITY: The character tends to be ${context.character.personality.join(', ')}.`);
    }

    // Add skill references
    if (context.character.recentDecisions.length > 0) {
      const choiceTypes = context.character.recentDecisions.map(d => d.choiceType);
      if (choiceTypes.length > 0) {
        enhancements.push(`DECISION PATTERNS: Player tends to make ${choiceTypes.join(', ')} choices.`);
      }
    }

    // Add narrative style preference
    enhancements.push(`NARRATIVE STYLE: Focus on ${context.playerPreferences.narrativeStyle} elements. Player prefers ${context.playerPreferences.detailLevel} detail level.`);

    return enhancements.join('\n\n');
  }

  /**
   * Detects personality traits from player decisions
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
   * Analyzes player preferences from decisions
   */
  private analyzePreferences(decisions: PlayerDecision[]): PlayerPreferences {
    const choiceTypeCounts = new Map<ChoiceTypePreference, number>();
    
    decisions.forEach(decision => {
      choiceTypeCounts.set(
        decision.choiceType,
        (choiceTypeCounts.get(decision.choiceType) || 0) + 1
      );
    });

    const sortedChoiceTypes = Array.from(choiceTypeCounts.entries())
      .sort(([, a], [, b]) => b - a)
      .map(([type]) => type);

    return {
      narrativeStyle: 'exploration',
      preferredChoiceTypes: sortedChoiceTypes.slice(0, 3),
      detailLevel: 'moderate',
      contentFocus: 'balanced',
      confidenceLevel: Math.min(85, decisions.length * 15),
      lastUpdated: new Date().toISOString()
    };
  }
}