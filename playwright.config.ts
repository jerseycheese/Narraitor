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
  
  // Global timeout for each test
  timeout: 30 * 1000,
  
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
    
    // Browser settings for consistent screenshots
    actionTimeout: 10 * 1000,
    navigationTimeout: 30 * 1000,
    
    // Visual consistency settings
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Disable animations globally for stable visual tests
    reducedMotion: 'reduce',
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Standard desktop viewport for consistent screenshots
        viewport: { width: 1280, height: 720 },
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox'],
        viewport: { width: 1280, height: 720 },
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari'],
        viewport: { width: 1280, height: 720 },
      },
    },

    // Mobile viewports for responsive testing
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5'],
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12'],
      },
    },

    // Tablet viewport
    {
      name: 'Tablet',
      use: { 
        ...devices['iPad Pro'],
      },
    },
  ],

  // Web server configuration for development
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    // Timeout for server to start
    timeout: 120 * 1000,
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