import React from 'react';
import { render } from '@testing-library/react';
import { NarrativeHistoryManager } from '../NarrativeHistoryManager';
import { useNarrativeStore } from '@/state/narrativeStore';

jest.mock('../NarrativeHistory', () => ({
  NarrativeHistory: jest.fn(() => <div data-testid="narrative-history" />),
}));

jest.mock('@/state/narrativeStore', () => ({
  useNarrativeStore: Object.assign(jest.fn(), {
    subscribe: jest.fn(),
  }),
}));

describe('NarrativeHistoryManager', () => {
  const mockGetSessionSegments = jest.fn().mockReturnValue([]);
  const mockSubscribe = jest.fn().mockReturnValue(jest.fn());

  beforeEach(() => {
    const mockedStore = useNarrativeStore as unknown as jest.MockedFunction<typeof useNarrativeStore> & {
      subscribe: jest.Mock;
    };

    mockedStore.mockImplementation(((selector?: (state: unknown) => unknown) => {
      const state = { getSessionSegments: mockGetSessionSegments };
      return selector ? selector(state) : state;
    }) as unknown as typeof useNarrativeStore);

    mockedStore.subscribe = mockSubscribe;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('locks manager wrapper height to 100% for stable viewport sizing', () => {
    const { container } = render(<NarrativeHistoryManager sessionId="session-1" />);
    const managerRoot = container.querySelector('.narrative-history-manager') as HTMLDivElement;

    expect(managerRoot).toBeTruthy();
    expect(managerRoot.style.height).toBe('100%');
  });
});
