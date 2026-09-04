import type { Meta, StoryObj } from '@storybook/react';
import { World } from '@/types/world.types';
import type { StoreCharacter } from '@/state/characterStore';
import WorldCard from '@/components/WorldCard/WorldCard';
import React from 'react';
// Mock character data
const mockCharacters: StoreCharacter[] = [
  {
    id: 'char1',
    name: 'Eldara the Wise',
    description: 'A powerful wizard with centuries of knowledge',
    worldId: '1',
    level: 15,
    attributes: [],
    skills: [],
    derivedStats: [],
    background: {
      history: 'A master of arcane arts',
      personality: 'Wise and patient',
      goals: ['Protect the realm'],
      fears: ['The return of darkness'],
      relationships: [],
    },
    isPlayer: false,
    status: { conditions: [] },
    inventory: {
      characterId: 'char1',
      items: [],
      capacity: 20,
      categories: [],
      itemOrder: [],
    },
    portrait: {
      type: 'ai-generated',
      url: 'https://picsum.photos/64/64?random=201',
      generatedAt: '2023-01-01T10:00:00Z',
      prompt: 'Wise elderly wizard with flowing robes',
    },
    createdAt: '2023-01-01T10:00:00Z',
    updatedAt: '2023-01-01T10:00:00Z',
  },
  {
    id: 'char2',
    name: 'Sir Marcus the Bold',
    description: 'A brave knight and defender of justice',
    worldId: '1',
    level: 12,
    attributes: [],
    skills: [],
    derivedStats: [],
    background: {
      history: 'Champion of the royal guard',
      personality: 'Courageous and noble',
      goals: ['Uphold justice'],
      fears: ['Failing those he protects'],
      relationships: [],
    },
    isPlayer: true,
    status: { conditions: [] },
    inventory: {
      characterId: 'char2',
      items: [],
      capacity: 15,
      categories: [],
      itemOrder: [],
    },
    portrait: {
      type: 'ai-generated',
      url: 'https://picsum.photos/64/64?random=202',
      generatedAt: '2023-01-02T10:00:00Z',
      prompt: 'Noble knight in shining armor',
    },
    createdAt: '2023-01-02T10:00:00Z',
    updatedAt: '2023-01-02T10:00:00Z',
  },
  {
    id: 'char3',
    name: 'Luna Shadowstep',
    description: 'A mysterious rogue with unmatched stealth skills',
    worldId: '1',
    level: 10,
    attributes: [],
    skills: [],
    derivedStats: [],
    background: {
      history: 'Former thief turned hero',
      personality: 'Cunning and independent',
      goals: ['Uncover ancient secrets'],
      fears: ['Being trapped or confined'],
      relationships: [],
    },
    isPlayer: false,
    status: { conditions: [] },
    inventory: {
      characterId: 'char3',
      items: [],
      capacity: 25,
      categories: [],
      itemOrder: [],
    },
    // No portrait - will show initials fallback
    createdAt: '2023-01-03T10:00:00Z',
    updatedAt: '2023-01-03T10:00:00Z',
  },
];
// Mock world data
const mockWorld: World = {
  id: '1',
  name: 'Mystical Realms of Avaloria',
  description:
    'An epic fantasy world filled with magic, dragons, and ancient prophecies. Heroes must band together to face the rising darkness.',
  genre: 'fantasy',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 10,
    maxSkills: 10,
    attributePointPool: 100,
    skillPointPool: 100,
  },
  image: {
    type: 'ai-generated',
    url: 'https://picsum.photos/800/400?random=100',
    generatedAt: '2023-01-01T10:00:00Z',
    prompt:
      'A mystical fantasy landscape with floating islands and magical forests',
  },
  createdAt: '2023-01-01T10:00:00Z',
  updatedAt: '2023-12-15T14:30:00Z',
};
const meta: Meta<typeof WorldCard> = {
  title: '03-Organisms/world/display/WorldCard',
  component: WorldCard,
  render: (args) => <WorldCard {...args} />,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'Displays a world card with details and actions (Play, Edit, Delete)',
      },
    },
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
    characters: mockCharacters,
    onSelect: (id: string) => console.log(`Selected world: ${id}`),
    onDelete: (id: string) => console.log(`Delete world: ${id}`),
  },
};
// Story showing active world state
export const ActiveWorld: Story = {
  args: {
    world: mockWorld,
    isActive: true,
    characters: mockCharacters,
    onSelect: (id: string) => console.log(`Selected world: ${id}`),
    onDelete: (id: string) => console.log(`Delete world: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story:
          'A WorldCard in its active state with green header and character list',
      },
    },
  },
};
// Story with no image layout
export const NoImage: Story = {
  args: {
    world: {
      ...mockWorld,
      image: undefined,
    },
    characters: mockCharacters,
    onSelect: (id: string) => console.log(`Selected world: ${id}`),
    onDelete: (id: string) => console.log(`Delete world: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'A WorldCard without an image showing alternative layout',
      },
    },
  },
};
// Story showing "Set In" world type
export const SetInWorld: Story = {
  args: {
    world: {
      ...mockWorld,
      name: 'Middle-earth Adventure',
      description:
        "Journey through the Shire, visit Rivendell, and brave the paths to Mordor in this epic quest through Tolkien's beloved world.",
      genre: 'fantasy',
      reference: 'Lord of the Rings',
      relationship: 'set_within',
    },
    characters: mockCharacters.slice(0, 2),
    onSelect: (id: string) => console.log(`Selected world: ${id}`),
    onDelete: (id: string) => console.log(`Delete world: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story:
          'A WorldCard showing a world set within the Lord of the Rings universe with purple "Set in" badge',
      },
    },
  },
};
// Story showing "Inspired By" world type
export const InspiredByWorld: Story = {
  args: {
    world: {
      ...mockWorld,
      name: 'Chrome Shadows',
      description:
        'A neon-soaked metropolis where corporate espionage and street-level hackers clash in a world inspired by classic cyberpunk themes.',
      reference: 'Blade Runner',
      relationship: 'inspired_by',
    },
    characters: mockCharacters.slice(0, 2),
    onSelect: (id: string) => console.log(`Selected world: ${id}`),
    onDelete: (id: string) => console.log(`Delete world: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story:
          'A WorldCard showing a world inspired by another universe with "Inspired by" badge',
      },
    },
  },
};
// Story with no characters
export const NoCharacters: Story = {
  args: {
    world: mockWorld,
    characters: [],
    onSelect: (id: string) => console.log(`Selected world: ${id}`),
    onDelete: (id: string) => console.log(`Delete world: ${id}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'A WorldCard with no characters',
      },
    },
  },
};
