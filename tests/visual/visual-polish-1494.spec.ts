import { test, expect, type Locator, type Page } from '@playwright/test';
import { seedBaseData, seedTestData } from './utils/seedTestData';
import {
  hideDynamicContent,
  pinAppShell,
  waitForContentStable,
} from './utils/wait-helpers';

const findSectionByTitle = (page: Page, root: Locator, title: string): Locator =>
  root.locator('[data-testid="collapsible-section"]').filter({
    has: page.getByTestId('collapsible-section-title').filter({
      hasText: title,
    }),
  });

test.describe('Issue 1494 visual polish regressions', () => {
  test('character creation world-required guard stays centered and constrained', async ({
    page,
  }) => {
    await seedBaseData(page);
    await page.goto('/characters/create');
    await expect(page.getByRole('heading', { name: 'World Required' })).toBeVisible();
    await waitForContentStable(page);
    await hideDynamicContent(page);

    const guard = page.locator('.wizard-world-required-state');
    const guardBox = await guard.boundingBox();
    const actionGroupBox = await guard.locator('.action-button-group').boundingBox();
    expect(guardBox).not.toBeNull();
    expect(actionGroupBox).not.toBeNull();

    if (guardBox && actionGroupBox) {
      const guardCenter = guardBox.x + guardBox.width / 2;
      const actionGroupCenter = actionGroupBox.x + actionGroupBox.width / 2;
      expect(Math.abs(guardCenter - actionGroupCenter)).toBeLessThan(4);
      expect(guardBox.width).toBeLessThanOrEqual(640);
    }

    await expect(guard).toHaveScreenshot('character-create-world-required.png');
  });

  test('settings import button matches export width at the narrow breakpoint', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 565, height: 743 });
    await seedTestData(page);
    await page.goto('/settings');
    await waitForContentStable(page);
    await hideDynamicContent(page);

    const controls = page.locator('.settings-export-import');
    const exportButton = controls.getByRole('button', { name: 'Export Game Data' });
    const importButton = controls.getByRole('button', {
      name: 'Import Game Data',
      exact: true,
    });

    await expect(exportButton).toBeVisible();
    await expect(importButton).toBeVisible();

    const exportBox = await exportButton.boundingBox();
    const importBox = await importButton.boundingBox();
    expect(exportBox).not.toBeNull();
    expect(importBox).not.toBeNull();

    if (exportBox && importBox) {
      expect(Math.abs(exportBox.width - importBox.width)).toBeLessThanOrEqual(1);
    }

    await expect(controls).toHaveScreenshot('settings-export-import-mobile.png');
  });

  test('collapsed editor sections keep their own height beside expanded sections', async ({
    page,
  }) => {
    await seedTestData(page);
    await page.goto('/characters/char-cyberpunk-hacker/edit');
    await expect(page.getByRole('heading', { name: 'Edit Character' })).toBeVisible({
      timeout: 15000,
    });
    await waitForContentStable(page);
    await hideDynamicContent(page);
    await pinAppShell(page);

    const editor = page.locator('.component-character-editor');
    const basicInfo = findSectionByTitle(page, editor, 'Basic Information');
    const background = findSectionByTitle(page, editor, 'Background');

    await expect(basicInfo.getByTestId('collapsible-section-content')).toHaveAttribute(
      'aria-hidden',
      'false'
    );
    await expect(background.getByTestId('collapsible-section-content')).toHaveAttribute(
      'aria-hidden',
      'true'
    );

    const basicInfoBox = await basicInfo.boundingBox();
    const backgroundBox = await background.boundingBox();
    expect(basicInfoBox).not.toBeNull();
    expect(backgroundBox).not.toBeNull();

    if (basicInfoBox && backgroundBox) {
      expect(backgroundBox.height).toBeLessThan(basicInfoBox.height * 0.6);
    }

    await expect(editor).toHaveScreenshot('character-editor-mixed-collapsible-state.png');
  });
});
