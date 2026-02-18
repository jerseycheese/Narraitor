#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const commandForPlatform = (command) =>
  process.platform === 'win32' ? `${command}.cmd` : command;

const runOrThrow = (command, args, env = process.env) => {
  const result = spawnSync(commandForPlatform(command), args, {
    stdio: 'inherit',
    env,
  });

  if (result.status !== 0) {
    throw new Error(
      `Command failed (${command} ${args.join(' ')}), exit code: ${result.status ?? 'unknown'}`,
    );
  }
};

const runAudit = () => {
  runOrThrow('npm', ['run', 'docs:design-system:build']);

  runOrThrow(
    'npx',
    [
      'playwright',
      'test',
      'tests/visual/manuscript-breakpoints.spec.ts',
      '--project=chromium',
      '--grep',
      '@issue1065-audit',
    ],
    {
      ...process.env,
      ISSUE_1065_AUDIT: 'true',
    },
  );
};

try {
  runAudit();
  // eslint-disable-next-line no-console
  console.log('Issue #1065 manuscript alignment audit completed successfully.');
} catch (error) {
  // eslint-disable-next-line no-console
  console.error((error instanceof Error ? error.message : String(error)));
  process.exit(1);
}
