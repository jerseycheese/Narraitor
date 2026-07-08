import type { FullConfig } from '@playwright/test';

/**
 * Compile the tutorial routes before any worker starts.
 *
 * The tutorial job serves the app with `next dev`, which compiles a route's
 * chunks on its first request. Whichever spec lands there first eats that cost
 * inside its own timeouts — app/layout.js alone measured ~12s on a cold CI
 * runner — and with two workers racing, the first specs reliably burn a retry
 * (#1519).
 *
 * Requesting each route once here builds those chunks on Playwright's clock
 * instead of the tests'. Failures are ignored: a route that won't warm is the
 * spec's problem to report, not this hook's.
 *
 * Gated on WARM_TUTORIAL_ROUTES (set by `npm run test:visual:tutorials`) rather
 * than on the project name — globalSetup receives every configured project
 * regardless of --project, so there's nothing here to branch on.
 */
const TUTORIAL_ROUTES = [
  '/',
  '/worlds',
  '/worlds/create',
  '/characters/create?worldId=world-cyberpunk-2077',
  '/worlds/world-cyberpunk-2077/play',
];

const WARM_TIMEOUT_MS = 90000;

export default async function warmTutorialRoutes(
  config: FullConfig
): Promise<void> {
  if (!process.env.WARM_TUTORIAL_ROUTES) return;

  const project =
    config.projects.find((p) => p.name === 'tutorials') ?? config.projects[0];
  const baseURL = project?.use?.baseURL;
  if (!baseURL) return;

  for (const route of TUTORIAL_ROUTES) {
    const start = Date.now();
    try {
      await fetch(new URL(route, baseURL), {
        signal: AbortSignal.timeout(WARM_TIMEOUT_MS),
      });
      console.log(`Warmed ${route} in ${Date.now() - start}ms`);
    } catch (error) {
      console.log(`Warming ${route} failed: ${(error as Error).message}`);
    }
  }
}
