/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST as generateTurn } from '@/app/api/narrative/generate/route';
import { POST as generateChoices } from '@/app/api/narrative/choices/route';
import { POST as generateEnding } from '@/app/api/narrative/ending/route';
import {
  PROVIDER_API_KEY_HEADER,
  PROVIDER_MODEL_HEADER,
} from '@/lib/ai/providerKeyHeader';
import type { Character } from '@/types/character.types';
import type { World } from '@/types/world.types';

const liveProviderKey = process.env.NARRAITOR_LIVE_GEMINI_API_KEY;
const liveModel = process.env.NARRAITOR_LIVE_GEMINI_MODEL ?? 'gemini-2.5-flash';
const describeLive = liveProviderKey ? describe : describe.skip;

const world: World = {
  id: 'live-contract-world',
  name: 'Ashfall Reach',
  description: 'A small frontier town beneath a dormant volcano.',
  genre: 'fantasy',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 6,
    maxSkills: 12,
    attributePointPool: 10,
    skillPointPool: 10,
  },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const character: Character = {
  id: 'live-contract-character',
  name: 'Mara Vale',
  description: 'A careful courier who knows the old roads.',
  worldId: world.id,
  attributes: [],
  skills: [],
  derivedStats: [],
  background: {
    history: 'Mara carries messages between isolated settlements.',
    personality: 'Patient and observant.',
    goals: ['Keep the mountain pass open.'],
    fears: [],
    relationships: [],
  },
  inventory: {
    characterId: 'live-contract-character',
    items: [],
    capacity: 10,
    categories: [],
    itemOrder: [],
  },
  status: { conditions: [] },
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function request(path: string, body: Record<string, unknown>): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [PROVIDER_API_KEY_HEADER]: liveProviderKey ?? '',
      [PROVIDER_MODEL_HEADER]: liveModel,
    },
    body: JSON.stringify(body),
  });
}

describeLive('live Gemini game-loop contracts', () => {
  it('streams a generated turn as parseable NDJSON', async () => {
    const response = await generateTurn(
      request('/api/narrative/generate', {
        prompt:
          'Write one brief scene where Mara reaches a closed mountain pass.',
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toContain(
      'application/x-ndjson'
    );

    const events = (await response.text())
      .trim()
      .split('\n')
      .map((line) => JSON.parse(line) as Record<string, unknown>);

    expect(
      events.some(
        (event) => typeof event.delta === 'string' && event.delta.length > 0
      )
    ).toBe(true);
    expect(events.at(-1)).toEqual(
      expect.objectContaining({ done: true, content: expect.any(String) })
    );
  });

  it('returns parsed content when it generates choices', async () => {
    const response = await generateChoices(
      request('/api/narrative/choices', {
        prompt: 'Offer two short choices for Mara at the closed mountain pass.',
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(
      expect.objectContaining({
        content: expect.any(String),
        finishReason: expect.any(String),
      })
    );
    expect(body.content.trim()).not.toBe('');
  });

  it('returns the required ending fields', async () => {
    const response = await generateEnding(
      request('/api/narrative/ending', {
        sessionId: 'live-contract-session',
        characterId: character.id,
        worldId: world.id,
        endingType: 'story-complete',
        desiredTone: 'hopeful',
        world,
        character,
        narrativeSegments: [],
        journalEntries: [],
      })
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          epilogue: expect.any(String),
          characterLegacy: expect.any(String),
          worldImpact: expect.any(String),
          tone: expect.any(String),
          achievements: expect.any(Array),
        }),
      })
    );
  });
});
