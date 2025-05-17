import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { World } from '../../types/world.types';

// Create mock components
const MockWorldCard = ({
  world,
  onSelect,
  onDelete,
  onPlay
}: {
  world: World;
  onSelect: (worldId: string) => void;
  onDelete: (worldId: string) => void;
  onPlay?: (worldId: string) => void;
}) => {
  return (
    <div 
      data-testid="world-card"
      onClick={() => onSelect(world.id)}
      className="card p-4 m-4 cursor-pointer"
      style={{ borderRadius: 'var(--radius-md)' }}
    >
      <div>
        <h3 className="text-xl font-bold mb-2">{world.name}</h3>
        <p className="mb-2">{world.description}</p>
        <p className="text-sm" style={{ color: 'var(--color-secondary)' }}>Theme: {world.theme}</p>
      </div>
      <div className="mt-4 flex justify-between">
        <div className="text-xs" style={{ color: 'var(--color-muted)' }}>
          <span>Created: {new Date(world.createdAt).toLocaleDateString()}</span>
          <span className="ml-2">Updated: {new Date(world.updatedAt).toLocaleDateString()}</span>
        </div>
        <div>
          <button 
            onClick={(e) => { 
              e.stopPropagation(); 
              if (onPlay) onPlay(world.id);
              else console.log('Play clicked');
            }}
            data-testid="world-card-actions-play-button"
            className="btn btn-primary mx-1"
          >Play</button>
          <button 
            onClick={(e) => { e.stopPropagation(); console.log('Edit clicked') }}
            className="btn btn-secondary mx-1"
          >Edit</button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(world.id) }}
            className="btn btn-accent mx-1"
          >Delete</button>
        </div>
      </div>
    </div>
  );
};

// Mock WorldList component for Storybook
const MockWorldList = ({ 
  worlds,
  onSelectWorld,
  onDeleteWorld,
  onPlayWorld
}: { 
  worlds: World[]; 
  onSelectWorld: (worldId: string) => void;
  onDeleteWorld: (worldId: string) => void;
  onPlayWorld?: (worldId: string) => void;
}) => {
  if (worlds.length === 0) {
    return (
      <div className="p-8 text-center rounded-lg" 
        style={{ 
          backgroundColor: 'var(--color-background)', 
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)'
        }}>
        <h2 className="text-2xl font-semibold mb-3" style={{ color: 'var(--color-muted)' }}>No Worlds Available</h2>
        <p style={{ color: 'var(--color-muted)' }}>No worlds created yet. Create your first world to get started.</p>
      </div>
    );
  }

  return (
    <div data-testid="world-list-container" className="mt-6">
      <h2 className="text-2xl font-bold mb-4 pl-4" style={{ color: 'var(--color-foreground)' }}>Your Worlds</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {worlds.map((world) => (
          <MockWorldCard
            key={world.id}
            world={world}
            onSelect={onSelectWorld}
            onDelete={onDeleteWorld}
            onPlay={onPlayWorld}
          />
        ))}
      </div>
    </div>
  );
};

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
    theme: 'Sci-Fi',
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
];

const meta = {
  title: 'Narraitor/World/WorldList',
  component: MockWorldList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'List of world cards for displaying and managing worlds'
      }
    }
  },
  tags: ['autodocs'],
} satisfies Meta<typeof MockWorldList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    worlds: mockWorlds,
    onSelectWorld: (worldId) => console.log(`Selected world: ${worldId}`),
    onDeleteWorld: (worldId) => console.log(`Delete world: ${worldId}`),
    onPlayWorld: (worldId) => console.log(`Play world: ${worldId}`),
  },
};

export const Empty: Story = {
  args: {
    worlds: [],
    onSelectWorld: (worldId) => console.log(`Selected world: ${worldId}`),
    onDeleteWorld: (worldId) => console.log(`Delete world: ${worldId}`),
  },
};