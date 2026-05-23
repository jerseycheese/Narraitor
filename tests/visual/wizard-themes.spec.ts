import { test, expect, type Page } from '@playwright/test';
import {
  waitForContentStable,
  hideDynamicContent,
  waitForNavigationHeading,
} from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';

type ThemeId = 'ds1' | 'ds2' | 'ds3';

const themes: ThemeId[] = ['ds1', 'ds2', 'ds3'];

async function setTheme(page: Page, theme: ThemeId): Promise<void> {
  await page.evaluate((theme) => {
    localStorage.setItem('narraitor-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, theme);

  await page.waitForFunction(
    (theme) => document.documentElement.getAttribute('data-theme') === theme,
    theme
  );
  await page.evaluate(() => document.fonts.ready);
  await waitForContentStable(page);
  await hideDynamicContent(page);
}

async function openWorldWizard(page: Page, theme: ThemeId): Promise<void> {
  await seedTestData(page);
  await page.goto('/worlds/create?step=1');
  await page.waitForSelector('.component-world-creation-wizard', {
    timeout: 10000,
  });
  await setTheme(page, theme);
}

async function openCharacterWizard(page: Page, theme: ThemeId): Promise<void> {
  await seedTestData(page);
  await page.goto('/characters/create?worldId=world-cyberpunk-2077');
  await page.waitForSelector('h1', { timeout: 10000 });
  await setTheme(page, theme);

  const customButton = page.getByRole('button', {
    name: 'Create Custom Character',
  });

  if (await customButton.isVisible({ timeout: 10000 }).catch(() => false)) {
    await customButton.click();
    await waitForNavigationHeading(page, 'Choose a Starting Template', {
      timeout: 10000,
      exact: true,
    });
  }

  await setTheme(page, theme);
}

test.describe('Wizard Theme Differentiation', () => {
  for (const theme of themes) {
    test(`World creation wizard renders ${theme.toUpperCase()} structure`, async ({
      page,
    }) => {
      await openWorldWizard(page, theme);

      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page).toHaveScreenshot(`wizard-world-${theme}.png`, {
        fullPage: true,
      });
    });

    test(`Character creation wizard renders ${theme.toUpperCase()} structure`, async ({
      page,
    }) => {
      await openCharacterWizard(page, theme);

      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page).toHaveScreenshot(`wizard-character-${theme}.png`, {
        fullPage: true,
      });
    });
  }
});
