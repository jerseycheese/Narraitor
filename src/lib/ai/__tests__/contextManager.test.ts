import { NarrativeContextManager } from '../contextManager';

describe('NarrativeContextManager', () => {
  let contextManager: NarrativeContextManager;

  beforeEach(() => {
    contextManager = new NarrativeContextManager();
  });

  describe('addSegment', () => {
    it('adds a narrative segment to the context', () => {
      const segment = {
        id: 'seg-1',
        content: 'The forest was dark and mysterious.',
        type: 'scene' as const,
        metadata: {
          characterIds: ['char-1'],
          location: 'Dark Forest',
          mood: 'mysterious' as const,
          tags: ['forest', 'mystery']
        }
      };

      contextManager.addSegment(segment);
      const optimizedContext = contextManager.getOptimizedContext(1000);

      expect(optimizedContext).toContain('The forest was dark and mysterious');
    });

    it('maintains recent segments for context continuity', () => {
      const segments = [
        {
          id: 'seg-1',
          content: 'First segment content.',
          type: 'scene' as const,
          metadata: { characterIds: [], tags: [] }
        },
        {
          id: 'seg-2', 
          content: 'Second segment content.',
          type: 'dialogue' as const,
          metadata: { characterIds: [], tags: [] }
        }
      ];

      segments.forEach(seg => contextManager.addSegment(seg));
      const optimizedContext = contextManager.getOptimizedContext(1000);

      expect(optimizedContext).toContain('First segment');
      expect(optimizedContext).toContain('Second segment');
    });
  });

  describe('getOptimizedContext', () => {
    it('respects token limits when returning context', () => {
      // Add multiple segments
      for (let i = 0; i < 10; i++) {
        contextManager.addSegment({
          id: `seg-${i}`,
          content: `This is a long segment with lots of content that should be truncated when necessary. Segment number ${i}.`,
          type: 'scene' as const,
          metadata: { characterIds: [], tags: [] }
        });
      }

      // Request a small context
      const optimizedContext = contextManager.getOptimizedContext(100);
      
      // Should prioritize recent segments
      expect(optimizedContext).toContain('Segment number 9');
      expect(optimizedContext.length).toBeLessThan(400); // Roughly 100 tokens
    });
  });

  describe('getPrioritizedElements', () => {
    it('returns elements sorted by priority', () => {
      const segments = [
        {
          id: 'seg-1',
          content: 'Important plot point.',
          type: 'scene' as const,
          metadata: { 
            characterIds: ['main-char'],
            tags: ['plot-critical']
          }
        },
        {
          id: 'seg-2',
          content: 'Minor detail.',
          type: 'scene' as const,
          metadata: { 
            characterIds: [],
            tags: ['detail']
          }
        }
      ];

      segments.forEach(seg => contextManager.addSegment(seg));
      const prioritized = contextManager.getPrioritizedElements();

      expect(prioritized[0].content).toContain('Important plot point');
      expect(prioritized[0].priority).toBeGreaterThan(prioritized[1].priority);
    });
  });

  describe('clear', () => {
    it('removes all context', () => {
      contextManager.addSegment({
        id: 'seg-1',
        content: 'Some content',
        type: 'scene' as const,
        metadata: { characterIds: [], tags: [] }
      });

      contextManager.clear();
      const optimizedContext = contextManager.getOptimizedContext(1000);

      expect(optimizedContext).toBe('');
    });
  });
});