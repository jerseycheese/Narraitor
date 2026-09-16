import React from 'react';
// Use the store's Character type since it's more complete
import { useCharacterStore } from '@/state/characterStore';

type StoreCharacter = ReturnType<
  typeof useCharacterStore.getState
>['characters'][string];
import { CharacterPortrait } from '@/components/CharacterPortrait';
import {
  ActiveStateCard,
  ActiveStateToggle,
  CardActionGroup,
} from '@/components/shared/cards';
import {
  Play,
  Eye,
  Pencil,
  Trash,
} from 'lucide-react';
import { truncate, safeTrim } from '@/lib/utils';

interface CharacterContextSummary {
  recentEvent?: string;
  relationships?: Array<{
    characterId: string;
    characterName: string;
    portraitUrl?: string | null;
  }>;
}

interface CharacterCardProps {
  /** The character data to display */
  character: StoreCharacter;
  /** Whether this character is currently active */
  isActive: boolean;
  /** Callback when user wants to make this character active */
  onMakeActive: () => void;
  /** Callback when user wants to view character details */
  onView: () => void;
  /** Callback when user wants to play with this character */
  onPlay: () => void;
  /** Callback when user wants to edit this character */
  onEdit: () => void;
  /** Callback when user wants to delete this character */
  onDelete: () => void;
  /** Optional context describing the character's ongoing storyline */
  context?: CharacterContextSummary;
}

/**
 * CharacterCard - Display card for a character with actions
 *
 * Shows character information including portrait, name, level, type badges,
 * and description. Provides action buttons for viewing, playing, editing,
 * and deleting the character. Active characters get special styling.
 *
 * @param props - Character card configuration and event handlers
 * @returns A formatted character card with portrait and action buttons
 *
 * @example Basic usage
 * <CharacterCard
 *   character={character}
 *   isActive={character.id === currentCharacterId}
 *   onMakeActive={() => setActiveCharacter(character.id)}
 *   onView={() => router.push(`/characters/${character.id}`)}
 *   onPlay={() => startGame(character)}
 *   onEdit={() => router.push(`/characters/${character.id}/edit`)}
 *   onDelete={() => deleteCharacter(character.id)}
 * />
 */
export function CharacterCard({
  character,
  isActive,
  onMakeActive,
  onView,
  onPlay,
  onEdit,
  onDelete,
  context,
}: CharacterCardProps) {
  return (
    <ActiveStateCard
      isActive={isActive}
      showActiveIndicator={false}
      className="component-character-card"
    >
      <div className="character-card-body">
        <div className="character-card-inner">
          <div className="character-card-portrait" onClick={onView}>
            <CharacterPortrait
              portrait={
                character.portrait || { type: 'placeholder', url: null }
              }
              characterName={character.name}
              size="large"
            />
          </div>
          <h3 className="character-card-name">
            <button
              type="button"
              className="character-card-name-button"
              onClick={onView}
            >
              {character.name}
            </button>
          </h3>
          <div className="character-card-meta">
            <span className="character-card-level">Level {character.level || 1}</span>
            {character?.background?.isKnownFigure !== undefined && (
              <span className="character-card-type">
                {character.background.isKnownFigure ? 'Known Figure' : 'Original'}
              </span>
            )}
            <ActiveStateToggle
              isActive={isActive}
              onActivate={onMakeActive}
              testId="character-card-active-toggle"
            />
          </div>
          {(() => {
            const text = (character?.background?.history ||
              character?.background?.personality ||
              '') as string;
            const trimmedText = safeTrim(text);
            if (!trimmedText) return null;
            const sentences = trimmedText.split(/[.!?]+/);
            let result = '';
            for (const sentence of sentences) {
              const trimmed = safeTrim(sentence);
              if (!trimmed) continue;
              if ((result + trimmed + '.').length > 280) break;
              result += (result ? ' ' : '') + trimmed + '.';
            }
            const description = result || truncate(trimmedText, 280);
            return description ? (
              <p className="character-card-description">{description}</p>
            ) : null;
          })()}
          {context?.relationships && context.relationships.length > 0 && (
            <div className="character-card-connections">
              <h4>Connections</h4>
              <div className="character-card-connections-list">
                {context.relationships.map((relation) => (
                  <div key={relation.characterId} className="character-card-connection">
                    {relation.portraitUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={relation.portraitUrl}
                        alt={`${relation.characterName} portrait`}
                      />
                    ) : (
                      <div className="character-card-connection-initial">
                        <span>
                          {relation.characterName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span>{relation.characterName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {context?.recentEvent && (
            <div className="character-card-recent">
              <h4>Recent Event</h4>
              <p>{context.recentEvent}</p>
            </div>
          )}
        </div>

        {/* Footer with buttons - always at bottom */}
        <footer className="character-card-footer">
          <CardActionGroup
            primaryActions={[
              {
                key: 'play',
                text: 'Play',
                onClick: onPlay,
                variant: 'secondary',
                flex: true,
                testId: 'character-card-actions-play-button',
                icon: <Play aria-hidden="true" />,
              },
            ]}
            secondaryActions={[
              {
                key: 'view',
                text: 'View',
                onClick: onView,
                variant: 'secondary',
                testId: 'character-card-actions-view-button',
                icon: <Eye aria-hidden="true" />,
              },
              {
                key: 'edit',
                text: 'Edit',
                onClick: onEdit,
                variant: 'secondary',
                testId: 'character-card-actions-edit-button',
                icon: <Pencil aria-hidden="true" />,
              },
              {
                key: 'delete',
                text: 'Delete',
                onClick: onDelete,
                variant: 'danger',
                testId: 'character-card-actions-delete-button',
                icon: <Trash aria-hidden="true" />,
              },
            ]}
          />
        </footer>
      </div>
    </ActiveStateCard>
  );
}
