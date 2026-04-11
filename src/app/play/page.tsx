'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import GameSession from '@/components/GameSession/GameSession';
import { LoadingPulse } from '@/components/ui/LoadingState';
import { SectionError } from '@/components/ui/ErrorDisplay';
import { PageLayout } from '@/components/shared/PageLayout';
import { getGenreLabel } from '@/lib/constants/genres';
import { Button } from '@/components/ui/button';

export default function PlayPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const currentWorldId = useWorldStore(state => state.currentWorldId);
  const currentWorld = useWorldStore(state => state.worlds[currentWorldId || '']);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const currentCharacterId = useCharacterStore((state: any) => state.currentCharacterId);
  const initializeSession = useSessionStore(state => state.initializeSession);
  const currentSessionId = useSessionStore(state => state.id);
  
  useEffect(() => {
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
  }, [currentWorldId, currentCharacterId, currentSessionId, initializeSession, router]);

  if (isLoading) {
    return (
      <main>
        <LoadingPulse message="Preparing your adventure..." />
      </main>
    );
  }

  if (error) {
    return (
      <PageLayout title="Game Session Error">
        <SectionError
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
    );
  }

  if (!currentSessionId) {
    return (
      <PageLayout title="No Active Session">
        <SectionError
          title="No Active Session"
          message="Unable to create or resume a game session."
          severity="warning"
        />
      </PageLayout>
    );
  }

  const pageTitle = currentWorld ? `Playing in ${currentWorld.name}` : 'Game Session';
  const pageDescription = currentWorld?.genre ? getGenreLabel(currentWorld.genre) : undefined;

  return (
    <PageLayout title={pageTitle} description={pageDescription}>
      <GameSession worldId={currentWorldId!} />
    </PageLayout>
  );
}
