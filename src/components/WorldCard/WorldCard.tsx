import React, { useId } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { World } from '@/types/world.types';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { useCharacterStore, type StoreCharacter } from '@/state/characterStore';
import { getGenreLabel } from '@/lib/constants/genres';
import {
  ActiveStateCard,
  ActiveStateLabel,
  CardActionGroup,
} from '@/components/shared/cards';
import { formatDate } from '@/lib/utils';
import { Hero } from '@/components/shared/Hero';
import { Badge } from '@/components/ui/badge';
import { resolveSessionCharacterId } from '@/lib/session/sessionCharacter';
import { Play, Pencil, Trash, UserPlus, Users } from 'lucide-react';
import Logger from '@/lib/utils/logger';

const logger = new Logger('WorldCard');

/** Pills shown before the rest collapse into a "+N more" count. */
const MAX_CHARACTER_PILLS = 3;

/** First character as the reader sees it, so an emoji isn't split in half. */
function initialOf(name: string): string {
  return (Array.from(name)[0] ?? '').toUpperCase();
}

interface WorldCardProps {
  /** The world data to display */
  world: World;
  /** Whether this world is currently active */
  isActive?: boolean;
  /** Callback when user wants to delete this world */
  onDelete: (worldId: string) => void;
  /** Characters in this world */
  characters?: StoreCharacter[];
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
 * - Smart play button that handles session resume, and sets the active world
 * - Active label on the current world
 * - Action buttons
 *
 * @param props - World card configuration and event handlers
 * @returns A formatted world card with image, details, and action buttons
 *
 * @example Basic usage
 * <WorldCard
 *   world={world}
 *   isActive={world.id === currentWorldId}
 *   onDelete={(id) => deleteWorld(id)}
 * />
 */
const WorldCard: React.FC<WorldCardProps> = ({
  world,
  isActive = false,
  onDelete,
  characters = [],
}) => {
  const router = useRouter();
  const titleId = useId();

  // Resolved the same way the play screen resolves it, so "Continue" only
  // shows when Play will actually resume that session.
  const sessionCharacterId = useCharacterStore((state) =>
    resolveSessionCharacterId(state.characters, state.currentCharacterId, world.id)
  );
  const savedSession = useSessionStore((state) =>
    sessionCharacterId ? state.getSavedSession(world.id, sessionCharacterId) : undefined
  );

  const handleDeleteClick = () => {
    onDelete(world.id);
  };

  const handlePlayClick = () => {
    try {
      useWorldStore.getState().setCurrentWorld(world.id);

      if (!sessionCharacterId) {
        router.push(`/characters/create?worldId=${world.id}`);
        return;
      }

      router.push(
        savedSession
          ? `/worlds/${world.id}/play?autoResume=true`
          : `/worlds/${world.id}/play`
      );
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

  // When a world has no image, render no <img> at all and let Hero fall back to
  // its themed empty state. The alt is empty because the art link is hidden
  // from assistive tech; the title link carries the name.
  const heroImage = world.image?.url ? { url: world.image.url, alt: '' } : undefined;
  const detailHref = `/worlds/${world.id}`;

  // Play says what it will do: resume, start, or send you to make someone first.
  const playLabel = !sessionCharacterId
    ? 'Create a character'
    : savedSession
      ? 'Continue'
      : 'Play';

  return (
    <ActiveStateCard
      isActive={isActive}
      testId="world-card"
      className="component-world-card"
      labelledBy={titleId}
    >
      {/* The art is a second, pointer-only way into the world. Keyboard and
          screen-reader users reach it once, through the title. */}
      <Link
        href={detailHref}
        className="world-card-hero-link"
        tabIndex={-1}
        aria-hidden="true"
      >
        <Hero image={heroImage} />
        <span className="world-card-plate-initial">
          {initialOf(world.name)}
        </span>
      </Link>

      <div className="world-card-body">
        <div className="world-card-content">
          <div className="world-card-heading">
            <h2 id={titleId} className="world-card-title" data-testid="world-card-name">
              <Link href={detailHref}>{world.name}</Link>
            </h2>
            {world.genre && (
              <Badge variant="secondary" data-testid="world-card-genre">
                {getGenreLabel(world.genre)}
              </Badge>
            )}
          </div>

          {world.description && (
            <p className="world-card-description" data-testid="world-card-description">
              {world.description}
            </p>
          )}

          <div className="world-card-meta">
            {characters.length > 0 && (
              <div className="world-card-character-pills">
                {characters.slice(0, MAX_CHARACTER_PILLS).map((char) => (
                  <button
                    key={char.id}
                    className="world-card-character-pill"
                    onClick={() => router.push(`/characters/${char.id}`)}
                    title={`View ${char.name} - Level ${char.level}`}
                    // The visible name hides on phones, so the button carries
                    // it in a label rather than relying on its contents.
                    aria-label={`${char.name}, level ${char.level}`}
                  >
                    {/* Character portrait or placeholder */}
                    {char.portrait?.url ? (
                      <Image
                        src={char.portrait.url}
                        alt=""
                        width={40}
                        height={40}
                      />
                    ) : (
                      <div className="world-card-character-pill-initial">
                        <span>{initialOf(char.name)}</span>
                      </div>
                    )}
                    <span className="world-card-character-pill-name">
                      {char.name}
                    </span>
                  </button>
                ))}
                {characters.length > MAX_CHARACTER_PILLS && (
                  <span
                    className="world-card-character-pills-more"
                    data-testid="world-card-character-pills-more"
                  >
                    +{characters.length - MAX_CHARACTER_PILLS} more
                    <span className="sr-only"> characters in {world.name}</span>
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="world-card-type-badge">
            <span className="world-card-type" data-testid="world-card-type">
              {world.reference
                ? `${world.relationship === 'set_within' ? 'Set in' : 'Inspired by'} ${world.reference}`
                : 'Original World'}
            </span>
            <ActiveStateLabel
              isActive={isActive}
              testId="world-card-active-label"
            />
          </div>
        </div>

        <footer>
          <div className="world-card-footer-meta">
            {savedSession ? (
              <time data-testid="world-card-lastPlayed" dateTime={savedSession.lastPlayed}>
                Last played: {formatDate(savedSession.lastPlayed)}
              </time>
            ) : (
              <time data-testid="world-card-createdAt" dateTime={world.createdAt}>
                Created: {formatDate(world.createdAt)}
              </time>
            )}
          </div>
          <div className="world-card-footer-actions">
            <CardActionGroup
              primaryActions={[
                {
                  key: 'play',
                  text: playLabel,
                  ariaLabel: sessionCharacterId
                    ? `${playLabel} ${world.name}`
                    : `Create a character for ${world.name}`,
                  onClick: handlePlayClick,
                  variant: 'accent',
                  testId: 'world-card-actions-play-button',
                  icon: sessionCharacterId ? <Play aria-hidden="true" /> : <UserPlus aria-hidden="true" />,
                },
              ]}
              secondaryActions={[
                {
                  key: 'characters',
                  text: 'Characters',
                  ariaLabel: `Characters in ${world.name}`,
                  onClick: () => router.push(`/characters?worldId=${world.id}`),
                  variant: 'quiet',
                  testId: 'world-card-actions-characters-button',
                  icon: <Users aria-hidden="true" />,
                },
                {
                  key: 'edit',
                  text: 'Edit',
                  ariaLabel: `Edit ${world.name}`,
                  onClick: handleEditClick,
                  variant: 'quiet',
                  testId: 'world-card-actions-edit-button',
                  icon: <Pencil aria-hidden="true" />,
                },
                {
                  key: 'delete',
                  text: 'Delete',
                  ariaLabel: `Delete ${world.name}`,
                  onClick: handleDeleteClick,
                  variant: 'quiet-danger',
                  testId: 'world-card-actions-delete-button',
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
