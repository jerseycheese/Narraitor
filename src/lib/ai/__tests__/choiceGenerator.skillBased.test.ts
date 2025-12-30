/**
 * MVP-level tests for skill-based choice generation
 * Focus on ensuring character skills are included in choice generation context
 */

import { ChoiceGenerator } from '../choiceGenerator';
import type { AIClient } from '../types';
import type { NarrativeContext } from '@/types/narrative.types';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import type { Character } from '@/types/character.types';

// Mock stores
jest.mock('@/state/worldStore');
jest.mock('@/state/characterStore');
jest.mock('@/state/inventoryStore');
jest.mock('@/state/npcStore');

describe('ChoiceGenerator - Skill-Based Choices', () => {
  let mockAIClient: AIClient;
  let choiceGenerator: ChoiceGenerator;
  let mockWorld: any;
  let mockCharacter: Character;

  beforeEach(() => {
    // Mock AI client
    mockAIClient = {
      generateContent: jest.fn().mockResolvedValue({
        content: `**Examine the lock** [diplomatic]
**Force the door** [aggressive]
**Pick the lock** [stealthy]

Decision Weight: [minor]`
      })
    } as unknown as AIClient;

    choiceGenerator = new ChoiceGenerator(mockAIClient);

    // Mock world with skills
    mockWorld = {
      id: 'world-1',
      name: 'Fantasy Realm',
      description: 'A medieval fantasy world',
      genre: 'fantasy',
      skills: [
        {
          id: 'lockpicking',
          name: 'Lockpicking',
          description: 'Open locks without keys'
        },
        {
          id: 'stealth',
          name: 'Stealth',
          description: 'Move unseen and unheard'
        }
      ],
      settings: {
        maxAttributes: 6,
        maxSkills: 12,
        attributePointPool: 27,
        skillPointPool: 40
      },
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      attributes: []
    };

    // Mock character with high lockpicking skill
    mockCharacter = {
      id: 'char-1',
      name: 'Skilled Rogue',
      worldId: 'world-1',
      description: 'A nimble thief',
      background: {
        history: 'Former street urchin',
        personality: 'Cunning',
        goals: [],
        fears: [],
        relationships: []
      },
      attributes: [
        { attributeId: 'dexterity', value: 8 }
      ],
      skills: [
        {
          skillId: 'lockpicking',
          level: 8, // Expert level
          experience: 100,
          isActive: true
        },
        {
          skillId: 'stealth',
          level: 6, // Proficient
          experience: 60,
          isActive: true
        }
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

    // Mock store methods
    const mockWorldStore = {
      worlds: { 'world-1': mockWorld },
      getWorldById: jest.fn().mockReturnValue(mockWorld)
    };
    (useWorldStore as unknown as jest.Mock).mockReturnValue(mockWorldStore);
    (useWorldStore.getState as jest.Mock) = jest.fn().mockReturnValue(mockWorldStore);

    const mockCharacterStore = {
      getCharacterById: jest.fn().mockReturnValue(mockCharacter)
    };
    (useCharacterStore as unknown as jest.Mock).mockReturnValue(mockCharacterStore);
    (useCharacterStore.getState as jest.Mock) = jest.fn().mockReturnValue(mockCharacterStore);

    // Mock inventory and NPC stores
    const mockInventoryStore = {
      getCharacterItems: jest.fn().mockReturnValue([])
    };
    (require('@/state/inventoryStore').useInventoryStore as unknown as jest.Mock).mockReturnValue(mockInventoryStore);
    (require('@/state/inventoryStore').useInventoryStore.getState as jest.Mock) = jest.fn().mockReturnValue(mockInventoryStore);

    const mockNPCStore = {
      getActiveNPCsByLocation: jest.fn().mockReturnValue([])
    };
    (require('@/state/npcStore').useNPCStore as unknown as jest.Mock).mockReturnValue(mockNPCStore);
    (require('@/state/npcStore').useNPCStore.getState as jest.Mock) = jest.fn().mockReturnValue(mockNPCStore);
  });

  describe('Character Skills in Context', () => {
    test('includes character skills in choice generation prompt', async () => {
      const narrativeContext: NarrativeContext = {
        location: 'Locked Door',
        situation: 'You stand before a locked door',
        recentEvents: [],
        currentSegment: 'You approach the door.',
        worldId: 'world-1',
        previousSegments: []
      };

      await choiceGenerator.generateChoices({
        worldId: 'world-1',
        narrativeContext,
        characterIds: ['char-1']
      });

      // Verify AI client was called with context including skills
      expect(mockAIClient.generateContent).toHaveBeenCalled();
      const prompt = (mockAIClient.generateContent as jest.Mock).mock.calls[0][0];

      // Prompt should mention lockpicking skill
      expect(prompt).toMatch(/lockpicking/i);
      expect(prompt).toMatch(/stealth/i);
    });

    test('includes skill proficiency levels in context', async () => {
      const narrativeContext: NarrativeContext = {
        location: 'Locked Chest',
        situation: 'A locked chest sits before you',
        recentEvents: [],
        currentSegment: 'You examine the chest.',
        worldId: 'world-1',
        previousSegments: []
      };

      await choiceGenerator.generateChoices({
        worldId: 'world-1',
        narrativeContext,
        characterIds: ['char-1']
      });

      const prompt = (mockAIClient.generateContent as jest.Mock).mock.calls[0][0];

      // Should include skill proficiency (Expert, Proficient, etc.)
      expect(prompt).toMatch(/Expert|Proficient|Master|Trained/i);
    });

    test('handles character with no skills gracefully', async () => {
      // Character with no skills
      const characterNoSkills = {
        ...mockCharacter,
        skills: []
      };

      (useCharacterStore as unknown as jest.Mock).mockReturnValue({
        getCharacterById: jest.fn().mockReturnValue(characterNoSkills)
      });

      const narrativeContext: NarrativeContext = {
        location: 'Empty Room',
        situation: 'An empty room',
        recentEvents: [],
        currentSegment: 'You enter.',
        worldId: 'world-1',
        previousSegments: []
      };

      const result = await choiceGenerator.generateChoices({
        worldId: 'world-1',
        narrativeContext,
        characterIds: ['char-1']
      });

      // Should still generate choices without errors
      expect(result.options.length).toBeGreaterThan(0);
    });

    test('handles multiple characters with different skills', async () => {
      const secondCharacter = {
        ...mockCharacter,
        id: 'char-2',
        name: 'Strong Warrior',
        skills: [
          {
            skillId: 'combat',
            level: 9,
            experience: 200,
            isActive: true
          }
        ]
      };

      (useCharacterStore as unknown as jest.Mock).mockReturnValue({
        getCharacterById: jest.fn((id: string) =>
          id === 'char-1' ? mockCharacter : secondCharacter
        )
      });

      const narrativeContext: NarrativeContext = {
        location: 'Ambush Point',
        situation: 'Enemies ahead',
        recentEvents: [],
        currentSegment: 'You sense danger.',
        worldId: 'world-1',
        previousSegments: []
      };

      await choiceGenerator.generateChoices({
        worldId: 'world-1',
        narrativeContext,
        characterIds: ['char-1', 'char-2']
      });

      const prompt = (mockAIClient.generateContent as jest.Mock).mock.calls[0][0];

      // Should include skills from both characters
      expect(prompt).toMatch(/lockpicking|stealth/i);
      expect(prompt).toMatch(/combat/i);
    });
  });
});
