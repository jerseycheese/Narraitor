'use client';

import React, { useState, useEffect } from 'react';
import { notFound, useParams, useSearchParams } from 'next/navigation';
import GameSession from '@/components/GameSession/GameSession';
import { PageLayout } from '@/components/shared/PageLayout';
import { Hero } from '@/components/shared/Hero';
import { useWorldStore } from '@/state/worldStore';
import { getGenreLabel } from '@/lib/constants/genres';

/**
 * Play page component that initializes a game session with a worldId
 */
export default function PlayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const worldId = params?.id as string;
  const [isClient, setIsClient] = useState(false);
  
  // Check for test data to support visual regression tests (guarded for SSR)
  // Always call hooks and use persisted store data
  const world = useWorldStore((state) => state.worlds[worldId]);
  
  // Check if this should be a fresh session (from "Start New Session" button)
  const disableAutoResume = searchParams?.get('fresh') === 'true';
  
  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // For server rendering, show a simple placeholder
  if (!isClient) {
    return (
      <PageLayout title="Game Session">
        <div className="p-4 text-center">
          <p>Creating your game...</p>
        </div>
      </PageLayout>
    );
  }
  
  // Validate worldId - client-side only
  if (!worldId || worldId.trim() === '') {
    notFound();
  }


  const pageTitle = world ? `Playing in ${world.name}` : 'Game Session';

  return (
    <PageLayout className="pb-0">
      {/* Ultra-thin world hero - always show with image or themed background */}
      {world && (
        <div className="mb-6">
          <Hero
            title={pageTitle}
            image={world.image?.url ? {
              url: world.image.url,
              alt: `${world.name} world`
            } : undefined}
            theme={(world.genre as 'fantasy' | 'sci-fi' | 'modern' | 'historical' | 'horror' | 'mystery' | 'western' | 'cyberpunk' | 'other') || 'default'}
            subtitle={world.genre ? getGenreLabel(world.genre) : undefined}
            height="h-20 sm:h-24"
            titleElement="h1"
            actions={
              <div className="hidden sm:flex flex-row gap-2">
                <button
                  type="button"
                  className="px-2 py-1 text-xs bg-white/90 text-gray-900 rounded hover:bg-white"
                  onClick={() => window.dispatchEvent(new Event('narraitor:new-session'))}
                >
                  Start New
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs bg-blue-700 text-white rounded hover:bg-blue-700/90"
                  onClick={() => window.dispatchEvent(new Event('narraitor:end-story'))}
                >
                  End Story
                </button>
                <button
                  type="button"
                  className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={() => window.dispatchEvent(new Event('narraitor:end-session'))}
                >
                  End Session
                </button>
              </div>
            }
          />
        </div>
      )}
      
      <GameSession worldId={worldId} disableAutoResume={disableAutoResume} />
    </PageLayout>
  );
}
