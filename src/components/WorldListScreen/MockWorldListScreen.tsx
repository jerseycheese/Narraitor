import React from 'react';
import WorldList from '../WorldList/WorldList';
import { World } from '../../types/world.types';

interface MockWorldListScreenProps {
  worlds?: World[];
}

/**
 * A mock implementation of WorldListScreen for Storybook
 */
export const MockWorldListScreen: React.FC<MockWorldListScreenProps> = ({ 
  worlds = [] 
}) => {
  const handleSelectWorld = (worldId: string) => {
    console.log('Selected world:', worldId);
  };

  const handleDeleteWorld = (worldId: string) => {
    console.log('Delete world:', worldId);
  };

  return (
    <section className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-gray-800">Your Worlds</h2>
      <WorldList 
        worlds={worlds} 
        onSelectWorld={handleSelectWorld} 
        onDeleteWorld={handleDeleteWorld} 
      />
    </section>
  );
};

export default MockWorldListScreen;