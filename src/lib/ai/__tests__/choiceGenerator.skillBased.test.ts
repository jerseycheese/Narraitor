/**
 * MVP-level tests for skill-based choice generation
 * Focus on ensuring character skills are included in choice generation context
 */

import { generateChoices } from '../choiceGenerator';
import type { AIClient } from '../types';
import type { NarrativeContext } from '@/types/narrative.types';
import type { World } from '@/types/world.types';
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
  let mockWorld: World;
  let mockCharacter: Character;

  beforeEach(() => {
    // Mock AI client
    mockAIClient = {
      generateContent: jest.fn().mockResolvedValue({
        content: `**Examine the lock** [diplomatic]
**Force the door** [aggressive]
**Pick the lock** [stealthy]

Decision Weight: [minor]`,
      }),
    } as unknown as AIClient;

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
          description: 'Open locks without keys',
          worldId: 'world-1',
          difficulty: 'medium' as const,
          baseValue: 3,
          minValue: 1,
          maxValue: 5,
        },
        {
          id: 'stealth',
          name: 'Stealth',
          description: 'Move unseen and unheard',
          worldId: 'world-1',
          difficulty: 'medium' as const,
          baseValue: 3,
          minValue: 1,
          maxValue: 5,
        },
      ],
      settings: {
        maxAttributes: 6,
        maxSkills: 12,
        attributePointPool: 27,
        skillPointPool: 40,
      },
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
      attributes: [],
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
        relationships: [],
      },
      attributes: [{ attributeId: 'dexterity', value: 8 }],
      skills: [
        {
          skillId: 'lockpicking',
          level: 4, // Expert level
          experience: 100,
          isActive: true,
        },
        {
          skillId: 'stealth',
          level: 3, // Competent
          experience: 60,
          isActive: true,
        },
      ],
      derivedStats: [],
      inventory: {
        characterId: 'char-1',
        items: [],
        capacity: 100,
        categories: [],
        itemOrder: [],
      },
      status: {
        conditions: [],
      },
      createdAt: '2023-01-01',
      updatedAt: '2023-01-01',
    };

    // Mock store methods
    const mockWorldStore = {
      worlds: { 'world-1': mockWorld },
      getWorldById: jest.fn().mockReturnValue(mockWorld),
    };
    (useWorldStore as unknown as jest.Mock).mockReturnValue(mockWorldStore);
    (useWorldStore.getState as jest.Mock) = jest
      .fn()
      .mockReturnValue(mockWorldStore);

    const mockCharacterStore = {
      characters: { 'char-1': mockCharacter },
      getCharacterById: jest.fn().mockReturnValue(mockCharacter),
    };
    (useCharacterStore as unknown as jest.Mock).mockReturnValue(
      mockCharacterStore
    );
    (useCharacterStore.getState as jest.Mock) = jest
      .fn()
      .mockReturnValue(mockCharacterStore);

    // Mock inventory and NPC stores
    const mockInventoryStore = {
      getCharacterItems: jest.fn().mockReturnValue([]),
    };
    (
      require('@/state/inventoryStore')
        .useInventoryStore as unknown as jest.Mock
    ).mockReturnValue(mockInventoryStore);
    (require('@/state/inventoryStore').useInventoryStore
      .getState as jest.Mock) = jest.fn().mockReturnValue(mockInventoryStore);

    const mockNPCStore = {
      getActiveNPCsByLocation: jest.fn().mockReturnValue([]),
    };
    (
      require('@/state/npcStore').useNPCStore as unknown as jest.Mock
    ).mockReturnValue(mockNPCStore);
    (require('@/state/npcStore').useNPCStore.getState as jest.Mock) = jest
      .fn()
      .mockReturnValue(mockNPCStore);
  });

  describe('Character Skills in Context', () => {
    test('includes character skills in choice generation prompt', async () => {
      const narrativeContext: NarrativeContext = {
        worldId: 'world-1',
        currentSceneId: 'scene-1',
        characterIds: ['char-1'],
        previousSegments: [],
        currentTags: [],
        sessionId: 'session-1',
        currentLocation: 'Locked Door',
        currentSituation: 'You stand before a locked door',
      };

      await generateChoices(mockAIClient,{
        worldId: 'world-1',
        narrativeContext,
        characterIds: ['char-1'],
      });

      // Verify AI client was called with context including skills
      expect(mockAIClient.generateContent).toHaveBeenCalled();
      const prompt = (mockAIClient.generateContent as jest.Mock).mock
        .calls[0][0];

      // Prompt should mention lockpicking skill
      expect(prompt).toMatch(/lockpicking/i);
      expect(prompt).toMatch(/stealth/i);
    });

    test('includes skill proficiency levels in context', async () => {
      const narrativeContext: NarrativeContext = {
        worldId: 'world-1',
        currentSceneId: 'scene-1',
        characterIds: ['char-1'],
        previousSegments: [],
        currentTags: [],
        sessionId: 'session-1',
        currentLocation: 'Locked Chest',
        currentSituation: 'A locked chest sits before you',
      };

      await generateChoices(mockAIClient,{
        worldId: 'world-1',
        narrativeContext,
        characterIds: ['char-1'],
      });

      const prompt = (mockAIClient.generateContent as jest.Mock).mock
        .calls[0][0];

      // Should include skill proficiency (Expert, Competent, etc.) using 1-5 scale labels
      expect(prompt).toMatch(/Expert|Competent|Master|Apprentice|Novice/i);
    });

    test('handles character with no skills gracefully', async () => {
      // Character with no skills
      const characterNoSkills = {
        ...mockCharacter,
        skills: [],
        derivedStats: [],
      };

      const mockCharacterStoreNoSkills = {
        characters: { 'char-1': characterNoSkills },
      };
      (useCharacterStore as unknown as jest.Mock).mockReturnValue(
        mockCharacterStoreNoSkills
      );
      (useCharacterStore.getState as jest.Mock) = jest
        .fn()
        .mockReturnValue(mockCharacterStoreNoSkills);

      const narrativeContext: NarrativeContext = {
        worldId: 'world-1',
        currentSceneId: 'scene-1',
        characterIds: ['char-1'],
        previousSegments: [],
        currentTags: [],
        sessionId: 'session-1',
        currentLocation: 'Empty Room',
        currentSituation: 'An empty room',
      };

      const result = await generateChoices(mockAIClient,{
        worldId: 'world-1',
        narrativeContext,
        characterIds: ['char-1'],
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
            level: 5, // Master
            experience: 200,
            isActive: true,
          },
        ],
      };

      const mockCharacterStoreMultiple = {
        characters: {
          'char-1': mockCharacter,
          'char-2': secondCharacter,
        },
      };
      (useCharacterStore as unknown as jest.Mock).mockReturnValue(
        mockCharacterStoreMultiple
      );
      (useCharacterStore.getState as jest.Mock) = jest
        .fn()
        .mockReturnValue(mockCharacterStoreMultiple);

      const narrativeContext: NarrativeContext = {
        worldId: 'world-1',
        currentSceneId: 'scene-1',
        characterIds: ['char-1', 'char-2'],
        previousSegments: [],
        currentTags: [],
        sessionId: 'session-1',
        currentLocation: 'Ambush Point',
        currentSituation: 'Enemies ahead',
      };

      await generateChoices(mockAIClient,{
        worldId: 'world-1',
        narrativeContext,
        characterIds: ['char-1', 'char-2'],
      });

      const prompt = (mockAIClient.generateContent as jest.Mock).mock
        .calls[0][0];

      // Should include skills from both characters
      expect(prompt).toMatch(/lockpicking|stealth/i);
      expect(prompt).toMatch(/combat/i);
    });
  });
});
