// src/lib/utils/__tests__/worldTemplateGenerator.test.ts

import { generateWorldCharacterTemplates } from '../worldTemplateGenerator';
import { World, CharacterArchetype } from '@/types/world.types';
import * as characterArchetypes from '../characterArchetypes';
import { createMockWorld, createMockWorldAttribute, createMockWorldSkill } from '@/lib/test-utils';
import { logger } from '@/lib/utils/logger';

// Mock the characterArchetypes module
jest.mock('../characterArchetypes', () => ({
  ...jest.requireActual('../characterArchetypes'),
  generateCharacterArchetypes: jest.fn(),
}));
jest.mock('@/lib/utils/logger');

describe('worldTemplateGenerator', () => {
  describe('generateWorldCharacterTemplates', () => {
    const mockWorld: World = createMockWorld({
      id: 'world-test-1',
      genre: 'fantasy',
      attributes: [
        createMockWorldAttribute({ id: 'attr-1', worldId: 'world-test-1', name: 'Strength' }),
        createMockWorldAttribute({ id: 'attr-2', worldId: 'world-test-1', name: 'Intelligence' }),
      ],
      skills: [
        createMockWorldSkill({ id: 'skill-1', worldId: 'world-test-1', name: 'Combat' }),
      ],
      settings: {
        maxAttributes: 6,
        maxSkills: 8,
        attributePointPool: 30,
        skillPointPool: 20,
      },
    });

    const mockArchetypes: CharacterArchetype[] = [
      {
        id: 'archetype-1',
        name: 'Warrior',
        description: 'Strong fighter',
        level: 1,
        attributes: [
          { id: 'attr-1', name: 'Strength', value: 8 },
          { id: 'attr-2', name: 'Intelligence', value: 5 },
        ],
        skills: [{ id: 'skill-1', name: 'Combat', level: 7 }],
        background: {
          description: 'A seasoned warrior',
          personality: 'Brave and honorable',
          motivation: 'Protect the innocent',
          fears: ['Failure', 'Losing comrades'],
          physicalDescription: 'Muscular build, battle scars',
        },
      },
      {
        id: 'archetype-2',
        name: 'Mage',
        description: 'Powerful spellcaster',
        level: 1,
        attributes: [
          { id: 'attr-1', name: 'Strength', value: 4 },
          { id: 'attr-2', name: 'Intelligence', value: 9 },
        ],
        skills: [{ id: 'skill-1', name: 'Combat', level: 3 }],
        background: {
          description: 'A scholarly mage',
          personality: 'Curious and wise',
          motivation: 'Seek knowledge',
          fears: ['Ignorance', 'Chaos'],
          physicalDescription: 'Slender, robed figure',
        },
      },
      {
        id: 'archetype-3',
        name: 'Scout',
        description: 'Agile explorer',
        level: 1,
        attributes: [
          { id: 'attr-1', name: 'Strength', value: 6 },
          { id: 'attr-2', name: 'Intelligence', value: 7 },
        ],
        skills: [{ id: 'skill-1', name: 'Combat', level: 5 }],
        background: {
          description: 'A nimble scout',
          personality: 'Alert and cautious',
          motivation: 'Discover new lands',
          fears: ['Being trapped', 'Capture'],
          physicalDescription: 'Lean and quick',
        },
      },
    ];

    beforeEach(() => {
      jest.clearAllMocks();
      // Setup default mock implementation
      (characterArchetypes.generateCharacterArchetypes as jest.Mock).mockResolvedValue(
        mockArchetypes
      );
    });

    test('should generate 3 templates for a valid world', async () => {
      const templates = await generateWorldCharacterTemplates(mockWorld);

      expect(templates).toHaveLength(3);
      expect(characterArchetypes.generateCharacterArchetypes).toHaveBeenCalledWith(
        mockWorld,
        []
      );
    });

    test('should generate templates with template ID prefix', async () => {
      const templates = await generateWorldCharacterTemplates(mockWorld);

      templates.forEach(template => {
        expect(template.id).toMatch(/^template_/);
      });
    });

    test('should preserve all archetype properties except ID', async () => {
      const templates = await generateWorldCharacterTemplates(mockWorld);

      templates.forEach((template, index) => {
        const archetype = mockArchetypes[index];
        expect(template.name).toBe(archetype.name);
        expect(template.description).toBe(archetype.description);
        expect(template.level).toBe(archetype.level);
        expect(template.attributes).toEqual(archetype.attributes);
        expect(template.skills).toEqual(archetype.skills);
        expect(template.background).toEqual(archetype.background);
      });
    });

    test('should generate templates for different genres', async () => {
      const genres: Array<'fantasy' | 'sci-fi' | 'modern' | 'western' | 'historical' | 'horror'> =
        ['fantasy', 'sci-fi', 'modern', 'western', 'historical', 'horror'];

      for (const genre of genres) {
        const worldWithGenre = { ...mockWorld, genre };
        const templates = await generateWorldCharacterTemplates(worldWithGenre);

        expect(templates).toHaveLength(3);
        expect(characterArchetypes.generateCharacterArchetypes).toHaveBeenCalledWith(
          worldWithGenre,
          []
        );
      }
    });

    test('should throw error if world is null or undefined', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(generateWorldCharacterTemplates(null as any)).rejects.toThrow(
        'World data is required'
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await expect(generateWorldCharacterTemplates(undefined as any)).rejects.toThrow(
        'World data is required'
      );
    });

    test('should throw error if world genre is missing', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const worldWithoutGenre = { ...mockWorld, genre: undefined as any };

      await expect(generateWorldCharacterTemplates(worldWithoutGenre)).rejects.toThrow(
        'World genre is required'
      );
    });

    test('should throw error if world has no attributes', async () => {
      const worldWithoutAttributes = { ...mockWorld, attributes: [] };

      await expect(
        generateWorldCharacterTemplates(worldWithoutAttributes)
      ).rejects.toThrow('World must have attributes defined');
    });

    test('should throw error if attributes is not an array', async () => {
      const worldWithInvalidAttributes = {
        ...mockWorld,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        attributes: null as any,
      };

      await expect(
        generateWorldCharacterTemplates(worldWithInvalidAttributes)
      ).rejects.toThrow('World must have attributes defined');
    });

    test('should throw error if world has no skills', async () => {
      const worldWithoutSkills = { ...mockWorld, skills: [] };

      await expect(generateWorldCharacterTemplates(worldWithoutSkills)).rejects.toThrow(
        'World must have skills defined'
      );
    });

    test('should throw error if skills is not an array', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const worldWithInvalidSkills = { ...mockWorld, skills: null as any };

      await expect(
        generateWorldCharacterTemplates(worldWithInvalidSkills)
      ).rejects.toThrow('World must have skills defined');
    });

    test('should warn if template exceeds attribute point pool', async () => {
      const archetypesExceedingPool = [
        {
          ...mockArchetypes[0],
          attributes: [
            { id: 'attr-1', name: 'Strength', value: 20 }, // Exceeds pool of 30
            { id: 'attr-2', name: 'Intelligence', value: 15 },
          ],
        },
      ];

      (characterArchetypes.generateCharacterArchetypes as jest.Mock).mockResolvedValue(
        archetypesExceedingPool as CharacterArchetype[]
      );

      await generateWorldCharacterTemplates(mockWorld);

      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('exceeds attribute point pool')
      );
    });

    test('should not warn if templates respect attribute point pool', async () => {
      // Default mock archetypes respect the pool (13 and 13)
      await generateWorldCharacterTemplates(mockWorld);

      expect(logger.warn).not.toHaveBeenCalled();
    });

    test('should handle world with no settings gracefully', async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const worldWithoutSettings = { ...mockWorld, settings: undefined as any };

      // Should not throw, but will warn since point pool defaults to 0
      const templates = await generateWorldCharacterTemplates(worldWithoutSettings);

      expect(templates).toHaveLength(3);
      // When settings is undefined, point pool defaults to 0, so warnings are expected
      expect(logger.warn).toHaveBeenCalled();
    });

    test('should produce deterministic results for same world', async () => {
      // The actual deterministic seeding is in generateCharacterArchetypes
      // We just verify it's called correctly
      await generateWorldCharacterTemplates(mockWorld);
      await generateWorldCharacterTemplates(mockWorld);

      expect(characterArchetypes.generateCharacterArchetypes).toHaveBeenCalledTimes(2);
      expect(characterArchetypes.generateCharacterArchetypes).toHaveBeenNthCalledWith(
        1,
        mockWorld,
        []
      );
      expect(characterArchetypes.generateCharacterArchetypes).toHaveBeenNthCalledWith(
        2,
        mockWorld,
        []
      );
    });
  });
});
