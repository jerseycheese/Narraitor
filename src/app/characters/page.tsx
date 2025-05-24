'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { characterStore } from '@/state/characterStore';
import { worldStore } from '@/state/worldStore';

export default function CharactersPage() {
  const router = useRouter();
  const { characters, currentCharacterId, setCurrentCharacter, deleteCharacter } = characterStore();
  const { worlds, currentWorldId } = worldStore();
  
  const currentWorld = currentWorldId ? worlds[currentWorldId] : null;
  const worldCharacters = Object.values(characters).filter(
    char => char.worldId === currentWorldId
  );

  const handleCreateCharacter = () => {
    router.push('/characters/create');
  };

  const handleSelectCharacter = (characterId: string) => {
    setCurrentCharacter(characterId);
  };

  const handleViewCharacter = (characterId: string) => {
    router.push(`/characters/${characterId}`);
  };

  const handleDeleteCharacter = (characterId: string) => {
    if (confirm('Are you sure you want to delete this character?')) {
      deleteCharacter(characterId);
    }
  };

  if (!currentWorldId || !currentWorld) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Characters</h1>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2">Choose Your World</h2>
            <p className="text-gray-600 mb-6">
              Characters belong to specific worlds. Select or create a world first to begin creating characters for that setting.
            </p>
            <button
              onClick={() => router.push('/worlds')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors shadow-md hover:shadow-lg"
            >
              Go to Worlds
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Each world has unique attributes, skills, and themes that shape your characters
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Characters</h1>
            <p className="text-gray-600 mt-2">World: {currentWorld.name}</p>
          </div>
          <button
            onClick={handleCreateCharacter}
            className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Create Character
          </button>
        </div>

        {worldCharacters.length === 0 ? (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center max-w-2xl mx-auto">
            <div className="mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold mb-2">Ready to bring {currentWorld.name} to life?</h2>
              <p className="text-gray-600 mb-2">
                Your world is set up and waiting for heroes, villains, and everyone in between.
              </p>
              <p className="text-gray-500 text-sm">
                Create characters to explore your world and start their adventures!
              </p>
            </div>
            <button
              onClick={handleCreateCharacter}
              className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 text-lg font-semibold transition-colors shadow-md hover:shadow-lg"
            >
              Create Your First Character
            </button>
            <div className="mt-6 text-sm text-gray-500">
              <p>Each character starts with:</p>
              <ul className="mt-2 space-y-1">
                <li>• Custom attributes based on {currentWorld.name}&apos;s rules</li>
                <li>• Unique skills from your world&apos;s skill system</li>
                <li>• A rich backstory and personality</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {worldCharacters.map(character => (
              <div
                key={character.id}
                className={`bg-white rounded-lg shadow p-6 cursor-pointer transition-all ${
                  currentCharacterId === character.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => handleSelectCharacter(character.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold">{character.name}</h3>
                  <span className="text-sm text-gray-500">Level {character.level}</span>
                </div>
                
                <p className="text-gray-600 mb-4 line-clamp-2">
                  {character.background.description || 'No description provided'}
                </p>
                
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewCharacter(character.id);
                    }}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    View
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCharacter(character.id);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}