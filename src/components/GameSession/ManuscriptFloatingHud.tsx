import React from 'react';
import { cssClasses } from '@/lib/utils';

interface ManuscriptFloatingHudProps {
  onToggleCharacterSummary: () => void;
  isCharacterSummaryExpanded: boolean;
  onToggleToolsMenu: () => void;
  isToolsMenuOpen: boolean;
  className?: string;
  characterSummaryPanel?: React.ReactNode;
  toolsMenuPanel?: React.ReactNode;
  rightContent?: React.ReactNode;
  drawerTriggers?: React.ReactNode;
}

export const ManuscriptFloatingHud: React.FC<ManuscriptFloatingHudProps> = ({
  onToggleCharacterSummary,
  isCharacterSummaryExpanded,
  onToggleToolsMenu,
  isToolsMenuOpen,
  className,
  characterSummaryPanel,
  toolsMenuPanel,
  rightContent,
  drawerTriggers,
}) => {
  return (
    <div
      className={cssClasses('manuscript-floating-hud-inner', className)}
      data-testid="manuscript-floating-hud"
    >
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
    </div>
  );
};
