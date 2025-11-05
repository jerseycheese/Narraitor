'use client';

import React, { useState, useEffect } from 'react';
import { notFound, useParams, useSearchParams, useRouter } from 'next/navigation';
import GameSession from '@/components/GameSession/GameSession';
import { PageLayout } from '@/components/shared/PageLayout';
import { Hero } from '@/components/shared/Hero';
import { Button } from '@/components/ui/button';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { getGenreLabel } from '@/lib/constants/genres';
import { GameSessionConfirmationDialog } from '@/components/GameSession/GameSessionConfirmationDialog';

/**
 * Play page component that initializes a game session with a worldId
 */
export default function PlayPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const worldId = params?.id as string;
  const [isClient, setIsClient] = useState(false);
  const [showStartNewConfirmation, setShowStartNewConfirmation] = useState(false);

  // Check for test data to support visual regression tests (guarded for SSR)
  // Always call hooks and use persisted store data
  const world = useWorldStore((state) => state.worlds[worldId]);
  const currentSessionId = useSessionStore((state) => state.id);
  const { getSessionSegments } = useNarrativeStore();

  // Check if this should be a fresh session (from "Start New Session" button)
  const disableAutoResume = searchParams?.get('fresh') === 'true';

  // Get current session progress for confirmation dialog
  const currentProgress = currentSessionId ? getSessionSegments(currentSessionId).length : 0;

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle Start New button click with confirmation
  const handleStartNewClick = () => {
    if (currentProgress > 0) {
      setShowStartNewConfirmation(true);
    } else {
      // No progress to lose, directly start new session
      router.push(`/worlds/${worldId}/play?fresh=true`);
    }
  };

  // Handle confirmed start new session
  const handleConfirmedStartNew = () => {
    setShowStartNewConfirmation(false);
    router.push(`/worlds/${worldId}/play?fresh=true`);
  };
  
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
                <Button size="sm" variant="outline" onClick={() => router.push(`/characters?worldId=${worldId}`)}>
                  Switch Character
                </Button>
                <Button size="sm" variant="default" onClick={handleStartNewClick}>
                  Start New
                </Button>
                <Button size="sm" variant="secondary" onClick={() => window.dispatchEvent(new Event('narraitor:end-story'))}>
                  End Story
                </Button>
                <Button size="sm" variant="destructive" onClick={() => window.dispatchEvent(new Event('narraitor:end-session'))}>
                  End Session
                </Button>
              </div>
            }
          />
        </div>
      )}

      <GameSession worldId={worldId} disableAutoResume={disableAutoResume} />

      {/* Confirmation dialog for starting new session */}
      <GameSessionConfirmationDialog
        isOpen={showStartNewConfirmation}
        onClose={() => setShowStartNewConfirmation(false)}
        onConfirm={handleConfirmedStartNew}
        type="start-new"
        currentProgress={currentProgress}
      />
    </PageLayout>
  );
}
