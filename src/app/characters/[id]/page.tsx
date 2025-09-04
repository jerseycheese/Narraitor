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
import { Hero } from '@/components/shared/Hero';
import { getGenreLabel } from '@/lib/constants/genres';

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
      variant: 'primary' as const,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      )
    },
    {
      label: 'Play with Character',
      onClick: () => {
        setCurrentCharacter(characterId);
        router.push(`/worlds/${character.worldId}/play`);
      },
      variant: 'success' as const,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'Delete Character',
      onClick: () => setShowDeleteDialog(true),
      variant: 'danger' as const,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0016.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      )
    }
  ];

  return (
    <PageLayout>
      {/* Ultra-thin world hero */}
      {world.image?.url && (
        <div className="mb-6">
          <Hero
            title={character.name}
            image={{
              url: world.image.url,
              alt: `${world.name} world`
            }}
            subtitle={`${character.level ? `Level ${character.level} • ` : ''}${world.name}${world.genre ? ` • ${getGenreLabel(world.genre)}` : ''}`}
            height="h-20 sm:h-24"
            titleElement="h1"
          />
        </div>
      )}

      {/* Back navigation for pages without world image */}
      {!world.image?.url && (
        <div className="mb-6">
          <BackNavigation href="/characters" label="Back to Characters" />
        </div>
      )}

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
