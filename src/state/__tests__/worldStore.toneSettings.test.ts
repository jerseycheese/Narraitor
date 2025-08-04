import { useWorldStore } from '../worldStore';
import { ToneSettings } from '@/types/tone-settings.types';

describe('WorldStore Tone Settings', () => {
  beforeEach(() => {
    useWorldStore.getState().reset();
  });

  test('should create world with tone settings', () => {
    const toneSettings: ToneSettings = {
      contentRating: 'PG',
      narrativeStyle: 'serious',
      languageComplexity: 'moderate',
      customInstructions: 'Keep dialogue realistic'
    };

    const worldId = useWorldStore.getState().createWorld({
      name: 'Test World',
      description: 'A test world',
      genre: 'fantasy',
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

    const world = useWorldStore.getState().worlds[worldId];
    expect(world.toneSettings).toEqual(toneSettings);
  });

  test('should update world tone settings', () => {
    const worldId = useWorldStore.getState().createWorld({
      name: 'Test World',
      description: 'A test world',
      genre: 'fantasy',
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

    useWorldStore.getState().updateToneSettings(worldId, newToneSettings);

    const world = useWorldStore.getState().worlds[worldId];
    expect(world.toneSettings).toEqual(newToneSettings);
  });

  test('should handle partial tone settings updates', () => {
    const initialToneSettings: ToneSettings = {
      contentRating: 'PG',
      narrativeStyle: 'serious',
      languageComplexity: 'moderate'
    };

    const worldId = useWorldStore.getState().createWorld({
      name: 'Test World',
      description: 'A test world',
      genre: 'fantasy',
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

    useWorldStore.getState().updateToneSettings(worldId, partialUpdate);

    const world = useWorldStore.getState().worlds[worldId];
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

    useWorldStore.getState().updateToneSettings('non-existent-id', toneSettings);

    expect(useWorldStore.getState().error).toBe('World not found');
  });
});