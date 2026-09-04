'use client';

import React from 'react';
import Link from 'next/link';
import { useCharacterStore, type StoreCharacter } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import { Button } from '@/components/ui/button';

export interface CharacterSelectionStepProps {
  worldId: string;
  onNext: (characterId: string) => void;
  onBack: () => void;
}

export function CharacterSelectionStep({ worldId, onNext, onBack }: CharacterSelectionStepProps) {
  const { characters } = useCharacterStore();
  const { worlds } = useWorldStore();
  const world = worlds[worldId];
  
  const worldCharacters = (Object.values(characters) as StoreCharacter[]).filter(
    char => char.worldId === worldId
  );

  if (worldCharacters.length === 0) {
    return (
      <div>
        <h3>
          No Characters Yet
        </h3>
        <p>
          Create a character for {world?.name} to continue
        </p>
        <div>
          <Link
            href="/characters/create"
            
          >
            Create Your Character
          </Link>
          <div>
            <Button
              onClick={onBack}
              
              variant="ghost"
            >
              ← Back to World Selection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="character-selection-step">
      <h3>
        Choose Your Character
      </h3>
      <p>
        World: {world?.name}
      </p>
      
      <div>
        {worldCharacters.map(character => (
          <Button
            key={character.id}
            onClick={() => onNext(character.id)}
            
            variant="ghost"
          >
            <div>
              <div>
                <h4>{character.name}</h4>
                <p>
                  {character.background.personality || 'No description available'}
                </p>
              </div>
              <span>
                Select →
              </span>
            </div>
          </Button>
        ))}
      </div>

      <div>
        <Button
          onClick={onBack}
          
          variant="ghost"
        >
          ← Back
        </Button>
        <Link
          href="/characters/create"
          
        >
          Create New Character
        </Link>
      </div>
    </div>
  );
}
