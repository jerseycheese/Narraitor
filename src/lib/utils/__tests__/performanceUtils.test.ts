/**
 * Tests for performance measurement utilities
 * Validates timing accuracy, environment detection, and reporting functionality
 */

import {
  PerformanceTimer,
  measureTime,
  measureAsync,
  createPerformanceGroup,
  generatePerformanceReport,
  getGlobalPerformanceReport,
  clearGlobalMeasurements,
  formatDuration,
  logPerformanceReport,
  createCriticalPathMonitor,
  createAsyncCriticalPathMonitor,
  trackPerformanceMetrics,
  getBatchMetrics,
  clearBatchMetrics,
  generateBatchReport,
  type PerformanceMeasurement
} from '../performanceUtils';

// Mock the logger to avoid console output during tests
jest.mock('../logger', () => ({
  Logger: jest.fn().mockImplementation(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    isEnabled: true
  }))
}));

// Helper function to create delay
const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to create a test function with controllable execution time
const createDelayedFunction = (delayMs: number) => {
  return () => {
    const start = performance.now();
    while (performance.now() - start < delayMs) {
      // Busy wait to create consistent timing
    }
    return 'result';
  };
};

describe('Performance Utilities', () => {
  beforeEach(() => {
    // Clear global state before each test
    clearGlobalMeasurements();
    clearBatchMetrics();
  });

  describe('PerformanceTimer', () => {
    it('should measure execution time accurately', () => {
      const timer = new PerformanceTimer('test-timer');
      
      timer.start();
      const delayMs = 10;
      const testFn = createDelayedFunction(delayMs);
      testFn();
      const duration = timer.stop();
      
      // Allow for some variance in timing (±5ms)
      expect(duration).toBeGreaterThanOrEqual(delayMs - 5);
      expect(duration).toBeLessThan(delayMs + 15);
    });

    it('should throw error if stop called before start', () => {
      const timer = new PerformanceTimer('test-timer');
      
      expect(() => timer.stop()).toThrow('Timer not started. Call start() first.');
    });

    it('should track elapsed time without stopping', () => {
      const timer = new PerformanceTimer('test-timer');
      
      timer.start();
      const elapsed1 = timer.elapsed();
      
      // Wait a bit and check again
      const testFn = createDelayedFunction(5);
      testFn();
      
      const elapsed2 = timer.elapsed();
      
      expect(elapsed2).toBeGreaterThan(elapsed1);
      expect(elapsed1).toBeGreaterThanOrEqual(0);
    });

    it('should reset timer state', () => {
      const timer = new PerformanceTimer('test-timer');
      
      timer.start();
      timer.stop();
      timer.reset();
      
      expect(timer.getDuration()).toBeNull();
      expect(timer.elapsed()).toBe(0);
    });

    it('should return last measured duration', () => {
      const timer = new PerformanceTimer('test-timer');
      
      timer.start();
      const testFn = createDelayedFunction(5);
      testFn();
      const duration = timer.stop();
      
      expect(timer.getDuration()).toBeCloseTo(duration, 1);
    });
  });

  describe('measureTime', () => {
    it('should measure function execution time', () => {
      const testFn = createDelayedFunction(10);
      const measuredFn = measureTime(testFn, 'test-function');
      
      const result = measuredFn();
      
      expect(result).toBe('result');
      
      // Check that measurement was recorded globally
      const report = getGlobalPerformanceReport();
      expect(report.measurements).toHaveLength(1);
      expect(report.measurements[0].name).toBe('test-function');
      expect(report.measurements[0].duration).toBeGreaterThan(5);
    });

    it('should preserve function arguments and return value', () => {
      const testFn = (a: number, b: string) => `${a}-${b}`;
      const measuredFn = measureTime(testFn, 'test-with-args');
      
      const result = measuredFn(42, 'test');
      
      expect(result).toBe('42-test');
    });

    it('should include context in measurements', () => {
      const testFn = () => 'result';
      const measuredFn = measureTime(testFn, 'test-context', { context: 'test-group' });
      
      measuredFn();
      
      const report = getGlobalPerformanceReport();
      expect(report.measurements[0].context).toBe('test-group');
    });
  });

  describe('measureAsync', () => {
    it('should measure async function execution time', async () => {
      const testFn = async () => {
        await delay(20);
        return 'async-result';
      };
      
      const measuredFn = measureAsync(testFn, 'async-test');
      const result = await measuredFn();
      
      expect(result).toBe('async-result');
      
      const report = getGlobalPerformanceReport();
      expect(report.measurements).toHaveLength(1);
      expect(report.measurements[0].name).toBe('async-test');
      expect(report.measurements[0].duration).toBeGreaterThan(15);
    });

    it('should handle async function errors', async () => {
      const testFn = async () => {
        await delay(10);
        throw new Error('Test error');
      };
      
      const measuredFn = measureAsync(testFn, 'error-test');
      
      await expect(measuredFn()).rejects.toThrow('Test error');
      
      // Measurement should still be recorded despite error
      const report = getGlobalPerformanceReport();
      expect(report.measurements).toHaveLength(1);
      expect(report.measurements[0].name).toBe('error-test');
    });
  });

  describe('PerformanceGroup', () => {
    it('should group related measurements', () => {
      const group = createPerformanceGroup('test-group');
      
      const fn1 = createDelayedFunction(5);
      const fn2 = createDelayedFunction(8);
      
      const measured1 = group.measure(fn1, 'operation-1');
      const measured2 = group.measure(fn2, 'operation-2');
      
      measured1();
      measured2();
      
      const report = group.getReport();
      expect(report.measurements).toHaveLength(2);
      expect(report.measurements[0].name).toBe('operation-1');
      expect(report.measurements[1].name).toBe('operation-2');
      expect(report.summary.count).toBe(2);
    });

    it('should clear group measurements', () => {
      const group = createPerformanceGroup('test-group');
      
      const fn = createDelayedFunction(5);
      const measured = group.measure(fn, 'operation');
      measured();
      
      expect(group.getCount()).toBe(1);
      
      group.clear();
      
      expect(group.getCount()).toBe(0);
      expect(group.getReport().measurements).toHaveLength(0);
    });

    it('should measure async functions in groups', async () => {
      const group = createPerformanceGroup('async-group');
      
      const asyncFn = async () => {
        await delay(15);
        return 'async-result';
      };
      
      const measured = group.measureAsync(asyncFn, 'async-operation');
      const result = await measured();
      
      expect(result).toBe('async-result');
      expect(group.getCount()).toBe(1);
      
      const report = group.getReport();
      expect(report.measurements[0].duration).toBeGreaterThan(10);
    });
  });

  describe('generatePerformanceReport', () => {
    it('should generate accurate statistical summary', () => {
      const measurements: PerformanceMeasurement[] = [
        { name: 'test', duration: 10, timestamp: Date.now() },
        { name: 'test', duration: 20, timestamp: Date.now() },
        { name: 'test', duration: 30, timestamp: Date.now() },
        { name: 'test', duration: 40, timestamp: Date.now() },
        { name: 'test', duration: 50, timestamp: Date.now() }
      ];
      
      const report = generatePerformanceReport(measurements);
      
      expect(report.summary.count).toBe(5);
      expect(report.summary.totalTime).toBe(150);
      expect(report.summary.averageTime).toBe(30);
      expect(report.summary.minTime).toBe(10);
      expect(report.summary.maxTime).toBe(50);
      expect(report.summary.percentiles.p50).toBe(30);
      expect(report.summary.percentiles.p90).toBe(50);
    });

    it('should handle empty measurement array', () => {
      const report = generatePerformanceReport([]);
      
      expect(report.summary.count).toBe(0);
      expect(report.summary.totalTime).toBe(0);
      expect(report.summary.averageTime).toBe(0);
      expect(report.summary.percentiles.p50).toBe(0);
    });
  });

  describe('formatDuration', () => {
    it('should format microseconds correctly', () => {
      expect(formatDuration(0.1)).toMatch(/μs$/);
      expect(formatDuration(0.5)).toBe('500.00μs');
    });

    it('should format milliseconds correctly', () => {
      expect(formatDuration(1)).toBe('1.00ms');
      expect(formatDuration(123.456)).toBe('123.46ms');
      expect(formatDuration(999)).toBe('999.00ms');
    });

    it('should format seconds correctly', () => {
      expect(formatDuration(1000)).toBe('1.00s');
      expect(formatDuration(1500)).toBe('1.50s');
      expect(formatDuration(60000)).toBe('60.00s');
    });
  });

  describe('Critical Path Monitoring', () => {
    it('should monitor function performance with thresholds', () => {
      const slowFn = createDelayedFunction(15);
      const monitoredFn = createCriticalPathMonitor(
        slowFn,
        'critical-operation',
        { warnThreshold: 10, errorThreshold: 20 }
      );
      
      const result = monitoredFn();
      
      expect(result).toBe('result');
      
      const report = getGlobalPerformanceReport();
      expect(report.measurements).toHaveLength(1);
      expect(report.measurements[0].name).toBe('critical-operation');
    });

    it('should respect sample rate', () => {
      const testFn = createDelayedFunction(5);
      const monitoredFn = createCriticalPathMonitor(
        testFn,
        'sampled-operation',
        { sampleRate: 0 } // Never sample
      );
      
      // Call multiple times
      for (let i = 0; i < 10; i++) {
        monitoredFn();
      }
      
      // No measurements should be recorded due to 0% sample rate
      const report = getGlobalPerformanceReport();
      expect(report.measurements).toHaveLength(0);
    });

    it('should monitor async functions with critical path monitoring', async () => {
      const asyncFn = async () => {
        await delay(25);
        return 'critical-async-result';
      };
      
      const monitoredFn = createAsyncCriticalPathMonitor(
        asyncFn,
        'critical-async-operation',
        { warnThreshold: 20 }
      );
      
      const result = await monitoredFn();
      
      expect(result).toBe('critical-async-result');
      
      const report = getGlobalPerformanceReport();
      expect(report.measurements).toHaveLength(1);
      expect(report.measurements[0].duration).toBeGreaterThan(20);
    });
  });

  describe('Batch Metrics Tracking', () => {
    it('should track metrics in batches', () => {
      trackPerformanceMetrics('operation-1', 10);
      trackPerformanceMetrics('operation-1', 20);
      trackPerformanceMetrics('operation-2', 15);
      
      const metrics = getBatchMetrics();
      
      expect(metrics['operation-1']).toEqual({
        count: 2,
        totalTime: 30,
        averageTime: 15,
        lastTime: 20
      });
      
      expect(metrics['operation-2']).toEqual({
        count: 1,
        totalTime: 15,
        averageTime: 15,
        lastTime: 15
      });
    });

    it('should generate batch reports', () => {
      trackPerformanceMetrics('test-operation', 100);
      
      const report = generateBatchReport();
      
      expect(report).toContain('Batch Performance Metrics');
      expect(report).toContain('test-operation');
      expect(report).toContain('Count: 1');
      expect(report).toContain('100.00ms');
    });

    it('should clear batch metrics', () => {
      trackPerformanceMetrics('test-operation', 50);
      
      expect(Object.keys(getBatchMetrics())).toHaveLength(1);
      
      clearBatchMetrics();
      
      expect(Object.keys(getBatchMetrics())).toHaveLength(0);
    });
  });

  describe('Environment Detection', () => {
    const originalEnv = process.env.NODE_ENV;

    afterEach(() => {
      process.env.NODE_ENV = originalEnv;
    });

    it('should skip measurement in production environment', () => {
      process.env.NODE_ENV = 'production';
      
      const testFn = createDelayedFunction(10);
      const measuredFn = measureTime(testFn, 'production-test');
      
      const result = measuredFn();
      
      expect(result).toBe('result');
      
      // No measurements should be recorded in production
      const report = getGlobalPerformanceReport();
      expect(report.measurements).toHaveLength(0);
    });

    it('should track measurements in development environment', () => {
      process.env.NODE_ENV = 'development';
      
      const testFn = createDelayedFunction(5);
      const measuredFn = measureTime(testFn, 'development-test');
      
      measuredFn();
      
      const report = getGlobalPerformanceReport();
      expect(report.measurements).toHaveLength(1);
    });
  });

  describe('Integration with Logger', () => {
    it('should log performance reports without errors', () => {
      const measurements: PerformanceMeasurement[] = [
        { name: 'test', duration: 25, timestamp: Date.now() }
      ];
      
      const report = generatePerformanceReport(measurements);
      
      // This should not throw
      expect(() => logPerformanceReport(report, 'Test Report')).not.toThrow();
    });
  });

  describe('Performance Impact', () => {
    it('should have minimal overhead for individual calls', () => {
      const testFn = () => 'fast-result';
      
      // Measure individual call overhead
      const measuredFn = measureTime(testFn, 'overhead-test', { logResult: false });
      
      const timer = new PerformanceTimer('test-overhead');
      timer.start();
      measuredFn();
      const callTime = timer.stop();
      
      // Overhead should be minimal (less than 10ms for a single call)
      expect(callTime).toBeLessThan(10);
    });

    it('should not significantly impact function execution time', () => {
      // Create a function with known execution time
      const delayedFn = createDelayedFunction(20);
      const measuredFn = measureTime(delayedFn, 'timing-test', { logResult: false });
      
      const timer = new PerformanceTimer('baseline-test');
      timer.start();
      measuredFn();
      const totalTime = timer.stop();
      
      // Total time should be close to expected delay (within 50% margin)
      expect(totalTime).toBeGreaterThan(15); // At least close to original delay
      expect(totalTime).toBeLessThan(40); // But not excessively longer
    });
  });
});