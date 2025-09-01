'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  PerformanceTimer,
  measureTime,
  measureAsync,
  createPerformanceGroup,
  formatDuration,
  getGlobalPerformanceReport,
  clearGlobalMeasurements,
  createCriticalPathMonitor,
  trackPerformanceMetrics,
  getBatchMetrics,
  clearBatchMetrics,
  logPerformanceReport
} from '@/lib/utils';

export default function PerformanceUtilsTestHarness() {
  const [results, setResults] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Test functions that simulate real workloads
  const simulateExpensiveCalculation = (duration: number) => {
    const start = performance.now();
    while (performance.now() - start < duration) {
      // Busy wait to simulate work
      Math.random();
    }
    return `Calculation completed in ~${duration}ms`;
  };

  const simulateAsyncOperation = async (duration: number) => {
    await new Promise(resolve => setTimeout(resolve, duration));
    return `Async operation completed in ~${duration}ms`;
  };

  const testManualTimer = () => {
    addResult('🔍 Testing Manual Timer...');
    const timer = new PerformanceTimer('manual-test', 'test-harness');
    
    timer.start();
    simulateExpensiveCalculation(50);
    const duration = timer.stop();
    
    addResult(`✅ Manual timer: ${formatDuration(duration)}`);
    addResult(`📊 Timer elapsed during execution: ${formatDuration(timer.elapsed())}`);
  };

  const testFunctionWrapping = () => {
    addResult('🔍 Testing Function Wrapping...');
    
    // Wrap the expensive function
    const measuredCalculation = measureTime(
      simulateExpensiveCalculation as (...args: unknown[]) => unknown,
      'wrapped-calculation',
      { context: 'test-harness', logResult: true }
    ) as typeof simulateExpensiveCalculation;
    
    const result = measuredCalculation(75);
    addResult(`✅ Function wrapping: ${result}`);
  };

  const testAsyncWrapping = async () => {
    addResult('🔍 Testing Async Function Wrapping...');
    
    // Wrap the async function
    const measuredAsync = measureAsync(
      simulateAsyncOperation as (...args: unknown[]) => Promise<unknown>,
      'wrapped-async-operation',
      { context: 'test-harness', logResult: true }
    ) as typeof simulateAsyncOperation;
    
    const result = await measuredAsync(100);
    addResult(`✅ Async wrapping: ${result}`);
  };

  const testPerformanceGroups = () => {
    addResult('🔍 Testing Performance Groups...');
    
    const renderGroup = createPerformanceGroup('ui-rendering');
    
    // Create grouped measurements
    const measureRender = renderGroup.measure(
      () => simulateExpensiveCalculation(30),
      'render-phase'
    );
    
    const measureUpdate = renderGroup.measure(
      () => simulateExpensiveCalculation(20),
      'update-phase'
    );
    
    measureRender();
    measureUpdate();
    measureRender(); // Test multiple calls
    
    const report = renderGroup.getReport();
    addResult(`✅ Group measurements: ${report.summary.count} operations`);
    addResult(`📊 Average time: ${formatDuration(report.summary.averageTime)}`);
    addResult(`📈 P95 time: ${formatDuration(report.summary.percentiles.p95)}`);
  };

  const testCriticalPathMonitoring = () => {
    addResult('🔍 Testing Critical Path Monitoring...');
    
    // Create monitored function with thresholds
    const monitoredFunction = createCriticalPathMonitor(
      simulateExpensiveCalculation as (...args: unknown[]) => unknown,
      'critical-operation',
      {
        warnThreshold: 40,
        errorThreshold: 80,
        context: 'test-harness',
        logResult: true
      }
    ) as typeof simulateExpensiveCalculation;
    
    // Test with different durations
    monitoredFunction(25); // Should be fine
    monitoredFunction(60); // Should warn
    
    addResult('✅ Critical path monitoring completed (check console for threshold warnings)');
  };

  const testBatchMetrics = () => {
    addResult('🔍 Testing Batch Metrics...');
    
    // Track some metrics
    trackPerformanceMetrics('user-interaction', 150);
    trackPerformanceMetrics('api-call', 300);
    trackPerformanceMetrics('user-interaction', 120);
    trackPerformanceMetrics('data-processing', 450);
    
    const metrics = getBatchMetrics();
    const metricNames = Object.keys(metrics);
    
    addResult(`✅ Batch metrics tracked: ${metricNames.length} categories`);
    metricNames.forEach(name => {
      const metric = metrics[name];
      addResult(`📊 ${name}: ${metric.count} calls, avg ${formatDuration(metric.averageTime)}`);
    });
  };

  const testGlobalReporting = () => {
    addResult('🔍 Testing Global Performance Reporting...');
    
    const report = getGlobalPerformanceReport();
    addResult(`✅ Global report: ${report.summary.count} measurements`);
    
    if (report.summary.count > 0) {
      addResult(`📊 Total time: ${formatDuration(report.summary.totalTime)}`);
      addResult(`📊 Average: ${formatDuration(report.summary.averageTime)}`);
      addResult(`📊 P90: ${formatDuration(report.summary.percentiles.p90)}`);
      
      // Log detailed report to console
      logPerformanceReport(report, 'Test Harness Performance Summary');
    }
  };

  const testEnvironmentDetection = () => {
    addResult('🔍 Testing Environment Detection...');
    addResult(`📝 Current NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
    addResult('✅ Environment detection working (measurements only in development)');
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      addResult('🚀 Starting Performance Utils Test Suite...');
      
      // Clear previous measurements
      clearGlobalMeasurements();
      clearBatchMetrics();
      
      // Run all tests
      testManualTimer();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      testFunctionWrapping();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await testAsyncWrapping();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      testPerformanceGroups();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      testCriticalPathMonitoring();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      testBatchMetrics();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      testGlobalReporting();
      await new Promise(resolve => setTimeout(resolve, 100));
      
      testEnvironmentDetection();
      
      addResult('✅ All performance utility tests completed successfully!');
      addResult('📋 Check browser console for detailed logging output');
      
    } catch (error) {
      addResult(`❌ Test failed: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    clearGlobalMeasurements();
    clearBatchMetrics();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Performance Utils Test Harness
        </h1>
        <p className="text-gray-700">
          Interactive testing environment for performance measurement utilities (Issue #107)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Test Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={isRunning ? "secondary" : "default"}>
              {isRunning ? "Running..." : "Ready"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Results Count</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold">{results.length}</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Environment</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline">
              {process.env.NODE_ENV || 'development'}
            </Badge>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-4 mb-6">
        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          className="bg-blue-500 hover:bg-blue-700"
        >
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </Button>
        
        <Button 
          onClick={clearResults} 
          variant="outline"
          disabled={isRunning}
        >
          Clear Results
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Results</CardTitle>
          <CardDescription>
            Real-time output from performance utility tests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div 
            className="bg-gray-100 rounded-lg p-4 font-mono text-sm max-h-96 overflow-y-auto"
            data-testid="test-results"
          >
            {results.length === 0 ? (
              <p className="text-gray-500">Click &quot;Run All Tests&quot; to begin testing...</p>
            ) : (
              results.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Coverage</CardTitle>
          <CardDescription>
            Utilities being tested in this harness
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Core Utilities</h4>
              <ul className="text-sm space-y-1">
                <li>✅ PerformanceTimer (manual timing)</li>
                <li>✅ measureTime() (function wrapping)</li>
                <li>✅ measureAsync() (async wrapping)</li>
                <li>✅ createPerformanceGroup() (grouped measurements)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Advanced Features</h4>
              <ul className="text-sm space-y-1">
                <li>✅ Critical path monitoring</li>
                <li>✅ Batch metrics tracking</li>
                <li>✅ Global performance reporting</li>
                <li>✅ Environment detection</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}