import React from 'react';
import { World } from '../../types/world.types';
import WorldCard from '../WorldCard/WorldCard';
import { characterStore } from '../../state/characterStore';

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
  // Get character counts for each world
  const characters = characterStore.getState().characters;
  const characterCounts = worlds.reduce((counts, world) => {
    counts[world.id] = Object.values(characters).filter(char => char.worldId === world.id).length;
    return counts;
  }, {} as Record<string, number>);
  if (worlds.length === 0) {
    return (
      <section data-testid="world-list-empty-message" className="p-12 text-center bg-gray-50 rounded-lg">
        <div className="w-24 h-24 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Welcome to Narraitor!</h2>
        <p className="text-gray-600 mb-2">Begin your storytelling journey by creating your first world.</p>
        <p className="text-gray-500 text-sm mb-6">Each world is a unique setting with its own rules, attributes, and possibilities.</p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-sm text-blue-800 font-semibold mb-3">
            Getting Started Guide:
          </p>
          <ol className="text-sm text-blue-700 text-left list-decimal list-inside space-y-2">
            <li><strong>Create a World</strong> - Define your setting, theme, and game rules</li>
            <li><strong>Build Characters</strong> - Populate your world with unique personalities</li>
            <li><strong>Start Playing</strong> - Begin your interactive narrative experience</li>
          </ol>
          <div className="mt-4 pt-3 border-t border-blue-200">
            <p className="text-xs text-blue-600">
              <strong>Tip:</strong> You can create multiple worlds and switch between them anytime!
            </p>
          </div>
        </div>
      </section>
    );
  }

  // Sort worlds to show active world first
  const sortedWorlds = [...worlds].sort((a, b) => {
    if (a.id === currentWorldId) return -1;
    if (b.id === currentWorldId) return 1;
    return 0;
  });

  return (
    <section data-testid="world-list-container" className="mt-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Your Worlds</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        {sortedWorlds.map((world) => (
          <WorldCard
            key={world.id}
            world={world}
            isActive={world.id === currentWorldId}
            characterCount={characterCounts[world.id] || 0}
            onSelect={onSelectWorld}
            onDelete={onDeleteWorld}
            _router={_router}
            _storeActions={_storeActions}
          />
        ))}
      </div>
    </section>
  );
};

export default WorldList;
