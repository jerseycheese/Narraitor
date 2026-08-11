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

/**
 * The play surface's one motion rule: the sentence being read holds position.
 * A new beat may appear below it, but must never scroll it out from under the
 * reader — they get a way back to the latest instead.
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

  beforeEach(() => {
    mockIsFeatureEnabled.mockReturnValue(false);
    mockZustandStore(useNPCStore as jest.MockedFunction<typeof useNPCStore>, createMockNPCStore());
    Element.prototype.scrollTo = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const segment = (id: string) => createMockNarrativeSegment({ id, content: `Beat ${id}.` });

  it('does not scroll a reader who has scrolled up to re-read', () => {
    const { rerender } = render(
      <NarrativeHistory segments={[segment('seg-1')]} disableInitialAutoScroll />
    );

    const viewport = setScrollGeometry({ scrollTop: 0 });
    fireEvent.scroll(viewport);
    (Element.prototype.scrollTo as jest.Mock).mockClear();

    rerender(
      <NarrativeHistory segments={[segment('seg-1'), segment('seg-2')]} disableInitialAutoScroll />
    );

    expect(Element.prototype.scrollTo).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /jump to latest/i })).toBeInTheDocument();
  });

  it('follows the story down for a reader already at the latest beat', () => {
    const { rerender } = render(
      <NarrativeHistory segments={[segment('seg-1')]} disableInitialAutoScroll />
    );

    const viewport = setScrollGeometry({ scrollTop: 1500 });
    fireEvent.scroll(viewport);
    (Element.prototype.scrollTo as jest.Mock).mockClear();

    rerender(
      <NarrativeHistory segments={[segment('seg-1'), segment('seg-2')]} disableInitialAutoScroll />
    );

    expect(Element.prototype.scrollTo).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /jump to latest/i })).not.toBeInTheDocument();
  });

  it('takes the reader to the latest beat on request', () => {
    const { rerender } = render(
      <NarrativeHistory segments={[segment('seg-1')]} disableInitialAutoScroll />
    );

    const viewport = setScrollGeometry({ scrollTop: 0 });
    fireEvent.scroll(viewport);

    rerender(
      <NarrativeHistory segments={[segment('seg-1'), segment('seg-2')]} disableInitialAutoScroll />
    );

    (Element.prototype.scrollTo as jest.Mock).mockClear();
    fireEvent.click(screen.getByRole('button', { name: /jump to latest/i }));

    expect(Element.prototype.scrollTo).toHaveBeenCalledWith(
      expect.objectContaining({ top: 2000 })
    );
    expect(screen.queryByRole('button', { name: /jump to latest/i })).not.toBeInTheDocument();
  });
});
