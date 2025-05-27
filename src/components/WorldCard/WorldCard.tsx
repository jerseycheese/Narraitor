import React from 'react';
import { useRouter } from 'next/navigation';
import { World } from '../../types/world.types';
import WorldCardActions from '../WorldCardActions/WorldCardActions';
import { worldStore } from '../../state/worldStore';
import { sessionStore } from '../../state/sessionStore';
import { characterStore } from '../../state/characterStore';

interface WorldCardProps {
  world: World;
  isActive?: boolean;
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
  isActive = false,
  onSelect, 
  onDelete,
  _storeActions,
  _router
}) => {
  // Only call useRouter if no mock is provided
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const router = _router ? null : useRouter();
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
      
      // Check for saved session
      const characterState = characterStore.getState();
      const worldCharacters = Object.values(characterState.characters)
        .filter(char => char.worldId === world.id);
      
      let hasSession = false;
      if (worldCharacters.length > 0) {
        // Check if there's a saved session for any character in this world
        const savedSession = sessionStore.getState().getSavedSession(
          world.id, 
          worldCharacters[0].id
        );
        
        if (savedSession) {
          hasSession = true;
          console.log('[WorldCard] Found saved session:', savedSession.id);
        }
      } else {
        console.log('[WorldCard] No characters exist for this world yet');
      }
      
      if (actualRouter) {
        // Add query parameter to auto-resume if there's a saved session
        const url = hasSession 
          ? `/world/${world.id}/play?autoResume=true`
          : `/world/${world.id}/play`;
        actualRouter.push(url);
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
      className={`border p-4 rounded-lg cursor-pointer transition-all duration-200 relative ${
        isActive 
          ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-400' 
          : 'border-gray-300 bg-white hover:border-blue-500 hover:shadow-lg'
      }`}
    >
      <div className="absolute top-4 right-4 flex items-center gap-2">
        {isActive && (
          <span className="px-3 py-1.5 text-sm font-medium text-white bg-green-600 rounded-full">
            Active
          </span>
        )}
        {world.theme && (
          <p 
            data-testid="world-card-theme" 
            className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-full"
          >
            {world.theme.charAt(0).toUpperCase() + world.theme.slice(1)}
          </p>
        )}
      </div>
      <header>
        <h2 
          data-testid="world-card-name" 
          className="text-2xl font-bold mb-3 text-blue-800 pr-32"
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
    </article>
  );
};

export default WorldCard;