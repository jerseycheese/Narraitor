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
  
  // Reduced timeout for faster failure detection
  timeout: 30 * 1000,
  
  // Expect timeout for assertions
  expect: {
    // Visual comparison settings
    toHaveScreenshot: {
      // Reduced tolerance for faster comparison
      maxDiffPixels: 1000,
      // Slightly tighter threshold for better accuracy
      threshold: 0.2,
      // Animation handling - disable all animations for consistent screenshots
      animations: 'disabled',
      // Optimize screenshot mode for faster execution
      mode: 'mask-diff',
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
    
    // Reduced timeouts for faster execution
    actionTimeout: 10 * 1000,
    navigationTimeout: 20 * 1000,
    
    // Visual consistency settings
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Cross-platform snapshot configuration
    testIdAttribute: 'data-testid',
    
    // Force consistent font rendering on Darwin platform
    extraHTTPHeaders: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    },
  },

  // Configure projects for major browsers - optimized for CI speed
  projects: [
    {
      name: 'chromium',
      use: { 
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
