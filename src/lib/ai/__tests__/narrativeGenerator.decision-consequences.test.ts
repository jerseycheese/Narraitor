/**
 * TDD Tests for Issue #210: Make player decisions have meaningful story consequences
 * 
 * These tests verify that the AI narrative generation system actually uses past
 * player decisions to influence story content, not just collects them.
 */

import { NarrativeGenerator } from '../narrativeGenerator';
import { playerDecisionTracker } from '../playerDecisionTracker';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useAiContextStore } from '@/state/aiContextStore';
import { MockAIClient } from '../../__mocks__/mockAiClient';
import { NarrativeGenerationRequest } from '@/types/narrative.types';
import { PlayerDecision } from '@/types/personalization.types';
import { narrativeTemplateManager } from '../../promptTemplates/narrativeTemplateManager';
import { getLoreContextForPrompt } from '../loreContextHelper';
import { getDetailedToneInstructions } from '../toneSettingsGuidance';

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

const mockPlayerDecisionTracker = playerDecisionTracker as jest.Mocked<typeof playerDecisionTracker>;

describe('NarrativeGenerator - Decision Consequences (Issue #210)', () => {
  let narrativeGenerator: NarrativeGenerator;
  let mockAiClient: MockAIClient;

  const mockWorld = {
    id: 'world-1',
    name: 'Test World',
    theme: 'Fantasy Adventure',
    description: 'A magical realm',
    attributes: [],
    skills: [],
    settings: { maxAttributes: 6, maxSkills: 10, attributePointPool: 30, skillPointPool: 50 }
  };

  const mockCharacter = {
    id: 'char-1',
    name: 'Hero',
    worldId: 'world-1',
    background: { description: 'A brave warrior', personality: 'Courageous', motivation: 'Save the kingdom' },
    attributes: [],
    skills: [],
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const pastDecisions: PlayerDecision[] = [
    {
      id: 'decision-1',
      prompt: 'An injured merchant lies on the ground. What do you do?',
      sessionId: 'session-1',
      worldId: 'world-1',
      choiceText: 'Help the injured merchant',
      choiceType: 'helpful',
      timestamp: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
      context: { situation: 'moral dilemma', charactersPresent: ['merchant'] }
    },
    {
      id: 'decision-2', 
      prompt: 'Bandits block your path. How do you handle this?',
      sessionId: 'session-1',
      worldId: 'world-1',
      choiceText: 'Negotiate instead of fighting',
      choiceType: 'diplomatic',
      timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
      context: { situation: 'conflict resolution', charactersPresent: ['bandit leader'] }
    }
  ];

  beforeEach(() => {
    mockAiClient = new MockAIClient();
    narrativeGenerator = new NarrativeGenerator(mockAiClient);

    // Mock world store directly
    (useWorldStore.getState as jest.Mock).mockReturnValue({
      worlds: { 'world-1': mockWorld },
      currentWorldId: 'world-1',
      error: null,
      loading: false
    });

    // Mock character store directly
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

    // Mock template manager to return a simple template function
    (narrativeTemplateManager.getTemplate as jest.Mock).mockReturnValue(
      (context: { worldName: string; characterIds?: string[] }) => `Generated prompt for ${context.worldName} with ${context.characterIds?.length || 0} characters`
    );

    // Mock lore context helper
    (getLoreContextForPrompt as jest.Mock).mockReturnValue('');

    // Mock tone settings guidance
    (getDetailedToneInstructions as jest.Mock).mockReturnValue('');
  });

  describe('Past Decision Integration in Prompts', () => {
    test('should include specific past decisions in AI prompts', async () => {
      // ACCEPTANCE CRITERIA: AI prompts must include specific past decision details
      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        sessionId: 'session-1'
      };

      await narrativeGenerator.generateSegment(request);

      // Verify that the AI prompt includes specific decision context
      const lastPrompt = mockAiClient.getLastPrompt();
      
      // Should mention specific past choices by name
      expect(lastPrompt).toContain('Help the injured merchant');
      expect(lastPrompt).toContain('Negotiate instead of fighting');
      
      // Should include decision context section
      expect(lastPrompt).toMatch(/PAST PLAYER DECISIONS?:/i);
      
      // Should include any contextual information from decisions (flexible)
      const hasContextualInfo = lastPrompt.includes('moral dilemma') || 
                               lastPrompt.includes('merchant') || 
                               lastPrompt.includes('compassionate') ||
                               lastPrompt.includes('diplomatic');
      expect(hasContextualInfo).toBe(true);
    });

    test('should instruct AI to reference past decisions in narrative', async () => {
      // ACCEPTANCE CRITERIA: AI must be explicitly instructed to use past decisions
      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        sessionId: 'session-1'
      };

      await narrativeGenerator.generateSegment(request);

      const lastPrompt = mockAiClient.getLastPrompt();
      
      // Should have instructions about using past decisions (flexible matching)
      const hasReferenceInstructions = lastPrompt.toLowerCase().includes('reference') && 
                                      (lastPrompt.toLowerCase().includes('past') || lastPrompt.toLowerCase().includes('previous'));
      expect(hasReferenceInstructions).toBe(true);
      
      const hasConsequenceInstructions = lastPrompt.toLowerCase().includes('consequences') ||
                                        lastPrompt.toLowerCase().includes('build upon') ||
                                        lastPrompt.toLowerCase().includes('based on');
      expect(hasConsequenceInstructions).toBe(true);
    });

    test('should include decision impact instructions for NPCs', async () => {
      // ACCEPTANCE CRITERIA: NPCs should react based on past player interactions
      const request: NarrativeGenerationRequest = {
        worldId: 'world-1', 
        characterIds: ['char-1'],
        sessionId: 'session-1'
      };

      await narrativeGenerator.generateSegment(request);

      const lastPrompt = mockAiClient.getLastPrompt();
      
      // Should include NPC-related instructions (flexible)
      const hasNPCInstructions = (lastPrompt.toLowerCase().includes('npc') || lastPrompt.toLowerCase().includes('characters')) &&
                                 (lastPrompt.toLowerCase().includes('react') || lastPrompt.toLowerCase().includes('remember'));
      expect(hasNPCInstructions).toBe(true);
      
      expect(lastPrompt).toContain('merchant'); // Should reference the specific NPC from test data
      
      // Should reference the help decision in some way (flexible)
      const hasHelpReference = lastPrompt.toLowerCase().includes('help') || 
                              lastPrompt.toLowerCase().includes('assist') ||
                              lastPrompt.toLowerCase().includes('merchant'); // NPC name implies the help context
      expect(hasHelpReference).toBe(true);
    });
  });

  describe('Decision Consequence Mapping', () => {
    test('should map compassionate decisions to trust-building consequences', async () => {
      // ACCEPTANCE CRITERIA: Compassionate choices should build trust and reputation
      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        characterIds: ['char-1'], 
        sessionId: 'session-1'
      };

      await narrativeGenerator.generateSegment(request);

      const lastPrompt = mockAiClient.getLastPrompt();
      
      // Should include consequences related to compassionate behavior (flexible)
      const hasCompassionateConsequences = lastPrompt.toLowerCase().includes('compassionate') ||
                                          lastPrompt.toLowerCase().includes('trust') ||
                                          lastPrompt.toLowerCase().includes('reputation') ||
                                          lastPrompt.toLowerCase().includes('helpful');
      expect(hasCompassionateConsequences).toBe(true);
      
      // Should show positive social outcomes
      const hasPositiveOutcomes = lastPrompt.toLowerCase().includes('trust') ||
                                 lastPrompt.toLowerCase().includes('gratitude') ||
                                 lastPrompt.toLowerCase().includes('positive') ||
                                 lastPrompt.toLowerCase().includes('remember');
      expect(hasPositiveOutcomes).toBe(true);
    });

    test('should map diplomatic decisions to peaceful resolution options', async () => {
      // ACCEPTANCE CRITERIA: Diplomatic choices should create peaceful alternatives
      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        sessionId: 'session-1'
      };

      await narrativeGenerator.generateSegment(request);

      const lastPrompt = mockAiClient.getLastPrompt();
      
      // Should include consequences related to diplomatic behavior (flexible)
      const hasDiplomaticConsequences = lastPrompt.toLowerCase().includes('diplomatic') ||
                                       lastPrompt.toLowerCase().includes('negotiation') ||
                                       lastPrompt.toLowerCase().includes('peaceful') ||
                                       lastPrompt.toLowerCase().includes('negotiate');
      expect(hasDiplomaticConsequences).toBe(true);
      
      // Should reference peaceful outcomes or conflict resolution
      const hasPeacefulOutcomes = lastPrompt.toLowerCase().includes('peaceful') ||
                                lastPrompt.toLowerCase().includes('resolution') ||
                                lastPrompt.toLowerCase().includes('alternatives') ||
                                lastPrompt.toLowerCase().includes('solutions');
      expect(hasPeacefulOutcomes).toBe(true);
    });
  });

  describe('Long-term Consequence Building', () => {
    test('should create narrative threads that span multiple decisions', async () => {
      // ACCEPTANCE CRITERIA: Multiple related decisions should build coherent consequences
      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        sessionId: 'session-1'
      };

      await narrativeGenerator.generateSegment(request);

      const lastPrompt = mockAiClient.getLastPrompt();
      
      // Should reference multiple decision types (flexible)
      const hasMultipleDecisionTypes = (lastPrompt.toLowerCase().includes('compassionate') || lastPrompt.toLowerCase().includes('helpful')) &&
                                     (lastPrompt.toLowerCase().includes('diplomatic') || lastPrompt.toLowerCase().includes('negotiat'));
      expect(hasMultipleDecisionTypes).toBe(true);
      
      // Should show compound/pattern effects (flexible)
      const hasCompoundEffects = lastPrompt.toLowerCase().includes('pattern') ||
                                lastPrompt.toLowerCase().includes('reputation') ||
                                lastPrompt.toLowerCase().includes('established') ||
                                lastPrompt.toLowerCase().includes('compound');
      expect(hasCompoundEffects).toBe(true);
    });

    test('should provide decision-informed story options', async () => {
      // ACCEPTANCE CRITERIA: Narrative should suggest options that reflect past decision patterns
      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        sessionId: 'session-1'
      };

      await narrativeGenerator.generateSegment(request);

      const lastPrompt = mockAiClient.getLastPrompt();
      
      // Should include guidance about choice options that reflect past patterns
      const hasChoiceGuidance = lastPrompt.toLowerCase().includes('choice') ||
                               lastPrompt.toLowerCase().includes('options') ||
                               lastPrompt.toLowerCase().includes('decision') ||
                               lastPrompt.toLowerCase().includes('consequences');
      expect(hasChoiceGuidance).toBe(true);
      
      // Should reference past decision types that could inform future choices
      const hasDecisionTypeReferences = lastPrompt.toLowerCase().includes('compassionate') ||
                                       lastPrompt.toLowerCase().includes('diplomatic') ||
                                       lastPrompt.toLowerCase().includes('reputation') ||
                                       lastPrompt.toLowerCase().includes('trust');
      expect(hasDecisionTypeReferences).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty decision history gracefully', async () => {
      // When no past decisions exist, should not break
      mockPlayerDecisionTracker.getWorldDecisions.mockReturnValue([]);
      
      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        sessionId: 'session-1'
      };

      await expect(narrativeGenerator.generateSegment(request)).resolves.toBeDefined();
    });

    test('should limit decision history to prevent prompt overflow', async () => {
      // Create many past decisions
      const manyDecisions = Array.from({ length: 20 }, (_, i) => ({
        id: `decision-${i}`,
        prompt: `What will you do next? (Decision ${i})`,
        sessionId: 'session-1',
        worldId: 'world-1',
        choiceText: `Choice ${i}`,
        choiceType: 'neutral' as const,
        timestamp: new Date(Date.now() - (i * 1000)).toISOString(),
        context: { situation: 'generic' }
      }));

      mockPlayerDecisionTracker.getWorldDecisions.mockReturnValue(manyDecisions);

      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        sessionId: 'session-1'
      };

      await narrativeGenerator.generateSegment(request);

      const lastPrompt = mockAiClient.getLastPrompt();
      
      // Should include decisions but not overwhelm the prompt
      const decisionMatches = lastPrompt.match(/Choice \d+/g) || [];
      expect(decisionMatches.length).toBeLessThanOrEqual(10); // Reasonable limit
    });
  });
});