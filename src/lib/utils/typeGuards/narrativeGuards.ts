// src/lib/utils/typeGuards/narrativeGuards.ts
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { NarrativeSegment } from '@/types/narrative.types';

// Boolean type guards for TypeScript type narrowing
// These provide runtime type checking with narrowed return types for compatibility

export function isNarrativeSegment(obj: unknown): obj is NarrativeSegment {
  return obj !== null &&
    obj !== undefined &&
    typeof obj === 'object' &&
    'id' in obj &&
    'worldId' in obj &&
    'sessionId' in obj &&
    'content' in obj &&
    'type' in obj &&
    'characterIds' in obj &&
    'metadata' in obj &&
    'createdAt' in obj &&
    'updatedAt' in obj &&
    Array.isArray((obj as any).characterIds) &&
    typeof (obj as any).metadata === 'object';
}
