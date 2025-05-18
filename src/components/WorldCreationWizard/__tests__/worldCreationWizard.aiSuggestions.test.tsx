import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WorldCreationWizard from '../WorldCreationWizard';
import { analyzeWorldDescription } from '@/lib/ai/worldAnalyzer';
import { useWorldStore } from '@/state/useWorldStore';

// Mock the dependencies
jest.mock('@/lib/ai/worldAnalyzer');
jest.mock('@/state/useWorldStore');

const mockAnalyzeWorldDescription = analyzeWorldDescription as jest.MockedFunction<typeof analyzeWorldDescription>;
const mockUseWorldStore = useWorldStore as jest.MockedFunction<typeof useWorldStore>;

describe('WorldCreationWizard - AI Suggestions Integration', () => {
  const mockCreateWorld = jest.fn();
  const defaultWorlds = [];

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseWorldStore.mockReturnValue({
      createWorld: mockCreateWorld,
      worlds: {},
    });

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
      }), 100))
    );

    render(<WorldCreationWizard defaultWorlds={defaultWorlds} onComplete={mockCreateWorld} showFirstStep={true} />);

    // Navigate to the description step
    fireEvent.click(screen.getByRole('button', { name: /fantasy/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    // Fill in basic info
    fireEvent.change(screen.getByLabelText(/world name/i), { target: { value: 'Test World' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    // Fill in description and proceed
    const descriptionTextarea = screen.getByLabelText(/Description/i);
    fireEvent.change(descriptionTextarea, { target: { value: 'A world of magic' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Should show loading state
    expect(screen.getByText(/Analyzing world description/i)).toBeInTheDocument();
  });

  it('should display AI suggestions in attribute review step', async () => {
    render(<WorldCreationWizard defaultWorlds={defaultWorlds} onComplete={mockCreateWorld} showFirstStep={true} />);

    // Navigate through the wizard
    fireEvent.click(screen.getByRole('button', { name: /fantasy/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    fireEvent.change(screen.getByLabelText(/world name/i), { target: { value: 'Test World' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    const descriptionTextarea = screen.getByLabelText(/Description/i);
    fireEvent.change(descriptionTextarea, { target: { value: 'A world of magic' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Wait for AI suggestions to load
    await waitFor(() => {
      expect(screen.getByText('Strength')).toBeInTheDocument();
    });

    // Verify suggestions are displayed
    expect(screen.getByText('Physical power')).toBeInTheDocument();
    expect(screen.getByText('Intelligence')).toBeInTheDocument();
    expect(screen.getByText('Mental capacity')).toBeInTheDocument();
  });

  it('should allow accepting and rejecting AI attribute suggestions', async () => {
    render(<WorldCreationWizard defaultWorlds={defaultWorlds} onComplete={mockCreateWorld} showFirstStep={true} />);

    // Navigate to attribute review
    fireEvent.click(screen.getByRole('button', { name: /fantasy/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    fireEvent.change(screen.getByLabelText(/world name/i), { target: { value: 'Test World' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'A world of magic' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => {
      expect(screen.getByText('Strength')).toBeInTheDocument();
    });

    // Toggle attribute acceptance
    const strengthCheckbox = screen.getByTestId('attribute-checkbox-0');
    fireEvent.click(strengthCheckbox);
    
    expect(strengthCheckbox).toBeChecked();
    
    // Continue to skills step
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    // The accepted attribute should be reflected in the world creation
    await waitFor(() => {
      expect(screen.getByText(/Review Skills/i)).toBeInTheDocument();
    });
  });

  it('should handle AI suggestion failures gracefully', async () => {
    // Mock AI failure
    mockAnalyzeWorldDescription.mockRejectedValue(new Error('AI service unavailable'));

    render(<WorldCreationWizard defaultWorlds={defaultWorlds} onComplete={mockCreateWorld} showFirstStep={true} />);

    // Navigate to description step
    fireEvent.click(screen.getByRole('button', { name: /fantasy/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    fireEvent.change(screen.getByLabelText(/world name/i), { target: { value: 'Test World' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'A world of magic' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Should still proceed with default suggestions
    await waitFor(() => {
      expect(screen.getByText(/Review Attributes/i)).toBeInTheDocument();
    });
    
    // Default suggestions should be available
    expect(screen.getByText('Strength')).toBeInTheDocument();
  });

  it('should integrate AI suggestions into final world creation', async () => {
    render(<WorldCreationWizard defaultWorlds={defaultWorlds} onComplete={mockCreateWorld} showFirstStep={true} />);

    // Navigate through the wizard
    fireEvent.click(screen.getByRole('button', { name: /fantasy/i }));
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    fireEvent.change(screen.getByLabelText(/world name/i), { target: { value: 'AI World' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    
    fireEvent.change(screen.getByLabelText(/Description/i), { target: { value: 'A world with AI suggestions' } });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Wait for AI suggestions
    await waitFor(() => {
      expect(screen.getByText('Strength')).toBeInTheDocument();
    });

    // Accept some suggestions
    fireEvent.click(screen.getByTestId('attribute-checkbox-0')); // Accept Strength
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Skip through skills
    await waitFor(() => {
      expect(screen.getByText(/Review Skills/i)).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    // Complete wizard
    fireEvent.click(screen.getByRole('button', { name: /create world/i }));

    // Verify the world was created with AI-suggested attributes
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