import type { Meta, StoryObj } from '@storybook/react';
import { CharacterCard } from './CharacterCard';
import { Character } from '@/types/character.types';

const meta = {
  title: 'Narraitor/Character/Cards/CharacterCard',
  component: CharacterCard,
  parameters: {
    layout: 'centered',
    nextjs: {
      appDirectory: true,
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
        personality: 'A wise and powerful wizard who guides others on their journeys.',
        backstory: 'One of the Istari, sent to Middle-earth to oppose the growing power of darkness.',
        isKnownFigure: true,
      },
      portrait: {
        type: 'ai_generated',
        url: 'https://via.placeholder.com/200x200/6B7280/FFFFFF?text=Gandalf',
        prompt: 'An old wizard with a long grey beard',
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
        personality: 'A character without a portrait.',
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

export const LowLevelCharacter: Story = {
  args: {
    character: {
      ...mockCharacter,
      name: 'Frodo Baggins',
      level: 1,
      background: {
        personality: 'A brave hobbit with a kind heart and unexpected courage.',
        backstory: 'A hobbit from the Shire who inherited a mysterious ring.',
        isKnownFigure: true,
      },
      portrait: {
        type: 'ai_generated',
        url: 'https://via.placeholder.com/150x150/F59E0B/FFFFFF?text=Frodo',
        prompt: 'A young hobbit with curly hair',
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

export const NoDescription: Story = {
  args: {
    character: {
      ...mockCharacter,
      name: 'Unnamed Character',
      background: {
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

export const LongDescription: Story = {
  args: {
    character: {
      ...mockCharacter,
      name: 'Thorin Oakenshield',
      background: {
        personality: 'A proud and stubborn dwarf king with a deep sense of honor and loyalty to his people. Driven by a desire to reclaim his ancestral home and restore the glory of the Kingdom under the Mountain. Can be both noble and petty, brave and reckless, wise and foolish. His pride often leads him into conflict, but his heart is ultimately in the right place when it comes to protecting those he loves.',
        backstory: 'Heir to the throne of Erebor, exiled when Smaug took the mountain.',
        isKnownFigure: true,
      },
      portrait: {
        type: 'ai_generated',
        url: 'https://via.placeholder.com/200x200/7C3AED/FFFFFF?text=Thorin',
        prompt: 'A dwarf king with a magnificent beard',
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
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4" style={{ width: '1200px' }}>
      <CharacterCard
        character={{
          ...mockCharacter,
          name: 'Aragorn',
          background: { personality: 'A noble ranger destined to become king.', isKnownFigure: true },
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
          background: { personality: 'A brave hobbit with unexpected courage.', isKnownFigure: true },
          portrait: {
            type: 'ai_generated',
            url: 'https://via.placeholder.com/150x150/F59E0B/FFFFFF?text=Frodo',
            prompt: 'A young hobbit',
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
          background: { personality: 'A mysterious elven mage.', isKnownFigure: false },
          portrait: {
            type: 'ai_generated',
            url: 'https://via.placeholder.com/200x200/10B981/FFFFFF?text=Lyra',
            prompt: 'An elven mage',
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