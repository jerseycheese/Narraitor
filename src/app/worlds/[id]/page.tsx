'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Play, Users, Settings } from 'lucide-react';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore, type StoreCharacter } from '@/state/characterStore';
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
  const characters = useCharacterStore((state) => state.characters);

  const worldCharacters = Object.values(characters).filter((char): char is StoreCharacter => char.worldId === worldId);
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
      variant: 'secondary' as const,
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
      description={world.genre ? getGenreLabel(world.genre) : undefined}
      actions={
        <ActionButtonGroup
          actions={actionButtons.map(btn => ({
            ...btn,
            flex: btn.variant === 'success'
          }))}
          layout="horizontal"
          gap="sm"
        />
      }
    >
      {/* Decorative image banner; the page h1 above already carries the world
          name, so the hero repeats neither title nor genre (#1542) */}
      {world.image?.url && (
        <div className="world-detail-hero">
          <Hero
            image={{
              url: world.image.url,
              alt: `${world.name} world`
            }}
          />
        </div>
      )}

      <section className="world-detail-body" aria-label="World details">
        <WorldDetailsDisplay world={world} />
      </section>
    </PageLayout>
  );
}
