import { EventEmitter } from 'events';
import { AIClient } from './types';

interface ServiceStatus {
  isAvailable: boolean;
  lastCheck: string;
  consecutiveFailures: number;
  lastError: string | null;
  uptime: number;
}

interface ServiceStats {
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  uptimePercentage: number;
  averageResponseTime: number;
}

export class ServiceMonitor extends EventEmitter {
  private status: ServiceStatus;
  private stats: ServiceStats;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private isMonitoringActive = false;
  private checkInterval = 30000; // 30 seconds default
  private maxRetries = 3;
  private backoffMultiplier = 2;
  private lastCheckTime = 0;
  private cacheTimeout = 5000; // 5 seconds cache

  constructor(private client: AIClient) {
    super();
    
    this.status = {
      isAvailable: true,
      lastCheck: new Date().toISOString(),
      consecutiveFailures: 0,
      lastError: null,
      uptime: Date.now()
    };

    this.stats = {
      totalChecks: 0,
      successfulChecks: 0,
      failedChecks: 0,
      uptimePercentage: 100,
      averageResponseTime: 0
    };
  }

  /**
   * Check service availability
   */
  async checkAvailability(): Promise<boolean> {
    // Use cache if recent check
    if (Date.now() - this.lastCheckTime < this.cacheTimeout) {
      return this.status.isAvailable;
    }

    const startTime = Date.now();
    this.lastCheckTime = startTime;
    this.stats.totalChecks++;

    try {
      await this.client.isAvailable();
      
      const wasUnavailable = !this.status.isAvailable;
      
      this.status.isAvailable = true;
      this.status.lastCheck = new Date().toISOString();
      this.status.consecutiveFailures = 0;
      this.status.lastError = null;
      
      this.stats.successfulChecks++;
      this.updateStats(Date.now() - startTime);

      if (wasUnavailable) {
        this.emit('available');
      }

      return true;
    } catch (error) {
      const wasAvailable = this.status.isAvailable;
      
      this.status.isAvailable = false;
      this.status.lastCheck = new Date().toISOString();
      this.status.consecutiveFailures++;
      this.status.lastError = error instanceof Error ? error.message : 'Unknown error';
      
      this.stats.failedChecks++;

      if (wasAvailable) {
        this.emit('unavailable', error);
      }

      return false;
    }
  }

  /**
   * Start automatic monitoring
   */
  startMonitoring(interval?: number): void {
    if (this.isMonitoringActive) {
      return;
    }

    this.checkInterval = interval || this.checkInterval;
    this.isMonitoringActive = true;
    
    // Initial check
    this.checkAvailability();

    // Set up periodic checks with exponential backoff
    const scheduleNextCheck = () => {
      if (!this.isMonitoringActive) {
        return;
      }

      const delay = this.calculateDelay();
      this.monitoringInterval = setTimeout(async () => {
        await this.checkAvailability();
        scheduleNextCheck();
      }, delay);
    };

    scheduleNextCheck();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    this.isMonitoringActive = false;
    
    if (this.monitoringInterval) {
      clearTimeout(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Check if monitoring is active
   */
  isMonitoring(): boolean {
    return this.isMonitoringActive;
  }

  /**
   * Get current status
   */
  getStatus(): ServiceStatus {
    return { ...this.status };
  }

  /**
   * Get statistics
   */
  getStats(): ServiceStats {
    return { ...this.stats };
  }

  /**
   * Wait for service to become available
   */
  async waitForAvailability(timeout: number): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      if (await this.checkAvailability()) {
        return;
      }
      
      // Wait before next check using fake timer friendly approach
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => resolve(), 1000);
        // Store timer reference for potential cleanup
        if (typeof timer === 'object' && timer.unref) {
          timer.unref();
        }
      });
    }
    
    throw new Error('Service unavailable after timeout');
  }

  /**
   * Calculate delay with exponential backoff
   */
  private calculateDelay(): number {
    if (this.status.consecutiveFailures === 0) {
      return this.checkInterval;
    }

    const backoffDelay = Math.min(
      this.checkInterval * Math.pow(this.backoffMultiplier, this.status.consecutiveFailures),
      this.checkInterval * 10 // Max 10x the base interval
    );

    return backoffDelay;
  }

  /**
   * Update statistics
   */
  private updateStats(responseTime: number): void {
    // Update average response time
    const totalTime = this.stats.averageResponseTime * (this.stats.totalChecks - 1) + responseTime;
    this.stats.averageResponseTime = totalTime / this.stats.totalChecks;

    // Update uptime percentage
    this.stats.uptimePercentage = (this.stats.successfulChecks / this.stats.totalChecks) * 100;
  }
}