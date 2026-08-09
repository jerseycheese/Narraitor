import { test, expect } from '@playwright/test';
import { waitForContentStable, hideDynamicContent, expandAllCollapsibleSections, pinAppShell } from './utils/wait-helpers';
import { seedTestData, seedBaseData } from './utils/seedTestData';
import { waitForStoreReady } from './utils/tutorial-helpers';

/**
 * Main Pages Visual Regression Tests
 *
 * Tests core application pages for visual consistency.
 * Covers both empty states (first-time users) and populated states (returning users).
 *
 * NOTE: the committed baselines are the CI runner's render, not a local one.
 * Full-page heights and any text rows take their height from OS-rendered font
 * metrics, which differ between a dev machine and the CI macOS image, so a
 * locally-generated baseline drifts against CI. To refresh these snapshots,
 * take the actuals from a CI E2E run rather than regenerating with
 * `--update-snapshots` locally. See commit 2fe3941a for the original
 * rationale.
 *
 * DS coverage (#1264): single-theme (default DS1). Each page captured here has a
 * focused all-DS companion — dashboard/home in tests/visual/dashboard-themes.spec.ts,
 * worlds list in worlds-themes.spec.ts, characters list in characters-themes.spec.ts,
 * world detail/edit in world-detail-themes.spec.ts, character detail/edit in
 * character-detail-themes.spec.ts. Tripling this multi-page sweep (whose baselines
 * are CI-adopted) would duplicate that coverage.
 */

test.describe('Main Pages Visual Tests', () => {
  // The app home moved from / to /dashboard (#1528; / is now the public
  // landing page, covered by landing-page.spec.ts). These two dashboard tests
  // navigate to the canonical route directly; the CI-adopted baseline names
  // (home-*.png) are kept because the rendered pixels are unchanged.
  test('Dashboard should render consistently (empty state)', async ({ page }) => {
    // Use base seeding for empty state - much faster than clearing everything manually
    await seedBaseData(page);

    await page.goto('/dashboard');
    await waitForContentStable(page);
    // Empty state routes to GuidedFirstTimeExperience, whose "First time?"
    // title renders in the italic Newsreader webfont (--font-narrative,
    // next/font with display: 'swap'). Without waiting for the swap, an
    // occasional slow font fetch leaves fallback-font glyphs painted at
    // screenshot time, producing thousands of pixels of diff — the same wait
    // other specs already do (e.g. world-creation.spec.ts,
    // landing-page.spec.ts).
    await page.evaluate(() => document.fonts.ready);
    await hideDynamicContent(page);

    // Verify page loaded with expected content
    await expect(page).toHaveTitle(/Narraitor/i);

    // Take full page screenshot - empty QuickPlay form
    await expect(page).toHaveScreenshot('home-empty-state.png', {
      fullPage: true,
    });
  });

  test('Dashboard should render consistently', async ({ page }) => {
    // Seed test data to show returning user with recent game session
    await seedTestData(page);
    await page.goto('/dashboard');
    // Wait for seeding to complete before stabilizing
    await page.waitForFunction(() => (window as any).__TEST_STORES_SEEDED__ === true, { timeout: 15000 });

    // Reload to ensure localStorage is picked up cleanly
    await page.reload();

    await waitForContentStable(page);
    await hideDynamicContent(page);
    // Ensure the Continue section appears (seeded session present)
    await page.waitForSelector('[aria-labelledby="continue-game-heading"]', { timeout: 8000 });

    // Verify page loaded with expected content
    await expect(page).toHaveTitle(/Narraitor/i);

    // Take full page screenshot - should show "Continue Last Game" with character and world info
    await expect(page).toHaveScreenshot('home-page.png', { fullPage: true });
  });

  test('Settings page should render consistently', async ({ page }) => {
    test.setTimeout(60000); // Increase timeout for this test to handle resource contention
    
    await seedTestData(page);
    
    await page.goto('/settings');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Take screenshot of settings page
    await expect(page).toHaveScreenshot('settings.png', { fullPage: true });
  });

  test('Worlds list page should render consistently (empty state)', async ({ page }) => {
    // Use base seeding for empty state - much faster and more reliable
    await seedBaseData(page);
    
    await page.goto('/worlds');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Take screenshot of worlds page - shows empty state with onboarding
    await expect(page).toHaveScreenshot('worlds-list-empty-state.png', { fullPage: true });
  });

  test('Worlds list page should render consistently', async ({ page }) => {
    await seedTestData(page);
    
    // Navigate to worlds page to see populated data
    await page.goto('/worlds');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Take screenshot of worlds page - should show populated worlds
    await expect(page).toHaveScreenshot('worlds-list.png', { fullPage: true });
  });

  test('Characters list page should render consistently', async ({ page }) => {
    await seedTestData(page);
    await page.goto('/characters');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    
    // Take screenshot of characters page - should show populated characters
    await expect(page).toHaveScreenshot('characters-list.png', { fullPage: true });
  });

  test('World detail page should render consistently', async ({ page }) => {
    await seedTestData(page);

    // Navigate to the cyberpunk world detail page
    await page.goto('/worlds/world-cyberpunk-2077');
    // Block on the seed flushing and the world actually rendering before
    // capture — without this the IndexedDB seed loses the race in CI and the
    // page paints empty (chrome only). See #1198.
    await waitForStoreReady(page);
    await expect(page.getByText('Cyberpunk Neo-Tokyo').first()).toBeVisible({ timeout: 15000 });
    await waitForContentStable(page);
    await hideDynamicContent(page);
    await pinAppShell(page);

    // Take screenshot of world detail page - should show world info, characters, and actions
    await expect(page).toHaveScreenshot('world-detail.png', { fullPage: true });
  });

  test('Character detail page should render consistently', async ({ page }) => {
    await seedTestData(page);
    
    // Navigate to Nova character detail page
    await page.goto('/characters/char-cyberpunk-hacker');
    await waitForContentStable(page);
    await hideDynamicContent(page);
    await pinAppShell(page);

    // Take screenshot of character detail page - should show character sheet, attributes, skills
    await expect(page).toHaveScreenshot('character-detail.png', { fullPage: true });
  });

  test('World edit page should render consistently', async ({ page }) => {
    await seedTestData(page);
    
    // Navigate directly to the edit page to avoid any list-page fallbacks
    await page.goto('/worlds/world-cyberpunk-2077/edit');
    await expect(page).toHaveURL(/\/worlds\/world-cyberpunk-2077\/edit/);
    await waitForContentStable(page);
    // Confirm editor root and sections present before expansion
    const editor = page.locator('[data-testid="world-editor-root"]');
    await editor.waitFor({ timeout: 8000 });
    await page.waitForSelector('[data-testid="collapsible-section"]', { timeout: 8000 });
    await hideDynamicContent(page);
    
    // Expand all CollapsibleSections to show full content (scoped to editor)
    await expandAllCollapsibleSections(page, editor);
    // Ensure no collapsed sections remain
    await expect(
      editor.locator('[data-testid="collapsible-section-toggle"]').filter({ hasText: '+' })
    ).toHaveCount(0);
    await pinAppShell(page);

    // Take screenshot of world edit page - should show world editing interface with all sections expanded
    await expect(page).toHaveScreenshot('world-edit.png', { fullPage: true });
  });

  test('Character edit page should render consistently', async ({ page }) => {
    test.setTimeout(45000); // Extended timeout for complex edit page with CollapsibleSections
    await seedTestData(page);
    
    // Navigate to character edit page
    await page.goto('/characters/char-cyberpunk-hacker/edit');
    await waitForContentStable(page);
    
    // Debug: Check if we're on the right page
    const pageTitle = await page.textContent('h1, [data-testid="page-title"], .page-title');
    console.log('Character edit page title:', pageTitle);
    
    // Wait for character data to load
    await page.waitForFunction(() => {
      return document.body.textContent && 
             !document.body.textContent.includes('Character not found') &&
             (document.body.textContent.includes('Edit Character') || document.body.textContent.includes('CharacterEditor'));
    }, { timeout: 10000 });
    
    await hideDynamicContent(page);
    
    // Debug: Check how many CollapsibleSections exist before expansion
    const totalSections = await page.locator('[data-testid="collapsible-section"]').count();
    console.log(`Found ${totalSections} total CollapsibleSections on character edit page`);
    
    // Debug: Check how many are collapsed before expansion
    const collapsedSections = await page.locator('[data-testid="collapsible-section-toggle"]').filter({
      hasText: '+'
    }).count();
    console.log(`Found ${collapsedSections} collapsed sections before expansion`);
    
    // Expand all CollapsibleSections to show full content
    await expandAllCollapsibleSections(page);
    
    // Debug: Check how many are still collapsed after expansion
    const stillCollapsed = await page.locator('[data-testid="collapsible-section-toggle"]').filter({
      hasText: '+'
    }).count();
    console.log(`Found ${stillCollapsed} collapsed sections after expansion`);
    await pinAppShell(page);

    // Take screenshot of character edit page - should show character editing interface with all sections expanded
    await expect(page).toHaveScreenshot('character-edit.png', { fullPage: true });
  });
});
