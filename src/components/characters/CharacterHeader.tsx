'use client';

import React from 'react';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { Character } from '@/types/character.types';
import { World } from '@/types/world.types';

interface CharacterHeaderProps {
  character: Character;
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
        <h1 className="text-3xl font-bold mb-2">{character.name}</h1>
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