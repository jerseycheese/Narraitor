/**
 * Types for AI monitoring functionality
 * Supports tracking AI service requests and responses for debugging
 */

export interface AIMonitoringEntry {
  id: string;
  timestamp: number;
  status: 'pending' | 'completed' | 'error';
  
  // Request details
  endpoint: string;
  method: string;
  request: {
    prompt: string;
    config?: {
      temperature?: number;
      maxTokens?: number;
      topP?: number;
      topK?: number;
    };
    safetySettings?: unknown;
  };
  
  // Response details (only present when status is 'completed')
  response?: {
    content: string;
    finishReason: string;
    tokenUsage?: {
      promptTokens?: number;
      completionTokens?: number;
      totalTokens: number;
    };
    statusCode: number;
  };
  
  // Error details (only present when status is 'error')
  error?: {
    message: string;
    type: string;
    retryable: boolean;
    details?: string;
  };
  
  // Performance metrics
  performance: {
    startTime: number;
    endTime?: number;
    duration?: number;
  };
}

export interface AIMonitoringFilters {
  status?: AIMonitoringEntry['status'];
  search?: string;
  errorsOnly?: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

export interface AIMonitoringState {
  // Data
  entries: AIMonitoringEntry[];
  maxEntries: number;
  isEnabled: boolean;
  
  // Filters
  filters: AIMonitoringFilters;
  
  // Actions
  addEntry: (entry: Omit<AIMonitoringEntry, 'id' | 'timestamp'>) => string;
  completeEntry: (id: string, response: AIMonitoringEntry['response'], performance: Partial<AIMonitoringEntry['performance']>) => void;
  errorEntry: (id: string, error: AIMonitoringEntry['error'], performance: Partial<AIMonitoringEntry['performance']>) => void;
  clearEntries: () => void;
  setEnabled: (enabled: boolean) => void;
  setFilters: (filters: Partial<AIMonitoringFilters>) => void;
  exportData: () => string;
  
  // Getters
  getFilteredEntries: () => AIMonitoringEntry[];
  getStats: () => {
    total: number;
    completed: number;
    errors: number;
    pending: number;
    averageResponseTime: number;
  };
}