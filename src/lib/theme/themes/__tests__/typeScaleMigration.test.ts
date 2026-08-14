import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

const rootDir = path.join(__dirname, '../../../../..');

// The exact rem values that now have a named --font-size-* token
// (see typeScale.test.ts). Once a value has a token, production CSS should
// reference the token instead of repeating the literal.
const MIGRATED_VALUES = [
  '0.625rem',
  '0.6875rem',
  '0.75rem',
  '0.8125rem',
  '0.875rem',
  '0.9375rem',
  '1rem',
  '1.125rem',
  '1.25rem',
  '1.5rem',
  '1.875rem',
  '2.125rem',
];

// The token definition file is the one place the literals are allowed to
// live; everything else under src/ should consume them via var(...).
const EXCLUDED_FILES = [
  path.join(rootDir, 'src/lib/theme/themes/_shared-tokens.css'),
];

function findProductionCssFiles(): string[] {
  return globSync('src/**/*.css', { cwd: rootDir, absolute: true }).filter(
    (file) => !EXCLUDED_FILES.includes(file)
  );
}

function findProductionTsxFiles(): string[] {
  return globSync('src/**/*.tsx', { cwd: rootDir, absolute: true });
}

function findOffenders(files: string[], pattern: RegExp): string[] {
  return files
    .filter((file) => pattern.test(fs.readFileSync(file, 'utf-8')))
    .map((file) => path.relative(rootDir, file));
}

function escapeValue(value: string): string {
  return value.replace('.', '\\.');
}

describe('DS3 type scale migration: no re-introduced literals', () => {
  const cssFiles = findProductionCssFiles();
  const tsxFiles = findProductionTsxFiles();

  it('found production CSS files to check (sanity check on the glob)', () => {
    expect(cssFiles.length).toBeGreaterThan(10);
  });

  it('found production TSX files to check (sanity check on the glob)', () => {
    expect(tsxFiles.length).toBeGreaterThan(10);
  });

  it.each(MIGRATED_VALUES)(
    'no CSS font-size declaration hardcodes %s where a token now exists',
    (value) => {
      const pattern = new RegExp(`font-size:\\s*${escapeValue(value)}\\b`);
      expect(findOffenders(cssFiles, pattern)).toEqual([]);
    }
  );

  // Inline styles in TSX bypass the CSS check entirely, which is how eight
  // literals survived the first migration pass.
  it.each(MIGRATED_VALUES)(
    'no TSX inline fontSize hardcodes %s where a token now exists',
    (value) => {
      const pattern = new RegExp(
        `fontSize:\\s*['"\`]${escapeValue(value)}['"\`]`
      );
      expect(findOffenders(tsxFiles, pattern)).toEqual([]);
    }
  );
});
