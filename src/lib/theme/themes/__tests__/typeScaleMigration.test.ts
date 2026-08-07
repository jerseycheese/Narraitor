import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

const rootDir = path.join(__dirname, '../../../../..');

// The exact rem values that now have a named --font-size-* token
// (see typeScale.test.ts). Once a value has a token, production CSS should
// reference the token instead of repeating the literal.
const MIGRATED_VALUES = [
  '0.625rem',
  '0.75rem',
  '0.875rem',
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

describe('DS3 type scale migration: no re-introduced literals', () => {
  const cssFiles = findProductionCssFiles();

  it('found production CSS files to check (sanity check on the glob)', () => {
    expect(cssFiles.length).toBeGreaterThan(10);
  });

  it.each(MIGRATED_VALUES)(
    'no font-size declaration hardcodes %s where a token now exists',
    (value) => {
      const offenders: string[] = [];
      const pattern = new RegExp(`font-size:\\s*${value.replace('.', '\\.')}\\b`);

      for (const file of cssFiles) {
        const contents = fs.readFileSync(file, 'utf-8');
        if (pattern.test(contents)) {
          offenders.push(path.relative(rootDir, file));
        }
      }

      expect(offenders).toEqual([]);
    }
  );
});
