/**
 * Tests for the world-created funnel event wired into worldStore's createWorld
 * alias (#1619 follow-up). createWorld is the single chokepoint every
 * production world-creation path converges on, so the tracking call lives
 * there instead of in each caller.
 *
 * jest.setup.ts globally auto-mocks '@/state/worldStore' for component tests;
 * unmock it here so these tests exercise the real store.
 */

// Don't mock the store - we want to test the real one
jest.unmock('../worldStore');

import { track } from '@vercel/analytics';
import { useWorldStore } from '../worldStore';
import { createTestWorldData } from './worldStore.testHelpers';

const mockTrack = track as jest.Mock;

describe('useWorldStore - world-created funnel tracking', () => {
  beforeEach(() => {
    useWorldStore.getState().reset();
    mockTrack.mockClear();
  });

  test('createWorld fires the world-created funnel event exactly once', () => {
    useWorldStore.getState().createWorld(createTestWorldData());

    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith('world-created');
  });

  test('calling create directly does not fire analytics', () => {
    useWorldStore.getState().create(createTestWorldData());

    expect(mockTrack).not.toHaveBeenCalled();
  });
});
