import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AITestingPanel } from '../AITestingPanel';

// Mock the AI service
jest.mock('../../../../lib/ai/narrativeGenerator', () => ({
  generateNarrative: jest.fn()
}));

// Mock the context override utilities
jest.mock('../../../../lib/ai/contextOverride', () => ({
  createTestContext: jest.fn()
}));

describe('AITestingPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('displays custom input forms for world, character, and narrative context', () => {
    render(<AITestingPanel />);
    
    // Verify core input sections are present
    expect(screen.getByText(/world override/i)).toBeInTheDocument();
    expect(screen.getByText(/character override/i)).toBeInTheDocument();
    expect(screen.getByText(/narrative context/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate narrative/i })).toBeInTheDocument();
  });

  test('allows configuration of custom world settings', () => {
    render(<AITestingPanel />);
    
    // Test world name input
    const worldNameInput = screen.getByLabelText(/world name/i);
    fireEvent.change(worldNameInput, { target: { value: 'Test Fantasy World' } });
    expect(worldNameInput).toHaveValue('Test Fantasy World');
    
    // Test world theme input
    const worldThemeInput = screen.getByLabelText(/world theme/i);
    fireEvent.change(worldThemeInput, { target: { value: 'Fantasy' } });
    expect(worldThemeInput).toHaveValue('Fantasy');
  });

  test('allows configuration of custom character settings', () => {
    render(<AITestingPanel />);
    
    // Test character name input
    const characterNameInput = screen.getByLabelText(/character name/i);
    fireEvent.change(characterNameInput, { target: { value: 'Test Hero' } });
    expect(characterNameInput).toHaveValue('Test Hero');
    
    // Test character level input
    const characterLevelInput = screen.getByLabelText(/character level/i);
    fireEvent.change(characterLevelInput, { target: { value: '5' } });
    expect(characterLevelInput).toHaveValue('5');
  });

  test('executes narrative generation with custom context', async () => {
    const mockGenerateNarrative = require('../../../../lib/ai/narrativeGenerator').generateNarrative;
    mockGenerateNarrative.mockResolvedValue({
      text: 'Generated test narrative',
      choices: ['Choice 1', 'Choice 2']
    });

    render(<AITestingPanel />);
    
    // Configure test inputs
    fireEvent.change(screen.getByLabelText(/world name/i), { target: { value: 'Test World' } });
    fireEvent.change(screen.getByLabelText(/character name/i), { target: { value: 'Test Character' } });
    
    // Execute generation
    fireEvent.click(screen.getByRole('button', { name: /generate narrative/i }));
    
    // Verify the generation was called
    await waitFor(() => {
      expect(mockGenerateNarrative).toHaveBeenCalledTimes(1);
    });
  });

  test('displays generated narrative results', async () => {
    const mockGenerateNarrative = require('../../../../lib/ai/narrativeGenerator').generateNarrative;
    mockGenerateNarrative.mockResolvedValue({
      text: 'Generated test narrative',
      choices: ['Choice 1', 'Choice 2']
    });

    render(<AITestingPanel />);
    
    // Execute generation
    fireEvent.click(screen.getByRole('button', { name: /generate narrative/i }));
    
    // Verify results are displayed
    await waitFor(() => {
      expect(screen.getByText('Generated test narrative')).toBeInTheDocument();
      expect(screen.getByText('Choice 1')).toBeInTheDocument();
      expect(screen.getByText('Choice 2')).toBeInTheDocument();
    });
  });

  test('shows loading state during narrative generation', async () => {
    const mockGenerateNarrative = require('../../../../lib/ai/narrativeGenerator').generateNarrative;
    mockGenerateNarrative.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<AITestingPanel />);
    
    // Start generation
    fireEvent.click(screen.getByRole('button', { name: /generate narrative/i }));
    
    // Verify loading state
    expect(screen.getByText(/generating/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate narrative/i })).toBeDisabled();
  });
});