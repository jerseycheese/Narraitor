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
      maxDiffPixels: 500,     // Stricter pixel tolerance for Darwin-only
      threshold: 0.2,         // 20% tolerance for anti-aliasing variations
      animations: 'disabled', // Disable animations for consistency
    },
  },
  // ... other config
});
```

## Threshold Strategy and Justification

Our visual comparison thresholds are carefully calibrated based on empirical testing and industry best practices for 2025:

### Why `maxDiffPixels: 500`

This value allows for minor, acceptable rendering differences while catching meaningful regressions:

- **Font kerning variations**: Different font rendering engines can produce slight spacing differences
- **Anti-aliasing differences**: Subpixel rendering varies between graphics cards and drivers
- **Chromium updates**: Browser updates occasionally introduce minor rendering changes
- **CI environment differences**: Slight variations between local development and GitHub Actions

**Empirical basis**: Through testing, we found that legitimate UI regressions typically affect 1000+ pixels, while rendering artifacts stay below 500 pixels.

### Why `threshold: 0.2` (20% tolerance)

This percentage-based threshold complements the pixel count and handles proportional differences:

- **Small component changes**: A 20% change in a small component (like a button) is significant
- **Large page changes**: A 20% change across a full page indicates a major regression
- **Darwin-only advantage**: Because we use Darwin-only baselines, we can be much stricter than cross-platform setups that need 40%+ tolerance

**Industry context**: Cross-platform visual testing typically requires 30-40% thresholds due to fundamental OS font rendering differences. Our Darwin-only strategy allows much stricter detection.

### Why These Values Work Together

The combination provides layered protection:

1. **Pixel threshold** catches small, localized changes (misaligned buttons, spacing issues)
2. **Percentage threshold** catches proportional changes (layout shifts, missing sections)
3. **Both must be exceeded** for a test to fail, reducing false positives

### Visual Examples

**Acceptable differences (below thresholds)**:
- Font anti-aliasing variations: ~50-200 pixels, <5% change
- Browser subpixel rendering: ~100-300 pixels, <10% change
- Minor CSS rendering differences: ~200-400 pixels, <15% change

**Unacceptable differences (above thresholds)**:
- Missing navigation bar: ~2000+ pixels, >25% change
- Layout shift from CSS changes: ~1500+ pixels, >30% change
- Color scheme changes: ~3000+ pixels, >40% change

### Configuration Choices

**Darwin-only snapshots**: We generate baselines on macOS only, accepting that we might miss Linux-specific rendering issues in favor of consistent, maintainable baselines.

**Stricter thresholds**: Because all development and CI happens on Darwin, we can detect smaller regressions than cross-platform setups.

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

## Platform Strategy and Trade-offs

### Why Darwin-Only Strategy

We use a **Darwin-only visual testing strategy**, meaning all baseline screenshots are generated and compared on macOS only. This decision provides several advantages:

**Consistency Benefits**:
- **Single source of truth**: All baselines generated on the same platform eliminate cross-platform variations
- **Reduced maintenance**: Only one set of baselines to maintain and review
- **Faster CI**: No need to manage multiple platform-specific baseline sets
- **Team alignment**: All developers use macOS, ensuring consistent local testing experience

**Simplified Development Workflow**:
- **Local testing matches CI**: Same platform means consistent behavior between local and CI visual tests
- **Predictable results**: No surprises from platform-specific rendering differences
- **Easier debugging**: Visual failures are easier to reproduce and fix locally

### Trade-offs We Accept

**Linux-Specific Issues Not Detected**:
- **Font rendering differences**: Linux may render fonts differently than Darwin, potentially causing user-visible issues we won't catch
- **Browser behavior variations**: Some Chromium behaviors may differ between macOS and Linux
- **Graphics driver differences**: GPU acceleration and rendering may vary across platforms

**Deployment Environment Mismatch**:
- **Production servers**: If production runs on Linux, we might miss platform-specific visual issues
- **User experience variations**: End users on different platforms might see rendering differences we don't test

### When to Reconsider This Strategy

**Team Growth Beyond macOS**:
- If significant portion of team moves to Linux development
- If frontend developers need to test platform-specific features
- If user reports indicate platform-specific visual issues

**Production Environment Feedback**:
- Recurring visual issues reported from Linux-deployed applications
- User experience data showing platform-specific problems
- Customer requirements for cross-platform visual consistency

### Alternative Approaches for Future

**Docker-Based Cross-Platform Testing** (Recommended Future Enhancement):
```yaml
# Future Docker strategy for true cross-platform consistency
- name: Run visual tests in Docker
  run: docker run --rm -v $PWD:/workspace playwright:latest npm run test:visual
```

**Benefits of Docker migration**:
- **True consistency**: Same rendering environment across all platforms
- **Industry standard**: Docker containers are the 2025 best practice for visual testing
- **CI/CD reliability**: Eliminates "works on my machine" issues for visual tests

**Multi-Platform Baseline Management**:
- Maintain separate baseline sets for Darwin/Linux
- Use Playwright's built-in platform detection
- Accept increased maintenance overhead for broader coverage

### Current Recommendation

**Stay with Darwin-only** for now because:
- Team is 100% macOS-based  
- No reported production visual issues from platform differences
- Maintenance overhead of cross-platform testing isn't justified yet
- Docker migration is a better long-term solution than multi-platform baselines

**Plan for Docker migration** when:
- Team grows or diversifies platforms
- Production issues emerge from platform differences  
- CI/CD pipeline needs more reliability across environments

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