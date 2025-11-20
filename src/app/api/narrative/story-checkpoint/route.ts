import { randomUUID } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { StoryCheckpointRequestBody } from '@/types/story-checkpoint.types';
import { generateStoryCheckpointSummary } from '@/lib/ai/storyCheckpointGenerator';
import { safeTrim } from '@/lib/utils';

const MAX_EVENTS = 10;
const MAX_DECISIONS = 5;

const sanitizeEvents = (
  events: unknown,
  fallbackSession: string,
): StoryCheckpointRequestBody['events'] => {
  if (!Array.isArray(events)) {
    return [];
  }

  const sanitized: StoryCheckpointRequestBody['events'] = [];

  for (const event of events) {
    if (!event || typeof event !== 'object') {
      continue;
    }
    const record = event as Record<string, unknown>;
    const description = safeTrim(String(record.description ?? ''));
    const timestampRaw = safeTrim(String(record.timestamp ?? ''));
    if (!description || !timestampRaw) {
      continue;
    }

    const timestamp = new Date(timestampRaw).toISOString();
    const id = safeTrim(String(record.id ?? '')) || `event-${timestamp}`;
    const sessionId = safeTrim(String(record.sessionId ?? fallbackSession)) || fallbackSession;
    const characterId = record.characterId ? safeTrim(String(record.characterId)) : undefined;
    const characterName = record.characterName ? safeTrim(String(record.characterName)) : undefined;

    const payload: StoryCheckpointRequestBody['events'][number] = {
      id,
      description,
      timestamp,
      sessionId,
      ...(characterId ? { characterId } : {}),
      ...(characterName ? { characterName } : {}),
    };

    sanitized.push(payload);

    if (sanitized.length >= MAX_EVENTS) {
      break;
    }
  }

  return sanitized;
};

const sanitizeDecisions = (
  decisions: unknown,
): StoryCheckpointRequestBody['decisions'] => {
  if (!Array.isArray(decisions)) {
    return [];
  }

  const sanitized: StoryCheckpointRequestBody['decisions'] = [];

  for (const decision of decisions) {
    if (!decision || typeof decision !== 'object') {
      continue;
    }
    const record = decision as Record<string, unknown>;
    const text = safeTrim(String(record.text ?? ''));
    if (!text) {
      continue;
    }

      const id = safeTrim(String(record.id ?? '')) || `decision-${randomUUID()}`;
    const consequence = record.consequence ? safeTrim(String(record.consequence)) : undefined;
    const alignment = record.alignment ? safeTrim(String(record.alignment)) : undefined;
    const timestamp = record.timestamp ? new Date(String(record.timestamp)).toISOString() : undefined;

    const payload: NonNullable<StoryCheckpointRequestBody['decisions']>[number] = {
      id,
      text,
      ...(consequence ? { consequence } : {}),
      ...(alignment ? { alignment } : {}),
      ...(timestamp ? { timestamp } : {}),
    };

    sanitized.push(payload);

    if (sanitized.length >= MAX_DECISIONS) {
      break;
    }
  }

  return sanitized;
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
      previousCheckpointSummary: rawBody?.previousCheckpointSummary ? safeTrim(String(rawBody.previousCheckpointSummary)) : undefined,
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
