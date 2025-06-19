import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { AITestingPanel } from '../AITestingPanel';

// Mock the context override utilities
jest.mock('../../../../lib/ai/contextOverride', () => ({
  createTestContext: jest.fn().mockImplementation((world, character, context, config) => ({
    world: { ...world, ...config.worldOverride },
    character: { ...character, ...config.characterOverride },
    narrativeContext: { ...context, ...config.narrativeContext }
  }))
}));

describe('AITestingPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock setTimeout to make tests run faster
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('displays custom input forms for world and character overrides', () => {
    render(<AITestingPanel />);
    
    // Verify core input sections are present
    expect(screen.getByText(/world override/i)).toBeInTheDocument();
    expect(screen.getByText(/character override/i)).toBeInTheDocument();
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
  });

  test('executes narrative generation with custom context', async () => {
    render(<AITestingPanel />);
    
    // Configure test inputs
    fireEvent.change(screen.getByLabelText(/world name/i), { target: { value: 'Test World' } });
    fireEvent.change(screen.getByLabelText(/character name/i), { target: { value: 'Test Character' } });
    
    // Execute generation
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /generate narrative/i }));
    });
    
    // Fast-forward timers to simulate the delay
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    // Verify the generation completed
    await waitFor(() => {
      expect(screen.getByText(/in the.*realm of.*stands at a crossroads/i)).toBeInTheDocument();
    });
  });

  test('displays generated narrative results', async () => {
    render(<AITestingPanel />);
    
    // Execute generation
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /generate narrative/i }));
    });
    
    // Fast-forward timers to simulate the delay
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    // Verify results are displayed
    await waitFor(() => {
      expect(screen.getByText(/in the.*realm of.*stands at a crossroads/i)).toBeInTheDocument();
      // Note: The choices are now dynamic, so we'll check for the choices section instead
      expect(screen.getByText(/choices:/i)).toBeInTheDocument();
    });
  });

  test('shows loading state during narrative generation', async () => {
    render(<AITestingPanel />);
    
    // Start generation
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /generate narrative/i }));
    });
    
    // Verify loading state appears immediately
    expect(screen.getByText(/generating\.\.\./i)).toBeInTheDocument();
    expect(screen.getByText(/generating narrative\.\.\./i)).toBeInTheDocument();
    
    // Fast-forward timers to complete generation
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    
    // Verify results appear after generation
    await waitFor(() => {
      expect(screen.getByText(/in the.*realm of.*stands at a crossroads/i)).toBeInTheDocument();
    });
  });
});
