---
title: Visual Testing Workflow
tags: [workflow, visual-testing, process, playwright]
created: 2025-08-20
updated: 2025-08-20
---

# Visual Testing Workflow

Step-by-step processes for common visual regression testing scenarios in Narraitor. This covers everything from adding new tests to debugging failures and managing baselines.

## Quick Reference

```bash
# Run visual tests
npm run test:visual

# Update baselines
npm run test:visual:update

# Debug failed tests
npm run test:visual:headed
```

## Baseline Governance

This is a solo-maintained repo, so baseline review can't lean on a second reviewer -- it leans on the diff being honest about what changed. Three things make that possible (#655):

- **Regenerate baselines in their own commit.** #1546 put it this way: a baseline regen should be "isolated from any other change, so a pixel shift is attributable to this PR alone." When the regen is its own commit, `git show <sha>` is a clean list of exactly what moved visually, separate from what changed in code -- that's what makes a full-page screenshot diff reviewable at all, since GitHub's binary-diff UI can't show a pixel shift in a region.
- **Name every changed baseline in the PR** using the "Visual Baseline Changes" section of the PR template, with what produced it. A changed baseline with no entry there is the smell to catch.
- **CI flags it automatically.** The `visual-baseline-check` job in `.github/workflows/ci.yml` warns (not blocks -- legitimate design work changes baselines constantly) when a PR touches both `src/**` and a snapshot PNG, and when a changed snapshot's filename never shows up in the PR body. Run it locally with `npm run test:visual:check-baselines`.

## Workflow 1: Adding Visual Tests for New Features

### When to Add Visual Tests

Add visual tests for:
- **New pages or major page changes**
- **New UI components with visual complexity**
- **Layout changes or responsive behavior**
- **Interactive states (hover, focus, disabled)**

Don't add visual tests for:
- **Simple text-only components**
- **Components that are purely functional (no visual output)**
- **Temporary or experimental features**

### Step-by-Step Process

#### Step 1: Identify What to Test

Before writing tests, identify the key visual states:

```
Example: New character creation form
- Empty form state
- Partially filled form
- Validation error states
- Success state
- Mobile responsive layout
```

#### Step 2: Create the Test File

Create a new test file or add to existing one:

```typescript
// tests/visual/character-creation.spec.ts
import { test, expect } from '@playwright/test';

async function waitForAppReady(page) {
  // Copy the helper from existing tests
}

test.describe('Character Creation Visual Tests', () => {
  test('empty form layout', async ({ page }) => {
    await page.goto('/characters/create');
    await waitForAppReady(page);

    await expect(page).toHaveScreenshot('character-form-empty.png');
  });
});
```

#### Step 3: Run Tests to Generate Baselines

```bash
# Generate initial baselines
npm run test:visual:update -- tests/visual/character-creation.spec.ts

# Verify baselines look correct
open tests/visual/character-creation.spec.ts-snapshots/
```

#### Step 4: Review Generated Screenshots

**Check that screenshots capture:**
- Complete content (not cut off)
- Stable state (no loading spinners)
- Consistent styling (fonts loaded)
- Expected layout and spacing

**Common issues to fix:**
- Loading states visible: add more wait time
- Cut-off content: use `fullPage: true` or adjust the viewport
- Inconsistent fonts: verify `waitForAppReady` waits for fonts

#### Step 5: Run Tests to Verify

```bash
# Run tests to ensure they pass with new baselines
npm run test:visual -- tests/visual/character-creation.spec.ts
```

#### Step 6: Commit Tests and Baselines

```bash
git add tests/visual/character-creation.spec.ts
git add tests/visual/character-creation.spec.ts-snapshots/
git commit -m "test(visual): Add visual tests for character creation form

- Test empty form state
- Test validation error states
- Test success state and responsive layout"
```

## Workflow 2: Handling Visual Test Failures

### Step 1: Understand the Failure

When visual tests fail, you'll see output like:

```
Error: Screenshot comparison failed:
  Expected: character-form-empty-chromium-darwin.png
  Actual: character-form-empty-actual.png
  Diff: character-form-empty-diff.png
```

### Step 2: Examine the Differences

Check the failure artifacts:

```bash
# Look at test results directory
ls test-results/character-creation-Visual-Tests-empty-form-layout-chromium/

# View the difference images
open test-results/character-creation-Visual-Tests-empty-form-layout-chromium/character-form-empty-diff.png
```

### Step 3: Determine the Cause

**Common causes and solutions:**

| Cause | Visual Clue | Solution |
|-------|-------------|----------|
| **Font rendering** | Text appears slightly different | Usually acceptable, may need threshold adjustment |
| **Loading state** | Spinner or "Loading..." visible | Add more wait time in test |
| **Timing issue** | Partial content, animations | Add `waitForTimeout` or disable animations |
| **Layout change** | Different spacing, positioning | Intentional change - update baseline |
| **Bug** | Missing content, broken styling | Fix the bug, don't update baseline |

### Step 4: Take Action

**If the change is intentional:**
```bash
# Update the baseline
npm run test:visual:update -- tests/visual/character-creation.spec.ts

# Commit the updated baseline
git add tests/visual/character-creation.spec.ts-snapshots/
git commit -m "test(visual): Update character form baseline after layout improvements"
```

**If it's a bug:**
```bash
# Fix the bug in your code
# Run tests again to verify fix
npm run test:visual -- tests/visual/character-creation.spec.ts
```

**If it's a test timing issue:**
```typescript
// Adjust the test
test('form layout', async ({ page }) => {
  await page.goto('/characters/create');
  await waitForAppReady(page);

  // Add specific waits for dynamic content
  await page.waitForSelector('[data-testid="form-loaded"]');
  await page.waitForTimeout(1000); // Additional stabilization

  await expect(page).toHaveScreenshot('character-form-empty.png');
});
```

## Workflow 3: Debugging Flaky Visual Tests

### Identifying Flaky Tests

Flaky tests pass sometimes and fail other times without code changes. Signs:
- Tests fail randomly in CI but pass locally
- Tests pass on re-run without changes
- Slight timing-related visual differences

### Step 1: Run Test Multiple Times

```bash
# Run the same test multiple times
for i in {1..5}; do npm run test:visual -- tests/visual/main-pages.spec.ts; done
```

### Step 2: Debug with Visible Browser

```bash
# Run in headed mode to see what's happening
npm run test:visual:headed -- tests/visual/main-pages.spec.ts

# Or debug step by step
npm run test:visual:debug -- tests/visual/main-pages.spec.ts
```

### Step 3: Common Fixes

**Add more stabilization:**
```typescript
test('flaky test', async ({ page }) => {
  await page.goto('/page');
  await waitForAppReady(page);

  // Wait for specific elements that might be loading
  await page.waitForSelector('[data-testid="content-loaded"]');

  // Wait for animations to complete
  await page.waitForTimeout(500);

  // Ensure fonts are loaded
  await page.waitForFunction(() => document.fonts.ready);

  await expect(page).toHaveScreenshot('page.png');
});
```

**Increase thresholds temporarily:**
```typescript
// In the specific test
await expect(page).toHaveScreenshot('flaky.png', {
  threshold: 0.5 // More tolerant than global setting
});
```

**Use element screenshots instead of full page:**
```typescript
// More stable than full page screenshots
const stableElement = page.locator('[data-testid="main-content"]');
await expect(stableElement).toHaveScreenshot('content.png');
```

## Workflow 4: Managing Baselines Across Branches

### Scenario: Working on Feature Branch

#### Step 1: Start from Clean State

```bash
# Start from latest develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/new-ui-component

# Run existing tests to ensure clean baseline
npm run test:visual
```

#### Step 2: Add New Tests

```bash
# Add your new visual tests
# Generate baselines
npm run test:visual:update

# Commit new tests and baselines
git add tests/visual/
git commit -m "test(visual): Add tests for new UI component"
```

#### Step 3: Handle Baseline Conflicts

If other PRs updated baselines while you were working:

```bash
# Rebase to get latest changes
git rebase develop

# If there are baseline conflicts, regenerate them
npm run test:visual:update

# Commit resolved baselines
git add tests/visual/
git commit -m "test(visual): Regenerate baselines after rebase"
```

### Scenario: Updating Baselines for Intentional Changes

#### Step 1: Make Your UI Changes

```bash
# Make your code changes
# Test locally to ensure they look correct
npm run dev
```

#### Step 2: Update Affected Baselines

```bash
# Run tests to see which baselines need updating
npm run test:visual

# Review the differences to confirm they're intentional
open test-results/

# Update baselines for intentional changes
npm run test:visual:update

# OR update only specific tests
npm run test:visual:update -- tests/visual/world-creation.spec.ts
```

#### Step 3: Document the Changes

```bash
git add tests/visual/
git commit -m "test(visual): Update baselines after button styling improvements

- Updated button component baselines for new color scheme
- Updated form layouts for improved spacing
- All changes aligned with design system v2.1"
```

## Workflow 5: CI/CD Integration Process

### Understanding CI Failures

When visual tests fail in CI:

1. **Check GitHub Actions artifacts**
2. **Download failure screenshots**
3. **Compare with local results**
4. **Determine if environment-specific**

### Step 1: Download CI Artifacts

```bash
# Using GitHub CLI
gh run download <run-id>

# Or download from web UI
# Go to the failed workflow, then Artifacts, then playwright-report
```

### Step 2: Analyze CI vs Local Differences

Common CI-specific issues:
- **Font rendering differences**: usually acceptable
- **Timing differences**: may need longer waits
- **Resolution differences**: check viewport configuration

### Step 3: Fix CI-Specific Issues

**Adjust timeouts for CI:**
```typescript
test('slow loading test', async ({ page }) => {
  // Longer timeout in CI
  const timeout = process.env.CI ? 60000 : 30000;
  test.setTimeout(timeout);

  await page.goto('/slow-page');
  await waitForAppReady(page);
  await expect(page).toHaveScreenshot('page.png');
});
```

**Handle CI environment differences:**
```typescript
test('environment specific test', async ({ page }) => {
  await page.goto('/page');
  await waitForAppReady(page);

  // More tolerance in CI due to font differences
  const threshold = process.env.CI ? 0.4 : 0.2;

  await expect(page).toHaveScreenshot('page.png', { threshold });
});
```

## Workflow 6: Code Review Process for Visual Changes

### As a Developer Creating PR

#### Step 1: Document Visual Changes

```markdown
## Visual Changes

This PR updates the following visual elements:
- Character card layout improved spacing
- Button hover states now use primary color
- Form validation styling updated

## Screenshots

### Before
[Include before screenshots]

### After
[Include after screenshots]

## Baseline Updates

The following visual test baselines were updated:
- `character-card-chromium-darwin.png` - Layout spacing
- `button-states-chromium-darwin.png` - Hover colors
```

#### Step 2: Include Baseline Updates

```bash
# Always commit baseline updates with code changes
git add src/components/CharacterCard/CharacterCard.tsx
git add tests/visual/characters-roster.spec.ts-snapshots/
git commit -m "feat(ui): Improve character card layout and button states

- Increase spacing between card elements
- Update button hover to use primary color
- Update visual test baselines for changes"
```

### As a Reviewer

#### Step 1: Check Visual Changes Make Sense

- Do baseline changes align with described code changes?
- Are the visual changes intentional and documented?
- Do changes follow design system guidelines?

#### Step 2: Test Locally if Needed

```bash
# Check out the PR branch
git checkout feature/visual-changes

# Run visual tests to see differences
npm run test:visual

# If tests pass, baselines are correctly updated
```

#### Step 3: Review Process

**Approve if:**
- Changes are intentional and documented
- Baselines are updated appropriately
- Visual tests pass

**Request changes if:**
- Baseline updates seem accidental
- Visual changes aren't documented
- Tests are failing

## Quick Troubleshooting Guide

| Problem | Quick Fix |
|---------|-----------|
| Tests fail with "loading" visible | Add `waitForAppReady(page)` |
| Fonts look different | Ensure fonts are loaded: `await page.waitForFunction(() => document.fonts.ready)` |
| Tests pass locally, fail in CI | Check CI artifacts, adjust thresholds |
| Screenshots are cut off | Use `fullPage: true` or adjust viewport |
| Tests are slow | Use element screenshots instead of full page |
| Random failures | Add stabilization waits |

## Related Documentation

- [Visual Regression Testing Guide](../visual-regression-testing.md) - Main developer guide
- [Playwright Visual API Reference](../../api/playwright-visual-api.md) - Technical reference
- [Visual Test Examples](../visual-test-examples.md) - Code examples
