#!/usr/bin/env node

/**
 * Internal doc link checker -- CLI (issue #1651).
 *
 * Checks every relative markdown link and in-page anchor reachable from
 * `public_docs/` and the root docs (README.md, DESIGN.md, PRODUCT.md,
 * RELEASES.md, CLAUDE.md), and fails if any target doesn't resolve.
 *
 * What it checks:
 *  - Relative link/image targets (`[text](path)`, `![alt](path)`) resolve to
 *    a file or directory on disk.
 *  - `#anchor` targets (bare, or appended to a relative path) resolve to a
 *    heading in the target markdown file, using GitHub's heading-slug rules.
 *
 * What it skips:
 *  - Absolute URLs (anything with a `scheme:` prefix, e.g. `https://`).
 *  - Fenced code blocks, since docs often show link syntax as an example
 *    rather than a real link.
 *
 * Exit codes: 0 = all links resolve, 1 = broken links found.
 * The pure logic lives in ./docs-link-checker.js (unit-tested in isolation).
 *
 * Run: npm run docs:check-links
 */

import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { glob } from 'glob';
import { findBrokenLinks, extractHeadingSlugs } from './docs-link-checker.js';

const REPO_ROOT = process.cwd();
const DOC_GLOBS = ['public_docs/**/*.md', '*.md'];

async function findDocs() {
  const files = await glob(DOC_GLOBS, {
    cwd: REPO_ROOT,
    nodir: true,
    ignore: ['node_modules/**'],
  });
  return files.sort();
}

function makeFsAdapter() {
  const slugCache = new Map();
  return {
    exists: (absPath) => existsSync(absPath),
    isMarkdownFile: (absPath) =>
      absPath.endsWith('.md') && existsSync(absPath) && statSync(absPath).isFile(),
    headingSlugs: (absPath) => {
      if (!slugCache.has(absPath)) {
        slugCache.set(absPath, extractHeadingSlugs(readFileSync(absPath, 'utf8')));
      }
      return slugCache.get(absPath);
    },
    resolve: (fromFile, relativeTarget) => path.resolve(path.dirname(fromFile), relativeTarget),
  };
}

async function main() {
  const docs = await findDocs();
  const fs = makeFsAdapter();
  let brokenCount = 0;

  for (const relPath of docs) {
    const absPath = path.join(REPO_ROOT, relPath);
    const content = readFileSync(absPath, 'utf8');
    const broken = findBrokenLinks(content, fs, absPath);
    if (broken.length === 0) continue;

    brokenCount += broken.length;
    console.error(`\n${relPath}`);
    for (const { target, reason } of broken) {
      console.error(`  broken link "${target}" -- ${reason}`);
    }
  }

  if (brokenCount > 0) {
    console.error(`\n${brokenCount} broken link(s) across ${docs.length} doc(s) checked.`);
    process.exit(1);
  }

  console.log(`docs:check-links: ${docs.length} doc(s) checked, no broken links.`);
}

main();
