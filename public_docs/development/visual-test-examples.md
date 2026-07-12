---
title: Visual Test Examples
tags: [examples, visual-testing, playwright, patterns]
created: 2025-08-20
updated: 2025-08-20
---

# Visual Test Examples

Practical, copy-and-paste examples for common visual testing scenarios in Narraitor. Each example includes the test code and explanation of when to use it.

## Basic Page Testing

### Simple Page Screenshot

Test the overall layout of a page:

```typescript
import { test, expect } from '@playwright/test';

// Helper function - copy this into all test files
async function waitForAppReady(page) {
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.waitForSelector('main', { timeout: 15000 });
  await page.waitForFunction(() => document.fonts.ready, { timeout: 10000 });
  await page.waitForTimeout(2000);
}

test('homepage layout', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);

  await expect(page).toHaveScreenshot('homepage-layout.png');
});
```

**When to use:** Testing overall page layout, navigation, and major structural elements.

### Full Page vs. Viewport

```typescript
test('full page content', async ({ page }) => {
  await page.goto('/long-page');
  await waitForAppReady(page);

  // Capture only what's visible in viewport
  await expect(page).toHaveScreenshot('page-viewport.png');

  // Capture entire scrollable page
  await expect(page).toHaveScreenshot('page-full.png', {
    fullPage: true
  });
});
```

**When to use:** When you need to test both above-the-fold content and full page layout.

## Component Testing

### Individual Component

Test a specific component in isolation:

```typescript
test('character card component', async ({ page }) => {
  await page.goto('/characters');
  await waitForAppReady(page);

  // Wait for character cards to load
  await page.waitForSelector('[data-testid="character-card"]');

  // Screenshot just the first character card
  const characterCard = page.locator('[data-testid="character-card"]').first();
  await expect(characterCard).toHaveScreenshot('character-card.png');
});
```

**When to use:** Testing individual components without surrounding page layout affecting the screenshot.

### Component with Multiple States

```typescript
test('button component states', async ({ page }) => {
  await page.goto('/dev/button-showcase'); // Use dev harness if available
  await waitForAppReady(page);

  const primaryButton = page.locator('[data-testid="primary-button"]');

  // Default state
  await expect(primaryButton).toHaveScreenshot('button-default.png');

  // Hover state
  await primaryButton.hover();
  await expect(primaryButton).toHaveScreenshot('button-hover.png');

  // Focus state
  await primaryButton.focus();
  await expect(primaryButton).toHaveScreenshot('button-focus.png');

  // Disabled state
  await page.locator('[data-testid="disable-button"]').click();
  await expect(primaryButton).toHaveScreenshot('button-disabled.png');
});
```

**When to use:** Testing interactive states and component variations.

## Form Testing

### Form States

```typescript
test('character creation form', async ({ page }) => {
  await page.goto('/characters/create');
  await waitForAppReady(page);

  // Empty form
  await expect(page).toHaveScreenshot('form-empty.png');

  // Fill form partially
  await page.fill('[name="name"]', 'Test Character');
  await page.selectOption('[name="class"]', 'warrior');
  await expect(page).toHaveScreenshot('form-partial.png');

  // Trigger validation error
  await page.fill('[name="name"]', ''); // Clear required field
  await page.click('[data-testid="submit"]');
  await page.waitForSelector('.error-message');
  await expect(page).toHaveScreenshot('form-validation-error.png');

  // Success state
  await page.fill('[name="name"]', 'Valid Character');
  await page.click('[data-testid="submit"]');
  await page.waitForSelector('.success-message');
  await expect(page).toHaveScreenshot('form-success.png');
});
```

**When to use:** Testing form validation, different states, and user feedback.

### Form with Dynamic Content

```typescript
test('world creation wizard', async ({ page }) => {
  await page.goto('/worlds/create');
  await waitForAppReady(page);

  // Step 1: Template selection
  await expect(page).toHaveScreenshot('wizard-step-1.png');

  // Select template and proceed
  await page.click('[data-testid="fantasy-template"]');
  await page.click('[data-testid="next-step"]');

  // Wait for step 2 to load
  await page.waitForSelector('[data-testid="attributes-step"]');
  await expect(page).toHaveScreenshot('wizard-step-2.png');

  // Add custom attribute
  await page.click('[data-testid="add-attribute"]');
  await page.waitForSelector('[data-testid="new-attribute-form"]');
  await expect(page).toHaveScreenshot('wizard-step-2-add-attribute.png');
});
```

**When to use:** Multi-step processes, wizards, or forms with conditional content.

## Responsive Testing

### Multiple Viewports

```typescript
const viewports = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
  { name: 'wide', width: 1920, height: 1080 }
];

viewports.forEach(({ name, width, height }) => {
  test(`homepage responsive - ${name}`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await waitForAppReady(page);

    await expect(page).toHaveScreenshot(`homepage-${name}.png`);
  });
});
```

**When to use:** Testing responsive breakpoints and mobile/tablet layouts.

### Navigation Menu Responsive Behavior

```typescript
test('navigation responsive behavior', async ({ page }) => {
  // Desktop - full navigation visible
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('/');
  await waitForAppReady(page);
  await expect(page.locator('nav')).toHaveScreenshot('nav-desktop.png');

  // Mobile - hamburger menu
  await page.setViewportSize({ width: 375, height: 667 });
  await expect(page.locator('nav')).toHaveScreenshot('nav-mobile-closed.png');

  // Mobile menu open
  await page.click('[data-testid="mobile-menu-button"]');
  await page.waitForSelector('[data-testid="mobile-menu"]');
  await expect(page.locator('nav')).toHaveScreenshot('nav-mobile-open.png');
});
```

**When to use:** Testing navigation patterns that change based on screen size.

## Dynamic Content Testing

### Loading States

```typescript
test('character list with loading states', async ({ page }) => {
  // Intercept API to control loading state
  await page.route('/api/characters', async route => {
    // Delay response to capture loading state
    await new Promise(resolve => setTimeout(resolve, 1000));
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        { id: '1', name: 'Test Character', class: 'warrior' }
      ])
    });
  });

  await page.goto('/characters');

  // Capture loading state
  await page.waitForSelector('[data-testid="loading-spinner"]');
  await expect(page).toHaveScreenshot('characters-loading.png');

  // Wait for content to load
  await page.waitForSelector('[data-testid="character-list"]');
  await expect(page).toHaveScreenshot('characters-loaded.png');
});
```

**When to use:** Testing loading states, empty states, and async content.

### Error States

```typescript
test('API error handling', async ({ page }) => {
  // Mock API failure
  await page.route('/api/characters', async route => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Server error' })
    });
  });

  await page.goto('/characters');
  await waitForAppReady(page);

  // Wait for error message to appear
  await page.waitForSelector('[data-testid="error-message"]');
  await expect(page).toHaveScreenshot('characters-error.png');
});
```

**When to use:** Testing error handling and fallback states.

## Game-Specific Testing

### Game Session Interface

```typescript
test('active game session', async ({ page }) => {
  // Use test harness for game states
  await page.goto('/dev/game-session');
  await waitForAppReady(page);

  // Start a test game
  await page.click('[data-testid="start-test-game"]');
  await page.waitForSelector('[data-testid="narrative-text"]');

  // Capture initial narrative
  await expect(page).toHaveScreenshot('game-session-initial.png');

  // Capture choices interface
  const choicesSection = page.locator('[data-testid="choices-section"]');
  await expect(choicesSection).toHaveScreenshot('game-choices.png');

  // Select a choice and capture result
  await page.click('[data-testid="choice-0"]');
  await page.waitForSelector('[data-testid="narrative-updated"]');
  await expect(page).toHaveScreenshot('game-session-after-choice.png');
});
```

**When to use:** Testing game-specific interfaces and interactive narratives.

### Journal Interface

```typescript
test('journal page states', async ({ page }) => {
  await page.goto('/worlds/world-cyberpunk-2077/play');
  await waitForAppReady(page);

  // Open journal from gameplay
  const journalButton = page.getByRole('button', { name: /open journal/i });
  await journalButton.click();
  await page.waitForURL('**/play/journal');

  // Journal page with entries
  await expect(page).toHaveScreenshot('journal-page.png');
});
```

**When to use:** Testing the dedicated journal page layout and entry states.

## Animation and Transition Testing

### Disabled Animations

```typescript
test('component transitions', async ({ page }) => {
  // Animations should be disabled by global config
  await page.goto('/components/animated-card');
  await waitForAppReady(page);

  const card = page.locator('[data-testid="animated-card"]');

  // Initial state
  await expect(card).toHaveScreenshot('card-initial.png');

  // Trigger transition
  await card.hover();
  // No need to wait for animation since they're disabled
  await expect(card).toHaveScreenshot('card-hover.png');

  // After click
  await card.click();
  await expect(card).toHaveScreenshot('card-clicked.png');
});
```

**When to use:** Testing components that normally have animations (which are disabled in tests).

### Stable State Testing

```typescript
test('stable state after interactions', async ({ page }) => {
  await page.goto('/interactive-demo');
  await waitForAppReady(page);

  // Perform multiple interactions
  await page.click('[data-testid="button-1"]');
  await page.fill('[data-testid="input-1"]', 'test value');
  await page.selectOption('[data-testid="select-1"]', 'option-2');

  // Wait for any state changes to complete
  await page.waitForTimeout(500);

  // Ensure UI is in stable state
  await page.waitForFunction(() => {
    const loadingElements = document.querySelectorAll('[data-loading="true"]');
    return loadingElements.length === 0;
  });

  await expect(page).toHaveScreenshot('interactive-final-state.png');
});
```

**When to use:** Testing final states after complex interactions.

## Cross-Browser Testing

### Browser-Specific Tests

```typescript
// This runs on all configured browsers
test('cross-browser compatibility', async ({ page, browserName }) => {
  await page.goto('/');
  await waitForAppReady(page);

  // Take screenshot with browser name in filename
  await expect(page).toHaveScreenshot(`homepage-${browserName}.png`);
});

// Browser-specific behavior
test('webkit-specific font rendering', async ({ page, browserName }) => {
  // Skip this test on other browsers
  test.skip(browserName !== 'webkit', 'WebKit-specific test');

  await page.goto('/typography');
  await waitForAppReady(page);

  await expect(page).toHaveScreenshot('webkit-fonts.png');
});
```

**When to use:** Testing browser-specific rendering differences or behaviors.

## Performance-Sensitive Testing

### Fast Component Screenshots

```typescript
test('lightweight component test', async ({ page }) => {
  await page.goto('/simple-component');

  // Minimal wait for simple components
  await page.waitForSelector('[data-testid="simple-component"]');

  // Screenshot just the component, not full page
  const component = page.locator('[data-testid="simple-component"]');
  await expect(component).toHaveScreenshot('simple-component.png');
});
```

**When to use:** Simple components that don't need full page loading.

### Selective Region Testing

```typescript
test('header component only', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);

  // Screenshot only the header region
  const header = page.locator('header');
  await expect(header).toHaveScreenshot('site-header.png');
});

test('main content area', async ({ page }) => {
  await page.goto('/');
  await waitForAppReady(page);

  // Screenshot main content, excluding header/footer
  const main = page.locator('main');
  await expect(main).toHaveScreenshot('main-content.png');
});
```

**When to use:** Testing specific page regions without capturing the entire page.

## Common Patterns and Helpers

### Reusable Helper Functions

```typescript
// test-helpers/visual-helpers.ts
export async function waitForAppReady(page) {
  await page.waitForLoadState('networkidle', { timeout: 30000 });
  await page.waitForSelector('main', { timeout: 15000 });
  await page.waitForFunction(() => document.fonts.ready, { timeout: 10000 });
  await page.waitForTimeout(2000);
}

export async function waitForModal(page, modalTestId) {
  await page.waitForSelector(`[data-testid="${modalTestId}"]`);
  await page.waitForTimeout(100); // Modal animation settling
}

export async function screenshotComponent(page, componentTestId, filename) {
  const component = page.locator(`[data-testid="${componentTestId}"]`);
  await expect(component).toHaveScreenshot(filename);
}

// Usage in tests:
import { waitForAppReady, screenshotComponent } from '../test-helpers/visual-helpers';

test('component with helper', async ({ page }) => {
  await page.goto('/page');
  await waitForAppReady(page);
  await screenshotComponent(page, 'my-component', 'component.png');
});
```

### Test Data Setup

```typescript
// Mock consistent test data
test('character list with test data', async ({ page }) => {
  // Set up consistent test data
  await page.route('/api/characters', async route => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([
        { id: '1', name: 'Warrior Character', class: 'warrior', level: 5 },
        { id: '2', name: 'Mage Character', class: 'mage', level: 3 },
        { id: '3', name: 'Rogue Character', class: 'rogue', level: 7 }
      ])
    });
  });

  await page.goto('/characters');
  await waitForAppReady(page);

  await expect(page).toHaveScreenshot('characters-test-data.png');
});
```

**When to use:** Ensuring consistent data across test runs for reliable screenshots.

## Testing Checklist

When creating visual tests, ensure:

- **Content is fully loaded** (use `waitForAppReady`)
- **Fonts are loaded** (included in `waitForAppReady`)
- **Animations are stable** (disabled in config)
- **Test data is consistent** (mock APIs if needed)
- **Screenshots are focused** (component vs full page)
- **Light and dark are covered** for user-facing surfaces where they render differently, or the spec documents why it is intentionally single-mode
- **Filenames are descriptive** (`component-state.png`)
- **Different states are tested** (default, hover, error, etc.)

## Related Documentation

- [Visual Regression Testing Guide](../development/visual-regression-testing.md) - Main developer guide
- [Visual Testing Workflow](../development/workflows/visual-testing-workflow.md) - Process documentation
- [Playwright Visual API Reference](../api/playwright-visual-api.md) - Technical API reference
