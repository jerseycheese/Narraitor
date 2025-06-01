import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import WorldListScreen from './WorldListScreen';
import { worldStore } from '../../state/worldStore';
import { World } from '../../types/world.types';

// Mock worlds data
const mockWorlds: World[] = [
  {
    id: '1',
    name: 'Fantasy Realm',
    description: 'A magical world full of wonder',
    theme: 'Fantasy',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 100,
      skillPointPool: 100,
    },
    createdAt: '2023-01-01T10:00:00Z',
    updatedAt: '2023-01-01T10:00:00Z',
  },
  {
    id: '2',
    name: 'Sci-Fi Universe',
    description: 'A futuristic world of technology',
    theme: 'Cyberpunk',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 100,
      skillPointPool: 100,
    },
    createdAt: '2023-01-02T10:00:00Z',
    updatedAt: '2023-01-02T10:00:00Z',
  },
  {
    id: '3',
    name: 'Wild West',
    description: 'A lawless frontier',
    theme: 'Western',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 10,
      maxSkills: 10,
      attributePointPool: 100,
      skillPointPool: 100,
    },
    createdAt: '2023-01-03T10:00:00Z',
    updatedAt: '2023-01-03T10:00:00Z',
  },
];

const meta: Meta<typeof WorldListScreen> = {
  title: 'Narraitor/World/Display/WorldListScreen',
  component: WorldListScreen,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => {
      // Clear the store before each story
      worldStore.setState({ 
        worlds: {}, 
        currentWorldId: null,
        loading: false,
        error: null
      });
      return <Story />;
    },
  ],
  args: {
    _router: {
      push: (url: string) => {
        console.log(`[Storybook] Navigating to: ${url}`);
        return Promise.resolve();
      }
    },
    _storeActions: {
      setCurrentWorld: (id: string) => {
        console.log(`[Storybook] Setting current world: ${id}`);
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof WorldListScreen>;

export const Default: Story = {
  decorators: [
    (Story) => {
      // Set up the store with mock worlds
      const worldsMap = mockWorlds.reduce((acc, world) => {
        acc[world.id] = world;
        return acc;
      }, {} as Record<string, World>);
      
      worldStore.setState({ worlds: worldsMap });
      return <Story />;
    },
  ],
};

export const Loading: Story = {
  decorators: [
    (Story) => {
      worldStore.setState({ loading: true });
      return <Story />;
    },
  ],
};

export const EmptyState: Story = {
  decorators: [
    (Story) => {
      worldStore.setState({ worlds: {}, loading: false });
      return <Story />;
    },
  ],
};

export const WithError: Story = {
  decorators: [
    (Story) => {
      worldStore.setState({ 
        worlds: {}, 
        loading: false,
        error: 'Failed to load worlds' 
      });
      return <Story />;
    },
  ],
};

export const SingleWorld: Story = {
  decorators: [
    (Story) => {
      worldStore.setState({ 
        worlds: { '1': mockWorlds[0] },
        loading: false 
      });
      return <Story />;
    },
  ],
};

export const ManyWorlds: Story = {
  decorators: [
    (Story) => {
      const manyWorlds = [
        ...mockWorlds,
        {
          id: '4',
          name: 'Post-Apocalyptic Wasteland',
          description: 'A world after the fall',
          theme: 'Post-Apocalyptic',
          attributes: [],
          skills: [],
          settings: {
            maxAttributes: 10,
            maxSkills: 10,
            attributePointPool: 100,
            skillPointPool: 100,
          },
          createdAt: '2023-02-01T10:00:00Z',
          updatedAt: '2023-02-01T10:00:00Z',
        },
        {
          id: '5',
          name: 'Medieval Fantasy',
          description: 'Knights and dragons',
          theme: 'Medieval',
          attributes: [],
          skills: [],
          settings: {
            maxAttributes: 10,
            maxSkills: 10,
            attributePointPool: 100,
            skillPointPool: 100,
          },
          createdAt: '2023-02-02T10:00:00Z',
          updatedAt: '2023-02-02T10:00:00Z',
        },
      ];
      
      const worldsMap = manyWorlds.reduce((acc, world) => {
        acc[world.id] = world;
        return acc;
      }, {} as Record<string, World>);
      
      worldStore.setState({ worlds: worldsMap });
      return <Story />;
    },
  ],
};