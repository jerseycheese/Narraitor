'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { characterStore } from '@/state/characterStore';
import { CharacterPortrait } from '@/components/CharacterPortrait';

export default function CharacterViewPage() {
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
              The character you're looking for doesn't exist or has been deleted.
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
            onClick={() => router.push('/characters')}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
          >
            <span>←</span> Back to Characters
          </button>
        </div>

        {/* Character Info Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-start gap-6 mb-8">
            <CharacterPortrait
              portrait={character.portrait || { type: 'placeholder', url: null }}
              characterName={character.name}
              size="large"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-bold mb-2">{character.name}</h1>
              <p className="text-gray-600 mb-4">Level {character.level}</p>
              <div className="space-y-2">
                <p className="text-sm text-gray-500">
                  <strong>Created:</strong> {new Date(character.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  <strong>World:</strong> {character.worldId}
                </p>
              </div>
            </div>
          </div>

          {/* Placeholder content */}
          <div className="border-t pt-8">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-semibold text-blue-800 mb-2">
                Character Sheet Coming Soon
              </h2>
              <p className="text-blue-700">
                This page will display full character details including attributes, skills, 
                background, inventory, and more.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => router.push(`/characters/${characterId}/edit`)}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Edit Character
            </button>
            <button
              onClick={() => router.push(`/world/${character.worldId}/play`)}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Play with Character
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}