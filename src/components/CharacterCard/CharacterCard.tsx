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
      activeText="Currently Active Character"
      className="component-character-card"
    >

      <div >
        <div >
          <div 
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            
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
            
          >
            {character.name}
          </h3>
          <div >
            <span >Level {character.level || 1}</span>
            {character?.background?.isKnownFigure !== undefined && (
              <Badge
                icon={character?.background?.isKnownFigure ?
                  <Star  aria-hidden="true" /> :
                  <Plus  aria-hidden="true" />
                }
                variant={character?.background?.isKnownFigure ? 'warning-static' : 'default-static'}
              >
                {character?.background?.isKnownFigure ? 'Known Figure' : 'Original'}
              </Badge>
            )}
          </div>
          <p >
            {(() => {
              const text = (character?.background?.history ||
                          character?.background?.personality ||
                          'No description provided') as string;
              const sentences = text.split(/[.!?]+/);
              let result = '';
              for (const sentence of sentences) {
                const trimmed = safeTrim(sentence);
                if (!trimmed) continue;
                if ((result + trimmed + '.').length > 280) break;
                result += (result ? '' : '') + trimmed + '.';
              }
              return result || truncate(text, 280);
            })()}
          </p>
          {context?.relationships && context.relationships.length > 0 && (
            <div >
              <h4 >Connections</h4>
              <div >
                {context.relationships.map((relation) => (
                  <div
                    key={relation.characterId}
                    
                  >
                    {relation.portraitUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={relation.portraitUrl}
                        alt={`${relation.characterName}portrait`}
                        
                      />
                    ) : (
                      <div >
                        <span >
                          {relation.characterName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span >{relation.characterName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {context?.recentEvent && (
            <div >
              <h4 >Recent Event</h4>
              <p >
                {context.recentEvent}
              </p>
            </div>
          )}
          <div ></div>
        </div>
        
        {/* Footer with buttons - always at bottom */}
        <footer >
          <CardActionGroup
            primaryActions={[
              // Add Make Active button as first primary action for inactive characters
              ...(isActive ? [] : [{
                key: 'make-active',
                text: 'Make Active',
                onClick: onMakeActive,
                variant: 'secondary' as const,
                flex: true,
                icon: (<CheckCircle  aria-hidden="true" />)
              }]),
              {
                key: 'play',
                text: 'Play',
                onClick: onPlay,
                variant: 'success',
                flex: true,
                icon: (<Play  aria-hidden="true" />)
              }
            ]}
            secondaryActions={[
              {
                key: 'view',
                text: 'View',
                onClick: onView,
                variant: 'secondary',
                icon: (<Eye  aria-hidden="true" />)
              },
              {
                key: 'edit',
                text: 'Edit',
                onClick: onEdit,
                variant: 'secondary',
                icon: (<Pencil  aria-hidden="true" />)
              },
              {
                key: 'delete',
                text: 'Delete',
                onClick: onDelete,
                variant: 'danger',
                icon: (<Trash  aria-hidden="true" />)
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
