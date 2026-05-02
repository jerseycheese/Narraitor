/**
 * Playwright-based capture crawler for the cross-theme audit (#1129).
 *
 * Replaces the bdg-based bash scripts. Playwright sessions are stable across
 * long runs, so this can do the full 14-route x 3-state x 4-branch x 2-viewport
 * sweep without midway crashes.
 *
 * Usage (single batch):
 *   npx tsx scripts/audit/playwright-crawl.ts \
 *     --theme ds3 --mode light --state empty \
 *     --branch integration-ds3-light --viewport desktop
 *
 * Output: scripts/audit/captures/comp-<branch>/<viewport>/<state>/<route>__*.png
 */
import { chromium, type Browser, type Page } from '@playwright/test';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  SAMPLE_WORLDS,
  SAMPLE_CHARACTERS,
  SAMPLE_GAME_SESSIONS,
  SAMPLE_NARRATIVE_SEGMENTS,
  SAMPLE_DECISIONS,
  SAMPLE_JOURNAL_ENTRIES,
} from '../../tests/fixtures';

type State = 'empty' | 'seeded' | 'mid-session';
type Theme = 'ds3' | 'ds1' | 'ds2' | 'default';
type Mode = 'light' | 'dark';
type Viewport = 'desktop' | 'mobile';

const ROUTES: Array<[string, string]> = [
  ['home', '/'],
  ['about', '/about'],
  ['worlds', '/worlds'],
  ['worlds-detail', '/worlds/world-cyberpunk-2077'],
  ['worlds-edit', '/worlds/world-cyberpunk-2077/edit'],
  ['worlds-create', '/worlds/create'],
  ['worlds-play', '/worlds/world-cyberpunk-2077/play'],
  ['worlds-play-journal', '/worlds/world-cyberpunk-2077/play/journal'],
  ['characters', '/characters'],
  ['characters-detail', '/characters/char-cyberpunk-hacker'],
  ['characters-edit', '/characters/char-cyberpunk-hacker/edit'],
  ['characters-create', '/characters/create'],
  ['play', '/play'],
  ['settings', '/settings'],
];

const SELECTORS: Array<[string, string]> = [
  ['header', 'header'],
  ['nav', 'nav'],
  ['main', 'main'],
  ['form', 'form'],
  ['dialog', '[role="dialog"]'],
];

const VERSIONS = { world: 5, character: 3, session: 4, narrative: 1, journal: 1, npc: 2 } as const;

const PHASES_DONE = {
  intro: { completed: true, skipped: false },
  worldCreation: { completed: true, skipped: false, lastStep: 999 },
  worldGeneration: { completed: true, skipped: false, lastStep: 0 },
  characterCreation: { completed: true, skipped: false, lastStep: 5 },
  firstPlay: { completed: true, skipped: false },
};
const PHASES_EMPTY = {
  intro: { completed: false, skipped: false },
  worldCreation: { completed: false, skipped: false, lastStep: 0 },
  worldGeneration: { completed: false, skipped: false, lastStep: 0 },
  characterCreation: { completed: false, skipped: false, lastStep: 0 },
  firstPlay: { completed: false, skipped: false },
};

function byId<T extends { id: string }>(arr: readonly T[]): Record<string, T> {
  return Object.fromEntries(arr.map((x) => [x.id, x]));
}

function buildSeed(state: State): Record<string, string> {
  const isEmpty = state === 'empty';
  const isMid = state === 'mid-session';

  const worlds = isEmpty ? {} : byId(SAMPLE_WORLDS);
  const characters = isEmpty ? {} : byId(SAMPLE_CHARACTERS);
  const sessions = isEmpty ? {} : byId(SAMPLE_GAME_SESSIONS);
  const firstSession = isEmpty ? null : SAMPLE_GAME_SESSIONS[0];

  const segments = isMid ? byId(SAMPLE_NARRATIVE_SEGMENTS) : {};
  const decisions = isMid ? byId(SAMPLE_DECISIONS) : {};
  const journalEntries = isMid ? byId(SAMPLE_JOURNAL_ENTRIES) : {};

  const sessionSegments: Record<string, string[]> = {};
  const sessionDecisions: Record<string, string[]> = {};
  const sessionJournal: Record<string, string[]> = {};
  if (isMid && firstSession) {
    sessionSegments[firstSession.id] = Object.keys(segments).filter(
      (id) => (segments as Record<string, { sessionId?: string }>)[id]?.sessionId === firstSession.id,
    );
    sessionDecisions[firstSession.id] = Object.keys(decisions);
    sessionJournal[firstSession.id] = Object.keys(journalEntries);
  }

  const savedSessions = isEmpty
    ? {}
    : SAMPLE_GAME_SESSIONS.reduce<Record<string, unknown>>((acc, s) => {
        acc[s.id] = {
          id: s.id,
          worldId: s.worldId,
          characterId: s.characterId,
          lastPlayed: (s as { lastPlayedAt?: string }).lastPlayedAt ?? null,
          narrativeCount: (s as { totalTurns?: number }).totalTurns ?? 0,
        };
        return acc;
      }, {});

  return {
    'narraitor-world-store': JSON.stringify({
      state: { worlds, currentWorldId: isEmpty ? null : SAMPLE_WORLDS[0]?.id ?? null, error: null, loading: false },
      version: VERSIONS.world,
    }),
    'narraitor-character-store': JSON.stringify({
      state: {
        characters,
        currentCharacterId: isEmpty ? null : SAMPLE_CHARACTERS[0]?.id ?? null,
        error: null,
        loading: false,
      },
      version: VERSIONS.character,
    }),
    'narraitor-session-store': JSON.stringify({
      state: {
        sessions,
        currentSessionId: isMid && firstSession ? firstSession.id : null,
        id: isMid && firstSession ? firstSession.id : null,
        status: isMid ? 'active' : 'idle',
        worldId: isMid && firstSession ? firstSession.worldId : null,
        characterId: isMid && firstSession ? firstSession.characterId : null,
        savedSessions,
        tutorialProgress: {
          phases: isEmpty ? PHASES_EMPTY : PHASES_DONE,
          dismissedHints: [],
          lastActiveStep: null,
        },
        error: null,
        loading: false,
      },
      version: VERSIONS.session,
    }),
    'narraitor-narrative-store': JSON.stringify({
      state: {
        segments,
        sessionSegments,
        decisions,
        sessionDecisions,
        endedSessions: {},
        currentEnding: null,
        isGeneratingEnding: false,
        endingError: null,
        error: null,
        loading: false,
      },
      version: VERSIONS.narrative,
    }),
    'narraitor-journal-store': JSON.stringify({
      state: { entries: journalEntries, sessionEntries: sessionJournal },
      version: VERSIONS.journal,
    }),
    'narraitor-npc-store': JSON.stringify({
      state: { npcs: {}, error: null, loading: false },
      version: VERSIONS.npc,
    }),
  };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const get = (name: string, def?: string): string => {
    const i = args.indexOf(`--${name}`);
    if (i < 0) return def ?? '';
    return args[i + 1] ?? '';
  };
  const theme = (get('theme', 'default') as Theme);
  const mode = (get('mode', 'light') as Mode);
  const state = (get('state', 'seeded') as State);
  const branch = get('branch');
  const viewport = (get('viewport', 'desktop') as Viewport);
  const baseUrl = get('base-url', 'http://localhost:3000');
  const route = get('route', '');
  if (!branch) {
    console.error('Required: --branch <label>');
    process.exit(1);
  }
  if (!['empty', 'seeded', 'mid-session'].includes(state)) {
    console.error(`Invalid --state '${state}'`);
    process.exit(1);
  }
  if (route && !ROUTES.some(([slug]) => slug === route)) {
    console.error(`Unknown --route '${route}'. Known routes: ${ROUTES.map(([s]) => s).join(', ')}`);
    process.exit(1);
  }
  return { theme, mode, state, branch, viewport, baseUrl, route };
}

async function captureRoute(
  page: Page,
  routeSlug: string,
  routePath: string,
  outDir: string,
  viewport: Viewport,
  baseUrl: string,
) {
  console.log(`=== ${routeSlug} ===`);
  await page.goto(`${baseUrl}${routePath}`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  await page.waitForTimeout(1500); // let lazy widgets / fonts settle

  // Hide DevTools panel + similar visual noise
  await page.addStyleTag({
    content: `[data-testid="devtools-panel-container"],[data-testid^="devtools-panel-"]{display:none !important;}`,
  });

  const pagePath = join(outDir, `${routeSlug}__page.png`);
  await page.screenshot({ path: pagePath, fullPage: true });

  if (viewport === 'mobile') {
    // Mobile uses full-page only — selector captures are unreliable on narrow viewports
    return;
  }

  for (const [name, selector] of SELECTORS) {
    const elements = await page.locator(selector).all();
    if (elements.length === 0) continue;
    try {
      const out = join(outDir, `${routeSlug}__${name}.png`);
      await elements[0].screenshot({ path: out, timeout: 5000 });
      console.log(`  ${name} -> captured`);
    } catch {
      // Element not visible / not screenshot-able — skip
    }
  }

  // main > * children. Indices 0 and 1 are reliably page wrappers (header
  // shells, container divs); skip them so triage isn't drowning in noise.
  const mainChildren = await page.locator('main > *').all();
  for (let i = 0; i < Math.min(mainChildren.length, 8); i++) {
    if (i < 2) continue;
    try {
      const out = join(outDir, `${routeSlug}__main-section-${i}.png`);
      await mainChildren[i].screenshot({ path: out, timeout: 5000 });
    } catch {
      break;
    }
  }
}

async function injectSeed(page: Page, seed: Record<string, string>) {
  await page.evaluate(async (seedJson: string) => {
    const data = JSON.parse(seedJson) as Record<string, string>;
    for (const [k, v] of Object.entries(data)) localStorage.setItem(k, v);
    await new Promise<void>((resolve) => {
      const req = indexedDB.open('narraitor-state', 1);
      req.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('narraitor-store')) {
          db.createObjectStore('narraitor-store');
        }
      };
      req.onsuccess = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        const tx = db.transaction(['narraitor-store'], 'readwrite');
        const store = tx.objectStore('narraitor-store');
        for (const [k, v] of Object.entries(data)) {
          store.put({ id: k, value: JSON.parse(v) }, k);
        }
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      };
      req.onerror = () => resolve();
    });
  }, JSON.stringify(seed));
}

async function main() {
  const { theme, mode, state, branch, viewport, baseUrl, route } = parseArgs();

  const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
  const outDir = join(
    repoRoot,
    'scripts',
    'audit',
    'captures',
    `comp-${branch}`,
    viewport,
    state,
  );
  // Clean before each run so stale files from a previous tool/viewport/state
  // don't contaminate the directory. When --route is set, only delete that
  // route's files so the rest of the cell's captures aren't wiped.
  if (route) {
    await mkdir(outDir, { recursive: true });
    if (existsSync(outDir)) {
      const { readdir, unlink } = await import('node:fs/promises');
      const files = await readdir(outDir);
      for (const f of files) {
        if (f.startsWith(`${route}__`) && f.endsWith('.png')) {
          await unlink(join(outDir, f));
        }
      }
    }
  } else {
    if (existsSync(outDir)) {
      await rm(outDir, { recursive: true, force: true });
    }
    await mkdir(outDir, { recursive: true });
  }

  const seed = buildSeed(state);

  const browser: Browser = await chromium.launch({ headless: true });
  // NOTE: not setting isMobile — it forces deviceScaleFactor to 2 and creates
  // retina captures with empty right-half. We only need the viewport size for
  // layout audit purposes.
  const ctx = await browser.newContext({
    viewport:
      viewport === 'mobile'
        ? { width: 390, height: 844 }
        : { width: 1320, height: 900 },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();

  // Prime origin so localStorage + IDB injects are accepted
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });

  // Set theme + scheme on integration branches
  if (theme !== 'default') {
    await page.evaluate(
      ({ t, m }: { t: string; m: string }) => {
        localStorage.setItem('narraitor-theme', t);
        localStorage.setItem('narraitor-color-scheme', m);
      },
      { t: theme, m: mode },
    );
  }

  await injectSeed(page, seed);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  const routesToRun = route ? ROUTES.filter(([slug]) => slug === route) : ROUTES;

  console.log(`Output:   ${outDir}`);
  console.log(`Viewport: ${viewport}  Theme: ${theme}/${mode}  State: ${state}  Branch: ${branch}`);
  console.log(`Total routes: ${routesToRun.length}${route ? ` (filtered to '${route}')` : ''}`);

  for (const [slug, path] of routesToRun) {
    try {
      await captureRoute(page, slug, path, outDir, viewport, baseUrl);
    } catch (err) {
      console.error(`  ERROR on ${slug}: ${(err as Error).message}`);
    }
  }

  await browser.close();
  console.log('done');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
