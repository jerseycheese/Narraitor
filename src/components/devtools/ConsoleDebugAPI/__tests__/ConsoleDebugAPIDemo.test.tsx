/**
 * @jest-environment jsdom
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConsoleDebugAPIDemo } from '../ConsoleDebugAPIDemo';

// Mock the console debug API
jest.mock('@/lib/devtools/consoleDebugAPI', () => ({
  consoleDebugAPI: {
    initialize: jest.fn()
  }
}));

// Mock environment
const originalEnv = process.env.NODE_ENV;

describe('ConsoleDebugAPIDemo', () => {
  afterEach(() => {
    // Reset NODE_ENV using Object.defineProperty
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true
    });
    // Clean up window mock
    if (window.NARRAITOR_DEBUG) {
      delete window.NARRAITOR_DEBUG;
    }
  });

  describe('in production environment', () => {
    beforeEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'production',
        writable: true,
        configurable: true
      });
    });

    it('should show production environment message', () => {
      render(<ConsoleDebugAPIDemo />);
      
      expect(screen.getByText('Production Environment')).toBeInTheDocument();
      expect(screen.getByText(/only available in development environment/)).toBeInTheDocument();
    });

    it('should not show debug functions', () => {
      render(<ConsoleDebugAPIDemo />);
      
      expect(screen.queryByText('clearLogs()')).not.toBeInTheDocument();
      expect(screen.queryByText('Try these functions:')).not.toBeInTheDocument();
    });
  });

  describe('in development environment', () => {
    beforeEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      });
      
      // Mock window with debug API
      window.NARRAITOR_DEBUG = {
        clearLogs: jest.fn(),
        triggerError: jest.fn().mockImplementation((message?: string): never => {
          throw new Error(message || 'Test error');
        }),
        simulateCondition: jest.fn().mockReturnValue('Simulated condition'),
        getStoreState: jest.fn().mockReturnValue('Store state accessed'),
        resetStores: jest.fn().mockReturnValue('Stores reset'),
        help: jest.fn().mockReturnValue('Help text')
      };
    });

    it('should show active status when initialized', () => {
      render(<ConsoleDebugAPIDemo />);
      
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText('Console Debug API')).toBeInTheDocument();
    });

    it('should display all debug functions', () => {
      render(<ConsoleDebugAPIDemo />);
      
      expect(screen.getByText('clearLogs()')).toBeInTheDocument();
      expect(screen.getByText('triggerError()')).toBeInTheDocument();
      expect(screen.getByText('simulateCondition()')).toBeInTheDocument();
      expect(screen.getByText('getStoreState()')).toBeInTheDocument();
      expect(screen.getByText('help()')).toBeInTheDocument();
    });

    it('should show console instructions', () => {
      render(<ConsoleDebugAPIDemo />);
      
      expect(screen.getByText(/Open your browser console/)).toBeInTheDocument();
      expect(screen.getByText('window.NARRAITOR_DEBUG')).toBeInTheDocument();
    });

    it('should call clearLogs when run button is clicked', () => {
      render(<ConsoleDebugAPIDemo />);
      
      const clearLogsButton = screen.getAllByText('Run')[0];
      fireEvent.click(clearLogsButton);
      
      expect(window.NARRAITOR_DEBUG?.clearLogs).toHaveBeenCalled();
    });

    it('should handle triggerError function', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      render(<ConsoleDebugAPIDemo />);
      
      const triggerErrorButton = screen.getAllByText('Run')[1];
      fireEvent.click(triggerErrorButton);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should call simulateCondition when run button is clicked', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<ConsoleDebugAPIDemo />);
      
      const simulateButton = screen.getAllByText('Run')[2];
      fireEvent.click(simulateButton);
      
      expect(window.NARRAITOR_DEBUG?.simulateCondition).toHaveBeenCalledWith('offline');
      expect(consoleSpy).toHaveBeenCalledWith('Simulated condition');
      
      consoleSpy.mockRestore();
    });

    it('should call getStoreState when run button is clicked', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<ConsoleDebugAPIDemo />);
      
      const storeStateButton = screen.getAllByText('Run')[3];
      fireEvent.click(storeStateButton);
      
      expect(window.NARRAITOR_DEBUG?.getStoreState).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Store state accessed');
      
      consoleSpy.mockRestore();
    });

    it('should call help when run button is clicked', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      
      render(<ConsoleDebugAPIDemo />);
      
      const helpButton = screen.getAllByText('Run')[4];
      fireEvent.click(helpButton);
      
      expect(window.NARRAITOR_DEBUG?.help).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Help text');
      
      consoleSpy.mockRestore();
    });
  });

  describe('when not initialized', () => {
    beforeEach(() => {
      Object.defineProperty(process.env, 'NODE_ENV', {
        value: 'development',
        writable: true,
        configurable: true
      });
      // Ensure no NARRAITOR_DEBUG on window
      delete window.NARRAITOR_DEBUG;
    });

    it('should show not available message', () => {
      render(<ConsoleDebugAPIDemo />);
      
      expect(screen.getByText('Not Available')).toBeInTheDocument();
      expect(screen.getByText(/Debug API not available/)).toBeInTheDocument();
    });
  });
});