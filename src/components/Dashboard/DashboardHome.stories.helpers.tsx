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
  image: {
    type: 'ai-generated' as const,
    url: '/visual-assets/world-cyberpunk.png',
    prompt: 'A sweeping fantasy landscape',
    generatedAt: getTimestamp(),
  },
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

// World B intentionally has no image — exercises the no-image fallback.
export const mockWorldB = {
  ...mockWorldA,
  id: 'world-2',
  name: 'Neon Shore',
  genre: 'sci-fi' as const,
  image: undefined,
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
  status: { conditions: [] },
  portrait: {
    type: 'ai-generated' as const,
    url: '/visual-assets/portrait-fantasy.png',
    prompt: 'A courageous warrior',
    generatedAt: getTimestamp(),
  },
  createdAt: getTimestamp(),
  updatedAt: getTimestamp(),
};

export const mockCharacterB = {
  ...mockCharacterA,
  id: 'char-2',
  worldId: 'world-2',
  name: 'Vex',
  portrait: {
    type: 'ai-generated' as const,
    url: '/visual-assets/portrait-cyberpunk.png',
    prompt: 'A wary street operative',
    generatedAt: getTimestamp(),
  },
};

export type DashboardScenario =
  | 'active-session'
  | 'returning-no-session'
  | 'barely-started';

const mockDashboardState = (scenario: DashboardScenario) => {
  // Always bypass first-time onboarding so we render the dashboard,
  // not the GuidedFirstTimeExperience.
  const sharedSession = {
    isFirstTimeUser: () => false,
    shouldShowOnboarding: () => false,
    resumeSavedSession: () => true,
  };

  if (scenario === 'barely-started') {
    // The dashboard can't render in true-empty state — DashboardHome.tsx
    // routes purely-empty users to GuidedFirstTimeExperience regardless of
    // the shouldShowOnboarding flag. One world is the minimum that gets the
    // dashboard to render with a mostly-empty Getting Started checklist
    // (1/3 complete) and 1+2 empty world slots / 3 empty character slots.
    useWorldStore.setState({
      worlds: { [mockWorldA.id]: mockWorldA },
      entities: { [mockWorldA.id]: mockWorldA },
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
