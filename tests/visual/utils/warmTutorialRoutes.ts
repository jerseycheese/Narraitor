import { chromium, type FullConfig } from '@playwright/test';

/**
 * Compile the tutorial routes before any worker starts.
 *
 * The tutorial job serves the app with `next dev`, which compiles a route's
 * chunks on demand. Whichever spec lands there first eats that cost inside its
 * own timeouts — app/layout.js alone measured ~12s on a cold CI runner — and
 * with two workers racing, the first specs reliably burn a retry (#1519).
 *
 * This has to be a real page load, not a fetch of the document. `next dev`
 * builds a client chunk when the browser asks for it, so a doc-only request
 * warms the server render and leaves the chunks cold; that first cut still left
 * both lead specs timing out in waitForStoreReady on CI. Waiting for `load` is
 * the point here — it's exactly the chunk compile we want to pay for up front.
 *
 * Failures are ignored: a route that won't warm is the spec's problem to
 * report, not this hook's.
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

const WARM_TIMEOUT_MS = 120000;

export default async function warmTutorialRoutes(
  config: FullConfig
): Promise<void> {
  if (!process.env.WARM_TUTORIAL_ROUTES) return;

  const project =
    config.projects.find((p) => p.name === 'tutorials') ?? config.projects[0];
  const baseURL = project?.use?.baseURL;
  if (!baseURL) return;

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ baseURL });
    for (const route of TUTORIAL_ROUTES) {
      const start = Date.now();
      try {
        await page.goto(route, { waitUntil: 'load', timeout: WARM_TIMEOUT_MS });
        console.log(`Warmed ${route} in ${Date.now() - start}ms`);
      } catch (error) {
        console.log(`Warming ${route} failed: ${(error as Error).message}`);
      }
    }
  } finally {
    await browser.close();
  }
}
