// src/state/__tests__/narrativeStore.ending.test.ts

import { useNarrativeStore } from '../narrativeStore';
import { useWorldThreadStore } from '../worldThreadStore';
import { isFeatureEnabled } from '@/lib/featureFlags';
import type {
  StoryEnding,
  EndingGenerationResult
} from '../../types/narrative.types';
import { getTimestamp } from '@/lib/utils/timestamp';

jest.mock('@/lib/featureFlags', () => ({
  isFeatureEnabled: jest.fn(() => true),
}));

// Mock fetch for API-based ending generation and restore after suite
// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare const global: any;
let originalFetch: unknown;
beforeAll(() => {
  originalFetch = global.fetch;
  global.fetch = jest.fn();
});
afterEach(() => {
  (global.fetch as jest.Mock).mockReset();
});
afterAll(() => {
  global.fetch = originalFetch;
});

// Test helpers
const createMockEnding = (overrides?: Partial<StoryEnding>): StoryEnding => ({
  id: 'ending-123',
  sessionId: 'session-123',
  characterId: 'char-456',
  worldId: 'world-789',
  type: 'story-complete',
  tone: 'triumphant',
  epilogue: 'The end...',
  characterLegacy: 'A hero...',
  worldImpact: 'Peace...',
  timestamp: new Date(),
  createdAt: getTimestamp(),
  updatedAt: getTimestamp(),
  ...overrides
});

const createMockGenerationResult = (overrides?: Partial<EndingGenerationResult>): EndingGenerationResult => ({
  epilogue: 'The hero saved the day...',
  characterLegacy: 'Remembered as a champion...',
  worldImpact: 'Peace was restored...',
  tone: 'triumphant',
  achievements: ['Hero', 'Savior'],
  playTime: 3600,
  ...overrides
});

const mockSuccessfulEndingGeneration = (result: EndingGenerationResult) => {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, data: result })
  });
};

const defaultEndingContext = {
  sessionId: 'session-123',
  characterId: 'char-456',
  worldId: 'world-789'
};

describe('narrativeStore - Ending functionality', () => {
  beforeEach(() => {
    // Reset store state
    useNarrativeStore.setState({
      segments: {},
      sessionSegments: {},
      decisions: {},
      sessionDecisions: {},
      endedSessions: {}, // Add session locking state
      currentEnding: null,
      isGeneratingEnding: false,
      endingError: null,
      loading: false,
      error: null
    });
    jest.clearAllMocks();
  });

  describe('generateEnding', () => {
    it('should generate and store a story ending', async () => {
      const mockGenerationResult = createMockGenerationResult();
      mockSuccessfulEndingGeneration(mockGenerationResult);

      await useNarrativeStore.getState().generateEnding('player-choice', defaultEndingContext);

      const { currentEnding } = useNarrativeStore.getState();
      expect(currentEnding).toMatchObject({
        ...defaultEndingContext,
        id: expect.any(String),
        type: 'player-choice',
        tone: 'triumphant',
        epilogue: 'The hero saved the day...',
        characterLegacy: 'Remembered as a champion...',
        worldImpact: 'Peace was restored...',
        achievements: ['Hero', 'Savior'],
        playTime: 3600,
        timestamp: expect.any(Date)
      });
    });

    it('should set loading state during generation', async () => {
      let resolveJson: (value: unknown) => void;
      const jsonPromise = new Promise((resolve) => { resolveJson = resolve; });
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => jsonPromise as unknown as Promise<EndingGenerationResult>
      });

      const generatePromise = useNarrativeStore.getState().generateEnding('story-complete', defaultEndingContext);

      expect(useNarrativeStore.getState().isGeneratingEnding).toBe(true);
      expect(useNarrativeStore.getState().endingError).toBeNull();

      resolveJson!({ success: true, data: createMockGenerationResult({
        epilogue: 'Story complete...',
        characterLegacy: 'A legend...',
        worldImpact: 'Changed forever...',
        achievements: [],
        playTime: 1800
      })});

      await generatePromise;
      expect(useNarrativeStore.getState().isGeneratingEnding).toBe(false);
    });

    it('should handle generation errors with local fallback', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Unable to load ending'
      });

      await useNarrativeStore.getState().generateEnding('session-limit', defaultEndingContext);

      const { currentEnding, endingError, isGeneratingEnding } = useNarrativeStore.getState();
      expect(currentEnding).not.toBeNull();
      expect(currentEnding?.type).toBe('session-limit');
      expect(endingError).toBeNull();
      expect(isGeneratingEnding).toBe(false);
    });

    it('should use custom prompt when provided', async () => {
      mockSuccessfulEndingGeneration(createMockGenerationResult({ tone: 'mysterious' }));

      await useNarrativeStore.getState().generateEnding('character-retirement', {
        ...defaultEndingContext,
        customPrompt: 'The character retires to a peaceful cottage'
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/narrative/ending', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('character-retirement')
      }));
    });

    it('should use desired tone when provided', async () => {
      mockSuccessfulEndingGeneration(createMockGenerationResult());

      await useNarrativeStore.getState().generateEnding('player-choice', {
        ...defaultEndingContext,
        desiredTone: 'triumphant'
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/narrative/ending', expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('triumphant')
      }));
    });
  });

  describe('clearEnding', () => {
    it('should clear the current ending', () => {
      useNarrativeStore.setState({ currentEnding: createMockEnding(), endingError: 'Some error' });

      useNarrativeStore.getState().clearEnding();

      const { currentEnding, endingError } = useNarrativeStore.getState();
      expect(currentEnding).toBeNull();
      expect(endingError).toBeNull();
    });
  });

  describe('saveEndingToHistory', () => {
    it('should save ending to segments for persistence', async () => {
      useNarrativeStore.setState({ currentEnding: createMockEnding() });
      useNarrativeStore.getState().saveEndingToHistory();

      const endingSegment = Object.values(useNarrativeStore.getState().segments).find(
        seg => seg.type === 'ending' && seg.metadata.endingId === 'ending-123'
      );

      expect(endingSegment).toBeDefined();
      expect(endingSegment?.content).toContain('The end...');
      expect(endingSegment?.metadata.tone).toBe('triumphant');
    });
  });

  describe('hasActiveEnding', () => {
    it('should return true when ending exists', () => {
      useNarrativeStore.setState({ currentEnding: createMockEnding() });
      expect(useNarrativeStore.getState().hasActiveEnding()).toBe(true);
    });

    it('should return false when no ending exists', () => {
      expect(useNarrativeStore.getState().hasActiveEnding()).toBe(false);
    });
  });

  describe('getEndingForSession', () => {
    it('should retrieve ending for a specific session', () => {
      const mockEnding = createMockEnding();
      useNarrativeStore.setState({
        segments: {
          'seg-ending': {
            id: 'seg-ending',
            type: 'ending',
            content: 'Ending content',
            sessionId: 'session-123',
            metadata: { tags: ['ending'], endingId: 'ending-123', endingData: mockEnding },
            timestamp: new Date(),
            createdAt: getTimestamp(),
            updatedAt: getTimestamp()
          }
        }
      });

      const ending = useNarrativeStore.getState().getEndingForSession('session-123');
      expect(ending).toMatchObject({ id: 'ending-123', sessionId: 'session-123', type: 'story-complete' });
    });

    it('should return null if no ending exists for session', () => {
      expect(useNarrativeStore.getState().getEndingForSession('non-existent-session')).toBeNull();
    });
  });

  describe('Session Locking', () => {
    it('should mark session as ended when ending is generated', async () => {
      mockSuccessfulEndingGeneration(createMockGenerationResult());
      const sessionId = 'session-123';

      expect(useNarrativeStore.getState().isSessionEnded(sessionId)).toBe(false);
      await useNarrativeStore.getState().generateEnding('player-choice', defaultEndingContext);
      expect(useNarrativeStore.getState().isSessionEnded(sessionId)).toBe(true);
    });

    it('should prevent adding segments to ended sessions', async () => {
      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      
      // Mark session as ended
      store.markSessionEnded(sessionId);
      
      // Should throw error when trying to add segment to ended session
      expect(() => {
        store.addSegment(sessionId, {
          type: 'scene',
          content: 'New content',
          timestamp: new Date(),
          updatedAt: getTimestamp(),
          metadata: {
            tags: []
          }
        });
      }).toThrow('Cannot add segments to an ended session');
    });

    it('should track multiple ended sessions independently', () => {
      const store = useNarrativeStore.getState();
      
      store.markSessionEnded('session-1');
      store.markSessionEnded('session-2');
      
      expect(store.isSessionEnded('session-1')).toBe(true);
      expect(store.isSessionEnded('session-2')).toBe(true);
      expect(store.isSessionEnded('session-3')).toBe(false);
    });
  });

  describe('worldClock integration in generateEnding', () => {
    beforeEach(() => {
      useWorldThreadStore.setState({
        threads: {},
        entities: {},
        sessionThreads: {},
        seedAttempts: {},
      });
    });

    it('should include worldClock in POST body when WORLD_CLOCK feature flag is enabled', async () => {
      (isFeatureEnabled as jest.Mock).mockImplementation((flag) => flag === 'WORLD_CLOCK');
      useWorldThreadStore.setState({
        threads: {
          'thread-1': {
            id: 'thread-1',
            sessionId: 'session-123',
            worldId: 'world-789',
            kind: 'actor',
            summary: 'Companion dragged off into woods',
            openedAtTurn: 7,
            lastAdvancedAtTurn: 7,
            status: 'open',
            notes: [],
            createdAt: getTimestamp(),
            updatedAt: getTimestamp(),
          },
        },
        sessionThreads: {
          'session-123': ['thread-1'],
        },
      });

      mockSuccessfulEndingGeneration(createMockGenerationResult());

      await useNarrativeStore.getState().generateEnding('player-choice', defaultEndingContext);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const postBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(postBody.worldClock).toBeDefined();
      expect(postBody.worldClock.threads).toHaveLength(1);
      expect(postBody.worldClock.threads[0].summary).toBe('Companion dragged off into woods');
    });

    it('should omit worldClock in POST body when WORLD_CLOCK feature flag is disabled', async () => {
      (isFeatureEnabled as jest.Mock).mockReturnValue(false);
      mockSuccessfulEndingGeneration(createMockGenerationResult());

      await useNarrativeStore.getState().generateEnding('player-choice', defaultEndingContext);

      expect(global.fetch).toHaveBeenCalledTimes(1);
      const postBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(postBody.worldClock).toBeUndefined();
    });
  });
});
