/**
 * @jest-environment node
 */

import fs from 'node:fs';
import path from 'node:path';

const worldSpecPaths = [
  '.claude/skills/narraitor-playtest-loop/worlds/camp-crystal-lake.md',
  '.claude/skills/narraitor-playtest-loop/worlds/harrowgate-mills.md',
];

describe('playtest world specs', () => {
  it.each(worldSpecPaths)('%s does not reference the removed template step', (relPath) => {
    const content = fs.readFileSync(path.join(process.cwd(), relPath), 'utf8');

    expect(content).not.toMatch(/^\s*-\s*Template step\b/im);
    expect(content).not.toMatch(/\bStart from scratch\b/);
  });
});
