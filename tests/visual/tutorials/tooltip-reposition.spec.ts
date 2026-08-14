import { test, expect, type Page } from '@playwright/test';
import { waitForContentStable } from '../utils/wait-helpers';
import { seedTestData } from '../utils/seedTestData';
import {
  gotoTutorialPage,
  waitForStoreReady,
  setTutorialProgress,
  startTourAt,
  stopTour,
  waitForTooltip,
} from '../utils/tutorial-helpers';

/**
 * Joyride places a step's tooltip once and never re-measures it, so
 * useTutorialTooltipReposition re-runs the positioning on reflow and asks the
 * provider to redraw the spotlight when the target has moved.
 *
 * The jsdom version of this check faked the move by replacing the target's
 * getBoundingClientRect, which tests the hook's arithmetic against numbers the
 * test wrote rather than against a page that reflowed. Growing the document
 * here moves the target for real and lets both the tooltip and the spotlight
 * be measured where the player would see them.
 */

const TARGET = '[data-tutorial="world-name"]';
const REFLOW_HEIGHT_PX = 160;

// Popper repositions on an animation frame, so a couple of pixels of settle is
// expected. Losing the anchor entirely costs REFLOW_HEIGHT_PX.
const ANCHOR_TOLERANCE_PX = 8;

type AnchorOffsets = {
  targetDocumentTop: number;
  tooltipFromTarget: number;
  spotlightFromTarget: number;
};

// Returns null while the tour UI is mid-redraw: reporting the moved target is
// what makes the provider remount the spotlight, so there's a frame where it
// isn't in the tree and a read that throws there would fail the poll outright.
const readAnchorOffsets = (page: Page): Promise<AnchorOffsets | null> =>
  page.evaluate((targetSelector) => {
    const target = document.querySelector(targetSelector);
    const tooltip = document.querySelector('.react-joyride__tooltip');
    const spotlight = document.querySelector('.react-joyride__spotlight');

    if (!target || !tooltip || !spotlight) {
      return null;
    }

    const targetTop = target.getBoundingClientRect().top;
    return {
      targetDocumentTop: targetTop + window.scrollY,
      tooltipFromTarget: tooltip.getBoundingClientRect().top - targetTop,
      spotlightFromTarget: spotlight.getBoundingClientRect().top - targetTop,
    };
  }, TARGET);

const readSettledAnchorOffsets = async (page: Page): Promise<AnchorOffsets> => {
  let offsets: AnchorOffsets | null = null;
  await expect
    .poll(
      async () => {
        offsets = await readAnchorOffsets(page);
        return offsets !== null;
      },
      { timeout: 10000 }
    )
    .toBe(true);
  return offsets as unknown as AnchorOffsets;
};

test('Tour tooltip and spotlight follow a target that a reflow moves', async ({
  page,
}) => {
  test.setTimeout(90000);

  await seedTestData(page);
  await gotoTutorialPage(page, '/worlds/create');
  await waitForContentStable(page);
  await waitForStoreReady(page);

  await setTutorialProgress(page, {
    intro: { completed: true, skipped: false },
    worldCreation: { completed: false, skipped: true, lastStep: 0 },
    worldGeneration: { completed: true, skipped: true, lastStep: 0 },
    characterCreation: { completed: true, skipped: true, lastStep: 0 },
    firstPlay: { completed: true, skipped: true },
  });

  // The wizard arms a 500ms auto-start timer on mount; let it fire and stop it,
  // then drive the step explicitly. Same handling as the tour screenshot specs.
  await page.waitForTimeout(600);
  await stopTour(page);

  await startTourAt(page, 'worldCreation', 0);
  await waitForTooltip(page);
  await page.waitForTimeout(500);

  const before = await readSettledAnchorOffsets(page);

  await page.evaluate((height) => {
    const spacer = document.createElement('div');
    spacer.setAttribute('data-test-reflow-spacer', 'true');
    spacer.style.height = `${height}px`;
    document.body.prepend(spacer);
  }, REFLOW_HEIGHT_PX);

  await expect
    .poll(
      async () => (await readAnchorOffsets(page))?.targetDocumentTop ?? -1,
      { timeout: 10000 }
    )
    .toBeGreaterThan(before.targetDocumentTop + REFLOW_HEIGHT_PX / 2);

  // Popper repositions on the frame after the move is reported, so read once
  // the redraw has landed rather than in the middle of it.
  await page.waitForTimeout(500);
  const after = await readSettledAnchorOffsets(page);

  // Both are drawn in document coordinates, so a tooltip left on its original
  // coordinates keeps its old position while the target slides out from under
  // it. Holding the offset is what "followed the target" means.
  expect(Math.abs(after.tooltipFromTarget - before.tooltipFromTarget)).toBeLessThanOrEqual(
    ANCHOR_TOLERANCE_PX
  );
  expect(
    Math.abs(after.spotlightFromTarget - before.spotlightFromTarget)
  ).toBeLessThanOrEqual(ANCHOR_TOLERANCE_PX);
});
