'use client';

import React, { useEffect, useState } from 'react';
import { useWorldStore } from '@/state/worldStore';
import WorldList from '@/components/WorldList/WorldList';
import { WorldTable } from '@/components/world/WorldTable';
import { WorldViewToggle, WorldViewMode } from '@/components/world/WorldViewToggle';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog/DeleteConfirmationDialog';
import { LoadingPulse } from '@/components/ui/LoadingState';
import { SectionError } from '@/components/ui/ErrorDisplay';
import { World } from '@/types/world.types';
import { EntityID } from '@/types/common.types';
import { getUserFriendlyError, UserFriendlyError, ErrorType } from '@/lib/utils/errorUtils';

interface WorldListScreenProps {
  _router?: {
    push: (url: string) => void;
  };
  _storeActions?: {
    setCurrentWorld: (id: string) => void;
  };
  /** Callback to pass the view toggle component to parent for header placement */
  onViewToggleRender?: (toggle: React.ReactNode) => void;
}

const WorldListScreen: React.FC<WorldListScreenProps> = ({ _router, _storeActions, onViewToggleRender }) => {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [currentWorldId, setCurrentWorldId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<UserFriendlyError | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [worldToDeleteId, setWorldToDeleteId] = useState<string | null>(null);
  const [selectedWorldIds, setSelectedWorldIds] = useState<EntityID[]>([]);

  // View mode with localStorage persistence (following inventory pattern)
  const [viewMode, setViewMode] = useState<WorldViewMode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('world-view-mode');
      return (saved as WorldViewMode) || 'grid';
    }
    return 'grid';
  });

  const handleViewModeChange = (mode: WorldViewMode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('world-view-mode', mode);
    }
  };

  // Pass the view toggle component to parent for header placement
  useEffect(() => {
    if (onViewToggleRender) {
      onViewToggleRender(
        <WorldViewToggle mode={viewMode} onModeChange={handleViewModeChange} />
      );
    }
  }, [viewMode, onViewToggleRender]);

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

  const toggleWorldSelection = (worldId: EntityID) => {
    setSelectedWorldIds(prev => {
      if (prev.includes(worldId)) return prev.filter(id => id !== worldId);
      if (prev.length >= 5) return prev;  // Max 5 for comparison
      return [...prev, worldId];
    });
  };

  const handleDeleteClick = (worldId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setWorldToDeleteId(worldId);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setWorldToDeleteId(null);
  };

  const handleConfirmDelete = async () => {
    if (worldToDeleteId) {
      await useWorldStore.getState().deleteWorld(worldToDeleteId);
      // Also remove from selection if deleted
      setSelectedWorldIds(prev => prev.filter(id => id !== worldToDeleteId));
    }
    handleCloseDeleteDialog();
  };

  const worldToDelete = worlds.find((world) => world.id === worldToDeleteId);
  const deleteMessage = worldToDelete
    ? `Are you sure you want to delete the world "${worldToDelete.name}"?`
    : 'Are you sure you want to delete this world?';

  if (loading) {
    return (
      <section  data-testid="world-list-screen-loading-indicator">
        <LoadingPulse message="Loading your worlds..." skeletonLines={3} />
      </section>
    );
  }

  if (error) {
    return (
      <section  data-testid="world-list-screen-error-message">
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
      {viewMode === 'table' ? (
        <WorldTable
          worlds={worlds}
          selectedWorldIds={selectedWorldIds}
          onToggleSelect={toggleWorldSelection}
          onDeleteWorld={handleDeleteClick}
        />
      ) : (
        <WorldList 
          worlds={worlds} 
          currentWorldId={currentWorldId}
          onSelectWorld={handleSelectWorld} 
          onDeleteWorld={(id) => handleDeleteClick(id)}
          selectedWorldIds={selectedWorldIds}
          onToggleSelect={toggleWorldSelection}
          _router={_router}
          _storeActions={_storeActions}
        />
      )}
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
