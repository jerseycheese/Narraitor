'use client';

import React from 'react';
import Link from 'next/link';
import { worldStore } from '@/state/worldStore';
import { WorldCard } from '@/components/WorldCard/WorldCard';

export interface WorldSelectionStepProps {
  onNext: (worldId: string) => void;
}

export function WorldSelectionStep({ onNext }: WorldSelectionStepProps) {
  const { worlds } = worldStore();
  const worldList = Object.values(worlds);

  if (worldList.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          No Worlds Yet
        </h3>
        <p className="text-gray-600 mb-8">
          Create your first world to begin your adventure
        </p>
        <Link
          href="/world/create"
          className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          Create Your First World
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">
        Choose Your World
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {worldList.map(world => (
          <div key={world.id} className="cursor-pointer" onClick={() => onNext(world.id)}>
            <WorldCard 
              world={world}
              isSelected={false}
              characterCount={0}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center pt-4 border-t">
        <Link
          href="/world/create"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Create New World
        </Link>
        <p className="text-sm text-gray-600">
          Click a world to continue
        </p>
      </div>
    </div>
  );
}