'use client';

import React from 'react';
import { CharacterPortrait } from '@/components/CharacterPortrait';
// Use the store's Character type since it's more complete
import { useCharacterStore } from '@/state/characterStore';
import { formatDate } from '@/lib/utils';

type StoreCharacter = ReturnType<typeof useCharacterStore.getState>['characters'][string];
import { World } from '@/types/world.types';

interface CharacterHeaderProps {
  character: StoreCharacter;
  world: World;
}

export function CharacterHeader({ character, world }: CharacterHeaderProps) {
  return (
    <div className="character-detail-header">
      <CharacterPortrait
        portrait={character.portrait || { type: 'placeholder', url: null }}
        characterName={character.name}
        size="xlarge"
      />
      <div className="character-detail-header-info">
        <h2>{character.name}</h2>
        <p>Level {character.level}</p>
        {character.background.personality && (
          <p>
            {character.background.personality}
          </p>
        )}
        <div className="character-detail-header-meta">
          <p>
            <strong>Created:</strong> {formatDate(character.createdAt)}
          </p>
          <p>
            <strong>World:</strong> {world.name}
          </p>
        </div>
      </div>
    </div>
  );
}
