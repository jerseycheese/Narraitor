'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { NotFoundState } from '@/components/shared/NotFoundState';
import { BackNavigation } from '@/components/shared/BackNavigation';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';
import { CharacterHeader } from '@/components/characters/CharacterHeader';
import { CharacterDetailsDisplay } from '@/components/characters/CharacterDetailsDisplay';
import { PageLayout } from '@/components/shared/PageLayout';

export default function CharacterViewPage() {
  const params = useParams();
  const router = useRouter();
  const characterId = params.id as string;
  const { characters, setCurrentCharacter, deleteCharacter } = useCharacterStore();
  const { worlds } = useWorldStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const character = characters[characterId];
  const world = character ? worlds[character.worldId] : null;

  const handleDelete = () => {
    deleteCharacter(characterId);
    router.push('/characters');
  };


  if (!character || !world) {
    return (
      <NotFoundState
        title="Character Not Found"
        message="The character you're looking for doesn't exist or has been deleted."
        backUrl="/characters"
        backLabel="Back to Characters"
      />
    );
  }

  const actionButtons = [
    {
      label: 'Edit Character',
      onClick: () => router.push(`/characters/${characterId}/edit`),
      variant: 'primary' as const
    },
    {
      label: 'Play with Character',
      onClick: () => {
        setCurrentCharacter(characterId);
        router.push(`/world/${character.worldId}/play`);
      },
      variant: 'success' as const
    },
    {
      label: 'Delete Character',
      onClick: () => setShowDeleteDialog(true),
      variant: 'danger' as const
    }
  ];

  return (
    <PageLayout title={character.name} description={`${character.level ? `Level ${character.level} • ` : ''}${world.name}`}>
      <div className="mb-6 -mt-8">
        <BackNavigation href="/characters" label="Back to Characters" />
      </div>

      <ActionButtonGroup actions={actionButtons} className="mb-6" />

      <div className="bg-white rounded-lg shadow-lg p-8">
        <CharacterHeader character={character} world={world} />
        <CharacterDetailsDisplay character={character} world={world} />
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
    </PageLayout>
  );
}
