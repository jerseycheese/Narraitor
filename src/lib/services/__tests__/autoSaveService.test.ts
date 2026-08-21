/**
 * Tests for createAutoSave - TDD Implementation
 * Starting with basic functionality tests
 */

import { createAutoSave, AutoSave } from '../autoSaveService';

// Mock the persistence module
jest.mock('@/state/persistence', () => ({
  createIndexedDBStorage: () => ({
    setItem: jest.fn().mockResolvedValue(undefined),
    getItem: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn().mockResolvedValue(undefined),
  })
}));

describe('createAutoSave', () => {
  let service: AutoSave;
  let mockStateProvider: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockStateProvider = jest.fn().mockResolvedValue({
      session: { id: 'test-session', status: 'active' },
      world: { id: 'world-1', name: 'Test World' },
    });
    
    service = createAutoSave(mockStateProvider);
  });

  afterEach(() => {
    service?.stop();
    jest.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('skips a scheduled save on a paused session but still runs a manual one', async () => {
      const onSave = jest.fn();
      mockStateProvider.mockResolvedValue({
        session: { id: 'test-session', status: 'paused' },
      });
      service = createAutoSave(mockStateProvider, { onSave });

      // A scheduled reason on a paused session reports back as a skip. Not
      // awaited: the debounced promise only settles once the timer runs.
      void service.triggerSave('player-choice');
      await jest.advanceTimersByTimeAsync(600);

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, reason: 'player-choice' })
      );

      onSave.mockClear();

      // The player asking for a save explicitly still goes through.
      await service.triggerSave('manual');

      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, reason: 'manual' })
      );
    });
  });

  describe('Event-Based Auto-Save', () => {
    it('saves a manual trigger immediately and debounces every other reason', async () => {
      const mockOnSave = jest.fn();
      service = createAutoSave(mockStateProvider, { onSave: mockOnSave });

      // No timer is advanced anywhere in this test, so anything that lands is
      // something that did not wait for the debounce window.
      await service.triggerSave('manual');

      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, reason: 'manual' })
      );

      mockOnSave.mockClear();
      service.triggerSave('scene-change');

      expect(mockOnSave).not.toHaveBeenCalled();
    });
  });
});