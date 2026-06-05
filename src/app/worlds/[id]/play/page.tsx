'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { notFound, useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { GameSessionConfirmationDialog } from '@/components/GameSession/GameSessionConfirmationDialog';
import { ProviderGate } from '@/components/ai/ProviderGate';

// GameSession pulls the heaviest chain in the app (ActiveGameSession ->
// NarrativeController -> @google/genai + every drawer panel). The page already
// shows this same placeholder before it renders, so loading it on demand keeps
// the play route's first paint cheap without changing what the user sees.
const GameSession = dynamic(() => import('@/components/GameSession/GameSession'), {
  ssr: false,
  loading: () => (
    <div className="manuscript-play-page-loading">
      <p>Creating your game...</p>
    </div>
  ),
});

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
  const [showExitConfirmation, setShowExitConfirmation] = useState(false);

  // Check for test data to support visual regression tests (guarded for SSR)
  // Always call hooks and use persisted store data
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

  // Exit prompts confirmation only when there's narrative progress to abandon.
  // Auto-save means data isn't lost either way; the prompt just guards against
  // accidental clicks mid-story (issue #268).
  const handleBackClick = () => {
    if (currentProgress > 0) {
      setShowExitConfirmation(true);
    } else {
      router.push(`/worlds/${worldId}`);
    }
  };

  const handleConfirmedExit = () => {
    setShowExitConfirmation(false);
    router.push(`/worlds/${worldId}`);
  };
  
  // For server rendering, show a simple placeholder
  if (!isClient) {
    return (
      <div className="manuscript-play-page-loading">
        <p>Creating your game...</p>
      </div>
    );
  }
  
  // Validate worldId - client-side only
  if (!worldId || worldId.trim() === '') {
    notFound();
  }

  return (
    <div className="manuscript-play-page">
      <ProviderGate />

      <GameSession
        worldId={worldId}
        disableAutoResume={disableAutoResume}
        onStartNew={handleStartNewClick}
        onBack={handleBackClick}
      />

      {/* Confirmation dialog for starting new session */}
      <GameSessionConfirmationDialog
        isOpen={showStartNewConfirmation}
        onClose={() => setShowStartNewConfirmation(false)}
        onConfirm={handleConfirmedStartNew}
        type="start-new"
        currentProgress={currentProgress}
      />

      {/* Confirmation dialog for exiting the session mid-story */}
      <GameSessionConfirmationDialog
        isOpen={showExitConfirmation}
        onClose={() => setShowExitConfirmation(false)}
        onConfirm={handleConfirmedExit}
        type="exit"
        currentProgress={currentProgress}
      />
    </div>
  );
}
