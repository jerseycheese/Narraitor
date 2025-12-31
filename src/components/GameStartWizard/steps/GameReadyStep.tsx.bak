'use client';

import React from 'react';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { Button } from '@/components/ui/button';

export interface GameReadyStepProps {
  worldId: string;
  characterId: string;
  onStart: () => void;
  onBack: () => void;
  isStarting?: boolean;
}

export function GameReadyStep({ 
  worldId, 
  characterId, 
  onStart, 
  onBack,
  isStarting = false 
}: GameReadyStepProps) {
  const { worlds } = useWorldStore();
  const { characters } = useCharacterStore();
  
  const world = worlds[worldId];
  const character = characters[characterId];

  return (
    <div data-testid="game-ready-step" className="text-center py-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">
        Ready to Begin Your Story!
      </h3>
      
      <div className="bg-gray-100 rounded-lg p-6 mb-8 max-w-md mx-auto">
        <div className="space-y-3 text-left">
          <div>
            <span className="text-sm text-gray-700">World:</span>
            <p className="font-medium text-gray-900">{world?.name}</p>
            <p className="text-sm text-gray-700">{world?.genre}</p>
          </div>
          <div className="pt-2 border-t">
            <span className="text-sm text-gray-700">Character:</span>
            <p className="font-medium text-gray-900">{character?.name}</p>
            <p className="text-sm text-gray-700 line-clamp-2">
              {character?.background?.personality || 'No description available'}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Button
          onClick={onStart}
          disabled={isStarting}
          className="inline-flex items-center px-8 py-3 bg-green-500 hover:bg-green-700 disabled:bg-green-500 text-white font-medium rounded-md transition-colors"
          variant="default"
        >
          {isStarting ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Starting Game...
            </>
          ) : (
            'Start Playing'
          )}
        </Button>
        
        <div>
          <Button
            onClick={onBack}
            disabled={isStarting}
            className="text-gray-700 hover:text-gray-900 disabled:text-gray-500"
            variant="ghost"
          >
            ← Change Character
          </Button>
        </div>
      </div>
    </div>
  );
}
