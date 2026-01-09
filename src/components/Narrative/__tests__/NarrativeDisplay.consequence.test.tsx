// src/components/Narrative/__tests__/NarrativeDisplay.consequence.test.tsx

import React from 'react';
import { render, screen } from '@testing-library/react';
import { NarrativeDisplay } from '../NarrativeDisplay';
import { createMockNarrativeSegment, mockZustandStore, createMockNPCStore } from '@/lib/test-utils';
import { useNPCStore } from '@/state/npcStore';
import { useNarrativeStore } from '@/state/narrativeStore';

jest.mock('@/state/npcStore');
jest.mock('@/state/narrativeStore');

describe('NarrativeDisplay - Consequence Badge Integration (Issue #971)', () => {
  beforeEach(() => {
    // Mock NPC store (required by NarrativeDisplay)
    mockZustandStore(useNPCStore as jest.MockedFunction<typeof useNPCStore>, createMockNPCStore({
      npcs: {},
    }));

    // Mock narrative store with session segments and segment data for distance calculation
    const mockSegments = {
      'seg-0': { metadata: { causedByDecisionId: 'decision-1' } },
      'seg-1': { metadata: { causedByDecisionId: 'decision-1' } },
      'seg-2': { metadata: { causedByDecisionId: 'decision-1' } },
      'seg-3': { metadata: { causedByDecisionId: 'decision-1' } },
      'seg-4': { metadata: { causedByDecisionId: 'decision-1' } },
    };

    (useNarrativeStore as unknown as jest.Mock).mockReturnValue({
      sessionSegments: {
        'session-123': ['seg-0', 'seg-1', 'seg-2', 'seg-3', 'seg-4']
      },
      segments: mockSegments,
    });
    (useNarrativeStore.getState as jest.Mock) = jest.fn(() => ({
      sessionSegments: {
        'session-123': ['seg-0', 'seg-1', 'seg-2', 'seg-3', 'seg-4']
      },
      segments: mockSegments,
    }));
  });

  it('should show consequence badge when decision link exists', () => {
    const segment = createMockNarrativeSegment({
      id: 'seg-1',
      sessionId: 'session-123',
      content: 'The merchant thanks you warmly.',
      type: 'scene',
      metadata: {
        tags: [],
        causedByDecisionId: 'decision-1',
        causedByDecisionText: 'You helped the merchant'
      }
    });

    render(<NarrativeDisplay segment={segment} />);

    // Badge should be visible
    const badge = screen.getByText(/You helped the merchant/).closest('[data-consequence]');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute('data-consequence', 'immediate');
  });

  it('should not show badge when no decision link exists', () => {
    const segment = createMockNarrativeSegment({
      id: 'seg-0',
      sessionId: 'session-123',
      content: 'You find yourself in a bustling marketplace.',
      type: 'scene',
      metadata: {
        tags: []
        // No causedByDecisionId or causedByDecisionText
      }
    });

    render(<NarrativeDisplay segment={segment} />);

    // No badge should be visible
    expect(document.querySelector('[data-consequence]')).not.toBeInTheDocument();
  });

  it('should show immediate consequence badge for early segments (index 0-2)', () => {
    const testCases = [
      { id: 'seg-0', index: 0 },
      { id: 'seg-1', index: 1 },
      { id: 'seg-2', index: 2 },
    ];

    testCases.forEach(({ id, index }) => {
      const segment = createMockNarrativeSegment({
        id,
        sessionId: 'session-123',
        content: `Segment at index ${index}`,
        type: 'scene',
        metadata: {
          tags: [],
          causedByDecisionId: 'decision-1',
          causedByDecisionText: 'You investigated'
        }
      });

      const { unmount } = render(<NarrativeDisplay segment={segment} />);

      const badge = screen.getByText(/You investigated/).closest('[data-consequence]');
      expect(badge).toHaveAttribute('data-consequence', 'immediate');

      unmount();
    });
  });

  it('should show longer-term consequence badge for later segments (index 3+)', () => {
    const testCases = [
      { id: 'seg-3', index: 3 },
      { id: 'seg-4', index: 4 },
    ];

    testCases.forEach(({ id, index }) => {
      const segment = createMockNarrativeSegment({
        id,
        sessionId: 'session-123',
        content: `Segment at index ${index}`,
        type: 'scene',
        metadata: {
          tags: [],
          causedByDecisionId: 'decision-1',
          causedByDecisionText: 'You investigated'
        }
      });

      const { unmount } = render(<NarrativeDisplay segment={segment} />);

      const badge = screen.getByText(/You investigated/).closest('[data-consequence]');
      expect(badge).toHaveAttribute('data-consequence', 'longer-term');

      unmount();
    });
  });

  it('should display badge before segment type label', () => {
    const segment = createMockNarrativeSegment({
      id: 'seg-1',
      sessionId: 'session-123',
      content: 'You investigate the area.',
      type: 'action',
      metadata: {
        tags: [],
        causedByDecisionId: 'decision-1',
        causedByDecisionText: 'You looked around'
      }
    });

    const { container } = render(<NarrativeDisplay segment={segment} />);

    // Find badge and segment type elements
    const badge = screen.getByText(/You looked around/).closest('[data-consequence]');
    const segmentType = screen.getByText('action');

    expect(badge).toBeInTheDocument();
    expect(segmentType).toBeInTheDocument();

    // Badge should appear before segment type in DOM order
    const allElements = Array.from(container.querySelectorAll('*'));
    const badgeIndex = allElements.indexOf(badge);
    const typeIndex = allElements.indexOf(segmentType);

    expect(badgeIndex).toBeLessThan(typeIndex);
  });

  it('should handle segments with partial decision metadata gracefully', () => {
    // Only causedByDecisionId, no text
    const segment1 = createMockNarrativeSegment({
      id: 'seg-1',
      sessionId: 'session-123',
      content: 'Something happens.',
      type: 'scene',
      metadata: {
        tags: [],
        causedByDecisionId: 'decision-1'
        // Missing causedByDecisionText
      }
    });

    const { unmount: unmount1 } = render(<NarrativeDisplay segment={segment1} />);
    // Should not show badge (both fields required)
    expect(document.querySelector('[data-consequence]')).not.toBeInTheDocument();
    unmount1();

    // Only causedByDecisionText, no ID
    const segment2 = createMockNarrativeSegment({
      id: 'seg-2',
      sessionId: 'session-123',
      content: 'Something else happens.',
      type: 'scene',
      metadata: {
        tags: [],
        // Missing causedByDecisionId
        causedByDecisionText: 'You did something'
      }
    });

    const { unmount: unmount2 } = render(<NarrativeDisplay segment={segment2} />);
    // Should not show badge (both fields required)
    expect(document.querySelector('[data-consequence]')).not.toBeInTheDocument();
    unmount2();
  });

  it('should preserve other segment metadata and functionality', () => {
    const segment = createMockNarrativeSegment({
      id: 'seg-1',
      sessionId: 'session-123',
      content: 'You investigate the mysterious area.',
      type: 'action',
      metadata: {
        tags: ['investigation'],
        location: 'Old warehouse',
        mood: 'mysterious' as const,
        causedByDecisionId: 'decision-1',
        causedByDecisionText: 'You investigated'
      }
    });

    render(<NarrativeDisplay segment={segment} />);

    // Badge should be shown
    const badge = screen.getByText(/You investigated/).closest('[data-consequence]');
    expect(badge).toHaveAttribute('data-consequence', 'immediate');

    // Other segment information should still be present
    expect(screen.getByText('action')).toBeInTheDocument();
    expect(screen.getByText(/investigate the mysterious area/)).toBeInTheDocument();
    expect(screen.getByText('Old warehouse')).toBeInTheDocument();
  });

  it('should work with different decision text formats', () => {
    const testTexts = [
      'You helped the merchant',
      'You attacked the enemy',
      'You ran away quickly',
      'You investigated the area',
    ];

    testTexts.forEach((text) => {
      const segment = createMockNarrativeSegment({
        id: 'seg-1',
        sessionId: 'session-123',
        content: 'Something happens.',
        type: 'scene',
        metadata: {
          tags: [],
          causedByDecisionId: 'decision-1',
          causedByDecisionText: text
        }
      });

      const { unmount } = render(<NarrativeDisplay segment={segment} />);
      expect(screen.getByText(new RegExp(text))).toBeInTheDocument();
      unmount();
    });
  });

  it('should handle missing sessionId gracefully', () => {
    const segment = createMockNarrativeSegment({
      id: 'seg-1',
      // No sessionId
      content: 'Something happens.',
      type: 'scene',
      metadata: {
        tags: [],
        causedByDecisionId: 'decision-1',
        causedByDecisionText: 'You did something'
      }
    });

    // Should not crash
    expect(() => {
      render(<NarrativeDisplay segment={segment} />);
    }).not.toThrow();
  });
});
