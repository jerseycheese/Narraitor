'use client';

import React from 'react';
import { CharacterPortrait } from '@/components/CharacterPortrait';
// Use the store's Character type since it's more complete
import { useCharacterStore } from '@/state/characterStore';
import { formatDate } from '@/lib/utils';

type StoreCharacter = ReturnType<typeof useCharacterStore.getState>['characters'][string];
interface CharacterHeaderProps {
  character: StoreCharacter;
}

export function CharacterHeader({ character }: CharacterHeaderProps) {
  return (
    <div className="character-detail-header">
      <CharacterPortrait
        portrait={character.portrait || { type: 'placeholder', url: null }}
        characterName={character.name}
        size="xlarge"
      />
      <div className="character-detail-header-info">
        {/* No name heading, level or world here: the page masthead already
            carries all three, and repeating them stacked duplicates. */}
        {character.background.personality && (
          <p>
            {character.background.personality}
          </p>
        )}
        <div className="character-detail-header-meta">
          <p>
            <strong>Created:</strong> {formatDate(character.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
