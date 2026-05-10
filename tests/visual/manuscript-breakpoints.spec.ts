import { expect, test, type Page } from '@playwright/test';
import {
  AUDIT_VIEWPORTS,
  WIDE_VIEWPORT,
  applyAppStreamingVisualState,
  collectManuscriptMetrics,
  openAppCharacterPanel,
  openAppDrawer,
  openAppToolsPanel,
  setupAppManuscriptPage,
  stabilizeForCapture,
  type AppDrawerName,
} from './utils/manuscript-helpers';

interface BreakpointState {
  id: string;
  applyAppState: (page: Page) => Promise<void>;
  appMockOptions?: {
    narrativeDelayMs?: number;
    choicesDelayMs?: number;
  };
}

const drawerStates: Array<{ id: string; appLabel: AppDrawerName }> = [
  { id: 'drawer-character', appLabel: 'Character Details' },
  { id: 'drawer-inventory', appLabel: 'Inventory' },
  { id: 'drawer-story-summary', appLabel: 'Story So Far' },
  { id: 'drawer-choice-history', appLabel: 'Choice History' },
  { id: 'drawer-journal', appLabel: 'Journal Snapshot' },
];

const BREAKPOINT_STATES: BreakpointState[] = [
  {
    id: 'steady',
    applyAppState: async () => {},
  },
  {
    id: 'streaming',
    applyAppState: applyAppStreamingVisualState,
    appMockOptions: {
      narrativeDelayMs: 2000,
      choicesDelayMs: 2000,
    },
  },
  {
    id: 'character-panel-open',
    applyAppState: openAppCharacterPanel,
  },
  {
    id: 'tools-panel-open',
    applyAppState: openAppToolsPanel,
  },
  ...drawerStates.map((drawerState) => ({
    id: drawerState.id,
    applyAppState: async (page: Page) => openAppDrawer(page, drawerState.appLabel),
  })),
];

const captureAppState = async (
  page: Page,
  state: BreakpointState,
  options: { darkMode?: boolean } = {},
) => {
  await setupAppManuscriptPage(page, {
    darkMode: options.darkMode ?? false,
    mockApiOptions: state.appMockOptions,
  });
  await state.applyAppState(page);
  await stabilizeForCapture(page);
  return collectManuscriptMetrics(page);
};

test.describe('Manuscript breakpoints visual regression (app)', () => {
  for (const viewport of AUDIT_VIEWPORTS) {
    for (const state of BREAKPOINT_STATES) {
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
      await captureAppState(page, BREAKPOINT_STATES[0], { darkMode: true });
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
    const metrics = await captureAppState(page, BREAKPOINT_STATES[0]);

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
