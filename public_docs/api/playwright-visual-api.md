---
title: Playwright Visual Testing API Reference
tags: [api, playwright, visual-testing, reference]
created: 2025-08-20
updated: 2025-08-20
---

# Playwright Visual Testing API Reference

Technical reference for Narraitor's visual regression testing implementation, including configuration options, helper functions, and testing patterns.

## Configuration API

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/visual',
  timeout: 60 * 1000,
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 10000,
      threshold: 0.2,
      animations: 'disabled',
    },
  },
  // ... additional config
});
```

#### `expect.toHaveScreenshot` Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maxDiffPixels` | `number` | `10000` | Maximum allowed pixel differences |
| `threshold` | `number` | `0.2` | Pixel difference threshold (0-1) |
| `animations` | `'disabled' \| 'allow'` | `'allow'` | Animation handling during screenshots |
| `clip` | `{x, y, width, height}` | `undefined` | Clip screenshot to specific region |
| `fullPage` | `boolean` | `false` | Capture full scrollable page |
| `omitBackground` | `boolean` | `false` | Hide default background |

#### Browser Configuration

```typescript
projects: [
  {
    name: 'chromium',
    use: { 
      ...devices['Desktop Chrome'],
      viewport: { width: 1280, height: 1024 },
      launchOptions: {
        args: [
          '--font-render-hinting=none',
          '--disable-font-subpixel-positioning',
          '--disable-lcd-text',
        ],
      },
    },
  },
],
```

#### Launch Options for Consistent Rendering

| Option | Purpose | Impact |
|--------|---------|--------|
| `--font-render-hinting=none` | Disable font hinting | Consistent font rendering across platforms |
| `--disable-font-subpixel-positioning` | Disable subpixel positioning | Reduces text rendering variations |
| `--disable-lcd-text` | Disable LCD text rendering | More consistent text appearance |

## Helper Functions API

### `waitForAppReady(page)`

Ensures the Narraitor application is fully loaded before taking screenshots.

```typescript
async function waitForAppReady(page: Page): Promise<void>
```

**Parameters:**
- `page: Page` - Playwright page object

**Implementation:**
```typescript
async function waitForAppReady(page) {
  try {
    // Wait for initial page load
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    
    // Wait for React hydration
    await page.waitForSelector('main', { timeout: 15000 });
    
    // Wait for fonts to load (critical for visual consistency)
    await page.waitForFunction(() => document.fonts.ready, { timeout: 10000 });
    
    // Additional stabilization time
    await page.waitForTimeout(2000);
    
    // Give time for dynamic content
    await page.waitForTimeout(3000);
    
    // Check if loading screen is still visible
    const loadingVisible = await page.locator('text=Loading').isVisible().catch(() => false);
    
    if (loadingVisible) {
      console.warn('Application still showing loading screen');
      await page.waitForTimeout(5000);
    }
  } catch (error) {
    console.warn('waitForAppReady encountered an error:', error.message);
  }
}
```

**Usage:**
```typescript
test('page visual test', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);
  await expect(page).toHaveScreenshot('page.png');
});
```

## Visual Testing Assertions

### `expect(page).toHaveScreenshot(name)`

Takes a screenshot of the entire page and compares to baseline.

```typescript
await expect(page).toHaveScreenshot('screenshot-name.png');
```

### `expect(locator).toHaveScreenshot(name)`

Takes a screenshot of a specific element and compares to baseline.

```typescript
const element = page.locator('[data-testid="component"]');
await expect(element).toHaveScreenshot('component.png');
```

### `expect(page).toHaveScreenshot(name, options)`

Take screenshot with specific options.

```typescript
await expect(page).toHaveScreenshot('full-page.png', {
  fullPage: true,
  clip: { x: 0, y: 0, width: 800, height: 600 }
});
```

**Options:**
- `fullPage: boolean` - Capture full scrollable page
- `clip: {x, y, width, height}` - Clip to specific region  
- `omitBackground: boolean` - Hide default background
- `animations: 'disabled' | 'allow'` - Override global animation setting

## Screenshot Naming Conventions

### Automatic Naming

Screenshots are automatically named with browser and OS information:

```
main-pages.spec.ts-snapshots/
├── screenshot-name-chromium-darwin.png
└── another-screenshot-chromium-linux.png
```

**Format:** `{name}-{browser}-{os}.png`

### File Organization

```
tests/visual/
├── main-pages.spec.ts
├── main-pages.spec.ts-snapshots/
│   ├── landing-page-full-chromium-darwin.png
│   ├── navigation-header-chromium-darwin.png
│   └── worlds-page-full-chromium-darwin.png
├── game-session.spec.ts
└── game-session.spec.ts-snapshots/
    ├── game-session-dev-harness-chromium-darwin.png
    ├── journal-interface-chromium-darwin.png
    └── play-page-initial-chromium-darwin.png
```

## NPM Script API

### Available Commands

```json
{
  "test:visual": "playwright test --project=chromium",
  "test:visual:update": "playwright test --update-snapshots", 
  "test:visual:headed": "playwright test --headed",
  "test:visual:debug": "playwright test --debug"
}
```

#### `npm run test:visual`
Run visual tests in Chromium (fast development mode).

**Options:**
```bash
# Run specific test file
npm run test:visual -- tests/visual/main-pages.spec.ts

# Run with custom grep pattern
npm run test:visual -- --grep "landing page"
```

#### `npm run test:visual:update`
Update baseline screenshots for all tests.

**Options:**
```bash
# Update specific test
npm run test:visual:update -- tests/visual/main-pages.spec.ts

# Update with specific browser
npx playwright test --update-snapshots --project=chromium
```

#### `npm run test:visual:headed`
Run tests with visible browser window (debugging).

#### `npm run test:visual:debug`
Run tests in debug mode with step-by-step execution.

## Test Patterns API

### Basic Page Test

```typescript
test('page layout test', async ({ page }) => {
  await page.goto('/page');
  await waitForAppReady(page);
  await expect(page).toHaveScreenshot('page-layout.png');
});
```

### Component Test

```typescript
test('component visual test', async ({ page }) => {
  await page.goto('/component-demo');
  await waitForAppReady(page);
  
  const component = page.locator('[data-testid="component"]');
  await expect(component).toHaveScreenshot('component.png');
});
```

### Responsive Test

```typescript
test('responsive layout', async ({ page }) => {
  // Desktop
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await waitForAppReady(page);
  await expect(page).toHaveScreenshot('desktop-layout.png');
  
  // Mobile
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page).toHaveScreenshot('mobile-layout.png');
});
```

### State Testing

```typescript
test('interactive states', async ({ page }) => {
  await page.goto('/buttons');
  await waitForAppReady(page);
  
  const button = page.locator('button');
  
  // Default state
  await expect(button).toHaveScreenshot('button-default.png');
  
  // Hover state
  await button.hover();
  await expect(button).toHaveScreenshot('button-hover.png');
  
  // Focus state
  await button.focus();
  await expect(button).toHaveScreenshot('button-focus.png');
});
```

## Error Handling API

### Timeout Configuration

```typescript
// Increase timeout for slow-loading pages
test('slow page test', async ({ page }) => {
  test.setTimeout(120000); // 2 minutes
  
  await page.goto('/slow-page');
  await waitForAppReady(page);
  await expect(page).toHaveScreenshot('slow-page.png');
});
```

### Retry Configuration

```typescript
// Configure retries for flaky tests
test.describe('Flaky tests', () => {
  test.describe.configure({ retries: 3 });
  
  test('potentially flaky test', async ({ page }) => {
    // Test implementation
  });
});
```

### Error Recovery

```typescript
test('test with error recovery', async ({ page }) => {
  await page.goto('/');
  
  try {
    await waitForAppReady(page);
  } catch (error) {
    console.warn('App loading timeout, proceeding anyway');
    await page.waitForTimeout(5000);
  }
  
  await expect(page).toHaveScreenshot('page.png');
});
```

## CI/CD Integration API

### Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `CI` | Detects CI environment | `true` |
| `PLAYWRIGHT_BASE_URL` | Override base URL | `http://localhost:3000` |

### GitHub Actions Integration

```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run Playwright tests  
  run: npx playwright test

- name: Upload test artifacts
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
```

## Advanced Configuration

### Custom Matchers

```typescript
// Extend expect with custom visual matchers
expect.extend({
  async toMatchDesignSystem(received, expected) {
    // Custom visual validation logic
    return {
      pass: true,
      message: () => 'Design system validation passed'
    };
  }
});
```

### Global Setup

```typescript
// global-setup.ts
async function globalSetup() {
  // Seed test database
  // Start test servers
  // Initialize test data
}

export default globalSetup;
```

### Page Object Model

```typescript
// page-objects/HomePage.ts
export class HomePage {
  constructor(private page: Page) {}
  
  async goto() {
    await this.page.goto('/');
    await waitForAppReady(this.page);
  }
  
  async takeScreenshot(name: string) {
    await expect(this.page).toHaveScreenshot(name);
  }
}
```

## Testing Utilities

### Mock Data Helpers

```typescript
// test-utils/mockData.ts
export const createMockCharacter = () => ({
  id: 'test-char-1',
  name: 'Test Character',
  worldId: 'test-world-1'
});
```

### Environment Helpers

```typescript
// test-utils/environment.ts
export const isCI = () => !!process.env.CI;
export const getBrowserName = (browserName: string) => browserName.toLowerCase();
```

## Troubleshooting API

### Debug Information

```typescript
test('debug test', async ({ page }) => {
  // Log page URL
  console.log('Current URL:', page.url());
  
  // Log viewport size
  const viewport = page.viewportSize();
  console.log('Viewport:', viewport);
  
  // Log element information
  const element = page.locator('[data-testid="component"]');
  console.log('Element visible:', await element.isVisible());
  
  await expect(page).toHaveScreenshot('debug.png');
});
```

### Performance Monitoring

```typescript
test('performance test', async ({ page }) => {
  const startTime = Date.now();
  
  await page.goto('/');
  await waitForAppReady(page);
  
  const loadTime = Date.now() - startTime;
  console.log(`Page load time: ${loadTime}ms`);
  
  await expect(page).toHaveScreenshot('performance.png');
});
```

## Related Documentation

- [Visual Regression Testing Guide](../development/visual-regression-testing.md) - Main developer guide
- [Visual Testing Workflow](../development/workflows/visual-testing-workflow.md) - Process documentation  
- [Visual Test Examples](../development/visual-test-examples.md) - Practical examples
