/**
 * Tests for AutoSaveService - TDD Implementation
 * Starting with basic functionality tests
 */

import { AutoSaveService } from '../autoSaveService';

// Mock the persistence module
jest.mock('@/state/persistence', () => ({
  createIndexedDBStorage: () => ({
    setItem: jest.fn().mockResolvedValue(undefined),
    getItem: jest.fn().mockResolvedValue(null),
    removeItem: jest.fn().mockResolvedValue(undefined),
  })
}));

describe('AutoSaveService', () => {
  let service: AutoSaveService;
  let mockStateProvider: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockStateProvider = jest.fn().mockResolvedValue({
      session: { id: 'test-session', status: 'active' },
      world: { id: 'world-1', name: 'Test World' },
    });
    
    service = new AutoSaveService(mockStateProvider);
  });

  afterEach(() => {
    service?.stop();
    jest.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should handle paused sessions appropriately', async () => {
      mockStateProvider.mockResolvedValue({
        session: { id: 'test-session', status: 'paused' },
      });
      
      // Test manual trigger with paused session
      await service.triggerSave('manual');
      
      // Should still call state provider for manual saves
      expect(mockStateProvider).toHaveBeenCalled();
    });
  });

  describe('Event-Based Auto-Save', () => {
    it('should save immediately when triggered manually', async () => {
      const mockOnSave = jest.fn();
      service = new AutoSaveService(mockStateProvider, { onSave: mockOnSave });
      
      service.start();
      await service.triggerSave('manual'); // Manual saves are immediate
      
      expect(mockStateProvider).toHaveBeenCalled();
      expect(mockOnSave).toHaveBeenCalled();
    });
  });
});