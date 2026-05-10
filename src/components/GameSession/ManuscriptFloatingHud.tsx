'use client';

import React from 'react';
import { useTheme } from '@/lib/theme/ThemeProvider';
import { BookOpen, Backpack, FileText, RotateCcw, LogOut, History } from 'lucide-react';

interface ManuscriptFloatingHudProps {
  onToggleCharacterSummary: () => void;
  isCharacterSummaryExpanded: boolean;
  onToggleToolsMenu: () => void;
  isToolsMenuOpen: boolean;
  className?: string;
  characterSummaryPanel?: React.ReactNode;
  toolsMenuPanel?: React.ReactNode;
  rightContent?: React.ReactNode;
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

export const ManuscriptFloatingHud: React.FC<ManuscriptFloatingHudProps> = (props) => {
  const { theme } = useTheme();

  if (theme === 'ds2') return <DS2RunningHead {...props} />;
  if (theme === 'ds3') return <DS3FloatingPill {...props} />;
  return <DS1ChromeBar {...props} />;
};

/* DS1 — Chrome bar with bordered "Character" / "Tools" buttons (current production) */
function DS1ChromeBar({
  onToggleCharacterSummary,
  isCharacterSummaryExpanded,
  onToggleToolsMenu,
  isToolsMenuOpen,
  characterSummaryPanel,
  toolsMenuPanel,
  rightContent,
  drawerTriggers,
  characterButtonRef,
  toolsButtonRef,
}: ManuscriptFloatingHudProps) {
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
            onClick={onToggleCharacterSummary}
            aria-expanded={isCharacterSummaryExpanded}
            className="manuscript-hud-text-button"
          >
            Character
          </button>

          {drawerTriggers && (
            <button
              ref={toolsButtonRef}
              type="button"
              onClick={onToggleToolsMenu}
              aria-label="Toggle Tools menu"
              aria-expanded={isToolsMenuOpen}
              className="manuscript-hud-text-button"
            >
              Tools
            </button>
          )}
        </div>

        {isCharacterSummaryExpanded && characterSummaryPanel && (
          <div ref={focusPanel} tabIndex={-1} className="manuscript-hud-panel manuscript-hud-panel-left manuscript-hud-character-panel">
            {characterSummaryPanel}
          </div>
        )}

        {isToolsMenuOpen && toolsMenuPanel && (
          <div ref={focusPanel} tabIndex={-1} className="manuscript-hud-panel manuscript-hud-panel-left">
            {toolsMenuPanel}
          </div>
        )}
      </div>

      <div className="manuscript-overlay-header-right">
        {rightContent}
      </div>
    </>
  );
}

/* DS2 — Running-head with character name as text link, ambient "Tools" label */
function DS2RunningHead({
  onToggleCharacterSummary,
  isCharacterSummaryExpanded,
  onToggleToolsMenu,
  isToolsMenuOpen,
  characterSummaryPanel,
  toolsMenuPanel,
  rightContent,
  drawerTriggers,
  characterName,
  characterButtonRef,
  toolsButtonRef,
}: ManuscriptFloatingHudProps) {
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
            onClick={onToggleCharacterSummary}
            aria-expanded={isCharacterSummaryExpanded}
            className="manuscript-hud-character-link"
          >
            {characterName || 'Character'}
          </button>

          {drawerTriggers && (
            <button
              ref={toolsButtonRef}
              type="button"
              onClick={onToggleToolsMenu}
              aria-label="Toggle Tools menu"
              aria-expanded={isToolsMenuOpen}
              className="manuscript-hud-text-button"
            >
              Tools
            </button>
          )}
        </div>

        {isCharacterSummaryExpanded && characterSummaryPanel && (
          <div ref={focusPanel} tabIndex={-1} className="manuscript-hud-panel manuscript-hud-panel-left manuscript-hud-character-panel">
            {characterSummaryPanel}
          </div>
        )}

        {isToolsMenuOpen && toolsMenuPanel && (
          <div ref={focusPanel} tabIndex={-1} className="manuscript-hud-panel manuscript-hud-panel-left">
            {toolsMenuPanel}
          </div>
        )}
      </div>

      <span className="manuscript-hud-center-label">Current Session</span>

      <div className="manuscript-overlay-header-right">
        {rightContent}
      </div>
    </>
  );
}

/* DS3 — Floating character pill (top-left) + icon buttons (top-right) */
function DS3FloatingPill({
  onToggleCharacterSummary,
  isCharacterSummaryExpanded,
  characterSummaryPanel,
  characterName,
  onOpenDrawer,
  onStartNew,
  onEndStory,
  saveIndicator,
  characterButtonRef,
}: ManuscriptFloatingHudProps) {
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
          <button
            type="button"
            onClick={onStartNew}
            title="Reset Session"
            aria-label="Reset Session"
            className="manuscript-hud-icon-button"
          >
            <RotateCcw size={16} aria-hidden="true" />
          </button>
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
}
