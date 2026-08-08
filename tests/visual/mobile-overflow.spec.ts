import { test, expect, type Page } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';

/**
 * Mobile action-row overflow (#1264): asserts no horizontal overflow across
 * two narrow viewports.
 */

const expectNoHorizontalOverflow = async (
  page: Page,
  theme: string,
  width: number,
  selector?: string
) => {
    const overflow = await page.evaluate((targetSelector) => {
      const doc = document.documentElement;
      const body = document.body;
      const target = targetSelector ? document.querySelector(targetSelector) : null;

      const results = {
        docScrollWidth: doc.scrollWidth,
        docClientWidth: doc.clientWidth,
        bodyScrollWidth: body.scrollWidth,
        bodyClientWidth: body.clientWidth,
        targetScrollWidth: target ? target.scrollWidth : 0,
        targetClientWidth: target ? target.clientWidth : 0,
        hasOverflow: false,
      };

      results.hasOverflow =
        doc.scrollWidth > doc.clientWidth ||
        body.scrollWidth > body.clientWidth ||
        (target ? target.scrollWidth > target.clientWidth : false);

      return results;
    }, selector);

    console.log(
      `Overflow results for ${theme} at ${width}px:`,
      JSON.stringify(overflow, null, 2)
    );

    expect(
      overflow.hasOverflow,
      `Should not have horizontal overflow in ${theme} at ${width}px`
    ).toBe(false);
  };

test.describe('Mobile Action Row Layout', () => {
  const theme = 'ds3';
  const mobileViewports = [
    { name: 'narrow-mobile', width: 320, height: 568 },
    { name: 'mobile', width: 375, height: 667 },
  ] as const;

  for (const viewport of mobileViewports) {
    test(`Mobile action row should not have horizontal overflow at ${viewport.width}px`, async ({ page }) => {
      // Seed test data and mock APIs
      await seedTestData(page);
      await mockApiEndpoints(page);

      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      // Go to play page
      await page.goto('/worlds/world-cyberpunk-2077/play');

      // Wait for the main manuscript shell to load
      await page.waitForSelector('[data-testid="manuscript-session-shell"]', { timeout: 15000 });

      // Check if suggested actions are present
      await expect(page.locator('.manuscript-suggested-action').first()).toBeVisible();

      // Check for horizontal overflow
      await expectNoHorizontalOverflow(page, theme, viewport.width, '#manuscript-action-rail');
    });

    test(`World detail action row should not have horizontal overflow at ${viewport.width}px`, async ({ page }) => {
      await seedTestData(page);

      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
      });

      await page.goto('/worlds/world-cyberpunk-2077');

      await page.waitForFunction(
        () => (window as typeof window & { __TEST_STORES_SEEDED__?: boolean }).__TEST_STORES_SEEDED__ === true,
        { timeout: 15000 }
      );

      await expect(page.getByRole('button', { name: 'Play in World' })).toBeVisible();

      await expectNoHorizontalOverflow(page, theme, viewport.width);
    });
  }
});

/**
 * App-shell header mobile collapse (#1381).
 *
 * The header's desktop nav row, action cluster, and hamburger toggle all collapse
 * purely via CSS media queries at <=768px. At narrow widths the hamburger — not the
 * desktop nav row — must own navigation, and the header itself must not overflow.
 *
 * Scope is the header on purpose: these assert the collapse and that `.header-nav`
 * doesn't overflow, on both a breadcrumb-free route (`/dashboard` — the app home
 * since #1528 moved the dashboard off `/`) and a breadcrumb-bearing
 * one (`/about`). They deliberately do NOT assert whole-document width — page
 * content can overflow for reasons unrelated to the header (e.g. the About-page
 * footer's box-sizing bug, tracked separately), and #1381 is header-only.
 */
test.describe('App-Shell Header Mobile Collapse', () => {
  const headerViewports = [
    { name: 'narrow-mobile', width: 320, height: 568 },
    { name: 'mobile', width: 375, height: 667 },
  ] as const;
  const routes = ['/dashboard', '/about'] as const;

  const expectHeaderCollapsed = async (page: Page) => {
    // Hamburger owns navigation; the desktop nav row is hidden via CSS.
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
    await expect(page.locator('.header-nav-desktop-links')).toBeHidden();
    const headerOverflows = await page.evaluate(() => {
      const h = document.querySelector('.header-nav');
      return h ? h.scrollWidth > h.clientWidth : true;
    });
    expect(headerOverflows, 'header should not overflow horizontally').toBe(false);
  };

  for (const route of routes) {
    for (const viewport of headerViewports) {
      test(`header collapses to the hamburger on ${route} at ${viewport.width}px`, async ({ page }) => {
        // Seed worlds so the header carries its fullest set (world switcher + CTA),
        // which the CSS must keep collapsed at this width.
        await seedTestData(page);
        await mockApiEndpoints(page);
        await page.setViewportSize({ width: viewport.width, height: viewport.height });

        await page.goto(route);
        await page.waitForSelector('.header-nav', { timeout: 15000 });

        await expectHeaderCollapsed(page);
      });
    }
  }
});

/**
 * Homepage overflow at narrow widths.
 *
 * Unlike the header block above, this asserts at the DOCUMENT level. The
 * homepage's bands cancel .app-surface-inner's padding with a negative inline
 * margin, so getting the cancel amount wrong pushes the whole document past
 * the viewport. That is the failure --landing-bleed exists to prevent:
 * --page-gutter is retuned by the brand register and would over-pull the bands
 * by 8px at >=1024.
 *
 * The element target is .component-landing-plates, NOT .component-landing.
 * Fieldsets default to min-inline-size: min-content, which ignores the grid and
 * overflows at 320px, so the plate strip is the one child worth checking
 * directly. .component-landing itself is legitimately wider than its content
 * box by exactly one bleed on each side, so asserting on it would fail on
 * correct markup.
 *
 * Deliberately NOT seeded. seedTestData writes worlds into local storage, and
 * ReturningUserRedirect soft-navigates any browser with persisted data off /
 * to /dashboard, so a seeded run would measure the dashboard and pass green
 * without ever loading the homepage.
 */
test.describe('Homepage Mobile Overflow', () => {
  const theme = 'ds3';
  const homeViewports = [
    { name: 'narrow-mobile', width: 320, height: 568 },
    { name: 'mobile', width: 375, height: 667 },
  ] as const;

  for (const viewport of homeViewports) {
    test(`homepage has no horizontal overflow at ${viewport.width}px`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });

      await page.goto('/');
      await page.waitForSelector('.component-landing-hero', { timeout: 15000 });
      await expect(page.locator('.component-landing-plates')).toBeVisible();

      await expectNoHorizontalOverflow(
        page,
        theme,
        viewport.width,
        '.component-landing-plates'
      );
    });
  }
});
