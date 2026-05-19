'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import GameSession from '@/components/GameSession/GameSession';
import { LoadingPulse } from '@/components/ui/LoadingState';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { PageLayout } from '@/components/shared/PageLayout';
import { getGenreLabel } from '@/lib/constants/genres';
import { Button } from '@/components/ui/button';

type PersistApi = {
  persist?: {
    hasHydrated?: () => boolean;
    onFinishHydration?: (callback: () => void) => () => void;
  };
};

const getPersist = (store: unknown): PersistApi['persist'] =>
  (store as PersistApi).persist;

export default function PlayPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const currentWorldId = useWorldStore(state => state.currentWorldId);
  const currentWorld = useWorldStore(state => state.worlds[currentWorldId || '']);
  const currentCharacterId = useCharacterStore((state) => state.currentCharacterId);
  const initializeSession = useSessionStore(state => state.initializeSession);
  const currentSessionId = useSessionStore(state => state.id);

  // Wait for all three persisted stores to finish hydrating before reading
  // their values for redirect decisions. Reading pre-hydration causes a
  // redirect race that lands users on /worlds and surfaces a Next.js error.
  useEffect(() => {
    const persists = [
      getPersist(useWorldStore),
      getPersist(useCharacterStore),
      getPersist(useSessionStore),
    ];

    const allHydrated = persists.every(p => p?.hasHydrated?.() ?? true);
    if (allHydrated) {
      setHydrated(true);
      return;
    }

    let pending = persists.filter(p => p?.hasHydrated && !p.hasHydrated()).length;
    const unsubscribes: Array<() => void> = [];

    persists.forEach(p => {
      if (p?.onFinishHydration && p.hasHydrated && !p.hasHydrated()) {
        const unsub = p.onFinishHydration(() => {
          pending -= 1;
          if (pending <= 0) setHydrated(true);
        });
        unsubscribes.push(unsub);
      }
    });

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, []);

  useEffect(() => {
    if (!hydrated) return;

    const setupSession = async () => {
      try {
        // Check prerequisites
        if (!currentWorldId) {
          router.push('/worlds');
          return;
        }

        if (!currentCharacterId) {
          router.push('/characters');
          return;
        }

        // Initialize session if needed
        if (!currentSessionId) {
          await initializeSession(currentWorldId, currentCharacterId);
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Failed to initialize game session:', err);
        setError(err instanceof Error ? err.message : 'Failed to start game session');
        setIsLoading(false);
      }
    };

    setupSession();
  }, [hydrated, currentWorldId, currentCharacterId, currentSessionId, initializeSession, router]);

  if (!hydrated || isLoading) {
    return (
      <main className="play-page play-page-loading">
        <LoadingPulse message="Preparing your adventure..." />
      </main>
    );
  }

  if (error) {
    return (
      <div className="play-page play-page-shell play-page-shell-error">
        <PageLayout title="Game Session Error">
          <ErrorDisplay
            variant="section"
            title="Failed to Start Game"
            message={error}
            severity="error"
          />
          <div className="error-display-actions">
            <Button
              variant="outline"
              onClick={() => router.push('/worlds')}
            >
              Select World
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/characters')}
            >
              Select Character
            </Button>
          </div>
        </PageLayout>
      </div>
    );
  }

  if (!currentSessionId) {
    return (
      <div className="play-page play-page-shell play-page-shell-warning">
        <PageLayout title="No Active Session">
          <ErrorDisplay
            variant="section"
            title="No Active Session"
            message="Unable to create or resume a game session."
            severity="warning"
          />
        </PageLayout>
      </div>
    );
  }

  const pageTitle = currentWorld ? `Playing in ${currentWorld.name}` : 'Game Session';
  const pageDescription = currentWorld?.genre ? getGenreLabel(currentWorld.genre) : undefined;

  return (
    <div className="play-page play-page-active">
      <PageLayout title={pageTitle} description={pageDescription}>
        <GameSession worldId={currentWorldId!} />
      </PageLayout>
    </div>
  );
}
