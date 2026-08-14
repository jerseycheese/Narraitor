import { test } from '@playwright/test';

// Automatically log page console errors and page errors during visual tests
test.beforeEach(async ({ page }, testInfo) => {
  const testName = testInfo.titlePath.join(' > ');

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      // Best-effort location (Playwright only provides it for some messages)
      const loc = msg.location();
      const location = loc?.url ? `${loc.url}:${loc.lineNumber || 0}:${loc.columnNumber || 0}` : 'unknown';
      // Log to stdout so CI captures it
      console.error(`PW[console.error] ${testName} @ ${page.url()} :: ${location}\n${msg.text()}`);
    }
  });

  page.on('pageerror', (error) => {
    console.error(`PW[pageerror] ${testName} @ ${page.url()}\n${error?.stack || error?.message || String(error)}`);
  });
});

