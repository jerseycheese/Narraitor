import type { Meta, StoryObj } from '@storybook/react';
import { CharacterHeader } from './CharacterHeader';
// Use the store's Character type since it's more complete
import { useCharacterStore } from '@/state/characterStore';

type StoreCharacter = ReturnType<typeof useCharacterStore.getState>['characters'][string];
import { World } from '@/types/world.types';

const meta = {
  title: 'Narraitor/Character/Display/CharacterHeader',
  component: CharacterHeader,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CharacterHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data
const mockWorld: World = {
  id: 'world-1',
  name: 'Middle Earth',
  description: 'A fantasy world of magic and adventure',
  theme: 'Fantasy',
  relationship: 'set_in',
  reference: 'Lord of the Rings',
  attributes: [],
  skills: [],
  settings: {
    maxAttributes: 6,
    maxSkills: 10,
    attributePointPool: 27,
    skillPointPool: 15
  },
  createdAt: '2024-12-03T10:00:00Z',
  updatedAt: '2024-12-03T10:00:00Z',
};

const mockCharacter: StoreCharacter = {
  id: 'char-1',
  name: 'Aragorn',
  description: 'A noble ranger destined to become king',
  worldId: 'world-1',
  level: 15,
  attributes: [],
  skills: [],
  background: {
    history: 'Raised by elves in Rivendell, trained as a Ranger of the North.',
    personality: 'A noble ranger with a strong sense of duty and honor, destined to become king.',
    goals: ['Become king of Gondor'],
    fears: ['Failing his people'],
    physicalDescription: 'Tall, dark-haired ranger with weathered features',
    relationships: [],
    isKnownFigure: true,
  },
  isPlayer: true,
  status: {
    health: 100,
    maxHealth: 100,
    conditions: []
  },
  inventory: {
    characterId: 'char-1',
    items: [],
    capacity: 20,
    categories: []
  },
  portrait: {
    type: 'ai-generated',
    url: 'https://via.placeholder.com/200x200/4F46E5/FFFFFF?text=Aragorn',
    prompt: 'A noble ranger in dark clothing',
  },
  createdAt: '2024-12-03T10:00:00Z',
  updatedAt: '2024-12-03T10:00:00Z',
};

export const Default: Story = {
  args: {
    character: mockCharacter,
    world: mockWorld,
  },
};

export const WithoutPortrait: Story = {
  args: {
    character: {
      ...mockCharacter,
      portrait: undefined,
    },
    world: mockWorld,
  },
};

export const LowLevelCharacter: Story = {
  args: {
    character: {
      ...mockCharacter,
      name: 'Pippin',
      level: 1,
      background: {
        history: 'A young hobbit from the Shire who joined the Fellowship.',
        personality: 'A curious and brave hobbit with a love for adventure and second breakfast.',
        goals: ['Have adventures'],
        fears: ['Missing second breakfast'],
        physicalDescription: 'Young hobbit with curly hair',
        relationships: [],
        isKnownFigure: true,
      },
    },
    world: mockWorld,
  },
};

export const OriginalCharacter: Story = {
  args: {
    character: {
      ...mockCharacter,
      id: 'char-2',
      name: 'Lyra Moonwhisper',
      level: 8,
      background: {
        history: 'Born in the ancient forests, trained in the old ways of magic.',
        personality: 'A mysterious elven mage with a deep connection to nature and ancient magic.',
        goals: ['Master ancient magic'],
        fears: ['Loss of nature'],
        physicalDescription: 'Tall elf with flowing robes and mystical aura',
        relationships: [],
        isKnownFigure: false,
      },
      portrait: {
        type: 'ai-generated',
        url: 'https://via.placeholder.com/200x200/10B981/FFFFFF?text=Lyra',
        prompt: 'An elven mage with silver hair',
      },
    },
    world: {
      ...mockWorld,
      name: 'Aethermoor',
      description: 'A magical realm where the boundaries between worlds are thin',
    },
  },
};

export const HighLevelCharacter: Story = {
  args: {
    character: {
      ...mockCharacter,
      name: 'Gandalf the Grey',
      level: 50,
      background: {
        history: 'One of the Istari, sent to Middle-earth to oppose the growing power of darkness.',
        personality: 'A wise and powerful wizard who guides others on their journeys.',
        goals: ['Guide the free peoples', 'Defeat darkness'],
        fears: ['Failing his mission'],
        physicalDescription: 'An old wizard with a long grey beard and robes',
        relationships: [],
        isKnownFigure: true,
      },
      portrait: {
        type: 'ai-generated',
        url: 'https://via.placeholder.com/200x200/6B7280/FFFFFF?text=Gandalf',
        prompt: 'An old wizard with a long grey beard and pointed hat',
      },
    },
    world: mockWorld,
  },
};

export const NoPersonality: Story = {
  args: {
    character: {
      ...mockCharacter,
      name: 'Basic Character',
      background: {
        history: 'A simple character with minimal background.',
        personality: 'Basic personality.',
        goals: [],
        fears: [],
        relationships: [],
        isKnownFigure: false,
      },
    },
    world: mockWorld,
  },
};

export const LongPersonality: Story = {
  args: {
    character: {
      ...mockCharacter,
      name: 'Thorin Oakenshield',
      background: {
        history: 'Heir to the throne of Erebor, exiled when Smaug took the mountain.',
        personality: 'A proud and stubborn dwarf king with a deep sense of honor and loyalty to his people. Driven by a desire to reclaim his ancestral home and restore the glory of the Kingdom under the Mountain. Can be both noble and petty, brave and reckless, wise and foolish. His pride often leads him into conflict, but his heart is ultimately in the right place.',
        goals: ['Reclaim Erebor'],
        fears: ['Failing his people'],
        physicalDescription: 'Proud dwarf king with royal bearing and warrior\'s build',
        relationships: [],
        isKnownFigure: true,
      },
    },
    world: mockWorld,
  },
};

export const SciFiCharacter: Story = {
  args: {
    character: {
      ...mockCharacter,
      name: 'Commander Nova',
      level: 25,
      background: {
        history: 'Former military officer turned space explorer.',
        personality: 'A tactical genius with cybernetic enhancements and unwavering determination.',
        goals: ['Explore the galaxy'],
        fears: ['System failures'],
        physicalDescription: 'Cybernetically enhanced human with tactical gear',
        relationships: [],
        isKnownFigure: false,
      },
      portrait: {
        type: 'ai-generated',
        url: 'https://via.placeholder.com/200x200/3B82F6/FFFFFF?text=Nova',
        prompt: 'A futuristic commander with cybernetic implants',
      },
    },
    world: {
      ...mockWorld,
      name: 'New Terra',
      description: 'A futuristic colony on a distant planet',
      theme: 'Sci-Fi',
    },
  },
};

export const RecentlyCreated: Story = {
  args: {
    character: {
      ...mockCharacter,
      name: 'New Character',
      level: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    world: mockWorld,
  },
};
