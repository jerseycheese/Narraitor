import React from 'react';
import { render, screen, act } from '@testing-library/react';
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

// Mock ResizeObserver
const mockObserve = jest.fn();
const mockUnobserve = jest.fn();
const mockDisconnect = jest.fn();

class MockResizeObserver {
  observe = mockObserve;
  unobserve = mockUnobserve;
  disconnect = mockDisconnect;
}

global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

describe('NarrativeHistory (Streaming & Anchoring)', () => {
  const mockIsFeatureEnabled = isFeatureEnabled as jest.MockedFunction<typeof isFeatureEnabled>;
  const mockScrollTo = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    mockIsFeatureEnabled.mockReturnValue(false);
    mockZustandStore(useNPCStore as jest.MockedFunction<typeof useNPCStore>, createMockNPCStore());

    // Mock scrollTo
    Element.prototype.scrollTo = mockScrollTo;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  const segments = [
    createMockNarrativeSegment({ id: 'seg-1', content: 'First segment.' }),
  ];

  it('renders segments immediately when BUFFERED_STREAMING is disabled', () => {
    mockIsFeatureEnabled.mockReturnValue(false);
    render(<NarrativeHistory segments={segments} />);
    expect(screen.getByText('First segment.')).toBeInTheDocument();
  });

  it('uses buffered rendering when BUFFERED_STREAMING is enabled', async () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    const { rerender } = render(<NarrativeHistory segments={[segments[0]]} />);

    expect(screen.getByText('First segment.')).toBeInTheDocument();

    const newSegments = [
      ...segments,
      createMockNarrativeSegment({ id: 'seg-2', content: 'Streaming content.' }),
    ];

    await act(async () => {
      rerender(<NarrativeHistory segments={newSegments} />);
    });

    // Run timers in a loop
    for (let i = 0; i < 20; i++) {
      await act(async () => {
        jest.advanceTimersByTime(100);
      });
    }

    expect(screen.getByText(/Streaming content/)).toBeInTheDocument();
  });

  it('anchors to bottom during growth when near bottom', () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    render(<NarrativeHistory segments={segments} />);
    expect(mockObserve).toHaveBeenCalled();
  });

  it('auto-scrolls when new segments are added while user is near bottom', () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    const { container, rerender } = render(
      <NarrativeHistory segments={segments} disableInitialAutoScroll={true} />
    );

    const viewport = container.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
    expect(viewport).toBeTruthy();

    Object.defineProperty(viewport, 'scrollTop', {
      configurable: true,
      get: () => 900,
    });
    Object.defineProperty(viewport, 'scrollHeight', {
      configurable: true,
      get: () => 1000,
    });
    Object.defineProperty(viewport, 'clientHeight', {
      configurable: true,
      get: () => 90,
    });

    act(() => {
      viewport.dispatchEvent(new Event('scroll'));
    });

    mockScrollTo.mockClear();

    rerender(
      <NarrativeHistory
        segments={[
          ...segments,
          createMockNarrativeSegment({ id: 'seg-2', content: 'Near-bottom update.' }),
        ]}
        disableInitialAutoScroll={true}
      />
    );

    expect(mockScrollTo).toHaveBeenCalled();
    expect(mockScrollTo).toHaveBeenLastCalledWith(
      expect.objectContaining({ behavior: 'auto' })
    );
  });

  it('does not force-scroll when user has scrolled away from bottom', () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    const { container, rerender } = render(
      <NarrativeHistory segments={segments} disableInitialAutoScroll={true} />
    );

    const viewport = container.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
    expect(viewport).toBeTruthy();

    Object.defineProperty(viewport, 'scrollTop', {
      configurable: true,
      get: () => 100,
    });
    Object.defineProperty(viewport, 'scrollHeight', {
      configurable: true,
      get: () => 1000,
    });
    Object.defineProperty(viewport, 'clientHeight', {
      configurable: true,
      get: () => 200,
    });

    act(() => {
      viewport.dispatchEvent(new Event('scroll'));
    });

    mockScrollTo.mockClear();

    rerender(
      <NarrativeHistory
        segments={[
          ...segments,
          createMockNarrativeSegment({ id: 'seg-3', content: 'Scrolled-up update.' }),
        ]}
        disableInitialAutoScroll={true}
      />
    );

    expect(mockScrollTo).not.toHaveBeenCalled();
  });

  it('does not auto-scroll when viewport is not near bottom by default', () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    const { container, rerender } = render(
      <NarrativeHistory segments={segments} disableInitialAutoScroll={true} />
    );

    const viewport = container.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
    expect(viewport).toBeTruthy();

    Object.defineProperty(viewport, 'scrollTop', {
      configurable: true,
      get: () => 0,
    });
    Object.defineProperty(viewport, 'scrollHeight', {
      configurable: true,
      get: () => 1200,
    });
    Object.defineProperty(viewport, 'clientHeight', {
      configurable: true,
      get: () => 200,
    });

    mockScrollTo.mockClear();

    rerender(
      <NarrativeHistory
        segments={[
          ...segments,
          createMockNarrativeSegment({ id: 'seg-4', content: 'Far-from-bottom update.' }),
        ]}
        disableInitialAutoScroll={true}
      />
    );

    expect(mockScrollTo).not.toHaveBeenCalled();
  });

  it('does not auto-scroll until user has interacted with the narrative viewport', () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    const { container, rerender } = render(
      <NarrativeHistory segments={segments} disableInitialAutoScroll={true} />
    );

    const viewport = container.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
    expect(viewport).toBeTruthy();

    Object.defineProperty(viewport, 'scrollTop', {
      configurable: true,
      get: () => 0,
    });
    Object.defineProperty(viewport, 'scrollHeight', {
      configurable: true,
      get: () => 80,
    });
    Object.defineProperty(viewport, 'clientHeight', {
      configurable: true,
      get: () => 200,
    });

    mockScrollTo.mockClear();

    rerender(
      <NarrativeHistory
        segments={[
          ...segments,
          createMockNarrativeSegment({ id: 'seg-5', content: 'No-scroll-interaction update.' }),
        ]}
        disableInitialAutoScroll={true}
      />
    );

    expect(mockScrollTo).not.toHaveBeenCalled();
  });

  it('locks the scroll area root height to its container for layout stability', () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    const { container } = render(
      <NarrativeHistory
        segments={[
          ...segments,
          createMockNarrativeSegment({ id: 'seg-6', content: 'Height lock check.' }),
        ]}
        disableInitialAutoScroll={true}
      />
    );

    const historyContainer = container.querySelector('.narrative-history-container') as HTMLDivElement;
    expect(historyContainer).toBeTruthy();
    expect(historyContainer.style.height).toBe('100%');

    const scrollRoot = container.querySelector('.mobile-scroll') as HTMLDivElement;
    expect(scrollRoot).toBeTruthy();
    expect(scrollRoot.style.height).toBe('100%');
  });
});
