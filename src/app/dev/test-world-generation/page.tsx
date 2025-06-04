'use client';

import { useState } from 'react';
import { generateWorld } from '@/lib/generators/worldGenerator';
import type { GeneratedWorldData } from '@/lib/generators/worldGenerator';

export default function TestWorldGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorld, setGeneratedWorld] = useState<GeneratedWorldData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testCases = [
    { reference: 'The Office', relationship: 'set_in' as const, expectedTheme: 'Modern' },
    { reference: 'Star Wars', relationship: 'set_in' as const, expectedTheme: 'Sci-Fi' },
    { reference: 'Lord of the Rings', relationship: 'set_in' as const, expectedTheme: 'Fantasy' },
    { reference: 'Breaking Bad', relationship: 'set_in' as const, expectedTheme: 'Modern' },
    { reference: 'The Walking Dead', relationship: 'set_in' as const, expectedTheme: 'Post-Apocalyptic' },
  ];

  const runTest = async (testCase: typeof testCases[0]) => {
    setIsGenerating(true);
    setError(null);
    setGeneratedWorld(null);

    try {
      const result = await generateWorld({
        method: 'ai',
        reference: testCase.reference,
        relationship: testCase.relationship,
        existingNames: []
      });

      setGeneratedWorld(result);

      // Check if theme matches expected
      if (result.theme !== testCase.expectedTheme) {
        setError(`Expected theme &quot;${testCase.expectedTheme}&quot; but got &quot;${result.theme}&quot;`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">World Generation Theme Test</h1>
      
      <div className="mb-6">
        <p className="text-gray-600 mb-4">
          Test that worlds set within non-fantasy universes don&apos;t get fantasy themes or elements.
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {testCases.map((testCase) => (
          <div key={testCase.reference} className="flex items-center gap-4">
            <button
              onClick={() => runTest(testCase)}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Test &quot;{testCase.reference}&quot;
            </button>
            <span className="text-sm text-gray-600">
              Expected theme: {testCase.expectedTheme}
            </span>
          </div>
        ))}
      </div>

      {isGenerating && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <p className="text-blue-700">Generating world...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
          <p className="text-red-700 font-semibold">Error:</p>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {generatedWorld && (
        <div className="bg-white border border-gray-200 rounded p-6">
          <h2 className="text-xl font-semibold mb-4">Generated World</h2>
          
          <div className="space-y-3">
            <div>
              <span className="font-semibold">Name:</span> {generatedWorld.name}
            </div>
            <div className={`${generatedWorld.theme === 'Fantasy' && !generatedWorld.name.includes('Lord') ? 'text-red-600' : ''}`}>
              <span className="font-semibold">Theme:</span> {generatedWorld.theme}
              {generatedWorld.theme === 'Fantasy' && !generatedWorld.name.includes('Lord') && (
                <span className="ml-2 text-red-600">(❌ Should not be Fantasy!)</span>
              )}
            </div>
            <div>
              <span className="font-semibold">Description:</span> {generatedWorld.description}
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Attributes ({generatedWorld.attributes.length}):</h3>
            <ul className="list-disc list-inside space-y-1">
              {generatedWorld.attributes.map((attr, i) => (
                <li key={i} className={`text-sm ${attr.name.match(/magic|mana|arcane/i) ? 'text-red-600' : ''}`}>
                  <span className="font-medium">{attr.name}:</span> {attr.description}
                  {attr.name.match(/magic|mana|arcane/i) && (
                    <span className="ml-2 text-red-600">(❌ Fantasy element!)</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6">
            <h3 className="font-semibold mb-2">Skills ({generatedWorld.skills.length}):</h3>
            <ul className="list-disc list-inside space-y-1">
              {generatedWorld.skills.map((skill, i) => (
                <li key={i} className={`text-sm ${skill.name.match(/magic|spell|sorcery|enchant/i) ? 'text-red-600' : ''}`}>
                  <span className="font-medium">{skill.name}:</span> {skill.description}
                  {skill.name.match(/magic|spell|sorcery|enchant/i) && (
                    <span className="ml-2 text-red-600">(❌ Fantasy element!)</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}