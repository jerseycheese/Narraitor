/**
 * Playwright E2E tests for narrative text chunking and progressive disclosure.
 * Tests the full user experience of revealing narrative chunks in game sessions.
 *
 * NOTE: These tests are currently skipped pending test data infrastructure.
 * See issue #806 for E2E test fixture implementation.
 */

import { test, expect } from '@playwright/test';

test.describe('Narrative Text Chunking', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to game session page
    // Note: You'll need to set up a test world/character/session first
    // This is a placeholder - adjust based on your actual test setup
    await page.goto('/');
  });

  // Skipped pending #806: E2E test data infrastructure
  test.skip('initially shows only first chunk of long narrative', async ({ page }) => {
    // TODO: Set up test data with a long narrative segment
    // For now, this is a placeholder demonstrating the test structure

    // Navigate to a game session with narrative content
    // await page.goto('/game/session/test-session-id');

    // Wait for narrative content to load
    await page.waitForSelector('[data-testid="narrative-content-container"]');

    // Check that "Continue Reading" button is visible
    const revealButton = page.getByRole('button', { name: /continue reading/i });
    await expect(revealButton).toBeVisible();

    // Verify button shows remaining chunks count
    await expect(revealButton).toContainText(/more/i);
  });

  // Skipped pending #806: E2E test data infrastructure
  test.skip('reveals more content when continue button is clicked', async ({ page }) => {
    // TODO: Set up test data

    await page.waitForSelector('[data-testid="narrative-content-container"]');

    // Get initial content
    const contentContainer = page.locator('[data-testid="narrative-content-container"]');
    const initialText = await contentContainer.textContent();

    // Click "Continue Reading"
    const revealButton = page.getByRole('button', { name: /continue reading/i });
    await revealButton.click();

    // Wait for animation
    await page.waitForTimeout(500);

    // Verify more content is now visible
    const newText = await contentContainer.textContent();
    expect(newText?.length).toBeGreaterThan(initialText?.length || 0);
  });

  // Skipped pending #806: E2E test data infrastructure
  test.skip('hides reveal button when all chunks are shown', async ({ page }) => {
    // TODO: Set up test data with short narrative (2-3 chunks)

    await page.waitForSelector('[data-testid="narrative-content-container"]');

    const revealButton = page.getByRole('button', { name: /continue reading/i });

    // Click until button disappears
    let clickCount = 0;
    const maxClicks = 10; // Safety limit

    while (clickCount < maxClicks) {
      try {
        await revealButton.click({ timeout: 1000 });
        await page.waitForTimeout(300); // Wait for animation
        clickCount++;
      } catch {
        // Button no longer visible - good!
        break;
      }
    }

    // Verify button is no longer visible
    await expect(revealButton).not.toBeVisible();
  });

  // Skipped pending #806: E2E test data infrastructure
  test.skip('applies fade-in animation to revealed chunks', async ({ page }) => {
    // TODO: Set up test data

    await page.waitForSelector('[data-testid="narrative-content-container"]');

    const revealButton = page.getByRole('button', { name: /continue reading/i });
    await revealButton.click();

    // Check that paragraphs have animation class
    const paragraphs = page.locator('[data-testid="narrative-content-container"] p');
    const firstParagraph = paragraphs.first();

    await expect(firstParagraph).toHaveClass(/animate-fade-in/);
  });

  // Skipped pending #806: E2E test data infrastructure
  test.skip('maintains highlighting and formatting with chunking enabled', async ({ page }) => {
    // TODO: Set up test data with character names that should be highlighted

    await page.waitForSelector('[data-testid="narrative-content-container"]');

    // Verify highlighted terms are still styled correctly
    const highlighted = page.locator('.font-semibold.text-primary');

    if (await highlighted.count() > 0) {
      await expect(highlighted.first()).toBeVisible();
    }
  });

  // Skipped pending #806: E2E test data infrastructure
  test.skip('works correctly on mobile viewports', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.waitForSelector('[data-testid="narrative-content-container"]');

    const revealButton = page.getByRole('button', { name: /continue reading/i });

    // Verify button is touch-friendly
    const buttonBox = await revealButton.boundingBox();
    expect(buttonBox?.height).toBeGreaterThanOrEqual(44); // iOS minimum tap target

    // Verify button works on mobile
    await revealButton.click();
    await page.waitForTimeout(300);

    // Content should be revealed
    const contentContainer = page.locator('[data-testid="narrative-content-container"]');
    await expect(contentContainer).toBeVisible();
  });

  // Skipped pending #806: E2E test data infrastructure
  test.skip('is accessible with keyboard navigation', async ({ page }) => {
    await page.waitForSelector('[data-testid="narrative-content-container"]');

    const revealButton = page.getByRole('button', { name: /continue reading/i });

    // Tab to the button
    await page.keyboard.press('Tab');

    // Verify button is focused
    await expect(revealButton).toBeFocused();

    // Press Enter to reveal
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    // Content should be revealed
    const contentContainer = page.locator('[data-testid="narrative-content-container"]');
    await expect(contentContainer).toBeVisible();
  });

  // Skipped pending #806: E2E test data infrastructure
  test.skip('has proper ARIA labels for screen readers', async ({ page }) => {
    await page.waitForSelector('[data-testid="narrative-content-container"]');

    const revealButton = page.getByRole('button', { name: /continue reading/i });

    // Verify button has aria-label with progress information
    const ariaLabel = await revealButton.getAttribute('aria-label');
    expect(ariaLabel).toMatch(/\d+ of \d+ sections remaining/);
  });
});

test.describe('Narrative Chunking - Visual Regression', () => {
  // Skipped pending #806: E2E test data infrastructure
  test.skip('renders initial chunk state correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="narrative-content-container"]');

    // Take screenshot of initial chunked state
    await expect(page).toHaveScreenshot('narrative-chunking-initial.png', {
      mask: [page.locator('[data-timestamp]')], // Mask dynamic timestamps
    });
  });

  // Skipped pending #806: E2E test data infrastructure
  test.skip('renders revealed chunk state correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="narrative-content-container"]');

    // Reveal one chunk
    const revealButton = page.getByRole('button', { name: /continue reading/i });
    await revealButton.click();
    await page.waitForTimeout(500); // Wait for animation

    // Take screenshot after reveal
    await expect(page).toHaveScreenshot('narrative-chunking-revealed.png', {
      mask: [page.locator('[data-timestamp]')],
    });
  });
});
