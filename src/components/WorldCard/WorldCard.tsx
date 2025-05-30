import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { World } from '../../types/world.types';
import { worldStore } from '../../state/worldStore';
import { sessionStore } from '../../state/sessionStore';
import { characterStore } from '../../state/characterStore';

interface WorldCardProps {
  world: World;
  isActive?: boolean;
  onSelect: (worldId: string) => void;
  onDelete: (worldId: string) => void;
  characterCount?: number;
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
  characterCount = 0,
  _storeActions,
  _router
}) => {
  // Only call useRouter if no mock is provided
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const router = _router ? null : useRouter();
  const actualRouter = _router || router;

  const handleMakeActive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(world.id);
  };

  const handleCreateCharacter = (e: React.MouseEvent) => {
    e.stopPropagation();
    const storeActions = _storeActions || worldStore.getState();
    storeActions.setCurrentWorld(world.id);
    if (actualRouter) {
      actualRouter.push('/characters/create');
    }
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
      className={`border rounded-lg transition-all duration-200 relative overflow-hidden flex flex-col h-full ${
        isActive 
          ? 'border-green-500 bg-green-50 shadow-xl ring-2 ring-green-400' 
          : 'border-gray-300 bg-white hover:shadow-lg'
      }`}
    >
      {/* World Image */}
      {world.image?.url && (
        <div className="h-48 overflow-hidden bg-gray-100">
          <img 
            src={world.image.url} 
            alt={`${world.name} world`}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      {/* Active World Header */}
      {isActive && (
        <div className="bg-green-600 text-white px-4 py-2 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-medium text-sm">Currently Active World</span>
          </div>
        </div>
      )}
      
      <div className="p-4 flex-grow flex flex-col">
        {/* Content area that grows to fill space */}
        <div className="flex-grow">
          <header className="mb-4"> 
            <div className="flex items-center justify-between mb-2">
              <Link 
                href={`/world/${world.id}`}
                className="inline-block flex-1 pr-4"
              >
                <h2 
                  data-testid="world-card-name" 
                  className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors leading-tight"
                >
                  {world.name}
                </h2>
              </Link>
              
              {/* Theme badge inline with title */}
              {world.theme && (
                <span 
                  data-testid="world-card-theme" 
                  className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full flex-shrink-0"
                >
                  {world.theme.charAt(0).toUpperCase() + world.theme.slice(1)}
                </span>
              )}
            </div>
          
          {/* Character count for all worlds */}
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {characterCount} character{characterCount !== 1 ? 's' : ''}
            </span>
          </div>
          </header>
          
          <div className="mb-4 space-y-3">
            <p 
              data-testid="world-card-description" 
              className="text-gray-700 leading-relaxed"
            >
              {world.description}
            </p>
          </div>
        </div>
        
        {/* Footer with buttons - always at bottom */}
        <footer className="mt-auto pt-3 border-t border-gray-200">
        <div className="flex justify-between text-sm text-gray-600 mb-3">
          <time data-testid="world-card-createdAt">
            Created: {new Date(world.createdAt).toLocaleDateString()}
          </time>
          <time data-testid="world-card-updatedAt">
            Updated: {new Date(world.updatedAt).toLocaleDateString()}
          </time>
        </div>
        <div className="space-y-2">
          {/* Make Active button for inactive worlds */}
          {!isActive && (
            <button
              onClick={handleMakeActive}
              className="w-full px-4 py-2 bg-green-100 hover:bg-green-200 text-green-800 hover:text-green-900 rounded-md transition-colors border border-green-300 hover:border-green-400 font-medium flex items-center justify-center gap-2 mb-3"
              title="Set as active world"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Make Active
            </button>
          )}
          
          {/* Primary Actions Row */}
          <div className="flex gap-2">
            <button
              onClick={handleCreateCharacter}
              className="flex-1 px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors flex items-center justify-center gap-2"
              title="Create a new character in this world"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Create Character
            </button>
            <button
              onClick={handlePlayClick}
              className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium transition-colors flex items-center justify-center gap-2"
              title="Start playing in this world"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Play
            </button>
          </div>
          {/* Secondary Actions Row */}
          <div className="flex gap-2">
            <button
              onClick={handleEditClick}
              className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 font-medium transition-colors text-sm"
            >
              Edit World
            </button>
            <button
              onClick={handleDeleteClick}
              className="px-3 py-2 bg-gray-100 text-red-600 rounded-md hover:bg-red-50 font-medium transition-colors text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </footer>
      </div>
    </article>
  );
};

export default WorldCard;