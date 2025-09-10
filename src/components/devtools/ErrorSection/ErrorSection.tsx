'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { runtimeErrorLogger } from '@/lib/devtools/runtimeErrorLogger';
import { 
  ErrorSeverity, 
  ErrorCategory, 
  type RuntimeError, 
  type ErrorFilter,
  type ErrorStatistics 
} from '@/types/runtime-error.types';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CollapsibleSection } from '../CollapsibleSection';

/**
 * Component for displaying and managing runtime errors in DevTools
 */
export const ErrorSection = () => {
  const [errors, setErrors] = useState<RuntimeError[]>([]);
  const [statistics, setStatistics] = useState<ErrorStatistics | null>(null);
  const [filter, setFilter] = useState<ErrorFilter>({
    severity: [],
    category: [],
    dismissed: false
  });
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  // Load errors and statistics
  const loadData = useCallback(() => {
    const filteredErrors = runtimeErrorLogger.getErrors(filter);
    const stats = runtimeErrorLogger.getStatistics();
    setErrors(filteredErrors);
    setStatistics(stats);
  }, [filter]);

  // Load data on mount and when filter changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle filter changes
  const handleSeverityFilter = (severity: ErrorSeverity, checked: boolean) => {
    setFilter(prev => ({
      ...prev,
      severity: checked 
        ? [...(prev.severity || []), severity]
        : (prev.severity || []).filter(s => s !== severity)
    }));
  };

  const handleCategoryFilter = (category: ErrorCategory, checked: boolean) => {
    setFilter(prev => ({
      ...prev,
      category: checked
        ? [...(prev.category || []), category]
        : (prev.category || []).filter(c => c !== category)
    }));
  };

  const handleShowDismissed = (checked: boolean) => {
    setFilter(prev => ({
      ...prev,
      dismissed: checked
    }));
  };

  // Error actions
  const handleDismissError = (errorId: string) => {
    runtimeErrorLogger.dismissError(errorId);
    loadData();
  };

  const handleClearAll = () => {
    runtimeErrorLogger.clearErrors();
    loadData();
  };

  const toggleErrorExpanded = (errorId: string) => {
    setExpandedErrors(prev => {
      const newSet = new Set(prev);
      if (newSet.has(errorId)) {
        newSet.delete(errorId);
      } else {
        newSet.add(errorId);
      }
      return newSet;
    });
  };

  // Get severity badge color
  const getSeverityColor = (severity: ErrorSeverity) => {
    switch (severity) {
      case ErrorSeverity.CRITICAL: return 'bg-red-700';
      case ErrorSeverity.HIGH: return 'bg-red-700';
      case ErrorSeverity.MEDIUM: return 'bg-amber-700';
      case ErrorSeverity.LOW: return 'bg-blue-700';
      default: return 'bg-gray-700';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString();
  };

  return (
    <div className="space-y-4">
      {/* Error Statistics */}
      <div className="bg-gray-100 p-3 rounded border border-gray-300">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-gray-900">Runtime Errors</h4>
          {statistics && statistics.total > 0 && (
            <Button
              onClick={handleClearAll}
              variant="destructive"
              size="sm"
              className="text-xs h-6"
            >
              Clear All
            </Button>
          )}
        </div>
        
        {statistics && (
          <div className="text-xs text-gray-700 space-y-1">
            <div className="flex gap-4">
              <span>Total: {statistics.total}</span>
              <span>Recent: {statistics.recentCount}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(statistics.bySeverity).map(([severity, count]) => 
                count > 0 && (
                  <span key={severity} className="capitalize">
                    {severity}: {count}
                  </span>
                )
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <CollapsibleSection title="Filters" initialCollapsed={true}>
        <div className="space-y-3">
          {/* Severity Filter */}
          <div>
            <h5 className="text-xs font-medium text-gray-900 mb-2">Severity</h5>
            <div className="flex flex-wrap gap-2">
              {Object.values(ErrorSeverity).map(severity => (
                <label key={severity} className="flex items-center gap-1 text-xs">
                  <Checkbox
                    checked={(filter.severity || []).includes(severity)}
                    onChange={(e) => handleSeverityFilter(severity, e.target.checked)}
                    aria-label={`Filter by ${severity.charAt(0).toUpperCase() + severity.slice(1)} severity errors`}
                  />
                  <span className="text-gray-900 capitalize">{severity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <h5 className="text-xs font-medium text-gray-900 mb-2">Category</h5>
            <div className="flex flex-wrap gap-2">
              {Object.values(ErrorCategory).map(category => (
                <label key={category} className="flex items-center gap-1 text-xs">
                  <Checkbox
                    checked={(filter.category || []).includes(category)}
                    onChange={(e) => handleCategoryFilter(category, e.target.checked)}
                    aria-label={`Filter by ${category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')} category errors`}
                  />
                  <span className="text-gray-900 capitalize">{category.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Show Dismissed Toggle */}
          <div>
            <label className="flex items-center gap-2 text-xs">
              <Checkbox
                checked={filter.dismissed || false}
                onChange={(e) => handleShowDismissed(e.target.checked)}
                aria-label="Show dismissed errors in addition to active errors"
              />
              <span className="text-gray-900">Show dismissed errors</span>
            </label>
          </div>

          <Button 
            onClick={loadData} 
            size="sm" 
            className="text-xs"
          >
            Apply Filters
          </Button>
        </div>
      </CollapsibleSection>

      {/* Error List */}
      <div className="space-y-2">
        {errors.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm">
            No runtime errors captured
          </div>
        ) : (
          errors.map((error) => (
            <div
              key={error.id}
              className={`border rounded p-3 ${
                error.dismissed 
                  ? 'bg-gray-900 border-gray-700 opacity-60' 
                  : 'bg-gray-700 border-gray-500'
              }`}
            >
              {/* Error Header */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`text-xs ${getSeverityColor(error.severity)} text-white`}>
                      {error.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {error.category}
                    </Badge>
                    {error.count > 1 && (
                      <Badge variant="secondary" className="text-xs">
                        {error.count}x
                      </Badge>
                    )}
                    <span className="text-xs text-gray-500">
                      {formatTimestamp(error.timestamp)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-200 break-words">
                    {error.message}
                  </p>
                </div>
                
                <div className="flex gap-1">
                  <Button
                    onClick={() => toggleErrorExpanded(error.id)}
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-500 hover:text-gray-200"
                    aria-label="View error details"
                  >
                    {expandedErrors.has(error.id) ? '−' : '+'}
                  </Button>
                  {!error.dismissed && (
                    <Button
                      onClick={() => handleDismissError(error.id)}
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-500 hover:text-gray-200"
                      aria-label="Dismiss error"
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>

              {/* Expanded Error Details */}
              {expandedErrors.has(error.id) && (
                <div className="border-t border-gray-700 pt-2 mt-2 space-y-2">
                  {/* Stack Trace */}
                  {error.stack && (
                    <div>
                      <h6 className="text-xs font-medium text-gray-300 mb-1">Stack Trace</h6>
                      <pre className="text-xs text-gray-500 bg-gray-900 p-2 rounded overflow-x-auto">
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {/* Component Context */}
                  {error.componentContext && (
                    <div>
                      <h6 className="text-xs font-medium text-gray-300 mb-1">Component Context</h6>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Component: {error.componentContext.componentName}</div>
                        <pre className="bg-gray-900 p-2 rounded overflow-x-auto">
                          {error.componentContext.componentStack}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* State Snapshot */}
                  {error.stateSnapshot && (
                    <div>
                      <h6 className="text-xs font-medium text-gray-300 mb-1">State Snapshot</h6>
                      <div className="text-xs text-gray-500 space-y-1">
                        <div>Route: {error.stateSnapshot.route}</div>
                        <div>URL: {error.stateSnapshot.url}</div>
                        <div>User Agent: {error.stateSnapshot.userAgent}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};