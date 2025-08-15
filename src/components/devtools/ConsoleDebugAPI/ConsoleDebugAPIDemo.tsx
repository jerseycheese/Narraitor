'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { consoleDebugAPI } from '@/lib/devtools/consoleDebugAPI';

export function ConsoleDebugAPIDemo() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isDevelopment, setIsDevelopment] = useState(false);

  useEffect(() => {
    // Check environment
    const isDev = process.env.NODE_ENV === 'development';
    setIsDevelopment(isDev);

    // Initialize console API
    if (isDev) {
      consoleDebugAPI.initialize();
      setIsInitialized(typeof window !== 'undefined' && window.NARRAITOR_DEBUG !== undefined);
    }
  }, []);

  const testFunctions = [
    {
      name: 'clearLogs',
      description: 'Clear browser console',
      code: 'NARRAITOR_DEBUG.clearLogs()',
      action: () => window.NARRAITOR_DEBUG?.clearLogs()
    },
    {
      name: 'triggerError',
      description: 'Trigger test error',
      code: 'NARRAITOR_DEBUG.triggerError("Test error")',
      action: () => {
        try {
          window.NARRAITOR_DEBUG?.triggerError('Test error from demo');
        } catch (error) {
          console.error('Caught demo error:', error);
        }
      }
    },
    {
      name: 'simulateCondition',
      description: 'Simulate offline condition',
      code: 'NARRAITOR_DEBUG.simulateCondition("offline")',
      action: () => {
        const result = window.NARRAITOR_DEBUG?.simulateCondition('offline');
        console.log(result);
      }
    },
    {
      name: 'getStoreState',
      description: 'Access store state',
      code: 'NARRAITOR_DEBUG.getStoreState()',
      action: () => {
        const result = window.NARRAITOR_DEBUG?.getStoreState();
        console.log(result);
      }
    },
    {
      name: 'help',
      description: 'Show help documentation',
      code: 'NARRAITOR_DEBUG.help()',
      action: () => {
        const result = window.NARRAITOR_DEBUG?.help();
        console.log(result);
      }
    }
  ];

  if (!isDevelopment) {
    return (
      <Card className="p-6 max-w-lg">
        <div className="text-center">
          <Badge variant="secondary" className="mb-4">
            Production Environment
          </Badge>
          <h3 className="text-lg font-semibold mb-2">Console Debug API</h3>
          <p className="text-sm text-muted-foreground">
            The console debug API is only available in development environment.
            Set NODE_ENV=development to enable debugging functions.
          </p>
        </div>
      </Card>
    );
  }

  if (!isInitialized) {
    return (
      <Card className="p-6 max-w-lg">
        <div className="text-center">
          <Badge variant="outline" className="mb-4">
            Not Available
          </Badge>
          <h3 className="text-lg font-semibold mb-2">Console Debug API</h3>
          <p className="text-sm text-muted-foreground">
            Debug API not available in current environment.
            Make sure you&apos;re running in a browser with development mode enabled.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 max-w-2xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="default" className="bg-green-600">
            Active
          </Badge>
          <h3 className="text-lg font-semibold">Console Debug API</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Debug functions are available via <code className="bg-muted px-1 py-0.5 rounded">window.NARRAITOR_DEBUG</code>
        </p>
        <div className="bg-muted p-3 rounded text-sm">
          <strong>Open your browser console</strong> and type{' '}
          <code>NARRAITOR_DEBUG.help()</code> to see all available functions.
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="font-medium">Try these functions:</h4>
        {testFunctions.map((func) => (
          <div key={func.name} className="flex items-center justify-between p-3 border rounded">
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm">{func.name}()</div>
              <div className="text-xs text-muted-foreground">{func.description}</div>
              <code className="text-xs bg-muted px-1 py-0.5 rounded mt-1 inline-block">
                {func.code}
              </code>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={func.action}
              className="ml-3"
            >
              Run
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded text-sm">
        <strong>Note:</strong> Check your browser console to see the output of these functions.
        The debug API supports automation and scripting scenarios.
      </div>
    </Card>
  );
}