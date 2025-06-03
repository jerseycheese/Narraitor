import type { Meta, StoryObj } from '@storybook/react';
import { CharacterHeader } from './CharacterHeader';
import { Character } from '@/types/character.types';
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
  relationship: 'set_in_existing_world',
  worldReference: 'Lord of the Rings',
  attributes: [],
  skills: [],
  createdAt: '2024-12-03T10:00:00Z',
  updatedAt: '2024-12-03T10:00:00Z',
};

const mockCharacter: Character = {
  id: 'char-1',
  name: 'Aragorn',
  worldId: 'world-1',
  level: 15,
  attributes: {},
  skills: {},
  background: {
    personality: 'A noble ranger with a strong sense of duty and honor, destined to become king.',
    backstory: 'Raised by elves in Rivendell, trained as a Ranger of the North.',
    isKnownFigure: true,
  },
  portrait: {
    type: 'ai_generated',
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
        personality: 'A curious and brave hobbit with a love for adventure and second breakfast.',
        backstory: 'A young hobbit from the Shire who joined the Fellowship.',
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
        personality: 'A mysterious elven mage with a deep connection to nature and ancient magic.',
        backstory: 'Born in the ancient forests, trained in the old ways of magic.',
        isKnownFigure: false,
      },
      portrait: {
        type: 'ai_generated',
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
        personality: 'A wise and powerful wizard who guides others on their journeys.',
        backstory: 'One of the Istari, sent to Middle-earth to oppose the growing power of darkness.',
        isKnownFigure: true,
      },
      portrait: {
        type: 'ai_generated',
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
        backstory: 'A simple character with minimal background.',
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
        personality: 'A proud and stubborn dwarf king with a deep sense of honor and loyalty to his people. Driven by a desire to reclaim his ancestral home and restore the glory of the Kingdom under the Mountain. Can be both noble and petty, brave and reckless, wise and foolish. His pride often leads him into conflict, but his heart is ultimately in the right place.',
        backstory: 'Heir to the throne of Erebor, exiled when Smaug took the mountain.',
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
        personality: 'A tactical genius with cybernetic enhancements and unwavering determination.',
        backstory: 'Former military officer turned space explorer.',
        isKnownFigure: false,
      },
      portrait: {
        type: 'ai_generated',
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