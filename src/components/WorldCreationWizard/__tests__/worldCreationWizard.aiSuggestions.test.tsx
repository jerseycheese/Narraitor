import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WorldCreationWizard from '../WorldCreationWizard';
import { analyzeWorldDescription } from '@/lib/ai/worldAnalyzer';
import { worldStore } from '@/state/worldStore';

// Mock the dependencies
jest.mock('@/lib/ai/worldAnalyzer');
jest.mock('@/state/worldStore', () => ({
  worldStore: jest.fn(),
}));
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));
jest.mock('@/lib/templates/templateLoader', () => ({
  applyWorldTemplate: jest.fn().mockReturnValue('template-world-id'),
}));

const mockAnalyzeWorldDescription = analyzeWorldDescription as jest.MockedFunction<typeof analyzeWorldDescription>;
const mockWorldStore = worldStore as jest.MockedFunction<typeof worldStore>;

describe('WorldCreationWizard - AI Suggestions Integration', () => {
  const mockCreateWorld = jest.fn().mockReturnValue('test-world-id');

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockWorldStore.mockReturnValue(mockCreateWorld);

    // Default mock for AI suggestions
    mockAnalyzeWorldDescription.mockResolvedValue({
      attributes: [
        {
          name: 'Strength',
          description: 'Physical power',
          minValue: 1,
          maxValue: 10,
          category: 'Physical',
          accepted: false,
        },
        {
          name: 'Intelligence',
          description: 'Mental capacity',
          minValue: 1,
          maxValue: 10,
          category: 'Mental',
          accepted: false,
        },
      ],
      skills: [
        {
          name: 'Combat',
          description: 'Fighting ability',
          difficulty: 'medium',
          category: 'Physical',
          linkedAttributeName: 'Strength',
          accepted: false,
        },
      ],
    });
  });

  it('should display loading state while generating AI suggestions', async () => {
    // Delay the AI response to test loading state
    mockAnalyzeWorldDescription.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        attributes: [],
        skills: []
      }), 300))
    );

    render(<WorldCreationWizard onComplete={mockCreateWorld} />);

    // Navigate directly to description step to test AI suggestions
    // Skip template selection (create own world)
    fireEvent.click(screen.getByTestId('create-own-button'));
    
    // Fill in basic info
    fireEvent.change(screen.getByTestId('world-name-input'), { target: { value: 'Test World' } });
    fireEvent.change(screen.getByTestId('world-description-textarea'), { target: { value: 'A brief description' } });
    fireEvent.click(screen.getByTestId('step-next-button'));
    
    // Fill in description and proceed - this should trigger AI analysis  
    await waitFor(() => {
      expect(screen.getByTestId('description-step')).toBeInTheDocument();
    });
    
    const descriptionTextarea = screen.getByLabelText(/Description/i);
    fireEvent.change(descriptionTextarea, { target: { value: 'A world of magic and wonder with dragons and wizards roaming across vast landscapes filled with ancient treasures and mystical powers' } });
    fireEvent.click(screen.getByTestId('step-next-button'));

    // Should show loading state immediately after clicking
    await waitFor(() => {
      expect(screen.getByText(/Analyzing your world description/i)).toBeInTheDocument();
    });
  });

  it('should display AI suggestions in attribute review step', async () => {
    render(<WorldCreationWizard onComplete={mockCreateWorld} />);

    // Skip template selection
    fireEvent.click(screen.getByTestId('create-own-button'));
    
    // Fill in basic info
    fireEvent.change(screen.getByTestId('world-name-input'), { target: { value: 'Test World' } });
    fireEvent.change(screen.getByTestId('world-description-textarea'), { target: { value: 'A brief description' } });
    fireEvent.click(screen.getByTestId('step-next-button'));
    
    // Wait for description step
    await waitFor(() => {
      expect(screen.getByTestId('description-step')).toBeInTheDocument();
    });
    
    // Fill in rich description
    const descriptionTextarea = screen.getByLabelText(/Description/i);
    fireEvent.change(descriptionTextarea, { target: { value: 'A world of magic and wonder with dragons and wizards roaming across vast landscapes filled with ancient treasures and mystical powers' } });
    fireEvent.click(screen.getByTestId('step-next-button'));

    // Wait for AI suggestions to load and display
    await waitFor(() => {
      expect(screen.getByText('Strength')).toBeInTheDocument();
    });

    // Verify suggestions are displayed
    expect(screen.getByText('Strength')).toBeInTheDocument();
    expect(screen.getByText('Intelligence')).toBeInTheDocument();
    
    // Check that the description is shown
    const strengthCheckbox = screen.getByTestId('attribute-checkbox-0');
    fireEvent.click(strengthCheckbox);
    
    // After clicking, the description should be visible
    await waitFor(() => {
      expect(screen.getByText('Physical power')).toBeInTheDocument();
    });
  });

  it('should allow accepting and rejecting AI attribute suggestions', async () => {
    render(<WorldCreationWizard onComplete={mockCreateWorld} />);

    // Skip template selection
    fireEvent.click(screen.getByTestId('create-own-button'));
    
    // Fill in basic info
    fireEvent.change(screen.getByTestId('world-name-input'), { target: { value: 'Test World' } });
    fireEvent.change(screen.getByTestId('world-description-textarea'), { target: { value: 'A brief description' } });
    fireEvent.click(screen.getByTestId('step-next-button'));
    
    // Wait for description step
    await waitFor(() => {
      expect(screen.getByTestId('description-step')).toBeInTheDocument();
    });
    
    // Fill in description
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'A world of magic and wonder with dragons and wizards roaming across vast landscapes filled with ancient treasures and mystical powers' } });
    fireEvent.click(screen.getByTestId('step-next-button'));

    // Wait for attribute review step
    await waitFor(() => {
      expect(screen.getByTestId('attribute-review-step')).toBeInTheDocument();
    });

    // Toggle attribute acceptance
    const strengthCheckbox = screen.getByTestId('attribute-checkbox-0');
    fireEvent.click(strengthCheckbox);
    
    expect(strengthCheckbox).toBeChecked();
    
    // Continue to skills step
    fireEvent.click(screen.getByTestId('step-next-button'));
    
    // The accepted attribute should be reflected in the world creation
    await waitFor(() => {
      expect(screen.getByTestId('skill-review-step')).toBeInTheDocument();
    });
  });

  it('should handle AI suggestion failures gracefully', async () => {
    // Mock AI failure
    mockAnalyzeWorldDescription.mockRejectedValue(new Error('AI service unavailable'));

    render(<WorldCreationWizard onComplete={mockCreateWorld} />);

    // Skip template selection
    fireEvent.click(screen.getByTestId('create-own-button'));
    
    // Fill in basic info
    fireEvent.change(screen.getByTestId('world-name-input'), { target: { value: 'Test World' } });
    fireEvent.change(screen.getByTestId('world-description-textarea'), { target: { value: 'A brief description' } });
    fireEvent.click(screen.getByTestId('step-next-button'));
    
    // Wait for description step
    await waitFor(() => {
      expect(screen.getByTestId('description-step')).toBeInTheDocument();
    });
    
    // Fill in description
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'A world of magic and wonder filled with amazing creatures and powerful spells that shape reality' } });
    fireEvent.click(screen.getByTestId('step-next-button'));

    // Should still proceed with default suggestions
    await waitFor(() => {
      expect(screen.getByText(/Review Attributes/i)).toBeInTheDocument();
    });
    
    // Default suggestions should be available
    expect(screen.getByText('Strength')).toBeInTheDocument();
  });

  it('should integrate AI suggestions into final world creation', async () => {
    render(<WorldCreationWizard onComplete={mockCreateWorld} />);

    // Skip template selection
    fireEvent.click(screen.getByTestId('create-own-button'));
    
    // Fill in basic info
    fireEvent.change(screen.getByTestId('world-name-input'), { target: { value: 'AI World' } });
    fireEvent.change(screen.getByTestId('world-description-textarea'), { target: { value: 'A brief description' } });
    fireEvent.click(screen.getByTestId('step-next-button'));
    
    // Wait for description step
    await waitFor(() => {
      expect(screen.getByTestId('description-step')).toBeInTheDocument();
    });
    
    // Fill in description
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'A world with AI suggestions that will help create a wonderful and complex universe full of interesting characters and challenges' } });
    fireEvent.click(screen.getByTestId('step-next-button'));

    // Wait for AI suggestions
    await waitFor(() => {
      expect(screen.getByTestId('attribute-review-step')).toBeInTheDocument();
    });

    // Accept some suggestions
    fireEvent.click(screen.getByTestId('attribute-checkbox-0')); // Accept Strength
    fireEvent.click(screen.getByTestId('step-next-button'));

    // Skip through skills
    await waitFor(() => {
      expect(screen.getByTestId('skill-review-step')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByTestId('step-next-button'));

    // Complete wizard
    await waitFor(() => {
      expect(screen.getByTestId('finalize-step')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByTestId('step-complete-button'));

    // Verify the world was created with AI-suggested attributes
    await waitFor(() => {
      expect(mockCreateWorld).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'AI World',
          attributes: expect.arrayContaining([
            expect.objectContaining({
              name: 'Strength',
              description: 'Physical power',
            })
          ])
        })
      );
    });
  });
});