import type { Meta, StoryObj } from '@storybook/react';
import React, { useState } from 'react';
import Logger from '@/lib/utils/logger';

const meta: Meta = {
  title: 'Narraitor/Utilities/Logger',
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
interface LogEntry {
  level: string;
  timestamp: string;
  context: string;
  message: string;
  style: string | null;
}

const LoggerDemo: React.FC = () => {
  const [componentName, setComponentName] = useState('DemoComponent');
  const [logOutput, setLogOutput] = useState<LogEntry[]>([]);
  const [isLoggingEnabled, setIsLoggingEnabled] = useState(true);
  
  // Create a logger that we can control for the demo
  const logger = React.useMemo(() => {
    const log = new Logger(componentName);
    // Override the isEnabled property for demo purposes
    log.isEnabled = isLoggingEnabled;
    return log;
  }, [componentName, isLoggingEnabled]);

  // Override console methods to capture output
  React.useEffect(() => {
    const originalDebug = console.debug;
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const captureLog = (level: string) => (...args: unknown[]) => {
      // Check if this is a formatted log from our logger
      if (typeof args[0] === 'string' && args[0].includes('%c')) {
        // Extract the actual message, skipping the format string and style
        const formatString = args[0];
        const style = args[1];
        const messageArgs = args.slice(2);
        
        // Parse the format string to get the actual message
        const messageMatch = formatString.match(/\[([^\]]+)\]\s+([A-Z]+)\s+\[([^\]]+)\]/);
        if (messageMatch) {
          const [, timestamp, , context] = messageMatch;
          // Filter out any objects that are just data
          const message = messageArgs
            .filter(arg => typeof arg !== 'object' || arg === null)
            .join(' ');
          setLogOutput(prev => [...prev, {
            level,
            timestamp,
            context,
            message: message || messageArgs[0]?.toString() || '',
            style: typeof style === 'string' ? style : null
          }]);
        }
      } else {
        // Regular console log
        const message = args.join(' ');
        setLogOutput(prev => [...prev, {
          level,
          message,
          style: null,
          timestamp: new Date().toISOString(),
          context: 'Console'
        }]);
      }
      
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
    logger[level](message);
  };

  const clearLogs = () => {
    setLogOutput([]);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-yellow-100 border border-yellow-400 p-3 rounded mb-4">
        <p className="font-semibold">Logger Configuration</p>
        <p>NEXT_PUBLIC_DEBUG_LOGGING: {process.env.NEXT_PUBLIC_DEBUG_LOGGING || 'undefined'}</p>
        <p>NODE_ENV: {process.env.NODE_ENV}</p>
        <p>Demo Logging is: {isLoggingEnabled ? 'ENABLED' : 'DISABLED'}</p>
        <p className="text-sm text-gray-600 mt-1">
          Note: This demo overrides the environment variable for testing purposes.
        </p>
        <button
          onClick={() => setIsLoggingEnabled(!isLoggingEnabled)}
          className={`mt-2 px-4 py-2 rounded text-white ${
            isLoggingEnabled ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {isLoggingEnabled ? 'Disable Logging' : 'Enable Logging'}
        </button>
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
        <div className="font-semibold mb-2">Console Output (captured):</div>
        <div className="bg-slate-800 text-slate-100 p-4 rounded font-mono text-sm max-h-64 overflow-y-auto border border-slate-700">
          {logOutput.length === 0 ? (
            <span className="text-white block">No logs captured yet. Click the buttons above to test logging.</span>
          ) : (
            logOutput.map((log, index) => {
              const levelColors: { [key: string]: string } = {
                'DEBUG': 'text-gray-400',
                'INFO': 'text-blue-400',
                'WARN': 'text-yellow-400',
                'ERROR': 'text-red-400'
              };
              
              return (
                <div key={index} className="mb-1 flex items-start">
                  <span className="text-gray-500">[{log.timestamp}]</span>
                  <span className={`ml-2 font-bold ${levelColors[log.level] || 'text-white'}`}>
                    {log.level.padEnd(5)}
                  </span>
                  <span className="ml-2 text-gray-400">[{log.context}]</span>
                  <span className="ml-2 text-white">{log.message}</span>
                </div>
              );
            })
          )}
        </div>
        <div className="text-sm text-gray-600 mt-2">
          Note: Use the &quot;Enable Logging&quot; button above to test the logger in this story.
          In production, logs only appear when NEXT_PUBLIC_DEBUG_LOGGING=true and NODE_ENV !== &apos;production&apos;
        </div>
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

const CustomContextDemo = () => {
  const logger = React.useMemo(() => new Logger('CustomComponent'), []);
  React.useEffect(() => {
    logger.info('Component mounted with custom context');
    return () => {
      logger.info('Component unmounting');
    };
  }, [logger]);
  
  return (
    <div className="p-4">
      <p>Check the console for logs with custom context.</p>
      <p className="text-sm text-gray-600 mt-2">
        Logger created with context: &apos;CustomComponent&apos;
      </p>
    </div>
  );
};

export const WithCustomContext: Story = {
  render: () => <CustomContextDemo />,
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