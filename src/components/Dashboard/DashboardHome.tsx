'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import { DashboardProgressCard } from './DashboardProgressCard';
import { DashboardContinueCard } from './DashboardContinueCard';
import { DashboardRecentWorlds } from './DashboardRecentWorlds';
import { DashboardRecentCharacters } from './DashboardRecentCharacters';
import { DashboardGettingStarted } from './DashboardGettingStarted';
import { cleanupSessionData } from '@/lib/utils/sessionCleanup';
import type { DashboardState, DashboardMetrics } from '@/types/dashboard.types';
import { Button } from '@/components/ui/button';
import { Globe, Users, Play } from 'lucide-react';

export function DashboardHome() {
  const router = useRouter();

  const { worlds } = useWorldStore();
  const { characters } = useCharacterStore();
  const savedSessions = useSessionStore((state) => state.savedSessions);
  const resumeSavedSession = useSessionStore((state) => state.resumeSavedSession);
  const shouldShowOnboarding = useSessionStore((state) => state.shouldShowOnboarding);

  // Calculate dashboard state
  const dashboardState: DashboardState = useMemo(() => {
    const hasWorlds = Object.keys(worlds).length > 0;
    const hasCharacters = Object.keys(characters).length > 0;

    // Check for onboarding
    const showOnboarding = shouldShowOnboarding();

    if (showOnboarding) {
      return 'first-time';
    }

    // Find valid sessions
    const validSessions = Object.values(savedSessions).filter((session) => {
      const world = worlds[session.worldId];
      const character = characters[session.characterId];
      return world && character;
    });

    if (validSessions.length > 0) {
      return 'active-session';
    }

    if (hasWorlds || hasCharacters) {
      return 'returning-no-session';
    }

    return 'first-time';
  }, [worlds, characters, savedSessions, shouldShowOnboarding]);

  // Calculate metrics
  const metrics: DashboardMetrics = useMemo(() => {
    const validSessions = Object.values(savedSessions).filter((session) => {
      const world = worlds[session.worldId];
      const character = characters[session.characterId];
      return world && character;
    });

    const narrativeSegments = validSessions.reduce(
      (total, session) => total + (session.narrativeCount || 0),
      0
    );

    return {
      worldsCreated: Object.keys(worlds).length,
      charactersCreated: Object.keys(characters).length,
      sessionsPlayed: validSessions.length,
      narrativeSegments
    };
  }, [worlds, characters, savedSessions]);

  // Get most recent session
  const mostRecentSession = useMemo(() => {
    const validSessions = Object.values(savedSessions)
      .filter((session) => {
        const world = worlds[session.worldId];
        const character = characters[session.characterId];
        return world && character;
      })
      .sort((a, b) => new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime());

    return validSessions[0];
  }, [savedSessions, worlds, characters]);

  // Navigation handler
  const handleNavigate = (path: string) => {
    router.push(path);
  };

  // Continue session handler
  const handleContinue = async (sessionId: string) => {
    const session = savedSessions[sessionId];
    if (!session) return;

    const { setCurrentWorld } = useWorldStore.getState();
    const { setCurrentCharacter } = useCharacterStore.getState();

    setCurrentWorld(session.worldId);
    setCurrentCharacter(session.characterId);

    const success = resumeSavedSession(sessionId);
    if (success) {
      router.push(`/worlds/${session.worldId}/play`);
    }
  };

  // Delete session handler
  const handleDelete = async (sessionId: string) => {
    await cleanupSessionData(sessionId);
  };

  // First-time user state - show engaging onboarding dashboard
  if (dashboardState === 'first-time') {
    return (
      <main className="component-dashboard-home grid grid-cols-1 gap-6">
        {/* Welcome Message */}
        <section className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Welcome to Narraitor</h2>
          <p className="text-lg text-secondary-foreground">
            Create a world and start your story
          </p>
        </section>

        {/* How it Works - 3 Step Cards */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-background rounded-lg border p-6 shadow-sm relative overflow-hidden">
              <Globe className="absolute inset-0 w-4/5 h-4/5 text-primary/10 m-auto" aria-hidden="true" />
              <div className="relative z-10">
                <div className="text-3xl font-bold text-primary mb-3">1</div>
                <h4 className="text-lg font-semibold mb-2">Build Your World</h4>
                <p className="text-sm text-muted-foreground">
                  Create or generate unique worlds with custom rules and settings
                </p>
              </div>
            </div>
            <div className="bg-background rounded-lg border p-6 shadow-sm relative overflow-hidden">
              <Users className="absolute inset-0 w-4/5 h-4/5 text-primary/10 m-auto" aria-hidden="true" />
              <div className="relative z-10">
                <div className="text-3xl font-bold text-primary mb-3">2</div>
                <h4 className="text-lg font-semibold mb-2">Create Characters</h4>
                <p className="text-sm text-muted-foreground">
                  Design or generate playable characters that fit your world
                </p>
              </div>
            </div>
            <div className="bg-background rounded-lg border p-6 shadow-sm relative overflow-hidden">
              <Play className="absolute inset-0 w-4/5 h-4/5 text-primary/10 m-auto" aria-hidden="true" />
              <div className="relative z-10">
                <div className="text-3xl font-bold text-primary mb-3">3</div>
                <h4 className="text-lg font-semibold mb-2">Start Playing</h4>
                <p className="text-sm text-muted-foreground">
                  Make choices and shape your story
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Primary CTA */}
        <section className="text-center">
          <Button
            onClick={() => handleNavigate('/worlds')}
            variant="default"
            size="lg"
            className="px-8 py-4 text-lg font-medium"
          >
            Start New Game
          </Button>
        </section>
      </main>
    );
  }

  return (
    <main className="component-dashboard-home grid grid-cols-1 gap-6">
      {/* Continue Card - Only for active session users */}
      {dashboardState === 'active-session' && mostRecentSession && (
        <DashboardContinueCard
          session={mostRecentSession}
          world={worlds[mostRecentSession.worldId]}
          character={characters[mostRecentSession.characterId]}
          onContinue={handleContinue}
          onDelete={handleDelete}
        />
      )}

      {/* Progress Card */}
      <DashboardProgressCard metrics={metrics} />

      {/* Recent Worlds */}
      <DashboardRecentWorlds worlds={worlds} maxItems={3} onNavigate={handleNavigate} />

      {/* Recent Characters */}
      <DashboardRecentCharacters
        characters={characters}
        worlds={worlds}
        maxItems={3}
        onNavigate={handleNavigate}
      />

      {/* Getting Started Guide */}
      <DashboardGettingStarted
        hasWorlds={metrics.worldsCreated > 0}
        hasCharacters={metrics.charactersCreated > 0}
        hasSessions={metrics.sessionsPlayed > 0}
        onNavigate={handleNavigate}
      />
    </main>
  );
}
