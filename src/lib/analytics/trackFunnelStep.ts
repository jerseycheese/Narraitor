import { track } from '@vercel/analytics';
import { isPlaywrightEnv } from '@/lib/utils/isPlaywrightEnv';

/**
 * The funnel steps we measure. Names only — this union is the entire
 * vocabulary that ever leaves the browser.
 */
type FunnelStep =
  | 'landing'
  | 'session-started'
  | 'return-visit'
  | 'world-created'
  | 'narrative-turn'
  | 'session-ended';

/**
 * Fire an anonymous funnel-step event to Vercel Web Analytics.
 *
 * Hard privacy constraint (#1366 / #1367): the ONLY thing sent is the fixed
 * step name from the FunnelStep union — never world names, character names,
 * prompts, or story text. The signature deliberately takes no free-form
 * payload, so there is no way for caller content to leak into analytics.
 *
 * No-ops outside the browser and under Playwright — the latter reuses
 * isPlaywrightEnv so the E2E/visual suite stays quiet and deterministic.
 * (Page views are captured automatically by <Analytics />; this is only for
 * the named conversion steps.)
 */
export function trackFunnelStep(step: FunnelStep): void {
  if (typeof window === 'undefined') return;
  if (isPlaywrightEnv()) return;
  track(step);
}
