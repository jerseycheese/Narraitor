'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import { formatRelativeTime } from '@/lib/utils';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { DataField } from '@/components/shared/DataField';
import { GuidedFirstTimeExperience } from '@/components/GuidedFirstTimeExperience';
import { Button } from '@/components/ui/button';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { cleanupSessionData } from '@/lib/utils/sessionCleanup';
import { fixExistingSessionNarrativeCounts } from '@/lib/session/fixSessionNarrativeCounts';
import { Globe, Users, Play } from 'lucide-react';

import Logger from '@/lib/utils/logger';
const logger = new Logger('QuickPlay');

export function QuickPlay() {
  const router = useRouter();

  // Use persisted store data
  const { worlds } = useWorldStore();
  const { characters } = useCharacterStore();
  const savedSessions = useSessionStore((state) => state.savedSessions);
  const resumeSavedSession = useSessionStore(
    (state) => state.resumeSavedSession
  );
  const shouldShowOnboarding = useSessionStore(
    (state) => state.shouldShowOnboarding
  );
  const actualWorlds = worlds;
  const actualCharacters = characters;
  const actualSavedSessions = savedSessions;

  // Fix existing session narrative counts on component mount
  useEffect(() => {
    fixExistingSessionNarrativeCounts();
  }, []);

  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // Prevents multiple delete operations

  // Find the most recent valid saved session
  const validSessions = Object.values(actualSavedSessions)
    .filter((session) => {
      const world = actualWorlds[session.worldId];
      const character = actualCharacters[session.characterId];
      return world && character;
    })
    .sort(
      (a, b) =>
        new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime()
    );

  const mostRecentSession = validSessions[0];
  const hasValidSession = Boolean(mostRecentSession);

  const handleContinue = async () => {
    if (!mostRecentSession) return;

    // Set the current world and character before resuming session
    const { setCurrentWorld } = useWorldStore.getState();
    const { setCurrentCharacter } = useCharacterStore.getState();

    setCurrentWorld(mostRecentSession.worldId);
    setCurrentCharacter(mostRecentSession.characterId);

    const success = resumeSavedSession(mostRecentSession.id);
    if (success) {
      router.push(`/worlds/${mostRecentSession.worldId}/play`);
    }
  };

  const handleNewGame = () => {
    router.push('/worlds');
  };

  /**
   * Handle campaign deletion with confirmation
   *
   * Performs complete cleanup of all session-related data including:
   * - Narrative segments and decisions
   * - Journal entries
   * - Session record
   *
   * The UI is updated immediately after deletion to reflect the removed campaign.
   * If deletion fails, the error is logged but the dialog is still closed to prevent
   * the user from getting stuck in a failed state.
   */
  const handleDeleteSession = async () => {
    if (!mostRecentSession) return;

    setIsDeleting(true);
    try {
      await cleanupSessionData(mostRecentSession.id);
    } catch (error) {
      logger.error('Failed to delete session:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Show guided experience for first-time users using store methods
  const showOnboarding =
    typeof shouldShowOnboarding === 'function'
      ? shouldShowOnboarding()
      : Object.keys(actualSavedSessions).length === 0;

  if (showOnboarding) {
    return <GuidedFirstTimeExperience />;
  }

  if (!hasValidSession) {
    // Check if user has any existing data - if not, show "How It Works"
    const hasExistingData =
      Object.keys(actualWorlds).length > 0 ||
      Object.keys(actualCharacters).length > 0;

    return (
      <div>
        {/* How it Works for new users */}
        {!hasExistingData && (
          <section>
            <div>
              <p>Create a world and start a story</p>
            </div>
            <div role="list" aria-label="Steps to get started">
              <div role="listitem">
                {/* Background Icon */}
                <Globe aria-hidden="true" />
                <div>
                  <div aria-hidden="true">1</div>
                  <h3>Build Your World</h3>
                  <p>
                    Create or generate unique worlds with custom rules and
                    settings
                  </p>
                </div>
              </div>
              <div role="listitem">
                {/* Background Icon */}
                <Users aria-hidden="true" />
                <div>
                  <div aria-hidden="true">2</div>
                  <h3>Create Characters</h3>
                  <p>
                    Design or generate playable characters that fit your world
                  </p>
                </div>
              </div>
              <div role="listitem">
                {/* Background Icon */}
                <Play aria-hidden="true" />
                <div>
                  <div aria-hidden="true">3</div>
                  <h3>Start Playing</h3>
                  <p>Make choices and shape your story</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Start New Game button */}
        <div>
          <Button onClick={handleNewGame} variant="default" size="lg">
            Start New Game
          </Button>
        </div>
      </div>
    );
  }

  const world = actualWorlds[mostRecentSession.worldId];
  const character = actualCharacters[mostRecentSession.characterId];
  const lastPlayedText = formatRelativeTime(mostRecentSession.lastPlayed);

  return (
    <div>
      {/* Continue Last Game - Primary CTA */}
      <section aria-labelledby="continue-game-heading">
        <h2 id="continue-game-heading">Continue Your Game</h2>
        <div>
          {/* Character Portrait */}
          <div>
            <CharacterPortrait
              portrait={
                character.portrait || { type: 'placeholder', url: null }
              }
              characterName={character.name}
              size="large"
            />
          </div>

          {/* Game Info */}
          <div>
            <div>
              <DataField label="World" value={world.name} />
              <DataField label="Character" value={character.name} />
            </div>

            <div>
              <DataField
                label="Progress"
                value={`${mostRecentSession.narrativeCount} entries`}
                variant="outline"
              />
              <time dateTime={mostRecentSession.lastPlayed}>
                Last played {lastPlayedText}
              </time>
            </div>
          </div>
        </div>

        <ActionButtonGroup
          actions={[
            {
              label: 'Continue Last Game',
              onClick: handleContinue,
              variant: 'success',
            },
            {
              label: 'Delete',
              onClick: () => setIsDeleteDialogOpen(true),
              variant: 'danger',
            },
          ]}
        />
      </section>

      {/* Start New Game - Secondary Option */}
      <div>
        <p>Or</p>
        <Button onClick={handleNewGame} variant="outline" size="default">
          Start New Game
        </Button>
      </div>

      {/* Delete Confirmation Dialog - Prevents accidental campaign deletion */}
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteSession}
        title="Delete Campaign"
        description="This will permanently delete all data for this campaign, including narrative progress and journal entries. This action cannot be undone."
        itemName={mostRecentSession ? `${world.name} - ${character.name}` : ''}
        isDeleting={isDeleting}
      />
    </div>
  );
}
