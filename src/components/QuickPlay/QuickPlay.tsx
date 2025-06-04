'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
import { sessionStore } from '@/state/sessionStore';
import { formatDistanceToNow } from '@/lib/utils/textFormatter';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { DataField } from '@/components/shared/DataField';

export function QuickPlay() {
  const router = useRouter();
  const { worlds } = worldStore();
  const { characters } = characterStore();
  const { savedSessions, resumeSavedSession } = sessionStore();

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
    const { setCurrentWorld } = worldStore.getState();
    const { setCurrentCharacter } = characterStore.getState();
    
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

  if (!hasValidSession) {
    return (
      <div className="text-center">
        <button
          onClick={handleNewGame}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-lg transition-colors"
        >
          Start New Game
        </button>
      </div>
    );
  }

  const world = worlds[mostRecentSession.worldId];
  const character = characters[mostRecentSession.characterId];
  const lastPlayedText = formatDistanceToNow(mostRecentSession.lastPlayed);

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
        
        <button
          onClick={handleContinue}
          className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
        >
          Continue Last Game
        </button>
      </div>

      {/* Start New Game - Secondary Option */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">Or</p>
        <button
          onClick={handleNewGame}
          className="px-6 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-md transition-colors"
        >
          Start New Game
        </button>
      </div>
    </div>
  );
}