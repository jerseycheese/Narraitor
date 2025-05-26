'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { characterStore } from '@/state/characterStore';

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
              The character you're trying to edit doesn't exist or has been deleted.
            </p>
            <button
              onClick={() => router.push('/characters')}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
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
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <span>←</span> Back to Character
          </button>
        </div>

        <h1 className="text-3xl font-bold mb-8">Edit Character: {character.name}</h1>

        {/* Placeholder content */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-amber-800 mb-2">
              Character Editing Coming Soon
            </h2>
            <p className="text-amber-700 mb-4">
              This feature will allow you to modify your character's attributes, skills, 
              background, and other details.
            </p>
            <p className="text-sm text-amber-600">
              Track progress on GitHub issue #254: "Edit existing characters for enhanced player experience"
            </p>
          </div>

          <div className="mt-8 flex gap-4 justify-center">
            <button
              onClick={() => router.push(`/characters/${characterId}`)}
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}