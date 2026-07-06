import { test, expect } from '@playwright/test';
import { hideNextDevOverlay, waitForContentStable } from '../utils/wait-helpers';
import { seedBaseData } from '../utils/seedTestData';
import { zeroPad } from '../utils/tutorial-helpers';

test('Guided first-time experience snapshots (steps 0-2)', async ({ page }) => {
  test.setTimeout(60000);

  await seedBaseData(page);
  await page.goto('/');
  await hideNextDevOverlay(page);
  await waitForContentStable(page);
  await expect(page.getByRole('heading', { name: 'First time?' })).toBeVisible();
  await expect
    .poll(async () =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth
      )
    )
    .toBe(true);

  // Step 0: Welcome
  await expect(page).toHaveScreenshot(`tutorial-intro-onboarding-step${zeroPad(0)}.png`, {
    fullPage: false,
  });

  const nextButton = page.getByRole('button', { name: 'Next' });

  // Step 1: Concept
  await nextButton.click();
  await page.waitForTimeout(500);
  await waitForContentStable(page);
  await expect(page).toHaveScreenshot(`tutorial-intro-onboarding-step${zeroPad(1)}.png`, {
    fullPage: false,
  });

  // Step 2: Details
  await nextButton.click();
  await page.waitForTimeout(500);
  await waitForContentStable(page);
  await expect(page).toHaveScreenshot(`tutorial-intro-onboarding-step${zeroPad(2)}.png`, {
    fullPage: false,
  });
});
