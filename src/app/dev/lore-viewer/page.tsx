/**
 * Test Harness for LoreViewer Component
 * Stage 2 of Three-Stage Verification Framework
 */

'use client';

import React, { useState } from 'react';
import { LoreViewer } from '@/components/LoreViewer';
import { useLoreStore } from '@/state/loreStore';

export default function LoreViewerTestHarness() {
  const [selectedWorldId, setSelectedWorldId] = useState('test-world-1');
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const { facts, loading, error, createFact, clearAllFacts } = useLoreStore();

  // Get facts for current world
  const worldFacts = Object.values(facts).filter(fact => fact.worldId === selectedWorldId);

  const handleGenerateTestData = () => {
    // Clear existing facts for this world first
    Object.values(facts)
      .filter(fact => fact.worldId === selectedWorldId)
      .forEach(fact => {
        useLoreStore.getState().deleteFact(fact.id);
      });

    // Generate comprehensive test data
    const testFacts = [
      {
        category: 'characters' as const,
        title: 'Aria Shadowbane',
        content: 'A skilled assassin turned protector, Aria wields shadow magic and fights to redeem her dark past.',
        source: 'manual' as const,
        tags: ['assassin', 'shadow-magic', 'redemption', 'protagonist'],
        isCanonical: true,
        relatedFacts: [],
        worldId: selectedWorldId
      },
      {
        category: 'characters' as const,
        title: 'Master Thorne',
        content: 'An ancient wizard who serves as mentor to young heroes. His beard sparkles with residual magic.',
        source: 'narrative' as const,
        tags: ['wizard', 'mentor', 'ancient', 'magic'],
        isCanonical: true,
        relatedFacts: [],
        worldId: selectedWorldId
      },
      {
        category: 'locations' as const,
        title: 'The Floating Citadel',
        content: 'A massive fortress that hovers above the clouds, accessible only by those who can fly or teleport.',
        source: 'manual' as const,
        tags: ['fortress', 'floating', 'clouds', 'magical'],
        isCanonical: true,
        relatedFacts: [],
        worldId: selectedWorldId
      },
      {
        category: 'locations' as const,
        title: 'Whispering Woods',
        content: 'A mysterious forest where the trees themselves seem to communicate in hushed voices.',
        source: 'ai_generated' as const,
        tags: ['forest', 'mysterious', 'sentient-trees', 'communication'],
        isCanonical: false,
        relatedFacts: [],
        worldId: selectedWorldId
      },
      {
        category: 'events' as const,
        title: 'The Sundering',
        content: 'A cataclysmic event 500 years ago that split the continent into floating islands.',
        source: 'manual' as const,
        tags: ['cataclysm', 'historical', 'continent-split', 'floating-islands'],
        isCanonical: true,
        relatedFacts: [],
        worldId: selectedWorldId
      },
      {
        category: 'rules' as const,
        title: 'Magic Resonance',
        content: 'Magic users of the same school can sense each other within a mile radius.',
        source: 'manual' as const,
        tags: ['magic', 'detection', 'schools', 'sensing'],
        isCanonical: true,
        relatedFacts: [],
        worldId: selectedWorldId
      },
      {
        category: 'items' as const,
        title: 'Stormcaller Staff',
        content: 'A legendary staff that can summon lightning storms but drains the wielder\'s life force.',
        source: 'narrative' as const,
        tags: ['legendary', 'staff', 'lightning', 'life-drain'],
        isCanonical: true,
        relatedFacts: [],
        worldId: selectedWorldId
      },
      {
        category: 'organizations' as const,
        title: 'The Sky Watch',
        content: 'A military organization that patrols the airways between floating islands using trained griffins.',
        source: 'manual' as const,
        tags: ['military', 'patrol', 'airways', 'griffins'],
        isCanonical: true,
        relatedFacts: [],
        worldId: selectedWorldId
      }
    ];

    testFacts.forEach(fact => createFact(fact));
  };

  const handleClearData = () => {
    Object.values(facts)
      .filter(fact => fact.worldId === selectedWorldId)
      .forEach(fact => {
        useLoreStore.getState().deleteFact(fact.id);
      });
  };

  const handleExtractFromText = () => {
    const sampleNarrative = `
      The ancient Tower of Mysteries stands at the heart of Eldermere City. 
      Captain Elena Brightblade leads the city guard with unwavering dedication.
      During the Festival of Lights, citizens gather to celebrate the return of magic to the realm.
      The Crimson Brotherhood operates in secret, seeking to overthrow the current government.
    `;

    useLoreStore.getState().extractFactsFromText(sampleNarrative, selectedWorldId, 'narrative');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">LoreViewer Test Harness</h1>
          <p className="text-gray-600 mt-2">
            Stage 2 verification: Integration testing with realistic data and parent components
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* World Selector */}
            <div>
              <label htmlFor="world-select" className="block text-sm font-medium text-gray-700 mb-2">
                Test World
              </label>
              <select
                id="world-select"
                value={selectedWorldId}
                onChange={(e) => setSelectedWorldId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="test-world-1">Test World 1</option>
                <option value="test-world-2">Test World 2</option>
                <option value="empty-world">Empty World</option>
              </select>
            </div>

            {/* Debug Toggle */}
            <div className="flex items-end">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={showDebugInfo}
                  onChange={(e) => setShowDebugInfo(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium text-gray-700">Show Debug Info</span>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleGenerateTestData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Generate Test Data
            </button>
            <button
              onClick={handleClearData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Clear Data
            </button>
            <button
              onClick={handleExtractFromText}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Test Fact Extraction
            </button>
            <button
              onClick={() => useLoreStore.getState().setLoading(!loading)}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              Toggle Loading
            </button>
            <button
              onClick={() => useLoreStore.getState().setError(error ? null : 'Test error message')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Toggle Error
            </button>
          </div>
        </div>

        {/* Debug Information */}
        {showDebugInfo && (
          <div className="bg-gray-900 text-green-400 rounded-lg p-4 mb-6 font-mono text-sm">
            <h3 className="text-white font-semibold mb-2">Debug Information</h3>
            <div className="space-y-1">
              <div>Selected World: <span className="text-yellow-400">{selectedWorldId}</span></div>
              <div>Facts in World: <span className="text-yellow-400">{worldFacts.length}</span></div>
              <div>Total Facts: <span className="text-yellow-400">{Object.keys(facts).length}</span></div>
              <div>Loading: <span className="text-yellow-400">{loading.toString()}</span></div>
              <div>Error: <span className="text-yellow-400">{error || 'none'}</span></div>
            </div>
            
            {worldFacts.length > 0 && (
              <details className="mt-3">
                <summary className="text-white cursor-pointer">Fact Details</summary>
                <pre className="mt-2 text-xs overflow-auto max-h-40">
                  {JSON.stringify(worldFacts, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}

        {/* Integration Test Scenarios */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Integration Test Scenarios</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Performance Tests</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Generate 50+ facts and test search responsiveness</li>
                <li>• Test rapid create/delete operations</li>
                <li>• Verify memory usage with large datasets</li>
                <li>• Test concurrent operations</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-medium text-gray-900">Integration Tests</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Cross-world fact isolation</li>
                <li>• Persistence across browser refresh</li>
                <li>• Error recovery and state consistency</li>
                <li>• AI context generation accuracy</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Main Component */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold">LoreViewer Component</h2>
            <p className="text-gray-600 text-sm mt-1">
              Testing with world: <span className="font-medium">{selectedWorldId}</span>
            </p>
          </div>
          
          <div className="p-6">
            <LoreViewer worldId={selectedWorldId} />
          </div>
        </div>
      </div>
    </div>
  );
}