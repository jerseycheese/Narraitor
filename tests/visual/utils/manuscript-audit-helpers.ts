import { expect, Page } from '@playwright/test';
import { seedTestData } from './seedTestData';
import { mockApiEndpoints, type MockApiOptions } from './mockApi';
import { hideDynamicContent, waitForContentStable } from './wait-helpers';

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

export type PrototypeDrawerName =
  | 'character'
  | 'inventory'
  | 'story-summary'
  | 'choice-history'
  | 'journal';

const APP_SESSION_URL = '/worlds/world-cyberpunk-2077/play';
const PROTOTYPE_URL = '/design-system';
const PROTOTYPE_FALLBACK_URL = '/design-system/index.html';

const PROTOTYPE_OVERLAY_SELECTOR = '#manuscript-viewport-layer';

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
    timeout: 20000,
  });
  await waitForContentStable(page);

  if (darkMode) {
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await pause(150);
  }
};

export const setupPrototypeManuscriptPage = async (
  page: Page,
  options: {
    darkMode?: boolean;
  } = {},
): Promise<void> => {
  const { darkMode = false } = options;

  await page.goto(PROTOTYPE_URL);
  const launchButton = page.locator('#launch-manuscript-overlay');
  if ((await launchButton.count()) === 0) {
    await page.goto(PROTOTYPE_FALLBACK_URL);
  }

  await page.waitForSelector('#launch-manuscript-overlay', { timeout: 20000 });

  if (darkMode) {
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await pause(150);
  }

  const isPrototypeOverlayVisible = async (): Promise<boolean> =>
    page.evaluate((selector) => {
      const overlay = document.querySelector(selector) as HTMLElement | null;
      if (!overlay) return false;
      const styles = window.getComputedStyle(overlay);
      return (
        !overlay.classList.contains('hidden') &&
        overlay.getAttribute('aria-hidden') !== 'true' &&
        styles.display !== 'none' &&
        styles.visibility !== 'hidden'
      );
    }, PROTOTYPE_OVERLAY_SELECTOR);

  const clickLaunchProgrammatically = async () => {
    await page.evaluate(() => {
      const launchButton = document.getElementById(
        'launch-manuscript-overlay',
      ) as HTMLButtonElement | null;
      launchButton?.click();
    });
  };

  if (!(await isPrototypeOverlayVisible())) {
    await clickLaunchProgrammatically();
    await pause(120);
  }

  if (!(await isPrototypeOverlayVisible())) {
    await page.click('#launch-manuscript-overlay', { force: true });
  }

  await expect
    .poll(isPrototypeOverlayVisible, {
      timeout: 5000,
    })
    .toBe(true);
  await waitForContentStable(page);
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
    // Mobile layout can overlap this control with save metadata text.
    // Use a DOM click path to avoid hit-testing against the overlapping element.
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
  await openAppToolsPanel(page);
  await page.getByRole('button', { name: drawerLabel }).click();
  await expect(page.locator('[data-testid="manuscript-drawer"]')).toBeVisible();
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
  });

  await pause(150);
};

export const openPrototypeCharacterPanel = async (page: Page): Promise<void> => {
  const headerToggle = page.locator('#manuscript-hud-left-toggle');
  const isHeaderToggleVisible = await headerToggle
    .isVisible()
    .catch(() => false);

  if (isHeaderToggleVisible) {
    await headerToggle.click();
  } else {
    await openPrototypeToolsPanel(page);
    await page.click('[data-manuscript-control="toggle-character-hud"]');
  }

  const leftPanel = page.locator('#manuscript-hud-left-panel');
  const isPanelVisible = await leftPanel
    .locator(':scope:not([hidden])')
    .count()
    .then((count) => count > 0)
    .catch(() => false);

  if (!isPanelVisible) {
    await page.evaluate(() => {
      const panel = document.getElementById('manuscript-hud-left-panel');
      const toggle = document.getElementById('manuscript-hud-left-toggle');
      if (panel) {
        panel.hidden = false;
      }
      if (toggle) {
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  }

  await page.waitForSelector('#manuscript-hud-left-panel:not([hidden])');
};

export const openPrototypeToolsPanel = async (page: Page): Promise<void> => {
  const isToolsPanelVisible = async (): Promise<boolean> => {
    const menu = page.locator('#manuscript-panels-menu:not([hidden])').first();
    return menu.count().then((count) => count > 0);
  };

  const clickToolsProgrammatically = async () => {
    await page.evaluate(() => {
      const toolsButton = document.getElementById(
        'manuscript-panels-toggle',
      ) as HTMLButtonElement | null;
      toolsButton?.click();
    });
  };

  if (!(await isToolsPanelVisible())) {
    await clickToolsProgrammatically();
    await pause(120);
  }

  if (!(await isToolsPanelVisible())) {
    await page.click('#manuscript-panels-toggle', { force: true });
  }

  await expect.poll(isToolsPanelVisible, { timeout: 5000 }).toBe(true);
};

export const openPrototypeDrawer = async (
  page: Page,
  drawerName: PrototypeDrawerName,
): Promise<void> => {
  await openPrototypeToolsPanel(page);
  await page.click(`[data-drawer-panel="${drawerName}"]`);
  await page.waitForSelector('#manuscript-drawer-overlay:not(.hidden)');
};

export const applyPrototypeStreamingState = async (
  page: Page,
): Promise<void> => {
  await openPrototypeToolsPanel(page);
  await page.click('#manuscript-toggle-streaming');
  await page.waitForFunction(() => {
    const actionRail = document.getElementById('manuscript-action-rail');
    return Boolean(
      actionRail && actionRail.classList.contains('manuscript-action-rail-streaming'),
    );
  });
  await pause(150);
};

export const stabilizeForAuditCapture = async (page: Page): Promise<void> => {
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

      // Fall back to the first match so hidden/existing nodes are still captured.
      return candidates[0] ?? null;
    };

    const selectorQueries: Record<string, string> = {
      '.manuscript-hud-panel':
        '.manuscript-hud-panel:not([hidden]), #manuscript-hud-left-panel:not([hidden]), #manuscript-panels-menu:not([hidden])',
      '.manuscript-tools-menu-items':
        '.manuscript-tools-menu-items, #manuscript-panels-menu:not([hidden]) .space-y-2',
      '.manuscript-tools-menu-item':
        '.manuscript-tools-menu-item, #manuscript-panels-menu:not([hidden]) [data-drawer-trigger]',
      '.manuscript-drawer-panel':
        '.manuscript-drawer-panel, #manuscript-drawer-overlay:not(.hidden) #manuscript-drawer-panel',
      '.manuscript-drawer-content':
        '.manuscript-drawer-content, #manuscript-drawer-overlay:not(.hidden) #manuscript-drawer-content',
    };

    const measuredNodes = selectorsToMeasure.map((selector) => {
      const element = findElementForMetrics(selectorQueries[selector] ?? selector);

      if (!element) {
        return {
          selector,
          exists: false,
        };
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
      '.manuscript-tools-menu-items',
      '#manuscript-panels-menu:not([hidden])',
      '.manuscript-hud-panel-left:not(.manuscript-hud-character-panel):not([hidden])',
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
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      nodes: measuredNodes,
      relationships,
    };
  }, selectors);
