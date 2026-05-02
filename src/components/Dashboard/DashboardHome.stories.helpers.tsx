import React from 'react';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import { getTimestamp } from '@/lib/utils';

const noopVoid = () => undefined;

export const mockWorldA = {
  id: 'world-1',
  name: 'The Enchanted Realm',
  description: 'A magical world filled with wonder',
  genre: 'fantasy' as const,
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 10,
    maxSkills: 10,
    attributePointPool: 100,
    skillPointPool: 100,
  },
  createdAt: getTimestamp(),
  updatedAt: getTimestamp(),
};

export const mockWorldB = {
  ...mockWorldA,
  id: 'world-2',
  name: 'Neon Shore',
  genre: 'sci-fi' as const,
};

export const mockCharacterA = {
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
  derivedStats: [],
  inventory: {
    characterId: 'char-1',
    items: [],
    capacity: 100,
    categories: [],
    itemOrder: [],
  },
  status: { health: 100, maxHealth: 100, conditions: [] },
  portrait: { type: 'placeholder' as const, url: null },
  createdAt: getTimestamp(),
  updatedAt: getTimestamp(),
};

export const mockCharacterB = {
  ...mockCharacterA,
  id: 'char-2',
  worldId: 'world-2',
  name: 'Vex',
};

export type DashboardScenario =
  | 'active-session'
  | 'returning-no-session'
  | 'empty-but-not-first-time';

export const mockDashboardState = (scenario: DashboardScenario) => {
  // Always bypass first-time onboarding so we render the dashboard,
  // not the GuidedFirstTimeExperience.
  const sharedSession = {
    isFirstTimeUser: () => false,
    shouldShowOnboarding: () => false,
    resumeSavedSession: () => true,
  };

  if (scenario === 'empty-but-not-first-time') {
    useWorldStore.setState({
      worlds: {},
      entities: {},
      currentWorldId: null,
      currentEntityId: null,
      setCurrentWorld: noopVoid,
    });
    useCharacterStore.setState({
      characters: {},
      entities: {},
      currentCharacterId: null,
      currentEntityId: null,
      error: null,
      loading: false,
      setCurrentCharacter: noopVoid,
    });
    useSessionStore.setState({
      savedSessions: {},
      ...sharedSession,
    });
    return;
  }

  if (scenario === 'returning-no-session') {
    useWorldStore.setState({
      worlds: { [mockWorldA.id]: mockWorldA, [mockWorldB.id]: mockWorldB },
      entities: { [mockWorldA.id]: mockWorldA, [mockWorldB.id]: mockWorldB },
      currentWorldId: null,
      currentEntityId: null,
      setCurrentWorld: noopVoid,
    });
    useCharacterStore.setState({
      characters: { [mockCharacterA.id]: mockCharacterA },
      entities: { [mockCharacterA.id]: mockCharacterA },
      currentCharacterId: null,
      currentEntityId: null,
      error: null,
      loading: false,
      setCurrentCharacter: noopVoid,
    });
    useSessionStore.setState({
      savedSessions: {},
      ...sharedSession,
    });
    return;
  }

  // active-session
  const session = {
    id: 'session-1',
    worldId: mockWorldA.id,
    characterId: mockCharacterA.id,
    lastPlayed: getTimestamp(),
    narrativeCount: 12,
  };
  useWorldStore.setState({
    worlds: { [mockWorldA.id]: mockWorldA, [mockWorldB.id]: mockWorldB },
    entities: { [mockWorldA.id]: mockWorldA, [mockWorldB.id]: mockWorldB },
    currentWorldId: null,
    currentEntityId: null,
    setCurrentWorld: noopVoid,
  });
  useCharacterStore.setState({
    characters: {
      [mockCharacterA.id]: mockCharacterA,
      [mockCharacterB.id]: mockCharacterB,
    },
    entities: {
      [mockCharacterA.id]: mockCharacterA,
      [mockCharacterB.id]: mockCharacterB,
    },
    currentCharacterId: mockCharacterA.id,
    currentEntityId: mockCharacterA.id,
    error: null,
    loading: false,
    setCurrentCharacter: noopVoid,
  });
  useSessionStore.setState({
    savedSessions: { [session.id]: session },
    ...sharedSession,
  });
};

export const withDashboardScenario = (scenario: DashboardScenario) => {
  const Decorator = (Story: React.ComponentType) => {
    mockDashboardState(scenario);
    return <Story />;
  };
  Decorator.displayName = `DashboardScenario(${scenario})`;
  return Decorator;
};
