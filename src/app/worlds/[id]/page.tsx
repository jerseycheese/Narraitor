'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Play, Users, Settings } from 'lucide-react';
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
  const [mounted, setMounted] = useState(false);
  const world = useWorldStore((state) => state.worlds[worldId]);
  const currentWorldId = useWorldStore((state) => state.currentWorldId);
  const setCurrentWorld = useWorldStore((state) => state.setCurrentWorld);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const characters = useCharacterStore((state: any) => state.characters);
  
  // Check if this world has any characters
  const worldCharacters = (Object.values(characters) as Character[]).filter(char => char.worldId === worldId);
  const isActive = currentWorldId === worldId;

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    // Keep SSR/client markup stable; decide after hydration
    return (
      <PageLayout>
        <div />
      </PageLayout>
    );
  }

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
      variant: 'primary' as const,
      icon: (
        <Users aria-hidden="true" />
      )
    },
    {
      label: 'Edit World',
      onClick: () => router.push(`/worlds/${worldId}/edit`),
      variant: 'secondary' as const,
      icon: (
        <Settings aria-hidden="true" />
      )
    },
    {
      label: 'Play in World',
      onClick: handlePlayInWorld,
      variant: 'success' as const,
      icon: (
        <Play aria-hidden="true" />
      )
    }
  ];


  return (
    <PageLayout
      title={world.name}
      description={world.description || world.genre ? getGenreLabel(world.genre) : undefined}
      actions={
        <ActionButtonGroup 
          actions={actionButtons.map(btn => ({
            ...btn,
            flex: btn.variant === 'primary' || btn.variant === 'success'
          }))} 
          layout="horizontal" 
          gap="sm" 
        />
      }
    >
      {/* Hero section with image or themed background */}
      <div className="world-detail-hero">
        <Hero
          title={world.name}
          image={world.image?.url ? {
            url: world.image.url,
            alt: `${world.name} world`
          } : undefined}
          subtitle={world.genre ? getGenreLabel(world.genre) : undefined}
          theme={(world.genre as 'fantasy' | 'sci-fi' | 'modern' | 'historical' | 'horror' | 'mystery' | 'western' | 'cyberpunk' | 'other') || 'default'}
        />
      </div>

      <section className="world-detail-body" aria-label="World details">
        <WorldDetailsDisplay world={world} />
      </section>
    </PageLayout>
  );
}
