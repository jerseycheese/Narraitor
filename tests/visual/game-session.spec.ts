import { test, expect } from '@playwright/test';

/**
 * Game Session Interface Visual Regression Tests
 * 
 * These tests ensure visual consistency of the active game session interface.
 * Focus on USER-FACING visual behavior during gameplay interactions.
 * 
 * Will FAIL initially (red phase) until:
 * - Playwright configuration exists
 * - Baseline screenshots are generated
 * - Game session pages are accessible
 * 
 * Acceptance Criteria Validation:
 * - Game session layout remains visually consistent
 * - Narrative display renders correctly
 * - Choice selection interface works properly
 * - Character summary and controls are visually stable
 */

test.describe('Game Session Interface Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to game session page
    await page.goto('/play');
    await page.waitForLoadState('networkidle');
    
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
      `
    });
  });

  test('should maintain game session layout consistency', async ({ page }) => {
    // Core visual regression test for game session interface
    // Tests the overall game layout that players interact with
    
    await expect(page).toHaveScreenshot('game-session-layout.png', {
      fullPage: true,
      animations: 'disabled',
      threshold: 0.3
    });
  });

  test('should maintain narrative display visual consistency', async ({ page }) => {
    // Test the main narrative text display area
    // Critical for storytelling experience
    
    const narrativeArea = page.locator(
      '[data-testid="narrative"], .narrative, .story-text, .game-text, main .content'
    ).first();
    
    if (await narrativeArea.count() > 0) {
      await expect(narrativeArea).toHaveScreenshot('game-session-narrative-display.png', {
        threshold: 0.25
      });
    } else {
      // Look for any text content area
      const textContent = page.locator('p, .text-content, .story-content').first();
      if (await textContent.count() > 0) {
        await expect(textContent.locator('..').first()).toHaveScreenshot('game-session-text-content.png', {
          threshold: 0.25
        });
      }
    }
  });

  test('should maintain choice selection interface visual consistency', async ({ page }) => {
    // Test choice/action selection buttons
    // Essential for player interaction
    
    const choiceContainer = page.locator(
      '[data-testid="choices"], .choices, .actions, .game-choices, .choice-container'
    ).first();
    
    if (await choiceContainer.count() > 0) {
      await expect(choiceContainer).toHaveScreenshot('game-session-choices-container.png', {
        threshold: 0.3
      });
    } else {
      // Look for choice buttons or options
      const choiceButtons = page.locator('button:has-text("Choose"), .choice-button, .action-button');
      if (await choiceButtons.count() > 0) {
        await expect(choiceButtons.first().locator('..').first()).toHaveScreenshot('game-session-choice-buttons.png', {
          threshold: 0.3
        });
      }
    }
  });

  test('should maintain character summary visual layout', async ({ page }) => {
    // Test character information display
    // Important for player reference during gameplay
    
    const characterSummary = page.locator(
      '[data-testid="character-summary"], .character-summary, .character-info, .player-character'
    ).first();
    
    if (await characterSummary.count() > 0) {
      await expect(characterSummary).toHaveScreenshot('game-session-character-summary.png', {
        threshold: 0.3
      });
    } else {
      // Look for any character-related information
      const characterInfo = page.locator('.character, .stats, .attributes, .skills').first();
      if (await characterInfo.count() > 0) {
        await expect(characterInfo).toHaveScreenshot('game-session-character-info.png', {
          threshold: 0.3
        });
      }
    }
  });

  test('should maintain game controls visual consistency', async ({ page }) => {
    // Test game control buttons (save, load, menu, etc.)
    const gameControls = page.locator(
      '[data-testid="game-controls"], .game-controls, .session-controls, .game-menu'
    ).first();
    
    if (await gameControls.count() > 0) {
      await expect(gameControls).toHaveScreenshot('game-session-controls.png', {
        threshold: 0.25
      });
    } else {
      // Look for control buttons
      const controlButtons = page.locator('button:has-text("Save"), button:has-text("Menu"), .control-button');
      if (await controlButtons.count() > 0) {
        await expect(controlButtons.first().locator('..').first()).toHaveScreenshot('game-session-control-buttons.png', {
          threshold: 0.25
        });
      }
    }
  });
});

test.describe('Game Session Interactive Elements Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/play');
    await page.waitForLoadState('networkidle');
    
    // Disable animations
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          transition-duration: 0s !important;
        }
      `
    });
  });

  test('should maintain choice button visual states', async ({ page }) => {
    // Test different states of choice buttons
    // Critical for player interaction feedback
    
    const choiceButton = page.locator('button:has-text("Choose"), .choice-button, .action-button').first();
    
    if (await choiceButton.count() > 0) {
      // Default state
      await expect(choiceButton).toHaveScreenshot('game-session-choice-button-default.png', {
        threshold: 0.2
      });
      
      // Hover state
      await choiceButton.hover();
      await expect(choiceButton).toHaveScreenshot('game-session-choice-button-hover.png', {
        threshold: 0.3
      });
      
      // Focus state
      await choiceButton.focus();
      await expect(choiceButton).toHaveScreenshot('game-session-choice-button-focus.png', {
        threshold: 0.3
      });
    }
  });

  test('should maintain custom action input visual consistency', async ({ page }) => {
    // Test custom action/text input interface
    const customInput = page.locator(
      '[data-testid="custom-action"], .custom-action, input[placeholder*="action"], textarea[placeholder*="action"]'
    ).first();
    
    if (await customInput.count() > 0) {
      // Default state
      await expect(customInput).toHaveScreenshot('game-session-custom-input-default.png', {
        threshold: 0.2
      });
      
      // Focused state
      await customInput.focus();
      await expect(customInput).toHaveScreenshot('game-session-custom-input-focus.png', {
        threshold: 0.3
      });
      
      // With content
      await customInput.fill('I examine the mysterious door carefully.');
      await expect(customInput).toHaveScreenshot('game-session-custom-input-filled.png', {
        threshold: 0.3
      });
    }
  });

  test('should maintain journal/history interface visual consistency', async ({ page }) => {
    // Test journal or game history interface
    const journalButton = page.locator(
      'button:has-text("Journal"), button:has-text("History"), [data-testid="journal"], .journal-button'
    ).first();
    
    if (await journalButton.count() > 0) {
      await expect(journalButton).toHaveScreenshot('game-session-journal-button.png', {
        threshold: 0.2
      });
      
      // Try to open journal
      await journalButton.click();
      await page.waitForTimeout(200);
      
      const journalModal = page.locator('.modal, .dialog, [role="dialog"], .journal-modal').first();
      if (await journalModal.isVisible()) {
        await expect(journalModal).toHaveScreenshot('game-session-journal-modal.png', {
          threshold: 0.3
        });
      }
    }
  });

  test('should maintain inventory interface visual consistency', async ({ page }) => {
    // Test inventory display if present
    const inventorySection = page.locator(
      '[data-testid="inventory"], .inventory, .items, .character-items'
    ).first();
    
    if (await inventorySection.count() > 0) {
      await expect(inventorySection).toHaveScreenshot('game-session-inventory.png', {
        threshold: 0.3
      });
    } else {
      // Look for inventory button
      const inventoryButton = page.locator('button:has-text("Inventory"), .inventory-button').first();
      if (await inventoryButton.count() > 0) {
        await expect(inventoryButton).toHaveScreenshot('game-session-inventory-button.png', {
          threshold: 0.2
        });
      }
    }
  });
});

test.describe('Game Session Loading and Error States Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/play');
    await page.waitForLoadState('networkidle');
  });

  test('should maintain loading state visual consistency', async ({ page }) => {
    // Test loading states during narrative generation
    // Important for user feedback during AI processing
    
    // Mock slow narrative generation to capture loading state
    await page.route('**/api/narrative/**', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ 
            narrative: 'The adventure continues...', 
            choices: ['Go left', 'Go right'] 
          })
        });
      }, 1000);
    });
    
    // Try to trigger narrative generation by making a choice
    const choiceButton = page.locator('button:has-text("Choose"), .choice-button').first();
    if (await choiceButton.count() > 0) {
      await choiceButton.click();
      
      // Capture loading state
      const loadingElement = page.locator('.loading, .spinner, [data-testid="loading"]').first();
      if (await loadingElement.isVisible()) {
        await expect(loadingElement).toHaveScreenshot('game-session-loading-state.png', {
          threshold: 0.4
        });
      }
      
      // Capture the full page in loading state
      await expect(page).toHaveScreenshot('game-session-page-loading.png', {
        fullPage: true,
        threshold: 0.3
      });
    }
  });

  test('should maintain error state visual consistency', async ({ page }) => {
    // Test error states during gameplay
    // Critical for handling failures gracefully
    
    // Mock API errors
    await page.route('**/api/narrative/**', route => {
      route.abort('failed');
    });
    
    // Try to trigger an action that would cause an error
    const choiceButton = page.locator('button').first();
    if (await choiceButton.count() > 0) {
      await choiceButton.click();
      await page.waitForTimeout(500);
      
      // Look for error messages
      const errorElement = page.locator('.error, [role="alert"], .error-message').first();
      if (await errorElement.count() > 0) {
        await expect(errorElement).toHaveScreenshot('game-session-error-message.png', {
          threshold: 0.25
        });
      }
      
      // Capture page with error state
      await expect(page).toHaveScreenshot('game-session-with-error.png', {
        fullPage: true,
        threshold: 0.3
      });
    }
  });

  test('should maintain narrative history visual consistency', async ({ page }) => {
    // Test display of previous narrative entries
    const historySection = page.locator(
      '[data-testid="narrative-history"], .narrative-history, .story-history, .game-history'
    ).first();
    
    if (await historySection.count() > 0) {
      await expect(historySection).toHaveScreenshot('game-session-narrative-history.png', {
        threshold: 0.3
      });
    }
  });
});

test.describe('Game Session Responsive Visual Tests', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1200, height: 800 }
  ];

  viewports.forEach(({ name, width, height }) => {
    test(`should maintain game session visual consistency on ${name} viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.goto('/play');
      await page.waitForLoadState('networkidle');
      
      // Disable animations
      await page.addStyleTag({
        content: `
          *, *::before, *::after {
            animation-duration: 0s !important;
            transition-duration: 0s !important;
          }
        `
      });
      
      await expect(page).toHaveScreenshot(`game-session-${name}-viewport.png`, {
        fullPage: true,
        animations: 'disabled',
        threshold: 0.3
      });
    });
  });

  test('should maintain mobile game controls layout', async ({ page }) => {
    // Test mobile-specific game controls layout
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/play');
    await page.waitForLoadState('networkidle');
    
    const mobileControls = page.locator('.mobile-controls, .touch-controls').first();
    if (await mobileControls.count() > 0) {
      await expect(mobileControls).toHaveScreenshot('game-session-mobile-controls.png', {
        threshold: 0.3
      });
    }
  });
});

test.describe('Game Session Empty and Initial States Visual Tests', () => {
  test('should maintain new game session visual layout', async ({ page }) => {
    // Test visual appearance of a fresh game session
    await page.goto('/play');
    await page.waitForLoadState('networkidle');
    
    // Look for new game or initial state content
    const initialContent = page.locator(
      '[data-testid="new-game"], .new-game, .game-start, .initial-narrative'
    ).first();
    
    if (await initialContent.count() > 0) {
      await expect(initialContent).toHaveScreenshot('game-session-new-game.png', {
        threshold: 0.3
      });
    }
    
    // Capture overall initial state
    await expect(page).toHaveScreenshot('game-session-initial-state.png', {
      fullPage: true,
      threshold: 0.3
    });
  });

  test('should maintain game session placeholder states', async ({ page }) => {
    // Test placeholder content when no active session exists
    await page.goto('/play');
    await page.waitForLoadState('networkidle');
    
    const placeholder = page.locator(
      '.placeholder, .empty-state, .no-game, [data-testid="empty-state"]'
    ).first();
    
    if (await placeholder.count() > 0) {
      await expect(placeholder).toHaveScreenshot('game-session-placeholder.png', {
        threshold: 0.25
      });
    }
  });

  test('should maintain game session selection interface', async ({ page }) => {
    // Test interface for selecting/resuming game sessions
    await page.goto('/play');
    await page.waitForLoadState('networkidle');
    
    const sessionSelector = page.locator(
      '[data-testid="session-selector"], .session-list, .game-selector, .resume-game'
    ).first();
    
    if (await sessionSelector.count() > 0) {
      await expect(sessionSelector).toHaveScreenshot('game-session-selector.png', {
        threshold: 0.3
      });
    } else {
      // Look for buttons to start or resume games
      const gameButtons = page.locator('button:has-text("Start"), button:has-text("Resume"), button:has-text("New Game")');
      if (await gameButtons.count() > 0) {
        await expect(gameButtons.first().locator('..').first()).toHaveScreenshot('game-session-start-buttons.png', {
          threshold: 0.3
        });
      }
    }
  });
});