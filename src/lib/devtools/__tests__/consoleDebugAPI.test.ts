import { consoleDebugAPI, type DebugAPIInterface } from '../consoleDebugAPI';

// Mock window object
const mockWindow = {
  NARRAITOR_DEBUG: undefined as DebugAPIInterface | undefined
};

// Mock development environment
const originalEnv = process.env.NODE_ENV;

describe('consoleDebugAPI', () => {
  beforeEach(() => {
    // Reset mock window
    mockWindow.NARRAITOR_DEBUG = undefined;
    // Set development environment
    process.env.NODE_ENV = 'development';
    // Clear any existing console methods
    delete (global as unknown as { window?: unknown }).window;
    (global as unknown as { window: typeof window }).window = mockWindow as typeof window;
  });

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    delete (global as unknown as { window?: unknown }).window;
  });

  describe('initializeConsoleDebugAPI', () => {
    it('should initialize debug API in development environment', () => {
      process.env.NODE_ENV = 'development';
      
      consoleDebugAPI.initialize();
      
      expect(mockWindow.NARRAITOR_DEBUG).toBeDefined();
      expect(typeof mockWindow.NARRAITOR_DEBUG?.clearLogs).toBe('function');
      expect(typeof mockWindow.NARRAITOR_DEBUG?.triggerError).toBe('function');
      expect(typeof mockWindow.NARRAITOR_DEBUG?.simulateCondition).toBe('function');
    });

    it('should not initialize debug API in production environment', () => {
      process.env.NODE_ENV = 'production';
      
      consoleDebugAPI.initialize();
      
      expect(mockWindow.NARRAITOR_DEBUG).toBeUndefined();
    });

    it('should not initialize debug API in test environment', () => {
      process.env.NODE_ENV = 'test';
      
      consoleDebugAPI.initialize();
      
      expect(mockWindow.NARRAITOR_DEBUG).toBeUndefined();
    });
  });

  describe('debug functions', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      consoleDebugAPI.initialize();
    });

    describe('clearLogs', () => {
      it('should provide clearLogs function', () => {
        expect(typeof mockWindow.NARRAITOR_DEBUG?.clearLogs).toBe('function');
      });

      it('should clear console when called', () => {
        const consoleClearSpy = jest.spyOn(console, 'clear').mockImplementation(() => {});
        
        mockWindow.NARRAITOR_DEBUG?.clearLogs();
        
        expect(consoleClearSpy).toHaveBeenCalled();
        consoleClearSpy.mockRestore();
      });
    });

    describe('triggerError', () => {
      it('should provide triggerError function', () => {
        expect(typeof mockWindow.NARRAITOR_DEBUG?.triggerError).toBe('function');
      });

      it('should throw error with default message', () => {
        expect(() => {
          mockWindow.NARRAITOR_DEBUG?.triggerError();
        }).toThrow('Debug error triggered');
      });

      it('should throw error with custom message', () => {
        const customMessage = 'Custom debug error';
        
        expect(() => {
          mockWindow.NARRAITOR_DEBUG?.triggerError(customMessage);
        }).toThrow(customMessage);
      });
    });

    describe('simulateCondition', () => {
      it('should provide simulateCondition function', () => {
        expect(typeof mockWindow.NARRAITOR_DEBUG?.simulateCondition).toBe('function');
      });

      it('should support offline simulation', () => {
        const result = mockWindow.NARRAITOR_DEBUG?.simulateCondition('offline');
        expect(result).toContain('offline');
      });

      it('should support slow_network simulation', () => {
        const result = mockWindow.NARRAITOR_DEBUG?.simulateCondition('slow_network');
        expect(result).toContain('slow network');
      });

      it('should support api_error simulation', () => {
        const result = mockWindow.NARRAITOR_DEBUG?.simulateCondition('api_error');
        expect(result).toContain('API error');
      });

      it('should handle unknown condition', () => {
        const result = mockWindow.NARRAITOR_DEBUG?.simulateCondition('unknown' as 'offline');
        expect(result).toContain('Unknown condition');
      });
    });

    describe('getStoreState', () => {
      it('should provide getStoreState function', () => {
        expect(typeof mockWindow.NARRAITOR_DEBUG?.getStoreState).toBe('function');
      });

      it('should return message about store access', () => {
        const result = mockWindow.NARRAITOR_DEBUG?.getStoreState();
        expect(result).toContain('Store state');
      });
    });

    describe('resetStores', () => {
      it('should provide resetStores function', () => {
        expect(typeof mockWindow.NARRAITOR_DEBUG?.resetStores).toBe('function');
      });

      it('should return message about store reset', () => {
        const result = mockWindow.NARRAITOR_DEBUG?.resetStores();
        expect(result).toContain('reset');
      });
    });

    describe('help', () => {
      it('should provide help function', () => {
        expect(typeof mockWindow.NARRAITOR_DEBUG?.help).toBe('function');
      });

      it('should return help documentation', () => {
        const result = mockWindow.NARRAITOR_DEBUG?.help();
        expect(result).toContain('Available Functions');
        expect(result).toContain('clearLogs');
        expect(result).toContain('triggerError');
        expect(result).toContain('simulateCondition');
      });
    });
  });

  describe('automation support', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
      consoleDebugAPI.initialize();
    });

    it('should support batch operations', () => {
      const api = mockWindow.NARRAITOR_DEBUG;
      
      // Batch clear and simulate
      const consoleClearSpy = jest.spyOn(console, 'clear').mockImplementation(() => {});
      
      api?.clearLogs();
      const result = api?.simulateCondition('offline');
      
      expect(consoleClearSpy).toHaveBeenCalled();
      expect(result).toContain('offline');
      
      consoleClearSpy.mockRestore();
    });

    it('should provide discoverable API structure', () => {
      const api = mockWindow.NARRAITOR_DEBUG;
      
      expect(api).toHaveProperty('clearLogs');
      expect(api).toHaveProperty('triggerError');
      expect(api).toHaveProperty('simulateCondition');
      expect(api).toHaveProperty('getStoreState');
      expect(api).toHaveProperty('resetStores');
      expect(api).toHaveProperty('help');
    });
  });
});