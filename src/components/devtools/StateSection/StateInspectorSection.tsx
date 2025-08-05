'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { stateInspector, type StateSnapshot, type PathInfo } from '@/lib/utils/stateInspector';
import { formatForDebug, getValueTypeInfo } from '@/lib/utils';
import { CollapsibleSection } from '../CollapsibleSection';
import { JsonViewer } from '../JsonViewer';
import * as stores from '@/state';

/**
 * Represents a state change notification for the UI
 */
interface StateChangeNotification {
  /** The path that changed */
  path: string;
  /** Previous value */
  oldValue: unknown;
  /** New value */
  newValue: unknown;
  /** When the change occurred */
  timestamp: number;
}

/**
 * Props for the StateInspectorSection component
 */
interface StateInspectorSectionProps {
  /** Whether sections should be collapsed by default */
  defaultCollapsed?: boolean;
}

/**
 * StateInspectorSection Component
 * 
 * Provides a comprehensive UI for inspecting application state with hierarchical
 * navigation, real-time monitoring, and change history tracking. This component
 * is designed for development use only and gracefully handles production environments.
 * 
 * Features:
 * - Interactive state tree navigation with breadcrumb support
 * - Path-based value inspection with type information
 * - Real-time monitoring of specific state paths
 * - Change history with timestamped notifications
 * - Performance warnings and resource usage metrics
 * - Automatic cleanup of watchers on unmount
 * 
 * @param props Component props
 * @returns JSX element for state inspection interface
 * 
 * @example
 * ```tsx
 * // Basic usage in DevTools panel
 * <StateInspectorSection />
 * 
 * // With collapsed sections by default
 * <StateInspectorSection defaultCollapsed={true} />
 * ```
 */
export const StateInspectorSection = ({ defaultCollapsed = false }: StateInspectorSectionProps) => {
  const [snapshot, setSnapshot] = useState<StateSnapshot | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>('');
  const [pathValue, setPathValue] = useState<unknown>(null);
  const [pathMetadata, setPathMetadata] = useState<PathInfo | null>(null);
  const [watchedPaths, setWatchedPaths] = useState<Set<string>>(new Set());
  const [changeNotifications, setChangeNotifications] = useState<StateChangeNotification[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize StateInspector with stores
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      stateInspector.registerStores(stores);
      setIsInitialized(true);
    }
  }, []);

  // Get initial snapshot
  useEffect(() => {
    if (isInitialized) {
      const initialSnapshot = stateInspector.getStateSnapshot();
      setSnapshot(initialSnapshot);
    }
  }, [isInitialized]);

  /**
   * Handles navigation to a specific path in the state tree
   * Updates the selected path, retrieves its value and metadata
   */
  const handlePathNavigation = useCallback((path: string) => {
    if (!path) {
      setSelectedPath('');
      setPathValue(null);
      setPathMetadata(null);
      return;
    }

    setSelectedPath(path);
    const value = stateInspector.getValueAtPath(path);
    const metadata = stateInspector.getPathMetadata(path);
    
    setPathValue(value);
    setPathMetadata(metadata);
  }, []);

  /**
   * Toggles monitoring for a specific path
   * Adds or removes a watcher and manages change notifications
   */
  const togglePathWatch = useCallback((path: string) => {
    if (watchedPaths.has(path)) {
      // Remove watch
      setWatchedPaths(prev => {
        const newSet = new Set(prev);
        newSet.delete(path);
        return newSet;
      });
    } else {
      // Add watch
      stateInspector.watchPath(path, (oldValue, newValue, watchPath) => {
        setChangeNotifications(prev => [
          ...prev.slice(-9), // Keep last 9 notifications
          {
            path: watchPath,
            oldValue,
            newValue,
            timestamp: Date.now()
          }
        ]);
      });

      setWatchedPaths(prev => new Set([...prev, path]));
    }
  }, [watchedPaths]);

  // Get child paths for hierarchical navigation
  const childPaths = useMemo(() => {
    if (!selectedPath) return [];
    return stateInspector.getChildPaths(selectedPath);
  }, [selectedPath]);

  // Breadcrumb navigation
  const breadcrumbs = useMemo(() => {
    if (!selectedPath) return [];
    const parts = selectedPath.split('.');
    return parts.map((part, index) => ({
      label: part,
      path: parts.slice(0, index + 1).join('.')
    }));
  }, [selectedPath]);

  // Cleanup watchers on unmount
  useEffect(() => {
    return () => {
      stateInspector.clearAllWatchers();
    };
  }, []);

  if (!isInitialized || process.env.NODE_ENV !== 'development') {
    return (
      <div data-testid="devtools-state-section" className="space-y-2">
        <h2 className="text-sm font-bold mb-2">Application State</h2>
        <div className="text-sm text-gray-500 italic">
          State inspection not available in production
        </div>
      </div>
    );
  }

  return (
    <div data-testid="devtools-state-section" className="space-y-2">
      <h2 className="text-sm font-bold mb-2">Application State Inspector</h2>
      
      {/* Performance Warnings */}
      {snapshot && snapshot.metadata && snapshot.metadata.performanceWarnings && snapshot.metadata.performanceWarnings.length > 0 && (
        <div className="text-xs text-yellow-400 mb-2">
          <strong>Performance Warnings:</strong>
          <ul className="list-disc list-inside">
            {snapshot.metadata.performanceWarnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Path Navigation */}
      <CollapsibleSection 
        title="Path Navigation" 
        initialCollapsed={defaultCollapsed}
        data-testid="path-navigation-section"
      >
        <div className="space-y-2">
          {/* Path Input */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Path:
            </label>
            <input
              type="text"
              value={selectedPath}
              onChange={(e) => handlePathNavigation(e.target.value)}
              placeholder="e.g., worldStore.entities"
              className="w-full px-2 py-1 text-xs bg-slate-700 border border-slate-600 rounded"
              data-testid="path-input"
            />
          </div>

          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <div className="text-xs">
              <span className="text-slate-400">Breadcrumbs: </span>
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb.path}>
                  {index > 0 && <span className="text-slate-500"> &gt; </span>}
                  <button
                    onClick={() => handlePathNavigation(crumb.path)}
                    className="text-blue-400 hover:text-blue-300 underline"
                    data-testid={`breadcrumb-${index}`}
                  >
                    {crumb.label}
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Path Metadata */}
          {pathMetadata && pathValue !== null && (
            <div className="text-xs bg-slate-700 p-2 rounded border border-slate-600">
              {(() => {
                const typeInfo = getValueTypeInfo(pathValue);
                return (
                  <>
                    <div><strong>Type:</strong> {pathMetadata.type} {typeInfo.constructor && `(${typeInfo.constructor})`}</div>
                    <div><strong>Depth:</strong> {pathMetadata.depth}</div>
                    <div><strong>Has Children:</strong> {pathMetadata.hasChildren ? 'Yes' : 'No'}</div>
                    <div><strong>Circular:</strong> {pathMetadata.isCircular ? 'Yes' : 'No'}</div>
                    {typeInfo.isArray && <div><strong>Array Length:</strong> {(pathValue as unknown[]).length}</div>}
                  </>
                );
              })()}
              {selectedPath && (
                <button
                  onClick={() => togglePathWatch(selectedPath)}
                  className={`mt-2 px-2 py-1 text-xs rounded ${
                    watchedPaths.has(selectedPath)
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                  data-testid="toggle-watch-button"
                >
                  {watchedPaths.has(selectedPath) ? 'Stop Watching' : 'Watch Changes'}
                </button>
              )}
            </div>
          )}

          {/* Path Value */}
          {pathValue !== null && (
            <div>
              <div className="text-xs font-medium text-slate-300 mb-1">Value:</div>
              <JsonViewer data={pathValue} className="bg-slate-700 border border-slate-600" />
            </div>
          )}

          {/* Child Paths */}
          {childPaths.length > 0 && (
            <div>
              <div className="text-xs font-medium text-slate-300 mb-1">Child Paths:</div>
              <div className="max-h-32 overflow-y-auto">
                {childPaths.map((childPath) => (
                  <button
                    key={childPath}
                    onClick={() => handlePathNavigation(childPath)}
                    className="block w-full text-left text-xs text-blue-400 hover:text-blue-300 hover:bg-slate-700 px-2 py-1 rounded"
                    data-testid={`child-path-${childPath.split('.').pop()}`}
                  >
                    {childPath}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Watch Management */}
      {watchedPaths.size > 0 && (
        <CollapsibleSection 
          title={`Watched Paths (${watchedPaths.size})`} 
          initialCollapsed={defaultCollapsed}
          data-testid="watched-paths-section"
        >
          <div className="space-y-1">
            {Array.from(watchedPaths).map((path) => (
              <div key={path} className="flex justify-between items-center text-xs bg-slate-700 p-2 rounded">
                <span className="text-slate-200">{path}</span>
                <button
                  onClick={() => togglePathWatch(path)}
                  className="text-red-400 hover:text-red-300 text-xs"
                  data-testid={`unwatch-${path}`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Change Notifications */}
      {changeNotifications.length > 0 && (
        <CollapsibleSection 
          title={`Change History (${changeNotifications.length})`} 
          initialCollapsed={defaultCollapsed}
          data-testid="change-history-section"
        >
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {changeNotifications.slice().reverse().map((notification) => (
              <div key={`${notification.path}-${notification.timestamp}`} className="text-xs bg-slate-700 p-2 rounded border border-slate-600">
                <div className="font-medium text-yellow-400">{notification.path}</div>
                <div className="text-slate-300 space-y-1">
                  <div className="flex items-start space-x-2">
                    <span className="text-red-400 font-medium">Old:</span>
                    <span className="font-mono text-xs bg-slate-800 px-1 rounded">
                      {formatForDebug(notification.oldValue, { compact: true, maxStringLength: 50 })}
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-400 font-medium">New:</span>
                    <span className="font-mono text-xs bg-slate-800 px-1 rounded">
                      {formatForDebug(notification.newValue, { compact: true, maxStringLength: 50 })}
                    </span>
                  </div>
                </div>
                <div className="text-slate-400 text-xs mt-1">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        </CollapsibleSection>
      )}

      {/* Store Overview */}
      <CollapsibleSection 
        title={`Store Overview (${snapshot?.metadata.totalStores || 0} stores)`} 
        initialCollapsed={defaultCollapsed}
        data-testid="store-overview-section"
      >
        {snapshot && (
          <div className="space-y-2">
            <div className="text-xs text-slate-300">
              <div>Total Stores: {snapshot.metadata.totalStores}</div>
              <div>Total Paths: {snapshot.metadata.totalPaths}</div>
              <div>Snapshot Time: {new Date(snapshot.timestamp).toLocaleTimeString()}</div>
              <div>Active Watchers: {stateInspector.getWatchCount()}</div>
            </div>
            
            {Object.entries(snapshot.storeStates).map(([storeName, storeState]) => (
              <CollapsibleSection 
                key={storeName}
                title={storeName}
                initialCollapsed={true}
                data-testid={`store-section-${storeName}`}
              >
                <div className="space-y-2">
                  <button
                    onClick={() => handlePathNavigation(storeName)}
                    className="text-xs text-blue-400 hover:text-blue-300 underline"
                    data-testid={`navigate-to-${storeName}`}
                  >
                    Navigate to {storeName}
                  </button>
                  <JsonViewer data={storeState} />
                </div>
              </CollapsibleSection>
            ))}
          </div>
        )}
      </CollapsibleSection>
    </div>
  );
};