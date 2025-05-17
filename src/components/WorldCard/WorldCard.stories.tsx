import type { Meta, StoryObj } from '@storybook/react';
import { World } from '../../types/world.types';
import WorldCard from './WorldCard';
import React from 'react';

// Mock world data
const mockWorld: World = {
  id: '1',
  name: 'Mystical Realms of Avaloria',
  description: 'An epic fantasy world filled with magic, dragons, and ancient prophecies. Heroes must band together to face the rising darkness.',
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
  updatedAt: '2023-12-15T14:30:00Z',
};

const sciFiWorld: World = {
  id: '2',
  name: 'Neo Tokyo 2185',
  description: 'A cyberpunk dystopia where megacorporations rule and underground hackers fight for freedom in the digital realm.',
  theme: 'Cyberpunk',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 10,
    maxSkills: 10,
    attributePointPool: 100,
    skillPointPool: 100,
  },
  createdAt: '2023-06-15T08:00:00Z',
  updatedAt: '2023-06-15T08:00:00Z',
};

const westernWorld: World = {
  id: '3',
  name: 'Dustbowl County',
  description: 'The lawless frontier where outlaws roam and justice comes at the end of a six-shooter.',
  theme: 'Western',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 10,
    maxSkills: 10,
    attributePointPool: 100,
    skillPointPool: 100,
  },
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-12-01T16:45:00Z',
};

// Create a wrapper component that provides both router and store mocks
const WorldCardWrapper = (args: Parameters<typeof WorldCard>[0]) => {
  const mockRouter = {
    push: (url: string) => {
      console.log(`[Storybook] Navigating to: ${url}`);
      return Promise.resolve();
    }
  };

  const mockStoreActions = {
    setCurrentWorld: (id: string) => {
      console.log(`[Storybook] Setting current world: ${id}`);
    }
  };

  // Use the component's test props to inject mocks
  return (
    <WorldCard 
      {...args}
      _router={mockRouter}
      _storeActions={mockStoreActions}
    />
  );
};

const meta: Meta<typeof WorldCard> = {
  title: 'Narraitor/World/WorldCard',
  component: WorldCard,
  decorators: [
    (Story, context) => (
      <WorldCardWrapper {...context.args}>
        <Story />
      </WorldCardWrapper>
    ),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Displays a world card with details and actions (Play, Edit, Delete)'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    onSelect: { action: 'selected' },
    onDelete: { action: 'delete clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof WorldCard>;

// Default story
export const Default: Story = {
  args: {
    world: mockWorld,
    onSelect: (id: string) => console.log(`Selected world: ${id}`),
    onDelete: (id: string) => console.log(`Delete world: ${id}`),
  },
};

// Story with Cyberpunk theme
export const CyberpunkWorld: Story = {
  args: {
    world: sciFiWorld,
    onSelect: (id: string) => console.log(`Selected world: ${id}`),
    onDelete: (id: string) => console.log(`Delete world: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'A WorldCard displaying a cyberpunk-themed world'
      }
    }
  },
};

// Story with Western theme
export const WesternWorld: Story = {
  args: {
    world: westernWorld,
    onSelect: (id: string) => console.log(`Selected world: ${id}`),
    onDelete: (id: string) => console.log(`Delete world: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'A WorldCard displaying a western-themed world'
      }
    }
  },
};

// Story with recently updated world
export const RecentlyUpdated: Story = {
  args: {
    world: {
      ...mockWorld,
      updatedAt: new Date().toISOString(),
    },
    onSelect: (id: string) => console.log(`Selected world: ${id}`),
    onDelete: (id: string) => console.log(`Delete world: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'A WorldCard showing a world that was recently updated'
      }
    }
  },
};

// Story with empty description
export const MinimalContent: Story = {
  args: {
    world: {
      ...mockWorld,
      name: 'Minimal World',
      description: '',
      theme: '',
    },
    onSelect: () => console.log('Selected minimal world'),
    onDelete: () => console.log('Delete minimal world'),
  },
  parameters: {
    docs: {
      description: {
        story: 'A WorldCard with minimal content to test edge cases'
      }
    }
  },
};