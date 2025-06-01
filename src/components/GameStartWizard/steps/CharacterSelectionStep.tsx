'use client';

import React from 'react';
import Link from 'next/link';
import { characterStore } from '@/state/characterStore';
import { worldStore } from '@/state/worldStore';

export interface CharacterSelectionStepProps {
  worldId: string;
  onNext: (characterId: string) => void;
  onBack: () => void;
}

export function CharacterSelectionStep({ worldId, onNext, onBack }: CharacterSelectionStepProps) {
  const { characters } = characterStore();
  const { worlds } = worldStore();
  const world = worlds[worldId];
  
  const worldCharacters = Object.values(characters).filter(
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
            <button
              onClick={onBack}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Back to World Selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Choose Your Character
      </h3>
      <p className="text-gray-600 mb-6">
        World: {world?.name}
      </p>
      
      <div className="space-y-4 mb-6">
        {worldCharacters.map(character => (
          <button
            key={character.id}
            onClick={() => onNext(character.id)}
            className="w-full text-left p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-gray-900">{character.name}</h4>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {character.background.history || 'No description available'}
                </p>
              </div>
              <span className="text-blue-600 ml-4">
                Select →
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <button
          onClick={onBack}
          className="text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
        <Link
          href="/characters/create"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Create New Character
        </Link>
      </div>
    </div>
  );
}