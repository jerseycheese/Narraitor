// src/state/__tests__/narrativeStore.ending.test.ts

import { useNarrativeStore } from '../narrativeStore';
import { endingGenerator } from '../../lib/ai/endingGenerator';
import type { 
  StoryEnding,
  EndingGenerationResult
} from '../../types/narrative.types';

// Mock the ending generator
jest.mock('../../lib/ai/endingGenerator');

describe('narrativeStore - Ending functionality', () => {
  beforeEach(() => {
    // Reset store state
    useNarrativeStore.setState({
      segments: {},
      sessionSegments: {},
      decisions: {},
      sessionDecisions: {},
      endedSessions: {}, // Add session locking state
      currentSegmentId: null,
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
      const mockGenerationResult: EndingGenerationResult = {
        epilogue: 'The hero saved the day...',
        characterLegacy: 'Remembered as a champion...',
        worldImpact: 'Peace was restored...',
        tone: 'triumphant',
        achievements: ['Hero', 'Savior'],
        playTime: 3600
      };

      (endingGenerator.generateEnding as jest.Mock).mockResolvedValue(mockGenerationResult);

      const store = useNarrativeStore.getState();
      
      await store.generateEnding('player-choice', {
        sessionId: 'session-123',
        characterId: 'char-456',
        worldId: 'world-789'
      });

      const updatedState = useNarrativeStore.getState();
      
      expect(updatedState.currentEnding).toMatchObject({
        id: expect.any(String),
        sessionId: 'session-123',
        characterId: 'char-456',
        worldId: 'world-789',
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
      let resolveGeneration: (value: EndingGenerationResult) => void;
      const generationPromise = new Promise<EndingGenerationResult>((resolve) => {
        resolveGeneration = resolve;
      });

      (endingGenerator.generateEnding as jest.Mock).mockReturnValue(generationPromise);

      const store = useNarrativeStore.getState();
      
      const generatePromise = store.generateEnding('story-complete', {
        sessionId: 'session-123',
        characterId: 'char-456',
        worldId: 'world-789'
      });

      // Check loading state is true
      expect(useNarrativeStore.getState().isGeneratingEnding).toBe(true);
      expect(useNarrativeStore.getState().endingError).toBeNull();

      // Resolve the generation
      resolveGeneration!({
        epilogue: 'Story complete...',
        characterLegacy: 'A legend...',
        worldImpact: 'Changed forever...',
        tone: 'triumphant',
        achievements: [],
        playTime: 1800
      });

      await generatePromise;

      // Check loading state is false
      expect(useNarrativeStore.getState().isGeneratingEnding).toBe(false);
    });

    it('should handle generation errors', async () => {
      const mockError = new Error('Failed to generate ending');
      (endingGenerator.generateEnding as jest.Mock).mockRejectedValue(mockError);

      const store = useNarrativeStore.getState();
      
      await store.generateEnding('session-limit', {
        sessionId: 'session-123',
        characterId: 'char-456',
        worldId: 'world-789'
      });

      const updatedState = useNarrativeStore.getState();
      
      expect(updatedState.currentEnding).toBeNull();
      expect(updatedState.endingError).toContain('Failed to generate ending');
      expect(updatedState.isGeneratingEnding).toBe(false);
    });

    it('should use custom prompt when provided', async () => {
      const mockGenerationResult: EndingGenerationResult = {
        epilogue: 'Custom ending...',
        characterLegacy: 'Custom legacy...',
        worldImpact: 'Custom impact...',
        tone: 'mysterious',
        achievements: [],
        playTime: 0
      };

      (endingGenerator.generateEnding as jest.Mock).mockResolvedValue(mockGenerationResult);

      const store = useNarrativeStore.getState();
      
      await store.generateEnding('character-retirement', {
        sessionId: 'session-123',
        characterId: 'char-456',
        worldId: 'world-789',
        customPrompt: 'The character retires to a peaceful cottage'
      });

      expect(endingGenerator.generateEnding).toHaveBeenCalledWith({
        sessionId: 'session-123',
        characterId: 'char-456',
        worldId: 'world-789',
        endingType: 'character-retirement',
        customPrompt: 'The character retires to a peaceful cottage'
      });
    });

    it('should use desired tone when provided', async () => {
      const mockGenerationResult: EndingGenerationResult = {
        epilogue: 'Bittersweet ending...',
        characterLegacy: 'Mixed legacy...',
        worldImpact: 'Complex impact...',
        tone: 'bittersweet',
        achievements: [],
        playTime: 0
      };

      (endingGenerator.generateEnding as jest.Mock).mockResolvedValue(mockGenerationResult);

      const store = useNarrativeStore.getState();
      
      await store.generateEnding('player-choice', {
        sessionId: 'session-123',
        characterId: 'char-456',
        worldId: 'world-789',
        desiredTone: 'bittersweet'
      });

      expect(endingGenerator.generateEnding).toHaveBeenCalledWith({
        sessionId: 'session-123',
        characterId: 'char-456',
        worldId: 'world-789',
        endingType: 'player-choice',
        desiredTone: 'bittersweet'
      });
    });
  });

  describe('clearEnding', () => {
    it('should clear the current ending', () => {
      const mockEnding: StoryEnding = {
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
        createdAt: new Date(),
        updatedAt: new Date()
      };

      useNarrativeStore.setState({
        currentEnding: mockEnding,
        endingError: 'Some error'
      });

      const store = useNarrativeStore.getState();
      store.clearEnding();

      const updatedState = useNarrativeStore.getState();
      expect(updatedState.currentEnding).toBeNull();
      expect(updatedState.endingError).toBeNull();
    });
  });

  describe('saveEndingToHistory', () => {
    it('should save ending to segments for persistence', async () => {
      const mockEnding: StoryEnding = {
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
        createdAt: new Date(),
        updatedAt: new Date()
      };

      useNarrativeStore.setState({
        currentEnding: mockEnding
      });

      const store = useNarrativeStore.getState();
      store.saveEndingToHistory();

      const updatedState = useNarrativeStore.getState();
      
      // Should create a special segment for the ending
      const endingSegment = Object.values(updatedState.segments).find(
        seg => seg.type === 'ending' && seg.metadata.endingId === 'ending-123'
      );

      expect(endingSegment).toBeDefined();
      expect(endingSegment?.content).toContain('The end...');
      expect(endingSegment?.metadata.tone).toBe('triumphant');
    });
  });

  describe('hasActiveEnding', () => {
    it('should return true when ending exists', () => {
      const mockEnding: StoryEnding = {
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
        createdAt: new Date(),
        updatedAt: new Date()
      };

      useNarrativeStore.setState({
        currentEnding: mockEnding
      });

      const store = useNarrativeStore.getState();
      expect(store.hasActiveEnding()).toBe(true);
    });

    it('should return false when no ending exists', () => {
      const store = useNarrativeStore.getState();
      expect(store.hasActiveEnding()).toBe(false);
    });
  });

  describe('getEndingForSession', () => {
    it('should retrieve ending for a specific session', () => {
      const mockEnding: StoryEnding = {
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
        createdAt: new Date(),
        updatedAt: new Date()
      };

      useNarrativeStore.setState({
        segments: {
          'seg-ending': {
            id: 'seg-ending',
            type: 'ending',
            content: 'Ending content',
            sessionId: 'session-123',
            metadata: {
              tags: ['ending'],
              endingId: 'ending-123',
              endingData: mockEnding
            },
            timestamp: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      });

      const store = useNarrativeStore.getState();
      const ending = store.getEndingForSession('session-123');

      expect(ending).toMatchObject({
        id: 'ending-123',
        sessionId: 'session-123',
        type: 'story-complete'
      });
    });

    it('should return null if no ending exists for session', () => {
      const store = useNarrativeStore.getState();
      const ending = store.getEndingForSession('non-existent-session');

      expect(ending).toBeNull();
    });
  });

  describe('Session Locking', () => {
    it('should mark session as ended when ending is generated', async () => {
      const mockGenerationResult = {
        epilogue: 'The story concludes...',
        characterLegacy: 'A hero remembered...',
        worldImpact: 'Peace restored...',
        tone: 'triumphant' as const,
        achievements: ['Hero'],
        playTime: 3600
      };

      (endingGenerator.generateEnding as jest.Mock).mockResolvedValue(mockGenerationResult);

      const store = useNarrativeStore.getState();
      const sessionId = 'session-123';
      
      // Session should not be ended initially
      expect(store.isSessionEnded(sessionId)).toBe(false);

      await store.generateEnding('player-choice', {
        sessionId,
        characterId: 'char-456',
        worldId: 'world-789'
      });

      // Session should be marked as ended after generating ending
      expect(store.isSessionEnded(sessionId)).toBe(true);
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
          metadata: {}
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
});