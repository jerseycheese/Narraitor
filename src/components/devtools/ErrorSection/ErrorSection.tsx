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
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';

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
      case ErrorSeverity.CRITICAL: return '';
      case ErrorSeverity.HIGH: return '';
      case ErrorSeverity.MEDIUM: return '';
      case ErrorSeverity.LOW: return '';
      default: return '';
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString();
  };

  return (
    <div >
      {/* Error Statistics */}
      <div >
        <div >
          <h4 >Runtime Errors</h4>
          {statistics && statistics.total > 0 && (
            <Button
              onClick={handleClearAll}
              variant="destructive"
              size="sm"
              
            >
              Clear All
            </Button>
          )}
        </div>
        
        {statistics && (
          <div >
            <div >
              <span>Total: {statistics.total}</span>
              <span>Recent: {statistics.recentCount}</span>
            </div>
            <div >
              {Object.entries(statistics.bySeverity).map(([severity, count]) => 
                count > 0 && (
                  <span key={severity} >
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
        <div >
          {/* Severity Filter */}
          <div>
            <h5 >Severity</h5>
            <div >
              {Object.values(ErrorSeverity).map(severity => (
                <label key={severity} >
                  <Checkbox
                    checked={(filter.severity || []).includes(severity)}
                    onChange={(e) => handleSeverityFilter(severity, e.target.checked)}
                    aria-label={`Filter by ${severity.charAt(0).toUpperCase() + severity.slice(1)} severity errors`}
                  />
                  <span >{severity}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <h5 >Category</h5>
            <div >
              {Object.values(ErrorCategory).map(category => (
                <label key={category} >
                  <Checkbox
                    checked={(filter.category || []).includes(category)}
                    onChange={(e) => handleCategoryFilter(category, e.target.checked)}
                    aria-label={`Filter by ${category.charAt(0).toUpperCase() + category.slice(1).replace('_', '')} category errors`}
                  />
                  <span >{category.replace('_', '')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Show Dismissed Toggle */}
          <div>
            <label >
              <Checkbox
                checked={filter.dismissed || false}
                onChange={(e) => handleShowDismissed(e.target.checked)}
                aria-label="Show dismissed errors in addition to active errors"
              />
              <span >Show dismissed errors</span>
            </label>
          </div>

          <Button 
            onClick={loadData} 
            size="sm" 
            
          >
            Apply Filters
          </Button>
        </div>
      </CollapsibleSection>

      {/* Error List */}
      <div >
        {errors.length === 0 ? (
          <div >
            No runtime errors captured
          </div>
        ) : (
          errors.map((error) => (
            <div
              key={error.id}
              className={`${
                error.dismissed 
                  ? '' 
                  : ''
              }`}
            >
              {/* Error Header */}
              <div >
                <div >
                  <div >
                    <Badge className={`${getSeverityColor(error.severity)}`}>
                      {error.severity.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" >
                      {error.category}
                    </Badge>
                    {error.count > 1 && (
                      <Badge variant="secondary-static" >
                        {error.count}x
                      </Badge>
                    )}
                    <span >
                      {formatTimestamp(error.timestamp)}
                    </span>
                  </div>
                  <p >
                    {error.message}
                  </p>
                </div>
                
                <div >
                  <Button
                    onClick={() => toggleErrorExpanded(error.id)}
                    variant="ghost"
                    size="sm"
                    
                    aria-label="View error details"
                  >
                    {expandedErrors.has(error.id) ? '−' : '+'}
                  </Button>
                  {!error.dismissed && (
                    <Button
                      onClick={() => handleDismissError(error.id)}
                      variant="ghost"
                      size="sm"
                      
                      aria-label="Dismiss error"
                    >
                      ×
                    </Button>
                  )}
                </div>
              </div>

              {/* Expanded Error Details */}
              {expandedErrors.has(error.id) && (
                <div >
                  {/* Stack Trace */}
                  {error.stack && (
                    <div>
                      <h6 >Stack Trace</h6>
                      <pre >
                        {error.stack}
                      </pre>
                    </div>
                  )}

                  {/* Component Context */}
                  {error.componentContext && (
                    <div>
                      <h6 >Component Context</h6>
                      <div >
                        <div>Component: {error.componentContext.componentName}</div>
                        <pre >
                          {error.componentContext.componentStack}
                        </pre>
                      </div>
                    </div>
                  )}

                  {/* State Snapshot */}
                  {error.stateSnapshot && (
                    <div>
                      <h6 >State Snapshot</h6>
                      <div >
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