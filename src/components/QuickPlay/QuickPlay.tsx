'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { worldStore } from '@/state/worldStore';
import { characterStore } from '@/state/characterStore';
import { sessionStore } from '@/state/sessionStore';
import { formatDistanceToNow } from '@/lib/utils/textFormatter';

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

    const success = resumeSavedSession(mostRecentSession.id);
    if (success) {
      router.push('/play');
    }
  };

  const handleNewAdventure = () => {
    router.push('/worlds');
  };

  if (!hasValidSession) {
    return (
      <div className="text-center">
        <button
          onClick={handleNewAdventure}
          className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-medium rounded-lg transition-colors"
        >
          Start New Adventure
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
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              Continue Your Adventure
            </h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                <span className="font-medium">World:</span> {world.name}
              </p>
              <p>
                <span className="font-medium">Character:</span> {character.name}
              </p>
              <p>
                <span className="font-medium">Progress:</span> {mostRecentSession.narrativeCount} entries
              </p>
              <p className="text-xs text-gray-500">
                Last played {lastPlayedText}
              </p>
            </div>
          </div>
          <button
            onClick={handleContinue}
            className="ml-4 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
          >
            Continue Last Game
          </button>
        </div>
      </div>

      {/* Start New Adventure - Secondary Option */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-2">Or</p>
        <button
          onClick={handleNewAdventure}
          className="px-6 py-2 border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-md transition-colors"
        >
          Start New Adventure
        </button>
      </div>
    </div>
  );
}