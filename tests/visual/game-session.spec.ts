import { test, expect } from '@playwright/test';
import {
  hideDynamicContent,
  expandAllCollapsibleSections,
  waitForImagesLoaded,
  waitForStableScrollHeight,
} from './utils/wait-helpers';
import { seedTestData } from './utils/seedTestData';
import { mockApiEndpoints } from './utils/mockApi';
import {
  renderSeededSuggestedActions,
  seedInventoryItemsForVisual,
  removeDuplicateSuggestedActionsTextarea,
  seedStorySummaryForVisual,
} from './utils/game-session-page-seeder';

/**
 * DS coverage (#1264): single-theme (default DS1). The play surface is covered
 * across DS1/DS2/DS3 by tests/visual/session-themes.spec.ts (scene status +
 * per-theme layout geometry) and tests/visual/design-system-session.spec.ts (the
 * real ManuscriptSessionShell per theme). This spec focuses on populated gameplay
 * content (history, HUD, choices, inventory, summary) rather than theme layout.
 */

/**
 * Game Session Visual Regression Tests
 * 
 * Tests the active gameplay interface including session management,
 * narrative display, and player choice interactions.
 */

test.describe('Game Session Visual Tests', () => {
  test('Game session page should render consistently', async ({ page }) => {
    await seedTestData(page);
    await mockApiEndpoints(page);
    
    // Navigate to the cyberpunk world's play page
    await page.goto('/worlds/world-cyberpunk-2077/play');
    
    // Wait for page to load
    try {
      await page.waitForLoadState('networkidle', { timeout: 5000 });
    } catch {
      // Continue if network doesn't idle
    }
    
    // Debug: Check what data is actually seeded
    const sessionData = await page.evaluate(() => {
      const storage = localStorage.getItem('narraitor-session-store');
      const narrative = localStorage.getItem('narraitor-narrative-store');
      return {
        sessionStore: storage ? JSON.parse(storage) : null,
        narrativeStore: narrative ? JSON.parse(narrative) : null,
      };
    });
    console.log('📊 Seeded session data:', sessionData?.sessionStore?.state?.currentSessionId);
    console.log('📊 Seeded narrative segments:', Object.keys(sessionData?.narrativeStore?.state?.segments || {}));
    
    // Debug: Log the actual segment content that should be rendered
    const segments = sessionData?.narrativeStore?.state?.segments || {};
    const sessionSegments = sessionData?.narrativeStore?.state?.sessionSegments || {};
    const currentSessionSegments = sessionSegments[sessionData?.sessionStore?.state?.currentSessionId || ''] || [];
    console.log('📖 Current session segments:', currentSessionSegments);
    currentSessionSegments.forEach((segId: string) => {
      const segment = segments[segId];
      if (segment) {
        console.log(`📖 Segment ${segId}: "${segment.content?.substring(0, 50)}..."`);
      }
    });
    
    // Give page time to load and use seeded data
    await page.waitForTimeout(3000);
    
    // Check if there's already an active session
    const hasActiveSession = await page.locator('[data-testid="manuscript-session-shell"]').count() > 0;
    console.log('🎮 Has active session:', hasActiveSession);
    
    // Debug: Check the actual session state stored in the stores
    const sessionStateDebug = await page.evaluate(() => {
      const sessionStorage = localStorage.getItem('narraitor-session-store');
      const narrativeStorage = localStorage.getItem('narraitor-narrative-store');
      
      const sessionState = sessionStorage ? JSON.parse(sessionStorage) : null;
      const narrativeState = narrativeStorage ? JSON.parse(narrativeStorage) : null;
      
      return {
        sessionStatus: sessionState?.state?.status,
        currentSessionId: sessionState?.state?.currentSessionId,
        sessionId: sessionState?.state?.id,
        worldId: sessionState?.state?.worldId,
        characterId: sessionState?.state?.characterId,
        narrativeSegmentCount: narrativeState?.state ? Object.keys(narrativeState.state.segments).length : 0,
        sessionSegments: narrativeState?.state?.sessionSegments?.[sessionState?.state?.currentSessionId || '']?.length || 0
      };
    });
    console.log('🔍 Session state debug:', sessionStateDebug);
    
    // Debug: Check what the narrative store's getSessionSegments returns
    const narrativeStoreDebug = await page.evaluate(() => {
      const narrativeStorage = localStorage.getItem('narraitor-narrative-store');
      const narrativeState = narrativeStorage ? JSON.parse(narrativeStorage) : null;
      const sessionId = 'session-cyberpunk-ghost';
      
      if (!narrativeState?.state) return 'No narrative state found';
      
      // Simulate what getSessionSegments does
      const segmentIds = narrativeState.state.sessionSegments?.[sessionId] || [];
      const segments = segmentIds.map((id: string) => narrativeState.state.segments[id]).filter(Boolean);
      
      return {
        segmentIdsForSession: segmentIds,
        segmentCount: segments.length,
        segmentContents: segments.map((s: any) => s.content.substring(0, 30) + '...')
      };
    });
    console.log('📖 Narrative store getSessionSegments simulation:', narrativeStoreDebug);
    
    // With properly seeded data, we should already have an active session
    // DO NOT click Start Session as this triggers new AI generation and overwrites seeded content
    if (!hasActiveSession) {
      console.log('❌ Expected active session from seeded data but none found');
      // This suggests the seeding didn't work properly
    } else {
      console.log('✅ Using existing seeded session - not triggering new generation');
    }
    
    // Final wait for content to stabilize (including NarrativeHistoryManager's 100ms timer)
    await page.waitForTimeout(2000);
    
    // Wait for NarrativeHistoryManager to finish loading
    try {
      await page.waitForFunction(
        () => {
          const loadingElements = document.querySelectorAll('.loading, [data-testid="loading"], [aria-label="Loading"]');
          return loadingElements.length === 0;
        },
        { timeout: 5000 }
      );
      console.log('✅ NarrativeHistoryManager finished loading');
    } catch {
      console.log('⏰ NarrativeHistoryManager still loading after 5s timeout');
    }
    
    // Debug: Check what narrative content is actually rendered on the page
    const renderedContent = await page.evaluate(() => {
      const narrativeElements = document.querySelectorAll('.narrative-content, .narrative-segment, [data-testid="narrative-segment"]');
      return Array.from(narrativeElements).map(el => el.textContent?.substring(0, 50));
    });
    console.log('🎭 Rendered narrative content:', renderedContent);
    
    // Debug: Check if NarrativeHistoryManager is present and its loading state
    const historyManagerDebug = await page.evaluate(() => {
      const manager = document.querySelector('.narrative-history-manager, .narrative-history, [data-testid="narrative-history"]');
      if (!manager) return 'NarrativeHistoryManager not found';
      
      // Check for loading indicators
      const loadingIndicators = document.querySelectorAll('.loading, [data-testid="loading"], [aria-label="Loading"]');
      const isShowingLoading = loadingIndicators.length > 0;
      
      return {
        found: 'Found NarrativeHistoryManager',
        isShowingLoading,
        loadingElementCount: loadingIndicators.length
      };
    });
    console.log('📚 NarrativeHistoryManager debug:', historyManagerDebug);
    
    // Debug: Check what game session components are present
    const gameSessionComponents = await page.evaluate(() => {
      const components = {
        active: document.querySelector('[data-testid="manuscript-session-shell"]') ? 'FOUND' : 'NOT FOUND',
        rail: document.querySelector('[data-testid="manuscript-decision-block"]') ? 'FOUND' : 'NOT FOUND',
        hud: document.querySelector('[data-testid="manuscript-floating-hud"]') ? 'FOUND' : 'NOT FOUND',
        loading: document.querySelector('[data-testid="game-session-loading"]') ? 'FOUND' : 'NOT FOUND',
        resume: document.querySelector('[data-testid="game-session-resume"]') ? 'FOUND' : 'NOT FOUND',
        error: document.querySelector('[data-testid="game-session-error"]') ? 'FOUND' : 'NOT FOUND'
      };
      return components;
    });
    console.log('🎮 Game session components:', gameSessionComponents);
    
    // Wait for the real React components to render with seeded data
    await page.waitForSelector('[data-testid="manuscript-session-shell"]', { timeout: 10000 });
    console.log('✅ ManuscriptSessionShell component loaded');

    // Wait for Zustand stores to fully hydrate from localStorage
    await page.waitForFunction(
      () => {
        const narrativeStorage = localStorage.getItem('narraitor-narrative-store');
        const sessionStorage = localStorage.getItem('narraitor-session-store');
        if (!narrativeStorage || !sessionStorage) return false;

        try {
          const narrativeState = JSON.parse(narrativeStorage);
          const sessionState = JSON.parse(sessionStorage);

          // Check that we have the expected seeded segments
          const segments = narrativeState?.state?.segments || {};
          const sessionSegments = narrativeState?.state?.sessionSegments || {};
          const currentSessionId = sessionState?.state?.currentSessionId;

          const expectedSegments = ['segment-cyberpunk-1', 'segment-cyberpunk-2', 'segment-cyberpunk-3', 'segment-cyberpunk-4'];
          const hasAllSegments = expectedSegments.every(id => segments[id]);
          const hasSessionMapping = sessionSegments[currentSessionId]?.length >= 4;

          return hasAllSegments && hasSessionMapping;
        } catch {
          return false;
        }
      },
      { timeout: 10000 }
    );
    console.log('✅ Zustand stores hydrated with seeded data');

    // Wait for narrative content to render through the real NarrativeHistoryManager
    await page.waitForSelector('.narrative-segment', { timeout: 5000 });
    console.log('✅ Narrative segments rendered by real components');

    // Force the stores to refresh and React components to re-render
    await page.evaluate(() => {
      // Force Zustand stores to re-read from localStorage and notify subscribers
      try {
        if ((window as any).useNarrativeStore) {
          const store = (window as any).useNarrativeStore;
          store.persist.rehydrate();
        }
        if ((window as any).useSessionStore) {
          const store = (window as any).useSessionStore;
          store.persist.rehydrate();
        }
      } catch {
        console.log('Store rehydration not available, using fallback...');
      }

      window.dispatchEvent(new Event('storage'));
    });

    // Wait for components to re-render with fresh store data
    await page.waitForTimeout(2000);

    // Wait for narrative segments — must render before seeding so
    // seedInventoryItemsForVisual sees them and preserves them deterministically.
    await page.waitForFunction(
      () => {
        const segments = document.querySelectorAll('.narrative-segment');
        return segments.length >= 2;
      },
      { timeout: 10000 }
    );

    await renderSeededSuggestedActions(page);
    await seedInventoryItemsForVisual(page);
    await seedStorySummaryForVisual(page);
    await expandAllCollapsibleSections(page);

    await page.waitForSelector('[data-testid^="choice-option-"]', {
      state: 'visible',
      timeout: 2000,
    });

    await removeDuplicateSuggestedActionsTextarea(page);

    await waitForImagesLoaded(page);
    await waitForStableScrollHeight(page, { timeout: 8000, stableDuration: 500 });
    await page.waitForTimeout(200); // Wait for layout to adjust

    await hideDynamicContent(page);

    // Take screenshot of game session page
    await expect(page).toHaveScreenshot('game-session.png', {
      fullPage: true,
      threshold: 0.3,
      timeout: 10000,
    });
  });

});
