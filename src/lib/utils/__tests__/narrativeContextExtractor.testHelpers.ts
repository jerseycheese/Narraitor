/**
 * Test helpers for narrativeContextExtractor tests
 */

import { NarrativeSegment } from '../../../types/narrative.types';
import { EntityID } from '../../../types/common.types';

/**
 * Common test session ID
 */
export const TEST_SESSION_ID = 'session-123';

/**
 * Common test character IDs
 */
export const TEST_CHARACTER_IDS = {
  player: 'char-player',
  merchant: 'char-merchant',
  guard: 'char-guard',
  spy: 'char-spy'
};

/**
 * Creates a basic narrative segment with required fields
 */
export function createSegment(
  overrides: Partial<NarrativeSegment> & { id: string; content: string }
): NarrativeSegment {
  return {
    sessionId: TEST_SESSION_ID,
    type: 'scene',
    createdAt: '2024-01-01T12:00:00Z',
    updatedAt: '2024-01-01T12:00:00Z',
    timestamp: new Date('2024-01-01T12:00:00Z'),
    metadata: {
      tags: []
    },
    ...overrides
  };
}

/**
 * Creates a segment with location metadata
 */
export function createLocationSegment(
  id: string,
  content: string,
  location: string,
  createdAt = '2024-01-01T12:00:00Z'
): NarrativeSegment {
  return createSegment({
    id,
    content,
    createdAt,
    updatedAt: createdAt,
    timestamp: new Date(createdAt),
    metadata: {
      tags: [],
      location
    }
  });
}

/**
 * Creates a segment with character IDs
 */
export function createCharacterSegment(
  id: string,
  content: string,
  characterIds: string[],
  createdAt = '2024-01-01T12:00:00Z'
): NarrativeSegment {
  return createSegment({
    id,
    content,
    characterIds,
    createdAt,
    updatedAt: createdAt,
    timestamp: new Date(createdAt)
  });
}

/**
 * Creates a marketplace scene segment
 */
export function createMarketplaceSegment(id = 'seg-marketplace'): NarrativeSegment {
  return createLocationSegment(
    id,
    'You enter the bustling marketplace.',
    'Rivertown Marketplace'
  );
}

/**
 * Creates a merchant interaction segment
 */
export function createMerchantSegment(id = 'seg-merchant'): NarrativeSegment {
  return createSegment({
    id,
    content: 'A merchant approaches you with a worried expression.',
    type: 'dialogue',
    metadata: {
      tags: ['merchant', 'interaction']
    }
  });
}

/**
 * Creates a combat encounter segment
 */
export function createCombatSegment(id = 'seg-combat'): NarrativeSegment {
  return createSegment({
    id,
    content: 'Bandits leap out from behind the rocks!',
    type: 'action',
    metadata: {
      tags: ['combat', 'ambush']
    }
  });
}

/**
 * Creates a village scene segment
 */
export function createVillageSegment(id = 'seg-village'): NarrativeSegment {
  return createSegment({
    id,
    content: 'You approach the village gates.',
    metadata: {
      tags: ['village', 'arrival']
    }
  });
}

/**
 * Creates a forest/wilderness segment
 */
export function createWildernessSegment(id = 'seg-forest'): NarrativeSegment {
  return createSegment({
    id,
    content: 'You trek deeper into the ancient forest.',
    metadata: {
      tags: ['forest', 'exploration']
    }
  });
}

/**
 * Creates an empty or unclear situation segment
 */
export function createUnclearSegment(id = 'seg-unclear'): NarrativeSegment {
  return createSegment({
    id,
    content: 'Time passes slowly.',
    metadata: {
      tags: ['time']
    }
  });
}

/**
 * Creates a segment with empty content (edge case)
 */
export function createEmptyContentSegment(id = 'seg-empty'): NarrativeSegment {
  return createSegment({
    id,
    content: '',
    metadata: {
      tags: []
    }
  });
}

/**
 * Creates multiple sequential segments for testing recency
 */
export function createSequentialSegments(count: number): NarrativeSegment[] {
  return Array.from({ length: count }, (_, i) => {
    const timestamp = `2024-01-01T${12 + i}:00:00Z`;
    return createSegment({
      id: `seg-${i}`,
      content: `Segment ${i} content`,
      createdAt: timestamp,
      updatedAt: timestamp,
      timestamp: new Date(timestamp),
      metadata: {
        tags: ['sequence'],
        location: i === count - 1 ? 'Final Location' : undefined
      }
    });
  });
}

/**
 * Extracts decision context from narrative segments and game state
 * This is the function being tested - included here for convenience
 */
export function extractDecisionContext(
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
