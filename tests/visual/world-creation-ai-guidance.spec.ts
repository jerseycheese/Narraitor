import { test, expect } from '@playwright/test';

test.describe('World Creation Wizard AI Guidance', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/worlds/create');
    // Navigate to the Basic Info step
    await page.getByRole('button', { name: 'Create My Own World' }).click();
  });

  test('should display genre-specific guidance on Basic Info step', async ({ page }) => {
    // Verify initial guidance for 'default' (since worldData.genre is likely undefined initially)
    await expect(page.getByTestId('wizard-form-help-text').filter({ hasText: 'Examples: Aurora Frontier, The Obsidian Accord, Echoes of Verdant' })).toBeVisible();
    await expect(page.getByTestId('wizard-form-help-text').filter({ hasText: 'Highlight the main conflict, the tone you want players to feel, and the types of challenges that should show up.' })).toBeVisible();

    // Wait for the page to be fully loaded and stable
    await page.waitForLoadState('networkidle');

    // Debugging: Check visibility and count of the parent div
    const parentDiv = page.locator('div.relative').filter({ hasText: 'Genre' });
    console.log('Parent div for Genre combobox visible:', await parentDiv.isVisible());
    console.log('Parent div for Genre combobox count:', await parentDiv.count());

    // Debugging: Check visibility and count of the combobox itself
    const genreCombobox = parentDiv.getByRole('combobox');

    console.log('Genre combobox visible:', await genreCombobox.isVisible());
    console.log('Genre combobox enabled:', await genreCombobox.isEnabled());
    console.log('Genre combobox count:', await genreCombobox.count());

    // Explicitly select 'fantasy' to ensure the state is updated and trigger genre-specific guidance
    // Interact with the custom combobox
    await genreCombobox.click(); // Open the combobox
    await page.getByRole('option', { name: 'Fantasy' }).click(); // Select 'Fantasy'
    // Verify guidance for 'fantasy'
    await expect(page.getByTestId('wizard-form-help-text').filter({ hasText: 'Examples: Elderwind Realms, The Shattered Grove, Crown of Embers' })).toBeVisible();
    await expect(page.getByTestId('wizard-form-help-text').filter({ hasText: 'Mention how magic works, who wields it, and the legendary stakes your heroes face.' })).toBeVisible();

    // Change genre to 'sci-fi' and verify guidance updates
    await page.getByLabel('Genre').selectOption('sci-fi');
    await expect(page.getByTestId('wizard-form-help-text').filter({ hasText: 'Examples: Nova Arcology, Helios Verge, Protocol Horizon' })).toBeVisible();
    await expect(page.getByTestId('wizard-form-help-text').filter({ hasText: 'Explain the governing factions, the tech that defines daily life, and the paradox or threat the crew must solve.' })).toBeVisible();
  });

  test('should display AI suggestion generation flow on Description step', async ({ page }) => {
    // Fill basic info to proceed to description step
    await page.getByLabel('Brief Description').fill('A world where magic and technology coexist, but are in constant conflict.');
    await page.getByRole('button', { name: 'Next' }).click();

    // Verify generate button is initially disabled if description is too short (though we filled it, this is a good check)
    // The description in beforeEach is short, so it should be disabled.
    await expect(page.getByTestId('generate-ai-suggestions')).toBeEnabled(); // Should be enabled because we filled it in beforeEach

    // Clear description to test disabled state
    await page.getByTestId('world-full-description').fill('');
    await expect(page.getByTestId('generate-ai-suggestions')).toBeDisabled();
    await expect(page.getByText('Once the description reaches 50+ characters, the AI can help with ideas.')).toBeVisible();

    // Fill a long enough description
    const longDescription = 'This is a very long description that should be more than fifty characters. It describes a world where ancient dragons sleep beneath futuristic cities, and their awakening threatens to shatter the delicate balance between magic and advanced technology. Factions vie for control over scarce resources and forgotten spells.';
    await page.getByTestId('world-full-description').fill(longDescription);
    await expect(page.getByTestId('generate-ai-suggestions')).toBeEnabled();
    await expect(page.getByText('AI suggestions need a detailed description to stay accurate.')).toBeVisible();


    // Click generate and verify loading state
    await page.getByTestId('generate-ai-suggestions').click();
    await expect(page.getByRole('button', { name: 'Analyzing description...' })).toBeVisible();
    await expect(page.getByTestId('processing-overlay')).toBeVisible();

    // Wait for suggestions to appear
    await expect(page.getByTestId('ai-suggestion-preview')).toBeVisible();
    await expect(page.getByText('Attributes to explore')).toBeVisible();
    await expect(page.getByText('Skill ideas')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Regenerate suggestions' })).toBeVisible();
    await expect(page.getByText('AI generated from your description')).toBeVisible();
    await expect(page.getByTestId('processing-overlay')).not.toBeVisible();
  });

  test('should show outdated description warning after modification', async ({ page }) => {
    // Fill basic info to proceed to description step
    await page.getByLabel('Brief Description').fill('A world where magic and technology coexist, but are in constant conflict.');
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

    // Regenerate suggestions and verify warning disappears
    await page.getByTestId('generate-ai-suggestions').click();
    await expect(page.getByTestId('processing-overlay')).toBeVisible();
    await expect(page.getByTestId('ai-description-outdated')).not.toBeVisible();
    await expect(page.getByTestId('ai-suggestion-preview')).toBeVisible();
  });
});
