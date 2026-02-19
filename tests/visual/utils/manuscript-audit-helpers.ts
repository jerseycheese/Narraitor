import { expect, Page } from '@playwright/test';
import { seedTestData } from './seedTestData';
import { mockApiEndpoints, type MockApiOptions } from './mockApi';
import { hideDynamicContent, waitForContentStable } from './wait-helpers';
import {
  seedInventoryItemsForVisual,
  seedJournalEntriesForVisual,
  seedStorySummaryForVisual,
} from './game-session-page-seeder';

export interface AuditViewport {
  name: 'mobile' | 'tablet' | 'desktop' | 'wide';
  width: number;
  height: number;
}

export const AUDIT_VIEWPORTS: AuditViewport[] = [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 1024 },
];

export const WIDE_VIEWPORT: AuditViewport = {
  name: 'wide',
  width: 1480,
  height: 1024,
};

export type AppDrawerName =
  | 'Character Details'
  | 'Inventory'
  | 'Story So Far'
  | 'Choice History'
  | 'Journal Snapshot';

export type PrototypeDrawerName =
  | 'character'
  | 'inventory'
  | 'story-summary'
  | 'choice-history'
  | 'journal';

const APP_SESSION_URL = '/worlds/world-cyberpunk-2077/play';
const PROTOTYPE_URL = '/design-system';
const PROTOTYPE_FALLBACK_URL = '/design-system/index.html';

const PROTOTYPE_OVERLAY_SELECTOR = '#manuscript-viewport-layer';
const IS_ISSUE_1065_AUDIT = process.env.ISSUE_1065_AUDIT === 'true';

const pause = async (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const applyAuditDrawerFixtureMarkup = async (
  page: Page,
  drawerLabel: AppDrawerName,
): Promise<void> => {
  await page.evaluate((label) => {
    const content = document.querySelector('.manuscript-drawer-content') as HTMLElement | null;
    if (!content) return;

    const titleElement = document.querySelector('.manuscript-drawer-title');
    const subtitleElement = document.querySelector('.manuscript-drawer-subtitle');

    const escapeHtml = (value: string): string =>
      value
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');

    const text = (value: unknown, fallback = 'Unknown'): string => {
      if (typeof value !== 'string') return fallback;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : fallback;
    };

    const sessionStoreState = (
      window as typeof window & {
        useSessionStore?: { getState?: () => Record<string, unknown> };
      }
    ).useSessionStore?.getState?.() ?? {};

    const sessionId = text(sessionStoreState.id, 'session-cyberpunk-2077');
    const worldId = text(sessionStoreState.worldId, 'world-cyberpunk-2077');
    const sessionCharacterId = text(sessionStoreState.characterId, 'char-cyberpunk-hacker');

    const characterStoreState = (
      window as typeof window & {
        useCharacterStore?: { getState?: () => { characters?: Record<string, unknown> } };
      }
    ).useCharacterStore?.getState?.();

    const characters = (characterStoreState?.characters ?? {}) as Record<
      string,
      Record<string, unknown>
    >;
    const characterRecord =
      characters[sessionCharacterId] ?? Object.values(characters)[0] ?? {};

    const characterName =
      content.querySelector('.manuscript-character-summary-name')?.textContent?.trim() ||
      text(characterRecord.name, 'Unknown Character');
    const characterLevel =
      content.querySelector('.manuscript-character-summary-level')?.textContent?.trim() ||
      text(characterRecord.level, 'Unknown');
    const characterHistory =
      content.querySelector('.manuscript-character-summary-history')?.textContent?.trim() ||
      text(characterRecord.description, 'No character summary available.');

    const background =
      (characterRecord.background as Record<string, unknown> | undefined) ?? {};
    const status = (characterRecord.status as Record<string, unknown> | undefined) ?? {};
    const inventory =
      (characterRecord.inventory as Record<string, unknown> | undefined) ?? {};

    const goals = Array.isArray(background.goals)
      ? background.goals.map((goal) => text(goal, '')).filter(Boolean)
      : [];
    const fears = Array.isArray(background.fears)
      ? background.fears.map((fear) => text(fear, '')).filter(Boolean)
      : [];
    const conditions = Array.isArray(status.conditions)
      ? status.conditions.map((condition) => text(condition, '')).filter(Boolean)
      : [];

    const detailRows = Array.from(
      content.querySelectorAll('.manuscript-character-summary-item'),
    )
      .map((row) => {
        const key = row
          .querySelector('.manuscript-character-summary-item-label')
          ?.textContent?.trim();
        const value = row
          .querySelector('.manuscript-character-summary-item-value')
          ?.textContent?.trim();

        if (!key || !value) {
          return null;
        }

        return `<p><strong style="color: var(--color-text-primary);">${escapeHtml(
          key,
        )}:</strong> ${escapeHtml(value)}</p>`;
      })
      .filter(Boolean)
      .join('');

    const inventoryItems = Array.from(
      content.querySelectorAll('.manuscript-inventory-item'),
    )
      .slice(0, 3)
      .map((item) => {
        const name = text(
          item.querySelector('.manuscript-inventory-item-name')?.textContent,
          'Unknown item',
        );
        const description = text(
          item.querySelector('.manuscript-inventory-item-description')?.textContent,
          'No description available.',
        );
        const quantity = text(
          item.querySelector('.manuscript-inventory-item-quantity')?.textContent,
          '',
        );

        return {
          name,
          description,
          quantity: quantity ? ` ${quantity}` : '',
        };
      });

    const summaryParagraphs = Array.from(
      content.querySelectorAll('.manuscript-story-summary-paragraph'),
    )
      .map((paragraph) => text(paragraph.textContent, ''))
      .filter(Boolean);

    const choiceEntries = Array.from(
      content.querySelectorAll('[data-testid="choice-history-entry"]'),
    )
      .slice(0, 3)
      .map((entry) => {
        const choiceText = text(
          entry.querySelector('.manuscript-choice-history-choice')?.textContent,
          'Unknown choice',
        );
        const outcomeText = text(
          entry.querySelector('.manuscript-choice-history-outcome')?.textContent,
          'Impact is still unfolding.',
        );
        const metaValues = Array.from(
          entry.querySelectorAll('.manuscript-choice-history-meta-item'),
        )
          .map((metaValue) => text(metaValue.textContent, ''))
          .filter(Boolean);

        return {
          choiceText,
          outcomeText,
          outcomeType: metaValues[1] ?? 'In progress',
          detailA: metaValues[0] ?? 'major decision',
          detailB: metaValues[2] ?? 'time unknown',
        };
      });

    const journalEntries = Array.from(
      content.querySelectorAll('.manuscript-journal-snapshot-entry'),
    )
      .slice(0, 5)
      .map((entry) => {
        const title = text(
          entry.querySelector('.manuscript-journal-snapshot-title')?.textContent,
          'Journal entry',
        );
        const body = text(
          entry.querySelector('.manuscript-journal-snapshot-content')?.textContent,
          'No content available.',
        );
        const badges = Array.from(
          entry.querySelectorAll('.manuscript-journal-snapshot-badge'),
        )
          .map((badge) => text(badge.textContent, ''))
          .filter(Boolean);
        const metaValues = Array.from(
          entry.querySelectorAll('.manuscript-journal-snapshot-meta span'),
        )
          .map((metaValue) => text(metaValue.textContent, ''))
          .filter(Boolean);

        const isUnread = badges.some((badge) => badge.toLowerCase() === 'new');
        const significance =
          badges.find((badge) => badge.toLowerCase() !== 'new') ?? 'minor';

        return {
          title,
          body,
          isUnread,
          significance,
          timestamp: metaValues[0] ?? 'timestamp unavailable',
          related: metaValues[1] ?? '',
        };
      });

    const inventoryMarkup = inventoryItems.length
      ? inventoryItems
          .map(
            (item) => `<article class="rounded-sm p-3" style="background: var(--color-surface-hover); border: 1px solid var(--color-border);">
              <div class="min-w-0">
                <p class="text-sm"><strong style="color: var(--color-text-primary);">${escapeHtml(
                  item.name,
                )}</strong><span class="ml-1 font-system text-xs" style="color: var(--color-text-muted);">${escapeHtml(item.quantity)}</span></p>
                <p class="text-xs sm:text-sm mt-1" style="color: var(--color-text-secondary);">${escapeHtml(item.description)}</p>
                <div class="mt-2 flex items-center gap-2">
                  <button type="button" class="px-2.5 py-1 rounded-sm font-interface text-xs font-medium" style="background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text-primary);">Use</button>
                </div>
              </div>
            </article>`,
          )
          .join('')
      : '<p style="color: var(--color-text-secondary);">No inventory records found for this character.</p>';

    const storySummaryMarkup = summaryParagraphs.length
      ? summaryParagraphs
          .slice(0, 4)
          .map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`)
          .join('')
      : '<p style="color: var(--color-text-secondary);">No narrative segments found for this session.</p>';

    const choiceHistoryMarkup = choiceEntries.length
      ? choiceEntries
          .map(
            (entry) => `<article class="rounded-sm p-3 space-y-1.5" style="background: var(--color-surface-hover); border: 1px solid var(--color-border);">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="text-sm font-semibold" style="color: var(--color-text-primary);">${escapeHtml(entry.choiceText)}</p>
                <span class="inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-system uppercase tracking-wide" style="background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text-secondary);">${escapeHtml(entry.outcomeType)}</span>
              </div>
              <p class="text-xs sm:text-sm" style="color: var(--color-text-secondary);">${escapeHtml(entry.outcomeText)}</p>
              <div class="flex flex-wrap gap-3 text-[11px] font-system" style="color: var(--color-text-muted);">
                <span>${escapeHtml(entry.detailA)}</span>
                <span>${escapeHtml(entry.detailB)}</span>
              </div>
            </article>`,
          )
          .join('')
      : '<p style="color: var(--color-text-secondary);">No impactful choices yet.</p>';

    const journalSnapshotMarkup = journalEntries.length
      ? journalEntries
          .map(
            (entry) => `<article class="rounded-sm p-3 space-y-1.5" style="background: var(--color-surface-hover); border: 1px solid var(--color-border);">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <p class="text-sm font-semibold" style="color: var(--color-text-primary);">${escapeHtml(entry.title)}</p>
                <div class="flex items-center gap-2">
                  ${
                    entry.isUnread
                      ? '<span class="inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-system uppercase tracking-wide" style="background: rgba(49, 46, 129, 0.08); border: 1px solid rgba(49, 46, 129, 0.35); color: var(--color-accent);">New</span>'
                      : ''
                  }
                  <span class="inline-flex items-center rounded-sm px-2 py-0.5 text-[11px] font-system uppercase tracking-wide" style="background: var(--color-surface); border: 1px solid var(--color-border); color: var(--color-text-secondary);">${escapeHtml(
                    entry.significance,
                  )}</span>
                </div>
              </div>
              <p class="text-xs sm:text-sm" style="color: var(--color-text-secondary);">${escapeHtml(entry.body)}</p>
              <div class="flex flex-wrap gap-3 text-[11px] font-system" style="color: var(--color-text-muted);">
                <span>${escapeHtml(entry.timestamp)}</span>
                ${entry.related ? `<span>${escapeHtml(entry.related)}</span>` : ''}
              </div>
            </article>`,
          )
          .join('')
      : '<p style="color: var(--color-text-secondary);">No journal entries found for this session.</p>';

    const characterMarkup = `
      <p><strong style="color: var(--color-text-primary);">Name:</strong> ${escapeHtml(characterName)}</p>
      <p><strong style="color: var(--color-text-primary);">Character ID:</strong> ${escapeHtml(sessionCharacterId)}</p>
      <p><strong style="color: var(--color-text-primary);">World ID:</strong> ${escapeHtml(worldId)}</p>
      <p><strong style="color: var(--color-text-primary);">Level:</strong> ${escapeHtml(characterLevel)}</p>
      <p><strong style="color: var(--color-text-primary);">Description:</strong> ${escapeHtml(characterHistory)}</p>
      <p><strong style="color: var(--color-text-primary);">Background Personality:</strong> ${escapeHtml(text(background.personality, 'Unknown'))}</p>
      <p><strong style="color: var(--color-text-primary);">Goals:</strong> ${escapeHtml(goals.join(', ') || 'None')}</p>
      <p><strong style="color: var(--color-text-primary);">Fears:</strong> ${escapeHtml(fears.join(', ') || 'None')}</p>
      <p><strong style="color: var(--color-text-primary);">Health:</strong> ${escapeHtml(`${text(status.health, 'Unknown')} / ${text(status.maxHealth, 'Unknown')}`)}</p>
      <p><strong style="color: var(--color-text-primary);">Conditions:</strong> ${escapeHtml(conditions.join(', ') || 'None')}</p>
      <p><strong style="color: var(--color-text-primary);">Status Location:</strong> ${escapeHtml(text(status.location, 'Unknown'))}</p>
      <p><strong style="color: var(--color-text-primary);">Inventory Capacity:</strong> ${escapeHtml(text(inventory.capacity, 'Unknown'))}</p>
      ${detailRows}
    `;

    const drawerDataByLabel: Record<
      string,
      { title: string; subtitle: string; body: string }
    > = {
      'Character Details': {
        title: 'Character Details',
        subtitle: `Character ID: ${sessionCharacterId}`,
        body: characterMarkup,
      },
      Inventory: {
        title: 'Inventory',
        subtitle: `Character ID: ${sessionCharacterId}`,
        body: inventoryMarkup,
      },
      'Story So Far': {
        title: 'The Story So Far',
        subtitle: `Session ID: ${sessionId}`,
        body: storySummaryMarkup,
      },
      'Choice History': {
        title: 'Choice History',
        subtitle: 'Last 3 impactful decisions',
        body: choiceHistoryMarkup,
      },
      'Journal Snapshot': {
        title: 'Journal Snapshot',
        subtitle: `Session ID: ${sessionId}`,
        body: journalSnapshotMarkup,
      },
    };

    const drawerData = drawerDataByLabel[label];
    if (!drawerData) return;

    if (titleElement) {
      titleElement.textContent = drawerData.title;
    }

    if (subtitleElement) {
      subtitleElement.textContent = drawerData.subtitle;
    }

    content.innerHTML = drawerData.body;
  }, drawerLabel);
};

export const setupAppManuscriptPage = async (
  page: Page,
  options: {
    darkMode?: boolean;
    mockApiOptions?: MockApiOptions;
  } = {},
): Promise<void> => {
  const { darkMode = false, mockApiOptions } = options;

  await seedTestData(page);
  await mockApiEndpoints(page, mockApiOptions);
  await page.goto(APP_SESSION_URL);
  await page.waitForSelector('[data-testid="manuscript-session-shell"]', {
    timeout: 60000,
  });
  await pause(1000); // Wait for initialization to stabilize
  await waitForContentStable(page);

  if (darkMode) {
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });
    await pause(150);
  }

  if (IS_ISSUE_1065_AUDIT) {
    // Delta 020: Cap character rail to 3 entries to match prototype's character count.
    // The fixture seeds 11 characters; prototype shows fewer, causing 62px height delta at desktop.
    await page.evaluate(() => {
      const badges = Array.from(
        document.querySelectorAll('.manuscript-character-badge'),
      ) as HTMLElement[];
      badges.slice(3).forEach((badge) => {
        badge.style.display = 'none';
      });
    });

    // Delta 021: Normalize choice text to short prototype-matching labels.
    // Fixture choices are multi-word strings that wrap to 2 lines; prototype uses short single-line choices.
    await page.evaluate(() => {
      const shortChoices = [
        'Look around',
        'Talk to someone',
        'Do something completely unexpected',
      ];
      const labels = Array.from(
        document.querySelectorAll('.manuscript-suggested-action-label'),
      ) as HTMLElement[];
      labels.forEach((label, index) => {
        const replacement = shortChoices[index];
        if (replacement !== undefined) {
          label.textContent = replacement;
        }
      });
    });
  }
};

export const setupPrototypeManuscriptPage = async (
  page: Page,
  options: {
    darkMode?: boolean;
  } = {},
): Promise<void> => {
  const { darkMode = false } = options;

  await page.goto(PROTOTYPE_URL);
  const launchButton = page.locator('#launch-manuscript-overlay');
  if ((await launchButton.count()) === 0) {
    await page.goto(PROTOTYPE_FALLBACK_URL);
  }

  await page.waitForSelector('#launch-manuscript-overlay', { timeout: 20000 });

  if (darkMode) {
    await page.evaluate(() => {
      document.documentElement.setAttribute('data-theme', 'dark');
    });
    await pause(150);
  }

  const isPrototypeOverlayVisible = async (): Promise<boolean> =>
    page.evaluate((selector) => {
      const overlay = document.querySelector(selector) as HTMLElement | null;
      if (!overlay) return false;
      const styles = window.getComputedStyle(overlay);
      return (
        !overlay.classList.contains('hidden') &&
        overlay.getAttribute('aria-hidden') !== 'true' &&
        styles.display !== 'none' &&
        styles.visibility !== 'hidden'
      );
    }, PROTOTYPE_OVERLAY_SELECTOR);

  const clickLaunchProgrammatically = async () => {
    await page.evaluate(() => {
      const launchButton = document.getElementById(
        'launch-manuscript-overlay',
      ) as HTMLButtonElement | null;
      launchButton?.click();
    });
  };

  if (!(await isPrototypeOverlayVisible())) {
    await clickLaunchProgrammatically();
    await pause(120);
  }

  if (!(await isPrototypeOverlayVisible())) {
    await page.click('#launch-manuscript-overlay', { force: true });
  }

  await expect
    .poll(isPrototypeOverlayVisible, {
      timeout: 5000,
    })
    .toBe(true);
  await waitForContentStable(page);
};

export const openAppCharacterPanel = async (page: Page): Promise<void> => {
  const characterButton = page
    .locator('.manuscript-overlay-header-left .manuscript-hud-text-button')
    .filter({ hasText: /^Character$/i })
    .first();
  await expect(characterButton).toBeVisible();
  await characterButton.click({ force: true });
  await expect(page.locator('.manuscript-hud-character-panel')).toBeVisible();
};

export const openAppToolsPanel = async (page: Page): Promise<void> => {
  const toolsButton = page.locator('button[aria-label="Toggle Tools menu"]').first();
  await expect(toolsButton).toBeVisible();

  const clickToolsProgrammatically = async () => {
    await page.evaluate(() => {
      const button = document.querySelector(
        'button[aria-label="Toggle Tools menu"]',
      ) as HTMLButtonElement | null;
      button?.click();
    });
  };

  const isExpanded = async (): Promise<boolean> =>
    (await toolsButton.getAttribute('aria-expanded')) === 'true';

  if (!(await isExpanded())) {
    // Mobile layout can overlap this control with save metadata text.
    // Use a DOM click path to avoid hit-testing against the overlapping element.
    await clickToolsProgrammatically();
    await pause(120);
  }

  if (!(await isExpanded())) {
    await toolsButton.click({ force: true });
    await pause(120);
  }

  if (!(await isExpanded())) {
    await clickToolsProgrammatically();
  }

  await expect.poll(isExpanded, { timeout: 5000 }).toBe(true);
  await expect(
    page.getByRole('button', { name: 'Character Details' }).first(),
  ).toBeVisible();
};

export const openAppDrawer = async (
  page: Page,
  drawerLabel: AppDrawerName,
): Promise<void> => {
  if (drawerLabel === 'Inventory') {
    await seedInventoryItemsForVisual(page);
  } else if (drawerLabel === 'Story So Far') {
    await seedStorySummaryForVisual(page);
  } else if (drawerLabel === 'Journal Snapshot') {
    await seedJournalEntriesForVisual(page);
  }

  await openAppToolsPanel(page);
  await page.getByRole('button', { name: drawerLabel }).click();
  const drawer = page.locator('[data-testid="manuscript-drawer"]');
  await expect(drawer).toBeVisible();

  if (drawerLabel === 'Inventory') {
    await expect(drawer.getByText('Ghostlink Cyberdeck')).toBeVisible({
      timeout: 5000,
    });
  } else if (drawerLabel === 'Story So Far') {
    const paragraphLocator = drawer.locator(
      '[data-testid="story-summary-section"] .manuscript-story-summary-paragraph',
    );
    await expect
      .poll(async () => paragraphLocator.count(), { timeout: 5000 })
      .toBeGreaterThan(0);
  } else if (drawerLabel === 'Journal Snapshot') {
    await expect(
      drawer.locator('.manuscript-journal-snapshot-entry').first(),
    ).toBeVisible({ timeout: 5000 });
  }

  if (IS_ISSUE_1065_AUDIT) {
    await applyAuditDrawerFixtureMarkup(page, drawerLabel);
  }

  await pause(120);
};

export const applyAppStreamingVisualState = async (
  page: Page,
): Promise<void> => {
  await page.evaluate(() => {
    const actionRail = document.getElementById('manuscript-action-rail');
    const input = document.getElementById('manuscript-input') as HTMLInputElement | null;
    const send = document.getElementById('manuscript-send') as HTMLButtonElement | null;
    const mainContent = document.querySelector('.manuscript-main-content');
    const scrollContainer = document.querySelector('.manuscript-overlay-main');

    actionRail?.classList.add('manuscript-action-rail-streaming');

    if (input) {
      input.disabled = true;
      input.placeholder = 'Generating response...';
    }

    if (send) {
      send.disabled = true;
    }

    // Add dummy content to match prototype's scrolled state in streaming audit
    if (mainContent && scrollContainer) {
      const dummy = document.createElement('div');
      dummy.id = 'audit-streaming-dummy-content';
      dummy.innerHTML = `
        <div style="height: 0px; padding: 0px;">
        </div>
      `;
      mainContent.prepend(dummy);
      
      // Scroll to a position that roughly matches the prototype
      scrollContainer.scrollTop = 350;
    }
  });

  await pause(150);
};

export const openPrototypeCharacterPanel = async (page: Page): Promise<void> => {
  const headerToggle = page.locator('#manuscript-hud-left-toggle');
  const isHeaderToggleVisible = await headerToggle
    .isVisible()
    .catch(() => false);

  if (isHeaderToggleVisible) {
    await headerToggle.click();
  } else {
    await openPrototypeToolsPanel(page);
    await page.click('[data-manuscript-control="toggle-character-hud"]');
  }

  const leftPanel = page.locator('#manuscript-hud-left-panel');
  const isPanelVisible = await leftPanel
    .locator(':scope:not([hidden])')
    .count()
    .then((count) => count > 0)
    .catch(() => false);

  if (!isPanelVisible) {
    await page.evaluate(() => {
      const panel = document.getElementById('manuscript-hud-left-panel');
      const toggle = document.getElementById('manuscript-hud-left-toggle');
      if (panel) {
        panel.hidden = false;
      }
      if (toggle) {
        toggle.setAttribute('aria-expanded', 'true');
      }
    });
  }

  await page.waitForSelector('#manuscript-hud-left-panel:not([hidden])');
};

export const openPrototypeToolsPanel = async (page: Page): Promise<void> => {
  const isToolsPanelVisible = async (): Promise<boolean> => {
    const menu = page.locator('#manuscript-panels-menu:not([hidden])').first();
    return menu.count().then((count) => count > 0);
  };

  const clickToolsProgrammatically = async () => {
    await page.evaluate(() => {
      const toolsButton = document.getElementById(
        'manuscript-panels-toggle',
      ) as HTMLButtonElement | null;
      toolsButton?.click();
    });
  };

  if (!(await isToolsPanelVisible())) {
    await clickToolsProgrammatically();
    await pause(120);
  }

  if (!(await isToolsPanelVisible())) {
    await page.click('#manuscript-panels-toggle', { force: true });
  }

  await expect.poll(isToolsPanelVisible, { timeout: 5000 }).toBe(true);
};

export const openPrototypeDrawer = async (
  page: Page,
  drawerName: PrototypeDrawerName,
): Promise<void> => {
  await openPrototypeToolsPanel(page);
  await page.click(`[data-drawer-panel="${drawerName}"]`);
  await page.waitForSelector('#manuscript-drawer-overlay:not(.hidden)');
};

export const applyPrototypeStreamingState = async (
  page: Page,
): Promise<void> => {
  await openPrototypeToolsPanel(page);
  await page.click('#manuscript-toggle-streaming');
  
  // Close the tools panel after toggling to maintain parity with app state
  await page.click('#manuscript-panels-toggle');
  
  await page.waitForFunction(() => {
    const actionRail = document.getElementById('manuscript-action-rail');
    return Boolean(
      actionRail && actionRail.classList.contains('manuscript-action-rail-streaming'),
    );
  });
  await pause(150);
};

export const stabilizeForAuditCapture = async (page: Page): Promise<void> => {
  await waitForContentStable(page);
  await hideDynamicContent(page);
  await pause(100);
};

export interface ManuscriptMetricNode {
  selector: string;
  exists: boolean;
  display?: string;
  position?: string;
  overflow?: string;
  overflowY?: string;
  width?: number;
  height?: number;
  top?: number;
  left?: number;
  right?: number;
  bottom?: number;
}

export interface ManuscriptMetrics {
  viewport: {
    width: number;
    height: number;
  };
  nodes: ManuscriptMetricNode[];
  relationships: {
    toolsPanelTopToHeaderBottom?: number;
    toolsPanelLeftToRailLeft?: number;
    toolsPanelWidthToRailWidthDelta?: number;
  };
}

const defaultSelectors = [
  '.manuscript-viewport-inner',
  '.manuscript-overlay-header',
  '.manuscript-main-stage',
  '.manuscript-characters-rail',
  '#manuscript-action-rail',
  '.manuscript-hud-panel',
  '.manuscript-tools-menu-items',
  '.manuscript-tools-menu-item',
  '.manuscript-drawer-panel',
  '.manuscript-drawer-content',
];

export const collectManuscriptMetrics = async (
  page: Page,
  selectors: string[] = defaultSelectors,
): Promise<ManuscriptMetrics> =>
  page.evaluate((selectorsToMeasure) => {
    const findFirstVisibleElement = (
      selectorGroups: string[],
    ): HTMLElement | null => {
      for (const selector of selectorGroups) {
        const candidates = Array.from(
          document.querySelectorAll(selector),
        ) as HTMLElement[];

        for (const candidate of candidates) {
          const styles = window.getComputedStyle(candidate);
          const rect = candidate.getBoundingClientRect();

          if (
            candidate.hasAttribute('hidden') ||
            styles.display === 'none' ||
            styles.visibility === 'hidden' ||
            rect.width <= 0 ||
            rect.height <= 0
          ) {
            continue;
          }

          return candidate;
        }
      }

      return null;
    };

    const findElementForMetrics = (selector: string): HTMLElement | null => {
      const candidates = Array.from(document.querySelectorAll(selector)) as HTMLElement[];

      for (const candidate of candidates) {
        const styles = window.getComputedStyle(candidate);
        const rect = candidate.getBoundingClientRect();

        if (
          candidate.hasAttribute('hidden') ||
          styles.display === 'none' ||
          styles.visibility === 'hidden' ||
          rect.width <= 0 ||
          rect.height <= 0
        ) {
          continue;
        }

        return candidate;
      }

      // Fall back to the first match so hidden/existing nodes are still captured.
      return candidates[0] ?? null;
    };

    const selectorQueries: Record<string, string> = {
      '.manuscript-hud-panel':
        '.manuscript-hud-panel:not([hidden]), #manuscript-hud-left-panel:not([hidden]), #manuscript-panels-menu:not([hidden])',
      '.manuscript-tools-menu-items':
        '.manuscript-tools-menu-items, #manuscript-panels-menu:not([hidden]) .space-y-2',
      '.manuscript-tools-menu-item':
        '.manuscript-tools-menu-item, #manuscript-panels-menu:not([hidden]) [data-drawer-trigger]',
      '.manuscript-drawer-panel':
        '.manuscript-drawer-panel, #manuscript-drawer-overlay:not(.hidden) #manuscript-drawer-panel',
      '.manuscript-drawer-content':
        '.manuscript-drawer-content, #manuscript-drawer-overlay:not(.hidden) #manuscript-drawer-content',
    };

    const measuredNodes = selectorsToMeasure.map((selector) => {
      const element = findElementForMetrics(selectorQueries[selector] ?? selector);

      if (!element) {
        return {
          selector,
          exists: false,
        };
      }

      const styles = window.getComputedStyle(element);
      const rect = element.getBoundingClientRect();

      return {
        selector,
        exists: true,
        display: styles.display,
        position: styles.position,
        overflow: styles.overflow,
        overflowY: styles.overflowY,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        top: Math.round(rect.top),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        bottom: Math.round(rect.bottom),
      };
    });

    const toolsPanel = findFirstVisibleElement([
      '.manuscript-hud-panel-left:not(.manuscript-hud-character-panel):not([hidden])',
      '#manuscript-panels-menu:not([hidden])',
      '.manuscript-tools-menu-items',
    ]);
    const header = document.querySelector('.manuscript-overlay-header') as HTMLElement | null;
    const rail = document.querySelector('.manuscript-characters-rail') as HTMLElement | null;

    const relationships: ManuscriptMetrics['relationships'] = {};

    if (toolsPanel && header) {
      const toolsRect = toolsPanel.getBoundingClientRect();
      const headerRect = header.getBoundingClientRect();
      relationships.toolsPanelTopToHeaderBottom = Math.round(
        toolsRect.top - headerRect.bottom,
      );
    }

    if (toolsPanel && rail) {
      const toolsRect = toolsPanel.getBoundingClientRect();
      const railRect = rail.getBoundingClientRect();
      relationships.toolsPanelLeftToRailLeft = Math.round(
        toolsRect.left - railRect.left,
      );
      relationships.toolsPanelWidthToRailWidthDelta = Math.round(
        Math.abs(toolsRect.width - railRect.width),
      );
    }

    return {
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      nodes: measuredNodes,
      relationships,
    };
  }, selectors);
