import { expect, Page } from '@playwright/test';
import { seedTestData } from './seedTestData';
import { mockApiEndpoints, type MockApiOptions } from './mockApi';
import { hideDynamicContent, waitForContentStable } from './wait-helpers';
import {
  seedInventoryItemsForVisual,
  seedJournalEntriesForVisual,
  seedStorySummaryForVisual,
} from './game-session-page-seeder';

export interface AuditViewport {
  name: 'mobile' | 'tablet' | 'desktop' | 'wide';
  width: number;
  height: number;
}

export const AUDIT_VIEWPORTS: AuditViewport[] = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 1024 },
];

export const WIDE_VIEWPORT: AuditViewport = {
  name: 'wide',
  width: 1480,
  height: 1024,
};

export type AppDrawerName =
  | 'Character Details'
  | 'Inventory'
  | 'Story So Far'
  | 'Choice History'
  | 'Journal Snapshot';

const APP_SESSION_URL = '/worlds/world-cyberpunk-2077/play';

const pause = async (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export const setupAppManuscriptPage = async (
  page: Page,
  options: {
    darkMode?: boolean;
    mockApiOptions?: MockApiOptions;
  } = {},
): Promise<void> => {
  const { darkMode = false, mockApiOptions } = options;

  await seedTestData(page);
  await mockApiEndpoints(page, mockApiOptions);
  await page.goto(APP_SESSION_URL);
  await page.waitForSelector('[data-testid="manuscript-session-shell"]', {
    timeout: 60000,
  });
  await pause(1000);
  await waitForContentStable(page);

  if (darkMode) {
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await pause(150);
  }
};

export const openAppCharacterPanel = async (page: Page): Promise<void> => {
  const characterButton = page
    .locator('.manuscript-overlay-header-left .manuscript-hud-text-button')
    .filter({ hasText: /^Character$/i })
    .first();
  await expect(characterButton).toBeVisible();
  await characterButton.click({ force: true });
  await expect(page.locator('.manuscript-hud-character-panel')).toBeVisible();
};

export const openAppToolsPanel = async (page: Page): Promise<void> => {
  const toolsButton = page.locator('button[aria-label="Toggle Tools menu"]').first();
  await expect(toolsButton).toBeVisible();

  const clickToolsProgrammatically = async () => {
    await page.evaluate(() => {
      const button = document.querySelector(
        'button[aria-label="Toggle Tools menu"]',
      ) as HTMLButtonElement | null;
      button?.click();
    });
  };

  const isExpanded = async (): Promise<boolean> =>
    (await toolsButton.getAttribute('aria-expanded')) === 'true';

  if (!(await isExpanded())) {
    await clickToolsProgrammatically();
    await pause(120);
  }

  if (!(await isExpanded())) {
    await toolsButton.click({ force: true });
    await pause(120);
  }

  if (!(await isExpanded())) {
    await clickToolsProgrammatically();
  }

  await expect.poll(isExpanded, { timeout: 5000 }).toBe(true);
  await expect(
    page.getByRole('button', { name: 'Character Details' }).first(),
  ).toBeVisible();
};

export const openAppDrawer = async (
  page: Page,
  drawerLabel: AppDrawerName,
): Promise<void> => {
  if (drawerLabel === 'Inventory') {
    await seedInventoryItemsForVisual(page);
  } else if (drawerLabel === 'Story So Far') {
    await seedStorySummaryForVisual(page);
  } else if (drawerLabel === 'Journal Snapshot') {
    await seedJournalEntriesForVisual(page);
  }

  await openAppToolsPanel(page);
  await page.getByRole('button', { name: drawerLabel }).click();
  const drawer = page.locator('[data-testid="manuscript-drawer"]');
  await expect(drawer).toBeVisible();

  if (drawerLabel === 'Inventory') {
    await expect(drawer.getByText('Ghostlink Cyberdeck')).toBeVisible({
      timeout: 5000,
    });
  } else if (drawerLabel === 'Story So Far') {
    const paragraphLocator = drawer.locator(
      '[data-testid="story-summary-section"] .manuscript-story-summary-paragraph',
    );
    await expect
      .poll(async () => paragraphLocator.count(), { timeout: 5000 })
      .toBeGreaterThan(0);
  } else if (drawerLabel === 'Journal Snapshot') {
    await expect(
      drawer.locator('.manuscript-journal-snapshot-entry').first(),
    ).toBeVisible({ timeout: 5000 });
  }

  await pause(120);
};

export const applyAppStreamingVisualState = async (
  page: Page,
): Promise<void> => {
  await page.evaluate(() => {
    const actionRail = document.getElementById('manuscript-action-rail');
    const input = document.getElementById('manuscript-input') as HTMLInputElement | null;
    const send = document.getElementById('manuscript-send') as HTMLButtonElement | null;

    actionRail?.classList.add('manuscript-action-rail-streaming');

    if (input) {
      input.disabled = true;
      input.placeholder = 'Generating response...';
    }

    if (send) {
      send.disabled = true;
    }

    const narrativeScrollContainer = document.querySelector('.manuscript-overlay-main');
    if (narrativeScrollContainer) {
      narrativeScrollContainer.scrollTop = narrativeScrollContainer.scrollHeight;
    }
  });

  await pause(150);
};

export const stabilizeForCapture = async (page: Page): Promise<void> => {
  await waitForContentStable(page);
  await hideDynamicContent(page);
  await pause(100);
};

export interface ManuscriptMetricNode {
  selector: string;
  exists: boolean;
  display?: string;
  position?: string;
  overflow?: string;
  overflowY?: string;
  width?: number;
  height?: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}

export interface ManuscriptMetrics {
  viewport: {
    width: number;
    height: number;
  };
  nodes: ManuscriptMetricNode[];
  relationships: {
    toolsPanelTopToHeaderBottom?: number;
    toolsPanelLeftToRailLeft?: number;
    toolsPanelWidthToRailWidthDelta?: number;
  };
}

const defaultSelectors = [
  '.manuscript-viewport-inner',
  '.manuscript-overlay-header',
  '.manuscript-main-stage',
  '.manuscript-characters-rail',
  '#manuscript-action-rail',
  '.manuscript-hud-panel',
  '.manuscript-tools-menu-items',
  '.manuscript-tools-menu-item',
  '.manuscript-drawer-panel',
  '.manuscript-drawer-content',
];

export const collectManuscriptMetrics = async (
  page: Page,
  selectors: string[] = defaultSelectors,
): Promise<ManuscriptMetrics> =>
  page.evaluate((selectorsToMeasure) => {
    const findFirstVisibleElement = (
      selectorGroups: string[],
    ): HTMLElement | null => {
      for (const selector of selectorGroups) {
        const candidates = Array.from(
          document.querySelectorAll(selector),
        ) as HTMLElement[];

        for (const candidate of candidates) {
          const styles = window.getComputedStyle(candidate);
          const rect = candidate.getBoundingClientRect();

          if (
            candidate.hasAttribute('hidden') ||
            styles.display === 'none' ||
            styles.visibility === 'hidden' ||
            rect.width <= 0 ||
            rect.height <= 0
          ) {
            continue;
          }

          return candidate;
        }
      }

      return null;
    };

    const findElementForMetrics = (selector: string): HTMLElement | null => {
      const candidates = Array.from(document.querySelectorAll(selector)) as HTMLElement[];

      for (const candidate of candidates) {
        const styles = window.getComputedStyle(candidate);
        const rect = candidate.getBoundingClientRect();

        if (
          candidate.hasAttribute('hidden') ||
          styles.display === 'none' ||
          styles.visibility === 'hidden' ||
          rect.width <= 0 ||
          rect.height <= 0
        ) {
          continue;
        }

        return candidate;
      }

      return candidates[0] ?? null;
    };

    const selectorQueries: Record<string, string> = {
      '.manuscript-hud-panel':
        '.manuscript-hud-panel:not([hidden]), #manuscript-hud-left-panel:not([hidden]), #manuscript-panels-menu:not([hidden])',
      '.manuscript-tools-menu-items':
        '.manuscript-tools-menu-items, #manuscript-panels-menu:not([hidden]) .space-y-2',
      '.manuscript-tools-menu-item':
        '.manuscript-tools-menu-item:not(.manuscript-tools-menu-item-mobile-only), #manuscript-panels-menu:not([hidden]) [data-drawer-trigger]',
      '.manuscript-drawer-panel':
        '.manuscript-drawer-panel, #manuscript-drawer-overlay:not(.hidden) #manuscript-drawer-panel',
      '.manuscript-drawer-content':
        '.manuscript-drawer-content, #manuscript-drawer-overlay:not(.hidden) #manuscript-drawer-content',
    };

    const measuredNodes = selectorsToMeasure.map((selector) => {
      const element = findElementForMetrics(selectorQueries[selector] ?? selector);

      if (!element) {
        return { selector, exists: false };
      }

      const styles = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();

      return {
        selector,
        exists: true,
        display: styles.display,
        position: styles.position,
        overflow: styles.overflow,
        overflowY: styles.overflowY,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
      };
    });

    const toolsPanel = findFirstVisibleElement([
      '.manuscript-hud-panel-left:not(.manuscript-hud-character-panel):not([hidden])',
      '#manuscript-panels-menu:not([hidden])',
      '.manuscript-tools-menu-items',
    ]);
    const header = document.querySelector('.manuscript-overlay-header') as HTMLElement | null;
    const rail = document.querySelector('.manuscript-characters-rail') as HTMLElement | null;

    const relationships: ManuscriptMetrics['relationships'] = {};

    if (toolsPanel && header) {
      const toolsRect = toolsPanel.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      relationships.toolsPanelTopToHeaderBottom = Math.round(
        toolsRect.top - headerRect.bottom,
      );
    }

    if (toolsPanel && rail) {
      const toolsRect = toolsPanel.getBoundingClientRect();
      const railRect = rail.getBoundingClientRect();
      relationships.toolsPanelLeftToRailLeft = Math.round(
        toolsRect.left - railRect.left,
      );
      relationships.toolsPanelWidthToRailWidthDelta = Math.round(
        Math.abs(toolsRect.width - railRect.width),
      );
    }

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      nodes: measuredNodes,
      relationships,
    };
  }, selectors);
