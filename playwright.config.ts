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
      // Allow up to 100 pixels difference to handle minor rendering variations
      maxDiffPixels: 100,
      // Threshold for pixel comparison (0.2 = 20% tolerance)
      threshold: 0.2,
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
  
  // More flexible snapshot handling for cross-platform compatibility
  updateSnapshots: process.env.CI ? 'missing' : 'none',
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html'],
    // Add JUnit reporter for CI integration
    ['junit', { outputFile: 'test-results/visual-tests.xml' }],
    // Add line reporter for development
    ['line'],
  ],
  
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
  },

  // Configure projects for major browsers - optimized for CI speed
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Standard desktop viewport for consistent screenshots
        viewport: { width: 1280, height: 720 },
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
    command: 'npm start',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    // Increased timeout for server to start (especially in CI and app build)
    timeout: 240 * 1000,
    // Ensure server is fully ready before tests start
    env: {
      NODE_ENV: 'production',
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