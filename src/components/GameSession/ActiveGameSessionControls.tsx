'use client';

import React from 'react';
import type { Character } from '@/state/characterStore';
import CharacterSummary from './CharacterSummary';
import { StorySummarySection } from './StorySummarySection';
import { ChoiceHistorySection } from './ChoiceHistorySection';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { SaveIndicator } from '@/components/ui/SaveIndicator';
import { JournalFloatingButton } from './JournalFloatingButton';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { InventoryList } from '@/components/inventory/InventoryList';
import type { UseAutoSaveReturn } from '@/hooks/useAutoSave';

interface ActiveGameSessionControlsProps {
  character?: Character;
  characterId?: string;
  worldId: string;
  sessionId: string;
  autoSave: UseAutoSaveReturn;
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
  autoSave,
  showEndConfirmation,
  onConfirmEndStory,
  onCloseEndStory,
  onOpenJournal,
}) => {
  return (
    <>
      {/* Character Summary Panel below hero */}
      {character && (
        <div className="mt-6">
          <CharacterSummary character={character} />
        </div>
      )}

      {/* Inventory Display */}
      {characterId && (
        <div className="mt-6" data-testid="inventory-collapsible" data-tutorial="inventory-toggle">
          <CollapsibleSection title="Inventory" initialCollapsed>
            <InventoryList characterId={characterId} />
          </CollapsibleSection>
        </div>
      )}

      <StorySummarySection worldId={worldId} sessionId={sessionId} characterId={characterId || undefined} />

      <ChoiceHistorySection sessionId={sessionId} />

      {/* Autosave indicator anchored under the main content */}
      <div className="mt-4">
        <SaveIndicator
          status={autoSave.status}
          lastSaveTime={autoSave.lastSaveTime}
          errorMessage={autoSave.errorMessage}
          totalSaves={autoSave.totalSaves}
          onManualSave={autoSave.triggerSave}
          onRetryError={autoSave.retry}
          retryable
          compact
          className="text-xs sm:text-sm"
        />
      </div>

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

      {/* Journal Floating Button - Issue #562 */}
      {character && (
        <JournalFloatingButton
          onClick={onOpenJournal}
          dataTutorialId="journal-toggle"
        />
      )}
    </>
  );
};

export default ActiveGameSessionControls;
