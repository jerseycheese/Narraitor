import React from 'react';
import { World } from '../../types/world.types';

// Import the mock World Card component used in Storybook stories
// but NOT the real WorldCard which uses the Next.js router

// First, we'll recreate a simplified version of the WorldCardActions
// to avoid bringing in dependencies
const MockWorldCardActions: React.FC<{
  onPlay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ onPlay, onEdit, onDelete }) => {
  return (
    <div>
      <button 
        onClick={(e) => { e.stopPropagation(); onPlay(); }} 
        data-testid="world-card-actions-play-button"
      >
        Play
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); onEdit(); }} 
        data-testid="world-card-actions-edit-button"
      >
        Edit
      </button>
      <button 
        onClick={(e) => { e.stopPropagation(); onDelete(); }} 
        data-testid="world-card-actions-delete-button"
      >
        Delete
      </button>
    </div>
  );
};

// Create a mock WorldCard component that doesn't use router
const MockWorldCard: React.FC<{
  world: World;
  onSelect: (worldId: string) => void;
  onDelete: (worldId: string) => void;
  onPlay?: (worldId: string) => void;
}> = ({ world, onSelect, onDelete, onPlay }) => {
  const handleCardClick = () => {
    onSelect(world.id);
  };

  const handleDeleteClick = () => {
    onDelete(world.id);
  };

  const handlePlayClick = () => {
    console.log(`[MockWorldCard] Play clicked for world: ${world.id}`);
    if (onPlay) {
      onPlay(world.id);
    } else {
      console.log(`[MockWorldCard] No onPlay handler provided`);
    }
  };

  return (
    <div
      data-testid="world-card"
      onClick={handleCardClick}
      style={{
        border: '1px solid #ccc',
        padding: '10px',
        margin: '10px',
        borderRadius: '5px',
        cursor: 'pointer',
      }}
    >
      <h3 data-testid="world-card-name">{world.name}</h3>
      <p data-testid="world-card-description">{world.description}</p>
      <p data-testid="world-card-theme">Theme: {world.theme}</p>
      <p data-testid="world-card-createdAt">Created: {new Date(world.createdAt).toLocaleDateString()}</p>
      <p data-testid="world-card-updatedAt">Updated: {new Date(world.updatedAt).toLocaleDateString()}</p>
      <MockWorldCardActions 
        onPlay={handlePlayClick} 
        onEdit={() => console.log(`[MockWorldCard] Edit clicked for world: ${world.id}`)} 
        onDelete={handleDeleteClick} 
      />
    </div>
  );
};

// Interface for MockWorldList props
interface MockWorldListProps {
  worlds: World[];
  onSelectWorld: (worldId: string) => void;
  onDeleteWorld: (worldId: string) => void;
  onPlayWorld?: (worldId: string) => void;
}

/**
 * Mock implementation of WorldList for Storybook
 * This version doesn't depend on Next.js router, making it safe for Storybook
 */
const MockWorldList: React.FC<MockWorldListProps> = ({ 
  worlds, 
  onSelectWorld, 
  onDeleteWorld,
  onPlayWorld
}) => {
  if (worlds.length === 0) {
    return (
      <div data-testid="world-list-empty-message">
        No worlds created yet.
      </div>
    );
  }

  return (
    <div data-testid="world-list-container">
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
  );
};

export default MockWorldList;