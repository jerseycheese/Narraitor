import React, { useEffect, useRef } from 'react';
import type { SessionMetrics } from './hooks/useSessionPacing';

export interface SessionBreakPromptProps {
  isOpen: boolean;
  onDismiss: () => void;
  onContinue?: () => void;
  sessionMetrics?: Partial<SessionMetrics>;
  className?: string;
}

/**
 * Accessible, soft break prompt suggesting a natural stopping point
 * during long game sessions to prevent reading fatigue.
 */
export const SessionBreakPrompt: React.FC<SessionBreakPromptProps> = ({
  isOpen,
  onDismiss,
  onContinue,
  sessionMetrics,
  className = '',
}) => {
  const continueButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus primary action on mount
    continueButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onDismiss]);

  if (!isOpen) return null;

  const handleContinue = () => {
    if (onContinue) {
      onContinue();
    } else {
      onDismiss();
    }
  };

  const elapsedMinutes = sessionMetrics?.elapsedMinutes ?? (
    sessionMetrics?.elapsedTimeMs ? Math.floor(sessionMetrics.elapsedTimeMs / 60000) : 0
  );
  const segmentCount = sessionMetrics?.segmentCount;
  const decisionCount = sessionMetrics?.decisionCount;

  return (
    <div
      className={['session-break-prompt-overlay', className].filter(Boolean).join(' ')}
      role="presentation"
      onClick={onDismiss}
    >
      <div
        className="session-break-prompt"
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-break-prompt-title"
        aria-describedby="session-break-prompt-desc"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="session-break-prompt-content">
          <h2 id="session-break-prompt-title" className="session-break-prompt-title">
            Good stopping point
          </h2>
          <p id="session-break-prompt-desc" className="session-break-prompt-description">
            You have reached a natural pause in the story. Take a breather, step away, or keep reading whenever you are ready.
          </p>

          {(elapsedMinutes > 0 || (segmentCount !== undefined && segmentCount > 0)) && (
            <div className="session-break-prompt-metrics">
              {elapsedMinutes > 0 && (
                <div className="session-break-prompt-metric-item">
                  <span className="session-break-prompt-metric-label">Time elapsed</span>
                  <span className="session-break-prompt-metric-value">{elapsedMinutes} min</span>
                </div>
              )}
              {segmentCount !== undefined && segmentCount > 0 && (
                <div className="session-break-prompt-metric-item">
                  <span className="session-break-prompt-metric-label">Story beats</span>
                  <span className="session-break-prompt-metric-value">{segmentCount}</span>
                </div>
              )}
              {decisionCount !== undefined && decisionCount > 0 && (
                <div className="session-break-prompt-metric-item">
                  <span className="session-break-prompt-metric-label">Decisions made</span>
                  <span className="session-break-prompt-metric-value">{decisionCount}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="session-break-prompt-actions">
          <button
            type="button"
            className="session-break-prompt-dismiss-button"
            onClick={onDismiss}
          >
            Dismiss
          </button>
          <button
            ref={continueButtonRef}
            type="button"
            className="session-break-prompt-continue-button"
            onClick={handleContinue}
          >
            Continue reading
          </button>
        </div>
      </div>
    </div>
  );
};
