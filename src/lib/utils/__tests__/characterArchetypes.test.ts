// src/lib/utils/__tests__/characterArchetypes.test.ts

import { generateCharacterArchetypes, getArchetypeTemplatesForGenre } from '../characterArchetypes';
import { World } from '@/types/world.types';
import { GenreValue } from '@/lib/constants/genres';

describe('characterArchetypes', () => {
  // Mock world data for testing
  const createMockWorld = (genre: GenreValue): World => ({
    id: 'test-world',
    name: 'Test World',
    description: 'A test world for character generation',
    genre,
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    attributes: [
      { id: 'str', name: 'Strength', description: 'Physical power', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'test-world' },
      { id: 'int', name: 'Intelligence', description: 'Mental acuity', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'test-world' },
      { id: 'agi', name: 'Agility', description: 'Speed and dexterity', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'test-world' }
    ],
    skills: [
      { id: 'combat', name: 'Combat', description: 'Fighting ability', difficulty: 'medium', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'test-world' },
      { id: 'stealth', name: 'Stealth', description: 'Moving unseen', difficulty: 'hard', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'test-world' },
      { id: 'magic', name: 'Magic', description: 'Mystical arts', difficulty: 'hard', baseValue: 5, minValue: 1, maxValue: 10, worldId: 'test-world' }
    ],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 20,
      skillPointPool: 20
    }
  });

  describe('getArchetypeTemplatesForGenre', () => {
    test('returns appropriate archetypes for fantasy genre', () => {
      const templates = getArchetypeTemplatesForGenre('fantasy');
      
      expect(templates).toHaveLength(3);
      expect(templates.map(t => t.name)).toEqual(['Warrior', 'Mage', 'Scout']);
      
      // Verify warrior archetype
      const warrior = templates.find(t => t.name === 'Warrior');
      expect(warrior).toBeDefined();
      expect(warrior?.primaryAttributes).toContain('Strength');
      expect(warrior?.preferredSkills).toContain('Combat');
    });

    test('returns appropriate archetypes for sci-fi genre', () => {
      const templates = getArchetypeTemplatesForGenre('sci-fi');
      
      expect(templates).toHaveLength(3);
      expect(templates.map(t => t.name)).toEqual(['Pilot', 'Engineer', 'Medic']);
      
      // Verify engineer archetype
      const engineer = templates.find(t => t.name === 'Engineer');
      expect(engineer).toBeDefined();
      expect(engineer?.primaryAttributes).toContain('Intelligence');
    });

    test('returns appropriate archetypes for modern genre', () => {
      const templates = getArchetypeTemplatesForGenre('modern');
      
      expect(templates).toHaveLength(3);
      expect(templates.map(t => t.name)).toEqual(['Detective', 'Athlete', 'Scholar']);
    });

    test('returns fantasy archetypes as fallback for unknown genre', () => {
      const templates = getArchetypeTemplatesForGenre('unknown' as GenreValue);

      expect(templates).toHaveLength(3);
      expect(templates.map(t => t.name)).toEqual(['Warrior', 'Mage', 'Scout']);
    });
  });

  describe('generateCharacterArchetypes', () => {
    test('generates 3 distinct archetypes for fantasy world', async () => {
      const world = createMockWorld('fantasy');
      const archetypes = await generateCharacterArchetypes(world);
      
      expect(archetypes).toHaveLength(3);
      
      // Each archetype should have different characteristics
      const names = archetypes.map(a => a.name);
      expect(new Set(names).size).toBe(3); // All names should be unique
      
      // Each archetype should have attributes and skills
      archetypes.forEach(archetype => {
        expect(archetype.attributes).toHaveLength(world.attributes.length);
        expect(archetype.skills).toHaveLength(world.skills.length);
        expect(archetype.background).toBeDefined();
        expect(archetype.background.personality).toBeDefined();
        expect(archetype.background.description).toBeDefined();
      });
    });

    test('ensures attributes are distributed according to archetype strengths', async () => {
      const world = createMockWorld('fantasy');
      const archetypes = await generateCharacterArchetypes(world);
      
      // Find the warrior archetype (should have high Strength)
      const warrior = archetypes.find(a => a.name.includes('Warrior') || a.name.includes('Fighter'));
      if (warrior) {
        const strengthAttr = warrior.attributes.find(a => a.name === 'Strength');
        expect(strengthAttr?.value).toBeGreaterThan(6); // Should be above average
      }
      
      // Find the mage archetype (should have high Intelligence)  
      const mage = archetypes.find(a => a.name.includes('Mage') || a.name.includes('Wizard'));
      if (mage) {
        const intAttr = mage.attributes.find(a => a.name === 'Intelligence');
        expect(intAttr?.value).toBeGreaterThan(6); // Should be above average
      }
    });

    test('ensures skill levels are appropriate for archetype roles', async () => {
      const world = createMockWorld('fantasy');
      const archetypes = await generateCharacterArchetypes(world);
      
      // Find the warrior archetype (should have high Combat skill)
      const warrior = archetypes.find(a => a.name.includes('Warrior') || a.name.includes('Fighter'));
      if (warrior) {
        const combatSkill = warrior.skills.find(s => s.name === 'Combat');
        expect(combatSkill?.level).toBeGreaterThan(5); // Should be competent or better
      }
    });

    test('generates names that fit the world theme', async () => {
      const world = createMockWorld('fantasy');
      const archetypes = await generateCharacterArchetypes(world);
      
      // Names should be strings and non-empty
      archetypes.forEach(archetype => {
        expect(archetype.name).toBeTruthy();
        expect(typeof archetype.name).toBe('string');
        expect(archetype.name.length).toBeGreaterThan(0);
      });
    });

    test('respects world attribute and skill bounds', async () => {
      const world = createMockWorld('fantasy');
      const archetypes = await generateCharacterArchetypes(world);
      
      archetypes.forEach(archetype => {
        // Check attribute bounds
        archetype.attributes.forEach(attr => {
          const worldAttr = world.attributes.find(wa => wa.name === attr.name);
          expect(worldAttr).toBeDefined();
          expect(attr.value).toBeGreaterThanOrEqual(worldAttr!.minValue);
          expect(attr.value).toBeLessThanOrEqual(worldAttr!.maxValue);
        });
        
        // Check skill bounds
        archetype.skills.forEach(skill => {
          expect(skill.level).toBeGreaterThanOrEqual(1);
          expect(skill.level).toBeLessThanOrEqual(10);
        });
      });
    });

    test('generates characters that are game-ready', async () => {
      const world = createMockWorld('fantasy');
      const archetypes = await generateCharacterArchetypes(world);
      
      archetypes.forEach(archetype => {
        // Should have level 1 (starting character)
        expect(archetype.level).toBe(1);
        
        // Should have complete background
        expect(archetype.background.description).toBeTruthy();
        expect(archetype.background.personality).toBeTruthy();
        expect(archetype.background.motivation).toBeTruthy();
        expect(Array.isArray(archetype.background.fears)).toBe(true);
        
        // Should be viable for skill checks (at least one skill > 3)
        const hasViableSkills = archetype.skills.some(skill => skill.level > 3);
        expect(hasViableSkills).toBe(true);
      });
    });
  });
});