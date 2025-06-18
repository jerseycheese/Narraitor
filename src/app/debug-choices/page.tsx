'use client';

import React, { useState } from 'react';
import { ChoiceGenerator } from '@/lib/ai/choiceGenerator';
import { createDefaultGeminiClient } from '@/lib/ai/defaultGeminiClient';
import { Decision, NarrativeContext } from '@/types/narrative.types';

export default function DebugChoicesPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const testChoiceGeneration = async () => {
    setIsGenerating(true);
    setResult(null);
    setError(null);
    setLogs([]);

    try {
      addLog('Starting choice generation test...');
      
      const client = createDefaultGeminiClient();
      addLog('Created Gemini client');
      
      const choiceGenerator = new ChoiceGenerator(client);
      addLog('Created ChoiceGenerator');

      const narrativeContext: NarrativeContext = {
        worldId: 'world-1',
        currentSceneId: 'scene-test',
        characterIds: [],
        previousSegments: [{
          id: 'test-segment',
          content: 'The ancient forest of Fantasy Realm stretched before you, emerald and gold in dappled sunlight. Towering trees rustled with ancient secrets. In the distance, crystalline spires glimmered like jewels.',
          type: 'scene',
          metadata: { location: 'Enchanted Forest' },
          sessionId: 'test-session',
          worldId: 'world-1',
          timestamp: new Date(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }],
        currentTags: [],
        sessionId: 'test-session',
        recentSegments: [],
        currentLocation: 'Enchanted Forest'
      };

      addLog('Created narrative context');

      const decision = await choiceGenerator.generateChoices({
        worldId: 'world-1',
        narrativeContext,
        characterIds: [],
        minOptions: 3,
        maxOptions: 4,
        useAlignedChoices: true
      });

      addLog('Choice generation completed');
      addLog(`Generated decision with ${decision.options.length} options`);
      
      setResult(decision);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      addLog(`Error: ${errorMsg}`);
      setError(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Choice Generation Debug Page</h1>
      
      <button
        onClick={testChoiceGeneration}
        disabled={isGenerating}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {isGenerating ? 'Generating...' : 'Test Choice Generation'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-bold">Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <h3 className="font-bold">Generated Decision:</h3>
          <div className="mt-2">
            <p><strong>ID:</strong> {result.id}</p>
            <p><strong>Prompt:</strong> {result.prompt}</p>
            <p><strong>Decision Weight:</strong> {result.decisionWeight}</p>
            <p><strong>Context Summary:</strong> {result.contextSummary}</p>
            <div className="mt-2">
              <strong>Options:</strong>
              <ul className="list-disc list-inside ml-4">
                {result.options.map((option, index) => (
                  <li key={option.id}>
                    <strong>[{option.alignment?.toUpperCase()}]</strong> {option.text}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Debug Logs:</h3>
        <div className="bg-gray-100 p-4 rounded max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet. Click the test button to start.</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="text-sm font-mono">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}