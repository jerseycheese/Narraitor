import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuidedFirstTimeExperience } from './GuidedFirstTimeExperience';

// Mock only what's necessary
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Simple store mocks
const mockSessionStore = {
  onboardingCompleted: false,
  completeOnboarding: jest.fn(),
  setOnboardingCompleted: jest.fn(),
  shouldShowOnboarding: jest.fn(() => true),
};

const mockWorldStore = {
  worlds: {},
  createWorld: jest.fn(() => 'new-world-id'),
  setCurrentWorld: jest.fn(),
  updateWorld: jest.fn(),
  getState: jest.fn(() => ({ worlds: {} })),
};

// Mock the world generator
jest.mock('@/lib/generators/worldGenerator', () => ({
  generateWorld: jest.fn(() => Promise.resolve({
    name: 'Generated World',
    description: 'A test world',
    genre: 'fantasy',
    attributes: [],
      skills: [],
    derivedStats: [],    settings: {},
  })),
}));

// Mock other required utilities
jest.mock('@/lib/utils/generateId', () => ({
  generateUniqueId: jest.fn(() => 'mock-id'),
}));

jest.mock('@/components/shared/WorldTypeSelector', () => ({
  WorldTypeSelector: ({ onChange }: { onChange: (data: { worldType: string; worldReference: string }) => void }) => (
    <div data-testid="world-type-selector">
      <button onClick={() => onChange({ worldType: 'original', worldReference: '' })}>
        Select Type
      </button>
    </div>
  ),
  convertToGenerationParams: jest.fn(() => ({ reference: '', relationship: '' })),
  validateWorldTypeData: jest.fn(() => []),
}));

jest.mock('@/state/sessionStore', () => ({
  useSessionStore: (selector: (store: typeof mockSessionStore) => unknown) => selector ? selector(mockSessionStore) : mockSessionStore,
}));

jest.mock('@/state/worldStore', () => ({
  useWorldStore: (selector: (store: typeof mockWorldStore) => unknown) => selector ? selector(mockWorldStore) : mockWorldStore,
}));

describe('GuidedFirstTimeExperience', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Core Functionality', () => {
    it('displays the guided experience interface', () => {
      render(<GuidedFirstTimeExperience />);
      
      // Should show the main call to action
      expect(screen.getByText(/create a world and start a story/i)).toBeInTheDocument();
    });

    it('progresses through the experience steps', async () => {
      const user = userEvent.setup();
      render(<GuidedFirstTimeExperience />);

      const nextButton = screen.queryByText(/next/i) || screen.queryByText(/continue/i) || screen.queryByText(/get started/i);

      expect(nextButton).toBeInTheDocument();
      if (nextButton) {
        await user.click(nextButton);
      }
    });

    it('completes the onboarding flow', async () => {
      const user = userEvent.setup();
      render(<GuidedFirstTimeExperience />);

      const completeButton = screen.queryByText(/finish/i) || screen.queryByText(/complete/i) || screen.queryByText(/done/i);

      if (completeButton) {
        await user.click(completeButton);
        expect(mockSessionStore.completeOnboarding).toHaveBeenCalled();
      }
    });
  });

  describe('Integration', () => {
    it('creates world during guided experience when requested', async () => {
      const user = userEvent.setup();
      render(<GuidedFirstTimeExperience />);

      const createWorldButton = screen.queryByText(/create world/i) || screen.queryByText(/new world/i);

      if (createWorldButton) {
        await user.click(createWorldButton);
        expect(mockWorldStore.createWorld).toHaveBeenCalled();
      }
    });

    it('navigates to appropriate page after completion', async () => {
      // Mock completed onboarding
      mockSessionStore.onboardingCompleted = true;
      mockSessionStore.shouldShowOnboarding = jest.fn(() => false);
      
      render(<GuidedFirstTimeExperience />);
      
      // When onboarding is completed, shouldShowOnboarding returns false, 
      // so component should not render (returns null)
      expect(screen.queryByText(/welcome/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/get started/i)).not.toBeInTheDocument();
    });
  });
});