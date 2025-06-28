/**
 * Tests for recovery service
 * Tests automatic recovery when IndexedDB is cleared but LocalStorage remains
 */

import { RecoveryService } from '../recoveryService';
import { LocalStorageAdapter } from '../localStorageAdapter';
import { IndexedDBAdapter } from '../indexedDBAdapter';

// Mock the adapters
jest.mock('../localStorageAdapter');
jest.mock('../indexedDBAdapter');

describe('RecoveryService', () => {
  let recoveryService: RecoveryService;
  let mockLocalStorageAdapter: jest.Mocked<LocalStorageAdapter>;
  let mockIndexedDBAdapter: jest.Mocked<IndexedDBAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockLocalStorageAdapter = new LocalStorageAdapter() as jest.Mocked<LocalStorageAdapter>;
    mockIndexedDBAdapter = new IndexedDBAdapter() as jest.Mocked<IndexedDBAdapter>;
    
    recoveryService = new RecoveryService(mockLocalStorageAdapter, mockIndexedDBAdapter);
  });

  describe('recovery detection', () => {
    test('detects recovery needed when IndexedDB empty and LocalStorage has data', async () => {
      // IndexedDB is empty
      mockIndexedDBAdapter.getItem.mockResolvedValue(null);
      
      // LocalStorage has critical state
      mockLocalStorageAdapter.getCriticalState.mockResolvedValue({
        version: '1.0.0',
        lastSaved: new Date().toISOString(),
        activeWorldId: 'world-123',
        activeCharacterId: 'char-456',
        activeSessionId: 'session-789',
      });

      const needsRecovery = await recoveryService.checkRecoveryNeeded();

      expect(needsRecovery).toBe(true);
    });

    test('does not trigger recovery when IndexedDB has data', async () => {
      // IndexedDB has data
      mockIndexedDBAdapter.getItem.mockResolvedValue('{"some":"data"}');
      
      // LocalStorage has critical state
      mockLocalStorageAdapter.getCriticalState.mockResolvedValue({
        version: '1.0.0',
        lastSaved: new Date().toISOString(),
        activeWorldId: 'world-123',
        activeCharacterId: 'char-456',
        activeSessionId: 'session-789',
      });

      const needsRecovery = await recoveryService.checkRecoveryNeeded();

      expect(needsRecovery).toBe(false);
    });

    test('does not trigger recovery when LocalStorage is empty', async () => {
      // IndexedDB is empty
      mockIndexedDBAdapter.getItem.mockResolvedValue(null);
      
      // LocalStorage is empty
      mockLocalStorageAdapter.getCriticalState.mockResolvedValue(null);

      const needsRecovery = await recoveryService.checkRecoveryNeeded();

      expect(needsRecovery).toBe(false);
    });
  });

  describe('recovery process', () => {
    test('performs recovery with user confirmation', async () => {
      const criticalState = {
        version: '1.0.0',
        lastSaved: new Date().toISOString(),
        activeWorldId: 'world-123',
        activeCharacterId: 'char-456',
        activeSessionId: 'session-789',
      };

      mockLocalStorageAdapter.getCriticalState.mockResolvedValue(criticalState);
      
      const result = await recoveryService.performRecovery();

      expect(result.success).toBe(true);
      expect(result.recoveredData).toEqual(criticalState);
      expect(result.message).toBe('Recovery completed successfully');
    });

    test('handles recovery failure gracefully', async () => {
      mockLocalStorageAdapter.getCriticalState.mockRejectedValue(new Error('Storage error'));
      
      const result = await recoveryService.performRecovery();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Recovery failed');
    });

    test('provides recovery preview without performing recovery', async () => {
      const criticalState = {
        version: '1.0.0',
        lastSaved: '2023-01-01T00:00:00.000Z',
        activeWorldId: 'world-123',
        activeCharacterId: 'char-456',
        activeSessionId: 'session-789',
      };

      mockLocalStorageAdapter.getCriticalState.mockResolvedValue(criticalState);
      
      const preview = await recoveryService.getRecoveryPreview();

      expect(preview).toEqual({
        hasRecoverableData: true,
        lastSaved: '2023-01-01T00:00:00.000Z',
        worldCount: 1,
        characterCount: 1,
        sessionCount: 1,
      });
    });
  });

  describe('error handling', () => {
    test('handles storage adapter failures', async () => {
      mockIndexedDBAdapter.getItem.mockRejectedValue(new Error('IndexedDB error'));
      mockLocalStorageAdapter.getCriticalState.mockRejectedValue(new Error('LocalStorage error'));

      const needsRecovery = await recoveryService.checkRecoveryNeeded();

      expect(needsRecovery).toBe(false);
    });
  });
});