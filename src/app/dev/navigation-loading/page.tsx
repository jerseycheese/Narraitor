'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';
import { useNavigationLoadingContext } from '@/components/shared/NavigationLoadingProvider';
import { LoadingVariant } from '@/components/ui/LoadingState/LoadingState';

/**
 * Navigation Loading Test Harness
 * 
 * Test page for verifying navigation loading states and transitions.
 * Provides controls for testing different loading scenarios, variants,
 * and behaviors including debouncing and error states.
 */
export default function NavigationLoadingTestPage() {
  const {
    isLoading,
    loadingState,
    setLoadingMessage,
    setLoadingState,
    clearLoading,
    navigateWithLoading,
  } = useNavigationLoadingContext();

  const [localOverlay, setLocalOverlay] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<LoadingVariant>('spinner');
  const [customMessage, setCustomMessage] = useState('Testing loading state...');

  const testNavigationRoutes = [
    { path: '/worlds', label: 'Worlds Page', message: 'Loading worlds...' },
    { path: '/characters', label: 'Characters Page', message: 'Loading characters...' },
    { path: '/world/create', label: 'Create World', message: 'Setting up world creation...' },
    { path: '/characters/create', label: 'Create Character', message: 'Preparing character creation...' },
  ];

  const testLoadingScenarios = [
    {
      type: 'page' as const,
      message: 'Loading new page...',
      description: 'Standard page navigation',
    },
    {
      type: 'data' as const,
      message: 'Loading character data...',
      description: 'Data fetching operation',
    },
    {
      type: 'error' as const,
      message: 'Connection failed. Retrying...',
      description: 'Error state with retry',
    },
  ];

  const handleTestScenario = (scenario: typeof testLoadingScenarios[0]) => {
    setLoadingState({
      isLoading: true,
      loadingType: scenario.type,
      message: scenario.message,
    });
  };

  const handleTestDebouncing = () => {
    // Test fast clear to verify debouncing prevents flash
    setLoadingMessage('This should not flash...');
    setTimeout(() => {
      clearLoading();
    }, 100); // Clear before 150ms debounce threshold
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="border-b pb-4">
        <h1 className="text-2xl font-bold mb-2">Navigation Loading Test Harness</h1>
        <p className="text-gray-600 mb-4">
          Test and verify navigation loading states, transitions, and user feedback.
        </p>
        <div className="bg-blue-50 p-4 rounded-lg text-sm">
          <h3 className="font-semibold mb-2">Loading Strategy (Option 2):</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-green-700 mb-1">✅ Shows LoadingOverlay:</p>
              <ul className="text-green-600 space-y-1">
                <li>• World switching (loads data)</li>
                <li>• Starting gameplay (initializes session)</li>
                <li>• Creation wizards (complex flows)</li>
              </ul>
            </div>
            <div>
              <p className="font-medium text-gray-700 mb-1">⚡ Fast Navigation (No overlay):</p>
              <ul className="text-gray-600 space-y-1">
                <li>• Worlds/Characters links</li>
                <li>• Home/Logo navigation</li>
                <li>• Simple page transitions</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Current State Display */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Current Loading State</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Type:</strong> {loadingState.loadingType}
          </div>
          <div>
            <strong>Message:</strong> {loadingState.message || 'None'}
          </div>
          <div>
            <strong>Route:</strong> {loadingState.route || 'None'}
          </div>
        </div>
        <div className="mt-3 space-x-2">
          <Button
            onClick={clearLoading}
            variant="outline"
            size="sm"
            disabled={!isLoading}
          >
            Clear Loading
          </Button>
          <Button
            onClick={clearLoading}
            variant="destructive"
            size="sm"
            disabled={!isLoading}
          >
            Emergency Clear
          </Button>
        </div>
      </div>

      {/* Global Loading Tests */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Global Loading Context Tests</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {testLoadingScenarios.map((scenario, index) => (
            <div key={index} className="border p-4 rounded-lg">
              <h3 className="font-medium mb-2">{scenario.description}</h3>
              <p className="text-sm text-gray-600 mb-3">{scenario.message}</p>
              <Button
                onClick={() => handleTestScenario(scenario)}
                variant={scenario.type === 'error' ? 'destructive' : 'default'}
                size="sm"
                className="w-full"
              >
                Test {scenario.type}
              </Button>
            </div>
          ))}
        </div>

        <div className="border p-4 rounded-lg">
          <h3 className="font-medium mb-2">Custom Message Test</h3>
          <div className="flex gap-2 mb-3">
            <input
              type="text"
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
              placeholder="Enter custom loading message..."
            />
            <Button
              onClick={() => setLoadingMessage(customMessage)}
              size="sm"
            >
              Test Custom
            </Button>
          </div>
        </div>

        <div className="border p-4 rounded-lg">
          <h3 className="font-medium mb-2">Debouncing Test</h3>
          <p className="text-sm text-gray-600 mb-3">
            Tests that loading states under 150ms don&apos;t flash
          </p>
          <Button
            onClick={handleTestDebouncing}
            variant="outline"
            size="sm"
          >
            Test Fast Clear (No Flash)
          </Button>
        </div>
      </div>

      {/* Navigation with Loading Tests */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Navigation with Loading Tests</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testNavigationRoutes.map((route, index) => (
            <div key={index} className="border p-4 rounded-lg">
              <h3 className="font-medium mb-2">{route.label}</h3>
              <p className="text-sm text-gray-600 mb-3">{route.message}</p>
              <Button
                onClick={() => navigateWithLoading(route.path, route.message)}
                className="w-full"
                size="sm"
              >
                Navigate to {route.label}
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Fast Navigation Comparison */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Fast Navigation (No Loading Overlay)</h2>
        <p className="text-sm text-gray-600">
          These navigation actions use regular Next.js Links for instant transitions without loading overlays.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border p-4 rounded-lg">
            <h3 className="font-medium mb-2">Simple List Navigation</h3>
            <p className="text-sm text-gray-600 mb-3">Fast page transitions for list views</p>
            <div className="space-y-2">
              <Link href="/worlds" className="block px-3 py-2 bg-gray-100 rounded text-center hover:bg-gray-200 transition-colors">
                → Worlds List
              </Link>
              <Link href="/characters" className="block px-3 py-2 bg-gray-100 rounded text-center hover:bg-gray-200 transition-colors">
                → Characters List
              </Link>
            </div>
          </div>
          <div className="border p-4 rounded-lg">
            <h3 className="font-medium mb-2">Static Page Navigation</h3>
            <p className="text-sm text-gray-600 mb-3">Instant navigation to static content</p>
            <div className="space-y-2">
              <Link href="/" className="block px-3 py-2 bg-gray-100 rounded text-center hover:bg-gray-200 transition-colors">
                → Home Page
              </Link>
              <Link href="/about" className="block px-3 py-2 bg-gray-100 rounded text-center hover:bg-gray-200 transition-colors">
                → About Page
              </Link>
            </div>
          </div>
          <div className="border p-4 rounded-lg">
            <h3 className="font-medium mb-2">Dev Pages</h3>
            <p className="text-sm text-gray-600 mb-3">Development tools and testing</p>
            <div className="space-y-2">
              <Link href="/dev" className="block px-3 py-2 bg-gray-100 rounded text-center hover:bg-gray-200 transition-colors">
                → Dev Tools
              </Link>
              <Link href="/dev/shadcn-test" className="block px-3 py-2 bg-gray-100 rounded text-center hover:bg-gray-200 transition-colors">
                → Component Test
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Local Overlay Tests */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Local LoadingOverlay Tests</h2>
        
        <div className="border p-4 rounded-lg">
          <h3 className="font-medium mb-3">Variant Testing</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Variant:</label>
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value as LoadingVariant)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="spinner">Spinner</option>
                <option value="dots">Dots</option>
                <option value="pulse">Pulse</option>
                <option value="skeleton">Skeleton</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Actions:</label>
              <div className="space-y-2">
                <Button
                  onClick={() => setLocalOverlay(true)}
                  size="sm"
                  className="w-full"
                >
                  Show Local Overlay
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Network Simulation */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Network Condition Simulation</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button
            onClick={() => {
              setLoadingMessage('Fast loading...');
              setTimeout(clearLoading, 50); // Very fast
            }}
            variant="outline"
          >
            Fast Network (50ms)
          </Button>
          <Button
            onClick={() => {
              setLoadingMessage('Normal loading...');
              setTimeout(clearLoading, 1000); // Normal
            }}
            variant="outline"
          >
            Normal Network (1s)
          </Button>
          <Button
            onClick={() => {
              setLoadingMessage('Slow loading...');
              setTimeout(clearLoading, 3000); // Slow
            }}
            variant="outline"
          >
            Slow Network (3s)
          </Button>
        </div>
      </div>

      {/* Local LoadingOverlay */}
      <LoadingOverlay
        isVisible={localOverlay}
        variant={selectedVariant}
        message={`Testing ${selectedVariant} variant locally`}
        onCancel={() => setLocalOverlay(false)}
      />

      {/* Background Content */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">Background Content</h3>
        <p className="text-sm text-gray-600 mb-3">
          This content should be blocked when overlays are active.
        </p>
        <Button variant="outline" size="sm">
          Background Button (should be blocked)
        </Button>
      </div>
    </div>
  );
}