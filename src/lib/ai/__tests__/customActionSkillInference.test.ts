// MVP tests for AI-inferred skill checks on custom actions (issue #918).
// Validates parsing, world-skill validation, difficulty clamping, and graceful
// fallback to no-check on bad/empty responses.

import { inferCustomActionSkillChecks } from '../customActionSkillInference';
import type { AIClient } from '../types';
import type { World } from '@/types/world.types';
import type { StoreCharacter } from '@/state/characterStore';

const makeWorld = (): World =>
  ({
    id: 'world-1',
    name: 'Fantasy Realm',
    description: 'A medieval fantasy world',
    genre: 'fantasy',
    skills: [
      {
        id: 'stealth',
        name: 'Stealth',
        description: 'Move unseen',
        worldId: 'world-1',
        difficulty: 'medium',
        baseValue: 3,
        minValue: 1,
        maxValue: 5,
      },
      {
        id: 'athletics',
        name: 'Athletics',
        description: 'Climb, jump, swim',
        worldId: 'world-1',
        difficulty: 'medium',
        baseValue: 3,
        minValue: 1,
        maxValue: 5,
      },
    ],
    attributes: [],
    settings: {
      maxAttributes: 6,
      maxSkills: 12,
      attributePointPool: 27,
      skillPointPool: 40,
    },
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  }) as unknown as World;

const makeCharacter = (): StoreCharacter =>
  ({
    id: 'char-1',
    name: 'Tess',
    description: '',
    worldId: 'world-1',
    level: 1,
    attributes: [],
    skills: [
      { id: 's1', characterId: 'char-1', worldSkillId: 'stealth', name: 'Stealth', level: 4 },
    ],
    derivedStats: [],
    background: { history: '', personality: '', goals: [], fears: [] },
    isPlayer: true,
    status: { hp: 10, maxHp: 10, conditions: [] },
    inventory: { characterId: 'char-1', items: [], capacity: 10, categories: [], itemOrder: [] },
    createdAt: '2023-01-01',
    updatedAt: '2023-01-01',
  }) as unknown as StoreCharacter;

const mockClient = (content: string): AIClient =>
  ({ generateContent: jest.fn().mockResolvedValue({ content }) }) as unknown as AIClient;

const jsonBlock = (obj: unknown) => '```json\n' + JSON.stringify(obj) + '\n```';

describe('inferCustomActionSkillChecks', () => {
  it('returns one requirement for a single-skill action', async () => {
    const client = mockClient(
      jsonBlock({ skillCheckNeeded: true, checks: [{ skillId: 'stealth', difficulty: 3 }] })
    );

    const result = await inferCustomActionSkillChecks(
      { actionText: 'sneak past the guard', character: makeCharacter(), world: makeWorld() },
      client
    );

    expect(result).toEqual([
      { type: 'skill', targetId: 'stealth', operator: 'gte', value: 3 },
    ]);
  });

  it('returns multiple requirements for a multi-skill action', async () => {
    const client = mockClient(
      jsonBlock({
        skillCheckNeeded: true,
        checks: [
          { skillId: 'stealth', difficulty: 2 },
          { skillId: 'athletics', difficulty: 4 },
        ],
      })
    );

    const result = await inferCustomActionSkillChecks(
      { actionText: 'climb the wall quietly', character: makeCharacter(), world: makeWorld() },
      client
    );

    expect(result.map((r) => r.targetId)).toEqual(['stealth', 'athletics']);
    expect(result.map((r) => r.value)).toEqual([2, 4]);
  });

  it('returns [] when no check is needed', async () => {
    const client = mockClient(jsonBlock({ skillCheckNeeded: false, checks: [] }));

    const result = await inferCustomActionSkillChecks(
      { actionText: 'look around the room', character: makeCharacter(), world: makeWorld() },
      client
    );

    expect(result).toEqual([]);
  });

  it('drops skills that do not exist in the world', async () => {
    const client = mockClient(
      jsonBlock({
        skillCheckNeeded: true,
        checks: [
          { skillId: 'telekinesis', difficulty: 3 },
          { skillId: 'stealth', difficulty: 2 },
        ],
      })
    );

    const result = await inferCustomActionSkillChecks(
      { actionText: 'do a thing', character: makeCharacter(), world: makeWorld() },
      client
    );

    expect(result).toEqual([
      { type: 'skill', targetId: 'stealth', operator: 'gte', value: 2 },
    ]);
  });

  it('clamps difficulty to the skill range', async () => {
    const client = mockClient(
      jsonBlock({ skillCheckNeeded: true, checks: [{ skillId: 'stealth', difficulty: 99 }] })
    );

    const result = await inferCustomActionSkillChecks(
      { actionText: 'attempt the impossible', character: makeCharacter(), world: makeWorld() },
      client
    );

    expect(result[0].value).toBe(5); // maxValue of stealth
  });

  it('returns [] on a malformed AI response without throwing', async () => {
    const client = mockClient('no json here, just prose');

    const result = await inferCustomActionSkillChecks(
      { actionText: 'sneak past the guard', character: makeCharacter(), world: makeWorld() },
      client
    );

    expect(result).toEqual([]);
  });

  it('returns [] without calling the AI when the world has no skills', async () => {
    const world = makeWorld();
    world.skills = [];
    const client = mockClient(jsonBlock({ skillCheckNeeded: true, checks: [] }));

    const result = await inferCustomActionSkillChecks(
      { actionText: 'sneak past the guard', character: makeCharacter(), world },
      client
    );

    expect(result).toEqual([]);
    expect(client.generateContent).not.toHaveBeenCalled();
  });
});
