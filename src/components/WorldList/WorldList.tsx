import React from 'react';
import { World } from '../../types/world.types';
import WorldCard from '../WorldCard/WorldCard';

interface WorldListProps {
  worlds: World[];
  onSelectWorld: (worldId: string) => void;
  onDeleteWorld: (worldId: string) => void;
  _router?: {
    push: (url: string) => void;
  };
  _storeActions?: {
    setCurrentWorld: (id: string) => void;
  };
}

const WorldList: React.FC<WorldListProps> = ({ worlds, onSelectWorld, onDeleteWorld, _router, _storeActions }) => {
  if (worlds.length === 0) {
    return (
      <section data-testid="world-list-empty-message" className="p-8 text-center bg-gray-50 rounded-lg">
        <h2 className="text-2xl font-semibold text-gray-500 mb-3">No Worlds Available</h2>
        <p className="mt-2 text-gray-400">No worlds created yet. Create your first world to get started.</p>
      </section>
    );
  }

  return (
    <section data-testid="world-list-container" className="mt-6">
      <h2 className="text-2xl font-bold mb-4 pl-4 text-gray-800">Your Worlds</h2>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {worlds.map((world) => (
          <li key={world.id}>
            <WorldCard
              world={world}
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