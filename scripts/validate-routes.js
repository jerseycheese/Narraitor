#!/usr/bin/env node

/**
 * Route consistency validator -- CLI (issue #420).
 *
 * Scans the codebase for internal navigation targets (<Link href>,
 * router.push/replace, redirect()) and reports any that don't resolve to a real
 * Next.js App Router page or a next.config redirect source.
 *
 * Run on demand or from a pre-commit hook:  npm run validate:routes
 *
 * Exit codes: 0 = all links resolve, 1 = broken links found, 2 = runtime error.
 * The pure logic lives in ./route-validation.js (unit-tested in isolation).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { globSync } from 'glob';
import {
  appFileToRoutePattern,
  extractReferences,
  extractRedirectSources,
  findBrokenReferences,
} from './route-validation.js';

const REPO_ROOT = process.cwd();
const APP_DIR = path.join(REPO_ROOT, 'src', 'app');
const SRC_DIR = path.join(REPO_ROOT, 'src');
const NEXT_CONFIG = path.join(REPO_ROOT, 'next.config.ts');

/** Build the list of valid route patterns from src/app page files. */
function collectRoutePatterns() {
  const pageFiles = globSync('**/page.{tsx,ts,js}', {
    cwd: APP_DIR,
    nodir: true,
  });
  const patterns = new Set();
  for (const rel of pageFiles) {
    const pattern = appFileToRoutePattern(rel);
    if (pattern !== null) patterns.add(pattern);
  }
  return [...patterns];
}

/** Read redirect source strings from next.config.ts (if present). */
function collectRedirectSources() {
  if (!fs.existsSync(NEXT_CONFIG)) return [];
  const source = fs.readFileSync(NEXT_CONFIG, 'utf8');
  return extractRedirectSources(source);
}

/** Scan all source files for navigation references. */
function collectReferences() {
  const files = globSync('**/*.{ts,tsx}', {
    cwd: SRC_DIR,
    absolute: true,
    nodir: true,
    ignore: ['**/*.test.{ts,tsx}', '**/*.stories.{ts,tsx}', '**/__tests__/**'],
  });
  const references = [];
  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch {
      continue;
    }
    const rel = path.relative(REPO_ROOT, file);
    references.push(...extractReferences(content, rel));
  }
  return references;
}

function main() {
  const routePatterns = collectRoutePatterns();
  const redirectSources = collectRedirectSources();
  const references = collectReferences();

  if (routePatterns.length === 0) {
    console.error('Error: no route patterns found under src/app -- wrong working directory?');
    process.exit(2);
  }

  const broken = findBrokenReferences({ references, routePatterns, redirectSources });

  console.log(
    `Route validation: scanned ${references.length} navigation references against ` +
      `${routePatterns.length} routes (+${redirectSources.length} redirect sources).`
  );

  if (broken.length === 0) {
    console.log('All internal navigation links resolve to a known route.');
    process.exit(0);
  }

  console.error(`\nFound ${broken.length} broken navigation link(s):`);
  for (const ref of broken) {
    console.error(` - ${ref.filePath}:${ref.line}  ->  ${ref.raw}`);
  }
  console.error('\nEach target above does not match any page under src/app or a next.config redirect.');
  process.exit(1);
}

// Only run as a CLI -- stay importable without side effects.
const isMain =
  process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try {
    main();
  } catch (err) {
    console.error('Route validation failed:', err);
    process.exit(2);
  }
}
