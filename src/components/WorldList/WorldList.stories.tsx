import type { Meta, StoryObj } from '@storybook/react';
import { World } from '../../types/world.types';
import WorldList from './WorldList';

// Mock world data for stories
const mockWorlds: World[] = [
  {
    id: '1',
    name: 'Fantasy Realm',
    description: 'A magical world full of wonder and dangerous quests',
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
    name: 'Cyberpunk 2185',
    description: 'A neon-lit dystopia where corporations rule and hackers fight back',
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
    name: 'Wild West Adventures',
    description: 'Lawless frontiers where gunslinging and frontier justice reign',
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
    updatedAt: '2023-01-04T14:30:00Z',
  },
];

const meta: Meta<typeof WorldList> = {
  title: 'Narraitor/World/WorldList',
  component: WorldList,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
  argTypes: {
    onSelectWorld: { action: 'selected' },
    onDeleteWorld: { action: 'deleted' },
  },
  args: {
    onSelectWorld: (worldId: string) => {
      console.log(`[Storybook] World selected: ${worldId}`);
    },
    onDeleteWorld: (worldId: string) => {
      console.log(`[Storybook] World deleted: ${worldId}`);
    },
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
type Story = StoryObj<typeof WorldList>;

export const Default: Story = {
  args: {
    worlds: mockWorlds,
  },
};

export const SingleWorld: Story = {
  args: {
    worlds: [mockWorlds[0]],
  },
};

export const EmptyList: Story = {
  args: {
    worlds: [],
  },
};

export const ManyWorlds: Story = {
  args: {
    worlds: [
      ...mockWorlds,
      {
        id: '4',
        name: 'Post-Apocalyptic Wasteland',
        description: 'A harsh world after the fall of civilization',
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
        name: 'Medieval Kingdom',
        description: 'Knights, castles, and political intrigue',
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
    ],
  },
};