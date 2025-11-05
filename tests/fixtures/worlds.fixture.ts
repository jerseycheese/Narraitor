import type { World } from '@/types/world.types';

/**
 * Test fixture data for World entities
 * Used in visual regression tests and integration tests
 */

// Deterministic PNG data URIs to avoid network and randomness in visuals
// 1x1 solid light-gray PNG that scales consistently in layout
const STABLE_WORLD_IMAGE =
  'data:image/png;base64,' +
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/awp2z0AAAAASUVORK5CYII=';

export const SAMPLE_WORLDS: World[] = [
  {
    id: 'world-cyberpunk-2077',
    name: 'Cyberpunk Neo-Tokyo',
    description:
      'A dystopian future where corporations rule the world and cybernetic enhancements define social status',
    genre: 'cyberpunk',
    image: {
      url: '/visual-assets/world-cyberpunk.png',
      alt: 'Cyberpunk cityscape',
      type: 'ai-generated',
      prompt:
        'A cyberpunk cityscape with neon lights, towering skyscrapers, and flying vehicles in a dystopian future setting',
      generatedAt: '2024-01-01T00:00:00.000Z',
    },
    attributes: [
      {
        id: 'attr-world-cyberpunk-2077-1',
        worldId: 'world-cyberpunk-2077',
        name: 'Tech Level',
        description: 'How advanced your cybernetic modifications are',
        baseValue: 0,
        minValue: 0,
        maxValue: 10,
      },
      {
        id: 'attr-world-cyberpunk-2077-2',
        worldId: 'world-cyberpunk-2077',
        name: 'Street Cred',
        description: 'Your reputation in the underground',
        baseValue: 0,
        minValue: 0,
        maxValue: 10,
      },
    ],
    skills: [
      {
        id: 'skill-world-cyberpunk-2077-1',
        worldId: 'world-cyberpunk-2077',
        name: 'Hacking',
        description: 'Navigate cyberspace and break digital barriers',
        difficulty: 'medium',
        baseValue: 0,
        minValue: 0,
        maxValue: 10,
        attributeIds: [],
      },
      {
        id: 'skill-world-cyberpunk-2077-2',
        worldId: 'world-cyberpunk-2077',
        name: 'Streetwise',
        description: 'Navigate the urban underworld',
        difficulty: 'medium',
        baseValue: 0,
        minValue: 0,
        maxValue: 10,
        attributeIds: [],
      },
    ],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 20,
      skillPointPool: 20,
    },
    toneSettings: {
      complexity: 'medium' as const,
      maturityLevel: 'mature' as const,
      pacing: 'moderate' as const,
      focusAreas: ['technology', 'social-inequality'],
      narrativeStyle: 'gritty-realism' as const,
    },
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'world-fantasy-realm',
    name: 'Aethermoor',
    description:
      'A magical realm where ancient dragons soar above floating cities and arcane mysteries shape reality',
    genre: 'fantasy',
    image: {
      url: STABLE_WORLD_IMAGE,
      alt: 'Fantasy realm',
      type: 'ai-generated',
      prompt:
        'A magical fantasy realm with floating cities, ancient dragons soaring through mystical clouds, and arcane energy flowing through the sky',
      generatedAt: '2024-01-02T00:00:00.000Z',
    },
    attributes: [
      {
        id: 'attr-world-fantasy-realm-1',
        worldId: 'world-fantasy-realm',
        name: 'Magic Power',
        description: 'Your connection to the arcane forces',
        baseValue: 4,
        minValue: 0,
        maxValue: 10,
      },
      {
        id: 'attr-world-fantasy-realm-2',
        worldId: 'world-fantasy-realm',
        name: 'Noble Standing',
        description: 'Your status among the ruling houses',
        baseValue: 2,
        minValue: 0,
        maxValue: 10,
      },
    ],
    skills: [
      {
        id: 'skill-world-fantasy-realm-1',
        worldId: 'world-fantasy-realm',
        name: 'Spellcasting',
        description: 'Channel magical energies to alter reality',
        difficulty: 'medium',
        baseValue: 0,
        minValue: 0,
        maxValue: 10,
        attributeIds: [],
      },
      {
        id: 'skill-world-fantasy-realm-2',
        worldId: 'world-fantasy-realm',
        name: 'Dragon Lore',
        description: 'Knowledge of ancient dragon customs and language',
        difficulty: 'medium',
        baseValue: 0,
        minValue: 0,
        maxValue: 10,
        attributeIds: [],
      },
    ],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 20,
      skillPointPool: 20,
    },
    toneSettings: {
      complexity: 'high' as const,
      maturityLevel: 'teen' as const,
      pacing: 'epic' as const,
      focusAreas: ['magic', 'political-intrigue'],
      narrativeStyle: 'heroic-fantasy' as const,
    },
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];
