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
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 mb-4">Please select a world first to view characters.</p>
            <button
              onClick={() => router.push('/worlds')}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Go to Worlds
            </button>
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
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 mb-4">No characters yet in this world.</p>
            <p className="text-gray-500 mb-6">Create your first character to begin your adventure!</p>
            <button
              onClick={handleCreateCharacter}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create Your First Character
            </button>
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