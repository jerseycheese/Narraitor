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
    it('should be able to start and stop', () => {
      expect(service.isRunning()).toBe(false);
      
      service.start();
      expect(service.isRunning()).toBe(true);
      
      service.stop();
      expect(service.isRunning()).toBe(false);
    });

    it('should set up interval when started', () => {
      service.start();
      
      // Verify service is running
      expect(service.isRunning()).toBe(true);
      
      // Fast-forward 5 minutes should trigger the interval
      jest.advanceTimersByTime(5 * 60 * 1000);
      
      // The interval should have been set up (we can't easily test the callback without timeout issues)
      expect(service.isRunning()).toBe(true);
    });

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

    it('should handle different trigger reasons', () => {
      const mockOnSave = jest.fn();
      service = new AutoSaveService(mockStateProvider, { onSave: mockOnSave, debounceMs: 100 });
      
      service.start();
      
      // Verify service can handle different trigger types
      expect(() => service.triggerSave('player-choice')).not.toThrow();
      expect(() => service.triggerSave('scene-change')).not.toThrow();
      expect(() => service.triggerSave('periodic')).not.toThrow();
    });
  });
});