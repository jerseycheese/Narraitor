'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { characterStore } from '@/state/characterStore';
import { worldStore } from '@/state/worldStore';
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
  const { worlds } = worldStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const character = characters[characterId];
  const world = character ? worlds[character.worldId] : null;

  const handleDelete = () => {
    deleteCharacter(characterId);
    router.push('/characters');
  };


  if (!character || !world) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Character Not Found</h1>
            <p className="text-gray-600 mb-6">
              The character you&apos;re looking for doesn&apos;t exist or has been deleted.
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

  // Helper function to properly display character attributes
  const repairCharacterAttributes = () => {
    // Character attributes from store already have the correct structure
    return character.attributes.map((charAttr) => {
      // Find matching world attribute by ID first (safer), then fallback to name
      const worldAttr = charAttr.worldAttributeId 
        ? world.attributes.find(wa => wa.id === charAttr.worldAttributeId)
        : world.attributes.find(wa => wa.name === charAttr.name);
      return {
        id: charAttr.id,
        characterId: character.id,
        name: charAttr.name,
        baseValue: charAttr.baseValue,
        modifiedValue: charAttr.modifiedValue,
        category: charAttr.category || worldAttr?.category || 'General'
      };
    });
  };

  // Enrich character attributes with world attribute data
  const enrichedAttributes = repairCharacterAttributes();

  // Helper function to properly display character skills
  const repairCharacterSkills = () => {
    // Character skills from store already have the correct structure
    return character.skills.map((charSkill) => {
      // Find matching world skill by ID first (safer), then fallback to name
      const worldSkill = charSkill.worldSkillId 
        ? world.skills.find(ws => ws.id === charSkill.worldSkillId)
        : world.skills.find(ws => ws.name === charSkill.name);
      return {
        id: charSkill.id,
        characterId: character.id,
        name: charSkill.name,
        level: charSkill.level,
        category: charSkill.category || worldSkill?.category || 'General',
        difficulty: worldSkill?.difficulty || 'medium' as const
      };
    });
  };

  // Enrich character skills with world skill data
  const enrichedSkills = repairCharacterSkills();

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
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

        {/* Action buttons */}
        <div className="mb-6 flex gap-3">
          <button
            onClick={() => router.push(`/characters/${characterId}/edit`)}
            className="px-4 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium transition-colors"
          >
            Edit Character
          </button>
          <button
            onClick={() => {
              // Set this character as the current character before playing
              setCurrentCharacter(characterId);
              router.push(`/world/${character.worldId}/play`);
            }}
            className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium transition-colors"
          >
            Play with Character
          </button>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="px-4 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium transition-colors"
          >
            Delete Character
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

          {/* Character Details Sections */}
          <div className="border-t pt-8 space-y-8">
            {/* Character Attributes */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Attributes</h2>
              <CharacterAttributeDisplay 
                attributes={enrichedAttributes} 
                showCategories={true} 
              />
            </section>

            {/* Character Skills */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Skills</h2>
              <CharacterSkillDisplay 
                skills={enrichedSkills} 
                showCategories={true} 
              />
            </section>

            {/* Character Background */}
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800">Background</h2>
              <CharacterBackgroundDisplay background={character.background} />
            </section>
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