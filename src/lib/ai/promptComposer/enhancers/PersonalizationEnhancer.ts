/**
 * PersonalizationEnhancer
 *
 * Enhances prompts with personalized character context and decision history
 */

import { PromptEnhancer } from '../types';
import { NarrativeGenerationContext } from '../../narrativeGenerationContext';
import { PersonalizationEngine } from '../../personalizationEngine';
import { DecisionFormatter } from '../../decisionFormatter';
import { CharacterGoal } from '@/types/personalization.types';
import { safeTrim } from '@/lib/utils';
import { summarizeThreadHighlight, describeCharacterRelationship } from '@/lib/utils/worldStateFormatters';

// Prompt guardrails to keep Gemini context predictable
const MAX_OTHER_CHARACTER_THREADS = 3;
const MAX_CROSS_CHARACTER_REFERENCES = 2;
const PROMPT_THREAD_SUMMARY_LENGTH = 160;

export class PersonalizationEnhancer implements PromptEnhancer {
  readonly name = 'PersonalizationEnhancer';

  private personalizationEngine: PersonalizationEngine;
  private decisionFormatter: DecisionFormatter;

  constructor() {
    this.personalizationEngine = new PersonalizationEngine();
    this.decisionFormatter = new DecisionFormatter();
  }

  enhance(prompt: string, context: NarrativeGenerationContext): string {
    try {
      if (!context.playerCharacter) {
        return prompt;
      }

      // Convert goals to CharacterGoal format
      const characterGoals = this.convertToCharacterGoals(context.goals);

      // Convert player character to personalization-compatible format
      const playerCharacter = this.convertToPersonalizationCharacter(context.playerCharacter);

      // Create personalized context
      const personalizedContext = this.personalizationEngine.createPersonalizedContext(
        playerCharacter,
        context.world,
        context.relevantDecisions,
        [], // relationships - future enhancement
        characterGoals,
        [] // narrative history - future enhancement
      );

      // Generate enhancement text
      const enhancementText = this.personalizationEngine.generateNarrativeEnhancement(
        personalizedContext
      );

      // Format decision history with relevance scores
      const decisionHistory = this.formatDecisionHistory(context);

      // Combine enhancement text and decision history
      let enhancedPrompt = prompt;
      if (safeTrim(enhancementText)) {
        enhancedPrompt = `${enhancedPrompt}\n\n${enhancementText}`;
      }
      if (decisionHistory) {
        enhancedPrompt = `${enhancedPrompt}${decisionHistory}`;
      }

      // Add other character context for multi-character worlds
      const otherCharacterContext = context.otherCharacterContext;
      if (otherCharacterContext) {
        enhancedPrompt = `${enhancedPrompt}\n\n${otherCharacterContext}\nWeave these concurrent storylines naturally when they influence the current scene, but avoid forced references.`;
      }

      return enhancedPrompt;
    } catch {
      return prompt;
    }
  }

  private convertToCharacterGoals(narrativeGoals: Array<Record<string, unknown>>): CharacterGoal[] {
    return narrativeGoals.map((goal) => ({
      id: goal.id as string,
      description: (goal.description || goal.title) as string,
      priority: this.mapGoalPriority(goal.priority as string),
      progress: this.calculateGoalProgress(goal),
      establishedAt: goal.createdAt as string,
      isActive: goal.status === 'active',
    }));
  }

  private mapGoalPriority(priority: string): 'primary' | 'secondary' | 'minor' {
    switch (priority) {
      case 'critical':
      case 'high':
        return 'primary';
      case 'medium':
        return 'secondary';
      case 'low':
      default:
        return 'minor';
    }
  }

  private calculateGoalProgress(goal: Record<string, unknown>): number {
    if (goal.status === 'completed') return 100;
    if (goal.status === 'abandoned') return 0;

    const mentionCount = Number(goal.mentionCount) || 0;
    if (mentionCount === 0) return 0;
    if (mentionCount >= 10) return 80;
    if (mentionCount >= 5) return 60;
    if (mentionCount >= 3) return 40;
    return 20;
  }

  private convertToPersonalizationCharacter(storeCharacter: unknown): {
    id: string;
    name: string;
    background: string;
    attributes: Record<string, number> | Array<{ attributeId: string; value: number }>;
    skills: Array<{ name: string; level: number; worldSkillId?: string }> | Array<{ skillId: string; level: number }>;
    createdAt: string;
    updatedAt: string;
  } {
    const char = storeCharacter as Record<string, unknown>;
    return {
      id: String(char.id || ''),
      name: String(char.name || ''),
      background:
        (char.background as { summary?: string })?.summary ||
        String(char.background || ''),
      attributes: (char.attributes as Record<string, number>) || {},
      skills:
        (char.skills as Array<{
          name: string;
          level: number;
          worldSkillId?: string;
        }>) || [],
      createdAt: String(char.createdAt || ''),
      updatedAt: String(char.updatedAt || ''),
    };
  }

  private formatDecisionHistory(context: NarrativeGenerationContext): string {
    if (context.relevantDecisions.length === 0) {
      return '';
    }

    // Format decisions with adaptive detail based on relevance scores
    // For now, use default scores since we don't have them in context
    const fallbackScores = context.relevantDecisions.map(decision => ({
      decisionId: decision.id,
      overallScore: 0.5,
      recencyScore: 0.5,
      contextScore: 0.5,
      impactScore: 0.5,
      tagMatchScore: 0.5,
      characterScore: 0.5,
      calculatedAt: new Date().toISOString()
    }));

    return this.decisionFormatter.formatDecisions(
      context.relevantDecisions,
      fallbackScores,
      1000
    );
  }
}
