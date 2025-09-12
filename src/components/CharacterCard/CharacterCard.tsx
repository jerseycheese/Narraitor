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
import { Plus, Star, CheckCircle, Play, Eye, Pencil, Trash } from 'lucide-react';
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
      className="component-character-card"
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
                  <Star className="w-3 h-3 text-white" aria-hidden="true" /> : 
                  <Plus className="w-3 h-3 text-white" aria-hidden="true" />
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
                icon: (<CheckCircle className="w-4 h-4" aria-hidden="true" />)
              }]),
              {
                key: 'play',
                text: 'Play',
                onClick: onPlay,
                variant: 'success',
                flex: true,
                icon: (<Play className="w-4 h-4" aria-hidden="true" />)
              }
            ]}
            secondaryActions={[
              {
                key: 'view',
                text: 'View',
                onClick: onView,
                variant: 'secondary',
                icon: (<Eye className="w-4 h-4" aria-hidden="true" />)
              },
              {
                key: 'edit',
                text: 'Edit',
                onClick: onEdit,
                variant: 'secondary',
                icon: (<Pencil className="w-4 h-4" aria-hidden="true" />)
              },
              {
                key: 'delete',
                text: 'Delete',
                onClick: onDelete,
                variant: 'danger',
                icon: (<Trash className="w-4 h-4" aria-hidden="true" />)
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
