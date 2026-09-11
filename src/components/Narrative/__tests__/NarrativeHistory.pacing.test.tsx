import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { NarrativeHistory } from '../NarrativeHistory';
import { isFeatureEnabled } from '@/lib/featureFlags';
import {
  createMockNarrativeSegment,
  createMockNPCStore,
  mockZustandStore,
} from '@/lib/test-utils';
import { useNPCStore } from '@/state/npcStore';

jest.mock('@/lib/featureFlags');
jest.mock('@/state/npcStore');

class MockResizeObserver {
  observe = jest.fn();
  unobserve = jest.fn();
  disconnect = jest.fn();
}
global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

describe('NarrativeHistory session pacing and history collapse', () => {
  const mockIsFeatureEnabled = isFeatureEnabled as jest.MockedFunction<typeof isFeatureEnabled>;
  let scrollToSpy: jest.Mock;

  beforeEach(() => {
    mockIsFeatureEnabled.mockReturnValue(false);
    mockZustandStore(useNPCStore as jest.MockedFunction<typeof useNPCStore>, createMockNPCStore());
    scrollToSpy = jest.fn();
    Element.prototype.scrollTo = scrollToSpy as unknown as Element['scrollTo'];
    Element.prototype.scrollBy = jest.fn() as unknown as Element['scrollBy'];
    Element.prototype.scrollIntoView = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const twelveSegments = Array.from({ length: 12 }, (_, i) =>
    createMockNarrativeSegment({
      id: `seg-${i + 1}`,
      content: `Beat ${i + 1} of the story.`,
    })
  );

  it('renders 7 visible segments and an expand control when 12 segments are provided', () => {
    const { container } = render(
      <NarrativeHistory segments={twelveSegments} disableInitialAutoScroll />
    );

    const visibleSegmentElements = container.querySelectorAll('.narrative-segment');
    expect(visibleSegmentElements).toHaveLength(7);

    // Oldest segment (Beat 1) is hidden, latest segment (Beat 12) is visible
    expect(screen.queryByText(/Beat 1 of the story/i)).not.toBeInTheDocument();
    expect(screen.getByText(/Beat 12 of the story/i)).toBeInTheDocument();

    const expandButton = screen.getByRole('button', { name: /show earlier story/i });
    expect(expandButton).toBeInTheDocument();
    expect(expandButton).toHaveClass('narrative-history-expand-button');
  });

  it('shows all 12 segments and removes the expand button after clicking it', () => {
    const { container } = render(
      <NarrativeHistory segments={twelveSegments} disableInitialAutoScroll />
    );

    const expandButton = screen.getByRole('button', { name: /show earlier story/i });
    fireEvent.click(expandButton);

    const allSegmentElements = container.querySelectorAll('.narrative-segment');
    expect(allSegmentElements).toHaveLength(12);

    expect(screen.getByText(/Beat 1 of the story/i)).toBeInTheDocument();
    expect(screen.getByText(/Beat 12 of the story/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /show earlier story/i })).not.toBeInTheDocument();
  });

  it('preserves keyboard navigation when collapsed and when expanded', () => {
    const { container } = render(
      <NarrativeHistory segments={twelveSegments} disableInitialAutoScroll />
    );

    const historyContainer = container.querySelector('.narrative-history-container') as HTMLElement;

    // Arrow down and PageDown while collapsed
    fireEvent.keyDown(historyContainer, { key: 'ArrowDown' });
    fireEvent.keyDown(historyContainer, { key: 'PageDown' });
    fireEvent.keyDown(historyContainer, { key: 'End' });

    expect(scrollToSpy).toHaveBeenCalled();

    // Expand
    const expandButton = screen.getByRole('button', { name: /show earlier story/i });
    fireEvent.click(expandButton);

    // Arrow keys while expanded
    fireEvent.keyDown(historyContainer, { key: 'ArrowUp' });
    fireEvent.keyDown(historyContainer, { key: 'Home' });

    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });
});
