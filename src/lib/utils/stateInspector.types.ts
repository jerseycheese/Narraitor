/**
 * TypeScript type definitions for StateInspector
 * Provides type safety for state inspection utilities and extended functionality
 */

/**
 * Interface for Zustand store objects that can be inspected
 * @template T The shape of the store's state
 */
export interface ZustandStore<T = unknown> {
  /** Retrieves the current state of the store */
  getState: () => T;
  /** Updates the store state */
  setState: (state: T | Partial<T> | ((state: T) => T | Partial<T>)) => void;
  /** Subscribes to state changes */
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;
}

/**
 * Represents a node in the hierarchical state tree for UI components
 */
export interface StateTreeNode {
  /** Full path to this node (e.g., 'worldStore.entities.world-1') */
  path: string;
  /** The key name of this node within its parent */
  key: string;
  /** The actual value at this node */
  value: unknown;
  /** JavaScript type of the value */
  type: string;
  /** Depth level in the tree (0 = root) */
  depth: number;
  /** Whether this node is expanded in the UI */
  isExpanded: boolean;
  /** Whether this node has child nodes */
  hasChildren: boolean;
  /** Array of child nodes (if expanded and has children) */
  children?: StateTreeNode[];
  /** Reference to parent node (for navigation) */
  parent?: StateTreeNode;
}

/**
 * Metadata about an active state watcher
 */
export interface StateWatch {
  /** Unique identifier for this watcher */
  id: string;
  /** The path being watched */
  path: string;
  /** Callback function for change notifications */
  callback: (oldValue: unknown, newValue: unknown, path: string) => void;
  /** Timestamp when the watcher was created */
  createdAt: number;
  /** Timestamp of the last change notification (if any) */
  lastTriggered?: number;
  /** Number of times this watcher has been triggered */
  changeCount: number;
}

/**
 * Represents a state change event for history tracking
 */
export interface StateChangeEvent {
  /** The path that changed */
  path: string;
  /** Previous value at the path */
  oldValue: unknown;
  /** New value at the path */
  newValue: unknown;
  /** When the change occurred */
  timestamp: number;
  /** Type of change that occurred */
  changeType: 'add' | 'update' | 'delete';
}

/**
 * Configuration options for StateInspector behavior
 */
export interface StateInspectorConfig {
  /** Maximum depth for recursive state traversal (default: 10) */
  maxDepth?: number;
  /** Maximum number of concurrent watchers (default: 50) */
  maxWatchers?: number;
  /** Debounce interval for change detection in ms (default: 100) */
  debounceMs?: number;
  /** Whether to collect performance metrics (default: false) */
  enablePerformanceMonitoring?: boolean;
  /** Whether to maintain change history (default: false) */
  enableChangeHistory?: boolean;
  /** Maximum number of change events to keep in history (default: 100) */
  maxHistorySize?: number;
}

/**
 * Performance metrics collected by StateInspector
 */
export interface PerformanceMetrics {
  /** Time taken for the last snapshot operation in ms */
  lastSnapshotTime: number;
  /** Average time for snapshot operations in ms */
  averageSnapshotTime: number;
  /** Total number of snapshots taken */
  totalSnapshots: number;
  /** Current memory usage in bytes (if available) */
  memoryUsage?: number;
  /** Number of currently active path watchers */
  activeWatchers: number;
}

/**
 * Options for customizing object serialization behavior
 */
export interface SerializationOptions {
  /** Maximum recursion depth for serialization (default: 10) */
  maxDepth?: number;
  /** Whether to include non-enumerable properties (default: false) */
  includeNonEnumerable?: boolean;
  /** Whether to detect and handle circular references (default: true) */
  handleCircularRefs?: boolean;
  /** Array of property keys to exclude from serialization */
  excludeKeys?: string[];
}

// Re-export core interfaces from main file
export type {
  StateSnapshot,
  StateMetadata,
  PathInfo,
  WatchCallback,
  WatchSubscription
} from './stateInspector';