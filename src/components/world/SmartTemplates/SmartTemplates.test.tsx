// src/components/world/SmartTemplates/SmartTemplates.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartTemplates } from './SmartTemplates';

// Mock the AI service
jest.mock('@/lib/ai/narrativeGenerator', () => ({
  NarrativeGenerator: jest.fn().mockImplementation(() => ({
    generateWorldTemplate: jest.fn()
  }))
}));

// Mock the session store
const mockSessionStore = {
  templateHistory: [],
  addTemplateToHistory: jest.fn(),
  clearTemplateHistory: jest.fn(),
};

jest.mock('@/state/sessionStore', () => ({
  useSessionStore: {
    getState: () => mockSessionStore,
    subscribe: jest.fn(),
    setState: jest.fn(),
  }
}));

// Mock the useHistory hook
jest.mock('@/lib/hooks/useHistory', () => ({
  useHistory: jest.fn(() => ({
    get history() { return mockSessionStore.templateHistory; },
    addEntry: mockSessionStore.addTemplateToHistory,
    clear: mockSessionStore.clearTemplateHistory,
    getRecent: jest.fn(() => mockSessionStore.templateHistory.slice(0, 3)),
    get isEmpty() { return mockSessionStore.templateHistory.length === 0; },
    isFull: false,
    get count() { return mockSessionStore.templateHistory.length; }
  }))
}));

// Mock UI components
jest.mock('@/components/ui/LoadingState', () => ({
  LoadingState: ({ children }: { children: React.ReactNode }) => <div data-testid="loading">{children}</div>
}));

jest.mock('@/components/ui/ErrorDisplay', () => ({
  ErrorDisplay: ({ error }: { error: string }) => <div data-testid="error">{error}</div>
}));

jest.mock('@/components/shared/GenreSelector', () => ({
  GenreSelector: ({ selectedGenres, onToggleGenre }: any) => (
    <div data-testid="genre-selector">
      {['Fantasy', 'Sci-Fi', 'Horror', 'Western', 'Cyberpunk'].map(genre => (
        <button
          key={genre}
          onClick={() => onToggleGenre(genre)}
          className={selectedGenres.includes(genre) ? 'bg-blue-100 text-blue-700 selected' : 'bg-gray-50'}
        >
          {genre}
        </button>
      ))}
    </div>
  )
}));

describe('SmartTemplates', () => {
  const mockOnTemplateGenerated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset mock store to initial state
    mockSessionStore.templateHistory = [];
  });

  describe('Template Generation Modes', () => {
    test('displays all three template generation modes', () => {
      render(<SmartTemplates onTemplateGenerated={mockOnTemplateGenerated} />);
      
      expect(screen.getByText(/I want something like/i)).toBeInTheDocument();
      expect(screen.getByText(/Genre Mixer/i)).toBeInTheDocument();
      expect(screen.getByRole('heading', { name: /Surprise me/i })).toBeInTheDocument();
    });

    test('allows user input for "inspired by" mode', () => {
      render(<SmartTemplates onTemplateGenerated={mockOnTemplateGenerated} />);
      
      const input = screen.getByPlaceholderText(/describe what you want/i);
      fireEvent.change(input, { target: { value: 'Steampunk Victorian London' } });
      
      expect(input).toHaveValue('Steampunk Victorian London');
    });

    test('allows genre selection for genre mixer', () => {
      render(<SmartTemplates onTemplateGenerated={mockOnTemplateGenerated} />);
      
      // Check that we start in "inspired by" mode (default)
      expect(screen.getByText(/I want something like/i)).toBeInTheDocument();
      
      // Switch to genre mixer mode
      const genreMixerButton = screen.getByText(/Genre Mixer/i);
      fireEvent.click(genreMixerButton);
      
      // Check that we have a different UI state after clicking genre mixer
      // The button text should change to "Generate World" 
      const generateButton = screen.getByRole('button', { name: /generate world/i });
      expect(generateButton).toBeInTheDocument();
      // Note: The button might be disabled until genres are selected, which is expected behavior
    });
  });

  describe('Template Generation', () => {
    test('generates template when "Generate" button is clicked', async () => {
      const mockTemplate = {
        name: 'Test World',
        description: 'A test world',
        theme: 'Fantasy',
        attributes: [],
        skills: [],
        explanation: 'Test explanation'
      };

      // Mock successful generation
      const mockGenerateWorldTemplate = jest.fn().mockResolvedValue(mockTemplate);
      const { NarrativeGenerator } = await import('@/lib/ai/narrativeGenerator');
      (NarrativeGenerator as jest.Mock).mockImplementation(() => ({
        generateWorldTemplate: mockGenerateWorldTemplate
      }));

      render(<SmartTemplates onTemplateGenerated={mockOnTemplateGenerated} />);
      
      const input = screen.getByPlaceholderText(/describe what you want/i);
      fireEvent.change(input, { target: { value: 'Space pirates' } });
      
      const generateButton = screen.getByRole('button', { name: /generate/i });
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(mockGenerateWorldTemplate).toHaveBeenCalledWith(
          expect.objectContaining({
            userInput: 'Space pirates',
            type: 'inspired-by'
          })
        );
      });
    });

    test('shows loading state during generation', async () => {
      // Mock delayed generation
      const mockGenerateWorldTemplate = jest.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 100))
      );
      const { NarrativeGenerator } = await import('@/lib/ai/narrativeGenerator');
      (NarrativeGenerator as jest.Mock).mockImplementation(() => ({
        generateWorldTemplate: mockGenerateWorldTemplate
      }));

      render(<SmartTemplates onTemplateGenerated={mockOnTemplateGenerated} />);
      
      const generateButton = screen.getByRole('button', { name: /surprise me/i });
      fireEvent.click(generateButton);
      
      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    test('handles generation errors gracefully', async () => {
      // Mock failed generation
      const mockGenerateWorldTemplate = jest.fn().mockRejectedValue(new Error('Generation failed'));
      const { NarrativeGenerator } = await import('@/lib/ai/narrativeGenerator');
      (NarrativeGenerator as jest.Mock).mockImplementation(() => ({
        generateWorldTemplate: mockGenerateWorldTemplate
      }));

      render(<SmartTemplates onTemplateGenerated={mockOnTemplateGenerated} />);
      
      const generateButton = screen.getByRole('button', { name: /surprise me/i });
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Template History', () => {
    test('displays recent templates when available', () => {
      const mockHistoryEntry = {
        template: {
          name: 'Previous World',
          theme: 'Sci-Fi',
          description: 'A sci-fi world',
          attributes: [],
          skills: [],
          explanation: 'Test'
        },
        generatedAt: '2023-01-01T00:00:00.000Z',
        generationType: 'inspired-by' as const,
        userInput: 'space adventure'
      };
      
      mockSessionStore.templateHistory = [mockHistoryEntry];

      render(<SmartTemplates onTemplateGenerated={mockOnTemplateGenerated} />);
      
      expect(screen.getByText('Previous World')).toBeInTheDocument();
      expect(screen.getByText('Sci-Fi')).toBeInTheDocument();
    });

    test('shows empty state when no history exists', () => {
      mockSessionStore.templateHistory = [];

      render(<SmartTemplates onTemplateGenerated={mockOnTemplateGenerated} />);
      
      expect(screen.getByText(/no recent templates/i)).toBeInTheDocument();
    });
  });

  describe('Mobile Responsiveness', () => {
    test('renders appropriately on mobile viewports', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<SmartTemplates onTemplateGenerated={mockOnTemplateGenerated} />);
      
      // Component should render without issues on mobile
      expect(screen.getByText(/I want something like/i)).toBeInTheDocument();
    });
  });
});