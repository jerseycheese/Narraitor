import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { World } from '../../types/world.types';
import WorldCardActions from '../WorldCardActions/WorldCardActions';
import DeleteConfirmationDialog from '../DeleteConfirmationDialog';
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
  // Only call useRouter if no mock is provided
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const router = _router ? null : useRouter();
  const actualRouter = _router || router;

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCardClick = () => {
    onSelect(world.id);
  };

  const handleDeleteClick = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(world.id);
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handlePlayClick = () => {
    try {
      const storeActions = _storeActions || worldStore.getState();
      storeActions.setCurrentWorld(world.id);
      if (actualRouter) {
        actualRouter.push(`/world/${world.id}/play`);
      }
    } catch (exception) {
      console.error('Error in handlePlayClick:', exception);
    }
  };

  const handleEditClick = () => {
    try {
      if (actualRouter) {
        actualRouter.push(`/world/${world.id}/edit`);
      }
    } catch (exception) {
      console.error('Error in handleEditClick:', exception);
    }
  };

  return (
    <article
      data-testid="world-card"
      onClick={handleCardClick}
      className="border border-gray-300 p-4 m-4 rounded-lg cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all duration-200 bg-white"
    >
      <header>
        <h2 
          data-testid="world-card-name" 
          className="text-2xl font-bold mb-3 text-blue-800"
        >
          {world.name}
        </h2>
      </header>
      <div className="mb-4 space-y-3">
        <p 
          data-testid="world-card-description" 
          className="text-gray-700 leading-relaxed"
        >
          {world.description}
        </p>
        {world.theme && (
          <p 
            data-testid="world-card-theme" 
            className="inline-block px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-full"
          >
            Theme: {world.theme}
          </p>
        )}
      </div>
      <footer className="mt-4 pt-3 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-600 mb-3">
          <time data-testid="world-card-createdAt">
            Created: {new Date(world.createdAt).toLocaleDateString()}
          </time>
          <time data-testid="world-card-updatedAt">
            Updated: {new Date(world.updatedAt).toLocaleDateString()}
          </time>
        </div>
        <WorldCardActions 
          onPlay={handlePlayClick} 
          onEdit={handleEditClick} 
          onDelete={handleDeleteClick} 
        />
      </footer>
      
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        title="Delete World"
        description="Are you sure you want to delete this world? This action cannot be undone."
        itemName={world.name}
        isDeleting={isDeleting}
      />
    </article>
  );
};

export default WorldCard;