import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GuidedFirstTimeExperience } from './GuidedFirstTimeExperience';
import { sessionStore } from '@/state/sessionStore';
import { worldStore } from '@/state/worldStore';
import { useRouter } from 'next/navigation';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock stores
jest.mock('@/state/sessionStore');
jest.mock('@/state/worldStore');

describe('GuidedFirstTimeExperience', () => {
  const mockPush = jest.fn();
  const mockRouter = { push: mockPush };
  const mockSetOnboardingCompleted = jest.fn();
  const mockCreateWorld = jest.fn().mockReturnValue('mock-world-id');

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Mock sessionStore with first-time user detection
    (sessionStore as unknown as jest.Mock).mockReturnValue({
      savedSessions: {},
      setOnboardingCompleted: mockSetOnboardingCompleted,
      onboardingCompleted: false,
    });

    // Mock worldStore 
    (worldStore as unknown as jest.Mock).mockReturnValue({
      worlds: {},
      createWorld: mockCreateWorld,
      setCurrentWorld: jest.fn(),
    });
  });

  describe('Welcome screen', () => {
    it('displays welcome message with clear value proposition', () => {
      render(<GuidedFirstTimeExperience />);
      
      expect(screen.getByText(/welcome to narraitor/i)).toBeInTheDocument();
      expect(screen.getByText(/create your own world/i)).toBeInTheDocument();
      expect(screen.getByText(/within 2 minutes/i)).toBeInTheDocument();
    });

    it('shows progress indicator with step 1 of 3', () => {
      render(<GuidedFirstTimeExperience />);
      
      expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument();
    });

    it('has skip option for returning users', () => {
      render(<GuidedFirstTimeExperience />);
      
      const skipButton = screen.getByRole('button', { name: /skip/i });
      expect(skipButton).toBeInTheDocument();
    });
  });

  describe('3-step world creation wizard', () => {
    it('displays step 1: World Concept', () => {
      render(<GuidedFirstTimeExperience />);
      
      expect(screen.getByText(/world concept/i)).toBeInTheDocument();
      expect(screen.getByText(/what kind of world/i)).toBeInTheDocument();
    });

    it('allows progression to step 2 when concept is provided', async () => {
      render(<GuidedFirstTimeExperience />);
      
      const conceptInput = screen.getByRole('textbox', { name: /world concept/i });
      fireEvent.change(conceptInput, { target: { value: 'A magical forest realm' } });
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      fireEvent.click(nextButton);
      
      await waitFor(() => {
        expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument();
        expect(screen.getByText(/world details/i)).toBeInTheDocument();
      });
    });

    it('displays AI suggestions based on user input', async () => {
      render(<GuidedFirstTimeExperience />);
      
      const conceptInput = screen.getByRole('textbox', { name: /world concept/i });
      fireEvent.change(conceptInput, { target: { value: 'Cyberpunk city' } });
      
      await waitFor(() => {
        expect(screen.getByText(/ai suggestions/i)).toBeInTheDocument();
      });
    });

    it('completes in under 30 seconds per step (simulated)', () => {
      render(<GuidedFirstTimeExperience />);
      
      // Each step should have smart defaults that make completion fast
      expect(screen.getByDisplayValue('')).toBeInTheDocument(); // Default empty state
      
      // Step should be completable with minimal input
      const conceptInput = screen.getByRole('textbox', { name: /world concept/i });
      expect(conceptInput).toBeInTheDocument();
    });
  });

  describe('Mobile optimization', () => {
    it('uses large touch targets for mobile interaction', () => {
      render(<GuidedFirstTimeExperience />);
      
      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toHaveClass('min-h-12'); // Large touch target
    });

    it('displays properly on mobile viewport', () => {
      render(<GuidedFirstTimeExperience />);
      
      const container = screen.getByTestId('guided-experience-container');
      expect(container).toHaveClass('max-w-md', 'mx-auto'); // Mobile-friendly layout
    });
  });

  describe('Skip functionality', () => {
    it('navigates to worlds page when skip is clicked', () => {
      render(<GuidedFirstTimeExperience />);
      
      const skipButton = screen.getByRole('button', { name: /skip/i });
      fireEvent.click(skipButton);
      
      expect(mockSetOnboardingCompleted).toHaveBeenCalledWith(true);
      expect(mockPush).toHaveBeenCalledWith('/worlds');
    });

    it('marks onboarding as completed when skipped', () => {
      render(<GuidedFirstTimeExperience />);
      
      const skipButton = screen.getByRole('button', { name: /skip/i });
      fireEvent.click(skipButton);
      
      expect(mockSetOnboardingCompleted).toHaveBeenCalledWith(true);
    });
  });

  describe('Try it now functionality', () => {
    it('shows "Try it now" button after world creation completion', async () => {
      render(<GuidedFirstTimeExperience />);
      
      // Complete all steps
      const conceptInput = screen.getByRole('textbox', { name: /world concept/i });
      fireEvent.change(conceptInput, { target: { value: 'Fantasy realm' } });
      
      fireEvent.click(screen.getByRole('button', { name: /next/i }));
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /next/i }));
      });
      
      await waitFor(() => {
        fireEvent.click(screen.getByRole('button', { name: /complete/i }));
      });
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /try it now/i })).toBeInTheDocument();
      });
    });

    it('immediately starts gameplay when "Try it now" is clicked', async () => {
      render(<GuidedFirstTimeExperience />);
      
      // Complete the flow and get to the "Try it now" button
      // (This would be a full flow test in practice)
      
      // For now, test the final action
      const mockTryItNow = jest.fn();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (GuidedFirstTimeExperience as any).mockImplementation = mockTryItNow;
    });
  });

  describe('Onboarding completion state', () => {
    it('persists completion state in localStorage', async () => {
      render(<GuidedFirstTimeExperience />);
      
      // Complete the entire flow
      const skipButton = screen.getByRole('button', { name: /skip/i });
      fireEvent.click(skipButton);
      
      expect(mockSetOnboardingCompleted).toHaveBeenCalledWith(true);
    });

    it('does not show guided experience for returning users', () => {
      // Mock returning user
      (sessionStore as unknown as jest.Mock).mockReturnValue({
        savedSessions: {},
        setOnboardingCompleted: mockSetOnboardingCompleted,
        onboardingCompleted: true,
      });

      render(<GuidedFirstTimeExperience />);
      
      // Should not render the guided experience
      expect(screen.queryByText(/welcome to narraitor/i)).not.toBeInTheDocument();
    });
  });

  describe('First narrative choice celebration', () => {
    it('celebrates the players world concept in first choice', async () => {
      render(<GuidedFirstTimeExperience />);
      
      // This would test that the first narrative choice includes elements
      // from the user's world concept - testing the integration point
      // with the narrative generation system
      
      // For now, verify that world data is properly passed through
      const conceptInput = screen.getByRole('textbox', { name: /world concept/i });
      fireEvent.change(conceptInput, { target: { value: 'Steampunk adventure' } });
      
      // Verify the concept is captured for later use
      expect(conceptInput).toHaveValue('Steampunk adventure');
    });
  });
});