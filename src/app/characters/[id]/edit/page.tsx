'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useCharacterStore } from '@/state/characterStore';
import { CharacterEditor } from '@/components/CharacterEditor';
import { NotFoundState } from '@/components/shared/NotFoundState';
import { PageLayout } from '@/components/shared/PageLayout';
import { BackNavigation } from '@/components/shared/BackNavigation';

export default function CharacterEditPage() {
  const params = useParams();
  const characterId = params.id as string;
  const { characters } = useCharacterStore();
  const [mounted, setMounted] = useState(false);
  const character = characters[characterId];

  useEffect(() => setMounted(true), []);

  // Keep SSR and first client paint identical; decide after hydration
  if (!mounted) {
    return (
      <PageLayout>
        <div />
      </PageLayout>
    );
  }

  if (!character) {
    return (
      <NotFoundState
        title="Character Not Found"
        message="The character you're trying to edit doesn't exist or has been deleted."
        backUrl="/characters"
        backLabel="Back to Characters"
      />
    );
  }

  return (
    <PageLayout title={`Edit Character: ${character.name}`}>
      {/* Header with back button */}
      <BackNavigation href={`/characters/${characterId}`} label="Back to Character" />

      <CharacterEditor characterId={characterId} />
    </PageLayout>
  );
}
