#!/usr/bin/env node

// Enforce that <PageLayout /> is not used as a self-closing tag.
// This helps avoid SSR issues and adheres to PageLayout's required children prop.

const fs = require('fs');
const path = require('path');
const glob = require('glob');

const SRC_DIR = path.join(process.cwd(), 'src');
const pattern = '**/*.{ts,tsx}';

const files = glob.sync(pattern, { cwd: SRC_DIR, absolute: true, nodir: true });
const offending = [];

const re = /<\s*PageLayout\s*\/>/g;

for (const file of files) {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (re.test(content)) {
      offending.push(path.relative(process.cwd(), file));
    }
  } catch {
    // ignore read errors
  }
}

if (offending.length > 0) {
  console.error('Error: self-closing <PageLayout /> detected in:');
  for (const f of offending) console.error(' -', f);
  console.error('Use <PageLayout>...</PageLayout> instead.');
  process.exit(1);
} else {
  console.log('PageLayout usage OK');
}

