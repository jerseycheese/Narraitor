'use client';

import React from 'react';
import Link from 'next/link';
import { useWorldStore } from '@/state/worldStore';
import WorldCard from '@/components/WorldCard/WorldCard';
import { Button } from '@/components/ui/button';

export interface WorldSelectionStepProps {
  onNext: (worldId: string) => void;
}

export function WorldSelectionStep({ onNext }: WorldSelectionStepProps) {
  const { worlds } = useWorldStore();
  const worldList = Object.values(worlds);

  if (worldList.length === 0) {
    return (
      <div>
        <h3>
          No Worlds Yet
        </h3>
        <p>
          Create your first world to begin your adventure
        </p>
        <Link
          href="/worlds/create"
          
        >
          Create Your First World
        </Link>
      </div>
    );
  }

  return (
    <div data-testid="world-selection-step">
      <h3>
        Choose Your World
      </h3>
      
      <div>
        {worldList.map(world => (
          <div key={world.id} className="world-selection-step-option">
            <WorldCard
              world={world}
              isActive={false}
              onDelete={() => {/* No delete in wizard */}}
            />
            <Button onClick={() => onNext(world.id)}>
              Choose {world.name}
            </Button>
          </div>
        ))}
      </div>

      <div>
        <Link
          href="/worlds/create"
          
        >
          Create New World
        </Link>
        <p>
          Choose a world to continue
        </p>
      </div>
    </div>
  );
}
