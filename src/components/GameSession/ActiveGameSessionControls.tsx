'use client';

import React from 'react';
import type { Character } from '@/state/characterStore';
import { StorySummarySection } from './StorySummarySection';
import { ChoiceHistorySection } from './ChoiceHistorySection';
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
          className="manuscript-support-inventory"
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
      {showEndConfirmation && (
        <div 
          className="manuscript-end-story-backdrop"
          onClick={onCloseEndStory}
          role="presentation"
        >
          <div 
            className="manuscript-end-story-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="end-story-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="manuscript-end-story-header">
              <h2 id="end-story-title" className="manuscript-end-story-title">End Story</h2>
            </div>
            
            <div className="manuscript-end-story-body">
              <p className="manuscript-end-story-message">
                Are you sure you want to end your story? This will write a final ending based on your current progress and cannot be undone.
              </p>
            </div>
            
            <div className="manuscript-end-story-footer">
              <button 
                className="manuscript-end-story-cancel"
                onClick={onCloseEndStory}
              >
                Cancel
              </button>
              <button 
                className="manuscript-end-story-confirm"
                onClick={onConfirmEndStory}
              >
                Confirm End Story
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveGameSessionControls;
