import { test, expect, type Page } from '@playwright/test';

/**
 * Brand register plumbing. DOM assertions, not screenshots: the register is a
 * token layer, and the four marketing baselines already cover how it looks.
 * What they can't catch is the register resolving the wrong VALUES, which is
 * why the dark-mode case below is the most important test in this file.
 */

const BRAND_ROUTES = ['/', '/about', '/faq', '/privacy', '/terms'];
const PRODUCT_ROUTES = ['/dashboard', '/worlds', '/settings'];

function readRegisterToken(page: Page, token: string): Promise<string> {
  return page.evaluate((name) => {
    const surface = document.querySelector('[data-register]');
    if (!surface) return '';
    return getComputedStyle(surface).getPropertyValue(name).trim();
  }, token);
}

test.describe('Brand register', () => {
  for (const route of BRAND_ROUTES) {
    test(`tags ${route} as the brand register`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('[data-surface-mode="app"]')).toHaveAttribute(
        'data-register',
        'brand'
      );
    });
  }

  for (const route of PRODUCT_ROUTES) {
    test(`tags ${route} as the product register`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('[data-surface-mode="app"]')).toHaveAttribute(
        'data-register',
        'product'
      );
    });
  }

  // The register must stay a token layer. Two surface roots or two headers on a
  // brand route means a third chrome has arrived.
  for (const route of BRAND_ROUTES) {
    test(`keeps ${route} inside the single app chrome`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('[data-surface-mode]')).toHaveCount(1);
      await expect(page.locator('header.header-nav')).toHaveCount(1);
    });
  }

  for (const route of BRAND_ROUTES) {
    test(`renders no breadcrumb band on ${route}`, async ({ page }) => {
      await page.goto(route);
      await expect(page.locator('.breadcrumbs-container')).toHaveCount(0);
    });
  }

  test('keeps the breadcrumb band on a nested product route', async ({
    page,
  }) => {
    await page.goto('/worlds/world-cyberpunk-2077');
    await expect(page.locator('.breadcrumbs-container')).toHaveCount(1);
  });

  test('overrides the :root page gutter', async ({ page }) => {
    await page.goto('/about');
    const { root, register } = await page.evaluate(() => ({
      root: getComputedStyle(document.documentElement)
        .getPropertyValue('--page-gutter')
        .trim(),
      register: getComputedStyle(document.querySelector('[data-register]')!)
        .getPropertyValue('--page-gutter')
        .trim(),
    }));

    expect(root).not.toBe('');
    expect(register).not.toBe(root);
  });

  // Guards the silent failure this layer is most exposed to. A custom property
  // declared on a descendant of :root beats an inherited one regardless of
  // specificity, so without the :root.dark variant in _register-brand.css the
  // brand pages would quietly serve light-mode values in dark mode. Seeds the
  // real storage key rather than adding .dark by hand, because ThemeProvider's
  // effect removes a class it didn't set.
  test('resolves distinct brand tokens in dark mode', async ({ page }) => {
    await page.goto('/about');
    const light = await readRegisterToken(page, '--color-accent-soft');

    await page.addInitScript(() =>
      localStorage.setItem('narraitor-color-scheme', 'dark')
    );
    await page.goto('/about');
    await expect(page.locator('html')).toHaveClass(/dark/);
    const dark = await readRegisterToken(page, '--color-accent-soft');

    expect(light).not.toBe('');
    expect(dark).not.toBe('');
    expect(dark).not.toBe(light);
  });

  // The hero tokens are the inverse case: they must NOT follow the theme, since
  // what sits behind them is a photograph. A typo in one of these names fails
  // silently into an inherited near-black on a dark image, and a screenshot
  // baseline generated from that state would lock the bug in.
  test('resolves theme-independent hero tokens on the homepage', async ({
    page,
  }) => {
    await page.goto('/');
    const light = await readRegisterToken(page, '--brand-hero-ink');

    await page.addInitScript(() =>
      localStorage.setItem('narraitor-color-scheme', 'dark')
    );
    await page.goto('/');
    await expect(page.locator('html')).toHaveClass(/dark/);
    const dark = await readRegisterToken(page, '--brand-hero-ink');

    expect(light).not.toBe('');
    expect(dark).toBe(light);
  });
});
