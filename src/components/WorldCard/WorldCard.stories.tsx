import type { Meta, StoryObj } from '@storybook/react';
import { World } from '../../types/world.types';
import React from 'react';

// Create a completely standalone mock component for Storybook
// This avoids importing the real WorldCard component at all
const MockWorldCard = ({
  world,
  onSelect,
  onDelete
}: {
  world: World;
  onSelect: (worldId: string) => void;
  onDelete: (worldId: string) => void;
}) => {
  const handleCardClick = () => {
    onSelect(world.id);
  };

  const handleDeleteClick = () => {
    onDelete(world.id);
  };

  const handlePlayClick = () => {
    console.log(`[Storybook] Setting current world: ${world.id}`);
    console.log(`[Storybook] Navigating to: /world/${world.id}/play`);
  };

  return (
    <div
      data-testid="world-card"
      onClick={handleCardClick}
      className="card p-3 m-3 cursor-pointer"
      style={{ 
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      <h3 data-testid="world-card-name" className="text-lg font-semibold">{world.name}</h3>
      <p data-testid="world-card-description" className="mt-1">{world.description}</p>
      <p data-testid="world-card-theme" className="text-sm mt-1" style={{ color: 'var(--color-secondary)' }}>Theme: {world.theme}</p>
      <p data-testid="world-card-createdAt" className="text-xs mt-2" style={{ color: 'var(--color-muted)' }}>Created: {new Date(world.createdAt).toLocaleDateString()}</p>
      <p data-testid="world-card-updatedAt" className="text-xs" style={{ color: 'var(--color-muted)' }}>Updated: {new Date(world.updatedAt).toLocaleDateString()}</p>
      <div className="mt-3 flex gap-2">
        <button onClick={(e) => { e.stopPropagation(); handlePlayClick(); }} 
          data-testid="world-card-actions-play-button"
          className="btn btn-primary px-2 py-1 rounded text-sm">
          Play
        </button>
        <button onClick={(e) => { e.stopPropagation(); }} 
          data-testid="world-card-actions-edit-button"
          className="btn btn-secondary px-2 py-1 rounded text-sm">
          Edit
        </button>
        <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(); }} 
          data-testid="world-card-actions-delete-button"
          className="btn btn-accent px-2 py-1 rounded text-sm">
          Delete
        </button>
      </div>
    </div>
  );
};

// Mock world data
const mockWorld: World = {
  id: '1',
  name: 'Test World',
  description: 'This is a test world.',
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
};

const meta: Meta<typeof MockWorldCard> = {
  title: 'Narraitor/World/WorldCard',
  component: MockWorldCard,
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
type Story = StoryObj<typeof MockWorldCard>;

// Default story
export const Default: Story = {
  args: {
    world: mockWorld,
    onSelect: () => console.log(`Selected world: ${mockWorld.id}`),
    onDelete: () => console.log(`Delete world: ${mockWorld.id}`),
  },
};

// Story showing Play functionality
export const WithPlayAction: Story = {
  args: {
    world: mockWorld,
    onSelect: () => console.log(`Selected world: ${mockWorld.id}`),
    onDelete: () => console.log(`Delete world: ${mockWorld.id}`),
  },
  parameters: {
    docs: {
      description: {
        story: 'Demo of Play button functionality which should navigate to the game session page'
      }
    }
  },
};
