import { test, expect, type Page } from '@playwright/test';
import { PNG } from 'pngjs';
import { HOMEPAGE_SHOWCASE } from '@/components/Landing/homepageShowcase.generated';
import { hideDynamicContent, waitForImagesLoadedIn } from './utils/wait-helpers';

/**
 * Hero contrast over photography, the check _register-brand.css promises.
 *
 * The direction makes this binding: text over photography is the hardest
 * contrast case there is, it has to hold four times over in both themes, and
 * the floor has to be verified per image rather than assumed from one.
 *
 * The method, and why each step is the way it is:
 *
 * - It samples the COMPOSITE, not the source art. The scrim is alpha, so no
 *   pixel of the .webp is what a reader sees; object-fit: cover crops each
 *   image differently at each width, so which part of the art sits behind the
 *   headline is a layout outcome; and the copy block's gradient ramps the
 *   guaranteed layer in over its top padding, so effective alpha varies down
 *   the sampled region. Only the rendered composite carries all three.
 *
 * - It hides the glyphs before capturing. With the text painted, the lightest
 *   pixel inside the headline's box IS the headline, since the ink sits at
 *   luminance 0.90, so a max over that region would measure the ink and fail
 *   every world. visibility: hidden does not reflow, so the boxes measured
 *   beforehand still describe exactly the area the text occupies.
 *
 * - It takes the MAX luminance, because the ink is light: the lightest
 *   backdrop pixel is the worst case, and one blown highlight in the art is
 *   enough to fail a headline.
 *
 * Both widths are covered. The narrow-width block in landing.css shortens the
 * gradient ramp along with the hero copy padding, and that ramp is the layer
 * holding the floor, so 375 is not a free ride on the desktop measurement.
 *
 * One test per world per theme per width rather than loops: the 60s timeout in
 * playwright.config.ts is per test, and a loop would hide the second failure
 * behind the first.
 */

const CONTRAST_FLOOR = 4.5;
const COLOR_SCHEMES = ['light', 'dark'] as const;
const WIDTHS = [
  { name: 'desktop', width: 1280, height: 1024 },
  { name: 'mobile', width: 375, height: 812 },
] as const;

// The two runs of text laid over the art. The CTA row is excluded on purpose:
// it carries its own solid background and its own contrast contract.
const TEXT_SELECTORS = [
  '.component-landing-title',
  '.component-landing-lead',
] as const;

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG 2.1 relative luminance from 8-bit sRGB. */
function relativeLuminance(r: number, g: number, b: number): number {
  return (
    0.2126 * srgbToLinear(r) +
    0.7152 * srgbToLinear(g) +
    0.0722 * srgbToLinear(b)
  );
}

function contrastRatio(a: number, b: number): number {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/**
 * The ink is read off the live token rather than hardcoded, so retuning
 * --brand-hero-ink-soft re-runs this check against the new value instead of
 * silently invalidating it. Custom properties come back as authored, e.g.
 * "rgb(231 224 213)", so the three numbers are pulled out directly.
 */
async function readInkLuminance(page: Page): Promise<number> {
  const value = await page.evaluate(() => {
    const surface = document.querySelector('[data-register="brand"]');
    return surface
      ? getComputedStyle(surface).getPropertyValue('--brand-hero-ink-soft').trim()
      : '';
  });

  const channels = value.match(/\d+(?:\.\d+)?/g);
  if (!channels || channels.length < 3) {
    throw new Error(`Could not parse --brand-hero-ink-soft from "${value}"`);
  }

  return relativeLuminance(
    Number(channels[0]),
    Number(channels[1]),
    Number(channels[2])
  );
}

/** The lightest pixel anywhere behind the hero headline and lead. */
async function worstBackdropLuminance(page: Page): Promise<number> {
  const hero = page.locator('.component-landing-hero');

  const heroBox = await hero.boundingBox();
  if (!heroBox) throw new Error('.component-landing-hero has no bounding box');

  const textBoxes = [];
  for (const selector of TEXT_SELECTORS) {
    const box = await page.locator(selector).boundingBox();
    if (!box) throw new Error(`${selector} has no bounding box`);
    textBoxes.push(box);
  }

  await page.addStyleTag({
    content: `${TEXT_SELECTORS.join(',')} { visibility: hidden; }`,
  });

  const png = PNG.sync.read(await hero.screenshot());

  // Element screenshots are captured at the context's deviceScaleFactor.
  // Derived from the image rather than read off the config, so a HiDPI project
  // added later cannot silently sample the wrong rectangle.
  const scale = png.width / heroBox.width;
  const clampX = (v: number) => Math.min(Math.max(v, 0), png.width);
  const clampY = (v: number) => Math.min(Math.max(v, 0), png.height);

  let worst = 0;
  for (const box of textBoxes) {
    const x0 = clampX(Math.floor((box.x - heroBox.x) * scale));
    const y0 = clampY(Math.floor((box.y - heroBox.y) * scale));
    const x1 = clampX(Math.ceil((box.x - heroBox.x + box.width) * scale));
    const y1 = clampY(Math.ceil((box.y - heroBox.y + box.height) * scale));

    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = ((png.width * y) + x) << 2;
        const luminance = relativeLuminance(
          png.data[i],
          png.data[i + 1],
          png.data[i + 2]
        );
        if (luminance > worst) worst = luminance;
      }
    }
  }

  return worst;
}

async function openHeroForWorld(
  page: Page,
  scheme: (typeof COLOR_SCHEMES)[number],
  worldId: string
): Promise<void> {
  // Seeds the real storage key before first paint, the same way
  // brand-register.spec.ts does: ThemeProvider's effect removes a .dark class
  // it did not set itself.
  await page.addInitScript((value) => {
    window.localStorage.setItem('narraitor-color-scheme', value);
  }, scheme);

  await page.goto('/');
  await page.waitForSelector('.component-landing-hero', { timeout: 15000 });

  if (scheme === 'dark') {
    await expect(page.locator('html')).toHaveClass(/dark/);
  } else {
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  }

  // Forces every hero plate to decode before switching. Only the first is
  // priority, so the other three are lazy, and a plate revealed with no pixels
  // yet would composite against paper and pass for the wrong reason.
  await waitForImagesLoadedIn(page, '.component-landing-hero');

  // Clicks the label, not the input: the input is 1px with pointer-events
  // none, so checking it directly needs force and lands elsewhere anyway.
  await page.locator(`label[for="landing-world-${worldId}"]`).click();
  await expect(page.locator(`#landing-world-${worldId}`)).toBeChecked();

  await hideDynamicContent(page);
  await page.evaluate(() => document.fonts.ready);
}

test.describe('Hero contrast over world art', () => {
  for (const viewport of WIDTHS) {
    for (const scheme of COLOR_SCHEMES) {
      for (const world of HOMEPAGE_SHOWCASE) {
        test(`hero copy clears ${CONTRAST_FLOOR}:1 over ${world.id} (${scheme}, ${viewport.name})`, async ({
          page,
        }) => {
          await page.setViewportSize({
            width: viewport.width,
            height: viewport.height,
          });
          await openHeroForWorld(page, scheme, world.id);

          const ink = await readInkLuminance(page);
          const backdrop = await worstBackdropLuminance(page);
          const ratio = contrastRatio(ink, backdrop);

          expect(
            ratio,
            `${world.id} in ${scheme} at ${viewport.width}px: the lightest ` +
              `pixel behind the hero copy gives ${ratio.toFixed(2)}:1 against ` +
              `--brand-hero-ink-soft`
          ).toBeGreaterThanOrEqual(CONTRAST_FLOOR);
        });
      }
    }
  }
});

/**
 * Text on solid backgrounds below the hero, in both themes.
 *
 * This block exists because the suite above was green while the typed block
 * measured 1.22:1 in dark mode: white ink on a background that had inverted to
 * off-white. The hero was covered four ways over and the rest of the page was
 * covered not at all, so a green run proved less than it looked like it did.
 *
 * The failure mode is specific and worth naming, because it is invisible in
 * light mode and invisible in a screenshot diff: a background token chosen for
 * the theme (--color-text-primary, which flips) paired with a foreground token
 * that does not flip. Both halves have to agree about whether they follow the
 * canvas.
 *
 * Computed colours rather than pixel sampling, deliberately. These sit on flat
 * fills, so there is no compositing to resolve and nothing the source values
 * fail to describe. The hero needs the screenshot because a photograph is
 * behind it; this does not.
 */
const SOLID_TEXT_RUNS = [
  '.component-landing-typed-text',
  '.component-landing-typed .component-landing-label',
  '.component-landing-choice-mark',
  '.component-landing-closing-text',
] as const;

test.describe('Contrast on solid backgrounds', () => {
  for (const scheme of COLOR_SCHEMES) {
    test(`page text clears ${CONTRAST_FLOOR}:1 on its own fills (${scheme})`, async ({
      page,
    }) => {
      await openHeroForWorld(page, scheme, HOMEPAGE_SHOWCASE[0].id);

      const measured = await page.evaluate((selectors) => {
        function parse(value: string): [number, number, number, number] {
          const parts = (value.match(/[\d.]+/g) ?? []).map(Number);
          return [parts[0], parts[1], parts[2], parts[3] ?? 1];
        }

        function over(
          src: [number, number, number, number],
          dst: [number, number, number]
        ): [number, number, number] {
          return [0, 1, 2].map(
            (i) => src[i] * src[3] + dst[i] * (1 - src[3])
          ) as [number, number, number];
        }

        // --color-accent-soft is a 16% fill, so the nearest painting ancestor
        // is not what a reader sees. Collect every layer up to the first
        // opaque one and composite them back down, or the closing band
        // measures its own alpha against nothing and reports a failure that
        // is not there.
        function backdropOf(node: Element): [number, number, number] {
          const layers: [number, number, number, number][] = [];
          let current: Element | null = node.parentElement;
          while (current) {
            const layer = parse(getComputedStyle(current).backgroundColor);
            if (layer[3] > 0) {
              layers.push(layer);
              if (layer[3] === 1) break;
            }
            current = current.parentElement;
          }

          const base = layers.pop();
          let composited: [number, number, number] = base
            ? [base[0], base[1], base[2]]
            : [255, 255, 255];
          while (layers.length) composited = over(layers.pop()!, composited);
          return composited;
        }

        return selectors.map((selector) => {
          const element = document.querySelector(selector);
          if (!element) throw new Error(`no element for ${selector}`);
          const own = parse(getComputedStyle(element).backgroundColor);
          const behind = backdropOf(element);
          const bg = own[3] > 0 ? over(own, behind) : behind;
          return {
            selector,
            fg: over(parse(getComputedStyle(element).color), bg),
            bg,
          };
        });
      }, SOLID_TEXT_RUNS as unknown as string[]);

      for (const run of measured) {
        const ratio = contrastRatio(
          relativeLuminance(run.fg[0], run.fg[1], run.fg[2]),
          relativeLuminance(run.bg[0], run.bg[1], run.bg[2])
        );
        expect(
          ratio,
          `${run.selector} in ${scheme}: ${ratio.toFixed(2)}:1`
        ).toBeGreaterThanOrEqual(CONTRAST_FLOOR);
      }
    });
  }
});
