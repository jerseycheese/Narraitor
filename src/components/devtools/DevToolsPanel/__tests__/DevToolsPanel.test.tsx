/**
 * Tests for DevToolsPanel component visibility controls
 * Issue #147: Individual debugging components can be toggled visible/hidden within the DevTools panel
 */

import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { DevToolsPanel } from '../DevToolsPanel';
import { DevToolsProvider } from '../../DevToolsContext';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Mock the child components to focus on panel logic
jest.mock('../../StateSection', () => ({
  StateSection: ({ visible }: { visible?: boolean }) => 
    visible !== false ? <div data-testid="state-section">State Section</div> : null,
  StateInspectorSection: ({ visible }: { visible?: boolean }) => 
    visible !== false ? <div data-testid="state-inspector-section">State Inspector</div> : null,
}));

jest.mock('../../AITestingPanel', () => ({
  AITestingPanel: ({ visible }: { visible?: boolean }) => 
    visible !== false ? <div data-testid="ai-testing-panel">AI Testing Panel</div> : null,
}));

jest.mock('../../CollapsibleSection', () => ({
  CollapsibleSection: ({ title, children, visible }: { title: string; children: React.ReactNode; visible?: boolean }) => 
    visible !== false ? (
      <div data-testid={`collapsible-${title.toLowerCase().replace(/\s+/g, '-')}`}>
        <div>{title}</div>
        {children}
      </div>
    ) : null,
}));

jest.mock('../../TestDataGeneratorSection', () => ({
  TestDataGeneratorSection: ({ visible }: { visible?: boolean }) => 
    visible !== false ? <div data-testid="test-data-generator">Test Data Generator</div> : null,
}));

jest.mock('../../PortraitDebugSection', () => ({
  PortraitDebugSection: ({ visible }: { visible?: boolean }) => 
    visible !== false ? <div data-testid="portrait-debug">Portrait Debug</div> : null,
}));

jest.mock('../../EndingImageDebugSection', () => ({
  EndingImageDebugSection: ({ visible }: { visible?: boolean }) => 
    visible !== false ? <div data-testid="ending-image-debug">Ending Image Debug</div> : null,
}));

jest.mock('../../ConsistencyValidationSection', () => ({
  ConsistencyValidationSection: ({ visible }: { visible?: boolean }) => 
    visible !== false ? <div data-testid="consistency-validation">Consistency Validation</div> : null,
}));

jest.mock('../../TextNormalizationSection', () => ({
  TextNormalizationSection: ({ visible }: { visible?: boolean }) => 
    visible !== false ? <div data-testid="text-normalization">Text Normalization</div> : null,
}));

jest.mock('../../LoreManagementSection', () => ({
  LoreManagementSection: ({ visible }: { visible?: boolean }) => 
    visible !== false ? <div data-testid="lore-management">Lore Management</div> : null,
}));

describe('DevToolsPanel - Component Visibility Controls', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set NODE_ENV to development for these tests
    process.env.NODE_ENV = 'development';
    // Mock window.location
    Object.defineProperty(window, 'location', {
      value: { pathname: '/test' },
      writable: true,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Panel Header Visibility Controls', () => {
    test('displays visibility toggle controls in panel header when open', () => {
      render(
        <DevToolsProvider initialIsOpen={true}>
          <DevToolsPanel />
        </DevToolsProvider>
      );

      // Panel should be open
      expect(screen.getByTestId('devtools-panel-content')).toBeInTheDocument();

      // Header should contain visibility controls
      const header = screen.getByTestId('devtools-panel-header');
      expect(within(header).getByTestId('section-visibility-controls')).toBeInTheDocument();
    });

    test('visibility controls include dropdown menu with all sections', () => {
      render(
        <DevToolsProvider initialIsOpen={true}>
          <DevToolsPanel />
        </DevToolsProvider>
      );

      // Open visibility controls dropdown
      fireEvent.click(screen.getByTestId('visibility-controls-dropdown'));

      // Should show toggles for all major sections
      expect(screen.getByTestId('toggle-state-section')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-ai-testing')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-test-data-generator')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-portrait-debug')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-ending-image-debug')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-consistency-validation')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-text-normalization')).toBeInTheDocument();
      expect(screen.getByTestId('toggle-lore-management')).toBeInTheDocument();
    });

    test('visibility controls show current state of each section', () => {
      render(
        <DevToolsProvider 
          initialIsOpen={true}
          initialSectionVisibility={{
            stateSection: false,
            aiTestingPanel: true,
          }}
        >
          <DevToolsPanel />
        </DevToolsProvider>
      );

      // Open visibility controls
      fireEvent.click(screen.getByTestId('visibility-controls-dropdown'));

      // Should show current visibility state
      const stateToggle = screen.getByTestId('toggle-state-section');
      const aiToggle = screen.getByTestId('toggle-ai-testing');

      expect(stateToggle).toHaveAttribute('aria-checked', 'false');
      expect(aiToggle).toHaveAttribute('aria-checked', 'true');
    });

    test('visibility controls are not visible when panel is closed', () => {
      render(
        <DevToolsProvider initialIsOpen={false}>
          <DevToolsPanel />
        </DevToolsProvider>
      );

      // Panel content should not be visible
      expect(screen.queryByTestId('devtools-panel-content')).not.toBeInTheDocument();
      
      // Visibility controls should not be accessible
      expect(screen.queryByTestId('section-visibility-controls')).not.toBeInTheDocument();
    });
  });

  describe('Section Conditional Rendering', () => {
    test('renders all sections when visible by default', () => {
      render(
        <DevToolsProvider initialIsOpen={true}>
          <DevToolsPanel />
        </DevToolsProvider>
      );

      // All sections should be rendered
      expect(screen.getByTestId('state-section')).toBeInTheDocument();
      expect(screen.getByTestId('state-inspector-section')).toBeInTheDocument();
      expect(screen.getByTestId('ai-testing-panel')).toBeInTheDocument();
      expect(screen.getByTestId('test-data-generator')).toBeInTheDocument();
      expect(screen.getByTestId('portrait-debug')).toBeInTheDocument();
      expect(screen.getByTestId('ending-image-debug')).toBeInTheDocument();
      expect(screen.getByTestId('consistency-validation')).toBeInTheDocument();
      expect(screen.getByTestId('text-normalization')).toBeInTheDocument();
      expect(screen.getByTestId('lore-management')).toBeInTheDocument();
    });

    test('hides sections when visibility is set to false', () => {
      render(
        <DevToolsProvider 
          initialIsOpen={true}
          initialSectionVisibility={{
            stateSection: false,
            aiTestingPanel: false,
            testDataGenerator: false,
          }}
        >
          <DevToolsPanel />
        </DevToolsProvider>
      );

      // Hidden sections should not be rendered
      expect(screen.queryByTestId('state-section')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ai-testing-panel')).not.toBeInTheDocument();
      expect(screen.queryByTestId('test-data-generator')).not.toBeInTheDocument();

      // Visible sections should still be rendered
      expect(screen.getByTestId('state-inspector-section')).toBeInTheDocument();
      expect(screen.getByTestId('portrait-debug')).toBeInTheDocument();
    });

    test('toggles section visibility through header controls', () => {
      render(
        <DevToolsProvider initialIsOpen={true}>
          <DevToolsPanel />
        </DevToolsProvider>
      );

      // Initially visible
      expect(screen.getByTestId('state-section')).toBeInTheDocument();

      // Open visibility controls and toggle
      fireEvent.click(screen.getByTestId('visibility-controls-dropdown'));
      fireEvent.click(screen.getByTestId('toggle-state-section'));

      // Section should now be hidden
      expect(screen.queryByTestId('state-section')).not.toBeInTheDocument();

      // Toggle back
      fireEvent.click(screen.getByTestId('toggle-state-section'));

      // Section should be visible again
      expect(screen.getByTestId('state-section')).toBeInTheDocument();
    });

    test('preserves section group structure when some sections are hidden', () => {
      render(
        <DevToolsProvider 
          initialIsOpen={true}
          initialSectionVisibility={{
            stateSection: false,
            // Keep state inspector visible
            stateInspectorSection: true,
          }}
        >
          <DevToolsPanel />
        </DevToolsProvider>
      );

      // State Management group should still be rendered
      expect(screen.getByText('State Management')).toBeInTheDocument();
      
      // But only visible sections within it
      expect(screen.queryByTestId('state-section')).not.toBeInTheDocument();
      expect(screen.getByTestId('state-inspector-section')).toBeInTheDocument();
    });

    test('hides entire section groups when all child sections are hidden', () => {
      render(
        <DevToolsProvider 
          initialIsOpen={true}
          initialSectionVisibility={{
            stateSection: false,
            stateInspectorSection: false,
          }}
        >
          <DevToolsPanel />
        </DevToolsProvider>
      );

      // State Management group should be hidden when all children are hidden
      expect(screen.queryByText('State Management')).not.toBeInTheDocument();
      
      // But other groups should still be visible
      expect(screen.getByText('AI Tools & Validation')).toBeInTheDocument();
    });
  });

  describe('Persistence Integration', () => {
    test('section visibility changes are saved to localStorage', () => {
      render(
        <DevToolsProvider initialIsOpen={true}>
          <DevToolsPanel />
        </DevToolsProvider>
      );

      // Toggle a section
      fireEvent.click(screen.getByTestId('visibility-controls-dropdown'));
      fireEvent.click(screen.getByTestId('toggle-state-section'));

      // Should save to localStorage
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'narraitor-devtools-section-visibility',
        expect.stringContaining('"stateSection":false')
      );
    });

    test('restores section visibility from localStorage on mount', () => {
      // Mock localStorage to return saved state
      mockLocalStorage.getItem.mockReturnValue(
        JSON.stringify({
          stateSection: false,
          aiTestingPanel: false,
        })
      );

      render(
        <DevToolsProvider initialIsOpen={true}>
          <DevToolsPanel />
        </DevToolsProvider>
      );

      // Should restore visibility from localStorage
      expect(screen.queryByTestId('state-section')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ai-testing-panel')).not.toBeInTheDocument();
      
      // Other sections should still be visible
      expect(screen.getByTestId('state-inspector-section')).toBeInTheDocument();
    });
  });

  describe('Show/Hide All Functionality', () => {
    test('provides show all sections button', () => {
      render(
        <DevToolsProvider 
          initialIsOpen={true}
          initialSectionVisibility={{
            stateSection: false,
            aiTestingPanel: false,
          }}
        >
          <DevToolsPanel />
        </DevToolsProvider>
      );

      // Open visibility controls
      fireEvent.click(screen.getByTestId('visibility-controls-dropdown'));

      // Should have show all button
      expect(screen.getByTestId('show-all-sections')).toBeInTheDocument();

      // Click show all
      fireEvent.click(screen.getByTestId('show-all-sections'));

      // All sections should now be visible
      expect(screen.getByTestId('state-section')).toBeInTheDocument();
      expect(screen.getByTestId('ai-testing-panel')).toBeInTheDocument();
    });

    test('provides hide all sections button', () => {
      render(
        <DevToolsProvider initialIsOpen={true}>
          <DevToolsPanel />
        </DevToolsProvider>
      );

      // Open visibility controls
      fireEvent.click(screen.getByTestId('visibility-controls-dropdown'));

      // Should have hide all button
      expect(screen.getByTestId('hide-all-sections')).toBeInTheDocument();

      // Click hide all
      fireEvent.click(screen.getByTestId('hide-all-sections'));

      // All sections should now be hidden
      expect(screen.queryByTestId('state-section')).not.toBeInTheDocument();
      expect(screen.queryByTestId('ai-testing-panel')).not.toBeInTheDocument();
      expect(screen.queryByTestId('test-data-generator')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('visibility controls have proper ARIA labels', () => {
      render(
        <DevToolsProvider initialIsOpen={true}>
          <DevToolsPanel />
        </DevToolsProvider>
      );

      // Open visibility controls
      fireEvent.click(screen.getByTestId('visibility-controls-dropdown'));

      // Toggle buttons should have proper labels
      expect(screen.getByTestId('toggle-state-section')).toHaveAttribute(
        'aria-label', 
        'Toggle State Section visibility'
      );
      expect(screen.getByTestId('toggle-ai-testing')).toHaveAttribute(
        'aria-label',
        'Toggle AI Testing Panel visibility'
      );
    });

    test('visibility controls dropdown has proper ARIA attributes', () => {
      render(
        <DevToolsProvider initialIsOpen={true}>
          <DevToolsPanel />
        </DevToolsProvider>
      );

      const dropdown = screen.getByTestId('visibility-controls-dropdown');
      
      expect(dropdown).toHaveAttribute('aria-label', 'Section visibility controls');
      expect(dropdown).toHaveAttribute('aria-expanded', 'false');

      // Open dropdown
      fireEvent.click(dropdown);
      
      expect(dropdown).toHaveAttribute('aria-expanded', 'true');
    });
  });
});