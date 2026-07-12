'use client';

import React from 'react';
import { BookOpen, Backpack, FileText, RotateCcw, LogOut, History } from 'lucide-react';
import { HudCloseButton } from './HudCloseButton';

interface ManuscriptFloatingHudProps {
  onToggleCharacterSummary: () => void;
  isCharacterSummaryExpanded: boolean;
  onToggleToolsMenu: () => void;
  isToolsMenuOpen: boolean;
  className?: string;
  characterSummaryPanel?: React.ReactNode;
  toolsMenuPanel?: React.ReactNode;
  drawerTriggers?: boolean;
  characterName?: string;
  onOpenDrawer?: (drawerType: string) => void;
  onStartNew?: () => void;
  onBack?: () => void;
  onEndStory?: () => void;
  saveIndicator?: React.ReactNode;
  characterButtonRef?: React.RefObject<HTMLButtonElement | null>;
  toolsButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

/* Floating character pill (top-left) + icon buttons (top-right) */
export const ManuscriptFloatingHud: React.FC<ManuscriptFloatingHudProps> = ({
  onToggleCharacterSummary,
  isCharacterSummaryExpanded,
  characterSummaryPanel,
  characterName,
  drawerTriggers,
  onOpenDrawer,
  onStartNew,
  onBack,
  onEndStory,
  saveIndicator,
  characterButtonRef,
}) => {
  const focusPanel = React.useCallback((node: HTMLDivElement | null) => {
    node?.focus();
  }, []);

  return (
    <>
      <div className="manuscript-overlay-header-left">
        <div className="manuscript-header-controls">
          <button
            ref={characterButtonRef}
            type="button"
            data-tutorial="session-character"
            onClick={onToggleCharacterSummary}
            aria-expanded={isCharacterSummaryExpanded}
            className="manuscript-hud-character-pill"
          >
            <span className="manuscript-hud-character-pill-avatar" aria-hidden="true">
              {/* Avatar placeholder — CSS handles sizing */}
            </span>
            <span>{characterName || 'Character'}</span>
          </button>
        </div>

        {isCharacterSummaryExpanded && characterSummaryPanel && (
          <div ref={focusPanel} tabIndex={-1} className="manuscript-hud-panel manuscript-hud-panel-left manuscript-hud-character-panel">
            {characterSummaryPanel}
          </div>
        )}
      </div>

      <div className="manuscript-overlay-header-right">
        <div className="manuscript-ds3-controls">
          {saveIndicator}
          {drawerTriggers && (
            <>
              <button
                type="button"
                onClick={() => onOpenDrawer?.('journal')}
                title="Journal"
                aria-label="Journal"
                className="manuscript-hud-icon-button"
              >
                <BookOpen size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onOpenDrawer?.('inventory')}
                title="Inventory"
                aria-label="Inventory"
                className="manuscript-hud-icon-button"
              >
                <Backpack size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onOpenDrawer?.('story-summary')}
                title="Story Summary"
                aria-label="Story Summary"
                className="manuscript-hud-icon-button"
              >
                <FileText size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => onOpenDrawer?.('choice-history')}
                title="Choice History"
                aria-label="Choice History"
                className="manuscript-hud-icon-button"
              >
                <History size={16} aria-hidden="true" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onStartNew}
            title="Reset Session"
            aria-label="Reset Session"
            className="manuscript-hud-icon-button"
          >
            <RotateCcw size={16} aria-hidden="true" />
          </button>
          <HudCloseButton variant="icon" onBack={onBack} />
          <button
            type="button"
            onClick={onEndStory}
            title="End Story"
            aria-label="End Story"
            className="manuscript-hud-icon-button"
          >
            <LogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </div>
    </>
  );
};
