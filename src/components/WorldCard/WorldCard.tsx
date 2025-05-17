import React from 'react';
import { useRouter } from 'next/navigation';
import { World } from '../../types/world.types';
import WorldCardActions from '../WorldCardActions/WorldCardActions';
import { worldStore } from '../../state/worldStore';

interface WorldCardProps {
  world: World;
  onSelect: (worldId: string) => void;
  onDelete: (worldId: string) => void;
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
  _storeActions,
  _router
}) => {
  const router = useRouter();
  const actualRouter = _router || router;

  const handleCardClick = () => {
    onSelect(world.id);
  };

  const handleDeleteClick = () => {
    onDelete(world.id);
  };

  const handlePlayClick = () => {
    try {
      const storeActions = _storeActions || worldStore.getState();
      storeActions.setCurrentWorld(world.id);
      actualRouter.push(`/world/${world.id}/play`);
    } catch (exception) {
      console.error('Error in handlePlayClick:', exception);
    }
  };

  return (
    <article
      data-testid="world-card"
      onClick={handleCardClick}
      className="border border-gray-300 p-4 m-4 rounded-md cursor-pointer hover:border-blue-400 hover:shadow-md transition-all"
    >
      <header>
        <h2 data-testid="world-card-name" className="text-xl font-bold mb-2 text-blue-800">{world.name}</h2>
      </header>
      <div className="mb-4">
        <p data-testid="world-card-description" className="text-gray-700 mb-2">{world.description}</p>
        <p data-testid="world-card-theme" className="text-sm font-medium text-blue-600 inline-block px-2 py-1 bg-blue-50 rounded">
          Theme: {world.theme}
        </p>
      </div>
      <footer className="mt-3 pt-2 border-t border-gray-200">
        <div className="flex justify-between text-xs text-gray-500 mb-2">
          <time data-testid="world-card-createdAt">Created: {new Date(world.createdAt).toLocaleDateString()}</time>
          <time data-testid="world-card-updatedAt">Updated: {new Date(world.updatedAt).toLocaleDateString()}</time>
        </div>
        <WorldCardActions onPlay={handlePlayClick} onEdit={() => { /* TODO: Implement Edit action */ }} onDelete={handleDeleteClick} />
      </footer>
    </article>
  );
};

export default WorldCard;