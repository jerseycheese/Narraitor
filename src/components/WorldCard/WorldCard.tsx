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
  CardActionGroup,
} from '@/components/shared/cards';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { formatDate } from '@/lib/utils';
import { Hero } from '@/components/shared/Hero';
import { CheckCircle, Play, Eye, Pencil, Trash } from 'lucide-react';

interface WorldCardProps {
  /** The world data to display */
  world: World;
  /** Whether this world is currently active */
  isActive?: boolean;
  /** Whether this world is selected for comparison */
  isSelected?: boolean;
  /** Callback when user selects this world */
  onSelect: (worldId: string) => void;
  /** Callback when user toggles selection for comparison */
  onToggleSelect?: (worldId: string) => void;
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
  isSelected = false,
  onSelect,
  onToggleSelect,
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
          ? `/worlds/${world.id}/play?autoResume=true`
          : `/worlds/${world.id}/play`;
        actualRouter.push(url);
      }
    } catch {
      // Handle navigation errors gracefully
    }
  };

  const handleEditClick = () => {
    try {
      if (actualRouter) {
        actualRouter.push(`/worlds/${world.id}/edit`);
      }
    } catch {
      // Handle navigation errors gracefully
    }
  };


  return (
    <ActiveStateCard
      isActive={isActive}
      activeText="Currently Active World"
      showActiveIndicator={isActive}
      testId="world-card"
      hasImage={true}
      className={isSelected ? "" : undefined}
    >
      {/* Always show Hero component - with image or themed background */}
      <div className="group">
        <Link href={`/worlds/${world.id}`} >
          {(() => {
            // Use seeded placeholder image during Playwright tests if world has no image
            const isPlaywright = typeof window !== 'undefined' &&
              (window.navigator.userAgent.includes('Playwright') || (window as unknown as Record<string, unknown>).__playwright);
            const STABLE_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/awp2z0AAAAASUVORK5CYII=';
            const heroImageUrl = world.image?.url || (isPlaywright ? STABLE_PLACEHOLDER : undefined);
            const heroImage = heroImageUrl ? { url: heroImageUrl, alt: `${world.name}world` } : undefined;
            
            return (
            <Hero
              title={world.name}
              image={heroImage}
              theme={(world.genre as 'fantasy' | 'sci-fi' | 'modern' | 'historical' | 'horror' | 'mystery' | 'western' | 'cyberpunk' | 'other') || 'default'}
              badge={
                world.genre && (
                  <span
                    data-testid="world-card-genre"
                    
                  >
                    {getGenreLabel(world.genre)}
                  </span>
                )
              }
              height=""
              titleTestId="world-card-name"
              titleElement="h2"
              borderRadius="top"
            />
            );
          })()}
        </Link>
        {onToggleSelect && (
          <div >
            <Checkbox
              checked={isSelected}
              onChange={() => onToggleSelect(world.id)}
              aria-label={`Select${world.name}for comparison`}
              
            />
          </div>
        )}
      </div>

      <div >
        {/* Content area that grows to fill space */}
        <div >

          {/* Character badges and manage link */}
          <div >
            {characters.length > 0 && (
              <div >
                {characters.map((char) => (
                  <button
                    key={char.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (actualRouter) {
                        actualRouter.push(`/characters/${char.id}`);
                      }
                    }}
                    
                    title={`Play as${char.name}- Level${char.level}`}
                  >
                    {/* Character portrait or placeholder */}
                    {char.portrait?.url ? (
                      <Image
                        src={char.portrait.url}
                        alt={`${char.name}portrait`}
                        width={40}
                        height={40}
                        
                      />
                    ) : (
                      <div >
                        <span >
                          {char.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span >{char.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div >
            <p
              data-testid="world-card-description"
              
            >
              {world.description}
            </p>

            {/* World type badge */}
            <div >
              {world.reference ? (
                <Badge
                  variant={
                    world.relationship === 'set_within'
                      ? 'info-static'
                      : 'success-static'
                  }
                  data-testid="world-card-type"
                  
                >
                  {world.relationship === 'set_within'
                    ? 'Set in'
                    : 'Inspired by'}{''}
                  {world.reference}
                </Badge>
              ) : (
                <Badge
                  variant="default-static"
                  data-testid="world-card-type"
                  
                >
                  Original World
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Footer with buttons - always at bottom */}
        <footer >
          <div >
            <time data-testid="world-card-createdAt">
              Created: {formatDate(world.createdAt)}
            </time>
          </div>
          <div >
            <CardActionGroup
              primaryActions={[
                // Add Make Active button as first primary action for inactive worlds
                ...(isActive ? [] : [{
                  key: 'make-active',
                  text: 'Make Active',
                  onClick: handleMakeActive,
                  variant: 'secondary' as const,
                  flex: true,
                  icon: (
                    <CheckCircle  aria-hidden="true" />
                  )
                }]),
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
                },
                {
                  key: 'play',
                  text: 'Play',
                  onClick: handlePlayClick,
                  variant: 'success',
                  flex: true,
                  testId: 'world-card-actions-play-button',
                  icon: (
                    <Play  aria-hidden="true" />
                  )
                },
              ]}
              secondaryActions={[
                {
                  key: 'view',
                  text: 'View',
                  onClick: (e) => {
                    e.stopPropagation();
                    if (actualRouter) {
                      actualRouter.push(`/worlds/${world.id}`);
                    }
                  },
                  variant: 'secondary',
                  icon: (
                    <Eye  aria-hidden="true" />
                  )
                },
                {
                  key: 'edit',
                  text: 'Edit',
                  onClick: handleEditClick,
                  variant: 'secondary',
                  testId: 'world-card-actions-edit-button',
                  icon: (
                    <Pencil  aria-hidden="true" />
                  )
                },
                {
                  key: 'delete',
                  text: 'Delete',
                  onClick: handleDeleteClick,
                  variant: 'danger',
                  icon: (
                    <Trash  aria-hidden="true" />
                  )
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
