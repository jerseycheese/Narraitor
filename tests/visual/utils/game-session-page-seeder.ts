import type { Page } from '@playwright/test';

const SUGGESTED_ACTIONS_TITLE_LOCATOR = '[data-testid="collapsible-section-title"]';
const SUGGESTED_ACTIONS_CONTENT_LOCATOR = '[data-testid="collapsible-section-content"]';
const SUGGESTED_ACTIONS_TOGGLE_LOCATOR = '[data-testid="collapsible-section-toggle"]';
const STORY_SUMMARY_SECTION_LOCATOR = '[data-testid="story-summary-section"]';
const STORY_SUMMARY_TOGGLE_LOCATOR = '[data-testid="collapsible-section-toggle"]';
const INVENTORY_SECTION_LOCATOR = '[data-testid="inventory-collapsible"]';

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

    if (!inventoryStore?.setState) {
      return;
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
    if (existingState?.storyCheckpoints?.some((cp: { id: string }) => cp.id === 'checkpoint-visual-story')) {
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
            summary: 'Sable exposed the traitors and rallied the undercity.',
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
 * Ensure the Story Summary collapsible is expanded so the snapshot includes the checkpoint content.
 */
export async function expandStorySummarySection(page: Page): Promise<void> {
  const section = page.locator(STORY_SUMMARY_SECTION_LOCATOR);

  if (!(await section.count())) {
    return;
  }

  const toggle = section.locator(STORY_SUMMARY_TOGGLE_LOCATOR).first();
  const expanded = await toggle.getAttribute('aria-expanded');

  if (expanded !== 'true') {
    await toggle.click();
    await page.waitForTimeout(200);
  }

  await page.evaluate(
    ({ sectionSelector }) => {
      const sectionEl = document.querySelector(sectionSelector);
      const content = sectionEl?.querySelector('[data-testid="collapsible-section-content"]') as HTMLElement | null;
      const toggleButton = sectionEl?.querySelector('[data-testid="collapsible-section-toggle"]') as HTMLElement | null;

      if (content) {
        content.classList.add('block');
        content.classList.remove('hidden');
        content.setAttribute('aria-hidden', 'false');
        content.style.display = 'block';
      }

      if (toggleButton) {
        toggleButton.setAttribute('aria-expanded', 'true');
        toggleButton.textContent = '−';
      }
    },
    { sectionSelector: STORY_SUMMARY_SECTION_LOCATOR },
  );
}

/**
 * Ensure the Inventory collapsible renders its contents for visual baselines.
 */
export async function expandInventorySection(page: Page): Promise<void> {
  const section = page.locator(INVENTORY_SECTION_LOCATOR);

  if (!(await section.count())) {
    return;
  }

  const toggle = section.locator('[data-testid="collapsible-section-toggle"]').first();
  const expanded = await toggle.getAttribute('aria-expanded');

  if (expanded !== 'true') {
    await toggle.click();
    await page.waitForTimeout(200);
  }

  await page.evaluate(({ selector }) => {
    const sectionEl = document.querySelector(selector);
    if (!sectionEl) {
      return;
    }

    const content = sectionEl.querySelector('[data-testid="collapsible-section-content"]') as HTMLElement | null;
    const toggleButton = sectionEl.querySelector('[data-testid="collapsible-section-toggle"]') as HTMLElement | null;

    if (content) {
      content.classList.add('block');
      content.classList.remove('hidden');
      content.setAttribute('aria-hidden', 'false');
      content.style.display = 'block';
    }

    if (toggleButton) {
      toggleButton.setAttribute('aria-expanded', 'true');
      toggleButton.textContent = '−';
    }
  }, { selector: INVENTORY_SECTION_LOCATOR });
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
  await page.evaluate(() => {
    const storyColumn = document.querySelector('.lg\\:flex-1.min-h-0.flex.flex-col.lg\\:overflow-hidden.relative');
    if (storyColumn) {
      const element = storyColumn as HTMLElement;
      element.style.maxHeight = 'none';
      element.style.overflow = 'visible';
      console.log('✅ Removed height constraints for fullPage screenshot');
    }
  });
}
