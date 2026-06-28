import type { Decision, NarrativeSegment, StoryEnding } from '../types/narrative.types';
import type { EntityID } from '../types/common.types';
import type { NarrativeError } from '../lib/narrative/narrativeErrors';

// Initial state
export const getInitialState = () => ({
  segments: {} as Record<EntityID, NarrativeSegment>,
  sessionSegments: {} as Record<EntityID, EntityID[]>,
  decisions: {} as Record<EntityID, Decision>,
  sessionDecisions: {} as Record<EntityID, EntityID[]>,
  endedSessions: {} as Record<EntityID, boolean>,
  currentEnding: null as StoryEnding | null,
  isGeneratingEnding: false,
  endingError: null as string | null,
  error: null as string | null,
  generationError: null as NarrativeError | null,
  loading: false,
  _hasHydrated: false,
});
