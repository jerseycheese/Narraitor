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
        className="component-dashboard-continue-card"
        aria-labelledby="continue-game-heading"
      >
        <h2 id="continue-game-heading" >
          Continue Your Game
        </h2>

        <div >
          {/* Character Portrait */}
          <div >
            <CharacterPortrait
              portrait={character.portrait || { type: 'placeholder', url: null }}
              characterName={character.name}
              size="large"
            />
          </div>

          {/* Game Info */}
          <div >
            <div >
              <DataField label="World" value={world.name} />
              <DataField label="Character" value={character.name} />
            </div>

            <div >
              <DataField
                label="Progress"
                value={`${session.narrativeCount}entries`}
                variant=""
              />
              <time  dateTime={session.lastPlayed}>
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
          
        />
      </section>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Campaign"
        description="This will permanently delete all data for this campaign, including narrative progress and journal entries. This action cannot be undone."
        itemName={`${world.name}-${character.name}`}
        isDeleting={isDeleting}
      />
    </>
  );
}
