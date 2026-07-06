'use client';

import React, { useEffect, useRef } from 'react';
import { RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/utils';

interface GameSessionRecoveryPromptProps {
  isOpen: boolean;
  worldName: string;
  characterName: string;
  /** ISO timestamp of the last activity before the session ended abnormally. */
  lastActivity: string;
  narrativeCount: number;
  onRestore: () => void;
  onDismiss: () => void;
}

/**
 * Recovery prompt shown when a previous game session ended unexpectedly
 * (browser crash, tab killed). Offers to restore the auto-saved session or to
 * step away and start fresh (issue #221).
 *
 * Built on the Radix dialog primitives directly — with its own scoped overlay
 * and surface classes — so it presents as a centered modal with its own focus
 * trap and scrim, rather than inheriting the shared modal's in-flow rendering.
 */
export function GameSessionRecoveryPrompt({
  isOpen,
  worldName,
  characterName,
  lastActivity,
  narrativeCount,
  onRestore,
  onDismiss,
}: GameSessionRecoveryPromptProps) {
  const relativeTime = formatRelativeTime(lastActivity);
  const continueButtonRef = useRef<HTMLButtonElement>(null);

  // Lead with the primary action for keyboard users.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const timer = setTimeout(() => continueButtonRef.current?.focus(), 80);
    return () => clearTimeout(timer);
  }, [isOpen]);

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onDismiss();
        }
      }}
    >
      <DialogContent
        className="game-session-recovery-modal"
        overlayClassName="game-session-recovery-scrim"
        overlayScroll
        showCloseButton={false}
        aria-describedby="game-session-recovery-desc"
      >
        <div className="game-session-recovery-prompt">
          <div className="game-session-recovery-prompt-icon" aria-hidden="true">
            <RotateCcw />
          </div>
          <div className="game-session-recovery-prompt-body">
            <DialogTitle className="game-session-recovery-prompt-title">
              Welcome back — pick up where you left off?
            </DialogTitle>
            <p
              id="game-session-recovery-desc"
              className="game-session-recovery-prompt-lead"
            >
              Your last session ended before you could save your spot. Don&apos;t
              worry — your story was kept safe. Jump back in right where you left
              off.
            </p>
            <dl className="game-session-recovery-prompt-details">
              <div className="game-session-recovery-prompt-detail">
                <dt>World</dt>
                <dd>{worldName}</dd>
              </div>
              <div className="game-session-recovery-prompt-detail">
                <dt>Character</dt>
                <dd>{characterName}</dd>
              </div>
              {narrativeCount > 0 && (
                <div className="game-session-recovery-prompt-detail">
                  <dt>Progress</dt>
                  <dd>
                    {narrativeCount} {narrativeCount === 1 ? 'scene' : 'scenes'}
                  </dd>
                </div>
              )}
              <div className="game-session-recovery-prompt-detail">
                <dt>Last played</dt>
                <dd>{relativeTime}</dd>
              </div>
            </dl>
            <div className="game-session-recovery-prompt-actions">
              <Button
                variant="outline"
                onClick={onDismiss}
                aria-label="Dismiss recovery and start fresh"
              >
                Start fresh
              </Button>
              <Button
                ref={continueButtonRef}
                variant="default"
                onClick={onRestore}
                aria-label="Continue your recovered adventure"
              >
                Continue adventure
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
