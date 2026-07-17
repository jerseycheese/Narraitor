'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { getSurfaceMode } from '@/lib/routing/surfaceMode';
import { trackFunnelStep } from '@/lib/analytics/trackFunnelStep';

const VISITED_KEY = 'narraitor-visited';

/**
 * FunnelAnalytics — fires the named, anonymous funnel-step conversion events
 * (#1367). Page views come for free from <Analytics />; this adds the
 * conversion signals that page views alone do not cleanly capture:
 *   - landing       — first touch on the public landing page
 *   - session-started — entering a play (manuscript) route
 *   - return-visit  — a visitor coming back (one localStorage flag, no identity)
 *
 * Renders nothing. All events are funnel-step names only — see trackFunnelStep
 * for the hard "no user content" constraint.
 */
export function FunnelAnalytics() {
  const pathname = usePathname();

  // Return-visit: fired once per browser, on the first mount of a visitor who
  // has been here before. The flag is a single boolean — no identity, no content.
  useEffect(() => {
    try {
      if (localStorage.getItem(VISITED_KEY)) {
        trackFunnelStep('return-visit');
      } else {
        localStorage.setItem(VISITED_KEY, '1');
      }
    } catch {
      // localStorage blocked (private mode / strict settings) — skip silently.
    }
  }, []);

  // Route-based funnel steps. The landing page owns the root route (#1528),
  // so the landing step fires on / — real first-touch traffic, not just
  // visitors who knew the old /welcome URL.
  useEffect(() => {
    if (!pathname) return;
    if (pathname === '/') {
      trackFunnelStep('landing');
    } else if (getSurfaceMode(pathname) === 'manuscript') {
      trackFunnelStep('session-started');
    }
  }, [pathname]);

  return null;
}
