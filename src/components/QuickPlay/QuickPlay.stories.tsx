import type { Meta, StoryObj } from '@storybook/react';
import { QuickPlay } from './QuickPlay';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
import { sessionStore } from '@/state/sessionStore';

const meta: Meta<typeof QuickPlay> = {
  title: 'Narraitor/Navigation/QuickPlay',
  component: QuickPlay,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Quick Play component that allows users to continue their last game or start a new adventure.',
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-2xl mx-auto p-8 bg-gray-50">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data for stories
const mockWorld = {
  id: 'world-1',
  name: 'The Enchanted Realm',
  description: 'A magical world filled with wonder',
  theme: 'fantasy' as const,
  attributes: [],
  skills: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockCharacter = {
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

const mockSavedSession = {
  id: 'session-1',
  worldId: 'world-1',
  characterId: 'char-1',
  lastPlayed: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  narrativeCount: 12,
};

export const NoSavedSessions: Story = {
  name: 'No Saved Sessions',
  decorators: [
    (Story) => {
      // Mock empty state
      worldStore.setState({ worlds: {}, currentWorldId: null });
      characterStore.setState({ characters: {} });
      sessionStore.setState({ savedSessions: {} });
      
      return <Story />;
    },
  ],
};

export const WithSavedSession: Story = {
  name: 'With Saved Session',
  decorators: [
    (Story) => {
      // Mock state with saved session
      worldStore.setState({ 
        worlds: { [mockWorld.id]: mockWorld },
        currentWorldId: null 
      });
      characterStore.setState({ 
        characters: { [mockCharacter.id]: mockCharacter }
      });
      sessionStore.setState({ 
        savedSessions: { [mockSavedSession.id]: mockSavedSession }
      });
      
      return <Story />;
    },
  ],
};

export const RecentSession: Story = {
  name: 'Recent Session (5 minutes ago)',
  decorators: [
    (Story) => {
      const recentSession = {
        ...mockSavedSession,
        lastPlayed: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
        narrativeCount: 25,
      };
      
      worldStore.setState({ 
        worlds: { [mockWorld.id]: mockWorld },
        currentWorldId: null 
      });
      characterStore.setState({ 
        characters: { [mockCharacter.id]: mockCharacter }
      });
      sessionStore.setState({ 
        savedSessions: { [recentSession.id]: recentSession }
      });
      
      return <Story />;
    },
  ],
};

export const LongProgressSession: Story = {
  name: 'Long Progress Session',
  decorators: [
    (Story) => {
      const longSession = {
        ...mockSavedSession,
        lastPlayed: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        narrativeCount: 147,
      };
      
      worldStore.setState({ 
        worlds: { [mockWorld.id]: mockWorld },
        currentWorldId: null 
      });
      characterStore.setState({ 
        characters: { [mockCharacter.id]: mockCharacter }
      });
      sessionStore.setState({ 
        savedSessions: { [longSession.id]: longSession }
      });
      
      return <Story />;
    },
  ],
};

export const MultipleSessions: Story = {
  name: 'Multiple Sessions (Shows Most Recent)',
  decorators: [
    (Story) => {
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
        lastPlayed: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        narrativeCount: 8,
      };
      
      const recentSession = {
        ...mockSavedSession,
        lastPlayed: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
      };
      
      worldStore.setState({ 
        worlds: { 
          [mockWorld.id]: mockWorld,
          [olderWorld.id]: olderWorld,
        },
        currentWorldId: null 
      });
      characterStore.setState({ 
        characters: { 
          [mockCharacter.id]: mockCharacter,
          [olderCharacter.id]: olderCharacter,
        }
      });
      sessionStore.setState({ 
        savedSessions: { 
          [recentSession.id]: recentSession,
          [olderSession.id]: olderSession,
        }
      });
      
      return <Story />;
    },
  ],
};