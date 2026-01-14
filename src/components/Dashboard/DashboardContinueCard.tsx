'use client';

import React, { useState } from 'react';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { DataField } from '@/components/shared/DataField';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { formatRelativeTime } from '@/lib/utils';
import type { SavedSessionInfo } from '@/types/game.types';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';

interface DashboardContinueCardProps {
  session: SavedSessionInfo;
  world: ReturnType<typeof useWorldStore.getState>["worlds"][string];
  character: ReturnType<typeof useCharacterStore.getState>["characters"][string];
  onContinue: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
}

export function DashboardContinueCard({
  session,
  world,
  character,
  onContinue,
  onDelete
}: DashboardContinueCardProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const lastPlayedText = formatRelativeTime(session.lastPlayed);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(session.id);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  return (
    <>
      <section
        className="bg-background rounded-lg border-2 border-primary p-6 shadow-md"
        aria-labelledby="continue-game-heading"
      >
        <h2 id="continue-game-heading" className="text-lg font-semibold mb-4">
          Continue Your Game
        </h2>

        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-6">
          {/* Character Portrait */}
          <div className="flex-shrink-0 mx-auto sm:mx-0">
            <CharacterPortrait
              portrait={character.portrait || { type: 'placeholder', url: null }}
              characterName={character.name}
              size="large"
            />
          </div>

          {/* Game Info */}
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
              <DataField label="World" value={world.name} />
              <DataField label="Character" value={character.name} />
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-t pt-3">
              <DataField
                label="Progress"
                value={`${session.narrativeCount} entries`}
                variant="inline"
              />
              <time className="text-xs text-muted-foreground" dateTime={session.lastPlayed}>
                Last played {lastPlayedText}
              </time>
            </div>
          </div>
        </div>

        <ActionButtonGroup
          actions={[
            {
              label: 'Continue Last Game',
              onClick: () => onContinue(session.id),
              variant: 'success'
            },
            {
              label: 'Delete',
              onClick: () => setIsDeleteDialogOpen(true),
              variant: 'danger'
            }
          ]}
          className="[&>button:first-child]:flex-1"
        />
      </section>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Campaign"
        description="This will permanently delete all data for this campaign, including narrative progress and journal entries. This action cannot be undone."
        itemName={`${world.name} - ${character.name}`}
        isDeleting={isDeleting}
      />
    </>
  );
}
