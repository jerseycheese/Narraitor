'use client';

import React, { useState } from 'react';
import { useAIMonitoringStore } from '@/stores/aiMonitoringStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DevToolsSection } from '../shared/DevToolsSection';
import type { AIMonitoringEntry } from '@/types/aiMonitoring';

/**
 * Individual AI monitoring entry display component
 */
const AIMonitoringEntryDisplay = ({ entry }: { entry: AIMonitoringEntry }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: AIMonitoringEntry['status']) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-gray-400';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    return `${duration}ms`;
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="border border-gray-600 rounded p-3 mb-2 bg-gray-700/30">
      {/* Entry Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`font-mono text-xs px-2 py-1 rounded ${getStatusColor(entry.status)} bg-gray-800`}>
              {entry.status.toUpperCase()}
            </span>
            <span className="text-xs text-gray-300">{formatTimestamp(entry.timestamp)}</span>
            <span className="text-xs text-gray-400">
              {formatDuration(entry.performance.duration)}
            </span>
          </div>
          <div className="text-sm text-gray-200">
            <span className="font-mono text-xs bg-gray-800 px-2 py-1 rounded mr-2">
              {entry.method}
            </span>
            {entry.endpoint}
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {truncateText(entry.request.prompt)}
          </div>
        </div>
        
        <Button
          onClick={() => setIsExpanded(!isExpanded)}
          variant="ghost"
          size="sm"
          className="text-xs text-gray-400 hover:text-gray-200"
        >
          {isExpanded ? 'Hide' : 'Show'}
        </Button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-600 pt-3 space-y-3">
          {/* Request Details */}
          <div>
            <h4 className="text-xs font-semibold text-gray-300 mb-2">Request</h4>
            <div className="bg-gray-800 p-2 rounded text-xs">
              <div className="mb-2">
                <span className="text-gray-400">Prompt:</span>
                <div className="text-gray-200 mt-1 whitespace-pre-wrap font-mono">
                  {entry.request.prompt}
                </div>
              </div>
              {entry.request.config && (
                <div>
                  <span className="text-gray-400">Config:</span>
                  <pre className="text-gray-200 mt-1 text-xs">
                    {JSON.stringify(entry.request.config, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Response Details */}
          {entry.response && (
            <div>
              <h4 className="text-xs font-semibold text-gray-300 mb-2">Response</h4>
              <div className="bg-gray-800 p-2 rounded text-xs">
                <div className="mb-2">
                  <span className="text-gray-400">Content:</span>
                  <div className="text-gray-200 mt-1 whitespace-pre-wrap font-mono">
                    {entry.response.content}
                  </div>
                </div>
                <div className="flex gap-4 text-gray-400">
                  <span>Status: {entry.response.statusCode}</span>
                  <span>Finish: {entry.response.finishReason}</span>
                  {entry.response.tokenUsage && (
                    <span>Tokens: {entry.response.tokenUsage.totalTokens}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Error Details */}
          {entry.error && (
            <div>
              <h4 className="text-xs font-semibold text-red-400 mb-2">Error</h4>
              <div className="bg-gray-800 p-2 rounded text-xs">
                <div className="text-red-400 mb-1">{entry.error.message}</div>
                <div className="text-gray-400 mb-2">
                  Type: {entry.error.type} | Retryable: {entry.error.retryable ? 'Yes' : 'No'}
                </div>
                {entry.error.details && (
                  <pre className="text-gray-300 text-xs whitespace-pre-wrap">
                    {entry.error.details}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * AI Service Monitoring Section Component
 * 
 * Displays real-time monitoring of AI service requests and responses.
 * Includes filtering, export, and detailed inspection capabilities.
 */
export const AIMonitoringSection = () => {
  const {
    isEnabled,
    setEnabled,
    getFilteredEntries,
    getStats,
    clearEntries,
    exportData,
    filters,
    setFilters
  } = useAIMonitoringStore();

  const entries = getFilteredEntries();
  const stats = getStats();

  const handleExport = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-monitoring-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <DevToolsSection title="AI Service Monitoring">
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <label className="flex items-center text-sm text-gray-300">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="mr-2"
            />
            Enable Monitoring
          </label>
          
          <div className="text-xs text-gray-400">
            {stats.total} total | {stats.completed} completed | {stats.errors} errors
            {stats.averageResponseTime > 0 && (
              <span> | {Math.round(stats.averageResponseTime)}ms avg</span>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={handleExport}
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={entries.length === 0}
          >
            Export JSON
          </Button>
          <Button
            onClick={clearEntries}
            variant="outline"
            size="sm"
            className="text-xs"
            disabled={entries.length === 0}
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Search</label>
          <Input
            placeholder="Search requests/responses..."
            value={filters.search || ''}
            onChange={(e) => setFilters({ search: e.target.value || undefined })}
            className="h-8 text-xs"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Status</label>
          <select
            value={filters.status || ''}
            onChange={(e) => setFilters({ status: (e.target.value as AIMonitoringEntry['status']) || undefined })}
            className="w-full h-8 px-2 text-xs bg-gray-800 border border-gray-600 rounded"
          >
            <option value="">All Status</option>
            <option value="completed">Completed</option>
            <option value="error">Errors</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Errors Only</label>
          <label className="flex items-center h-8">
            <input
              type="checkbox"
              checked={filters.errorsOnly || false}
              onChange={(e) => setFilters({ errorsOnly: e.target.checked || undefined })}
              className="mr-2"
            />
            <span className="text-xs text-gray-300">Show only errors</span>
          </label>
        </div>
      </div>

      {/* Entries List */}
      <div className="max-h-96 overflow-y-auto">
        {!isEnabled && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm mb-2">AI monitoring is disabled</p>
            <p className="text-xs">Enable monitoring to capture AI service requests and responses</p>
          </div>
        )}

        {isEnabled && entries.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm mb-2">No AI requests captured yet</p>
            <p className="text-xs">AI requests will appear here when they occur</p>
          </div>
        )}

        {isEnabled && entries.length > 0 && (
          <div>
            {entries.map(entry => (
              <AIMonitoringEntryDisplay key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </DevToolsSection>
  );
};