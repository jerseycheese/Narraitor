---
title: Visual Testing Best Practices
tags: [testing, best-practices, visual-testing, playwright, guidelines]
created: 2025-08-20
updated: 2026-08-14
---

# What actually works for visual testing

Here's what I've learned about writing visual tests that catch real issues without driving you crazy with false positives.

## When to Add Visual Tests

### Use Visual Tests For:
- **Critical user interfaces**: Landing pages, checkout flows, authentication forms
- **Layout-sensitive components**: Navigation bars, card layouts, responsive designs
- **Visual-heavy features**: Charts, graphs, image galleries, design systems
- **Cross-browser rendering**: Components that may render differently across browsers
- **Brand-critical elements**: Logo placement, color schemes, typography consistency

### Don't Use Visual Tests For:
- **Pure functionality**: Business logic, API responses, data processing
- **Dynamic content**: Real-time data, timestamps, user-generated content
- **Development tools**: Debug panels, test harnesses (unless the UI matters)
- **Frequently changing content**: Marketing banners, promotional content
- **Internal admin interfaces**: Unless visual consistency is business-critical

## Two Tiers of Layout Assertion

A baseline proves the page looked a certain way on the day it was captured. It can't prove a rule is still doing its job, and three regressions from the v1.0 playtest triage got through on exactly that gap (#1574, #1579). So layout and behavior get assertions of their own alongside the pixels, in two tiers.

**Tier 1, geometry and behavior. This is the default.** Measure positions, distances, and post-interaction state, which is to say the thing a player would notice. Scroll the surface and check the location bar is still on screen. Measure the distance between the hero's bottom edge and the portrait's top edge. Assert the world card renders at a bounded height when its description runs long. Each of those survives any implementation that produces the right result, and fails on any that doesn't.

```ts
// Weak: passes even when sticky is inert
await expect(rail).toHaveCSS('position', 'sticky');

// Real: scroll, then check the bar is still on screen
await main.evaluate(el => el.scrollTop = 600);
expect((await rail.boundingBox()).y).toBeGreaterThanOrEqual(0);
```

**Tier 2, resolved-value tripwires.** A `toHaveCSS`-style check, written only alongside a tier 1 assertion and never instead of one. There's a narrow case where it earns its place, covered below.

Worked examples of tier 1 assertions live in `tests/visual/manuscript-regression-assertions.spec.ts` and `tests/visual/narrative-reading-position.spec.ts`.

### Why a computed-style assertion mostly doesn't work

A computed-style assertion says a property resolved to a value. It doesn't say the value is doing anything.

#1582 is the proof. That bug was `float: right` declared on a child of a flex container. Floats don't apply to flex items, so the rule did nothing, but the declaration sat right there in the stylesheet and the computed value read back as `right`. A `toHaveCSS('float', 'right')` check would have been green for the entire life of that bug. The same trap is available for `position: sticky` with no `top`, or inside an `overflow: hidden` ancestor, or against the wrong containing block.

The second problem is that a property assertion pins the technique. Say the hero gap currently comes from `margin-bottom` and later comes from `gap` on a restructured parent. The page looks correct and the assertion goes red anyway, so it gets edited to match the new implementation. Do that twice and you've taught yourself to treat that test as noise, which is worse than never having written it.

### Where a tripwire earns its place

One narrow case: when the cascade decides the winner rather than a single declaration. PR #1568 moved 515 selectors from specificity (0,1,1) to (0,1,0), and which rule wins after a change like that isn't readable from any one file. Asserting the resolved value there tests something genuinely emergent.

Label it for what it is. A tripwire catches "the rule vanished", which is what happened to the sticky-location fix when ADR-013 deleted DS1 and took the scoped rule with it. It cannot catch "the rule is present and inert", which is what happened to the marginalia float. Cheap, useful, and not evidence the invariant holds, so it rides along with the geometric assertion rather than standing in for it.

### When a fix has no runtime invariant

Some fixes have nothing to measure, and the honest move is to say so rather than invent an assertion that looks like one. Two from the same batch:

- **Prose quality.** #1578 is about whether a generated ending actually closes. Asserting on generated text is how you get a rigged test, because the assertion ends up encoding whatever the model happened to produce on the day it was written. It gets a template-level guard instead (the prompt requires closure regardless of tone) plus an eval pass over sample generations.
- **Deletion.** #1583 is mostly removing `.theme-menu-*` rules. There's no runtime behavior left to observe once they're gone, so the check is static: search the stylesheets and assert nothing matches.

If a change fits neither tier and neither of those, write down why in the PR rather than adding a placeholder assertion. A fake invariant costs more than a missing one, because it reads as coverage.

### These Belong in Playwright, Not jsdom

Geometry needs a real layout engine. jsdom has none, so every rect comes back as zero and a jsdom test that wants geometry has to supply it, normally through `Object.defineProperty` on `scrollHeight`, `clientHeight`, or `getBoundingClientRect`. At that point the test is reading back numbers it wrote.

`NarrativeHistory` is the cautionary example. Its anchoring tests stubbed `scrollHeight: 1000` and `clientHeight: 100` onto the Radix viewport, which isn't even the element the app scrolls (the play surface resolves `.manuscript-overlay-main` instead), and they stayed green through the whole auto-scroll regression. Checks like that move to Playwright rather than getting repaired in place.

`eslint.config.mjs` flags the pattern in test files so the next one gets caught while it's being written.

## Writing Effective Visual Tests

### Cover Both Color Modes by Default

Since the [collapse to a single design system (DS3)](../architecture/ADR-013-collapse-to-single-design-system-ds3.md), there is one design system. The coverage axis that remains is light/dark color mode, so user-facing visual coverage should normally capture both wherever a surface renders differently between them. A one-mode screenshot can miss the same class of problem a Drupal site would miss if QA only reviewed the default theme and never checked the alternate theme implementation.

Use one of these patterns:

- **Small surface**: loop over `['light', 'dark']` and capture one baseline per mode.
- **Long workflow**: keep the full sequential workflow in one mode, then add a focused mode-differentiation spec that captures the shared surface or representative state once in light and once in dark.
- **Known exception**: leave an inline comment explaining why only one mode is covered and link to the tracking issue if the gap is temporary.

Snapshot names should include the mode, such as `dashboard-dark.png` or `wizard-character-light.png`.

### Split Testing Strategy (2025 Best Practice)

**Use different tolerance levels for different content types**:

```typescript
test('AI content with permissive thresholds', async ({ page }) => {
  // For pages with AI-generated content that varies between runs
  const dynamicContentAreas = [
    page.locator('p').filter({ hasText: /The .* (adventure|quest|journey)/ }),
    page.locator('[role="radiogroup"] label'), // AI-generated choices
  ];

  await expect(page).toHaveScreenshot('game-session-dynamic.png', {
    mask: dynamicContentAreas,
    maxDiffPixels: 410000,  // High tolerance for AI content variation
    threshold: 0.46         // 46% tolerance for environment differences
  });
});

test('static UI with strict thresholds', async ({ page }) => {
  // For stable UI components that should not change
  const staticComponent = page.locator('[data-testid="navigation-header"]');

  await expect(staticComponent).toHaveScreenshot('navigation-header.png', {
    maxDiffPixels: 500,     // Low tolerance for static elements
    threshold: 0.2          // 20% tolerance - catch real regressions
  });
});
```

**Key principles**:
- **AI/Dynamic content**: Use permissive thresholds (40-50%) with content masking
- **Static UI elements**: Use strict thresholds (10-20%) to catch real regressions
- **Mask dynamic areas**: Hide timestamps, session IDs, and AI-generated text
- **Focus on structure**: Test layout and UI components, not content accuracy

### Test Structure and Organization

**Group tests logically**:
```typescript
test.describe('Authentication Interface', () => {
  test('login form layout', async ({ page }) => {
    // Test implementation
  });

  test('password reset flow', async ({ page }) => {
    // Test implementation
  });
});
```

**Use descriptive test and screenshot names**:
```typescript
// Good: Good: Clear, specific names
await expect(page).toHaveScreenshot('checkout-payment-form-desktop.png');
await expect(errorMessage).toHaveScreenshot('validation-error-empty-email.png');

// Avoid: Bad: Vague, generic names
await expect(page).toHaveScreenshot('test1.png');
await expect(element).toHaveScreenshot('component.png');
```

### Handling Dynamic Content

**Mock timestamps and dates**:
```typescript
test('dashboard with consistent timestamps', async ({ page }) => {
  // Mock Date to ensure consistent timestamps
  await page.addInitScript(() => {
    Date.now = () => new Date('2025-01-01T12:00:00Z').getTime();
  });

  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard-consistent-time.png');
});
```

**Stabilize random data**:
```typescript
test('character list with stable data', async ({ page }) => {
  // Mock API responses to return consistent data
  await page.route('/api/characters', route => {
    route.fulfill({
      json: {
        characters: [
          { id: 1, name: 'Test Character 1', level: 5 },
          { id: 2, name: 'Test Character 2', level: 3 }
        ]
      }
    });
  });

  await page.goto('/characters');
  await expect(page).toHaveScreenshot('character-list-stable.png');
});
```

**Hide or mask dynamic elements**:
```typescript
test('dashboard hiding dynamic elements', async ({ page }) => {
  await page.goto('/dashboard');

  // Hide elements that change frequently
  await page.addStyleTag({
    content: `
      .timestamp, .last-updated, .random-tip {
        visibility: hidden !important;
      }
    `
  });

  await expect(page).toHaveScreenshot('dashboard-no-dynamic-content.png');
});
```

### Wait Strategies

**Always wait for content to be ready**:
```typescript
async function waitForAppReady(page) {
  // Wait for network requests to complete
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  // Wait for main content to appear
  await page.waitForSelector('main', { timeout: 15000 });

  // Wait for fonts to load (critical for consistent rendering)
  await page.waitForFunction(() => document.fonts.ready, { timeout: 10000 });

  // Additional stabilization time
  await page.waitForTimeout(2000);
}
```

**Wait for specific conditions**:
```typescript
test('component after data loads', async ({ page }) => {
  await page.goto('/data-view');

  // Wait for specific content to indicate loading is complete
  await page.waitForSelector('[data-testid="data-loaded"]');

  // Wait for animations to complete
  await page.waitForTimeout(1000);

  await expect(page).toHaveScreenshot('data-view-loaded.png');
});
```

### Component vs Page Testing

**Component-level testing** (faster, more specific):
```typescript
test('button component states', async ({ page }) => {
  await page.goto('/dev/button-showcase');

  // Test individual component states
  const primaryButton = page.locator('[data-testid="primary-button"]');
  await expect(primaryButton).toHaveScreenshot('button-primary.png');

  const disabledButton = page.locator('[data-testid="disabled-button"]');
  await expect(disabledButton).toHaveScreenshot('button-disabled.png');
});
```

**Page-level testing** (full page, slower):
```typescript
test('complete checkout flow', async ({ page }) => {
  await page.goto('/checkout');
  await waitForAppReady(page);

  // Test entire page layout
  await expect(page).toHaveScreenshot('checkout-full-page.png', {
    fullPage: true
  });
});
```

## Snapshot Naming Conventions

### Recommended Format
`{component/page}-{state/variant}-{viewport}.png`

**Examples**:
- `button-primary-desktop.png`
- `login-form-validation-error-mobile.png`
- `dashboard-empty-state-tablet.png`
- `navigation-header-logged-in-desktop.png`

### Organization Strategy
```
tests/visual/
├── main-pages.spec.ts-snapshots/
│   ├── button-primary-chromium-darwin.png
│   ├── button-secondary-chromium-darwin.png
│   └── input-field-error-chromium-darwin.png
├── pages.spec.ts-snapshots/
│   ├── landing-page-full-chromium-darwin.png
│   └── checkout-payment-form-chromium-darwin.png
└── responsive.spec.ts-snapshots/
    ├── dashboard-mobile-375x667-chromium-darwin.png
    └── dashboard-desktop-1280x720-chromium-darwin.png
```

## Responsive Visual Testing

**Test key breakpoints**:
```typescript
test('responsive navigation component', async ({ page }) => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1280, height: 720 }
  ];

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    await page.goto('/');
    await waitForAppReady(page);

    const navigation = page.locator('nav');
    await expect(navigation).toHaveScreenshot(`navigation-${viewport.name}.png`);
  }
});
```

## Development Environment Considerations

### DevTools and visual tests

Visual tests **exclude** the DevTools panel. `ClientOnlyDevTools` refuses to render under
automation:

```tsx
// src/components/ClientOnlyDevTools.tsx
setIsAutomated(isPlaywrightEnv() || navigator.webdriver === true);

if (!isClient || process.env.NODE_ENV !== 'development' || isAutomated) {
  return null;
}
```

Keep the two checks separate: `isPlaywrightEnv()` gates render-path behavior like AI generation,
and broadening it to cover the panel would change what those specs exercise.

Baselines have no DevTools header and no development-only top padding, so a local capture matches
a CI one on this axis regardless of `NODE_ENV`.

### CI/Local Environment Differences

**Handling baseline mismatches**:
- Local baselines generated with development environment setup
- CI environment may have slight rendering differences
- Tolerance settings account for environment-specific variations
- Focus on major layout issues, not pixel-perfect matching

**Recommended approach**:
1. **Generate baselines locally** where you can see changes
2. **Use appropriate tolerances** for CI environment differences
3. **Test locally first** before pushing to CI
4. **Review visual diffs** in test results when CI fails

**CI baseline adoption**:
Visual regression runs on `macos-latest`. If a visual change passes locally but fails in CI,
download the failed shard artifacts with `./scripts/download-playwright-report.sh <pr>` or
`gh run download <run-id> --pattern 'e2e-test-failures-shard*'`. Verify each `*-actual.png`
is a correct render, not a seeding or empty-state failure, before copying it over the matching
`*-chromium-darwin.png` baseline. The old `dashboard-themes` and `theme-switcher` specs no
longer exist; do not preserve exception lists for deleted visual suites.

**Parallel-load flakiness**: worker concurrency against the single `next dev` server can time
out navigations / `waitForStoreReady` (store hydration). CI runs the E2E job sharded with
`--workers=1` per shard to avoid this (see `.github/workflows/ci.yml`). Locally, re-run the
affected specs with `--workers=1` — they pass reliably when not competing for the dev server.

## Baseline Management and Review Process

### When to Update Baselines

**Update baselines for**:
- Intentional design changes
- Component library updates
- Approved UI improvements
- Brand guideline changes

**Don't update baselines for**:
- Unexplained test failures
- Random CI failures
- "Making tests pass" without investigation
- Platform-specific rendering differences

### Review Process

**Before updating baselines**:
1. **Run tests locally** to see differences
2. **Review visual changes** carefully
3. **Get design approval** for UI changes
4. **Update locally** where you can see changes
5. **Commit with descriptive message**

**Baseline update workflow**:
```bash
# 1. Run tests to see current failures
npm run test:visual

# 2. Review differences in test-results/
open test-results/

# 3. If changes are intentional, update baselines
npm run test:visual:update

# 4. Review updated screenshots
git diff --name-only | grep ".png"

# 5. Commit with clear message
git add tests/visual/
git commit -m "feat: update visual baselines for new button styles"
```

## Common Anti-Patterns to Avoid

### Anti-pattern: Testing Implementation Details
```typescript
// Bad: Testing CSS classes or implementation
await expect(page.locator('.btn-primary')).toHaveClass('btn btn-primary');

// Good: Testing visual appearance
await expect(page.locator('[data-testid="primary-button"]')).toHaveScreenshot('button-primary.png');
```

### Anti-pattern: Overly Broad Screenshots
```typescript
// Bad: Full page when component would suffice
await expect(page).toHaveScreenshot('entire-page-for-button-test.png');

// Good: Focused component testing
await expect(page.locator('[data-testid="submit-button"]')).toHaveScreenshot('submit-button.png');
```

### Anti-pattern: Ignoring Dynamic Content
```typescript
// Bad: Not handling changing content
test('dashboard with live data', async ({ page }) => {
  await page.goto('/dashboard'); // Live timestamps will fail
  await expect(page).toHaveScreenshot('dashboard.png');
});

// Good: Stabilizing dynamic content
test('dashboard with stable data', async ({ page }) => {
  await page.route('/api/stats', route => {
    route.fulfill({ json: { timestamp: '2025-01-01T12:00:00Z' } });
  });
  await page.goto('/dashboard');
  await expect(page).toHaveScreenshot('dashboard-stable.png');
});
```

### Anti-pattern: Inconsistent Wait Strategies
```typescript
// Bad: Arbitrary waits
await page.waitForTimeout(5000); // Hope everything loads

// Good: Specific condition waits
await page.waitForSelector('[data-testid="content-loaded"]');
await page.waitForFunction(() => document.fonts.ready);
```

## Performance Considerations

### Optimize Test Speed
- **Focus on critical components**: Don't test every minor UI element
- **Use component isolation**: Test components individually when possible
- **Limit full-page screenshots**: Use element-specific screenshots
- **Run in Chromium only** for development (cross-browser for CI)

### Manage Storage
- **Compress screenshots**: Use PNG optimization tools
- **Clean up old baselines**: Remove unused screenshot files
- **Monitor repository size**: Visual tests can add significant file size

### Parallel Execution
```typescript
// Configure parallel execution carefully
export default defineConfig({
  workers: process.env.CI ? 1 : 2, // Limit concurrency for visual tests
  fullyParallel: false, // Sequential execution for consistency
});
```

## Debugging Failed Visual Tests

### Understanding Failures
1. **Check test-results/ directory** for actual vs expected images
2. **Look for difference highlights** in failed test artifacts
3. **Compare pixel differences** against configured thresholds
4. **Identify root cause**: code change, environment, or flaky test

### Debugging Techniques
```bash
# Run tests in headed mode to see browser actions
npm run test:visual:headed

# Debug specific test interactively
npx playwright test tests/visual/main-pages.spec.ts --debug

# Generate detailed HTML report
npx playwright show-report
```

### Common Failure Causes
- **Font loading**: Ensure fonts are loaded before screenshots
- **Animation timing**: Disable animations or wait for completion
- **Dynamic content**: Mock or stabilize changing elements
- **Viewport differences**: Ensure consistent viewport settings
- **CI environment**: Different rendering in CI vs local

## Integration with Development Workflow

### Pre-commit Checks
```bash
# Add to your git hooks or CI
npm run test:visual
```

### Pull Request Process
1. **Visual tests run automatically** in CI
2. **Review visual changes** in PR artifacts
3. **Approve baseline updates** before merging
4. **Document visual changes** in PR description

### Team Collaboration
- **Share visual changes**: Include screenshots in PR descriptions
- **Document design decisions**: Link to design specs or mockups
- **Review together**: Discuss visual changes during code review
- **Maintain consistency**: Follow established visual patterns

## Conclusion

Effective visual testing requires careful planning, consistent practices, and ongoing maintenance. Focus on testing what matters to users, handle dynamic content properly, and maintain a clear review process for baseline updates.

Remember: Visual tests are documentation of your UI's expected appearance. Keep them accurate, focused, and valuable for catching real regressions.
