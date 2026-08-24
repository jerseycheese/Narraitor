'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useRouter } from 'next/navigation';
import { GenreValue } from '@/types';
import Logger from '@/lib/utils/logger';

const logger = new Logger('QuickSetup');

/**
 * Quick Setup Button - Generates a test world and character instantly
 */
export const QuickSetup = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();
  const { createWorld } = useWorldStore();
  const { createCharacter } = useCharacterStore();

  const handleQuickSetup = async () => {
    try {
      setIsGenerating(true);

      // Create a simple test world
      const worldData = {
        name: 'Test World',
        description: 'Quick test world for development',
        genre: 'fantasy' as GenreValue,
        attributes: [
          {
            id: 'attr-strength',
            worldId: '',
            name: 'Strength',
            description: 'Physical power and endurance',
            baseValue: 10,
            minValue: 1,
            maxValue: 20,
          },
          {
            id: 'attr-intelligence',
            worldId: '',
            name: 'Intelligence',
            description: 'Reasoning and problem solving',
            baseValue: 10,
            minValue: 1,
            maxValue: 20,
          },
          {
            id: 'attr-charisma',
            worldId: '',
            name: 'Charisma',
            description: 'Presence and persuasion',
            baseValue: 10,
            minValue: 1,
            maxValue: 20,
          },
        ],
        skills: [
          {
            id: 'skill-combat',
            worldId: '',
            name: 'Combat',
            description: 'General combat effectiveness',
            difficulty: 'medium' as const,
            attributeIds: ['attr-strength'],
            baseValue: 3,
            minValue: 0,
            maxValue: 10,
          },
          {
            id: 'skill-stealth',
            worldId: '',
            name: 'Stealth',
            description: 'Move unseen and unheard',
            difficulty: 'medium' as const,
            attributeIds: ['attr-intelligence'],
            baseValue: 3,
            minValue: 0,
            maxValue: 10,
          },
        ],
        settings: {
          maxAttributes: 3,
          maxSkills: 4,
          attributePointPool: 30,
          skillPointPool: 20,
        },
      };

      const worldId = createWorld(worldData);
      logger.info(`Created world: ${worldId}`);

      // Set as current world
      useWorldStore.getState().setCurrentWorld(worldId);

      // Create a test character
      const characterData = {
        worldId,
        name: 'Test Character',
        description: 'Quick test character for development',
        level: 1,
        attributes: [
          {
            id: 'char-attr-strength',
            characterId: '',
            worldAttributeId: 'attr-strength',
            name: 'Strength',
            baseValue: 10,
            modifiedValue: 10,
            category: 'Physical',
          },
          {
            id: 'char-attr-intelligence',
            characterId: '',
            worldAttributeId: 'attr-intelligence',
            name: 'Intelligence',
            baseValue: 10,
            modifiedValue: 10,
            category: 'Mental',
          },
          {
            id: 'char-attr-charisma',
            characterId: '',
            worldAttributeId: 'attr-charisma',
            name: 'Charisma',
            baseValue: 10,
            modifiedValue: 10,
            category: 'Social',
          },
        ],
        skills: [
          {
            id: 'char-skill-combat',
            characterId: '',
            worldSkillId: 'skill-combat',
            name: 'Combat',
            level: 3,
            category: 'Generated',
          },
        ],
        derivedStats: [],
        background: {
          history: 'A traveler drawn into a mysterious realm.',
          personality: 'Curious and resilient.',
          goals: ['Find answers', 'Survive the unknown'],
          fears: ['Losing control'],
          physicalDescription: 'Worn cloak and focused eyes',
          relationships: [],
        },
        isPlayer: true,
        status: {
          conditions: [],
        },
        inventory: {
          characterId: '',
          items: [],
          capacity: 20,
          categories: [],
          itemOrder: [],
        },
      };

      const characterId = createCharacter(characterData);
      logger.info(`Created character: ${characterId}`);

      // Navigate to play page
      router.push(`/worlds/${worldId}/play`);
      logger.info(`Navigating to play session`);

    } catch (error) {
      logger.error('Error during quick setup:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Button
      onClick={handleQuickSetup}
      disabled={isGenerating}
      variant="success"
      size="sm"
    >
      {isGenerating ? 'Generating...' : '⚡ Quick Setup (World + Character)'}
    </Button>
  );
};
