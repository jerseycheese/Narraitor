import React from 'react';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import { getTimestamp } from '@/lib/utils';

// Shared mock data
const mockWorlds = {
  'world-1': {
    id: 'world-1',
    name: 'The Enchanted Realm',
    description: 'A magical world filled with wonder and ancient mysteries',
    genre: 'fantasy' as const,
    attributes: [],
    skills: [],
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
  },
  'world-2': {
    id: 'world-2',
    name: 'Cyberpunk 2087',
    description: 'A dystopian future where technology and humanity collide',
    genre: 'fantasy' as const,
    attributes: [],
    skills: [],
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
  },
};

const mockCharacters = {
  'char-1': {
    id: 'char-1',
    worldId: 'world-1',
    name: 'Aria the Brave',
    background: {
      history: 'A courageous warrior from the northern kingdoms',
      personality: 'Bold, adventurous, and fiercely loyal to friends',
      physicalDescription: 'Tall with flowing red hair and piercing green eyes',
      goals: ['Restore peace to the realm'],
      fears: ['Losing those she protects'],
      relationships: [],
    },
    attributes: [],
    skills: [],
    derivedStats: [],
    inventory: {
      characterId: 'char-1',
      items: [],
      capacity: 100,
      categories: [],
    },
    status: {
      conditions: [],
      location: 'Starting Village',
    },
    portrait: { type: 'placeholder' as const, url: null },
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
  },
  'char-2': {
    id: 'char-2',
    worldId: 'world-1',
    name: 'Zephyr the Wise',
    background: {
      history: 'An ancient wizard with knowledge of forgotten spells',
      personality: 'Thoughtful, patient, and mysteriously wise',
      physicalDescription:
        'Elderly with a long white beard and twinkling blue eyes',
      goals: ['Preserve ancient knowledge'],
      fears: ['The loss of magic from the world'],
      relationships: [],
    },
    attributes: [],
    skills: [],
    derivedStats: [],
    inventory: {
      characterId: 'char-2',
      items: [],
      capacity: 100,
      categories: [],
    },
    status: {
      conditions: [],
      location: 'Wizard Tower',
    },
    portrait: { type: 'placeholder' as const, url: null },
    createdAt: getTimestamp(),
    updatedAt: getTimestamp(),
  },
};

interface WizardMockOptions {
  hasWorlds: boolean;
  hasCharacters: boolean;
}

export const createWizardMockState = (options: WizardMockOptions) => {
  const WizardMockWrapper = (Story: React.ComponentType) => {
    const { hasWorlds, hasCharacters } = options;

    const worlds = hasWorlds ? mockWorlds : {};
    const characters = hasCharacters ? mockCharacters : {};

    useWorldStore.setState({
      worlds,
      entities: worlds,
      currentWorldId: null,
      currentEntityId: null,
    });
    const firstCharacterId = hasCharacters
      ? (Object.keys(characters)[0] ?? null)
      : null;
    useCharacterStore.setState({
      characters,
      entities: characters,
      currentCharacterId: firstCharacterId,
      currentEntityId: firstCharacterId,
      error: null,
      loading: false,
    });
    useSessionStore.setState({
      savedSessions: {},
      initializeSession: async (
        worldId: string,
        characterId: string,
        callback?: () => void
      ) => {
        console.log('Initializing session:', { worldId, characterId });
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            callback?.();
            resolve();
          }, 1000);
        });
      },
    });

    return <Story />;
  };

  WizardMockWrapper.displayName = 'WizardMockWrapper';
  return WizardMockWrapper;
};
