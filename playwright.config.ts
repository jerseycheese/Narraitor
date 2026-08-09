import { defineConfig, devices } from '@playwright/test';
import { execSync } from 'node:child_process';

/**
 * Resolve the base URL for local runs.
 *
 * CI always serves on 3000 (see the webServer block below) so visual baselines
 * stay stable. Locally, follow this checkout's dev-server port so running tests
 * from a git worktree targets that worktree's server, not a stray 3000.
 * An explicit PLAYWRIGHT_BASE_URL always wins.
 */
function resolveBaseURL(): string {
  if (process.env.PLAYWRIGHT_BASE_URL) {
    return process.env.PLAYWRIGHT_BASE_URL;
  }
  if (process.env.CI) {
    return 'http://localhost:3000';
  }
  try {
    const port = execSync('node scripts/worktree-port.js', { encoding: 'utf8' }).trim();
    if (port) {
      return `http://localhost:${port}`;
    }
  } catch {
    // Fall back to the canonical port below.
  }
  return 'http://localhost:3000';
}

/**
 * Playwright Configuration for Visual Regression Testing
 *
 * Configures Playwright for consistent visual screenshot comparison
 * across multiple browsers and viewports. Optimized for CI/CD environments.
 */

// Shared Chromium settings for both the main visual project and the tutorial
// project, so they render identically (viewport + font hinting).
const chromiumUse = {
  ...devices['Desktop Chrome'],
  // Standard desktop viewport for consistent screenshots (height > 800px for test requirements)
  viewport: { width: 1280, height: 1024 },
  // Browser launch options for consistent font rendering
  launchOptions: {
    args: [
      '--font-render-hinting=none',
      '--disable-font-subpixel-positioning',
      '--disable-lcd-text',
    ],
  },
};

export default defineConfig({
  // Test directory for visual regression tests
  testDir: './tests/visual',
  
  // Increased timeout to account for CI slowness
  timeout: 60 * 1000,
  
  // Expect timeout for assertions
  expect: {
    // Visual comparison settings
    toHaveScreenshot: {
      // Budget for how many pixels may differ AFTER `threshold` has already
      // forgiven per-pixel font-rendering variation. Measured floor: three
      // back-to-back local runs against one commit produced 0 differing pixels
      // on 73 of 74 chromium snapshots and all 38 tutorial snapshots, and a CI
      // run's three attempts at the same snapshot also diffed to 0. So this is
      // pure cushion, not a number anything in the suite needs — anything
      // genuinely noisier carries its own override next to the assertion.
      maxDiffPixels: 100,
      // Per-pixel perceptual tolerance. This is the knob that absorbs font
      // smoothing; maxDiffPixels is not a second copy of it.
      threshold: 0.2,
      // Animation handling - disable all animations for consistent screenshots
      animations: 'disabled',
    },
  },
  
  // Enable full parallelism for faster execution
  fullyParallel: true,
  
  // Fail the build on CI if accidentally left test.only in source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Snapshot handling - Darwin-only strategy for consistent visual comparisons
  updateSnapshots: process.env.CI ? 'none' : 'missing',
  
  // Use 2 parallel workers on CI for optimal speed (tested: 4 workers showed no improvement)
  workers: process.env.CI ? 2 : undefined,
  
  // Reporter configuration
  reporter: process.env.CI 
    ? [['github'], ['html']]
    : [['list'], ['html']],
  
  // Global test setup
  use: {
    // Base URL for all tests
    baseURL: resolveBaseURL(),
    
    // Reduced timeouts for faster execution
    actionTimeout: 10 * 1000,
    navigationTimeout: 20 * 1000,
    
    // Visual consistency settings
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Cross-platform snapshot configuration
    testIdAttribute: 'data-testid',

    // Pin the browser's clock zone and locale so rendered dates are identical
    // everywhere. Several baselined pages print a formatted date (character
    // detail's "Created:", WorldCard's "Created:", world detail's
    // Created/Updated fields) via formatDate(), which ends in
    // toLocaleDateString(undefined, ...) — both the zone and the locale are
    // ambient, so an unpinned run renders whatever the host machine has.
    //
    // The seeded fixture dates sit near midnight UTC (char-cyberpunk-hacker is
    // 2024-01-01T01:00:00.000Z), so a negative-offset host rolls them back a
    // day: "Jan 1, 2024" becomes "Dec 31, 2023". That longer string wraps
    // .character-detail-header-meta's flex row at the 375px mobile viewport and
    // pushes the rest of the page down 34px, failing mobile-character-detail on
    // a size mismatch. Re-baselining can't fix that — it just moves the
    // mismatch to whoever runs in the other zone.
    //
    // UTC/en-US is what the GitHub macos-latest runners already use, and the
    // committed baselines are adopted from that job's artifacts, so pinning
    // these keeps every existing baseline valid while making local runs
    // reproduce CI instead of the developer's own zone.
    timezoneId: 'UTC',
    locale: 'en-US',

    // Force consistent font rendering on Darwin platform
    extraHTTPHeaders: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
  },

  // Configure projects for major browsers - optimized for CI speed
  projects: [
    {
      // Main visual suite. Excludes the tutorial tours, which run in their own
      // project (and dedicated CI job) to keep the main run lean — see #1014.
      name: 'chromium',
      testIgnore: '**/tutorials/**',
      use: { ...chromiumUse },
    },
    {
      // Tutorial tours run as a separate project so they can be split into a
      // dedicated CI job. snapshotPathTemplate pins the literal "-chromium"
      // (instead of the default "{-projectName}") so the existing
      // ...-chromium-darwin.png baselines stay valid — no regeneration.
      name: 'tutorials',
      testMatch: '**/tutorials/**/*.spec.ts',
      snapshotPathTemplate:
        '{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}-chromium{-snapshotSuffix}{ext}',
      use: { ...chromiumUse },
    },
    // NOTE: Firefox and WebKit disabled for faster CI
    // Enable for comprehensive cross-browser testing when needed
    // {
    //   name: 'firefox',
    //   use: { 
    //     ...devices['Desktop Firefox'],
    //     viewport: { width: 1280, height: 720 },
    //   },
    // },
    // {
    //   name: 'webkit',
    //   use: { 
    //     ...devices['Desktop Safari'],
    //     viewport: { width: 1280, height: 720 },
    //   },
    // },
  ],

  // Web server configuration for testing actual application pages
  // Note: webServer disabled for local development - assumes server is already running
  // CI will need this enabled for automated server management
  webServer: process.env.CI ? {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    // Increased timeout for server to start (especially in CI and app build)
    timeout: 240 * 1000,
    // Ensure server is fully ready before tests start
    env: {
      NODE_ENV: 'development',
      PORT: '3000',
      NEXT_PUBLIC_DISABLE_TUTORIAL: 'true',
    },
  } : undefined,

  // Output directories
  outputDir: 'test-results/',
  
  // Global test settings
  globalSetup: undefined,
  globalTeardown: undefined,
  
  // Test match patterns (exclude setup files from being run as tests)
  testMatch: ['**/*.spec.ts'],
  
  // Ignore certain files
  testIgnore: '**/node_modules/**',
});
