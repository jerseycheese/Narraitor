import fs from 'fs';
import path from 'path';

const sharedTokensCss = fs.readFileSync(
  path.join(__dirname, '../_shared-tokens.css'),
  'utf-8'
);

// Named steps, in ascending order, anchored to real DS3 usage:
// --font-size-xs/sm/base/md/lg/xl already match DESIGN.md's documented
// "values in active use" (badges/metadata, interface text, body, section
// headings, page titles); --font-size-3xl matches the page-layout hero
// title (app-shell.css .page-layout-title, ex-workshop.css:1810 per #1622).
// The _5 steps are exact midpoints of the pair they sit between, covering
// the dense surfaces that land between two named steps.
const EXPECTED_SCALE: Array<[token: string, rem: number]> = [
  ['--font-size-2xs', 0.625],
  ['--font-size-2xs_5', 0.6875],
  ['--font-size-xs', 0.75],
  ['--font-size-xs_5', 0.8125],
  ['--font-size-sm', 0.875],
  ['--font-size-sm_5', 0.9375],
  ['--font-size-base', 1],
  ['--font-size-md', 1.125],
  ['--font-size-lg', 1.25],
  ['--font-size-xl', 1.5],
  ['--font-size-2xl', 1.875],
  ['--font-size-3xl', 2.125],
];

function readTokenValue(css: string, token: string): string | null {
  const match = css.match(
    new RegExp(`${token.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}:\\s*([^;]+);`)
  );
  return match ? match[1].trim() : null;
}

describe('DS3 type scale tokens (_shared-tokens.css)', () => {
  it.each(EXPECTED_SCALE)('defines %s as %srem', (token, rem) => {
    const value = readTokenValue(sharedTokensCss, token);
    expect(value).toBe(`${rem}rem`);
  });

  it('orders the named steps ascending by value', () => {
    const values = EXPECTED_SCALE.map(([token]) => {
      const raw = readTokenValue(sharedTokensCss, token);
      expect(raw).not.toBeNull();
      return parseFloat(raw as string);
    });
    const sorted = [...values].sort((a, b) => a - b);
    expect(values).toEqual(sorted);
  });

  it('keeps every step a genuine increase over the last (no duplicate sizes)', () => {
    const values = EXPECTED_SCALE.map(([token]) =>
      parseFloat(readTokenValue(sharedTokensCss, token) as string)
    );
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeGreaterThan(values[i - 1]);
    }
  });
});
