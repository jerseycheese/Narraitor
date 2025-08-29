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
 * Performance threshold constants for state path warnings
 */
const PERFORMANCE_THRESHOLDS = {
  LORE_STORE_PATH_WARNING: 300,
  CHARACTER_STORE_PATH_WARNING: 250,
  SESSION_STORE_PATH_WARNING: 150,
  NARRATIVE_STORE_PATH_WARNING: 300,
  JOURNAL_STORE_PATH_WARNING: 200,
  HIGH_PATH_COUNT_WARNING: 800,
  CRITICAL_PATH_COUNT_WARNING: 1500,
} as const;

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
  
  // State for modification controls
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState<string>('');
  const [modificationError, setModificationError] = useState<string>('');

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
   * Manually refreshes the state snapshot to show current data
   */
  const refreshSnapshot = useCallback(() => {
    if (isInitialized) {
      const newSnapshot = stateInspector.getStateSnapshot();
      setSnapshot(newSnapshot);
    }
  }, [isInitialized]);

  /**
   * Gets an optimized snapshot with lazy loading to reduce path count
   */
  const getOptimizedSnapshot = useCallback(() => {
    if (isInitialized) {
      const optimizedSnapshot = stateInspector.getOptimizedStateSnapshot();
      setSnapshot(optimizedSnapshot);
    }
  }, [isInitialized]);

  /**
   * Cleans up lore store data to reduce path count
   */
  const cleanupLoreStore = useCallback(() => {
    try {
      const loreStore = stores.useLoreStore.getState();
      const worldStore = stores.useWorldStore.getState();
      const currentWorldId = worldStore.currentWorldId;
      
      if (currentWorldId) {
        loreStore.cleanupOldFacts(currentWorldId, 30); // Keep only 30 most recent facts
        loreStore.compactFactHistory(2); // Keep only 2 versions per fact
        refreshSnapshot();
      }
    } catch (error) {
      console.error('Failed to cleanup lore store:', error);
    }
  }, [refreshSnapshot]);

  /**
   * Cleans up character store data to reduce path count
   */
  const cleanupCharacterStore = useCallback(() => {
    try {
      const characterStore = stores.useCharacterStore.getState();
      const worldStore = stores.useWorldStore.getState();
      const currentWorldId = worldStore.currentWorldId;
      
      characterStore.compactCharacterData();
      if (currentWorldId) {
        characterStore.cleanupCharacterHistory(currentWorldId, 5);
      }
      refreshSnapshot();
    } catch (error) {
      console.error('Failed to cleanup character store:', error);
    }
  }, [refreshSnapshot]);

  /**
   * Gets cleanup recommendations based on current path counts
   */
  const getCleanupRecommendations = useCallback(() => {
    if (!snapshot?.metadata.storePathCounts) return [];
    
    const recommendations = [];
    const pathCounts = snapshot.metadata.storePathCounts;
    
    if (pathCounts.useLoreStore > PERFORMANCE_THRESHOLDS.LORE_STORE_PATH_WARNING) {
      recommendations.push({
        store: 'useLoreStore',
        pathCount: pathCounts.useLoreStore,
        action: 'Cleanup old facts',
        handler: cleanupLoreStore
      });
    }
    
    if (pathCounts.useCharacterStore > PERFORMANCE_THRESHOLDS.CHARACTER_STORE_PATH_WARNING) {
      recommendations.push({
        store: 'useCharacterStore',
        pathCount: pathCounts.useCharacterStore,
        action: 'Compact character data',
        handler: cleanupCharacterStore
      });
    }
    
    return recommendations.sort((a, b) => b.pathCount - a.pathCount);
  }, [snapshot, cleanupLoreStore, cleanupCharacterStore]);

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

  /**
   * Determines if a value can be modified (primitive types only)
   */
  const canModifyValue = useCallback((value: unknown): boolean => {
    if (value === null || value === undefined) return true;
    const type = typeof value;
    return type === 'string' || type === 'number' || type === 'boolean';
  }, []);

  /**
   * Parses boolean values from string input with flexible formats
   */
  const parseBoolean = useCallback((input: string): boolean | undefined => {
    const normalized = input.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1' || normalized === 'yes') {
      return true;
    }
    if (normalized === 'false' || normalized === '0' || normalized === 'no') {
      return false;
    }
    return undefined;
  }, []);

  /**
   * Starts editing mode for a value
   */
  const startEditing = useCallback(() => {
    if (!canModifyValue(pathValue)) return;
    
    setIsEditing(true);
    setEditValue(String(pathValue ?? ''));
    setModificationError('');
  }, [pathValue, canModifyValue]);

  /**
   * Cancels editing mode
   */
  const cancelEditing = useCallback(() => {
    setIsEditing(false);
    setEditValue('');
    setModificationError('');
  }, []);

  /**
   * Saves the edited value to the state
   */
  const saveEdit = useCallback(() => {
    if (!selectedPath) return;

    try {
      // Convert string input to appropriate type
      let newValue: unknown = editValue;
      
      if (typeof pathValue === 'number') {
        const parsed = parseFloat(editValue);
        if (isNaN(parsed)) {
          setModificationError('Invalid number format');
          return;
        }
        newValue = parsed;
      } else if (typeof pathValue === 'boolean') {
        const parsed = parseBoolean(editValue);
        if (parsed === undefined) {
          setModificationError('Invalid boolean format (use: true/false, 1/0, yes/no)');
          return;
        }
        newValue = parsed;
      }

      // Attempt to set the value
      const success = stateInspector.setValueAtPath(selectedPath, newValue);
      
      if (success) {
        // Refresh the displayed value
        const updatedValue = stateInspector.getValueAtPath(selectedPath);
        setPathValue(updatedValue);
        setIsEditing(false);
        setEditValue('');
        setModificationError('');
      } else {
        setModificationError('Failed to modify state value');
      }
    } catch (error) {
      setModificationError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }, [selectedPath, editValue, pathValue, parseBoolean]);

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
        <CollapsibleSection 
          title="⚠️ Performance Warnings" 
          initialCollapsed={false}
          data-testid="performance-warnings-section"
        >
          <div className="text-xs text-yellow-400 space-y-2">
            {snapshot.metadata.performanceWarnings.map((warning, index) => (
              <div key={index} className="bg-yellow-900 bg-opacity-30 p-2 rounded border border-yellow-600">
                {warning}
              </div>
            ))}
            
            {/* Store Path Analysis */}
            {(() => {
              const storePathCounts = stateInspector.getStorePathCounts();
              const sortedStores = Object.entries(storePathCounts).sort((a, b) => b[1] - a[1]);
              const topStores = sortedStores.slice(0, 3);
              
              if (topStores.length > 0 && topStores[0][1] > 500) {
                return (
                  <div className="bg-slate-800 p-2 rounded border border-slate-600">
                    <div className="font-medium text-yellow-300 mb-1">Largest Stores by Path Count:</div>
                    {topStores.map(([storeName, count]) => (
                      <div key={storeName} className="text-xs text-slate-100">
                        • <strong>{storeName}</strong>: {count} paths
                      </div>
                    ))}
                    <div className="text-xs text-slate-300 mt-1">
                      Consider clearing data from stores with high path counts if DevTools becomes slow.
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        </CollapsibleSection>
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
            <label className="text-xs font-medium text-slate-100 block mb-1">
              Path:
            </label>
            <input
              type="text"
              value={selectedPath}
              onChange={(e) => handlePathNavigation(e.target.value)}
              placeholder="e.g., worldStore.entities"
              className="w-full px-2 py-1 text-xs bg-slate-800 border border-slate-500 rounded text-slate-100 placeholder-slate-400"
              data-testid="path-input"
            />
          </div>

          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <div className="text-xs">
              <span className="text-slate-200">Breadcrumbs: </span>
              {breadcrumbs.map((crumb, index) => (
                <span key={crumb.path}>
                  {index > 0 && <span className="text-slate-400"> &gt; </span>}
                  <button
                    onClick={() => handlePathNavigation(crumb.path)}
                    className="text-blue-300 hover:text-blue-200 underline"
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
            <div className="text-xs bg-slate-800 p-2 rounded border border-slate-600 text-slate-100">
              {(() => {
                const typeInfo = getValueTypeInfo(pathValue);
                return (
                  <>
                    <div><strong className="text-slate-50">Type:</strong> {pathMetadata.type} {typeInfo.constructor && `(${typeInfo.constructor})`}</div>
                    <div><strong className="text-slate-50">Depth:</strong> {pathMetadata.depth}</div>
                    <div><strong className="text-slate-50">Has Children:</strong> {pathMetadata.hasChildren ? 'Yes' : 'No'}</div>
                    <div><strong className="text-slate-50">Circular:</strong> {pathMetadata.isCircular ? 'Yes' : 'No'}</div>
                    {typeInfo.isArray && <div><strong className="text-slate-50">Array Length:</strong> {(pathValue as unknown[]).length}</div>}
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
              <div className="text-xs font-medium text-slate-100 mb-1">Value:</div>
              <JsonViewer data={pathValue} className="bg-slate-800 border border-slate-600" />
            </div>
          )}

          {/* State Modification Controls */}
          {pathValue !== null && selectedPath && canModifyValue(pathValue) && (
            <div className="space-y-2">
              <div className="text-xs font-medium text-slate-100">Modify Value:</div>
              
              {typeof pathValue === 'boolean' ? (
                // Direct toggle for boolean values
                <button
                  onClick={() => {
                    const newValue = !pathValue;
                    const success = stateInspector.setValueAtPath(selectedPath, newValue);
                    if (success) {
                      const updatedValue = stateInspector.getValueAtPath(selectedPath);
                      setPathValue(updatedValue);
                    } else {
                      setModificationError('Failed to toggle boolean value');
                    }
                  }}
                  className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                  data-testid="toggle-boolean-button"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.currentTarget.click();
                    }
                  }}
                >
                  Toggle to {(!pathValue).toString()}
                </button>
              ) : !isEditing ? (
                <button
                  onClick={startEditing}
                  className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                  data-testid="edit-value-button"
                  aria-label={`Edit ${typeof pathValue} value`}
                >
                  Edit Value
                </button>
              ) : (
                <div className="space-y-2">
                  {/* Edit mode indicator */}
                  <div className="text-xs text-yellow-300" data-testid="edit-mode-indicator">
                    Editing {typeof pathValue} value
                  </div>
                  {/* Type-specific input */}
                  {typeof pathValue === 'boolean' ? (
                    // No additional editor for boolean; toggle button above is used
                    null
                  ) : (
                    <input
                      type={typeof pathValue === 'number' ? 'number' : 'text'}
                      value={editValue}
                      onChange={(e) => {
                        setEditValue(e.target.value);
                        // Clear validation errors when user starts typing
                        if (modificationError) {
                          setModificationError('');
                        }
                      }}
                      placeholder="Enter new value"
                      className="w-full px-2 py-1 text-xs bg-slate-800 border border-slate-500 rounded text-slate-100 placeholder-slate-400"
                      data-testid="edit-value-input"
                      autoFocus
                    />
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={saveEdit}
                      className="px-2 py-1 text-xs bg-green-600 hover:bg-green-700 text-white rounded"
                      data-testid="save-value-button"
                      aria-label="Save edited value"
                    >
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-2 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded"
                      data-testid="cancel-edit-button"
                      aria-label="Cancel editing"
                    >
                      Cancel
                    </button>
                  </div>
                  
                  {/* Error display */}
                  {modificationError && (
                    <div className="text-xs text-red-400" data-testid="validation-error">
                      {modificationError}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Child Paths */}
          {childPaths.length > 0 && (
            <div>
              <div className="text-xs font-medium text-slate-100 mb-1">Child Paths:</div>
              <div className="max-h-32 overflow-y-auto">
                {childPaths.map((childPath) => (
                  <button
                    key={childPath}
                    onClick={() => handlePathNavigation(childPath)}
                    className="block w-full text-left text-xs text-blue-300 hover:text-blue-200 hover:bg-slate-700 px-2 py-1 rounded"
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
              <div key={path} className="flex justify-between items-center text-xs bg-slate-800 p-2 rounded">
                <span className="text-slate-100">{path}</span>
                <button
                  onClick={() => togglePathWatch(path)}
                  className="text-red-300 hover:text-red-200 text-xs"
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
              <div key={`${notification.path}-${notification.timestamp}`} className="text-xs bg-slate-800 p-2 rounded border border-slate-600">
                <div className="font-medium text-yellow-300">{notification.path}</div>
                <div className="text-slate-100 space-y-1">
                  <div className="flex items-start space-x-2">
                    <span className="text-red-300 font-medium">Old:</span>
                    <span className="font-mono text-xs bg-slate-900 px-1 rounded text-slate-200">
                      {formatForDebug(notification.oldValue, { compact: true, maxStringLength: 50 })}
                    </span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-green-300 font-medium">New:</span>
                    <span className="font-mono text-xs bg-slate-900 px-1 rounded text-slate-200">
                      {formatForDebug(notification.newValue, { compact: true, maxStringLength: 50 })}
                    </span>
                  </div>
                </div>
                <div className="text-slate-300 text-xs mt-1">
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
            <div className="flex justify-between items-center mb-2">
              <div className="text-xs text-slate-100">
                <div>Total Stores: {snapshot.metadata.totalStores}</div>
                <div>Total Paths: {snapshot.metadata.totalPaths}</div>
                <div>Snapshot Time: {new Date(snapshot.timestamp).toLocaleTimeString()}</div>
                <div>Active Watchers: {stateInspector.getWatchCount()}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={refreshSnapshot}
                  className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
                  data-testid="refresh-snapshot-button"
                  title="Refresh snapshot to show current state data"
                >
                  🔄 Refresh
                </button>
                
                <button
                  onClick={getOptimizedSnapshot}
                  className="px-2 py-1 text-xs bg-purple-600 hover:bg-purple-700 text-white rounded"
                  data-testid="optimized-snapshot-button"
                  title="Get optimized snapshot with lazy loading to reduce path count"
                >
                  ⚡ Optimize
                </button>
                
                {/* Cleanup Actions */}
                {getCleanupRecommendations().length > 0 && (
                  <div className="flex gap-1">
                    {getCleanupRecommendations().map((rec, index) => (
                      <button
                        key={index}
                        onClick={rec.handler}
                        className="px-2 py-1 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded"
                        title={`${rec.action} (${rec.pathCount} paths)`}
                        data-testid={`cleanup-${rec.store.toLowerCase()}-button`}
                      >
                        🧹 Clean {rec.store.replace('use', '').replace('Store', '')}
                      </button>
                    ))}
                  </div>
                )}
              </div>
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