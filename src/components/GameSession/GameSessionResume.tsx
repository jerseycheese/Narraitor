'use client';

import React from 'react';
import { SavedSessionInfo } from '@/types/game.types';

interface GameSessionResumeProps {
  savedSession: SavedSessionInfo;
  onResume: () => void;
  onNewGame: () => void;
}

const GameSessionResume: React.FC<GameSessionResumeProps> = ({
  savedSession,
  onResume,
  onNewGame,
}) => {
  const lastPlayedDate = new Date(savedSession.lastPlayed);
  const formattedDate = lastPlayedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div data-testid="game-session-resume" className="p-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Continue Your Story?</h2>
        
        <div className="bg-gray-50 rounded p-4 mb-6">
          <p className="text-sm text-gray-600 mb-1">Last played: {formattedDate}</p>
          <p className="text-sm text-gray-600">Progress: {savedSession.narrativeCount} scenes</p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={onResume}
            className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors"
            data-testid="resume-session-button"
          >
            Continue Adventure
          </button>
          
          <button
            onClick={onNewGame}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            data-testid="new-session-button"
          >
            Start New Adventure
          </button>
        </div>
        
        <p className="text-xs text-gray-500 mt-4 text-center">
          Starting a new adventure will save your current progress
        </p>
      </div>
    </div>
  );
};

export default GameSessionResume;
