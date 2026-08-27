/**
 * Tests for extractRecentNarrative sort order and formatting
 */

import { extractRecentNarrative } from '../endingGenerator';
import type { NarrativeSegment } from '../../../types/narrative.types';
import { getTimestamp } from '../../utils/timestamp';

describe('extractRecentNarrative', () => {
  it('returns the 10 most recent segments in chronological order and formats dialogue', () => {
    const baseTime = new Date('2026-01-01T12:00:00Z').getTime();

    // Build 12 segments with staggered timestamps (seg-1 is oldest, seg-12 is newest)
    const segments: NarrativeSegment[] = Array.from({ length: 12 }, (_, i) => {
      const index = i + 1;
      const isDialogue = index === 6;
      return {
        id: `seg-${index}`,
        content: isDialogue ? `Hello from segment ${index}` : `Segment ${index} content`,
        type: isDialogue ? 'dialogue' : 'action',
        sessionId: 'session-789',
        worldId: 'world-123',
        metadata: { tags: [], mood: 'neutral' },
        timestamp: new Date(baseTime + index * 60000),
        createdAt: getTimestamp(),
        updatedAt: getTimestamp(),
      };
    });

    const result = extractRecentNarrative(segments);

    expect(result).toHaveLength(10);

    // The two earliest segments (seg-1 and seg-2) should be dropped
    expect(result).not.toContain('Segment 1 content');
    expect(result).not.toContain('Segment 2 content');

    // The 10 most recent segments should survive in chronological (oldest-first) order
    expect(result[0]).toBe('Segment 3 content');
    expect(result[1]).toBe('Segment 4 content');
    expect(result[2]).toBe('Segment 5 content');
    expect(result[3]).toBe('Dialogue: Hello from segment 6');
    expect(result[4]).toBe('Segment 7 content');
    expect(result[5]).toBe('Segment 8 content');
    expect(result[6]).toBe('Segment 9 content');
    expect(result[7]).toBe('Segment 10 content');
    expect(result[8]).toBe('Segment 11 content');
    expect(result[9]).toBe('Segment 12 content');
  });
});
