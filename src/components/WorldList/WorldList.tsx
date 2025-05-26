import React from 'react';
import { World } from '../../types/world.types';
import WorldCard from '../WorldCard/WorldCard';

interface WorldListProps {
  worlds: World[];
  currentWorldId?: string | null;
  onSelectWorld: (worldId: string) => void;
  onDeleteWorld: (worldId: string) => void;
  _router?: {
    push: (url: string) => void;
  };
  _storeActions?: {
    setCurrentWorld: (id: string) => void;
  };
}

const WorldList: React.FC<WorldListProps> = ({ worlds, currentWorldId, onSelectWorld, onDeleteWorld, _router, _storeActions }) => {
  if (worlds.length === 0) {
    return (
      <section data-testid="world-list-empty-message" className="p-12 text-center bg-gray-50 rounded-lg">
        <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Start Your Adventure</h2>
        <p className="text-gray-600 mb-2">Create your first world to begin crafting stories.</p>
        <p className="text-gray-500 text-sm mb-6">Once you have a world, you can create characters and start playing!</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800">
            <strong>How it works:</strong>
          </p>
          <ol className="text-sm text-blue-700 mt-2 text-left list-decimal list-inside space-y-1">
            <li>Create a world with unique attributes and skills</li>
            <li>Design characters within that world</li>
            <li>Start your narrative adventure!</li>
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section data-testid="world-list-container" className="mt-6">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Your Worlds</h2>
      <ul className="space-y-4">
        {worlds.map((world) => (
          <li key={world.id}>
            <WorldCard
              world={world}
              isActive={world.id === currentWorldId}
              onSelect={onSelectWorld}
              onDelete={onDeleteWorld}
              _router={_router}
              _storeActions={_storeActions}
            />
          </li>
        ))}
      </ul>
    </section>
  );
};

export default WorldList;