import React from 'react';
import { useRouter } from 'next/navigation';
import { World } from '../../types/world.types';
import WorldCardActions from '../WorldCardActions/WorldCardActions';
import { worldStore } from '../../state/worldStore';

// Define props interface with optional testing props
interface WorldCardProps {
  world: World;
  onSelect: (worldId: string) => void;
  onDelete: (worldId: string) => void;
  // Optional testing props
  _storeActions?: {
    setCurrentWorld: (id: string) => void;
  };
  _router?: {
    push: (url: string) => void;
  };
}

const WorldCard: React.FC<WorldCardProps> = ({ 
  world, 
  onSelect, 
  onDelete,
  // Use optional testing props with defaults
  _storeActions,
  _router
}) => {
  // Always call useRouter at the top level
  const router = useRouter();
  
  // Use provided router or real router
  const actualRouter = _router || router;

  const handleCardClick = () => {
    onSelect(world.id);
  };

  const handleDeleteClick = () => {
    onDelete(world.id);
  };

  const handlePlayClick = () => {
    try {
      // Use provided store actions or real store
      const storeActions = _storeActions || worldStore.getState();
      
      // Set current world in store
      storeActions.setCurrentWorld(world.id);
      
      // Navigate to game session page
      actualRouter.push(`/world/${world.id}/play`);
    } catch (exception) {
      console.error('Error in handlePlayClick:', exception);
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
      <WorldCardActions onPlay={handlePlayClick} onEdit={() => { /* TODO: Implement Edit action */ }} onDelete={handleDeleteClick} />
    </div>
  );
};

export default WorldCard;