import React from 'react';
import { render, screen } from '@testing-library/react';
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

describe('NarrativeHistory (session-relative time dividers)', () => {
  const mockIsFeatureEnabled = isFeatureEnabled as jest.MockedFunction<typeof isFeatureEnabled>;

  beforeEach(() => {
    mockIsFeatureEnabled.mockReturnValue(false);
    mockZustandStore(useNPCStore as jest.MockedFunction<typeof useNPCStore>, createMockNPCStore());
    Element.prototype.scrollTo = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders no divider before the first segment', () => {
    const segments = [
      createMockNarrativeSegment({ id: 'seg-1', content: 'First segment.' }),
    ];
    render(<NarrativeHistory segments={segments} />);
    expect(screen.queryByText('BEGINNING OF SESSION')).not.toBeInTheDocument();
  });

  it('labels the divider between two segments with the elapsed-time bucket', () => {
    const first = createMockNarrativeSegment({
      id: 'seg-1',
      content: 'First segment.',
      timestamp: new Date('2026-08-09T12:00:00Z'),
    });
    const second = createMockNarrativeSegment({
      id: 'seg-2',
      content: 'Second segment.',
      timestamp: new Date('2026-08-09T12:05:00Z'),
    });
    render(<NarrativeHistory segments={[first, second]} />);
    expect(screen.getByText('5 MINUTES AGO')).toBeInTheDocument();
  });
});
