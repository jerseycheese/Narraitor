import { test, expect } from '@playwright/test';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';
import { waitForStableScrollHeight } from './utils/wait-helpers';

/**
 * Contrast on the choice cards, including the selected one.
 *
 * Selecting a choice tints the whole card, which moves the surface under every
 * mark on it while their colors stay where they were. That has now broken
 * twice: once when `--color-accent-fill` was referenced but never defined and
 * the chosen action rendered white-on-cream at ~1.1:1, and again when the tint
 * pulled the keycap to 3.99:1 light / 3.85:1 dark and the skill badge to
 * 4.24:1 in dark. Neither showed up in a screenshot diff.
 *
 * Two decisions worth naming:
 *
 * - It walks every element that renders its own text rather than a list of
 *   selectors. The keycap was the reported symptom; the skill badge was found
 *   only because nothing was filtered out, and a hardcoded list would have
 *   missed it exactly the way review did.
 *
 * - It composites the backdrop up to the first opaque ancestor. Both the card
 *   tint and the badge fill are alpha, and on a selected card they stack, so
 *   no single element's backgroundColor describes what a reader sees.
 */

const ROUTE = '/worlds/world-cyberpunk-2077/play';
const CONTRAST_FLOOR = 4.5;
const COLOR_SCHEMES = ['light', 'dark'] as const;

function srgbToLinear(channel: number): number {
  const c = channel / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function relativeLuminance(r: number, g: number, b: number): number {
  return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b);
}

function contrastRatio(a: number, b: number): number {
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

test.describe('Choice card contrast', () => {
  for (const scheme of COLOR_SCHEMES) {
    test(`every mark on a choice clears ${CONTRAST_FLOOR}:1 (${scheme})`, async ({ page }) => {
      test.setTimeout(120_000);

      await page.addInitScript((value) => {
        window.localStorage.setItem('narraitor-color-scheme', value);
      }, scheme);
      await seedTestData(page);
      await mockApiEndpoints(page);

      await page.goto(ROUTE, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('[data-testid="manuscript-session-shell"]', { timeout: 15_000 });
      await page.locator('.manuscript-suggested-action').first().waitFor({ timeout: 15_000 });
      await waitForStableScrollHeight(page, { timeout: 10_000, stableDuration: 1000 });

      const runs = await page.evaluate(() => {
        function parse(value: string): [number, number, number, number] {
          const parts = (value.match(/[\d.]+/g) ?? []).map(Number);
          return [parts[0], parts[1], parts[2], parts[3] ?? 1];
        }

        function over(
          src: [number, number, number, number],
          dst: [number, number, number]
        ): [number, number, number] {
          return [0, 1, 2].map((i) => src[i] * src[3] + dst[i] * (1 - src[3])) as [number, number, number];
        }

        function backdropOf(node: Element): [number, number, number] {
          const layers: [number, number, number, number][] = [];
          let current: Element | null = node;
          while (current) {
            const layer = parse(getComputedStyle(current).backgroundColor);
            if (layer[3] > 0) {
              layers.push(layer);
              if (layer[3] === 1) break;
            }
            current = current.parentElement;
          }
          const base = layers.pop();
          let composited: [number, number, number] = base ? [base[0], base[1], base[2]] : [255, 255, 255];
          while (layers.length) composited = over(layers.pop()!, composited);
          return composited;
        }

        const out: { label: string; fg: [number, number, number]; bg: [number, number, number]; floor: number }[] = [];

        document.querySelectorAll('.manuscript-suggested-action').forEach((card, index) => {
          const selected = card.classList.contains('manuscript-suggested-action-selected');
          card.querySelectorAll('*').forEach((element) => {
            const text = Array.from(element.childNodes)
              .filter((node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim())
              .map((node) => (node.textContent ?? '').trim())
              .join(' ');
            if (!text) return;

            const styles = getComputedStyle(element);
            const bg = backdropOf(element);
            const px = parseFloat(styles.fontSize);
            const bold = Number(styles.fontWeight) >= 700;
            const large = px >= 24 || (bold && px >= 18.66);

            out.push({
              label: `choice ${index + 1}${selected ? ' (selected)' : ''} "${text.slice(0, 24)}"`,
              fg: over(parse(styles.color), bg),
              bg,
              floor: large ? 3 : 4.5,
            });
          });
        });

        return out;
      });

      // A pass with nothing measured, or with no selected card in the fixture,
      // would be a green run that proves nothing.
      expect(runs.length).toBeGreaterThan(0);
      expect(runs.some((run) => run.label.includes('(selected)'))).toBe(true);

      for (const run of runs) {
        const ratio = contrastRatio(
          relativeLuminance(run.fg[0], run.fg[1], run.fg[2]),
          relativeLuminance(run.bg[0], run.bg[1], run.bg[2])
        );
        expect(ratio, `${run.label} in ${scheme}: ${ratio.toFixed(2)}:1`).toBeGreaterThanOrEqual(run.floor);
      }
    });
  }
});
