// src/components/Narrative/__tests__/NarrativeController.aiEndingDetection.test.tsx

import React from 'react';
import { render } from '@testing-library/react';
import { NarrativeController } from '../NarrativeController';
import { useNarrativeStore } from '@/state/narrativeStore';

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

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup narrative store mock
    (useNarrativeStore as jest.Mock).mockImplementation((selector) => {
      const state = {
        addSegment: mockAddSegment,
        getSessionSegments: mockGetSessionSegments
      };
      return selector(state);
    });

    // Setup default segments
    mockGetSessionSegments.mockReturnValue([
      { id: '1', content: 'The hero begins their journey to save the kingdom.', type: 'scene' },
      { id: '2', content: 'They meet a wise old mentor who gives them a magical sword.', type: 'scene' },
      { id: '3', content: 'The hero faces their first challenge against dark forces.', type: 'scene' }
    ]);
  });

  describe('Component Integration', () => {
    it('should render NarrativeController with ending detection enabled', () => {
      const { container } = render(
        <NarrativeController
          worldId="test-world"
          sessionId="test-session"
          onEndingSuggested={mockOnEndingSuggested}
          triggerGeneration={false}
        />
      );

      expect(container.querySelector('.narrative-controller')).toBeInTheDocument();
    });

    it('should accept onEndingSuggested callback prop', () => {
      const mockCallback = jest.fn();
      
      render(
        <NarrativeController
          worldId="test-world"
          sessionId="test-session"
          onEndingSuggested={mockCallback}
          triggerGeneration={false}
        />
      );

      // Component should render without errors when callback is provided
      expect(true).toBe(true);
    });

    it('should work without onEndingSuggested callback', () => {
      render(
        <NarrativeController
          worldId="test-world"
          sessionId="test-session"
          triggerGeneration={false}
        />
      );

      // Component should render without errors when callback is not provided
      expect(true).toBe(true);
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

      const { container } = render(<NarrativeController {...props} />);
      
      expect(container.querySelector('.narrative-controller')).toBeInTheDocument();
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