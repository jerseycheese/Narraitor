'use client';

import { useParams, useRouter } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore, type Character } from '@/state/characterStore';
import { WorldDetailsDisplay } from '@/components/world/WorldDetailsDisplay';
import { NotFoundState } from '@/components/shared/NotFoundState';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';
import { PageLayout } from '@/components/shared/PageLayout';
import { Hero } from '@/components/shared/Hero';
import { getGenreLabel } from '@/lib/constants/genres';

export default function WorldViewPage() {
  const params = useParams();
  const router = useRouter();
  const worldId = params.id as string;
  const world = useWorldStore((state) => state.worlds[worldId]);
  const currentWorldId = useWorldStore((state) => state.currentWorldId);
  const setCurrentWorld = useWorldStore((state) => state.setCurrentWorld);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const characters = useCharacterStore((state: any) => state.characters);
  
  // Check if this world has any characters
  const worldCharacters = (Object.values(characters) as Character[]).filter(char => char.worldId === worldId);
  const isActive = currentWorldId === worldId;

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
      router.push(`/worlds/${worldId}/play`);
    }
  };

  const handleMakeActive = () => {
    setCurrentWorld(worldId);
  };

  const actionButtons = [
    // Only show Make Active button if world is not currently active
    ...(!isActive ? [{
      label: 'Make Active',
      onClick: handleMakeActive,
      variant: 'secondary' as const
    }] : []),
    {
      label: 'View Characters',
      onClick: () => router.push(`/characters?worldId=${worldId}`),
      variant: 'primary' as const
    },
    {
      label: 'Edit World',
      onClick: () => router.push(`/worlds/${worldId}/edit`),
      variant: 'secondary' as const
    },
    {
      label: 'Play in World',
      onClick: handlePlayInWorld,
      variant: 'success' as const,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];


  return (
    <PageLayout>
      {/* Hero section with image or themed background */}
      <div className="mb-8">
        <Hero
          title={world.name}
          image={world.image?.url ? {
            url: world.image.url,
            alt: `${world.name} world`
          } : undefined}
          subtitle={world.genre ? getGenreLabel(world.genre) : undefined}
          theme={(world.genre as 'fantasy' | 'sci-fi' | 'modern' | 'historical' | 'horror' | 'mystery' | 'western' | 'cyberpunk' | 'other') || 'default'}
          height="h-64 md:h-96"
        />
      </div>

      <ActionButtonGroup actions={actionButtons} className="mb-8" />

      <WorldDetailsDisplay world={world} />
    </PageLayout>
  );
}
