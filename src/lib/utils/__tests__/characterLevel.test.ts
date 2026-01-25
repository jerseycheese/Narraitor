import { calculateCharacterLevel } from '../characterLevel';
import { createMockWorld as factoryCreateMockWorld, createMockWorldAttribute } from '@/lib/test-utils';

describe('calculateCharacterLevel', () => {
  const world = factoryCreateMockWorld({
    id: 'level-world',
    name: 'Level World',
    genre: 'fantasy',
    attributes: [
      createMockWorldAttribute({
        id: 'attr-1',
        name: 'Strength',
        description: 'Power',
        baseValue: 1,
        minValue: 1,
        maxValue: 5,
        worldId: 'level-world',
      }),
      createMockWorldAttribute({
        id: 'attr-2',
        name: 'Intelligence',
        description: 'Smarts',
        baseValue: 1,
        minValue: 1,
        maxValue: 5,
        worldId: 'level-world',
      }),
    ],
  });

  test('returns level 1 at minimum values', () => {
    const level = calculateCharacterLevel(world, [
      { id: 'attr-1', value: 1 },
      { id: 'attr-2', value: 1 },
    ]);

    expect(level).toBe(1);
  });

  test('returns level 3 at midpoint values', () => {
    const level = calculateCharacterLevel(world, [
      { id: 'attr-1', value: 3 },
      { id: 'attr-2', value: 3 },
    ]);

    expect(level).toBe(3);
  });

  test('returns level 5 at maximum values', () => {
    const level = calculateCharacterLevel(world, [
      { id: 'attr-1', value: 5 },
      { id: 'attr-2', value: 5 },
    ]);

    expect(level).toBe(5);
  });

  test('uses world minimums for missing attributes', () => {
    const level = calculateCharacterLevel(world, [
      { id: 'attr-1', value: 5 },
    ]);

    expect(level).toBe(3);
  });
});
