import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { World } from '@/types/world.types';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore, type Character } from '@/state/characterStore';
import { getGenreLabel } from '@/lib/constants/genres';
import {
  ActiveStateCard,
  MakeActiveButton,
  CardActionGroup,
} from '@/components/shared/cards';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Hero } from '@/components/shared/Hero';

interface WorldCardProps {
  /** The world data to display */
  world: World;
  /** Whether this world is currently active */
  isActive?: boolean;
  /** Callback when user selects this world */
  onSelect: (worldId: string) => void;
  /** Callback when user wants to delete this world */
  onDelete: (worldId: string) => void;
  /** Characters in this world */
  characters?: Character[];
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
 * Shows world details including name, genre, description, character count,
 * and world type (original, set in, inspired by). Provides action buttons
 * for playing, creating characters, viewing, editing, and deleting.
 * Active worlds get special styling and indicate current selection.
 *
 * Features:
 * - World image display if available
 * - Genre and world type badges
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
 * />
 */
const WorldCard: React.FC<WorldCardProps> = ({
  world,
  isActive = false,
  onSelect,
  onDelete,
  characters = [],
  _storeActions,
  _router,
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
    const storeActions = _storeActions || useWorldStore.getState();
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
      const storeActions = _storeActions || useWorldStore.getState();
      storeActions.setCurrentWorld(world.id);

      // Check for characters in this world
      const characterState = useCharacterStore.getState();
      const worldCharacters = (
        Object.values(characterState.characters) as Character[]
      ).filter((char) => char.worldId === world.id);

      if (worldCharacters.length === 0) {
        // No characters exist - redirect to characters page
        if (actualRouter) {
          actualRouter.push(`/characters?worldId=${world.id}`);
        }
        return;
      }

      // Check for saved session
      let hasSession = false;
      const savedSession = useSessionStore
        .getState()
        .getSavedSession(world.id, worldCharacters[0]?.id);

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
      testId="world-card"
      hasImage={!!world.image?.url}
    >
      {/* World Image with overlay */}
      {world.image?.url && (
        <Link href={`/world/${world.id}`} className="block cursor-pointer">
          <Hero
            title={world.name}
            image={{
              url: world.image.url,
              alt: `${world.name} world`,
            }}
            badge={
              world.genre && (
                <span
                  data-testid="world-card-genre"
                  className="px-2 py-1 text-xs font-medium text-blue-200 bg-blue-900/70 rounded-full backdrop-blur-sm"
                >
                  {getGenreLabel(world.genre)}
                </span>
              )
            }
            height="h-48"
            titleTestId="world-card-name"
            titleElement="h2"
          />
        </Link>
      )}

      <div className="p-4 flex-grow flex flex-col">
        {/* Content area that grows to fill space */}
        <div className="flex-grow">
          {/* For cards without images, show the world name here */}
          {!world.image?.url && (
            <header className="mb-4">
              <h2
                data-testid="world-card-name"
                className="text-xl sm:text-2xl font-bold leading-tight mb-2"
              >
                <Link
                  href={`/world/${world.id}`}
                  className="text-link-primary no-underline"
                >
                  {world.name}
                </Link>
              </h2>

              {/* Genre badge for cards without images */}
              {world.genre && (
                <div className="mb-3">
                  <span
                    data-testid="world-card-genre"
                    className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-100 rounded-full"
                  >
                    {getGenreLabel(world.genre)}
                  </span>
                </div>
              )}
            </header>
          )}

          {/* Character badges and manage link */}
          <div className="mb-8">
            {characters.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {characters.map((char) => (
                  <button
                    key={char.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (actualRouter) {
                        actualRouter.push(`/characters/${char.id}`);
                      }
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 transition-colors rounded-full text-sm font-medium text-blue-700 border border-blue-200 cursor-pointer"
                    title={`Play as ${char.name} - Level ${char.level}`}
                  >
                    {/* Character portrait or placeholder */}
                    {char.portrait?.url ? (
                      <Image
                        src={char.portrait.url}
                        alt={`${char.name} portrait`}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex-shrink-0 flex items-center justify-center">
                        <span className="text-white text-sm font-bold leading-none">
                          {char.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-base">{char.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="mb-8 space-y-3">
            <p
              data-testid="world-card-description"
              className="text-gray-700 leading-relaxed"
            >
              {world.description}
            </p>

            {/* World type badge */}
            <div className="flex justify-start">
              {world.reference ? (
                <Badge
                  variant={
                    world.relationship === 'set_within'
                      ? 'info-static'
                      : 'success-static'
                  }
                  data-testid="world-card-type"
                  className="text-xs"
                >
                  {world.relationship === 'set_within'
                    ? 'Set in'
                    : 'Inspired by'}{' '}
                  {world.reference}
                </Badge>
              ) : (
                <Badge
                  variant="default-static"
                  data-testid="world-card-type"
                  className="text-xs"
                >
                  Original World
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Footer with buttons - always at bottom */}
        <footer className="mt-auto pt-3 border-t border-gray-200">
          <div className="text-sm text-gray-700 mb-3">
            <time data-testid="world-card-createdAt">
              Created: {formatDate(world.createdAt)}
            </time>
          </div>
          <div className="space-y-2">
            {/* Make Active button for inactive worlds */}
            {!isActive && (
              <MakeActiveButton onClick={handleMakeActive} className="mb-3" />
            )}

            <CardActionGroup
              primaryActions={[
                {
                  key: 'create-character',
                  text: 'Create Character',
                  onClick: handleCreateCharacter,
                  variant: 'primary',
                  flex: true,
                  className: 'bg-green-500 hover:bg-green-700',
                },
                {
                  key: 'play',
                  text: 'Play',
                  onClick: handlePlayClick,
                  variant: 'primary',
                  flex: true,
                  className: 'bg-blue-500 hover:bg-blue-700',
                  testId: 'world-card-actions-play-button',
                },
                {
                  key: 'manage-characters',
                  text: 'Manage Characters',
                  onClick: (e) => {
                    e.stopPropagation();
                    if (actualRouter) {
                      actualRouter.push(`/characters?worldId=${world.id}`);
                    }
                  },
                  variant: 'primary',
                  flex: true,
                  className: 'bg-blue-500 hover:bg-blue-700',
                },
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
                  variant: 'secondary',
                },
                {
                  key: 'edit',
                  text: 'Edit',
                  onClick: handleEditClick,
                  variant: 'secondary',
                  testId: 'world-card-actions-edit-button',
                },
                {
                  key: 'delete',
                  text: 'Delete',
                  onClick: handleDeleteClick,
                  variant: 'danger',
                },
              ]}
              primarySize="md"
              secondarySize="sm"
            />
          </div>
        </footer>
      </div>
    </ActiveStateCard>
  );
};

export default WorldCard;
