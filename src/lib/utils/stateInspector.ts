/**
 * StateInspector - Advanced state inspection utilities for developer tools
 * 
 * Provides hierarchical exploration, change monitoring, and performance-safe
 * state inspection capabilities for debugging Zustand stores and complex state objects.
 */

import { Logger } from './logger';

const logger = new Logger('StateInspector');

export interface StateSnapshot {
  timestamp: number;
  storeStates: Record<string, unknown>;
  metadata: StateMetadata;
}

export interface StateMetadata {
  totalStores: number;
  totalPaths: number;
  performanceWarnings: string[];
}

export interface PathInfo {
  path: string;
  value: unknown;
  type: string;
  depth: number;
  hasChildren: boolean;
  isCircular: boolean;
}

export interface WatchCallback {
  (oldValue: unknown, newValue: unknown, path: string): void;
}

export interface WatchSubscription {
  unsubscribe: () => void;
}

export class StateInspector {
  private stores: Record<string, any> = {};
  private watchers = new Map<string, Set<WatchCallback>>();
  private watcherTimeouts = new Map<string, NodeJS.Timeout>();
  private circularRefs = new WeakSet();
  private readonly maxDepth = 10;
  private readonly maxWatchers = 50;
  private readonly debounceMs = 100;

  constructor() {
    // Only initialize in development environment
    if (process.env.NODE_ENV !== 'development') {
      logger.warn('StateInspector created in non-development environment - functionality disabled');
      return;
    }
    
    logger.debug('StateInspector initialized');
  }

  /**
   * Register stores for inspection
   */
  registerStores(stores: Record<string, any>): void {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    this.stores = { ...stores };
    logger.debug(`Registered ${Object.keys(stores).length} stores for inspection`);
  }

  /**
   * Get current state snapshot with metadata
   */
  getStateSnapshot(): StateSnapshot {
    if (process.env.NODE_ENV !== 'development') {
      return {
        timestamp: Date.now(),
        storeStates: {},
        metadata: {
          totalStores: 0,
          totalPaths: 0,
          performanceWarnings: ['State inspection disabled in production']
        }
      };
    }

    const timestamp = Date.now();
    const storeStates: Record<string, unknown> = {};
    const performanceWarnings: string[] = [];
    let totalPaths = 0;

    // Extract state from each registered store
    Object.entries(this.stores).forEach(([storeName, store]) => {
      try {
        if (typeof store === 'function' && store.getState) {
          const state = store.getState();
          storeStates[storeName] = this.sanitizeForSerialization(state);
          totalPaths += this.countPaths(state);
        }
      } catch (error) {
        logger.error(`Error accessing state for store ${storeName}:`, error);
        storeStates[storeName] = { error: `Error accessing store state: ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    });

    // Performance warnings
    if (totalPaths > 1000) {
      performanceWarnings.push(`High path count (${totalPaths}) may impact performance`);
    }

    if (this.watchers.size > this.maxWatchers * 0.8) {
      performanceWarnings.push(`Approaching maximum watchers limit (${this.watchers.size}/${this.maxWatchers})`);
    }

    return {
      timestamp,
      storeStates,
      metadata: {
        totalStores: Object.keys(this.stores).length,
        totalPaths,
        performanceWarnings
      }
    };
  }

  /**
   * Get value at specific path in state
   */
  getValueAtPath(path: string): unknown {
    if (process.env.NODE_ENV !== 'development') {
      return null;
    }

    try {
      const pathParts = path.split('.');
      const storeName = pathParts[0];
      
      if (!this.stores[storeName]) {
        logger.warn(`Store ${storeName} not found`);
        return undefined;
      }

      const store = this.stores[storeName];
      if (typeof store !== 'function' || !store.getState) {
        logger.warn(`Store ${storeName} is not a valid Zustand store`);
        return undefined;
      }

      let value = store.getState();
      
      // Navigate through the path
      for (let i = 1; i < pathParts.length; i++) {
        if (value === null || value === undefined) {
          return undefined;
        }
        value = value[pathParts[i]];
      }

      return value;
    } catch (error) {
      logger.error(`Error getting value at path ${path}:`, error);
      return undefined;
    }
  }

  /**
   * Get metadata about a path
   */
  getPathMetadata(path: string): PathInfo {
    const value = this.getValueAtPath(path);
    const pathParts = path.split('.');
    
    return {
      path,
      value,
      type: this.getValueType(value),
      depth: pathParts.length - 1,
      hasChildren: this.hasChildren(value),
      isCircular: this.circularRefs.has(value as object)
    };
  }

  /**
   * Get child paths for hierarchical navigation
   */
  getChildPaths(parentPath: string): string[] {
    if (process.env.NODE_ENV !== 'development') {
      return [];
    }

    const value = this.getValueAtPath(parentPath);
    
    if (!this.hasChildren(value)) {
      return [];
    }

    const children: string[] = [];
    const obj = value as Record<string, unknown>;

    try {
      Object.keys(obj).forEach(key => {
        children.push(`${parentPath}.${key}`);
      });
    } catch (error) {
      logger.error(`Error getting child paths for ${parentPath}:`, error);
    }

    return children;
  }

  /**
   * Watch a path for changes
   */
  watchPath(path: string, callback: WatchCallback): WatchSubscription {
    if (process.env.NODE_ENV !== 'development') {
      return { unsubscribe: () => {} };
    }

    if (this.watchers.size >= this.maxWatchers) {
      logger.warn(`Maximum watchers limit reached (${this.maxWatchers})`);
      return { unsubscribe: () => {} };
    }

    if (!this.watchers.has(path)) {
      this.watchers.set(path, new Set());
    }

    const watcherSet = this.watchers.get(path)!;
    watcherSet.add(callback);

    logger.debug(`Added watcher for path: ${path}`);

    // Set up debounced monitoring for this path
    this.setupPathMonitoring(path);

    return {
      unsubscribe: () => {
        watcherSet.delete(callback);
        if (watcherSet.size === 0) {
          this.watchers.delete(path);
          this.cleanupPathMonitoring(path);
        }
        logger.debug(`Removed watcher for path: ${path}`);
      }
    };
  }

  /**
   * Get current watch count (for testing/debugging)
   */
  getWatchCount(): number {
    return this.watchers.size;
  }

  /**
   * Clear all watchers (for cleanup)
   */
  clearAllWatchers(): void {
    this.watchers.clear();
    this.watcherTimeouts.forEach(timeout => clearTimeout(timeout));
    this.watcherTimeouts.clear();
    logger.debug('Cleared all watchers');
  }

  // Private helper methods

  private sanitizeForSerialization(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (typeof obj === 'function') {
      return '[Function]';
    }

    if (obj instanceof Date) {
      return obj.toISOString();
    }

    if (typeof obj !== 'object') {
      return obj;
    }

    if (this.circularRefs.has(obj as object)) {
      return '[Circular Reference]';
    }

    this.circularRefs.add(obj as object);

    try {
      if (Array.isArray(obj)) {
        return obj.map(item => this.sanitizeForSerialization(item));
      }

      const sanitized: Record<string, unknown> = {};
      Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
        sanitized[key] = this.sanitizeForSerialization(value);
      });

      return sanitized;
    } finally {
      this.circularRefs.delete(obj as object);
    }
  }

  private countPaths(obj: unknown, depth = 0): number {
    if (depth > this.maxDepth || obj === null || obj === undefined || typeof obj !== 'object') {
      return 1;
    }

    if (this.circularRefs.has(obj as object)) {
      return 1;
    }

    this.circularRefs.add(obj as object);

    try {
      let count = 1;
      Object.values(obj as Record<string, unknown>).forEach(value => {
        count += this.countPaths(value, depth + 1);
      });
      return count;
    } finally {
      this.circularRefs.delete(obj as object);
    }
  }

  private getValueType(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    if (typeof value === 'function') return 'function';
    return typeof value;
  }

  private hasChildren(value: unknown): boolean {
    if (value === null || value === undefined || typeof value !== 'object') {
      return false;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return Object.keys(value as Record<string, unknown>).length > 0;
  }

  private setupPathMonitoring(path: string): void {
    if (this.watcherTimeouts.has(path)) {
      return; // Already monitoring
    }

    let lastValue = this.getValueAtPath(path);

    const monitor = () => {
      const currentValue = this.getValueAtPath(path);
      
      if (currentValue !== lastValue) {
        const watchers = this.watchers.get(path);
        if (watchers) {
          watchers.forEach(callback => {
            try {
              callback(lastValue, currentValue, path);
            } catch (error) {
              logger.error(`Error in watcher callback for ${path}:`, error);
            }
          });
        }
        lastValue = currentValue;
      }

      // Schedule next check
      if (this.watchers.has(path)) {
        this.watcherTimeouts.set(path, setTimeout(monitor, this.debounceMs));
      }
    };

    this.watcherTimeouts.set(path, setTimeout(monitor, this.debounceMs));
  }

  private cleanupPathMonitoring(path: string): void {
    const timeout = this.watcherTimeouts.get(path);
    if (timeout) {
      clearTimeout(timeout);
      this.watcherTimeouts.delete(path);
    }
  }
}

// Export singleton instance
export const stateInspector = new StateInspector();