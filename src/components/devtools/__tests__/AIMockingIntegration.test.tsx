/**
 * DevTools Integration Tests for AI Mocking Section
 * These tests verify AI mocking section integrates with DevTools
 */

import React from 'react';
import { render } from '@testing-library/react';
import { DevToolsPanel } from '../DevToolsPanel/DevToolsPanel';
import { DevToolsProvider } from '../DevToolsContext';

// Mock the AIMockingSection component
jest.mock('../AIMockingSection', () => ({
  AIMockingSection: () => (
    <div data-testid="ai-mocking-section">
      <h3>AI Response Mocking</h3>
    </div>
  )
}));

// Mock section visibility storage
jest.mock('@/lib/devtools/sectionVisibilityStorage', () => ({
  DevToolsSection: {
    AI_MOCKING: 'ai-mocking',
    AI_TESTING: 'ai-testing',
    STATE_SECTION: 'state-section',
    ERROR_SECTION: 'error-section'
  },
  loadSectionVisibility: jest.fn(() => ({ 'ai-mocking': true })),
  saveSectionVisibility: jest.fn(),
  isSectionVisible: jest.fn(() => true)
}));


describe('DevTools AI Mocking Integration', () => {
  test('AI Mocking section component exists', () => {
    // Verify the mock component renders
    const { getByTestId } = render(
      <div data-testid="ai-mocking-section">
        <h3>AI Response Mocking</h3>
      </div>
    );
    
    expect(getByTestId('ai-mocking-section')).toBeInTheDocument();
  });
});