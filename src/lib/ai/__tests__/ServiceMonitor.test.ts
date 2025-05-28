import { ServiceMonitor } from '../ServiceMonitor';
import { AIClient } from '../types';

describe('ServiceMonitor', () => {
  let monitor: ServiceMonitor;
  let mockClient: jest.Mocked<AIClient>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockClient = {
      generateContent: jest.fn(),
      generateStructuredContent: jest.fn(),
      isAvailable: jest.fn()
    } as jest.Mocked<AIClient>;

    monitor = new ServiceMonitor(mockClient);
  });

  afterEach(() => {
    jest.useRealTimers();
    monitor.stopMonitoring();
  });

  describe('availability checking', () => {
    it('should check service availability', async () => {
      mockClient.isAvailable.mockResolvedValue(true);
      
      const isAvailable = await monitor.checkAvailability();
      
      expect(isAvailable).toBe(true);
      expect(mockClient.isAvailable).toHaveBeenCalled();
    });

    it('should cache availability status', async () => {
      mockClient.isAvailable.mockResolvedValue(true);
      
      await monitor.checkAvailability();
      const status1 = monitor.getStatus();
      
      // Check again immediately - should use cache
      await monitor.checkAvailability();
      const status2 = monitor.getStatus();
      
      expect(mockClient.isAvailable).toHaveBeenCalledTimes(1);
      expect(status1).toEqual(status2);
    });

    it('should update status on failure', async () => {
      mockClient.isAvailable.mockRejectedValue(new Error('Service down'));
      
      const isAvailable = await monitor.checkAvailability();
      const status = monitor.getStatus();
      
      expect(isAvailable).toBe(false);
      expect(status.isAvailable).toBe(false);
      expect(status.lastError).toBe('Service down');
    });
  });

  describe('automatic monitoring', () => {
    it('should start periodic monitoring', () => {
      monitor.startMonitoring();
      
      expect(monitor.isMonitoring()).toBe(true);
    });

    it('should check availability periodically', async () => {
      mockClient.isAvailable.mockResolvedValue(true);
      
      monitor.startMonitoring(1000); // 1 second interval
      
      // Fast forward time
      jest.advanceTimersByTime(3000);
      
      // Should have been called 3 times
      expect(mockClient.isAvailable).toHaveBeenCalledTimes(3);
    });

    it('should stop monitoring on command', () => {
      monitor.startMonitoring();
      monitor.stopMonitoring();
      
      expect(monitor.isMonitoring()).toBe(false);
      
      // Advance time - should not make more calls
      const callCount = mockClient.isAvailable.mock.calls.length;
      jest.advanceTimersByTime(5000);
      expect(mockClient.isAvailable).toHaveBeenCalledTimes(callCount);
    });

    it('should emit events on status change', async () => {
      const onAvailable = jest.fn();
      const onUnavailable = jest.fn();
      
      monitor.on('available', onAvailable);
      monitor.on('unavailable', onUnavailable);
      
      // Start as available
      mockClient.isAvailable.mockResolvedValueOnce(true);
      await monitor.checkAvailability();
      
      // Change to unavailable
      mockClient.isAvailable.mockResolvedValueOnce(false);
      await monitor.checkAvailability();
      
      // Back to available
      mockClient.isAvailable.mockResolvedValueOnce(true);
      await monitor.checkAvailability();
      
      expect(onUnavailable).toHaveBeenCalledTimes(1);
      expect(onAvailable).toHaveBeenCalledTimes(1); // Only on recovery
    });
  });

  describe('retry management', () => {
    it('should track consecutive failures', async () => {
      mockClient.isAvailable.mockRejectedValue(new Error('Failed'));
      
      await monitor.checkAvailability();
      await monitor.checkAvailability();
      await monitor.checkAvailability();
      
      const status = monitor.getStatus();
      expect(status.consecutiveFailures).toBe(3);
    });

    it('should reset failure count on success', async () => {
      mockClient.isAvailable
        .mockRejectedValueOnce(new Error('Failed'))
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce(true);
      
      await monitor.checkAvailability();
      await monitor.checkAvailability();
      await monitor.checkAvailability();
      
      const status = monitor.getStatus();
      expect(status.consecutiveFailures).toBe(0);
    });

    it('should implement exponential backoff', async () => {
      monitor.startMonitoring(1000);
      
      // Simulate failures
      mockClient.isAvailable.mockRejectedValue(new Error('Failed'));
      
      // First check immediately
      jest.advanceTimersByTime(1000);
      expect(mockClient.isAvailable).toHaveBeenCalledTimes(1);
      
      // Second check after 2 seconds (exponential backoff)
      jest.advanceTimersByTime(2000);
      expect(mockClient.isAvailable).toHaveBeenCalledTimes(2);
      
      // Third check after 4 seconds
      jest.advanceTimersByTime(4000);
      expect(mockClient.isAvailable).toHaveBeenCalledTimes(3);
    });
  });

  describe('status reporting', () => {
    it('should provide comprehensive status', async () => {
      mockClient.isAvailable.mockResolvedValue(true);
      await monitor.checkAvailability();
      
      const status = monitor.getStatus();
      
      expect(status).toMatchObject({
        isAvailable: true,
        lastCheck: expect.any(String),
        consecutiveFailures: 0,
        lastError: null,
        uptime: expect.any(Number)
      });
    });

    it('should calculate uptime percentage', async () => {
      // Simulate mixed availability
      mockClient.isAvailable
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockRejectedValueOnce(new Error('Down'))
        .mockResolvedValueOnce(true);
      
      await monitor.checkAvailability();
      await monitor.checkAvailability();
      await monitor.checkAvailability();
      await monitor.checkAvailability();
      
      const stats = monitor.getStats();
      expect(stats.uptimePercentage).toBe(75); // 3 out of 4 successful
    });
  });

  describe('waitForAvailability', () => {
    it('should resolve immediately if available', async () => {
      mockClient.isAvailable.mockResolvedValue(true);
      
      const start = Date.now();
      await monitor.waitForAvailability(5000);
      const duration = Date.now() - start;
      
      expect(duration).toBeLessThan(100);
    });

    it('should wait for service to become available', async () => {
      mockClient.isAvailable
        .mockRejectedValueOnce(new Error('Down'))
        .mockRejectedValueOnce(new Error('Down'))
        .mockResolvedValueOnce(true);
      
      const promise = monitor.waitForAvailability(5000);
      
      jest.advanceTimersByTime(2000);
      
      await promise;
      
      expect(mockClient.isAvailable).toHaveBeenCalledTimes(3);
    });

    it('should timeout if service remains unavailable', async () => {
      mockClient.isAvailable.mockRejectedValue(new Error('Persistent failure'));
      
      await expect(monitor.waitForAvailability(1000))
        .rejects.toThrow('Service unavailable after timeout');
    });
  });
});