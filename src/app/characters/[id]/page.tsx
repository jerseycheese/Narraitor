'use client';

import React, { useEffect, useState } from 'react';
import { Pencil, Play, Trash } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
  const { characters, setCurrentCharacter, deleteCharacter } =
    useCharacterStore();
  const { worlds } = useWorldStore();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const [mounted, setMounted] = useState(false);
  const character = characters[characterId];
  const world = character ? worlds[character.worldId] : null;

  useEffect(() => setMounted(true), []);

  const handleDelete = async () => {
    await deleteCharacter(characterId);
    router.push('/characters');
  };

  if (!mounted) {
    // Preserve SSR/client markup; decide what to show after hydration
    return (
      <PageLayout>
        <div />
      </PageLayout>
    );
  }

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
      variant: 'secondary' as const,
      icon: <Pencil aria-hidden="true" />,
    },
    {
      label: 'Play with Character',
      onClick: () => {
        setCurrentCharacter(characterId);
        router.push(`/worlds/${character.worldId}/play`);
      },
      variant: 'default' as const,
      icon: <Play aria-hidden="true" />,
    },
    {
      label: 'Delete Character',
      onClick: () => setShowDeleteDialog(true),
      variant: 'danger-outline' as const,
      icon: <Trash aria-hidden="true" />,
    },
  ];

  const worldKicker = (
    <div className="characters-world-kicker" data-testid="characters-world-kicker">
      <Link
        href={`/worlds/${world.id}`}
        className="characters-world-kicker-link"
      >
        <span className="characters-kicker-prefix">WORLD: </span>
        <span className="characters-kicker-name">{world.name}</span>
      </Link>
      {world.genre && (
        <>
          <span className="characters-kicker-dot" aria-hidden="true">
            ·
          </span>
          <span className="characters-kicker-genre">
            {getGenreLabel(world.genre)}
          </span>
        </>
      )}
    </div>
  );

  const headerBackground = world.image?.url ? (
    <div className="characters-header-vignette character-detail-vignette" aria-hidden="true">
      <Hero
        image={{
          url: world.image.url,
          alt: '',
        }}
        treatment="ink"
      />
    </div>
  ) : null;

  return (
    <PageLayout
      title={character.name}
      kicker={worldKicker}
      description={`${character.level ? `Level ${character.level} • ` : ''}${world.name}${world.genre ? ` • ${getGenreLabel(world.genre)}` : ''}`}
      actions={
        <ActionButtonGroup 
          actions={actionButtons.map(btn => ({
            ...btn,
            flex: btn.variant === 'default'
          }))}
          layout="horizontal" 
          gap="sm" 
        />
      }
      headerBackground={headerBackground}
      headerClassName="characters-world-masthead character-detail-masthead"
    >
      <div className="character-detail-back">
        <BackNavigation href="/characters" label="Back to Characters" />
      </div>

      <div className="character-detail-body">
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
