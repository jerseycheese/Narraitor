import { ChoiceGenerator } from '../choiceGenerator';
import { AIClient } from '../types';
import { EntityID } from '@/types/common.types';
import { NarrativeContext, NarrativeSegment } from '@/types/narrative.types';
import { PlayerDecision, ChoiceTypePreference } from '@/types/personalization.types';
import { getTimestamp } from '@/lib/utils/timestamp';
import { playerDecisionTracker } from '../playerDecisionTracker';

// Mock the AIClient
const mockAIClient: jest.Mocked<AIClient> = {
  generateContent: jest.fn()
};

// Mock the worldStore
jest.mock('@/state/worldStore', () => ({
  useWorldStore: {
    getState: jest.fn().mockReturnValue({
      worlds: {
        'world-1': {
          id: 'world-1',
          name: 'Test World',
          description: 'A test world for unit tests',
          genre: 'fantasy'
        }
      },
      currentWorldId: 'world-1'
    })
  }
}));

// Mock the inventory store
jest.mock('@/state/inventoryStore', () => ({
  useInventoryStore: {
    getState: jest.fn().mockReturnValue({
      getCharacterItems: () => []
    })
  }
}));

// Mock narrativeTemplateManager
jest.mock('@/lib/promptTemplates/narrativeTemplateManager', () => ({
  narrativeTemplateManager: {
    getTemplate: jest.fn().mockImplementation((templateKey) => {
      if (templateKey === 'narrative/playerChoice') {
        return jest.fn().mockReturnValue('Generate player choices for this scenario');
      }
      return jest.fn();
    })
  }
}));

// Mock playerDecisionTracker
jest.mock('../playerDecisionTracker', () => ({
  playerDecisionTracker: {
    getRelevantDecisionsWithScores: jest.fn().mockReturnValue([])
  }
}));

const mockPlayerDecisionTracker = playerDecisionTracker as jest.Mocked<typeof playerDecisionTracker>;

// Helper to create mock narrative context
const createMockNarrativeContext = (): NarrativeContext => {
  const createSegment = (id: string, content: string): NarrativeSegment => ({
    id: id as EntityID,
    worldId: 'world-1',
    sessionId: 'session-1',
    content,
    type: 'scene',
    metadata: {
      tags: ['fantasy']
    },
    timestamp: new Date(),
    createdAt: getTimestamp(),
    updatedAt: getTimestamp()
  });

  return {
    worldId: 'world-1',
    currentSceneId: 'scene-1',
    characterIds: ['char-1'],
    previousSegments: [],
    currentTags: [],
    sessionId: 'session-1',
    recentSegments: [
      createSegment('segment-1', 'The hero enters the forest.'),
      createSegment('segment-2', 'A strange noise echoes through the trees.')
    ],
    currentLocation: 'Forest',
    currentSituation: 'Exploring the forest'
  };
};

// Helper to create mock player decisions
const createMockDecision = (
  id: string,
  choiceType: ChoiceTypePreference,
  prompt: string,
  choiceText: string
): PlayerDecision => ({
  id: id as EntityID,
  sessionId: 'session-1' as EntityID,
  worldId: 'world-1' as EntityID,
  prompt,
  choiceText,
  choiceType,
  selectedAt: getTimestamp(),
  location: 'Forest',
  situation: 'Exploring',
  charactersPresent: []
});

describe('ChoiceGenerator - Decision History Integration', () => {
  let choiceGenerator: ChoiceGenerator;

  beforeEach(() => {
    jest.clearAllMocks();
    choiceGenerator = new ChoiceGenerator(mockAIClient);
    mockAIClient.generateContent.mockResolvedValue({
      content: `Decision: What will you do?

Options:
1. Investigate the noise
2. Climb a tree
3. Draw your sword`,
      finishReason: 'STOP'
    });
  });

  describe('Decision History Enhancement', () => {
    it('should include relevant past decisions in choice prompt when sessionId is provided', async () => {
      const mockDecisions = [
        createMockDecision('decision-1', 'diplomatic', 'How do you respond?', 'Speak calmly'),
        createMockDecision('decision-2', 'helpful', 'Will you help?', 'Offer assistance')
      ];

      mockPlayerDecisionTracker.getRelevantDecisionsWithScores.mockReturnValue([
        { decision: mockDecisions[0], relevanceScore: 0.8 },
        { decision: mockDecisions[1], relevanceScore: 0.6 }
      ]);

      const narrativeContext = createMockNarrativeContext();

      await choiceGenerator.generateChoices({
        worldId: 'world-1',
        narrativeContext,
        characterIds: ['char-1'],
        sessionId: 'session-1'
      });

      // Verify decision tracker was called with correct parameters
      expect(mockPlayerDecisionTracker.getRelevantDecisionsWithScores).toHaveBeenCalledWith(
        expect.objectContaining({
          worldId: 'world-1',
          sessionId: 'session-1',
          location: 'Forest',
          situation: 'Exploring the forest'
        }),
        15, // max decisions
        { worldId: 'world-1', sessionId: 'session-1' }
      );

      // Verify AI was called with enhanced prompt containing decision history
      expect(mockAIClient.generateContent).toHaveBeenCalled();
      const calledPrompt = mockAIClient.generateContent.mock.calls[0][0];
      expect(calledPrompt).toContain('Past Decision History');
      expect(calledPrompt).toContain('decision-making patterns');
    });

    it('should work when no decision history exists (graceful degradation)', async () => {
      mockPlayerDecisionTracker.getRelevantDecisionsWithScores.mockReturnValue([]);

      const narrativeContext = createMockNarrativeContext();

      const result = await choiceGenerator.generateChoices({
        worldId: 'world-1',
        narrativeContext,
        characterIds: ['char-1'],
        sessionId: 'session-1'
      });

      // Should still generate choices successfully
      expect(result.options).toHaveLength(3);
      expect(mockAIClient.generateContent).toHaveBeenCalled();
    });

    it('should not include decision history when sessionId is not provided', async () => {
      const narrativeContext = createMockNarrativeContext();

      await choiceGenerator.generateChoices({
        worldId: 'world-1',
        narrativeContext,
        characterIds: ['char-1']
        // No sessionId provided
      });

      // Decision tracker should not be called without sessionId
      expect(mockPlayerDecisionTracker.getRelevantDecisionsWithScores).not.toHaveBeenCalled();
    });

    it('should not include decision history when includeDecisionHistory is false', async () => {
      const narrativeContext = createMockNarrativeContext();

      await choiceGenerator.generateChoices({
        worldId: 'world-1',
        narrativeContext,
        characterIds: ['char-1'],
        sessionId: 'session-1',
        includeDecisionHistory: false
      });

      // Decision tracker should not be called when explicitly disabled
      expect(mockPlayerDecisionTracker.getRelevantDecisionsWithScores).not.toHaveBeenCalled();
    });

    it('should fallback to world-level decisions if no session-specific decisions exist', async () => {
      // First call returns empty (session-specific)
      // Second call returns world-level decisions
      mockPlayerDecisionTracker.getRelevantDecisionsWithScores
        .mockReturnValueOnce([])
        .mockReturnValueOnce([
          {
            decision: createMockDecision('decision-world-1', 'aggressive', 'Fight?', 'Attack'),
            relevanceScore: 0.7
          }
        ]);

      const narrativeContext = createMockNarrativeContext();

      await choiceGenerator.generateChoices({
        worldId: 'world-1',
        narrativeContext,
        characterIds: ['char-1'],
        sessionId: 'session-1'
      });

      // Should have been called twice - once for session, once for world
      expect(mockPlayerDecisionTracker.getRelevantDecisionsWithScores).toHaveBeenCalledTimes(2);

      // First call: session-specific
      expect(mockPlayerDecisionTracker.getRelevantDecisionsWithScores).toHaveBeenNthCalledWith(
        1,
        expect.anything(),
        15,
        { worldId: 'world-1', sessionId: 'session-1' }
      );

      // Second call: world-level
      expect(mockPlayerDecisionTracker.getRelevantDecisionsWithScores).toHaveBeenNthCalledWith(
        2,
        expect.anything(),
        15,
        { worldId: 'world-1' }
      );
    });

    it('should respect token budget for decision history formatting', async () => {
      // Create many decisions to test token budget
      const manyDecisions = Array.from({ length: 20 }, (_, i) =>
        createMockDecision(
          `decision-${i}`,
          'diplomatic',
          `Decision prompt ${i}`,
          `Choice text ${i}`
        )
      );

      mockPlayerDecisionTracker.getRelevantDecisionsWithScores.mockReturnValue(
        manyDecisions.slice(0, 15).map((decision, i) => ({
          decision,
          relevanceScore: 1 - i * 0.05 // Decreasing relevance
        }))
      );

      const narrativeContext = createMockNarrativeContext();

      await choiceGenerator.generateChoices({
        worldId: 'world-1',
        narrativeContext,
        characterIds: ['char-1'],
        sessionId: 'session-1'
      });

      // Verify AI was called
      expect(mockAIClient.generateContent).toHaveBeenCalled();

      // The prompt should include decision history but respect token budget
      // DecisionFormatter will handle truncation internally with 500 token budget
      const calledPrompt = mockAIClient.generateContent.mock.calls[0][0];
      expect(calledPrompt).toContain('Past Decision History');
    });
  });

  describe('CurrentNarrativeContext Building', () => {
    it('should extract location from narrative context', async () => {
      const narrativeContext = createMockNarrativeContext();
      narrativeContext.currentLocation = 'Ancient Temple';

      await choiceGenerator.generateChoices({
        worldId: 'world-1',
        narrativeContext,
        characterIds: ['char-1'],
        sessionId: 'session-1'
      });

      expect(mockPlayerDecisionTracker.getRelevantDecisionsWithScores).toHaveBeenCalledWith(
        expect.objectContaining({
          location: 'Ancient Temple'
        }),
        expect.anything(),
        expect.anything()
      );
    });

    it('should extract characters present from narrative context', async () => {
      const narrativeContext = createMockNarrativeContext();
      narrativeContext.characterIds = ['char-1', 'char-2'];

      await choiceGenerator.generateChoices({
        worldId: 'world-1',
        narrativeContext,
        characterIds: ['char-1', 'char-2'],
        sessionId: 'session-1'
      });

      expect(mockPlayerDecisionTracker.getRelevantDecisionsWithScores).toHaveBeenCalledWith(
        expect.objectContaining({
          charactersPresent: expect.arrayContaining(['char-1', 'char-2'])
        }),
        expect.anything(),
        expect.anything()
      );
    });

    it('should extract situation from narrative context', async () => {
      const narrativeContext = createMockNarrativeContext();
      narrativeContext.currentSituation = 'Facing a dragon';

      await choiceGenerator.generateChoices({
        worldId: 'world-1',
        narrativeContext,
        characterIds: ['char-1'],
        sessionId: 'session-1'
      });

      expect(mockPlayerDecisionTracker.getRelevantDecisionsWithScores).toHaveBeenCalledWith(
        expect.objectContaining({
          situation: 'Facing a dragon'
        }),
        expect.anything(),
        expect.anything()
      );
    });

    it('should extract active tags from narrative context', async () => {
      const narrativeContext = createMockNarrativeContext();
      narrativeContext.currentTags = ['combat', 'boss-fight'];

      await choiceGenerator.generateChoices({
        worldId: 'world-1',
        narrativeContext,
        characterIds: ['char-1'],
        sessionId: 'session-1'
      });

      expect(mockPlayerDecisionTracker.getRelevantDecisionsWithScores).toHaveBeenCalledWith(
        expect.objectContaining({
          activeTags: ['combat', 'boss-fight']
        }),
        expect.anything(),
        expect.anything()
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle errors in decision history enhancement gracefully', async () => {
      mockPlayerDecisionTracker.getRelevantDecisionsWithScores.mockImplementation(() => {
        throw new Error('Decision tracker error');
      });

      const narrativeContext = createMockNarrativeContext();

      // Should not throw - should handle error gracefully
      const result = await choiceGenerator.generateChoices({
        worldId: 'world-1',
        narrativeContext,
        characterIds: ['char-1'],
        sessionId: 'session-1'
      });

      // Should still return valid choices
      expect(result.options).toHaveLength(3);
    });
  });
});
