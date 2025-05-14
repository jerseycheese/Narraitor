import React from 'react';
import { World } from '../../types/world.types';
import WorldCard from '../WorldCard/WorldCard';

interface WorldListProps {
  worlds: World[];
  onSelectWorld: (worldId: string) => void;
  onDeleteWorld: (worldId: string) => void;
}

const WorldList: React.FC<WorldListProps> = ({ worlds, onSelectWorld, onDeleteWorld }) => {
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
        <WorldCard
          key={world.id}
          world={world}
          onSelect={onSelectWorld}
          onDelete={onDeleteWorld}
        />
      ))}
    </div>
  );
};

export default WorldList;