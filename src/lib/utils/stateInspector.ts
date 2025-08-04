/**
 * StateInspector - Advanced state inspection utilities for developer tools
 * 
 * Provides hierarchical exploration, change monitoring, and performance-safe
 * state inspection capabilities for debugging Zustand stores and complex state objects.
 * 
 * This utility is designed for development use only and automatically disables
 * itself in production environments to prevent performance overhead.
 * 
 * @example
 * ```typescript
 * // Register stores for inspection
 * stateInspector.registerStores({ worldStore, characterStore });
 * 
 * // Get current state snapshot
 * const snapshot = stateInspector.getStateSnapshot();
 * 
 * // Navigate state hierarchically
 * const value = stateInspector.getValueAtPath('worldStore.entities.world-1');
 * 
 * // Monitor specific paths for changes
 * const subscription = stateInspector.watchPath('worldStore.currentWorldId', 
 *   (oldValue, newValue, path) => {
 *     console.log(`${path} changed from`, oldValue, 'to', newValue);
 *   }
 * );
 * 
 * // Clean up when done
 * subscription.unsubscribe();
 * ```
 */

import { Logger } from './logger';

const logger = new Logger('StateInspector');

/**
 * Represents a complete snapshot of all registered store states at a specific point in time
 */
export interface StateSnapshot {
  /** Unix timestamp when the snapshot was taken */
  timestamp: number;
  /** Current state of all registered stores */
  storeStates: Record<string, unknown>;
  /** Metadata about the snapshot including performance warnings */
  metadata: StateMetadata;
}

/**
 * Metadata information about a state snapshot
 */
export interface StateMetadata {
  /** Total number of registered stores */
  totalStores: number;
  /** Total number of navigable paths in all states */
  totalPaths: number;
  /** Performance warnings generated during snapshot creation */
  performanceWarnings: string[];
}

/**
 * Information about a specific path in the state tree
 */
export interface PathInfo {
  /** The full path to this value (e.g., 'worldStore.entities.world-1') */
  path: string;
  /** The actual value at this path */
  value: unknown;
  /** JavaScript type of the value */
  type: string;
  /** Depth level in the state tree (0 = root store) */
  depth: number;
  /** Whether this value has child properties that can be navigated */
  hasChildren: boolean;
  /** Whether this value is a circular reference */
  isCircular: boolean;
}

/**
 * Callback function for state change notifications
 * @param oldValue The previous value at the watched path
 * @param newValue The current value at the watched path
 * @param path The full path that changed
 */
export interface WatchCallback {
  (oldValue: unknown, newValue: unknown, path: string): void;
}

/**
 * Subscription object returned when watching a path, used for cleanup
 */
export interface WatchSubscription {
  /** Remove the watcher and stop monitoring the path */
  unsubscribe: () => void;
}

/**
 * StateInspector class provides comprehensive state inspection capabilities
 * for developer tools with performance safeguards and hierarchical navigation.
 * 
 * Features:
 * - Development-only operation with automatic production disabling
 * - Hierarchical state tree navigation
 * - Real-time path monitoring with debounced change detection
 * - Circular reference detection and handling
 * - Performance monitoring with configurable limits
 * - Memory-safe cleanup mechanisms
 */
export class StateInspector {
  /** Map of registered store names to store instances */
  private stores: Record<string, unknown> = {};
  /** Map of watched paths to their callback sets */
  private watchers = new Map<string, Set<WatchCallback>>();
  /** Map of active monitoring timeouts for debounced change detection */
  private watcherTimeouts = new Map<string, NodeJS.Timeout>();
  /** WeakSet for tracking circular references during serialization */
  private circularRefs = new WeakSet();
  /** Maximum depth for recursive state traversal to prevent stack overflow */
  private readonly maxDepth = 10;
  /** Maximum number of concurrent watchers to prevent memory leaks */
  private readonly maxWatchers = 50;
  /** Debounce interval for change detection to prevent excessive notifications */
  private readonly debounceMs = 100;

  /**
   * Creates a new StateInspector instance
   * Automatically disables functionality in production environments
   */
  constructor() {
    // Only initialize in development environment
    if (process.env.NODE_ENV !== 'development') {
      logger.warn('StateInspector created in non-development environment - functionality disabled');
      return;
    }
    
    logger.debug('StateInspector initialized');
  }

  /**
   * Register Zustand stores for inspection
   * 
   * @param stores Object mapping store names to store instances
   * @example
   * ```typescript
   * stateInspector.registerStores({
   *   worldStore,
   *   characterStore,
   *   inventoryStore
   * });
   * ```
   */
  registerStores(stores: Record<string, unknown>): void {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    this.stores = { ...stores };
    logger.debug(`Registered ${Object.keys(stores).length} stores for inspection`);
  }

  /**
   * Captures a complete snapshot of all registered store states
   * 
   * @returns StateSnapshot containing current state and metadata
   * @example
   * ```typescript
   * const snapshot = stateInspector.getStateSnapshot();
   * console.log(`Captured ${snapshot.metadata.totalStores} stores with ${snapshot.metadata.totalPaths} paths`);
   * ```
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
        if (typeof store === 'function' && (store as any).getState) {
          const state = (store as any).getState();
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
   * Retrieves the value at a specific path in the state tree
   * 
   * @param path Dot-separated path (e.g., 'worldStore.entities.world-1.name')
   * @returns The value at the specified path, or undefined if not found
   * @example
   * ```typescript
   * const worldName = stateInspector.getValueAtPath('worldStore.entities.world-1.name');
   * const allWorlds = stateInspector.getValueAtPath('worldStore.entities');
   * ```
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
      if (typeof store !== 'function' || !(store as any).getState) {
        logger.warn(`Store ${storeName} is not a valid Zustand store`);
        return undefined;
      }

      let value = (store as any).getState();
      
      // Navigate through the path
      for (let i = 1; i < pathParts.length; i++) {
        if (value === null || value === undefined) {
          return undefined;
        }
        value = (value as any)[pathParts[i]];
      }

      return value;
    } catch (error) {
      logger.error(`Error getting value at path ${path}:`, error);
      return undefined;
    }
  }

  /**
   * Retrieves detailed metadata about a specific path in the state tree
   * 
   * @param path Dot-separated path to analyze
   * @returns PathInfo containing type, depth, children info, and circular reference status
   * @example
   * ```typescript
   * const metadata = stateInspector.getPathMetadata('worldStore.entities');
   * if (metadata.hasChildren) {
   *   console.log(`Path has ${stateInspector.getChildPaths(path).length} children`);
   * }
   * ```
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
   * Retrieves all direct child paths for hierarchical state navigation
   * 
   * @param parentPath The parent path to get children for
   * @returns Array of child path strings
   * @example
   * ```typescript
   * const children = stateInspector.getChildPaths('worldStore.entities');
   * // Returns: ['worldStore.entities.world-1', 'worldStore.entities.world-2', ...]
   * ```
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
   * Monitors a specific path for changes with debounced notifications
   * 
   * @param path The path to monitor for changes
   * @param callback Function called when the path value changes
   * @returns Subscription object with unsubscribe method
   * @example
   * ```typescript
   * const subscription = stateInspector.watchPath(
   *   'worldStore.currentWorldId',
   *   (oldValue, newValue, path) => {
   *     console.log(`Current world changed from ${oldValue} to ${newValue}`);
   *   }
   * );
   * 
   * // Later, clean up the watcher
   * subscription.unsubscribe();
   * ```
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
   * Returns the current number of active watchers (primarily for testing/debugging)
   * 
   * @returns Number of currently active path watchers
   */
  getWatchCount(): number {
    return this.watchers.size;
  }

  /**
   * Removes all active watchers and cleans up monitoring resources
   * Should be called during component unmount or application cleanup
   */
  clearAllWatchers(): void {
    this.watchers.clear();
    this.watcherTimeouts.forEach(timeout => clearTimeout(timeout));
    this.watcherTimeouts.clear();
    logger.debug('Cleared all watchers');
  }

  // Private helper methods

  /**
   * Safely serializes objects for JSON storage, handling functions, dates, and circular references
   * @param obj Object to sanitize
   * @returns Serializable version of the object
   */
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

  /**
   * Recursively counts the total number of paths in a state object
   * @param obj Object to count paths in
   * @param depth Current recursion depth
   * @returns Total number of navigable paths
   */
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

  /**
   * Determines the JavaScript type of a value with enhanced type detection
   * @param value Value to type-check
   * @returns String representation of the value's type
   */
  private getValueType(value: unknown): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return 'array';
    if (value instanceof Date) return 'date';
    if (typeof value === 'function') return 'function';
    return typeof value;
  }

  /**
   * Checks if a value has navigable child properties
   * @param value Value to check for children
   * @returns True if the value has enumerable properties or array elements
   */
  private hasChildren(value: unknown): boolean {
    if (value === null || value === undefined || typeof value !== 'object') {
      return false;
    }

    if (Array.isArray(value)) {
      return value.length > 0;
    }

    return Object.keys(value as Record<string, unknown>).length > 0;
  }

  /**
   * Sets up debounced monitoring for a specific path
   * @param path Path to monitor
   */
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

  /**
   * Cleans up monitoring resources for a specific path
   * @param path Path to stop monitoring
   */
  private cleanupPathMonitoring(path: string): void {
    const timeout = this.watcherTimeouts.get(path);
    if (timeout) {
      clearTimeout(timeout);
      this.watcherTimeouts.delete(path);
    }
  }
}

/**
 * Singleton StateInspector instance for application-wide state inspection
 * 
 * This instance is automatically configured for development use and should be
 * used throughout the application for consistent state debugging capabilities.
 * 
 * @example
 * ```typescript
 * import { stateInspector } from '@/lib/utils/stateInspector';
 * 
 * // Register your stores
 * stateInspector.registerStores({ worldStore, characterStore });
 * 
 * // Start using the inspection features
 * const snapshot = stateInspector.getStateSnapshot();
 * ```
 */
export const stateInspector = new StateInspector();