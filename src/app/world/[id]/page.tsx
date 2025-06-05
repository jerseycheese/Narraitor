'use client';

import { useParams, useRouter } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
// import Link from 'next/link';
import Image from 'next/image';
import { WorldDetailsDisplay } from '@/components/world/WorldDetailsDisplay';
import { NotFoundState } from '@/components/shared/NotFoundState';
import { BackNavigation } from '@/components/shared/BackNavigation';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';

export default function WorldViewPage() {
  const params = useParams();
  const router = useRouter();
  const worldId = params.id as string;
  const world = useWorldStore((state) => state.worlds[worldId]);
  const characters = useCharacterStore((state) => state.characters);
  
  // Check if this world has any characters
  const worldCharacters = Object.values(characters).filter(char => char.worldId === worldId);

  if (!world) {
    return (
      <NotFoundState
        title="World Not Found"
        message="The world you're looking for doesn't exist."
        backUrl="/worlds"
        backLabel="Back to Worlds"
      />
    );
  }

  const handlePlayInWorld = () => {
    if (worldCharacters.length === 0) {
      // No characters in this world, redirect to characters page
      router.push(`/characters?worldId=${worldId}`);
    } else {
      // Has characters, go to play page
      router.push(`/world/${worldId}/play`);
    }
  };

  const actionButtons = [
    {
      label: 'Edit World',
      onClick: () => router.push(`/world/${worldId}/edit`),
      variant: 'primary' as const
    },
    {
      label: 'Play in World',
      onClick: handlePlayInWorld,
      variant: 'success' as const
    },
    {
      label: 'View Characters',
      onClick: () => router.push(`/characters?worldId=${worldId}`),
      variant: 'primary' as const
    }
  ];

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <BackNavigation href="/worlds" label="Back to Worlds" />
        </div>

        {/* Hero Image */}
        {world.image?.url && (
          <div className="mb-8 rounded-lg overflow-hidden shadow-lg">
            <Image 
              src={world.image.url} 
              alt={`${world.name} world`}
              width={800}
              height={400}
              className="w-full h-64 md:h-96 object-cover"
            />
          </div>
        )}

        <header className="mb-6">
          <h1 className="text-4xl font-bold mb-4">{world.name}</h1>
          {world.theme && (
            <span className="px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-full">
              {world.theme.charAt(0).toUpperCase() + world.theme.slice(1)}
            </span>
          )}
        </header>

        <ActionButtonGroup actions={actionButtons} className="mb-8" />

        <WorldDetailsDisplay world={world} />
      </div>
    </main>
  );
}
