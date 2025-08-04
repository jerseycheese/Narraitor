'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { stateInspector, type StateSnapshot, type PathInfo } from '@/lib/utils/stateInspector';
import { CollapsibleSection } from '../CollapsibleSection';
import { JsonViewer } from '../JsonViewer';
import * as stores from '@/state';

interface StateChangeNotification {
  path: string;
  oldValue: unknown;
  newValue: unknown;
  timestamp: number;
}

interface StateInspectorSectionProps {
  defaultCollapsed?: boolean;
}

/**
 * StateInspectorSection Component
 * 
 * State inspection with hierarchical exploration, change monitoring,
 * and performance safeguards for developer debugging.
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

  // Handle path navigation
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

  // Watch/unwatch path functionality
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
      {snapshot?.metadata.performanceWarnings.length > 0 && (
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
          {pathMetadata && (
            <div className="text-xs bg-slate-700 p-2 rounded border border-slate-600">
              <div><strong>Type:</strong> {pathMetadata.type}</div>
              <div><strong>Depth:</strong> {pathMetadata.depth}</div>
              <div><strong>Has Children:</strong> {pathMetadata.hasChildren ? 'Yes' : 'No'}</div>
              <div><strong>Circular:</strong> {pathMetadata.isCircular ? 'Yes' : 'No'}</div>
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
                <div className="text-slate-300">
                  <span className="text-red-400">Old:</span> {JSON.stringify(notification.oldValue)} 
                  <span className="text-green-400 ml-2">New:</span> {JSON.stringify(notification.newValue)}
                </div>
                <div className="text-slate-400 text-xs">
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