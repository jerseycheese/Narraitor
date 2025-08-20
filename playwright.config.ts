import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for Visual Regression Testing
 * 
 * Configures Playwright for consistent visual screenshot comparison
 * across multiple browsers and viewports. Optimized for CI/CD environments.
 */
export default defineConfig({
  // Test directory for visual regression tests
  testDir: './tests/visual',
  
  // Global timeout for each test (increased for app loading)
  timeout: 60 * 1000,
  
  // Expect timeout for assertions
  expect: {
    // Visual comparison settings
    toHaveScreenshot: {
      // Allow more pixels difference to handle cross-platform rendering variations
      maxDiffPixels: 500,
      // Threshold for pixel comparison (0.3 = 30% tolerance for cross-platform)
      threshold: 0.3,
      // Animation handling - disable all animations for consistent screenshots
      animations: 'disabled',
    },
  },
  
  // Fulfill missing origin before running tests
  fullyParallel: true,
  
  // Fail the build on CI if accidentally left test.only in source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Snapshot handling - create missing snapshots in CI, ignore platform differences
  updateSnapshots: 'missing',
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: process.env.CI 
    ? [['github'], ['html']]
    : [['list'], ['html']],
  
  // Global test setup
  use: {
    // Base URL for all tests
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    // Browser settings for consistent screenshots (increased for app loading)
    actionTimeout: 15 * 1000,
    navigationTimeout: 45 * 1000,
    
    // Visual consistency settings
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Cross-platform snapshot configuration
    testIdAttribute: 'data-testid',
    
    // Force consistent font rendering across platforms
    extraHTTPHeaders: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
  },

  // Configure projects for major browsers - optimized for CI speed
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Standard desktop viewport for consistent screenshots
        viewport: { width: 1280, height: 720 },
        // Browser launch options for consistent font rendering
        launchOptions: {
          args: [
            '--font-render-hinting=none',
            '--disable-font-subpixel-positioning',
            '--disable-lcd-text',
          ],
        },
      },
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
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    // Increased timeout for server to start (especially in CI and app build)
    timeout: 240 * 1000,
    // Ensure server is fully ready before tests start
    env: {
      NODE_ENV: 'development',
      PORT: '3000',
    },
  },

  // Output directories
  outputDir: 'test-results/',
  
  // Global test settings
  globalSetup: undefined,
  globalTeardown: undefined,
  
  // Test match patterns
  testMatch: '**/*.spec.ts',
  
  // Ignore certain files
  testIgnore: '**/node_modules/**',
});