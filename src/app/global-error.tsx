'use client';

import { useEffect } from 'react';
import { getUserFriendlyError } from '@/lib/utils/errorUtils';
import { reportError } from '@/lib/telemetry/reportError';
// global-error replaces the root layout entirely, so nothing the layout
// imports is loaded here. Pull in the token files and globals.css directly or
// the crash screen renders unstyled.
import '@/lib/theme/themes/_shared-tokens.css';
import '@/lib/theme/themes/ds3.css';
import './globals.css';

/**
 * Last-resort boundary for a crash in the root layout itself (#1641).
 *
 * Renders outside the app shell, so it can't use the theme, toast, or devtools
 * providers — plain markup and design tokens only.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportError(error, { source: 'global-error', digest: error.digest });
  }, [error]);

  // Plain language rather than the raw message, matching src/app/error.tsx.
  const friendly = getUserFriendlyError(error);

  return (
    <html lang="en">
      <body>
        <div className="app-global-error">
          <h1 className="app-global-error-title">{friendly.title}</h1>
          <p className="app-global-error-message">{friendly.message}</p>
          {friendly.suggestion && (
            <p className="app-global-error-suggestion">{friendly.suggestion}</p>
          )}
          <button type="button" className="app-global-error-action" onClick={reset}>
            {friendly.actionLabel ?? 'Try again'}
          </button>
        </div>
      </body>
    </html>
  );
}
