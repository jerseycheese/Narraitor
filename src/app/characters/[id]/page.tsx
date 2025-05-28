'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { characterStore } from '@/state/characterStore';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { CharacterAttributeDisplay } from '@/components/characters/CharacterAttributeDisplay';
import { CharacterSkillDisplay } from '@/components/characters/CharacterSkillDisplay';
import { CharacterBackgroundDisplay } from '@/components/characters/CharacterBackgroundDisplay';

export default function CharacterViewPage() {
  const params = useParams();
  const router = useRouter();
  const characterId = params.id as string;
  const { characters, setCurrentCharacter, deleteCharacter } = characterStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const character = characters[characterId];

  const handleDelete = () => {
    deleteCharacter(characterId);
    router.push('/characters');
  };

  if (!character) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Character Not Found</h1>
            <p className="text-gray-600 mb-6">
              The character you&apos;re looking for doesn&apos;t exist or has been deleted.
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

          {/* Character Details Sections */}
          <div className="border-t pt-8 space-y-8">
            {/* Character Attributes */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Attributes</h2>
              <CharacterAttributeDisplay 
                attributes={character.attributes} 
                showCategories={true} 
              />
            </section>

            {/* Character Skills */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Skills</h2>
              <CharacterSkillDisplay 
                skills={character.skills} 
                showCategories={true} 
              />
            </section>

            {/* Character Background */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Background</h2>
              <CharacterBackgroundDisplay background={character.background} />
            </section>
          </div>

          {/* Action buttons */}
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => router.push(`/characters/${characterId}/edit`)}
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
            >
              Edit Character
            </button>
            <button
              onClick={() => {
                // Set this character as the current character before playing
                setCurrentCharacter(characterId);
                router.push(`/world/${character.worldId}/play`);
              }}
              className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 cursor-pointer"
            >
              Play with Character
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 cursor-pointer"
            >
              Delete Character
            </button>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Character"
        description={`Are you sure you want to delete "${character.name}"? This action cannot be undone.`}
        itemName={character.name}
        confirmButtonText="Delete"
        cancelButtonText="Cancel"
      />
    </div>
  );
}