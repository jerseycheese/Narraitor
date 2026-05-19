// src/components/Narrative/__tests__/NarrativeController.aiEndingDetection.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import { NarrativeController } from '../NarrativeController';
import { useNarrativeStore } from '@/state/narrativeStore';
import { mockZustandStore, createMockNarrativeStore } from '@/lib/test-utils';
import { ToastProvider } from '@/components/ui/toast/toaster';

// Mock the AI client
jest.mock('@/lib/ai/defaultGeminiClient', () => ({
  createDefaultGeminiClient: () => ({
    generateContent: jest.fn()
  })
}));

// Mock the narrative store
jest.mock('@/state/narrativeStore', () => ({
  useNarrativeStore: jest.fn()
}));

// Mock the narrative generator
jest.mock('@/lib/ai/narrativeGenerator', () => ({
  NarrativeGenerator: jest.fn().mockImplementation(() => ({
    generateInitialScene: jest.fn(),
    generateContinuation: jest.fn()
  }))
}));

// Mock the NarrativeHistory component to avoid DOM issues in tests
jest.mock('../NarrativeHistory', () => ({
  NarrativeHistory: ({ segments }: { segments: { content: string }[] }) => (
    <div data-testid="narrative-history">
      {segments.map((segment, index) => (
        <div key={index} data-testid={`segment-${index}`}>
          {segment.content}
        </div>
      ))}
    </div>
  )
}));

describe('NarrativeController - AI Ending Detection Integration', () => {
  const mockOnEndingSuggested = jest.fn();
  const mockAddSegment = jest.fn();
  const mockGetSessionSegments = jest.fn();

  // Helper to wrap component in ToastProvider
  const renderWithToast = (component: React.ReactElement) => {
    return render(<ToastProvider>{component}</ToastProvider>);
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup narrative store mock
    mockZustandStore(useNarrativeStore as jest.MockedFunction<typeof useNarrativeStore>, createMockNarrativeStore({
      addSegment: mockAddSegment,
      getSessionSegments: mockGetSessionSegments
    }));

    // Setup default segments
    mockGetSessionSegments.mockReturnValue([
      { id: '1', content: 'The hero begins their journey to save the kingdom.', type: 'scene' },
      { id: '2', content: 'They meet a wise old mentor who gives them a magical sword.', type: 'scene' },
      { id: '3', content: 'The hero faces their first challenge against dark forces.', type: 'scene' }
    ]);
  });

  describe('Component Integration', () => {
    it('should render NarrativeController with ending detection enabled', () => {
      renderWithToast(
        <NarrativeController
          worldId="test-world"
          sessionId="test-session"
          onEndingSuggested={mockOnEndingSuggested}
          triggerGeneration={false}
        />
      );

      // Should render the controller (NarrativeHistory mock has data-testid="narrative-history")
      expect(screen.getByTestId('narrative-history')).toBeInTheDocument();
    });

  });

  describe('Props and Configuration', () => {
    it('should accept all required props for ending detection', () => {
      const props = {
        worldId: "test-world",
        sessionId: "test-session",
        characterId: "test-character",
        onEndingSuggested: mockOnEndingSuggested,
        triggerGeneration: false,
        generateChoices: false
      };

      renderWithToast(<NarrativeController {...props} />);

      expect(screen.getByTestId('narrative-history')).toBeInTheDocument();
    });
  });
});

/*
 * Note: The actual AI ending detection logic is comprehensively tested 
 * in checkForEndingIndicators.test.ts with 12 detailed test scenarios.
 * 
 * These integration tests focus on component rendering and prop handling
 * rather than duplicating the ending detection logic tests.
 * 
 * For detailed AI ending detection testing, see:
 * - checkForEndingIndicators.test.ts (unit tests)
 * - /dev/ai-ending-detection (manual test harness)
 */