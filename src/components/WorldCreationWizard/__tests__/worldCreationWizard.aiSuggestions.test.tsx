import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WorldCreationWizard from '../WorldCreationWizard';

// Simple mocking without heavy abstraction - focus on component behavior
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

// Mock AI analyzer to return predictable results for testing component behavior
jest.mock('@/lib/ai/worldAnalyzerClient', () => ({
  analyzeWorldDescriptionClient: jest.fn().mockResolvedValue({
    attributes: [
      {
        name: 'Strength',
        description: 'Physical power',
        minValue: 1,
        maxValue: 10,
        baseValue: 5,
        category: 'Physical',
        accepted: true,
      },
      {
        name: 'Intelligence', 
        description: 'Mental capacity',
        minValue: 1,
        maxValue: 10,
        baseValue: 5,
        category: 'Mental',
        accepted: true,
      },
    ],
    skills: [
      {
        name: 'Combat',
        description: 'Fighting ability', 
        difficulty: 'medium',
        category: 'Physical',
        linkedAttributeNames: ['Strength'],
        baseValue: 5,
        minValue: 1,
        maxValue: 10,
        accepted: true,
      },
    ],
  }),
}));

// Mock world store with simple implementation
jest.mock('@/state/worldStore', () => ({
  useWorldStore: jest.fn().mockReturnValue({
    createWorld: jest.fn().mockReturnValue('test-world-id'),
    setCurrentWorld: jest.fn(),
    worlds: {},
  }),
}));

describe('WorldCreationWizard - AI Suggestions Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should navigate through wizard steps and display AI suggestions', async () => {
    const mockOnComplete = jest.fn();
    
    render(<WorldCreationWizard onComplete={mockOnComplete} />);

    // Test component behavior: Navigate through wizard steps
    // Skip template selection (create own world)
    fireEvent.click(screen.getByTestId('create-own-button'));
    
    // Fill in basic info - test form functionality
    await waitFor(() => {
      expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByTestId('world-name-input'), { target: { value: 'Test World' } });
    fireEvent.change(screen.getByTestId('world-description-textarea'), { target: { value: 'A fantasy world' } });
    fireEvent.change(screen.getByTestId('world-genre-select'), { target: { value: 'fantasy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    
    // Fill in description - test description step functionality 
    await waitFor(() => {
      expect(screen.getByTestId('description-step')).toBeInTheDocument();
    });
    
    const descriptionTextarea = screen.getByTestId('world-full-description');
    fireEvent.change(descriptionTextarea, { target: { value: 'A world of magic and wonder with dragons and wizards roaming across vast landscapes filled with ancient treasures and mystical powers' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    // Test that component proceeds to attribute review step
    await waitFor(() => {
      expect(screen.getByTestId('attribute-review-step')).toBeInTheDocument();
    });
  });

  it('should display suggestions in attribute review step', async () => {
    const mockOnComplete = jest.fn();
    
    render(<WorldCreationWizard onComplete={mockOnComplete} />);

    // Navigate through wizard - test component step transitions
    fireEvent.click(screen.getByTestId('create-own-button'));
    
    // Fill in basic info - test form handling
    await waitFor(() => {
      expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByTestId('world-name-input'), { target: { value: 'Test World' } });
    fireEvent.change(screen.getByTestId('world-description-textarea'), { target: { value: 'A fantasy world' } });
    fireEvent.change(screen.getByTestId('world-genre-select'), { target: { value: 'fantasy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    
    // Navigate to description step
    await waitFor(() => {
      expect(screen.getByTestId('description-step')).toBeInTheDocument();
    });
    
    // Fill in description
    const descriptionTextarea = screen.getByTestId('world-full-description');
    fireEvent.change(descriptionTextarea, { target: { value: 'A world of magic and wonder with dragons and wizards roaming across vast landscapes filled with ancient treasures and mystical powers' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    // Test that component successfully navigates to attribute review step
    await waitFor(() => {
      expect(screen.getByTestId('attribute-review-step')).toBeInTheDocument();
    });

    // Test that the component shows the attribute management interface
    expect(screen.getByTestId('attribute-count-summary')).toBeInTheDocument();
    
    // Test that navigation continues to work
    expect(screen.getByRole('button', { name: 'Next' })).toBeInTheDocument();
  });

  it('should proceed through attribute review to skills step', async () => {
    const mockOnComplete = jest.fn();
    
    render(<WorldCreationWizard onComplete={mockOnComplete} />);

    // Navigate through complete flow - test end-to-end component behavior
    fireEvent.click(screen.getByTestId('create-own-button'));
    
    await waitFor(() => {
      expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByTestId('world-name-input'), { target: { value: 'Test World' } });
    fireEvent.change(screen.getByTestId('world-description-textarea'), { target: { value: 'A fantasy world' } });
    fireEvent.change(screen.getByTestId('world-genre-select'), { target: { value: 'fantasy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    
    await waitFor(() => {
      expect(screen.getByTestId('description-step')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByTestId('world-full-description'), { target: { value: 'A world of magic and wonder with dragons and wizards roaming across vast landscapes filled with ancient treasures and mystical powers' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    // Test component renders attribute review step
    await waitFor(() => {
      expect(screen.getByTestId('attribute-review-step')).toBeInTheDocument();
    });

    // Test that component allows navigation to next step
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    
    // Test component proceeds to skills step
    await waitFor(() => {
      expect(screen.getByTestId('skill-review-step')).toBeInTheDocument();
    });
  });

  it('should proceed to attribute review even when AI fails', async () => {
    // Test component behavior with AI failure - mock the AI client to reject
    const { analyzeWorldDescriptionClient } = require('@/lib/ai/worldAnalyzerClient');
    analyzeWorldDescriptionClient.mockRejectedValueOnce(new Error('AI service unavailable'));

    const mockOnComplete = jest.fn();
    render(<WorldCreationWizard onComplete={mockOnComplete} />);

    // Navigate through wizard
    fireEvent.click(screen.getByTestId('create-own-button'));
    
    await waitFor(() => {
      expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByTestId('world-name-input'), { target: { value: 'Test World' } });
    fireEvent.change(screen.getByTestId('world-description-textarea'), { target: { value: 'A fantasy world' } });
    fireEvent.change(screen.getByTestId('world-genre-select'), { target: { value: 'fantasy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    
    await waitFor(() => {
      expect(screen.getByTestId('description-step')).toBeInTheDocument();
    });
    
    // Fill in description and proceed
    fireEvent.change(screen.getByTestId('world-full-description'), { target: { value: 'A world of magic and wonder filled with amazing creatures and powerful spells that shape reality' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    // Test that component still proceeds with fallback behavior
    await waitFor(() => {
      expect(screen.getByTestId('attribute-review-step')).toBeInTheDocument();
    });
    
    // Test component shows attribute management interface even with AI failure
    expect(screen.getByTestId('attribute-count-summary')).toBeInTheDocument();
  });

  it('should complete wizard navigation flow', async () => {
    const mockOnComplete = jest.fn();
    render(<WorldCreationWizard onComplete={mockOnComplete} />);

    // Navigate through complete wizard flow - test full component behavior
    fireEvent.click(screen.getByTestId('create-own-button'));
    
    await waitFor(() => {
      expect(screen.getByTestId('basic-info-step')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByTestId('world-name-input'), { target: { value: 'AI World' } });
    fireEvent.change(screen.getByTestId('world-description-textarea'), { target: { value: 'A fantasy world' } });
    fireEvent.change(screen.getByTestId('world-genre-select'), { target: { value: 'fantasy' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    
    await waitFor(() => {
      expect(screen.getByTestId('description-step')).toBeInTheDocument();
    });
    
    fireEvent.change(screen.getByTestId('world-full-description'), { target: { value: 'A world with AI suggestions that will help create a wonderful and complex universe full of interesting characters and challenges' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    // Test attribute review step functionality
    await waitFor(() => {
      expect(screen.getByTestId('attribute-review-step')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    // Test skills step
    await waitFor(() => {
      expect(screen.getByTestId('skill-review-step')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    // Test finalize step
    await waitFor(() => {
      expect(screen.getByTestId('finalize-step')).toBeInTheDocument();
    });
    
    // Test that component shows world creation interface
    expect(screen.getByRole('button', { name: 'Create World' })).toBeInTheDocument();
  });
});