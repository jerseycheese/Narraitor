/**
 * Budget integration tests for NarrativeGenerator
 *
 * These tests verify that when ENABLE_TOKEN_BUDGET_MANAGER is enabled, large
 * prompt components are truncated to stay within their component budgets.
 */

import { NarrativeGenerator } from '../narrativeGenerator';
import { getLoreContextForPrompt } from '../loreContextHelper';
import { narrativeTemplateManager } from '../../promptTemplates/narrativeTemplateManager';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useAiContextStore } from '@/state/aiContextStore';
import { useInventoryStore } from '@/state/inventoryStore';
import { useNPCStore } from '@/state/npcStore';
import { createMockWorldStore, createMockCharacterStore } from '@/lib/test-utils';

jest.mock('../loreContextHelper');
jest.mock('../../promptTemplates/narrativeTemplateManager');
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');
jest.mock('@/state/aiContextStore');
jest.mock('@/state/inventoryStore');
jest.mock('@/state/npcStore');

const mockWorld = {
  id: 'world-123',
  name: 'Epic Fantasy World',
  description: 'A world of magic and adventure',
  genre: 'fantasy',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 10,
    maxSkills: 20,
    attributePointPool: 27,
    skillPointPool: 20,
  },
  createdAt: '2023-01-01',
  updatedAt: '2023-01-01',
  toneSettings: {
    contentRating: 'PG' as const,
    narrativeStyle: 'epic' as const,
    languageComplexity: 'moderate' as const,
  },
};

describe('NarrativeGenerator budget integration', () => {
  let narrativeGenerator: NarrativeGenerator;
  let mockAIClient: { generateContent: jest.Mock };
  const originalEnv = process.env.ENABLE_TOKEN_BUDGET_MANAGER;
  type TemplateContext = {
    narrativeContext?: {
      recentSegments?: Array<{ content: string }>;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENABLE_TOKEN_BUDGET_MANAGER = 'true';

    mockAIClient = {
      generateContent: jest.fn().mockResolvedValue({
        content: 'A short narrative response that should not require rewrites.',
      }),
    };

    narrativeGenerator = new NarrativeGenerator(mockAIClient);

    (useWorldStore.getState as jest.Mock).mockReturnValue(
      createMockWorldStore({
        worlds: { 'world-123': mockWorld },
      })
    );

    (useCharacterStore.getState as jest.Mock).mockReturnValue(
      createMockCharacterStore({
        characters: {},
      })
    );

    (useAiContextStore.getState as jest.Mock).mockReturnValue({
      buildContextForSession: jest.fn().mockReturnValue({
        goalContext: '',
        activeGoals: [],
      }),
    });

    (useInventoryStore.getState as jest.Mock).mockReturnValue({
      getCharacterItems: jest.fn().mockReturnValue([]),
    });

    (useNPCStore.getState as jest.Mock).mockReturnValue({
      getNPCsByWorld: jest.fn().mockReturnValue([]),
    });
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.ENABLE_TOKEN_BUDGET_MANAGER;
    } else {
      process.env.ENABLE_TOKEN_BUDGET_MANAGER = originalEnv;
    }
  });

  it('truncates lore context when it exceeds the lore budget', async () => {
    const loreContext = `\nEstablished World Facts:\n${new Array(2000).fill('word').join(' ')}\nEND_MARKER`;
    (getLoreContextForPrompt as jest.Mock).mockReturnValue(loreContext);

    (narrativeTemplateManager.getTemplate as jest.Mock).mockReturnValue(
      jest.fn().mockReturnValue('Base narrative template')
    );

    await narrativeGenerator.generateSegment({
      worldId: 'world-123',
      sessionId: 'session-456',
      characterIds: ['char-1'],
      generationParameters: {
        desiredLength: 'medium',
      },
    });

    const capturedPrompt = mockAIClient.generateContent.mock.calls[0][0];
    expect(capturedPrompt).toContain('Established World Facts:');
    expect(capturedPrompt).not.toContain('END_MARKER');
  });

  it('bypasses truncation when ENABLE_TOKEN_BUDGET_MANAGER=false', async () => {
    process.env.ENABLE_TOKEN_BUDGET_MANAGER = 'false';
    const loreContext = `\nEstablished World Facts:\n${new Array(2000).fill('word').join(' ')}\nEND_MARKER`;
    (getLoreContextForPrompt as jest.Mock).mockReturnValue(loreContext);

    (narrativeTemplateManager.getTemplate as jest.Mock).mockReturnValue(
      jest.fn().mockReturnValue('Base narrative template')
    );

    await narrativeGenerator.generateSegment({
      worldId: 'world-123',
      sessionId: 'session-456',
      characterIds: ['char-1'],
      generationParameters: {
        desiredLength: 'medium',
      },
    });

    const capturedPrompt = mockAIClient.generateContent.mock.calls[0][0];
    expect(capturedPrompt).toContain('END_MARKER');
  });

  it('truncates recent narrative segments when they exceed the recent-narrative budget', async () => {
    (getLoreContextForPrompt as jest.Mock).mockReturnValue('');

    (narrativeTemplateManager.getTemplate as jest.Mock).mockReturnValue(
      jest.fn().mockImplementation((context: unknown) => {
        const typed = context as TemplateContext;
        const recent = typed?.narrativeContext?.recentSegments ?? [];
        return `Base narrative template\n${recent.map((seg) => seg.content).join('\n')}`;
      })
    );

    await narrativeGenerator.generateSegment({
      worldId: 'world-123',
      sessionId: 'session-456',
      characterIds: ['char-1'],
      narrativeContext: {
        worldId: 'world-123',
        currentSceneId: 'scene-1',
        characterIds: ['char-1'],
        sessionId: 'session-456',
        previousSegments: [],
        currentTags: [],
        recentSegments: [
          {
            id: 'seg-1',
            type: 'scene',
            content: `${new Array(2500).fill('word').join(' ')} END_MARKER`,
            timestamp: new Date('2023-01-01T00:00:00Z'),
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            metadata: { characterIds: [], tags: [] },
          },
        ],
      },
      generationParameters: {
        desiredLength: 'short',
      },
    });

    const capturedPrompt = mockAIClient.generateContent.mock.calls[0][0];
    expect(capturedPrompt).toContain('Base narrative template');
    expect(capturedPrompt).not.toContain('END_MARKER');
  });

  it('fills remaining recent-narrative budget by truncating the oldest included segment', async () => {
    (getLoreContextForPrompt as jest.Mock).mockReturnValue('');

    (narrativeTemplateManager.getTemplate as jest.Mock).mockReturnValue(
      jest.fn().mockImplementation((context: unknown) => {
        const typed = context as TemplateContext;
        const recent = typed?.narrativeContext?.recentSegments ?? [];
        return `Base narrative template\n${recent.map((seg) => seg.content).join('\n')}`;
      })
    );

    await narrativeGenerator.generateSegment({
      worldId: 'world-123',
      sessionId: 'session-456',
      characterIds: ['char-1'],
      narrativeContext: {
        worldId: 'world-123',
        currentSceneId: 'scene-1',
        characterIds: ['char-1'],
        sessionId: 'session-456',
        previousSegments: [],
        currentTags: [],
        recentSegments: [
          {
            id: 'seg-older',
            type: 'scene',
            content: `OLDER_START ${new Array(5000).fill('word').join(' ')} OLDER_END_MARKER`,
            timestamp: new Date('2023-01-01T00:00:00Z'),
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2023-01-01T00:00:00Z',
            metadata: { characterIds: [], tags: [] },
          },
          {
            id: 'seg-newer',
            type: 'scene',
            content: `NEWER_START ${new Array(250).fill('word').join(' ')}`,
            timestamp: new Date('2023-01-01T00:01:00Z'),
            createdAt: '2023-01-01T00:01:00Z',
            updatedAt: '2023-01-01T00:01:00Z',
            metadata: { characterIds: [], tags: [] },
          },
        ],
      },
      generationParameters: {
        desiredLength: 'short',
      },
    });

    const capturedPrompt = mockAIClient.generateContent.mock.calls[0][0];
    expect(capturedPrompt).toContain('Base narrative template');
    expect(capturedPrompt).toContain('NEWER_START');
    expect(capturedPrompt).toContain('OLDER_START');
    expect(capturedPrompt).not.toContain('OLDER_END_MARKER');
  });
});
