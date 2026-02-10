'use client';

import React from 'react';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';
import { Button } from '@/components/ui/button';
import { getGenreLabel } from '@/lib/constants/genres';

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
    <div data-testid="game-ready-step" >
      <h3>
        Ready to Begin Your Story!
      </h3>
      
      <div>
        <div>
          <div>
            <span>World:</span>
            <p>{world?.name}</p>
            <p>{world?.genre ? getGenreLabel(world.genre) : 'Unknown'}</p>
          </div>
          <div>
            <span>Character:</span>
            <p>{character?.name}</p>
            <p>
              {character?.background?.personality || 'No description available'}
            </p>
          </div>
        </div>
      </div>

      <div>
        <Button
          onClick={onStart}
          disabled={isStarting}
          
          variant="default"
        >
          {isStarting ? (
            <>
              <span>⏳</span>
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
            
            variant="ghost"
          >
            ← Change Character
          </Button>
        </div>
      </div>
    </div>
  );
}
