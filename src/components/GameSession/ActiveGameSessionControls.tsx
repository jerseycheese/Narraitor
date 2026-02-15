'use client';

import React from 'react';
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
  isProgressiveDisclosureEnabled?: boolean;
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
  isProgressiveDisclosureEnabled = false,
}) => {
  return (
    <div className="manuscript-support-sections">
      {/* Inventory Display - hidden when progressive disclosure is enabled */}
      {!isProgressiveDisclosureEnabled && characterId && (
        <div
          className="manuscript-support-section"
          data-testid="inventory-collapsible"
          data-tutorial="inventory-toggle"
        >
          <CollapsibleSection title="Inventory" initialCollapsed>
            <InventoryList characterId={characterId} />
          </CollapsibleSection>
        </div>
      )}

      {/* Story Summary Section - hidden when progressive disclosure is enabled */}
      {!isProgressiveDisclosureEnabled && (
        <div className="manuscript-support-section">
          <StorySummarySection
            worldId={worldId}
            sessionId={sessionId}
            characterId={characterId || undefined}
          />
        </div>
      )}

      {/* Choice History Section - hidden when progressive disclosure is enabled */}
      {!isProgressiveDisclosureEnabled && (
        <div className="manuscript-support-section">
          <ChoiceHistorySection sessionId={sessionId} />
        </div>
      )}

      {/* Journal Button - hidden when progressive disclosure is enabled */}
      {!isProgressiveDisclosureEnabled && character && (
        <div className="manuscript-support-section manuscript-support-section-journal">
          <Button
            onClick={onOpenJournal}
            variant="outline"
            className="manuscript-journal-button"
            data-tutorial="journal-toggle"
          >
            <span className="manuscript-journal-button-label">
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
    </div>
  );
};

export default ActiveGameSessionControls;
