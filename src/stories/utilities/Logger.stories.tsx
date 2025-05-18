import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import Logger from '@/lib/utils/logger';

const meta: Meta = {
  title: 'Utilities/Logger',
  parameters: {
    docs: {
      description: {
        component: 'Debug logging utility with severity levels and environment-based toggling.',
      },
    },
  },
};

export default meta;

type Story = StoryObj;

// Demo component to showcase logger functionality
const LoggerDemo: React.FC = () => {
  const [componentName, setComponentName] = useState('DemoComponent');
  const [logOutput, setLogOutput] = useState<string[]>([]);
  const logger = React.useMemo(() => new Logger(componentName), [componentName]);

  // Override console methods to capture output
  React.useEffect(() => {
    const originalDebug = console.debug;
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const captureLog = (level: string) => (...args: any[]) => {
      const message = args.join(' ');
      setLogOutput(prev => [...prev, `${level}: ${message}`]);
      
      // Still call the original method
      switch(level) {
        case 'DEBUG':
          originalDebug(...args);
          break;
        case 'INFO':
          originalLog(...args);
          break;
        case 'WARN':
          originalWarn(...args);
          break;
        case 'ERROR':
          originalError(...args);
          break;
      }
    };

    console.debug = captureLog('DEBUG');
    console.log = captureLog('INFO');
    console.warn = captureLog('WARN');
    console.error = captureLog('ERROR');

    return () => {
      console.debug = originalDebug;
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  const handleLog = (level: 'debug' | 'info' | 'warn' | 'error', message: string) => {
    logger[level](message, { timestamp: Date.now() });
  };

  const clearLogs = () => {
    setLogOutput([]);
  };

  const isLoggingEnabled = process.env.NEXT_PUBLIC_DEBUG_LOGGING === 'true';

  return (
    <div className="p-4 space-y-4">
      <div className="bg-yellow-100 border border-yellow-400 p-3 rounded mb-4">
        <p className="font-semibold">Logger Configuration</p>
        <p>NEXT_PUBLIC_DEBUG_LOGGING: {process.env.NEXT_PUBLIC_DEBUG_LOGGING || 'undefined'}</p>
        <p>NODE_ENV: {process.env.NODE_ENV}</p>
        <p>Logging is: {isLoggingEnabled ? 'ENABLED' : 'DISABLED'}</p>
      </div>

      <div className="space-y-2">
        <label className="block">
          <span className="font-semibold">Component Name:</span>
          <input
            type="text"
            value={componentName}
            onChange={(e) => setComponentName(e.target.value)}
            className="ml-2 px-2 py-1 border rounded"
          />
        </label>
      </div>

      <div className="space-y-2">
        <p className="font-semibold">Test Logging Levels:</p>
        <div className="flex space-x-2">
          <button
            onClick={() => handleLog('debug', 'This is a debug message')}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Log Debug
          </button>
          <button
            onClick={() => handleLog('info', 'This is an info message')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Log Info
          </button>
          <button
            onClick={() => handleLog('warn', 'This is a warning message')}
            className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          >
            Log Warning
          </button>
          <button
            onClick={() => handleLog('error', 'This is an error message')}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Log Error
          </button>
          <button
            onClick={clearLogs}
            className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500"
          >
            Clear Logs
          </button>
        </div>
      </div>

      <div className="mt-4">
        <p className="font-semibold mb-2">Console Output (captured):</p>
        <div className="bg-gray-900 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto" style={{ color: 'white' }}>
          {logOutput.length === 0 ? (
            <p style={{ color: '#9CA3AF' }}>No logs captured yet. Click the buttons above to test logging.</p>
          ) : (
            logOutput.map((log, index) => (
              <div key={index} className="mb-1" style={{ color: 'white' }}>
                {log}
              </div>
            ))
          )}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Note: Logs only appear when NEXT_PUBLIC_DEBUG_LOGGING=true and NODE_ENV !== 'production'
        </p>
      </div>

      <div className="mt-4 p-4 bg-gray-100 rounded">
        <p className="font-semibold mb-2">Example Usage:</p>
        <pre className="bg-white p-3 rounded text-sm">
{`import Logger from '@/lib/utils/logger';

// Create logger instance
const logger = new Logger('MyComponent');

// Use different severity levels
logger.debug('Debug information');
logger.info('Important information');
logger.warn('Warning message');
logger.error('Error occurred', error);`}
        </pre>
      </div>
    </div>
  );
};

export const Default: Story = {
  render: () => <LoggerDemo />,
};

export const WithCustomContext: Story = {
  render: () => {
    const logger = new Logger('CustomComponent');
    React.useEffect(() => {
      logger.info('Component mounted with custom context');
      return () => {
        logger.info('Component unmounting');
      };
    }, []);
    
    return (
      <div className="p-4">
        <p>Check the console for logs with custom context.</p>
        <p className="text-sm text-gray-600 mt-2">
          Logger created with context: 'CustomComponent'
        </p>
      </div>
    );
  },
};

export const LoggingDisabled: Story = {
  render: () => (
    <div className="p-4">
      <div className="bg-red-100 border border-red-400 p-3 rounded mb-4">
        <p className="font-semibold">Logging is currently disabled</p>
        <p>Set NEXT_PUBLIC_DEBUG_LOGGING=true in your .env.local file to enable logging.</p>
      </div>
      <p>No logs will appear in the console when logging is disabled.</p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'This story demonstrates the logger behavior when logging is disabled.',
      },
    },
  },
};