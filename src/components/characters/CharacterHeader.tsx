'use client';

import React from 'react';
import { CharacterPortrait } from '@/components/CharacterPortrait';
// Use the store's Character type since it's more complete
import { useCharacterStore } from '@/state/characterStore';

type StoreCharacter = ReturnType<typeof useCharacterStore.getState>['characters'][string];
import { World } from '@/types/world.types';

interface CharacterHeaderProps {
  character: StoreCharacter;
  world: World;
}

export function CharacterHeader({ character, world }: CharacterHeaderProps) {
  return (
    <div className="flex items-start gap-6 mb-8">
      <CharacterPortrait
        portrait={character.portrait || { type: 'placeholder', url: null }}
        characterName={character.name}
        size="xlarge"
      />
      <div className="flex-1">
        <h2 className="text-3xl font-bold mb-2">{character.name}</h2>
        <p className="text-gray-600 mb-4">Level {character.level}</p>
        {character.background.personality && (
          <p className="text-gray-700 mb-4 italic">
            {character.background.personality}
          </p>
        )}
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            <strong>Created:</strong> {new Date(character.createdAt).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-500">
            <strong>World:</strong> {world.name}
          </p>
        </div>
      </div>
    </div>
  );
}
