'use client';

import React from 'react';
import Link from 'next/link';
import { useCharacterStore, type Character } from '@/state/characterStore';
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
  
  const worldCharacters = (Object.values(characters) as Character[]).filter(
    char => char.worldId === worldId
  );

  if (worldCharacters.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          No Characters Yet
        </h3>
        <p className="text-gray-600 mb-8">
          Create a character for {world?.name} to continue
        </p>
        <div className="space-y-4">
          <Link
            href="/characters/create"
            className="inline-flex items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
          >
            Create Your Character
          </Link>
          <div>
            <Button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800"
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
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Choose Your Character
      </h3>
      <p className="text-gray-600 mb-6">
        World: {world?.name}
      </p>
      
      <div className="space-y-4 mb-6">
        {worldCharacters.map(character => (
          <Button
            key={character.id}
            onClick={() => onNext(character.id)}
            className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
            variant="ghost"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{character.name}</h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {character.background.personality || 'No description available'}
                </p>
              </div>
              <span className="text-blue-600 ml-4">
                Select →
              </span>
            </div>
          </Button>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <Button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800"
          variant="ghost"
        >
          ← Back
        </Button>
        <Link
          href="/characters/create"
          className="text-link-primary font-medium no-underline"
        >
          Create New Character
        </Link>
      </div>
    </div>
  );
}
