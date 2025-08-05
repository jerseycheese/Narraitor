// src/components/world/SmartTemplates/SmartTemplates.test.tsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartTemplates } from './SmartTemplates';

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock the session store
const mockSessionStore = {
  templateHistory: [],
  addTemplateToHistory: jest.fn(),
  clearTemplateHistory: jest.fn(),
};

jest.mock('@/state/sessionStore', () => ({
  useSessionStore: jest.fn((selector) => {
    if (selector) {
      return selector(mockSessionStore);
    }
    return mockSessionStore;
  })
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

jest.mock('@/components/shared/GenreSelector/GenreSelector', () => ({
  GenreSelector: ({ selectedGenres, onToggleGenre }: { selectedGenres: string[]; onToggleGenre: (genre: string) => void }) => (
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
    // Clear all mocks
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
    // Reset mock store to initial state
    mockSessionStore.templateHistory = [];
  });

  describe('Template Generation Modes', () => {
    test('displays all three template generation modes', () => {
      render(<SmartTemplates onTemplateGenerated={mockOnTemplateGenerated} />);
      
      expect(screen.getByRole('button', { name: /I want something like/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Genre Mixer/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Surprise me!/i })).toBeInTheDocument();
    });

    test('allows user input for "inspired by" mode', () => {
      render(<SmartTemplates onTemplateGenerated={mockOnTemplateGenerated} />);
      
      const input = screen.getByPlaceholderText(/Steampunk Victorian London, Space pirates, etc\./i);
      fireEvent.change(input, { target: { value: 'Steampunk Victorian London' } });
      
      expect(input).toHaveValue('Steampunk Victorian London');
    });

    test('allows genre selection for genre mixer', () => {
      render(<SmartTemplates onTemplateGenerated={mockOnTemplateGenerated} />);
      
      // Check that we start in "inspired by" mode (default)
      expect(screen.getByRole('button', { name: /I want something like/i })).toBeInTheDocument();
      
      // Switch to genre mixer mode
      const genreMixerButton = screen.getByRole('button', { name: /Genre Mixer/i });
      fireEvent.click(genreMixerButton);
      
      // Check that we have a different UI state after clicking genre mixer
      // The button text should be "Mix Genres" 
      const generateButton = screen.getByRole('button', { name: /mix genres/i });
      expect(generateButton).toBeInTheDocument();
      // Note: The button might be disabled until genres are selected, which is expected behavior
    });
  });

  describe('Template Generation', () => {
    test('handles template generation workflow', async () => {
      const mockTemplate = {
        name: 'Test World',
        description: 'A test world',
        genre: 'fantasy',
        attributes: [],
        skills: [],
        explanation: 'Test explanation'
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTemplate),
      });

      render(<SmartTemplates onTemplateGenerated={mockOnTemplateGenerated} />);
      
      // Should have input field
      const input = screen.getByPlaceholderText(/Steampunk Victorian London, Space pirates, etc\./i);
      expect(input).toBeInTheDocument();
      
      // Should be able to enter text
      fireEvent.change(input, { target: { value: 'Space pirates' } });
      expect(input).toHaveValue('Space pirates');
      
      // Should have generate button
      const generateButton = screen.getByRole('button', { name: /generate world/i });
      expect(generateButton).toBeInTheDocument();
      
      // Click should trigger generation
      fireEvent.click(generateButton);
      
      // Verify fetch was called
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/ai/generate-template', expect.any(Object));
      }, { timeout: 1000 });
    });

    test('handles generation errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Generation failed' }),
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<SmartTemplates onTemplateGenerated={mockOnTemplateGenerated} />);
      
      const surpriseMeTab = screen.getByRole('button', { name: /Surprise me!/i });
      fireEvent.click(surpriseMeTab);
      
      const generateButton = screen.getByRole('button', { name: /generate random world/i });
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('error')).toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Template History', () => {
    test('displays recent templates when available', () => {
      const mockHistoryEntry = {
        template: {
          name: 'Previous World',
          genre: 'sci-fi',
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
      expect(screen.getByText('sci-fi')).toBeInTheDocument();
    });

    test('does not show recent templates section when no history exists', () => {
      mockSessionStore.templateHistory = [];

      render(<SmartTemplates onTemplateGenerated={mockOnTemplateGenerated} />);
      
      // Recent Templates section should not be visible when no templates exist
      expect(screen.queryByText(/recent templates/i)).not.toBeInTheDocument();
    });
  });

});