'use client';

import React, { useEffect, useState } from 'react';
import { useWorldStore } from '@/state/worldStore';
import WorldList from '@/components/WorldList/WorldList';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog/DeleteConfirmationDialog';
import { LoadingPulse } from '@/components/ui/LoadingState';
import { SectionError } from '@/components/ui/ErrorDisplay';
import { World } from '@/types/world.types';
import { getUserFriendlyError, UserFriendlyError, ErrorType } from '@/lib/utils/errorUtils';

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
  const [currentWorldId, setCurrentWorldId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<UserFriendlyError | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [worldToDeleteId, setWorldToDeleteId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const state = useWorldStore.getState();
      setWorlds(Object.values(state.worlds || {}));
      setCurrentWorldId(state.currentWorldId);
      setLoading(state.loading);
      setError(state.error);

      const unsubscribe = useWorldStore.subscribe((newState) => {
        setWorlds(Object.values(newState.worlds || {}));
        setCurrentWorldId(newState.currentWorldId);
        setLoading(newState.loading);
        setError(newState.error);
      });

      return () => unsubscribe();
    } catch (err) {
      const friendlyError = err instanceof Error
        ? getUserFriendlyError(err)
        : {
            title: 'Failed to Load Worlds',
            message: 'An unexpected error occurred while loading worlds.',
            retryable: false,
            type: ErrorType.UNKNOWN,
          } satisfies UserFriendlyError;
      setError(friendlyError);
      setLoading(false);
    }
  }, []);

  const handleSelectWorld = (worldId: string) => {
    useWorldStore.getState().setCurrentWorld(worldId);
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
      useWorldStore.getState().deleteWorld(worldToDeleteId);
    }
    handleCloseDeleteDialog();
  };

  const worldToDelete = worlds.find((world) => world.id === worldToDeleteId);
  const deleteMessage = worldToDelete
    ? `Are you sure you want to delete the world "${worldToDelete.name}"?`
    : 'Are you sure you want to delete this world?';

  if (loading) {
    return (
      <section className="p-8" data-testid="world-list-screen-loading-indicator">
        <LoadingPulse message="Loading your worlds..." skeletonLines={3} />
      </section>
    );
  }

  if (error) {
    return (
      <section className="p-6" data-testid="world-list-screen-error-message">
        <SectionError
          title={error.title || 'Error Loading Worlds'}
          message={error.message}
          severity="error"
          showRetry={Boolean(error.retryable)}
          onRetry={error.retryable ? () => useWorldStore.getState().fetchWorlds() : undefined}
        />
      </section>
    );
  }

  return (
    <main>
      <WorldList 
        worlds={worlds} 
        currentWorldId={currentWorldId}
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
