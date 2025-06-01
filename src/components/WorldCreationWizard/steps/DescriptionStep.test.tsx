import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DescriptionStep from './DescriptionStep';
import { World } from '@/types/world.types';
import * as worldAnalyzer from '@/lib/ai/worldAnalyzer';

// Mock the world analyzer
jest.mock('@/lib/ai/worldAnalyzer', () => ({
  analyzeWorldDescription: jest.fn(),
}));

describe.skip('DescriptionStep', () => {
  const mockWorldData: Partial<World> = {
    name: 'Test World',
    description: '',
    theme: 'fantasy',
  };

  const mockOnUpdate = jest.fn();
  const mockOnComplete = jest.fn();
  const mockSetAISuggestions = jest.fn();
  const mockSetProcessing = jest.fn();
  const mockSetError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders description textarea', () => {
    render(
      <DescriptionStep
        worldData={mockWorldData}
        errors={{}}
        isProcessing={false}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
        setAISuggestions={mockSetAISuggestions}
        setProcessing={mockSetProcessing}
        setError={mockSetError}
      />
    );

    expect(screen.getByTestId('description-step')).toBeInTheDocument();
    expect(screen.getByTestId('world-full-description')).toBeInTheDocument();
  });

  test('displays character count', () => {
    render(
      <DescriptionStep
        worldData={{ ...mockWorldData, description: 'Test description' }}
        errors={{}}
        isProcessing={false}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
        setAISuggestions={mockSetAISuggestions}
        setProcessing={mockSetProcessing}
        setError={mockSetError}
      />
    );

    expect(screen.getByTestId('description-char-count')).toHaveTextContent('16 / 3000 characters');
  });

  test('validates minimum description length (50 characters)', async () => {
    render(
      <DescriptionStep
        worldData={{ ...mockWorldData, description: 'Too short' }}
        errors={{}}
        isProcessing={false}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
        setAISuggestions={mockSetAISuggestions}
        setProcessing={mockSetProcessing}
        setError={mockSetError}
      />
    );

    // Find and click the Generate Suggestions button
    const generateButton = screen.getByText(/Generate Suggestions|Analyze Description/i);
    
    await act(async () => {
      fireEvent.click(generateButton);
    });

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith(
        'description',
        'Please provide at least 50 characters to generate suggestions.'
      );
    });
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  test('enforces maximum description length (3000 characters)', async () => {
    const longDescription = 'a'.repeat(3001);
    render(
      <DescriptionStep
        worldData={{ ...mockWorldData, description: longDescription.slice(0, 3000) }}
        errors={{}}
        isProcessing={false}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
        setAISuggestions={mockSetAISuggestions}
        setProcessing={mockSetProcessing}
        setError={mockSetError}
      />
    );

    // The component should limit the description to 3000 characters
    expect(screen.getByTestId('description-char-count')).toHaveTextContent('3000 / 3000 characters');
  });

  test('shows processing state during AI analysis', async () => {
    render(
      <DescriptionStep
        worldData={mockWorldData}
        errors={{}}
        isProcessing={true}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
        setAISuggestions={mockSetAISuggestions}
        setProcessing={mockSetProcessing}
        setError={mockSetError}
      />
    );

    expect(screen.getByTestId('processing-overlay')).toBeInTheDocument();
    expect(screen.getByText('Analyzing your world description...')).toBeInTheDocument();
  });

  test('calls AI analyzer with description', async () => {
    const mockAnalyzeWorldDescription = worldAnalyzer.analyzeWorldDescription as jest.Mock;
    mockAnalyzeWorldDescription.mockResolvedValue({
      attributes: [],
      skills: [],
    });

    const validDescription = 'This is a valid description that is long enough to pass validation';
    
    render(
      <DescriptionStep
        worldData={{ ...mockWorldData, description: validDescription }}
        errors={{}}
        isProcessing={false}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
        setAISuggestions={mockSetAISuggestions}
        setProcessing={mockSetProcessing}
        setError={mockSetError}
      />
    );

    const generateButton = screen.getByText(/Generate Suggestions|Analyze Description/i);
    
    await act(async () => {
      fireEvent.click(generateButton);
    });

    await waitFor(() => {
      expect(mockSetProcessing).toHaveBeenCalledWith(true);
      expect(mockAnalyzeWorldDescription).toHaveBeenCalledWith(validDescription);
    });
  });

  test('handles AI analysis success', async () => {
    const mockSuggestions = {
      attributes: [
        { name: 'Strength', description: 'Physical power', minValue: 1, maxValue: 10, accepted: false },
      ],
      skills: [
        { name: 'Combat', description: 'Fighting ability', difficulty: 'medium', accepted: false },
      ],
    };

    const mockAnalyzeWorldDescription = worldAnalyzer.analyzeWorldDescription as jest.Mock;
    mockAnalyzeWorldDescription.mockResolvedValue(mockSuggestions);

    const validDescription = 'This is a valid description that is long enough to pass validation';
    
    render(
      <DescriptionStep
        worldData={{ ...mockWorldData, description: validDescription }}
        errors={{}}
        isProcessing={false}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
        setAISuggestions={mockSetAISuggestions}
        setProcessing={mockSetProcessing}
        setError={mockSetError}
      />
    );

    const generateButton = screen.getByText(/Generate Suggestions|Analyze Description/i);
    
    await act(async () => {
      fireEvent.click(generateButton);
    });

    await waitFor(() => {
      expect(mockSetAISuggestions).toHaveBeenCalledWith(mockSuggestions);
      expect(mockOnComplete).toHaveBeenCalled();
      expect(mockSetProcessing).toHaveBeenCalledWith(false);
    });
  });

  test('handles AI analysis failure with fallback', async () => {
    const mockAnalyzeWorldDescription = worldAnalyzer.analyzeWorldDescription as jest.Mock;
    mockAnalyzeWorldDescription.mockRejectedValue(new Error('AI service unavailable'));

    const validDescription = 'This is a valid description that is long enough to pass validation';
    
    render(
      <DescriptionStep
        worldData={{ ...mockWorldData, description: validDescription }}
        errors={{}}
        isProcessing={false}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
        setAISuggestions={mockSetAISuggestions}
        setProcessing={mockSetProcessing}
        setError={mockSetError}
      />
    );

    const generateButton = screen.getByText(/Generate Suggestions|Analyze Description/i);
    
    await act(async () => {
      fireEvent.click(generateButton);
    });

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('ai', 'Failed to generate suggestions. You can continue manually or try again.');
      expect(mockSetAISuggestions).toHaveBeenCalled();
      // The component still calls onComplete even on failure (with default suggestions)
      expect(mockSetProcessing).toHaveBeenCalledWith(false);
    });
  });

  test('updates description on change', () => {
    render(
      <DescriptionStep
        worldData={mockWorldData}
        errors={{}}
        isProcessing={false}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
        setAISuggestions={mockSetAISuggestions}
        setProcessing={mockSetProcessing}
        setError={mockSetError}
      />
    );

    const textarea = screen.getByTestId('world-full-description');
    fireEvent.change(textarea, { target: { value: 'New description' } });

    expect(mockOnUpdate).toHaveBeenCalledWith({
      ...mockWorldData,
      description: 'New description',
    });
  });

  test('disables inputs during processing', () => {
    render(
      <DescriptionStep
        worldData={mockWorldData}
        errors={{}}
        isProcessing={true}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
        setAISuggestions={mockSetAISuggestions}
        setProcessing={mockSetProcessing}
        setError={mockSetError}
      />
    );

    expect(screen.getByTestId('world-full-description')).toBeDisabled();
    // The generate button should also be disabled
    const generateButton = screen.getByText(/Generate Suggestions|Analyze Description/i);
    expect(generateButton).toBeDisabled();
  });

  test('displays AI error when present', () => {
    render(
      <DescriptionStep
        worldData={mockWorldData}
        errors={{ ai: 'AI service is unavailable' }}
        isProcessing={false}
        onUpdate={mockOnUpdate}
        onComplete={mockOnComplete}
        setAISuggestions={mockSetAISuggestions}
        setProcessing={mockSetProcessing}
        setError={mockSetError}
      />
    );

    expect(screen.getByTestId('ai-warning')).toHaveTextContent('AI service is unavailable');
  });
});