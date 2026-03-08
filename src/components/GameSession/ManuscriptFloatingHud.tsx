'use client';

import React from 'react';
import { useTheme } from '@/lib/theme/ThemeProvider';

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
}: ManuscriptFloatingHudProps) {
  return (
    <>
      <div className="manuscript-overlay-header-left">
        <div className="manuscript-header-controls">
          <button
            type="button"
            onClick={onToggleCharacterSummary}
            aria-expanded={isCharacterSummaryExpanded}
            className="manuscript-hud-text-button"
          >
            Character
          </button>

          {drawerTriggers && (
            <button
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
          <div className="manuscript-hud-panel manuscript-hud-panel-left manuscript-hud-character-panel">
            {characterSummaryPanel}
          </div>
        )}

        {isToolsMenuOpen && toolsMenuPanel && (
          <div className="manuscript-hud-panel manuscript-hud-panel-left">
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
}: ManuscriptFloatingHudProps) {
  return (
    <>
      <div className="manuscript-overlay-header-left">
        <div className="manuscript-header-controls">
          <button
            type="button"
            onClick={onToggleCharacterSummary}
            aria-expanded={isCharacterSummaryExpanded}
            className="manuscript-hud-character-link"
          >
            {characterName || 'Character'}
          </button>

          {drawerTriggers && (
            <button
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
          <div className="manuscript-hud-panel manuscript-hud-panel-left manuscript-hud-character-panel">
            {characterSummaryPanel}
          </div>
        )}

        {isToolsMenuOpen && toolsMenuPanel && (
          <div className="manuscript-hud-panel manuscript-hud-panel-left">
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

/* DS3 — Floating character pill (top-left) + icon buttons (top-right) */
function DS3FloatingPill({
  onToggleCharacterSummary,
  isCharacterSummaryExpanded,
  onToggleToolsMenu,
  isToolsMenuOpen,
  characterSummaryPanel,
  toolsMenuPanel,
  rightContent,
  drawerTriggers,
  characterName,
}: ManuscriptFloatingHudProps) {
  return (
    <>
      <div className="manuscript-overlay-header-left">
        <div className="manuscript-header-controls">
          <button
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

          {drawerTriggers && (
            <button
              type="button"
              onClick={onToggleToolsMenu}
              aria-label="Toggle Tools menu"
              aria-expanded={isToolsMenuOpen}
              className="manuscript-hud-icon-button"
            >
              {/* Gear icon */}
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
                <path d="M6.7 1.6l-.5 1.3a.8.8 0 0 1-1 .4l-1.3-.4a.4.4 0 0 0-.5.2L2.2 5a.4.4 0 0 0 .1.5l1 .9a.8.8 0 0 1 0 1.2l-1 .9a.4.4 0 0 0-.1.5l1.2 1.9a.4.4 0 0 0 .5.2l1.3-.4a.8.8 0 0 1 1 .4l.5 1.3a.4.4 0 0 0 .4.3h2.3a.4.4 0 0 0 .4-.3l.5-1.3a.8.8 0 0 1 1-.4l1.3.4a.4.4 0 0 0 .5-.2l1.2-1.9a.4.4 0 0 0-.1-.5l-1-.9a.8.8 0 0 1 0-1.2l1-.9a.4.4 0 0 0 .1-.5L12.6 3a.4.4 0 0 0-.5-.2l-1.3.4a.8.8 0 0 1-1-.4l-.5-1.3a.4.4 0 0 0-.4-.3H7.1a.4.4 0 0 0-.4.3Z" />
              </svg>
            </button>
          )}
        </div>

        {isCharacterSummaryExpanded && characterSummaryPanel && (
          <div className="manuscript-hud-panel manuscript-hud-panel-left manuscript-hud-character-panel">
            {characterSummaryPanel}
          </div>
        )}

        {isToolsMenuOpen && toolsMenuPanel && (
          <div className="manuscript-hud-panel manuscript-hud-panel-left">
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
