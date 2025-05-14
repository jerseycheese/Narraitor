import React from 'react';
import { World } from '../../types/world.types';
import WorldCardActions from '../WorldCardActions/WorldCardActions';

interface WorldCardProps {
  world: World;
  onSelect: (worldId: string) => void;
  onDelete: (worldId: string) => void;
}

const WorldCard: React.FC<WorldCardProps> = ({ world, onSelect, onDelete }) => {
  const handleCardClick = () => {
    onSelect(world.id);
  };

  const handleDeleteClick = () => {
    onDelete(world.id);
  };

  return (
    <div data-testid="world-card" onClick={handleCardClick}>
      <h3 data-testid="world-card-name">{world.name}</h3>
      <p data-testid="world-card-description">{world.description}</p>
      <p data-testid="world-card-theme">Theme: {world.theme}</p>
      <p data-testid="world-card-createdAt">Created: {new Date(world.createdAt).toLocaleDateString()}</p>
      <p data-testid="world-card-updatedAt">Updated: {new Date(world.updatedAt).toLocaleDateString()}</p>
      <WorldCardActions onPlay={() => { /* TODO: Implement Play action */ }} onEdit={() => { /* TODO: Implement Edit action */ }} onDelete={handleDeleteClick} />
    </div>
  );
};

export default WorldCard;