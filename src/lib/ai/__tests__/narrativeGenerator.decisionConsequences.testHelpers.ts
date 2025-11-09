/**
 * Shared test helpers for narrativeGenerator decision-consequences tests
 */

import { playerDecisionTracker } from '../playerDecisionTracker';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useAiContextStore } from '@/state/aiContextStore';
import { narrativeTemplateManager } from '../../promptTemplates/narrativeTemplateManager';
import { getLoreContextForPrompt } from '../loreContextHelper';
import { getDetailedToneInstructions } from '../toneSettingsGuidance';
import { PlayerDecision } from '@/types/personalization.types';
import { getTimestamp } from '@/lib/utils/timestamp';
import { createMockWorld, createMockCharacter } from '@/lib/test-utils/testDataFactory';

export { getTimestamp } from '@/lib/utils/timestamp';

// Re-export centralized timer utilities
export { setupTestTimers, cleanupTestTimers } from '@/lib/test-utils/testTimers';

export const mockPlayerDecisionTracker = playerDecisionTracker as jest.Mocked<typeof playerDecisionTracker>;

export const mockWorld = createMockWorld({
  id: 'world-1',
  name: 'Test World',
  description: 'A magical realm',
  genre: 'fantasy',
});

export const mockCharacter = createMockCharacter({
  id: 'char-1',
  name: 'Hero',
  worldId: 'world-1',
  description: 'A brave warrior',
  background: {
    history: 'A brave warrior',
    personality: 'Courageous',
    goals: ['Save the kingdom'],
    fears: ['Failure'],
    relationships: []
  },
});

/**
 * Creates sample past decisions with deterministic timestamps
 */
export function createPastDecisions(): PlayerDecision[] {
  // Set time to 1 day ago for first decision
  jest.setSystemTime(new Date('2025-01-14T12:00:00Z'));
  const oneDayAgo = getTimestamp();

  // Set time to 12 hours ago for second decision
  jest.setSystemTime(new Date('2025-01-15T00:00:00Z'));
  const twelveHoursAgo = getTimestamp();

  // Reset to "now"
  jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));

  return [
    {
      id: 'decision-1',
      prompt: 'An injured merchant lies on the ground. What do you do?',
      sessionId: 'session-1',
      worldId: 'world-1',
      choiceText: 'Help the injured merchant',
      choiceType: 'helpful',
      timestamp: oneDayAgo,
      context: { situation: 'moral dilemma', charactersPresent: ['merchant'] }
    },
    {
      id: 'decision-2',
      prompt: 'Bandits block your path. How do you handle this?',
      sessionId: 'session-1',
      worldId: 'world-1',
      choiceText: 'Negotiate instead of fighting',
      choiceType: 'diplomatic',
      timestamp: twelveHoursAgo,
      context: { situation: 'conflict resolution', charactersPresent: ['bandit leader'] }
    }
  ];
}

/**
 * Sets up all mocks for decision-consequences tests
 */
export function setupDecisionConsequencesMocks(pastDecisions: PlayerDecision[]): void {
  // Mock world store
  (useWorldStore.getState as jest.Mock).mockReturnValue({
    worlds: { 'world-1': mockWorld },
    currentWorldId: 'world-1',
    error: null,
    loading: false
  });

  // Mock character store
  (useCharacterStore.getState as jest.Mock).mockReturnValue({
    characters: { 'char-1': mockCharacter },
    currentCharacterId: 'char-1',
    error: null,
    loading: false
  });

  // Mock aiContext store for goal context
  (useAiContextStore as unknown as { getState: jest.Mock }).getState.mockReturnValue({
    buildContextForSession: jest.fn().mockReturnValue({
      goalContext: null,
      activeGoals: []
    })
  });

  mockPlayerDecisionTracker.getWorldDecisions.mockReturnValue(pastDecisions);
  mockPlayerDecisionTracker.getRelevantDecisions.mockReturnValue(pastDecisions);

  // Mock getRelevantDecisionsWithScores to return decisions with high relevance scores
  mockPlayerDecisionTracker.getRelevantDecisionsWithScores.mockReturnValue(
    pastDecisions.map(decision => ({
      decision,
      relevanceScore: {
        decisionId: decision.id,
        overallScore: 0.8,
        recencyScore: 0.8,
        contextScore: 0.8,
        impactScore: 0.8,
        tagMatchScore: 0.8,
        characterScore: 0.8,
        calculatedAt: getTimestamp()
      }
    }))
  );

  // Mock template manager
  (narrativeTemplateManager.getTemplate as jest.Mock).mockReturnValue(
    (context: { worldName: string; characterIds?: string[] }) =>
      `Generated prompt for ${context.worldName} with ${context.characterIds?.length || 0} characters`
  );

  // Mock lore context helper
  (getLoreContextForPrompt as jest.Mock).mockReturnValue('');

  // Mock tone settings guidance
  (getDetailedToneInstructions as jest.Mock).mockReturnValue('');
}
