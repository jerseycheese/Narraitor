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
import { MockAIClient } from '../../__mocks__/mockAiClient';
import { PlayerDecision, NarrativeGenerationRequest } from '@/types/narrative.types';

// Mock the store modules
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');
jest.mock('@/state/aiContextStore');
jest.mock('../playerDecisionTracker');

const mockWorldStore = useWorldStore as jest.MockedFunction<typeof useWorldStore>;
const mockCharacterStore = useCharacterStore as jest.MockedFunction<typeof useCharacterStore>;
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
      sessionId: 'session-1',
      worldId: 'world-1',
      choiceText: 'Help the injured merchant',
      choiceType: 'compassionate',
      timestamp: new Date(Date.now() - 86400000), // 1 day ago
      context: { situation: 'moral dilemma', charactersPresent: ['merchant'] }
    },
    {
      id: 'decision-2', 
      sessionId: 'session-1',
      worldId: 'world-1',
      choiceText: 'Negotiate instead of fighting',
      choiceType: 'diplomatic',
      timestamp: new Date(Date.now() - 43200000), // 12 hours ago
      context: { situation: 'conflict resolution', charactersPresent: ['bandit leader'] }
    }
  ];

  beforeEach(() => {
    mockAiClient = new MockAIClient();
    narrativeGenerator = new NarrativeGenerator(mockAiClient);

    // Mock store states
    mockWorldStore.mockReturnValue({
      getState: () => ({ worlds: { 'world-1': mockWorld } }),
      subscribe: jest.fn(),
      destroy: jest.fn()
    } as unknown as ReturnType<typeof useWorldStore>);

    mockCharacterStore.mockReturnValue({
      getState: () => ({ characters: { 'char-1': mockCharacter } }),
      subscribe: jest.fn(),
      destroy: jest.fn()
    } as unknown as ReturnType<typeof useCharacterStore>);

    mockPlayerDecisionTracker.getWorldDecisions.mockReturnValue(pastDecisions);
  });

  describe('Past Decision Integration in Prompts', () => {
    test('should include specific past decisions in AI prompts', async () => {
      // ACCEPTANCE CRITERIA: AI prompts must include specific past decision details
      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        prompt: 'Continue the story',
        sessionId: 'session-1'
      };

      await narrativeGenerator.generateSegment(request);

      // Verify that the AI prompt includes specific decision context
      const lastPrompt = mockAiClient.getLastPrompt();
      
      // Should mention specific past choices by name
      expect(lastPrompt).toContain('Help the injured merchant');
      expect(lastPrompt).toContain('Negotiate instead of fighting');
      
      // Should include decision context for AI reference
      expect(lastPrompt).toMatch(/PAST PLAYER DECISIONS?:/i);
      expect(lastPrompt).toContain('moral dilemma');
      expect(lastPrompt).toContain('conflict resolution');
    });

    test('should instruct AI to reference past decisions in narrative', async () => {
      // ACCEPTANCE CRITERIA: AI must be explicitly instructed to use past decisions
      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        prompt: 'A new challenge appears',
        sessionId: 'session-1'
      };

      await narrativeGenerator.generateSegment(request);

      const lastPrompt = mockAiClient.getLastPrompt();
      
      // Should have explicit instructions to reference past choices
      expect(lastPrompt).toMatch(/reference.*past.*decisions?/i);
      expect(lastPrompt).toMatch(/build.*upon.*previous.*choices?/i);
      expect(lastPrompt).toMatch(/consequences?.*of.*past.*actions?/i);
    });

    test('should include decision impact instructions for NPCs', async () => {
      // ACCEPTANCE CRITERIA: NPCs should react based on past player interactions
      const request: NarrativeGenerationRequest = {
        worldId: 'world-1', 
        characterIds: ['char-1'],
        prompt: 'You encounter the merchant again',
        sessionId: 'session-1'
      };

      await narrativeGenerator.generateSegment(request);

      const lastPrompt = mockAiClient.getLastPrompt();
      
      // Should instruct AI about NPC reactions to past decisions
      expect(lastPrompt).toMatch(/NPC.*reactions?.*based.*on.*past/i);
      expect(lastPrompt).toContain('merchant'); // Should reference the specific NPC
      expect(lastPrompt).toMatch(/remember.*helped/i); // Should reference the help decision
    });
  });

  describe('Decision Consequence Mapping', () => {
    test('should map compassionate decisions to trust-building consequences', async () => {
      // ACCEPTANCE CRITERIA: Compassionate choices should build trust and reputation
      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        characterIds: ['char-1'], 
        prompt: 'You enter the town square',
        sessionId: 'session-1'
      };

      await narrativeGenerator.generateSegment(request);

      const lastPrompt = mockAiClient.getLastPrompt();
      
      // Should connect compassionate choice to reputation consequences
      expect(lastPrompt).toMatch(/compassionate.*reputation/i);
      expect(lastPrompt).toMatch(/helping.*others.*trust/i);
      expect(lastPrompt).toMatch(/known.*for.*kindness/i);
    });

    test('should map diplomatic decisions to peaceful resolution options', async () => {
      // ACCEPTANCE CRITERIA: Diplomatic choices should create peaceful alternatives
      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        prompt: 'A conflict breaks out nearby',
        sessionId: 'session-1'
      };

      await narrativeGenerator.generateSegment(request);

      const lastPrompt = mockAiClient.getLastPrompt();
      
      // Should reference diplomatic pattern and create peaceful options
      expect(lastPrompt).toMatch(/diplomatic.*approach/i);
      expect(lastPrompt).toMatch(/negotiation.*skills/i);
      expect(lastPrompt).toMatch(/peaceful.*resolution/i);
    });
  });

  describe('Long-term Consequence Building', () => {
    test('should create narrative threads that span multiple decisions', async () => {
      // ACCEPTANCE CRITERIA: Multiple related decisions should build coherent consequences
      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        prompt: 'The kingdom faces a new threat',
        sessionId: 'session-1'
      };

      await narrativeGenerator.generateSegment(request);

      const lastPrompt = mockAiClient.getLastPrompt();
      
      // Should connect multiple past decisions into a pattern
      expect(lastPrompt).toMatch(/pattern.*compassionate.*diplomatic/i);
      expect(lastPrompt).toMatch(/reputation.*peaceful.*leader/i);
      expect(lastPrompt).toMatch(/allies.*trust.*your.*judgment/i);
    });

    test('should provide decision-informed story options', async () => {
      // ACCEPTANCE CRITERIA: Current choices should reflect past decision patterns
      mockAiClient.setMockResponse({
        content: 'Story with three choices based on past decisions',
        choices: [
          { id: '1', text: 'Use your reputation to rally allies', type: 'social' },
          { id: '2', text: 'Negotiate with the threat directly', type: 'diplomatic' },
          { id: '3', text: 'Seek help from those you\'ve aided before', type: 'compassionate' }
        ]
      });

      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        prompt: 'The kingdom faces a new threat',
        sessionId: 'session-1'
      };

      const result = await narrativeGenerator.generateSegment(request);

      // Verify choices reflect past decision patterns
      expect(result.choices).toBeDefined();
      expect(result.choices?.length).toBeGreaterThan(0);
      
      const choiceTexts = result.choices?.map(c => c.text).join(' ') || '';
      expect(choiceTexts).toMatch(/reputation|allies/i);
      expect(choiceTexts).toMatch(/negotiate/i);
      expect(choiceTexts).toMatch(/helped|aided/i);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle empty decision history gracefully', async () => {
      // When no past decisions exist, should not break
      mockPlayerDecisionTracker.getWorldDecisions.mockReturnValue([]);
      
      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        prompt: 'Begin your adventure',
        sessionId: 'session-1'
      };

      await expect(narrativeGenerator.generateSegment(request)).resolves.toBeDefined();
    });

    test('should limit decision history to prevent prompt overflow', async () => {
      // Create many past decisions
      const manyDecisions = Array.from({ length: 20 }, (_, i) => ({
        id: `decision-${i}`,
        sessionId: 'session-1',
        worldId: 'world-1',
        choiceText: `Choice ${i}`,
        choiceType: 'action' as const,
        timestamp: new Date(Date.now() - (i * 1000)),
        context: { situation: 'generic' }
      }));

      mockPlayerDecisionTracker.getWorldDecisions.mockReturnValue(manyDecisions);

      const request: NarrativeGenerationRequest = {
        worldId: 'world-1',
        characterIds: ['char-1'],
        prompt: 'Continue the story',
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