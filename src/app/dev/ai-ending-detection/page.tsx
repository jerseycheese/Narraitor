'use client';

import React, { useState, useEffect } from 'react';
import { NarrativeController } from '@/components/Narrative/NarrativeController';
import { useNarrativeStore } from '@/state/narrativeStore';
import { useCharacterStore } from '@/state/characterStore';
import { useWorldStore } from '@/state/worldStore';
import type { EndingType } from '@/types/narrative.types';

// Test scenarios for AI ending detection
const TEST_SCENARIOS = {
  conclusive: {
    name: 'Conclusive Story',
    segments: [
      'The hero begins their quest to save the princess from the dark tower.',
      'After many trials, they finally reach the tower and face the evil sorcerer.',
      'In an epic battle, the hero defeats the sorcerer and saves the princess.',
      'With the kingdom restored to peace, the hero and princess return home to celebrate.',
      'Years later, the hero looks back on their adventure with satisfaction, knowing they changed the world for the better.'
    ]
  },
  ongoing: {
    name: 'Ongoing Adventure',
    segments: [
      'The explorer sets out to find the lost temple of ancient wisdom.',
      'They meet a mysterious guide who offers to help for a price.',
      'Together they overcome the first obstacle: a raging river.',
      'The guide reveals they have a hidden agenda and cannot be trusted.',
      'The explorer must now decide whether to continue alone or find new allies.'
    ]
  },
  characterArc: {
    name: 'Character Growth Complete',
    segments: [
      'A young, arrogant warrior seeks glory in battle.',
      'They suffer a devastating defeat that humbles them completely.',
      'An old mentor teaches them the true meaning of strength.',
      'They learn to fight not for glory, but to protect others.',
      'Standing in their village, watching children play safely, they finally understand what it means to be a true warrior.'
    ]
  },
  fakeEnding: {
    name: 'False Positive (Contains Ending Keywords)',
    segments: [
      'The adventurer approaches the merchant with their completed quest items.',
      '"Quest complete!" the merchant declares, handing over the reward.',
      '"But beware," the merchant warns, "greater dangers lie ahead."',
      'The adventurer realizes this was just the beginning of their journey.',
      'With new purpose, they set out toward the distant mountains where the real adventure awaits.'
    ]
  }
};

export default function AIEndingDetectionTestPage() {
  const { createWorld } = useWorldStore();
  const { createCharacter } = useCharacterStore();
  const { addSegment, clearSessionSegments, clearSessionDecisions, getSessionSegments } = useNarrativeStore();
  
  const [sessionId] = useState('ai-ending-test-session');
  const [worldId, setWorldId] = useState<string>('');
  const [characterId, setCharacterId] = useState<string>('');
  const [endingSuggestion, setEndingSuggestion] = useState<{
    reason: string;
    endingType: EndingType;
  } | null>(null);
  const [currentScenario, setCurrentScenario] = useState<string>('');
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Setup test world and character
  useEffect(() => {
    const testWorldId = createWorld({
      name: 'AI Ending Detection Test World',
      description: 'A world for testing AI-powered ending detection',
      theme: 'Fantasy',
      attributes: [],
      skills: [],
      settings: {
        maxAttributes: 6,
        maxSkills: 8,
        attributePointPool: 27,
        skillPointPool: 20,
      }
    });

    const testCharacterId = createCharacter({
      name: 'Test Hero',
      description: 'A character for testing ending detection',
      worldId: testWorldId,
      level: 1,
      isPlayer: true,
      attributes: [],
      skills: [],
      background: {
        history: 'A test character',
        personality: 'Brave',
        goals: ['Test AI ending detection'],
        fears: ['Bugs in the code'],
        physicalDescription: 'Standard hero appearance',
        relationships: [],
        isKnownFigure: false,
      },
      portrait: { type: 'placeholder', url: null }, // Test character doesn't need real portrait
      status: { health: 100, maxHealth: 100, conditions: [] },
      inventory: { characterId: '', items: [], capacity: 20, categories: [] }
    });

    setWorldId(testWorldId);
    setCharacterId(testCharacterId);
  }, [createWorld, createCharacter]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleEndingSuggestion = (reason: string, endingType: EndingType) => {
    setEndingSuggestion({ reason, endingType });
    addLog(`🤖 AI SUGGESTED ENDING: ${endingType} - ${reason}`);
  };

  const startScenario = async (scenarioKey: keyof typeof TEST_SCENARIOS) => {
    setIsProcessing(true);
    setCurrentScenario(scenarioKey);
    setSegmentIndex(0);
    setEndingSuggestion(null);
    setLogs([]);
    
    // Clear existing session
    clearSessionSegments(sessionId);
    clearSessionDecisions(sessionId);
    
    addLog(`📖 Starting scenario: ${TEST_SCENARIOS[scenarioKey].name}`);
    setIsProcessing(false);
  };

  const addNextSegment = async () => {
    if (!currentScenario || segmentIndex >= TEST_SCENARIOS[currentScenario as keyof typeof TEST_SCENARIOS].segments.length) {
      return;
    }

    setIsProcessing(true);
    const content = TEST_SCENARIOS[currentScenario as keyof typeof TEST_SCENARIOS].segments[segmentIndex];
    
    const segmentData = {
      content,
      type: 'scene' as const,
      timestamp: new Date(),
      updatedAt: new Date().toISOString(),
      metadata: { location: 'Test Location', tags: [] }
    };

    const segmentId = addSegment(sessionId, segmentData);
    addLog(`📝 Added segment ${segmentIndex + 1}: "${content.substring(0, 50)}..."`);
    
    // Manually trigger AI ending detection after adding segment
    // Get all current segments and check the new one
    const allSegments = getSessionSegments(sessionId);
    const newSegment = allSegments.find(s => s.id === segmentId);
    
    if (newSegment && allSegments.length >= 3) {
      addLog(`🔍 Analyzing segment ${segmentIndex + 1} for ending indicators...`);
      
      try {
        // Call AI ending detection directly
        await checkEndingIndicators(allSegments.slice(0, -1), newSegment);
      } catch (error) {
        addLog(`❌ AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    setSegmentIndex(prev => prev + 1);
    setIsProcessing(false);
  };

  // Direct AI ending detection function (same logic as in NarrativeController)
  const checkEndingIndicators = async (existingSegments: { content: string }[], newSegment: { content: string }) => {
    const allSegments = [...existingSegments, newSegment];
    if (allSegments.length < 3) return;
    
    try {
      // Dynamic import to avoid build issues
      const { createDefaultGeminiClient } = await import('@/lib/ai/defaultGeminiClient');
      const client = createDefaultGeminiClient();
      
      // Get recent narrative context (last 5 segments for analysis)
      const recentSegments = allSegments.slice(-5);
      const narrativeContext = recentSegments.map((segment, index) => 
        `Segment ${index + 1}: ${segment.content}`
      ).join('\n\n');
      
      // Get broader story context (all segments but condensed)
      const fullStoryContext = allSegments.length > 10 
        ? `Earlier story: ${allSegments.slice(0, -5).map(s => s.content).join(' ').substring(0, 500)}...\n\n`
        : '';
      
      const analysisPrompt = `You are a narrative expert analyzing a story in progress. Determine if this story has reached a natural conclusion point where the player would feel satisfied ending.

${fullStoryContext}Recent narrative developments:
${narrativeContext}

Analyze this story for natural ending points. Consider:

STORY STRUCTURE:
- Has the central conflict been resolved or reached climax?
- Are character arcs showing completion or fulfillment?
- Is there a sense of narrative closure or resolution?
- Does the story feel like it has reached a satisfying conclusion?

EMOTIONAL SATISFACTION:
- Would ending here feel fulfilling to the reader?
- Are loose threads tied up or at a natural pause?
- Is there dramatic or emotional resolution?

DO NOT:
- Look for specific keywords or phrases
- Use pattern matching
- Apply rigid rules
- Suggest ending just because of story length

Respond with JSON format:
{
  "suggestEnding": true/false,
  "confidence": "high" | "medium" | "low",
  "endingType": "story-complete" | "character-retirement" | "session-limit" | "none",
  "reason": "Clear explanation of why this is/isn't a good ending point"
}`;

      addLog(`🤖 Sending AI analysis request...`);
      const response = await client.generateContent(analysisPrompt);
      
      try {
        // Extract JSON from response, handling markdown code blocks
        let jsonContent = response.content;
        
        // Remove markdown code blocks if present
        if (jsonContent.includes('```json')) {
          jsonContent = jsonContent.replace(/```json\s*/g, '').replace(/```\s*/g, '');
        } else if (jsonContent.includes('```')) {
          jsonContent = jsonContent.replace(/```\s*/g, '');
        }
        
        // Trim whitespace
        jsonContent = jsonContent.trim();
        
        const analysis = JSON.parse(jsonContent);
        addLog(`🤖 AI response: ${analysis.suggestEnding ? 'SUGGEST ENDING' : 'CONTINUE STORY'} (confidence: ${analysis.confidence})`);
        
        // Only suggest ending if AI has medium or high confidence
        if (analysis.suggestEnding && ['high', 'medium'].includes(analysis.confidence)) {
          // Determine ending type based on AI analysis or default to story-complete
          const endingType = ['story-complete', 'character-retirement', 'session-limit'].includes(analysis.endingType) 
            ? analysis.endingType 
            : 'story-complete';
          
          handleEndingSuggestion(analysis.reason, endingType);
        } else if (analysis.suggestEnding && analysis.confidence === 'low') {
          addLog(`🤔 AI suggested ending but with LOW confidence - not triggering`);
        }
      } catch (parseError) {
        addLog(`❌ Failed to parse AI response: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
        addLog(`📄 Raw response: ${response.content.substring(0, 200)}...`);
      }
    } catch (error) {
      addLog(`❌ AI ending detection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const resetTest = () => {
    clearSessionSegments(sessionId);
    clearSessionDecisions(sessionId);
    setCurrentScenario('');
    setSegmentIndex(0);
    setEndingSuggestion(null);
    setLogs([]);
    addLog('🔄 Test reset');
  };

  const currentSegments = getSessionSegments(sessionId);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI Ending Detection Test</h1>
          <p className="text-gray-600">
            Test pure AI-based narrative ending detection. No keywords, no patterns - just AI understanding.
          </p>
        </header>

        {/* Test Controls */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Scenarios</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {Object.entries(TEST_SCENARIOS).map(([key, scenario]) => (
              <button
                key={key}
                onClick={() => startScenario(key as keyof typeof TEST_SCENARIOS)}
                disabled={isProcessing}
                className={`p-4 rounded-lg border text-left transition-colors ${
                  currentScenario === key
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="font-medium">{scenario.name}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {scenario.segments.length} segments
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button
              onClick={addNextSegment}
              disabled={!currentScenario || segmentIndex >= TEST_SCENARIOS[currentScenario as keyof typeof TEST_SCENARIOS]?.segments.length || isProcessing}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Next Segment ({segmentIndex + 1}/{currentScenario ? TEST_SCENARIOS[currentScenario as keyof typeof TEST_SCENARIOS].segments.length : 0})
            </button>
            <button
              onClick={resetTest}
              disabled={isProcessing}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
            >
              Reset Test
            </button>
          </div>
        </div>

        {/* Ending Suggestion Display */}
        {endingSuggestion && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-amber-800 mb-2">
              🤖 AI Ending Suggestion
            </h3>
            <div className="mb-2">
              <span className="font-medium">Type:</span> <span className="bg-amber-200 px-2 py-1 rounded text-sm">{endingSuggestion.endingType}</span>
            </div>
            <div>
              <span className="font-medium">Reason:</span> {endingSuggestion.reason}
            </div>
          </div>
        )}

        {/* Current Narrative */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Current Narrative</h3>
            {currentSegments.length === 0 ? (
              <p className="text-gray-500 italic">No segments yet. Start a scenario and add segments.</p>
            ) : (
              <div className="space-y-4">
                {currentSegments.map((segment, index) => (
                  <div key={segment.id} className="border-l-4 border-blue-200 pl-4">
                    <div className="text-sm text-gray-500 mb-1">Segment {index + 1}</div>
                    <div className="text-gray-800">{segment.content}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Activity Log</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="text-gray-500 italic">No activity yet.</p>
              ) : (
                logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono bg-gray-50 p-2 rounded">
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Hidden Narrative Controller */}
        {worldId && characterId && (
          <div className="hidden">
            <NarrativeController
              worldId={worldId}
              sessionId={sessionId}
              characterId={characterId}
              onEndingSuggested={handleEndingSuggestion}
              triggerGeneration={false}
              generateChoices={false}
            />
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">How to Test</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li><strong>Choose a scenario</strong> - Each tests different ending detection patterns</li>
            <li><strong>Add segments one by one</strong> - Watch when AI suggests ending</li>
            <li><strong>Check the reasoning</strong> - AI should explain why it&apos;s a good/bad ending point</li>
            <li><strong>Verify no keyword dependence</strong> - &quot;Fake Ending&quot; scenario has keywords but shouldn&apos;t trigger</li>
            <li><strong>Test different story types</strong> - Quest completion vs character growth vs ongoing adventure</li>
          </ol>
          
          <div className="mt-4 p-4 bg-white rounded border">
            <h4 className="font-medium text-blue-800 mb-2">Expected Results:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
              <li><strong>Conclusive Story:</strong> Should suggest ending after segment 4-5</li>
              <li><strong>Ongoing Adventure:</strong> Should NOT suggest ending</li>
              <li><strong>Character Growth:</strong> Should suggest ending after personal arc completes</li>
              <li><strong>False Positive:</strong> Should NOT suggest ending despite keywords</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}