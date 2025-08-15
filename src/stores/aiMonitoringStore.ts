/**
 * AI Monitoring Store
 * 
 * Manages AI service request/response monitoring data for debugging purposes.
 * Only enabled in development environment for developer tools.
 */

import { create } from 'zustand';
import type { AIMonitoringState, AIMonitoringEntry } from '@/types/aiMonitoring';

const generateId = () => Math.random().toString(36).substring(2, 11);

export const useAIMonitoringStore = create<AIMonitoringState>((set, get) => ({
  // Initial state
  entries: [],
  maxEntries: 100,
  isEnabled: process.env.NODE_ENV === 'development',
  filters: {},
  
  // Actions
  addEntry: (entryData) => {
    const id = generateId();
    const entry: AIMonitoringEntry = {
      ...entryData,
      id,
      timestamp: Date.now(),
    };
    
    set(state => {
      const newEntries = [entry, ...state.entries];
      // Keep only the most recent entries
      if (newEntries.length > state.maxEntries) {
        newEntries.splice(state.maxEntries);
      }
      return { entries: newEntries };
    });
    
    return id;
  },
  
  completeEntry: (id, response, performance) => {
    set(state => ({
      entries: state.entries.map(entry => 
        entry.id === id 
          ? { 
              ...entry, 
              status: 'completed' as const,
              response,
              performance: { ...entry.performance, ...performance }
            }
          : entry
      )
    }));
  },
  
  errorEntry: (id, error, performance) => {
    set(state => ({
      entries: state.entries.map(entry =>
        entry.id === id
          ? {
              ...entry,
              status: 'error' as const,
              error,
              performance: { ...entry.performance, ...performance }
            }
          : entry
      )
    }));
  },
  
  clearEntries: () => {
    set({ entries: [] });
  },
  
  setEnabled: (enabled) => {
    set({ isEnabled: enabled });
  },
  
  setFilters: (newFilters) => {
    set(state => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },
  
  exportData: () => {
    const { entries } = get();
    return JSON.stringify(entries, null, 2);
  },
  
  // Getters
  getFilteredEntries: () => {
    const { entries, filters } = get();
    
    return entries.filter(entry => {
      // Status filter
      if (filters.status && entry.status !== filters.status) {
        return false;
      }
      
      // Errors only filter
      if (filters.errorsOnly && entry.status !== 'error') {
        return false;
      }
      
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchable = [
          entry.request.prompt,
          entry.response?.content,
          entry.error?.message,
          entry.endpoint
        ].join(' ').toLowerCase();
        
        if (!searchable.includes(searchTerm)) {
          return false;
        }
      }
      
      // Date range filter
      if (filters.dateRange) {
        const entryDate = new Date(entry.timestamp);
        if (entryDate < filters.dateRange.start || entryDate > filters.dateRange.end) {
          return false;
        }
      }
      
      return true;
    });
  },
  
  getStats: () => {
    const { entries } = get();
    const completedEntries = entries.filter(e => e.status === 'completed' && e.performance.duration);
    
    return {
      total: entries.length,
      completed: entries.filter(e => e.status === 'completed').length,
      errors: entries.filter(e => e.status === 'error').length,
      pending: entries.filter(e => e.status === 'pending').length,
      averageResponseTime: completedEntries.length > 0 
        ? completedEntries.reduce((sum, e) => sum + (e.performance.duration || 0), 0) / completedEntries.length
        : 0
    };
  }
}));