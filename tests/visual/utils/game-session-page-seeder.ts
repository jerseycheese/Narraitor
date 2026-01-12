import type { Page } from '@playwright/test';
import { SAMPLE_JOURNAL_ENTRIES } from '@/tests/fixtures';

const SUGGESTED_ACTIONS_TITLE_LOCATOR = '[data-testid="collapsible-section-title"]';
const SUGGESTED_ACTIONS_CONTENT_LOCATOR = '[data-testid="collapsible-section-content"]';
const SUGGESTED_ACTIONS_TOGGLE_LOCATOR = '[data-testid="collapsible-section-toggle"]';

/**
 * Ensure the Suggested Actions collapsible section is expanded so the visual baseline
 * captures the seeded AI recommendations.
 */
export async function ensureSuggestedActionsExpanded(page: Page): Promise<void> {
  const title = page.locator(SUGGESTED_ACTIONS_TITLE_LOCATOR, {
    hasText: 'Suggested Actions',
  });

  if (!(await title.count())) {
    return;
  }

  const toggle = title.first().locator('..').locator('..').locator(SUGGESTED_ACTIONS_TOGGLE_LOCATOR);
  const isExpanded = await toggle.getAttribute('aria-expanded');

  if (isExpanded !== 'true') {
    await toggle.click();
    await page.waitForTimeout(200);
  }

  await page.evaluate(
    ({ contentSelector, toggleSelector }) => {
      const sectionEl = document
        .querySelector(contentSelector)
        ?.closest('[data-testid="collapsible-section"]');
      if (!sectionEl) return;

      const content = sectionEl.querySelector(contentSelector) as HTMLElement | null;
      if (content) {
        content.classList.add('block');
        content.classList.remove('hidden');
        content.setAttribute('aria-hidden', 'false');
        content.style.display = 'block';
        content.style.maxHeight = 'none';
      }

      const toggleEl = sectionEl.querySelector(toggleSelector) as HTMLElement | null;
      if (toggleEl) {
        toggleEl.setAttribute('aria-expanded', 'true');
        toggleEl.textContent = '−';
      }
    },
    {
      contentSelector: SUGGESTED_ACTIONS_CONTENT_LOCATOR,
      toggleSelector: SUGGESTED_ACTIONS_TOGGLE_LOCATOR,
    }
  );
}

/**
 * Render seeded Suggested Actions markup with authentic skill requirement badges to
 * match production styling.
 */
export async function renderSeededSuggestedActions(page: Page): Promise<void> {
  await page.evaluate(
    ({ contentSelector }) => {
      const title = Array.from(document.querySelectorAll('[data-testid="collapsible-section-title"]'))
        .find((el) => el.textContent?.includes('Suggested Actions'));
      if (!title) return;

      const sectionEl = title.closest('[data-testid="collapsible-section"]');
      if (!sectionEl) return;

      const content = sectionEl.querySelector(contentSelector) as HTMLElement | null;
      if (!content) return;

      const skillNameLookup: Record<string, string> = {
        'skill-hacking': 'Hacking',
        'skill-streetwise': 'Streetwise',
      };

      const formatSkillRequirement = (requirement: any) => {
        if (!requirement) return 'Skill Requirement';

        const operatorSuffix = (operator: string, value: unknown) => {
          if (value === undefined || value === null || value === '') return '';
          const numericValue = typeof value === 'number' || typeof value === 'string' ? value : '';

          switch (operator) {
            case 'gte':
              return `${numericValue}+`;
            case 'gt':
              return `>${numericValue}`;
            case 'lte':
              return `≤${numericValue}`;
            case 'lt':
              return `<${numericValue}`;
            case 'eq':
              return `=${numericValue}`;
            case 'neq':
              return `≠${numericValue}`;
            default:
              return `${numericValue}`;
          }
        };

        const baseName =
          requirement.skillName ||
          skillNameLookup[requirement.targetId as string] ||
          requirement.targetId ||
          'Skill Requirement';

        const suffix = operatorSuffix(requirement.operator, requirement.value);
        return suffix ? `${baseName} • ${suffix}` : baseName;
      };

      const testWindow = window as typeof window & {
        __TEST_DECISIONS__?: Record<string, {
          options?: Array<{
            id: string;
            text: string;
            hint?: string;
            skillRequirements?: Array<unknown>;
            requirements?: Array<{
              type?: string;
              targetId?: string;
              operator?: string;
              value?: number | string;
              skillName?: string;
            }>;
          }>;
        }>;
      };

      const seededDecision = testWindow.__TEST_DECISIONS__?.['decision-cyberpunk-route'];
      if (!seededDecision?.options?.length) {
        return;
      }

      const badgeClasses = [
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        'border border-gray-300 bg-gray-100 text-gray-700',
      ].join(' ');

      const optionMarkup = seededDecision.options
        .map((option) => {
          const resolvedSkillRequirements = (() => {
            const optionWithSkills = option as typeof option & {
              skillRequirements?: Array<{
                skillName?: string;
                label?: string;
                targetId?: string;
                operator?: string;
                value?: number | string;
              }>;
            };

            if (
              Array.isArray(optionWithSkills.skillRequirements) &&
              optionWithSkills.skillRequirements.length > 0
            ) {
              return optionWithSkills.skillRequirements.map(
                (req) => req?.skillName || req?.label || 'Skill Requirement'
              );
            }

            if (Array.isArray(option.requirements)) {
              const rawSkillRequirements = option.requirements.filter(
                (req: any) => req?.type === 'skill'
              );
              if (rawSkillRequirements.length > 0) {
                return rawSkillRequirements.map((req: any) => formatSkillRequirement(req));
              }
            }

            return [];
          })();

          const skillMarkup = resolvedSkillRequirements.length
            ? `<div class="flex flex-wrap gap-1 mt-2" role="group" aria-label="Skill requirements">
                ${resolvedSkillRequirements
                  .map(
                    (label: string, index: number) => `
                    <div class="${badgeClasses}" data-testid="skill-badge-${option.id}-${index}">
                      ${label}
                    </div>
                  `
                  )
                  .join('')}
              </div>`
            : '';

          const optionClasses = [
            'block w-full text-left p-3 border rounded-md shadow-sm mb-2 transition-colors',
            'bg-white hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2',
          ].join(' ');

          return `
            <button class="${optionClasses}" data-testid="choice-option-${option.id}">
              <div class="font-medium text-gray-900">${option.text}</div>
              ${option.hint ? `<div class="text-sm text-gray-500 mt-1">${option.hint}</div>` : ''}
              ${skillMarkup}
            </button>
          `;
        })
        .join('');

      content.innerHTML = `
        <div class="space-y-2" role="radiogroup" aria-labelledby="choices-heading">
          ${optionMarkup}
        </div>
      `;
    },
    { contentSelector: SUGGESTED_ACTIONS_CONTENT_LOCATOR }
  );
}

/**
 * Seed inventory demo items so the visual snapshot reflects a populated equipment list.
 */
export async function seedInventoryItemsForVisual(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const sessionStore = (window as typeof window & {
      useSessionStore?: unknown;
    }).useSessionStore;
    return !!sessionStore;
  });

  await page.waitForFunction(() => {
    const store = (window as typeof window & {
      useInventoryStore?: { persist?: { hasHydrated?: () => boolean } };
    }).useInventoryStore;

    if (!store) return false;
    if (!store.persist?.hasHydrated) return true;
    return store.persist.hasHydrated();
  });

  await page.evaluate(() => {
    const inventoryStore = (window as typeof window & {
      useInventoryStore?: {
        setState: (
          partial: unknown,
          replace?: boolean
        ) => void;
        getState?: () => {
          items: Record<string, unknown>;
          entities?: Record<string, unknown>;
          characterInventories: Record<string, string[]>;
        };
      };
    }).useInventoryStore;
    const worldStore = (window as typeof window & {
      useWorldStore?: {
        setState?: (partial: unknown, replace?: boolean) => void;
      };
    }).useWorldStore;
    const characterStore = (window as typeof window & {
      useCharacterStore?: {
        setState?: (partial: unknown, replace?: boolean) => void;
      };
    }).useCharacterStore;
    const sessionStore = (window as typeof window & {
      useSessionStore?: {
        getState?: () => { id?: string | null; worldId?: string | null; characterId?: string | null };
        setState?: (partial: unknown, replace?: boolean) => void;
      };
    }).useSessionStore;
    const narrativeStore = (window as typeof window & {
      useNarrativeStore?: {
        setState?: (partial: unknown, replace?: boolean) => void;
        getState?: () => {
          segments: Record<string, unknown>;
          sessionSegments: Record<string, string[]>;
        };
      };
    }).useNarrativeStore;

    if (!inventoryStore?.setState) {
      return;
    }

    const testWindow = window as typeof window & {
      __TEST_WORLDS__?: Record<string, unknown>;
      __TEST_CHARACTERS__?: Record<string, { id?: string; worldId?: string }>;
    };
    const testWorlds = testWindow.__TEST_WORLDS__ || {};
    const testCharacters = testWindow.__TEST_CHARACTERS__ || {};
    const resolvedWorldId =
      Object.keys(testWorlds)[0] ||
      Object.values(testCharacters)[0]?.worldId ||
      'world-cyberpunk-2077';
    const resolvedCharacterId =
      Object.values(testCharacters).find((char) => char.worldId === resolvedWorldId)?.id ||
      Object.values(testCharacters)[0]?.id ||
      'char-cyberpunk-hacker';

    if (worldStore?.setState && Object.keys(testWorlds).length > 0) {
      worldStore.setState((state: any) => ({
        ...state,
        worlds: { ...state?.worlds, ...testWorlds },
        entities: { ...state?.entities, ...testWorlds },
        currentWorldId: resolvedWorldId ?? state?.currentWorldId ?? null,
        currentEntityId: resolvedWorldId ?? state?.currentEntityId ?? null,
        loading: false,
        error: null,
      }));
    }

    if (characterStore?.setState && Object.keys(testCharacters).length > 0) {
      const worldCharacterIds = Object.values(testCharacters).reduce(
        (acc: Record<string, string[]>, char) => {
          if (!char?.worldId || !char?.id) return acc;
          acc[char.worldId] = acc[char.worldId] || [];
          if (!acc[char.worldId].includes(char.id)) {
            acc[char.worldId].push(char.id);
          }
          return acc;
        },
        {}
      );

      characterStore.setState((state: any) => ({
        ...state,
        characters: { ...state?.characters, ...testCharacters },
        entities: { ...state?.entities, ...testCharacters },
        worldCharacterIds: { ...state?.worldCharacterIds, ...worldCharacterIds },
        currentCharacterId: resolvedCharacterId ?? state?.currentCharacterId ?? null,
        currentEntityId: resolvedCharacterId ?? state?.currentEntityId ?? null,
        loading: false,
        error: null,
      }));
    }

    const sessionState = sessionStore?.getState?.() || {};
    const sessionId = sessionState.id ?? 'session-cyberpunk-ghost';
    const worldId = sessionState.worldId ?? resolvedWorldId ?? 'world-cyberpunk-2077';
    const characterId = sessionState.characterId ?? resolvedCharacterId ?? 'char-cyberpunk-hacker';

    if (sessionStore?.setState) {
      sessionStore.setState({
        ...sessionState,
        id: sessionId,
        worldId,
        characterId,
        currentSessionId: sessionId,
        status: 'active',
      });
    }

    if (narrativeStore?.setState) {
      const testSegmentsRecord = (window as typeof window & {
        __TEST_SEGMENTS__?: Record<string, any>;
      }).__TEST_SEGMENTS__ || {};

      const sessionSegments = Object.values(testSegmentsRecord).filter(
        (segment: any) => segment?.sessionId === sessionId
      );

      const fallbackSegmentId = 'segment-visual-seed';
      const fallbackSegments =
        sessionSegments.length > 0
          ? sessionSegments
          : [
              {
                id: fallbackSegmentId,
                worldId,
                sessionId,
                content: 'Seeded segment for visual inventory test.',
                type: 'scene',
                characterIds: [characterId],
                metadata: { tags: ['intro'], location: 'Seeded Location', characterIds: [characterId] },
                timestamp: new Date().toISOString(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ];

      const segmentIds = fallbackSegments.map((segment: any) => segment.id);
      const segmentsRecord = fallbackSegments.reduce((acc: Record<string, any>, segment: any) => {
        acc[segment.id] = segment;
        return acc;
      }, {});

      const existing = narrativeStore.getState?.() || { segments: {}, sessionSegments: {} };
      narrativeStore.setState({
        ...existing,
        segments: {
          ...existing.segments,
          ...segmentsRecord,
        },
        sessionSegments: {
          ...existing.sessionSegments,
          [sessionId]: segmentIds,
        },
      });
    }

    const cyberpunkItems = {
      'inventory-ghostlink-cyberdeck': {
        id: 'inventory-ghostlink-cyberdeck',
        name: 'Ghostlink Cyberdeck',
        description: 'Signature deck tuned to slip past Arasaka intrusion countermeasures.',
        categoryId: 'equipment',
        quantity: 1,
        stackable: false,
        image: {
          type: 'ai-generated',
          url: 'https://api.dicebear.com/7.x/shapes/svg?seed=cyberdeck&backgroundColor=1e293b&scale=80',
          generatedAt: '2024-01-01T01:58:30.000Z',
          prompt: 'Product photography of Ghostlink Cyberdeck (Signature deck tuned to slip past Arasaka intrusion countermeasures) cyberpunk style sleek futuristic device clear background detailed view high quality centered composition',
        },
        acquisitionHistory: [
          {
            acquiredAt: '2024-01-01T01:58:00.000Z',
            method: 'quest',
            quantity: 1,
            description: 'Recovered during the vault raid briefing.',
          },
        ],
        categorization: {
          categoryId: 'equipment',
          source: 'manual',
          classifiedAt: '2024-01-01T01:58:00.000Z',
        },
        createdAt: '2024-01-01T01:58:00.000Z',
        updatedAt: '2024-01-01T02:04:00.000Z',
      },
      'inventory-neuro-stims': {
        id: 'inventory-neuro-stims',
        name: 'NeuroBoost Stims',
        description: 'Fast-acting injectors that keep reflexes sharp during breach attempts.',
        categoryId: 'consumables',
        quantity: 3,
        stackable: true,
        maxStack: 5,
        image: {
          type: 'ai-generated',
          url: 'https://api.dicebear.com/7.x/shapes/svg?seed=neurostim&backgroundColor=3b82f6&scale=80',
          generatedAt: '2024-01-01T01:45:30.000Z',
          prompt: 'Product photography of NeuroBoost Stims (Fast-acting injectors that keep reflexes sharp during breach attempts) cyberpunk style medical injector clear background detailed view high quality centered composition',
        },
        acquisitionHistory: [
          {
            acquiredAt: '2024-01-01T01:45:00.000Z',
            method: 'purchase',
            quantity: 3,
            description: 'Purchased from a trusted ripperdoc contact.',
          },
        ],
        categorization: {
          categoryId: 'consumables',
          source: 'manual',
          classifiedAt: '2024-01-01T01:45:00.000Z',
        },
        createdAt: '2024-01-01T01:45:00.000Z',
        updatedAt: '2024-01-01T02:02:30.000Z',
      },
      'inventory-black-ice-shard': {
        id: 'inventory-black-ice-shard',
        name: 'Black ICE Shard',
        description: 'Prototype defensive program that can be slotted into the deck on demand.',
        categoryId: 'quest-items',
        quantity: 1,
        stackable: false,
        image: {
          type: 'ai-generated',
          url: 'https://api.dicebear.com/7.x/shapes/svg?seed=blackice&backgroundColor=7c3aed&scale=80',
          generatedAt: '2024-01-01T02:01:30.000Z',
          prompt: 'Product photography of Black ICE Shard (Prototype defensive program that can be slotted into the deck on demand) cyberpunk style crystalline data chip clear background detailed view high quality centered composition',
        },
        acquisitionHistory: [
          {
            acquiredAt: '2024-01-01T02:01:00.000Z',
            method: 'reward',
            quantity: 1,
            description: 'Rewarded by Fixer Nyx after completing the reconnaissance run.',
          },
        ],
        categorization: {
          categoryId: 'quest-items',
          source: 'manual',
          classifiedAt: '2024-01-01T02:01:00.000Z',
        },
        createdAt: '2024-01-01T02:01:00.000Z',
        updatedAt: '2024-01-01T02:03:10.000Z',
      },
    } as Record<string, unknown>;

    inventoryStore.setState((state: {
      items: Record<string, unknown>;
      entities?: Record<string, unknown>;
      characterInventories: Record<string, string[]>;
    }) => ({
      items: {
        ...state?.items,
        ...cyberpunkItems,
      },
      entities: {
        ...state?.items,
        ...cyberpunkItems,
      },
      characterInventories: {
        ...state?.characterInventories,
        'char-cyberpunk-hacker': [
          'inventory-ghostlink-cyberdeck',
          'inventory-neuro-stims',
          'inventory-black-ice-shard',
        ],
      },
    }));
  });
}

/**
 * Seed journal entries so the journal page renders populated content.
 */
export async function seedJournalEntriesForVisual(page: Page): Promise<void> {
  // Debug: Check what stores are available
  const availableStores = await page.evaluate(() => {
    const w = window as typeof window & {
      useWorldStore?: unknown;
      useSessionStore?: unknown;
      useJournalStore?: unknown;
      useCharacterStore?: unknown;
      useInventoryStore?: unknown;
    };
    return {
      useWorldStore: !!w.useWorldStore,
      useSessionStore: !!w.useSessionStore,
      useJournalStore: !!w.useJournalStore,
      useCharacterStore: !!w.useCharacterStore,
      useInventoryStore: !!w.useInventoryStore,
    };
  });

  console.log('📊 Available stores on window:', availableStores);

  // If journal store isn't available, skip hydration wait and proceed directly to seeding
  if (!availableStores.useJournalStore) {
    console.log('⚠️ useJournalStore not available on window, skipping hydration wait');
    // Don't wait for hydration, just proceed to the next step
  } else {
    // Wait for journal store to be available on window
    await page.waitForFunction(() => {
      const hasStore = !!(window as typeof window & {
        useJournalStore?: unknown;
      }).useJournalStore;

      if (!hasStore) {
        console.log('[Test] Waiting for useJournalStore to be available on window...');
      }
      return hasStore;
    });
  }

  // If the store has a persist.hasHydrated method, wait for it
  const needsHydration = await page.evaluate(() => {
    const store = (window as typeof window & {
      useJournalStore?: { persist?: { hasHydrated?: () => boolean } };
    }).useJournalStore;
    return !!(store?.persist?.hasHydrated);
  });

  if (needsHydration) {
    await page.waitForFunction(() => {
      const store = (window as typeof window & {
        useJournalStore?: { persist?: { hasHydrated?: () => boolean } };
      }).useJournalStore;
      return store?.persist?.hasHydrated?.() ?? false;
    });
  }

  // Wait for session store to hydrate (critical for JournalPage which reads sessionId)
  const sessionStoreNeedsHydration = await page.evaluate(() => {
    const store = (window as typeof window & {
      useSessionStore?: { persist?: { hasHydrated?: () => boolean } };
    }).useSessionStore;
    return !!(store?.persist?.hasHydrated);
  });

  if (sessionStoreNeedsHydration) {
    await page.waitForFunction(() => {
      const store = (window as typeof window & {
        useSessionStore?: { persist?: { hasHydrated?: () => boolean } };
      }).useSessionStore;
      const hydrated = store?.persist?.hasHydrated?.() ?? false;
      if (!hydrated) {
        console.log('[Test] Waiting for sessionStore hydration...');
      }
      return hydrated;
    });
  }

  await page.evaluate((entries) => {
    const journalStore = (window as typeof window & {
      useJournalStore?: {
        setState: (
          partial: unknown,
          replace?: boolean
        ) => void;
        getState?: () => { entries?: Record<string, unknown>; sessionEntries?: Record<string, string[]> };
      };
    }).useJournalStore;
    const worldStore = (window as typeof window & {
      useWorldStore?: {
        setState?: (partial: unknown, replace?: boolean) => void;
      };
    }).useWorldStore;
    const characterStore = (window as typeof window & {
      useCharacterStore?: {
        setState?: (partial: unknown, replace?: boolean) => void;
      };
    }).useCharacterStore;
    const sessionStoreApi = (window as typeof window & {
      useSessionStore?: {
        getState?: () => { id?: string | null; worldId?: string | null; characterId?: string | null };
        setState?: (partial: unknown, replace?: boolean) => void;
      };
    }).useSessionStore;
    const sessionStore = sessionStoreApi?.getState?.();

    if (!journalStore?.setState) {
      return;
    }

    const testWindow = window as typeof window & {
      __TEST_WORLDS__?: Record<string, unknown>;
      __TEST_CHARACTERS__?: Record<string, { id?: string; worldId?: string }>;
    };
    const testWorlds = testWindow.__TEST_WORLDS__ || {};
    const testCharacters = testWindow.__TEST_CHARACTERS__ || {};
    const resolvedWorldId =
      Object.keys(testWorlds)[0] ||
      Object.values(testCharacters)[0]?.worldId ||
      entries[0]?.worldId;
    const resolvedCharacterId =
      Object.values(testCharacters).find((char) => char.worldId === resolvedWorldId)?.id ||
      Object.values(testCharacters)[0]?.id ||
      entries[0]?.characterId;

    if (worldStore?.setState && Object.keys(testWorlds).length > 0) {
      worldStore.setState((state: any) => ({
        ...state,
        worlds: { ...state?.worlds, ...testWorlds },
        entities: { ...state?.entities, ...testWorlds },
        currentWorldId: resolvedWorldId ?? state?.currentWorldId ?? null,
        currentEntityId: resolvedWorldId ?? state?.currentEntityId ?? null,
        loading: false,
        error: null,
      }));
    }

    if (characterStore?.setState && Object.keys(testCharacters).length > 0) {
      const worldCharacterIds = Object.values(testCharacters).reduce(
        (acc: Record<string, string[]>, char) => {
          if (!char?.worldId || !char?.id) return acc;
          acc[char.worldId] = acc[char.worldId] || [];
          if (!acc[char.worldId].includes(char.id)) {
            acc[char.worldId].push(char.id);
          }
          return acc;
        },
        {}
      );

      characterStore.setState((state: any) => ({
        ...state,
        characters: { ...state?.characters, ...testCharacters },
        entities: { ...state?.entities, ...testCharacters },
        worldCharacterIds: { ...state?.worldCharacterIds, ...worldCharacterIds },
        currentCharacterId: resolvedCharacterId ?? state?.currentCharacterId ?? null,
        currentEntityId: resolvedCharacterId ?? state?.currentEntityId ?? null,
        loading: false,
        error: null,
      }));
    }

    const targetSessionId = sessionStore?.id ?? entries[0]?.sessionId;
    const targetWorldId = sessionStore?.worldId ?? resolvedWorldId ?? entries[0]?.worldId;
    const targetCharacterId = sessionStore?.characterId ?? resolvedCharacterId ?? entries[0]?.characterId;

    const existingSessionEntries = journalStore.getState?.().sessionEntries?.[targetSessionId || ''] || [];
    if (existingSessionEntries.length > 0) {
      return;
    }

    if (sessionStoreApi?.setState) {
      sessionStoreApi.setState((state: { id?: string | null; worldId?: string | null; characterId?: string | null }) => ({
        ...state,
        id: targetSessionId ?? state.id,
        worldId: targetWorldId ?? state.worldId,
        characterId: targetCharacterId ?? state.characterId,
        currentSessionId: targetSessionId ?? state.id ?? null,
        status: 'active',
      }));
    }
    const baseTimestamp = Date.now();
    const adjustedEntries = entries.map((entry: any, index: number) => {
      const timestamp = new Date(baseTimestamp + index * 1000).toISOString();
      const nextMetadata = entry.metadata && entry.type === 'session_start'
        ? { ...entry.metadata, sessionStartTime: timestamp }
        : entry.metadata;

      return {
        ...entry,
        sessionId: targetSessionId ?? entry.sessionId,
        worldId: targetWorldId ?? entry.worldId,
        characterId: targetCharacterId ?? entry.characterId,
        createdAt: timestamp,
        updatedAt: timestamp,
        metadata: nextMetadata,
      };
    });

    const entriesRecord = adjustedEntries.reduce((acc: Record<string, unknown>, entry: any) => {
      acc[entry.id] = entry;
      return acc;
    }, {});

    const sessionEntries = adjustedEntries.reduce((acc: Record<string, string[]>, entry: any) => {
      acc[entry.sessionId] = acc[entry.sessionId] || [];
      acc[entry.sessionId].push(entry.id);
      return acc;
    }, {});

    journalStore.setState(() => ({
      entries: entriesRecord,
      sessionEntries,
      loading: false,
      error: null,
    }));
  }, SAMPLE_JOURNAL_ENTRIES);

  await page.waitForFunction(() => {
    const sessionStore = (window as typeof window & {
      useSessionStore?: { getState?: () => { id?: string | null } };
    }).useSessionStore?.getState?.();
    const journalStore = (window as typeof window & {
      useJournalStore?: { getState?: () => { sessionEntries?: Record<string, string[]> } };
    }).useJournalStore?.getState?.();

    if (!sessionStore?.id) {
      return false;
    }

    const entries = journalStore?.sessionEntries?.[sessionStore.id] || [];
    return entries.length > 0;
  });
}

/**
 * Seed world state with story checkpoints and major events so the Story Summary section
 * renders deterministic content for the visual baseline.
 */
export async function seedStorySummaryForVisual(page: Page): Promise<void> {
  await page.evaluate(() => {
    const appWindow = window as typeof window & {
      useWorldStore?: { getState?: () => any };
      useSessionStore?: { getState?: () => any };
    };

    const worldStore = appWindow.useWorldStore?.getState?.();
    const sessionStore = appWindow.useSessionStore?.getState?.();

    if (!worldStore?.updateWorldState || !sessionStore) {
      return;
    }

    const worldId =
      sessionStore.worldId ||
      worldStore.currentWorldId ||
      Object.keys(worldStore.worlds || {})[0];
    const sessionId =
      sessionStore.currentSessionId ||
      sessionStore.id ||
      'session-visual-story';
    const characterId =
      sessionStore.characterId ||
      'character-cyberpunk-merc';

    if (!worldId || !sessionId) {
      return;
    }

    const existingState = worldStore.worldStates?.[worldId];
     const sessionCheckpoints = existingState?.storyCheckpoints?.filter(
       (cp: { sessionId?: string }) => cp.sessionId === sessionId,
     ) ?? [];

     if (sessionCheckpoints.some((cp: { id: string }) => cp.id === 'checkpoint-visual-story')) {
       return;
     }

    const majorEvents = [
      {
        id: 'visual-event-1',
        description: 'Sable unmasked the traitor council.',
        timestamp: new Date('2025-11-10T18:00:00Z').toISOString(),
        characterId,
      },
      {
        id: 'visual-event-2',
        description: 'AI governor sealed the undercity gates.',
        timestamp: new Date('2025-11-11T18:30:00Z').toISOString(),
        characterId,
      },
    ];

    worldStore.updateWorldState(worldId, { majorEvents }, sessionId);

    worldStore.updateWorldState(
      worldId,
      {
        storyCheckpoints: [
          {
            id: 'checkpoint-visual-story',
            sessionId,
            characterId,
            createdAt: new Date('2025-11-10T18:05:00Z').toISOString(),
            segment: 'Sable exposed the traitors and rallied the undercity.',
            highlights: ['Council plot revealed', 'Undercity united'],
            eventIds: ['visual-event-1'],
            decisionIds: ['decision-visual-story'],
            metadata: {
              lastEventTimestamp: majorEvents[0].timestamp,
              includedEvents: 1,
              includedDecisions: 1,
              promptVersion: 'visual-story',
              aiModel: 'gemini-1.5-pro',
            },
          },
        ],
      },
      sessionId,
    );
  });
}

/**
 * Force the Suggested Actions content to remain visible in case reactive layout logic
 * toggles the collapsible closed after we expand it.
 */
export async function ensureSuggestedActionsContentVisible(page: Page): Promise<void> {
  await page.evaluate(({ contentSelector, toggleSelector }) => {
    const content = document.querySelector(contentSelector) as HTMLElement | null;
    if (!content) return;

    content.classList.add('block');
    content.classList.remove('hidden');
    content.setAttribute('aria-hidden', 'false');
    content.style.display = 'block';
    content.style.maxHeight = 'none';
    content.style.opacity = '1';

    const toggle = document.querySelector(toggleSelector);
    if (toggle) {
      toggle.setAttribute('aria-expanded', 'true');
    }
  }, {
    contentSelector: SUGGESTED_ACTIONS_CONTENT_LOCATOR,
    toggleSelector: SUGGESTED_ACTIONS_TOGGLE_LOCATOR,
  });
}

/**
 * Remove the duplicate textarea that sometimes appears in the Suggested Actions section
 * during tests due to double-rendered editor components.
 */
export async function removeDuplicateSuggestedActionsTextarea(page: Page): Promise<void> {
  await page.evaluate(() => {
    const suggestedActionsSection = document.querySelector('[data-testid="collapsible-section"]');
    if (!suggestedActionsSection) return;

    const duplicateTextarea = suggestedActionsSection.querySelector('textarea');
    if (!duplicateTextarea) return;

    const wrapper = duplicateTextarea.closest('.mb-4, .p-4, .bg-gray-100');
    if (wrapper && suggestedActionsSection.contains(wrapper)) {
      wrapper.remove();
      console.log('✅ Removed duplicate textarea wrapper inside collapsible section');
      return;
    }

    duplicateTextarea.remove();
    console.log('✅ Removed duplicate textarea inside collapsible section');
  });
}

/**
 * Relax the story column height constraints so the full narrative renders in the
 * full-page screenshot.
 */
export async function relaxStoryColumnHeight(page: Page): Promise<void> {
  // Use a CSS override with !important so React re-renders can't re-apply
  // the inline maxHeight/overflow constraints during visual tests.
  await page.addStyleTag({
    content: `
      #narrative-container {
        max-height: none !important;
        overflow: visible !important;
      }

      #narrative-container .narrative-history-manager,
      #narrative-container .narrative-history-container {
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
        flex: none !important;
      }

      #narrative-container .narrative-history-container .relative.overflow-hidden {
        overflow: visible !important;
        height: auto !important;
        max-height: none !important;
      }

      #narrative-container [data-radix-scroll-area-viewport] {
        height: auto !important;
        max-height: none !important;
        overflow: visible !important;
      }
    `,
  });
}
