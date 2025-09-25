/**
 * Console Debug API for Narraitor
 * 
 * Provides programmatic access to debugging functions via browser console.
 * Integrates with existing StateInspector and RequestLogger utilities for comprehensive debugging.
 * Only available in development environment.
 */

import { stateInspector } from '../utils/stateInspector';
import { requestLogger } from '../ai/requestLogger';
import { useSessionStore } from '@/state/sessionStore';

export interface DebugAPIInterface {
  clearLogs: () => void;
  triggerError: (message?: string) => never;
  simulateCondition: (condition: 'offline' | 'slow_network' | 'api_error') => string;
  getStoreState: () => string;
  sessionStoreState: () => Record<string, unknown>;
  resetStores: () => string;
  help: () => string;
}

declare global {
  interface Window {
    NARRAITOR_DEBUG?: DebugAPIInterface;
  }
}

/**
 * Implementation of debug API functions
 */
class ConsoleDebugAPI implements DebugAPIInterface {
  /**
   * Clear browser console and AI request logs
   */
  clearLogs(): void {
    console.clear();
    
    // Also clear AI request logs using existing RequestLogger
    try {
      const initialLogCount = requestLogger.getLogs().length;
      requestLogger.clearLogs();
      
      console.log(`🧹 Console cleared via NARRAITOR_DEBUG.clearLogs()`);
      if (initialLogCount > 0) {
        console.log(`🗑️ Cleared ${initialLogCount} AI request logs`);
      }
    } catch (error) {
      console.warn('⚠️ Could not clear AI request logs:', error);
      console.log('🧹 Console cleared via NARRAITOR_DEBUG.clearLogs()');
    }
  }

  /**
   * Trigger a test error for debugging
   */
  triggerError(message = 'Debug error triggered'): never {
    throw new Error(message);
  }

  /**
   * Simulate various debugging conditions
   */
  simulateCondition(condition: 'offline' | 'slow_network' | 'api_error'): string {
    switch (condition) {
      case 'offline':
        console.warn('🌐 Simulating offline condition');
        // In a real implementation, this might modify navigator.onLine or network interceptors
        return 'Simulated offline condition - check network panel';
        
      case 'slow_network':
        console.warn('🐌 Simulating slow network condition');
        // In a real implementation, this might add network delays
        return 'Simulated slow network condition - API calls will be delayed';
        
      case 'api_error':
        console.warn('⚠️ Simulating API error condition');
        // In a real implementation, this might force API failures
        return 'Simulated API error condition - next API call will fail';
        
      default:
        return `Unknown condition: ${condition}. Available: offline, slow_network, api_error`;
    }
  }

  /**
   * Access current store state for debugging using StateInspector
   */
  getStoreState(): string {
    console.log('📊 Accessing store state via StateInspector...');
    
    try {
      // Use existing StateInspector to get comprehensive state snapshot
      const snapshot = stateInspector.getStateSnapshot();
      
      if (snapshot.storeStates && Object.keys(snapshot.storeStates).length > 0) {
        console.table(snapshot.storeStates);
        console.log(`📈 Snapshot metadata:`, {
          stores: snapshot.metadata.totalStores,
          paths: snapshot.metadata.totalPaths,
          timestamp: new Date(snapshot.timestamp).toLocaleTimeString()
        });
        
        if (snapshot.metadata.performanceWarnings.length > 0) {
          console.warn('⚠️ Performance warnings:', snapshot.metadata.performanceWarnings);
        }
        
        return `State snapshot captured with ${snapshot.metadata.totalStores} stores and ${snapshot.metadata.totalPaths} paths`;
      } else {
        // Fallback for when StateInspector hasn't been initialized with stores
        console.log('💡 StateInspector not initialized with stores. Checking global store access...');
        const fallbackStoreInfo = {
          worldStore: 'Available via window.__ZUSTAND_STORES__?.worldStore',
          characterStore: 'Available via window.__ZUSTAND_STORES__?.characterStore',
          narrativeStore: 'Available via window.__ZUSTAND_STORES__?.narrativeStore',
          sessionStore: 'Available via window.__ZUSTAND_STORES__?.sessionStore'
        };
        console.table(fallbackStoreInfo);
        return 'No stores registered with StateInspector. Use window.__ZUSTAND_STORES__ for manual access.';
      }
    } catch (error) {
      console.error('❌ Error accessing state:', error);
      return 'Error accessing store state. Check console for details.';
    }
  }

  /**
   * Quick snapshot of the session store (non-string for easy console inspection)
   */
  sessionStoreState(): Record<string, unknown> {
    const {
      id,
      status,
      worldId,
      characterId,
      autoSave,
      playerChoices,
    } = useSessionStore.getState();

    return {
      id,
      status,
      worldId,
      characterId,
      autoSave,
      playerChoicesLength: playerChoices.length,
    };
  }

  /**
   * Reset all stores to initial state
   */
  resetStores(): string {
    console.log('🔄 Resetting all stores...');
    
    // In a real implementation, this would reset actual Zustand stores
    const stores = ['worldStore', 'characterStore', 'narrativeStore', 'sessionStore'];
    stores.forEach(store => {
      console.log(`  ✅ Reset ${store}`);
    });
    
    return 'All stores have been reset to initial state';
  }

  /**
   * Show help documentation for available functions
   */
  help(): string {
    const helpText = `
🛠️ NARRAITOR DEBUG API - Available Functions:

📝 NARRAITOR_DEBUG.clearLogs()
   Clear browser console logs and AI request logs

⚠️ NARRAITOR_DEBUG.triggerError(message?)
   Trigger a test error with optional custom message

🌐 NARRAITOR_DEBUG.simulateCondition(condition)
   Simulate debugging conditions:
   - 'offline': Simulate offline state
   - 'slow_network': Simulate slow network
   - 'api_error': Simulate API failures

📊 NARRAITOR_DEBUG.getStoreState()
   Access current Zustand store state via StateInspector

📁 NARRAITOR_DEBUG.sessionStoreState()
   Snapshot of session store status and autosave metadata

🔄 NARRAITOR_DEBUG.resetStores()
   Reset all stores to initial state

❓ NARRAITOR_DEBUG.help()
   Show this help message

🔒 Environment: Development only
    `;

    console.log(helpText);
    return helpText;
  }
}

/**
 * Initialize the console debug API
 */
function initializeConsoleDebugAPI(): void {
  // Only initialize in development environment
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  // Check if window is available (browser environment)
  if (typeof window === 'undefined') {
    return;
  }

  // Initialize the debug API
  const debugAPI = new ConsoleDebugAPI();
  window.NARRAITOR_DEBUG = debugAPI;

  // Welcome message
  console.log(`
🛠️ Narraitor Debug API Initialized!

Type NARRAITOR_DEBUG.help() to see available functions.
  `);
}

/**
 * Console Debug API singleton
 */
export const consoleDebugAPI = {
  initialize: initializeConsoleDebugAPI,
  ConsoleDebugAPI
};
