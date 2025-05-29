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
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockCharacter = {
  id: 'char-1',
  worldId: 'world-1',
  name: 'Aria the Brave',
  background: {
    history: 'A courageous warrior',
    personality: 'Bold and adventurous',
    physicalDescription: 'Tall with flowing red hair',
    goals: [],
    fears: [],
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
    location: 'Starting Village',
  },
  portrait: { type: 'placeholder' as const, url: null },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

interface MockStoreOptions {
  hasSession: boolean;
  narrativeCount?: number;
  timeAgo?: number; // milliseconds ago
  hasMultipleSessions?: boolean;
}

export const createMockStoreState = (options: MockStoreOptions) => {
  return (Story: React.ComponentType) => {
    const { hasSession, narrativeCount = 12, timeAgo = 3600000, hasMultipleSessions = false } = options;
    
    if (!hasSession) {
      // Empty state
      worldStore.setState({ worlds: {}, currentWorldId: null });
      characterStore.setState({ characters: {} });
      sessionStore.setState({ savedSessions: {} });
    } else {
      // Create session data
      const mockSavedSession = {
        id: 'session-1',
        worldId: 'world-1',
        characterId: 'char-1',
        lastPlayed: new Date(Date.now() - timeAgo).toISOString(),
        narrativeCount,
      };

      const worlds = { [mockWorld.id]: mockWorld };
      const characters = { [mockCharacter.id]: mockCharacter };
      const sessions = { [mockSavedSession.id]: mockSavedSession };

      // Add additional session if multiple requested
      if (hasMultipleSessions) {
        const olderWorld = {
          ...mockWorld,
          id: 'world-2',
          name: 'Ancient Mysteries',
          theme: 'mystery' as const,
        };
        
        const olderCharacter = {
          ...mockCharacter,
          id: 'char-2',
          worldId: 'world-2',
          name: 'Detective Holmes',
        };
        
        const olderSession = {
          id: 'session-2',
          worldId: 'world-2',
          characterId: 'char-2',
          lastPlayed: new Date(Date.now() - (timeAgo + 86400000)).toISOString(), // 1 day older
          narrativeCount: 8,
        };

        worlds[olderWorld.id] = olderWorld;
        characters[olderCharacter.id] = olderCharacter;
        sessions[olderSession.id] = olderSession;
      }

      worldStore.setState({ worlds, currentWorldId: null });
      characterStore.setState({ characters });
      sessionStore.setState({ savedSessions: sessions });
    }
    
    return <Story />;
  };
};