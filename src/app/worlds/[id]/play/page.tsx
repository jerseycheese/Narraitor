'use client';

import React, { useState, useEffect } from 'react';
import { notFound, useParams, useSearchParams, useRouter } from 'next/navigation';
import GameSession from '@/components/GameSession/GameSession';
import { Button } from '@/components/ui/button';
import { useWorldStore } from '@/state/worldStore';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { ArrowLeft } from 'lucide-react';
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
      <div className="flex items-center justify-center min-h-screen">
        <p>Creating your game...</p>
      </div>
    );
  }
  
  // Validate worldId - client-side only
  if (!worldId || worldId.trim() === '') {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal immersive header for manuscript layout */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 flex items-center px-4 bg-background/50 backdrop-blur-sm pointer-events-none">
        <Button
          variant="ghost"
          size="sm"
          className="pointer-events-auto rounded-full group"
          onClick={() => router.push(`/worlds/${worldId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          <span className="font-medium truncate max-w-[200px]">
            {world?.name || 'Back'}
          </span>
        </Button>
      </header>

      <GameSession 
        worldId={worldId} 
        disableAutoResume={disableAutoResume}
        onStartNew={handleStartNewClick}
      />

      {/* Confirmation dialog for starting new session */}
      <GameSessionConfirmationDialog
        isOpen={showStartNewConfirmation}
        onClose={() => setShowStartNewConfirmation(false)}
        onConfirm={handleConfirmedStartNew}
        type="start-new"
        currentProgress={currentProgress}
      />
    </div>
  );
}
