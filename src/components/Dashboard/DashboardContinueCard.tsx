'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';
import DeleteConfirmationDialog from '@/components/DeleteConfirmationDialog';
import { formatRelativeTime } from '@/lib/utils';
import type { SavedSessionInfo } from '@/types/game.types';
import { useWorldStore } from '@/state/worldStore';
import { useCharacterStore } from '@/state/characterStore';

interface DashboardContinueCardProps {
  session: SavedSessionInfo;
  world: ReturnType<typeof useWorldStore.getState>['worlds'][string];
  character: ReturnType<
    typeof useCharacterStore.getState
  >['characters'][string];
  onContinue: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
}

export function DashboardContinueCard({
  session,
  world,
  character,
  onContinue,
  onDelete,
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
        {/* World image as an atmospheric background layer. Hidden by
            default; per-theme CSS opts in and applies a legibility scrim. */}
        {world.image?.url && (
          <div className="dashboard-continue-card-bg" aria-hidden="true">
            <Image src={world.image.url} alt="" fill sizes="100vw" />
          </div>
        )}

        <h2 id="continue-game-heading">Continue Your Game</h2>

        <div className="dashboard-continue-card-row">
          {/* Character Portrait */}
          <div className="dashboard-continue-card-portrait">
            <CharacterPortrait
              portrait={
                character.portrait || { type: 'placeholder', url: null }
              }
              characterName={character.name}
              size="large"
            />
          </div>

          {/* Game Info */}
          <div className="dashboard-continue-card-info">
            <dl className="dashboard-continue-card-fields">
              <div className="dashboard-continue-card-field">
                <dt>World</dt>
                <dd>{world.name}</dd>
              </div>
              <div className="dashboard-continue-card-field">
                <dt>Character</dt>
                <dd>{character.name}</dd>
              </div>
            </dl>

            <p className="dashboard-continue-card-meta">
              <time dateTime={session.lastPlayed}>
                Last played {lastPlayedText}
              </time>
            </p>
          </div>
        </div>

        <ActionButtonGroup
          layout="horizontal"
          gap="sm"
          actions={[
            {
              label: 'Continue Last Game',
              onClick: () => onContinue(session.id),
              variant: 'success',
            },
            {
              label: 'Delete',
              onClick: () => setIsDeleteDialogOpen(true),
              variant: 'ghost',
            },
          ]}
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
