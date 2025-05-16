import React, { useEffect, useState } from 'react';
import { worldStore } from '../../state/worldStore';
import WorldList from '../WorldList/WorldList';
import DeleteConfirmationDialog from '../DeleteConfirmationDialog/DeleteConfirmationDialog';
import { World } from '../../types/world.types';

const WorldListScreen: React.FC = () => {
  // Use useState to track the worlds
  const [worlds, setWorlds] = useState<World[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [worldToDeleteId, setWorldToDeleteId] = useState<string | null>(null);

  // Load worlds on component mount
  useEffect(() => {
    try {
      // Get initial state
      const state = worldStore.getState();
      setWorlds(Object.values(state.worlds || {}));
      setLoading(false);
      
      // Subscribe to state changes
      const unsubscribe = worldStore.subscribe(() => {
        const newState = worldStore.getState();
        setWorlds(Object.values(newState.worlds || {}));
      });
      
      // Clean up subscription
      return () => unsubscribe();
    } catch (err) {
      console.error('Error loading worlds:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }, []);

  const handleSelectWorld = (worldId: string) => {
    // Use setState to update the currentWorldId
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
      // Use setState to delete the world
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
    return <div data-testid="world-list-screen-loading-indicator">Loading worlds...</div>;
  }

  if (error) {
    return <div data-testid="world-list-screen-error-message">Error: {error}</div>;
  }

  return (
    <div>
      <WorldList worlds={worlds} onSelectWorld={handleSelectWorld} onDeleteWorld={handleDeleteClick} />
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onConfirm={handleConfirmDelete}
        message={deleteMessage}
      />
    </div>
  );
};

export default WorldListScreen;