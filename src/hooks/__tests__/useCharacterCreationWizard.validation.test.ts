import { renderHook } from '@testing-library/react';
import { useCharacterCreationWizard, type CharacterCreationData } from '../useCharacterCreationWizard';
import { useCharacterStore } from '@/state/characterStore';
import type { World } from '@/types/world.types';
import { createMockCharacterStore, mockZustandStore } from '@/lib/test-utils';

jest.mock('@/state/characterStore');

const world = {
  id: 'world-1',
  name: 'Validation World',
  description: 'A world for wizard validation tests.',
  genre: 'fantasy',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 6,
    maxSkills: 8,
    attributePointPool: 0,
    skillPointPool: 0,
  },
} as World;

const initialData = {
  worldId: 'world-1',
  name: 'Al',
  description: '',
  portraitPlaceholder: '',
  attributes: [],
  skills: [],
  background: {
    history: '',
    personality: '',
    goals: [],
    motivation: '',
  },
} as CharacterCreationData;

describe('useCharacterCreationWizard validation', () => {
  beforeEach(() => {
    mockZustandStore(
      useCharacterStore as jest.MockedFunction<typeof useCharacterStore>,
      createMockCharacterStore({ characters: {} })
    );
  });

  it('allows two-character names through the canonical basic-info validator', () => {
    const { result } = renderHook(() =>
      useCharacterCreationWizard({
        initialData,
        worldId: 'world-1',
        world,
      })
    );

    expect(result.current.stepValidators[0](initialData)).toEqual({
      valid: true,
      errors: [],
      touched: true,
    });
  });
});
