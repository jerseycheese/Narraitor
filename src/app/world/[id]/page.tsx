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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const characters = useCharacterStore((state: any) => state.characters);
  
  // Check if this world has any characters
  const worldCharacters = (Object.values(characters) as Character[]).filter(char => char.worldId === worldId);

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

  // Map world genre to theme for background
  const getThemeFromGenre = (genre?: string) => {
    if (!genre) return 'default';
    switch (genre.toLowerCase()) {
      case 'fantasy': return 'fantasy';
      case 'sci-fi': 
      case 'science fiction': 
      case 'cyberpunk': return 'sci-fi';
      case 'western': return 'western';
      case 'horror': 
      case 'thriller': return 'horror';
      case 'modern':
      case 'contemporary': return 'modern';
      default: return 'default';
    }
  };

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
          theme={getThemeFromGenre(world.genre)}
          height="h-64 md:h-96"
        />
      </div>

      <ActionButtonGroup actions={actionButtons} className="mb-8" />

      <WorldDetailsDisplay world={world} />
    </PageLayout>
  );
}
