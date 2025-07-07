'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { useSessionStore } from '@/state/sessionStore';
import { formatRelativeTime } from '@/lib/utils';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { DataField } from '@/components/shared/DataField';
import { GuidedFirstTimeExperience } from '@/components/GuidedFirstTimeExperience';
import { Button } from '@/components/ui/button';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { cleanupSessionData } from '@/lib/utils/sessionCleanup';

export function QuickPlay() {
  const router = useRouter();
  const { worlds } = useWorldStore();
  const { characters } = useCharacterStore();
  const savedSessions = useSessionStore(state => state.savedSessions);
  const resumeSavedSession = useSessionStore(state => state.resumeSavedSession);
  const shouldShowOnboarding = useSessionStore(state => state.shouldShowOnboarding);
  const onboardingCompleted = useSessionStore(state => state.onboardingCompleted);
  
  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // Prevents multiple delete operations

  // Find the most recent valid saved session
  const validSessions = Object.values(savedSessions)
    .filter(session => {
      const world = worlds[session.worldId];
      const character = characters[session.characterId];
      return world && character;
    })
    .sort((a, b) => new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime());

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
      router.push('/play');
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
      console.error('Failed to delete session:', error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  // Show guided experience for first-time users
  // If shouldShowOnboarding method exists, use it; otherwise fallback to checking conditions directly
  const showOnboarding = shouldShowOnboarding 
    ? shouldShowOnboarding() 
    : (Object.keys(savedSessions).length === 0 && !onboardingCompleted);
    
  if (showOnboarding) {
    return <GuidedFirstTimeExperience />;
  }

  if (!hasValidSession) {
    return (
      <div className="text-center">
        <Button
          onClick={handleNewGame}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-lg transition-colors"
          variant="default"
        >
          Start New Game
        </Button>
      </div>
    );
  }

  const world = worlds[mostRecentSession.worldId];
  const character = characters[mostRecentSession.characterId];
  const lastPlayedText = formatRelativeTime(mostRecentSession.lastPlayed);

  return (
    <div className="space-y-6">
      {/* Continue Last Game - Primary CTA */}
      <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-500">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6">
          {/* Character Portrait */}
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <CharacterPortrait
              portrait={character.portrait || { type: 'placeholder', url: null }}
              characterName={character.name}
              size="large"
            />
          </div>
          
          {/* Game Info */}
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <DataField label="World" value={world.name} />
              <DataField label="Character" value={character.name} />
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-t pt-3">
              <DataField 
                label="Progress" 
                value={`${mostRecentSession.narrativeCount} entries`}
                variant="inline"
              />
              <div className="text-xs text-gray-500">
                Last played {lastPlayedText}
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleContinue}
            className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
            variant="default"
          >
            Continue Last Game
          </Button>
          {/* Campaign deletion button - opens confirmation dialog */}
          <Button
            onClick={() => setIsDeleteDialogOpen(true)}
            className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors"
            variant="destructive"
          >
            Delete
          </Button>
        </div>
      </div>

      {/* Start New Game - Secondary Option */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">Or</p>
        <Button
          onClick={handleNewGame}
          className="px-6 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-md transition-colors"
          variant="outline"
        >
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
