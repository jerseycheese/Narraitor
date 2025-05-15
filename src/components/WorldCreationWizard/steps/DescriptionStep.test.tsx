import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import DescriptionStep from './DescriptionStep';
import { World } from '@/types/world.types';
import * as worldAnalyzer from '@/lib/ai/worldAnalyzer';

// Mock the world analyzer
jest.mock('@/lib/ai/worldAnalyzer', () => ({
  analyzeWorldDescription: jest.fn(),
}));

describe('DescriptionStep', () => {
  const mockWorldData: Partial<World> = {
    name: 'Test World',
    description: '',
    theme: 'fantasy',
  };

  const mockOnUpdate = jest.fn();
  const mockOnNext = jest.fn();
  const mockOnBack = jest.fn();
  const mockOnCancel = jest.fn();
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
        onNext={mockOnNext}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        setAISuggestions={mockSetAISuggestions}
        setProcessing={mockSetProcessing}
        setError={mockSetError}
      />
    );

    expect(screen.getByTestId('description-step')).toBeInTheDocument();
    expect(screen.getByTestId('world-full-description')).toBeInTheDocument();
    expect(screen.getByTestId('step-back-button')).toBeInTheDocument();
    expect(screen.getByTestId('step-cancel-button')).toBeInTheDocument();
    expect(screen.getByTestId('step-next-button')).toBeInTheDocument();
  });

  test('displays character count', () => {
    render(
      <DescriptionStep
        worldData={{ ...mockWorldData, description: 'Test description' }}
        errors={{}}
        isProcessing={false}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
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
        onNext={mockOnNext}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        setAISuggestions={mockSetAISuggestions}
        setProcessing={mockSetProcessing}
        setError={mockSetError}
      />
    );

    await act(async () => {
      await fireEvent.click(screen.getByTestId('step-next-button'));
    });

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith(
        'description',
        'Please provide a more detailed description (at least 50 characters)'
      );
    });
    expect(mockOnNext).not.toHaveBeenCalled();
  });

  test('enforces maximum description length (3000 characters)', async () => {
    const longDescription = 'a'.repeat(3001);
    render(
      <DescriptionStep
        worldData={{ ...mockWorldData, description: longDescription }}
        errors={{}}
        isProcessing={false}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        setAISuggestions={mockSetAISuggestions}
        setProcessing={mockSetProcessing}
        setError={mockSetError}
      />
    );

    await act(async () => {
      await fireEvent.click(screen.getByTestId('step-next-button'));
    });

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith(
        'description',
        'Description must be less than 3000 characters'
      );
    });
    expect(mockOnNext).not.toHaveBeenCalled();
  });

  test('shows processing state during AI analysis', async () => {
    render(
      <DescriptionStep
        worldData={mockWorldData}
        errors={{}}
        isProcessing={true}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        setAISuggestions={mockSetAISuggestions}
        setProcessing={mockSetProcessing}
        setError={mockSetError}
      />
    );

    expect(screen.getByTestId('processing-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('step-next-button')).toHaveTextContent('Analyzing...');
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
        onNext={mockOnNext}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        setAISuggestions={mockSetAISuggestions}
        setProcessing={mockSetProcessing}
        setError={mockSetError}
      />
    );

    await act(async () => {
      await fireEvent.click(screen.getByTestId('step-next-button'));
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
        onNext={mockOnNext}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        setAISuggestions={mockSetAISuggestions}
        setProcessing={mockSetProcessing}
        setError={mockSetError}
      />
    );

    await act(async () => {
      await fireEvent.click(screen.getByTestId('step-next-button'));
    });

    await waitFor(() => {
      expect(mockSetAISuggestions).toHaveBeenCalledWith(mockSuggestions);
      expect(mockOnNext).toHaveBeenCalled();
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
        onNext={mockOnNext}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        setAISuggestions={mockSetAISuggestions}
        setProcessing={mockSetProcessing}
        setError={mockSetError}
      />
    );

    await act(async () => {
      await fireEvent.click(screen.getByTestId('step-next-button'));
    });

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('ai', 'AI suggestions unavailable. Providing default options.');
      expect(mockSetAISuggestions).toHaveBeenCalled();
      expect(mockOnNext).toHaveBeenCalled();
      expect(mockSetProcessing).toHaveBeenCalledWith(false);
    });
  });

  test('calls onBack when back clicked', async () => {
    render(
      <DescriptionStep
        worldData={mockWorldData}
        errors={{}}
        isProcessing={false}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        setAISuggestions={mockSetAISuggestions}
        setProcessing={mockSetProcessing}
        setError={mockSetError}
      />
    );

    await act(async () => {
      await fireEvent.click(screen.getByTestId('step-back-button'));
    });

    expect(mockOnBack).toHaveBeenCalled();
  });

  test('disables buttons during processing', () => {
    render(
      <DescriptionStep
        worldData={mockWorldData}
        errors={{}}
        isProcessing={true}
        onUpdate={mockOnUpdate}
        onNext={mockOnNext}
        onBack={mockOnBack}
        onCancel={mockOnCancel}
        setAISuggestions={mockSetAISuggestions}
        setProcessing={mockSetProcessing}
        setError={mockSetError}
      />
    );

    expect(screen.getByTestId('step-back-button')).toBeDisabled();
    expect(screen.getByTestId('step-cancel-button')).toBeDisabled();
    expect(screen.getByTestId('step-next-button')).toBeDisabled();
  });
});
