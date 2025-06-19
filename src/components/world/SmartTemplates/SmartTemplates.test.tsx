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
};

jest.mock('@/state/sessionStore', () => ({
  sessionStore: {
    getState: () => mockSessionStore,
    subscribe: jest.fn(),
    setState: jest.fn(),
  }
}));

describe('SmartTemplates', () => {
  const mockOnTemplateGenerated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Template Generation Modes', () => {
    test('displays all three template generation modes', () => {
      render(<SmartTemplates onTemplateGenerated={mockOnTemplateGenerated} />);
      
      expect(screen.getByText(/I want something like/i)).toBeInTheDocument();
      expect(screen.getByText(/Genre Mixer/i)).toBeInTheDocument();
      expect(screen.getByText(/Surprise me/i)).toBeInTheDocument();
    });

    test('allows user input for "inspired by" mode', () => {
      render(<SmartTemplates onTemplateGenerated={mockOnTemplateGenerated} />);
      
      const input = screen.getByPlaceholderText(/describe what you want/i);
      fireEvent.change(input, { target: { value: 'Steampunk Victorian London' } });
      
      expect(input).toHaveValue('Steampunk Victorian London');
    });

    test('allows genre selection for genre mixer', () => {
      render(<SmartTemplates onTemplateGenerated={mockOnTemplateGenerated} />);
      
      // Find genre selection controls
      const cyberpunkOption = screen.getByText('Cyberpunk');
      const westernOption = screen.getByText('Western');
      
      fireEvent.click(cyberpunkOption);
      fireEvent.click(westernOption);
      
      expect(cyberpunkOption).toHaveClass('selected');
      expect(westernOption).toHaveClass('selected');
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
      require('@/lib/ai/narrativeGenerator').NarrativeGenerator.mockImplementation(() => ({
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
      require('@/lib/ai/narrativeGenerator').NarrativeGenerator.mockImplementation(() => ({
        generateWorldTemplate: mockGenerateWorldTemplate
      }));

      render(<SmartTemplates onTemplateGenerated={mockOnTemplateGenerated} />);
      
      const generateButton = screen.getByRole('button', { name: /surprise me/i });
      fireEvent.click(generateButton);
      
      expect(screen.getByText(/generating/i)).toBeInTheDocument();
    });

    test('handles generation errors gracefully', async () => {
      // Mock failed generation
      const mockGenerateWorldTemplate = jest.fn().mockRejectedValue(new Error('Generation failed'));
      require('@/lib/ai/narrativeGenerator').NarrativeGenerator.mockImplementation(() => ({
        generateWorldTemplate: mockGenerateWorldTemplate
      }));

      render(<SmartTemplates onTemplateGenerated={mockOnTemplateGenerated} />);
      
      const generateButton = screen.getByRole('button', { name: /surprise me/i });
      fireEvent.click(generateButton);
      
      await waitFor(() => {
        expect(screen.getByText(/failed to generate/i)).toBeInTheDocument();
      });
    });
  });

  describe('Template History', () => {
    test('displays recent templates when available', () => {
      mockSessionStore.templateHistory = [
        { name: 'Previous World', theme: 'Sci-Fi', generatedAt: '2023-01-01' }
      ];

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