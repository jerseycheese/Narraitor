import React, { useEffect, useState } from 'react';
import { worldStore } from '../../state/worldStore';
import WorldList from '../WorldList/WorldList';
import DeleteConfirmationDialog from '../DeleteConfirmationDialog/DeleteConfirmationDialog';
import { World } from '../../types/world.types';

const WorldListScreen: React.FC = () => {
  const { worlds, loading, error } = worldStore(state => {
    return {
      worlds: Object.values(state.worlds), // Convert the Record to an array
      loading: state.loading,
      error: state.error,
    };
  });

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [worldToDeleteId, setWorldToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const { fetchWorlds } = worldStore.getState();
    fetchWorlds();
  }, []); // Empty dependency array - only run once on mount

  const handleSelectWorld = (worldId: string) => {
    const { setCurrentWorld } = worldStore.getState();
    setCurrentWorld(worldId);
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
      const { deleteWorld } = worldStore.getState();
      deleteWorld(worldToDeleteId);
    }
    handleCloseDeleteDialog();
  };

  const worldToDelete = worlds.find((world: World) => world.id === worldToDeleteId);
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