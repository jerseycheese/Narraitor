import React, { useId } from 'react';
// Use the store's Character type since it's more complete
import { useCharacterStore } from '@/state/characterStore';

type StoreCharacter = ReturnType<
  typeof useCharacterStore.getState
>['characters'][string];
import { CharacterPortrait } from '@/components/CharacterPortrait';
import {
  ActiveStateCard,
  ActiveStateLabel,
  CardActionGroup,
} from '@/components/shared/cards';
import { Play, Pencil, Trash } from 'lucide-react';
import { truncate, safeTrim, formatDate } from '@/lib/utils';

interface CharacterCardProps {
  /** The character data to display */
  character: StoreCharacter;
  /** Whether this character is currently active */
  isActive: boolean;
  /** Callback when user wants to view character details */
  onView: () => void;
  /** Callback when user wants to play with this character */
  onPlay: () => void;
  /** Callback when user wants to edit this character */
  onEdit: () => void;
  /** Callback when user wants to delete this character */
  onDelete: () => void;
}

/** First character as the reader sees it, so an emoji isn't split in half. */
function initialOf(name: string): string {
  return (Array.from(name)[0] ?? '').toUpperCase();
}

function getCharacterDescription(character: StoreCharacter): string {
  const text = (character?.background?.history ||
    character?.background?.personality ||
    character?.description ||
    '') as string;
  const trimmedText = safeTrim(text);
  if (!trimmedText) return '';
  const sentences = trimmedText.split(/[.!?]+/);
  let result = '';
  for (const sentence of sentences) {
    const trimmed = safeTrim(sentence);
    if (!trimmed) continue;
    if ((result + trimmed + '.').length > 280) break;
    result += (result ? ' ' : '') + trimmed + '.';
  }
  return result || truncate(trimmedText, 280);
}

/**
 * CharacterCard - Display card for a character with actions
 *
 * Shows character information including portrait, name, level, type badges,
 * and description. The name opens the character; Play, Edit and Delete sit in
 * the footer. The active character is marked, not selected here: Play sets it.
 */
export function CharacterCard({
  character,
  isActive,
  onView,
  onPlay,
  onEdit,
  onDelete,
}: CharacterCardProps) {
  const titleId = useId();
  const description = getCharacterDescription(character);
  const timestamp = character.updatedAt || character.createdAt;

  return (
    <ActiveStateCard
      isActive={isActive}
      testId="character-card"
      className="component-character-card"
      labelledBy={titleId}
    >
      <div
        className="character-card-portrait"
        data-testid="character-portrait"
        onClick={onView}
        tabIndex={-1}
        aria-hidden="true"
      >
        {character.portrait?.url ? (
          <CharacterPortrait
            portrait={character.portrait}
            characterName={character.name}
            size="large"
          />
        ) : (
          <span className="character-card-plate-initial">
            {initialOf(character.name)}
          </span>
        )}
      </div>

      <div className="character-card-body">
        <div className="character-card-content">
          <div className="character-card-heading">
            <h2
              id={titleId}
              className="character-card-title character-card-name"
              data-testid="character-card-name"
            >
              <button
                type="button"
                className="character-card-name-button"
                onClick={onView}
              >
                {character.name}
              </button>
            </h2>
          </div>

          <div className="character-card-meta">
            <span className="character-card-level">
              Level {character.level || 1}
            </span>
            {character?.background?.isKnownFigure !== undefined && (
              <span className="character-card-type">
                {character.background.isKnownFigure
                  ? 'Known Figure'
                  : 'Original'}
              </span>
            )}
            <ActiveStateLabel
              isActive={isActive}
              testId="character-card-active-label"
            />
          </div>

          {description ? (
            <p
              className="character-card-description"
              data-testid="character-card-description"
            >
              {description}
            </p>
          ) : null}
        </div>

        <footer>
          {timestamp ? (
            <div className="character-card-footer-meta">
              <time dateTime={timestamp}>
                {character.updatedAt
                  ? `Updated: ${formatDate(character.updatedAt)}`
                  : `Created: ${formatDate(character.createdAt)}`}
              </time>
            </div>
          ) : null}

          <div className="character-card-footer-actions">
            <CardActionGroup
              primaryActions={[
                {
                  key: 'play',
                  text: 'Play',
                  ariaLabel: `Play as ${character.name}`,
                  onClick: onPlay,
                  variant: 'accent',
                  testId: 'character-card-actions-play-button',
                  icon: <Play aria-hidden="true" />,
                },
              ]}
              secondaryActions={[
                {
                  key: 'edit',
                  text: 'Edit',
                  ariaLabel: `Edit ${character.name}`,
                  onClick: onEdit,
                  variant: 'quiet',
                  testId: 'character-card-actions-edit-button',
                  icon: <Pencil aria-hidden="true" />,
                },
                {
                  key: 'delete',
                  text: 'Delete',
                  ariaLabel: `Delete ${character.name}`,
                  onClick: onDelete,
                  variant: 'quiet-danger',
                  testId: 'character-card-actions-delete-button',
                  icon: <Trash aria-hidden="true" />,
                },
              ]}
            />
          </div>
        </footer>
      </div>
    </ActiveStateCard>
  );
}
