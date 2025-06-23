'use client';

import React, { useEffect, useState } from 'react';
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
  const [worlds, setWorlds] = useState<World[]>([]);
  const [currentWorldId, setCurrentWorldId] = useState<string | null>(null);
  const [worldToDeleteId, setWorldToDeleteId] = useState<string | null>(null);
  
  // Async state management using hooks
  const worldsLoadingState = useAsyncState<void>();
  
  // Modal state management using hooks
  const deleteConfirmationModal = useModal();

  useEffect(() => {
    const loadWorlds = async () => {
      await worldsLoadingState.execute(async () => {
        try {
          const state = useWorldStore.getState();
          setWorlds(Object.values(state.worlds || {}));
          setCurrentWorldId(state.currentWorldId);
          
          const unsubscribe = useWorldStore.subscribe(() => {
            const newState = useWorldStore.getState();
            setWorlds(Object.values(newState.worlds || {}));
            setCurrentWorldId(newState.currentWorldId);
          });
          
          // Store unsubscribe function for cleanup
          return () => unsubscribe();
        } catch (err) {
          throw new Error(err instanceof Error ? err.message : 'Unknown error');
        }
      });
    };
    
    loadWorlds();
    
    // Note: The unsubscribe function from the store subscription
    // is handled by the async state execution
  }, [worldsLoadingState]);

  const handleSelectWorld = (worldId: string) => {
    useWorldStore.setState((state) => ({
      ...state,
      currentWorldId: worldId
    }));
  };

  const handleDeleteClick = (worldId: string) => {
    setWorldToDeleteId(worldId);
    deleteConfirmationModal.open();
  };

  const handleCloseDeleteDialog = () => {
    deleteConfirmationModal.close();
    setWorldToDeleteId(null);
  };

  const handleConfirmDelete = () => {
    if (worldToDeleteId) {
      useWorldStore.setState((state) => {
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
        worlds={worlds} 
        currentWorldId={currentWorldId}
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
