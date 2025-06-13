import { worldStore } from '../worldStore';
import { ToneSettings } from '@/types/tone-settings.types';

describe('WorldStore Tone Settings', () => {
  beforeEach(() => {
    worldStore.getState().reset();
  });

  test('should create world with tone settings', () => {
    const toneSettings: ToneSettings = {
      contentRating: 'PG',
      narrativeStyle: 'serious',
      languageComplexity: 'moderate',
      customInstructions: 'Keep dialogue realistic'
    };

    const worldId = worldStore.getState().createWorld({
      name: 'Test World',
      description: 'A test world',
      theme: 'Fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 10,
        maxSkills: 10,
        attributePointPool: 100,
        skillPointPool: 100
      },
      toneSettings
    });

    const world = worldStore.getState().worlds[worldId];
    expect(world.toneSettings).toEqual(toneSettings);
  });

  test('should update world tone settings', () => {
    const worldId = worldStore.getState().createWorld({
      name: 'Test World',
      description: 'A test world',
      theme: 'Fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 10,
        maxSkills: 10,
        attributePointPool: 100,
        skillPointPool: 100
      }
    });

    const newToneSettings: ToneSettings = {
      contentRating: 'R',
      narrativeStyle: 'dramatic',
      languageComplexity: 'advanced',
      customInstructions: 'Include mature themes'
    };

    worldStore.getState().updateToneSettings(worldId, newToneSettings);

    const world = worldStore.getState().worlds[worldId];
    expect(world.toneSettings).toEqual(newToneSettings);
  });

  test('should handle partial tone settings updates', () => {
    const initialToneSettings: ToneSettings = {
      contentRating: 'PG',
      narrativeStyle: 'serious',
      languageComplexity: 'moderate'
    };

    const worldId = worldStore.getState().createWorld({
      name: 'Test World',
      description: 'A test world',
      theme: 'Fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 10,
        maxSkills: 10,
        attributePointPool: 100,
        skillPointPool: 100
      },
      toneSettings: initialToneSettings
    });

    const partialUpdate = {
      narrativeStyle: 'humorous' as const,
      customInstructions: 'Add light comedy'
    };

    worldStore.getState().updateToneSettings(worldId, partialUpdate);

    const world = worldStore.getState().worlds[worldId];
    expect(world.toneSettings).toEqual({
      ...initialToneSettings,
      ...partialUpdate
    });
  });

  test('should return error when updating tone settings for non-existent world', () => {
    const toneSettings: ToneSettings = {
      contentRating: 'PG',
      narrativeStyle: 'serious',
      languageComplexity: 'moderate'
    };

    worldStore.getState().updateToneSettings('non-existent-id', toneSettings);

    expect(worldStore.getState().error).toBe('World not found');
  });
});