import React from 'react';
import { World } from '../../types/world.types';

interface MockWorldListProps {
  worlds: World[];
  onSelectWorld: (worldId: string) => void;
  onDeleteWorld: (worldId: string) => void;
  onPlayWorld?: (worldId: string) => void; // Add optional onPlayWorld
}

// Mock WorldCard component for Storybook
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
            data-testid="world-card-actions-delete-button"
            className="btn btn-accent mx-1"
          >Delete</button>
        </div>
      </div>
    </div>
  );
};

const MockWorldList: React.FC<MockWorldListProps> = ({ worlds, onSelectWorld, onDeleteWorld, onPlayWorld }) => {
  if (worlds.length === 0) {
    return (
      <div 
        data-testid="world-list-empty-message" 
        className="p-8 text-center rounded-lg" 
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

export default MockWorldList;