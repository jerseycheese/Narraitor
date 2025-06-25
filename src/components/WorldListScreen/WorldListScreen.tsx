'use client';

import React, { useEffect } from 'react';
import { useFormState } from '@/hooks';
import { useWorldStore } from '../../state/worldStore';
import WorldList from '../WorldList/WorldList';
import DeleteConfirmationDialog from '../DeleteConfirmationDialog/DeleteConfirmationDialog';
import { LoadingPulse } from '../ui/LoadingState';
import { SectionError } from '../ui/ErrorDisplay';
import { World } from '../../types/world.types';
import { useAsyncState, useModal } from '@/hooks';

interface WorldListScreenProps {
  _router?: {
    push: (url: string) => void;
  };
  _storeActions?: {
    setCurrentWorld: (id: string) => void;
  };
}

const WorldListScreen: React.FC<WorldListScreenProps> = ({ _router, _storeActions }) => {
  // Form state management using hooks
  const worldListState = useFormState({
    initialData: {
      worlds: [] as World[],
      currentWorldId: null as string | null,
      worldToDeleteId: null as string | null
    }
  });
  
  // Async state management using hooks
  const worldsLoadingState = useAsyncState<void>();
  
  // Modal state management using hooks
  const deleteConfirmationModal = useModal();

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const loadWorlds = async () => {
      try {
        const state = useWorldStore.getState();
        worldListState.updateData({
          worlds: Object.values(state.worlds || {}),
          currentWorldId: state.currentWorldId,
          worldToDeleteId: null
        });
        
        // Set up subscription and store cleanup function
        unsubscribe = useWorldStore.subscribe(() => {
          const newState = useWorldStore.getState();
          worldListState.updateData({
            worlds: Object.values(newState.worlds || {}),
            currentWorldId: newState.currentWorldId,
            worldToDeleteId: null // Reset this field on subscription updates
          });
        });
      } catch (err) {
        console.error('Failed to load worlds:', err);
      }
    };
    
    loadWorlds();
    
    // Return cleanup function for useEffect
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
    // worldListState.updateData should be stable due to useCallback in useFormState
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [worldListState.updateData]);

  const handleSelectWorld = (worldId: string) => {
    useWorldStore.setState((state) => ({
      ...state,
      currentWorldId: worldId
    }));
  };

  const handleDeleteClick = (worldId: string) => {
    worldListState.updateField('worldToDeleteId', worldId);
    deleteConfirmationModal.open();
  };

  const handleCloseDeleteDialog = () => {
    deleteConfirmationModal.close();
    worldListState.updateField('worldToDeleteId', null);
  };

  const handleConfirmDelete = () => {
    if (worldListState.data.worldToDeleteId) {
      useWorldStore.setState((state) => {
        const newWorlds = { ...state.worlds };
        delete newWorlds[worldListState.data.worldToDeleteId!];
        return {
          ...state,
          worlds: newWorlds,
          currentWorldId: state.currentWorldId === worldListState.data.worldToDeleteId ? null : state.currentWorldId
        };
      });
    }
    handleCloseDeleteDialog();
  };

  const worldToDelete = worldListState.data.worlds.find((world) => world.id === worldListState.data.worldToDeleteId);
  const deleteMessage = worldToDelete
    ? `Are you sure you want to delete the world "${worldToDelete.name}"?`
    : 'Are you sure you want to delete this world?';

  if (worldsLoadingState.isLoading) {
    return (
      <section className="p-8" data-testid="world-list-screen-loading-indicator">
        <LoadingPulse message="Loading your worlds..." skeletonLines={3} />
      </section>
    );
  }

  if (worldsLoadingState.error) {
    return (
      <section className="p-6" data-testid="world-list-screen-error-message">
        <SectionError
          title="Error Loading Worlds"
          message={worldsLoadingState.error}
          severity="error"
        />
      </section>
    );
  }

  return (
    <main>
      <WorldList 
        worlds={worldListState.data.worlds} 
        currentWorldId={worldListState.data.currentWorldId}
        onSelectWorld={handleSelectWorld} 
        onDeleteWorld={handleDeleteClick}
        _router={_router}
        _storeActions={_storeActions}
      />
      <DeleteConfirmationDialog
        {...deleteConfirmationModal.modalProps}
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
