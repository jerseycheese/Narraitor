import React from 'react';
// Use the store's Character type since it's more complete
import { characterStore } from '@/state/characterStore';

type StoreCharacter = ReturnType<typeof characterStore.getState>['characters'][string];
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { 
  ActiveStateCard, 
  MakeActiveButton, 
  CardActionGroup, 
  EntityBadge 
} from '@/components/shared/cards';

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
  onDelete
}: CharacterCardProps) {

  return (
    <ActiveStateCard 
      isActive={isActive}
      activeText="Currently Active Character"
    >

      <div className="p-8 flex-grow flex flex-col">
        <div className="flex-grow mb-6">
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="cursor-pointer float-right ml-4 mb-3"
          >
            <CharacterPortrait
              portrait={character.portrait || { type: 'placeholder', url: null }}
              characterName={character.name}
              size="large"
            />
          </div>
          <h3 
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="text-xl font-semibold hover:text-blue-600 transition-colors cursor-pointer mb-1"
          >
            {character.name}
          </h3>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-500">Level {character.level || 1}</span>
            {character.background?.isKnownFigure !== undefined && (
              <EntityBadge
                icon={character.background.isKnownFigure ? '⭐' : '➕'}
                text={character.background.isKnownFigure ? 'Known Figure' : 'Original'}
                variant={character.background.isKnownFigure ? 'warning' : 'primary'}
              />
            )}
          </div>
          <p className="text-gray-600 text-sm leading-snug">
            {(() => {
              const text = character.background.history || character.background.personality || 'No description provided';
              const sentences = text.split(/[.!?]+/);
              let result = '';
              for (const sentence of sentences) {
                const trimmed = sentence.trim();
                if (!trimmed) continue;
                if ((result + trimmed + '.').length > 280) break;
                result += (result ? ' ' : '') + trimmed + '.';
              }
              return result || text.substring(0, 280) + (text.length > 280 ? '...' : '');
            })()}
          </p>
          <div className="clear-both"></div>
        </div>
        
        {/* Footer with buttons - always at bottom */}
        <footer className="mt-auto pt-6 border-t border-gray-200">
          {/* Make Active button for inactive characters */}
          {!isActive && (
            <div className="mb-3">
              <MakeActiveButton onClick={onMakeActive} />
            </div>
          )}
          
          <CardActionGroup
            primaryActions={[
              {
                key: 'view',
                text: 'View',
                onClick: onView,
                variant: 'primary',
                className: 'bg-blue-600 hover:bg-blue-700'
              },
              {
                key: 'play',
                text: 'Play',
                onClick: onPlay,
                variant: 'primary',
                className: 'bg-indigo-600 hover:bg-indigo-700'
              },
              {
                key: 'edit',
                text: 'Edit',
                onClick: onEdit,
                variant: 'primary',
                className: 'bg-blue-600 hover:bg-blue-700'
              },
              {
                key: 'delete',
                text: 'Delete',
                onClick: onDelete,
                variant: 'danger'
              }
            ]}
          />
        </footer>
      </div>
    </ActiveStateCard>
  );
}