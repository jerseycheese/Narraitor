import { test, expect } from '@playwright/test';
import { waitForContentStable } from './utils/wait-helpers';
import { seedTestData, mockApiEndpoints } from './utils/data-seeder';

test.describe('World Creation Wizard AI Guidance', () => {
  test.beforeEach(async ({ page }) => {
    await seedTestData(page);
    await mockApiEndpoints(page);

    // Mock AI world analysis endpoint
    await page.route('**/api/ai/analyze-world', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: {
          attributes: [
            {
              name: 'Arcane Power',
              description: 'Your connection to magical forces'
            },
            {
              name: 'Tech Affinity',
              description: 'Your skill with advanced technology'
            },
            {
              name: 'Resolve',
              description: 'Your mental fortitude'
            }
          ],
          skills: [
            {
              name: 'Spellweaving',
              description: 'Blend magical and technological effects'
            },
            {
              name: 'Systems Hacking',
              description: 'Breach security systems'
            },
            {
              name: 'Combat Tactics',
              description: 'Strategic fighting ability'
            }
          ]
        }
      });
    });

    await page.goto('/worlds');
    await waitForContentStable(page);
    await page.goto('/worlds/create');
    await waitForContentStable(page);
    // Navigate to the Basic Info step by clicking "Create My Own World"
    await page.getByRole('button', { name: 'Create My Own World' }).click();
    await page.waitForTimeout(300);
  });

  test('should display genre-specific guidance on Basic Info step', async ({ page }) => {
    // Initially shows default guidance for world name (worldData.genre is undefined)
    await expect(page.getByTestId('wizard-form-help-text').filter({ hasText: 'Examples: Aurora Frontier, The Obsidian Accord, Echoes of Verdant' })).toBeVisible();

    // Select fantasy explicitly to trigger fantasy guidance
    await page.getByTestId('world-genre-select').selectOption('fantasy');
    await expect(page.getByTestId('wizard-form-help-text').filter({ hasText: 'Examples: Elderwind Realms, The Shattered Grove, Crown of Embers' })).toBeVisible();
    await expect(page.getByTestId('wizard-form-help-text').filter({ hasText: 'Mention how magic works, who wields it, and the legendary stakes your heroes face.' })).toBeVisible();

    // Change genre to 'sci-fi' and verify guidance updates
    await page.getByTestId('world-genre-select').selectOption('sci-fi');
    await expect(page.getByTestId('wizard-form-help-text').filter({ hasText: 'Examples: Nova Arcology, Helios Verge, Protocol Horizon' })).toBeVisible();
    await expect(page.getByTestId('wizard-form-help-text').filter({ hasText: 'Call out the technology level, the frontier being explored, and any runaway science experiments.' })).toBeVisible();
  });

  test('should display AI suggestion generation flow on Description step', async ({ page }) => {
    // Select required genre and proceed to description step
    await page.getByTestId('world-genre-select').selectOption('fantasy');
    await page.getByRole('button', { name: 'Next' }).click();

    // Initially the description is empty, so generate button should be disabled
    await expect(page.getByTestId('generate-ai-suggestions')).toBeDisabled();
    await expect(page.getByText('Add at least 50 characters so the AI can understand your world before generating suggestions.')).toBeVisible();

    // Fill a long enough description to enable AI generation
    const longDescription = 'A world where magic and technology coexist in constant conflict. Ancient magical forces clash with futuristic tech.';
    await page.getByTestId('world-full-description').fill(longDescription);
    await expect(page.getByTestId('generate-ai-suggestions')).toBeEnabled();


    // Click generate and wait for suggestions to appear (mock responds instantly)
    await page.getByTestId('generate-ai-suggestions').click();

    // Wait for suggestions to appear
    await expect(page.getByTestId('ai-suggestion-preview')).toBeVisible();
    await expect(page.getByText('Attributes to explore')).toBeVisible();
    await expect(page.getByText('Skill ideas')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Regenerate suggestions' })).toBeVisible();
    await expect(page.getByText('AI generated from your description')).toBeVisible();
  });

  test('should show outdated description warning after modification', async ({ page }) => {
    // Select required genre and proceed to description step
    await page.getByTestId('world-genre-select').selectOption('fantasy');
    await page.getByRole('button', { name: 'Next' }).click();

    // Generate suggestions
    const longDescription = 'This is a very long description that should be more than fifty characters. It describes a world where ancient dragons sleep beneath futuristic cities, and their awakening threatens to shatter the delicate balance between magic and advanced technology. Factions vie for control over scarce resources and forgotten spells.';
    await page.getByTestId('world-full-description').fill(longDescription);
    await page.getByTestId('generate-ai-suggestions').click();
    await expect(page.getByTestId('ai-suggestion-preview')).toBeVisible(); // Wait for suggestions to load

    // Modify description
    await page.getByTestId('world-full-description').fill(longDescription + ' A new sentence.');

    // Verify outdated warning appears
    await expect(page.getByTestId('ai-description-outdated')).toBeVisible();
    await expect(page.getByText('Your description has changed since the last AI run. Regenerate suggestions to keep them aligned.')).toBeVisible();

    // Regenerate suggestions and verify warning disappears (mock responds instantly)
    await page.getByTestId('generate-ai-suggestions').click();
    await expect(page.getByTestId('ai-description-outdated')).not.toBeVisible();
    await expect(page.getByTestId('ai-suggestion-preview')).toBeVisible();
  });
});
