import React, { useEffect, useRef } from 'react';
import type { SessionMetrics } from './hooks/useSessionPacing';

export interface SessionBreakPromptProps {
  isOpen: boolean;
  chapterNumber?: number;
  chapterRecap?: string;
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
  chapterNumber,
  chapterRecap,
  onDismiss,
  onContinue,
  sessionMetrics,
  className = '',
}) => {
  const isPreparingChapter = chapterNumber !== undefined && !chapterRecap;
  const dismiss = isPreparingChapter ? () => {} : onDismiss;
  const continueButtonRef = useRef<HTMLButtonElement>(null);
  const dismissButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousActiveElement = document.activeElement as HTMLElement | null;

    // Focus primary action on mount
    if (chapterNumber !== undefined) dismissButtonRef.current?.focus();
    else continueButtonRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (!isPreparingChapter) onDismiss();
        return;
      }

      if (e.key === 'Tab') {
        const dismissBtn = dismissButtonRef.current;
        const continueBtn = continueButtonRef.current;
        if (chapterNumber !== undefined && dismissBtn) {
          e.preventDefault();
          dismissBtn.focus();
          return;
        }
        if (!dismissBtn || !continueBtn) return;

        if (e.shiftKey) {
          if (document.activeElement === dismissBtn) {
            e.preventDefault();
            continueBtn.focus();
          }
        } else {
          if (document.activeElement === continueBtn) {
            e.preventDefault();
            dismissBtn.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousActiveElement?.focus?.();
    };
  }, [isOpen, onDismiss, isPreparingChapter, chapterNumber]);

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
      onClick={dismiss}
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
            {chapterNumber !== undefined ? `Chapter ${chapterNumber} complete` : 'Good stopping point'}
          </h2>
          <p id="session-break-prompt-desc" className="session-break-prompt-description">
            {chapterNumber !== undefined
              ? isPreparingChapter ? 'Preparing the recap for your next chapter...' : 'Your game continues from this recap.'
              : 'You have reached a natural pause in the story. Take a breather, step away, or keep reading whenever you are ready.'}
          </p>

          {chapterRecap && <p className="session-break-prompt-description">{chapterRecap.split('\n').map((line, index) => <React.Fragment key={line}>{index > 0 && <br />}{line}</React.Fragment>)}</p>}
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
            ref={dismissButtonRef}
            type="button"
            className="session-break-prompt-dismiss-button"
            onClick={dismiss}
            aria-disabled={isPreparingChapter || undefined}
          >
            {chapterNumber !== undefined ? isPreparingChapter ? 'Preparing recap' : 'Continue next chapter' : 'Dismiss'}
          </button>
          {chapterNumber === undefined && <button
            ref={continueButtonRef}
            type="button"
            className="session-break-prompt-continue-button"
            onClick={handleContinue}
          >
            Continue reading
          </button>}
        </div>
      </div>
    </div>
  );
};
