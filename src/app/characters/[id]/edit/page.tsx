'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { characterStore } from '@/state/characterStore';
import { CharacterEditor } from '@/components/CharacterEditor';

export default function CharacterEditPage() {
  const params = useParams();
  const router = useRouter();
  const characterId = params.id as string;
  const { characters } = characterStore();
  
  const character = characters[characterId];

  if (!character) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Character Not Found</h1>
            <p className="text-gray-600 mb-6">
              The character you&apos;re trying to edit doesn&apos;t exist or has been deleted.
            </p>
            <button
              onClick={() => router.push('/characters')}
              className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
            >
              Back to Characters
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header with back button */}
        <div className="mb-6">
          <button
            onClick={() => router.push(`/characters/${characterId}`)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 cursor-pointer"
          >
            <span>←</span> Back to Character
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-8">Edit Character: {character.name}</h1>

        <CharacterEditor characterId={characterId} />
      </div>
    </div>
  );
}
