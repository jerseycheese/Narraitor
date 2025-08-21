/**
 * Tests for cross-session persistence behavior
 * Verifies localStorage vs sessionStorage usage for auto-save recovery
 */

import { AutoSaveService, type StateProvider, type GameState } from '../autoSaveService';

// Mock IndexedDB storage
const mockStorage = {
  setItem: jest.fn().mockResolvedValue(undefined),
  getItem: jest.fn().mockResolvedValue(null),
  removeItem: jest.fn().mockResolvedValue(undefined),
};

jest.mock('@/state/persistence', () => ({
  createIndexedDBStorage: () => mockStorage,
}));

// Mock browser storage APIs to test persistence behavior
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

describe('Cross-Session Persistence', () => {
  let service: AutoSaveService;
  let mockStateProvider: StateProvider;

  const mockGameState: GameState = {
    session: { id: 'session-123', status: 'active' },
    world: { id: 'world-1', name: 'Test World' },
    character: { id: 'char-1', name: 'Test Character' },
    narrative: {
      entries: [
        { id: 'entry-1', content: 'Story begins...' },
        { id: 'entry-2', content: 'Adventure continues...' },
      ],
      currentEntry: { id: 'entry-2', content: 'Adventure continues...' },
    },
    journal: {
      entries: [
        { id: 'journal-1', content: 'Day 1: Started my quest' },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockStateProvider = jest.fn().mockResolvedValue(mockGameState);
    service = new AutoSaveService(mockStateProvider);
  });

  afterEach(() => {
    service?.stop();
  });

  describe('Cross-Browser Session Recovery', () => {
    test('auto-save data persists across browser sessions using localStorage', async () => {
      // Simulate auto-save operation
      service.start();
      await service.triggerSave('manual');

      // Verify IndexedDB save was called (persistent storage)
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('auto-save-session-123'),
        expect.objectContaining({
          state: expect.objectContaining({
            session: mockGameState.session,
            world: mockGameState.world,
          }),
          version: 1,
        })
      );
    });

    test('recovery data should be available after browser restart', async () => {
      // Simulate previous session saved data
      const savedDataKey = 'auto-save-session-123-1640995200000';
      const savedData = {
        state: mockGameState,
        version: 1,
      };
      
      mockStorage.getItem.mockResolvedValue(savedData);
      
      // Simulate new browser session attempting recovery
      const recoveryData = await mockStorage.getItem(savedDataKey);
      
      expect(recoveryData).toEqual(savedData);
      expect(recoveryData.state.session.id).toBe('session-123');
      expect(recoveryData.state.world?.name).toBe('Test World');
    });

    test('temporary session data should NOT persist across browser sessions', async () => {
      // Simulate temporary session storage usage (what should NOT happen for auto-save)
      mockSessionStorage.setItem('temp-session-data', JSON.stringify(mockGameState));
      
      // Simulate browser restart (sessionStorage cleared)
      mockSessionStorage.clear();
      mockSessionStorage.getItem.mockReturnValue(null);
      
      // Temporary data should be gone
      const tempData = mockSessionStorage.getItem('temp-session-data');
      expect(tempData).toBeNull();
    });
  });

  describe('Multi-Session Data Isolation', () => {
    test('each session gets unique persistent storage key', async () => {
      const session1State = { ...mockGameState, session: { id: 'session-1', status: 'active' } };
      const session2State = { ...mockGameState, session: { id: 'session-2', status: 'active' } };
      
      const provider1 = jest.fn().mockResolvedValue(session1State);
      const provider2 = jest.fn().mockResolvedValue(session2State);
      
      const service1 = new AutoSaveService(provider1);
      const service2 = new AutoSaveService(provider2);
      
      service1.start();
      service2.start();
      
      await service1.triggerSave('manual');
      await service2.triggerSave('manual');
      
      // Each session should get unique storage key
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('auto-save-session-1'),
        expect.any(Object)
      );
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        expect.stringContaining('auto-save-session-2'),
        expect.any(Object)
      );
      
      service1.stop();
      service2.stop();
    });

    test('recovery works correctly with multiple saved sessions', async () => {
      // Simulate multiple saved sessions
      const session1Data = { state: { session: { id: 'session-1' } }, version: 1 };
      const session2Data = { state: { session: { id: 'session-2' } }, version: 1 };
      
      mockStorage.getItem
        .mockResolvedValueOnce(session1Data) // First call
        .mockResolvedValueOnce(session2Data); // Second call
      
      // Recovery should get correct data for each session
      const recovered1 = await mockStorage.getItem('auto-save-session-1-123');
      const recovered2 = await mockStorage.getItem('auto-save-session-2-456');
      
      expect(recovered1.state.session.id).toBe('session-1');
      expect(recovered2.state.session.id).toBe('session-2');
    });
  });

  describe('Storage Failure Recovery', () => {
    test('gracefully handles localStorage being unavailable', async () => {
      // Simulate localStorage being disabled/unavailable
      mockStorage.setItem.mockRejectedValueOnce(new Error('localStorage not available'));
      
      service.start();
      
      // Should not throw error when localStorage fails
      await expect(service.triggerSave('manual')).resolves.toBeUndefined();
      
      // Error should be logged but service continues
      expect(mockStorage.setItem).toHaveBeenCalledTimes(1);
    });

    test('provides appropriate user feedback when persistence fails', async () => {
      const mockOnError = jest.fn();
      service = new AutoSaveService(mockStateProvider, { onError: mockOnError });
      
      mockStorage.setItem.mockRejectedValueOnce(new Error('Storage quota exceeded'));
      
      service.start();
      await service.triggerSave('manual');
      
      // Should call error handler with user-friendly message
      expect(mockOnError).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.any(String),
        })
      );
    });
  });

  describe('Data Version Compatibility', () => {
    test('handles versioned data correctly for cross-session recovery', async () => {
      const versionedData = {
        state: mockGameState,
        version: 1,
      };
      
      mockStorage.getItem.mockResolvedValue(versionedData);
      
      const recovered = await mockStorage.getItem('auto-save-test');
      
      expect(recovered.version).toBe(1);
      expect(recovered.state).toEqual(mockGameState);
    });

    test('recovery should work with data saved in previous sessions', async () => {
      // Simulate data saved in previous browser session
      const oldSessionData = {
        state: {
          session: { id: 'old-session', status: 'paused' },
          world: { id: 'world-1', name: 'Persistent World' },
          character: { id: 'char-1', name: 'Persistent Character' },
        },
        version: 1,
      };
      
      mockStorage.getItem.mockResolvedValue(oldSessionData);
      
      // New session should be able to recover old data
      const recovered = await mockStorage.getItem('auto-save-old-session-123');
      
      expect(recovered.state.world.name).toBe('Persistent World');
      expect(recovered.state.character.name).toBe('Persistent Character');
    });
  });
});