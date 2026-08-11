import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
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

/**
 * The play surface's one motion rule: the sentence being read holds position.
 * A new beat may appear below it, but must never scroll it out from under the
 * reader — they get a way back to the latest instead.
 *
 * These deliberately leave `disableInitialAutoScroll` off, matching what
 * ActiveGameSessionNarrativeColumn passes. Turning it on switches off the
 * resume-scroll effect, which is precisely the thing most likely to break the
 * rule, so a test that sets it can pass while the app still yanks the reader.
 */
describe('NarrativeHistory (reading position)', () => {
  const mockIsFeatureEnabled = isFeatureEnabled as jest.MockedFunction<typeof isFeatureEnabled>;

  // The component scrolls whichever element it resolves as its viewport; in
  // jsdom that's the ScrollArea's own viewport. Drive its geometry so
  // "near the bottom" and "scrolled up to re-read" are both expressible.
  const setScrollGeometry = ({ scrollTop }: { scrollTop: number }) => {
    const viewport = document.querySelector('[data-radix-scroll-area-viewport]') as HTMLElement;
    Object.defineProperty(viewport, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(viewport, 'clientHeight', { value: 500, configurable: true });
    Object.defineProperty(viewport, 'scrollTop', { value: scrollTop, writable: true, configurable: true });
    return viewport;
  };

  // The resume-scroll effect defers 100ms; flush it so a scroll it schedules
  // can't hide behind the assertion.
  const flushDeferredScroll = () => {
    act(() => {
      jest.advanceTimersByTime(200);
    });
  };

  beforeEach(() => {
    jest.useFakeTimers();
    mockIsFeatureEnabled.mockReturnValue(false);
    mockZustandStore(useNPCStore as jest.MockedFunction<typeof useNPCStore>, createMockNPCStore());
    Element.prototype.scrollTo = jest.fn();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  const segment = (id: string) => createMockNarrativeSegment({ id, content: `Beat ${id}.` });

  /**
   * Render a resumed session the way the app gets there: history renders while
   * still loading, then isLoading flips false once it has stabilized. That flip
   * is what runs the resume-scroll effect — on mount the viewport ref isn't
   * resolved yet — so it's also what arms the regression these tests guard.
   */
  const renderResumedSession = () => {
    const view = render(<NarrativeHistory segments={[segment('seg-1')]} isLoading />);
    setScrollGeometry({ scrollTop: 1500 });
    view.rerender(<NarrativeHistory segments={[segment('seg-1')]} isLoading={false} />);
    flushDeferredScroll();
    return view;
  };

  const scrollTo = () => Element.prototype.scrollTo as jest.Mock;

  it('does not scroll a reader who has scrolled up to re-read', () => {
    const { rerender } = renderResumedSession();

    const viewport = setScrollGeometry({ scrollTop: 0 });
    fireEvent.scroll(viewport);
    scrollTo().mockClear();

    rerender(<NarrativeHistory segments={[segment('seg-1'), segment('seg-2')]} isLoading={false} />);
    flushDeferredScroll();

    expect(scrollTo()).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /jump to latest/i })).toBeInTheDocument();
  });

  it('follows the story down for a reader already at the latest beat', () => {
    const { rerender } = renderResumedSession();

    const viewport = setScrollGeometry({ scrollTop: 1500 });
    fireEvent.scroll(viewport);
    scrollTo().mockClear();

    rerender(<NarrativeHistory segments={[segment('seg-1'), segment('seg-2')]} isLoading={false} />);

    expect(scrollTo()).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /jump to latest/i })).not.toBeInTheDocument();
  });

  it('takes the reader to the latest beat on request', () => {
    const { rerender } = renderResumedSession();

    const viewport = setScrollGeometry({ scrollTop: 0 });
    fireEvent.scroll(viewport);

    rerender(<NarrativeHistory segments={[segment('seg-1'), segment('seg-2')]} isLoading={false} />);
    flushDeferredScroll();

    scrollTo().mockClear();
    fireEvent.click(screen.getByRole('button', { name: /jump to latest/i }));

    expect(scrollTo()).toHaveBeenCalledWith(expect.objectContaining({ top: 2000 }));
    expect(screen.queryByRole('button', { name: /jump to latest/i })).not.toBeInTheDocument();
  });

  it('still opens a resumed session at its latest beat', () => {
    const { rerender } = render(<NarrativeHistory segments={[segment('seg-1')]} isLoading />);
    setScrollGeometry({ scrollTop: 0 });

    scrollTo().mockClear();
    rerender(<NarrativeHistory segments={[segment('seg-1')]} isLoading={false} />);
    flushDeferredScroll();

    expect(scrollTo()).toHaveBeenCalledWith(expect.objectContaining({ top: 2000 }));
  });
});
