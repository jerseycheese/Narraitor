'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWorldStore } from '@/state/worldStore';
import WorldList from '@/components/WorldList/WorldList';
import {
  WorldViewToggle,
  WorldViewMode,
} from '@/components/world/WorldViewToggle';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog/DeleteConfirmationDialog';
import { LoadingPulse } from '@/components/ui/LoadingState';
import { ErrorDisplay } from '@/components/ui/ErrorDisplay';
import { World } from '@/types/world.types';
import {
  getUserFriendlyError,
  UserFriendlyError,
  ErrorType,
} from '@/lib/utils/errorUtils';
import { readString, writeString } from '@/lib/utils/browserStorage';

// WorldTable pulls @tanstack/react-table but only renders in table view; the
// list defaults to grid, so load it on demand (issue #1357).
const WorldTable = dynamic(
  () =>
    import('@/components/world/WorldTable').then((m) => ({
      default: m.WorldTable,
    })),
  { ssr: false }
);

interface WorldListScreenProps {
  /** Callback to pass the view toggle component to parent for header placement */
  onViewToggleRender?: (toggle: React.ReactNode) => void;
}

const WorldListScreen: React.FC<WorldListScreenProps> = ({
  onViewToggleRender,
}) => {
  const [worlds, setWorlds] = useState<World[]>([]);
  const [currentWorldId, setCurrentWorldId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<UserFriendlyError | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [worldToDeleteId, setWorldToDeleteId] = useState<string | null>(null);

  // View mode with localStorage persistence (following inventory pattern)
  const [viewMode, setViewMode] = useState<WorldViewMode>(
    () => (readString('local', 'world-view-mode') as WorldViewMode) || 'grid'
  );

  const handleViewModeChange = (mode: WorldViewMode) => {
    setViewMode(mode);
    writeString('local', 'world-view-mode', mode);
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
      const friendlyError =
        err instanceof Error
          ? getUserFriendlyError(err)
          : ({
              title: 'Failed to Load Worlds',
              message: 'Try refreshing the page.',
              retryable: false,
              type: ErrorType.UNKNOWN,
              severity: 'error',
            } satisfies UserFriendlyError);
      setError(friendlyError);
      setLoading(false);
    }
  }, []);

  const handleSelectWorld = (worldId: string) => {
    useWorldStore.getState().setCurrentWorld(worldId);
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
    }
    handleCloseDeleteDialog();
  };

  const worldToDelete = worlds.find((world) => world.id === worldToDeleteId);
  const deleteMessage = worldToDelete
    ? `Are you sure you want to delete the world "${worldToDelete.name}"?`
    : 'Are you sure you want to delete this world?';

  if (loading) {
    return (
      <section data-testid="world-list-screen-loading-indicator">
        <LoadingPulse message="Loading your worlds..." skeletonLines={3} />
      </section>
    );
  }

  if (error) {
    return (
      <section data-testid="world-list-screen-error-message">
        <ErrorDisplay
          variant="section"
          title={error.title || 'Error Loading Worlds'}
          message={error.message}
          severity="error"
          showRetry={Boolean(error.retryable)}
          onRetry={
            error.retryable
              ? () => useWorldStore.getState().fetchWorlds()
              : undefined
          }
        />
      </section>
    );
  }

  return (
    <main className="worlds-screen">
      {viewMode === 'table' ? (
        <WorldTable
          worlds={worlds}
          onDeleteWorld={handleDeleteClick}
        />
      ) : (
        <WorldList
          worlds={worlds}
          currentWorldId={currentWorldId}
          onSelectWorld={handleSelectWorld}
          onDeleteWorld={(id) => handleDeleteClick(id)}
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
