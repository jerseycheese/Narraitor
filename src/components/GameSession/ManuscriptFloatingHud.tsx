import React from 'react';
import { cssClasses } from '@/lib/utils';

interface ManuscriptFloatingHudProps {
  onToggleCharacterSummary: () => void;
  isCharacterSummaryExpanded: boolean;
  className?: string;
  characterSummaryPanel?: React.ReactNode;
  rightContent?: React.ReactNode;
  leftContent?: React.ReactNode;
  drawerTriggers?: React.ReactNode;
}

export const ManuscriptFloatingHud: React.FC<ManuscriptFloatingHudProps> = ({
  onToggleCharacterSummary,
  isCharacterSummaryExpanded,
  className,
  characterSummaryPanel,
  rightContent,
  leftContent,
  drawerTriggers,
}) => {
  return (
    <div
      className={cssClasses('manuscript-floating-hud', className)}
      data-testid="manuscript-floating-hud"
    >
      <div className="manuscript-overlay-header-left manuscript-hud-zone">
        <div className="manuscript-hud-group">
          {leftContent}
          <div className="manuscript-hud-stack">
            <div className="manuscript-hud-controls">
              <button
                type="button"
                onClick={onToggleCharacterSummary}
                aria-expanded={isCharacterSummaryExpanded}
                className="manuscript-hud-text-button"
              >
                Character Summary
              </button>

              {drawerTriggers}
            </div>

            {isCharacterSummaryExpanded && characterSummaryPanel && (
              <div className="manuscript-hud-panel manuscript-hud-panel-left manuscript-hud-character-panel">
                {characterSummaryPanel}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="manuscript-overlay-header-right manuscript-hud-zone">
        <div className="manuscript-hud-group manuscript-hud-group-right">
          {rightContent}
        </div>
      </div>
    </div>
  );
};
