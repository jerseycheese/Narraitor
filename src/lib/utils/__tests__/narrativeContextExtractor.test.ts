/**
 * Tests for narrative context extraction used in Issue #142 integration
 * 
 * This module tests the logic that extracts relevant context information
 * from narrative segments and game state for PlayerDecisionTracker.
 * 
 * Focus: Context extraction accuracy and completeness
 */

import { NarrativeSegment } from '../../../types/narrative.types';
import { EntityID } from '../../../types/common.types';

/**
 * Extracts decision context from narrative segments and game state
 * This function will be implemented as part of Issue #142
 */
function extractDecisionContext(
  sessionSegments: NarrativeSegment[],
  sessionId: EntityID,
  characterId?: EntityID
): {
  location?: string;
  situation?: string;
  charactersPresent?: string[];
} {
  // This is a placeholder implementation for testing
  if (sessionSegments.length === 0) {
    return {};
  }

  // Get the most recent segments for context
  const recentSegments = sessionSegments
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  // Extract location from metadata
  const location = recentSegments
    .map(segment => segment.metadata?.location)
    .find(loc => loc);

  // Extract situation from recent narrative content
  const recentContent = recentSegments
    .map(segment => segment.content)
    .join(' ')
    .toLowerCase();

  let situation: string | undefined;
  if (recentContent.includes('merchant') || recentContent.includes('trade')) {
    situation = 'merchant interaction';
  } else if (recentContent.includes('combat') || recentContent.includes('fight') || recentContent.includes('battle')) {
    situation = 'combat encounter';
  } else if (recentContent.includes('village') || recentContent.includes('town')) {
    situation = 'settlement visit';
  } else if (recentContent.includes('forest') || recentContent.includes('wilderness')) {
    situation = 'wilderness exploration';
  } else if (recentContent.includes('dungeon') || recentContent.includes('cave')) {
    situation = 'dungeon exploration';
  }

  // Extract characters present from segment metadata
  const charactersPresent = Array.from(new Set(
    recentSegments
      .flatMap(segment => segment.characterIds || [])
      .filter(id => id !== characterId) // Exclude the decision-making character
  ));

  return {
    location,
    situation,
    charactersPresent: charactersPresent.length > 0 ? charactersPresent : undefined
  };
}

describe('Narrative Context Extraction for PlayerDecisionTracker Integration', () => {
  describe('Location Extraction', () => {
    it('should extract location from segment metadata', () => {
      const segments: NarrativeSegment[] = [
        {
          id: 'seg-1',
          sessionId: 'session-123',
          content: 'You enter the bustling marketplace.',
          type: 'scene',
          createdAt: '2024-01-01T12:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          metadata: {
            tags: ['marketplace', 'entrance'],
            location: 'Rivertown Marketplace'
          }
        },
        {
          id: 'seg-2',
          sessionId: 'session-123',
          content: 'Merchants call out their wares.',
          type: 'scene',
          createdAt: '2024-01-01T12:01:00Z',
          updatedAt: '2024-01-01T12:01:00Z',
          timestamp: new Date('2024-01-01T12:01:00Z'),
          metadata: {
            tags: ['atmosphere']
          }
        }
      ];

      const context = extractDecisionContext(segments, 'session-123');
      
      expect(context.location).toBe('Rivertown Marketplace');
    });

    it('should use most recent location when multiple exist', () => {
      const segments: NarrativeSegment[] = [
        {
          id: 'seg-1',
          sessionId: 'session-123',
          content: 'You leave the tavern.',
          type: 'transition',
          createdAt: '2024-01-01T12:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          metadata: {
            tags: ['departure'],
            location: 'The Prancing Pony Tavern'
          }
        },
        {
          id: 'seg-2',
          sessionId: 'session-123',
          content: 'You arrive at the town square.',
          type: 'scene',
          createdAt: '2024-01-01T12:02:00Z', // More recent
          updatedAt: '2024-01-01T12:02:00Z',
          timestamp: new Date('2024-01-01T12:02:00Z'),
          metadata: {
            tags: ['arrival'],
            location: 'Millhaven Town Square'
          }
        }
      ];

      const context = extractDecisionContext(segments, 'session-123');
      
      // Should use the more recent location
      expect(context.location).toBe('Millhaven Town Square');
    });

    it('should handle segments without location metadata', () => {
      const segments: NarrativeSegment[] = [
        {
          id: 'seg-1',
          sessionId: 'session-123',
          content: 'You think about your next move.',
          type: 'scene',
          createdAt: '2024-01-01T12:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          metadata: {
            tags: ['introspection']
            // No location
          }
        }
      ];

      const context = extractDecisionContext(segments, 'session-123');
      
      expect(context.location).toBeUndefined();
    });
  });

  describe('Situation Analysis', () => {
    it('should identify merchant interaction situations', () => {
      const segments: NarrativeSegment[] = [
        {
          id: 'seg-1',
          sessionId: 'session-123',
          content: 'A merchant approaches you with a worried expression.',
          type: 'dialogue',
          createdAt: '2024-01-01T12:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          metadata: {
            tags: ['merchant', 'interaction']
          }
        },
        {
          id: 'seg-2',
          sessionId: 'session-123',
          content: 'He tells you about his stolen goods.',
          type: 'dialogue',
          createdAt: '2024-01-01T12:01:00Z',
          updatedAt: '2024-01-01T12:01:00Z',
          timestamp: new Date('2024-01-01T12:01:00Z'),
          metadata: {
            tags: ['information']
          }
        }
      ];

      const context = extractDecisionContext(segments, 'session-123');
      
      expect(context.situation).toBe('merchant interaction');
    });

    it('should identify combat encounter situations', () => {
      const segments: NarrativeSegment[] = [
        {
          id: 'seg-1',
          sessionId: 'session-123',
          content: 'Bandits leap out from behind the rocks!',
          type: 'action',
          createdAt: '2024-01-01T12:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          metadata: {
            tags: ['combat', 'ambush']
          }
        },
        {
          id: 'seg-2',
          sessionId: 'session-123',
          content: 'They draw their weapons and prepare to fight.',
          type: 'action',
          createdAt: '2024-01-01T12:01:00Z',
          updatedAt: '2024-01-01T12:01:00Z',
          timestamp: new Date('2024-01-01T12:01:00Z'),
          metadata: {
            tags: ['threat']
          }
        }
      ];

      const context = extractDecisionContext(segments, 'session-123');
      
      expect(context.situation).toBe('combat encounter');
    });

    it('should identify settlement visit situations', () => {
      const segments: NarrativeSegment[] = [
        {
          id: 'seg-1',
          sessionId: 'session-123',
          content: 'You approach the village gates.',
          type: 'scene',
          createdAt: '2024-01-01T12:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          metadata: {
            tags: ['village', 'arrival']
          }
        },
        {
          id: 'seg-2',
          sessionId: 'session-123',
          content: 'The villagers eye you curiously.',
          type: 'scene',
          createdAt: '2024-01-01T12:01:00Z',
          updatedAt: '2024-01-01T12:01:00Z',
          timestamp: new Date('2024-01-01T12:01:00Z'),
          metadata: {
            tags: ['social']
          }
        }
      ];

      const context = extractDecisionContext(segments, 'session-123');
      
      expect(context.situation).toBe('settlement visit');
    });

    it('should identify wilderness exploration situations', () => {
      const segments: NarrativeSegment[] = [
        {
          id: 'seg-1',
          sessionId: 'session-123',
          content: 'You trek deeper into the ancient forest.',
          type: 'scene',
          createdAt: '2024-01-01T12:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          metadata: {
            tags: ['forest', 'exploration']
          }
        }
      ];

      const context = extractDecisionContext(segments, 'session-123');
      
      expect(context.situation).toBe('wilderness exploration');
    });

    it('should handle unclear situations gracefully', () => {
      const segments: NarrativeSegment[] = [
        {
          id: 'seg-1',
          sessionId: 'session-123',
          content: 'Time passes slowly.',
          type: 'scene',
          createdAt: '2024-01-01T12:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          metadata: {
            tags: ['time']
          }
        }
      ];

      const context = extractDecisionContext(segments, 'session-123');
      
      expect(context.situation).toBeUndefined();
    });
  });

  describe('Character Presence Detection', () => {
    it('should extract characters present from segment metadata', () => {
      const segments: NarrativeSegment[] = [
        {
          id: 'seg-1',
          sessionId: 'session-123',
          content: 'The merchant and his guard approach.',
          type: 'scene',
          characterIds: ['char-merchant', 'char-guard', 'char-player'],
          createdAt: '2024-01-01T12:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          metadata: {
            tags: ['encounter']
          }
        },
        {
          id: 'seg-2',
          sessionId: 'session-123',
          content: 'A suspicious figure watches from the shadows.',
          type: 'scene',
          characterIds: ['char-spy', 'char-player'],
          createdAt: '2024-01-01T12:01:00Z',
          updatedAt: '2024-01-01T12:01:00Z',
          timestamp: new Date('2024-01-01T12:01:00Z'),
          metadata: {
            tags: ['mystery']
          }
        }
      ];

      const context = extractDecisionContext(segments, 'session-123', 'char-player');
      
      // Should include all characters except the player character
      expect(context.charactersPresent).toEqual(
        expect.arrayContaining(['char-merchant', 'char-guard', 'char-spy'])
      );
      expect(context.charactersPresent).not.toContain('char-player');
    });

    it('should handle duplicate character IDs correctly', () => {
      const segments: NarrativeSegment[] = [
        {
          id: 'seg-1',
          sessionId: 'session-123',
          content: 'The merchant speaks.',
          type: 'dialogue',
          characterIds: ['char-merchant', 'char-player'],
          createdAt: '2024-01-01T12:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          metadata: {
            tags: ['conversation']
          }
        },
        {
          id: 'seg-2',
          sessionId: 'session-123',
          content: 'The merchant continues speaking.',
          type: 'dialogue',
          characterIds: ['char-merchant', 'char-player'], // Same characters again
          createdAt: '2024-01-01T12:01:00Z',
          updatedAt: '2024-01-01T12:01:00Z',
          timestamp: new Date('2024-01-01T12:01:00Z'),
          metadata: {
            tags: ['conversation']
          }
        }
      ];

      const context = extractDecisionContext(segments, 'session-123', 'char-player');
      
      // Should deduplicate character IDs
      expect(context.charactersPresent).toEqual(['char-merchant']);
      expect(context.charactersPresent).toHaveLength(1);
    });

    it('should return undefined for charactersPresent when no other characters exist', () => {
      const segments: NarrativeSegment[] = [
        {
          id: 'seg-1',
          sessionId: 'session-123',
          content: 'You walk alone through the empty corridor.',
          type: 'scene',
          characterIds: ['char-player'], // Only the player
          createdAt: '2024-01-01T12:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          metadata: {
            tags: ['solitude']
          }
        }
      ];

      const context = extractDecisionContext(segments, 'session-123', 'char-player');
      
      expect(context.charactersPresent).toBeUndefined();
    });

    it('should handle segments without characterIds', () => {
      const segments: NarrativeSegment[] = [
        {
          id: 'seg-1',
          sessionId: 'session-123',
          content: 'The wind blows through the trees.',
          type: 'scene',
          // No characterIds
          createdAt: '2024-01-01T12:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          metadata: {
            tags: ['atmosphere']
          }
        }
      ];

      const context = extractDecisionContext(segments, 'session-123');
      
      expect(context.charactersPresent).toBeUndefined();
    });
  });

  describe('Edge Cases and Robustness', () => {
    it('should handle empty segment list', () => {
      const context = extractDecisionContext([], 'session-123');
      
      expect(context).toEqual({});
    });

    it('should focus on recent segments for context', () => {
      // Create many segments to test that only recent ones are considered
      const segments: NarrativeSegment[] = Array.from({ length: 10 }, (_, i) => ({
        id: `seg-${i}`,
        sessionId: 'session-123',
        content: `Segment ${i} content`,
        type: 'scene' as const,
        createdAt: `2024-01-01T${12 + i}:00:00Z`,
        updatedAt: `2024-01-01T${12 + i}:00:00Z`,
        timestamp: new Date(`2024-01-01T${12 + i}:00:00Z`),
        metadata: {
          tags: ['sequence'],
          location: i === 9 ? 'Final Location' : undefined // Only the most recent has location
        }
      }));

      const context = extractDecisionContext(segments, 'session-123');
      
      // Should use the most recent location
      expect(context.location).toBe('Final Location');
    });

    it('should handle malformed segment data gracefully', () => {
      const segments: NarrativeSegment[] = [
        {
          id: 'seg-1',
          sessionId: 'session-123',
          content: '', // Empty content
          type: 'scene',
          createdAt: '2024-01-01T12:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          metadata: {
            tags: []
            // No other metadata
          }
        }
      ];

      expect(() => {
        extractDecisionContext(segments, 'session-123');
      }).not.toThrow();
    });

    it('should maintain consistent results for identical inputs', () => {
      const segments: NarrativeSegment[] = [
        {
          id: 'seg-1',
          sessionId: 'session-123',
          content: 'A merchant greets you in the marketplace.',
          type: 'dialogue',
          characterIds: ['char-merchant'],
          createdAt: '2024-01-01T12:00:00Z',
          updatedAt: '2024-01-01T12:00:00Z',
          timestamp: new Date('2024-01-01T12:00:00Z'),
          metadata: {
            tags: ['greeting'],
            location: 'Town Marketplace'
          }
        }
      ];

      // Call multiple times with same input
      const results = Array(5).fill(null).map(() => 
        extractDecisionContext(segments, 'session-123', 'char-player')
      );

      // All results should be identical
      results.forEach(result => {
        expect(result).toEqual(results[0]);
      });
    });
  });
});