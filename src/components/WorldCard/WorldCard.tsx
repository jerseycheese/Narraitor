import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { World } from '../../types/world.types';
import { worldStore } from '../../state/worldStore';
import { sessionStore } from '../../state/sessionStore';
import { characterStore } from '../../state/characterStore';
import { 
  ActiveStateCard, 
  MakeActiveButton, 
  CardActionGroup, 
  EntityBadge 
} from '../shared/cards';

interface WorldCardProps {
  /** The world data to display */
  world: World;
  /** Whether this world is currently active */
  isActive?: boolean;
  /** Callback when user selects this world */
  onSelect: (worldId: string) => void;
  /** Callback when user wants to delete this world */
  onDelete: (worldId: string) => void;
  /** Number of characters in this world */
  characterCount?: number;
  /** Optional store actions for testing */
  _storeActions?: {
    setCurrentWorld: (id: string) => void;
  };
  /** Optional router for testing */
  _router?: {
    push: (url: string) => void;
  };
}

/**
 * WorldCard - Display card for a world with actions and information
 * 
 * Shows world details including name, theme, description, character count,
 * and world type (original, set in, inspired by). Provides action buttons
 * for playing, creating characters, viewing, editing, and deleting.
 * Active worlds get special styling and indicate current selection.
 * 
 * Features:
 * - World image display if available
 * - Theme and world type badges
 * - Character count with navigation to characters list
 * - Smart play button that handles session resume
 * - Make active button for non-active worlds
 * - Comprehensive action buttons
 * 
 * @param props - World card configuration and event handlers
 * @returns A formatted world card with image, details, and action buttons
 * 
 * @example Basic usage
 * <WorldCard
 *   world={world}
 *   isActive={world.id === currentWorldId}
 *   onSelect={(id) => setCurrentWorld(id)}
 *   onDelete={(id) => deleteWorld(id)}
 *   characterCount={getCharacterCount(world.id)}
 * />
 */
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
      
      // Check for characters in this world
      const characterState = characterStore.getState();
      const worldCharacters = Object.values(characterState.characters)
        .filter(char => char.worldId === world.id);
      
      if (worldCharacters.length === 0) {
        // No characters exist - redirect to characters page
        if (actualRouter) {
          actualRouter.push(`/characters?worldId=${world.id}`);
        }
        return;
      }
      
      // Check for saved session
      let hasSession = false;
      const savedSession = sessionStore.getState().getSavedSession(
        world.id, 
        worldCharacters[0].id
      );
      
      if (savedSession) {
        hasSession = true;
      }
      
      if (actualRouter) {
        // Add query parameter to auto-resume if there's a saved session
        const url = hasSession 
          ? `/world/${world.id}/play?autoResume=true`
          : `/world/${world.id}/play`;
        actualRouter.push(url);
      }
    } catch {
      // Handle navigation errors gracefully
    }
  };

  const handleEditClick = () => {
    try {
      if (actualRouter) {
        actualRouter.push(`/world/${world.id}/edit`);
      }
    } catch {
      // Handle navigation errors gracefully
    }
  };

  return (
    <ActiveStateCard
      isActive={isActive}
      activeText="Currently Active World"
      onClick={() => onSelect?.(world.id)}
      testId="world-card"
      hasImage={!!world.image?.url}
    >
      {/* World Image */}
      {world.image?.url && (
        <div className="h-48 overflow-hidden bg-gray-100">
          <Image 
            src={world.image.url} 
            alt={`${world.name} world`}
            width={400}
            height={192}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4 flex-grow flex flex-col">
        {/* Content area that grows to fill space */}
        <div className="flex-grow">
          <header className="mb-4"> 
            <Link 
              href={`/world/${world.id}`}
              className="inline-block"
            >
              <h2 
                data-testid="world-card-name" 
                className="text-xl sm:text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors leading-tight mb-2"
              >
                {world.name}
              </h2>
            </Link>
            
            {/* Theme and world type badges */}
            <div className="flex flex-wrap items-center gap-2">
              {world.theme && (
                <span 
                  data-testid="world-card-theme" 
                  className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full"
                >
                  {world.theme.charAt(0).toUpperCase() + world.theme.slice(1)}
                </span>
              )}
              
              {/* World type badge */}
              {world.relationship && world.reference ? (
                <EntityBadge
                  icon={world.relationship === 'set_in' ? '🌍' : '✨'}
                  text={world.relationship === 'set_in' ? `Set in ${world.reference}` : `Inspired by ${world.reference}`}
                  variant={world.relationship === 'set_in' ? 'info' : 'success'}
                  testId="world-card-type"
                />
              ) : (
                <EntityBadge
                  icon="⚡"
                  text="Original World"
                  variant="primary"
                  testId="world-card-type"
                />
              )}
            </div>
          
          {/* Character count for all worlds */}
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (actualRouter) {
                  actualRouter.push(`/characters?worldId=${world.id}`);
                }
              }}
              className="text-link-button"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              {characterCount} character{characterCount !== 1 ? 's' : ''}
            </button>
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
            <MakeActiveButton
              onClick={handleMakeActive}
              className="mb-3"
            />
          )}
          
          <CardActionGroup
            primaryActions={[
              {
                key: 'create-character',
                text: 'Create Character',
                onClick: handleCreateCharacter,
                variant: 'primary',
                flex: true,
                className: 'bg-green-600 hover:bg-green-700',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                )
              },
              {
                key: 'play',
                text: 'Play',
                onClick: handlePlayClick,
                variant: 'primary',
                flex: true,
                className: 'bg-indigo-600 hover:bg-indigo-700',
                icon: (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ),
                testId: 'world-card-actions-play-button'
              }
            ]}
            secondaryActions={[
              {
                key: 'view',
                text: 'View',
                onClick: (e) => {
                  e.stopPropagation();
                  if (actualRouter) {
                    actualRouter.push(`/world/${world.id}`);
                  }
                },
                variant: 'primary',
                className: 'bg-blue-600 hover:bg-blue-700',
                flex: true
              },
              {
                key: 'edit',
                text: 'Edit',
                onClick: handleEditClick,
                variant: 'primary',
                className: 'bg-blue-600 hover:bg-blue-700',
                flex: true,
                testId: 'world-card-actions-edit-button'
              },
              {
                key: 'delete',
                text: 'Delete',
                onClick: handleDeleteClick,
                variant: 'danger'
              }
            ]}
          />
        </div>
      </footer>
      </div>
    </ActiveStateCard>
  );
};

export default WorldCard;