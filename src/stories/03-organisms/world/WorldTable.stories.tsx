import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import { WorldTable } from '@/components/world/WorldTable';
import { useCharacterStore } from '@/state/characterStore';
import type { World } from '@/types/world.types';
import { EntityID } from '@/types/common.types';

const meta = {
  title: '03-Organisms/world/WorldTable',
  component: WorldTable,
  parameters: {
    layout: 'padded',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof WorldTable>;

export default meta;
type Story = StoryObj<typeof meta>;

// Mock data
const mockWorlds: World[] = [
  {
    id: 'world-1',
    name: 'Eldoria',
    description: 'A high fantasy world of magic and dragons.',
    genre: 'fantasy',
    createdAt: '2023-01-15T10:00:00Z',
    updatedAt: '2023-01-20T14:30:00Z',
    attributes: [
      { id: 'attr-1', worldId: 'world-1', name: 'Strength', description: '', baseValue: 10, minValue: 1, maxValue: 20 },
      { id: 'attr-2', worldId: 'world-1', name: 'Magic', description: '', baseValue: 10, minValue: 1, maxValue: 20 },
    ],
    skills: [
      { id: 'skill-1', worldId: 'world-1', name: 'Fireball', description: '', difficulty: 'medium', baseValue: 1, minValue: 1, maxValue: 10 },
      { id: 'skill-2', worldId: 'world-1', name: 'Swordplay', description: '', difficulty: 'medium', baseValue: 1, minValue: 1, maxValue: 10 },
      { id: 'skill-3', worldId: 'world-1', name: 'Stealth', description: '', difficulty: 'medium', baseValue: 1, minValue: 1, maxValue: 10 },
    ],
    settings: {
      maxAttributes: 5,
      maxSkills: 10,
      attributePointPool: 20,
      skillPointPool: 15,
    },
  },
  {
    id: 'world-2',
    name: 'Neon City',
    description: 'A cyberpunk dystopia ruled by corporations.',
    genre: 'sci-fi',
    createdAt: '2023-02-10T09:15:00Z',
    updatedAt: '2023-02-10T09:15:00Z',
    attributes: [
      { id: 'attr-3', worldId: 'world-2', name: 'Tech', description: '', baseValue: 5, minValue: 1, maxValue: 10 },
    ],
    skills: [
      { id: 'skill-4', worldId: 'world-2', name: 'Hacking', description: '', difficulty: 'hard', baseValue: 1, minValue: 1, maxValue: 10 },
    ],
    settings: {
      maxAttributes: 3,
      maxSkills: 5,
      attributePointPool: 10,
      skillPointPool: 10,
    },
  },
  {
    id: 'world-3',
    name: 'Silent Hillish',
    description: 'A horror world shrouded in mist.',
    genre: 'horror',
    createdAt: '2023-03-05T22:00:00Z',
    updatedAt: '2023-03-06T08:00:00Z',
    attributes: [],
    skills: [],
    settings: {
      maxAttributes: 3,
      maxSkills: 5,
      attributePointPool: 10,
      skillPointPool: 10,
    },
  },
];

const MockStoreDecorator = (StoryComponent: React.ComponentType) => {
  // We need to inject state into the store for the component to read
  React.useEffect(() => {
    // Access the internal store API to set state directly for testing
    // This is a bit of a hack but necessary since we can't easily mock the hook return value
    // in this environment without a more complex setup
    useCharacterStore.setState({
      worldCharacterIds: {
        'world-1': ['char-1', 'char-2', 'char-3'],
        'world-2': ['char-4'],
        'world-3': [],
      }
    });
  }, []);

  return <StoryComponent />;
};

export const Default: Story = {
  args: {
    worlds: mockWorlds,
    selectedWorldIds: [],
    onToggleSelect: () => {},
    onDeleteWorld: () => {},
  },
  decorators: [MockStoreDecorator],
};

export const WithSelection: Story = {
  args: {
    worlds: mockWorlds,
    selectedWorldIds: ['world-1', 'world-3'],
    onToggleSelect: () => {},
    onDeleteWorld: () => {},
  },
  decorators: [MockStoreDecorator],
};

// Create a proper React component for the interactive story
const InteractiveWorldTable = () => {
  const [selectedIds, setSelectedIds] = useState<EntityID[]>([]);

  const handleToggle = (id: EntityID) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(p => p !== id)
        : prev.length < 5 ? [...prev, id] : prev
    );
  };

  return (
    <WorldTable
      worlds={mockWorlds}
      selectedWorldIds={selectedIds}
      onToggleSelect={handleToggle}
      onDeleteWorld={() => console.log('Delete clicked')}
    />
  );
};

export const Interactive: Story = {
  args: {
    worlds: mockWorlds,
    selectedWorldIds: [],
    onToggleSelect: () => {},
    onDeleteWorld: () => {},
  },
  render: () => <InteractiveWorldTable />,
  decorators: [MockStoreDecorator],
};

export const Empty: Story = {
  args: {
    worlds: [],
    selectedWorldIds: [],
    onToggleSelect: () => {},
    onDeleteWorld: () => {},
  },
  decorators: [MockStoreDecorator],
};
