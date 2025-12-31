/**
 * MVP-level tests for PersonalizationEngine attribute/skill integration
 * Focus on acceptance criteria: narrative enhancement includes character attributes and skills
 */

import { PersonalizationEngine } from '../personalizationEngine';
import { Character } from '@/types/character.types';
import { World } from '@/types/world.types';

describe('PersonalizationEngine - Attribute & Skill Integration', () => {
  let engine: PersonalizationEngine;
  let mockCharacter: Character;
  let mockWorld: World;

  // Helper to convert Character to PersonalizationCharacter format
  const convertToPersonalizationCharacter = (character: Character) => ({
    id: character.id,
    name: character.name,
    background: typeof character.background === 'object' ? character.background.history || '' : character.background,
    attributes: character.attributes,
    skills: character.skills,
    createdAt: character.createdAt,
    updatedAt: character.updatedAt
  });

  beforeEach(() => {
    engine = new PersonalizationEngine();

    mockCharacter = {
      id: 'char-1',
      name: 'Skilled Rogue',
      worldId: 'world-1',
      description: 'A nimble thief with exceptional dexterity',
      background: {
        history: 'Former street urchin turned master thief',
        personality: 'Cunning and cautious',
        goals: ['Steal the Crown Jewels'],
        fears: ['Getting caught'],
        relationships: []
      },
      attributes: [
        { attributeId: 'attr-dexterity', value: 9 },      // Exceptional
        { attributeId: 'attr-intelligence', value: 7 },   // High
        { attributeId: 'attr-strength', value: 3 },       // Low
        { attributeId: 'attr-charisma', value: 5 }        // Moderate (filtered out)
      ],
      skills: [
        { skillId: 'skill-lockpicking', level: 4, experience: 100, isActive: true },    // Expert
        { skillId: 'skill-stealth', level: 3, experience: 80, isActive: true },         // Competent
        { skillId: 'skill-pickpocket', level: 2, experience: 40, isActive: true }       // Apprentice
      ],
      inventory: {
        characterId: 'char-1',
        items: [],
        capacity: 100,
        categories: [],
        itemOrder: []
      },
      status: {
        health: 100,
        maxHealth: 100,
        conditions: []
      },
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01'
    };

    mockWorld = {
      id: 'world-1',
      name: 'Fantasy Realm',
      description: 'A classic fantasy setting',
      genre: 'fantasy',
      settings: {
        maxAttributes: 6,
        maxSkills: 12,
        attributePointPool: 27,
        skillPointPool: 40
      },
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      attributes: [],
      skills: []
    };
  });

  describe('Narrative Enhancement with Attributes', () => {
    test('includes notable attributes in narrative enhancement', () => {
      const context = engine.createPersonalizedContext(
        convertToPersonalizationCharacter(mockCharacter),
        mockWorld,
        [],
        [],
        [],
        []
      );

      const enhancement = engine.generateNarrativeEnhancement(context);

      // Should include exceptional dexterity
      expect(enhancement).toContain('attr-dexterity');
      expect(enhancement).toContain('Exceptional');

      // Should include high intelligence
      expect(enhancement).toContain('attr-intelligence');
      expect(enhancement).toContain('High');

      // Should include low strength
      expect(enhancement).toContain('attr-strength');
      expect(enhancement).toContain('Low');

      // Should NOT include moderate charisma (filtered out)
      expect(enhancement).not.toMatch(/attr-charisma.*Moderate/);
    });

    test('handles Record-style attributes', () => {
      const characterWithRecordAttrs = {
        ...convertToPersonalizationCharacter(mockCharacter),
        attributes: {
          dexterity: 9,
          intelligence: 7,
          strength: 3
        }
      };

      const context = engine.createPersonalizedContext(
        characterWithRecordAttrs,
        mockWorld,
        [],
        [],
        [],
        []
      );

      const enhancement = engine.generateNarrativeEnhancement(context);

      expect(enhancement).toContain('dexterity');
      expect(enhancement).toContain('Exceptional');
    });

    test('handles empty attributes gracefully', () => {
      const characterNoAttrs = {
        ...convertToPersonalizationCharacter(mockCharacter),
        attributes: []
      };

      const context = engine.createPersonalizedContext(
        characterNoAttrs,
        mockWorld,
        [],
        [],
        [],
        []
      );

      const enhancement = engine.generateNarrativeEnhancement(context);

      // Should still generate enhancement without attributes section
      expect(enhancement).toContain('CHARACTER:');
      expect(enhancement).not.toContain('ATTRIBUTES:');
    });
  });

  describe('Narrative Enhancement with Skills', () => {
    test('includes all skills in narrative enhancement', () => {
      const context = engine.createPersonalizedContext(
        convertToPersonalizationCharacter(mockCharacter),
        mockWorld,
        [],
        [],
        [],
        []
      );

      const enhancement = engine.generateNarrativeEnhancement(context);

      // Should include all skills with descriptive labels
      expect(enhancement).toContain('skill-lockpicking');
      expect(enhancement).toContain('Expert');

      expect(enhancement).toContain('skill-stealth');
      expect(enhancement).toContain('Competent');

      expect(enhancement).toContain('skill-pickpocket');
      expect(enhancement).toContain('Apprentice');
    });

    test('handles skills with name property', () => {
      const characterWithNameSkills = {
        ...convertToPersonalizationCharacter(mockCharacter),
        skills: [
          { name: 'Lockpicking', level: 4, worldSkillId: 'skill-lockpicking' }, // Expert
          { name: 'Stealth', level: 3 } // Competent
        ]
      };

      const context = engine.createPersonalizedContext(
        characterWithNameSkills,
        mockWorld,
        [],
        [],
        [],
        []
      );

      const enhancement = engine.generateNarrativeEnhancement(context);

      expect(enhancement).toContain('skill-lockpicking');
      expect(enhancement).toContain('Expert');
    });

    test('handles empty skills gracefully', () => {
      const characterNoSkills = {
        ...convertToPersonalizationCharacter(mockCharacter),
        skills: []
      };

      const context = engine.createPersonalizedContext(
        characterNoSkills,
        mockWorld,
        [],
        [],
        [],
        []
      );

      const enhancement = engine.generateNarrativeEnhancement(context);

      // Should still generate enhancement without skills section
      expect(enhancement).toContain('CHARACTER:');
      expect(enhancement).not.toContain('SKILLS:');
    });
  });

  describe('Complete Narrative Enhancement Integration', () => {
    test('generates comprehensive enhancement with attributes, skills, and existing data', () => {
      const goals = [
        {
          id: 'goal-1',
          description: 'Steal the Crown Jewels',
          priority: 'primary' as const,
          isActive: true,
          createdAt: '2023-01-01',
          establishedAt: '2023-01-01',
          progress: 50
        }
      ];

      const decisions = [
        {
          id: 'decision-1',
          prompt: 'How do you approach the palace?',
          choiceText: 'Sneak past the guards',
          choiceType: 'stealthy' as const,
          timestamp: '2023-01-01',
          sessionId: 'session-1',
          worldId: 'world-1',
          context: {
            location: 'Palace Courtyard',
            charactersPresent: ['Guard Captain']
          }
        }
      ];

      const context = engine.createPersonalizedContext(
        convertToPersonalizationCharacter(mockCharacter),
        mockWorld,
        decisions,
        [],
        goals,
        []
      );

      const enhancement = engine.generateNarrativeEnhancement(context);

      // Should include all elements
      expect(enhancement).toContain('CHARACTER: Skilled Rogue');
      expect(enhancement).toContain('ATTRIBUTES:');
      expect(enhancement).toContain('attr-dexterity (Exceptional)');
      expect(enhancement).toContain('SKILLS:');
      expect(enhancement).toContain('skill-lockpicking (Expert)');
      expect(enhancement).toContain('RECENT PLAYER DECISIONS:');
      expect(enhancement).toContain('Sneak past the guards');
      expect(enhancement).toContain('ACTIVE GOALS:');
      expect(enhancement).toContain('Steal the Crown Jewels');
    });

    test('maintains proper section ordering in enhancement', () => {
      const context = engine.createPersonalizedContext(
        convertToPersonalizationCharacter(mockCharacter),
        mockWorld,
        [],
        [],
        [],
        []
      );

      const enhancement = engine.generateNarrativeEnhancement(context);

      // CHARACTER should come first
      const charIndex = enhancement.indexOf('CHARACTER:');
      const attrsIndex = enhancement.indexOf('ATTRIBUTES:');
      const skillsIndex = enhancement.indexOf('SKILLS:');

      expect(charIndex).toBeLessThan(attrsIndex);
      expect(attrsIndex).toBeLessThan(skillsIndex);
    });
  });
});
