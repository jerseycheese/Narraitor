import type { Meta, StoryObj } from '@storybook/react';
import { CharacterCard } from '@/components/CharacterCard/CharacterCard';
// Use the store's Character type since it's more complete
import { useCharacterStore } from '@/state/characterStore';

type StoreCharacter = ReturnType<
  typeof useCharacterStore.getState
>['characters'][string];

const meta = {
  title: '03-Organisms/character/display/CharacterCard',
  component: CharacterCard,
  parameters: {
    layout: 'centered',
    nextjs: {
      appDirectory: true,
    },
    docs: {
      description: {
        component:
          'A card component for displaying character information with action buttons.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isActive: {
      control: 'boolean',
      description: 'Whether this character is currently active',
    },
    onMakeActive: { action: 'makeActive' },
    onView: { action: 'view' },
    onPlay: { action: 'play' },
    onEdit: { action: 'edit' },
    onDelete: { action: 'delete' },
  },
} satisfies Meta<typeof CharacterCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock character data
const mockCharacter: StoreCharacter = {
  id: 'char-1',
  name: 'Aragorn',
  description: 'A noble ranger destined to become king',
  worldId: 'world-1',
  level: 15,
  attributes: [],
  skills: [],
  derivedStats: [],
  background: {
    history: 'Raised by elves in Rivendell, trained as a Ranger of the North.',
    personality:
      'A noble ranger with a strong sense of duty and honor, destined to become king.',
    goals: ['Reclaim the throne of Gondor'],
    fears: ['Failing his people'],
    physicalDescription: 'Tall, dark-haired ranger with weathered features',
    relationships: [],
    isKnownFigure: true,
  },
  portrait: {
    type: 'ai-generated',
    url: 'https://i.pravatar.cc/200?img=1',
    prompt: 'A noble ranger with weathered features and kind eyes',
  },
  isPlayer: true,
  status: {
    conditions: [],
  },
  inventory: {
    characterId: 'char-1',
    items: [],
    capacity: 20,
    categories: [],
    itemOrder: [],
  },
  createdAt: '2024-12-03T10:00:00Z',
  updatedAt: '2024-12-03T10:00:00Z',
};

export const Default: Story = {
  args: {
    character: mockCharacter,
    isActive: false,
    onMakeActive: () => console.log('Make active clicked'),
    onView: () => console.log('View clicked'),
    onPlay: () => console.log('Play clicked'),
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
  },
};

export const ActiveCharacter: Story = {
  args: {
    character: mockCharacter,
    isActive: true,
    onMakeActive: () => console.log('Make active clicked'),
    onView: () => console.log('View clicked'),
    onPlay: () => console.log('Play clicked'),
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
  },
};

export const KnownFigure: Story = {
  args: {
    character: {
      ...mockCharacter,
      name: 'Gandalf the Grey',
      level: 50,
      background: {
        history:
          'One of the Istari, sent to Middle-earth to oppose the growing power of darkness.',
        personality:
          'A wise and powerful wizard who guides others on their journeys.',
        goals: ['Guide the free peoples', 'Defeat the dark lord'],
        fears: ['Failing in his mission'],
        physicalDescription: 'An old wizard with a long grey beard and robes',
        relationships: [],
        isKnownFigure: true,
      },
      portrait: {
        type: 'ai-generated',
        url: 'https://i.pravatar.cc/200?img=2',
        prompt: 'An old wizard with a long grey beard and wise eyes',
      },
    },
    isActive: false,
    onMakeActive: () => console.log('Make active clicked'),
    onView: () => console.log('View clicked'),
    onPlay: () => console.log('Play clicked'),
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
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
        history:
          'Born in the ancient forests, trained in the old ways of magic.',
        personality:
          'A mysterious elven mage with a deep connection to nature and ancient magic.',
        goals: ['Protect the ancient forests', 'Master the old magic'],
        fears: ['Loss of nature', 'Forgetting the old ways'],
        physicalDescription: 'Tall elf with flowing robes and mystical aura',
        relationships: [],
        isKnownFigure: false,
      },
      portrait: {
        type: 'ai-generated',
        url: 'https://i.pravatar.cc/200?img=3',
        prompt: 'An elven mage with flowing silver hair and mystical aura',
      },
    },
    isActive: false,
    onMakeActive: () => console.log('Make active clicked'),
    onView: () => console.log('View clicked'),
    onPlay: () => console.log('Play clicked'),
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
  },
};

export const WithoutPortrait: Story = {
  args: {
    character: {
      ...mockCharacter,
      name: 'Simple Character',
      portrait: undefined,
      background: {
        history: 'A simple background with minimal details.',
        personality: 'A character without a portrait.',
        goals: [],
        fears: [],
        relationships: [],
        isKnownFigure: false,
      },
    },
    isActive: false,
    onMakeActive: () => console.log('Make active clicked'),
    onView: () => console.log('View clicked'),
    onPlay: () => console.log('Play clicked'),
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
  },
};

export const Grid: Story = {
  args: {
    character: mockCharacter,
    isActive: false,
    onMakeActive: () => console.log('Make active clicked'),
    onView: () => console.log('View clicked'),
    onPlay: () => console.log('Play clicked'),
    onEdit: () => console.log('Edit clicked'),
    onDelete: () => console.log('Delete clicked'),
  },
  render: () => (
    <div>
      <CharacterCard
        character={{
          ...mockCharacter,
          name: 'Aragorn',
          background: {
            history: 'Heir of Isildur',
            personality: 'A noble ranger destined to become king.',
            goals: ['Become king'],
            fears: ['Failing'],
            relationships: [],
            isKnownFigure: true,
          },
        }}
        isActive={true}
        onMakeActive={() => console.log('Make Aragorn active')}
        onView={() => console.log('View Aragorn')}
        onPlay={() => console.log('Play Aragorn')}
        onEdit={() => console.log('Edit Aragorn')}
        onDelete={() => console.log('Delete Aragorn')}
      />
      <CharacterCard
        character={{
          ...mockCharacter,
          id: 'char-2',
          name: 'Frodo Baggins',
          level: 1,
          background: {
            history: 'Hobbit from the Shire',
            personality: 'A brave hobbit with unexpected courage.',
            goals: ['Destroy the'],
            fears: ['Corruption'],
            relationships: [],
            isKnownFigure: true,
          },
          portrait: {
            type: 'ai-generated',
            url: 'https://i.pravatar.cc/200?img=6',
            prompt: 'A young hobbit with kind eyes',
          },
        }}
        isActive={false}
        onMakeActive={() => console.log('Make Frodo active')}
        onView={() => console.log('View Frodo')}
        onPlay={() => console.log('Play Frodo')}
        onEdit={() => console.log('Edit Frodo')}
        onDelete={() => console.log('Delete Frodo')}
      />
      <CharacterCard
        character={{
          ...mockCharacter,
          id: 'char-3',
          name: 'Lyra Moonwhisper',
          level: 8,
          background: {
            history: 'Elven mage from ancient forests',
            personality: 'A mysterious elven mage.',
            goals: ['Master magic'],
            fears: ['Loss of nature'],
            relationships: [],
            isKnownFigure: false,
          },
          portrait: {
            type: 'ai-generated',
            url: 'https://i.pravatar.cc/200?img=7',
            prompt: 'An elven mage with mystical aura',
          },
        }}
        isActive={false}
        onMakeActive={() => console.log('Make Lyra active')}
        onView={() => console.log('View Lyra')}
        onPlay={() => console.log('Play Lyra')}
        onEdit={() => console.log('Edit Lyra')}
        onDelete={() => console.log('Delete Lyra')}
      />
    </div>
  ),
};
