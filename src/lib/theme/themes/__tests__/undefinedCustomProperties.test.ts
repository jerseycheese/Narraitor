import fs from 'fs';
import path from 'path';
import { globSync } from 'glob';

// Guard for #1731: a var(--name) reference with no fallback silently drops
// its declaration if --name is never defined anywhere. Every bare var()
// reference in production CSS (and story files, since Storybook decorators
// hit the same bug) must resolve to a real definition site.

const rootDir = path.join(__dirname, '../../../../..');

// Matches a var() call with no fallback: var(--some-name). A var() call
// with a fallback (a comma before the closing paren) is already safe and
// out of scope for this guard.
const BARE_VAR_PATTERN = /var\(\s*(--[a-zA-Z0-9-]+)\s*\)/g;
const DEFINITION_PATTERN = /(--[a-zA-Z0-9-]+)\s*:/g;
// next/font injects custom properties via a `variable: '--font-x'` config
// option rather than a literal CSS declaration. This is the one file that
// actually wires them up at runtime.
const NEXT_FONT_LAYOUT_FILE = 'src/app/layout.tsx';
const NEXT_FONT_VARIABLE_PATTERN = /variable:\s*['"](--[a-zA-Z0-9-]+)['"]/g;

// Strip /* ... */ comments so a token name mentioned in prose (e.g.
// "--color-x: was never defined") can't be mistaken for a real declaration.
function stripCssComments(contents: string): string {
  return contents.replace(/\/\*[\s\S]*?\*\//g, '');
}

function findSourceFiles(): string[] {
  return [
    ...globSync('src/**/*.css', { cwd: rootDir, absolute: true }),
    ...globSync('src/**/*.stories.tsx', { cwd: rootDir, absolute: true }),
  ];
}

function findBareVarReferences(files: string[]): Map<string, string[]> {
  const references = new Map<string, string[]>();

  for (const file of files) {
    const contents = fs.readFileSync(file, 'utf-8');
    const relativePath = path.relative(rootDir, file);

    for (const match of contents.matchAll(BARE_VAR_PATTERN)) {
      const name = match[1];
      const existing = references.get(name) ?? [];
      existing.push(relativePath);
      references.set(name, existing);
    }
  }

  return references;
}

// Only real CSS declarations (and the one known runtime injection site)
// count as a definition — not a token name mentioned in a test assertion,
// fixture, or comment anywhere else under src/.
function findDefinedProperties(): Set<string> {
  const defined = new Set<string>();

  for (const file of globSync('src/**/*.css', { cwd: rootDir, absolute: true })) {
    const contents = stripCssComments(fs.readFileSync(file, 'utf-8'));
    for (const match of contents.matchAll(DEFINITION_PATTERN)) {
      defined.add(match[1]);
    }
  }

  const layoutPath = path.join(rootDir, NEXT_FONT_LAYOUT_FILE);
  if (fs.existsSync(layoutPath)) {
    const contents = fs.readFileSync(layoutPath, 'utf-8');
    for (const match of contents.matchAll(NEXT_FONT_VARIABLE_PATTERN)) {
      defined.add(match[1]);
    }
  }

  return defined;
}

describe('no undefined CSS custom properties referenced without a fallback', () => {
  const files = findSourceFiles();
  const references = findBareVarReferences(files);
  const defined = findDefinedProperties();

  it('found source files to check (sanity check on the glob)', () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it('every bare var(--name) reference has a matching --name: definition', () => {
    // Each entry carries its usage sites, so the failure output names the
    // property and the files that reference it.
    const undefinedProperties = [...references.keys()]
      .filter((name) => !defined.has(name))
      .sort()
      .map((name) => `${name} (used in: ${references.get(name)!.join(', ')})`);

    expect(undefinedProperties).toEqual([]);
  });
});
