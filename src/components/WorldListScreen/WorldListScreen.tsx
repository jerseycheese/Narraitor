'use client';

import React, { useEffect, useState } from 'react';
import { worldStore } from '../../state/worldStore';
import WorldList from '../WorldList/WorldList';
import DeleteConfirmationDialog from '../DeleteConfirmationDialog/DeleteConfirmationDialog';
import { World } from '../../types/world.types';

interface WorldListScreenProps {
  _router?: {
    push: (url: string) => void;
  };
  _storeActions?: {
    setCurrentWorld: (id: string) => void;
  };
}

const WorldListScreen: React.FC<WorldListScreenProps> = ({ _router, _storeActions }) => {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [worldToDeleteId, setWorldToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const state = worldStore.getState();
      setWorlds(Object.values(state.worlds || {}));
      setLoading(state.loading);
      setError(state.error);
      
      const unsubscribe = worldStore.subscribe(() => {
        const newState = worldStore.getState();
        setWorlds(Object.values(newState.worlds || {}));
        setLoading(newState.loading);
        setError(newState.error);
      });
      
      return () => unsubscribe();
    } catch (err) {
      console.error('Error loading worlds:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, []);

  const handleSelectWorld = (worldId: string) => {
    worldStore.setState((state) => ({
      ...state,
      currentWorldId: worldId
    }));
  };

  const handleDeleteClick = (worldId: string) => {
    setWorldToDeleteId(worldId);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setWorldToDeleteId(null);
  };

  const handleConfirmDelete = () => {
    if (worldToDeleteId) {
      worldStore.setState((state) => {
        const newWorlds = { ...state.worlds };
        delete newWorlds[worldToDeleteId];
        return {
          ...state,
          worlds: newWorlds,
          currentWorldId: state.currentWorldId === worldToDeleteId ? null : state.currentWorldId
        };
      });
    }
    handleCloseDeleteDialog();
  };

  const worldToDelete = worlds.find((world) => world.id === worldToDeleteId);
  const deleteMessage = worldToDelete
    ? `Are you sure you want to delete the world "${worldToDelete.name}"?`
    : 'Are you sure you want to delete this world?';

  if (loading) {
    return (
      <section className="p-8 text-center" data-testid="world-list-screen-loading-indicator">
        <div className="animate-pulse">
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">Loading Worlds</h2>
          <p className="text-gray-500">Please wait while we load your worlds...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="p-6 border border-red-300 rounded-lg bg-red-50" data-testid="world-list-screen-error-message">
        <h2 className="text-xl font-semibold text-red-700 mb-2">Error Loading Worlds</h2>
        <p className="text-red-600">Error: {error}</p>
      </section>
    );
  }

  return (
    <main>
      <WorldList 
        worlds={worlds} 
        onSelectWorld={handleSelectWorld} 
        onDeleteWorld={handleDeleteClick}
        _router={_router}
        _storeActions={_storeActions}
      />
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        title="Delete World"
        description={deleteMessage}
        itemName={worldToDelete?.name || 'this world'}
      />
    </main>
  );
};

export default WorldListScreen;