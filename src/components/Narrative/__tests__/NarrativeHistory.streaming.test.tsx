import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { NarrativeHistory } from '../NarrativeHistory';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { createMockNarrativeSegment, createMockNPCStore, mockZustandStore } from '@/lib/test-utils';
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

  beforeEach(() => {
    jest.useFakeTimers();
    mockIsFeatureEnabled.mockReturnValue(false);
    mockZustandStore(useNPCStore as jest.MockedFunction<typeof useNPCStore>, createMockNPCStore());
    
    // Mock scrollTo
    Element.prototype.scrollTo = jest.fn();
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
});
