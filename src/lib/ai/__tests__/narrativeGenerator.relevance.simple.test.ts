/**
 * Simple integration test for NarrativeGenerator with Decision Relevance System
 * Verifies that the integration works without errors
 */

import { NarrativeGenerator } from '../narrativeGenerator';
import { GeminiClient } from '../geminiClient';
import { playerDecisionTracker } from '../playerDecisionTracker';
import { narrativeTemplateManager } from '../../promptTemplates/narrativeTemplateManager';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useAiContextStore } from '@/state/aiContextStore';
import { NarrativeGenerationRequest, NarrativeSegment } from '@/types/narrative.types';
import { CurrentNarrativeContext } from '@/types/relevance.types';

jest.mock('../geminiClient');
jest.mock('../../promptTemplates/narrativeTemplateManager');
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

const mockWorld = {
  id: 'world-test',
  name: 'Test Kingdom',
  description: 'A medieval fantasy kingdom',
  genre: 'fantasy',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 10,
    maxSkills: 20
  },
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01'
};

const mockCharacter = {
  id: 'char-test',
  name: 'Test Hero',
  worldId: 'world-test',
  background: {
    summary: 'A brave adventurer'
  },
  attributes: {},
  skills: [],
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01'
};

describe('NarrativeGenerator - Simple Relevance Integration', () => {
  let narrativeGenerator: NarrativeGenerator;
  let mockGeminiClient: jest.Mocked<GeminiClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    playerDecisionTracker.clearDecisions();

    mockGeminiClient = {
      generateContent: jest.fn()
    } as unknown as jest.Mocked<GeminiClient>;

    narrativeGenerator = new NarrativeGenerator(mockGeminiClient);

    const mockTemplate = jest.fn().mockReturnValue('Generated prompt');
    (narrativeTemplateManager.getTemplate as jest.Mock).mockReturnValue(mockTemplate);

    (useWorldStore.getState as jest.Mock).mockReturnValue({
      worlds: { 'world-test': mockWorld },
      currentWorldId: 'world-test'
    });

    (useCharacterStore.getState as jest.Mock).mockReturnValue({
      characters: { 'char-test': mockCharacter }
    });

    (useAiContextStore.getState as jest.Mock).mockReturnValue({
      buildContextForSession: jest.fn().mockReturnValue({
        activeGoals: []
      })
    });
  });

  it('generates narrative successfully with relevance system', async () => {
    // Record a test decision
    playerDecisionTracker.recordDecision(
      'You encounter a merchant',
      'Trade with the merchant',
      'helpful',
      'session-test',
      'world-test',
      {
        location: 'Market Square',
        situation: 'Trading goods'
      }
    );

    const mockAIResponse = {
      content: 'The narrative continues...',
      finishReason: 'stop'
    };

    mockGeminiClient.generateContent.mockResolvedValue(mockAIResponse);

    const request: NarrativeGenerationRequest = {
      worldId: 'world-test',
      sessionId: 'session-test',
      characterIds: ['char-test'],
      narrativeContext: {
        worldId: 'world-test',
        currentSceneId: 'scene-1',
        characterIds: ['char-test'],
        sessionId: 'session-test',
        previousSegments: [],
        currentTags: ['trading'],
        currentLocation: 'Market Square',
        recentSegments: []
      }
    };

    const result = await narrativeGenerator.generateSegment(request);

    // Basic assertions - just verify it works
    expect(result).toBeDefined();
    expect(result.content).toBe('The narrative continues...');
    expect(mockGeminiClient.generateContent).toHaveBeenCalled();
  });

  it('works without any decision history', async () => {
    // Don't record any decisions

    const mockAIResponse = {
      content: 'The story begins...',
      finishReason: 'stop'
    };

    mockGeminiClient.generateContent.mockResolvedValue(mockAIResponse);

    const request: NarrativeGenerationRequest = {
      worldId: 'world-test',
      sessionId: 'session-test',
      characterIds: ['char-test']
    };

    const result = await narrativeGenerator.generateSegment(request);

    // Should work fine with no decisions
    expect(result).toBeDefined();
    expect(result.content).toBe('The story begins...');
  });

  it('omits decisions from other sessions when scoring relevance', async () => {
    playerDecisionTracker.recordDecision(
      'You see an injured merchant',
      'Help the injured merchant',
      'helpful',
      'session-test',
      'world-test',
      {
        location: 'Market Square',
        situation: 'Trading goods'
      }
    );

    playerDecisionTracker.recordDecision(
      'Guards block your escape',
      'Launch a surprise assault',
      'aggressive',
      'session-other',
      'world-test',
      {
        location: 'Market Square',
        situation: 'Combat encounter'
      }
    );

    const mockAIResponse = {
      content: 'Filtered decisions prompt...',
      finishReason: 'stop'
    };

    mockGeminiClient.generateContent.mockResolvedValue(mockAIResponse);

    const request: NarrativeGenerationRequest = {
      worldId: 'world-test',
      sessionId: 'session-test',
      characterIds: ['char-test'],
      narrativeContext: {
        worldId: 'world-test',
        currentSceneId: 'scene-1',
        characterIds: ['char-test'],
        sessionId: 'session-test',
        previousSegments: [],
        currentTags: ['trading'],
        currentLocation: 'Market Square',
        recentSegments: []
      }
    };

    await narrativeGenerator.generateSegment(request);

    const promptSent = mockGeminiClient.generateContent.mock.calls[0][0] as string;
    const promptLower = promptSent.toLowerCase();

    expect(promptLower).toContain('help the injured merchant');
    expect(promptLower).not.toContain('launch a surprise assault');
  });

  it('works with multiple relevant decisions', async () => {
    // Record multiple decisions
    for (let i = 0; i < 5; i++) {
      playerDecisionTracker.recordDecision(
        `Decision ${i}`,
        `Choice ${i}`,
        'neutral',
        'session-test',
        'world-test',
        {
          location: 'Village'
        }
      );
    }

    const mockAIResponse = {
      content: 'Multiple decisions processed...',
      finishReason: 'stop'
    };

    mockGeminiClient.generateContent.mockResolvedValue(mockAIResponse);

    const request: NarrativeGenerationRequest = {
      worldId: 'world-test',
      sessionId: 'session-test',
      characterIds: ['char-test'],
      narrativeContext: {
        worldId: 'world-test',
        currentSceneId: 'scene-1',
        characterIds: ['char-test'],
        sessionId: 'session-test',
        previousSegments: [],
        currentTags: [],
        currentLocation: 'Village',
        recentSegments: []
      }
    };

    const result = await narrativeGenerator.generateSegment(request);

    expect(result).toBeDefined();
    expect(result.content).toBe('Multiple decisions processed...');
  });

  it('builds relevance context using latest recent segment when location missing', async () => {
    const capturedContexts: CurrentNarrativeContext[] = [];
    const getRelevantDecisionsSpy = jest
      .spyOn(playerDecisionTracker, 'getRelevantDecisions')
      .mockImplementation((context, maxDecisions, filters) => {
        capturedContexts.push(context);
        return [];
      });

    const mockAIResponse = {
      content: 'Context test narrative...',
      finishReason: 'stop'
    };

    mockGeminiClient.generateContent.mockResolvedValue(mockAIResponse);

    const buildSegment = (id: string, location: string): NarrativeSegment => ({
      id,
      worldId: 'world-test',
      sessionId: 'session-test',
      content: `${location} summary`,
      type: 'scene' as const,
      characterIds: ['char-test'],
      metadata: {
        tags: [],
        location
      },
      decisions: [],
      timestamp: new Date(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    const request: NarrativeGenerationRequest = {
      worldId: 'world-test',
      sessionId: 'session-test',
      characterIds: ['char-test'],
      narrativeContext: {
        worldId: 'world-test',
        currentSceneId: 'scene-1',
        characterIds: ['char-test'],
        sessionId: 'session-test',
        previousSegments: [],
        currentTags: ['stealth'],
        recentSegments: [
          buildSegment('segment-1', 'Old Port'),
          buildSegment('segment-2', 'Shadow Alley')
        ]
      }
    };

    await narrativeGenerator.generateSegment(request);

    expect(capturedContexts[0]?.location).toBe('Shadow Alley');

    getRelevantDecisionsSpy.mockRestore();
  });
});
