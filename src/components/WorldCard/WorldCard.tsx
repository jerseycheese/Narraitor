import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { World } from '@/types/world.types';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore, type Character } from '@/state/characterStore';
import { getGenreLabel } from '@/lib/constants/genres';
import { ActiveStateCard, CardActionGroup } from '@/components/shared/cards';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Hero } from '@/components/shared/Hero';
import { CheckCircle, Play, Pencil, Trash } from 'lucide-react';
import Logger from '@/lib/utils/logger';

const logger = new Logger('WorldCard');

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
 * - Action buttons
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
}) => {
  const router = useRouter();

  const handleMakeActive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(world.id);
  };

  const handleDeleteClick = () => {
    onDelete(world.id);
  };

  const handlePlayClick = () => {
    try {
      useWorldStore.getState().setCurrentWorld(world.id);

      // Check for characters in this world
      const characterState = useCharacterStore.getState();
      const worldCharacters = (
        Object.values(characterState.characters) as Character[]
      ).filter((char) => char.worldId === world.id);

      if (worldCharacters.length === 0) {
        // No characters exist - redirect to characters page
        router.push(`/characters?worldId=${world.id}`);
        return;
      }

      // Check for saved session
      const savedSession = useSessionStore
        .getState()
        .getSavedSession(world.id, worldCharacters[0]?.id);

      // Add query parameter to auto-resume if there's a saved session
      const url = savedSession
        ? `/worlds/${world.id}/play?autoResume=true`
        : `/worlds/${world.id}/play`;
      router.push(url);
    } catch (error) {
      logger.error('handlePlayClick', 'Failed to navigate to play world', error);
    }
  };

  const handleEditClick = () => {
    try {
      router.push(`/worlds/${world.id}/edit`);
    } catch (error) {
      logger.error('handleEditClick', 'Failed to navigate to edit world', error);
    }
  };

  return (
    <ActiveStateCard
      isActive={isActive}
      activeText="Currently Active World"
      showActiveIndicator={isActive}
      testId="world-card"
      hasImage={true}
      className="component-world-card"
    >
      {/* Always show Hero component - with image or themed background */}
      <div>
        <Link href={`/worlds/${world.id}`}>
          {(() => {
            // When a world has no image, render no <img> at all and let Hero
            // fall back to its tokenized themed background (see .component-hero
            // in app-shell.css). A previous white 1x1 placeholder rendered as a
            // bright rectangle in dark mode (#1113). The themed empty-state is
            // deterministic CSS, so it stays stable under visual tests too.
            const heroImage = world.image?.url
              ? { url: world.image.url, alt: `${world.name} world` }
              : undefined;

            return (
              <Hero
                title={world.name}
                image={heroImage}
                badge={
                  world.genre && (
                    <span data-testid="world-card-genre">
                      {getGenreLabel(world.genre)}
                    </span>
                  )
                }
                titleTestId="world-card-name"
                titleElement="h2"
              />
            );
          })()}
        </Link>
      </div>

      <div className="world-card-body">
        {/* Content area that grows to fill space */}
        <div className="world-card-content">
          {/* Character badges and manage link */}
          <div className="world-card-meta">
            {characters.length > 0 && (
              <div className="world-card-character-pills">
                {characters.map((char) => (
                  <button
                    key={char.id}
                    className="world-card-character-pill"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/characters/${char.id}`);
                    }}
                    title={`Play as ${char.name} - Level ${char.level}`}
                  >
                    {/* Character portrait or placeholder */}
                    {char.portrait?.url ? (
                      <Image
                        src={char.portrait.url}
                        alt={`${char.name} portrait`}
                        width={40}
                        height={40}
                      />
                    ) : (
                      <div className="world-card-character-pill-initial">
                        <span>{char.name.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    <span>{char.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="world-card-description-block">
            <p data-testid="world-card-description">{world.description}</p>

            {/* World type badge */}
            <div className="world-card-type-badge">
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
                    : 'Inspired by'}{' '}
                  {world.reference}
                </Badge>
              ) : (
                <Badge variant="default-static" data-testid="world-card-type">
                  Original World
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Footer with buttons - always at bottom */}
        <footer>
          <div className="world-card-footer-meta">
            <time data-testid="world-card-createdAt">
              Created: {formatDate(world.createdAt)}
            </time>
          </div>
          <div className="world-card-footer-actions">
            <CardActionGroup
              primaryActions={[
                // Add Make Active button as first primary action for inactive worlds
                ...(isActive
                  ? []
                  : [
                      {
                        key: 'make-active',
                        text: 'Make Active',
                        onClick: handleMakeActive,
                        variant: 'secondary' as const,
                        flex: true,
                        icon: <CheckCircle aria-hidden="true" />,
                      },
                    ]),
                {
                  key: 'manage-characters',
                  text: 'Manage Characters',
                  onClick: (e) => {
                    e.stopPropagation();
                    router.push(`/characters?worldId=${world.id}`);
                  },
                  variant: 'secondary',
                  flex: true,
                },
                {
                  key: 'play',
                  text: 'Play',
                  onClick: handlePlayClick,
                  variant: 'success',
                  flex: true,
                  testId: 'world-card-actions-play-button',
                  icon: <Play aria-hidden="true" />,
                },
              ]}
              secondaryActions={[
                {
                  key: 'edit',
                  text: 'Edit',
                  onClick: handleEditClick,
                  variant: 'secondary',
                  testId: 'world-card-actions-edit-button',
                  icon: <Pencil aria-hidden="true" />,
                },
                {
                  key: 'delete',
                  text: 'Delete',
                  onClick: handleDeleteClick,
                  variant: 'danger',
                  icon: <Trash aria-hidden="true" />,
                },
              ]}
            />
          </div>
        </footer>
      </div>
    </ActiveStateCard>
  );
};

export default WorldCard;
