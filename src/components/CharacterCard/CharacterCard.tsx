import React from 'react';
// Use the store's Character type since it's more complete
import { useCharacterStore } from '@/state/characterStore';

type StoreCharacter = ReturnType<typeof useCharacterStore.getState>['characters'][string];
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { 
  ActiveStateCard, 
  CardActionGroup
} from '@/components/shared/cards';
import { Badge } from '@/components/ui/badge';
import { Plus, Star } from 'lucide-react';
import { truncate, safeTrim, getNestedValue } from '@/lib/utils';

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
            className="text-xl font-semibold text-link-primary cursor-pointer mb-1"
          >
            {character.name}
          </h3>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm text-gray-500">Level {character.level || 1}</span>
            {getNestedValue(character, 'background.isKnownFigure') !== undefined && (
              <Badge
                icon={getNestedValue(character, 'background.isKnownFigure') ? 
                  <Star className="w-3 h-3 text-white" /> : 
                  <Plus className="w-3 h-3 text-white" />
                }
                variant={getNestedValue(character, 'background.isKnownFigure') ? 'warning-static' : 'default-static'}
              >
                {getNestedValue(character, 'background.isKnownFigure') ? 'Known Figure' : 'Original'}
              </Badge>
            )}
          </div>
          <p className="text-gray-700 text-sm leading-snug">
            {(() => {
              const text = (getNestedValue(character, 'background.history') || 
                          getNestedValue(character, 'background.personality') || 
                          'No description provided') as string;
              const sentences = text.split(/[.!?]+/);
              let result = '';
              for (const sentence of sentences) {
                const trimmed = safeTrim(sentence);
                if (!trimmed) continue;
                if ((result + trimmed + '.').length > 280) break;
                result += (result ? ' ' : '') + trimmed + '.';
              }
              return result || truncate(text, 280);
            })()}
          </p>
          <div className="clear-both"></div>
        </div>
        
        {/* Footer with buttons - always at bottom */}
        <footer className="mt-auto pt-6 border-t border-gray-200">
          <CardActionGroup
            primaryActions={[
              // Add Make Active button as first primary action for inactive characters
              ...(isActive ? [] : [{
                key: 'make-active',
                text: 'Make Active',
                onClick: onMakeActive,
                variant: 'secondary' as const,
                flex: true,
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              }]),
              {
                key: 'play',
                text: 'Play',
                onClick: onPlay,
                variant: 'success',
                flex: true,
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )
              }
            ]}
            secondaryActions={[
              {
                key: 'view',
                text: 'View',
                onClick: onView,
                variant: 'secondary',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 616 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )
              },
              {
                key: 'edit',
                text: 'Edit',
                onClick: onEdit,
                variant: 'secondary',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                )
              },
              {
                key: 'delete',
                text: 'Delete',
                onClick: onDelete,
                variant: 'danger',
                icon: (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                )
              }
            ]}
            primarySize="md"
            secondarySize="sm"
          />
        </footer>
      </div>
    </ActiveStateCard>
  );
}
