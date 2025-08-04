/**
 * TypeScript type definitions for StateInspector
 * Provides type safety for state inspection utilities
 */

export interface ZustandStore<T = any> {
  getState: () => T;
  setState: (state: T | Partial<T> | ((state: T) => T | Partial<T>)) => void;
  subscribe: (listener: (state: T, prevState: T) => void) => () => void;
}

export interface StateTreeNode {
  path: string;
  key: string;
  value: unknown;
  type: string;
  depth: number;
  isExpanded: boolean;
  hasChildren: boolean;
  children?: StateTreeNode[];
  parent?: StateTreeNode;
}

export interface StateWatch {
  id: string;
  path: string;
  callback: (oldValue: unknown, newValue: unknown, path: string) => void;
  createdAt: number;
  lastTriggered?: number;
  changeCount: number;
}

export interface StateChangeEvent {
  path: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
  changeType: 'add' | 'update' | 'delete';
}

export interface StateInspectorConfig {
  maxDepth?: number;
  maxWatchers?: number;
  debounceMs?: number;
  enablePerformanceMonitoring?: boolean;
  enableChangeHistory?: boolean;
  maxHistorySize?: number;
}

export interface PerformanceMetrics {
  lastSnapshotTime: number;
  averageSnapshotTime: number;
  totalSnapshots: number;
  memoryUsage?: number;
  activeWatchers: number;
}

export interface SerializationOptions {
  maxDepth?: number;
  includeNonEnumerable?: boolean;
  handleCircularRefs?: boolean;
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