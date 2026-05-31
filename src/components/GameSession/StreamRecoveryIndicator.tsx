'use client';

import React from 'react';
import { LoadingState } from '@/components/ui/LoadingState/LoadingState';

interface StreamRecoveryIndicatorProps {
  /** Whether a stream resume is currently in progress. */
  resuming: boolean;
}

/**
 * Lightweight feedback shown while the stream resilience middleware (issue #903)
 * auto-resumes an interrupted generation. Renders nothing when not resuming so it
 * can sit inline in a narrative view without reserving space.
 *
 * Presentational only — it reflects resume state passed by a caller and is not yet
 * wired into live generation (deferred follow-up).
 */
const StreamRecoveryIndicator: React.FC<StreamRecoveryIndicatorProps> = ({
  resuming,
}) => {
  if (!resuming) return null;

  return (
    <div
      className="stream-recovery-indicator"
      role="status"
      aria-live="polite"
    >
      <LoadingState
        variant="spinner"
        size="sm"
        message="Reconnecting…"
        inline
        centered={false}
      />
    </div>
  );
};

export default StreamRecoveryIndicator;
