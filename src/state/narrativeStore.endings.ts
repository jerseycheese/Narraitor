import { NarrativeSegment, StoryEnding, EndingType, EndingTone } from '../types/narrative.types';
import { EntityID } from '../types/common.types';
import { World } from '../types/world.types';
import { JournalEntry } from '../types/journal.types';
import type { StoreCharacter } from './characterStore.types';
import { generateUniqueId } from '../lib/utils';
import { logger } from '../lib/utils/logger';
import { aiFetch } from '@/lib/ai/aiFetch';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { buildWorldClockPromptContext, countWorldClockTurns } from '@/lib/narrative/worldClock';
import { useSessionStore } from './sessionStore';
import { useJournalStore } from './journalStore';
import { useWorldThreadStore } from './worldThreadStore';
import { trackFunnelStep } from '@/lib/analytics/trackFunnelStep';
import type { NarrativeStoreSet, NarrativeStoreGet } from './narrativeStore.types';

const FALLBACK_ENDING_TONE: EndingTone = 'hopeful';

type EndingParams = {
  sessionId: EntityID;
  characterId: EntityID;
  worldId: EntityID;
  desiredTone?: EndingTone;
  customPrompt?: string;
  world?: World;
  character?: StoreCharacter;
};

const buildLocalEnding = ({
  endingType,
  params,
  narrativeSegments,
  journalEntries,
}: {
  endingType: EndingType;
  params: EndingParams;
  narrativeSegments: NarrativeSegment[];
  journalEntries: JournalEntry[];
}): StoryEnding => {
  const now = new Date();
  const isoNow = now.toISOString();
  const worldName = params.world?.name || 'their world';
  const characterName = params.character?.name || 'The character';

  const recentNarrative = narrativeSegments
    .slice(-3)
    .map((segment) => segment.content?.trim())
    .filter(Boolean)
    .join(' ');

  const epilogue = recentNarrative
    ? `${recentNarrative} As the dust settles, ${characterName} closes this chapter in ${worldName}.`
    : `${characterName} closes this chapter in ${worldName}, leaving the streets quieter than before.`;

  const journalHighlight = journalEntries.find((entry) => typeof entry?.content === 'string') as
    | { content?: string }
    | undefined;

  const characterLegacy = journalHighlight?.content
    ? `${characterName} is remembered for ${journalHighlight.content}`
    : `${characterName} leaves a mark on everyone they crossed paths with.`;

  const worldImpact = `In ${worldName}, the ripples of this story linger, whispered about by those who witnessed it.`;

  const achievements = journalEntries
    .map((entry) => (entry?.title as string) || (entry?.content as string) || '')
    .filter((text) => text)
    .slice(-3);

  return {
    id: generateUniqueId('ending'),
    sessionId: params.sessionId,
    characterId: params.characterId,
    worldId: params.worldId,
    type: endingType,
    tone: params.desiredTone ?? FALLBACK_ENDING_TONE,
    epilogue,
    characterLegacy,
    worldImpact,
    timestamp: now,
    createdAt: isoNow,
    updatedAt: isoNow,
    achievements,
    playTime: undefined,
  };
};

export const createNarrativeEndingActions = (
  set: NarrativeStoreSet,
  get: NarrativeStoreGet
) => ({
  generateEnding: async (endingType: EndingType, params: EndingParams) => {
    set({ isGeneratingEnding: true, endingError: null });
    let narrativeSegments: NarrativeSegment[] = [];
    let journalEntries: JournalEntry[] = [];

    try {
      // Get narrative segments and journal entries for this session
      // Only send the last 10 segments and 5 journal entries to avoid payload size issues
      const state = get();
      const allSegments = Object.values(state.segments)
        .filter(segment => segment.sessionId === params.sessionId)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      narrativeSegments = allSegments.slice(-10); // Last 10 segments only

      const journalState = useJournalStore.getState();
      const allJournalEntries = journalState.entries
        ? Object.values(journalState.entries).filter(entry => entry.sessionId === params.sessionId)
        : [];
      journalEntries = allJournalEntries.slice(-5); // Last 5 journal entries only

      const currentTurn = countWorldClockTurns(allSegments);
      const worldClock = isFeatureEnabled('WORLD_CLOCK')
        ? buildWorldClockPromptContext(
            useWorldThreadStore.getState().getOpenThreadsBySession(params.sessionId),
            currentTurn
          )
        : undefined;

      // Route through server API to keep AI usage server-side and enable test mocking
      const response = await aiFetch('/api/narrative/ending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: params.sessionId,
          characterId: params.characterId,
          worldId: params.worldId,
          endingType,
          desiredTone: params.desiredTone,
          customPrompt: params.customPrompt,
          world: params.world, // Pass the world data from client
          character: params.character, // Pass the character data from client
          narrativeSegments, // Pass narrative segments from client
          journalEntries, // Pass journal entries from client
          worldClock,
        })
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        throw new Error(`API error ${response.status}: ${errText || 'Failed to load ending'}`);
      }

      const json = await response.json();
      const result = json?.data ?? json; // Support both {success,data} and direct payload

      if (!result || !result.epilogue || !result.characterLegacy || !result.worldImpact) {
        throw new Error('Invalid ending payload from API');
      }

      const endingId = generateUniqueId('ending');
      const now = new Date();
      const isoNow = now.toISOString();

      const ending: StoryEnding = {
        id: endingId,
        sessionId: params.sessionId,
        characterId: params.characterId,
        worldId: params.worldId,
        type: endingType,
        tone: result.tone,
        epilogue: result.epilogue,
        characterLegacy: result.characterLegacy,
        worldImpact: result.worldImpact,
        timestamp: now,
        createdAt: isoNow,
        updatedAt: isoNow,
        achievements: result.achievements || [],
        playTime: result.playTime,
      };

      set({
        currentEnding: ending,
        isGeneratingEnding: false,
        endingError: null,
      });

      // Mark the session as ended to prevent further generation
      get().markSessionEnded(params.sessionId);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to load ending', { error: errorMessage, endingType, params });

      // Fallback: craft a local ending so the user still sees a conclusion
      if (narrativeSegments.length === 0) {
        const state = get();
        const fallbackSegments = Object.values(state.segments)
          .filter(segment => segment.sessionId === params.sessionId)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        narrativeSegments = fallbackSegments.slice(-10);
      }

      const fallbackEnding = buildLocalEnding({
        endingType,
        params,
        narrativeSegments,
        journalEntries,
      });

      set({
        currentEnding: fallbackEnding,
        isGeneratingEnding: false,
        endingError: null,
      });

      // Mark the session as ended so UI transitions to EndingScreen
      get().markSessionEnded(params.sessionId);
    }
  },

  clearEnding: () => set({ currentEnding: null, endingError: null }),

  setCurrentEnding: (ending: StoryEnding | null) => set({ currentEnding: ending, endingError: null }),

  updateCurrentEnding: (updater: (ending: StoryEnding | null) => StoryEnding | null) => set((state) => ({
    currentEnding: updater(state.currentEnding),
    endingError: null
  })),

  saveEndingToHistory: () => {
    const state = get();
    const ending = state.currentEnding;
    if (!ending) return;

    // Create a special segment for the ending
    const endingSegmentId = generateUniqueId('segment');
    const now = new Date();
    const isoNow = now.toISOString();

    const endingSegment: NarrativeSegment = {
      id: endingSegmentId,
      sessionId: ending.sessionId,
      worldId: ending.worldId,
      content: ending.epilogue,
      type: 'ending',
      timestamp: now,
      createdAt: isoNow,
      updatedAt: isoNow,
      metadata: {
        tags: ['ending', ending.type],
        mood: 'emotional',
        tone: ending.tone,
        endingId: ending.id,
        endingData: ending
      }
    };

    set((state) => {
      const sessionSegments = state.sessionSegments[ending.sessionId] || [];

      return {
        segments: {
          ...state.segments,
          [endingSegmentId]: endingSegment
        },
        sessionSegments: {
          ...state.sessionSegments,
          [ending.sessionId]: [...sessionSegments, endingSegmentId]
        }
      };
    });
  },

  hasActiveEnding: (): boolean => {
    return get().currentEnding !== null;
  },

  getEndingForSession: (sessionId: EntityID): StoryEnding | null => {
    const state = get();

    // Check if the current ending is for this session
    if (state.currentEnding?.sessionId === sessionId) {
      return state.currentEnding;
    }

    // Look for ending in all segments (not just session segments)
    // This handles cases where segments are added directly without sessionSegments mapping
    const allSegments = Object.values(state.segments);
    const endingSegment = allSegments.find(seg =>
      seg.sessionId === sessionId &&
      seg.type === 'ending' &&
      seg.metadata?.tags?.includes('ending') &&
      seg.metadata?.endingData
    );

    return endingSegment?.metadata.endingData as StoryEnding || null;
  },

  // Session ending tracking
  isSessionEnded: (sessionId: EntityID): boolean => {
    return get().endedSessions[sessionId] === true;
  },

  markSessionEnded: (sessionId: EntityID) => {
    set((state) => ({
      endedSessions: {
        ...state.endedSessions,
        [sessionId]: true,
      }
    }));

    try {
      useSessionStore.getState().setSessionLifecycleStatus(sessionId, 'ended');
    } catch (error) {
      logger.warn('Failed to propagate session lifecycle status on ending', error);
    }

    // Single chokepoint for reaching an ending - both the success and
    // fallback paths in generateEnding funnel through here.
    trackFunnelStep('session-ended');
  },
});
