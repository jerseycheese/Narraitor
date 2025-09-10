'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCharacterStore } from '@/state/characterStore';
import { CharacterEditor } from '@/components/CharacterEditor';
import { NotFoundState } from '@/components/shared/NotFoundState';
import { PageLayout } from '@/components/shared/PageLayout';

export default function CharacterEditPage() {
  const params = useParams();
  const router = useRouter();
  const characterId = params.id as string;
  const { characters } = useCharacterStore();
  const [mounted, setMounted] = useState(false);
  const character = characters[characterId];

  useEffect(() => setMounted(true), []);

  // Keep SSR and first client paint identical; decide after hydration
  if (!mounted) {
    return (
      <PageLayout>
        <div className="mb-6" />
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
    <PageLayout 
      title={`Edit Character: ${character.name}`}
      className="bg-gray-100"
    >
      {/* Header with back button */}
      <div className="mb-6">
        <button
          onClick={() => router.push(`/characters/${characterId}`)}
          className="text-link-primary flex items-center gap-2 cursor-pointer"
        >
          <span>←</span> Back to Character
        </button>
      </div>

      <CharacterEditor characterId={characterId} />
    </PageLayout>
  );
}
