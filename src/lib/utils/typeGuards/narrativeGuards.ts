// src/lib/utils/typeGuards/narrativeGuards.ts

import type { NarrativeSegment } from '@/types/narrative.types';

// Boolean type guards for TypeScript type narrowing
// These provide runtime type checking with narrowed return types for compatibility

function isNarrativeSegment(obj: unknown): obj is NarrativeSegment {
  if (obj === null || obj === undefined || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return 'id' in o &&
    'worldId' in o &&
    'sessionId' in o &&
    'content' in o &&
    'type' in o &&
    'characterIds' in o &&
    'metadata' in o &&
    'createdAt' in o &&
    'updatedAt' in o &&
    Array.isArray(o.characterIds) &&
    typeof o.metadata === 'object';
}
