import React from 'react';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
import { sessionStore } from '@/state/sessionStore';

// Shared mock data
export const mockWorld = {
  id: 'world-1',
  name: 'The Enchanted Realm',
  description: 'A magical world filled with wonder',
  theme: 'fantasy' as const,
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 10,
    maxSkills: 10,
    attributePointPool: 100,
    skillPointPool: 100,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockCharacter = {
  id: 'char-1',
  worldId: 'world-1',
  name: 'Aria the Brave',
  description: 'A courageous warrior with noble intentions',
  level: 3,
  isPlayer: true,
  background: {
    history: 'A courageous warrior with noble intentions',
    personality: 'Bold and adventurous',
    goals: ['To protect the innocent and seek adventure'],
    fears: ['Failing those who depend on her'],
    relationships: [],
  },
  attributes: [],
  skills: [],
  inventory: {
    characterId: 'char-1',
    items: [],
    capacity: 100,
    categories: [],
  },
  status: {
    health: 100,
    maxHealth: 100,
    conditions: [],
  },
  portrait: { type: 'placeholder' as const, url: null },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface MockStoreOptions {
  hasSession: boolean;
  narrativeCount?: number;
  timeAgo?: number; // milliseconds ago
}

export const createMockStoreState = (options: MockStoreOptions) => {
  const MockStateWrapper = (Story: React.ComponentType) => {
    const { hasSession, narrativeCount = 12, timeAgo = 3600000 } = options;
    
    if (!hasSession) {
      // Empty state
      worldStore.setState({ 
        worlds: {}, 
        currentWorldId: null,
        setCurrentWorld: (id: string) => console.log('Set world:', id),
      });
      characterStore.setState({ 
        characters: {},
        setCurrentCharacter: (id: string) => console.log('Set character:', id),
      });
      sessionStore.setState({ 
        savedSessions: {},
        resumeSavedSession: (id: string) => {
          console.log('Resume session:', id);
          return true;
        },
      });
    } else {
      // Create session data
      const mockSavedSession = {
        id: 'session-1',
        worldId: 'world-1',
        characterId: 'char-1',
        lastPlayed: new Date(Date.now() - timeAgo).toISOString(),
        narrativeCount,
      };

      worldStore.setState({ 
        worlds: { [mockWorld.id]: mockWorld },
        currentWorldId: null,
        setCurrentWorld: (id: string) => console.log('Set world:', id),
      });
      characterStore.setState({ 
        characters: { [mockCharacter.id]: mockCharacter },
        setCurrentCharacter: (id: string) => console.log('Set character:', id),
      });
      sessionStore.setState({ 
        savedSessions: { [mockSavedSession.id]: mockSavedSession },
        resumeSavedSession: (id: string) => {
          console.log('Resume session:', id);
          return true;
        },
      });
    }
    
    return <Story />;
  };
  
  MockStateWrapper.displayName = 'MockStateWrapper';
  return MockStateWrapper;
};