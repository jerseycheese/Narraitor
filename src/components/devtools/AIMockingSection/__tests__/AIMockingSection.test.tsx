/**
 * Tests for AIMockingSection - Mock AI Responses for Developer Tools
 * Issue #156: These tests verify core user behavior for AI mocking functionality
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AIMockingSection } from '../AIMockingSection';
import { DevToolsProvider } from '../../DevToolsContext';

// Mock the mock state manager
jest.mock('../../../../lib/devtools/mockStateManager', () => {
  const mockInstance = {
    getConfiguration: jest.fn(() => ({
      isEnabled: false,
      activeScenarioId: 'success-standard',
      customScenarios: [],
      settings: {
        delayVariation: true,
        variationPercent: 20,
        persistSettings: true
      }
    })),
    setMockEnabled: jest.fn(),
    setActiveScenario: jest.fn(),
    addCustomScenario: jest.fn(),
    removeCustomScenario: jest.fn(),
    updateSettings: jest.fn(),
    subscribe: jest.fn(() => () => {}), // Returns unsubscribe function
  };

  return {
    MockStateManager: {
      getInstance: jest.fn(() => mockInstance)
    },
    mockStateManager: mockInstance
  };
});

// Mock MockScenarios class
jest.mock('../../../../lib/ai/__mocks__/mockScenarios', () => ({
  MockScenarios: jest.fn().mockImplementation(() => ({
    getAllScenarios: jest.fn(() => [
      { id: 'success-standard', name: 'Success', description: 'Standard success response' },
      { id: 'error-timeout', name: 'Timeout', description: 'Timeout error' },
    ]),
    getScenario: jest.fn((id) => 
      id === 'success-standard' 
        ? { id: 'success-standard', name: 'Success', description: 'Standard success response' }
        : { id: 'error-timeout', name: 'Timeout', description: 'Timeout error' }
    )
  }))
}));

const renderWithProvider = (component: React.ReactNode) => {
  return render(
    <DevToolsProvider>
      {component}
    </DevToolsProvider>
  );
};

describe('AIMockingSection - User Behavior Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    test('renders AI mocking section with mode toggle', () => {
      renderWithProvider(<AIMockingSection />);
      
      expect(screen.getByTestId('ai-mocking-section')).toBeInTheDocument();
      expect(screen.getByTestId('mock-mode-toggle')).toBeInTheDocument();
      expect(screen.getByText('Mode: Live API')).toBeInTheDocument();
      expect(screen.getByText('Enable Mock')).toBeInTheDocument();
    });

    test('shows basic component elements', () => {
      renderWithProvider(<AIMockingSection />);
      
      // Should show enable mock button
      expect(screen.getByText('Enable Mock')).toBeInTheDocument();
      
      // Should show green indicator for live mode
      const indicator = document.querySelector('.bg-green-500');
      expect(indicator).toBeInTheDocument();
    });
  });

  describe('Mode Toggle Functionality', () => {
    test('user can click toggle button', () => {
      renderWithProvider(<AIMockingSection />);
      
      const toggleButton = screen.getByTestId('mock-mode-toggle');
      fireEvent.click(toggleButton);
      
      // Button should be clickable
      expect(toggleButton).toBeEnabled();
    });
  });
});