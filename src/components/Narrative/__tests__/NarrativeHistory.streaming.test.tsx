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
const mockDisconnect = jest.fn();
const resizeObserverInstances: MockResizeObserver[] = [];

class MockResizeObserver {
  callback: ResizeObserverCallback;
  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
    resizeObserverInstances.push(this);
  }
  observe = mockObserve;
  unobserve = jest.fn();
  disconnect = mockDisconnect;
}

global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

describe('NarrativeHistory (Streaming & Anchoring)', () => {
  const mockIsFeatureEnabled = isFeatureEnabled as jest.MockedFunction<typeof isFeatureEnabled>;
  const mockScrollTo = jest.fn();

  beforeEach(() => {
    jest.useFakeTimers();
    resizeObserverInstances.length = 0;
    mockIsFeatureEnabled.mockReturnValue(false);
    mockZustandStore(useNPCStore as jest.MockedFunction<typeof useNPCStore>, createMockNPCStore());
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

  it('sets up ResizeObserver on mount', () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    render(<NarrativeHistory segments={segments} />);
    expect(mockObserve).toHaveBeenCalled();
  });

  it('disconnects ResizeObserver on unmount', () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    const { unmount } = render(<NarrativeHistory segments={segments} />);
    unmount();
    expect(mockDisconnect).toHaveBeenCalled();
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

    // Advance timers to reveal all chunks
    for (let i = 0; i < 20; i++) {
      await act(async () => {
        jest.advanceTimersByTime(100);
      });
    }

    expect(screen.getByText(/Streaming content/)).toBeInTheDocument();
  });

  it('anchors on ResizeObserver updates when user has not manually scrolled', () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    const { container } = render(
      <NarrativeHistory segments={segments} disableInitialAutoScroll={true} />
    );

    const viewport = container.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
    expect(viewport).not.toBeNull();

    Object.defineProperty(viewport, 'scrollHeight', { configurable: true, get: () => 1000 });
    Object.defineProperty(viewport, 'scrollTop', { configurable: true, get: () => 0 });
    Object.defineProperty(viewport, 'clientHeight', { configurable: true, get: () => 100 });

    mockScrollTo.mockClear();

    const resizeObserver = resizeObserverInstances[0];
    expect(resizeObserver).not.toBeUndefined();

    act(() => {
      resizeObserver.callback([], resizeObserver as unknown as ResizeObserver);
    });

    expect(mockScrollTo).toHaveBeenCalled();
    expect(mockScrollTo).toHaveBeenLastCalledWith(
      expect.objectContaining({ behavior: 'auto' })
    );
  });

  it('does not force-scroll on ResizeObserver updates when user has scrolled away from bottom', () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    const { container } = render(
      <NarrativeHistory segments={segments} disableInitialAutoScroll={true} />
    );

    const viewport = container.querySelector('[data-radix-scroll-area-viewport]') as HTMLDivElement;
    expect(viewport).not.toBeNull();

    // User scrolled far from bottom
    Object.defineProperty(viewport, 'scrollTop', { configurable: true, get: () => 100 });
    Object.defineProperty(viewport, 'scrollHeight', { configurable: true, get: () => 1000 });
    Object.defineProperty(viewport, 'clientHeight', { configurable: true, get: () => 200 });

    act(() => {
      viewport.dispatchEvent(new Event('scroll'));
    });

    mockScrollTo.mockClear();

    const resizeObserver = resizeObserverInstances[0];
    expect(resizeObserver).not.toBeUndefined();

    act(() => {
      resizeObserver.callback([], resizeObserver as unknown as ResizeObserver);
    });

    expect(mockScrollTo).not.toHaveBeenCalled();
  });

  describe('streamingContent (issue #1476: real API streaming)', () => {
    it('shows the live preview instead of the spinner once tokens arrive, with no segments yet', () => {
      mockIsFeatureEnabled.mockReturnValue(false);
      render(
        <NarrativeHistory
          segments={[]}
          isLoading={true}
          streamingContent="The door creaks"
        />
      );

      expect(screen.getByText(/The door creaks/)).toBeInTheDocument();
      expect(screen.queryByText('Writing your story...')).not.toBeInTheDocument();
    });

    it('falls back to the spinner before the first token arrives', () => {
      mockIsFeatureEnabled.mockReturnValue(false);
      render(
        <NarrativeHistory segments={[]} isLoading={true} streamingContent="" />
      );

      expect(screen.getByText('Writing your story...')).toBeInTheDocument();
    });

    it('appends the live preview after existing segments while generating the next one', () => {
      mockIsFeatureEnabled.mockReturnValue(false);
      render(
        <NarrativeHistory
          segments={segments}
          isLoading={true}
          streamingContent="A new beat unfolds"
        />
      );

      expect(screen.getByText('First segment.')).toBeInTheDocument();
      expect(screen.getByText(/A new beat unfolds/)).toBeInTheDocument();
    });

    it('does not show a stale preview once loading finishes', () => {
      mockIsFeatureEnabled.mockReturnValue(false);
      const { rerender } = render(
        <NarrativeHistory
          segments={segments}
          isLoading={true}
          streamingContent="A new beat unfolds"
        />
      );
      expect(screen.getByText(/A new beat unfolds/)).toBeInTheDocument();

      rerender(
        <NarrativeHistory segments={segments} isLoading={false} streamingContent="" />
      );

      expect(screen.queryByText(/A new beat unfolds/)).not.toBeInTheDocument();
    });
  });

  it('applies layout classes for height stability', () => {
    mockIsFeatureEnabled.mockReturnValue(true);
    const { container } = render(
      <NarrativeHistory segments={segments} disableInitialAutoScroll={true} />
    );

    const historyContainer = container.querySelector('.narrative-history-container') as HTMLDivElement;
    expect(historyContainer).not.toBeNull();

    const scrollRoot = container.querySelector('.mobile-scroll') as HTMLDivElement;
    expect(scrollRoot).not.toBeNull();

    const scrollViewport = container.querySelector('.scroll-smooth') as HTMLDivElement;
    expect(scrollViewport).not.toBeNull();
  });
});
