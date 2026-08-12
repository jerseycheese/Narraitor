'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { notFound, useParams, useSearchParams, useRouter } from 'next/navigation';
import { useSessionStore } from '@/state/sessionStore';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useWorldStore } from '@/state/worldStore';
import { GameSessionConfirmationDialog } from '@/components/GameSession/GameSessionConfirmationDialog';
import { ProviderGate } from '@/components/ai/ProviderGate';
import { trackFunnelStep } from '@/lib/analytics/trackFunnelStep';

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
  const worldName = useWorldStore((state) => state.worlds[worldId]?.name);
  // ActiveGameSession swaps to the ending screen whenever currentEnding is
  // set, so the page heading tracks the same store field to stay in sync.
  const currentEnding = useNarrativeStore((state) => state.currentEnding);

  // Check if this should be a fresh session (from "Start New Session" button)
  const disableAutoResume = searchParams?.get('fresh') === 'true';

  const currentProgress = currentSessionId ? getSessionSegments(currentSessionId).length : 0;

  // Set isClient to true once component mounts
  useEffect(() => {
    setIsClient(true);
  }, []);

  // session-ended: fires when the player leaves an active session. Covers
  // three exit paths, since no single one is reliable on its own:
  //   - beforeunload: tab close/reload on desktop
  //   - visibilitychange (hidden): backgrounding on mobile, where the OS can
  //     kill the page before beforeunload or unmount ever runs
  //   - unmount: navigating away from the play route in-app
  // The listeners are set up once, so they read the latest session/ending
  // state off a ref rather than closing over stale React state. A "fired"
  // ref dedupes across the three paths so a single exit (e.g. background
  // then later unmount) only reports once. Reaching an ending already
  // reports its own session-ended event (narrativeStore's markSessionEnded),
  // so this skips firing when an ending is already set.
  const sessionEndTrackingRef = useRef({ currentSessionId, currentEnding });
  useEffect(() => {
    sessionEndTrackingRef.current = { currentSessionId, currentEnding };
  }, [currentSessionId, currentEnding]);

  useEffect(() => {
    const hasFiredRef = { current: false };

    const trackSessionEndedIfActive = () => {
      if (hasFiredRef.current) return;
      const { currentSessionId, currentEnding } = sessionEndTrackingRef.current;
      if (currentSessionId && !currentEnding) {
        hasFiredRef.current = true;
        trackFunnelStep('session-ended');
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        trackSessionEndedIfActive();
      }
    };

    window.addEventListener('beforeunload', trackSessionEndedIfActive);
    window.addEventListener('pagehide', trackSessionEndedIfActive);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', trackSessionEndedIfActive);
      window.removeEventListener('pagehide', trackSessionEndedIfActive);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      trackSessionEndedIfActive();
    };
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

  const pageHeading = currentEnding
    ? 'Story Complete'
    : worldName
      ? `Playing in ${worldName}`
      : 'Game Session';

  return (
    <div className="manuscript-play-page">
      {/* The immersive play shell is deliberately chrome-free, so the
          page-level heading is screen-reader-only (#1532). */}
      <h1 className="sr-only manuscript-play-page-title">{pageHeading}</h1>

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
