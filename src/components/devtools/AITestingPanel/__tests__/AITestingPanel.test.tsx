import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AITestingPanel } from '../AITestingPanel';

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
    // Since we're using a mock implementation in the component, we don't need to mock anything here

    render(<AITestingPanel />);
    
    // Configure test inputs
    fireEvent.change(screen.getByLabelText(/world name/i), { target: { value: 'Test World' } });
    fireEvent.change(screen.getByLabelText(/character name/i), { target: { value: 'Test Character' } });
    
    // Execute generation
    fireEvent.click(screen.getByRole('button', { name: /generate narrative/i }));
    
    // Verify the generation completed
    await waitFor(() => {
      expect(screen.getByText(/generated narrative for/i)).toBeInTheDocument();
    });
  });

  test('displays generated narrative results', async () => {
    render(<AITestingPanel />);
    
    // Execute generation
    fireEvent.click(screen.getByRole('button', { name: /generate narrative/i }));
    
    // Verify results are displayed
    await waitFor(() => {
      expect(screen.getByText(/generated narrative for/i)).toBeInTheDocument();
      expect(screen.getByText('Continue exploring the area')).toBeInTheDocument();
      expect(screen.getByText('Rest and recover your strength')).toBeInTheDocument();
    });
  });

  test('shows loading state during narrative generation', async () => {
    render(<AITestingPanel />);
    
    // Start generation
    fireEvent.click(screen.getByRole('button', { name: /generate narrative/i }));
    
    // Verify loading state appears initially
    expect(screen.getByText(/generating/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /generate narrative/i })).toBeDisabled();
  });
});