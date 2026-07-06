import type { PersistOptions } from 'zustand/middleware';
import { NarrativeSegment, PromptDebugInfo } from '../types/narrative.types';
import { EntityID } from '../types/common.types';
import { createIndexedDBStorage } from './persistence';
import type { NarrativeStore } from './narrativeStore.types';

/**
 * Serialized version of PromptDebugInfo for IndexedDB storage.
 * Date fields are converted to ISO strings for persistence.
 */
type SerializedPromptDebugInfo = Omit<PromptDebugInfo, 'generatedAt' | 'recentDecisions'> & {
  generatedAt: string;
  recentDecisions?: Array<{
    decisionText: string;
    selectedOption: string;
    timestamp: string;
  }>;
};

type PersistedNarrativeState = Pick<
  NarrativeStore,
  'segments' | 'sessionSegments' | 'decisions' | 'sessionDecisions' | 'endedSessions' | 'currentEnding'
>;

/**
 * Persist configuration for the narrative store. Moved out of
 * narrativeStore.ts verbatim — storage name, version, and (de)serialization
 * behavior must stay byte-identical to existing player data.
 */
export const narrativePersistOptions: PersistOptions<NarrativeStore, PersistedNarrativeState> = {
  name: 'narraitor-narrative-store',
  storage: createIndexedDBStorage<PersistedNarrativeState>(),
  version: 1,
  // Persist narrative data to maintain story progress across browser refreshes
  partialize: (state) => {
    // Convert Date objects in debugInfo to ISO strings for persistence
    const segmentsWithSerializedDebug = Object.entries(state.segments).reduce(
      (acc, [id, segment]) => {
        if (segment.metadata?.debugInfo) {
          // Serialize Date objects in debugInfo
          const serializedDebugInfo: SerializedPromptDebugInfo = {
            ...segment.metadata.debugInfo,
            generatedAt: segment.metadata.debugInfo.generatedAt instanceof Date
              ? segment.metadata.debugInfo.generatedAt.toISOString()
              : String(segment.metadata.debugInfo.generatedAt),
            recentDecisions: segment.metadata.debugInfo.recentDecisions?.map((decision) => ({
              ...decision,
              timestamp: decision.timestamp instanceof Date
                ? decision.timestamp.toISOString()
                : String(decision.timestamp),
            })),
          };
          acc[id] = {
            ...segment,
            metadata: {
              ...segment.metadata,
              debugInfo: serializedDebugInfo as unknown as PromptDebugInfo,
            },
          };
        } else {
          acc[id] = segment;
        }
        return acc;
      },
      {} as Record<EntityID, NarrativeSegment>
    );

    return {
      segments: segmentsWithSerializedDebug,
      sessionSegments: state.sessionSegments,
      decisions: state.decisions,
      sessionDecisions: state.sessionDecisions,
      endedSessions: state.endedSessions,
      currentEnding: state.currentEnding,
    };
  },
  onRehydrateStorage: () => (state) => {
    if (state) {
      // Deserialize Date objects in debugInfo after rehydration
      const deserializedSegments = Object.entries(state.segments).reduce(
        (acc, [id, segment]) => {
          if (segment.metadata?.debugInfo) {
            // Convert ISO strings back to Date objects
            // At this point, debugInfo has been deserialized from JSON, so timestamps are strings
            const serializedDebugInfo = segment.metadata.debugInfo as unknown as SerializedPromptDebugInfo;
            const deserializedDebugInfo: PromptDebugInfo = {
              ...serializedDebugInfo,
              generatedAt: new Date(serializedDebugInfo.generatedAt),
              recentDecisions: serializedDebugInfo.recentDecisions?.map((decision) => ({
                ...decision,
                timestamp: new Date(decision.timestamp),
              })),
            };
            acc[id] = {
              ...segment,
              metadata: {
                ...segment.metadata,
                debugInfo: deserializedDebugInfo,
              },
            };
          } else {
            acc[id] = segment;
          }
          return acc;
        },
        {} as Record<EntityID, NarrativeSegment>
      );

      // Update state with deserialized segments
      state.segments = deserializedSegments;

      // Use proper state setter to trigger subscriptions
      state.setHasHydrated(true);
    }
  },
};
