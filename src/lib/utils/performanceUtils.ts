/**
 * Performance measurement utilities for development debugging.
 * Provides lightweight timing, automatic monitoring, and readable reporting.
 * Only active in development environment to ensure zero production impact.
 */

import { Logger } from './logger';

const logger = new Logger('Performance');

export interface PerformanceMeasurement {
  name: string;
  duration: number;
  timestamp: number;
  context?: string;
}

export interface PerformanceReport {
  measurements: PerformanceMeasurement[];
  summary: {
    count: number;
    totalTime: number;
    averageTime: number;
    minTime: number;
    maxTime: number;
    percentiles: {
      p50: number;
      p90: number;
      p95: number;
      p99: number;
    };
  };
}

export interface PerformanceOptions {
  context?: string;
  logResult?: boolean;
  threshold?: number; // Only log if duration exceeds threshold (ms)
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}μs`;
  } else if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

/**
 * Class-based timer for manual performance timing
 */
export class PerformanceTimer {
  private startTime: number | null = null;
  private endTime: number | null = null;
  private name: string;
  private context?: string;
  
  constructor(name: string, context?: string) {
    this.name = name;
    this.context = context;
  }

  /**
   * Start timing
   */
  start(): void {
    this.startTime = performance.now();
    this.endTime = null;
  }

  /**
   * Stop timing and return duration
   */
  stop(): number {
    if (this.startTime === null) {
      throw new Error('Timer not started. Call start() first.');
    }
    
    this.endTime = performance.now();
    const duration = this.endTime - this.startTime;
    
    // Log if in development environment
    if (process.env.NODE_ENV !== 'production') {
      const contextStr = this.context ? ` [${this.context}]` : '';
      logger.debug(`${this.name}${contextStr}: ${formatDuration(duration)}`);
    }
    
    return duration;
  }

  /**
   * Get current elapsed time without stopping
   */
  elapsed(): number {
    if (this.startTime === null) {
      return 0;
    }
    return performance.now() - this.startTime;
  }

  /**
   * Reset the timer
   */
  reset(): void {
    this.startTime = null;
    this.endTime = null;
  }

  /**
   * Get the last measured duration
   */
  getDuration(): number | null {
    if (this.startTime === null || this.endTime === null) {
      return null;
    }
    return this.endTime - this.startTime;
  }

}

/**
 * Simple function wrapper for measuring execution time
 */
export function measureTime<T extends (...args: unknown[]) => unknown>(
  fn: T,
  name: string,
  options: PerformanceOptions = {}
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    const timer = new PerformanceTimer(name, options.context);
    
    timer.start();
    const result = fn(...args);
    const duration = timer.stop();
    
    // Store measurement for reporting
    if (process.env.NODE_ENV !== 'production') {
      addMeasurement({
        name,
        duration,
        timestamp: Date.now(),
        context: options.context
      });
      
      // Log if threshold exceeded or logging enabled
      if (options.logResult || (options.threshold && duration > options.threshold)) {
        const contextStr = options.context ? ` [${options.context}]` : '';
        logger.info(`${name}${contextStr}: ${formatDuration(duration)}`);
      }
    }
    
    return result as ReturnType<T>;
  }) as T;
}

/**
 * Async function wrapper for measuring execution time
 */
export function measureAsync<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  name: string,
  options: PerformanceOptions = {}
): T {
  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    const timer = new PerformanceTimer(name, options.context);
    
    timer.start();
    try {
      const result = await fn(...args);
      const duration = timer.stop();
      
      // Store measurement for reporting
      if (process.env.NODE_ENV !== 'production') {
        addMeasurement({
          name,
          duration,
          timestamp: Date.now(),
          context: options.context
        });
        
        // Log if threshold exceeded or logging enabled
        if (options.logResult || (options.threshold && duration > options.threshold)) {
          const contextStr = options.context ? ` [${options.context}]` : '';
          logger.info(`${name}${contextStr}: ${formatDuration(duration)}`);
        }
      }
      
      return result as Awaited<ReturnType<T>>;
    } catch (error) {
      // Still record measurement even on error
      const duration = timer.stop();
      
      if (process.env.NODE_ENV !== 'production') {
        addMeasurement({
          name,
          duration,
          timestamp: Date.now(),
          context: options.context
        });
      }
      
      throw error;
    }
  }) as T;
}

/**
 * Performance group for related measurements
 */
export class PerformanceGroup {
  private measurements: PerformanceMeasurement[] = [];
  private name: string;
  
  constructor(name: string) {
    this.name = name;
  }

  /**
   * Add a measurement to this group
   */
  addMeasurement(measurement: PerformanceMeasurement): void {
    this.measurements.push(measurement);
  }

  /**
   * Measure a function and add to this group
   */
  measure<T extends (...args: unknown[]) => unknown>(
    fn: T,
    measurementName: string,
    options: PerformanceOptions = {}
  ): T {
    return ((...args: Parameters<T>): ReturnType<T> => {
      const timer = new PerformanceTimer(measurementName, options.context || this.name);
      
      timer.start();
      const result = fn(...args);
      const duration = timer.stop();
      
      // Add measurement to this group
      this.addMeasurement({
        name: measurementName,
        duration,
        timestamp: Date.now(),
        context: options.context || this.name
      });
      
      // Also add to global measurements if in development
      if (process.env.NODE_ENV !== 'production') {
        addMeasurement({
          name: measurementName,
          duration,
          timestamp: Date.now(),
          context: options.context || this.name
        });
        
        // Log if threshold exceeded or logging enabled
        if (options.logResult || (options.threshold && duration > options.threshold)) {
          const contextStr = options.context || this.name;
          logger.info(`${measurementName} [${contextStr}]: ${formatDuration(duration)}`);
        }
      }
      
      return result as ReturnType<T>;
    }) as T;
  }

  /**
   * Measure an async function and add to this group
   */
  measureAsync<T extends (...args: unknown[]) => Promise<unknown>>(
    fn: T,
    measurementName: string,
    options: PerformanceOptions = {}
  ): T {
    return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
      const timer = new PerformanceTimer(measurementName, options.context || this.name);
      
      timer.start();
      try {
        const result = await fn(...args);
        const duration = timer.stop();
        
        // Add measurement to this group
        this.addMeasurement({
          name: measurementName,
          duration,
          timestamp: Date.now(),
          context: options.context || this.name
        });
        
        // Also add to global measurements if in development
        if (process.env.NODE_ENV !== 'production') {
          addMeasurement({
            name: measurementName,
            duration,
            timestamp: Date.now(),
            context: options.context || this.name
          });
          
          // Log if threshold exceeded or logging enabled
          if (options.logResult || (options.threshold && duration > options.threshold)) {
            const contextStr = options.context || this.name;
            logger.info(`${measurementName} [${contextStr}]: ${formatDuration(duration)}`);
          }
        }
        
        return result as Awaited<ReturnType<T>>;
      } catch (error) {
        // Still record measurement even on error
        const duration = timer.stop();
        
        this.addMeasurement({
          name: measurementName,
          duration,
          timestamp: Date.now(),
          context: options.context || this.name
        });
        
        if (process.env.NODE_ENV !== 'production') {
          addMeasurement({
            name: measurementName,
            duration,
            timestamp: Date.now(),
            context: options.context || this.name
          });
        }
        
        throw error;
      }
    }) as T;
  }

  /**
   * Get performance report for this group
   */
  getReport(): PerformanceReport {
    return generatePerformanceReport(this.measurements);
  }

  /**
   * Clear all measurements
   */
  clear(): void {
    this.measurements = [];
  }

  /**
   * Get measurement count
   */
  getCount(): number {
    return this.measurements.length;
  }
}

// Global measurements storage (development only)
const globalMeasurements: PerformanceMeasurement[] = [];

/**
 * Add a measurement to global storage
 */
function addMeasurement(measurement: PerformanceMeasurement): void {
  if (process.env.NODE_ENV !== 'production') {
    globalMeasurements.push(measurement);
    
    // Keep only last 1000 measurements to prevent memory issues
    if (globalMeasurements.length > 1000) {
      globalMeasurements.splice(0, globalMeasurements.length - 1000);
    }
  }
}

/**
 * Create a performance group for related measurements
 */
export function createPerformanceGroup(name: string): PerformanceGroup {
  return new PerformanceGroup(name);
}

/**
 * Generate a performance report from measurements
 */
export function generatePerformanceReport(measurements: PerformanceMeasurement[]): PerformanceReport {
  if (measurements.length === 0) {
    return {
      measurements: [],
      summary: {
        count: 0,
        totalTime: 0,
        averageTime: 0,
        minTime: 0,
        maxTime: 0,
        percentiles: { p50: 0, p90: 0, p95: 0, p99: 0 }
      }
    };
  }

  const durations = measurements.map(m => m.duration).sort((a, b) => a - b);
  const totalTime = durations.reduce((sum, d) => sum + d, 0);
  
  const percentile = (p: number): number => {
    const index = Math.ceil((p / 100) * durations.length) - 1;
    return durations[Math.max(0, index)];
  };

  return {
    measurements: [...measurements],
    summary: {
      count: measurements.length,
      totalTime,
      averageTime: totalTime / measurements.length,
      minTime: durations[0],
      maxTime: durations[durations.length - 1],
      percentiles: {
        p50: percentile(50),
        p90: percentile(90),
        p95: percentile(95),
        p99: percentile(99)
      }
    }
  };
}

/**
 * Get global performance report
 */
export function getGlobalPerformanceReport(): PerformanceReport {
  return generatePerformanceReport(globalMeasurements);
}

/**
 * Clear all global measurements
 */
export function clearGlobalMeasurements(): void {
  globalMeasurements.length = 0;
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}μs`;
  } else if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

/**
 * Log performance report to console
 */
export function logPerformanceReport(report: PerformanceReport, title = 'Performance Report'): void {
  if (process.env.NODE_ENV === 'production') return;
  
  logger.info(`\n=== ${title} ===`);
  logger.info(`Measurements: ${report.summary.count}`);
  logger.info(`Total Time: ${formatDuration(report.summary.totalTime)}`);
  logger.info(`Average: ${formatDuration(report.summary.averageTime)}`);
  logger.info(`Min: ${formatDuration(report.summary.minTime)}`);
  logger.info(`Max: ${formatDuration(report.summary.maxTime)}`);
  logger.info(`Percentiles:`);
  logger.info(`  P50: ${formatDuration(report.summary.percentiles.p50)}`);
  logger.info(`  P90: ${formatDuration(report.summary.percentiles.p90)}`);
  logger.info(`  P95: ${formatDuration(report.summary.percentiles.p95)}`);
  logger.info(`  P99: ${formatDuration(report.summary.percentiles.p99)}`);
  logger.info('===\n');
}

// ============================================================================
// AUTOMATIC MONITORING SYSTEM
// ============================================================================

export interface CriticalPathOptions extends PerformanceOptions {
  warnThreshold?: number; // Warn if duration exceeds this (ms)
  errorThreshold?: number; // Error if duration exceeds this (ms)
  sampleRate?: number; // 0-1, how often to measure (1 = always, 0.1 = 10% of calls)
}

/**
 * Decorator for automatically monitoring critical path functions
 */
export function monitorCriticalPath(
  name: string,
  options: CriticalPathOptions = {}
) {
  return function <T extends (...args: unknown[]) => unknown>(
    target: unknown,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
  ): TypedPropertyDescriptor<T> {
    const originalMethod = descriptor.value;
    
    if (!originalMethod) {
      return descriptor;
    }

    descriptor.value = (function(this: unknown, ...args: Parameters<T>): ReturnType<T> {
      // Skip monitoring in production
      if (process.env.NODE_ENV === 'production') {
        return originalMethod.apply(this, args) as ReturnType<T>;
      }

      // Sample rate check - if sampleRate is defined and random exceeds it, skip monitoring
      if (options.sampleRate !== undefined && Math.random() > options.sampleRate) {
        return originalMethod.apply(this, args) as ReturnType<T>;
      }

      const timer = new PerformanceTimer(name, options.context);
      timer.start();
      
      const result = originalMethod.apply(this, args) as ReturnType<T>;
      const duration = timer.stop();

      // Store measurement
      addMeasurement({
        name,
        duration,
        timestamp: Date.now(),
        context: options.context
      });

      // Check thresholds and log appropriately
      if (options.errorThreshold && duration > options.errorThreshold) {
        logger.error(`Critical path ${name} exceeded error threshold: ${formatDuration(duration)} > ${formatDuration(options.errorThreshold)}`);
      } else if (options.warnThreshold && duration > options.warnThreshold) {
        logger.warn(`Critical path ${name} exceeded warning threshold: ${formatDuration(duration)} > ${formatDuration(options.warnThreshold)}`);
      } else if (options.logResult) {
        logger.debug(`Critical path ${name}: ${formatDuration(duration)}`);
      }

      return result;
    }) as T;

    return descriptor;
  };
}

/**
 * Function decorator for monitoring critical paths (non-class functions)
 */
export function createCriticalPathMonitor<T extends (...args: unknown[]) => unknown>(
  fn: T,
  name: string,
  options: CriticalPathOptions = {}
): T {
  return ((...args: Parameters<T>): ReturnType<T> => {
    // Skip monitoring in production
    if (process.env.NODE_ENV === 'production') {
      return fn(...args) as ReturnType<T>;
    }

    // Sample rate check - if sampleRate is defined and random exceeds it, skip monitoring
    if (options.sampleRate !== undefined && Math.random() > options.sampleRate) {
      return fn(...args) as ReturnType<T>;
    }

    const timer = new PerformanceTimer(name, options.context);
    timer.start();
    
    const result = fn(...args) as ReturnType<T>;
    const duration = timer.stop();

    // Store measurement
    addMeasurement({
      name,
      duration,
      timestamp: Date.now(),
      context: options.context
    });

    // Check thresholds and log appropriately
    if (options.errorThreshold && duration > options.errorThreshold) {
      logger.error(`Critical path ${name} exceeded error threshold: ${formatDuration(duration)} > ${formatDuration(options.errorThreshold)}`);
    } else if (options.warnThreshold && duration > options.warnThreshold) {
      logger.warn(`Critical path ${name} exceeded warning threshold: ${formatDuration(duration)} > ${formatDuration(options.warnThreshold)}`);
    } else if (options.logResult) {
      logger.debug(`Critical path ${name}: ${formatDuration(duration)}`);
    }

    return result;
  }) as T;
}

/**
 * Async function monitor for critical paths
 */
export function createAsyncCriticalPathMonitor<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  name: string,
  options: CriticalPathOptions = {}
): T {
  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    // Skip monitoring in production
    if (process.env.NODE_ENV === 'production') {
      return fn(...args) as Promise<Awaited<ReturnType<T>>>;
    }

    // Sample rate check - if sampleRate is defined and random exceeds it, skip monitoring
    if (options.sampleRate !== undefined && Math.random() > options.sampleRate) {
      return fn(...args) as Promise<Awaited<ReturnType<T>>>;
    }

    const timer = new PerformanceTimer(name, options.context);
    timer.start();
    
    const result = await fn(...args) as Awaited<ReturnType<T>>;
    const duration = timer.stop();

    // Store measurement
    addMeasurement({
      name,
      duration,
      timestamp: Date.now(),
      context: options.context
    });

    // Check thresholds and log appropriately
    if (options.errorThreshold && duration > options.errorThreshold) {
      logger.error(`Critical path ${name} exceeded error threshold: ${formatDuration(duration)} > ${formatDuration(options.errorThreshold)}`);
    } else if (options.warnThreshold && duration > options.warnThreshold) {
      logger.warn(`Critical path ${name} exceeded warning threshold: ${formatDuration(duration)} > ${formatDuration(options.warnThreshold)}`);
    } else if (options.logResult) {
      logger.debug(`Critical path ${name}: ${formatDuration(duration)}`);
    }

    return result;
  }) as T;
}

/**
 * Batch performance metric tracking
 */
export interface BatchMetrics {
  [key: string]: {
    count: number;
    totalTime: number;
    averageTime: number;
    lastTime: number;
  };
}

class BatchPerformanceTracker {
  private metrics: BatchMetrics = {};
  private reportInterval: number;
  private intervalId: NodeJS.Timeout | null = null;

  constructor(reportIntervalMs = 60000) { // Default 1 minute
    this.reportInterval = reportIntervalMs;
    this.startAutoReporting();
  }

  /**
   * Track a performance metric
   */
  track(name: string, duration: number): void {
    if (process.env.NODE_ENV === 'production') return;

    if (!this.metrics[name]) {
      this.metrics[name] = {
        count: 0,
        totalTime: 0,
        averageTime: 0,
        lastTime: 0
      };
    }

    const metric = this.metrics[name];
    metric.count++;
    metric.totalTime += duration;
    metric.averageTime = metric.totalTime / metric.count;
    metric.lastTime = duration;
  }

  /**
   * Get current metrics
   */
  getMetrics(): BatchMetrics {
    return { ...this.metrics };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = {};
  }

  /**
   * Generate report for all tracked metrics
   */
  generateReport(): string {
    const metrics = Object.entries(this.metrics);
    if (metrics.length === 0) {
      return 'No performance metrics tracked.';
    }

    let report = '\n=== Batch Performance Metrics ===\n';
    metrics.forEach(([name, data]) => {
      report += `${name}:\n`;
      report += `  Count: ${data.count}\n`;
      report += `  Total: ${formatDuration(data.totalTime)}\n`;
      report += `  Average: ${formatDuration(data.averageTime)}\n`;
      report += `  Last: ${formatDuration(data.lastTime)}\n`;
    });
    report += '===\n';

    return report;
  }

  /**
   * Start automatic reporting
   */
  private startAutoReporting(): void {
    if (process.env.NODE_ENV === 'production') return;

    this.intervalId = setInterval(() => {
      if (Object.keys(this.metrics).length > 0) {
        logger.info(this.generateReport());
      }
    }, this.reportInterval);
  }

  /**
   * Stop automatic reporting
   */
  stopAutoReporting(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Global batch tracker instance
const globalBatchTracker = new BatchPerformanceTracker();

/**
 * Track performance metrics in batches
 */
export function trackPerformanceMetrics(name: string, duration: number): void {
  globalBatchTracker.track(name, duration);
}

/**
 * Get global batch metrics
 */
export function getBatchMetrics(): BatchMetrics {
  return globalBatchTracker.getMetrics();
}

/**
 * Clear batch metrics
 */
export function clearBatchMetrics(): void {
  globalBatchTracker.clear();
}

/**
 * Generate batch metrics report
 */
export function generateBatchReport(): string {
  return globalBatchTracker.generateReport();
}