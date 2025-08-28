/**
 * DevTools Integration Tests for AI Mocking Section
 * Issue #156: These tests verify AI mocking section appears in DevTools and integrates properly
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DevToolsPanel } from '../DevToolsPanel/DevToolsPanel';
import { DevToolsProvider } from '../DevToolsContext';
import { DevToolsSection } from '@/lib/devtools/sectionVisibilityStorage';

// Mock the section visibility storage
jest.mock('@/lib/devtools/sectionVisibilityStorage', () => {
  const originalModule = jest.requireActual('@/lib/devtools/sectionVisibilityStorage');
  return {
    ...originalModule,
    loadSectionVisibility: jest.fn(() => ({
      [originalModule.DevToolsSection.AI_MOCKING]: true,
      [originalModule.DevToolsSection.AI_TESTING]: true,
      [originalModule.DevToolsSection.STATE_SECTION]: true,
      [originalModule.DevToolsSection.ERROR_SECTION]: true
    })),
    saveSectionVisibility: jest.fn(),
    isSectionVisible: jest.fn((sectionId, visibility) => {
      return visibility[sectionId] ?? true;
    })
  };
});

// Mock the AIMockingSection component that should be integrated
jest.mock('../AIMockingSection', () => ({
  AIMockingSection: () => (
    <div data-testid="ai-mocking-section">
      <h3>AI Response Mocking</h3>
      <button data-testid="mock-mode-toggle">Toggle Mock Mode</button>
      <select data-testid="scenario-selector">
        <option value="">Select Scenario</option>
        <option value="success-fast">Fast Success</option>
        <option value="error-timeout">Timeout Error</option>
      </select>
    </div>
  )
}));

// Mock the client factory integration
jest.mock('@/lib/ai/clientFactory', () => ({
  createAIClient: jest.fn(() => ({
    generateContent: jest.fn().mockResolvedValue({
      content: 'Mock response content',
      finishReason: 'STOP'
    }),
    generateImage: jest.fn()
  })),
  setMockMode: jest.fn(),
  getMockMode: jest.fn(() => 'live')
}));

describe('DevTools AI Mocking Integration', () => {
  let user: any;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    
    // Mock development environment
    process.env.NODE_ENV = 'development';
  });

  const renderDevToolsPanel = (initialOpen = true) => {
    return render(
      <DevToolsProvider initialIsOpen={initialOpen}>
        <DevToolsPanel />
      </DevToolsProvider>
    );
  };

  describe('AI Mocking Section Visibility', () => {
    test('AI Mocking section appears in DevTools when enabled', async () => {
      renderDevToolsPanel();
      
      // DevTools should be open and show AI Mocking section
      expect(screen.getByTestId('devtools-panel-container')).toBeInTheDocument();
      
      // AI Tools group should be visible
      expect(screen.getByText(/ai tools.*validation/i)).toBeInTheDocument();
      
      // AI Mocking section should be present within the AI Tools group
      await waitFor(() => {
        expect(screen.getByTestId('ai-mocking-section')).toBeInTheDocument();
      });
    });

    test('AI Mocking section can be toggled via visibility controls', async () => {
      const { loadSectionVisibility, saveSectionVisibility } = require('@/lib/devtools/sectionVisibilityStorage');
      
      // Start with AI Mocking enabled
      loadSectionVisibility.mockReturnValue({
        [DevToolsSection.AI_MOCKING]: true
      });
      
      renderDevToolsPanel();
      
      // Should show AI Mocking section
      expect(screen.getByTestId('ai-mocking-section')).toBeInTheDocument();
      
      // Find and click the visibility toggle for AI Mocking
      const visibilityControls = screen.getByTestId('section-visibility-controls');
      const aiMockingToggle = screen.getByTestId('toggle-ai-mocking-section');
      
      await user.click(aiMockingToggle);
      
      // Should call save with updated visibility
      expect(saveSectionVisibility).toHaveBeenCalledWith(
        expect.objectContaining({
          [DevToolsSection.AI_MOCKING]: false
        })
      );
    });

    test('AI Mocking section is hidden when visibility is disabled', () => {
      const { loadSectionVisibility } = require('@/lib/devtools/sectionVisibilityStorage');
      
      // Set AI Mocking as disabled
      loadSectionVisibility.mockReturnValue({
        [DevToolsSection.AI_MOCKING]: false,
        [DevToolsSection.AI_TESTING]: true
      });
      
      renderDevToolsPanel();
      
      // Should not show AI Mocking section
      expect(screen.queryByTestId('ai-mocking-section')).not.toBeInTheDocument();
      
      // But other AI sections should still be visible
      expect(screen.getByText(/ai testing/i)).toBeInTheDocument();
    });
  });

  describe('AI Tools Group Integration', () => {
    test('AI Mocking section appears within AI Tools group', () => {
      renderDevToolsPanel();
      
      // Find the AI Tools group
      const aiToolsGroup = screen.getByText(/ai tools.*validation/i).closest('[class*="bg-slate-700"]');
      expect(aiToolsGroup).toBeInTheDocument();
      
      // AI Mocking section should be within this group
      const aiMockingSection = screen.getByTestId('ai-mocking-section');
      expect(aiToolsGroup).toContainElement(aiMockingSection);
    });

    test('AI Tools group is hidden when all child sections are disabled', () => {
      const { loadSectionVisibility } = require('@/lib/devtools/sectionVisibilityStorage');
      
      // Disable all AI-related sections
      loadSectionVisibility.mockReturnValue({
        [DevToolsSection.AI_MOCKING]: false,
        [DevToolsSection.AI_TESTING]: false,
        [DevToolsSection.AI_MONITORING]: false,
        [DevToolsSection.CONSISTENCY_VALIDATION]: false,
        [DevToolsSection.TEXT_NORMALIZATION]: false,
        [DevToolsSection.LORE_MANAGEMENT]: false,
        [DevToolsSection.STATE_SECTION]: true // Keep other sections
      });
      
      renderDevToolsPanel();
      
      // AI Tools group should not be visible
      expect(screen.queryByText(/ai tools.*validation/i)).not.toBeInTheDocument();
      
      // But other groups should still be visible
      expect(screen.getByText(/state management/i)).toBeInTheDocument();
    });

    test('AI Mocking section is properly positioned within group', () => {
      renderDevToolsPanel();
      
      const aiToolsGroup = screen.getByText(/ai tools.*validation/i).closest('[class*="bg-slate-700"]');
      const sections = aiToolsGroup?.querySelectorAll('[data-testid*="-section"], [class*="CollapsibleSection"]');
      
      // Should have multiple AI sections with AI Mocking being one of them
      expect(sections?.length).toBeGreaterThan(0);
      expect(screen.getByTestId('ai-mocking-section')).toBeInTheDocument();
    });
  });

  describe('DevTools Panel Integration', () => {
    test('AI Mocking functionality works when DevTools is collapsed and expanded', async () => {
      renderDevToolsPanel(false); // Start collapsed
      
      // Should not see AI Mocking when collapsed
      expect(screen.queryByTestId('ai-mocking-section')).not.toBeInTheDocument();
      
      // Expand DevTools
      const toggleButton = screen.getByTestId('devtools-panel-toggle');
      await user.click(toggleButton);
      
      // Should now see AI Mocking section
      await waitFor(() => {
        expect(screen.getByTestId('ai-mocking-section')).toBeInTheDocument();
      });
      
      // Should be able to interact with mock controls
      const mockToggle = screen.getByTestId('mock-mode-toggle');
      expect(mockToggle).toBeInTheDocument();
      
      await user.click(mockToggle);
      // Mock toggle should work (tested in component-specific tests)
    });

    test('AI Mocking section preserves state across DevTools open/close cycles', async () => {
      renderDevToolsPanel(true);
      
      // Interact with AI Mocking controls
      const scenarioSelector = screen.getByTestId('scenario-selector');
      await user.selectOptions(scenarioSelector, 'success-fast');
      
      // Close DevTools
      const toggleButton = screen.getByTestId('devtools-panel-toggle');
      await user.click(toggleButton);
      
      // Reopen DevTools
      await user.click(toggleButton);
      
      // State should be preserved
      await waitFor(() => {
        const newScenarioSelector = screen.getByTestId('scenario-selector');
        expect(newScenarioSelector).toHaveValue('success-fast');
      });
    });
  });

  describe('Environment Constraints', () => {
    test('AI Mocking section only appears in development environment', () => {
      // Test in production environment
      process.env.NODE_ENV = 'production';
      
      renderDevToolsPanel();
      
      // DevTools panel should not render at all in production
      expect(screen.queryByTestId('devtools-panel-container')).not.toBeInTheDocument();
    });

    test('AI Mocking section appears on test pages regardless of environment', () => {
      process.env.NODE_ENV = 'production';
      
      // Mock test page location
      delete (window as any).location;
      (window as any).location = { pathname: '/dev/devtools-test' };
      
      renderDevToolsPanel();
      
      // Should render on test page even in production
      expect(screen.getByTestId('devtools-panel-container')).toBeInTheDocument();
      expect(screen.getByText(/test page mode/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('DevTools continues functioning when AI Mocking section fails to load', () => {
      // Mock AIMockingSection to throw error
      jest.doMock('../AIMockingSection', () => ({
        AIMockingSection: () => {
          throw new Error('AI Mocking section failed to load');
        }
      }));
      
      // Should not crash the entire DevTools panel
      expect(() => {
        renderDevToolsPanel();
      }).not.toThrow();
      
      // Other sections should still be available
      expect(screen.getByTestId('devtools-panel-container')).toBeInTheDocument();
      expect(screen.getByText(/state management/i)).toBeInTheDocument();
    });

    test('handles storage errors gracefully when managing AI Mocking visibility', async () => {
      const { saveSectionVisibility } = require('@/lib/devtools/sectionVisibilityStorage');
      
      // Mock storage error
      saveSectionVisibility.mockImplementationOnce(() => {
        throw new Error('Storage quota exceeded');
      });
      
      renderDevToolsPanel();
      
      // Try to toggle visibility
      const visibilityToggle = screen.getByTestId('toggle-ai-mocking-section');
      
      // Should not crash when storage fails
      expect(() => {
        fireEvent.click(visibilityToggle);
      }).not.toThrow();
      
      // Section should still be functional
      expect(screen.getByTestId('ai-mocking-section')).toBeInTheDocument();
    });
  });

  describe('Accessibility Integration', () => {
    test('AI Mocking section maintains accessibility within DevTools', () => {
      renderDevToolsPanel();
      
      // AI Tools group should have proper heading structure
      const aiToolsHeading = screen.getByText(/ai tools.*validation/i);
      expect(aiToolsHeading.tagName).toBe('H3');
      
      // AI Mocking section should be keyboard accessible
      const mockToggle = screen.getByTestId('mock-mode-toggle');
      expect(mockToggle).toBeEnabled();
      expect(mockToggle.tagName).toBe('BUTTON');
      
      const scenarioSelector = screen.getByTestId('scenario-selector');
      expect(scenarioSelector.tagName).toBe('SELECT');
    });

    test('DevTools keyboard navigation includes AI Mocking section', async () => {
      renderDevToolsPanel();
      
      // Should be able to tab to AI Mocking controls
      const mockToggle = screen.getByTestId('mock-mode-toggle');
      mockToggle.focus();
      
      expect(document.activeElement).toBe(mockToggle);
      
      // Tab should move to scenario selector
      await user.tab();
      const scenarioSelector = screen.getByTestId('scenario-selector');
      expect(document.activeElement).toBe(scenarioSelector);
    });
  });
});