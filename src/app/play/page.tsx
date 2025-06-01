'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
import { sessionStore } from '@/state/sessionStore';
import GameSession from '@/components/GameSession/GameSession';
import { LoadingPulse } from '@/components/ui/LoadingState';
import { SectionError } from '@/components/ui/ErrorDisplay';

export default function PlayPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const currentWorldId = worldStore(state => state.currentWorldId);
  const currentCharacterId = characterStore(state => state.currentCharacterId);
  const initializeSession = sessionStore(state => state.initializeSession);
  const currentSessionId = sessionStore(state => state.id);
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
      <main className="min-h-screen bg-gray-100 flex items-center justify-center">
        <LoadingPulse message="Preparing your adventure..." />
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <SectionError
            title="Failed to Start Game"
            message={error}
            severity="error"
          />
          <div className="mt-4 flex gap-4">
            <button
              onClick={() => router.push('/worlds')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Select World
            </button>
            <button
              onClick={() => router.push('/characters')}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Select Character
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!currentSessionId) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <SectionError
            title="No Active Session"
            message="Unable to create or resume a game session."
            severity="warning"
          />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      <GameSession worldId={currentWorldId!} />
    </main>
  );
}
