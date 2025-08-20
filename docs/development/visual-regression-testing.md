---
title: Visual Regression Testing with Playwright
tags: [testing, playwright, visual-testing, ci-cd]
created: 2025-08-20
updated: 2025-08-20
---

# Visual Regression Testing with Playwright

Visual regression testing catches unintended changes to your UI by taking screenshots and comparing them to baseline images. This guide covers how we implement visual testing in Narraitor using Playwright's built-in screenshot comparison capabilities.

## Why Visual Regression Testing?

Traditional testing validates functionality but can miss visual issues like:
- Layout shifts from CSS changes
- Font rendering differences
- Color changes or missing styles  
- Responsive design breakpoints
- Cross-browser rendering inconsistencies

Visual tests catch these issues automatically by comparing pixel-perfect screenshots against known-good baselines.

## How It Works

Our visual testing setup:

1. **Playwright captures screenshots** of key pages and components
2. **First run generates baselines** - these become the "source of truth"
3. **Subsequent runs compare** new screenshots against baselines
4. **Tests fail if differences exceed thresholds** - protecting against regressions
5. **CI integration** ensures visual consistency across deployments

## Getting Started

### Prerequisites

Make sure you have Playwright browsers installed:

```bash
npx playwright install
```

### Running Visual Tests

```bash
# Run all visual tests (Chromium only for speed)
npm run test:visual

# Generate/update baseline screenshots
npm run test:visual:update

# Run tests with browser UI visible (debugging)
npm run test:visual:headed

# Debug tests step-by-step
npm run test:visual:debug
```

### Your First Visual Test

Here's a simple example testing a component:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Component Visual Tests', () => {
  test('homepage layout', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to fully load
    await page.waitForLoadState('networkidle');
    
    // Take screenshot and compare
    await expect(page).toHaveScreenshot('homepage.png');
  });
});
```

The `toHaveScreenshot()` assertion:
- Takes a screenshot of the current page or element
- Compares it to the baseline in `test-name.spec.ts-snapshots/`
- Fails if differences exceed configured thresholds

## Configuration

Our Playwright configuration is optimized for visual testing consistency:

```typescript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/visual',
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 1000,    // Allow minor rendering differences
      threshold: 0.4,         // 40% tolerance for cross-platform fonts
      animations: 'disabled', // Disable animations for consistency
    },
  },
  // ... other config
});
```

### Key Configuration Choices

**Darwin-only snapshots**: We generate baselines on macOS and accept some cross-platform font rendering differences rather than maintaining separate snapshots for each OS.

**High tolerance**: The `threshold: 0.4` handles font rendering differences between development and CI environments.

**Animations disabled**: Prevents timing-related visual differences in dynamic content.

## Writing Good Visual Tests

### Test Structure

Organize tests by interface area:

```typescript
test.describe('Core Interface Visual Tests', () => {
  test('landing page layout', async ({ page }) => {
    // Test implementation
  });
  
  test('navigation header', async ({ page }) => {
    // Test implementation  
  });
});
```

### Wait for Content Loading

Always wait for content to fully load before taking screenshots:

```typescript
async function waitForAppReady(page) {
  // Wait for network requests to finish
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  
  // Wait for main content
  await page.waitForSelector('main', { timeout: 15000 });
  
  // Wait for fonts to load (critical for consistency)
  await page.waitForFunction(() => document.fonts.ready, { timeout: 10000 });
  
  // Additional stabilization time
  await page.waitForTimeout(2000);
}

test('component test', async ({ page }) => {
  await page.goto('/component');
  await waitForAppReady(page);
  
  await expect(page).toHaveScreenshot('component.png');
});
```

### Element-Specific Screenshots

Test specific components instead of full pages when appropriate:

```typescript
test('character card component', async ({ page }) => {
  await page.goto('/characters');
  await waitForAppReady(page);
  
  // Screenshot just the character card
  const characterCard = page.locator('[data-testid="character-card-1"]');
  await expect(characterCard).toHaveScreenshot('character-card.png');
});
```

### Test Different States

Capture various component states:

```typescript
test('button states', async ({ page }) => {
  await page.goto('/components/button-demo');
  
  // Default state
  await expect(page.locator('.demo-button')).toHaveScreenshot('button-default.png');
  
  // Hover state
  await page.locator('.demo-button').hover();
  await expect(page.locator('.demo-button')).toHaveScreenshot('button-hover.png');
  
  // Focused state
  await page.locator('.demo-button').focus();
  await expect(page.locator('.demo-button')).toHaveScreenshot('button-focused.png');
});
```

## Managing Baselines

### When to Update Baselines

Update baseline screenshots when you've made intentional visual changes:

```bash
# Update all baselines
npm run test:visual:update

# Update specific test baselines
npx playwright test --update-snapshots tests/visual/specific-test.spec.ts
```

**Important**: Only update baselines for intentional changes. If tests fail unexpectedly, investigate the cause rather than blindly updating baselines.

### Baseline Storage

Baselines are stored in version control at:
```
tests/visual/test-name.spec.ts-snapshots/
├── screenshot-name-chromium-darwin.png
└── another-screenshot-chromium-darwin.png
```

The naming convention includes:
- Screenshot name you specified
- Browser engine (`chromium`)  
- Operating system (`darwin`)

## Debugging Failed Tests

### Common Failure Scenarios

**Font rendering differences**: Most common in CI environments. Our configuration tolerates these, but major font changes will fail.

**Timing issues**: Content not fully loaded before screenshot. Add appropriate waits.

**Dynamic content**: Dates, random IDs, or changing data. Mock or stabilize dynamic elements.

**Animation timing**: Animations not fully disabled. Check CSS and ensure animations are set to 'disabled' in config.

### Debugging Techniques

**View actual vs expected**:
```bash
# Run tests to generate failure artifacts
npm run test:visual

# Check test-results/ for actual vs expected images
open test-results/test-name/test-name-retry1/
```

**Debug interactively**:
```bash
# Run in headed mode to see browser actions
npm run test:visual:headed

# Step through test execution
npm run test:visual:debug
```

**Check CI artifacts**: Failed visual tests upload artifacts in CI. Download them to compare differences.

## CI/CD Integration

### GitHub Actions Workflow

Visual tests run automatically in CI:

```yaml
# .github/workflows/playwright.yml
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

### Handling CI Failures

1. **Check CI artifacts** for visual differences
2. **Determine if changes are intentional**:
   - If yes: update baselines locally and push
   - If no: fix the code causing the visual regression
3. **Never update baselines in CI** - always update locally where you can review changes

## Best Practices

### Test Organization

**Test key user journeys**: Focus on critical paths users follow through your app.

**Group related tests**: Organize by feature area or page type.

**Use descriptive names**: Screenshot names should clearly indicate what they're testing.

### Performance Considerations

**Limit full-page screenshots**: Use element-specific screenshots when possible.

**Run in Chromium only** for development speed (our default).

**Use parallel execution carefully**: Visual tests can be resource-intensive.

### Maintenance

**Review baselines regularly**: Ensure they still represent the intended design.

**Clean up unused screenshots**: Remove baselines for deleted tests or components.

**Document intentional changes**: When updating baselines, document why in your commit message.

## Integration with Development Workflow

### Before Making UI Changes

1. Run visual tests to establish current state
2. Make your changes
3. Run tests again to see visual impact
4. Update baselines if changes are intentional
5. Commit both code changes and baseline updates

### Code Review Process

When reviewing PRs with visual changes:
1. Check if baseline screenshots changed
2. Verify changes align with design requirements  
3. Test locally if changes seem unexpected
4. Approve baseline updates for intentional changes

## Troubleshooting Guide

### "Tests pass locally but fail in CI"

**Cause**: Environment differences (fonts, timing, resolution)
**Solution**: Check CI artifacts, adjust timeouts, verify font loading

### "Screenshots look identical but test fails"

**Cause**: Pixel-level differences invisible to human eye
**Solution**: Check threshold settings, review difference images

### "Dynamic content causes false failures"  

**Cause**: Timestamps, random data, or changing content
**Solution**: Mock dynamic elements or use element-specific screenshots

### "Tests are slow"

**Cause**: Full-page screenshots, multiple browsers, insufficient parallelism
**Solution**: Use element screenshots, test in Chromium only for development

## Related Documentation

- [Testing Guide](./testing-guide.md) - General testing philosophy and patterns
- [Playwright Visual Testing Workflow](./workflows/visual-testing-workflow.md) - Step-by-step process guide  
- [Visual Test Examples](../examples/visual-test-examples.md) - Practical implementation examples
- [Playwright Visual API Reference](../api/playwright-visual-api.md) - Technical API details

## External Resources

- [Playwright Visual Comparisons](https://playwright.dev/docs/test-screenshots) - Official Playwright docs
- [Visual Testing Best Practices](https://playwright.dev/docs/best-practices#visual-comparisons) - Playwright recommendations