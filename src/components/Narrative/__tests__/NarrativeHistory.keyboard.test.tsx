import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
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

/**
 * jsdom reports every box as zero-sized, which makes the mounted viewport
 * measure as parked at the newest beat. That is the boundary these cases care
 * about: a key pressed there scrolls nowhere, so the browser emits no scroll
 * event, and anything the handler assumed about position is never corrected.
 * No geometry is stubbed to get here.
 */
describe('NarrativeHistory keyboard navigation at the newest beat', () => {
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

  const firstSegment = createMockNarrativeSegment({ id: 'seg-1', content: 'The lake is still.' });
  const secondSegment = createMockNarrativeSegment({ id: 'seg-2', content: 'A branch snaps.' });

  const pressKeyThenAddSegment = (key: string) => {
    const { container, rerender } = render(
      <NarrativeHistory segments={[firstSegment]} disableInitialAutoScroll />
    );

    const history = container.querySelector('.narrative-history-container') as HTMLElement;
    fireEvent.keyDown(history, { key });

    scrollToSpy.mockClear();

    act(() => {
      rerender(
        <NarrativeHistory segments={[firstSegment, secondSegment]} disableInitialAutoScroll />
      );
    });
  };

  it('keeps following after End, which means "take me to the latest"', () => {
    pressKeyThenAddSegment('End');

    expect(scrollToSpy).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /jump to latest/i })).not.toBeInTheDocument();
  });

  it('keeps following after a downward key that had nowhere to go', () => {
    pressKeyThenAddSegment('PageDown');

    expect(scrollToSpy).toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /jump to latest/i })).not.toBeInTheDocument();
  });

  it('stops following after the reader pages back up to re-read', () => {
    pressKeyThenAddSegment('PageUp');

    expect(scrollToSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /jump to latest/i })).toBeInTheDocument();
  });
});
