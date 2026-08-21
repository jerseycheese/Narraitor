import * as React from 'react';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { WorldStateMajorEvent } from '@/types/world-state.types';
import type { StoryCheckpointRequestBody } from '@/types/story-checkpoint.types';
import { StoryCheckpointDecisionPayload, StoryCheckpointResponseBody } from '@/types/story-checkpoint.types';
import { generateUniqueId, safeTrim } from '@/lib/utils';
import { isPlaywrightEnv } from '@/lib/utils/isPlaywrightEnv';
import { buildStoryCheckpointPayload } from '@/lib/narrative/storyCheckpointPayload';
import { aiFetch } from '@/lib/ai/aiFetch';

interface UseStoryCheckpointManagerArgs {
  worldId: string;
  sessionId: string;
  characterId?: string;
}

const MAX_DECISIONS = 5;

const buildCheckpointFromResponse = (
  data: StoryCheckpointResponseBody,
  pendingEvents: WorldStateMajorEvent[],
  decisions: StoryCheckpointDecisionPayload[],
): {
  id: string;
  segment: string;
  highlights: string[];
  eventIds: string[];
  decisionIds: string[];
  metadata: {
    includedEvents: number;
    includedDecisions: number;
    lastEventTimestamp?: string;
    promptVersion: string;
    aiModel?: string;
  };
} => {
  const fallbackHighlights = data.majorEvents.slice(0, 3);
  const highlights = data.highlights?.length ? data.highlights : fallbackHighlights;
  const eventIds = pendingEvents.map(event => event.id);
  const decisionIds = decisions.map(decision => decision.id);

  return {
    id: generateUniqueId('checkpoint'),
    segment: data.segment,
    highlights,
    eventIds,
    decisionIds,
    metadata: {
      includedEvents: data.includedEvents,
      includedDecisions: data.includedDecisions,
      lastEventTimestamp: data.lastEventTimestamp ?? pendingEvents[pendingEvents.length - 1]?.timestamp,
      promptVersion: 'story-checkpoint-v2',
      aiModel: data.model,
    },
  };
};

const buildDecisionPayload = (
  sessionId: string,
): StoryCheckpointDecisionPayload[] => {
  const { getSessionDecisions } = useNarrativeStore.getState();
  const decisions = getSessionDecisions(sessionId);
  if (!decisions || decisions.length === 0) {
    return [];
  }

  return decisions
    .map((decision) => {
      const selectedOption = decision.options.find((option) => option.id === decision.selectedOptionId);
      const consequenceText = decision.consequences
        ?.map((consequence) => consequence.description)
        .filter((entry): entry is string => Boolean(entry))
        .join('; ');

      return {
        id: decision.id,
        text: selectedOption ? `${decision.prompt} ⇒ ${selectedOption.text}` : decision.prompt,
        consequence: consequenceText,
        alignment: selectedOption?.alignment,
        timestamp: decision.selectedAt ? new Date(decision.selectedAt).toISOString() : undefined,
      } satisfies StoryCheckpointDecisionPayload;
    })
    .slice(-MAX_DECISIONS);
};

const collectCurrentLocation = (sessionId: string): string | undefined => {
  const { getSessionSegments } = useNarrativeStore.getState();
  const segments = getSessionSegments(sessionId);
  const latest = segments[segments.length - 1];

  return latest?.metadata?.location ? safeTrim(latest.metadata.location) : undefined;
};

const formatEventsForApi = (
  events: WorldStateMajorEvent[],
  characterNameLookup: Record<string, string | undefined>,
): StoryCheckpointRequestBody['events'] =>
  [...events]
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    .reduce<StoryCheckpointRequestBody['events']>((acc, event) => {
      const previous = acc[acc.length - 1];
      if (
        previous &&
        previous.characterId === event.characterId &&
        previous.sessionId === event.sessionId &&
        previous.description === event.description
      ) {
        return acc;
      }
      acc.push({
        id: event.id,
        description: event.description,
        timestamp: event.timestamp,
        characterId: event.characterId,
        characterName: event.characterId ? characterNameLookup[event.characterId] : undefined,
        sessionId: event.sessionId,
      });
      return acc;
    }, []);

export const useStoryCheckpointManager = ({ worldId, sessionId, characterId }: UseStoryCheckpointManagerArgs) => {
  const worldState = useWorldStore((state) => (worldId ? state.worldStates[worldId] : undefined));
  const world = useWorldStore((state) => (worldId ? state.worlds[worldId] : undefined));
  const characters = useCharacterStore((state) => state.characters);

  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = React.useState<string | null>(null);

  const checkpointsForSession = React.useMemo(
    () => (worldState?.storyCheckpoints ?? []).filter((checkpoint) => checkpoint.sessionId === sessionId),
    [worldState?.storyCheckpoints, sessionId],
  );

  const latestCheckpoint = checkpointsForSession[0] ?? null;
  const lastEventTimestamp = latestCheckpoint?.metadata?.lastEventTimestamp;
  const summarizedEventIds = React.useMemo(() => {
    const ids = new Set<string>();
    checkpointsForSession.forEach((checkpoint) => {
      (checkpoint.eventIds ?? []).forEach((eventId) => ids.add(eventId));
    });
    return ids;
  }, [checkpointsForSession]);

  const sessionEvents = React.useMemo(() => {
    if (!worldState?.majorEvents?.length) {
      return [];
    }
    return worldState.majorEvents.filter((event) => event.sessionId === sessionId);
  }, [worldState?.majorEvents, sessionId]);

  const recentEvents = React.useMemo(() => {
    return sessionEvents.slice(0, 4);
  }, [sessionEvents]);

  const pendingEvents = React.useMemo(() => {
    if (!sessionEvents.length) {
      return [];
    }

    const filtered = sessionEvents.filter((event) => {
      if (summarizedEventIds.has(event.id)) {
        return false;
      }
      if (lastEventTimestamp && event.timestamp.localeCompare(lastEventTimestamp) <= 0) {
        return false;
      }
      return true;
    });

    return filtered.slice(0, 8).reverse();
  }, [sessionEvents, summarizedEventIds, lastEventTimestamp]);

  const characterNameLookup = React.useMemo(() => {
    const lookup: Record<string, string | undefined> = {};
    Object.values(characters || {}).forEach((character) => {
      if (character?.id) {
        lookup[character.id] = character.name;
      }
    });
    return lookup;
  }, [characters]);

  const createCheckpoint = React.useCallback(async () => {
    // Skip checkpoint generation under Playwright (E2E/visual) — it POSTs to
    // /api/narrative/story-checkpoint, which hangs with no AI key in CI and
    // stalls the page load (the visual suite's page.goto timeouts). Seeded
    // pages don't need a generated checkpoint. Mirrors EndingScreen (#1323).
    if (isPlaywrightEnv()) {
      return;
    }

    if (!worldId || !sessionId) {
      setError('Missing world or session context.');
      setStatus('error');
      return;
    }

    if (pendingEvents.length === 0) {
      setError('Need at least one new major event before creating a checkpoint.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const decisions = buildDecisionPayload(sessionId);
      const currentLocation = collectCurrentLocation(sessionId);

      // Get last 2-3 checkpoint segments for narrative continuity
      const existingCheckpoints = worldState?.storyCheckpoints ?? [];
      const sessionCheckpoints = existingCheckpoints
        .filter(cp => cp.sessionId === sessionId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)); // Chronological order
      const previousSegments = sessionCheckpoints
        .slice(-3) // Last 3 checkpoints
        .map(cp => cp.segment)
        .filter(Boolean);

      const formattedEvents = formatEventsForApi(pendingEvents, characterNameLookup);

      const payload = buildStoryCheckpointPayload({
        worldId,
        sessionId,
        characterId,
        characterName: characterId ? characterNameLookup[characterId] : undefined,
        events: formattedEvents,
        decisions,
        currentLocation,
        previousSegments,
        toneSettings: world?.toneSettings,
      });

      const response = await aiFetch('/api/narrative/story-checkpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorPayload = await response.json().catch(() => ({}));
        throw new Error(errorPayload?.error || 'Failed to generate checkpoint summary.');
      }

      const data = (await response.json()) as StoryCheckpointResponseBody;
      const newCheckpoint = buildCheckpointFromResponse(data, pendingEvents, decisions);

      useWorldStore.getState().updateWorldState(
        worldId,
        {
          storyCheckpoints: [
            newCheckpoint,
            ...existingCheckpoints,
          ],
        },
        sessionId
      );

      setStatus('success');
    } catch (checkpointError) {
      setStatus('error');
      setError(checkpointError instanceof Error ? checkpointError.message : 'Unknown error creating checkpoint.');
    }
  }, [characterId, characterNameLookup, pendingEvents, sessionId, worldId, worldState?.storyCheckpoints, world?.toneSettings]);

  // Auto-trigger checkpoint creation when there's at least 1 pending event.
  // Gated on the actual event-id set (not just status) so a failed attempt
  // doesn't re-arm the timer every render — it only retries once genuinely
  // new events arrive, instead of retrying the same failed batch forever.
  const lastAttemptedEventIdsRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (pendingEvents.length === 0 || status === 'loading') {
      return;
    }

    const currentEventIds = pendingEvents.map((event) => event.id).join(',');
    if (currentEventIds === lastAttemptedEventIdsRef.current) {
      return;
    }

    // Debounce: wait 3 seconds after the last event before creating checkpoint
    const timeoutId = setTimeout(() => {
      lastAttemptedEventIdsRef.current = currentEventIds;
      createCheckpoint();
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [pendingEvents, status, createCheckpoint]);

  // Listen for session end event to capture final checkpoint
  React.useEffect(() => {
    const handleFinalCheckpoint = () => {
      if (pendingEvents.length > 0 && status !== 'loading') {
        createCheckpoint();
      }
    };

    window.addEventListener('narraitor:finalize-checkpoint', handleFinalCheckpoint);
    return () => window.removeEventListener('narraitor:finalize-checkpoint', handleFinalCheckpoint);
  }, [pendingEvents.length, status, createCheckpoint]);

  return {
    status,
    error,
    latestCheckpoint,
    pendingEvents,
    recentEvents,
    createCheckpoint,
    hasPendingEvents: pendingEvents.length > 0,
    characterNameLookup,
  };
};
