/**
 * Tests for Decision Consequence Error Handling and Edge Cases
 *
 * Verifies that the system handles empty decision history, large decision sets,
 * and other edge cases gracefully.
 */

import { NarrativeGenerator } from '../narrativeGenerator';
import { MockAIClient } from '../../__mocks__/mockAiClient';
import { NarrativeGenerationRequest } from '@/types/narrative.types';
import { PlayerDecision } from '@/types/personalization.types';
import {
  setupTestTimers,
  createPastDecisions,
  setupDecisionConsequencesMocks,
  mockPlayerDecisionTracker,
  getTimestamp
} from './narrativeGenerator.decisionConsequences.testHelpers';

// Mock the store modules
jest.mock('@/state/worldStore', () => ({
  useWorldStore: {
    getState: jest.fn()
  }
}));
jest.mock('@/state/characterStore', () => ({
  useCharacterStore: {
    getState: jest.fn()
  }
}));
jest.mock('@/state/aiContextStore', () => ({
  useAiContextStore: {
    getState: jest.fn()
  }
}));
jest.mock('@/state/inventoryStore', () => ({
  useInventoryStore: {
    getState: jest.fn()
  }
}));
jest.mock('@/state/npcStore', () => ({
  useNPCStore: {
    getState: jest.fn()
  }
}));
jest.mock('../playerDecisionTracker');
jest.mock('../../promptTemplates/narrativeTemplateManager', () => ({
  narrativeTemplateManager: {
    getTemplate: jest.fn()
  }
}));
jest.mock('../loreContextHelper', () => ({
  getLoreContextForPrompt: jest.fn()
}));
jest.mock('../structuredLoreExtractor', () => ({
  extractStructuredLore: jest.fn()
}));
jest.mock('../toneSettingsGuidance', () => ({
  getDetailedToneInstructions: jest.fn()
}));
jest.mock('@/state/loreStore', () => ({
  useLoreStore: {
    getState: jest.fn()
  }
}));

describe('NarrativeGenerator - Decision Consequence Error Handling', () => {
  let narrativeGenerator: NarrativeGenerator;
  let mockAiClient: MockAIClient;
  let pastDecisions: PlayerDecision[];

  beforeEach(() => {
    jest.clearAllMocks();
    setupTestTimers();

    pastDecisions = createPastDecisions();
    mockAiClient = new MockAIClient();
    narrativeGenerator = new NarrativeGenerator(mockAiClient);

    setupDecisionConsequencesMocks(pastDecisions);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('should handle empty decision history gracefully', async () => {
    // When no past decisions exist, should not break
    mockPlayerDecisionTracker.getWorldDecisions.mockReturnValue([]);
    mockPlayerDecisionTracker.getRelevantDecisions.mockReturnValue([]);
    mockPlayerDecisionTracker.getRelevantDecisionsWithScores.mockReturnValue([]);

    const request: NarrativeGenerationRequest = {
      worldId: 'world-1',
      characterIds: ['char-1'],
      sessionId: 'session-1'
    };

    await expect(narrativeGenerator.generateSegment(request)).resolves.toBeDefined();
  });

  test('should limit decision history to prevent prompt overflow', async () => {
    // Create many past decisions with deterministic timestamps
    const manyDecisions = Array.from({ length: 20 }, (_, i) => {
      // Set time to i seconds ago
      const timeAgo = new Date('2025-01-15T12:00:00Z');
      timeAgo.setSeconds(timeAgo.getSeconds() - i);
      jest.setSystemTime(timeAgo);
      const timestamp = getTimestamp();

      return {
        id: `decision-${i}`,
        prompt: `What will you do next? (Decision ${i})`,
        sessionId: 'session-1',
        worldId: 'world-1',
        choiceText: `Choice ${i}`,
        choiceType: 'neutral' as const,
        timestamp,
        context: { situation: 'generic' }
      };
    });

    // Reset to "now"
    jest.setSystemTime(new Date('2025-01-15T12:00:00Z'));

    mockPlayerDecisionTracker.getWorldDecisions.mockReturnValue(manyDecisions);
    mockPlayerDecisionTracker.getRelevantDecisions.mockReturnValue(manyDecisions);
    mockPlayerDecisionTracker.getRelevantDecisionsWithScores.mockReturnValue(
      manyDecisions.map(decision => ({
        decision,
        relevanceScore: {
          decisionId: decision.id,
          overallScore: 0.5,
          recencyScore: 0.5,
          contextScore: 0.5,
          impactScore: 0.5,
          tagMatchScore: 0.5,
          characterScore: 0.5,
          calculatedAt: getTimestamp()
        }
      }))
    );

    const request: NarrativeGenerationRequest = {
      worldId: 'world-1',
      characterIds: ['char-1'],
      sessionId: 'session-1'
    };

    await narrativeGenerator.generateSegment(request);

    const narrativePrompt = mockAiClient.getPrompts()[0];

    // Should include decisions but not overwhelm the prompt
    const decisionMatches = narrativePrompt.match(/Choice \d+/g) || [];
    expect(decisionMatches.length).toBeLessThanOrEqual(10); // Reasonable limit
  });
});
