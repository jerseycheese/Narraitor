'use client';

import { useEffect } from 'react';
import { ActionButtonGroup } from '@/components/shared/ActionButtonGroup';
import { getUserFriendlyError } from '@/lib/utils/errorUtils';
import { reportError } from '@/lib/telemetry/reportError';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // A segment render crash never touches logger.error, so without this the most
  // common client failure path would still be silent in production (#1641).
  useEffect(() => {
    reportError(error, { source: 'error-boundary', digest: error.digest });
  }, [error]);

  // Translate the raw error into plain language rather than leaking the
  // technical message (and any stack detail) straight to the player.
  const friendly = getUserFriendlyError(error);

  return (
    <div className="app-error">
      <h2 className="error-display-title">{friendly.title}</h2>
      <p className="error-display-message">{friendly.message}</p>
      {friendly.suggestion && (
        <p className="error-display-suggestion">{friendly.suggestion}</p>
      )}
      <ActionButtonGroup
        actions={[{
          label: friendly.actionLabel ?? 'Try again',
          onClick: reset,
          variant: 'primary'
        }]}
      />
    </div>
  );
}
