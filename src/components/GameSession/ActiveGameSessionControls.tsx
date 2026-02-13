'use client';

import React from 'react';
import { BookOpen } from 'lucide-react';
import type { Character } from '@/state/characterStore';
import { StorySummarySection } from './StorySummarySection';
import { ChoiceHistorySection } from './ChoiceHistorySection';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { InventoryList } from '@/components/inventory/InventoryList';
import { Button } from '@/components/ui/button';

interface ActiveGameSessionControlsProps {
  character?: Character;
  characterId?: string;
  worldId: string;
  sessionId: string;
  showEndConfirmation: boolean;
  onConfirmEndStory: () => void;
  onCloseEndStory: () => void;
  onOpenJournal: () => void;
}

const ActiveGameSessionControls: React.FC<ActiveGameSessionControlsProps> = ({
  character,
  characterId,
  worldId,
  sessionId,
  showEndConfirmation,
  onConfirmEndStory,
  onCloseEndStory,
  onOpenJournal,
}) => {
  return (
    <>
      {/* Inventory Display */}
      {characterId && (
        <div
          data-testid="inventory-collapsible"
          data-tutorial="inventory-toggle"
        >
          <CollapsibleSection title="Inventory" initialCollapsed>
            <InventoryList characterId={characterId} />
          </CollapsibleSection>
        </div>
      )}

      <StorySummarySection
        worldId={worldId}
        sessionId={sessionId}
        characterId={characterId || undefined}
      />

      <ChoiceHistorySection sessionId={sessionId} />

      {/* Journal Button */}
      {character && (
        <div>
          <Button
            onClick={onOpenJournal}
            variant="outline"
            className="group"
            data-tutorial="journal-toggle"
          >
            <span>
              <BookOpen />
              Open Journal
            </span>
          </Button>
        </div>
      )}

      {/* Manual End Story Confirmation */}
      <ConfirmationDialog
        isOpen={showEndConfirmation}
        onConfirm={onConfirmEndStory}
        onClose={onCloseEndStory}
        title="End Story"
        message="Are you sure you want to end your story? This will write a final ending based on your current progress and cannot be undone."
        variant="warning"
        confirmText="End Story"
        cancelText="Cancel"
      />
    </>
  );
};

export default ActiveGameSessionControls;
