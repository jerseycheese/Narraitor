import fs from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import {
  AUDIT_VIEWPORTS,
  WIDE_VIEWPORT,
  applyAppStreamingVisualState,
  applyPrototypeStreamingState,
  collectManuscriptMetrics,
  openAppCharacterPanel,
  openAppDrawer,
  openAppToolsPanel,
  openPrototypeCharacterPanel,
  openPrototypeDrawer,
  openPrototypeToolsPanel,
  setupAppManuscriptPage,
  setupPrototypeManuscriptPage,
  stabilizeForAuditCapture,
  type AppDrawerName,
  type PrototypeDrawerName,
} from './utils/manuscript-audit-helpers';

const ISSUE_1065_BASE_DIR = path.resolve(
  process.cwd(),
  'public_docs/design-system/redesign-planning/issue-1065',
);
const ISSUE_1065_APP_SCREENSHOT_DIR = path.join(
  ISSUE_1065_BASE_DIR,
  'screenshots/app',
);
const ISSUE_1065_PROTOTYPE_SCREENSHOT_DIR = path.join(
  ISSUE_1065_BASE_DIR,
  'screenshots/prototype',
);
const ISSUE_1065_METRICS_PATH = path.join(ISSUE_1065_BASE_DIR, 'metrics.json');

interface AuditState {
  id: string;
  applyAppState: (page: Page) => Promise<void>;
  applyPrototypeState: (page: Page) => Promise<void>;
  appMockOptions?: {
    narrativeDelayMs?: number;
    choicesDelayMs?: number;
  };
}

const drawerStates: Array<{
  id: string;
  appLabel: AppDrawerName;
  prototypePanel: PrototypeDrawerName;
}> = [
  {
    id: 'drawer-character',
    appLabel: 'Character Details',
    prototypePanel: 'character',
  },
  {
    id: 'drawer-inventory',
    appLabel: 'Inventory',
    prototypePanel: 'inventory',
  },
  {
    id: 'drawer-story-summary',
    appLabel: 'Story So Far',
    prototypePanel: 'story-summary',
  },
  {
    id: 'drawer-choice-history',
    appLabel: 'Choice History',
    prototypePanel: 'choice-history',
  },
  {
    id: 'drawer-journal',
    appLabel: 'Journal Snapshot',
    prototypePanel: 'journal',
  },
];

const LIGHT_AUDIT_STATES: AuditState[] = [
  {
    id: 'steady',
    applyAppState: async () => {},
    applyPrototypeState: async () => {},
  },
  {
    id: 'streaming',
    applyAppState: applyAppStreamingVisualState,
    applyPrototypeState: applyPrototypeStreamingState,
    appMockOptions: {
      narrativeDelayMs: 2000,
      choicesDelayMs: 2000,
    },
  },
  {
    id: 'character-panel-open',
    applyAppState: openAppCharacterPanel,
    applyPrototypeState: openPrototypeCharacterPanel,
  },
  {
    id: 'tools-panel-open',
    applyAppState: openAppToolsPanel,
    applyPrototypeState: openPrototypeToolsPanel,
  },
  ...drawerStates.map((drawerState) => ({
    id: drawerState.id,
    applyAppState: async (page: Page) => openAppDrawer(page, drawerState.appLabel),
    applyPrototypeState: async (page: Page) =>
      openPrototypeDrawer(page, drawerState.prototypePanel),
  })),
];

const ensureIssue1065OutputDirectories = async (): Promise<void> => {
  await fs.mkdir(ISSUE_1065_APP_SCREENSHOT_DIR, { recursive: true });
  await fs.mkdir(ISSUE_1065_PROTOTYPE_SCREENSHOT_DIR, { recursive: true });
};

const screenshotName = (
  target: 'app' | 'prototype',
  state: string,
  viewportName: string,
  width: number,
  theme: 'light' | 'dark' = 'light',
): string =>
  `${target}-${theme}-${state}-${viewportName}-${width}.png`;

const captureAppState = async (
  page: Page,
  state: AuditState,
  options: { darkMode?: boolean } = {},
) => {
  await setupAppManuscriptPage(page, {
    darkMode: options.darkMode ?? false,
    mockApiOptions: state.appMockOptions,
  });
  await state.applyAppState(page);
  await stabilizeForAuditCapture(page);
  return collectManuscriptMetrics(page);
};

const capturePrototypeState = async (
  page: Page,
  state: AuditState,
  options: { darkMode?: boolean } = {},
) => {
  await setupPrototypeManuscriptPage(page, {
    darkMode: options.darkMode ?? false,
  });
  await state.applyPrototypeState(page);
  await stabilizeForAuditCapture(page);
  return collectManuscriptMetrics(page);
};

test.describe.serial('Issue #1065 audit exports', () => {
  test.skip(
    process.env.ISSUE_1065_AUDIT !== 'true',
    'Set ISSUE_1065_AUDIT=true to run issue export capture.',
  );

  test('@issue1065-audit export screenshot matrix and metrics', async ({
    browser,
  }) => {
    test.setTimeout(20 * 60 * 1000);
    await ensureIssue1065OutputDirectories();

    const metrics: Record<string, unknown> = {
      generatedAt: new Date().toISOString(),
      breakpoints: [...AUDIT_VIEWPORTS, WIDE_VIEWPORT].map((viewport) => ({
        name: viewport.name,
        width: viewport.width,
        height: viewport.height,
      })),
      app: {
        light: {},
        dark: {},
        wide: {},
      },
      prototype: {
        light: {},
        dark: {},
        wide: {},
      },
    };

    for (const viewport of AUDIT_VIEWPORTS) {
      for (const state of LIGHT_AUDIT_STATES) {
        const appContext = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
        });
        const appPage = await appContext.newPage();
        const appMetrics = await captureAppState(appPage, state);
        const appScreenshotPath = path.join(
          ISSUE_1065_APP_SCREENSHOT_DIR,
          screenshotName('app', state.id, viewport.name, viewport.width),
        );
        await appPage.screenshot({
          path: appScreenshotPath,
          fullPage: false,
        });
        (metrics.app as Record<string, Record<string, unknown>>).light[
          `${viewport.name}:${state.id}`
        ] = appMetrics;
        await appContext.close();

        const prototypeContext = await browser.newContext({
          viewport: { width: viewport.width, height: viewport.height },
        });
        const prototypePage = await prototypeContext.newPage();
        const prototypeMetrics = await capturePrototypeState(prototypePage, state);
        const prototypeScreenshotPath = path.join(
          ISSUE_1065_PROTOTYPE_SCREENSHOT_DIR,
          screenshotName('prototype', state.id, viewport.name, viewport.width),
        );
        await prototypePage.screenshot({
          path: prototypeScreenshotPath,
          fullPage: false,
        });
        (metrics.prototype as Record<string, Record<string, unknown>>).light[
          `${viewport.name}:${state.id}`
        ] = prototypeMetrics;
        await prototypeContext.close();
      }

      const steadyState = LIGHT_AUDIT_STATES[0];

      const appDarkContext = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const appDarkPage = await appDarkContext.newPage();
      const appDarkMetrics = await captureAppState(appDarkPage, steadyState, {
        darkMode: true,
      });
      await appDarkPage.screenshot({
        path: path.join(
          ISSUE_1065_APP_SCREENSHOT_DIR,
          screenshotName('app', 'steady', viewport.name, viewport.width, 'dark'),
        ),
        fullPage: false,
      });
      (metrics.app as Record<string, Record<string, unknown>>).dark[
        `${viewport.name}:steady`
      ] = appDarkMetrics;
      await appDarkContext.close();

      const prototypeDarkContext = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
      });
      const prototypeDarkPage = await prototypeDarkContext.newPage();
      const prototypeDarkMetrics = await capturePrototypeState(
        prototypeDarkPage,
        steadyState,
        { darkMode: true },
      );
      await prototypeDarkPage.screenshot({
        path: path.join(
          ISSUE_1065_PROTOTYPE_SCREENSHOT_DIR,
          screenshotName(
            'prototype',
            'steady',
            viewport.name,
            viewport.width,
            'dark',
          ),
        ),
        fullPage: false,
      });
      (metrics.prototype as Record<string, Record<string, unknown>>).dark[
        `${viewport.name}:steady`
      ] = prototypeDarkMetrics;
      await prototypeDarkContext.close();
    }

    const appWideContext = await browser.newContext({
      viewport: { width: WIDE_VIEWPORT.width, height: WIDE_VIEWPORT.height },
    });
    const appWidePage = await appWideContext.newPage();
    const appWideMetrics = await captureAppState(appWidePage, LIGHT_AUDIT_STATES[0]);
    (metrics.app as Record<string, Record<string, unknown>>).wide[
      `${WIDE_VIEWPORT.name}:steady`
    ] = appWideMetrics;
    await appWideContext.close();

    const prototypeWideContext = await browser.newContext({
      viewport: { width: WIDE_VIEWPORT.width, height: WIDE_VIEWPORT.height },
    });
    const prototypeWidePage = await prototypeWideContext.newPage();
    const prototypeWideMetrics = await capturePrototypeState(
      prototypeWidePage,
      LIGHT_AUDIT_STATES[0],
    );
    (metrics.prototype as Record<string, Record<string, unknown>>).wide[
      `${WIDE_VIEWPORT.name}:steady`
    ] = prototypeWideMetrics;
    await prototypeWideContext.close();

    await fs.writeFile(
      ISSUE_1065_METRICS_PATH,
      JSON.stringify(metrics, null, 2),
      'utf8',
    );
  });
});

test.describe('Manuscript breakpoints visual regression (app)', () => {
  test.skip(process.env.ISSUE_1065_AUDIT === 'true', 'Skipped in audit export mode — normalizations affect page height');

  for (const viewport of AUDIT_VIEWPORTS) {
    for (const state of LIGHT_AUDIT_STATES) {
      test(`light ${state.id} at ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });
        await captureAppState(page, state);
        await expect(page).toHaveScreenshot(
          `manuscript-${state.id}-${viewport.name}.png`,
          {
            fullPage: true,
            threshold: 0.35,
            maxDiffPixels: 50000,
          },
        );
      });
    }

    test(`dark steady at ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });
      await captureAppState(page, LIGHT_AUDIT_STATES[0], { darkMode: true });
      await expect(page).toHaveScreenshot(
        `manuscript-steady-dark-${viewport.name}.png`,
        {
          fullPage: true,
          threshold: 0.35,
          maxDiffPixels: 50000,
        },
      );
    });
  }

  test('wide steady metric sanity at 1480', async ({ page }) => {
    await page.setViewportSize({
      width: WIDE_VIEWPORT.width,
      height: WIDE_VIEWPORT.height,
    });
    const metrics = await captureAppState(page, LIGHT_AUDIT_STATES[0]);

    const viewportInner = metrics.nodes.find(
      (node) => node.selector === '.manuscript-viewport-inner',
    );
    const mainStage = metrics.nodes.find(
      (node) => node.selector === '.manuscript-main-stage',
    );
    const actionRail = metrics.nodes.find(
      (node) => node.selector === '#manuscript-action-rail',
    );

    expect(metrics.viewport.width).toBe(1480);
    expect(viewportInner?.exists).toBe(true);
    expect(viewportInner?.width).toBeLessThanOrEqual(1480);
    expect(mainStage?.exists).toBe(true);
    expect(actionRail?.exists).toBe(true);
  });
});
