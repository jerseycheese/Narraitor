/**
 * Tests for AIMockingSection - Mock AI Responses for Developer Tools
 * Issue #156: These tests verify core user behavior for AI mocking functionality
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AIMockingSection } from '../AIMockingSection';
import { DevToolsProvider } from '../../DevToolsContext';

// Mock the mock state manager
jest.mock('../../../../lib/devtools/mockStateManager', () => ({
  MockStateManager: {
    getInstance: jest.fn(() => ({
      getCurrentState: jest.fn(() => ({
        mode: 'live',
        selectedScenario: null,
        customResponses: {},
        mockDelay: 1000,
        failureRate: 0
      })),
      setMode: jest.fn(),
      setScenario: jest.fn(),
      setCustomResponse: jest.fn(),
      setMockDelay: jest.fn(),
      setFailureRate: jest.fn(),
      subscribe: jest.fn(() => () => {}), // Returns unsubscribe function
      notifyStateChange: jest.fn()
    }))
  }
}));

// Mock the client factory to verify mode switching
jest.mock('../../../../lib/ai/clientFactory', () => ({
  createAIClient: jest.fn(() => ({
    generateContent: jest.fn(),
    generateImage: jest.fn()
  }))
}));

describe('AIMockingSection - User Behavior Tests', () => {
  let mockStateManager: any;
  let user: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    user = userEvent.setup();
    
    // Get the mock instance
    const { MockStateManager } = require('../../../../lib/devtools/mockStateManager');
    mockStateManager = MockStateManager.getInstance();
  });

  const renderWithProvider = (component: React.ReactElement) => {
    return render(
      <DevToolsProvider initialIsOpen={true}>
        {component}
      </DevToolsProvider>
    );
  };

  describe('Mode Toggle Functionality', () => {
    test('user can toggle between Live API and Mock modes', async () => {
      renderWithProvider(<AIMockingSection />);
      
      // Should show current mode (defaults to Live)
      expect(screen.getByText(/live api/i)).toBeInTheDocument();
      
      // User clicks toggle to switch to mock mode
      const modeToggle = screen.getByRole('button', { name: /toggle.*mode/i });
      await user.click(modeToggle);
      
      // Should call the state manager to change mode
      expect(mockStateManager.setMode).toHaveBeenCalledWith('mock');
    });

    test('displays current mode status clearly to user', () => {
      renderWithProvider(<AIMockingSection />);
      
      // Mode indicator should be visible and clear
      expect(screen.getByText(/current mode/i)).toBeInTheDocument();
      expect(screen.getByText(/live api/i)).toBeInTheDocument();
    });

    test('prevents invalid mode switching', async () => {
      renderWithProvider(<AIMockingSection />);
      
      // Mock a scenario where switching fails
      mockStateManager.setMode.mockRejectedValueOnce(new Error('Mode switch failed'));
      
      const modeToggle = screen.getByRole('button', { name: /toggle.*mode/i });
      await user.click(modeToggle);
      
      // Should handle error gracefully and show user feedback
      await waitFor(() => {
        expect(screen.getByText(/error.*switching.*mode/i)).toBeInTheDocument();
      });
    });
  });

  describe('Mock Scenario Selection', () => {
    test('user can select different mock scenarios from dropdown', async () => {
      renderWithProvider(<AIMockingSection />);
      
      // Switch to mock mode first
      mockStateManager.getCurrentState.mockReturnValue({
        mode: 'mock',
        selectedScenario: null
      });
      
      // Should show scenario dropdown when in mock mode
      expect(screen.getByLabelText(/select.*scenario/i)).toBeInTheDocument();
      
      // User selects a scenario
      const scenarioSelect = screen.getByLabelText(/select.*scenario/i);
      await user.selectOptions(scenarioSelect, 'success-fast');
      
      // Should call state manager with selected scenario
      expect(mockStateManager.setScenario).toHaveBeenCalledWith('success-fast');
    });

    test('scenario dropdown only appears in mock mode', () => {
      renderWithProvider(<AIMockingSection />);
      
      // In live mode - no dropdown
      expect(screen.queryByLabelText(/select.*scenario/i)).not.toBeInTheDocument();
      
      // Switch to mock mode
      mockStateManager.getCurrentState.mockReturnValue({
        mode: 'mock',
        selectedScenario: null
      });
      
      // Re-render or trigger state change
      const modeToggle = screen.getByRole('button', { name: /toggle.*mode/i });
      fireEvent.click(modeToggle);
      
      // Now dropdown should appear
      expect(screen.getByLabelText(/select.*scenario/i)).toBeInTheDocument();
    });

    test('displays scenario descriptions to help user selection', async () => {
      mockStateManager.getCurrentState.mockReturnValue({
        mode: 'mock',
        selectedScenario: null
      });
      
      renderWithProvider(<AIMockingSection />);
      
      // Should show helpful descriptions for scenarios
      expect(screen.getByText(/fast.*response/i)).toBeInTheDocument();
      expect(screen.getByText(/slow.*response/i)).toBeInTheDocument();
      expect(screen.getByText(/error.*simulation/i)).toBeInTheDocument();
    });
  });

  describe('Custom Response Configuration', () => {
    test('user can configure custom mock responses', async () => {
      mockStateManager.getCurrentState.mockReturnValue({
        mode: 'mock',
        selectedScenario: 'custom'
      });
      
      renderWithProvider(<AIMockingSection />);
      
      // Should show custom response editor
      expect(screen.getByLabelText(/custom.*response/i)).toBeInTheDocument();
      
      // User enters custom response
      const responseInput = screen.getByLabelText(/custom.*response/i);
      await user.type(responseInput, 'This is a test response');
      
      // Should save custom response
      expect(mockStateManager.setCustomResponse).toHaveBeenCalledWith(
        'custom',
        'This is a test response'
      );
    });

    test('validates custom response format', async () => {
      mockStateManager.getCurrentState.mockReturnValue({
        mode: 'mock',
        selectedScenario: 'custom'
      });
      
      renderWithProvider(<AIMockingSection />);
      
      // User enters invalid JSON response
      const responseInput = screen.getByLabelText(/custom.*response/i);
      await user.type(responseInput, '{invalid json');
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid.*format/i)).toBeInTheDocument();
      });
    });
  });

  describe('Mock Settings Configuration', () => {
    test('user can adjust mock delay settings', async () => {
      mockStateManager.getCurrentState.mockReturnValue({
        mode: 'mock',
        mockDelay: 1000
      });
      
      renderWithProvider(<AIMockingSection />);
      
      // Should show delay configuration
      const delayInput = screen.getByLabelText(/delay.*ms/i);
      expect(delayInput).toHaveValue(1000);
      
      // User adjusts delay
      await user.clear(delayInput);
      await user.type(delayInput, '2500');
      
      // Should update delay setting
      expect(mockStateManager.setMockDelay).toHaveBeenCalledWith(2500);
    });

    test('user can configure failure rate for testing error scenarios', async () => {
      mockStateManager.getCurrentState.mockReturnValue({
        mode: 'mock',
        failureRate: 0
      });
      
      renderWithProvider(<AIMockingSection />);
      
      // Should show failure rate slider/input
      const failureRateInput = screen.getByLabelText(/failure.*rate/i);
      
      // User sets failure rate to 20%
      await user.clear(failureRateInput);
      await user.type(failureRateInput, '20');
      
      // Should update failure rate
      expect(mockStateManager.setFailureRate).toHaveBeenCalledWith(20);
    });
  });

  describe('Settings Persistence', () => {
    test('mock settings persist across DevTools sessions', () => {
      // Mock persisted state
      mockStateManager.getCurrentState.mockReturnValue({
        mode: 'mock',
        selectedScenario: 'success-slow',
        mockDelay: 3000,
        failureRate: 10
      });
      
      renderWithProvider(<AIMockingSection />);
      
      // Should load and display persisted settings
      expect(screen.getByDisplayValue('success-slow')).toBeInTheDocument();
      expect(screen.getByDisplayValue('3000')).toBeInTheDocument();
      expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    });

    test('restores live mode by default for new users', () => {
      // Mock default state for new user
      mockStateManager.getCurrentState.mockReturnValue({
        mode: 'live',
        selectedScenario: null
      });
      
      renderWithProvider(<AIMockingSection />);
      
      // Should default to live mode
      expect(screen.getByText(/live api/i)).toBeInTheDocument();
      expect(screen.queryByLabelText(/select.*scenario/i)).not.toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('handles state management errors gracefully', async () => {
      // Mock state manager throwing error
      mockStateManager.setMode.mockRejectedValueOnce(new Error('Storage unavailable'));
      
      renderWithProvider(<AIMockingSection />);
      
      const modeToggle = screen.getByRole('button', { name: /toggle.*mode/i });
      await user.click(modeToggle);
      
      // Should show user-friendly error message
      await waitFor(() => {
        expect(screen.getByText(/unable.*to.*switch.*mode/i)).toBeInTheDocument();
      });
    });

    test('continues functioning when persistence fails', async () => {
      // Mock persistence failure but state updates still work
      mockStateManager.setScenario.mockRejectedValueOnce(new Error('Save failed'));
      
      mockStateManager.getCurrentState.mockReturnValue({
        mode: 'mock',
        selectedScenario: null
      });
      
      renderWithProvider(<AIMockingSection />);
      
      const scenarioSelect = screen.getByLabelText(/select.*scenario/i);
      await user.selectOptions(scenarioSelect, 'success-fast');
      
      // Should still allow scenario selection despite persistence error
      expect(mockStateManager.setScenario).toHaveBeenCalledWith('success-fast');
    });
  });
});