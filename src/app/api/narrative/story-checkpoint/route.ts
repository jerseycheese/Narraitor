import { NextRequest, NextResponse } from 'next/server';
import { StoryCheckpointRequestBody } from '@/types/story-checkpoint.types';
import { generateStoryCheckpointSummary } from '@/lib/ai/storyCheckpointGenerator';
import { safeTrim } from '@/lib/utils';

const MAX_EVENTS = 10;
const MAX_DECISIONS = 5;

const sanitizeEvents = (events: unknown, fallbackSession: string): StoryCheckpointRequestBody['events'] => {
  if (!Array.isArray(events)) {
    return [];
  }

  return events
    .map((event) => {
      if (!event || typeof event !== 'object') {
        return null;
      }
      const record = event as Record<string, unknown>;
      const description = safeTrim(String(record.description ?? ''));
      const timestampRaw = safeTrim(String(record.timestamp ?? ''));
      if (!description || !timestampRaw) {
        return null;
      }
      const timestamp = new Date(timestampRaw).toISOString();
      const id = safeTrim(String(record.id ?? '')) || `event-${timestamp}`;
      const sessionId = safeTrim(String(record.sessionId ?? fallbackSession)) || fallbackSession;
      const characterId = record.characterId ? safeTrim(String(record.characterId)) : undefined;
      const characterName = record.characterName ? safeTrim(String(record.characterName)) : undefined;

      return {
        id,
        description,
        timestamp,
        characterId,
        characterName,
        sessionId,
      };
    })
    .filter((entry): entry is StoryCheckpointRequestBody['events'][number] => Boolean(entry))
    .slice(0, MAX_EVENTS);
};

const sanitizeDecisions = (decisions: unknown): StoryCheckpointRequestBody['decisions'] => {
  if (!Array.isArray(decisions)) {
    return [];
  }

  return decisions
    .map((decision) => {
      if (!decision || typeof decision !== 'object') {
        return null;
      }
      const record = decision as Record<string, unknown>;
      const text = safeTrim(String(record.text ?? ''));
      if (!text) {
        return null;
      }
      const id = safeTrim(String(record.id ?? '')) || `decision-${Date.now()}`;
      const consequence = record.consequence ? safeTrim(String(record.consequence)) : undefined;
      const alignment = record.alignment ? safeTrim(String(record.alignment)) : undefined;
      const timestamp = record.timestamp ? new Date(String(record.timestamp)).toISOString() : undefined;

      return {
        id,
        text,
        consequence,
        alignment,
        timestamp,
      };
    })
    .filter((entry): entry is NonNullable<StoryCheckpointRequestBody['decisions']>[number] => Boolean(entry))
    .slice(0, MAX_DECISIONS);
};

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const worldId = safeTrim(String(rawBody?.worldId ?? ''));
    const sessionId = safeTrim(String(rawBody?.sessionId ?? ''));

    if (!worldId || !sessionId) {
      return NextResponse.json({ error: 'worldId and sessionId are required.' }, { status: 400 });
    }

    const events = sanitizeEvents(rawBody?.events, sessionId);
    if (events.length === 0) {
      return NextResponse.json({ error: 'At least one major event is required to create a checkpoint.' }, { status: 400 });
    }

    const payload: StoryCheckpointRequestBody = {
      worldId,
      sessionId,
      characterId: rawBody?.characterId ? safeTrim(String(rawBody.characterId)) : undefined,
      events,
      decisions: sanitizeDecisions(rawBody?.decisions),
      narrativeSummary: rawBody?.narrativeSummary ? safeTrim(String(rawBody.narrativeSummary)) : undefined,
      currentLocation: rawBody?.currentLocation ? safeTrim(String(rawBody.currentLocation)) : undefined,
      activeGoals: Array.isArray(rawBody?.activeGoals)
        ? rawBody.activeGoals
            .map((goal: unknown) => (typeof goal === 'string' ? safeTrim(goal) : ''))
            .filter((goal: string) => Boolean(goal))
            .slice(0, 5)
        : undefined,
    };

    const summary = await generateStoryCheckpointSummary(payload);
    return NextResponse.json(summary);
  } catch (error) {
    console.error('[story-checkpoint] Failed to generate summary', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate checkpoint summary.' },
      { status: 500 }
    );
  }
}
