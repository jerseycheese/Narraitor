'use client';

import React from 'react';
import { BookOpen, Backpack, FileText, RotateCcw, LogOut, History, Keyboard } from 'lucide-react';
import { HudCloseButton } from './HudCloseButton';
import { CharacterPortrait } from '@/components/CharacterPortrait';
import { useRovingToolbar } from '@/hooks/useRovingToolbar';
import type { GeneratedImage } from '@/types/common.types';

interface ManuscriptFloatingHudProps {
  onToggleCharacterSummary: () => void;
  isCharacterSummaryExpanded: boolean;
  className?: string;
  characterSummaryPanel?: React.ReactNode;
  drawerTriggers?: boolean;
  characterName?: string;
  characterPortrait?: GeneratedImage;
  onOpenDrawer?: (drawerType: string) => void;
  onStartNew?: () => void;
  onBack?: () => void;
  onEndStory?: () => void;
  onShowShortcuts?: () => void;
  saveIndicator?: React.ReactNode;
  characterButtonRef?: React.RefObject<HTMLButtonElement | null>;
}

/* Floating character pill (top-left) + icon buttons (top-right) */
export const ManuscriptFloatingHud: React.FC<ManuscriptFloatingHudProps> = ({
  onToggleCharacterSummary,
  isCharacterSummaryExpanded,
  characterSummaryPanel,
  characterName,
  characterPortrait,
  drawerTriggers,
  onOpenDrawer,
  onStartNew,
  onBack,
  onEndStory,
  onShowShortcuts,
  saveIndicator,
  characterButtonRef,
}) => {
  const focusPanel = React.useCallback((node: HTMLDivElement | null) => {
    node?.focus();
  }, []);

  const { toolbarRef, onKeyDown, onFocus } = useRovingToolbar<HTMLDivElement>();

  // Close the character panel on an outside click, matching the click-outside
  // pattern the header's other popovers already use (ThemeMenu,
  // RecentPagesDropdown). Escape and the toggle button itself stay the
  // caller's job (ActiveGameSession owns isCharacterSummaryExpanded).
  const headerLeftRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!isCharacterSummaryExpanded) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!headerLeftRef.current?.contains(event.target as Node)) {
        onToggleCharacterSummary();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isCharacterSummaryExpanded, onToggleCharacterSummary]);

  return (
    <>
      <div className="manuscript-overlay-header-left" ref={headerLeftRef}>
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
              {characterPortrait && (
                <CharacterPortrait
                  portrait={characterPortrait}
                  characterName={characterName || 'Character'}
                  size="small"
                />
              )}
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
        <div
          ref={toolbarRef}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          role="toolbar"
          aria-label="Session tools"
          className="manuscript-ds3-controls"
        >
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
            onClick={onShowShortcuts}
            title="Keyboard Shortcuts"
            aria-label="Keyboard Shortcuts"
            className="manuscript-hud-icon-button manuscript-hud-shortcuts-button"
          >
            <Keyboard size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={onStartNew}
            title="Reset Session"
            aria-label="Reset Session"
            className="manuscript-hud-icon-button"
          >
            <RotateCcw size={16} aria-hidden="true" />
          </button>
          <HudCloseButton onBack={onBack} />
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
