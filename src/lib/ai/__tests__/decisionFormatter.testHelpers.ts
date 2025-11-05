/**
 * Test helpers for DecisionFormatter tests
 */

import { PlayerDecision } from '@/types/personalization.types';
import { DecisionRelevanceScore } from '@/types/relevance.types';

export interface TestDecisionInput {
  id: string;
  prompt: string;
  choiceText: string;
  choiceType?: string;
  timestamp?: string;
  location?: string;
  situation?: string;
  charactersPresent?: string[];
}

export interface TestScoreInput {
  decisionId: string;
  overallScore: number;
  recency?: number;
  context?: number;
  impact?: number;
  tagMatch?: number;
  character?: number;
}

/**
 * Creates a test PlayerDecision with sensible defaults
 */
export function createTestDecision(input: TestDecisionInput): PlayerDecision {
  return {
    id: input.id,
    prompt: input.prompt,
    choiceText: input.choiceText,
    choiceType: input.choiceType || 'neutral',
    timestamp: input.timestamp || '2024-01-01T12:00:00Z',
    sessionId: 'sess-1',
    worldId: 'world-1',
    context: {
      ...(input.location && { location: input.location }),
      ...(input.situation && { situation: input.situation }),
      ...(input.charactersPresent && { charactersPresent: input.charactersPresent })
    }
  };
}

/**
 * Creates a test DecisionRelevanceScore with sensible defaults
 */
export function createTestScore(input: TestScoreInput): DecisionRelevanceScore {
  const baseScore = input.overallScore;
  return {
    decisionId: input.decisionId,
    overallScore: input.overallScore,
    recencyScore: input.recency ?? baseScore,
    contextScore: input.context ?? baseScore,
    impactScore: input.impact ?? baseScore,
    tagMatchScore: input.tagMatch ?? baseScore,
    characterScore: input.character ?? baseScore,
    calculatedAt: '2024-01-01T12:00:00Z'
  };
}

/**
 * Creates a high-relevance decision (score >= 0.8)
 */
export function createHighRelevanceDecision() {
  const decision = createTestDecision({
    id: 'dec-high',
    prompt: 'A dragon appears',
    choiceText: 'Negotiate with the dragon',
    choiceType: 'diplomatic',
    location: 'Mountain Peak',
    situation: 'Dragon encounter',
    charactersPresent: ['Dragon', 'Knight']
  });

  const score = createTestScore({
    decisionId: 'dec-high',
    overallScore: 0.85,
    recency: 0.9,
    context: 0.8,
    impact: 0.85,
    tagMatch: 0.8,
    character: 0.9
  });

  return { decision, score };
}

/**
 * Creates a medium-relevance decision (0.4 <= score < 0.8)
 */
export function createMediumRelevanceDecision() {
  const decision = createTestDecision({
    id: 'dec-medium',
    prompt: 'What do you do?',
    choiceText: 'Help the villager',
    choiceType: 'helpful',
    timestamp: '2024-01-01T11:00:00Z',
    location: 'Village Square'
  });

  const score = createTestScore({
    decisionId: 'dec-medium',
    overallScore: 0.55,
    recency: 0.6,
    context: 0.5,
    impact: 0.6,
    tagMatch: 0.5,
    character: 0.5
  });

  return { decision, score };
}

/**
 * Creates a low-relevance decision (score < 0.4)
 */
export function createLowRelevanceDecision() {
  const decision = createTestDecision({
    id: 'dec-low',
    prompt: 'Pick a path',
    choiceText: 'Take the left path',
    choiceType: 'neutral',
    timestamp: '2024-01-01T10:00:00Z',
    location: 'Forest'
  });

  const score = createTestScore({
    decisionId: 'dec-low',
    overallScore: 0.25,
    recency: 0.3,
    context: 0.2,
    impact: 0.25,
    tagMatch: 0.2,
    character: 0.3
  });

  return { decision, score };
}
